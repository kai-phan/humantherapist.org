import test from "node:test";
import assert from "node:assert/strict";
import { classify, cleanCaption, normalize, buildList, filterByCategory, shortcode } from "../src/posts.js";

const TAGS = { ai: ["aitherapy", "chatgpt"], human: ["keeptherapyhuman"] };
// Shape returned by GET /v1/posts?source=external&platform=instagram
const row = (over = {}) => ({
  _id: "65f1",
  origin: "external",
  content: "Why a chatbot is not a therapist #AITherapy #mentalhealth",
  mediaProductType: "REELS",
  scheduledFor: "2026-11-10T10:00:00Z",
  mediaItems: [{ type: "video", url: "https://cdn.example.com/v.mp4", thumbnail: "https://cdn.example.com/t.jpg" }],
  platforms: [
    {
      platform: "instagram",
      status: "published",
      publishedAt: "2026-11-10T10:00:05Z",
      platformPostUrl: "https://www.instagram.com/reel/C1a2B3c4D5e/",
    },
  ],
  ...over,
});
const withUrl = (code, over = {}) =>
  row({ platforms: [{ platform: "instagram", status: "published", publishedAt: over.at || "2026-01-01T00:00:00Z", platformPostUrl: `https://www.instagram.com/p/${code}/` }], ...over });

test("classify matches hashtags case-insensitively", () => {
  assert.deepEqual(classify("x #AITherapy", null, {}, TAGS, "human"), ["ai"]);
  assert.deepEqual(classify("x #KeepTherapyHuman", null, {}, TAGS, "human"), ["human"]);
  assert.deepEqual(classify("no tags here", null, {}, TAGS, "human"), []);
});

test("classify sends a post matching both lists to the tie-break category", () => {
  assert.deepEqual(classify("#aitherapy #keeptherapyhuman", null, {}, TAGS, "human"), ["human"]);
  assert.deepEqual(classify("#aitherapy #keeptherapyhuman", null, {}, TAGS, "ai"), ["ai"]);
});

test("classify does not match partial hashtags or plain words", () => {
  assert.deepEqual(classify("#aitherapyfoo", null, {}, TAGS, "human"), []);
  assert.deepEqual(classify("aitherapy without hash", null, {}, TAGS, "human"), []);
});

test("overrides win over hashtags", () => {
  assert.deepEqual(classify("#aitherapy", "ABC", { ABC: "human" }, TAGS, "human"), ["human"]);
  assert.deepEqual(classify("#aitherapy", "ABC", { ABC: "hide" }, TAGS, "human"), []);
  assert.deepEqual(classify("nothing", "ABC", { ABC: "both" }, TAGS, "human"), ["ai", "human"]);
});

test("cleanCaption strips hashtags and truncates on a word boundary", () => {
  assert.equal(cleanCaption("Hello   world #a #b"), "Hello world");
  const out = cleanCaption("word ".repeat(80), 100);
  assert.ok(out.endsWith("…") && out.length <= 101);
});

test("shortcode extracts from post, reel and tv URLs", () => {
  assert.equal(shortcode("https://www.instagram.com/p/AbC_123-x/"), "AbC_123-x");
  assert.equal(shortcode("https://www.instagram.com/reel/Zz9/?igsh=1"), "Zz9");
  assert.equal(shortcode("https://example.com/"), null);
});

test("normalize maps a Zernio external post and never forwards user data", () => {
  const p = normalize(row({ userId: { email: "secret@example.com" } }));
  assert.equal(p.id, "C1a2B3c4D5e");
  assert.equal(p.type, "reel");
  assert.equal(p.thumb, "https://cdn.example.com/t.jpg");
  assert.equal(p.date, "2026-11-10T10:00:05Z");
  assert.equal(p.caption, "Why a chatbot is not a therapist");
  assert.ok(!JSON.stringify(p).includes("secret@example.com"));
});

test("normalize detects carousel and uses the image URL when there is no thumbnail", () => {
  const two = [{ type: "image", url: "https://cdn.example.com/a.jpg" }, { type: "image", url: "https://cdn.example.com/b.jpg" }];
  const p = normalize(row({ mediaProductType: "FEED", mediaItems: two }));
  assert.equal(p.type, "carousel");
  assert.equal(p.thumb, "https://cdn.example.com/a.jpg");
});

test("normalize drops stories, unpublished, untagged, non-instagram and non-https", () => {
  assert.equal(normalize(row({ mediaProductType: "STORY" })), null);
  assert.equal(normalize(row({ content: "no tags" })), null);
  assert.equal(normalize(row({ platforms: [{ platform: "tiktok", status: "published", platformPostUrl: "https://x.com/p/1/" }] })), null);
  assert.equal(normalize(row({ platforms: [{ platform: "instagram", status: "failed", platformPostUrl: "https://www.instagram.com/p/x/" }] })), null);
  assert.equal(normalize(row({ platforms: [{ platform: "instagram", status: "published", platformPostUrl: "http://www.instagram.com/p/x/" }] })), null);
});

test("normalize blanks an unsafe thumbnail URL", () => {
  const p = normalize(row({ mediaItems: [{ type: "video", thumbnail: "javascript:alert(1)" }] }));
  assert.equal(p.thumb, "");
});

test("buildList dedupes and sorts newest first; filterByCategory limits", () => {
  const list = buildList([
    withUrl("AAA", { at: "2026-01-01T00:00:00Z" }),
    withUrl("BBB", { at: "2026-03-01T00:00:00Z" }),
    withUrl("BBB", { at: "2026-03-01T00:00:00Z" }),
    withUrl("CCC", { content: "#keeptherapyhuman", at: "2026-02-01T00:00:00Z" }),
  ]);
  assert.deepEqual(list.map((p) => p.id), ["BBB", "CCC", "AAA"]);
  assert.deepEqual(filterByCategory(list, "ai", 10).map((p) => p.id), ["BBB", "AAA"]);
  assert.equal(filterByCategory(list, "all", 2).length, 2);
});
