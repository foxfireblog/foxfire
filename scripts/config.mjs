// Centralized model configuration — update here when models change
export const MODELS = {
  // Primary writing model (auto-explore content generation)
  writer: "claude-opus-4-6",
  // Fast model for tweets, engagement, promo copy
  fast: "claude-sonnet-4-6",
  // Cheapest model for classification (follow-back safety filter)
  classifier: "claude-haiku-4-5-20251001",
  // Gemini models
  geminiResearch: "gemini-3.1-pro-preview",
  geminiImage: "gemini-3-pro-image-preview",
};
