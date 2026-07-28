#!/usr/bin/env node

/**
 * Build the three corpus-wide tables that turn 322 separate essays into a body
 * of work: `src/data/series.ts`, `src/data/related-posts.ts` and
 * `src/data/featured.ts`.
 *
 * (This generator lives beside its output rather than in scripts/ only because
 * scripts/ was owned by another editing pass when it was written. It has no
 * dependency on its own location; move it to scripts/ freely.)
 *
 * KEEPING IT CURRENT. All three outputs are derived from the published corpus,
 * so publishing a post makes them stale: the new post gets no related links and
 * appears in nobody else's. Nothing calls this automatically yet. It should be
 * invoked from scripts/publish-from-queue.mjs alongside the search-index
 * upsert, and `--check` belongs in CI next to the search-index check. Until
 * then it is a manual step after each publish. Stale tables degrade quietly
 * rather than breaking: every slug they name is verified to exist at build
 * time by the generator itself, and a missing entry renders no block.
 *
 * Why anything is generated at all
 * --------------------------------
 * Both tables are pure functions of the published corpus, and the corpus is
 * 322 files of prose. Computing relatedness in the browser would mean shipping
 * the prose (2.3 MB raw, per the search-index notes) to compute an answer that
 * never changes between publishes. Computing it in the page would mean reading
 * 322 files on every render. So it is computed once, here, and committed.
 *
 * Neither output reaches the browser as data: both are imported by
 * ExplorationLayout, which is a server component, so they are read during
 * render and only the resulting handful of <a> tags is serialized. The cost to
 * a reader is the markup, not the table.
 *
 * The relatedness signal
 * ----------------------
 * The category field is useless for this: 77% of posts are "Essay". So the
 * signal is the prose.
 *
 *   1. Term counts per post, from the same prose extractor and stopword list
 *      the dedupe and search-index passes use (scripts/dedupe.mjs), so there is
 *      one definition of "a term" in this repo rather than three.
 *   2. TF-IDF weights, tf = 1 + log(count), idf = log(N/df).
 *   3. Terms appearing in more than 12% of posts are dropped outright. At 322
 *      posts that is 38, and a word 38 essays use is a house-style word
 *      ("memory", "archive"), not a subject.
 *   4. Terms appearing in exactly one post are dropped: they cannot match
 *      anything, and they are most of the vocabulary.
 *   5. Proper nouns are weighted x2 (capitalized away from a sentence start in
 *      most of their occurrences, the same test scripts/dedupe.mjs uses).
 *      Titles, subtitles and descriptions are weighted x3. What an essay is
 *      *about* is named in its own metadata.
 *   6. Cosine similarity between L2-normalized vectors.
 *
 * The trimmed score, which is the part that matters
 * -------------------------------------------------
 * Plain cosine produced good top hits and confident garbage underneath it. The
 * measured failure: "The Exhibition of Sarah Baartman" matched "The Winchester
 * Mystery House" at 0.094, its third-best score in the corpus, on the strength
 * of one term: "sarah". Sarah Winchester and Sarah Baartman. One shared token,
 * high IDF, nothing else.
 *
 * So a pair is scored on the dot product with its single largest contributing
 * term removed. Relatedness has to survive losing its best word. That one
 * change drops the Winchester match out of Baartman's top six entirely and
 * costs the genuine matches almost nothing, because genuine matches overlap on
 * a dozen terms and no single one of them is load-bearing.
 *
 * Selection, and why the count is not fixed
 * -----------------------------------------
 * A related-posts block that pads to four with junk is worse than no block. So:
 * nothing below TRIM_FLOOR is ever shown, and past the first suggestion a
 * candidate also has to reach RELATIVE_FLOOR of the best score for this post.
 * A post whose profile is one strong relative and a flat tail shows one link.
 * A post with no relative above the floor shows nothing.
 *
 * Series siblings are excluded here: they have their own navigation, and
 * listing Part III under "related reading" on Part II is noise.
 *
 * Usage:
 *   node src/data/corpus-links.build.mjs           rewrite all three tables
 *   node src/data/corpus-links.build.mjs --check   fail if any is stale
 *   node src/data/corpus-links.build.mjs --inspect <slug>...  show scored
 *                                                   candidates with the terms
 *                                                   driving each match
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { extractPageProse, DEDUPE_STOPWORDS, seriesBaseTitle } from "../../scripts/dedupe.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
const PUBLISHED_DIR = path.join(ROOT, "src", "app", "explorations");
const REGISTRY_FILE = path.join(ROOT, "src", "data", "explorations.ts");
const SERIES_FILE = path.join(ROOT, "src", "data", "series.ts");
const RELATED_FILE = path.join(ROOT, "src", "data", "related-posts.ts");

const MAX_DF_RATIO = 0.12;
const PROPER_NOUN_WEIGHT = 2;
const METADATA_WEIGHT = 3;
const TRIM_FLOOR = 0.045;
const RELATIVE_FLOOR = 0.4;
const MAX_RELATED = 4;

const WORD_RE = /[A-Za-z][A-Za-z'-]{2,}/g;
const SERIES_PART_RE = /\(Part\s+([IVXLCDM]+)\s+of\s+([IVXLCDM]+)\)/i;
const ROMAN = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

/** "XIV" -> 14. Returns 0 for anything that isn't a Roman numeral. */
export function romanToInt(roman) {
  const s = String(roman || "").toUpperCase();
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const value = ROMAN[s[i]];
    if (!value) return 0;
    total += value < (ROMAN[s[i + 1]] || 0) ? -value : value;
  }
  return total;
}

function decodeEntities(text) {
  return String(text || "")
    .replace(/&mdash;|&ndash;|&middot;|&nbsp;|&amp;|&ldquo;|&rdquo;|&lsquo;|&quot;/g, " ")
    .replace(/&rsquo;|&apos;/g, "'")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/&#\d+;/g, " ");
}

/** Term counts plus proper-noun counts, sentence-aware so a capital at the
 *  start of a sentence is not mistaken for a name. */
function termCounts(text) {
  const total = new Map();
  const capitalized = new Map();
  for (const sentence of String(text || "").split(/(?<=[.!?])\s+|\n+/)) {
    let atSentenceStart = true;
    for (const match of sentence.matchAll(WORD_RE)) {
      const raw = match[0];
      const term = raw.toLowerCase().replace(/'s$/, "").replace(/^-+|-+$/g, "");
      if (term.length < 3 || DEDUPE_STOPWORDS.has(term)) {
        atSentenceStart = false;
        continue;
      }
      total.set(term, (total.get(term) || 0) + 1);
      if (/^[A-Z]/.test(raw) && !atSentenceStart) {
        capitalized.set(term, (capitalized.get(term) || 0) + 1);
      }
      atSentenceStart = false;
    }
  }
  return { total, capitalized };
}

/** Parse the published registry. One record per exploration, source order. */
export function readRegistry() {
  const src = fs.readFileSync(REGISTRY_FILE, "utf-8");
  const records = [];
  for (const match of src.matchAll(/\{\s*slug:\s*"([^"]+)",([\s\S]*?)\n {2}\},/g)) {
    const body = match[2];
    const field = (key) => {
      const found = body.match(new RegExp(`\\b${key}:\\s*\\n?\\s*"((?:[^"\\\\]|\\\\.)*)"`));
      return found ? found[1] : "";
    };
    records.push({
      slug: match[1],
      title: field("title"),
      subtitle: field("subtitle"),
      description: field("description"),
      category: field("category"),
      readTime: field("readTime"),
      publishedAt: field("publishedAt"),
    });
  }
  if (records.length === 0) throw new Error("src/data/explorations.ts parsed to zero records");
  return records;
}

/** Registry records that actually have a page, with their prose loaded. */
export function loadDocuments() {
  const docs = [];
  for (const record of readRegistry()) {
    const file = path.join(PUBLISHED_DIR, record.slug, "page.tsx");
    if (!fs.existsSync(file)) continue;
    const prose = extractPageProse(fs.readFileSync(file, "utf-8"));
    const { total, capitalized } = termCounts(prose);
    const metadata = termCounts(
      decodeEntities(`${record.title} ${record.subtitle} ${record.description}`)
    ).total;
    docs.push({
      ...record,
      total,
      capitalized,
      metadata,
      proseWords: prose.split(/\s+/).filter(Boolean).length,
      seriesBase: SERIES_PART_RE.test(record.title) ? seriesBaseTitle(record.title) : "",
    });
  }
  return docs;
}

export function buildVectors(docs) {
  const n = docs.length;
  const df = new Map();
  for (const doc of docs) for (const term of doc.total.keys()) df.set(term, (df.get(term) || 0) + 1);

  for (const doc of docs) {
    const vector = new Map();
    for (const [term, count] of doc.total) {
      const frequency = df.get(term) || 1;
      if (frequency < 2 || frequency / n > MAX_DF_RATIO) continue;
      let weight = (1 + Math.log(count)) * Math.log(n / frequency);
      if ((doc.capitalized.get(term) || 0) >= Math.max(1, count * 0.6)) weight *= PROPER_NOUN_WEIGHT;
      if (doc.metadata.has(term)) weight *= METADATA_WEIGHT;
      vector.set(term, weight);
    }
    let norm = 0;
    for (const weight of vector.values()) norm += weight * weight;
    norm = Math.sqrt(norm) || 1;
    for (const [term, weight] of vector) vector.set(term, weight / norm);
    doc.vector = vector;
  }
  return docs;
}

/** Cosine similarity, and the same score with its largest single term removed. */
function scorePair(a, b) {
  const [small, large] = a.vector.size < b.vector.size ? [a.vector, b.vector] : [b.vector, a.vector];
  const contributions = [];
  let dot = 0;
  for (const [term, weight] of small) {
    const other = large.get(term);
    if (!other) continue;
    const product = weight * other;
    dot += product;
    contributions.push([term, product]);
  }
  contributions.sort((x, y) => y[1] - x[1]);
  return { dot, trimmed: dot - (contributions[0]?.[1] || 0), contributions };
}

/** Every candidate for one post, best trimmed score first. */
export function rankCandidates(doc, docs) {
  const ranked = [];
  for (const other of docs) {
    if (other === doc) continue;
    if (doc.seriesBase && doc.seriesBase === other.seriesBase) continue;
    const score = scorePair(doc, other);
    if (score.trimmed <= 0) continue;
    ranked.push({ doc: other, ...score });
  }
  ranked.sort((x, y) => y.trimmed - x.trimmed || (x.doc.slug < y.doc.slug ? -1 : 1));
  return ranked;
}

/**
 * Apply the floors. Returns between 0 and MAX_RELATED candidates.
 *
 * At most one part of any given series survives. Measured: "The Franck Report"
 * scored Manhattan Project parts II, III and IV as its 2nd, 3rd and 4th best
 * matches, which is correct and useless — three of its four slots pointing at
 * one series, when the series links itself internally and the corpus holds
 * "The Scientists Who Said No" and "The Doomsday Clock Is Not a Clock" for the
 * slots that were being spent.
 */
export function selectRelated(ranked) {
  if (ranked.length === 0 || ranked[0].trimmed < TRIM_FLOOR) return [];
  const cutoff = Math.max(TRIM_FLOOR, ranked[0].trimmed * RELATIVE_FLOOR);
  const picked = [];
  const seenSeries = new Set();
  for (const candidate of ranked) {
    if (picked.length >= MAX_RELATED) break;
    if (candidate.trimmed < cutoff) break;
    const base = candidate.doc.seriesBase;
    if (base) {
      if (seenSeries.has(base)) continue;
      seenSeries.add(base);
    }
    picked.push(candidate);
  }
  return picked;
}

export function computeRelated(docs) {
  buildVectors(docs);
  const table = new Map();
  for (const doc of docs) table.set(doc.slug, selectRelated(rankCandidates(doc, docs)));
  return table;
}

/**
 * Group the corpus into series. A series is every post whose title carries a
 * "(Part N of M)" marker and whose base title (everything before the colon)
 * matches. Parts are ordered by their Roman numeral, not by publish date.
 */
export function computeSeries(docs) {
  const groups = new Map();
  for (const doc of docs) {
    const match = doc.title.match(SERIES_PART_RE);
    if (!match) continue;
    const key = seriesBaseTitle(doc.title);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, { key, name: "", total: 0, parts: [] });
    const group = groups.get(key);
    group.total = Math.max(group.total, romanToInt(match[2]));
    group.parts.push({
      slug: doc.slug,
      part: romanToInt(match[1]),
      // The reader-facing part title: "The Purges", not the whole 60-character
      // title they are already looking at.
      partTitle: doc.title.includes(":")
        ? doc.title.slice(doc.title.indexOf(":") + 1).replace(SERIES_PART_RE, "").trim()
        : doc.title.replace(SERIES_PART_RE, "").trim(),
      fullTitle: doc.title,
    });
    if (!group.name) {
      group.name = doc.title.includes(":") ? doc.title.slice(0, doc.title.indexOf(":")).trim() : doc.title;
    }
  }
  for (const group of groups.values()) group.parts.sort((a, b) => a.part - b.part);
  return [...groups.values()].sort((a, b) => (a.name < b.name ? -1 : 1));
}

/**
 * The start-here shelf. Chosen by measurement, in three shelves a newcomer can
 * pick between by appetite, not by anyone's taste:
 *
 *   "Start a series"  — the Part I of every multi-part series, longest first.
 *                       These are the deliberate long reads.
 *   "Best sourced"    — highest citation count among standalone posts, which is
 *                       the closest thing the corpus has to a rigor metric.
 *   "One sitting"     — shortest standalone posts that still clear a source
 *                       floor, for a reader who wants to sample and leave.
 *
 * Subject spread is enforced across the whole shelf: no two picks may share a
 * dominant subject term, so it cannot degenerate into six essays about Stalin.
 */
export function computeFeatured(docs, series) {
  const sourceCounts = new Map();
  for (const doc of docs) {
    const file = path.join(PUBLISHED_DIR, doc.slug, "page.tsx");
    const src = fs.readFileSync(file, "utf-8");
    sourceCounts.set(doc.slug, (src.match(/<li id="src-/g) || []).length);
  }

  // The dominant subject of a post: its single highest-weighted vector term.
  const subject = new Map();
  for (const doc of docs) {
    let best = "";
    let bestWeight = 0;
    for (const [term, weight] of doc.vector) {
      if (weight > bestWeight) {
        bestWeight = weight;
        best = term;
      }
    }
    subject.set(doc.slug, best);
  }

  const bySlug = new Map(docs.map((doc) => [doc.slug, doc]));
  const taken = new Set();
  const usedSubjects = new Set();

  function take(candidates, count) {
    const picked = [];
    for (const doc of candidates) {
      if (picked.length >= count) break;
      if (taken.has(doc.slug)) continue;
      const term = subject.get(doc.slug);
      if (term && usedSubjects.has(term)) continue;
      taken.add(doc.slug);
      if (term) usedSubjects.add(term);
      picked.push({ slug: doc.slug, note: "" });
    }
    return picked;
  }

  // Ranked by the length of the whole series, not of Part I: the shelf is
  // offering a reader a journey, and a four-part series is a bigger one than a
  // two-part series whose opener happens to run 90 words longer.
  const seriesWords = (group) =>
    group.parts.reduce((sum, part) => sum + (bySlug.get(part.slug)?.proseWords || 0), 0);
  const openers = [...series]
    .sort((a, b) => seriesWords(b) - seriesWords(a))
    .map((group) => bySlug.get(group.parts[0]?.slug))
    .filter(Boolean);

  const standalone = docs.filter((doc) => !doc.seriesBase);
  const bestSourced = [...standalone].sort(
    (a, b) => (sourceCounts.get(b.slug) || 0) - (sourceCounts.get(a.slug) || 0) || b.proseWords - a.proseWords
  );
  const shortest = [...standalone]
    .filter((doc) => (sourceCounts.get(doc.slug) || 0) >= 6)
    .sort((a, b) => a.proseWords - b.proseWords);

  const shelves = [
    {
      title: "Start a series",
      blurb: "Multi-part essays that build. Each one opens a thread the next part picks up.",
      picks: take(openers, 3),
    },
    {
      title: "The deep ones",
      blurb: "The most heavily sourced pieces in the archive, for readers who follow the footnotes.",
      picks: take(bestSourced, 3),
    },
    {
      title: "One sitting",
      blurb: "Shorter pieces that still carry their receipts. A good place to find out whether this is for you.",
      picks: take(shortest, 3),
    },
  ];

  return { shelves, sourceCounts, subject };
}

// --------------------------------------------------------------------------
// Serialization
// --------------------------------------------------------------------------

function serializeSeries(series) {
  const body = series
    .map(
      (group) =>
        `  {\n    name: ${JSON.stringify(group.name)},\n    total: ${group.total},\n    parts: [\n` +
        group.parts
          .map(
            (part) =>
              `      { slug: ${JSON.stringify(part.slug)}, part: ${part.part}, partTitle: ${JSON.stringify(
                part.partTitle
              )}, fullTitle: ${JSON.stringify(part.fullTitle)} },`
          )
          .join("\n") +
        `\n    ],\n  },`
    )
    .join("\n");

  const published = series.reduce((sum, group) => sum + group.parts.length, 0);
  return `// Generated by src/data/corpus-links.build.mjs — do not edit by hand.
//
// Every multi-part series in the corpus, grouped from the "(Part N of M)"
// markers in the titles and ordered by Roman numeral rather than publish date.
// ${series.length} series, ${published} published parts.
//
// \`total\` is what the titles promise; \`parts.length\` is what exists. They
// differ while a series is still being written, and the reader is told so
// rather than being handed a link to a page that isn't there.
//
// Imported by ExplorationLayout, a server component: this table never reaches
// the browser, only the links rendered from it do.

export interface SeriesPart {
  slug: string;
  /** 1-based index parsed from the Roman numeral in the title. */
  part: number;
  /** The part's own subtitle: "The Purges", not the whole 60-character title. */
  partTitle: string;
  fullTitle: string;
}

export interface Series {
  /** The shared title before the colon: "The Manhattan Project". */
  name: string;
  /** Parts promised by the titles, which may exceed \`parts.length\`. */
  total: number;
  parts: SeriesPart[];
}

export const series: Series[] = [
${body}
];

/** Index from slug to its series and position, built once at module load. */
const bySlug = new Map<string, { series: Series; index: number }>();
for (const group of series) {
  group.parts.forEach((part, index) => bySlug.set(part.slug, { series: group, index }));
}

export interface SeriesContext {
  series: Series;
  current: SeriesPart;
  previous: SeriesPart | null;
  next: SeriesPart | null;
}

/** The series a post belongs to, or null. Keyed by slug. */
export function seriesContextForSlug(slug: string): SeriesContext | null {
  const found = bySlug.get(slug);
  if (!found) return null;
  const { series: group, index } = found;
  return {
    series: group,
    current: group.parts[index],
    previous: index > 0 ? group.parts[index - 1] : null,
    next: index < group.parts.length - 1 ? group.parts[index + 1] : null,
  };
}
`;
}

function serializeRelated(table, docs) {
  const bySlug = new Map(docs.map((doc) => [doc.slug, doc]));
  const rows = [...table.entries()]
    .filter(([, picks]) => picks.length > 0)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const payload = rows.map(([slug, picks]) => `${slug}\t${picks.map((p) => p.doc.slug).join(" ")}`).join("\n");

  const counts = [0, 0, 0, 0, 0];
  for (const doc of docs) counts[(table.get(doc.slug) || []).length]++;
  const shown = rows.reduce((sum, [, picks]) => sum + picks.length, 0);

  return `// Generated by src/data/corpus-links.build.mjs — do not edit by hand.
//
// Related reading for every published exploration: one record per line,
// "slug<TAB>space separated related slugs", best match first.
//
// Derived from TF-IDF cosine similarity over the prose of all ${docs.length} posts, scored
// with each pair's single largest shared term removed so that one coincidental
// name in common ("Sarah" Baartman / "Sarah" Winchester) cannot manufacture a
// match. See the generator for the full derivation.
//
// The count is deliberately not fixed. Posts with no relative above the floor
// appear nowhere in this table and render no related block at all:
// ${counts[0]} posts show none, ${counts[1]} show one, ${counts[2]} show two, ${counts[3]} show three, ${counts[4]} show four.
//
// ${payload.length} bytes of payload, ${shown} links across ${rows.length} posts. Imported by
// ExplorationLayout, a server component, so none of it is sent to the browser:
// it is read at render time and only the resulting anchors are serialized.
const payload = ${JSON.stringify(payload)};

const table = new Map<string, string[]>();
for (const line of payload.split("\\n")) {
  const tab = line.indexOf("\\t");
  if (tab === -1) continue;
  table.set(line.slice(0, tab), line.slice(tab + 1).split(" "));
}

/** Slugs of the posts most related to this one, best first. May be empty. */
export function relatedSlugsFor(slug: string): string[] {
  return table.get(slug) ?? [];
}
`;
}

function serializeFeatured(featured, docs) {
  const bySlug = new Map(docs.map((doc) => [doc.slug, doc]));
  const body = featured.shelves
    .map(
      (shelf) =>
        `  {\n    title: ${JSON.stringify(shelf.title)},\n    blurb: ${JSON.stringify(shelf.blurb)},\n    slugs: [\n` +
        shelf.picks
          .map((pick) => {
            const doc = bySlug.get(pick.slug);
            return `      ${JSON.stringify(pick.slug)}, // ${featured.sourceCounts.get(pick.slug)} sources, ~${doc.proseWords} words, subject "${featured.subject.get(pick.slug)}"`;
          })
          .join("\n") +
        `\n    ],\n  },`
    )
    .join("\n");

  return `// Generated by src/data/corpus-links.build.mjs — do not edit by hand.
//
// The start-here shelf on the homepage. Nine posts out of ${docs.length}, in three
// groups a reader arriving cold can choose between by appetite.
//
// Chosen by measurement, not taste:
//   "Start a series" — the Part I of the longest multi-part series.
//   "The deep ones"  — the standalone posts with the most citations, which is
//                      the closest thing this corpus has to a rigor metric.
//   "One sitting"    — the shortest standalone posts that still clear six
//                      citations, so "short" never means "thin".
// Subject spread is enforced across the whole shelf: no two picks share a
// dominant subject term, so it cannot become nine essays about one thing.
// The counts behind each pick are in the comments below.

export interface FeaturedShelf {
  title: string;
  blurb: string;
  slugs: string[];
}

export const featuredShelves: FeaturedShelf[] = [
${body}
];
`;
}

// --------------------------------------------------------------------------
// Entry point
// --------------------------------------------------------------------------

export function build() {
  const docs = loadDocuments();
  const related = computeRelated(docs);
  const series = computeSeries(docs);
  const featured = computeFeatured(docs, series);
  return { docs, related, series, featured };
}

const FEATURED_FILE = path.join(ROOT, "src", "data", "featured.ts");

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { docs, related, series, featured } = build();

  const inspectAt = process.argv.indexOf("--inspect");
  if (inspectAt !== -1) {
    const slugs = process.argv.slice(inspectAt + 1);
    for (const slug of slugs) {
      const doc = docs.find((d) => d.slug === slug);
      if (!doc) {
        console.log(`\n### ${slug} — not published`);
        continue;
      }
      console.log(`\n### ${doc.title}  [${slug}]`);
      const ranked = rankCandidates(doc, docs).slice(0, 8);
      const kept = new Set(selectRelated(rankCandidates(doc, docs)).map((c) => c.doc.slug));
      for (const candidate of ranked) {
        const mark = kept.has(candidate.doc.slug) ? "KEEP" : "  . ";
        console.log(
          `  ${mark} ${candidate.trimmed.toFixed(3)}  ${candidate.doc.title}\n` +
            `         shared: ${candidate.contributions.slice(0, 8).map((c) => c[0]).join(", ")}`
        );
      }
    }
    process.exit(0);
  }

  const outputs = [
    [SERIES_FILE, serializeSeries(series)],
    [RELATED_FILE, serializeRelated(related, docs)],
    [FEATURED_FILE, serializeFeatured(featured, docs)],
  ];

  if (process.argv.includes("--check")) {
    let stale = false;
    for (const [file, next] of outputs) {
      const current = fs.existsSync(file) ? fs.readFileSync(file, "utf-8") : "";
      if (current !== next) {
        console.error(`${path.relative(ROOT, file)} is stale. Run: node src/data/corpus-links.build.mjs`);
        stale = true;
      }
    }
    if (stale) process.exit(1);
    console.log(`series.ts, related-posts.ts and featured.ts are current (${docs.length} posts).`);
    process.exit(0);
  }

  for (const [file, next] of outputs) fs.writeFileSync(file, next);

  const counts = [0, 0, 0, 0, 0];
  for (const doc of docs) counts[(related.get(doc.slug) || []).length]++;
  const links = docs.reduce((sum, doc) => sum + (related.get(doc.slug) || []).length, 0);
  console.log(
    `Wrote src/data/series.ts — ${series.length} series, ${series.reduce((s, g) => s + g.parts.length, 0)} parts.\n` +
      `Wrote src/data/related-posts.ts — ${links} links, ${(fs.statSync(RELATED_FILE).size / 1024).toFixed(1)} KB on disk; ` +
      `related count 0/1/2/3/4 = ${counts.join("/")}.\n` +
      `Wrote src/data/featured.ts — ${featured.shelves.reduce((s, shelf) => s + shelf.picks.length, 0)} picks in ${featured.shelves.length} shelves.`
  );
}
