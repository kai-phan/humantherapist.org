import { MAX_PAGES, CACHE_SECONDS } from "./config.js";
import { buildList, filterByCategory } from "./posts.js";
import { samplePosts } from "./sample.js";

const ZERNIO_POSTS = "https://zernio.com/api/v1/posts";
const CATEGORIES = new Set(["ai", "human", "all"]);

const json = (body, status = 200, cache = "no-store") =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cache,
      "x-content-type-options": "nosniff",
    },
  });

async function fetchFromZernio(env) {
  const rows = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
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
  return buildList(rows);
}

async function loadAll(env) {
  if (!env.ZERNIO_API_KEY || !env.ZERNIO_ACCOUNT_ID) {
    if (env.ALLOW_SAMPLE === "1") return samplePosts();
    const err = new Error("not_configured");
    err.code = "not_configured";
    throw err;
  }
  return fetchFromZernio(env);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/posts") return json({ error: "not_found" }, 404);
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);

    const category = url.searchParams.get("category") || "all";
    if (!CATEGORIES.has(category)) return json({ error: "invalid_category" }, 400);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "12", 10) || 12, 1), 60);

    // One cached copy of the full classified list; each request filters it.
    const cache = caches.default;
    const cacheKey = new Request(`${url.origin}/__cache/instagram-posts`);
    let all;
    const hit = await cache.match(cacheKey);
    if (hit) {
      all = await hit.json();
    } else {
      try {
        all = await loadAll(env);
      } catch (e) {
        console.error("posts load failed:", e.message);
        return json({ error: e.code === "not_configured" ? "not_configured" : "upstream_error" }, e.code === "not_configured" ? 503 : 502);
      }
      const sample = !env.ZERNIO_API_KEY || !env.ZERNIO_ACCOUNT_ID;
      const ttl = sample || all.length === 0 ? 0 : CACHE_SECONDS; // never cache sample data or an empty result
      if (ttl > 0) {
        ctx.waitUntil(
          cache.put(cacheKey, new Response(JSON.stringify(all), { headers: { "cache-control": `public, max-age=${ttl}` } })),
        );
      }
    }

    return json(
      { posts: filterByCategory(all, category, limit), profileUrl: env.INSTAGRAM_URL || "" },
      200,
      "public, max-age=300",
    );
  },
};
