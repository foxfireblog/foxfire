import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const envPath = ".env.local";
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const idx = line.indexOf("=");
  if (idx > 0 && !line.startsWith("#")) {
    const key = line.substring(0, idx).trim();
    let val = line.substring(idx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  }
}

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const resp = await gemini.models.generateContent({
  model: "gemini-3.1-pro-preview",
  contents: "Find authoritative sources about the Wow! Signal detected at Ohio State University in 1977. Provide 5-8 URLs.",
  config: { tools: [{ googleSearch: {} }] },
});

console.log("Text:", resp.candidates?.[0]?.content?.parts?.map(p => p.text).join("").substring(0, 500));
console.log("\nGrounding keys:", Object.keys(resp.candidates?.[0]?.groundingMetadata || {}));
const chunks = resp.candidates?.[0]?.groundingMetadata?.groundingChunks;
console.log("\nChunks count:", chunks?.length || 0);
if (chunks) {
  for (const c of chunks.slice(0, 5)) {
    console.log("  -", c.web?.title, "→", c.web?.uri);
  }
}
