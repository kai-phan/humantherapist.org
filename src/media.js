import { videoKey, posterKey } from "./store.js";

const MEDIA_RE = /^\/media\/([A-Za-z0-9_-]{5,40})\.(mp4|jpg)$/;

/** Serves hosted videos and posters from R2, with HTTP Range support for video seeking. */
export async function serveMedia(request, env) {
  const m = MEDIA_RE.exec(new URL(request.url).pathname);
  if (!m) return new Response("Not found", { status: 404 });
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405 });

  const [, id, ext] = m;
  const key = ext === "mp4" ? videoKey(id) : posterKey(id);
  const wantsRange = request.headers.has("range");

  let obj;
  try {
    obj = await env.VIDEOS.get(key, wantsRange ? { range: request.headers } : undefined);
  } catch {
    return new Response("Range not satisfiable", { status: 416 });
  }
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");

  let status = 200;
  if (wantsRange && obj.range) {
    const { offset = 0, length = obj.size - offset } = obj.range;
    headers.set("content-range", `bytes ${offset}-${offset + length - 1}/${obj.size}`);
    headers.set("content-length", String(length));
    status = 206;
  } else {
    headers.set("content-length", String(obj.size));
  }
  return new Response(request.method === "HEAD" ? null : obj.body, { status, headers });
}
