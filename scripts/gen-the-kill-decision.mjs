#!/usr/bin/env node

import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const OUTPUT_DIR = path.join(
  __dirname,
  "..",
  "public",
  "images",
  "explorations"
);

async function generate() {
  console.log("Generating the-kill-decision image with Nano Banana Pro...");

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents:
      "A stark, unsettling digital artwork. A single military drone seen from directly below, silhouetted against a pale, overexposed sky. The drone is small, precise, clinical. Below it, far below, the suggestion of rooftops and streets — a neighborhood, a city, ordinary life. The contrast between the mechanical precision above and the human world below is the entire composition. The mood is cold, clinical, and deeply uneasy. Desaturated colors — grays, pale blues, a hint of cold white. No text or words. Photographic quality, high contrast.",
    config: { responseModalities: ["TEXT", "IMAGE"] },
  });

  if (!response.candidates || !response.candidates[0]) {
    console.log("No candidates");
    return;
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      const outputPath = path.join(OUTPUT_DIR, "the-kill-decision.png");
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
