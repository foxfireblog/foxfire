#!/usr/bin/env node

/**
 * Add audioSrc prop to all existing exploration pages that have
 * a corresponding MP3 in public/audio/.
 *
 * Usage: node scripts/add-audio-props.mjs
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

const audioDir = path.join(ROOT, "public", "audio");
const explorationsDir = path.join(ROOT, "src", "app", "explorations");

const slugs = fs
  .readdirSync(explorationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

let updated = 0;
let skipped = 0;

for (const slug of slugs) {
  const audioPath = path.join(audioDir, `${slug}.mp3`);
  if (!fs.existsSync(audioPath)) {
    console.log(`  SKIP ${slug} (no audio file)`);
    skipped++;
    continue;
  }

  const pagePath = path.join(explorationsDir, slug, "page.tsx");
  let content = fs.readFileSync(pagePath, "utf-8");

  if (content.includes("audioSrc=")) {
    console.log(`  SKIP ${slug} (already has audioSrc)`);
    skipped++;
    continue;
  }

  // Insert audioSrc prop before the closing > of ExplorationLayout
  // Find the pattern: some prop followed by \n    >  (the closing of the opening tag)
  content = content.replace(
    /(readTime="[^"]*"(?:\n\s+wordCount=\{[^}]+\})?(?:\n\s+prevSlug="[^"]*"\n\s+prevTitle="[^"]*")?(?:\n\s+nextSlug="[^"]*"(?:\n\s+next[A-Z][^=]*="[^"]*")*)?)\n(\s+)>/,
    `$1\n$2audioSrc="/audio/${slug}.mp3"\n$2>`
  );

  fs.writeFileSync(pagePath, content);
  console.log(`  ADD  ${slug}`);
  updated++;
}

console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
