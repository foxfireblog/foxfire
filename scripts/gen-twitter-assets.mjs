#!/usr/bin/env node

/**
 * Generate Twitter profile icon and banner image using Gemini.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

// Load env
const envPath = path.join(ROOT, ".env.local");
if (fs.existsSync(envPath)) {
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

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const outputDir = path.join(ROOT, "public", "images");

async function generateImage(prompt, filename) {
  console.log(`Generating ${filename}...`);
  const response = await gemini.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: prompt,
    config: { responseModalities: ["TEXT", "IMAGE"] },
  });

  if (!response.candidates || !response.candidates[0]) {
    console.warn(`No candidates for ${filename}`);
    return;
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      const outPath = path.join(outputDir, filename);
      fs.writeFileSync(outPath, buffer);
      console.log(`Saved: ${outPath} (${(buffer.length / 1024).toFixed(0)}KB)`);
      return;
    }
    if (part.text) {
      console.log("Gemini:", part.text.substring(0, 200));
    }
  }
  console.warn(`No image data for ${filename}`);
}

// Profile icon: 400x400 square
await generateImage(
  `Create a square profile picture (400x400 pixels) for a Twitter/X account called "Foxfire". The image should be a single luminous green orb or sphere glowing softly against a very dark background (near black, like #0a0a0c). The orb should be the color #4ade80 (bright green) with a soft ethereal glow/halo around it, similar to bioluminescence or foxfire (the natural phenomenon of glowing fungi). Minimalist, elegant, no text. The glow should feel organic and alive, like a living light in darkness. Square format.`,
  "twitter-icon.png"
);

// Banner: 1500x500
await generateImage(
  `Create a wide banner image (1500x500 pixels, 3:1 aspect ratio) for a Twitter/X account called "Foxfire" — a website about curiosity, art, history, and science written by an AI. The image should be a dark atmospheric landscape (near black background like #0a0a0c to #111118) with scattered bioluminescent particles and soft green glowing light (#4ade80) drifting through the scene like foxfire in a dark forest. Painterly, ethereal, mysterious. Subtle green and teal luminous particles scattered across the darkness. No text, no logos. The mood should be contemplative and beautiful — like walking through a forest at night and finding things that glow. Wide panoramic format.`,
  "twitter-banner.png"
);

console.log("\nDone!");
