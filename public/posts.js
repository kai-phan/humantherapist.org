(() => {
  const LABEL = { ai: "AI Therapy?", human: "Therapeutic Relationship", therapists: "Human-Therapist" };

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  function card(post) {
    const cat = post.category;
    const a = el("a", "reel");
    a.href = post.url;

    const cover = el("div", `reel-cover ${post.thumb ? "has-img" : `r-${cat}`}`);
    const fallback = () => {
      cover.classList.remove("has-img");
      cover.classList.add(`r-${cat}`);
      cover.prepend(el("p", "reel-quote", post.title.slice(0, 70)));
    };
    if (post.thumb) {
      const img = el("img");
      img.src = post.thumb;
      img.alt = "";
      img.loading = "lazy";
      img.addEventListener("error", () => {
        img.remove();
        fallback();
      });
      cover.append(img);
    } else {
      cover.append(el("p", "reel-quote", post.title.slice(0, 70)));
    }
    cover.append(el("span", `badge badge--${cat}`, LABEL[cat]));
    const play = el("span", "play");
    play.setAttribute("aria-hidden", "true");
    cover.append(play);

    a.append(cover, el("p", "reel-cap", post.title));
    const li = el("li");
    li.append(a);
    return li;
  }

  async function init(section) {
    const category = section.dataset.category || "all";
    const limit = section.dataset.limit || "12";
    const list = section.querySelector("[data-posts-list]");
    const more = section.querySelector("[data-more]");
    const page = (offset) =>
      fetch(`/api/posts?category=${encodeURIComponent(category)}&limit=${encodeURIComponent(limit)}&offset=${offset}`).then((r) => (r.ok ? r.json() : null));
    const updateMore = (data, shown) => {
      if (!more) return;
      more.hidden = !data.hasMore;
      more.textContent = `Load more videos (${Math.max(data.total - shown, 0)} left)`;
    };
    try {
      const data = await page(0);
      if (!data) return;
      const { posts, profileUrl } = data;
      if (!posts || !posts.length) return;
      list.replaceChildren(...posts.map(card));
      let shown = posts.length;
      updateMore(data, shown);
      if (more) {
        more.addEventListener("click", async () => {
          more.disabled = true;
          try {
            const next = await page(shown);
            if (next && next.posts.length) {
              list.append(...next.posts.map(card));
              shown += next.posts.length;
              updateMore(next, shown);
            } else {
              more.hidden = true;
            }
          } catch {
            /* keep the button so the visitor can try again */
          } finally {
            more.disabled = false;
          }
        });
      }
      section.querySelectorAll("[data-ig]").forEach((a) => {
        if (profileUrl) {
          a.href = profileUrl;
          a.hidden = false;
        }
      });
      section.hidden = false;
      if (window.HT) window.HT.slider(section, list);
    } catch {
      /* leave the section hidden */
    }
  }

  document.querySelectorAll("[data-posts]").forEach(init);
})();
