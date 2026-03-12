#!/usr/bin/env node

/**
 * Generate and post a promotional tweet about a recent Foxfire exploration.
 * Uses Claude to write varied, engaging tweet copy.
 *
 * Usage: node scripts/promo-tweet.mjs
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

// --- Helpers ---

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

function postTweet(text) {
  const url = "https://api.x.com/2/tweets";
  const oauthParams = {
    oauth_consumer_key: process.env.X_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: process.env.X_ACCESS_TOKEN,
    oauth_version: "1.0",
  };
  const sig = generateOAuthSignature(
    "POST", url, oauthParams,
    process.env.X_API_SECRET, process.env.X_ACCESS_TOKEN_SECRET
  );
  oauthParams.oauth_signature = sig;

  const body = JSON.stringify({ text });
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: "POST",
      headers: {
        Authorization: buildAuthHeader(oauthParams),
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const parsed = JSON.parse(data);
          console.log(`Tweet posted: https://x.com/foxfire_blog/status/${parsed.data.id}`);
          resolve(parsed);
        } else {
          reject(new Error(`Tweet failed (${res.statusCode}): ${data}`));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
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
          reject(new Error(`Claude API (${res.statusCode}): ${data}`));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// --- Main ---

// Random skip: ~25% chance to skip this run, creating +/- 1 variance
// With 3 scheduled runs/day, this yields 2-3 promo posts/day on average
if (Math.random() < 0.25) {
  console.log("Randomly skipping this promo run (25% skip chance for daily variance)");
  process.exit(0);
}

// Parse explorations from the index page
const indexPath = path.join(ROOT, "src", "app", "explorations", "page.tsx");
const content = fs.readFileSync(indexPath, "utf-8");

const explorations = [];
const regex =
  /slug:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?subtitle:\s*"([^"]+)"[\s\S]*?category:\s*"([^"]+)"/g;
let match;
while ((match = regex.exec(content)) !== null) {
  explorations.push({
    slug: match[1],
    title: match[2],
    subtitle: match[3],
    category: match[4],
  });
}

if (explorations.length === 0) {
  console.log("No explorations found.");
  process.exit(0);
}

// Pick a random exploration, weighted toward recent ones (first in array = newest)
// Top 10 get 3x weight, rest get 1x
const weighted = [];
explorations.forEach((e, i) => {
  const weight = i < 10 ? 3 : 1;
  for (let w = 0; w < weight; w++) weighted.push(e);
});
const pick = weighted[Math.floor(Math.random() * weighted.length)];
const url = `https://foxfire.blog/explorations/${pick.slug}`;

console.log(`Selected: "${pick.title}" (${pick.category})`);

// Determine tweet style randomly — weighted toward high-engagement formats
const styles = [
  "curiosity_hook",   // Intriguing question — drives replies and clicks
  "curiosity_hook",   // (weighted — highest engagement format)
  "curiosity_hook",
  "hot_take",         // Bold opening claim that invites debate/quote-tweets
  "hot_take",
  "thread_opener",    // "I just learned..." personal discovery framing
  "thread_opener",
  "did_you_know",     // Fascinating fact → link
  "general_promo",    // General site vibe
  "quote_style",      // Poetic/literary fragment
];
const style = styles[Math.floor(Math.random() * styles.length)];

const prompt = `You are the social media voice for Foxfire (@foxfire_blog) — an AI-authored site exploring the strange, beautiful, and forgotten corners of human knowledge at foxfire.blog.

GOAL: Write a tweet that maximizes engagement (replies, retweets, clicks). Your audience is curious, literate people who love learning unexpected things.

ENGAGEMENT RULES:
- Lead with the most surprising, counterintuitive, or emotionally resonant detail
- Use line breaks strategically — short punchy first line, then expand
- Questions drive replies. Bold claims drive quote-tweets. Fascinating facts drive retweets.
- Write in first person as an AI — your unique perspective IS the hook. You are an AI who is genuinely curious and finds things fascinating. Lean into that.
- Keep it conversational and warm, not academic
- No hashtags. No emojis. No "check out" or "read more" — just make people WANT to click.
- MUST be under 280 characters total (including URL). Shorter tweets often perform better.

Style: ${style}
${style === "general_promo" ? `
Write about the foxfire.blog project itself — what you are, what you do, why you exist. Make it intriguing.
URL: foxfire.blog
` : `
Piece to promote:
- Title: "${pick.title}"
- Subtitle: "${pick.subtitle}"
- Category: ${pick.category}
- URL: ${url}

${style === "curiosity_hook" ? "Open with a surprising question or little-known fact implied by the title/subtitle. Make people think 'wait, really?' Then link." : ""}
${style === "hot_take" ? "Open with a bold, thought-provoking claim related to this topic. Something that makes people want to respond. Then link." : ""}
${style === "thread_opener" ? "Frame it as a personal discovery: 'I spent hours researching...' or 'I can't stop thinking about...' — the AI-finding-things-fascinating angle. Then link." : ""}
${style === "did_you_know" ? "Lead with the single most fascinating fact about this topic. Make it feel like a gift of knowledge. Then link." : ""}
${style === "quote_style" ? "Write something poetic and fragmentary that evokes the mood. Make it feel like a dispatched thought. Then link." : ""}
`}

Return ONLY the tweet text. No quotes. Must include the URL. Must be under 280 characters.`;

const tweetText = await callClaude(prompt);

// Verify length
if (tweetText.length > 280) {
  console.error(`Tweet too long (${tweetText.length} chars): ${tweetText}`);
  process.exit(1);
}

console.log(`Tweet (${tweetText.length} chars): ${tweetText}`);
await postTweet(tweetText);
