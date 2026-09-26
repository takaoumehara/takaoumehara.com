// The site's behaviour, shared by every page and loaded once: the page is
// swapped client-side by Astro's router (Site.astro), the sidebar persists,
// and everything below is re-run from `astro:page-load`, which fires on the
// first load and after every navigation. No framework, no dependencies.
import { navigate } from "astro:transitions/client";
import * as motion from "./motion.js";

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
  langButtons().forEach((cycle) => {
    cycle.textContent = lang === "jp" ? "EN" : "JP";
    cycle.setAttribute("aria-label", lang === "jp" ? "Switch to English" : "Switch to Japanese");
  });
}

// The rail carries the canonical pair (#theme-switch / #lang-cycle); a page
// that hides the rail — /work — carries its own, marked with the data
// attributes. Both are driven from here so neither copy goes dead.
const themeButtons = () => document.querySelectorAll("#theme-switch, [data-theme-switch]");
const langButtons = () => document.querySelectorAll("#lang-cycle, [data-lang-cycle]");

// ── Theme ("tu-theme"; a page with data-theme-lock="dark" stays dark) ───────
function applyTheme() {
  const pref = store.get("tu-theme") || "light";
  const lock = html.dataset.themeLock;
  html.dataset.theme = lock || pref;
  themeButtons().forEach((sw) => {
    sw.setAttribute("aria-checked", String(html.dataset.theme === "dark"));
    sw.disabled = Boolean(lock);
    sw.title = lock ? "This page is dark by design" : "";
  });
}
function toggleTheme() {
  const next = (store.get("tu-theme") || "light") === "dark" ? "light" : "dark";
  store.set("tu-theme", next);
  applyTheme();
}

// ── Sidebar: the current page, the phone menu ───────────────────────────────
const normalize = (path) => {
  let p = path.split(/[?#]/)[0].replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  if (p.length > 1) p = p.replace(/\/$/, "");
  return p || "/";
};
// `path` lets a navigation mark its destination before the page has loaded
// (see Direction below); by default it is the page you are on.
function markCurrent(path = location.pathname) {
  const here = normalize(path);
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
  // Search toggle
  const searchToggle = document.getElementById("side-search-toggle");
  const searchPanel = document.getElementById("side-search");
  const searchInput = document.getElementById("side-search-input");
  if (searchToggle && searchPanel && searchInput) {
    searchToggle.addEventListener("click", () => {
      const isHidden = searchPanel.hasAttribute("hidden");
      if (isHidden) {
        searchPanel.removeAttribute("hidden");
        searchToggle.classList.add("is-active");
        requestAnimationFrame(() => searchInput.focus());
      } else {
        searchPanel.setAttribute("hidden", "");
        searchToggle.classList.remove("is-active");
        searchInput.value = "";
        document.querySelectorAll(".side-item").forEach(item => item.style.display = "");
        document.querySelectorAll(".side-group").forEach(group => group.style.display = "");
      }
    });
    
    // Smart search: titles, categories, descriptions
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      const items = document.querySelectorAll(".side-item");
      const groups = document.querySelectorAll(".side-group");
      
      if (!query) {
        items.forEach(item => item.style.display = "");
        groups.forEach(group => group.style.display = "");
        return;
      }
      
      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        const group = item.closest(".side-group");
        const groupTitle = group ? (group.querySelector(".side-group-title") ?? group.querySelector("summary")).textContent.toLowerCase() : "";
        item.style.display = (text.includes(query) || groupTitle.includes(query)) ? "" : "none";
      });
      
      groups.forEach(group => {
        const visibleItems = Array.from(group.querySelectorAll(".side-item"))
          .filter(item => item.style.display !== "none");
        group.style.display = visibleItems.length > 0 ? "" : "none";
      });
    });
  }
  // The first paint: bring the current row into view without scrolling the page.
  const current = side.querySelector('.side-item[aria-current="page"]');
  if (current && window.matchMedia("(min-width: 901px)").matches) {
    const top = current.getBoundingClientRect().top - side.getBoundingClientRect().top + side.scrollTop;
    side.scrollTop = Math.max(0, top - side.clientHeight / 2);
  }
}
// The theme and language controls. The rail's pair is persisted and bound
// once; a page-level copy (/work) is a new element after every swap, so this
// runs on every page-load and binds whatever is not bound yet.
function bindControls() {
  themeButtons().forEach((b) => {
    if (b.dataset.bound) return;
    b.dataset.bound = "1";
    b.addEventListener("click", toggleTheme);
  });
  langButtons().forEach((b) => {
    if (b.dataset.bound) return;
    b.dataset.bound = "1";
    b.addEventListener("click", () => setLang(currentLang() === "jp" ? "en" : "jp"));
  });
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
    else navigate(url, { sourceElement: card });
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

// ── Feel: sink under the finger, spring back; the image leans to the mouse ──
// Pointer, not :active alone, so touch gets the same press (iOS only applies
// :active to elements with a touch listener). Bound once on the document.
const FEEL = ".grid-card[data-href], .side-item, .hn-article";
const stillMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let feelBound = false;
function bindFeel() {
  if (feelBound) return;
  feelBound = true;
  let pressed = null;
  const release = () => { pressed?.classList.remove("is-pressed"); pressed = null; };
  document.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || stillMotion()) return;
    const target = event.target.closest?.(FEEL);
    if (!target) return;
    release();
    pressed = target;
    target.classList.add("is-pressed");
  }, { passive: true });
  document.addEventListener("pointerup", release, { passive: true });
  document.addEventListener("pointercancel", release, { passive: true });
  document.addEventListener("astro:before-preparation", release);

  // The rail row's nudge: 3px to the right the moment it is pressed, held for
  // at least 80ms, then released to spring back (transitions.css). A keyboard
  // activation (a click with no pointer) gets the same 80ms step.
  const NUDGE_MS = 80;
  let nudged = null, nudgedAt = 0;
  const nudge = (row) => { row.classList.add("is-nudged"); };
  const unnudge = (row, after) => setTimeout(() => row.classList.remove("is-nudged"), Math.max(0, after));
  document.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || stillMotion()) return;
    const row = event.target.closest?.("#side .side-item");
    if (!row) return;
    nudged = row; nudgedAt = performance.now();
    nudge(row);
  }, { passive: true });
  const letGo = () => {
    if (!nudged) return;
    unnudge(nudged, NUDGE_MS - (performance.now() - nudgedAt));
    nudged = null;
  };
  document.addEventListener("pointerup", letGo, { passive: true });
  document.addEventListener("pointercancel", letGo, { passive: true });
  document.addEventListener("click", (event) => {
    if (event.detail !== 0 || stillMotion()) return; // keyboard / programmatic only
    const row = event.target.closest?.("#side .side-item");
    if (!row) return;
    nudge(row);
    unnudge(row, NUDGE_MS);
  });

  // The lean: the pointer's position over the card, −0.5…0.5 on both axes,
  // one write per frame, read from the rect once per card entry.
  let raf = 0, leaning = null, rect = null;
  document.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || stillMotion()) return;
    const card = event.target.closest?.(".grid-card[data-href], .hn-article");
    if (card !== leaning) {
      leaning?.style.removeProperty("--px"); leaning?.style.removeProperty("--py");
      leaning = card;
      rect = card ? card.getBoundingClientRect() : null;
    }
    if (!card || !rect) return;
    const x = event.clientX, y = event.clientY;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      card.style.setProperty("--px", ((x - rect.left) / rect.width - 0.5).toFixed(2));
      card.style.setProperty("--py", ((y - rect.top) / rect.height - 0.5).toFixed(2));
    });
  }, { passive: true });
  document.addEventListener("pointerout", (event) => {
    if (leaning && !leaning.contains(event.relatedTarget)) {
      leaning.style.removeProperty("--px"); leaning.style.removeProperty("--py"); leaning = null; rect = null;
    }
  }, { passive: true });
}

// ── Echo: the rail row of the card you are over answers 120ms later ─────────
// The pane and the rail are two surfaces of one session, the way a phone and
// the wall are in his shared-screen pieces. Rows are matched by href.
const ECHO_DELAY = 120;
let echoBound = false;
function bindEcho() {
  if (echoBound) return;
  echoBound = true;
  let timer = 0, lit = null;
  const rowFor = (card) => {
    const href = card.dataset.href ?? card.querySelector(".hn-link")?.getAttribute("href");
    return href ? document.querySelector(`#side .side-item[href="${CSS.escape(href)}"]`) : null;
  };
  const clear = () => { clearTimeout(timer); lit?.classList.remove("is-echo"); lit = null; };
  const enter = (event) => {
    const card = event.target.closest?.(".grid-card[data-href], .hn-article");
    if (!card || card === lit?.__echoSource) return;
    clear();
    const row = rowFor(card);
    if (!row) return;
    timer = setTimeout(() => { row.classList.add("is-echo"); row.__echoSource = card; lit = row; }, ECHO_DELAY);
  };
  const leave = (event) => {
    const card = event.target.closest?.(".grid-card[data-href], .hn-article");
    if (card && !card.contains(event.relatedTarget)) clear();
  };
  document.addEventListener("pointerover", enter, { passive: true });
  document.addEventListener("pointerout", leave, { passive: true });
  document.addEventListener("focusin", enter);
  document.addEventListener("focusout", leave);
  document.addEventListener("astro:before-preparation", clear);
}

// ── Direction and the pane's choreography (src/scripts/motion.js) ─────────
// Every #side [data-match] link, top to bottom, is one position in the
// directory (All work, the name, About, then every row). Going to a lower
// position is +1, a higher one −1: the pane's cells leave upward and the new
// ones settle from 6px below when you move down the rail, and the reverse.
// The destination row is marked current straight away, so the inverted block
// moves to the pressed row while the page loads instead of flashing over at
// the swap. The router's own view transition no longer animates anything
// (transitions.css): the cell choreography is the transition.
const railIndex = (path) => {
  const here = normalize(path);
  const links = [...document.querySelectorAll("#side [data-match]")];
  return links.findIndex((link) => link.dataset.match.split(/\s+/).some((m) => normalize(m) === here));
};
let navDir = 0;
document.addEventListener("astro:before-preparation", (event) => {
  navDir = 0;
  const to = event.to instanceof URL ? event.to : null;
  if (to && to.origin === location.origin) {
    const from = railIndex(location.pathname);
    const dest = railIndex(to.pathname);
    if (from >= 0 && dest >= 0 && from !== dest) navDir = dest > from ? 1 : -1;
    if (normalize(to.pathname) !== normalize(location.pathname)) markCurrent(to.pathname);
  }
  motion.onBeforePreparation(event, navDir);
});
document.addEventListener("astro:after-swap", () => {
  markCurrent();
  motion.onAfterSwap(navDir);
  navDir = 0;
});

// ── Pulse: the input badge on a detail page flashes once on arrival ─────────
let firstPageLoad = true;
function pulseStamp() {
  if (stillMotion() || !/^\/projects\//.test(location.pathname)) return;
  const stamps = [...document.querySelectorAll("#main .input-stamp")].filter((el) => !el.closest(".grid-card"));
  if (!stamps.length) return;
  // Once its cell's type has woken up (motion.js): later on a first load.
  const wait = html.hasAttribute("data-boot") ? 900 : 700;
  setTimeout(() => stamps.forEach((el) => {
    el.classList.remove("is-pulse");
    void el.offsetWidth; // restart if it is still there from a previous visit
    el.classList.add("is-pulse");
    el.addEventListener("animationend", () => el.classList.remove("is-pulse"), { once: true });
  }), wait);
}

// ── Magnetic links: "Case study →", "Play ↗", the news links ───────────────
// Any link in the pane that ends in an arrow, plus the named hooks. The
// arrow glyph becomes its own .mag-arrow (it slides on hover, CSS); within
// MAG_RADIUS of the mouse the link drifts up to MAG_MAX px toward it, and
// the card it sits in (.mag-field) lights a faint ring at the cursor.
// One pointermove listener, one write per frame, mouse only.
const MAG_HOOKS = ".project-play, .beat-link, .hn-links a, .hn-card a:not(.hn-link)";
const ARROW = /[→↗]\s*$/;
const MAG_RADIUS = 56, MAG_MAX = 3;
let magLinks = [];
function wrapArrow(link) {
  // Every text run that ends in an arrow (a bilingual link has one per
  // language): a glyph that is already its own element is tagged; otherwise
  // it is split off into a span.
  const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
  const ends = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) if (ARROW.test(node.textContent)) ends.push(node);
  ends.forEach((node) => {
    const parent = node.parentElement;
    if (parent && parent !== link && parent.textContent.trim().length === 1) { parent.classList.add("mag-arrow"); return; }
    const text = node.textContent.replace(/\s+$/, "");
    const glyph = document.createElement("span");
    glyph.className = "mag-arrow";
    glyph.textContent = text.slice(-1);
    node.textContent = text.slice(0, -1);
    node.after(glyph);
  });
  return ends.length > 0;
}
function bindMagnetic() {
  magLinks = [];
  const seen = new Set();
  document.querySelectorAll(`${MAG_HOOKS}, #main a[href]`).forEach((link) => {
    if (seen.has(link) || link.closest(".grid-card, .side")) return;
    seen.add(link);
    const hooked = link.matches(MAG_HOOKS);
    const hasArrow = link.querySelector(".mag-arrow") || wrapArrow(link);
    if (!hooked && !hasArrow) return;
    link.classList.add("is-magnetic");
    const field = link.closest(".bento-cell, .hn-card, .project-cs-cell");
    field?.classList.add("mag-field");
    magLinks.push({ link, field });
  });
}
let magBound = false;
function bindMagneticPointer() {
  if (magBound) return;
  magBound = true;
  let raf = 0, x = 0, y = 0, lit = new Set();
  const frame = () => {
    raf = 0;
    const near = new Set();
    for (const { link, field } of magLinks) {
      if (!link.isConnected) continue;
      const r = link.getBoundingClientRect();
      const dx = x < r.left ? x - r.left : x > r.right ? x - r.right : 0;
      const dy = y < r.top ? y - r.top : y > r.bottom ? y - r.bottom : 0;
      if (Math.hypot(dx, dy) <= MAG_RADIUS && r.width) {
        const cx = x - (r.left + r.width / 2), cy = y - (r.top + r.height / 2);
        const k = MAG_MAX / Math.max(MAG_RADIUS, Math.hypot(cx, cy));
        link.style.setProperty("--mx", `${(cx * k).toFixed(2)}px`);
        link.style.setProperty("--my", `${(cy * k).toFixed(2)}px`);
      } else if (link.style.getPropertyValue("--mx")) {
        link.style.removeProperty("--mx"); link.style.removeProperty("--my");
      }
      if (field) {
        const f = field.getBoundingClientRect();
        if (x >= f.left && x <= f.right && y >= f.top && y <= f.bottom) {
          field.style.setProperty("--cx", `${Math.round(x - f.left)}px`);
          field.style.setProperty("--cy", `${Math.round(y - f.top)}px`);
          near.add(field);
        }
      }
    }
    lit.forEach((f) => { if (!near.has(f)) f.classList.remove("is-near"); });
    near.forEach((f) => f.classList.add("is-near"));
    lit = near;
  };
  document.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" || stillMotion() || !magLinks.length) return;
    x = event.clientX; y = event.clientY;
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });
  document.addEventListener("astro:before-preparation", () => {
    lit.forEach((f) => f.classList.remove("is-near")); lit = new Set();
  });
}

// ── Boot: over once the first-load sequence has played ──────────────────────
// Sidebar.astro sets html[data-boot]; transitions.css runs the sequence. Drop
// the attribute when it has finished, so the rolled-up counts are plain text
// again and nothing can replay.
const BOOT_ANIMS = new Set(["odo-roll", "boot-row"]);
function endBoot() {
  if (!html.hasAttribute("data-boot")) return;
  const end = () => html.removeAttribute("data-boot");
  requestAnimationFrame(() => {
    const running = document.getAnimations?.().filter((a) => BOOT_ANIMS.has(a.animationName)) ?? [];
    if (!running.length) return end();
    Promise.allSettled(running.map((a) => a.finished)).then(end);
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
  bindControls();
  setLang(html.dataset.langFixed || store.get("tu-lang") || "en");
  applyTheme();
  bindSidebar();
  markCurrent();
  closePhoneMenu();
  bindCards();
  bindFeel();
  bindEcho();
  bindPreviews();
  bindReveal();
  bindMagnetic();
  bindMagneticPointer();
  pulseStamp();
  if (firstPageLoad) { firstPageLoad = false; endBoot(); }
  // The old in-page language buttons some hand-built pages still carry.
  document.querySelectorAll(".lang-btn:not([data-bound])").forEach((b) => {
    b.dataset.bound = "1";
    b.addEventListener("click", () => setLang(b.dataset.lang));
  });
}
document.addEventListener("astro:page-load", onPageLoad);
motion.bindMotion();
motion.intro(); // the first paint: the pane's boxes, then its content

// The rail is persisted, but moving it into the new document resets its
// scroll position; carry it across the swap.
let sideScroll = 0;
document.addEventListener("astro:before-swap", () => { sideScroll = document.getElementById("side")?.scrollTop ?? 0; });
document.addEventListener("astro:after-swap", () => { const side = document.getElementById("side"); if (side) side.scrollTop = sideScroll; });
