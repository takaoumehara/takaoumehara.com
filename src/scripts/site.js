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
  langButtons().forEach((cycle) => {
    cycle.textContent = lang === "jp" ? "EN" : "JP";
    cycle.setAttribute("aria-label", lang === "jp" ? "Switch to English" : "Switch to Japanese");
  });
  renderClock();
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

// ── Dual clocks (Tokyo + NY) with weather ──────────────────────────────────
const weatherCache = { tokyo: null, newyork: null, lastFetch: 0 };
const weatherIcons = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️",
  51: "🌧️", 53: "🌧️", 55: "🌧️", 61: "🌧️", 63: "🌧️", 65: "🌧️",
  71: "🌨️", 73: "🌨️", 75: "🌨️", 95: "⛈️", 96: "⛈️", 99: "⛈️"
};

async function fetchWeather() {
  const now = Date.now();
  if (now - weatherCache.lastFetch < 600000) return; // Cache for 10 minutes
  weatherCache.lastFetch = now;
  
  try {
    // Tokyo: 35.6762°N, 139.6503°E
    const tokyoRes = await fetch("https://api.open-meteo.com/v1/forecast?latitude=35.6762&longitude=139.6503&current_weather=true");
    const tokyoData = await tokyoRes.json();
    weatherCache.tokyo = weatherIcons[tokyoData.current_weather?.weathercode] || "☀️";
    
    // New York: 40.7128°N, 74.0060°W
    const nyRes = await fetch("https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current_weather=true");
    const nyData = await nyRes.json();
    weatherCache.newyork = weatherIcons[nyData.current_weather?.weathercode] || "☀️";
  } catch (e) {
    // Graceful fallback: keep default icons
  }
}

function renderClock() {
  const container = document.getElementById("side-clocks");
  if (!container) return;
  const now = new Date();
  const jp = currentLang() === "jp";
  const locale = jp ? "ja-JP" : "en-US";
  
  container.querySelectorAll(".clock-row").forEach(row => {
    const zone = row.dataset.zone;
    const city = row.dataset.city;
    const name = jp ? row.dataset.nameJp : row.dataset.nameEn;
    const time = new Intl.DateTimeFormat(locale, { 
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: zone 
    }).format(now);
    
    row.querySelector(".clock-city").textContent = name;
    row.querySelector(".clock-time").textContent = time;
    
    const weatherIcon = weatherCache[city] || row.querySelector(".clock-weather").textContent;
    row.querySelector(".clock-weather").textContent = weatherIcon;
  });
}

let clockTimer = null;
function startClock() {
  if (clockTimer || !document.getElementById("side-clocks")) return;
  fetchWeather(); // Initial fetch
  renderClock();
  clockTimer = setInterval(renderClock, 1000);
  setInterval(fetchWeather, 600000); // Refresh weather every 10 minutes
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
        const groupTitle = group ? group.querySelector("summary").textContent.toLowerCase() : "";
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
    else navigate(url, { sourceElement: card }); // the throw (below) reads the card back from the event
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

// ── Throw / Return: the pressed thumbnail grows into the teaser ─────────────
// One `hero` view-transition-name per document at every moment:
//   before-preparation (old snapshot next): name the pressed row's/card's
//     thumb `hero`, and silence the page's own [data-vt-hero] for this trip;
//     leaving a detail page for somewhere else, mark the current rail row as
//     the return target instead.
//   after-swap (new snapshot next): the persisted rail still carries the
//     thumb, so strip its name so it cannot collide with the detail teaser —
//     or, on a return, silence the new page's [data-vt-hero] and name the row.
//   finished: remove every inline name.
// Reduced motion names nothing (transitions.css also drops the hero name), a
// collapsed rail (phones) has no visible row, so those trips dissolve.
let thrown = null;   // the element named for this trip
let returning = false;
const onScreen = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; };
document.addEventListener("astro:before-preparation", (event) => {
  html.dataset.navigated = "1"; // the first-load entrance never runs again
  thrown = null; returning = false;
  if (stillMotion()) return;
  const row = event.sourceElement?.closest?.(".side-item, .grid-card, .hn-article");
  const from = row?.querySelector(".side-thumb, .grid-media, .hn-thumb");
  const leaving = document.querySelector("[data-vt-hero]");
  if (onScreen(from)) {
    if (leaving) leaving.style.viewTransitionName = "none";
    from.style.viewTransitionName = "hero";
    thrown = from;
  } else if (leaving && !row) {
    const back = document.querySelector('#side .side-item[aria-current="page"] .side-thumb');
    if (onScreen(back)) { thrown = back; returning = true; }
  }
});
document.addEventListener("astro:before-swap", (event) => {
  const done = () => {
    if (thrown) { thrown.style.removeProperty("view-transition-name"); thrown = null; }
    document.querySelectorAll("[data-vt-hero]").forEach((el) => el.style.removeProperty("view-transition-name"));
    returning = false;
  };
  event.viewTransition?.finished?.then(done, done);
});
document.addEventListener("astro:after-swap", () => {
  html.dataset.navigated = "1"; // the swap replaced <html>'s attributes; set it again before the new snapshot
  if (!thrown) return;
  if (returning) {
    document.querySelectorAll("[data-vt-hero]").forEach((el) => { el.style.viewTransitionName = "none"; });
    thrown.style.viewTransitionName = "hero";
  } else if (thrown.closest("#side")) {
    thrown.style.removeProperty("view-transition-name");
  }
  markCurrent(); // the pressed row inverts inside the new snapshot, not after it
});

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
  startClock();
  bindCards();
  bindFeel();
  bindEcho();
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
