// The site's behaviour, shared by every page and loaded once: the page is
// swapped client-side by Astro's router (Site.astro), the sidebar persists,
// and everything below is re-run from `astro:page-load`, which fires on the
// first load and after every navigation. No framework, no dependencies.
import { navigate } from "astro:transitions/client";

const html = document.documentElement;
const store = {
  get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch (e) {} },
};

// ── Language (html.lang-jp + <html lang>, remembered as "tu-lang") ──────────
const currentLang = () => (html.classList.contains("lang-jp") ? "jp" : "en");
function setLang(lang) {
  if (html.dataset.langFixed) lang = html.dataset.langFixed; // /ja/ stays Japanese
  html.classList.toggle("lang-jp", lang === "jp");
  html.lang = lang === "jp" ? "ja" : "en"; // a screen reader needs the language, not only the text
  if (!html.dataset.langFixed) store.set("tu-lang", lang);
  document.querySelectorAll(".lang-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.lang === lang));
  const cycle = document.getElementById("lang-cycle");
  if (cycle) {
    cycle.textContent = lang === "jp" ? "EN" : "JP";
    cycle.setAttribute("aria-label", lang === "jp" ? "Switch to English" : "Switch to Japanese");
  }
  renderClock();
}

// ── Theme ("tu-theme"; a page with data-theme-lock="dark" stays dark) ───────
function applyTheme() {
  const pref = store.get("tu-theme") || "light";
  const lock = html.dataset.themeLock;
  html.dataset.theme = lock || pref;
  const sw = document.getElementById("theme-switch");
  if (sw) {
    sw.setAttribute("aria-checked", String(html.dataset.theme === "dark"));
    sw.disabled = Boolean(lock);
    sw.title = lock ? "This page is dark by design" : "";
  }
}
function toggleTheme() {
  const next = (store.get("tu-theme") || "light") === "dark" ? "light" : "dark";
  store.set("tu-theme", next);
  applyTheme();
}

// ── The clock in the rail (New York time, in the page's language) ───────────
function renderClock() {
  const el = document.getElementById("side-clock");
  if (!el) return;
  const now = new Date();
  const zone = el.dataset.zone || "America/New_York";
  const jp = currentLang() === "jp";
  const locale = jp ? "ja-JP" : "en-US";
  const date = new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", timeZone: zone }).format(now);
  const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: zone }).format(now);
  const place = jp ? el.dataset.placeJp : el.dataset.placeEn;
  el.querySelector("[data-clock-date]").textContent = date;
  el.querySelector("[data-clock-time]").textContent = `${place}, ${time}`;
}
let clockTimer = null;
function startClock() {
  if (clockTimer || !document.getElementById("side-clock")) return;
  renderClock();
  clockTimer = setInterval(renderClock, 1000);
}

// ── Sidebar: the current page, the phone menu ───────────────────────────────
const normalize = (path) => {
  let p = path.split(/[?#]/)[0].replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  if (p.length > 1) p = p.replace(/\/$/, "");
  return p || "/";
};
function markCurrent() {
  const here = normalize(location.pathname);
  document.querySelectorAll("#side [data-match]").forEach((link) => {
    const hit = link.dataset.match.split(/\s+/).some((m) => normalize(m) === here);
    if (hit) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}
let sidebarBound = false;
function bindSidebar() {
  const side = document.getElementById("side");
  if (!side || sidebarBound) return;
  sidebarBound = true;
  const toggle = document.getElementById("side-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = side.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }
  document.getElementById("theme-switch")?.addEventListener("click", toggleTheme);
  document.getElementById("lang-cycle")?.addEventListener("click", () => setLang(currentLang() === "jp" ? "en" : "jp"));
  // The first paint: bring the current row into view without scrolling the page.
  const current = side.querySelector('.side-item[aria-current="page"]');
  if (current && window.matchMedia("(min-width: 901px)").matches) {
    const top = current.getBoundingClientRect().top - side.getBoundingClientRect().top + side.scrollTop;
    side.scrollTop = Math.max(0, top - side.clientHeight / 2);
  }
}
function closePhoneMenu() {
  const side = document.getElementById("side");
  const toggle = document.getElementById("side-toggle");
  if (!side) return;
  side.classList.remove("is-open");
  toggle?.setAttribute("aria-expanded", "false");
}

// ── Cards: click-through and hover previews ─────────────────────────────────
let cardsBound = false;
function bindCards() {
  if (cardsBound) return;
  cardsBound = true;
  // The whole card opens the link inside it; internal links go through the router.
  document.addEventListener("click", (event) => {
    const card = event.target.closest("[data-href]");
    if (!card || event.target.closest("a, button, details, summary")) return;
    const url = card.dataset.href;
    if (!url) return;
    if (card.dataset.external === "true") window.open(url, "_blank", "noopener");
    else navigate(url);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target.matches?.("[data-href]")) event.target.click();
  });
}
function bindPreviews() {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (still.matches) return;
  document.querySelectorAll(".card-clip").forEach((clip) => {
    if (clip.dataset.bound) return;
    clip.dataset.bound = "1";
    const card = clip.closest(".proof-card, .exp-card, .cat-card, .grid-card") || clip.parentElement;
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
}

// ── Case-study bodies: reveal on scroll, fade images in ─────────────────────
function bindReveal() {
  const targets = document.querySelectorAll(".reveal-on-scroll:not(.is-visible)");
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
    else img.addEventListener("load", () => img.classList.add("loaded"), { once: true });
  });
}

// ── Lifecycle ───────────────────────────────────────────────────────────────
function onPageLoad() {
  setLang(html.dataset.langFixed || store.get("tu-lang") || "en");
  applyTheme();
  bindSidebar();
  markCurrent();
  closePhoneMenu();
  startClock();
  bindCards();
  bindPreviews();
  bindReveal();
  // The old in-page language buttons some hand-built pages still carry.
  document.querySelectorAll(".lang-btn:not([data-bound])").forEach((b) => {
    b.dataset.bound = "1";
    b.addEventListener("click", () => setLang(b.dataset.lang));
  });
}
document.addEventListener("astro:page-load", onPageLoad);

// The rail is persisted, but moving it into the new document resets its
// scroll position; carry it across the swap.
let sideScroll = 0;
document.addEventListener("astro:before-swap", () => { sideScroll = document.getElementById("side")?.scrollTop ?? 0; });
document.addEventListener("astro:after-swap", () => { const side = document.getElementById("side"); if (side) side.scrollTop = sideScroll; });
