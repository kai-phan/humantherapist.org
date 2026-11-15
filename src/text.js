import { REDACT } from "./config.js";

const HASHTAG_RE = /#[\p{L}\p{N}_]+/gu;

export const hashtagSet = (caption) =>
  new Set([...(caption || "").matchAll(/#([\p{L}\p{N}_]+)/gu)].map((m) => m[1].toLowerCase()));

/** Site style: "Therapy" is always written with a capital T, and redacted names are removed. */
export function brand(text, redact = REDACT) {
  let out = String(text || "");
  for (const r of [...redact].sort((a, b) => b.length - a.length)) out = out.split(r).join("");
  return out
    .replace(/\btherapy\b/gi, "Therapy")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

/** Removes hashtags and normalizes whitespace, keeping paragraph breaks. */
export function cleanCaption(caption) {
  return String(caption || "")
    .replace(/\r/g, "")
    .replace(HASHTAG_RE, "")
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

const ABBR = /\b(?:Dr|Mr|Mrs|Ms|Prof|St|vs|Jr|Sr|Inc|Ltd|etc|e\.g|i\.e)\.$/i;
const MAX_TITLE = 140;

/** First sentence is the heading (and the URL slug). The rest is the description. */
export function splitCaption(caption) {
  const text = cleanCaption(caption);
  if (!text) return { title: "", body: [] };
  const firstPara = text.split("\n\n")[0];
  const rest = text.split("\n\n").slice(1);

  let cut = firstPara.length;
  for (const m of firstPara.matchAll(/[.!?]+(?=\s|$)/g)) {
    const end = m.index + m[0].length;
    if (ABBR.test(firstPara.slice(0, end))) continue;
    cut = end;
    break;
  }
  let title = firstPara.slice(0, cut).trim();
  let tail = firstPara.slice(cut).trim();

  if (title.length > MAX_TITLE) {
    const head = title.slice(0, MAX_TITLE);
    const i = head.lastIndexOf(" ");
    const keep = i > 60 ? head.slice(0, i) : head;
    tail = (title.slice(keep.length).trim() + " " + tail).trim();
    title = keep.replace(/[,;:\s-]+$/, "");
  }
  title = title.replace(/\.$/, "");
  return { title, body: [tail, ...rest].filter(Boolean) };
}

export function slugify(text, max = 80) {
  let s = String(text || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (s.length > max) {
    s = s.slice(0, max);
    const i = s.lastIndexOf("-");
    if (i > 30) s = s.slice(0, i);
  }
  return s.replace(/-+$/, "");
}

export function uniqueSlug(title, id, taken) {
  const base = slugify(title) || slugify(id) || "video";
  if (!taken.has(base)) return base;
  const withId = `${base}-${slugify(id, 12)}`;
  if (!taken.has(withId)) return withId;
  let n = 2;
  while (taken.has(`${withId}-${n}`)) n++;
  return `${withId}-${n}`;
}

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const jsonForScript = (obj) => JSON.stringify(obj).replace(/</g, "\\u003c").replace(/\u2028|\u2029/g, "");

export function truncate(text, max) {
  const t = String(text || "");
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const i = cut.lastIndexOf(" ");
  return (i > max * 0.6 ? cut.slice(0, i) : cut).trimEnd() + "…";
}
