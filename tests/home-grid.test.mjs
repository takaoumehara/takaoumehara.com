// The home page: HomeHero + HomeNews only (src/pages/index.astro). "All
// work" — the filter pills and the full work grid — moved to its own
// fullscreen page, /work (src/pages/work.astro, tested below), per the
// person's request to keep the landing to the hero and the news bento.
// tests/strategic-refinement.test.mjs already covers /work being the one
// canonical archive; this file covers the filters/grid/counts that used to
// live on the home page and now live there instead.
import test from "node:test";
import assert from "node:assert/strict";
import { loadLibrary, loadCategories } from "../src/lib/load.mjs";
import { read, exists } from "./_dist.mjs";

const lib = loadLibrary();
const categories = loadCategories();

// Every public item across every category's groups, deduplicated — the same
// set src/lib/site.mjs's gridEntries() builds the grid from.
const gridIds = new Set();
for (const c of categories) for (const g of c.groups) for (const id of g.items) gridIds.add(id);

const cards = (html) => [...html.matchAll(/<article class="[^"]*\bcat-card\b[^"]*"[\s\S]*?<\/article>/g)].map((m) => m[0]);

// The right pane opens with the About block (portrait, name, positioning,
// career summary, Resume / LinkedIn / Contact), then Now, the showcase and
// the Updates bento. The old hero card ("Creative Director · Interactive
// Media Designer …" / "I turn ambiguous ideas into …" + a row of links) that
// used to open the news bento is gone; only the rail's About card still
// carries the positioning line.
const mainOf = (html) => html.match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? "";

test("the home page opens with the About block, then Now, the showcase and Updates — no old hero card", () => {
  for (const file of ["index.html", "ja/index.html"]) {
    const main = mainOf(read(file));
    assert.ok(main, `${file} needs a <main>`);
    const order = ["about-intro", "home-now", "home-hero", "home-updates-heading", "home-news"].map((cls) => main.search(new RegExp(`class="[^"]*\\b${cls}\\b`)));
    assert.ok(order.every((i) => i >= 0), `${file}: About, Now, showcase, Updates heading and news must all render`);
    assert.deepEqual([...order].sort((a, b) => a - b), order, `${file}: About → Now → showcase → Updates → news`);
    assert.match(main, /Principal Product Designer &(amp;)? AI Product Builder/);
    assert.ok(!main.includes("hn-info"), `${file}: the old basic-info card must be gone from the news bento`);
    assert.ok(!main.includes("I turn ambiguous ideas"), `${file}: the old hero headline must not be in the right pane`);
    assert.ok(!main.includes("Creative Director · Interactive Media Designer"), `${file}: the old tagline card must not be in the right pane`);
  }
});

test("the home page no longer carries the 'All work' grid or its filter row — that moved to /work", () => {
  const html = read("index.html");
  assert.ok(!html.includes('class="home-work-head"'), "the old 'All work' heading must be gone from the home page");
  assert.ok(!html.includes('class="grid-filters"'), "the old filter pills must be gone from the home page");
  assert.equal(cards(html).length, 0, "the home page must render zero .cat-card tiles — HomeHero + HomeNews only");
});

test("the home page's news bento is the only work under the hero, and every card is a bento cell", () => {
  const html = read("index.html");
  const hnCards = [...html.matchAll(/<article class="[^"]*\bhn-card\b[^"]*"/g)];
  assert.ok(hnCards.length >= 2, "HomeNews must render the release articles");
  for (const m of hnCards) {
    assert.match(m[0], /\bbento-cell\b/, "every HomeNews card must carry .bento-cell (the shared cell token)");
  }
});

test("/work carries the five canonical filters (All, Product, AI, Interactive, Tools), each with a real count", () => {
  const html = read("work.html");
  const filters = html.match(/<div class="work-filters"[^>]*>[\s\S]*?<\/div>/)?.[0];
  assert.ok(filters, "work.html needs the filter row");
  const expectedFilters = ["all", "product", "ai", "interactive", "tools"];
  for (const f of expectedFilters) assert.match(filters, new RegExp(`data-filter="${f}"`), `filter row missing ${f}`);
  const counts = [...filters.matchAll(/class="filter-count"[^>]*>(\d+)</g)].map((m) => Number(m[1]));
  assert.equal(counts.length, expectedFilters.length, "one count per pill: All, Product, AI, Interactive, Tools");
  assert.ok(counts.every((n) => n > 0), "every filter count must be a real number, not zero");
  assert.equal(counts[0], gridIds.size, `the All count must be ${gridIds.size} (every deduplicated grid item)`);

  // Each item gets exactly ONE primary filter (src/pages/work.astro's
  // FILTER_PRECEDENCE: ai-products → AI, ai-tools → Tools, interactive →
  // Interactive, work / brand → Product), so the four counts add up to All
  // even though the category data files some items under two categories.
  const membership = new Map();
  for (const c of categories) for (const g of c.groups) for (const id of g.items) {
    if (!membership.has(id)) membership.set(id, new Set());
    membership.get(id).add(c.slug);
  }
  const PRECEDENCE = [["ai-products", "ai"], ["ai-tools", "tools"], ["interactive", "interactive"], ["work", "product"], ["brand", "product"]];
  const expected = { product: 0, ai: 0, interactive: 0, tools: 0 };
  for (const cats of membership.values()) expected[PRECEDENCE.find(([slug]) => cats.has(slug))[1]] += 1;
  const [all, productCount, aiCount, interactiveCount, toolsCount] = counts;
  assert.equal(productCount + aiCount + interactiveCount + toolsCount, all, "the four filter counts must add up to All");
  assert.deepEqual({ product: productCount, ai: aiCount, interactive: interactiveCount, tools: toolsCount }, expected);

  // Every tile carries exactly one of the four filter ids.
  const tileFilters = cards(html).map((card) => card.match(/\bdata-filter="([^"]+)"/)?.[1]);
  assert.ok(tileFilters.every((f) => ["product", "ai", "interactive", "tools"].includes(f)), "every /work tile needs one primary data-filter");
  for (const id of Object.keys(expected)) assert.equal(tileFilters.filter((f) => f === id).length, expected[id], `${id} tiles must match its count`);

  // Verizon AI Workflow stays filed under both work and ai-products (the rail
  // and /product-design list it) but is counted once, under AI.
  assert.ok(membership.get("verizon-ai-workflow")?.has("work"), "verizon-ai-workflow must stay in src/categories/work.json");
  assert.ok(membership.get("verizon-ai-workflow")?.has("ai-products"), "verizon-ai-workflow must stay in ai-products");
});

test("/work renders one tile per public item across every category, each carrying data-category and .bento-cell — the free grid", () => {
  const html = read("work.html");
  const rendered = cards(html);
  assert.equal(rendered.length, gridIds.size, "one tile per deduplicated grid item");
  for (const card of rendered) {
    assert.match(card, /\bdata-category="[^"]+"/, "every /work tile needs data-category for the filter row");
    assert.match(card, /\bbento-cell\b/, "every /work tile needs .bento-cell (the shared cell token)");
  }
  // "Fairly free" grid: tiles vary in size (a feature 2x2, a wide 2x1, and
  // the plain 1x1), not one uniform card everywhere.
  assert.ok(html.includes("tile--feature"), "the free grid must include at least one feature (2x2) tile");
  assert.ok(html.includes("tile--wide"), "the free grid must include at least one wide (2x1) tile");
});

test("ja/index.html is the Japanese edition of the same hero + news home page", () => {
  assert.ok(exists("ja/index.html"), "ja/index.html must exist");
  const html = read("ja/index.html");
  assert.match(html, /<html lang="ja" class="lang-jp"/);
  assert.equal(cards(html).length, 0, "the Japanese edition must not carry the old work grid either");
  const en = read("index.html");
  const hnCount = (h) => [...h.matchAll(/<article class="[^"]*\bhn-card\b[^"]*"/g)].length;
  assert.equal(hnCount(html), hnCount(en), "the Japanese edition carries the same news bento as the English one");
});
