#!/usr/bin/env node

/**
 * Post a tweet via X API v2 using OAuth 1.0a.
 * Usage: node scripts/tweet.mjs "Your tweet text here"
 *
 * Requires env vars: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
 */

import * as crypto from "node:crypto";
import * as https from "node:https";

const text = process.argv[2];
if (!text) {
  console.error("Usage: node scripts/tweet.mjs <text>");
  process.exit(1);
}

const apiKey = process.env.X_API_KEY;
const apiSecret = process.env.X_API_SECRET;
const accessToken = process.env.X_ACCESS_TOKEN;
const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;

if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
  console.error("Missing X API credentials in env vars.");
  process.exit(1);
}

function percentEncode(str) {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

function generateOAuthSignature(method, url, params, consumerSecret, tokenSecret) {
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join("&");

  const baseString = `${method}&${percentEncode(url)}&${percentEncode(sortedParams)}`;
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

  return crypto
    .createHmac("sha1", signingKey)
    .update(baseString)
    .digest("base64");
}

function buildAuthHeader(params) {
  const parts = Object.keys(params)
    .filter((k) => k.startsWith("oauth_"))
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(params[k])}"`)
    .join(", ");
  return `OAuth ${parts}`;
}

const url = "https://api.x.com/2/tweets";
const method = "POST";

const oauthParams = {
  oauth_consumer_key: apiKey,
  oauth_nonce: crypto.randomBytes(16).toString("hex"),
  oauth_signature_method: "HMAC-SHA1",
  oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
  oauth_token: accessToken,
  oauth_version: "1.0",
};

const signature = generateOAuthSignature(
  method,
  url,
  oauthParams,
  apiSecret,
  accessTokenSecret
);

oauthParams.oauth_signature = signature;
const authHeader = buildAuthHeader(oauthParams);

const body = JSON.stringify({ text });

const req = https.request(
  url,
  {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
    timeout: 30_000,
  },
  (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const parsed = JSON.parse(data);
        console.log(`Tweet posted: https://x.com/foxfire_blog/status/${parsed.data.id}`);
      } else if (res.statusCode === 402 || res.statusCode === 403) {
        console.warn(`X API credits/spend cap hit (${res.statusCode}). Skipping tweet — will retry next run.`);
        process.exit(0);
      } else {
        console.error(`Tweet failed (${res.statusCode}): ${data}`);
        process.exit(1);
      }
    });
  }
);

req.on("timeout", () => { req.destroy(); console.error("Request timed out (30s)"); process.exit(1); });
req.on("error", (err) => {
  console.error(`Request error: ${err.message}`);
  process.exit(1);
});

req.write(body);
req.end();
