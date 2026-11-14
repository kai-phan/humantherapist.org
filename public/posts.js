(() => {
  const LABEL = { ai: "AI Harms", human: "Human-Therapist" };
  const COVERS = { ai: ["r-red", "r-purple", "r-black"], human: ["r-blue", "r-yellow", "r-black"] };
  const KIND = { reel: "Reel", video: "Video", carousel: "Carousel", post: "Post" };
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  function card(post, requested, index) {
    const cat = requested === "all" ? post.categories[0] : requested;
    const a = el("a", "reel");
    a.href = post.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";

    const cover = el("div", `reel-cover ${post.thumb ? "has-img" : COVERS[cat][index % 3]}`);
    if (post.thumb) {
      const img = el("img");
      img.src = post.thumb;
      img.alt = "";
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.addEventListener("error", () => {
        img.remove();
        cover.classList.remove("has-img");
        cover.classList.add(COVERS[cat][index % 3]);
        cover.prepend(el("p", "reel-quote", post.caption.slice(0, 70)));
      });
      cover.append(img);
    } else {
      cover.append(el("p", "reel-quote", post.caption.slice(0, 70)));
    }
    cover.append(el("span", "badge", LABEL[cat]));
    if (post.type === "reel" || post.type === "video") {
      const play = el("span", "play");
      play.setAttribute("aria-hidden", "true");
      cover.append(play);
    }

    const date = post.date ? fmt.format(new Date(post.date)) : "";
    a.append(
      cover,
      el("p", "reel-cap", post.caption || "View on Instagram"),
      el("span", "reel-meta", [date, KIND[post.type]].filter(Boolean).join(" · ")),
    );
    const li = el("li");
    li.append(a);
    return li;
  }

  function slider(section, list) {
    const nav = section.querySelector("[data-slider-nav]");
    if (!nav) return;
    const prev = nav.querySelector("[data-prev]");
    const next = nav.querySelector("[data-next]");
    const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    const update = () => {
      const max = list.scrollWidth - list.clientWidth;
      nav.hidden = max <= 4;
      prev.disabled = list.scrollLeft <= 4;
      next.disabled = list.scrollLeft >= max - 4;
    };
    const go = (dir) => list.scrollBy({ left: dir * list.clientWidth, behavior: smooth ? "smooth" : "auto" });
    prev.addEventListener("click", () => go(-1));
    next.addEventListener("click", () => go(1));
    list.addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    update();
  }

  async function init(section) {
    const category = section.dataset.category || "all";
    const limit = section.dataset.limit || "12";
    const list = section.querySelector("[data-posts-list]");
    try {
      const res = await fetch(`/api/posts?category=${encodeURIComponent(category)}&limit=${encodeURIComponent(limit)}`);
      if (!res.ok) return;
      const { posts, profileUrl } = await res.json();
      if (!posts || !posts.length) return;
      list.replaceChildren(...posts.map((p, i) => card(p, category, i)));
      section.querySelectorAll("[data-ig]").forEach((a) => {
        if (profileUrl) {
          a.href = profileUrl;
          a.hidden = false;
        }
      });
      section.hidden = false;
      slider(section, list);
    } catch {
      /* leave the section hidden */
    }
  }

  document.querySelectorAll("[data-posts]").forEach(init);
})();
