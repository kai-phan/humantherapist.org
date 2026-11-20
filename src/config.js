// Editable settings. No secrets belong in this file.

// Three groups, decided by the Instagram caption hashtag (case-insensitive, no "#"):
//   #aiharms       -> "ai"         label "AI Therapy?"             page /ai-harms/
//   #fortherapists -> "therapists" label "Human-Therapist"         page /for-human-therapists/
//   anything else  -> "human"      label "Therapeutic Relationship" page /therapeutic-relationship/
// When a caption has both tags, #aiharms wins.
export const AI_TAG = "aiharms";
export const THERAPISTS_TAG = "fortherapists";

// Manual overrides, keyed by the Instagram shortcode (instagram.com/reel/<SHORTCODE>/).
// Values: "ai" | "human" | "therapists" | "both" | "hide"
//
// Priority: override, then the hashtags the sync reads from Instagram (src/instagram.js), then the Zernio
// caption. Keep this list short: an override stops the video from following the client's hashtags.
export const OVERRIDES = {
  // Sophie / ChatGPT suicide note video. Its Instagram embed page is broken, so no hashtag can be read.
  "DeqOjCphfqW": "ai",
};

// Public labels. Red label = AI, blue labels = the other two.
export const LABELS = { ai: "AI Therapy?", therapists: "Human-Therapist", human: "Therapeutic Relationship" };

// Text removed from every caption before it is shown on the site.
export const REDACT = ["Alejandro Daniel Pina, LMFT", "Alejandro Daniel Pina", "Alejandro Pina"];

// Sync limits (the cron job copies new videos from Instagram into R2).
export const TAG_CHECKS_PER_RUN = 20; // Instagram tag lookups per run, oldest check first
export const TAG_RECHECK_MS = 6 * 60 * 60 * 1000; // how often each video's tags are read again
export const MAX_NEW_PER_RUN = 8; // keeps a run well inside Workers subrequest limits
export const MAX_VIDEO_BYTES = 150 * 1024 * 1024;
export const MAX_ZERNIO_PAGES = 3; // 500 posts per page; Zernio keeps about 12 months

export const SITE = "https://human-therapist.org";
export const IG_HANDLE = "humantherapistorg"; // "@humantherapistorg" in a caption links to this profile
