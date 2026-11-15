import { MAX_NEW_PER_RUN, MAX_VIDEO_BYTES, MAX_ZERNIO_PAGES } from "./config.js";
import { toVideo, classify } from "./posts.js";
import { splitCaption, uniqueSlug } from "./text.js";
import { readIndex, writeIndex, videoKey, posterKey } from "./store.js";

const ZERNIO_POSTS = "https://zernio.com/api/v1/posts";
const MAX_POSTER_BYTES = 10 * 1024 * 1024;

async function fetchExternal(env) {
  const rows = [];
  for (let page = 1; page <= MAX_ZERNIO_PAGES; page++) {
    const qs = new URLSearchParams({
      source: "external",
      platform: "instagram",
      accountId: env.ZERNIO_ACCOUNT_ID,
      limit: "500",
      page: String(page),
    });
    const res = await fetch(`${ZERNIO_POSTS}?${qs}`, {
      headers: { authorization: `Bearer ${env.ZERNIO_API_KEY}`, accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Zernio responded ${res.status}`);
    const data = await res.json();
    rows.push(...(Array.isArray(data.posts) ? data.posts : []));
    if (page >= (data.pagination?.pages || 1)) break;
  }
  return rows;
}

/** Streams a remote file into R2. Returns the size in bytes. */
async function copyToR2(env, url, key, contentType, maxBytes) {
  const res = await fetch(url);
  if (!res.ok) {
    res.body?.cancel();
    throw new Error(`download responded ${res.status}`);
  }
  const length = Number(res.headers.get("content-length"));
  if (!length || length > maxBytes) {
    res.body?.cancel();
    throw new Error(`unusable content-length ${res.headers.get("content-length")}`);
  }
  await env.VIDEOS.put(key, res.body, { httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" } });
  return length;
}

/**
 * Copies new classified Instagram videos from Zernio into R2 and keeps captions current.
 * Safe to run repeatedly: videos already hosted are never downloaded again.
 */
export async function sync(env, { maxNew = MAX_NEW_PER_RUN } = {}) {
  if (!env.ZERNIO_API_KEY || !env.ZERNIO_ACCOUNT_ID) {
    console.warn("sync skipped: ZERNIO_API_KEY or ZERNIO_ACCOUNT_ID is not set");
    return { skipped: true };
  }
  const rows = await fetchExternal(env);
  const index = await readIndex(env, { fresh: true });
  const byId = new Map(index.videos.map((v) => [v.id, v]));
  const taken = new Set(index.videos.map((v) => v.slug));

  const candidates = rows
    .map(toVideo)
    .filter(Boolean)
    .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));

  let added = 0;
  let failed = 0;
  let changed = false;
  let pending = 0;

  for (const v of candidates) {
    const existing = byId.get(v.id);
    if (existing) {
      if (existing.caption !== v.caption) {
        existing.caption = v.caption;
        changed = true;
      }
      continue;
    }
    if (!classify(v.caption, v.id).length) continue;
    if (added >= maxNew) {
      pending++;
      continue;
    }
    try {
      const bytes = await copyToR2(env, v.videoUrl, videoKey(v.id), "video/mp4", MAX_VIDEO_BYTES);
      let poster = false;
      if (v.posterUrl) {
        try {
          await copyToR2(env, v.posterUrl, posterKey(v.id), "image/jpeg", MAX_POSTER_BYTES);
          poster = true;
        } catch (e) {
          console.warn(`poster copy failed for ${v.id}: ${e.message}`);
        }
      }
      const slug = uniqueSlug(splitCaption(v.caption).title, v.id, taken);
      taken.add(slug);
      const entry = { id: v.id, slug, caption: v.caption, poster, bytes, publishedAt: v.publishedAt };
      index.videos.push(entry);
      byId.set(v.id, entry);
      added++;
      changed = true;
      await writeIndex(env, index); // save after each video so progress survives a failure
    } catch (e) {
      failed++;
      console.error(`copy failed for ${v.id}: ${e.message}`);
    }
  }
  if (changed) await writeIndex(env, index);
  const result = { added, failed, pending, total: index.videos.length };
  console.log("sync done", JSON.stringify(result));
  return result;
}
