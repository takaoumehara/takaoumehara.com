// The home page: a PORTO ROCHA image grid over every category's public work
// (src/pages/index.astro, src/components/grid/WorkGrid.astro), not the lens
// sections anymore — those moved to /lens/default/ (see
// tests/lens-system.test.mjs and tests/ai-tools-portfolio.test.mjs).
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
    /class="grid-headline"><span class="t-en">I turn ambiguous ideas into interactive experiences, working AI prototypes, and 0→1 products\.<\/span>/,
  );
});

// Simplified filters per IA redesign (src/pages/index.astro, "Simplified
// filters per IA redesign: All / Interactive / AI / Design"): the five
// underlying categories (interactive, ai-products, ai-tools, brand, work) are
// deliberately collapsed into 4 pills, with ai = ai-products + ai-tools and
// design = brand + work.
test("the home page carries a filter row: All, Interactive, AI, Design, each with a count", () => {
  const html = read("index.html");
  const filters = html.match(/<div class="grid-filters"[^>]*>[\s\S]*?<\/div>/)?.[0];
  assert.ok(filters, "index.html needs the filter row");
  const expectedFilters = ["all", "interactive", "ai", "design"];
  for (const f of expectedFilters) assert.match(filters, new RegExp(`data-filter="${f}"`), `filter row missing ${f}`);
  // Every pill carries a count.
  const counts = [...filters.matchAll(/class="filter-count">(\d+)</g)].map((m) => Number(m[1]));
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

test("the home page renders one card per public item across every category, each carrying data-category", () => {
  const html = read("index.html");
  const rendered = cards(html);
  assert.equal(rendered.length, gridIds.size, "one card per deduplicated grid item");
  for (const card of rendered) {
    assert.match(card, /\bdata-category="[^"]+"/, "every home card needs data-category for the filter row");
  }
});

test("ja/index.html is the Japanese edition of the same grid", () => {
  assert.ok(exists("ja/index.html"), "ja/index.html must exist");
  const html = read("ja/index.html");
  assert.match(html, /<html lang="ja" class="lang-jp"/);
  assert.equal(cards(html).length, gridIds.size, "the Japanese edition carries the same grid");
});
