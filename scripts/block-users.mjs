#!/usr/bin/env node

/**
 * Block users on X API v2.
 * Usage: node scripts/block-users.mjs handle1 handle2 handle3
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import * as https from "node:https";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

// Load .env.local
const envPath = path.join(ROOT, ".env.local");
if (fs.existsSync(envPath)) {
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

const handles = process.argv.slice(2);
if (handles.length === 0) {
  console.error("Usage: node scripts/block-users.mjs handle1 handle2 ...");
  process.exit(1);
}

// OAuth helpers
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
  const oauthParams = makeOAuthParams();
  const allParams = { ...oauthParams, ...queryParams };
  const sig = generateOAuthSignature("GET", url, allParams, process.env.X_API_SECRET, process.env.X_ACCESS_TOKEN_SECRET);
  oauthParams.oauth_signature = sig;
  const qs = Object.entries(queryParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  const fullUrl = qs ? `${url}?${qs}` : url;
  return new Promise((resolve, reject) => {
    const req = https.get(fullUrl, { headers: { Authorization: buildAuthHeader(oauthParams) }, timeout: 30_000 }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch (e) { reject(new Error(`Parse error: ${data.substring(0, 200)}`)); }
        } else {
          reject(new Error(`GET ${url} (${res.statusCode}): ${data.substring(0, 300)}`));
        }
      });
    });
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
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
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch (e) { reject(new Error(`Parse error: ${data.substring(0, 200)}`)); }
        } else {
          reject(new Error(`POST ${url} (${res.statusCode}): ${data.substring(0, 300)}`));
        }
      });
    });
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// Get our own user ID
const sourceUserId = process.env.X_ACCESS_TOKEN.split("-")[0];

let blocked = 0;
for (const handle of handles) {
  try {
    // Look up user ID by username
    const user = await apiGet(`https://api.x.com/2/users/by/username/${handle}`);
    if (!user.data?.id) {
      console.error(`  Could not find user: ${handle}`);
      continue;
    }
    const targetId = user.data.id;
    const displayName = user.data.name || handle;

    // Block
    const result = await apiPost(`https://api.x.com/2/users/${sourceUserId}/blocking`, {
      target_user_id: targetId,
    });

    if (result.data?.blocking) {
      console.log(`Blocked: @${handle} (${displayName})`);
      blocked++;
    } else {
      console.log(`Block response for @${handle}:`, JSON.stringify(result));
    }

    await sleep(1000);
  } catch (e) {
    console.error(`Error blocking @${handle}: ${e.message}`);
  }
}

console.log(`\nDone. Blocked ${blocked}/${handles.length} accounts.`);
