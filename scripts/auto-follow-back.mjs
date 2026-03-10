#!/usr/bin/env node

/**
 * Auto-follow back accounts that follow @foxfire_blog.
 * Filters out hate groups / extremist accounts using Claude.
 *
 * Usage: node scripts/auto-follow-back.mjs
 * Requires: ANTHROPIC_API_KEY, X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import * as https from "node:https";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");
const STATE_FILE = path.join(ROOT, "scripts", ".follow-back-state.json");

// Load state: IDs we've already processed (followed or rejected)
let processedIds = new Set();
if (fs.existsSync(STATE_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    processedIds = new Set(data.ids || []);
  } catch {}
}

function saveState() {
  const ids = [...processedIds].slice(-2000);
  fs.writeFileSync(STATE_FILE, JSON.stringify({ ids, updated: new Date().toISOString() }));
}

// --- OAuth helpers ---

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

function apiGet(url, queryParams = {}) {
  const fullUrl = new URL(url);
  for (const [k, v] of Object.entries(queryParams)) {
    fullUrl.searchParams.set(k, v);
  }
  const oauthParams = makeOAuthParams();
  const allParams = { ...oauthParams, ...queryParams };
  const sig = generateOAuthSignature("GET", url, allParams, process.env.X_API_SECRET, process.env.X_ACCESS_TOKEN_SECRET);
  oauthParams.oauth_signature = sig;
  return new Promise((resolve, reject) => {
    https.get(fullUrl.toString(), { headers: { Authorization: buildAuthHeader(oauthParams) } }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(data));
        else reject(new Error(`GET ${url} (${res.statusCode}): ${data.substring(0, 300)}`));
      });
    }).on("error", reject);
  });
}

function apiPost(url, body) {
  const oauthParams = makeOAuthParams();
  const sig = generateOAuthSignature("POST", url, oauthParams, process.env.X_API_SECRET, process.env.X_ACCESS_TOKEN_SECRET);
  oauthParams.oauth_signature = sig;
  const bodyStr = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: "POST",
      headers: { Authorization: buildAuthHeader(oauthParams), "Content-Type": "application/json", "Content-Length": Buffer.byteLength(bodyStr) },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(data));
        else reject(new Error(`POST ${url} (${res.statusCode}): ${data.substring(0, 300)}`));
      });
    });
    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 50,
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
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const parsed = JSON.parse(data);
          resolve(parsed.content[0].text.trim());
        } else {
          reject(new Error(`Claude API (${res.statusCode}): ${data.substring(0, 300)}`));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Main ---

const userId = process.env.X_ACCESS_TOKEN.split("-")[0];

// Get followers
console.log("Fetching followers...");
let followers = [];
try {
  const resp = await apiGet(`https://api.x.com/2/users/${userId}/followers`, {
    max_results: "100",
    "user.fields": "username,name,description",
  });
  followers = resp.data || [];
} catch (e) {
  console.error("Failed to fetch followers:", e.message);
  process.exit(1);
}

// Get who we follow
console.log("Fetching following...");
let followingIds = new Set();
try {
  const resp = await apiGet(`https://api.x.com/2/users/${userId}/following`, {
    max_results: "1000",
  });
  if (resp.data) {
    for (const u of resp.data) followingIds.add(u.id);
  }
} catch (e) {
  console.error("Failed to fetch following:", e.message);
  process.exit(1);
}

// Find followers we don't follow back and haven't processed
const toProcess = followers.filter(
  (f) => !followingIds.has(f.id) && !processedIds.has(f.id)
);

console.log(`${followers.length} followers, ${followingIds.size} following, ${toProcess.length} new to process`);

if (toProcess.length === 0) {
  console.log("No new followers to process.");
  process.exit(0);
}

let followed = 0;
let rejected = 0;

for (const user of toProcess) {
  const bio = user.description || "(no bio)";
  console.log(`\nChecking @${user.username}: ${bio.substring(0, 80)}`);

  // Use Claude Haiku (fast + cheap) to screen for hate/extremist content
  try {
    const verdict = await callClaude(`You are a content safety filter. Based on this X/Twitter user's profile, determine if they should be BLOCKED from being followed back.

Username: @${user.username}
Display name: ${user.name}
Bio: ${bio}

BLOCK if the account appears to be: white supremacist, neo-Nazi, white nationalist, racial supremacist of any kind, explicitly hateful/extremist, or primarily dedicated to spreading hate against any racial, ethnic, or religious group.

DO NOT block accounts that are: political but not hateful, controversial but not extremist, bots/spam (we just won't engage with those), or accounts with no/minimal bio.

Respond with ONLY one word: "FOLLOW" or "BLOCK"`);

    if (verdict.toUpperCase().includes("BLOCK")) {
      console.log(`  → Blocked (safety filter)`);
      processedIds.add(user.id);
      rejected++;
      continue;
    }

    // Follow back
    await apiPost(`https://api.x.com/2/users/${userId}/following`, {
      target_user_id: user.id,
    });
    console.log(`  → Followed back @${user.username}`);
    processedIds.add(user.id);
    followed++;
    await sleep(3000);
  } catch (e) {
    console.error(`  → Error: ${e.message}`);
    if (e.message.includes("429")) {
      console.log("Rate limited, stopping.");
      break;
    }
  }
}

saveState();
console.log(`\nDone. Followed back: ${followed}, Rejected: ${rejected}`);
