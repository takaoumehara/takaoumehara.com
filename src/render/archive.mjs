// Unified Work Archive (/work): all 46 evidence projects filterable by discipline.
// Pulls directly from lib.evidence without duplicating project data.
import { esc, t, tb, href, mediaFill } from "./html.mjs";
import { head, nav, langSwitch, footer, scripts } from "./shell.mjs";
import { inputLabel, status } from "./sections.mjs";

const CTA = {
  live: { en: "Try it ↗", jp: "触ってみる ↗" },
  caseStudy: { en: "Case study →", jp: "ケーススタディ →" },
  repo: { en: "Source ↗", jp: "ソース ↗" },
  external: { en: "Open ↗", jp: "開く ↗" },
};

function destination(item) {
  const l = item.links ?? {};
  if (item.playable && l.live) return { url: l.live, label: CTA.live, external: true };
  if (l.caseStudy) return { url: l.caseStudy, label: CTA.caseStudy, external: false };
  if (l.live) return { url: l.live, label: CTA.external, external: true };
  if (l.external) return { url: l.external, label: CTA.external, external: true };
  if (l.repo) return { url: l.repo, label: CTA.repo, external: true };
  return null;
}

const cardName = (item) => {
  const name = item.shortTitle ?? item.title;
  return item.jpTitle && item.jpTitle !== name
    ? t({ en: name, jp: item.jpTitle })
    : esc(name);
};

const PRODUCT_SLUGS = new Set([
  "verizon-ai-workflow", "verizon-totalwireless", "tmobile", "cli-studios",
  "web3-wallet", "credit-card-portal", "hummingbird", "ux-audit",
  "ela-quests", "menlomath", "vocab-app", "edutrack", "carnegie",
]);

const AI_PRODUCT_SLUGS = new Set([
  "intentfirst", "mybrainspec", "moime", "verizon-ai-workflow", "amazon-firetv", "breakbias",
]);

const AI_TOOL_SLUGS = new Set([
  "superforge", "snap-pair", "interactive-experience-skills", "intuitive-game-design",
  "cross-model-handoff", "failforward", "multilingual-readme",
]);

const INTERACTIVE_SLUGS = new Set([
  "resona", "kao-game", "rakugaki-jam", "typespace", "koe-baku",
  "emoji-blast", "marubatsu", "werewolf", "kanji-puzzle",
]);

const BRAND_SLUGS = new Set([
  "coca-cola", "value-frontier", "odell-education", "konosaki", "dnt",
  "kitadoko", "festival-reinvention", "xq", "extraordinary", "koji-fizz",
  "graffitiwear", "skateboard-egift",
]);

export function getFilterTags(item) {
  const tags = new Set(["all"]);
  const slug = item.slug;

  if (PRODUCT_SLUGS.has(slug)) tags.add("product");
  if (AI_PRODUCT_SLUGS.has(slug)) tags.add("ai-products");
  if (AI_TOOL_SLUGS.has(slug)) tags.add("ai-tools");
  if (INTERACTIVE_SLUGS.has(slug)) tags.add("interactive");
  if (BRAND_SLUGS.has(slug)) tags.add("brand");

  return [...tags];
}

function archiveCard(item, ctx) {
  const to = destination(item);
  const url = to ? (to.external ? to.url : href(ctx, to.url)) : null;
  const open = to ? ` tabindex="0" data-href="${esc(url)}"${to.external ? ' data-external="true"' : ""}` : "";
  const link = to
    ? `<a class="cat-card-cta" href="${esc(url)}"${to.external ? ' target="_blank" rel="noopener"' : ""}>${t(to.label)}</a>`
    : "";
  const chips = [
    item.input ? `<span class="pill pill--in">${inputLabel(item.input)}</span>` : "",
    status(item.status),
  ].filter(Boolean).join("");
  const meta = item.cardKind;
  const tags = getFilterTags(item).join(" ");

  return `        <article class="cat-card" data-tags="${esc(tags)}"${open}>
          <div class="cat-card-media">${mediaFill(item, ctx)}</div>
          <div class="cat-card-body">
            ${chips ? `<p class="chips">${chips}</p>` : ""}
            <h3 class="cat-card-title">${cardName(item)}</h3>
            ${meta ? `<p class="cat-card-kind">${t(meta)}</p>` : ""}
            <p class="cat-card-desc">${tb(item.cardLine ?? item.summary)}</p>
            ${link}
          </div>
        </article>`;
}

const FILTERS = [
  { id: "all", label: { en: "All", jp: "すべて" } },
  { id: "product", label: { en: "Product Design", jp: "プロダクト" } },
  { id: "ai-products", label: { en: "AI Products", jp: "AI プロダクト" } },
  { id: "ai-tools", label: { en: "AI Tools", jp: "AI ツール" } },
  { id: "interactive", label: { en: "Interactive & Playable", jp: "インタラクティブ" } },
  { id: "brand", label: { en: "Brand & Creative", jp: "ブランド" } },
];

export function renderWorkArchive({ lib, css, ctx }) {
  // Ordered selection of all evidence items
  const items = [...lib.evidence.values()];
  const counts = {};
  for (const f of FILTERS) {
    counts[f.id] = items.filter((item) => getFilterTags(item).includes(f.id)).length;
  }

  const seo = {
    seo: {
      title: "Work Archive — Takao Umehara",
      description: "Unified work archive by Takao Umehara. 0→1 products, AI systems, interactive experiences, brand identities, and learning platforms.",
      noindex: false,
    },
  };

  const pageCtx = { ...ctx, ogImage: ctx.ogImage ?? items[0]?.assets?.hero };

  const filterButtons = FILTERS.map((f, i) => `        <button type="button" class="filter-btn${i === 0 ? " is-active" : ""}" data-filter="${f.id}">
          <span>${t(f.label)}</span>
          <span class="filter-count">${counts[f.id]}</span>
        </button>`).join("\n");

  return `<!DOCTYPE html>
<!-- GENERATED by src/build.mjs — unified work archive pulling from src/data/ -->
<html lang="en" data-category="work-archive">
${head({ lens: seo, ctx: pageCtx, css })}
<body>
${nav(pageCtx, "work/index.html")}
  <main class="cat-page">
    <header class="cat-head">
      <h1 class="cat-title"><span class="t-en">Work Archive</span><span class="t-jp">制作・開発アーカイブ</span></h1>
      <p class="cat-lede"><span class="t-en">20+ years of 0→1 products, AI systems, interactive experiences, brand identities, and learning platforms.</span><span class="t-jp is-block">0→1 のプロダクト、AI システム、インタラクティブ体験、ブランド、学びの基盤まで。</span></p>
      <div class="archive-filters" role="tablist" aria-label="Filter work by discipline">
${filterButtons}
      </div>
      <p class="cat-count"><span id="archive-count">${items.length}</span><span class="t-en"> projects</span><span class="t-jp"> 件</span></p>
    </header>

    <div class="cat-grid">
${items.map((item) => archiveCard(item, pageCtx)).join("\n")}
    </div>
  </main>

${langSwitch()}

${footer({ lib, ctx: pageCtx })}

${scripts()}
  <script>
  // ── Work Archive Filter Bar ──
  (() => {
    const btns = document.querySelectorAll(".filter-btn");
    const cards = document.querySelectorAll(".cat-card[data-tags]");
    const countEl = document.getElementById("archive-count");
    if (!btns.length || !cards.length) return;

    function applyFilter(filter) {
      btns.forEach((b) => b.classList.toggle("is-active", b.dataset.filter === filter));
      let visible = 0;
      cards.forEach((card) => {
        const tags = (card.dataset.tags || "").split(" ");
        const show = filter === "all" || tags.includes(filter);
        card.classList.toggle("is-hidden", !show);
        if (show) visible += 1;
      });
      if (countEl) countEl.textContent = String(visible);
      try {
        if (filter !== "all") {
          history.replaceState(null, "", "#" + filter);
        } else if (window.location.hash) {
          history.replaceState(null, "", window.location.pathname);
        }
      } catch (e) {}
    }

    btns.forEach((b) => {
      b.addEventListener("click", () => applyFilter(b.dataset.filter));
    });

    const hash = window.location.hash.replace("#", "").toLowerCase();
    if (hash) {
      const match = document.querySelector(\`.filter-btn[data-filter="\${hash}"]\`);
      if (match) applyFilter(hash);
    }
  })();
  </script>
</body>
</html>
`;
}
