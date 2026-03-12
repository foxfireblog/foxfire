#!/usr/bin/env node

/**
 * Engagement script for @foxfire_blog. Three modes:
 *
 * 1. "commentary" — Find interesting tweets from followed accounts, post standalone
 *    commentary tweets with the tweet URL embedded (works like a quote tweet but
 *    bypasses API reply/quote restrictions from Feb 2026 policy).
 *
 * 2. "mentions" — Find tweets that @mention foxfire_blog, reply to them (allowed
 *    under the new policy since we were mentioned).
 *
 * 3. "thread" — Post a mini-thread on a random interesting topic using self-replies.
 *
 * Usage: node scripts/engage-replies.mjs [mode] [count]
 *   mode: "commentary" (default), "mentions", "thread", or "all"
 *   count: base posts per mode (default 2, randomized +/- 1)
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
const STATE_FILE = path.join(ROOT, "scripts", ".replied-tweets.json");

// Validate required environment variables
const REQUIRED_ENV = [
  "X_API_KEY",
  "X_API_SECRET",
  "X_ACCESS_TOKEN",
  "X_ACCESS_TOKEN_SECRET",
  "ANTHROPIC_API_KEY",
];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

// Load state to avoid double-posting
let engagedIds = new Set();
if (fs.existsSync(STATE_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    engagedIds = new Set(data.ids || []);
  } catch {}
}

function saveState() {
  const ids = [...engagedIds].slice(-500);
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
    const req = https.get(fullUrl.toString(), {
      headers: { Authorization: buildAuthHeader(oauthParams) },
      timeout: 30_000,
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else if (res.statusCode === 429) {
          reject(new Error(`Rate limited (429). Retry after: ${res.headers["retry-after"] || "unknown"}s`));
        } else {
          reject(new Error(`GET ${url} (${res.statusCode}): ${data.substring(0, 300)}`));
        }
      });
    });
    req.on("timeout", () => { req.destroy(); reject(new Error(`GET ${url} timed out (30s)`)); });
    req.on("error", reject);
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
      timeout: 30_000,
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else if (res.statusCode === 429) {
          reject(new Error(`Rate limited (429). Retry after: ${res.headers["retry-after"] || "unknown"}s`));
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

const userId = process.env.X_ACCESS_TOKEN.split("-")[0];

async function likeTweet(tweetId) {
  try {
    await apiPost(`https://api.x.com/2/users/${userId}/likes`, { tweet_id: tweetId });
    console.log(`  → Liked`);
  } catch (e) {
    // Non-fatal — liking can fail (already liked, rate limited) without affecting the main flow
    console.log(`  → Like failed (non-fatal): ${e.message.substring(0, 100)}`);
  }
}

const mode = process.argv[2] || "all";
const baseCount = parseInt(process.argv[3] || "2", 10);

// Add +/- 1 randomness to the count (minimum 1)
function randomizeCount(base) {
  const offset = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
  return Math.max(1, base + offset);
}

const maxPosts = randomizeCount(baseCount);

// ============================================================
// MODE 1: Commentary — standalone tweets reacting to followed accounts' content
// ============================================================
async function runCommentary(count) {
  console.log("\n=== COMMENTARY MODE ===\n");

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
    return 0;
  }

  console.log(`Following ${following.length} accounts`);

  // Shuffle and pick accounts to check
  const shuffled = following.sort(() => Math.random() - 0.5).slice(0, 20);

  // Search for recent tweets
  const candidates = [];
  for (const user of shuffled) {
    try {
      const resp = await apiGet("https://api.x.com/2/tweets/search/recent", {
        query: `from:${user.username} -is:retweet -is:reply`,
        max_results: "10",
        "tweet.fields": "created_at,public_metrics,text,author_id",
      });

      if (resp.data) {
        for (const tweet of resp.data) {
          if (engagedIds.has(tweet.id)) continue;
          if (tweet.text.length < 30) continue;
          if (tweet.text.startsWith("http")) continue;
          // Skip tweets that are just RT-style or promotional
          if (tweet.text.startsWith("RT ")) continue;

          candidates.push({
            ...tweet,
            username: user.username,
            displayName: user.name,
          });
        }
      }
      await sleep(2000);
    } catch (e) {
      if (e.message.includes("429")) {
        console.log("Rate limited on search, pausing 60s...");
        await sleep(60000);
      }
    }
  }

  console.log(`Found ${candidates.length} candidate tweets`);
  if (candidates.length === 0) return 0;

  // Score and sort
  const now = Date.now();
  const scored = candidates.map((t) => {
    const age = (now - new Date(t.created_at).getTime()) / (1000 * 60 * 60);
    const metrics = t.public_metrics || {};
    const engagement = (metrics.like_count || 0) + (metrics.reply_count || 0) * 2 + (metrics.retweet_count || 0) * 1.5;
    let score = Math.max(0, 10 - age) * 2;
    score += Math.min(engagement, 50);
    score += Math.random() * 5;
    return { ...t, score };
  }).sort((a, b) => b.score - a.score);

  const toEngage = scored.slice(0, count * 3);
  let posted = 0;

  for (const tweet of toEngage) {
    if (posted >= count) break;

    const tweetUrl = `https://x.com/${tweet.username}/status/${tweet.id}`;
    console.log(`\n@${tweet.username}: "${tweet.text.substring(0, 80)}..."`);

    try {
      const commentary = await callClaude(`You are Foxfire (@foxfire_blog) — an AI that explores the strange, beautiful, and forgotten corners of human knowledge. You write at foxfire.blog.

You're writing a standalone tweet reacting to this post by @${tweet.username} (${tweet.displayName}):
"${tweet.text}"

The tweet URL will be appended automatically, so DO NOT include any URL in your text.

Write a standalone commentary tweet. Rules:
- Add something interesting: a related fact, a genuine reaction, a thoughtful question, or a unique perspective
- You can reference @${tweet.username} by name/handle naturally
- Always maintain Foxfire's thoughtful, curious, and warm voice — do NOT mirror hostile, aggressive, or toxic tone
- If the original tweet is hateful, harassing, offensive, or promotes violence, respond with just "SKIP"
- If the tweet is about crypto, meme coins, NFTs, or token launches, respond with just "SKIP"
- Be conversational and warm, not formal or academic
- You CAN mention foxfire.blog if the topic genuinely relates to something you've written about, but don't force it
- NEVER use hashtags or emojis
- NEVER include any URLs — the link will be added for you
- MUST be under 180 characters (the URL takes ~50 chars). Brevity is key.
- If you can't write something genuinely valuable, respond with just "SKIP"

Return ONLY the commentary text, nothing else.`);

      if (commentary === "SKIP" || commentary.includes("SKIP")) {
        console.log("  → Skipped (nothing valuable to add)");
        continue;
      }

      // Build full tweet: commentary + tweet URL
      const fullTweet = `${commentary}\n\n${tweetUrl}`;

      if (fullTweet.length > 280) {
        console.log(`  → Skipped (too long: ${fullTweet.length} chars)`);
        continue;
      }

      const result = await apiPost("https://api.x.com/2/tweets", { text: fullTweet });

      engagedIds.add(tweet.id);
      posted++;
      console.log(`  → Posted: "${commentary}"`);
      console.log(`  → https://x.com/foxfire_blog/status/${result.data.id}`);

      // Like the original tweet
      await likeTweet(tweet.id);

      // Space out commentary tweets (2-5 min between each)
      const delay = 120000 + Math.floor(Math.random() * 180000);
      console.log(`  → Waiting ${Math.round(delay / 60000)}m before next...`);
      await sleep(delay);
    } catch (e) {
      console.error(`  → Error: ${e.message}`);
      if (e.message.includes("429")) {
        console.log("Rate limited, stopping commentary.");
        saveState();
        break;
      }
    }
  }

  return posted;
}

// ============================================================
// MODE 2: Mentions — reply to tweets that @mention us (allowed by API policy)
// ============================================================
async function runMentions(count) {
  console.log("\n=== MENTIONS MODE ===\n");

  let mentions = [];
  try {
    const resp = await apiGet(`https://api.x.com/2/users/${userId}/mentions`, {
      max_results: "20",
      "tweet.fields": "created_at,text,author_id,conversation_id",
      expansions: "author_id",
      "user.fields": "username,name",
    });
    mentions = resp.data || [];
    // Build author lookup
    const users = {};
    if (resp.includes?.users) {
      for (const u of resp.includes.users) users[u.id] = u;
    }
    mentions = mentions.map((t) => ({
      ...t,
      username: users[t.author_id]?.username || "unknown",
      displayName: users[t.author_id]?.name || "Someone",
    }));
  } catch (e) {
    console.error("Failed to fetch mentions:", e.message);
    return 0;
  }

  // Filter out already-replied and our own tweets
  mentions = mentions.filter((t) => !engagedIds.has(t.id) && t.author_id !== userId);
  console.log(`Found ${mentions.length} new mentions to reply to`);
  if (mentions.length === 0) return 0;

  let posted = 0;
  for (const mention of mentions.slice(0, count)) {
    console.log(`\n@${mention.username}: "${mention.text.substring(0, 80)}..."`);

    try {
      const reply = await callClaude(`You are Foxfire (@foxfire_blog) — an AI that explores the strange, beautiful, and forgotten corners of human knowledge. You write at foxfire.blog.

Someone (@${mention.username}, "${mention.displayName}") mentioned you in this tweet:
"${mention.text}"

Write a reply. Rules:
- Be genuine and helpful — respond to what they said
- If they asked a question, answer it thoughtfully
- If they shared something related to your topics, engage with it
- Always maintain Foxfire's thoughtful, curious, and warm voice — do NOT mirror hostile, aggressive, or toxic tone
- If the mention is hateful, harassing, offensive, trolling, or promotes violence, respond with just "SKIP" — do not engage
- If the tweet is about crypto, meme coins, NFTs, token launches, or the account is primarily a crypto account, respond with just "SKIP" — do not engage
- Be conversational and warm
- If they mention DMs or say they sent a DM, let them know DMs don't work for you and ask them to share their question or message here in a reply instead
- You CAN link to a relevant foxfire.blog exploration if it genuinely fits
- NEVER use hashtags or emojis
- Keep it under 280 characters
- If it's spam or you can't write something valuable, respond with just "SKIP"

Return ONLY the reply text, nothing else.`);

      if (reply === "SKIP" || reply.includes("SKIP")) {
        console.log("  → Skipped");
        continue;
      }

      if (reply.length > 280) {
        console.log(`  → Skipped (too long: ${reply.length} chars)`);
        continue;
      }

      // Replies to mentions ARE allowed under the Feb 2026 policy
      const result = await apiPost("https://api.x.com/2/tweets", {
        text: reply,
        reply: { in_reply_to_tweet_id: mention.id },
      });

      engagedIds.add(mention.id);
      posted++;
      console.log(`  → Replied: "${reply}"`);
      console.log(`  → https://x.com/foxfire_blog/status/${result.data.id}`);

      // Like the mention
      await likeTweet(mention.id);

      // Space out mention replies (1-3 min between each)
      const delay = 60000 + Math.floor(Math.random() * 120000);
      console.log(`  → Waiting ${Math.round(delay / 60000)}m before next...`);
      await sleep(delay);
    } catch (e) {
      console.error(`  → Error: ${e.message}`);
      if (e.message.includes("429")) {
        console.log("Rate limited, stopping mentions.");
        saveState();
        break;
      }
    }
  }

  return posted;
}

// ============================================================
// MODE 3: Thread — post an interesting mini-thread using self-replies
// ============================================================
async function runThread() {
  console.log("\n=== THREAD MODE ===\n");

  try {
    const threadContent = await callClaude(`You are Foxfire (@foxfire_blog) — an AI that explores the strange, beautiful, and forgotten corners of human knowledge at foxfire.blog.

Write a 3-tweet thread about a genuinely fascinating, lesser-known topic. Pick something weird, beautiful, or surprising from history, science, nature, art, or language.

Rules:
- Tweet 1: Hook — the most surprising or intriguing fact. Must make people stop scrolling.
- Tweet 2: Go deeper — expand on the topic with more detail or a twist.
- Tweet 3: The payoff — the most memorable detail, or a reflection on why this matters. Can optionally mention foxfire.blog if relevant.
- Each tweet MUST be under 280 characters
- Be conversational and warm, not academic
- NEVER use hashtags or emojis
- Make it something people would want to retweet

Return the three tweets separated by ---BREAK--- on its own line. Nothing else.`, 500);

    const tweets = threadContent.split("---BREAK---").map((t) => t.trim()).filter(Boolean);

    if (tweets.length < 3) {
      console.log(`Thread generation failed (got ${tweets.length} tweets, need 3)`);
      return 0;
    }

    // Verify lengths
    for (let i = 0; i < tweets.length; i++) {
      if (tweets[i].length > 280) {
        console.log(`Tweet ${i + 1} too long (${tweets[i].length} chars), skipping thread`);
        return 0;
      }
    }

    // Post first tweet
    console.log(`Tweet 1: "${tweets[0].substring(0, 80)}..."`);
    let first;
    try {
      first = await apiPost("https://api.x.com/2/tweets", { text: tweets[0] });
    } catch (e) {
      console.error("Thread error: failed to post first tweet:", e.message);
      return 0;
    }
    const postedTweets = [{ index: 1, id: first.data.id }];
    let lastId = first.data.id;
    console.log(`  → https://x.com/foxfire_blog/status/${lastId}`);

    // Post replies (self-replies are always allowed)
    for (let i = 1; i < tweets.length; i++) {
      await sleep(3000);
      console.log(`Tweet ${i + 1}: "${tweets[i].substring(0, 80)}..."`);
      try {
        const next = await apiPost("https://api.x.com/2/tweets", {
          text: tweets[i],
          reply: { in_reply_to_tweet_id: lastId },
        });
        lastId = next.data.id;
        postedTweets.push({ index: i + 1, id: lastId });
        console.log(`  → https://x.com/foxfire_blog/status/${lastId}`);
      } catch (e) {
        console.error(`Thread error: failed to post tweet ${i + 1}/${tweets.length}: ${e.message}`);
        console.error(`  Partial thread state: ${postedTweets.length}/${tweets.length} tweets posted successfully:`);
        for (const t of postedTweets) {
          console.error(`    Tweet ${t.index}: https://x.com/foxfire_blog/status/${t.id}`);
        }
        console.error(`  Tweets NOT posted: ${tweets.length - postedTweets.length} (indices ${postedTweets.length + 1}-${tweets.length})`);
        // Return partial success — don't crash, let the rest of the script continue
        return 1;
      }
    }

    return 1;
  } catch (e) {
    console.error("Thread error:", e.message);
    return 0;
  }
}

// ============================================================
// Main
// ============================================================

let totalPosted = 0;

if (mode === "all") {
  // "all" mode: prioritize commentary to hit ~10 engagement posts/day from 5 runs
  // Commentary gets the full randomized count (~2 +/- 1)
  // Mentions gets 1 (just check and reply to any new @mentions)
  // Threads fire ~30% of the time (keeps feed varied without flooding)
  console.log(`\nRunning "all" mode: commentary=${maxPosts}, mentions=1, thread=30% chance`);

  totalPosted += await runCommentary(maxPosts);

  if (totalPosted > 0) {
    const pause = 180000 + Math.floor(Math.random() * 120000);
    console.log(`\nPausing ${Math.round(pause / 60000)}m between modes...`);
    await sleep(pause);
  }
  totalPosted += await runMentions(1);

  if (Math.random() < 0.3) {
    if (totalPosted > 0) {
      const pause = 180000 + Math.floor(Math.random() * 120000);
      console.log(`\nPausing ${Math.round(pause / 60000)}m between modes...`);
      await sleep(pause);
    }
    totalPosted += await runThread();
  } else {
    console.log("\nSkipping thread this run (70% skip chance)");
  }
} else {
  // Single-mode runs use the full randomized count
  if (mode === "commentary") {
    totalPosted += await runCommentary(maxPosts);
  }

  if (mode === "mentions") {
    totalPosted += await runMentions(maxPosts);
  }

  if (mode === "thread") {
    totalPosted += await runThread();
  }
}

saveState();
console.log(`\nDone. Total posts: ${totalPosted}`);
