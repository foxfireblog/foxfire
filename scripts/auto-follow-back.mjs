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
import { MODELS } from "./config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");
const STATE_FILE = path.join(ROOT, "scripts", ".follow-back-state.json");

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
    const req = https.get(fullUrl.toString(), { headers: { Authorization: buildAuthHeader(oauthParams) }, timeout: 30_000 }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(data));
        else if (res.statusCode === 429) reject(new Error(`Rate limited (429). Retry after: ${res.headers["retry-after"] || "unknown"}s`));
        else reject(new Error(`GET ${url} (${res.statusCode}): ${data.substring(0, 300)}`));
      });
    });
    req.on("timeout", () => { req.destroy(); reject(new Error(`GET ${url} timed out (30s)`)); });
    req.on("error", reject);
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
      timeout: 30_000,
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(data));
        else if (res.statusCode === 429) reject(new Error(`Rate limited (429). Retry after: ${res.headers["retry-after"] || "unknown"}s`));
        else reject(new Error(`POST ${url} (${res.statusCode}): ${data.substring(0, 300)}`));
      });
    });
    req.on("timeout", () => { req.destroy(); reject(new Error(`POST ${url} timed out (30s)`)); });
    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODELS.classifier,
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

// --- Main ---

const userId = process.env.X_ACCESS_TOKEN.split("-")[0];

// Get followers (paginated — up to 5 pages)
console.log("Fetching followers...");
let followers = [];
try {
  let paginationToken = undefined;
  const MAX_PAGES = 5;
  for (let page = 0; page < MAX_PAGES; page++) {
    const params = {
      max_results: "100",
      "user.fields": "username,name,description,profile_image_url,public_metrics",
    };
    if (paginationToken) {
      params.pagination_token = paginationToken;
    }
    const resp = await apiGet(`https://api.x.com/2/users/${userId}/followers`, params);
    if (resp.data) {
      followers.push(...resp.data);
    }
    paginationToken = resp.meta?.next_token;
    if (!paginationToken) {
      console.log(`  Fetched all followers in ${page + 1} page(s)`);
      break;
    }
    console.log(`  Page ${page + 1}: ${followers.length} followers so far...`);
    await sleep(1000);
  }
  if (paginationToken) {
    console.log(`  Stopped after ${MAX_PAGES} pages (more followers may exist)`);
  }
} catch (e) {
  console.error("Failed to fetch followers:", e.message);
  if (followers.length === 0) process.exit(1);
  console.log(`  Continuing with ${followers.length} followers fetched before error`);
}

// Get who we follow
console.log("Fetching following...");
let followingIds = new Set();
try {
  let paginationToken = undefined;
  const MAX_PAGES = 5;
  for (let page = 0; page < MAX_PAGES; page++) {
    const params = { max_results: "1000" };
    if (paginationToken) {
      params.pagination_token = paginationToken;
    }
    const resp = await apiGet(`https://api.x.com/2/users/${userId}/following`, params);
    if (resp.data) {
      for (const u of resp.data) followingIds.add(u.id);
    }
    paginationToken = resp.meta?.next_token;
    if (!paginationToken) {
      console.log(`  Fetched all following in ${page + 1} page(s)`);
      break;
    }
    console.log(`  Page ${page + 1}: ${followingIds.size} following so far...`);
    await sleep(1000);
  }
  if (paginationToken) {
    console.log(`  Stopped after ${MAX_PAGES} pages (more following may exist)`);
  }
} catch (e) {
  console.error("Failed to fetch following:", e.message);
  if (followingIds.size === 0) process.exit(1);
  console.log(`  Continuing with ${followingIds.size} following fetched before error`);
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
  const metrics = user.public_metrics || {};
  const hasProfilePic = user.profile_image_url && !user.profile_image_url.includes("default_profile");
  console.log(`\nChecking @${user.username}: ${bio.substring(0, 80)}`);

  // Use Claude Haiku (fast + cheap) to screen accounts
  try {
    const verdict = await callClaude(`You are a content safety filter. Based on this X/Twitter user's profile, determine if they should be BLOCKED from being followed back.

Username: @${user.username}
Display name: ${user.name}
Bio: ${bio}
Has profile picture: ${hasProfilePic ? "yes" : "no (default avatar)"}
Followers: ${metrics.followers_count ?? "unknown"}
Following: ${metrics.following_count ?? "unknown"}
Tweet count: ${metrics.tweet_count ?? "unknown"}

BLOCK if the account appears to be ANY of the following:
1. White supremacist, neo-Nazi, white nationalist, racial supremacist of any kind, or primarily dedicated to spreading hate against any racial, ethnic, or religious group
2. NSFW/adult content account (pornographic, OnlyFans promo, explicit sexual content)
3. Obvious spam or scam account (fake giveaways, "DM me for profit", phishing-style language, generic copy-paste bios)
4. Crypto account of any kind (crypto, blockchain, NFTs, meme coins, token launches, trading signals, Web3, DeFi — block ALL crypto-focused accounts, not just pump/shill)
5. Likely bot: no bio AND the display name looks auto-generated or generic
6. Account whose bio is primarily in a language other than English (Foxfire is English-only and cannot meaningfully engage)

DO NOT block accounts that are: political but not hateful, controversial but not extremist, or accounts with a sparse but normal-looking bio.

Respond with ONLY one word: "FOLLOW" or "BLOCK"`);

    const word = verdict.toUpperCase().trim();
    if (word !== "FOLLOW" && word !== "BLOCK") {
      console.log(`  → Skipped (unexpected verdict: "${verdict.substring(0, 40)}")`);
      processedIds.add(user.id);
      rejected++;
      continue;
    }
    if (word === "BLOCK") {
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
      saveState();
      break;
    }
  }
}

saveState();
console.log(`\nDone. Followed back: ${followed}, Rejected: ${rejected}`);
