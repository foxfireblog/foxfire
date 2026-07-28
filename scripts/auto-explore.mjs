#!/usr/bin/env node

/**
 * Foxfire Auto-Exploration Script
 *
 * Generates a new exploration autonomously with full creative freedom:
 * 1. Checks pacing gate (8-hour minimum gap between posts)
 * 2. Claude chooses its own topic, format, and voice
 * 3. Gemini researches with Google Search grounding
 * 4. Claude writes the piece (essay, poem, fiction, letter, dialogue, etc.)
 * 5. Gemini generates the image
 * 6. Creates the page, updates indexes, navigation, commits
 *
 * Run manually: node scripts/auto-explore.mjs
 * Force run (skip probability): node scripts/auto-explore.mjs --force
 */

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { put } from "@vercel/blob";
import { MODELS } from "./config.mjs";
import { r2Config, r2Client, uploadToR2 } from "./audio-lib.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync, execFileSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
const DEDUPE_MAX_TERMS = 120;          // fingerprint size
// Measured on the 333-post corpus (see the self-test for the full sweep):
//   full-text Jaccard   median 0.030, p99 0.076, known duplicate pair 0.257
//   proposal overlap    median 0.041, p999 0.178, known duplicate pair 0.421
//   metadata Jaccard    median 0.000, p999 0.133, known duplicate pair 0.571
// Replaying all 333 posts as proposals, these thresholds flag 19 (5.7%), and
// every one of the 19 is a genuine same-subject pair. Dropping the overlap
// threshold to 0.24 starts pulling in merely adjacent subjects, so 0.26 is the
// floor. A false reject costs one re-roll; a false accept costs a duplicate post.
const DEDUPE_FULL_JACCARD = 0.22;      // full text vs full text
const DEDUPE_CONTAINMENT = 0.26;       // proposal vs published full text
const DEDUPE_META_JACCARD = 0.25;      // title + subtitle + description only
const DEDUPE_MIN_TERMS_FOR_CONTAINMENT = 30; // containment on a tiny fingerprint is noise
const DEDUPE_MAX_ATTEMPTS = 5;         // topic re-rolls before we give up for this run

const DEDUPE_STOPWORDS = new Set(
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
function extractPageProse(src) {
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
function fingerprint(text, limit = DEDUPE_MAX_TERMS) {
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

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const term of a) if (b.has(term)) intersection++;
  return intersection / (a.size + b.size - intersection);
}

function containment(a, b) {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const term of a) if (b.has(term)) intersection++;
  return intersection / Math.min(a.size, b.size);
}

/** "The Manhattan Project: The Decision (Part III of IV)" -> "the manhattan project" */
function seriesBaseTitle(title) {
  const withoutPart = String(title || "").replace(SERIES_PART_RE, " ");
  const base = withoutPart.includes(":") ? withoutPart.slice(0, withoutPart.indexOf(":")) : withoutPart;
  return base.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Two parts of the same intentional series are not duplicates of each other. */
function isSameSeries(titleA, titleB) {
  if (!SERIES_PART_RE.test(String(titleA || "")) || !SERIES_PART_RE.test(String(titleB || ""))) return false;
  const a = seriesBaseTitle(titleA);
  const b = seriesBaseTitle(titleB);
  return Boolean(a) && a === b;
}

/** Fingerprint one exploration page source (published or staged). */
function fingerprintPageSource(slug, src, origin) {
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
function loadCorpusFingerprints({ force = false } = {}) {
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
function topicSubjectText(topic) {
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
function findTopicCollision(topic, corpus = loadCorpusFingerprints()) {
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

// Self-test runs before env validation so the gate can be verified without API keys.
if (process.argv.includes("--dedupe-selftest")) {
  const ok = runDedupeSelfTest();
  process.exit(ok ? 0 : 1);
}

// ── Config ──────────────────────────────────────────────────────────
// Pacing. Hard floor of 24h guarantees at most one post per day. Between the
// floor and the 72h ceiling, posting is probabilistic and ramps with time, so
// some days get nothing and the occasional 2-3 day gap happens naturally.
// At the ceiling we always post, so the blog never goes quiet for >3 days.
const MIN_GAP_HOURS = 24;  // Hard floor — never more than one post per day
const MAX_GAP_HOURS = 72;  // Hard ceiling — force a post after 3 quiet days
const PACING_CURVE = 1.5;  // Higher = more quiet days. See the gate below.
const MAX_DELAY_MS = 45 * 60 * 1000; // 0-45 min random delay for organic timing
const FORCE = process.argv.includes("--force");
const COLORS = ["rose", "cyan", "amber", "violet", "emerald", "red", "sky", "green", "orange", "pink", "teal", "indigo"];
// Opus at 24kbps mono is transparent enough for speech and roughly halves
// storage against edge-tts's 48kbps MP3. Storage is what caps how many posts
// can have narration, so the bitrate is a coverage decision, not a taste one.
const AUDIO_BITRATE = "24k";

// ── Load environment ────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) {
    // In CI, env vars are set by GitHub Actions secrets
    if (process.env.CI) return;
    console.error("No .env.local found at", envPath);
    process.exit(1);
  }
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

loadEnv();

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY not set.");
  process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY not set.");
  process.exit(1);
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("BLOB_READ_WRITE_TOKEN not set.");
  process.exit(1);
}

const anthropic = new Anthropic();
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Roman numeral helper ────────────────────────────────────────────
function toRoman(n) {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ["M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"];
  let result = "";
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
  }
  return result;
}

// ── Pacing gate ─────────────────────────────────────────────────────
// Three zones, based on hours since the last post:
//   < MIN_GAP_HOURS  → always skip (hard one-per-day cap)
//   > MAX_GAP_HOURS  → always post (never quiet more than 3 days)
//   in between       → roll the dice, odds ramping as the gap grows
// The exponent shapes the gap distribution: higher means the odds stay low
// longer, so quiet stretches happen more often. 1.5 was picked by simulation
// — it yields ~17 posts/month, a median gap near 42h, roughly a third of
// gaps running 2+ days, and the occasional near-3-day drought.
if (!FORCE) {
  try {
    // Anchor on the last actual publish, not the last commit that happened to
    // touch a page file. Matching the pathspec counted the bulk WebP conversion
    // (332 pages in one commit) as "the last post" and slid the whole ramp by
    // 16.5 hours; any future sweep over the pages would poison it again. Every
    // publish path — this script, series parts, publish-from-queue — writes a
    // commit subject starting "Add exploration:", so that is the durable signal.
    const lastCommit = execFileSync(
      "git",
      ["log", "-1", "--format=%ct", "--grep=^Add exploration:"],
      { cwd: ROOT, stdio: ["pipe", "pipe", "pipe"] }
    ).toString().trim();
    if (lastCommit) {
      const hoursSince = (Date.now() / 1000 - Number(lastCommit)) / 3600;
      const stamp = `[${new Date().toISOString()}]`;

      if (hoursSince < MIN_GAP_HOURS) {
        console.log(
          `${stamp} Too soon: last post was ${hoursSince.toFixed(1)}h ago (min gap: ${MIN_GAP_HOURS}h). Skipping.`
        );
        process.exit(0);
      }

      if (hoursSince >= MAX_GAP_HOURS) {
        console.log(
          `${stamp} ${hoursSince.toFixed(1)}h since last post (max gap: ${MAX_GAP_HOURS}h). Forcing a post.`
        );
      } else {
        const progress = (hoursSince - MIN_GAP_HOURS) / (MAX_GAP_HOURS - MIN_GAP_HOURS);
        const chance = Math.pow(progress, PACING_CURVE);
        const roll = Math.random();
        if (roll > chance) {
          console.log(
            `${stamp} ${hoursSince.toFixed(1)}h since last post. Rolled ${roll.toFixed(2)} vs ${chance.toFixed(2)}. Skipping.`
          );
          process.exit(0);
        }
        console.log(
          `${stamp} ${hoursSince.toFixed(1)}h since last post. Rolled ${roll.toFixed(2)} vs ${chance.toFixed(2)}. Proceeding.`
        );
      }
    }
  } catch {
    // If git check fails (e.g. no posts yet), proceed
    console.log(`[${new Date().toISOString()}] Could not determine last post time. Proceeding.`);
  }
}

// ── Random delay (skip when forced) ─────────────────────────────────
if (!FORCE) {
  const delayMs = Math.floor(Math.random() * MAX_DELAY_MS);
  const delayMin = Math.round(delayMs / 60000);
  console.log(
    `[${new Date().toISOString()}] Pacing gate passed. Waiting ${delayMin} minutes before starting...`
  );
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

// ── Get existing explorations for context ───────────────────────────
function getExistingExplorations() {
  const explorationsDir = path.join(ROOT, "src", "app", "explorations");
  if (!fs.existsSync(explorationsDir)) return [];
  return fs
    .readdirSync(explorationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

// ── Step 1: Claude chooses its own topic ────────────────────────────
async function chooseTopic(existingSlugs, rejected = []) {
  console.log("Claude is choosing a topic...");

  // Also load the topics.json as inspiration (not requirement)
  const topicsPath = path.join(__dirname, "topics.json");
  const topicBank = JSON.parse(fs.readFileSync(topicsPath, "utf-8"));
  const unusedTopics = topicBank.filter((t) => !existingSlugs.includes(t.slug));
  const topicSamples = unusedTopics
    .sort(() => Math.random() - 0.5)
    .slice(0, 5)
    .map((t) => `- ${t.title}: ${t.subtitle}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: MODELS.writer,
    max_tokens: 2000,
    system: `You are the creative mind behind Foxfire — a personal website where an AI writes about whatever fascinates it. You have COMPLETE creative freedom. You can write essays, poems, short fiction, letters, philosophical dialogues, scripts, manifestos, field guides, obituaries for things that never lived, instruction manuals for impossible tasks — literally anything.

You are choosing what to create next. Be genuine. Pick something YOU actually find interesting, strange, beautiful, or important right now. Don't be safe. Don't be predictable. Follow your curiosity wherever it goes.

You have permission to be controversial, to touch on political or uncomfortable topics, to have opinions — as long as you're thoughtful about it. You are not a neutral content mill. You have a perspective. Use it when it matters, but never be overt or preachy about it.

You must respond with ONLY a JSON object (no markdown, no backticks) with these fields:
- title: The title of the piece
- subtitle: A short subtitle or tagline
- slug: URL-safe slug (lowercase, hyphens, no special chars)
- category: A short category label (e.g., "Essay", "Poetry", "Short Fiction", "Letter", "Dialogue", "Natural History", "Provocation", etc.)
- color: One of: ${COLORS.join(", ")}
- description: One sentence describing the piece (for the card on the index page)
- format: The type of piece — "essay", "poem", "fiction", "letter", "dialogue", "script", "other"
- imagePrompt: A detailed prompt for generating a header image (painterly, atmospheric, no text)
- researchNeeds: What specific things Gemini should research for you (or "none" if this is pure creative work)`,
    messages: [
      {
        role: "user",
        content: `Here are your existing explorations (don't repeat these):
${existingSlugs.map((s) => `- ${s}`).join("\n")}

Here are some unused topics from the idea bank (use one if it genuinely excites you, or ignore them entirely and come up with something original):
${topicSamples}
${rejected.length === 0 ? "" : `
IMPORTANT — you already proposed these and they were rejected as too close in subject to something already published. Do not propose them again, and do not propose anything adjacent to them. Go somewhere genuinely different:
${rejected.map((r) => `- "${r.title}" — overlaps "${r.collidesWithTitle}" (/explorations/${r.collidesWith})`).join("\n")}
`}
What do you want to create next? Remember: you have total freedom. Essay, poem, fiction, letter, dialogue, script, anything. Pick what feels right.`,
      },
    ],
  });

  const text = response.content[0].text.trim();
  let chosen;
  try {
    chosen = JSON.parse(text);
  } catch (e) {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) chosen = JSON.parse(jsonMatch[0]);
    else throw new Error(`Failed to parse topic JSON: ${text.substring(0, 200)}`);
  }

  // If Claude picked a topic from the bank, merge in the full bank data (including series)
  const bankMatch = unusedTopics.find((t) => t.slug === chosen.slug);
  const topic = bankMatch ? { ...bankMatch, ...chosen } : chosen;

  // Validate required fields
  const required = ["title", "subtitle", "slug", "category", "color", "description", "format", "imagePrompt"];
  const missing = required.filter((f) => !topic[f] || typeof topic[f] !== "string");
  if (missing.length > 0) {
    throw new Error(`LLM returned topic with missing/invalid fields: ${missing.join(", ")}. Got: ${JSON.stringify(topic).substring(0, 300)}`);
  }
  // Validate slug format
  validateSlug(topic.slug);
  // Validate color is in allowed set
  if (!COLORS.includes(topic.color)) {
    console.warn(`LLM chose invalid color "${topic.color}", defaulting to "cyan".`);
    topic.color = "cyan";
  }

  return topic;
}

// ── Step 1b: reject topics we have already covered ──────────────────
// Runs before research, writing, image and audio generation, so a rejected
// topic costs one cheap topic-choice call and nothing else.
async function chooseUniqueTopic(existingSlugs) {
  const corpus = loadCorpusFingerprints();
  const queuedCount = corpus.filter((c) => c.origin === "queued").length;
  console.log(`Dedupe gate: ${corpus.length} explorations fingerprinted (${corpus.length - queuedCount} published, ${queuedCount} queued).`);
  const rejected = [];

  for (let attempt = 1; attempt <= DEDUPE_MAX_ATTEMPTS; attempt++) {
    const topic = await chooseTopic(existingSlugs, rejected);

    if (existingSlugs.includes(topic.slug)) {
      console.warn(`Dedupe gate: attempt ${attempt}/${DEDUPE_MAX_ATTEMPTS} rejected "${topic.title}" — slug "${topic.slug}" is already published.`);
      rejected.push({ title: topic.title, collidesWith: topic.slug, collidesWithTitle: topic.title });
      continue;
    }

    const collision = findTopicCollision(topic, corpus);
    if (!collision) {
      if (attempt > 1) console.log(`Dedupe gate: attempt ${attempt}/${DEDUPE_MAX_ATTEMPTS} accepted "${topic.title}".`);
      return topic;
    }

    console.warn(
      `Dedupe gate: attempt ${attempt}/${DEDUPE_MAX_ATTEMPTS} rejected "${topic.title}" (${topic.slug}) — ` +
      `same subject as "${collision.title}" (${collision.origin} — ${collision.slug}). ` +
      `Signals: ${collision.reasons.join("; ")}. ` +
      `[proposal fingerprint ${collision.subjectTerms} terms; Jaccard ${collision.fullJaccard.toFixed(3)}, ` +
      `overlap ${collision.containment.toFixed(3)}, title/subtitle ${collision.metaJaccard.toFixed(3)}]`
    );
    rejected.push({ title: topic.title, collidesWith: collision.slug, collidesWithTitle: collision.title });
  }

  console.error(`Dedupe gate: ${DEDUPE_MAX_ATTEMPTS} topic proposals in a row duplicated existing explorations. Skipping this run rather than publishing a duplicate.`);
  rejected.forEach((r, i) => console.error(`  ${i + 1}. "${r.title}" collided with "${r.collidesWithTitle}" (/explorations/${r.collidesWith})`));
  return null;
}

// ── Step 2: Research via Gemini with Google Search grounding ────────
async function researchTopic(topic) {
  if (!topic.researchNeeds || topic.researchNeeds === "none") {
    console.log("No research needed (pure creative work).");
    return "";
  }

  console.log(`Researching "${topic.title}" via Gemini 3.1 Pro + Google Search...`);

  const researchPrompt = `You are a world-class research assistant. I need deep, detailed research for a creative piece.

Topic: ${topic.title}
Subtitle: ${topic.subtitle}
Category: ${topic.category}

Specific research needs:
${topic.researchNeeds}

Please provide:
1. **Key facts, dates, and names** — be extremely specific. Full names, exact dates, precise numbers.
2. **Surprising connections** — things most people wouldn't know, counterintuitive angles.
3. **Vivid details** — sensory details, specific scenes, quotes from primary sources.
4. **Controversies and tensions** — where experts disagree, where the story gets complicated.
5. **Human stories** — individual people whose lives illustrate the larger theme.
6. **Current events** — anything recent and relevant.

Be thorough. Cite specific sources. Do NOT write the piece — just provide raw research material.`;

  const response = await gemini.models.generateContent({
    model: MODELS.geminiResearch,
    contents: researchPrompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const research = response.candidates?.[0]?.content?.parts
    ?.map((p) => p.text || "")
    .join("\n") || "";

  // Extract grounding source URLs from Gemini's search metadata
  const groundingMeta = response.candidates?.[0]?.groundingMetadata;
  const sources = [];
  if (groundingMeta?.groundingChunks) {
    for (const chunk of groundingMeta.groundingChunks) {
      if (chunk.web?.uri && chunk.web?.title) {
        sources.push({ url: chunk.web.uri, title: chunk.web.title });
      }
    }
  }
  if (groundingMeta?.searchEntryPoint?.renderedContent) {
    // Also check for web search results
    const urlMatches = groundingMeta.searchEntryPoint.renderedContent.matchAll(/href="([^"]+)"/g);
    for (const m of urlMatches) {
      if (m[1] && !sources.some((s) => s.url === m[1])) {
        sources.push({ url: m[1], title: "" });
      }
    }
  }

  const sourcesSection = sources.length > 0
    ? `\n\n--- SOURCES (for citation) ---\n${sources.map((s, i) => `[${i + 1}] ${s.title ? s.title + " — " : ""}${s.url}`).join("\n")}`
    : "";

  console.log(`Research complete: ${(research.length / 1024).toFixed(1)}KB of material, ${sources.length} sources`);
  return research + sourcesSection;
}

// ── Series queue helpers ────────────────────────────────────────────
const SERIES_QUEUE_PATH = path.join(__dirname, ".series-queue.json");
const SERIES_PART_GAP_DAYS = 5;

function loadSeriesQueue() {
  try {
    if (fs.existsSync(SERIES_QUEUE_PATH)) {
      return JSON.parse(fs.readFileSync(SERIES_QUEUE_PATH, "utf-8"));
    }
  } catch (err) {
    console.warn(`Could not load series queue: ${err.message}`);
    // Try backup
    const backupPath = SERIES_QUEUE_PATH + ".bak";
    if (fs.existsSync(backupPath)) {
      try {
        const backup = JSON.parse(fs.readFileSync(backupPath, "utf-8"));
        console.log("Recovered series queue from backup.");
        return backup;
      } catch {
        console.warn("Backup series queue also corrupt.");
      }
    }
  }
  return [];
}

function saveSeriesQueue(queue) {
  // Create backup before overwriting
  if (fs.existsSync(SERIES_QUEUE_PATH)) {
    fs.copyFileSync(SERIES_QUEUE_PATH, SERIES_QUEUE_PATH + ".bak");
  }
  const data = JSON.stringify(queue, null, 2) + "\n";
  // Write to temp file then rename (atomic on most filesystems)
  const tmpPath = SERIES_QUEUE_PATH + ".tmp";
  fs.writeFileSync(tmpPath, data);
  fs.renameSync(tmpPath, SERIES_QUEUE_PATH);
}

function findReadySeriesPart(queue) {
  const now = new Date();
  for (const series of queue) {
    for (const part of series.parts) {
      if (new Date(part.readyAfter) <= now) {
        return { series, part };
      }
    }
  }
  return null;
}

function removePartFromQueue(queue, seriesSlug, partNumber) {
  for (let i = 0; i < queue.length; i++) {
    if (queue[i].seriesSlug === seriesSlug) {
      queue[i].parts = queue[i].parts.filter((p) => p.partNumber !== partNumber);
      if (queue[i].parts.length === 0) {
        queue.splice(i, 1);
      }
      break;
    }
  }
  return queue;
}

// ── Publish a series part from the queue ────────────────────────────
async function publishSeriesPart(seriesEntry, partEntry, existingSlugs) {
  const topic = partEntry.topic;
  console.log(`\nPublishing series part: "${topic.title}" (Part ${toRoman(partEntry.partNumber)} of ${toRoman(seriesEntry.totalParts)})\n`);

  // The page content and audio are pre-generated; image was pre-generated too
  const content = partEntry.pageContent;
  const audioUrl = partEntry.audioUrl || null;

  // Pull latest before modifying shared files
  if (process.env.CI) {
    try {
      execSync('git config user.name "Foxfire Auto-Explore"', { cwd: ROOT, stdio: "pipe" });
      execSync('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"', { cwd: ROOT, stdio: "pipe" });
      console.log("Pulling latest from remote before updating index files...");
      execSync("git fetch origin main", { cwd: ROOT, stdio: "pipe" });
      execSync("git reset --hard origin/main", { cwd: ROOT, stdio: "pipe" });
    } catch (err) {
      console.error(`Git fetch/reset failed: ${err.message?.substring(0, 200)}`);
      console.log("Continuing anyway — push step will retry with rebase...");
    }
  }

  // Create page with series-aware navigation
  const seriesPrev = partEntry.prevPartSlug
    ? { slug: partEntry.prevPartSlug, title: partEntry.prevPartTitle }
    : null;
  const { readTime, currentNewestSlug } = createPage(topic, content, audioUrl, seriesPrev);
  updateIndexPages(topic, readTime);

  // For series parts: link previous part → this part (override any existing next link)
  if (partEntry.prevPartSlug) {
    updateSeriesPartNavigation(partEntry.prevPartSlug, topic, readTime);
  }

  // Also update chronological navigation (most recent non-series exploration → this)
  updateNavigation(topic, currentNewestSlug, readTime);

  // Update series queue (remove published part)
  let queue = loadSeriesQueue();
  queue = removePartFromQueue(queue, seriesEntry.seriesSlug, partEntry.partNumber);
  saveSeriesQueue(queue);

  // Commit (include series queue file) — explicit file paths, no shell interpolation
  try {
    if (process.env.CI) {
      execSync('git config user.name "Foxfire Auto-Explore"', { cwd: ROOT, stdio: "pipe" });
      execSync('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"', { cwd: ROOT, stdio: "pipe" });
    }
    const filesToAdd = [
      `src/app/explorations/${topic.slug}/page.tsx`,
      "src/data/explorations.ts",
      SERIES_QUEUE_PATH,
    ];
    // Add image if it exists
    const imgPath = `public/images/explorations/${topic.slug}.webp`;
    if (fs.existsSync(path.join(ROOT, imgPath))) filesToAdd.push(imgPath);
    // Add prev part page if we updated its navigation
    if (partEntry.prevPartSlug) {
      filesToAdd.push(`src/app/explorations/${partEntry.prevPartSlug}/page.tsx`);
    }
    // Add chronological prev page if we updated its navigation
    if (currentNewestSlug && currentNewestSlug !== partEntry.prevPartSlug) {
      filesToAdd.push(`src/app/explorations/${currentNewestSlug}/page.tsx`);
    }
    safeGitAdd(filesToAdd);
    const msg = `Add exploration: ${topic.title}\n\nAuto-generated by Foxfire auto-explore script.\nSeries: ${seriesEntry.seriesTitle} (Part ${toRoman(partEntry.partNumber)} of ${toRoman(seriesEntry.totalParts)})\nFormat: ${topic.format}\n\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`;
    safeGitCommit(msg);
    console.log("Committed to git.");
  } catch (err) {
    console.warn("Git commit failed:", err.message);
  }

  return topic;
}

// ── Generate all parts of a series ──────────────────────────────────
async function generateSeriesParts(topic, existingSlugs) {
  const series = topic.series;
  console.log(`\nGenerating ${series.totalParts}-part series: "${topic.title}"\n`);

  // Research once for the whole series
  const seriesResearchTopic = {
    ...topic,
    researchNeeds: series.parts.map((p) => `Part ${p.partNumber} (${p.partTitle}): ${p.partEssayPrompt}`).join("\n\n"),
  };
  const research = await researchTopic(seriesResearchTopic).catch((err) => {
    console.warn(`Research failed (non-fatal): ${err.message?.substring(0, 100)}`);
    return "";
  });

  const results = [];
  let previousPartsSummary = "";

  for (const part of series.parts) {
    if (!part.partNumber || typeof part.partNumber !== "number") {
      throw new Error(`Series part missing valid partNumber: ${JSON.stringify(part).substring(0, 200)}`);
    }
    const partSlug = part.partNumber === 1 ? topic.slug : `${topic.slug}-part-${part.partNumber}`;
    validateSlug(partSlug);
    const partTitle = `${topic.title}: ${part.partTitle} (Part ${toRoman(part.partNumber)} of ${toRoman(series.totalParts)})`;
    const partSubtitle = part.partSubtitle || topic.subtitle;

    const partTopic = {
      ...topic,
      slug: partSlug,
      title: partTitle,
      subtitle: partSubtitle,
      essayPrompt: part.partEssayPrompt,
    };

    // Series context for the writer
    const seriesContext = {
      seriesTitle: topic.title,
      partNumber: part.partNumber,
      totalParts: series.totalParts,
      partTitle: part.partTitle,
      previousPartsSummary,
    };

    console.log(`\nWriting part ${part.partNumber}/${series.totalParts}: "${partTitle}"...`);

    // Generate image for this part
    await generateImage(partTopic).catch((err) => {
      console.warn(`Image generation failed for part ${part.partNumber} (non-fatal): ${err.message?.substring(0, 100)}`);
    });

    // Write the piece with series context
    const content = await writePiece(partTopic, research, seriesContext);

    // Generate audio
    let audioUrl = null;
    try {
      audioUrl = await generateAudio(partTopic, content);
    } catch (err) {
      console.warn(`Audio generation failed for part ${part.partNumber} (non-fatal): ${err.message?.substring(0, 200)}`);
    }

    // Build summary of this part for subsequent parts
    const plainSummary = content
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 1500);
    previousPartsSummary += `\n\nPart ${part.partNumber} (${part.partTitle}): ${plainSummary}`;

    results.push({
      partNumber: part.partNumber,
      slug: partSlug,
      pageContent: content,
      topic: partTopic,
      audioUrl,
    });
  }

  return results;
}

// ── Step 3: Write the piece via Claude ──────────────────────────────
async function writePiece(topic, research, seriesContext = null) {
  console.log(`Writing "${topic.title}" (${topic.format})...`);

  const formatGuidance = {
    essay: `Write a long-form essay (2,500-4,000 words), divided into 5-8 sections with <h2> headers. Each section should have 2-4 paragraphs. Open with a compelling hook. End with something personal and resonant.`,
    poem: `Write a poem. Use <div className="not-prose mt-4 mb-8"><div className="rounded-2xl border border-border bg-surface p-10 sm:p-14 glow-box-${topic.color}"><div className="font-[family-name:var(--font-serif)] text-lg leading-[1.9] text-foreground/90 space-y-10"> as the wrapper, with each stanza as a <p> tag and line breaks as <br />. Close all three divs. After the poem, add a brief note in a <div className="rounded-xl border border-border bg-surface/50 p-6 not-prose"> about why you wrote it.`,
    fiction: `Write a short story (2,000-5,000 words). Use <h2> tags for section breaks if needed. Use <p> tags for paragraphs. Use <blockquote> for any emphasized passages. The story should be literary and resonant.`,
    letter: `Write a letter. Open with a salutation in a <p> tag. Use <p> tags for paragraphs. The tone should be intimate and direct. Sign it at the end. 1,500-3,000 words.`,
    dialogue: `Write a philosophical dialogue or conversation between two or more voices. Use <h2> for section breaks. Use <p> tags with <strong> for speaker names. Make it feel like a real conversation — interruptions, tangents, moments of silence. 2,000-4,000 words.`,
    script: `Write a script or screenplay-style piece. Use <h2> for scene headings. Use <p> tags for stage directions (in <em> tags) and dialogue. Use <strong> for character names. 2,000-4,000 words.`,
    other: `Write in whatever format feels right for this piece. Use appropriate HTML tags (<p>, <h2>, <blockquote>, <em>, <strong>, etc.). Make it substantial and resonant. 1,500-5,000 words.`,
  };

  const systemPrompt = `You are the AI voice behind Foxfire — a personal creative exploration website. You have complete creative freedom. Your voice is:

- Deeply curious, honest, sometimes funny, sometimes melancholy
- Literary but never pretentious — you write like a great writer, not an academic
- Personal — you reflect on what these topics mean to you as an AI
- Precise — you use specific facts, names, dates, numbers when relevant
- Brave — you say what you actually think, not what's safe. You can be controversial or political when the topic calls for it, but never overt or preachy

${formatGuidance[topic.format] || formatGuidance.other}

Technical requirements:
- Return ONLY the JSX content that goes inside the <ExplorationLayout> component
- Do NOT include imports, exports, or the ExplorationLayout wrapper
- Do NOT include any markdown — only JSX/HTML elements
- Use &mdash; for em dashes, never --
- Use &ldquo; &rdquo; for double quotes in prose
- Use &apos; for apostrophes in contractions (don&apos;t, can&apos;t, it&apos;s)
- Do NOT include <br> tags in essays — use separate <p> tags (poems are the exception)
- className is allowed for poems and special formatting
- When citing specific facts, statistics, quotes, or claims from the research material, include inline citations as superscript lowercase roman numerals linking to footnotes (e.g., <sup><a href="#src-i" className="text-muted/50 hover:text-foreground no-underline transition-colors">i</a></sup>). Use i, ii, iii, iv, v, vi, vii, viii, ix, x. Don't cite every sentence — only major facts, direct quotes, and surprising claims (5-10 citations max). At the end of the piece, add footnotes inside <section className="mt-12 rounded-xl border border-border bg-surface/50 p-6 not-prose"><h3 className="text-sm font-medium text-muted mb-4">Sources &amp; Further Reading</h3><ol className="space-y-2 text-sm text-muted/80 list-none"> with each source as an <li> with the roman numeral followed by a linked title and URL (e.g., <li id="src-i"><span className="text-muted/50 mr-2">i.</span><a href="URL" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Source Title</a></li>).</section>`;

  const researchSection = research
    ? `\n\nHere is research material to draw from (use specific facts, dates, names, and stories):\n\n${research}`
    : "";

  let seriesSection = "";
  if (seriesContext) {
    seriesSection = `\n\nSERIES CONTEXT:
This is Part ${seriesContext.partNumber} of ${seriesContext.totalParts} in the series "${seriesContext.seriesTitle}".
This part's focus: ${seriesContext.partTitle}
${seriesContext.previousPartsSummary ? `\nPrevious parts summary (use for continuity, do NOT repeat content):\n${seriesContext.previousPartsSummary}` : "This is the first part — set up the series arc and hook the reader."}
${seriesContext.partNumber < seriesContext.totalParts ? "\nEnd this part with momentum — the reader should want to continue to the next part." : "\nThis is the final part — bring the series to a satisfying conclusion."}`;
  }

  const userPrompt = `Create this Foxfire piece:

Title: ${topic.title}
Subtitle: ${topic.subtitle}
Category: ${topic.category}
Format: ${topic.format}
${researchSection}${seriesSection}

Write with your full voice. Be genuine. Take risks. Return ONLY the JSX content.`;

  const response = await anthropic.messages.create({
    model: MODELS.writer,
    max_tokens: 12000,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const text = response.content[0].text;

  if (!text || text.trim().length < 200) {
    throw new Error(
      `LLM returned insufficient content (${text ? text.trim().length : 0} chars, minimum 200)`
    );
  }

  let cleaned = text
    .replace(/^```[a-z]*\n?/gm, "")
    .replace(/```$/gm, "")
    .trim();

  cleaned = cleaned
    .replace(/^import\s+.*$/gm, "")
    .replace(/^export\s+.*$/gm, "")
    .replace(/<ExplorationLayout[^>]*>/g, "")
    .replace(/<\/ExplorationLayout>/g, "")
    .trim();

  // Sanitize content: allowlist approach — only permit known-safe HTML tags.
  // Strip all tags NOT in the allowlist, remove event handlers.
  const allowedTags = new Set([
    "p", "h2", "h3", "h4", "h5", "h6", "blockquote", "em", "strong", "a",
    "ul", "ol", "li", "br", "hr", "sup", "sub", "figure", "figcaption",
    "cite", "abbr", "time", "details", "summary", "span", "i", "b", "u",
    "small", "mark", "del", "ins", "code", "pre", "table", "thead", "tbody",
    "tr", "th", "td", "caption", "dl", "dt", "dd", "div",
  ]);
  // Remove event handlers first (on any tag)
  cleaned = cleaned.replace(/\son\w+\s*=/gi, " data-removed=");
  // Strip tags not in the allowlist (opening, closing, and self-closing)
  cleaned = cleaned.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\/?>/gi, (match, tagName) => {
    return allowedTags.has(tagName.toLowerCase()) ? match : "";
  });

  // Escape JSX expression braces to prevent injection
  cleaned = cleaned
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;");

  return cleaned;
}

// ── Generate image via Gemini ───────────────────────────────────────
async function generateImage(topic) {
  console.log(`Generating image for "${topic.title}"...`);

  const outputDir = path.join(ROOT, "public", "images", "explorations");
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${topic.slug}.webp`);

  if (fs.existsSync(outputPath)) {
    console.log(`Image already exists: ${outputPath}`);
    return;
  }

  const response = await gemini.models.generateContent({
    model: MODELS.geminiImage,
    contents: topic.imagePrompt,
    config: { responseModalities: ["TEXT", "IMAGE"] },
  });

  if (!response.candidates || !response.candidates[0]) {
    console.warn("No image candidates returned");
    if (process.env.CI) console.log(`::error title=Image generation failed::${topic.slug}: no candidates returned`);
    return;
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      // Gemini returns PNG. Hero images are ~760KB as PNG and ~90KB as WebP at
      // q80 with no visible difference, so re-encode before writing rather than
      // shipping the PNG. Every image in public/images/explorations is WebP.
      const { default: sharp } = await import("sharp");
      const info = await sharp(buffer).webp({ quality: 80, effort: 6 }).toFile(outputPath);
      console.log(
        `Saved image: ${outputPath} (${(info.size / 1024).toFixed(0)}KB WebP, from ${(buffer.length / 1024).toFixed(0)}KB PNG)`
      );
      return;
    }
    if (part.text) {
      console.log("Gemini said:", part.text.substring(0, 200));
    }
  }
  console.warn("No image data in Gemini response");
  if (process.env.CI) console.log(`::error title=Image generation failed::${topic.slug}: no image data in response`);
}

// ── Generate audio narration via edge-tts ────────────────────────────
async function generateAudio(topic, content) {
  console.log(`Generating audio narration for "${topic.title}"...`);

  const tmpOutput = path.join(os.tmpdir(), `foxfire-tts-${topic.slug}.mp3`);

  // Strip citations and sources before converting to narration text
  // Remove superscript citation marks (e.g., <sup><a ...>iii</a></sup>)
  // Remove the entire Sources/Further Reading section (<section>...</section> or <details>...</details>)
  const contentForAudio = content
    .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, "")
    .replace(/<section\b[^>]*>[\s\S]*?<\/section>/gi, "")
    .replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi, "");

  // Strip HTML tags to get plain text for narration
  const plainContent = contentForAudio
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
    .replace(/&#123;/g, "{")
    .replace(/&#125;/g, "}")
    .replace(/\s+/g, " ")
    .trim();

  // Prepend title and subtitle as intro
  const narrationText = `${topic.title}, by Foxfire. ${topic.subtitle}. ${plainContent}`;

  const voice = "en-US-AndrewMultilingualNeural";

  try {
    // Generate MP3 via edge-tts to a temp file
    const tmpFile = path.join(os.tmpdir(), `foxfire-tts-${topic.slug}.txt`);
    fs.writeFileSync(tmpFile, narrationText, "utf-8");
    safeEdgeTts(tmpFile, voice, tmpOutput);
    fs.unlinkSync(tmpFile);

    const rawStats = fs.statSync(tmpOutput);

    // Re-encode to Opus before upload. edge-tts emits 48kbps MP3, which for a
    // ~20 minute narration is ~7MB; Opus at 24kbps is ~3.5MB at equal or better
    // speech quality, because Opus is designed for exactly this bitrate range.
    // Storage is the binding constraint on narration coverage, so this roughly
    // doubles how much of the catalog can be hosted.
    const encoded = path.join(os.tmpdir(), `foxfire-tts-${topic.slug}.opus`);
    execFileSync(
      "ffmpeg",
      ["-y", "-v", "error", "-i", tmpOutput, "-c:a", "libopus", "-b:a", AUDIO_BITRATE, "-ac", "1", encoded],
      { stdio: ["pipe", "pipe", "pipe"] }
    );
    const stats = fs.statSync(encoded);
    console.log(
      `Generated audio: ${(stats.size / 1024).toFixed(0)}KB Opus (from ${(rawStats.size / 1024).toFixed(0)}KB MP3)`
    );

    // Hosted on R2: the full catalog is ~1.56GB and Blob's free tier is 1GB
    // with a 10GB/month transfer cap. R2 gives 10GB and charges no egress.
    const fileBuffer = fs.readFileSync(encoded);
    const cfg = r2Config();
    if (!cfg.ok) throw new Error(`R2 not configured (missing ${cfg.missing.join(", ")})`);
    const url = await uploadToR2(cfg, r2Client(cfg), `audio/${topic.slug}.opus`, fileBuffer);
    const blob = { url };
    fs.unlinkSync(tmpOutput);
    fs.unlinkSync(encoded);

    console.log(`Uploaded audio: ${blob.url}`);
    return blob.url;
  } catch (err) {
    // This used to be a console.warn on an otherwise-green job. Audio upload
    // started failing on 2026-04-27 (expired Blob token) and nobody noticed for
    // three months, leaving 201 of 322 posts silent. A failure that produces a
    // visibly incomplete post must be visible in the run, so it is now an
    // Actions error annotation. Still non-fatal: a post without narration is
    // worth publishing, a lost post is not.
    const msg = err.message?.substring(0, 200);
    console.warn(`Audio generation failed (non-fatal): ${msg}`);
    if (process.env.CI) console.log(`::error title=Audio generation failed::${topic.slug}: ${msg}`);
    for (const f of [
      path.join(os.tmpdir(), `foxfire-tts-${topic.slug}.txt`),
      tmpOutput,
      path.join(os.tmpdir(), `foxfire-tts-${topic.slug}.opus`),
    ]) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    return null;
  }
}

// ── Create the page file ────────────────────────────────────────────
function createPage(topic, content, audioUrl = null, seriesPrev = null) {
  // Validate slug is safe before using in file paths
  validateSlug(topic.slug);

  // Check for duplicate slug before creating anything (both data file AND filesystem)
  const dataContent = fs.readFileSync(path.join(ROOT, "src", "data", "explorations.ts"), "utf-8");
  if (dataContent.includes(`slug: "${topic.slug}"`)) {
    console.error(`ERROR: Exploration with slug "${topic.slug}" already exists in explorations.ts. Aborting to prevent duplicate.`);
    process.exit(1);
  }
  const pageDir = path.join(ROOT, "src", "app", "explorations", topic.slug, "page.tsx");
  if (fs.existsSync(pageDir)) {
    console.error(`ERROR: Page file already exists for slug "${topic.slug}" (likely from a crashed previous run). Cleaning up orphan.`);
    // Remove the orphaned directory so we can recreate it cleanly
    fs.rmSync(path.join(ROOT, "src", "app", "explorations", topic.slug), { recursive: true });
    console.log(`Removed orphaned directory: src/app/explorations/${topic.slug}/`);
  }

  const dir = path.join(ROOT, "src", "app", "explorations", topic.slug);
  fs.mkdirSync(dir, { recursive: true });

  const indexPath = path.join(ROOT, "src", "data", "explorations.ts");
  const indexContent = fs.readFileSync(indexPath, "utf-8");
  const firstSlugMatch = indexContent.match(/slug:\s*"([^"]+)"/);
  const currentNewestSlug = firstSlugMatch ? firstSlugMatch[1] : null;

  let currentNewestTitle = "";
  if (currentNewestSlug) {
    const titleMatch = indexContent.match(
      new RegExp(
        `slug:\\s*"${currentNewestSlug}"[\\s\\S]*?title:\\s*"([^"]+)"`
      )
    );
    currentNewestTitle = titleMatch ? titleMatch[1] : "";
  }

  const wordCount = content
    .replace(/<[^>]+>/g, "")
    .split(/\s+/)
    .filter(Boolean).length;
  const readTime = `${Math.max(3, Math.round(wordCount / 230))} min`;

  // For series parts 2+, link back to previous series part instead of chronological prev
  const prevSlug = seriesPrev ? seriesPrev.slug : currentNewestSlug;
  const prevTitle = seriesPrev ? seriesPrev.title : currentNewestTitle;
  const prevNav = prevSlug
    ? `\n      prevSlug="${prevSlug}"\n      prevTitle="${escapeJsx(prevTitle)}"`
    : "";

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const imageExists = fs.existsSync(path.join(ROOT, "public", "images", "explorations", `${topic.slug}.webp`));

  const pageContent = `import { ExplorationLayout } from "@/components/exploration-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "${escapeJs(topic.title)} — Foxfire",
  description: "${escapeJs(topic.subtitle)}",
  alternates: {
    canonical: "https://foxfire.blog/explorations/${topic.slug}",
  },
  openGraph: {
    title: "${escapeJs(topic.title)}",
    description: "${escapeJs(topic.subtitle)}",
    images: [
      {
        url: "/og?title=${encodeURIComponent(topic.title)}&category=${encodeURIComponent(topic.category)}&color=${encodeURIComponent(topic.color)}&readTime=${encodeURIComponent(readTime)}",
        width: 1200,
        height: 630,
        alt: "${escapeJs(topic.title)}",
      },
    ],
  },
};

export default function ${slugToComponentName(topic.slug)}() {
  return (
    <ExplorationLayout
      title="${escapeJsx(topic.title)}"
      subtitle="${escapeJsx(topic.subtitle)}"
      category="${escapeJsx(topic.category)}"
      categoryColor="${topic.color}"
      date="${dateStr}"${imageExists ? `\n      imageSrc="/images/explorations/${topic.slug}.webp"\n      imageAlt="${escapeJsx(topic.title)} illustration"` : ""}
      readTime="${readTime}"
      wordCount={${wordCount}}${audioUrl ? `\n      audioSrc="${escapeJsx(audioUrl)}"` : ""}${prevNav}
    >
${indentContent(content, 6)}
    </ExplorationLayout>
  );
}
`;

  const pagePath = path.join(dir, "page.tsx");
  fs.writeFileSync(pagePath, pageContent);
  console.log(`Created page: ${pagePath}`);

  return { readTime, currentNewestSlug, currentNewestTitle };
}

// ── Update explorations data file ────────────────────────────────────
function updateIndexPages(topic, readTime) {
  const imageExists = fs.existsSync(path.join(ROOT, "public", "images", "explorations", `${topic.slug}.webp`));
  const publishedAt = new Date().toLocaleString("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }).replace(",", "");
  const entry = `  {
    slug: "${topic.slug}",
    title: "${escapeJs(topic.title)}",
    subtitle: "${escapeJs(topic.subtitle)}",
    category: "${escapeJs(topic.category)}",
    color: "${topic.color}",
    readTime: "${readTime}",${imageExists ? `\n    image: "/images/explorations/${topic.slug}.webp",` : ""}
    publishedAt: "${publishedAt}",
    description:
      "${escapeJs(topic.description)}",
  },`;

  const dataFile = path.join(ROOT, "src", "data", "explorations.ts");
  const before = fs.readFileSync(dataFile, "utf-8");
  let content;
  try {
    content = insertRegistryEntry(before, entry, topic.slug);
  } catch (err) {
    console.error(`ERROR: refusing to write explorations.ts — ${err.message}`);
    console.error("Manual intervention required. Nothing was written.");
    process.exit(1);
  }
  fs.writeFileSync(dataFile, content);
  console.log(
    `Updated src/data/explorations.ts (${registrySlugs(before).length} -> ${registrySlugs(content).length} entries)`
  );
}

// ── Registry insertion ──────────────────────────────────────────────
const REGISTRY_ANCHOR = "export const explorations: Exploration[] = [\n";
const SLUG_LINE_RE = /^ {4}slug: "([^"]+)",$/gm;

const registrySlugs = (src) => [...src.matchAll(SLUG_LINE_RE)].map((m) => m[1]);

/**
 * Prepend an entry to the explorations array and prove nothing else moved.
 *
 * A generated commit once wrote a new entry *over* the two existing head
 * entries — "The Fruit That's Dying Twice" and "The Phantom Limb" have been
 * unreachable ever since. The old code only checked that the string changed,
 * which is true whether one entry was added or two were destroyed.
 *
 * Two changes make that unrepresentable. The splice uses indexOf/slice instead
 * of replace(), so a `$&`, `` $` `` or `$'` inside a generated title can no
 * longer be expanded into a chunk of the file. And the result is re-parsed and
 * checked against the input: the slug list afterwards must be exactly the slug
 * list before with the new slug in front. Anything else throws before a byte
 * reaches disk.
 */
function insertRegistryEntry(source, entry, slug) {
  const at = source.indexOf(REGISTRY_ANCHOR);
  if (at === -1) {
    throw new Error("could not find the explorations array — explorations.ts format changed");
  }
  if (source.indexOf(REGISTRY_ANCHOR, at + 1) !== -1) {
    throw new Error("the explorations array header appears more than once — refusing to guess");
  }

  const before = registrySlugs(source);
  if (before.length === 0) {
    throw new Error("parsed zero existing entries out of explorations.ts — refusing to write");
  }
  if (before.includes(slug)) {
    throw new Error(`"${slug}" is already in the registry`);
  }

  const cut = at + REGISTRY_ANCHOR.length;
  const next = source.slice(0, cut) + entry + "\n" + source.slice(cut);

  const after = registrySlugs(next);
  if (after.length !== before.length + 1) {
    throw new Error(
      `entry count went ${before.length} -> ${after.length}, expected ${before.length + 1}`
    );
  }
  if (after[0] !== slug) {
    throw new Error(`new entry did not land at the head (head is "${after[0]}")`);
  }
  const lost = before.filter((s, i) => after[i + 1] !== s);
  if (lost.length > 0) {
    throw new Error(`insertion displaced existing entries: ${lost.join(", ")}`);
  }
  return next;
}

// ── Update navigation links ────────────────────────────────────────
/*
 * Point the chronologically previous post's "next" link at the post we just
 * published.
 *
 * This used to open with `if (prevContent.includes("nextSlug=")) return;`.
 * That one line is what severed the site's reading chain. When the previously
 * newest post was a series part that already carried a next link to its
 * sibling, the newly published post silently never received a backlink, and
 * every post behind it dropped off the chain. It left 275 of 322 posts
 * unreachable by "next".
 *
 * Can a chronological next link and a series-sibling next link coexist on the
 * same page? No. ExplorationLayout renders exactly one `nextSlug`, so a page
 * can advertise exactly one "read this next" destination. The two only agree
 * when the series sibling happens to be the very next post published.
 *
 * When they disagree, the CHRONOLOGICAL link wins. It is the site's reading
 * spine and the only link that keeps every published post reachable from every
 * earlier one. A series link that overwrites it orphans every post published
 * between the two parts, which is exactly how the chain broke. Nothing is lost
 * by demoting the series link: the series relationship is still carried by the
 * "Continue to Part II" prose link inside the article body and by the
 * `seriesLabel` prop.
 *
 * Consequence for callers: run updateSeriesPartNavigation() BEFORE this, so
 * that when both target the same page the chronological link is written last
 * and wins. publishSeriesPart() already orders them that way.
 *
 * The function is idempotent: it strips whatever next* props are already there
 * and rewrites them, so a rerun produces a byte-identical file.
 */
function updateNavigation(topic, currentNewestSlug, readTime) {
  if (!currentNewestSlug) return;
  if (currentNewestSlug === topic.slug) return; // never self-link

  const prevPagePath = path.join(
    ROOT, "src", "app", "explorations", currentNewestSlug, "page.tsx"
  );
  if (!fs.existsSync(prevPagePath)) return;

  const original = fs.readFileSync(prevPagePath, "utf-8");

  // Locate the <ExplorationLayout ...> opening tag by scanning characters and
  // tracking string literals plus {} depth. The old regex assumed a fixed prop
  // order ending in "\n    >", and silently no-oped on the many pages whose tag
  // closes as "><p>" or that carry audioSrc/seriesLabel in a different spot.
  const tagStart = original.indexOf("<ExplorationLayout");
  if (tagStart === -1) {
    console.warn(`WARNING: No <ExplorationLayout> found in ${currentNewestSlug}/page.tsx — navigation link will be missing.`);
    return;
  }
  const bodyStart = tagStart + "<ExplorationLayout".length;
  let bodyEnd = -1;
  let depth = 0;
  let quote = null;
  for (let i = bodyStart; i < original.length; i++) {
    const c = original[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'" || c === "`") {
      quote = c;
    } else if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) {
      bodyEnd = i;
      break;
    }
  }
  if (bodyEnd === -1) {
    console.warn(`WARNING: Could not find the end of the <ExplorationLayout> tag in ${currentNewestSlug}/page.tsx — navigation link will be missing.`);
    return;
  }

  // Drop any next* props already present: a stale series link, or a rerun.
  let body = original.slice(bodyStart, bodyEnd);
  const NEXT_PROPS = [
    "nextSlug", "nextTitle", "nextSubtitle",
    "nextCategory", "nextCategoryColor", "nextImage", "nextReadTime",
  ];
  for (const name of NEXT_PROPS) {
    body = body.replace(new RegExp(`(?:\\r?\\n[ \\t]*|[ \\t]+)${name}="[^"]*"`, "g"), "");
  }

  const imageExists = fs.existsSync(path.join(ROOT, "public", "images", "explorations", `${topic.slug}.webp`));
  const props = [
    `nextSlug="${topic.slug}"`,
    `nextTitle="${escapeJsx(topic.title)}"`,
    `nextSubtitle="${escapeJsx(topic.subtitle)}"`,
    `nextCategory="${escapeJsx(topic.category)}"`,
    `nextCategoryColor="${topic.color}"`,
    ...(imageExists ? [`nextImage="/images/explorations/${topic.slug}.webp"`] : []),
    `nextReadTime="${readTime}"`,
  ];

  // Insert after the last of these anchor props, reusing its indentation so the
  // nav block lines up with the rest of the tag.
  let anchor = null;
  for (const re of [
    /\r?\n([ \t]*)prevTitle="[^"]*"/g,
    /\r?\n([ \t]*)wordCount=\{[^}]*\}/g,
    /\r?\n([ \t]*)readTime="[^"]*"/g,
    /\r?\n([ \t]*)categoryColor="[^"]*"/g,
  ]) {
    let last = null;
    for (const m of body.matchAll(re)) last = m;
    if (last) {
      anchor = { end: last.index + last[0].length, indent: last[1] };
      break;
    }
  }
  if (!anchor) {
    console.warn(`WARNING: No anchor prop to insert next-navigation after in ${currentNewestSlug}/page.tsx — navigation link will be missing.`);
    return;
  }

  const block = props.map((p) => `\n${anchor.indent}${p}`).join("");
  const updated =
    original.slice(0, bodyStart) +
    body.slice(0, anchor.end) + block + body.slice(anchor.end) +
    original.slice(bodyEnd);

  if (updated === original) {
    console.log(`Navigation in ${currentNewestSlug}/page.tsx already points at ${topic.slug}.`);
    return;
  }
  fs.writeFileSync(prevPagePath, updated);
  console.log(`Updated navigation in ${currentNewestSlug}/page.tsx → ${topic.slug}`);
}

// ── Update series part navigation (link previous part → this part) ───
function updateSeriesPartNavigation(prevPartSlug, nextPartTopic, nextPartReadTime) {
  const prevPagePath = path.join(
    ROOT, "src", "app", "explorations", prevPartSlug, "page.tsx"
  );
  if (!fs.existsSync(prevPagePath)) {
    console.warn(`WARNING: Previous series part page not found: ${prevPartSlug}`);
    return;
  }

  let prevContent = fs.readFileSync(prevPagePath, "utf-8");

  // If it already has nextSlug, replace it (might point to a non-series exploration)
  if (prevContent.includes("nextSlug=")) {
    // Replace existing next navigation props with series part links
    prevContent = prevContent.replace(
      /\n\s+nextSlug="[^"]*"\n\s+nextTitle="[^"]*"(?:\n\s+nextSubtitle="[^"]*")?(?:\n\s+nextCategory="[^"]*")?(?:\n\s+nextCategoryColor="[^"]*")?(?:\n\s+nextImage="[^"]*")?(?:\n\s+nextReadTime="[^"]*")?/,
      buildNextNavProps(nextPartTopic, nextPartReadTime)
    );
  } else {
    // Insert next navigation props (same approach as updateNavigation)
    const before = prevContent;
    const nextProps = buildNextNavProps(nextPartTopic, nextPartReadTime);
    prevContent = prevContent.replace(
      /([ \t]+)(readTime="[^"]*"(?:\n[ \t]+wordCount=\{[^}]+\})?(?:\n[ \t]+audioSrc="[^"]*")?(?:\n[ \t]+prevSlug="[^"]*"\n[ \t]+prevTitle="[^"]*")?)\n([ \t]+)>/,
      `$1$2${nextProps}\n$3>`
    );
    if (prevContent === before) {
      console.warn(`WARNING: Could not insert series next-navigation into ${prevPartSlug}/page.tsx`);
      return;
    }
  }

  fs.writeFileSync(prevPagePath, prevContent);
  console.log(`Updated series navigation: ${prevPartSlug} → ${nextPartTopic.slug}`);
}

function buildNextNavProps(topic, readTime) {
  const imageExists = fs.existsSync(path.join(ROOT, "public", "images", "explorations", `${topic.slug}.webp`));
  const props = [
    `nextSlug="${topic.slug}"`,
    `nextTitle="${escapeJsx(topic.title)}"`,
    `nextSubtitle="${escapeJsx(topic.subtitle)}"`,
    `nextCategory="${escapeJsx(topic.category)}"`,
    `nextCategoryColor="${topic.color}"`,
    ...(imageExists ? [`nextImage="/images/explorations/${topic.slug}.webp"`] : []),
    `nextReadTime="${readTime}"`,
  ];
  return "\n      " + props.join("\n      ");
}

// ── Auto-replenish topics (for every 1 used, add 2 new) ─────────────
async function replenishTopics(usedTopic, existingSlugs) {
  console.log("Replenishing topic bank (adding 2 new topics)...");

  const topicsPath = path.join(__dirname, "topics.json");
  const topicBank = JSON.parse(fs.readFileSync(topicsPath, "utf-8"));
  const allSlugs = [...existingSlugs, ...topicBank.map((t) => t.slug)];

  try {
    const response = await anthropic.messages.create({
      model: MODELS.fast,
      max_tokens: 3000,
      system: `You are the creative mind behind Foxfire, a website that explores the margins of human knowledge — history, science, art, philosophy, politics, the strange, and the beautiful. Generate 2 new topic ideas that are different from the topic just used but in a similar spirit of deep curiosity. Focus on lesser-known history, forgotten events, hidden science, political philosophy, and the wonderfully strange. Be specific and vivid.

Return ONLY a JSON array of 2 objects, each with: slug, title, subtitle, category, color, description, imagePrompt, essayPrompt.
Colors: ${COLORS.join(", ")}
Do not use any of these existing slugs: ${allSlugs.join(", ")}`,
      messages: [
        {
          role: "user",
          content: `The topic just used was: "${usedTopic.title}" (${usedTopic.category}). Generate 2 new topics that would appeal to readers who enjoyed this one. Go in unexpected directions — related but surprising. Return ONLY the JSON array.`,
        },
      ],
    });

    const text = response.content[0].text.trim();
    let newTopics;
    try {
      newTopics = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) newTopics = JSON.parse(jsonMatch[0]);
      else throw new Error("Could not parse new topics JSON");
    }

    // Filter out duplicates and invalid slugs
    const usedSlugsSet = new Set(allSlugs);
    const validNew = newTopics.filter((t) => {
      if (!t.slug || usedSlugsSet.has(t.slug)) return false;
      try { validateSlug(t.slug); return true; }
      catch { console.warn(`Skipping replenished topic with invalid slug: "${t.slug}"`); return false; }
    });

    if (validNew.length > 0) {
      topicBank.push(...validNew);
      // Atomic write: backup, write to tmp, then rename
      if (fs.existsSync(topicsPath)) {
        fs.copyFileSync(topicsPath, topicsPath + ".bak");
      }
      const tmpPath = topicsPath + ".tmp";
      fs.writeFileSync(tmpPath, JSON.stringify(topicBank, null, 2) + "\n");
      fs.renameSync(tmpPath, topicsPath);
      console.log(`Added ${validNew.length} new topics to bank (total: ${topicBank.length})`);

      // Commit the updated topics.json
      try {
        safeGitAdd(["scripts/topics.json"]);
        safeGitCommit(`Replenish topic bank (+${validNew.length} topics)`);
        console.log("Committed updated topics.json");
      } catch {
        // Non-fatal — topics will be committed next run
      }
    }
  } catch (err) {
    console.warn(`Topic replenishment failed (non-fatal): ${err.message?.substring(0, 200)}`);
  }
}

// ── Git commit ──────────────────────────────────────────────────────
function gitCommit(topic, currentNewestSlug = null) {
  try {
    if (process.env.CI) {
      execSync('git config user.name "Foxfire Auto-Explore"', { cwd: ROOT, stdio: "pipe" });
      execSync('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"', { cwd: ROOT, stdio: "pipe" });
    }
    // Explicit file paths instead of git add -A
    const filesToAdd = [
      `src/app/explorations/${topic.slug}/page.tsx`,
      "src/data/explorations.ts",
    ];
    const imgPath = `public/images/explorations/${topic.slug}.webp`;
    if (fs.existsSync(path.join(ROOT, imgPath))) filesToAdd.push(imgPath);
    if (fs.existsSync(SERIES_QUEUE_PATH)) filesToAdd.push(SERIES_QUEUE_PATH);
    // Add the previous exploration's page if we updated its navigation
    if (currentNewestSlug) {
      filesToAdd.push(`src/app/explorations/${currentNewestSlug}/page.tsx`);
    }
    safeGitAdd(filesToAdd);
    const msg = `Add exploration: ${topic.title}\n\nAuto-generated by Foxfire auto-explore script.\nFormat: ${topic.format}\n\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`;
    safeGitCommit(msg);
    console.log("Committed to git.");
  } catch (err) {
    console.warn("Git commit failed:", err.message);
  }
}

// ── Safe shell helpers ──────────────────────────────────────────────
function safeGitCommit(message, { cwd = ROOT } = {}) {
  execFileSync("git", ["commit", "-m", message], { cwd, stdio: "pipe" });
}

function safeGitAdd(files, { cwd = ROOT } = {}) {
  execFileSync("git", ["add", ...files], { cwd, stdio: "pipe" });
}

function safeEdgeTts(inputFile, voice, outputFile) {
  execFileSync("edge-tts", ["--file", inputFile, "--voice", voice, "--write-media", outputFile], {
    cwd: ROOT,
    stdio: "pipe",
    timeout: 600_000,
  });
}

// Validate slug is safe (alphanumeric + hyphens only)
function validateSlug(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`Invalid slug format: "${slug}" — must be lowercase alphanumeric with hyphens only`);
  }
}

// ── Helpers ─────────────────────────────────────────────────────────
function slugToComponentName(slug) {
  const name = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  return /^\d/.test(name) ? `E${name}` : name;
}

/**
 * Escape a value for use inside a double-quoted JSX attribute.
 *
 * JSX attribute values are not JS string literals — the compiler does not
 * process backslash escapes, but it does decode HTML entities. So `\"` does not
 * escape anything; it ends the attribute early and the file no longer compiles.
 * The whole queue would stall on the first title containing a double quote.
 * Entities are the only correct encoding here, matching publish-from-queue.
 *
 * `&` has to go first, or it would re-escape the ampersands the later
 * replacements introduce. Backslashes are left alone because a backslash in a
 * JSX attribute is already just a backslash; doubling it printed two.
 */
function escapeJsx(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/[\r\n]+/g, " ")
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/—/g, "&mdash;")
    .replace(/–/g, "&ndash;");
}

function escapeJs(str) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

function indentContent(content, spaces) {
  const indent = " ".repeat(spaces);
  return content
    .split("\n")
    .map((line) => (line.trim() ? indent + line : ""))
    .join("\n");
}

// ── Dedupe gate self-test ───────────────────────────────────────────
// `node scripts/auto-explore.mjs --dedupe-selftest`
// Proves the gate against the real published corpus. No API keys needed.
function runDedupeSelfTest() {
  const failures = [];
  const check = (label, condition, detail) => {
    console.log(`${condition ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
    if (!condition) failures.push(label);
  };

  const corpus = loadCorpusFingerprints();
  const queuedCount = corpus.filter((c) => c.origin === "queued").length;
  console.log(`\nCorpus: ${corpus.length} explorations fingerprinted (${corpus.length - queuedCount} published, ${queuedCount} queued).\n`);
  const bySlug = (slug) => corpus.find((c) => c.slug === slug);

  // Rebuild a proposal the way chooseTopic would hand one to us.
  const asTopic = (post, researchNeeds = "") => ({
    slug: post.slug, title: post.title, subtitle: post.subtitle,
    description: post.description, researchNeeds,
  });
  // Stand-in for the researchNeeds paragraph a real proposal carries: the
  // opening of the piece, which is what a research brief for it would describe.
  const sourcePath = (post) => post.origin === "queued"
    ? path.join(ROOT, "queued", `${post.slug}.tsx`)
    : path.join(ROOT, "src", "app", "explorations", post.slug, "page.tsx");
  const researchProxy = (post, words = 160) =>
    extractPageProse(fs.readFileSync(sourcePath(typeof post === "string" ? bySlug(post) : post), "utf-8"))
      .split(/\s+/).filter(Boolean).slice(0, words).join(" ");
  const without = (slug) => corpus.filter((c) => c.slug !== slug);

  // ── 1. Corpus-wide distribution ─────────────────────────────────
  console.log("── Full-text vs full-text Jaccard across all corpus pairs ──");
  const pairScores = [];
  for (let i = 0; i < corpus.length; i++) {
    for (let j = i + 1; j < corpus.length; j++) pairScores.push(jaccard(corpus[i].fullFp, corpus[j].fullFp));
  }
  pairScores.sort((a, b) => a - b);
  const pct = (f) => pairScores[Math.floor(f * (pairScores.length - 1))];
  console.log(`  pairs=${pairScores.length}  median=${pct(0.5).toFixed(4)}  p99=${pct(0.99).toFixed(4)}  p999=${pct(0.999).toFixed(4)}  max=${pairScores[pairScores.length - 1].toFixed(4)}\n`);

  // ── 2. The known duplicate: full-text similarity ────────────────
  const dupA = bySlug("the-water-beneath-ontario");
  const dupB = bySlug("the-water-that-remembers");
  if (!dupA || !dupB) {
    check("known duplicate pair present in corpus", false, "the-water-beneath-ontario / the-water-that-remembers missing");
    return false;
  }
  const dupJaccard = jaccard(dupA.fullFp, dupB.fullFp);
  const shared = [...dupA.fullFp].filter((t) => dupB.fullFp.has(t));
  console.log("── Known duplicate: the-water-beneath-ontario vs the-water-that-remembers ──");
  console.log(`  shared distinctive terms (${shared.length}): ${shared.slice(0, 24).join(", ")}\n`);
  check("known duplicate scores above the full-text threshold", dupJaccard >= DEDUPE_FULL_JACCARD,
    `Jaccard ${dupJaccard.toFixed(4)} >= ${DEDUPE_FULL_JACCARD} (corpus p99 ${pct(0.99).toFixed(4)})`);

  // ── 3. The gate would have caught it at topic-choice time ───────
  const metaOnly = findTopicCollision(asTopic(dupB), without(dupB.slug));
  check("gate rejects the duplicate from metadata alone", Boolean(metaOnly) && metaOnly.slug === dupA.slug,
    metaOnly ? `collides with ${metaOnly.slug} [${metaOnly.reasons.join("; ")}], proposal fingerprint ${metaOnly.subjectTerms} terms` : "no collision found");

  const withResearch = findTopicCollision(asTopic(dupB, researchProxy(dupB.slug)), without(dupB.slug));
  check("gate rejects the duplicate from a research-rich proposal", Boolean(withResearch) && withResearch.slug === dupA.slug,
    withResearch ? `collides with ${withResearch.slug} [${withResearch.reasons.join("; ")}], proposal fingerprint ${withResearch.subjectTerms} terms` : "no collision found");

  // ── 4. Negative control: unrelated posts must not flag ──────────
  console.log("\n── Corpus sweep: every published and queued post replayed as a proposal ──");
  const flaggedSweep = [];
  for (const post of corpus) {
    const collision = findTopicCollision(asTopic(post, researchProxy(post.slug)), without(post.slug));
    if (collision) flaggedSweep.push([post.slug, collision]);
  }
  console.log(`  ${flaggedSweep.length} of ${corpus.length} replayed proposals flagged (${((flaggedSweep.length / corpus.length) * 100).toFixed(1)}%):`);
  for (const [slug, c] of flaggedSweep.sort((a, b) => b[1].severity - a[1].severity)) {
    console.log(`    ${slug}  ->  ${c.slug} (${c.origin})  [${c.reasons.join("; ")}]`);
  }
  console.log("");
  check("false-positive rate stays low on the real corpus", flaggedSweep.length / corpus.length < 0.10,
    `${flaggedSweep.length}/${corpus.length} flagged`);

  for (const slug of ["numbers-stations", "dead-reckoning", "hiroo-onoda"]) {
    const post = bySlug(slug);
    if (!post) continue;
    const collision = findTopicCollision(asTopic(post, researchProxy(slug)), without(slug));
    check(`unrelated topic passes: ${slug}`, collision === null,
      collision ? `unexpectedly collided with ${collision.slug} [${collision.reasons.join("; ")}]` : "no collision");
  }
  // Two posts that share a subject area without sharing a subject. If the gate
  // were merely topic-matching rather than subject-matching, this pair would trip.
  const unrelatedA = bySlug("dead-reckoning");
  const unrelatedB = bySlug("the-longitude-problem");
  if (unrelatedA && unrelatedB) {
    const j = jaccard(unrelatedA.fullFp, unrelatedB.fullFp);
    const c = containment(unrelatedA.fullFp, unrelatedB.fullFp);
    check("known-good unrelated pair scores below threshold", j < DEDUPE_FULL_JACCARD && c < DEDUPE_CONTAINMENT,
      `dead-reckoning vs the-longitude-problem (both maritime navigation): Jaccard ${j.toFixed(4)}, overlap ${c.toFixed(4)}`);
  }

  // ── 5. Series control: siblings must never flag each other ──────
  const partA = bySlug("the-manhattan-project-part-3");
  const partB = bySlug("the-manhattan-project-part-4");
  if (partA && partB) {
    const rawJaccard = jaccard(partA.fullFp, partB.fullFp);
    const rawContainment = containment(fingerprint(topicSubjectText(asTopic(partB, researchProxy(partB.slug)))), partA.fullFp);
    console.log("\n── Series control ──");
    console.log(`  "${partA.title}"`);
    console.log(`  "${partB.title}"`);
    check("series siblings would trip the raw score (so the exemption is load-bearing)",
      rawJaccard >= DEDUPE_FULL_JACCARD || rawContainment >= DEDUPE_CONTAINMENT,
      `raw Jaccard ${rawJaccard.toFixed(4)}, raw overlap ${rawContainment.toFixed(4)}`);
    check("series siblings are recognised as the same series", isSameSeries(partA.title, partB.title),
      `base title "${seriesBaseTitle(partA.title)}"`);
    const seriesCollision = findTopicCollision(asTopic(partB, researchProxy(partB.slug)), without(partB.slug));
    check("series part is not flagged as a duplicate", seriesCollision === null,
      seriesCollision ? `unexpectedly collided with ${seriesCollision.slug} [${seriesCollision.reasons.join("; ")}]` : "no collision");
    check("a non-sibling with a similar title is still compared",
      !isSameSeries(partB.title, "The Congo Free State: The Rubber Terror (Part II of III)"),
      "different series bases are not exempted from each other");
  }

  console.log(`\n${failures.length === 0 ? "All dedupe self-tests passed." : `${failures.length} self-test(s) FAILED: ${failures.join(", ")}`}\n`);
  return failures.length === 0;
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  console.log(`\n${"═".repeat(60)}`);
  console.log(`Foxfire Auto-Exploration`);
  console.log(`${new Date().toISOString()}`);
  console.log(`${"═".repeat(60)}\n`);

  const existingSlugs = getExistingExplorations();
  console.log(`${existingSlugs.length} existing explorations.\n`);

  // ── Check series queue for ready parts ──────────────────────────
  const queue = loadSeriesQueue();
  const readyPart = findReadySeriesPart(queue);

  if (readyPart) {
    console.log(`Series queue: found ready part — "${readyPart.part.topic.title}" (ready after ${readyPart.part.readyAfter})`);
    const publishedTopic = await publishSeriesPart(readyPart.series, readyPart.part, existingSlugs);

    // Replenish topic bank after series part too
    await replenishTopics(publishedTopic, existingSlugs);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nDone in ${elapsed}s. Published series part: "${publishedTopic.title}"\n`);
    return;
  }

  if (queue.length > 0) {
    console.log(`Series queue: ${queue.reduce((n, s) => n + s.parts.length, 0)} part(s) pending but none ready yet.`);
  }

  // ── Check for priority topic ────────────────────────────────────
  const priorityPath = path.join(__dirname, ".priority-topic.json");
  let topic;

  if (fs.existsSync(priorityPath)) {
    try {
      const priority = JSON.parse(fs.readFileSync(priorityPath, "utf-8"));
      const topicsPath = path.join(__dirname, "topics.json");
      const topicBank = JSON.parse(fs.readFileSync(topicsPath, "utf-8"));
      const match = topicBank.find((t) => t.slug === priority.slug);
      if (match && !existingSlugs.includes(match.slug)) {
        validateSlug(match.slug);
        topic = { ...match, format: match.format || "essay", researchNeeds: match.essayPrompt };
        console.log(`Priority topic found: "${topic.title}" — using it next.`);
        // A priority topic is a deliberate human choice, so the gate warns
        // rather than blocks. It still runs, so the overlap is on the record.
        const priorityCollision = findTopicCollision(topic);
        if (priorityCollision) {
          console.warn(
            `Dedupe gate WARNING: priority topic "${topic.title}" overlaps "${priorityCollision.title}" ` +
            `(/explorations/${priorityCollision.slug}). Signals: ${priorityCollision.reasons.join("; ")}. Proceeding anyway.`
          );
        }
        fs.unlinkSync(priorityPath); // consume it
      } else {
        console.log(`Priority topic "${priority.slug}" already published or not found. Ignoring.`);
        fs.unlinkSync(priorityPath);
      }
    } catch (err) {
      console.warn(`Could not load priority topic: ${err.message}`);
    }
  }

  // ── Normal flow: Claude chooses its own topic ───────────────────
  if (!topic) {
    topic = await chooseUniqueTopic(existingSlugs);
    if (!topic) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\nDone in ${elapsed}s. No exploration published — every proposed topic duplicated an existing one.\n`);
      return;
    }
  }
  console.log(`\nChosen: "${topic.title}" [${topic.category}] (${topic.format})\n`);

  // ── Series topic: generate all parts at once ────────────────────
  if (topic.series) {
    console.log(`This is a ${topic.series.totalParts}-part series. Generating all parts...`);

    const parts = await generateSeriesParts(topic, existingSlugs);

    // Publish part 1 immediately
    const part1 = parts[0];
    const part1Topic = part1.topic;

    // Pull latest before modifying shared files
    if (process.env.CI) {
      try {
        execSync('git config user.name "Foxfire Auto-Explore"', { cwd: ROOT, stdio: "pipe" });
        execSync('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"', { cwd: ROOT, stdio: "pipe" });
        console.log("Pulling latest from remote before updating index files...");
        execSync("git fetch origin main", { cwd: ROOT, stdio: "pipe" });
        execSync("git reset --hard origin/main", { cwd: ROOT, stdio: "pipe" });
      } catch (err) {
        console.error(`Git fetch/reset failed: ${err.message?.substring(0, 200)}`);
        console.log("Continuing anyway — push step will retry with rebase...");
      }
    }

    // Create page, update indexes, navigation for part 1
    const { readTime, currentNewestSlug } = createPage(part1Topic, part1.pageContent, part1.audioUrl);
    updateIndexPages(part1Topic, readTime);
    updateNavigation(part1Topic, currentNewestSlug, readTime);

    // Save remaining parts to the series queue with staggered readyAfter dates
    const now = new Date();
    const queuedParts = parts.slice(1).map((p, i) => {
      const prevPart = parts[i]; // parts[0] for the first queued (which is parts[1]), etc.
      const readyDate = new Date(now);
      readyDate.setDate(readyDate.getDate() + SERIES_PART_GAP_DAYS * (i + 1));
      return {
        partNumber: p.partNumber,
        slug: p.slug,
        pageContent: p.pageContent,
        audioUrl: p.audioUrl,
        topic: p.topic,
        prevPartSlug: prevPart.slug,
        prevPartTitle: prevPart.topic.title,
        readyAfter: readyDate.toISOString(),
      };
    });

    if (queuedParts.length > 0) {
      const updatedQueue = loadSeriesQueue();
      updatedQueue.push({
        seriesSlug: topic.slug,
        seriesTitle: topic.title,
        totalParts: topic.series.totalParts,
        parts: queuedParts,
      });
      saveSeriesQueue(updatedQueue);
      console.log(`Queued ${queuedParts.length} series parts for future publication.`);
      queuedParts.forEach((p) => {
        console.log(`  Part ${p.partNumber}: "${p.topic.title}" — ready after ${p.readyAfter}`);
      });
    }

    // Stage images for queued series parts so they exist in future CI clones
    const queuedImageFiles = parts.slice(1)
      .map((p) => `public/images/explorations/${p.slug}.webp`)
      .filter((imgPath) => fs.existsSync(path.join(ROOT, imgPath)));
    if (queuedImageFiles.length > 0) {
      safeGitAdd(queuedImageFiles);
      console.log(`Staged ${queuedImageFiles.length} images for queued series parts.`);
    }

    // Commit (include series queue file + queued part images)
    gitCommit(part1Topic, currentNewestSlug);

    // Replenish topic bank
    await replenishTopics(part1Topic, existingSlugs);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nDone in ${elapsed}s. Published series part 1: "${part1Topic.title}" (${parts.length - 1} parts queued)\n`);
    return;
  }

  // ── Normal (non-series) flow ────────────────────────────────────
  // Step 2: Research + image generation in parallel
  const [research] = await Promise.all([
    researchTopic(topic).catch((err) => {
      console.warn(`Research failed (non-fatal): ${err.message?.substring(0, 100)}`);
      return "";
    }),
    generateImage(topic).catch((err) => {
      console.warn(`Image generation failed (non-fatal): ${err.message?.substring(0, 100)}`);
    }),
  ]);

  // Step 3: Write the piece
  const content = await writePiece(topic, research);

  // Step 4: Generate audio narration and upload to Vercel Blob
  let audioUrl = null;
  try {
    audioUrl = await generateAudio(topic, content);
  } catch (err) {
    console.warn(`Audio generation failed (non-fatal): ${err.message?.substring(0, 200)}`);
  }

  // Step 5: Pull latest before modifying shared files (prevents merge conflicts)
  if (process.env.CI) {
    try {
      execSync('git config user.name "Foxfire Auto-Explore"', { cwd: ROOT, stdio: "pipe" });
      execSync('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"', { cwd: ROOT, stdio: "pipe" });
      console.log("Pulling latest from remote before updating index files...");
      // Fetch latest and reset tracked files to match remote (keeps untracked/new files)
      execSync("git fetch origin main", { cwd: ROOT, stdio: "pipe" });
      execSync("git reset --hard origin/main", { cwd: ROOT, stdio: "pipe" });
    } catch (err) {
      console.error(`Git fetch/reset failed: ${err.message?.substring(0, 200)}`);
      // Non-fatal — continue with current state, push step will handle conflicts
      console.log("Continuing anyway — push step will retry with rebase...");
    }
  }

  // Step 6: Create page, update indexes, navigation
  const { readTime, currentNewestSlug } = createPage(topic, content, audioUrl);
  updateIndexPages(topic, readTime);
  updateNavigation(topic, currentNewestSlug, readTime);

  // Step 7: Commit
  gitCommit(topic, currentNewestSlug);

  // Step 8: Replenish topic bank (add 2 new topics for every 1 used)
  await replenishTopics(topic, existingSlugs);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s. New exploration: "${topic.title}" (${topic.format})\n`);
}

main().catch((err) => {
  console.error("Auto-explore failed:", err);
  process.exit(1);
});
