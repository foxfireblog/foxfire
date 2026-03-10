#!/usr/bin/env node

/**
 * Batch-generate audio narrations for all existing explorations.
 * Reads each page.tsx, extracts title/subtitle/content, strips HTML,
 * and calls edge-tts to create MP3 files in public/audio/.
 *
 * Usage: source .venv/bin/activate && node scripts/generate-audio-batch.mjs
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

const VOICE = "en-US-AndrewMultilingualNeural";
const audioDir = path.join(ROOT, "public", "audio");
fs.mkdirSync(audioDir, { recursive: true });

const explorationsDir = path.join(ROOT, "src", "app", "explorations");
const slugs = fs
  .readdirSync(explorationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

console.log(`Found ${slugs.length} explorations. Generating audio...\n`);

let generated = 0;
let skipped = 0;
let failed = 0;

for (const slug of slugs) {
  const outputPath = path.join(audioDir, `${slug}.mp3`);
  if (fs.existsSync(outputPath)) {
    console.log(`  SKIP ${slug} (already exists)`);
    skipped++;
    continue;
  }

  const pagePath = path.join(explorationsDir, slug, "page.tsx");
  if (!fs.existsSync(pagePath)) {
    console.log(`  SKIP ${slug} (no page.tsx)`);
    skipped++;
    continue;
  }

  const source = fs.readFileSync(pagePath, "utf-8");

  // Extract title
  const titleMatch = source.match(/title="([^"]+)"/);
  const title = titleMatch ? titleMatch[1].replace(/&apos;/g, "'").replace(/&mdash;/g, "—") : slug;

  // Extract subtitle
  const subtitleMatch = source.match(/subtitle="([^"]+)"/);
  const subtitle = subtitleMatch
    ? subtitleMatch[1].replace(/&apos;/g, "'").replace(/&mdash;/g, "—")
    : "";

  // Extract content between > and </ExplorationLayout>
  const contentMatch = source.match(/>\s*\n([\s\S]*?)\s*<\/ExplorationLayout>/);
  if (!contentMatch) {
    console.log(`  SKIP ${slug} (could not extract content)`);
    skipped++;
    continue;
  }

  const plainContent = contentMatch[1]
    .replace(/<[^>]+>/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&middot;/g, "·")
    .replace(/&hellip;/g, "...")
    .replace(/\{[^}]*\}/g, "") // remove JSX expressions
    .replace(/className="[^"]*"/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const narrationText = `${title}, by Foxfire. ${subtitle}. ${plainContent}`;

  console.log(`  GEN  ${slug} (${(narrationText.length / 1000).toFixed(1)}K chars)...`);

  try {
    const tmpFile = path.join(os.tmpdir(), `foxfire-tts-${slug}.txt`);
    fs.writeFileSync(tmpFile, narrationText, "utf-8");
    execSync(
      `edge-tts --file "${tmpFile}" --voice "${VOICE}" --write-media "${outputPath}"`,
      { stdio: "pipe", timeout: 600_000 }
    );
    fs.unlinkSync(tmpFile);

    const stats = fs.statSync(outputPath);
    console.log(`       -> ${(stats.size / 1024).toFixed(0)}KB`);
    generated++;
  } catch (err) {
    console.error(`  FAIL ${slug}: ${err.message?.substring(0, 100)}`);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    failed++;
  }
}

console.log(`\nDone! Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed}`);
