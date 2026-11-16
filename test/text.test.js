import test from "node:test";
import assert from "node:assert/strict";
import { brand, splitCaption, slugify, uniqueSlug, cleanCaption, esc, truncate, isKeywordList } from "../src/text.js";

test("brand writes Therapy with a capital T and removes redacted names", () => {
  assert.equal(brand("What makes therapy, therapy; is THERAPY."), "What makes Therapy, Therapy; is Therapy.");
  assert.equal(brand("Human-Therapist and psychotherapy stay as they are"), "Human-Therapist and psychotherapy stay as they are");
  assert.equal(brand("By Alejandro Daniel Pina, LMFT today", ["Alejandro Daniel Pina, LMFT"]), "By today");
  assert.equal(brand("Hi Alejandro Pina, hello", ["Alejandro Pina"]), "Hi, hello");
});

test("cleanCaption strips hashtags and keeps paragraph breaks", () => {
  assert.equal(cleanCaption("One  line #a #b\n\nSecond   para #c"), "One line\n\nSecond para");
});

test("splitCaption uses the first sentence as the title", () => {
  const { title, body } = splitCaption("Therapy needs a human. The relationship heals! More text here.\n\nSecond paragraph #tag");
  assert.equal(title, "Therapy needs a human");
  assert.deepEqual(body, ["The relationship heals! More text here.", "Second paragraph"]);
});

test("splitCaption keeps question marks and does not split on abbreviations", () => {
  assert.equal(splitCaption("Why does it matter? Because.").title, "Why does it matter?");
  assert.equal(splitCaption("Dr. Smith explains why. Next.").title, "Dr. Smith explains why");
});

test("splitCaption handles captions with no punctuation and very long first sentences", () => {
  assert.equal(splitCaption("just a short caption #x").title, "just a short caption");
  const long = "word ".repeat(60).trim() + ". Tail.";
  const { title, body } = splitCaption(long);
  assert.ok(title.length <= 140 && !title.endsWith(" "));
  assert.ok(body.join(" ").includes("Tail."));
  assert.deepEqual(splitCaption("#only #hashtags"), { title: "", body: [] });
});

test("slugify makes short ascii URL slugs", () => {
  assert.equal(slugify("What makes Therapy, Therapy; is the relationship?"), "what-makes-therapy-therapy-is-the-relationship");
  assert.equal(slugify("Café ‘Müller’s’ idea"), "cafe-mullers-idea");
  assert.ok(slugify("word ".repeat(40)).length <= 80);
  assert.equal(slugify("???"), "");
});

test("uniqueSlug avoids collisions and falls back to the shortcode", () => {
  const taken = new Set(["hello"]);
  assert.equal(uniqueSlug("Hello", "AbC123xyz", taken), "hello-abc123xyz");
  taken.add("hello-abc123xyz");
  assert.equal(uniqueSlug("Hello", "AbC123xyz", taken), "hello-abc123xyz-2");
  assert.equal(uniqueSlug("???", "AbC123", new Set()), "abc123");
});

test("esc and truncate", () => {
  assert.equal(esc(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  assert.equal(truncate("short", 10), "short");
  assert.ok(truncate("alpha beta gamma delta", 14).endsWith("…"));
});

test("cleanCaption puts the ChatBots vs Human-Therapist line on its own paragraph", () => {
  const raw = "From Steph @stephhodginsmay\n.\n.\n.\n.\n🤖 ChatBots vs Human-Therapist ♥\n\nIf you’re considering Therapy, look for \nThe Number One Ingredient. #tag";
  assert.equal(
    cleanCaption(raw),
    "From Steph @stephhodginsmay\n\n🤖 ChatBots vs Human-Therapist ♥\n\nIf you’re considering Therapy, look for The Number One Ingredient.",
  );
  // directly after a sentence, with no spacer lines
  assert.equal(cleanCaption("Great video.\n🤖 “AI” ChatBots vs Human-Therapist ♥\nNext line."), "Great video.\n\n🤖 “AI” ChatBots vs Human-Therapist ♥\n\nNext line.");
  // a robot emoji elsewhere in a sentence is left alone
  assert.equal(cleanCaption("People use 🤖 chatbots for Therapy."), "People use 🤖 chatbots for Therapy.");
});

test("cleanCaption keeps keyword lists in their own paragraph", () => {
  const raw = "Last sentence of the story.\nkeep therapy human | healing is human | human connection heals\nTherapists of IG | Therapy Tok | Mental Health";
  const out = cleanCaption(raw).split("\n\n");
  assert.equal(out.length, 3);
  assert.ok(isKeywordList(out[1]) && isKeywordList(out[2]) && !isKeywordList(out[0]));
});

test("isKeywordList needs at least two separators", () => {
  assert.equal(isKeywordList("a | b"), false);
  assert.equal(isKeywordList("a | b | c"), true);
});
