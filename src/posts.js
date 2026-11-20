import { AI_TAG, THERAPISTS_TAG, OVERRIDES } from "./config.js";
import { hashtagSet, splitCaption, brand } from "./text.js";

const SHORTCODE_RE = /\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/;

export function shortcode(url) {
  return (SHORTCODE_RE.exec(url || "") || [])[1] || null;
}

const httpsUrl = (u) => {
  try {
    const x = new URL(u);
    return x.protocol === "https:" ? x.href : "";
  } catch {
    return "";
  }
};

/**
 * Returns the categories of a video: ["ai"] for #aiharms, ["therapists"] for #fortherapists,
 * otherwise ["human"]. #aiharms wins when both are present.
 * Order: manual override, then the hashtags read from Instagram (igTags), then the Zernio caption.
 * A manual override (by Instagram shortcode) wins: "ai" | "human" | "therapists" | "both" | "hide".
 */
export function classify(caption, code, overrides = OVERRIDES, aiTag = AI_TAG, therapistsTag = THERAPISTS_TAG, igTags = null) {
  const o = code && overrides[code];
  if (o === "hide") return [];
  if (o === "both") return ["ai", "human"];
  if (o === "ai" || o === "human" || o === "therapists") return [o];
  // Instagram's own tags come first; the Zernio caption is only the fallback.
  const tags = Array.isArray(igTags) ? new Set(igTags) : hashtagSet(caption);
  if (tags.has(aiTag)) return ["ai"];
  return tags.has(therapistsTag) ? ["therapists"] : ["human"];
}

/**
 * Reads one Zernio external post (GET /v1/posts?source=external) and returns the video
 * to host, or null when it is not a published Instagram video.
 */
export function toVideo(p) {
  if (!p) return null;
  const entry = (p.platforms || []).find((x) => x.platform === "instagram");
  if (!entry || (entry.status && entry.status !== "published")) return null;
  const product = String(p.mediaProductType || "").toUpperCase();
  if (product === "STORY") return null;
  const igUrl = httpsUrl(entry.platformPostUrl);
  const id = shortcode(igUrl);
  if (!id) return null;
  const item = (Array.isArray(p.mediaItems) ? p.mediaItems : []).find((m) => m && m.type === "video");
  const videoUrl = httpsUrl(item?.url);
  if (!videoUrl) return null;
  if (!splitCaption(p.content).title) return null;
  return {
    id,
    caption: String(p.content || ""),
    videoUrl,
    posterUrl: httpsUrl(item.thumbnail),
    publishedAt: entry.publishedAt || p.scheduledFor || null,
  };
}

/** Public, display-ready shape. Never exposes the Instagram URL, the date or source URLs. */
export function present(entry) {
  const categories = classify(entry.caption, entry.id, OVERRIDES, AI_TAG, THERAPISTS_TAG, entry.tags);
  if (!categories.length) return null;
  const { title, body } = splitCaption(entry.caption);
  return {
    id: entry.id,
    slug: entry.slug,
    url: `/videos/${entry.slug}/`,
    thumb: entry.poster ? `/media/${entry.id}.jpg` : "",
    video: `/media/${entry.id}.mp4`,
    title: brand(title),
    body: body.map((t) => brand(t)).filter(Boolean),
    categories,
    publishedAt: entry.publishedAt || null,
  };
}

export function buildList(entries) {
  return entries
    .map(present)
    .filter(Boolean)
    .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
}

export function filterByCategory(videos, category, limit, offset = 0) {
  return matching(videos, category).slice(offset, offset + limit);
}

export function matching(videos, category) {
  return category === "all" ? videos : videos.filter((v) => v.categories.includes(category));
}
