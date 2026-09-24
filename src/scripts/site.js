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
  document.getElementById("theme-switch")?.addEventListener("click", toggleTheme);
  document.getElementById("lang-cycle")?.addEventListener("click", () => setLang(currentLang() === "jp" ? "en" : "jp"));
  
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
