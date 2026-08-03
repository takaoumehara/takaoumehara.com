// Shared site chrome behaviours used across every page:
// bilingual EN/JP switch, mobile nav toggle, scroll reveal, and image fade-in.
// Every initialiser is a no-op when its markup is absent, so the file can be
// dropped onto any page unconditionally.
(() => {
  "use strict";

  const initLangSwitch = () => {
    const html = document.documentElement;
    const btns = [...document.querySelectorAll(".lang-btn")];
    if (!btns.length) return;
    const setLang = (lang) => {
      html.classList.toggle("lang-jp", lang === "jp");
      html.lang = lang === "jp" ? "ja" : "en";
      btns.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.lang === lang));
      localStorage.setItem("tu-lang", lang);
    };
    setLang(localStorage.getItem("tu-lang") || "en");
    btns.forEach((btn) => btn.addEventListener("click", () => setLang(btn.dataset.lang)));
  };

  const initMobileNav = () => {
    const toggle = document.getElementById("nav-toggle");
    const links = document.querySelector(".nav-links");
    if (!toggle || !links) return;
    const setOpen = (open) => {
      toggle.classList.toggle("is-open", open);
      links.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", () => setOpen(!links.classList.contains("is-open")));
    links.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
  };

  const initScrollReveal = () => {
    const items = document.querySelectorAll(".reveal-on-scroll");
    if (!items.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    items.forEach((item) => io.observe(item));
  };

  const initImageLoad = () => {
    document.querySelectorAll(".g-cell img").forEach((img) => {
      if (img.complete) img.classList.add("loaded");
      else img.addEventListener("load", () => img.classList.add("loaded"));
    });
  };

  const init = () => {
    initLangSwitch();
    initMobileNav();
    initScrollReveal();
    initImageLoad();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
