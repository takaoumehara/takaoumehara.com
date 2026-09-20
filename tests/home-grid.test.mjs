// The landing page: the name, the sentence, and every piece of work as a
// bento (src/pages/index.astro → src/components/landing/Landing.astro).
//
// No rail and no filter row here on purpose — those are the two lists you get
// on the first click, and tests/ai-tools-portfolio.test.mjs guards that. What
// this file guards is that the landing still shows ALL of the work, that the
// build ships a real layout before any JavaScript runs, and that the layout it
// ships tiles the grid exactly.
import test from "node:test";
import assert from "node:assert/strict";
import { loadCategories } from "../src/lib/load.mjs";
import { BENTO_PATTERNS, BENTO_OPENERS, cutBento, steadyPick } from "../src/lib/bentoShapes.mjs";
import { read, exists } from "./_dist.mjs";

const categories = loadCategories();

// Every public item across every category's groups, deduplicated — the same
// set src/lib/site.mjs's gridEntries() builds the grid from.
const gridIds = new Set();
for (const c of categories) for (const g of c.groups) for (const id of g.items) gridIds.add(id);

const cards = (html) => [...html.matchAll(/<article class="[^"]*\bbento-cell\b[^"]*"[\s\S]*?<\/article>/g)].map((m) => m[0]);

test("the landing page leads with the name and the canonical sentence", () => {
  const html = read("index.html");
  assert.match(html, /<p class="landing-name">Takao Umehara<\/p>/);
  assert.match(
    html,
    /<h1 class="landing-line"><span class="t-en">I turn ambiguous ideas into interactive experiences, working AI prototypes, and 0→1 products\.<\/span>/,
  );
  assert.equal([...html.matchAll(/<h1\b/gi)].length, 1, "the landing page has exactly one <h1>");
});

test("the landing page shows one card per public item, each carrying its categories", () => {
  const html = read("index.html");
  const rendered = cards(html);
  assert.equal(rendered.length, gridIds.size, "one card per deduplicated grid item");
  for (const card of rendered) {
    assert.match(card, /\bdata-category="[^"]+"/, "every card needs data-category");
    assert.match(card, /\bdata-w="\d+"[\s\S]*?\bdata-h="\d+"/, "every card ships a size, so the grid is laid out before any script runs");
  }
});

test("the built layout tiles the twelve columns exactly, row by row", () => {
  // The shuffle in the browser walks the same table; if the deterministic walk
  // leaves a row short, so will the random one, and the grid gets a hole in it.
  const shapes = cutBento(gridIds.size, steadyPick());
  assert.equal(shapes.length, gridIds.size);
  let row = 0;
  for (const shape of shapes) {
    row += shape.w;
    assert.ok(row <= 12, `a row overflowed twelve columns (${row})`);
    if (row === 12) row = 0;
  }
  // The last row may be short only if the work ran out mid-pattern; with these
  // patterns (every one of which has a single-cell fallback) it never does.
  assert.equal(row, 0, "the last row must fill the grid too");
});

test("every pattern in the table fills twelve columns", () => {
  for (const pattern of [...BENTO_PATTERNS, ...BENTO_OPENERS]) {
    const width = pattern.w.reduce((sum, w) => sum + w, 0);
    assert.equal(width, 12, `pattern [${pattern.w}] spans ${width}, not 12`);
    assert.ok(pattern.h.length > 0, `pattern [${pattern.w}] needs at least one height`);
  }
});

test("ja/index.html is the Japanese edition of the same landing page", () => {
  assert.ok(exists("ja/index.html"), "ja/index.html must exist");
  const html = read("ja/index.html");
  assert.match(html, /<html lang="ja" class="lang-jp"/);
  assert.equal(cards(html).length, gridIds.size, "the Japanese edition carries the same work");
});

test("/all/ is where the two lists meet: the rail and the discipline filters", () => {
  const html = read("all/index.html");
  assert.match(html, /<aside[^>]*class="side"/, "/all/ carries the rail");
  const filters = html.match(/<div class="grid-filters"[^>]*>[\s\S]*?<\/div>/)?.[0];
  assert.ok(filters, "/all/ carries the filter row");
  assert.match(filters, /data-filter="all"/);
});
