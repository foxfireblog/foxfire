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
  console.log("Generating phantom-islands image with Nano Banana Pro...");

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents:
      "An enormous antique nautical chart spread across a table, illuminated by candlelight, showing the Atlantic Ocean with several islands marked in red ink that seem to shimmer and fade — some are half-transparent, ghostly, dissolving at the edges into the parchment. Compass roses, sea monsters at the margins, old sailing ships. The map is beautiful and meticulous but some of its islands are clearly phantoms. Dark, atmospheric, rich amber and sepia tones with touches of faded vermillion. No readable text or words.",
    config: { responseModalities: ["TEXT", "IMAGE"] },
  });

  if (!response.candidates || !response.candidates[0]) {
    console.log("No candidates");
    return;
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      const outputPath = path.join(OUTPUT_DIR, "phantom-islands.png");
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
