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
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const QUEUE_DIR = path.join(ROOT, "queued");
const QUEUE_FILE = path.join(__dirname, "publish-queue.json");
const DATA_FILE = path.join(ROOT, "src", "data", "explorations.ts");

const FORCE = process.argv.includes("--force");
const DRY = process.argv.includes("--dry-run");

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

/** Pull one attribute out of the ExplorationLayout props. */
function attr(src, name) {
  const m = src.match(new RegExp(`\\b${name}="([^"]*)"`));
  return m ? m[1] : null;
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

/** Replace a JSX string prop, or insert it before the closing `>` of the tag. */
function setProp(src, name, value) {
  const re = new RegExp(`(\\b${name}=")[^"]*(")`);
  if (re.test(src)) return src.replace(re, `$1${value}$2`);
  return src.replace(/(\n\s*)>\n(\s*<)/, `$1  ${name}="${value}"$1>\n$2`);
}

const removeProp = (src, name) => src.replace(new RegExp(`\\n\\s*${name}="[^"]*"`), "");
const escapeJs = (s) => String(s ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
/** Attribute values live inside double quotes in JSX. */
const escapeAttr = (s) => String(s ?? "").replace(/"/g, "&quot;");

function pacingAllows() {
  if (FORCE) return true;
  let hours;
  try {
    const last = git(["log", "-1", "--format=%ct", "--", "src/app/explorations/*/page.tsx"]).trim();
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
  if (queue.length === 0) {
    console.log(`${stamp()} Backlog queue is empty. Nothing to publish.`);
    return;
  }
  if (!pacingAllows()) return;

  const slug = queue[0];
  const stagedPath = path.join(QUEUE_DIR, `${slug}.tsx`);
  const destDir = path.join(ROOT, "src", "app", "explorations", slug);

  if (!fs.existsSync(stagedPath)) {
    console.error(`Queued page missing: queued/${slug}.tsx — dropping from queue.`);
    if (!DRY) writeQueue(queue.slice(1));
    process.exit(1);
  }
  if (fs.existsSync(destDir)) {
    console.error(`${slug} is already published — dropping from queue.`);
    if (!DRY) writeQueue(queue.slice(1));
    process.exit(1);
  }

  let page = fs.readFileSync(stagedPath, "utf-8");
  const title = attr(page, "title");
  const subtitle = attr(page, "subtitle");
  const category = attr(page, "category");
  const color = attr(page, "categoryColor");
  const readTime = attr(page, "readTime");
  const description = (page.match(/description:\s*"([^"]*)"/) || [])[1] || subtitle || "";

  const prev = currentNewest();
  console.log(`\n${stamp()} Publishing from backlog: "${title}" (${slug})`);
  console.log(`  ${queue.length - 1} remaining after this one.`);

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
      s = setProp(s, "nextImage", `/images/explorations/${slug}.png`);
      s = setProp(s, "nextReadTime", readTime);
      if (!DRY) fs.writeFileSync(prevPath, s);
      prevPageUpdated = `src/app/explorations/${prev.slug}/page.tsx`;
    }
  }

  const publishedAt = new Date()
    .toLocaleString("en-US", {
      timeZone: "America/New_York",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: true,
    })
    .replace(",", "");
  const imgExists = fs.existsSync(path.join(ROOT, "public", "images", "explorations", `${slug}.png`));
  const entry = `  {
    slug: "${slug}",
    title: "${escapeJs(title)}",
    subtitle: "${escapeJs(subtitle)}",
    category: "${escapeJs(category)}",
    color: "${color}",
    readTime: "${readTime}",${imgExists ? `\n    image: "/images/explorations/${slug}.png",` : ""}
    publishedAt: "${publishedAt}",
    description:
      "${escapeJs(description)}",
  },`;

  const before = fs.readFileSync(DATA_FILE, "utf-8");
  const data = before.replace(
    /export const explorations: Exploration\[\] = \[\n/,
    `export const explorations: Exploration[] = [\n${entry}\n`
  );
  if (data === before) {
    console.error("ERROR: could not insert into explorations.ts — format changed. Aborting.");
    process.exit(1);
  }

  if (DRY) {
    console.log("  [dry run] would write the page, registry entry, and navigation.");
    return;
  }

  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(path.join(destDir, "page.tsx"), page);
  fs.writeFileSync(DATA_FILE, data);
  fs.rmSync(stagedPath);
  writeQueue(queue.slice(1));

  try {
    if (process.env.CI) {
      git(["config", "user.name", "Foxfire Auto-Explore"]);
      git(["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
    }
    const files = [
      `src/app/explorations/${slug}/page.tsx`,
      "src/data/explorations.ts",
      "scripts/publish-queue.json",
      `queued/${slug}.tsx`,
    ];
    if (prevPageUpdated) files.push(prevPageUpdated);
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
