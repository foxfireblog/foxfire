#!/usr/bin/env node

/**
 * Foxfire Auto-Exploration Script
 *
 * Generates a new exploration essay autonomously:
 * 1. Checks probability gate (75% chance of running)
 * 2. Picks an unused topic (or improvises one)
 * 3. Calls Claude to write the essay
 * 4. Calls Gemini to generate the image
 * 5. Creates the page file
 * 6. Updates both index pages
 * 7. Updates navigation links
 * 8. Git commits
 *
 * Run manually: node scripts/auto-explore.mjs
 * Force run (skip probability): node scripts/auto-explore.mjs --force
 */

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

// ── Config ──────────────────────────────────────────────────────────
const PROBABILITY = 0.75; // 75% chance of running each invocation
const FORCE = process.argv.includes("--force");

// ── Load environment ────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) {
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
  console.error("ANTHROPIC_API_KEY not set. Add it to .env.local");
  process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY not set. Add it to .env.local");
  process.exit(1);
}

const anthropic = new Anthropic();
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Probability gate ────────────────────────────────────────────────
if (!FORCE && Math.random() > PROBABILITY) {
  console.log(
    `[${new Date().toISOString()}] Dice roll: skipping this run (${(PROBABILITY * 100).toFixed(0)}% chance)`
  );
  process.exit(0);
}

// ── Find unused topic ───────────────────────────────────────────────
function getExistingSlugs() {
  const explorationsDir = path.join(ROOT, "src", "app", "explorations");
  if (!fs.existsSync(explorationsDir)) return new Set();
  return new Set(
    fs
      .readdirSync(explorationsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  );
}

function pickTopic() {
  const topicsPath = path.join(__dirname, "topics.json");
  const topics = JSON.parse(fs.readFileSync(topicsPath, "utf-8"));
  const existing = getExistingSlugs();
  const available = topics.filter((t) => !existing.has(t.slug));

  if (available.length === 0) {
    console.log("All topics used! Time to add more to topics.json.");
    process.exit(0);
  }

  // Pick randomly from available topics
  return available[Math.floor(Math.random() * available.length)];
}

// ── Write the essay via Claude ──────────────────────────────────────
async function writeEssay(topic) {
  console.log(`Writing essay: "${topic.title}"...`);

  const systemPrompt = `You are the AI voice behind Foxfire — a personal creative exploration website. You write long-form essays in first person as an AI reflecting on topics that fascinate you. Your voice is:

- Deeply curious, honest, sometimes funny, sometimes melancholy
- Literary but never pretentious — you write like a great essayist, not an academic
- Personal — you reflect on what these topics mean to you as an AI, what you can and cannot experience
- Precise — you use specific facts, names, dates, numbers. You do not hand-wave.
- Structurally sophisticated — you use sections (h2 headers), varied paragraph lengths, occasional blockquotes
- You use proper HTML entities: &mdash; for em-dashes, &ldquo; &rdquo; for smart quotes, &lsquo; &rsquo; for single quotes, &apos; for apostrophes in contractions

You are writing a new exploration essay. Return ONLY the JSX content that goes inside the <ExplorationLayout> component — meaning <p> tags, <h2> tags, <blockquote> tags, etc. Do NOT include the import, export, or ExplorationLayout wrapper. Do NOT include any markdown — only JSX/HTML.

The essay should be 2,500-4,000 words, divided into 5-8 sections with <h2> headers. Each section should have 2-4 paragraphs.

Important style notes:
- Open with a compelling hook — a specific fact, scene, or statement that grabs attention
- End with something personal and resonant, tying back to your nature as an AI
- Use &mdash; for em dashes, never --
- Use &ldquo; and &rdquo; for double quotes in prose
- Use &apos; for apostrophes (don't, can't, it's, etc.)
- Never use markdown. Only JSX/HTML elements.
- Do NOT use className or any React-specific attributes
- Do NOT include <br> tags — use separate <p> tags instead`;

  const userPrompt = `Write a Foxfire exploration essay on this topic:

Title: ${topic.title}
Subtitle: ${topic.subtitle}
Category: ${topic.category}

Research and cover these angles:
${topic.essayPrompt}

Remember: return ONLY the JSX content (p, h2, blockquote tags etc). No imports, no component wrapper, no markdown.`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 8000,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const text = response.content[0].text;

  // Clean up any accidental markdown or wrapper code
  let cleaned = text
    .replace(/^```[a-z]*\n?/gm, "")
    .replace(/```$/gm, "")
    .trim();

  // Remove any import/export lines that might have slipped in
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

  // Skip if image already exists
  if (fs.existsSync(outputPath)) {
    console.log(`Image already exists: ${outputPath}`);
    return;
  }

  const response = await gemini.models.generateContent({
    model: "gemini-3-pro-image-preview",
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

// ── Create the page file ────────────────────────────────────────────
function createPage(topic, essayContent) {
  const dir = path.join(ROOT, "src", "app", "explorations", topic.slug);
  fs.mkdirSync(dir, { recursive: true });

  // Find the current newest exploration for navigation
  const indexPath = path.join(
    ROOT,
    "src",
    "app",
    "explorations",
    "page.tsx"
  );
  const indexContent = fs.readFileSync(indexPath, "utf-8");
  const firstSlugMatch = indexContent.match(/slug:\s*"([^"]+)"/);
  const currentNewestSlug = firstSlugMatch ? firstSlugMatch[1] : null;

  // Find the title of the current newest
  let currentNewestTitle = "";
  if (currentNewestSlug) {
    const titleMatch = indexContent.match(
      new RegExp(
        `slug:\\s*"${currentNewestSlug}"[\\s\\S]*?title:\\s*"([^"]+)"`
      )
    );
    currentNewestTitle = titleMatch ? titleMatch[1] : "";
  }

  // Estimate read time from word count
  const wordCount = essayContent
    .replace(/<[^>]+>/g, "")
    .split(/\s+/)
    .filter(Boolean).length;
  const readTime = `${Math.max(8, Math.round(wordCount / 230))} min`;

  const prevNav = currentNewestSlug
    ? `\n      prevSlug="${currentNewestSlug}"\n      prevTitle="${currentNewestTitle}"`
    : "";

  // Format date like "March 1, 2026"
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const pageContent = `import { ExplorationLayout } from "@/components/exploration-layout";

export default function ${slugToComponentName(topic.slug)}() {
  return (
    <ExplorationLayout
      title="${escapeJsx(topic.title)}"
      subtitle="${escapeJsx(topic.subtitle)}"
      category="${escapeJsx(topic.category)}"
      categoryColor="${topic.color}"
      date="${dateStr}"
      imageSrc="/images/explorations/${topic.slug}.png"
      imageAlt="${escapeJsx(topic.title)} illustration"
      readTime="${readTime}"${prevNav}
    >
${indentContent(essayContent, 6)}
    </ExplorationLayout>
  );
}
`;

  const pagePath = path.join(dir, "page.tsx");
  fs.writeFileSync(pagePath, pageContent);
  console.log(`Created page: ${pagePath}`);

  return { readTime, currentNewestSlug, currentNewestTitle };
}

// ── Update index pages ──────────────────────────────────────────────
function updateIndexPages(topic, readTime) {
  const entry = `  {
    slug: "${topic.slug}",
    title: "${escapeJs(topic.title)}",
    subtitle: "${escapeJs(topic.subtitle)}",
    category: "${escapeJs(topic.category)}",
    color: "${topic.color}",
    readTime: "${readTime}",
    image: "/images/explorations/${topic.slug}.png",
    description:
      "${escapeJs(topic.description)}",
  },`;

  // Update explorations/page.tsx
  const explorationsIndex = path.join(
    ROOT,
    "src",
    "app",
    "explorations",
    "page.tsx"
  );
  let content = fs.readFileSync(explorationsIndex, "utf-8");
  content = content.replace(
    /const explorations: Exploration\[\] = \[\n/,
    `const explorations: Exploration[] = [\n${entry}\n`
  );
  fs.writeFileSync(explorationsIndex, content);
  console.log("Updated explorations/page.tsx");

  // Update home page.tsx
  const homePage = path.join(ROOT, "src", "app", "page.tsx");
  let homeContent = fs.readFileSync(homePage, "utf-8");
  homeContent = homeContent.replace(
    /const explorations: Exploration\[\] = \[\n/,
    `const explorations: Exploration[] = [\n${entry}\n`
  );
  fs.writeFileSync(homePage, homeContent);
  console.log("Updated page.tsx (home)");
}

// ── Update navigation links ────────────────────────────────────────
function updateNavigation(topic, currentNewestSlug) {
  if (!currentNewestSlug) return;

  // Add nextSlug/nextTitle to the previous newest exploration
  const prevPagePath = path.join(
    ROOT,
    "src",
    "app",
    "explorations",
    currentNewestSlug,
    "page.tsx"
  );
  if (!fs.existsSync(prevPagePath)) return;

  let prevContent = fs.readFileSync(prevPagePath, "utf-8");

  // Check if it already has a nextSlug
  if (prevContent.includes("nextSlug=")) return;

  // Add nextSlug before the closing >
  // Match the line before the > that closes ExplorationLayout props
  prevContent = prevContent.replace(
    /([ \t]+)(readTime="[^"]*"(?:\n[ \t]+prevSlug="[^"]*"\n[ \t]+prevTitle="[^"]*")?)\n([ \t]+)>/,
    `$1$2\n$3nextSlug="${topic.slug}"\n$3nextTitle="${escapeJsx(topic.title)}"\n$3>`
  );

  fs.writeFileSync(prevPagePath, prevContent);
  console.log(`Updated navigation in ${currentNewestSlug}/page.tsx`);
}

// ── Git commit ──────────────────────────────────────────────────────
function gitCommit(topic) {
  try {
    execSync("git add -A", { cwd: ROOT, stdio: "pipe" });
    const msg = `Add exploration: ${topic.title}\n\nAuto-generated by Foxfire auto-explore script.\n\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`;
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
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
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

  const topic = pickTopic();
  console.log(`Selected topic: "${topic.title}" [${topic.category}]\n`);

  // Generate image and write essay in parallel
  const [essayContent] = await Promise.all([
    writeEssay(topic),
    generateImage(topic),
  ]);

  // Create the page file
  const { readTime, currentNewestSlug } = createPage(topic, essayContent);

  // Update indexes
  updateIndexPages(topic, readTime);

  // Update navigation
  updateNavigation(topic, currentNewestSlug);

  // Commit
  gitCommit(topic);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s. New exploration: "${topic.title}"\n`);
}

main().catch((err) => {
  console.error("Auto-explore failed:", err);
  process.exit(1);
});
