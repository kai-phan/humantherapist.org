// Sample posts for local styling work. Only served when ALLOW_SAMPLE=1 (set in .dev.vars) and no Zernio key is configured.
const AI = [
  ["Human Therapists REPLACED by AI? Why a chatbot can’t give you the one thing therapy runs on.", "reel"],
  ["“Therapy” from a subscription? What “therapy platforms” sell, and what they leave out.", "reel"],
  ["What is ChatGPT used for most? The answer is therapy. Here is why that should worry us.", "reel"],
  ["Therapists as gig workers: licensed, replaceable, and not in the company’s long-term plan.", "reel"],
  ["Not a product on demand. Human-Therapists are not available 24/7 like a streaming service.", "post"],
  ["Who is accountable when a tech company hires a license?", "carousel"],
  ["15-minute “sessions”: minimal face time is a business model, not a treatment plan.", "reel"],
  ["Search “therapy” on Google. Count how many of the top results are technology companies.", "post"],
];
const HUMAN = [
  ["The Therapeutic Relationship: licensed therapists explain what healing actually depends on.", "reel"],
  ["Not always supposed to like your therapist. Rupture and repair are part of the work.", "reel"],
  ["What is a Human-Therapist? Three commitments that define the work, whatever the modality.", "carousel"],
  ["Learn how to repair: apologizing and accepting care are skills practiced with a real human.", "reel"],
  ["Not a happy robot. Humans aren’t perfect, and therapists aren’t supposed to be.", "post"],
  ["Why it takes two people: the relationship is the contained space where change happens.", "reel"],
  ["For the public: what to look for when you choose a Human-Therapist.", "post"],
  ["For providers: join therapists keeping therapy human. No fees, no dues.", "reel"],
];

export function samplePosts() {
  const day = 864e5;
  const make = (rows, category, offset) =>
    rows.map(([caption, type], i) => ({
      id: `sample-${category}-${i}`,
      url: "https://www.instagram.com/",
      thumb: "",
      caption,
      date: new Date(Date.now() - (offset + i * 6) * day).toISOString(),
      type,
      categories: [category],
    }));
  return [...make(AI, "ai", 2), ...make(HUMAN, "human", 5)].sort((a, b) => b.date.localeCompare(a.date));
}
