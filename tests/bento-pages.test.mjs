// The five pages about the person, drawn as a bento
// (src/bento/pages/<name>.json → BentoDoc → BentoPage).
//
// Each of these was a hand-built page through FragmentPage, carrying its own
// stylesheet. No two of them started at the same place on the screen, and
// because design-system.css defines a light :root but only patches --nav-*
// under [data-theme="dark"], four of them ignored the dark-mode switch
// altogether. What this file guards is that they are now one format: the same
// opening, the same tokens, the same grid, and one <h1> each.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../src/lib/load.mjs";
import { read, exists } from "./_dist.mjs";

const PAGES_DIR = join(ROOT, "src", "bento", "pages");
const names = readdirSync(PAGES_DIR).filter((n) => n.endsWith(".json")).map((n) => n.replace(/\.json$/, "")).sort();
const layout = (name) => JSON.parse(readFileSync(join(PAGES_DIR, `${name}.json`), "utf8"));
const rows = (l) => (l.sections ?? []).flatMap((s) => s.rows ?? []);
const cells = (l) => rows(l).flatMap((r) => r.cells ?? []);

// /now/ builds its rows from src/data/now.json rather than a file here, and
// /work-with-me.html is /contact.html at a second address.
const BUILT = [
  ["about.html", "about"],
  ["publications.html", "publications"],
  ["workshop.html", "workshop"],
  ["contact.html", "contact"],
  ["work-with-me.html", "contact"],
  ["now/index.html", null],
];

test("the person's pages all have a layout", () => {
  assert.deepEqual(names, ["about", "contact", "publications", "workshop"]);
});

test("every row fills the twelve columns and names one height", () => {
  for (const name of names) {
    for (const [i, row] of rows(layout(name)).entries()) {
      const width = (row.cells ?? []).reduce((sum, c) => sum + (c.w ?? 0), 0);
      assert.equal(width, 12, `${name}: row ${i} spans ${width} of 12`);
      assert.ok(Number.isInteger(row.h) && row.h >= 1, `${name}: row ${i} needs an integer height`);
    }
  }
});

test("a cell is only ever a third, a quarter, a half or the whole width", () => {
  // At <=1100px the grid drops to six columns (src/styles/bento.css). A span of
  // 5, 7 or 8 would overflow the track list there, so widths stay on {3,4,6,12}.
  const ALLOWED = new Set([3, 4, 6, 12]);
  for (const name of names) {
    for (const cell of cells(layout(name))) {
      assert.ok(ALLOWED.has(cell.w), `${name}: a cell ${cell.w} wide does not survive the six-column grid`);
    }
  }
});

test("these pages open on a sentence, not a picture, and say it once", () => {
  for (const name of names) {
    const l = layout(name);
    assert.equal(l.hero?.kind, "statement", `${name}: a page of prose opens on its sentence`);
    assert.ok(l.hero.text, `${name}: a statement hero needs hero.text`);
    // The statement IS the <h1>, so there must be no title band underneath.
    assert.equal(l.title, undefined, `${name}: a statement hero is already the <h1>`);
  }
});

test("every picture has an alt", () => {
  for (const name of names) {
    for (const cell of cells(layout(name))) {
      if ((cell.kind ?? "media") === "media") {
        assert.equal(typeof cell.alt, "string", `${name}: ${cell.src} needs an alt (use "" if it is decorative)`);
      }
    }
  }
});

test("a layout is words, not markup — t() escapes every string it prints", () => {
  // src/lib/html.mjs escapes each side of an EN/JP pair, so an <em> left in a
  // layout would be printed at the reader rather than applied.
  for (const name of names) {
    const raw = readFileSync(join(PAGES_DIR, `${name}.json`), "utf8");
    assert.ok(!/<(?:em|strong|br|b|i|span)\b/.test(raw), `${name}: inline HTML in a layout shows up as text`);
  }
});

test("all five build as a bento, with one <h1> and no hand-built stylesheet", () => {
  for (const [path] of BUILT) {
    assert.ok(exists(path), `${path}: not built`);
    const html = read(path);
    assert.match(html, /<div class="bento-doc">/, `${path}: not rendered as a bento`);
    assert.equal([...html.matchAll(/<h1\b/gi)].length, 1, `${path}: expected exactly one <h1>`);
    assert.match(html, /<h1 class="bento-statement">/, `${path}: the <h1> is the statement hero`);
    assert.equal(html.includes("design-system.css"), false, `${path}: still loads design-system.css`);
  }
});

test("they all start at the same place: no page tokens, fonts or column of its own", () => {
  for (const [path] of BUILT) {
    const html = read(path);
    assert.ok(!/:root\s*\{/.test(html), `${path}: carries a :root of its own`);
    assert.ok(!/@font-face/.test(html), `${path}: declares its own fonts`);
    assert.ok(!/--col:/.test(html), `${path}: sets its own column width`);
    assert.ok(!/--bg:\s*#/.test(html), `${path}: redefines --bg`);
  }
});

test("each page keeps the words of the fragment it replaces", () => {
  const says = {
    "about.html": ["I do my best work before the answer is obvious.", "答えがまだ見えていないところから、形にしていく。"],
    "publications.html": ["Books and ideas on creativity, design, bias, and AI.", "extra•ordinary: Everyday Creativity"],
    "workshop.html": ["Break Bias", "The 8 BreakBias Systematic Transformation Tools", "01. Subtraction"],
    "contact.html": ["Let’s make something tangible.", "Where I am a great fit", "Personal Entry Points"],
    "now/index.html": ["What I’m Working On", "Why it exists"],
  };
  for (const [path, lines] of Object.entries(says)) {
    const html = read(path);
    for (const line of lines) assert.ok(html.includes(line), `${path}: lost "${line}"`);
  }
});

test("a converted page no longer keeps a hand-built body around", () => {
  for (const name of [...names, "work-with-me"]) {
    for (const ext of ["html", "css", "json"]) {
      assert.equal(
        existsSync(join(ROOT, "src", "fragments", `${name}.${ext}`)),
        false,
        `${name}: two sources for one page — delete src/fragments/${name}.${ext}`,
      );
    }
  }
});
