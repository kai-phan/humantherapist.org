import test from "node:test";
import assert from "node:assert/strict";
import { classify, shortcode, toVideo, present, buildList, filterByCategory } from "../src/posts.js";

const AI = "aiharms";
const zernio = (over = {}) => ({
  _id: "65f1",
  origin: "external",
  content: "Why a chatbot is not a Therapist. More detail here. #AITherapy",
  mediaProductType: "REELS",
  scheduledFor: "2026-11-10T10:00:00Z",
  userId: { email: "secret@example.com" },
  mediaItems: [{ type: "video", url: "https://cdn.example.com/v.mp4", thumbnail: "https://cdn.example.com/t.jpg" }],
  platforms: [{ platform: "instagram", status: "published", publishedAt: "2026-11-10T10:00:05Z", platformPostUrl: "https://www.instagram.com/reel/C1a2B3c4D5e/" }],
  ...over,
});
const entry = (id, caption, over = {}) => ({ id, slug: id.toLowerCase(), caption, poster: true, bytes: 1, publishedAt: "2026-01-01T00:00:00Z", ...over });

test("only a video with #aiharms is AI Therapy?; every other video is Human-Therapist", () => {
  assert.deepEqual(classify("x #AIHarms", null, {}, AI), ["ai"]);
  assert.deepEqual(classify("x #aiharms #keeptherapyhuman", null, {}, AI), ["ai"]);
  assert.deepEqual(classify("x #aitherapy #chatgpt", null, {}, AI), ["human"]);
  assert.deepEqual(classify("no tags at all", null, {}, AI), ["human"]);
  assert.deepEqual(classify("x #humantherapist", null, {}, AI), ["human"]);
  assert.deepEqual(classify("x #ForTherapists", null, {}, AI), ["therapists"]);
  assert.deepEqual(classify("x #fortherapists #aiharms", null, {}, AI), ["ai"]);
  assert.deepEqual(classify("x #fortherapistsfoo", null, {}, AI), ["human"]);
  assert.deepEqual(classify("plain", "ABC", { ABC: "therapists" }, AI), ["therapists"]);
});

test("the AI tag must match the whole hashtag", () => {
  assert.deepEqual(classify("#aiharmsfoo aiharms", null, {}, AI), ["human"]);
});

test("overrides win over hashtags", () => {
  assert.deepEqual(classify("#aiharms", "ABC", { ABC: "human" }, AI), ["human"]);
  assert.deepEqual(classify("plain", "ABC", { ABC: "ai" }, AI), ["ai"]);
  assert.deepEqual(classify("#aiharms", "ABC", { ABC: "hide" }, AI), []);
  assert.deepEqual(classify("nothing", "ABC", { ABC: "both" }, AI), ["ai", "human"]);
});

test("shortcode extracts from post, reel and tv URLs", () => {
  assert.equal(shortcode("https://www.instagram.com/p/AbC_123-x/"), "AbC_123-x");
  assert.equal(shortcode("https://www.instagram.com/reel/Zz9/?igsh=1"), "Zz9");
  assert.equal(shortcode("https://example.com/"), null);
});

test("toVideo reads a Zernio external reel and drops user data", () => {
  const v = toVideo(zernio());
  assert.equal(v.id, "C1a2B3c4D5e");
  assert.equal(v.videoUrl, "https://cdn.example.com/v.mp4");
  assert.equal(v.posterUrl, "https://cdn.example.com/t.jpg");
  assert.equal(v.publishedAt, "2026-11-10T10:00:05Z");
  assert.ok(!JSON.stringify(v).includes("secret@example.com"));
});

test("toVideo rejects stories, images, unpublished, empty captions and non-https", () => {
  assert.equal(toVideo(zernio({ mediaProductType: "STORY" })), null);
  assert.equal(toVideo(zernio({ mediaItems: [{ type: "image", url: "https://cdn.example.com/a.jpg" }] })), null);
  assert.equal(toVideo(zernio({ mediaItems: [{ type: "video", url: "http://cdn.example.com/v.mp4" }] })), null);
  assert.equal(toVideo(zernio({ content: "#only #tags" })), null);
  assert.equal(toVideo(zernio({ platforms: [{ platform: "instagram", status: "failed", platformPostUrl: "https://www.instagram.com/reel/x1234/" }] })), null);
  assert.equal(toVideo(zernio({ platforms: [{ platform: "tiktok", status: "published", platformPostUrl: "https://www.instagram.com/reel/x1234/" }] })), null);
});

test("present builds the public shape: Therapy capitalized, no Instagram URL", () => {
  const p = present(entry("AAA111", "What makes therapy work? The relationship. #aiharms", { slug: "what-makes-therapy-work" }));
  assert.equal(p.title, "What makes Therapy work?");
  assert.deepEqual(p.body, ["The relationship."]);
  assert.equal(p.url, "/videos/what-makes-therapy-work/");
  assert.equal(p.thumb, "/media/AAA111.jpg");
  assert.equal(p.video, "/media/AAA111.mp4");
  assert.ok(!JSON.stringify(p).includes("instagram.com"));
  assert.deepEqual(present(entry("BBB222", "No tags here.")).categories, ["human"]);
  assert.equal(present(entry("CCC333", "Text. #aiharms", { poster: false })).thumb, "");
});

test("buildList sorts newest first; filterByCategory filters and limits", () => {
  const list = buildList([
    entry("AAA111", "One. #aiharms", { publishedAt: "2026-01-01T00:00:00Z" }),
    entry("BBB222", "Two. #aiharms", { publishedAt: "2026-03-01T00:00:00Z" }),
    entry("CCC333", "Three.", { publishedAt: "2026-02-01T00:00:00Z" }),
  ]);
  assert.deepEqual(list.map((v) => v.id), ["BBB222", "CCC333", "AAA111"]);
  assert.deepEqual(filterByCategory(list, "human", 10).map((v) => v.id), ["CCC333"]);
  assert.equal(filterByCategory(list, "all", 2).length, 2);
  assert.deepEqual(filterByCategory(list, "all", 2, 2).map((v) => v.id), ["AAA111"]);
  assert.deepEqual(filterByCategory(list, "all", 2, 5), []);
});

import { parseTags } from "../src/instagram.js";

test("classify prefers the Instagram tags over the Zernio caption", () => {
  assert.deepEqual(classify("old caption", null, {}, "aiharms", "fortherapists", ["aiharms"]), ["ai"]);
  assert.deepEqual(classify("#aiharms", null, {}, "aiharms", "fortherapists", ["fortherapists"]), ["therapists"]);
  assert.deepEqual(classify("#aiharms", null, {}, "aiharms", "fortherapists", []), ["human"]);
  assert.deepEqual(classify("#aiharms", null, {}, "aiharms", "fortherapists", null), ["ai"]);
  assert.deepEqual(classify("#aiharms", "X", { X: "human" }, "aiharms", "fortherapists", ["aiharms"]), ["human"]);
});

test("parseTags reads hashtags from the embed page and ignores pages without a caption", () => {
  const html = '<div class="Caption"><a href="/explore/tags/AIHarms/">#AIHarms</a> <a href="/explore/tags/chatgpt/">#chatgpt</a></div>';
  assert.deepEqual(parseTags(html), ["aiharms", "chatgpt"]);
  assert.equal(parseTags('<div class="EmbedBrokenMedia"></div>'), null);
  assert.deepEqual(parseTags('<div class="Caption">no tags</div>'), []);
});
