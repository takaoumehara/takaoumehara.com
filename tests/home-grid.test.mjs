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

test("the home page opens with the canonical headline", () => {
  const html = read("index.html");
  assert.match(
    html,
    /class="grid-headline"[^>]*><span class="t-en">I turn ambiguous ideas into interactive experiences, working AI prototypes, and 0→1 products\.<\/span>/,
  );
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
  assert.ok(hnCards.length >= 2, "HomeNews must render the info card plus at least one article");
  for (const m of hnCards) {
    assert.match(m[0], /\bbento-cell\b/, "every HomeNews card must carry .bento-cell (the shared cell token)");
  }
});

test("/work carries the four canonical filters (All, Interactive, AI, Design), each with a real count", () => {
  const html = read("work.html");
  const filters = html.match(/<div class="work-filters"[^>]*>[\s\S]*?<\/div>/)?.[0];
  assert.ok(filters, "work.html needs the filter row");
  const expectedFilters = ["all", "interactive", "ai", "design"];
  for (const f of expectedFilters) assert.match(filters, new RegExp(`data-filter="${f}"`), `filter row missing ${f}`);
  const counts = [...filters.matchAll(/class="filter-count"[^>]*>(\d+)</g)].map((m) => Number(m[1]));
  assert.equal(counts.length, expectedFilters.length, "one count per pill: All, Interactive, AI, Design");
  assert.ok(counts.every((n) => n > 0), "every filter count must be a real number, not zero");
  assert.equal(counts[0], gridIds.size, `the All count must be ${gridIds.size} (every deduplicated grid item)`);

  const catMap = new Map(categories.map((c) => [c.slug, c]));
  const groupCount = (slug) => catMap.get(slug)?.groups.reduce((n, g) => n + g.items.length, 0) ?? 0;
  const [, interactiveCount, aiCount, designCount] = counts;
  assert.equal(interactiveCount, groupCount("interactive"), "Interactive count must match the interactive category");
  assert.equal(aiCount, groupCount("ai-products") + groupCount("ai-tools"), "AI count must combine ai-products + ai-tools");
  assert.equal(designCount, groupCount("brand") + groupCount("work"), "Design count must combine brand + work");
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
