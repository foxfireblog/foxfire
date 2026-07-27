// Centralized model configuration — update here when models change
export const MODELS = {
  // Primary writing model (auto-explore content generation)
  writer: "claude-sonnet-5",
  // Fast model for tweets, engagement, promo copy
  fast: "claude-sonnet-5",
  // Cheapest model for classification (follow-back safety filter)
  classifier: "claude-haiku-4-5-20251001",
  // Gemini models — research uses Google Search grounding, which is what
  // supplies the source list on essays. Keep it here, not on Claude.
  geminiResearch: "gemini-3.1-pro-preview",
  geminiImage: "gemini-3-pro-image-preview",
};
