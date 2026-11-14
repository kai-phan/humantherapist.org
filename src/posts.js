import { TAGS, OVERRIDES, TIE_BREAK } from "./config.js";

const SHORTCODE_RE = /\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/;
const HASHTAG_RE = /#([\p{L}\p{N}_]+)/gu;

export function shortcode(url) {
  return (SHORTCODE_RE.exec(url || "") || [])[1] || null;
}

export function hashtags(caption) {
  return new Set([...(caption || "").matchAll(HASHTAG_RE)].map((m) => m[1].toLowerCase()));
}

/** Returns an array of "ai" / "human", or [] when the post should not be shown. */
export function classify(caption, code, overrides = OVERRIDES, tags = TAGS, tieBreak = TIE_BREAK) {
  const o = code && overrides[code];
  if (o === "hide") return [];
  if (o === "both") return ["ai", "human"];
  if (o === "ai" || o === "human") return [o];
  const found = hashtags(caption);
  const hits = Object.keys(tags).filter((cat) => tags[cat].some((t) => found.has(t)));
  return hits.length > 1 ? [tieBreak] : hits;
}

export function cleanCaption(caption, max = 160) {
  const text = (caption || "").replace(HASHTAG_RE, "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : max).trimEnd() + "…";
}

const httpsUrl = (u) => {
  try {
    const x = new URL(u);
    return x.protocol === "https:" ? x.href : "";
  } catch {
    return "";
  }
};

function mediaKind(p, items) {
  if (String(p.mediaProductType || "").toUpperCase() === "REELS") return "reel";
  if (items.length > 1) return "carousel";
  return items[0]?.type === "video" ? "video" : "post";
}

/** Maps one Zernio external post (GET /v1/posts?source=external) to the public shape. Returns null if it must not be shown. */
export function normalize(p) {
  if (!p) return null;
  const entry = (p.platforms || []).find((x) => x.platform === "instagram");
  if (!entry || (entry.status && entry.status !== "published")) return null;
  if (String(p.mediaProductType || "").toUpperCase() === "STORY") return null;
  const url = httpsUrl(entry.platformPostUrl);
  if (!url) return null;
  const code = shortcode(url);
  const categories = classify(p.content, code);
  if (!categories.length) return null;
  const items = Array.isArray(p.mediaItems) ? p.mediaItems : [];
  const first = items[0] || {};
  return {
    id: code || String(p._id),
    url,
    thumb: httpsUrl(first.thumbnail || (first.type === "image" ? first.url : "")),
    caption: cleanCaption(p.content),
    date: entry.publishedAt || p.scheduledFor || null,
    type: mediaKind(p, items),
    categories,
  };
}

export function buildList(rows) {
  const seen = new Set();
  return rows
    .map(normalize)
    .filter((p) => p && !seen.has(p.id) && seen.add(p.id))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export function filterByCategory(posts, category, limit) {
  const list = category === "all" ? posts : posts.filter((p) => p.categories.includes(category));
  return list.slice(0, limit);
}
