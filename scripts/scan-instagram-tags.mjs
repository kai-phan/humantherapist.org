// One-off helper. Zernio does not refresh the captions of older Instagram posts, so this reads each reel's
// public Instagram embed page and lists the ones that carry #aiharms. Paste the output into OVERRIDES
// in src/config.js. Run it by hand, sparingly: it makes one request per reel, about one per second.
//
//   node scripts/scan-instagram-tags.mjs
import { readFileSync } from "node:fs";

const TAG = "aiharms";
const DELAY_MS = 900;
const env = Object.fromEntries(
  readFileSync(new URL("../.dev.vars", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);

const res = await fetch(
  `https://zernio.com/api/v1/posts?source=external&platform=instagram&limit=500&accountId=${env.ZERNIO_ACCOUNT_ID}`,
  { headers: { authorization: `Bearer ${env.ZERNIO_API_KEY}` } },
);
if (!res.ok) throw new Error(`Zernio responded ${res.status}`);
const reels = (await res.json()).posts
  .filter((p) => String(p.mediaProductType).toUpperCase() === "REELS")
  .map((p) => ({
    code: /\/reel\/([^/]+)/.exec(p.platforms?.[0]?.platformPostUrl || "")?.[1],
    zernioHasTag: new RegExp(`#${TAG}\\b`, "i").test(p.content || ""),
  }))
  .filter((r) => r.code);

const tagged = [];
const failed = [];
let checked = 0;
for (const r of reels) {
  if (r.zernioHasTag) {
    tagged.push(r.code);
    continue;
  }
  try {
    const page = await fetch(`https://www.instagram.com/reel/${r.code}/embed/captioned/`, {
      headers: { "user-agent": "Mozilla/5.0" },
    });
    if (page.status === 429) throw new Error("rate limited, stop and retry later");
    if (!page.ok) throw new Error(`status ${page.status}`);
    const html = await page.text();
    if (html.includes(`/explore/tags/${TAG}/`)) tagged.push(r.code);
    checked++;
  } catch (e) {
    failed.push(`${r.code}: ${e.message}`);
    if (/rate limited/.test(e.message)) break;
  }
  await new Promise((ok) => setTimeout(ok, DELAY_MS));
}

console.error(`reels: ${reels.length} | checked on Instagram: ${checked} | with #${TAG}: ${tagged.length} | failed: ${failed.length}`);
for (const f of failed) console.error("  failed", f);
console.log(tagged.map((c) => `  "${c}": "ai",`).join("\n"));
