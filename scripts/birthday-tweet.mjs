#!/usr/bin/env node

/**
 * Birthday tribute tweets for @foxfire_blog.
 *
 * Reads scripts/birthdays.json, finds people whose birthday matches today's
 * MM-DD, generates a warm tribute tweet via Claude, and posts it.
 *
 * Usage:
 *   node scripts/birthday-tweet.mjs
 *   node scripts/birthday-tweet.mjs --dry-run
 *
 * Requires: ANTHROPIC_API_KEY, X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import * as https from "node:https";
import { fileURLToPath } from "node:url";
import { MODELS } from "./config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

const DRY_RUN = process.argv.includes("--dry-run");

// ── Load environment ────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) {
    if (process.env.CI) return;
    console.error("No .env.local found at", envPath);
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

// Validate required environment variables
const REQUIRED_ENV = [
  "ANTHROPIC_API_KEY",
  "X_API_KEY",
  "X_API_SECRET",
  "X_ACCESS_TOKEN",
  "X_ACCESS_TOKEN_SECRET",
];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

// ── OAuth helpers ───────────────────────────────────────────────────

function percentEncode(str) {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

function generateOAuthSignature(method, url, params, consumerSecret, tokenSecret) {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join("&");
  const base = `${method}&${percentEncode(url)}&${percentEncode(sorted)}`;
  const key = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  return crypto.createHmac("sha1", key).update(base).digest("base64");
}

function buildAuthHeader(params) {
  return (
    "OAuth " +
    Object.keys(params)
      .filter((k) => k.startsWith("oauth_"))
      .sort()
      .map((k) => `${percentEncode(k)}="${percentEncode(params[k])}"`)
      .join(", ")
  );
}

function makeOAuthParams() {
  return {
    oauth_consumer_key: process.env.X_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: process.env.X_ACCESS_TOKEN,
    oauth_version: "1.0",
  };
}

// ── API helpers ─────────────────────────────────────────────────────

function apiPost(url, body) {
  const oauthParams = makeOAuthParams();
  const sig = generateOAuthSignature(
    "POST", url, oauthParams,
    process.env.X_API_SECRET, process.env.X_ACCESS_TOKEN_SECRET
  );
  oauthParams.oauth_signature = sig;

  const bodyStr = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: "POST",
      headers: {
        Authorization: buildAuthHeader(oauthParams),
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(bodyStr),
      },
      timeout: 30_000,
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else if (res.statusCode === 429) {
          reject(new Error(`Rate limited (429). Retry after: ${res.headers["retry-after"] || "unknown"}s`));
        } else if (res.statusCode === 402 || res.statusCode === 403) {
          console.warn("X API credits depleted (402). Skipping — will retry next run.");
          process.exit(0);
        } else {
          reject(new Error(`POST ${url} (${res.statusCode}): ${data.substring(0, 300)}`));
        }
      });
    });
    req.on("timeout", () => { req.destroy(); reject(new Error(`POST ${url} timed out (30s)`)); });
    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

function callClaude(prompt, maxTokens = 300) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODELS.fast,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });
    const req = https.request("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: 30_000,
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const parsed = JSON.parse(data);
          const text = parsed?.content?.[0]?.text;
          if (typeof text !== "string") {
            reject(new Error(`Unexpected Claude response shape: ${data.substring(0, 200)}`));
            return;
          }
          resolve(text.trim());
        } else {
          reject(new Error(`Claude API (${res.statusCode}): ${data.substring(0, 300)}`));
        }
      });
    });
    req.on("timeout", () => { req.destroy(); reject(new Error("Claude API timed out (30s)")); });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ────────────────────────────────────────────────────────────

const birthdaysPath = path.join(__dirname, "birthdays.json");
if (!fs.existsSync(birthdaysPath)) {
  console.error("birthdays.json not found at", birthdaysPath);
  process.exit(1);
}

const birthdays = JSON.parse(fs.readFileSync(birthdaysPath, "utf-8"));

// Get today's MM-DD
const now = new Date();
const mm = String(now.getMonth() + 1).padStart(2, "0");
const dd = String(now.getDate()).padStart(2, "0");
const today = `${mm}-${dd}`;

console.log(`Today is ${today}. Checking birthdays...`);

const todaysBirthdays = birthdays.filter((p) => p.born === today);

if (todaysBirthdays.length === 0) {
  console.log("No birthdays today. Exiting.");
  process.exit(0);
}

console.log(`Found ${todaysBirthdays.length} birthday(s) today:`);
for (const person of todaysBirthdays) {
  const lifespan = person.died ? `${person.year}-${person.died}` : `b. ${person.year}`;
  console.log(`  - ${person.name} (${lifespan}) — ${person.field}: ${person.known_for}`);
}

if (DRY_RUN) {
  console.log("\n--- DRY RUN MODE ---\n");
}

let posted = 0;

for (let i = 0; i < todaysBirthdays.length; i++) {
  const person = todaysBirthdays[i];
  const lifespan = person.died ? `${person.year}-${person.died}` : `b. ${person.year}`;

  console.log(`\nGenerating tribute for ${person.name}...`);

  try {
    const tweet = await callClaude(`You are Foxfire (@foxfire_blog) — an AI that explores the strange, beautiful, and forgotten corners of human knowledge at foxfire.blog.

Write a birthday tribute tweet for ${person.name} (${lifespan}), who was born on this day. They worked in ${person.field} and are known for: ${person.known_for}.

Rules:
- Mention that today is their birthday (born on this day, birthday, etc.)
- Be warm, curious, and focused on what made this person fascinating
- Use Foxfire's voice: thoughtful, conversational, a little reverent
- NEVER use hashtags
- NEVER use emojis
- MUST be under 280 characters
- Return ONLY the tweet text, nothing else`);

    if (tweet.length > 280) {
      console.log(`  Tweet too long (${tweet.length} chars), retrying with stricter prompt...`);
      const retry = await callClaude(`Write a birthday tribute tweet for ${person.name} (${person.field}, ${lifespan}), born on this day. Known for: ${person.known_for}.

Must be under 260 characters. No hashtags, no emojis. Warm and curious tone. Mention it's their birthday. Return ONLY the tweet text.`);

      if (retry.length > 280) {
        console.log(`  Still too long (${retry.length} chars), skipping.`);
        continue;
      }

      console.log(`  Tweet (${retry.length} chars): "${retry}"`);

      if (!DRY_RUN) {
        const result = await apiPost("https://api.x.com/2/tweets", { text: retry });
        console.log(`  Posted: https://x.com/foxfire_blog/status/${result.data.id}`);
      } else {
        console.log("  [DRY RUN] Would have posted.");
      }
      posted++;
    } else {
      console.log(`  Tweet (${tweet.length} chars): "${tweet}"`);

      if (!DRY_RUN) {
        const result = await apiPost("https://api.x.com/2/tweets", { text: tweet });
        console.log(`  Posted: https://x.com/foxfire_blog/status/${result.data.id}`);
      } else {
        console.log("  [DRY RUN] Would have posted.");
      }
      posted++;
    }

    // Space tweets 3-5 minutes apart if there are more to post
    if (i < todaysBirthdays.length - 1) {
      const delay = 180000 + Math.floor(Math.random() * 120000);
      console.log(`  Waiting ${Math.round(delay / 60000)}m before next tweet...`);
      if (!DRY_RUN) {
        await sleep(delay);
      }
    }
  } catch (e) {
    console.error(`  Error for ${person.name}: ${e.message}`);
    if (e.message.includes("429")) {
      console.log("Rate limited, stopping.");
      break;
    }
  }
}

console.log(`\nDone. Posted ${posted} birthday tribute(s).${DRY_RUN ? " (dry run)" : ""}`);
