// Editable settings. No secrets belong in this file.

// A video goes to a category when its Instagram caption contains one of these hashtags
// (case-insensitive, without the "#"). Based on the hashtags used on @humantherapistorg.
export const TAGS = {
  ai: ["aitherapy", "chatgpt", "chatbot", "antiai", "aiandmentalhealth", "aiinhealthcare", "openai", "anthropic"],
  human: ["keeptherapyhuman", "humanconnectionheals", "humanshelpinghumans", "realtherapy", "humantherapist", "therapeuticrelationship"],
};

// When a video matches both lists, it is shown only in this category.
export const TIE_BREAK = "human";

// Manual overrides, keyed by the Instagram shortcode (instagram.com/reel/<SHORTCODE>/).
// Takes priority over hashtags. Values: "ai" | "human" | "both" | "hide"
export const OVERRIDES = {
  // "C1a2B3c4D5e": "ai",
};

// Public labels. Red label = AI, blue label = Human.
export const LABELS = { ai: "AI Harm", human: "Human-Therapist" };

// Text removed from every caption before it is shown on the site.
export const REDACT = ["Alejandro Daniel Pina, LMFT", "Alejandro Daniel Pina", "Alejandro Pina"];

// Sync limits (the cron job copies new videos from Instagram into R2).
export const MAX_NEW_PER_RUN = 8; // keeps a run well inside Workers subrequest limits
export const MAX_VIDEO_BYTES = 150 * 1024 * 1024;
export const MAX_ZERNIO_PAGES = 3; // 500 posts per page; Zernio keeps about 12 months

export const SITE = "https://human-therapist.org";
