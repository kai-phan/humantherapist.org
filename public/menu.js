// Mobile menu: a button that opens the main navigation as a panel under the header.
(() => {
  const header = document.querySelector(".site-header");
  const nav = header && header.querySelector(".nav");
  const btn = header && header.querySelector(".nav-toggle");
  if (!nav || !btn) return;
  header.classList.add("has-menu"); // without this class the desktop nav and the plain button stay as they were
  const set = (open) => {
    nav.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  btn.addEventListener("click", () => set(!nav.classList.contains("open")));
  nav.addEventListener("click", (e) => e.target.closest("a") && set(false));
  document.addEventListener("click", (e) => nav.classList.contains("open") && !header.contains(e.target) && set(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      set(false);
      btn.focus();
    }
  });
  matchMedia("(min-width: 1025px)").addEventListener("change", (m) => m.matches && set(false));
})();
