/**
 * Shared narration pipeline: text extraction, synthesis, encoding, and R2 upload.
 *
 * Used by auto-explore.mjs (new posts), publish-from-queue.mjs (backlog posts as
 * they release), and backfill-audio.mjs (the one-off catch-up run).
 *
 * Hosting is Cloudflare R2 rather than Vercel Blob. The full catalog is ~1.56GB
 * of Opus at the measured 19.7-minute average narration, and Blob's free tier is
 * 1GB with a 10GB/month transfer cap. R2's free tier is 10GB with no egress
 * charge at all, which is the difference between narrating 284 posts and
 * narrating all of them.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { AwsClient } from "aws4fetch";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");

/** Opus at 24kbps mono. See the bitrate note in auto-explore.mjs. */
export const AUDIO_BITRATE = "24k";
export const VOICE = "en-US-AndrewMultilingualNeural";

export function loadEnv() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

export function r2Config() {
  loadEnv();
  const cfg = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET,
    publicBase: (process.env.R2_PUBLIC_BASE || "").replace(/\/+$/, ""),
  };
  const ENV_NAMES = {
    accountId: "R2_ACCOUNT_ID", accessKeyId: "R2_ACCESS_KEY_ID",
    secretAccessKey: "R2_SECRET_ACCESS_KEY", bucket: "R2_BUCKET", publicBase: "R2_PUBLIC_BASE",
  };
  const missing = Object.entries(cfg).filter(([, v]) => !v).map(([k]) => ENV_NAMES[k]);
  return { ...cfg, ok: missing.length === 0, missing };
}

/** Public URL for a slug's narration. Stable, so pages can be written before upload. */
export const audioUrlFor = (slug, publicBase) => `${publicBase}/audio/${slug}.opus`;

export function r2Client(cfg) {
  return new AwsClient({
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
    service: "s3",
    region: "auto",
  });
}

export async function uploadToR2(cfg, client, key, body, contentType = "audio/ogg") {
  const endpoint = `https://${cfg.accountId}.r2.cloudflarestorage.com`;
  const res = await client.fetch(`${endpoint}/${cfg.bucket}/${key}`, {
    method: "PUT",
    body,
    headers: {
      "content-type": contentType,
      // Narrations never change once written, so let readers and the CDN keep them.
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
  if (!res.ok) throw new Error(`R2 PUT ${key} failed: ${res.status} ${await res.text()}`);
  return `${cfg.publicBase}/${key}`;
}

export async function r2Has(cfg, client, key) {
  const endpoint = `https://${cfg.accountId}.r2.cloudflarestorage.com`;
  const res = await client.fetch(`${endpoint}/${cfg.bucket}/${key}`, { method: "HEAD" });
  return res.ok;
}

/**
 * Turn a page's JSX into speakable prose.
 *
 * Citation markers and the sources list are removed rather than read aloud —
 * "superscript roman numeral seventeen" is not narration. Entities are decoded
 * so the voice says "don't" instead of spelling out an ampersand sequence.
 */
// Entities the corpus actually uses, mapped to what should be *spoken*. A
// leftover "&rarr;" is not a cosmetic bug here: the voice reads it aloud as
// "ampersand r a r r semicolon".
const SPOKEN_ENTITIES = {
  mdash: " — ", ndash: " – ", ldquo: '"', rdquo: '"', quot: '"',
  lsquo: "'", rsquo: "'", apos: "'", hellip: "…", middot: "·",
  nbsp: " ", amp: "and", lt: "less than", gt: "greater than",
  rarr: " to ", larr: " from ", hyphen: "-", ndash_: "–",
  eacute: "é", egrave: "è", agrave: "à", ccedil: "ç", uuml: "ü",
  ouml: "ö", auml: "ä", ntilde: "ñ", aacute: "á", iacute: "í",
  oacute: "ó", uacute: "ú", szlig: "ß", oslash: "ø", aring: "å",
  deg: " degrees ", times: " by ", frac12: " one half ", pound: " pounds ",
  euro: " euros ", copy: "", reg: "", trade: "", ldquo_: '"',
};

/** Entity decoding, shared by the body and the title/subtitle intro. */
function decodeForSpeech(s) {
  return String(s ?? "")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    // Named entities: known ones get a spoken form, unknown ones are dropped
    // rather than read out character by character.
    .replace(/&([a-z][a-z0-9]{1,10});/gi, (m, name) => {
      const k = name.toLowerCase();
      return Object.prototype.hasOwnProperty.call(SPOKEN_ENTITIES, k) ? SPOKEN_ENTITIES[k] : " ";
    });
}

export function narrationTextFromPage(src, { title, subtitle } = {}) {
  const body = src
    .replace(/^[\s\S]*?<ExplorationLayout[^>]*>/, "")
    .replace(/<\/ExplorationLayout>[\s\S]*$/, "")
    .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, "")
    .replace(/<section\b[^>]*>[\s\S]*?<\/section>/gi, "")
    .replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi, "");

  // Strip markup BEFORE decoding, so a decoded "<" can never look like a tag.
  const text = decodeForSpeech(
    body
      .replace(/<h2[^>]*>/gi, ". ")
      .replace(/<\/(p|h2|h3|li|blockquote)>/gi, ". ")
      .replace(/<[^>]+>/g, " ")
  );

  const intro = title
    ? `${decodeForSpeech(title)}, from Foxfire. ${subtitle ? decodeForSpeech(subtitle) + ". " : ""}`
    : "";

  // Collapse after joining, not before: the intro and the first heading each
  // contribute a full stop, and the voice audibly pauses twice on ". .".
  return (intro + text)
    .replace(/\s*\.(\s*\.)+/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

export const attrOf = (src, name) => (src.match(new RegExp(`\\b${name}="([^"]*)"`)) || [])[1] || null;

/** Synthesize with edge-tts (free) and re-encode to Opus. Returns the .opus path. */
export function synthesize(slug, narrationText) {
  const txt = path.join(os.tmpdir(), `foxfire-tts-${slug}.txt`);
  const mp3 = path.join(os.tmpdir(), `foxfire-tts-${slug}.mp3`);
  const opus = path.join(os.tmpdir(), `foxfire-tts-${slug}.opus`);
  try {
    fs.writeFileSync(txt, narrationText, "utf-8");
    execFileSync("edge-tts", ["--voice", VOICE, "--file", txt, "--write-media", mp3], {
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 30 * 60 * 1000,
    });
    execFileSync(
      "ffmpeg",
      ["-y", "-v", "error", "-i", mp3, "-c:a", "libopus", "-b:a", AUDIO_BITRATE, "-ac", "1", opus],
      { stdio: ["pipe", "pipe", "pipe"] }
    );
    return opus;
  } finally {
    for (const f of [txt, mp3]) if (fs.existsSync(f)) fs.unlinkSync(f);
  }
}

/** Re-encode an already-synthesized MP3 (used when migrating off Blob). */
export function transcode(slug, mp3Path) {
  const opus = path.join(os.tmpdir(), `foxfire-mig-${slug}.opus`);
  execFileSync(
    "ffmpeg",
    ["-y", "-v", "error", "-i", mp3Path, "-c:a", "libopus", "-b:a", AUDIO_BITRATE, "-ac", "1", opus],
    { stdio: ["pipe", "pipe", "pipe"] }
  );
  return opus;
}

/** Write an audioSrc prop into a page that lacks one, right after imageAlt. */
export function setAudioSrc(src, url) {
  if (/\baudioSrc=/.test(src)) return src.replace(/\baudioSrc="[^"]*"/, `audioSrc="${url}"`);
  if (/\bimageAlt="[^"]*"/.test(src)) {
    return src.replace(/(\bimageAlt="[^"]*")/, `$1\n      audioSrc="${url}"`);
  }
  return src.replace(/(\n\s*)(>\n)/, `$1  audioSrc="${url}"$1$2`);
}
