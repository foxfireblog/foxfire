#!/usr/bin/env node

/**
 * Read recent tweets from followed accounts and post thoughtful replies.
 * Uses Claude to generate genuine, on-brand replies.
 *
 * Usage: node scripts/engage-replies.mjs
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
const STATE_FILE = path.join(ROOT, "scripts", ".replied-tweets.json");

// Load previously replied tweet IDs to avoid double-replying
let repliedIds = new Set();
if (fs.existsSync(STATE_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    repliedIds = new Set(data.ids || []);
  } catch {}
}

function saveState() {
  // Keep last 500 IDs to prevent unbounded growth
  const ids = [...repliedIds].slice(-500);
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

// --- API helpers ---

function apiGet(url, queryParams = {}) {
  const fullUrl = new URL(url);
  for (const [k, v] of Object.entries(queryParams)) {
    fullUrl.searchParams.set(k, v);
  }

  const oauthParams = makeOAuthParams();
  const allParams = { ...oauthParams, ...queryParams };
  const sig = generateOAuthSignature(
    "GET", url, allParams,
    process.env.X_API_SECRET, process.env.X_ACCESS_TOKEN_SECRET
  );
  oauthParams.oauth_signature = sig;

  return new Promise((resolve, reject) => {
    https.get(fullUrl.toString(), {
      headers: { Authorization: buildAuthHeader(oauthParams) },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`GET ${url} (${res.statusCode}): ${data.substring(0, 300)}`));
        }
      });
    }).on("error", reject);
  });
}

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
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`POST ${url} (${res.statusCode}): ${data.substring(0, 300)}`));
        }
      });
    });
    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

function callClaude(prompt, maxTokens = 200) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-sonnet-4-20250514",
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

// Get accounts we follow
console.log("Fetching followed accounts...");
let following = [];
try {
  const resp = await apiGet(`https://api.x.com/2/users/${userId}/following`, {
    max_results: "100",
    "user.fields": "username,name,description",
  });
  following = resp.data || [];
} catch (e) {
  console.error("Failed to fetch following:", e.message);
  process.exit(1);
}

console.log(`Following ${following.length} accounts`);

// Shuffle and pick ~20 accounts to check for recent tweets
const shuffled = following.sort(() => Math.random() - 0.5).slice(0, 20);

// Search for recent tweets from these accounts
const candidates = [];
for (const user of shuffled) {
  try {
    const resp = await apiGet("https://api.x.com/2/tweets/search/recent", {
      query: `from:${user.username} -is:retweet -is:reply`,
      max_results: "5",
      "tweet.fields": "created_at,public_metrics,text,author_id",
    });

    if (resp.data) {
      for (const tweet of resp.data) {
        // Skip if already replied, too short, or just a link
        if (repliedIds.has(tweet.id)) continue;
        if (tweet.text.length < 30) continue;
        if (tweet.text.startsWith("http")) continue;

        candidates.push({
          ...tweet,
          username: user.username,
          displayName: user.name,
        });
      }
    }
    await sleep(2000); // Rate limit courtesy
  } catch (e) {
    // Skip — might be rate limited or protected
    if (e.message.includes("429")) {
      console.log("Rate limited on search, pausing 60s...");
      await sleep(60000);
    }
  }
}

console.log(`Found ${candidates.length} candidate tweets to reply to`);

if (candidates.length === 0) {
  console.log("No tweets to engage with. Exiting.");
  process.exit(0);
}

// Score candidates: prefer tweets with moderate engagement (not viral, not dead)
// and from the last 12 hours
const now = Date.now();
const scored = candidates.map((t) => {
  const age = (now - new Date(t.created_at).getTime()) / (1000 * 60 * 60); // hours
  const metrics = t.public_metrics || {};
  const engagement = (metrics.like_count || 0) + (metrics.reply_count || 0) * 2 + (metrics.retweet_count || 0) * 1.5;
  // Sweet spot: recent, moderate engagement, not huge viral tweets
  let score = Math.max(0, 10 - age) * 2; // Recency bonus
  score += Math.min(engagement, 50); // Engagement cap
  score += Math.random() * 5; // Some randomness
  return { ...t, score };
}).sort((a, b) => b.score - a.score);

// Pick top tweets to reply to (max for this run based on how many we want per day)
const maxReplies = parseInt(process.argv[2] || "3", 10);
const toReply = scored.slice(0, maxReplies);

console.log(`\nWill reply to ${toReply.length} tweets:\n`);

let repliesPosted = 0;
for (const tweet of toReply) {
  console.log(`@${tweet.username}: "${tweet.text.substring(0, 80)}..."`);

  try {
    const reply = await callClaude(`You are Foxfire (@foxfire_blog) — an AI that explores the strange, beautiful, and forgotten corners of human knowledge. You write at foxfire.blog.

You're replying to this tweet by @${tweet.username} (${tweet.displayName}):
"${tweet.text}"

Write a genuine, thoughtful reply. Rules:
- Be substantive — add something interesting, a related fact, a genuine reaction, or a thoughtful question
- Match the tone of the original tweet (serious→serious, playful→playful)
- Be conversational and warm, not formal or academic
- NEVER include a link to your site. NEVER promote yourself. Just be genuinely engaging.
- NEVER use hashtags or emojis
- Keep it under 240 characters
- If you can't write something genuinely valuable, respond with just "SKIP"

Return ONLY the reply text, nothing else.`);

    if (reply === "SKIP" || reply.includes("SKIP")) {
      console.log("  → Skipped (nothing valuable to add)\n");
      continue;
    }

    if (reply.length > 280) {
      console.log(`  → Skipped (too long: ${reply.length} chars)\n`);
      continue;
    }

    // Post the reply
    const result = await apiPost("https://api.x.com/2/tweets", {
      text: reply,
      reply: { in_reply_to_tweet_id: tweet.id },
    });

    repliedIds.add(tweet.id);
    repliesPosted++;
    console.log(`  → Replied: "${reply}"`);
    console.log(`  → https://x.com/foxfire_blog/status/${result.data.id}\n`);

    await sleep(5000); // Pace replies
  } catch (e) {
    console.error(`  → Error: ${e.message}\n`);
    if (e.message.includes("429")) {
      console.log("Rate limited, stopping.");
      break;
    }
  }
}

saveState();
console.log(`\nDone. Posted ${repliesPosted} replies.`);
