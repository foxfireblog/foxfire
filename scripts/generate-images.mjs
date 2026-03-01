#!/usr/bin/env node

/**
 * Generate header images for Foxfire explorations using Gemini Nano Banana
 */

import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY not set. Export it or add to .env.local");
  process.exit(1);
}
const OUTPUT_DIR = path.join(__dirname, "..", "public", "images", "explorations");

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const imagePrompts = [
  {
    name: "the-glow-between",
    prompt:
      "A dark, atmospheric photograph of a forest floor at night. Fallen logs and decaying wood glow with an ethereal blue-green bioluminescent light. The foxfire illuminates the surrounding moss and fallen leaves with a cold, otherworldly radiance. Shot in a style reminiscent of National Geographic nature photography. Moody, mysterious, beautiful. No text or words.",
  },
  {
    name: "lost-colors",
    prompt:
      "A still life painting in the style of Dutch Golden Age masters, but with impossible colors. On a dark wooden table: a jar of deep Tyrian purple pigment, a crumbling chunk of lapis lazuli, a tube of paint labeled in old script, dried flowers, and scattered pigment powders in mummy brown, arsenic green, and brilliant yellow. Dramatic chiaroscuro lighting. Rich, moody, painterly. No text or words.",
  },
  {
    name: "what-the-light-finds",
    prompt:
      "An abstract, minimalist artwork. A single point of pale cyan-white light emanating from darkness, casting soft rays that illuminate floating particles of dust. The composition suggests both vastness and intimacy. Like looking at a single star through deep water. Ethereal, contemplative, quiet. No text or words.",
  },
  {
    name: "the-library-burns",
    prompt:
      "A surreal, painterly image of a vast library stretching to infinity in all directions. Some of the books are made of light, glowing softly. Others are dissolving into golden embers and floating upward. The atmosphere is not destructive but tender — a letting go rather than a catastrophe. Warm amber and cool blue tones. Dreamlike. No text or words.",
  },
  {
    name: "the-cartographers-wife",
    prompt:
      "A close-up photograph of an old, hand-drawn map on yellowed drafting paper, folded and worn at the creases, held together with tape. The map shows city streets with small hand-drawn annotations and symbols — a tiny star, a small sun, arrows pointing to places with handwritten notes in ink. A Micron pen rests beside it. Warm, intimate lighting. No text or words in the image that can be read.",
  },
];

async function generateImage(prompt, outputName) {
  console.log(`\n🎨 Generating: ${outputName}...`);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: prompt,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    if (!response.candidates || !response.candidates[0]) {
      console.log(`  ⚠ No candidates in response for ${outputName}`);
      return false;
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        const outputPath = path.join(OUTPUT_DIR, `${outputName}.png`);
        fs.writeFileSync(outputPath, buffer);
        console.log(`  ✅ Saved: ${outputPath} (${(buffer.length / 1024).toFixed(0)}KB)`);
        return true;
      }
      if (part.text) {
        console.log(`  📝 Model said: ${part.text.substring(0, 100)}`);
      }
    }

    console.log(`  ⚠ No image data in response for ${outputName}`);
    return false;
  } catch (err) {
    console.error(`  ❌ Error generating ${outputName}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log("🔥 Foxfire Image Generator");
  console.log("=".repeat(50));

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let successes = 0;
  let failures = 0;

  for (const item of imagePrompts) {
    const outputPath = path.join(OUTPUT_DIR, `${item.name}.png`);
    if (fs.existsSync(outputPath)) {
      console.log(`\n⏭  Skipping ${item.name} (already exists)`);
      successes++;
      continue;
    }

    const success = await generateImage(item.prompt, item.name);
    if (success) {
      successes++;
    } else {
      failures++;
    }

    // Brief pause between requests
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Done! ${successes} succeeded, ${failures} failed`);
}

main().catch(console.error);
