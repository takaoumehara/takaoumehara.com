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
// Theme and language live in the rail on most pages and in the corner of the
// landing page, which has no rail. One delegated listener covers both, and
// survives the rail being persisted across a swap while the page is not.
let controlsBound = false;
function bindControls() {
  if (controlsBound) return;
  controlsBound = true;
  document.addEventListener("click", (event) => {
    if (event.target.closest("#theme-switch")) toggleTheme();
    else if (event.target.closest("#lang-cycle")) setLang(currentLang() === "jp" ? "en" : "jp");
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
  // The chips: jump to a category's rows, opening the fold if it is closed.
  side.addEventListener("click", (event) => {
    const chip = event.target.closest(".side-chip[data-jump]");
    if (!chip) return;
    const group = side.querySelector(`.side-group[data-group="${chip.dataset.jump}"]`);
    if (!group) return;
    group.open = true;
    scrollRailTo(side, group, group.offsetTop === 0 ? "center" : "top");
  });
}

/** How the rail scrolls: instantly for a reader who asked for no motion. */
const railBehavior = () => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

function scrollRailTo(side, el, place) {
  const top = el.getBoundingClientRect().top - side.getBoundingClientRect().top + side.scrollTop;
  const target = place === "center" ? top - side.clientHeight / 2 + el.offsetHeight / 2 : top - 12;
  side.scrollTo({ top: Math.max(0, target), behavior: railBehavior() });
}

/**
 * Put the row you are on where you can see it — on the first paint and after
 * every client-side navigation.
 *
 * This used to run once, from bindSidebar(), while astro:after-swap restored
 * the rail's previous scroll position. The two fought each other and the
 * previous position won, so after a click the rail sat wherever it had been
 * and the current row was often far off screen. Now the restore only applies
 * when the current row has not moved (see below), and this runs every time.
 */
function revealCurrent() {
  const side = document.getElementById("side");
  if (!side || !window.matchMedia("(min-width: 901px)").matches) return;
  const current = side.querySelector('.side-item[aria-current="page"]');
  if (!current) return;
  current.closest("details")?.setAttribute("open", "");
  // Already comfortably in view: leave it alone rather than jog the rail.
  const box = current.getBoundingClientRect();
  const rail = side.getBoundingClientRect();
  if (box.top >= rail.top + 8 && box.bottom <= rail.bottom - 8) return;
  scrollRailTo(side, current, "center");
  settleThenReveal();
}

// The web fonts land after the first paint and re-wrap 45 rows of names and
// one-liners — the rail grew by half its height in testing, which moved the
// row we had just scrolled to. Measure again once the fonts are in.
let settling = false;
function settleThenReveal() {
  if (settling || !document.fonts || document.fonts.status === "loaded") return;
  settling = true;
  document.fonts.ready.then(() => {
    settling = false;
    requestAnimationFrame(revealCurrent);
  });
}

/**
 * The first visit only: open the five categories one after another, so the
 * size of the work registers without anyone having to unfold it by hand.
 * After that the rail is simply open. A reader who asked for no motion gets
 * the open rail with no stagger.
 */
function revealRailOnce() {
  const side = document.getElementById("side");
  if (!side || store.get("tu-rail-seen")) return;
  store.set("tu-rail-seen", "1");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const groups = [...side.querySelectorAll(".side-group[data-group]:not([data-group='person'])")];
  if (!groups.length) return;
  groups.forEach((group) => { group.open = false; });
  groups.forEach((group, i) => {
    setTimeout(() => {
      group.open = true;
      group.classList.add("is-revealing");
      countUp(group.querySelector(".side-count[data-count]"));
      setTimeout(() => group.classList.remove("is-revealing"), 400);
      if (i === groups.length - 1) revealCurrent();
    }, 90 + i * 90);
  });
}

/** A count climbing to its real number. Nothing is invented — it ends on data-count. */
function countUp(el) {
  if (!el) return;
  const end = Number(el.dataset.count);
  if (!Number.isFinite(end) || end <= 0) return;
  let n = 0;
  const step = () => {
    n += Math.max(1, Math.round(end / 8));
    el.textContent = String(Math.min(n, end));
    if (n < end) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
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
  if (still.matches) {
    // The markup carries autoplay, so the browser has already started them by
    // the time this runs. CSS hides them (src/styles/site.css), but a hidden
    // <video> is still decoding — stop them properly.
    document.querySelectorAll(".card-clip").forEach((clip) => clip.pause());
    return;
  }

  // The clips run by themselves. Waiting for a hover meant a grid full of
  // moving work sat completely still until you touched it, and on a phone
  // there is no hover at all — so nobody ever saw that any of it moved.
  //
  // A clip that is scrolled out of sight is paused: five loops decoding at
  // once is fine, five loops decoding where nobody can see them is a battery
  // for nothing. It resumes exactly where it stopped, so a clip never restarts
  // from frame one just because the page scrolled past it.
  const play = (clip) => {
    if (still.matches) return;
    const started = clip.play();
    if (started && started.catch) {
      // Autoplay can be refused (a power-saving mode, a browser setting). The
      // still underneath is the page either way, so there is nothing to undo.
      started.catch(() => clip.classList.remove("is-playing"));
    }
    clip.classList.add("is-playing");
  };

  const watcher = typeof IntersectionObserver === "function"
    ? new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) play(entry.target);
          else entry.target.pause();
        }
      }, { rootMargin: "200px" })
    : null;

  document.querySelectorAll(".card-clip").forEach((clip) => {
    if (clip.dataset.bound) return;
    clip.dataset.bound = "1";
    if (watcher) watcher.observe(clip);
    else play(clip);
  });
}

// ── The landing page's bento ────────────────────────────────────────────────
// On a full load the inline script in LandingGrid.astro has already cut the
// grid before first paint. This is for coming back to the landing page through
// the client-side router, where the markup arrives fresh and uncut.
function cutBentoGrids() {
  document.querySelectorAll(".work-bento").forEach((grid) => {
    if (typeof window.__tuCutBento === "function") window.__tuCutBento(grid);
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
  bindControls();
  bindSidebar();
  revealRailOnce();
  cutBentoGrids();
  markCurrent();
  revealCurrent();
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

// The rail is persisted, but moving it into the new document resets its scroll
// position, so it is carried across the swap — EXCEPT when the page you landed
// on is a different row. Then restoring the old position would put the rail
// back where you came from and hide where you now are; revealCurrent() takes
// over instead (onPageLoad, which runs after the swap).
let sideScroll = 0;
let sideCurrent = null;
const currentHref = () => document.querySelector('#side .side-item[aria-current="page"]')?.getAttribute("href") ?? null;
document.addEventListener("astro:before-swap", () => {
  const side = document.getElementById("side");
  sideScroll = side?.scrollTop ?? 0;
  sideCurrent = currentHref();
});
document.addEventListener("astro:after-swap", () => {
  const side = document.getElementById("side");
  if (!side) return;
  // markCurrent() has not run yet at this point, so compare against the path.
  const here = normalize(location.pathname);
  const stillHere = sideCurrent !== null && normalize(sideCurrent) === here;
  if (stillHere) side.scrollTop = sideScroll;
});
