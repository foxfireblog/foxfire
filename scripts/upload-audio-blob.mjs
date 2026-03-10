#!/usr/bin/env node

/**
 * Upload all audio files from public/audio/ to Vercel Blob storage.
 * Outputs a JSON mapping of slug -> blob URL.
 *
 * Usage: node scripts/upload-audio-blob.mjs
 * Requires BLOB_READ_WRITE_TOKEN in .env.local
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { put, list } from "@vercel/blob";

// Load .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

const envPath = path.join(ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=]+)="?([^"]*)"?$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("Missing BLOB_READ_WRITE_TOKEN. Run: vercel env pull .env.local");
  process.exit(1);
}

const audioDir = path.join(ROOT, "public", "audio");
const files = fs.readdirSync(audioDir).filter((f) => f.endsWith(".mp3"));

// Build set of already-uploaded files
const existing = new Map();
let cursor;
do {
  const result = await list({ prefix: "audio/", cursor });
  for (const blob of result.blobs) existing.set(blob.pathname, blob.url);
  cursor = result.hasMore ? result.cursor : undefined;
} while (cursor);

console.log(`Found ${existing.size} existing blobs. Uploading ${files.length} audio files...\n`);

const mapping = {};

for (const file of files) {
  const slug = file.replace(".mp3", "");
  const blobPath = `audio/${file}`;

  if (existing.has(blobPath)) {
    mapping[slug] = existing.get(blobPath);
    console.log(`  SKIP ${slug} (already uploaded)`);
    continue;
  }

  const filePath = path.join(audioDir, file);
  const fileBuffer = fs.readFileSync(filePath);
  const size = (fileBuffer.length / 1024 / 1024).toFixed(1);

  process.stdout.write(`  ${slug} (${size}MB)... `);

  const blob = await put(blobPath, fileBuffer, {
    access: "public",
    contentType: "audio/mpeg",
    addRandomSuffix: false,
  });

  mapping[slug] = blob.url;
  console.log("OK");
}

// Save mapping for use by the update script
const mappingPath = path.join(ROOT, "scripts", "audio-blob-urls.json");
fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
console.log(`\nDone! URL mapping saved to scripts/audio-blob-urls.json`);
