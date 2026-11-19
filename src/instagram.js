// Reads the hashtags of a reel from its public Instagram embed page. Zernio keeps the caption it first
// imported, so the tags the client adds later only show up on Instagram.
const UA = "Mozilla/5.0 (compatible; human-therapist.org sync)";

/**
 * Returns the lowercase hashtags of the reel, or null when Instagram gave no usable caption
 * (blocked, rate limited, deleted, or a reel without a caption). Callers then fall back to Zernio.
 */
export async function fetchIgTags(code, fetcher = fetch) {
  try {
    const res = await fetcher(`https://www.instagram.com/reel/${encodeURIComponent(code)}/embed/captioned/`, {
      headers: { "user-agent": UA },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      res.body?.cancel();
      return null;
    }
    return parseTags(await res.text());
  } catch {
    return null;
  }
}

export function parseTags(html) {
  if (!html.includes('class="Caption"')) return null;
  const tags = new Set();
  for (const m of html.matchAll(/\/explore\/tags\/([^/"?]+)\//g)) {
    try {
      tags.add(decodeURIComponent(m[1]).toLowerCase());
    } catch {
      /* skip malformed */
    }
  }
  return [...tags];
}
