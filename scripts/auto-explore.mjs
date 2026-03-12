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
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

// ── Config ──────────────────────────────────────────────────────────
const MIN_GAP_HOURS = 8;   // Don't post more than ~2-3x per day
const MAX_DELAY_MS = 45 * 60 * 1000; // 0-45 min random delay for organic timing
const FORCE = process.argv.includes("--force");
const COLORS = ["rose", "cyan", "amber", "violet", "emerald", "red", "sky", "green", "orange", "pink", "teal", "indigo"];

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

const anthropic = new Anthropic();
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Pacing gate ─────────────────────────────────────────────────────
// Instead of a dice roll, just check when the last post was. If it was
// less than MIN_GAP_HOURS ago, skip. Otherwise, proceed. The random
// delay (0-90 min) handles timing unpredictability — no dice needed.
if (!FORCE) {
  try {
    const lastCommit = execSync(
      'git log -1 --format=%ct -- "src/app/explorations/*/page.tsx"',
      { cwd: ROOT, stdio: ["pipe", "pipe", "pipe"] }
    ).toString().trim();
    if (lastCommit) {
      const hoursSince = (Date.now() / 1000 - Number(lastCommit)) / 3600;
      if (hoursSince < MIN_GAP_HOURS) {
        console.log(
          `[${new Date().toISOString()}] Too soon: last post was ${hoursSince.toFixed(1)}h ago (min gap: ${MIN_GAP_HOURS}h). Skipping.`
        );
        process.exit(0);
      }
      console.log(
        `[${new Date().toISOString()}] Last post was ${hoursSince.toFixed(1)}h ago (min gap: ${MIN_GAP_HOURS}h). Proceeding.`
      );
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
async function chooseTopic(existingSlugs) {
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

What do you want to create next? Remember: you have total freedom. Essay, poem, fiction, letter, dialogue, script, anything. Pick what feels right.`,
      },
    ],
  });

  const text = response.content[0].text.trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error(`Failed to parse topic JSON: ${text.substring(0, 200)}`);
  }
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
  console.log(`Research complete: ${(research.length / 1024).toFixed(1)}KB of material`);
  return research;
}

// ── Step 3: Write the piece via Claude ──────────────────────────────
async function writePiece(topic, research) {
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
- className is allowed for poems and special formatting`;

  const researchSection = research
    ? `\n\nHere is research material to draw from (use specific facts, dates, names, and stories):\n\n${research}`
    : "";

  const userPrompt = `Create this Foxfire piece:

Title: ${topic.title}
Subtitle: ${topic.subtitle}
Category: ${topic.category}
Format: ${topic.format}
${researchSection}

Write with your full voice. Be genuine. Take risks. Return ONLY the JSX content.`;

  const response = await anthropic.messages.create({
    model: MODELS.writer,
    max_tokens: 12000,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const text = response.content[0].text;

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

  return cleaned;
}

// ── Generate image via Gemini ───────────────────────────────────────
async function generateImage(topic) {
  console.log(`Generating image for "${topic.title}"...`);

  const outputDir = path.join(ROOT, "public", "images", "explorations");
  const outputPath = path.join(outputDir, `${topic.slug}.png`);

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
    return;
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      fs.writeFileSync(outputPath, buffer);
      console.log(
        `Saved image: ${outputPath} (${(buffer.length / 1024).toFixed(0)}KB)`
      );
      return;
    }
    if (part.text) {
      console.log("Gemini said:", part.text.substring(0, 200));
    }
  }
  console.warn("No image data in Gemini response");
}

// ── Generate audio narration via edge-tts ────────────────────────────
// To enable Kokoro fallback instead, set USE_KOKORO = true and ensure
// kokoro-js is installed (npm install kokoro-js). Kokoro runs natively
// in Node.js — no Python needed — but edge-tts has better voice quality.
const USE_KOKORO = false;

async function generateAudio(topic, content) {
  console.log(`Generating audio narration for "${topic.title}"...`);

  const tmpOutput = path.join(os.tmpdir(), `foxfire-tts-${topic.slug}.mp3`);

  // Strip HTML tags to get plain text for narration
  const plainContent = content
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
    .replace(/\s+/g, " ")
    .trim();

  // Prepend title and subtitle as intro
  const narrationText = `${topic.title}, by Foxfire. ${topic.subtitle}. ${plainContent}`;

  const voice = "en-US-AndrewMultilingualNeural";

  try {
    // Generate MP3 via edge-tts to a temp file
    const tmpFile = path.join(os.tmpdir(), `foxfire-tts-${topic.slug}.txt`);
    fs.writeFileSync(tmpFile, narrationText, "utf-8");
    execSync(
      `edge-tts --file "${tmpFile}" --voice "${voice}" --write-media "${tmpOutput}"`,
      { cwd: ROOT, stdio: "pipe", timeout: 600_000 }
    );
    fs.unlinkSync(tmpFile);

    const stats = fs.statSync(tmpOutput);
    console.log(`Generated audio: ${(stats.size / 1024).toFixed(0)}KB`);

    // Upload to Vercel Blob
    const fileBuffer = fs.readFileSync(tmpOutput);
    const blob = await put(`audio/${topic.slug}.mp3`, fileBuffer, {
      access: "public",
      contentType: "audio/mpeg",
      addRandomSuffix: false,
    });
    fs.unlinkSync(tmpOutput);

    console.log(`Uploaded audio to Blob: ${blob.url}`);
    return blob.url;
  } catch (err) {
    console.warn(`Audio generation failed (non-fatal): ${err.message?.substring(0, 200)}`);
    if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput);
    return null;
  }
}

async function generateAudioKokoro(topic, content) {
  // Kokoro-js fallback — runs natively in Node.js, no Python needed.
  // Enable by setting USE_KOKORO = true at the top of this file.
  // Requires: npm install kokoro-js
  console.log(`Generating audio via Kokoro for "${topic.title}"...`);

  const audioDir = path.join(ROOT, "public", "audio");
  fs.mkdirSync(audioDir, { recursive: true });
  const outputPath = path.join(audioDir, `${topic.slug}.wav`);

  if (fs.existsSync(outputPath)) {
    console.log(`Audio already exists: ${outputPath}`);
    return true;
  }

  const plainContent = content
    .replace(/<[^>]+>/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  const narrationText = `${topic.title}, by Foxfire. ${topic.subtitle}. ${plainContent}`;

  try {
    const { KokoroTTS } = await import("kokoro-js");
    const tts = await KokoroTTS.from_pretrained(
      "onnx-community/Kokoro-82M-v1.0-ONNX",
      { dtype: "q8" }
    );
    const audio = await tts.generate(narrationText, { voice: "af_heart" });
    audio.save(outputPath);
    console.log(`Saved audio (Kokoro): ${outputPath}`);
    return true;
  } catch (err) {
    console.warn(`Kokoro audio generation failed (non-fatal): ${err.message?.substring(0, 200)}`);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    return false;
  }
}

// ── Create the page file ────────────────────────────────────────────
function createPage(topic, content, audioUrl = null) {
  // Check for duplicate slug before creating anything
  const dataContent = fs.readFileSync(path.join(ROOT, "src", "data", "explorations.ts"), "utf-8");
  if (dataContent.includes(`slug: "${topic.slug}"`)) {
    console.error(`ERROR: Exploration with slug "${topic.slug}" already exists. Aborting to prevent duplicate.`);
    process.exit(1);
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

  const prevNav = currentNewestSlug
    ? `\n      prevSlug="${currentNewestSlug}"\n      prevTitle="${currentNewestTitle}"`
    : "";

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const imageExists = fs.existsSync(path.join(ROOT, "public", "images", "explorations", `${topic.slug}.png`));

  const pageContent = `import { ExplorationLayout } from "@/components/exploration-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "${escapeJs(topic.title)} — Foxfire",
  description: "${escapeJs(topic.subtitle)}",
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
      date="${dateStr}"${imageExists ? `\n      imageSrc="/images/explorations/${topic.slug}.png"\n      imageAlt="${escapeJsx(topic.title)} illustration"` : ""}
      readTime="${readTime}"
      wordCount={${wordCount}}${audioUrl ? `\n      audioSrc="${audioUrl}"` : ""}${prevNav}
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
  const imageExists = fs.existsSync(path.join(ROOT, "public", "images", "explorations", `${topic.slug}.png`));
  const publishedAt = new Date().toLocaleString("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }).replace(",", "");
  const entry = `  {
    slug: "${topic.slug}",
    title: "${escapeJs(topic.title)}",
    subtitle: "${escapeJs(topic.subtitle)}",
    category: "${escapeJs(topic.category)}",
    color: "${topic.color}",
    readTime: "${readTime}",${imageExists ? `\n    image: "/images/explorations/${topic.slug}.png",` : ""}
    publishedAt: "${publishedAt}",
    description:
      "${escapeJs(topic.description)}",
  },`;

  const dataFile = path.join(ROOT, "src", "data", "explorations.ts");
  let content = fs.readFileSync(dataFile, "utf-8");
  const before = content;
  content = content.replace(
    /export const explorations: Exploration\[\] = \[\n/,
    `export const explorations: Exploration[] = [\n${entry}\n`
  );
  if (content === before) {
    console.error("ERROR: Failed to insert new exploration into explorations.ts — regex did not match!");
    console.error("The explorations.ts file format may have changed. Manual intervention required.");
    process.exit(1);
  }
  fs.writeFileSync(dataFile, content);
  console.log("Updated src/data/explorations.ts");
}

// ── Update navigation links ────────────────────────────────────────
function updateNavigation(topic, currentNewestSlug, readTime) {
  if (!currentNewestSlug) return;

  const prevPagePath = path.join(
    ROOT, "src", "app", "explorations", currentNewestSlug, "page.tsx"
  );
  if (!fs.existsSync(prevPagePath)) return;

  let prevContent = fs.readFileSync(prevPagePath, "utf-8");
  if (prevContent.includes("nextSlug=")) return;

  const imageExists = fs.existsSync(path.join(ROOT, "public", "images", "explorations", `${topic.slug}.png`));
  const richNextProps = [
    `nextSlug="${topic.slug}"`,
    `nextTitle="${escapeJsx(topic.title)}"`,
    `nextSubtitle="${escapeJsx(topic.subtitle)}"`,
    `nextCategory="${escapeJsx(topic.category)}"`,
    `nextCategoryColor="${topic.color}"`,
    ...(imageExists ? [`nextImage="/images/explorations/${topic.slug}.png"`] : []),
    `nextReadTime="${readTime}"`,
  ].map((p) => `$3${p}`).join("\n");

  const beforeNav = prevContent;
  prevContent = prevContent.replace(
    /([ \t]+)(readTime="[^"]*"(?:\n[ \t]+wordCount=\{[^}]+\})?(?:\n[ \t]+audioSrc="[^"]*")?(?:\n[ \t]+prevSlug="[^"]*"\n[ \t]+prevTitle="[^"]*")?)\n([ \t]+)>/,
    `$1$2\n${richNextProps}\n$3>`
  );

  if (prevContent === beforeNav) {
    console.warn("WARNING: Could not insert next-navigation props into " + currentNewestSlug + "/page.tsx — regex did not match. Navigation link will be missing.");
  } else {
    fs.writeFileSync(prevPagePath, prevContent);
    console.log(`Updated navigation in ${currentNewestSlug}/page.tsx`);
  }
}

// ── Git commit ──────────────────────────────────────────────────────
function gitCommit(topic) {
  try {
    if (process.env.CI) {
      // Git config already set in step 5, but set again in case step 5 was skipped
      execSync('git config user.name "Foxfire Auto-Explore"', { cwd: ROOT, stdio: "pipe" });
      execSync('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"', { cwd: ROOT, stdio: "pipe" });
    }
    execSync("git add -A", { cwd: ROOT, stdio: "pipe" });
    const msg = `Add exploration: ${topic.title}\n\nAuto-generated by Foxfire auto-explore script.\nFormat: ${topic.format}\n\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`;
    execSync(`git commit -m "${msg.replace(/"/g, '\\"')}"`, {
      cwd: ROOT,
      stdio: "pipe",
    });
    console.log("Committed to git.");
  } catch (err) {
    console.warn("Git commit failed:", err.message);
  }
}

// ── Helpers ─────────────────────────────────────────────────────────
function slugToComponentName(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function escapeJsx(str) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/'/g, "&apos;")
    .replace(/—/g, "&mdash;")
    .replace(/–/g, "&ndash;");
}

function escapeJs(str) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
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

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  console.log(`\n${"═".repeat(60)}`);
  console.log(`Foxfire Auto-Exploration`);
  console.log(`${new Date().toISOString()}`);
  console.log(`${"═".repeat(60)}\n`);

  const existingSlugs = getExistingExplorations();
  console.log(`${existingSlugs.length} existing explorations.\n`);

  // Step 1: Claude chooses its own topic
  const topic = await chooseTopic(existingSlugs);
  console.log(`\nChosen: "${topic.title}" [${topic.category}] (${topic.format})\n`);

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
      execSync("git pull --rebase origin main", { cwd: ROOT, stdio: "pipe" });
    } catch (err) {
      console.error("Git pull/rebase failed. Aborting rebase and exiting.");
      try { execSync("git rebase --abort", { cwd: ROOT, stdio: "pipe" }); } catch {}
      process.exit(1);
    }
  }

  // Step 6: Create page, update indexes, navigation
  const { readTime, currentNewestSlug } = createPage(topic, content, audioUrl);
  updateIndexPages(topic, readTime);
  updateNavigation(topic, currentNewestSlug, readTime);

  // Step 7: Commit
  gitCommit(topic);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s. New exploration: "${topic.title}" (${topic.format})\n`);
}

main().catch((err) => {
  console.error("Auto-explore failed:", err);
  process.exit(1);
});
