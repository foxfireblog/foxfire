#!/usr/bin/env node

/**
 * One-off catch-up: give every essay a narration, hosted on Cloudflare R2.
 *
 * Two kinds of work:
 *   MIGRATE  — 123 posts already have narration on Vercel Blob as 48kbps MP3.
 *              Those are downloaded (the Blob URLs are public, so no token is
 *              needed) and re-encoded to Opus. Nothing is re-synthesized.
 *   GENERATE — 320 posts have no narration at all. edge-tts synthesizes them,
 *              which is free but takes roughly 7 minutes each.
 *
 * Resumable: anything already present in R2 is skipped, so it is safe to stop
 * this with Ctrl-C and run it again. Pages are patched with the audioSrc only
 * after the upload for that slug succeeds, so a half-finished run never leaves
 * a page pointing at a file that does not exist.
 *
 *   node scripts/backfill-audio.mjs --check          # config + work preview, no changes
 *   node scripts/backfill-audio.mjs --migrate-only   # just the cheap re-encodes
 *   node scripts/backfill-audio.mjs --limit 10       # first 10 items of work
 *   node scripts/backfill-audio.mjs                  # everything
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
  ROOT, r2Config, r2Client, uploadToR2, r2Has, audioUrlFor,
  narrationTextFromPage, attrOf, synthesize, transcode, setAudioSrc,
} from "./audio-lib.mjs";

const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const MIGRATE_ONLY = args.includes("--migrate-only");
const LIMIT = (() => { const i = args.indexOf("--limit"); return i >= 0 ? Number(args[i + 1]) : Infinity; })();

const cfg = r2Config();
if (!cfg.ok) {
  console.error("\nR2 is not configured. Missing from .env.local: " + cfg.missing.join(", "));
  console.error(`
Add these five lines to .env.local (values come from the Cloudflare dashboard):

  R2_ACCOUNT_ID=...            # R2 overview page, or the subdomain in the S3 endpoint
  R2_ACCESS_KEY_ID=...         # Manage R2 API Tokens -> Create (Object Read & Write)
  R2_SECRET_ACCESS_KEY=...     # shown once, at token creation
  R2_BUCKET=foxfire-audio
  R2_PUBLIC_BASE=https://pub-xxxxxxxx.r2.dev   # bucket Settings -> Public access -> r2.dev

Then re-run with --check.
`);
  process.exit(1);
}

/** Everything that should end up with a narration: live posts and staged backlog. */
function collectWork() {
  const items = [];
  const liveDir = path.join(ROOT, "src", "app", "explorations");
  for (const e of fs.readdirSync(liveDir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const file = path.join(liveDir, e.name, "page.tsx");
    if (fs.existsSync(file)) items.push({ slug: e.name, file, kind: "published" });
  }
  const qDir = path.join(ROOT, "queued");
  if (fs.existsSync(qDir)) {
    for (const f of fs.readdirSync(qDir)) {
      if (f.endsWith(".tsx")) items.push({ slug: f.replace(/\.tsx$/, ""), file: path.join(qDir, f), kind: "queued" });
    }
  }
  for (const it of items) {
    const src = fs.readFileSync(it.file, "utf-8");
    const existing = attrOf(src, "audioSrc");
    // A Blob MP3 means we can re-encode instead of paying 7 minutes of synthesis.
    it.blobMp3 = existing && /blob\.vercel-storage\.com/.test(existing) ? existing : null;
    it.hasR2 = !!(existing && cfg.publicBase && existing.startsWith(cfg.publicBase));
    it.mode = it.blobMp3 ? "migrate" : "generate";
  }
  return items;
}

const all = collectWork();
const todo = all.filter((i) => !i.hasR2);
const migrate = todo.filter((i) => i.mode === "migrate");
const generate = todo.filter((i) => i.mode === "generate");

console.log(`\nR2 bucket: ${cfg.bucket}   public base: ${cfg.publicBase}`);
console.log(`Essays: ${all.length}   already on R2: ${all.length - todo.length}`);
console.log(`  migrate (re-encode existing MP3, fast): ${migrate.length}`);
console.log(`  generate (edge-tts, ~7 min each):       ${generate.length}`);
console.log(`  estimated new storage: ~${((todo.length * 3.6) / 1024).toFixed(2)} GB of 10 GB free\n`);

if (CHECK) {
  const client = r2Client(cfg);
  try {
    const probe = await r2Has(cfg, client, "audio/__connectivity_probe__");
    console.log(`R2 credentials accepted (probe returned ${probe ? "found" : "not-found"}, either is fine).`);
  } catch (err) {
    console.error("R2 credentials REJECTED:", err.message);
    process.exit(1);
  }
  console.log("Config looks good. Re-run without --check to do the work.");
  process.exit(0);
}

const queue = (MIGRATE_ONLY ? migrate : [...migrate, ...generate]).slice(0, LIMIT);
if (!queue.length) { console.log("Nothing to do."); process.exit(0); }

const client = r2Client(cfg);
let done = 0, failed = 0, bytes = 0;
const started = Date.now();

// Synthesis is network-bound on Microsoft's TTS endpoint, not CPU-bound, so
// running several at once turns ~37 hours of serial work into a handful. Kept
// modest deliberately: this is a free unofficial endpoint and hammering it is
// both rude and a good way to get throttled.
const CONCURRENCY = (() => {
  const i = args.indexOf("--concurrency");
  return i >= 0 ? Math.max(1, Math.min(8, Number(args[i + 1]))) : 4;
})();
console.log(`Working ${queue.length} item(s) with concurrency ${CONCURRENCY}.\n`);

let cursor = 0;
async function worker() {
  while (cursor < queue.length) {
    const i = cursor++;
    await handle(queue[i], i);
  }
}

async function handle(item, i) {
  const key = `audio/${item.slug}.opus`;
  const label = `[${i + 1}/${queue.length}] ${item.slug}`;
  try {
    if (await r2Has(cfg, client, key)) {
      // Object exists but the page did not know: just point the page at it.
      const src = fs.readFileSync(item.file, "utf-8");
      fs.writeFileSync(item.file, setAudioSrc(src, audioUrlFor(item.slug, cfg.publicBase)));
      console.log(`${label}  already in R2, page relinked`);
      done++;
      return;
    }

    let opusPath;
    if (item.mode === "migrate") {
      const res = await fetch(item.blobMp3);
      if (!res.ok) throw new Error(`blob fetch ${res.status}`);
      const tmpMp3 = path.join(process.env.TMPDIR || "/tmp", `foxfire-dl-${item.slug}.mp3`);
      fs.writeFileSync(tmpMp3, Buffer.from(await res.arrayBuffer()));
      opusPath = transcode(item.slug, tmpMp3);
      fs.unlinkSync(tmpMp3);
    } else {
      const src = fs.readFileSync(item.file, "utf-8");
      const text = narrationTextFromPage(src, { title: attrOf(src, "title"), subtitle: attrOf(src, "subtitle") });
      if (text.length < 500) throw new Error(`narration text too short (${text.length} chars)`);
      opusPath = synthesize(item.slug, text);
    }

    const buf = fs.readFileSync(opusPath);
    const url = await uploadToR2(cfg, client, key, buf);
    fs.unlinkSync(opusPath);

    // Only now is it safe to point the page at the file.
    const src = fs.readFileSync(item.file, "utf-8");
    fs.writeFileSync(item.file, setAudioSrc(src, url));

    bytes += buf.length;
    done++;
    const mins = (Date.now() - started) / 60000;
    console.log(`${label}  ${item.mode}  ${(buf.length / 1048576).toFixed(1)}MB  (${done} done, ${mins.toFixed(0)}m elapsed)`);
  } catch (err) {
    failed++;
    console.error(`${label}  FAILED: ${err.message?.slice(0, 160)}`);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`\nDone: ${done} succeeded, ${failed} failed, ${(bytes / 1048576).toFixed(0)}MB uploaded.`);
if (failed) console.log("Re-run to retry the failures; completed slugs are skipped.");
