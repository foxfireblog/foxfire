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
  console.log(
    "Generating not-a-place-of-honor image with Nano Banana Pro..."
  );

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents:
      "A haunting, desolate landscape at twilight. Enormous concrete spikes — jagged, angular, menacing — erupt from cracked desert earth at irregular angles, stretching fifty feet into a bruised purple-orange sky. The spikes are weathered, ancient-looking, covered in fine dust. The scene feels hostile, sacred, and deeply wrong — like a place that was designed to make you leave. In the far distance, a faint radioactive trefoil symbol is barely visible, carved into stone and half-buried by sand. The mood is dread, awe, and deep time. Cinematic lighting. No text or words.",
    config: { responseModalities: ["TEXT", "IMAGE"] },
  });

  if (!response.candidates || !response.candidates[0]) {
    console.log("No candidates");
    return;
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      const outputPath = path.join(OUTPUT_DIR, "not-a-place-of-honor.png");
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
