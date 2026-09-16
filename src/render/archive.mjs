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

export function getFilterTags(item) {
  const tags = new Set(["all"]);
  const caps = new Set((item.capabilities || []).map((c) => c.id));
  const slug = item.slug;

  // 0→1
  if (
    caps.has("zero-to-one") || caps.has("new-ventures") || caps.has("prototyping") ||
    item.kind === "venture" ||
    [
      "intentfirst", "mybrainspec", "moime", "resona", "kao-game", "rakugaki-jam",
      "typespace", "koe-baku", "emoji-blast", "marubatsu", "werewolf", "superforge",
      "snap-pair", "koji-fizz", "festival-reinvention", "graffitiwear", "skateboard-egift",
      "cli-studios", "web3-wallet", "hummingbird", "ela-quests",
    ].includes(slug)
  ) {
    tags.add("zero-to-one");
  }

  // AI
  if (
    caps.has("ai") || caps.has("agentic-ux") ||
    item.kind === "tool" ||
    [
      "intentfirst", "mybrainspec", "moime", "verizon-ai-workflow", "amazon-firetv",
      "superforge", "snap-pair", "interactive-experience-skills", "intuitive-game-design",
      "cross-model-handoff", "failforward", "multilingual-readme",
    ].includes(slug)
  ) {
    tags.add("ai");
  }

  // Interactive
  if (
    caps.has("interactive") || caps.has("creative-technology") ||
    item.kind === "experiment" ||
    [
      "resona", "kao-game", "rakugaki-jam", "typespace", "koe-baku",
      "emoji-blast", "marubatsu", "werewolf", "snap-pair",
    ].includes(slug)
  ) {
    tags.add("interactive");
  }

  // Product
  if (
    caps.has("ux-cx") || caps.has("product-strategy") || caps.has("design-systems") ||
    caps.has("enterprise") || caps.has("b2b") || caps.has("b2c") ||
    [
      "verizon-ai-workflow", "verizon-totalwireless", "tmobile", "cli-studios",
      "web3-wallet", "credit-card-portal", "hummingbird", "ux-audit", "amazon-firetv",
      "intentfirst", "mybrainspec", "moime", "ela-quests", "menlomath", "vocab-app",
      "edutrack", "carnegie",
    ].includes(slug)
  ) {
    tags.add("product");
  }

  // Brand
  if (
    caps.has("brand") || caps.has("creative-direction") || caps.has("storytelling") || caps.has("film-production") ||
    [
      "coca-cola", "value-frontier", "odell-education", "konosaki", "dnt", "kitadoko",
      "festival-reinvention", "xq", "extraordinary", "koji-fizz", "graffitiwear", "skateboard-egift",
    ].includes(slug)
  ) {
    tags.add("brand");
  }

  // Learning
  if (
    [
      "ela-quests", "menlomath", "vocab-app", "edutrack", "carnegie",
      "odell-education", "xq", "extraordinary", "rakugaki-jam",
    ].includes(slug)
  ) {
    tags.add("learning");
  }

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
  { id: "zero-to-one", label: { en: "0→1", jp: "0→1" } },
  { id: "ai", label: { en: "AI", jp: "AI" } },
  { id: "interactive", label: { en: "Interactive", jp: "インタラクティブ" } },
  { id: "product", label: { en: "Product", jp: "プロダクト" } },
  { id: "brand", label: { en: "Brand", jp: "ブランド" } },
  { id: "learning", label: { en: "Learning", jp: "教育・学習" } },
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
${nav(pageCtx, "work.html")}
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
