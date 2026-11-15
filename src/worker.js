import { buildList, filterByCategory } from "./posts.js";
import { readIndex } from "./store.js";
import { sync } from "./sync.js";
import { serveMedia } from "./media.js";
import { renderVideoPage, renderSitemap } from "./pages.js";

const CATEGORIES = new Set(["ai", "human", "all"]);

const json = (body, status = 200, cache = "no-store") =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache, "x-content-type-options": "nosniff" },
  });

const notFound = (request, env) => env.ASSETS.fetch(new Request(new URL("/__not_found__", request.url), { headers: request.headers }));

async function allVideos(env) {
  return buildList((await readIndex(env)).videos);
}

async function apiPosts(url, env) {
  const category = url.searchParams.get("category") || "all";
  if (!CATEGORIES.has(category)) return json({ error: "invalid_category" }, 400);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "12", 10) || 12, 1), 60);
  const posts = filterByCategory(await allVideos(env), category, limit).map((v) => ({
    url: v.url,
    thumb: v.thumb,
    title: v.title,
    category: category === "all" ? v.categories[0] : category,
  }));
  return json({ posts, profileUrl: env.INSTAGRAM_URL || "" }, 200, "public, max-age=300");
}

async function videoPage(request, url, env) {
  const m = /^\/videos\/([^/]+)(\/?)$/.exec(url.pathname);
  if (!m) return notFound(request, env);
  if (!m[2]) return Response.redirect(`${url.origin}${url.pathname}/${url.search}`, 301);

  let slug;
  try {
    slug = decodeURIComponent(m[1]).toLowerCase();
  } catch {
    return notFound(request, env);
  }
  const videos = await allVideos(env);
  const video = videos.find((v) => v.slug === slug);
  if (!video) return notFound(request, env);

  const cat = video.categories[0];
  const related = videos.filter((v) => v.id !== video.id && v.categories.includes(cat)).slice(0, 8);
  return new Response(request.method === "HEAD" ? null : renderVideoPage(video, related), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300", "x-content-type-options": "nosniff" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    if (request.method !== "GET" && request.method !== "HEAD") return json({ error: "method_not_allowed" }, 405);

    if (pathname === "/api/posts") return apiPosts(url, env);
    if (pathname.startsWith("/api/")) return json({ error: "not_found" }, 404);
    if (pathname.startsWith("/media/")) return serveMedia(request, env);
    if (pathname === "/videos" || pathname === "/videos/") return Response.redirect(`${url.origin}/`, 301);
    if (pathname.startsWith("/videos/")) return videoPage(request, url, env);
    if (pathname === "/sitemap.xml") {
      return new Response(renderSitemap(await allVideos(env)), {
        headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
      });
    }
    return notFound(request, env);
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(sync(env));
  },
};
