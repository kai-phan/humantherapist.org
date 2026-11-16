(() => {
  /** Side-scroll slider. `list` scrolls horizontally; `section` holds the [data-slider-nav] buttons. */
  function slider(section, list) {
    const nav = section.querySelector("[data-slider-nav]");
    if (!nav || !list) return;
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
  window.HT = { slider };

  document.querySelectorAll("[data-slider]").forEach((s) => slider(s, s.querySelector("[data-slider-list]")));

  // Click an image marked [data-zoom] to see it large.
  const dlg = document.getElementById("lightbox");
  if (dlg && typeof dlg.showModal === "function") {
    const big = dlg.querySelector("img");
    document.addEventListener("click", (e) => {
      const z = e.target.closest("[data-zoom]");
      if (z) {
        const img = z.querySelector("img");
        big.src = img.currentSrc || img.src;
        big.alt = img.alt;
        dlg.showModal();
      } else if (dlg.open && dlg.contains(e.target)) {
        dlg.close();
      }
    });
    dlg.addEventListener("close", () => big.removeAttribute("src"));
  }
})();
