// The site's behaviour, shared by every page: the language switch, the sidebar
// on phones, hover previews on cards, click-through on cards, and the small
// reveal/fade effects the case-study bodies use. No framework, no dependencies.

// ── Language toggle (convention: html.lang-jp + localStorage "tu-lang") ──────
(() => {
  const html = document.documentElement;
  const btns = document.querySelectorAll(".lang-btn");
  const fixed = html.dataset.langFixed; // /ja/ renders Japanese and stays Japanese
  let saved = fixed || "en";
  if (!fixed) { try { saved = localStorage.getItem("tu-lang") || "en"; } catch (e) {} }
  const setLang = (lang) => {
    // The lang attribute travels with the class: without it a screen reader
    // reads the Japanese aloud in an English voice.
    html.classList.toggle("lang-jp", lang === "jp");
    html.lang = lang === "jp" ? "ja" : "en";
    btns.forEach((b) => b.classList.toggle("is-active", b.dataset.lang === lang));
    if (!fixed) { try { localStorage.setItem("tu-lang", lang); } catch (e) {} }
  };
  setLang(saved);
  btns.forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
})();

// ── Sidebar: the phone menu, and remembering where the list was scrolled ────
(() => {
  const side = document.getElementById("side");
  const toggle = document.getElementById("side-toggle");
  if (!side) return;
  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = side.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }
  try {
    const key = "tu-side-scroll";
    const saved = sessionStorage.getItem(key);
    if (saved && window.matchMedia("(min-width: 901px)").matches) side.scrollTop = Number(saved);
    side.addEventListener("click", (event) => {
      if (event.target.closest("a")) sessionStorage.setItem(key, String(side.scrollTop));
    });
  } catch (e) {}
})();

// ── Card preview clips (hover or keyboard focus; never on load, never with reduced motion) ──
(() => {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (still.matches) return;
  document.querySelectorAll(".card-clip").forEach((clip) => {
    const card = clip.closest(".proof-card, .exp-card, .cat-card") || clip.parentElement;
    if (!card) return;
    let playing = false;
    const start = () => {
      if (playing || still.matches) return;
      playing = true;
      const started = clip.play();
      if (started && started.catch) started.catch(() => { playing = false; });
      clip.classList.add("is-playing");
    };
    const stop = () => {
      if (!playing) return;
      playing = false;
      clip.classList.remove("is-playing");
      clip.pause();
      clip.currentTime = 0;
    };
    card.addEventListener("pointerenter", start);
    card.addEventListener("pointerleave", stop);
    card.addEventListener("focusin", start);
    card.addEventListener("focusout", stop);
  });
})();

// ── Card click-through (the whole card opens the link inside it) ────────────
(() => {
  document.querySelectorAll("[data-href]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("a, button, details, summary")) return;
      const url = card.dataset.href;
      if (!url) return;
      if (card.dataset.external === "true") window.open(url, "_blank", "noopener");
      else window.location.href = url;
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && event.target === card) card.click();
    });
  });
})();

// ── Case-study bodies: reveal on scroll, fade images in ─────────────────────
(() => {
  const targets = document.querySelectorAll(".reveal-on-scroll");
  if (targets.length) {
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((el) => el.classList.add("is-visible"));
    } else {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); obs.unobserve(e.target); } });
      }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
      targets.forEach((el) => obs.observe(el));
    }
  }
  document.querySelectorAll(".g-cell img").forEach((img) => {
    if (img.complete) img.classList.add("loaded");
    else img.addEventListener("load", () => img.classList.add("loaded"));
  });
})();
