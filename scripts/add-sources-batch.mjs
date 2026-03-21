#!/usr/bin/env node
/**
 * Retroactively add inline citations + footnotes to existing explorations.
 *
 * For each exploration that doesn't already have citations:
 *   1. Extract article JSX body content
 *   2. Research via Gemini + Google Search grounding to find sources
 *   3. Send body + sources to Claude to insert inline roman numeral citations
 *   4. Append a footnotes section at the bottom
 *
 * Usage:
 *   node scripts/add-sources-batch.mjs                        # all missing
 *   node scripts/add-sources-batch.mjs --slug=the-wow-signal  # specific one
 *   node scripts/add-sources-batch.mjs --dry-run              # preview sources only
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
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
const anthropic = new Anthropic();

const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];

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
    if (content.includes("src-i") || (content.includes("Sources") && (content.includes("<details") || content.includes("<section")))) {
      console.log(`  [skip] ${slug} — already has citations`);
      skipped++;
      continue;
    }

    // Skip poetry, art pieces, non-factual creative work, and very short pieces
    const skipCategories = ["Poetry", "Field Guide", "Humor & Honesty"];
    const isSkipCategory = skipCategories.some((c) => content.includes(`category="${c}"`));
    // Also skip pieces that are primarily creative/non-factual by slug
    const skipSlugs = ["what-the-light-finds", "things-i-cannot-do", "the-threshold-notebook", "the-ache-before-the-word"];
    if (isSkipCategory || skipSlugs.includes(slug) || content.length < 3000) {
      console.log(`  [skip] ${slug} — creative/non-factual or too short`);
      skipped++;
      continue;
    }

    console.log(`  [research] ${slug}...`);

    try {
      // Extract the JSX body between <ExplorationLayout...> and </ExplorationLayout>
      const bodyMatch = content.match(/(<ExplorationLayout[\s\S]*?>)([\s\S]*?)(\s*<\/ExplorationLayout>)/);
      if (!bodyMatch) {
        console.log(`    [skip] Could not extract body content`);
        skipped++;
        continue;
      }

      const beforeBody = content.substring(0, bodyMatch.index + bodyMatch[1].length);
      const bodyContent = bodyMatch[2];
      const afterBody = bodyMatch[3] + content.substring(bodyMatch.index + bodyMatch[0].length);

      // Extract plain text for research
      const plainText = bodyContent
        .replace(/<[^>]+>/g, " ")
        .replace(/&[a-z]+;/g, " ")
        .replace(/&#\d+;/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 4000);

      // Extract title
      const titleMatch = content.match(/title="([^"]+)"/);
      const title = titleMatch ? titleMatch[1] : slug;

      // Step 1: Research via Gemini to find sources
      const researchPrompt = `I have an article titled "${title}". Here is a summary of its content:

${plainText}

Please find the most relevant and authoritative sources for the key facts, claims, and stories mentioned in this article. For each source, provide the exact URL. Focus on primary sources, reputable publications, and academic or institutional sources. If a source is from Wikipedia, cite the underlying source that Wikipedia itself cites instead. Return 5-10 sources.`;

      const geminiTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini API timeout (120s)")), 120000)
      );
      const response = await Promise.race([
        gemini.models.generateContent({
          model: MODELS.geminiResearch,
          contents: researchPrompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        }),
        geminiTimeout,
      ]);

      // Extract sources primarily from the text response (Gemini includes
      // proper URLs and titles there). Grounding chunks use redirect URLs.
      const sources = [];
      const textResponse = response.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join("\n") || "";

      // Match URLs in the text response with surrounding context as title
      const urlRegex = /\*?\*?\s*(?:URL:\s*)?(https?:\/\/[^\s*),`]+)/g;
      let match;
      const allUrls = [];
      while ((match = urlRegex.exec(textResponse)) !== null) {
        allUrls.push({ url: match[1].trim(), pos: match.index });
      }

      // For each URL, extract a title from nearby text (look for bold text or numbered items)
      for (const { url, pos } of allUrls) {
        // Skip Google redirect URLs
        if (url.includes("vertexaisearch.cloud.google.com")) continue;

        // Look backwards for a title (bold text, numbered item, etc.)
        const before = textResponse.substring(Math.max(0, pos - 300), pos);
        const titleMatch = before.match(/\*\*(.+?)\*\*\s*$/s) ||
          before.match(/\d+\.\s+\*?\*?(.+?)(?:\*?\*?)?\s*$/s) ||
          before.match(/[-•]\s+(.+?)\s*$/s);

        const title = titleMatch
          ? titleMatch[1].replace(/\*+/g, "").replace(/`+/g, "").replace(/\s+/g, " ").replace(/Exact URL:\s*$/, "").trim()
          : new URL(url).hostname;

        if (!sources.some((s) => s.url === url)) {
          sources.push({ title, url });
        }
      }

      if (sources.length === 0) {
        console.log(`    [skip] No sources found`);
        skipped++;
        continue;
      }

      const finalSources = sources.slice(0, 10);
      console.log(`    Found ${finalSources.length} sources`);

      if (dryRun) {
        for (const s of finalSources) {
          console.log(`      - ${s.title}: ${s.url}`);
        }
        updated++;
        continue;
      }

      // Step 2: Send to Claude to insert inline citations
      const sourcesListForClaude = finalSources
        .map((s, i) => `[${ROMAN[i]}] ${s.title} — ${s.url}`)
        .join("\n");

      const claudePrompt = `You are adding inline citations to an existing article. Here is the article body in JSX:

<article_body>
${bodyContent}
</article_body>

Here are the sources to cite:
${sourcesListForClaude}

Your task:
1. Find 5-10 sentences in the article that make specific factual claims, cite statistics, reference historical events, or quote sources that match the provided sources.
2. Insert a superscript citation mark AFTER the relevant sentence's closing punctuation (before the closing </p> tag if it's the last sentence in a paragraph). Use this exact format:
   <sup><a href="#src-i" className="text-muted/50 hover:text-foreground no-underline transition-colors">i</a></sup>
   Use lowercase roman numerals: i, ii, iii, iv, v, vi, vii, viii, ix, x
3. Only cite sources that genuinely match the claim. Don't force citations where they don't fit.
4. Do NOT change any of the article text, HTML structure, or formatting. Only INSERT the <sup> citation marks.
5. Do NOT add the footnotes section — I will add that separately.

Return ONLY the modified article body JSX with the inline citations inserted. No explanation, no markdown fences.`;

      const claudeTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Claude API timeout (180s)")), 180000)
      );
      const claudeResponse = await Promise.race([
        anthropic.messages.create({
          model: MODELS.fast,
          max_tokens: 16000,
          messages: [{ role: "user", content: claudePrompt }],
          system: "You are a precise editor. You only insert citation marks into existing text. You never modify the original text. Return only the modified JSX.",
        }),
        claudeTimeout,
      ]);

      let citedBody = claudeResponse.content[0].text
        .replace(/^```[a-z]*\n?/gm, "")
        .replace(/```$/gm, "")
        .replace(/<\/?article_body>/g, "")
        .trim();

      // Verify Claude didn't destroy the content — basic sanity check
      const origParagraphs = (bodyContent.match(/<\/p>/g) || []).length;
      const citedParagraphs = (citedBody.match(/<\/p>/g) || []).length;
      if (Math.abs(origParagraphs - citedParagraphs) > 2) {
        console.log(`    [skip] Claude output looks malformed (paragraph count mismatch: ${origParagraphs} → ${citedParagraphs})`);
        skipped++;
        continue;
      }

      // Count how many citations were actually inserted
      const citationCount = (citedBody.match(/href="#src-/g) || []).length;
      if (citationCount === 0) {
        console.log(`    [skip] Claude didn't insert any citations`);
        skipped++;
        continue;
      }

      // Build footnotes section using only the sources that were actually cited
      const citedRomanNumerals = new Set();
      const citedMatches = citedBody.matchAll(/href="#src-([ivx]+)"/g);
      for (const m of citedMatches) {
        citedRomanNumerals.add(m[1]);
      }

      const footnoteItems = finalSources
        .map((s, i) => {
          const numeral = ROMAN[i];
          if (!citedRomanNumerals.has(numeral)) return null;
          const escapedTitle = s.title.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const escapedUrl = s.url.replace(/"/g, "&quot;");
          return `            <li id="src-${numeral}"><span className="text-muted/50 mr-2">${numeral}.</span> <a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">${escapedTitle}</a></li>`;
        })
        .filter(Boolean)
        .join("\n");

      const footnotesSection = `

          <section className="mt-12 rounded-xl border border-border bg-surface/50 p-6 not-prose">
            <h3 className="text-sm font-medium text-muted mb-4">Sources &amp; Further Reading</h3>
            <ol className="space-y-2 text-sm text-muted/80 list-none">
${footnoteItems}
            </ol>
          </section>`;

      // Reconstruct the full file
      const newContent = beforeBody + citedBody + footnotesSection + afterBody;

      fs.writeFileSync(pagePath, newContent);
      console.log(`    [done] ${slug} — ${citationCount} inline citations added`);
      updated++;

      // Rate limit
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      console.error(`    [error] ${slug}: ${err.message?.substring(0, 300)}`);
    }
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
