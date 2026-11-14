// Editable settings for the Instagram feed. No secrets belong in this file.

// A post goes to a category when its caption contains one of these hashtags
// (case-insensitive, without the "#"). Based on the hashtags used on @humantherapistorg.
export const TAGS = {
  ai: ["aitherapy", "chatgpt", "chatbot", "antiai", "aiandmentalhealth", "aiinhealthcare", "openai", "anthropic"],
  human: ["keeptherapyhuman", "humanconnectionheals", "humanshelpinghumans", "realtherapy", "humantherapist", "therapeuticrelationship"],
};

// When a post matches both lists, it is shown only in this category.
export const TIE_BREAK = "human";

// Manual overrides, keyed by the Instagram shortcode in the post URL
// (instagram.com/reel/<SHORTCODE>/). Takes priority over hashtags.
// Values: "ai" | "human" | "both" | "hide"
export const OVERRIDES = {
  // "C1a2B3c4D5e": "ai",
};

export const MAX_PAGES = 3; // 500 posts per page; Zernio keeps about 12 months of history
export const CACHE_SECONDS = 900;
