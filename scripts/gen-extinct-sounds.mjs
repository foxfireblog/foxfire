#!/usr/bin/env node

import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const OUTPUT_DIR = path.join(__dirname, "..", "public", "images", "explorations");

async function generate() {
  console.log("Generating all-the-silences image with Nano Banana Pro...");

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents:
      "A dark, dramatic composition: a single Edison phonograph cylinder floating in a void of absolute black, glowing faintly from within with a warm amber-gold light. Tiny particles of sound seem to be escaping from it — visible waves dissolving into darkness like smoke or dust motes caught in light. The cylinder is old, scratched, beautiful. Below it, barely visible, the silhouette of a small bird on a bare branch. The mood is elegiac, tender, reverent. No text or words.",
    config: { responseModalities: ["TEXT", "IMAGE"] },
  });

  if (!response.candidates || !response.candidates[0]) {
    console.log("No candidates");
    return;
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      const outputPath = path.join(OUTPUT_DIR, "all-the-silences.png");
      fs.writeFileSync(outputPath, buffer);
      console.log(
        "Saved:",
        outputPath,
        "(" + (buffer.length / 1024).toFixed(0) + "KB)"
      );
      return;
    }
    if (part.text) {
      console.log("Model said:", part.text.substring(0, 200));
    }
  }
  console.log("No image data in response");
}

generate().catch(console.error);
