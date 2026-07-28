#!/usr/bin/env node

/**
 * Build the body-text search index shipped to the explorations page.
 *
 * Why an index exists at all
 * --------------------------
 * The explorations page filters a statically imported registry, so at runtime
 * it has titles, subtitles, descriptions and categories and nothing else. The
 * essays themselves are 322 separate server-rendered pages the client never
 * sees. Searching "Vermeer" or "Wolfskinder" therefore returned nothing, not
 * because the corpus lacks them but because the words the reader remembers are
 * in the prose and the prose is not there.
 *
 * Why it is not the whole prose
 * -----------------------------
 * Measured on the real corpus: the average essay has 886 distinct
 * non-stopword terms. Shipping all of them is 2.3 MB raw, 809 KB gzipped, and
 * that is not a search box, that is a download. So the index is a selection,
 * and the selection is the interesting decision.
 *
 * Not by frequency. That was the obvious answer and the measurements killed it:
 * "photography" occurs exactly once in the Vivian Maier essay (rank 811 of
 * 886), "wolves" once in the Wolf Children essay (rank 744). A top-120-by-
 * frequency index misses both — the two queries this was built to fix. Terms
 * an essay says once are exactly the terms a reader half-remembers.
 *
 * What is kept, per post:
 *   1. Every proper noun. A term counts as one when most of its occurrences are
 *      capitalized away from a sentence start, the same test the dedupe gate
 *      uses. Names, places, ships, institutions — mentioned once or fifty
 *      times, they all go in. These are what people actually type, and 98.8% of
 *      them are unreachable from the post's metadata.
 *   2. The top 60 terms by frequency. What the essay dwells on. 91.7% of these
 *      are also unreachable from metadata.
 *
 * That is a mean of 136 terms per post: 323 KB raw, 127 KB gzipped, 104 KB
 * brotli. It is loaded lazily — see explorations-content.tsx — so it costs the
 * initial page nothing and is fetched once, on the first sign of a search.
 *
 * The single-mention common noun ("photography") is deliberately still out of
 * the index. It is handled for free on the other side, by stemming the query
 * against metadata: "photography" and "photographs" reduce to the same stem, so
 * the subtitle "the woman who made 150,000 photographs" answers it without a
 * byte of index.
 *
 * Terms are stored raw, not stemmed, on purpose. Stemming at build time would
 * put one copy of the stemmer here and another in the client, and the day they
 * disagree search quietly gets worse with nothing failing. The client owns the
 * only stemmer and applies it to both sides at load.
 *
 * Usage:
 *   node scripts/search-index.mjs              rebuild from every published post
 *   node scripts/search-index.mjs --check      verify the committed file is current
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { extractPageProse, DEDUPE_STOPWORDS } from "./dedupe.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUBLISHED_DIR = path.join(ROOT, "src", "app", "explorations");
export const INDEX_FILE = path.join(ROOT, "src", "data", "search-index.ts");

const TOP_FREQUENCY_TERMS = 60;
const WORD_RE = /[A-Za-z][A-Za-z'-]{2,}/g;

/**
 * The searchable terms of one exploration page: every proper noun, plus the
 * most frequent terms. Returns a sorted, deduplicated, space-joined string.
 */
export function indexTermsFor(src) {
  const total = new Map();
  const capitalized = new Map();

  // Sentence split so a capital at a sentence start is not read as a name.
  for (const sentence of extractPageProse(src).split(/(?<=[.!?])\s+|\n+/)) {
    let atSentenceStart = true;
    for (const match of sentence.matchAll(WORD_RE)) {
      const raw = match[0];
      const term = raw.toLowerCase().replace(/'s$/, "");
      if (term.length < 3) { atSentenceStart = false; continue; }
      total.set(term, (total.get(term) || 0) + 1);
      if (/^[A-Z]/.test(raw) && !atSentenceStart) capitalized.set(term, (capitalized.get(term) || 0) + 1);
      atSentenceStart = false;
    }
  }

  const keep = new Set();
  for (const [term, caps] of capitalized) {
    if (DEDUPE_STOPWORDS.has(term)) continue;
    if (caps >= Math.max(1, (total.get(term) || 0) * 0.6)) keep.add(term);
  }
  const byFrequency = [...total]
    .filter(([term]) => !DEDUPE_STOPWORDS.has(term))
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, TOP_FREQUENCY_TERMS);
  for (const [term] of byFrequency) keep.add(term);

  return [...keep].sort().join(" ");
}

/** Every published slug that has a page, in stable alphabetical order. */
export function publishedSlugs() {
  if (!fs.existsSync(PUBLISHED_DIR)) return [];
  return fs.readdirSync(PUBLISHED_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== "category")
    .map((e) => e.name)
    .filter((slug) => fs.existsSync(path.join(PUBLISHED_DIR, slug, "page.tsx")))
    .sort();
}

/**
 * Serialize records to the module the client imports.
 *
 * One JS string, not an object literal or JSON: a single literal is the
 * cheapest thing an engine can parse, and the record separators cost two
 * characters each. The client splits it once, after the chunk lands.
 */
function serialize(records) {
  const payload = records.map(([slug, terms]) => `${slug}\t${terms}`).join("\n");
  return `// Generated by scripts/search-index.mjs — do not edit by hand.
//
// Body-text search terms for every published exploration: one record per line,
// "slug<TAB>space separated terms". Terms are raw and lowercased; the client
// stems them once at load (see explorations-content.tsx) so that exactly one
// stemmer exists. Regenerate with \`node scripts/search-index.mjs\`;
// scripts/publish-from-queue.mjs keeps it current as the backlog drains.
//
// ${records.length} posts, ${(payload.length / 1024).toFixed(0)} KB raw. Imported dynamically, so it is
// a separate chunk and costs the explorations page nothing until someone searches.
export const searchIndex = ${JSON.stringify(payload)};
`;
}

/** Parse the committed file back into records, so one entry can be updated. */
export function readIndexRecords() {
  if (!fs.existsSync(INDEX_FILE)) return [];
  const src = fs.readFileSync(INDEX_FILE, "utf-8");
  const match = src.match(/export const searchIndex = ("(?:[^"\\]|\\.)*");/);
  if (!match) throw new Error("src/data/search-index.ts is not in the expected shape — regenerate it");
  const payload = JSON.parse(match[1]);
  if (!payload) return [];
  return payload.split("\n").map((line) => {
    const tab = line.indexOf("\t");
    return tab === -1 ? [line, ""] : [line.slice(0, tab), line.slice(tab + 1)];
  });
}

export function writeIndexRecords(records) {
  const sorted = [...records].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  fs.writeFileSync(INDEX_FILE, serialize(sorted));
  return sorted;
}

/**
 * Add or replace one post's terms without re-reading all 322 pages.
 * Called by the publisher, which has the page source in hand already.
 */
export function upsertIndexEntry(slug, src) {
  // If the index is missing, rebuild it rather than upserting into nothing —
  // otherwise one publish would replace the whole corpus with a single post and
  // search would answer for exactly one essay until someone noticed.
  const existing = fs.existsSync(INDEX_FILE) ? readIndexRecords() : buildIndex();
  const records = existing.filter(([s]) => s !== slug);
  records.push([slug, indexTermsFor(src)]);
  return writeIndexRecords(records);
}

export function buildIndex() {
  return publishedSlugs().map((slug) => [
    slug,
    indexTermsFor(fs.readFileSync(path.join(PUBLISHED_DIR, slug, "page.tsx"), "utf-8")),
  ]);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const records = buildIndex();
  const next = serialize([...records].sort((a, b) => (a[0] < b[0] ? -1 : 1)));

  if (process.argv.includes("--check")) {
    const current = fs.existsSync(INDEX_FILE) ? fs.readFileSync(INDEX_FILE, "utf-8") : "";
    if (current === next) {
      console.log(`src/data/search-index.ts is current (${records.length} posts).`);
      process.exit(0);
    }
    console.error("src/data/search-index.ts is stale. Run: node scripts/search-index.mjs");
    process.exit(1);
  }

  writeIndexRecords(records);
  const terms = records.reduce((sum, [, t]) => sum + (t ? t.split(" ").length : 0), 0);
  const bytes = fs.statSync(INDEX_FILE).size;
  console.log(
    `Wrote src/data/search-index.ts — ${records.length} posts, ${terms} terms ` +
    `(mean ${(terms / Math.max(1, records.length)).toFixed(0)}), ${(bytes / 1024).toFixed(0)} KB on disk.`
  );
}
