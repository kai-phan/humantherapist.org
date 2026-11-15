// Video index and files live in one R2 bucket (binding: VIDEOS).
//   index.json          { videos: [{ id, slug, caption, poster, bytes, publishedAt }] }
//   v/<shortcode>.mp4   the video
//   p/<shortcode>.jpg   the poster image
const INDEX_KEY = "index.json";
const TTL_MS = 60_000;
let memo = { at: 0, data: null };

export const videoKey = (id) => `v/${id}.mp4`;
export const posterKey = (id) => `p/${id}.jpg`;

export async function readIndex(env, { fresh = false } = {}) {
  if (!fresh && memo.data && Date.now() - memo.at < TTL_MS) return memo.data;
  const obj = await env.VIDEOS.get(INDEX_KEY);
  const data = obj ? await obj.json() : { videos: [] };
  if (!Array.isArray(data.videos)) data.videos = [];
  memo = { at: Date.now(), data };
  return data;
}

export async function writeIndex(env, data) {
  await env.VIDEOS.put(INDEX_KEY, JSON.stringify(data), { httpMetadata: { contentType: "application/json" } });
  memo = { at: Date.now(), data };
}
