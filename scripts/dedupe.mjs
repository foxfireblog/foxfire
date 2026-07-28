/**
 * Subject-level dedupe gate — shared by the generator and the publisher.
 *
 * This is the gate that was added to scripts/auto-explore.mjs so a proposed
 * topic could be rejected before it cost a research call, a writing call, an
 * image call and a TTS call. It lives in its own module because it is needed in
 * two places now: generation is paused, so for the next seven months the only
 * thing putting posts on the site is scripts/publish-from-queue.mjs draining
 * the audited backlog, and that path had no dedupe at all. Five same-subject
 * collisions were cut out of the queue by hand on 2026-07-27.
 *
 * scripts/config.mjs is the precedent for shared script code.
 *
 * Everything below the header is the gate exactly as auto-explore.mjs defines
 * it — identical constants, identical scoring, lifted line for line — plus one
 * addition at the bottom (`pageAsProposal`) that lets an already-written page
 * be scored on the same proposal path. Nothing was retuned.
 *
 * auto-explore.mjs still carries its own copy of these definitions. It should
 * import them from here instead, which is an import line plus a deletion; that
 * edit is left out of this pass only because another agent held that file.
 * Until then `node scripts/dedupe.mjs --drift-check` fails loudly if the two
 * copies of the thresholds ever disagree, and it keeps passing afterwards.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// ── Topic dedupe gate ───────────────────────────────────────────────
// Distinct slugs are not distinct subjects. Before this gate existed, nine
// pairs of published posts independently covered the same subject (5.5% of the
// archive). The clearest case: "the-water-beneath-ontario" and
// "the-water-that-remembers", both about Barbara Sherwood Lollar's
// two-billion-year-old water at the Kidd Creek Mine, both opening on a mass
// spectrometer everyone assumed was broken, published eight hours apart. The
// slug check in createPage() sees two different slugs and waves both through.
//
// So before we spend a research call, a writing call, an image call and a TTS
// call, we fingerprint the proposed topic and compare it against every
// published exploration by subject.
//
// Fingerprint: the top ~120 distinctive terms of a document. Stopwords dropped,
// proper nouns weighted 3x (a term counts as a proper noun when most of its
// occurrences are capitalized away from a sentence start — "Lollar", "Kidd",
// "Timmins" survive; "water" and "rock" compete on raw frequency).
//
// Comparison: Jaccard |A∩B|/|A∪B| when both sides are comparable in size, and
// the overlap/containment coefficient |A∩B|/min(|A|,|B|) for the asymmetric
// case that actually matters here — a proposed topic is a paragraph of metadata
// and a published post is three thousand words, so Jaccard is structurally
// capped and containment is the honest measure.
//
// All thresholds below were measured against the real 333-post corpus. Run
// `node scripts/auto-explore.mjs --dedupe-selftest` to reproduce the numbers.
export const DEDUPE_MAX_TERMS = 120;          // fingerprint size
// Measured on the 333-post corpus (see the self-test for the full sweep):
//   full-text Jaccard   median 0.030, p99 0.076, known duplicate pair 0.257
//   proposal overlap    median 0.041, p999 0.178, known duplicate pair 0.421
//   metadata Jaccard    median 0.000, p999 0.133, known duplicate pair 0.571
// Replaying all 333 posts as proposals, these thresholds flag 19 (5.7%), and
// every one of the 19 is a genuine same-subject pair. Dropping the overlap
// threshold to 0.24 starts pulling in merely adjacent subjects, so 0.26 is the
// floor. A false reject costs one re-roll; a false accept costs a duplicate post.
export const DEDUPE_FULL_JACCARD = 0.22;      // full text vs full text
export const DEDUPE_CONTAINMENT = 0.26;       // proposal vs published full text
export const DEDUPE_META_JACCARD = 0.25;      // title + subtitle + description only
export const DEDUPE_MIN_TERMS_FOR_CONTAINMENT = 30; // containment on a tiny fingerprint is noise
export const DEDUPE_MAX_ATTEMPTS = 5;         // topic re-rolls before we give up for this run

export const DEDUPE_STOPWORDS = new Set(
  `a about above across after again against all almost alone along already also although always am among an and another any anyone anything are around as at away back be became because become been before began behind being below beneath beside best better between beyond both but by came can cannot come comes coming could did do does doing done down during each early either else end enough even ever every everyone everything few find first for found from front full further gave get gets getting give given go goes going gone good got great had half has have having he held her here hers herself high him himself his hold how however i if in indeed inside instead into is it its itself just keep kept knew know known large last later least leave left less let like likely little long look looked looking made make makes making man many may maybe me mean means might more most much must my myself near need needs never new next no none nor not nothing now number of off often on once one only onto open or order other others our ours out outside over own part perhaps place put quite rather real really right said same saw say says second see seem seemed seems seen sense set several shall she should show side simply since small so some someone something sometimes soon still such take taken takes tell than that the their theirs them themselves then there therefore these they thing things think this those though thought three through thus time to today together too took toward turn turned two under until up upon us use used uses using usually very want was way we well went were what when where whether which while who whole whom whose why will with within without work world would year years yes yet you your yours day days made kind sort thats theres number begin began end ends`
    .split(/\s+/)
    .filter(Boolean)
);

const DEDUPE_ENTITIES = {
  "&mdash;": " ", "&ndash;": " ", "&ldquo;": " ", "&rdquo;": " ", "&lsquo;": " ",
  "&rsquo;": "'", "&apos;": "'", "&amp;": " ", "&middot;": " ", "&nbsp;": " ", "&quot;": " ",
};

const DEDUPE_WORD_RE = /[A-Za-z][A-Za-z'-]{2,}/g;
const SERIES_PART_RE = /\(?\bPart\s+([IVXLCDM]+)\s+of\s+([IVXLCDM]+)\b\)?/i;

/** Pull the human-readable prose out of a generated exploration page.tsx. */
export function extractPageProse(src) {
  let s = src;
  const fnIdx = s.indexOf("export default function");
  if (fnIdx !== -1) {
    const retIdx = s.indexOf("return (", fnIdx);
    s = s.slice(retIdx !== -1 ? retIdx + "return (".length : fnIdx);
  }
  // JSX expressions first ({wordCount={2695}}, {" "}), then tags with their
  // attributes. Doing it in this order matters: after tag removal the only
  // remaining braces are the component's own body braces, and stripping those
  // eats the entire article.
  s = s.replace(/\{[^{}]*\}/g, " ");
  s = s.replace(/<[^>]*>/g, " ");
  for (const [entity, replacement] of Object.entries(DEDUPE_ENTITIES)) s = s.split(entity).join(replacement);
  return s.replace(/&[a-z]+;/gi, " ").replace(/&#\d+;/g, " ");
}

/** Top-N distinctive terms of a document, as a Set of lowercased terms. */
export function fingerprint(text, limit = DEDUPE_MAX_TERMS) {
  const total = new Map();
  const capitalized = new Map();
  // Sentence split so a capital letter at a sentence start isn't read as a proper noun.
  for (const sentence of String(text || "").split(/(?<=[.!?])\s+|\n+/)) {
    let atSentenceStart = true;
    let match;
    DEDUPE_WORD_RE.lastIndex = 0;
    while ((match = DEDUPE_WORD_RE.exec(sentence))) {
      const raw = match[0];
      const term = raw.toLowerCase().replace(/'s$/, "");
      if (term.length < 3) { atSentenceStart = false; continue; }
      total.set(term, (total.get(term) || 0) + 1);
      if (/^[A-Z]/.test(raw) && !atSentenceStart) capitalized.set(term, (capitalized.get(term) || 0) + 1);
      atSentenceStart = false;
    }
  }
  const scored = [];
  for (const [term, count] of total) {
    if (DEDUPE_STOPWORDS.has(term)) continue;
    const caps = capitalized.get(term) || 0;
    const isProperNoun = caps >= Math.max(1, count * 0.6);
    scored.push([term, count * (isProperNoun ? 3 : 1)]);
  }
  scored.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  return new Set(scored.slice(0, limit).map((entry) => entry[0]));
}

export function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const term of a) if (b.has(term)) intersection++;
  return intersection / (a.size + b.size - intersection);
}

export function containment(a, b) {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const term of a) if (b.has(term)) intersection++;
  return intersection / Math.min(a.size, b.size);
}

/** "The Manhattan Project: The Decision (Part III of IV)" -> "the manhattan project" */
export function seriesBaseTitle(title) {
  const withoutPart = String(title || "").replace(SERIES_PART_RE, " ");
  const base = withoutPart.includes(":") ? withoutPart.slice(0, withoutPart.indexOf(":")) : withoutPart;
  return base.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Two parts of the same intentional series are not duplicates of each other. */
export function isSameSeries(titleA, titleB) {
  if (!SERIES_PART_RE.test(String(titleA || "")) || !SERIES_PART_RE.test(String(titleB || ""))) return false;
  const a = seriesBaseTitle(titleA);
  const b = seriesBaseTitle(titleB);
  return Boolean(a) && a === b;
}

/** Fingerprint one exploration page source (published or staged). */
export function fingerprintPageSource(slug, src, origin) {
  const titleMatch = src.match(/title:\s*"([^"]*?)\s*—\s*Foxfire"/) || src.match(/title="([^"]*)"/);
  const subtitleMatch = src.match(/subtitle="([^"]*)"/);
  const descriptionMatch = src.match(/description:\s*"([^"]*)"/);
  const title = titleMatch ? titleMatch[1] : slug;
  const subtitle = subtitleMatch ? subtitleMatch[1] : "";
  const description = descriptionMatch ? descriptionMatch[1] : "";
  const metaText = `${title}. ${subtitle}. ${description}.`;
  return {
    slug,
    origin,
    title,
    subtitle,
    description,
    metaFp: fingerprint(metaText),
    fullFp: fingerprint(`${metaText} ${extractPageProse(src)}`),
  };
}

/**
 * Read every exploration that already exists as writing and fingerprint it.
 * That is the published archive plus the queued/ backlog: a staged post has not
 * appeared on the site yet, but it is written and it is going to publish, so
 * generating its subject again would produce the same duplicate a day later.
 * Cached per process.
 */
let _corpusCache = null;
export function loadCorpusFingerprints({ force = false } = {}) {
  if (_corpusCache && !force) return _corpusCache;
  const corpus = [];

  const publishedDir = path.join(ROOT, "src", "app", "explorations");
  if (fs.existsSync(publishedDir)) {
    for (const entry of fs.readdirSync(publishedDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === "category") continue;
      const pagePath = path.join(publishedDir, entry.name, "page.tsx");
      if (!fs.existsSync(pagePath)) continue;
      corpus.push(fingerprintPageSource(entry.name, fs.readFileSync(pagePath, "utf-8"), "published"));
    }
  }

  const queuedDir = path.join(ROOT, "queued");
  if (fs.existsSync(queuedDir)) {
    const known = new Set(corpus.map((c) => c.slug));
    for (const file of fs.readdirSync(queuedDir)) {
      if (!file.endsWith(".tsx")) continue;
      const slug = file.replace(/\.tsx$/, "");
      if (known.has(slug)) continue;
      corpus.push(fingerprintPageSource(slug, fs.readFileSync(path.join(queuedDir, file), "utf-8"), "queued"));
    }
  }

  return (_corpusCache = corpus);
}

/** The text a proposed topic gives us to work with, before anything is written. */
export function topicSubjectText(topic) {
  const research = typeof topic.researchNeeds === "string" && topic.researchNeeds.toLowerCase() !== "none"
    ? topic.researchNeeds
    : "";
  const essay = typeof topic.essayPrompt === "string" ? topic.essayPrompt : "";
  // imagePrompt is deliberately excluded: "painterly, atmospheric, muted light"
  // is boilerplate that collides across unrelated posts.
  return `${topic.title || ""}. ${topic.subtitle || ""}. ${topic.description || ""}. ${research} ${essay}`;
}

/**
 * Compare a proposed topic against the published corpus by subject.
 * Returns the worst collision found, or null when the topic is clear.
 */
export function findTopicCollision(topic, corpus = loadCorpusFingerprints()) {
  const metaFp = fingerprint(`${topic.title || ""}. ${topic.subtitle || ""}. ${topic.description || ""}.`);
  const subjectFp = fingerprint(topicSubjectText(topic));
  const useContainment = subjectFp.size >= DEDUPE_MIN_TERMS_FOR_CONTAINMENT;

  let worst = null;
  for (const post of corpus) {
    if (post.slug === topic.slug) continue;              // slug check already owns this case
    if (isSameSeries(topic.title, post.title)) continue; // intentional series siblings
    const scores = {
      slug: post.slug,
      title: post.title,
      origin: post.origin,
      fullJaccard: jaccard(subjectFp, post.fullFp),
      containment: useContainment ? containment(subjectFp, post.fullFp) : 0,
      metaJaccard: jaccard(metaFp, post.metaFp),
    };
    const reasons = [];
    if (scores.fullJaccard >= DEDUPE_FULL_JACCARD) reasons.push(`term Jaccard ${scores.fullJaccard.toFixed(3)} >= ${DEDUPE_FULL_JACCARD}`);
    if (scores.containment >= DEDUPE_CONTAINMENT) reasons.push(`term overlap ${scores.containment.toFixed(3)} >= ${DEDUPE_CONTAINMENT}`);
    if (scores.metaJaccard >= DEDUPE_META_JACCARD) reasons.push(`title/subtitle Jaccard ${scores.metaJaccard.toFixed(3)} >= ${DEDUPE_META_JACCARD}`);
    if (reasons.length === 0) continue;
    const severity = Math.max(scores.containment, scores.metaJaccard, scores.fullJaccard);
    if (!worst || severity > worst.severity) worst = { ...scores, reasons, severity, subjectTerms: subjectFp.size };
  }
  return worst;
}

// ── Added for the publisher ─────────────────────────────────────────

/**
 * Turn an already-written page into the shape findTopicCollision() scores.
 *
 * The generator scores a topic it is about to write; the publisher scores a
 * post that is already written. Rather than invent a second scoring path with
 * its own thresholds, the written page is replayed as the proposal it would
 * have been: its metadata, plus its opening standing in for the researchNeeds
 * paragraph a real proposal carries.
 *
 * This is not a new idea. It is the existing self-test's `asTopic` +
 * `researchProxy` pair, which is what 0.22 / 0.26 / 0.25 were calibrated on:
 * the corpus sweep the self-test reports (19 of 333 replayed proposals flagged,
 * every one a genuine same-subject pair) *is* this function run over the whole
 * archive. Feeding the full three thousand words in instead would compare two
 * same-size fingerprints, and containment between equal-size sets runs
 * structurally hotter than the distribution the thresholds were measured
 * against, so 0.26 would no longer mean what it was tuned to mean.
 */
export function pageAsProposal(slug, src, words = 160) {
  const meta = fingerprintPageSource(slug, src, "candidate");
  return {
    slug,
    title: meta.title,
    subtitle: meta.subtitle,
    description: meta.description,
    researchNeeds: extractPageProse(src).split(/\s+/).filter(Boolean).slice(0, words).join(" "),
  };
}

// ── Drift check ─────────────────────────────────────────────────────
// `node scripts/dedupe.mjs --drift-check`
// Until auto-explore.mjs imports from this file, two copies of the thresholds
// exist and can silently diverge — and a publisher that drops posts on a
// threshold nobody is watching is worse than no publisher gate at all. This
// reads the constants back out of auto-explore.mjs and compares them. Once that
// file drops its local copies, no literals are found and the check reports the
// migration instead of failing.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv.includes("--drift-check")) {
    console.error("Usage: node scripts/dedupe.mjs --drift-check");
    process.exit(1);
  }
  const other = fs.readFileSync(path.join(__dirname, "auto-explore.mjs"), "utf-8");
  const here = {
    DEDUPE_MAX_TERMS, DEDUPE_FULL_JACCARD, DEDUPE_CONTAINMENT,
    DEDUPE_META_JACCARD, DEDUPE_MIN_TERMS_FOR_CONTAINMENT, DEDUPE_MAX_ATTEMPTS,
  };
  const drift = [];
  let compared = 0;
  for (const [name, value] of Object.entries(here)) {
    const m = other.match(new RegExp(`^(?:export )?const ${name} = ([0-9.]+);`, "m"));
    if (!m) continue;
    compared++;
    if (Number(m[1]) !== value) drift.push(`${name}: auto-explore.mjs ${m[1]} vs dedupe.mjs ${value}`);
  }
  const stopwords = other.match(/const DEDUPE_STOPWORDS = new Set\(\s*`([^`]*)`/);
  if (stopwords) {
    compared++;
    // Compared as sets, not as lists: the literal repeats a few words
    // ("made", "number", "began", "end"), and a duplicate is not a difference.
    const theirs = new Set(stopwords[1].split(/\s+/).filter(Boolean));
    const missing = [...DEDUPE_STOPWORDS].filter((w) => !theirs.has(w));
    const extra = [...theirs].filter((w) => !DEDUPE_STOPWORDS.has(w));
    if (missing.length || extra.length) {
      drift.push(`DEDUPE_STOPWORDS differ — only in dedupe.mjs: [${missing.join(" ")}], only in auto-explore.mjs: [${extra.join(" ")}]`);
    }
  }
  if (compared === 0) {
    console.log("auto-explore.mjs no longer defines the dedupe constants — migrated to dedupe.mjs.");
    process.exit(0);
  }
  if (drift.length) {
    console.error(`Dedupe thresholds have drifted:\n  ${drift.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`Dedupe thresholds match auto-explore.mjs (${compared} definitions compared).`);
  process.exit(0);
}
