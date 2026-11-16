import { AI_TAG, OVERRIDES } from "./config.js";
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
 * Returns the categories of a video: ["ai"] when the caption has the AI hashtag, otherwise ["human"].
 * A manual override (by Instagram shortcode) wins: "ai" | "human" | "both" | "hide".
 */
export function classify(caption, code, overrides = OVERRIDES, aiTag = AI_TAG) {
  const o = code && overrides[code];
  if (o === "hide") return [];
  if (o === "both") return ["ai", "human"];
  if (o === "ai" || o === "human") return [o];
  return hashtagSet(caption).has(aiTag) ? ["ai"] : ["human"];
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
  const categories = classify(entry.caption, entry.id);
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

export function filterByCategory(videos, category, limit) {
  const list = category === "all" ? videos : videos.filter((v) => v.categories.includes(category));
  return list.slice(0, limit);
}
