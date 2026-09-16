// The site shell: head, nav, language switch, footer, and the two small
// scripts every page carries. Mirrors interactive.html — the current
// canonical shell — so generated pages sit in the same site as the hand-built ones.
import { esc, href, plain } from "./html.mjs";

// Five sections of work, then the two pages about the person. Every item
// carries the same weight — only the page you are on is emphasised.
// Canonical 5+1 navigation: Work, Now, Ideas, About, Work with me, Studio ↗.
const CANONICAL_NAV = [
  {
    label: "Work",
    path: "work.html",
    sub: [
      { path: "work/index.html", label: "All Work" },
      { path: "work.html", label: "Product &amp; Experience Design" },
      { path: "brand.html", label: "Brand &amp; Creative" },
      { path: "ai-products.html", label: "AI Products &amp; Systems" },
    ],
  },
  {
    label: "Now",
    path: "now.html",
    sub: [
      { path: "now.html", label: "What I’m Working On" },
      { path: "now.html#ventures", label: "Active Ventures" },
      { path: "interactive.html", label: "Interactive &amp; Playable" },
      { path: "ai-tools.html", label: "AI Tools" },
    ],
  },
  {
    label: "Ideas",
    path: "publications.html",
    sub: [
      { path: "publications.html", label: "Publications" },
      { path: "breakbias.html", label: "Break Bias" },
      { path: "workshop.html", label: "Workshops" },
      { path: "intentfirst.html", label: "Intent First" },
    ],
  },
  {
    label: "About",
    path: "about.html",
    isTierbreak: true,
  },
  {
    label: "Work with me",
    path: "contact.html",
  },
  {
    label: "Studio ↗",
    path: "https://creativityiseverywhere.com",
    external: true,
  },
];

export function head({ lens, ctx, css }) {
  const og = ctx.ogImage ? `<meta property="og:image" content="${esc(href(ctx, ctx.ogImage))}">` : "";
  const robots = lens.seo.noindex ? `<meta name="robots" content="noindex, nofollow">` : "";
  const canonical = ctx.canonical ? `<link rel="canonical" href="${esc(ctx.canonical)}">` : "";
  return `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="${esc(href(ctx, "favicon.svg"))}">
  <title>${esc(lens.seo.title)}</title>
  <meta name="description" content="${esc(lens.seo.description)}">
  ${robots}
  ${canonical}
  <meta property="og:title" content="${esc(lens.seo.title)}">
  <meta property="og:description" content="${esc(lens.seo.description)}">
  <meta property="og:type" content="website">
  ${og}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&family=Noto+Sans+JP:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
${css}
  </style>
</head>`;
}

export function nav(ctx, activePath) {
  const normActive = activePath === "now/index.html" ? "now.html" : (activePath === "work/index.html" ? "work/index.html" : activePath);
  const items = CANONICAL_NAV.map((item) => {
    const isSubActive = item.sub?.some((s) => s.path === normActive);
    const isParentActive = item.path === normActive || isSubActive || (normActive === "work/index.html" && item.path === "work.html");
    const tierbreak = item.isTierbreak ? ` is-tierbreak` : "";
    const subClass = item.sub ? ` has-sub` : "";
    const target = item.external ? ` target="_blank" rel="noopener"` : "";

    const subMenu = item.sub
      ? `\n        <div class="nav-sub">\n` +
        item.sub.map((s) => {
          const here = s.path === normActive ? ` class="nav-sub-link is-active" aria-current="page"` : ` class="nav-sub-link"`;
          return `          <a href="${esc(href(ctx, s.path))}"${here}>${s.label}</a>`;
        }).join("\n") +
        `\n        </div>`
      : "";

    const ariaCurrent = (!item.sub && item.path === normActive) ? ` aria-current="page"` : "";
    const activeCls = isParentActive ? ` class="nav-link is-active"` : ` class="nav-link"`;

    return `      <li class="nav-item${tierbreak}${subClass}">
        <a href="${item.external ? esc(item.path) : esc(href(ctx, item.path))}"${activeCls}${ariaCurrent}${target}>${item.label}</a>${subMenu}
      </li>`;
  }).join("\n");

  return `  <nav class="site-nav">
    <a href="${esc(href(ctx, "index.html"))}" class="nav-logo">
      <span class="nav-logo-name">Takao Umehara</span>
      <span class="nav-logo-tag">creativity is everywhere</span>
    </a>
    <ul class="nav-links" id="primary-nav-links">
${items}
    </ul>
    <button class="nav-toggle" id="nav-toggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="primary-nav-links"><span></span><span></span><span></span></button>
  </nav>`;
}

export const langSwitch = () => `  <div class="lang-switch" id="lang-switch">
    <button class="lang-btn is-active" data-lang="en">EN</button>
    <span class="lang-sep">|</span>
    <button class="lang-btn" data-lang="jp">JP</button>
  </div>`;

export function footer({ lib, ctx }) {
  const c = lib.profile.contact;
  return `  <footer>
    <div class="site-footer">
      <div>
        <div class="footer-logo">${esc(lib.profile.name)}</div>
        <div class="footer-llc">Design &amp; consulting through <strong>Creativity Is Everywhere LLC</strong></div>
      </div>
      <ul class="footer-links">
        <li><a href="${esc(c.linkedin)}" target="_blank" rel="noopener">LinkedIn</a></li>
        ${c.github ? `<li><a href="${esc(c.github)}" target="_blank" rel="noopener">GitHub</a></li>` : ""}
        ${c.medium ? `<li><a href="${esc(c.medium)}" target="_blank" rel="noopener">Medium</a></li>` : ""}
        <li><a href="${esc(href(ctx, "intentfirst.html"))}">intentfirst.ai</a></li>
      </ul>
      <div class="footer-copy">${esc(plain(lib.profile.location))}</div>
    </div>
  </footer>`;
}

export const scripts = () => `  <script>
  // ── Language toggle (shared convention: html.lang-jp + localStorage "tu-lang") ──
  (() => {
    const html = document.documentElement;
    const btns = document.querySelectorAll(".lang-btn");
    let saved = "en";
    try { saved = localStorage.getItem("tu-lang") || "en"; } catch (e) {}
    const setLang = (lang) => {
      // The lang attribute travels with the class: without it a screen reader
      // reads the Japanese aloud in an English voice.
      html.classList.toggle("lang-jp", lang === "jp"); html.lang = lang === "jp" ? "ja" : "en";
      btns.forEach((b) => b.classList.toggle("is-active", b.dataset.lang === lang));
      try { localStorage.setItem("tu-lang", lang); } catch (e) {}
    };
    setLang(saved);
    btns.forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
  })();

  // ── Mobile nav ──
  (() => {
    const toggle = document.getElementById("nav-toggle");
    const links = document.getElementById("primary-nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", () => {
      const open = toggle.classList.toggle("is-open");
      links.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
      toggle.classList.remove("is-open");
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }));
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

  // ── Card click-through (clean direct navigation with View Transition cross-fade) ──
  (() => {
    document.querySelectorAll("[data-href]").forEach((card) => {
      card.addEventListener("click", (event) => {
        if (event.target.closest("a, button, details, summary")) return;
        const url = card.dataset.href;
        if (!url) return;
        if (card.dataset.external === "true") {
          window.open(url, "_blank", "noopener");
        } else {
          window.location.href = url;
        }
      });
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && event.target === card) card.click();
      });
    });
  })();
  </script>`;
