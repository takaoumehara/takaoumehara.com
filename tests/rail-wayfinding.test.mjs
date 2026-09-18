// Not getting lost in the rail.
//
// The complaint behind this file: "とにかく見失わないような設計が欲しい" — the
// current row was a blue word in a list of 45, and the rail never scrolled to
// it. The scrolling lives in src/scripts/site.js and is checked in a browser
// (tests/a11y.spec.mjs). What is checked HERE is everything a browser cannot
// tell you from one page: that the rail's arithmetic is honest.
//
// It was not. `verizon-ai-workflow` sat in two category files, so the rail
// drew the same card twice — 45 rows for 44 projects — and /all/'s five
// discipline counts summed to one more than its own total. The archive's tags
// were a hand-written copy of the category files that nothing validated, so
// the two surfaces also disagreed about AI Products (6 vs 5).
import test from "node:test";
import assert from "node:assert/strict";
import { loadLibrary, loadCategories } from "../src/lib/load.mjs";
import { filterIndex, getFilterTags, FILTERS } from "../src/lib/archive.mjs";
import { read } from "./_dist.mjs";

const lib = loadLibrary();
const categories = loadCategories();
const listed = categories.flatMap((c) => (c.groups ?? []).flatMap((g) => g.items ?? []));

const railRows = (html) => {
  const side = html.match(/<aside[^>]*class="side"[\s\S]*?<\/aside>/i)?.[0];
  assert.ok(side, "the page has no rail");
  const work = side.match(/<nav class="side-work"[\s\S]*?<\/nav>/i)[0];
  // Only the work rows — the person's pages are a different fold.
  return [...work.matchAll(/<a class="side-item" href="([^"]+)"/g)].map((m) => m[1]);
};

test("a piece of work belongs to exactly one category", () => {
  const seen = new Map();
  const twice = [];
  for (const c of categories) {
    for (const id of (c.groups ?? []).flatMap((g) => g.items ?? [])) {
      if (seen.has(id) && seen.get(id) !== c.slug) twice.push(`${id}: ${seen.get(id)} + ${c.slug}`);
      seen.set(id, c.slug);
    }
  }
  assert.deepEqual(twice, [], `listed in two categories:\n  ${twice.join("\n  ")}`);
});

test("the rail draws one row per project — no card appears twice", () => {
  for (const page of ["about.html", "interactive.html", "projects/koji-fizz.html"]) {
    const rows = railRows(read(page));
    assert.equal(rows.length, listed.length, `${page}: one row per listed project`);
    assert.equal(new Set(rows).size, rows.length, `${page}: a project is drawn twice in the rail`);
  }
});

test("the chips add up to the work the rail lists", () => {
  const html = read("about.html");
  const chips = [...html.matchAll(/<span class="side-chip-n" data-count="(\d+)">/g)].map((m) => Number(m[1]));
  assert.equal(chips.length, categories.length + 1, "an All chip plus one per category");
  const [all, ...perCategory] = chips;
  assert.equal(all, listed.length, "the All chip carries the real total");
  assert.equal(perCategory.reduce((n, c) => n + c, 0), all, "the categories account for every project, once");
});

test("/all/'s discipline filters come from the category files, and sum to its total", () => {
  const index = filterIndex(categories);
  const items = [...lib.evidence.values()].filter((i) => !i.hideInArchive && i.slug !== "kanji-puzzle");
  const counts = Object.fromEntries(
    FILTERS.map((f) => [f.id, items.filter((i) => getFilterTags(i, index).includes(f.id)).length]),
  );
  const disciplines = FILTERS.filter((f) => f.id !== "all").reduce((n, f) => n + counts[f.id], 0);
  assert.equal(counts.all, items.length, "the All filter counts every archived item");
  assert.equal(
    disciplines,
    items.length,
    `the five disciplines sum to ${disciplines} but the archive holds ${items.length} — something is tagged twice or not at all`,
  );
  for (const item of items) {
    assert.ok(getFilterTags(item, index).length > 1, `${item.slug}: in the archive but in no category`);
  }
});

test("the rail's AI Products count and /all/'s AI Products filter agree", () => {
  const index = filterIndex(categories);
  const items = [...lib.evidence.values()].filter((i) => !i.hideInArchive && i.slug !== "kanji-puzzle");
  const fromArchive = items.filter((i) => getFilterTags(i, index).includes("ai-products")).length;
  const fromCategory = categories.find((c) => c.slug === "ai-products").groups.flatMap((g) => g.items).length;
  assert.equal(fromArchive, fromCategory, "the two surfaces disagree about what an AI Product is");
});

test("the logo is the way home, and it is the only thing in the rail that points at /", () => {
  const html = read("about.html");
  const side = html.match(/<aside[^>]*class="side"[\s\S]*?<\/aside>/i)[0];
  const home = [...side.matchAll(/<a [^>]*href="\/"[^>]*>/g)];
  assert.equal(home.length, 2, 'one logo in the phone bar, one in the panel');
  for (const tag of home) assert.match(tag[0], /class="side-logo/, "only the logo goes home");
});
