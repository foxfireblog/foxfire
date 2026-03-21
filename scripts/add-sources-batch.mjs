#!/usr/bin/env node
/**
 * Retroactively add a "Sources & Further Reading" section to existing explorations.
 *
 * For each exploration that doesn't already have a sources section:
 *   1. Extract the article's key claims/facts from the page content
 *   2. Research those claims via Gemini + Google Search grounding
 *   3. Collect the grounding source URLs
 *   4. Append a <details> "Sources & Further Reading" section at the end
 *
 * Usage:
 *   node scripts/add-sources-batch.mjs              # all missing
 *   node scripts/add-sources-batch.mjs --slug=the-wow-signal  # specific one
 *   node scripts/add-sources-batch.mjs --dry-run     # preview without writing
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { MODELS } from "./config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Load env
const envPath = path.join(ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const idx = line.indexOf("=");
    if (idx > 0 && !line.startsWith("#")) {
      const key = line.substring(0, idx).trim();
      let val = line.substring(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const args = process.argv.slice(2);
const targetSlug = args.find((a) => a.startsWith("--slug="))?.split("=")[1] || "";
const dryRun = args.includes("--dry-run");

async function main() {
  const explorationsDir = path.join(ROOT, "src", "app", "explorations");
  const slugDirs = fs.readdirSync(explorationsDir).filter((d) => {
    const p = path.join(explorationsDir, d, "page.tsx");
    return fs.existsSync(p) && d !== "category";
  });

  const toProcess = targetSlug
    ? slugDirs.filter((d) => d === targetSlug)
    : slugDirs;

  if (toProcess.length === 0) {
    console.log("No explorations to process.");
    return;
  }

  console.log(`Processing ${toProcess.length} exploration(s)${dryRun ? " (dry run)" : ""}...\n`);

  let updated = 0;
  let skipped = 0;

  for (const slug of toProcess) {
    const pagePath = path.join(explorationsDir, slug, "page.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");

    // Skip if already has sources
    if (content.includes("Sources") && content.includes("<details")) {
      console.log(`  [skip] ${slug} — already has sources section`);
      skipped++;
      continue;
    }

    // Skip poems and very short pieces
    if (content.includes('category="Poetry"') || content.length < 3000) {
      console.log(`  [skip] ${slug} — poem or too short`);
      skipped++;
      continue;
    }

    console.log(`  [research] ${slug}...`);

    try {
      // Extract plain text from the JSX content
      const bodyMatch = content.match(/<ExplorationLayout[\s\S]*?>([\s\S]*)<\/ExplorationLayout>/);
      if (!bodyMatch) {
        console.log(`    [skip] Could not extract body content`);
        skipped++;
        continue;
      }

      const plainText = bodyMatch[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/&[a-z]+;/g, " ")
        .replace(/&#\d+;/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 4000);

      // Extract title
      const titleMatch = content.match(/title="([^"]+)"/);
      const title = titleMatch ? titleMatch[1] : slug;

      // Research via Gemini to find sources
      const researchPrompt = `I have an article titled "${title}". Here is a summary of its content:

${plainText}

Please find the most relevant and authoritative sources for the key facts, claims, and stories mentioned in this article. For each source, provide:
1. The title of the source/article/page
2. The URL

Focus on:
- Primary sources and original research
- Reputable news articles or academic sources
- Wikipedia articles for general background
- Any specific works, books, or papers referenced in the text

Return 5-10 of the most relevant sources. Format each as: TITLE | URL (one per line, nothing else).`;

      const response = await gemini.models.generateContent({
        model: MODELS.geminiResearch,
        contents: researchPrompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      // Collect sources from grounding metadata
      const sources = [];
      const groundingMeta = response.candidates?.[0]?.groundingMetadata;
      if (groundingMeta?.groundingChunks) {
        for (const chunk of groundingMeta.groundingChunks) {
          if (chunk.web?.uri && chunk.web?.title) {
            // Deduplicate by URL
            if (!sources.some((s) => s.url === chunk.web.uri)) {
              sources.push({ title: chunk.web.title, url: chunk.web.uri });
            }
          }
        }
      }

      // Also parse from text response as backup
      const textResponse = response.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join("\n") || "";

      const urlRegex = /^(.+?)\s*\|\s*(https?:\/\/\S+)/gm;
      let match;
      while ((match = urlRegex.exec(textResponse)) !== null) {
        const title = match[1].trim();
        const url = match[2].trim();
        if (!sources.some((s) => s.url === url)) {
          sources.push({ title, url });
        }
      }

      if (sources.length === 0) {
        console.log(`    [skip] No sources found`);
        skipped++;
        continue;
      }

      // Limit to 10 most relevant
      const finalSources = sources.slice(0, 10);

      console.log(`    Found ${finalSources.length} sources`);

      if (dryRun) {
        for (const s of finalSources) {
          console.log(`      - ${s.title}: ${s.url}`);
        }
        updated++;
        continue;
      }

      // Build the sources section JSX
      const sourcesList = finalSources
        .map((s) => {
          const escapedTitle = s.title.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const escapedUrl = s.url.replace(/"/g, "&quot;");
          return `            <li><a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" className="text-muted/70 underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">${escapedTitle}</a></li>`;
        })
        .join("\n");

      const sourcesSection = `

          <details className="mt-12 rounded-xl border border-border bg-surface/50 p-6 not-prose">
            <summary className="cursor-pointer text-sm font-medium text-muted hover:text-foreground">Sources &amp; Further Reading</summary>
            <ol className="mt-4 space-y-2 text-sm text-muted/80 list-decimal list-inside">
${sourcesList}
            </ol>
          </details>`;

      // Insert before </ExplorationLayout>
      const newContent = content.replace(
        /(\s*)<\/ExplorationLayout>/,
        `${sourcesSection}\n$1</ExplorationLayout>`
      );

      fs.writeFileSync(pagePath, newContent);
      console.log(`    [done] Updated ${slug}`);
      updated++;

      // Rate limit — be gentle with Gemini API
      await new Promise((r) => setTimeout(r, 3000));
    } catch (err) {
      console.error(`    [error] ${slug}: ${err.message?.substring(0, 200)}`);
    }
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
