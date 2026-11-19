// Editable settings. No secrets belong in this file.

// Three groups, decided by the Instagram caption hashtag (case-insensitive, no "#"):
//   #aiharms       -> "ai"         label "AI Therapy?"             page /ai-harms/
//   #fortherapists -> "therapists" label "Human-Therapist"         page /for-human-therapists/
//   anything else  -> "human"      label "Therapeutic Relationship" page /therapeutic-relationship/
// When a caption has both tags, #aiharms wins.
export const AI_TAG = "aiharms";
export const THERAPISTS_TAG = "fortherapists";

// Manual overrides, keyed by the Instagram shortcode (instagram.com/reel/<SHORTCODE>/).
// Takes priority over hashtags. Values: "ai" | "human" | "therapists" | "both" | "hide"
//
// Priority: override, then the hashtags read from Instagram by the sync (src/instagram.js), then the Zernio
// caption. The "ai" entries below were added before the sync read Instagram tags and are now redundant
// where the reel still carries #aiharms on Instagram. Remove one when the client changes its tag.
export const OVERRIDES = {
  // No hashtags on Instagram, but an AI harm video.
  "DeqOjCphfqW": "ai",
  "DfxQcyWhdvi": "ai",
  "DffHqYwhnH_": "ai",
  "DfXL4RLh3Fh": "ai",
  "DfRgUvEh658": "ai",
  "DfO0aVtB8bx": "ai",
  "DfE7YSbB0T2": "ai",
  "De_4yx_hdB9": "ai",
  "De3RXudB6SJ": "ai",
  "De14ySpBede": "ai",
  "DehZv9ThKD2": "ai",
  "DegdWftB3P8": "ai",
  "Dee1MtLBf0T": "ai",
  "DecF8d1hLga": "ai",
  "DeUj_EDBqcK": "ai",
  "DeS1s3XhuaZ": "ai",
  "DePQwlXB9X9": "ai",
  "DdjgQg_humU": "ai",
  "DdblZf8hIbd": "ai",
  "DdbkifmBk1v": "ai",
  "DdWzm7WB8s0": "ai",
  "DdSbeyDhIVV": "ai",
  "DdK0YXGB1QM": "ai",
  "DdEdBy9hSZo": "ai",
  "Dc_Ql15hZfv": "ai",
  "Dc6Sz3dB1af": "ai",
  "Dc41CSQhY3l": "ai",
  "Dc1B_xHByu1": "ai",
  "DcoL-VwhuOR": "ai",
  "DclunDnBmdK": "ai",
  "DckgaulhDpu": "ai",
  "DceFF9yB-QX": "ai",
  "DcXvUhshXKX": "ai",
  "DcTmx41BLnu": "ai",
  "Db8nHx3BLZU": "ai",
  "Dbw79T3B3Rr": "ai",
  "DbbGJOwhNfz": "ai",
  "DbFMK2UhMBH": "ai",
  "DalGcaJBh9_": "ai",
  "DZiJEQUhgqh": "ai",
  "DZXzkFHhID2": "ai",
  "DZSQ5IGhhTv": "ai",
  "DZISwEChrw_": "ai",
  "DY-PHiThPOL": "ai",
  "DXzUJjRBGk2": "ai",
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
