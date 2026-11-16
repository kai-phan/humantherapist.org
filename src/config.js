// Editable settings. No secrets belong in this file.

// A video is "AI Therapy?" only when its Instagram caption contains this hashtag (case-insensitive, no "#").
// Every other video is "Human-Therapist".
export const AI_TAG = "aiharms";

// Manual overrides, keyed by the Instagram shortcode (instagram.com/reel/<SHORTCODE>/).
// Takes priority over hashtags. Values: "ai" | "human" | "both" | "hide"
//
// The "ai" entries below are the reels that carry #aiharms on Instagram but whose caption Zernio has not
// refreshed (Zernio keeps the caption it first imported for older posts). Regenerate the list with
// `node scripts/scan-instagram-tags.mjs` after the client tags more reels. Reels tagged after the
// scan are picked up from Zernio automatically.
export const OVERRIDES = {
  "DfxQcyWhdvi": "ai",
  "Dflk8NLBRq6": "ai",
  "DffHqYwhnH_": "ai",
  "DfXL4RLh3Fh": "ai",
  "DfRgUvEh658": "ai",
  "DfO0aVtB8bx": "ai",
  "DfM7dK7hILt": "ai",
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

// Public labels. Red label = AI, blue label = Human.
export const LABELS = { ai: "AI Therapy?", human: "Human-Therapist" };

// Text removed from every caption before it is shown on the site.
export const REDACT = ["Alejandro Daniel Pina, LMFT", "Alejandro Daniel Pina", "Alejandro Pina"];

// Sync limits (the cron job copies new videos from Instagram into R2).
export const MAX_NEW_PER_RUN = 8; // keeps a run well inside Workers subrequest limits
export const MAX_VIDEO_BYTES = 150 * 1024 * 1024;
export const MAX_ZERNIO_PAGES = 3; // 500 posts per page; Zernio keeps about 12 months

export const SITE = "https://human-therapist.org";
export const IG_HANDLE = "humantherapistorg"; // "@humantherapistorg" in a caption links to this profile
