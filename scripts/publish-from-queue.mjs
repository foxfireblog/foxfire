#!/usr/bin/env node

/**
 * Publish one pre-generated exploration from the backlog queue.
 *
 * These posts were written between March and July 2026 by a local generator
 * that never pushed. They were audited in docs/backlog-audit-2026-07-27.md;
 * the 124 that passed live in queued/ and are released one at a time on the
 * same pacing gate the generator used. Publishing from the queue costs
 * nothing — no model calls, no image generation.
 *
 * The page files are already complete. This script moves one into place
 * byte-for-byte and only rewrites its navigation props, so the prose,
 * citations, and metadata are exactly what the audit approved.
 *
 * Usage: node scripts/publish-from-queue.mjs [--force] [--dry-run]
 *        node scripts/publish-from-queue.mjs --dedupe-report
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import {
  loadCorpusFingerprints, findTopicCollision, pageAsProposal,
  DEDUPE_CONTAINMENT, DEDUPE_FULL_JACCARD,
} from "./dedupe.mjs";
import { upsertIndexEntry, INDEX_FILE } from "./search-index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const QUEUE_DIR = path.join(ROOT, "queued");
const QUEUE_FILE = path.join(__dirname, "publish-queue.json");
const DATA_FILE = path.join(ROOT, "src", "data", "explorations.ts");

const FORCE = process.argv.includes("--force");
const DRY = process.argv.includes("--dry-run");
const DEDUPE_REPORT = process.argv.includes("--dedupe-report");

// Same pacing rules as the generator. Keep these in sync with auto-explore.mjs.
const MIN_GAP_HOURS = 24;
const MAX_GAP_HOURS = 72;
const PACING_CURVE = 1.5;

const stamp = () => `[${new Date().toISOString()}]`;
const git = (args) => execFileSync("git", args, { cwd: ROOT, stdio: ["pipe", "pipe", "pipe"] }).toString();

function readQueue() {
  if (!fs.existsSync(QUEUE_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8"));
  } catch (err) {
    console.error(`Queue file is unreadable: ${err.message}`);
    process.exit(1);
  }
}

const writeQueue = (q) => fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 2) + "\n");

/** Loud in the Actions UI (red annotation on the run) without failing the job. */
function annotate(message) {
  console.error(process.env.GITHUB_ACTIONS ? `::error::${message}` : `ERROR: ${message}`);
}

function configureGitIdentity() {
  if (!process.env.CI) return;
  git(["config", "user.name", "Foxfire Auto-Explore"]);
  git(["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
}

/**
 * Drop the head of the queue, commit that, and let the run finish successfully.
 *
 * A queue entry can be unpublishable in two ways — its staged page is gone, or
 * its slug is already live — and neither is fixable by retrying. The intent has
 * always been "drop it and move on", but both branches used to write the
 * shortened queue and then exit 1. In CI that kills the job before the push
 * step, so the ephemeral checkout is thrown away with the repair still in it:
 * the worktree queue loses the slug while the committed queue never does, and
 * the next run hits the same entry. Eight loud failures a day, forever.
 *
 * So the repair is committed here, and the process exits 0 so the workflow's
 * remaining steps (tsc, push) actually run and persist it.
 *
 * On the exit code: exiting non-zero would make the alert louder and the repair
 * impossible, which is exactly the trade being reversed. Visibility comes from
 * the ::error:: annotation instead, which lands on the run summary — the thing
 * a human actually reads — and from a commit that names the dropped slug. A
 * genuine error, meaning anything that is not this self-healing case, still
 * exits 1 as before: an unreadable queue file, a failed date stamp, a registry
 * insertion that would displace existing entries. Those must not be papered
 * over, and none of them are repaired by dropping a slug.
 *
 * Publishing waits for the next scheduled run. That is deliberate: the run is
 * already in an unexpected state, and the site posts on a 24-72h gate against a
 * queue with eight cycles a day, so a skipped cycle costs nothing while a
 * "keep going until something works" loop could silently drain the backlog.
 */
function dropFromQueue(queue, slug, reason) {
  annotate(`Unpublishable queue entry "${slug}": ${reason}. Dropping it from the queue.`);
  if (DRY) {
    console.log(`  [dry run] would drop "${slug}" from the queue and commit that change.`);
    return;
  }
  writeQueue(queue.slice(1));
  try {
    configureGitIdentity();
    git(["add", "--", "scripts/publish-queue.json"]);
    // The subject must not start with "Add exploration:" — that prefix is the
    // pacing anchor, and a repair is not a post.
    git(["commit", "-q", "-m",
      `Drop unpublishable queue entry: ${slug}\n\n${reason}\nAutomated repair by scripts/publish-from-queue.mjs.`]);
    console.log(`  Committed the queue repair. ${queue.length - 1} entries remain.`);
  } catch (err) {
    // Nothing is lost if this fails: the entry is still bad, and the next run
    // takes the same branch again. Do not escalate to a non-zero exit.
    console.warn("  Could not commit the queue repair:", err.message);
  }
}

// ── Pre-publish dedupe gate ─────────────────────────────────────────
/**
 * Refuse to publish a queued post that covers a subject already on the site.
 *
 * The subject-level gate in auto-explore.mjs guards the wrong door on its own.
 * It stops the generator proposing a topic the archive already has, but
 * generation is paused: for the next seven months the only thing publishing is
 * this script, draining a backlog written months ago by a generator that had no
 * such gate. Those 121 posts were written blind to each other and to the
 * archive, which is exactly the condition the gate exists for. Five collisions
 * were already cut out of the queue by hand on 2026-07-27, and nothing was
 * watching for the sixth.
 *
 * So the same check runs here, one step earlier than "before we spend an API
 * call": before we spend a slot on the front page.
 *
 * Compared against the published archive only, not the rest of the queue. Two
 * queued posts on one subject should cost one publish, not zero: whichever
 * reaches the head first goes out, and the second is dropped when it comes up
 * and finds the first live. Blocking on queued siblings would lose both.
 *
 * The scoring, the thresholds and the series exemption are auto-explore.mjs's,
 * imported from scripts/dedupe.mjs rather than restated — a second copy of
 * 0.22/0.26/0.25 would drift, and a threshold that drifts here silently deletes
 * posts. See dedupe.mjs for how a written page is replayed as a proposal.
 */
function findPublishedCollisions(slug, src, corpus) {
  const topic = pageAsProposal(slug, src);
  let pool = corpus.filter((c) => c.origin === "published");
  const titleOnly = [];

  // findTopicCollision reports only the single worst match, so a real duplicate
  // can hide behind a louder title coincidence. Take matches off the pool until
  // one of them is body-supported or the pool is clean.
  for (;;) {
    const c = findTopicCollision(topic, pool);
    if (!c) return { blocking: null, titleOnly };
    if (bodySupported(c)) return { blocking: c, titleOnly };
    titleOnly.push(c);
    pool = pool.filter((p) => p.slug !== c.slug);
  }
}

/**
 * Does the prose agree, or is it only the titles that rhyme?
 *
 * The gate has three signals and auto-explore.mjs lets any one of them reject a
 * topic, which is right for a topic: a proposal is a paragraph of metadata, so
 * metadata is most of the evidence there is, and the cost of being wrong is one
 * re-roll of a cheap call.
 *
 * Here the costs are inverted. The post already exists, its three thousand
 * words are sitting in queued/, and a wrong answer deletes them. So the
 * metadata signal alone does not get to delete a written post — the body has to
 * agree, on the same DEDUPE_CONTAINMENT / DEDUPE_FULL_JACCARD numbers the
 * generator uses. Nothing is retuned; this only decides which signal is allowed
 * to be destructive.
 *
 * This is not hypothetical. Running the gate over the queue as written,
 * "the-next-supercontinent" collides with the published "the-hum" at metadata
 * Jaccard 0.400, on exactly two shared terms: "love" and "letter". Both
 * subtitles open "A love letter to" — three posts in the corpus do. One is
 * about plate tectonics and one is about an acoustic phenomenon nobody can
 * locate, and their bodies score 0.056 containment against a 0.26 threshold,
 * five times clear. A metadata-only drop would have thrown that essay away for
 * an idiom. The two genuine hits in the same pass both come in on the body
 * (0.365 and 0.263 containment) with metadata Jaccard of exactly 0.000, which
 * is the shape a real subject collision has: different words, same subject.
 *
 * A title-only hit still gets the ::error:: annotation, because two posts that
 * read alike in a list are worth a human's glance even when the essays differ.
 */
const bodySupported = (c) => c.containment >= DEDUPE_CONTAINMENT || c.fullJaccard >= DEDUPE_FULL_JACCARD;

const scoreLine = (c) =>
  `[proposal fingerprint ${c.subjectTerms} terms; Jaccard ${c.fullJaccard.toFixed(3)}, ` +
  `overlap ${c.containment.toFixed(3)}, title/subtitle ${c.metaJaccard.toFixed(3)}]`;

const collisionReason = (c) =>
  `same subject as the published "${c.title}" (${c.slug}) — ${c.reasons.join("; ")} ${scoreLine(c)}`;

/**
 * `--dedupe-report`: score the whole queue without touching anything.
 *
 * The gate below only ever sees the head of the queue, one entry per run, so a
 * collision buried at position 60 stays invisible for two months and then drops
 * on a Tuesday. This walks every entry against the published archive and prints
 * what would be dropped, which is the version a human can act on.
 */
function dedupeReport(queue) {
  const corpus = loadCorpusFingerprints();
  const publishedCount = corpus.filter((c) => c.origin === "published").length;
  console.log(`\nScoring ${queue.length} queued entries against ${publishedCount} published explorations.\n`);
  const hits = [];
  const warnings = [];
  let missing = 0;
  for (const slug of queue) {
    const stagedPath = path.join(QUEUE_DIR, `${slug}.tsx`);
    if (!fs.existsSync(stagedPath)) { missing++; continue; }
    const { blocking, titleOnly } = findPublishedCollisions(slug, fs.readFileSync(stagedPath, "utf-8"), corpus);
    if (blocking) hits.push([slug, blocking]);
    for (const c of titleOnly) warnings.push([slug, c]);
  }

  console.log("── Would be dropped (the body agrees) ──");
  if (hits.length === 0) console.log("  none");
  for (const [slug, c] of hits.sort((a, b) => b[1].severity - a[1].severity)) {
    console.log(`  ${slug}\n      -> ${c.slug}  ${scoreLine(c)}`);
  }

  console.log("\n── Would publish with a warning (titles rhyme, bodies do not) ──");
  if (warnings.length === 0) console.log("  none");
  for (const [slug, c] of warnings.sort((a, b) => b[1].severity - a[1].severity)) {
    console.log(`  ${slug}\n      -> ${c.slug}  ${scoreLine(c)}`);
  }

  console.log(
    `\n${hits.length} of ${queue.length} queued entries would be dropped, ${warnings.length} flagged` +
    `${missing ? `, ${missing} have no staged page and would be dropped as missing` : ""}.\n`
  );
  return hits.length;
}

// The queued pages are JSX, so their attribute values are HTML-entity encoded
// (&mdash;, &rsquo;, &amp;). The JSX compiler decodes those when it builds the
// page, but src/data/explorations.ts is plain JS — a string copied verbatim out
// of an attribute renders as the literal text "&mdash;" on the index card.
// Anything read out of a page must therefore be decoded back to real characters.
const NAMED_ENTITIES = {
  amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ",
  mdash: "—", ndash: "–", hellip: "…", middot: "·",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
  sbquo: "‚", bdquo: "„", laquo: "«", raquo: "»",
  deg: "°", times: "×", divide: "÷", plusmn: "±",
  frac12: "½", frac14: "¼", frac34: "¾", prime: "′",
  Prime: "″", dagger: "†", Dagger: "‡", bull: "•",
  copy: "©", reg: "®", trade: "™", sect: "§", para: "¶",
  eacute: "é", egrave: "è", ecirc: "ê", agrave: "à",
  aacute: "á", acirc: "â", iacute: "í", oacute: "ó",
  ocirc: "ô", ouml: "ö", uuml: "ü", auml: "ä",
  ntilde: "ñ", ccedil: "ç", szlig: "ß", aring: "å",
  oslash: "ø", ae: "æ", pound: "£", euro: "€", yen: "¥",
};

// One combined pattern, decoded in a single pass. That matters: a two-pass
// decoder that expands &amp; before named entities turns "&amp;mdash;" into an
// em dash instead of the literal text "&mdash;". Because replace() resumes
// scanning after each match, output is never re-read, so double-decoding
// cannot happen no matter what order the entities appear in.
const ENTITY_RE = /&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([a-zA-Z][a-zA-Z0-9]*));/g;

function fromCodePoint(code, original) {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return original;
  try {
    return String.fromCodePoint(code);
  } catch {
    return original;
  }
}

function decodeEntities(s) {
  if (s === null || s === undefined) return s;
  return String(s).replace(ENTITY_RE, (match, dec, hex, name) => {
    if (dec !== undefined) return fromCodePoint(Number(dec), match);
    if (hex !== undefined) return fromCodePoint(parseInt(hex, 16), match);
    const value = NAMED_ENTITIES[name] ?? NAMED_ENTITIES[name.toLowerCase()];
    return value === undefined ? match : value;
  });
}

/** Pull one attribute out of the ExplorationLayout props, as real characters. */
function attr(src, name) {
  const m = src.match(new RegExp(`\\b${name}="([^"]*)"`));
  return m ? decodeEntities(m[1]) : null;
}

/** Newest currently-published exploration, by registry order (newest first). */
function currentNewest() {
  const data = fs.readFileSync(DATA_FILE, "utf-8");
  const m = data.match(/export const explorations: Exploration\[\] = \[\s*\{\s*slug:\s*"([^"]+)"/);
  if (!m) return null;
  const slug = m[1];
  const page = path.join(ROOT, "src", "app", "explorations", slug, "page.tsx");
  if (!fs.existsSync(page)) return { slug, title: null };
  return { slug, title: attr(fs.readFileSync(page, "utf-8"), "title") };
}

/**
 * Replace a JSX string prop, or insert it before the closing `>` of the tag.
 *
 * The replacement is a function, not a string: values reach this from decoded
 * page attributes, and replace() expands `$&`, `` $` ``, `$'` and `$1` inside a
 * replacement *string*, which would silently splice chunks of the file into the
 * prop. A function replacement is taken literally.
 */
function setProp(src, name, value) {
  const v = String(value ?? "");
  const re = new RegExp(`(\\b${name}=")[^"]*(")`);
  if (re.test(src)) return src.replace(re, (_m, open, close) => `${open}${v}${close}`);
  return src.replace(
    /(\n\s*)>\n(\s*<)/,
    (_m, indent, tail) => `${indent}  ${name}="${v}"${indent}>\n${tail}`
  );
}

const removeProp = (src, name) => src.replace(new RegExp(`\\n\\s*${name}="[^"]*"`), "");
const escapeJs = (s) => String(s ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
/**
 * Attribute values live inside double quotes in JSX. Values arriving here have
 * already been decoded to real characters, so re-encode the ones that would
 * end the attribute or be re-read as markup. Dashes are encoded too — not for
 * correctness, but so the pages this script writes stay byte-consistent with
 * the rest of the corpus, which spells them &mdash;/&ndash;. `&` goes first or
 * it would mangle the entities the later replacements introduce.
 */
const escapeAttr = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/—/g, "&mdash;")
    .replace(/–/g, "&ndash;");

// ── Registry insertion ──────────────────────────────────────────────
const REGISTRY_ANCHOR = "export const explorations: Exploration[] = [\n";
const SLUG_LINE_RE = /^ {4}slug: "([^"]+)",$/gm;

const registrySlugs = (src) => [...src.matchAll(SLUG_LINE_RE)].map((m) => m[1]);

/**
 * Prepend an entry to the explorations array and prove nothing else moved.
 *
 * A generated commit once wrote a new entry *over* the two existing head
 * entries, and the two posts have been unreachable ever since. Nothing checked,
 * so nothing complained. This does the splice with indexOf/slice — no
 * replace(), so no `$&`/`$'` expansion — and then re-parses the result and
 * asserts the slug list is exactly the old list with the new slug in front.
 * Any other outcome aborts before a byte is written.
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

function pacingAllows() {
  if (FORCE) return true;
  let hours;
  try {
    // Anchor on the last actual publish, not the last commit that happened to
    // touch a page file. Pathspec matching counted the bulk WebP conversion
    // (332 pages in one commit) as "the last post" and slid the whole ramp by
    // 16.5 hours; any future sweep over the pages would do it again. Every
    // publish path — this script, auto-explore, series parts — writes a commit
    // subject starting "Add exploration:", so that is the durable signal.
    const last = git(["log", "-1", "--format=%ct", "--grep=^Add exploration:"]).trim();
    if (!last) return true;
    hours = (Date.now() / 1000 - Number(last)) / 3600;
  } catch {
    console.log(`${stamp()} Could not determine last post time. Proceeding.`);
    return true;
  }
  if (hours < MIN_GAP_HOURS) {
    console.log(`${stamp()} Too soon: last post ${hours.toFixed(1)}h ago (min ${MIN_GAP_HOURS}h). Skipping.`);
    return false;
  }
  if (hours >= MAX_GAP_HOURS) {
    console.log(`${stamp()} ${hours.toFixed(1)}h since last post (max ${MAX_GAP_HOURS}h). Forcing.`);
    return true;
  }
  const chance = Math.pow((hours - MIN_GAP_HOURS) / (MAX_GAP_HOURS - MIN_GAP_HOURS), PACING_CURVE);
  const roll = Math.random();
  const verdict = roll <= chance;
  console.log(
    `${stamp()} ${hours.toFixed(1)}h since last post. Rolled ${roll.toFixed(2)} vs ${chance.toFixed(2)}. ${verdict ? "Proceeding." : "Skipping."}`
  );
  return verdict;
}

function main() {
  const queue = readQueue();
  if (DEDUPE_REPORT) {
    dedupeReport(queue);
    return;
  }
  if (queue.length === 0) {
    console.log(`${stamp()} Backlog queue is empty. Nothing to publish.`);
    return;
  }
  if (!pacingAllows()) return;

  const slug = queue[0];
  const stagedPath = path.join(QUEUE_DIR, `${slug}.tsx`);
  const destDir = path.join(ROOT, "src", "app", "explorations", slug);

  if (!fs.existsSync(stagedPath)) {
    dropFromQueue(queue, slug, `queued/${slug}.tsx does not exist`);
    return;
  }
  if (fs.existsSync(destDir)) {
    dropFromQueue(queue, slug, `src/app/explorations/${slug}/ already exists, so the post is live`);
    return;
  }

  let page = fs.readFileSync(stagedPath, "utf-8");

  // Third way a queue entry can be unpublishable: its subject is already on the
  // site. Same recovery path as the other two — drop it, commit that, exit 0 so
  // the workflow's push step persists the repair, and let the next scheduled
  // run take the entry behind it.
  const corpus = loadCorpusFingerprints();
  const publishedCount = corpus.filter((c) => c.origin === "published").length;
  const { blocking, titleOnly } = findPublishedCollisions(slug, page, corpus);
  console.log(
    `${stamp()} Dedupe gate: "${slug}" scored against ${publishedCount} published explorations — ` +
    `${blocking ? `COLLISION with ${blocking.slug}` : "clear"}.`
  );
  for (const c of titleOnly) {
    annotate(
      `Queued entry "${slug}" reads like the published "${c.title}" (${c.slug}) — ${c.reasons.join("; ")} ` +
      `${scoreLine(c)}. The bodies do not match, so it is publishing anyway. Worth a look.`
    );
  }
  if (blocking) {
    dropFromQueue(queue, slug, collisionReason(blocking));
    return;
  }

  const title = attr(page, "title");
  const subtitle = attr(page, "subtitle");
  const category = attr(page, "category");
  const color = attr(page, "categoryColor");
  const readTime = attr(page, "readTime");
  const description = (page.match(/description:\s*"([^"]*)"/) || [])[1] || subtitle || "";

  const prev = currentNewest();
  console.log(`\n${stamp()} Publishing from backlog: "${title}" (${slug})`);
  console.log(`  ${queue.length - 1} remaining after this one.`);

  // The release date is what the reader sees, not the authoring date. These
  // pages were written between March and July 2026 and drain over months, in an
  // order that is not chronological — 63 of the 123 adjacent pairs run
  // backwards. Left alone, the index card would show today while the article
  // showed a date months earlier, and exploration-layout spreads the same prop
  // into schema.org datePublished. One clock, read once, for both.
  const now = new Date();
  const releaseDate = now.toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    year: "numeric", month: "long", day: "numeric",
  });
  const publishedAt = now
    .toLocaleString("en-US", {
      timeZone: "America/New_York",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: true,
    })
    .replace(",", "");

  const authoredDate = attr(page, "date");
  page = setProp(page, "date", releaseDate);
  if (!page.includes(`date="${releaseDate}"`)) {
    console.error(`ERROR: could not stamp the release date onto queued/${slug}.tsx. Aborting.`);
    process.exit(1);
  }
  console.log(`  Dated ${releaseDate} (written ${authoredDate ?? "unknown"}).`);

  // This post becomes the newest: it points back at the previous newest and
  // carries no "next" until something is published after it.
  if (prev?.slug) {
    page = setProp(page, "prevSlug", prev.slug);
    if (prev.title) page = setProp(page, "prevTitle", escapeAttr(prev.title));
  }
  for (const p of ["nextSlug", "nextTitle", "nextSubtitle", "nextCategory", "nextCategoryColor", "nextImage", "nextReadTime"]) {
    page = removeProp(page, p);
  }

  // Point the previously-newest post forward at this one.
  let prevPageUpdated = null;
  if (prev?.slug) {
    const prevPath = path.join(ROOT, "src", "app", "explorations", prev.slug, "page.tsx");
    if (fs.existsSync(prevPath)) {
      let s = fs.readFileSync(prevPath, "utf-8");
      s = setProp(s, "nextSlug", slug);
      s = setProp(s, "nextTitle", escapeAttr(title));
      s = setProp(s, "nextSubtitle", escapeAttr(subtitle));
      s = setProp(s, "nextCategory", escapeAttr(category));
      s = setProp(s, "nextCategoryColor", color);
      s = setProp(s, "nextImage", `/images/explorations/${slug}.webp`);
      s = setProp(s, "nextReadTime", readTime);
      if (!DRY) fs.writeFileSync(prevPath, s);
      prevPageUpdated = `src/app/explorations/${prev.slug}/page.tsx`;
    }
  }

  const imgExists = fs.existsSync(path.join(ROOT, "public", "images", "explorations", `${slug}.webp`));
  const entry = `  {
    slug: "${slug}",
    title: "${escapeJs(title)}",
    subtitle: "${escapeJs(subtitle)}",
    category: "${escapeJs(category)}",
    color: "${color}",
    readTime: "${readTime}",${imgExists ? `\n    image: "/images/explorations/${slug}.webp",` : ""}
    publishedAt: "${publishedAt}",
    description:
      "${escapeJs(description)}",
  },`;

  const before = fs.readFileSync(DATA_FILE, "utf-8");
  let data;
  try {
    data = insertRegistryEntry(before, entry, slug);
  } catch (err) {
    console.error(`ERROR: refusing to write explorations.ts — ${err.message}`);
    process.exit(1);
  }

  if (DRY) {
    console.log(
      `  [dry run] would write the page, the registry entry ` +
        `(${registrySlugs(before).length} -> ${registrySlugs(data).length}), and navigation.`
    );
    return;
  }

  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(path.join(destDir, "page.tsx"), page);
  fs.writeFileSync(DATA_FILE, data);
  fs.rmSync(stagedPath);
  writeQueue(queue.slice(1));

  // The explorations page searches essay text through a build-time index (see
  // scripts/search-index.mjs). A post that publishes without updating it is
  // findable by its title and invisible to every other word in it, which is the
  // whole problem the index was built for. Extend it here rather than leaving
  // it to a separate rebuild nobody will run for seven months.
  let indexUpdated = null;
  try {
    const records = upsertIndexEntry(slug, page);
    indexUpdated = path.relative(ROOT, INDEX_FILE);
    console.log(`  Search index now covers ${records.length} posts.`);
  } catch (err) {
    // A missing search term is a degraded search box, not a broken post. Say so
    // and publish anyway; `node scripts/search-index.mjs` repairs it wholesale.
    annotate(`Could not update the search index for "${slug}": ${err.message}. Run: node scripts/search-index.mjs`);
  }

  try {
    configureGitIdentity();
    const files = [
      `src/app/explorations/${slug}/page.tsx`,
      "src/data/explorations.ts",
      "scripts/publish-queue.json",
      `queued/${slug}.tsx`,
    ];
    if (prevPageUpdated) files.push(prevPageUpdated);
    if (indexUpdated) files.push(indexUpdated);
    // The staged page has just been deleted. `git add` fatals on a path that is
    // neither on disk nor tracked, which happens on the very first publish
    // before queued/ has been committed — so only add what git can resolve.
    const addable = files.filter((f) => {
      if (fs.existsSync(path.join(ROOT, f))) return true;
      try {
        git(["ls-files", "--error-unmatch", "--", f]);
        return true;
      } catch {
        return false;
      }
    });
    git(["add", "--", ...addable]);
    git(["commit", "-q", "-m",
      `Add exploration: ${title}\n\nPublished from the audited backlog (docs/backlog-audit-2026-07-27.md).\nWritten by the local generator; no new model calls.`]);
    console.log("  Committed.");
  } catch (err) {
    console.warn("  Git commit failed:", err.message);
  }
}

main();
