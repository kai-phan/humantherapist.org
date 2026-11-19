import { LABELS, SITE, IG_HANDLE } from "./config.js";
import { esc, jsonForScript, truncate, isKeywordList } from "./text.js";

const CATEGORY_PAGE = { ai: "/ai-harms/", human: "/therapeutic-relationship/", therapists: "/for-human-therapists/" };

const HEADER = `  <header class="site-header">
    <div class="wrap">
      <a class="brand" href="/" aria-label="Human-Therapist.org home"><img src="/assets/logo.jpg" alt="Human Therapist" width="165" height="46"></a>
      <nav class="nav" aria-label="Main">
        <a href="/ai-harms/">🤖 AI Therapy?</a>
        <a href="/therapeutic-relationship/">The Therapeutic Relationship ❤️</a>
        <a class="btn-join" href="/for-human-therapists/">For Therapists</a>
      </nav>
    </div>
  </header>`;

const FOOTER = `  <footer class="site-footer">
    <div class="wrap">
      <img src="/assets/logo.jpg" alt="Human Therapist" width="144" height="40">
      <p>Human-Therapist.org holds an idea therapists have never had to articulate before: Therapy is the Therapeutic Relationship between two human people.</p>
      <p>© 2026 Human-Therapist.org</p>
    </div>
  </footer>`;

const primary = (v) => v.categories[0];

function relatedCard(v) {
  const cat = primary(v);
  const cover = v.thumb
    ? `<div class="reel-cover has-img"><img src="${esc(v.thumb)}" alt="" loading="lazy"><span class="badge badge--${cat}">${esc(LABELS[cat])}</span><span class="play" aria-hidden="true"></span></div>`
    : `<div class="reel-cover r-${cat}"><p class="reel-quote">${esc(truncate(v.title, 70))}</p><span class="badge badge--${cat}">${esc(LABELS[cat])}</span><span class="play" aria-hidden="true"></span></div>`;
  return `<li><a class="reel" href="${esc(v.url)}">${cover}<p class="reel-cap">${esc(v.title)}</p></a></li>`;
}

const IG_MENTION = new RegExp(`@${IG_HANDLE}\\b`, "gi");

export function renderVideoPage(v, related, igUrl = `https://www.instagram.com/${IG_HANDLE}/`) {
  const cat = primary(v);
  const label = LABELS[cat];
  const pageUrl = `${SITE}${v.url}`;
  const description = truncate(v.body.join(" ") || v.title, 155);
  const image = v.thumb ? `${SITE}${v.thumb}` : `${SITE}/assets/logo.jpg`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.title,
    description: v.body.join(" ") || v.title,
    contentUrl: `${SITE}${v.video}`,
    ...(v.thumb ? { thumbnailUrl: [image] } : {}),
    ...(v.publishedAt ? { uploadDate: v.publishedAt } : {}),
    publisher: { "@type": "Organization", name: "Human-Therapist.org", url: SITE },
  };
  const link = (html) =>
    html.replace(IG_MENTION, (m) => `<a href="${esc(igUrl)}" target="_blank" rel="noopener noreferrer">${m}</a>`);
  const paras = v.body
    .map((p) => `<p${isKeywordList(p) ? ' class="vtags"' : ""}>${link(esc(p))}</p>`)
    .join("\n          ");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(v.title)} | Human-Therapist.org</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${esc(pageUrl)}">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="video.other">
  <meta property="og:title" content="${esc(v.title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(pageUrl)}">
  <meta property="og:image" content="${esc(image)}">
  <meta property="og:video" content="${esc(SITE + v.video)}">
  <meta property="og:video:type" content="video/mp4">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#0b0b0c">
  <link rel="stylesheet" href="/styles.css">
  <script type="application/ld+json">${jsonForScript(ld)}</script>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
${HEADER}

  <main id="main">
    <section class="vpage">
      <div class="wrap vgrid">
        <div class="vplayer">
          <video controls playsinline preload="metadata"${v.thumb ? ` poster="${esc(v.thumb)}"` : ""}>
            <source src="${esc(v.video)}" type="video/mp4">
            Your browser can’t play this video.
          </video>
        </div>
        <div class="vtext">
          <span class="label label--${cat}">${esc(label)}</span>
          <h1>${esc(v.title)}</h1>
          ${paras}
          <a class="btn" href="${CATEGORY_PAGE[cat]}">More ${esc(label)} videos</a>
        </div>
      </div>
    </section>
${
  related.length
    ? `
    <section class="section section--dark" aria-labelledby="more-h">
      <div class="wrap">
        <div class="section-head section-head--light"><h2 id="more-h">More videos</h2></div>
        <ul class="reels reels--grid">
          ${related.map(relatedCard).join("\n          ")}
        </ul>
      </div>
    </section>
`
    : ""
}  </main>

${FOOTER}
</body>
</html>
`;
}

export function renderSitemap(videos) {
  const urls = ["/", "/therapeutic-relationship/", "/ai-harms/", "/for-human-therapists/", ...videos.map((v) => v.url)];
  const body = urls.map((u) => `  <url><loc>${esc(SITE + u)}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}
