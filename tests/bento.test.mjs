// Case studies drawn as a bento (src/bento/<slug>.json → BentoPage.astro).
//
// The build already refuses a layout whose rows do not fill the twelve columns
// or whose pictures are not on disk (src/lib/bento.mjs, called from
// src/pages/projects/[slug].astro). What this file guards is the rest of the
// contract: that a converted page is a whole page (one <h1>, a hero the
// thumbnail can grow into, the Challenge/Solution strip), that it has actually
// left the hand-built stylesheets behind, and that nothing in a layout is
// unreachable to a screen reader.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../src/lib/load.mjs";
import { read, exists } from "./_dist.mjs";

const BENTO_DIR = join(ROOT, "src", "bento");
const slugs = readdirSync(BENTO_DIR).filter((n) => n.endsWith(".json")).map((n) => n.replace(/\.json$/, "")).sort();
const layout = (slug) => JSON.parse(readFileSync(join(BENTO_DIR, `${slug}.json`), "utf8"));
const rows = (l) => (l.sections ?? []).flatMap((s) => s.rows ?? []);
const cells = (l) => rows(l).flatMap((r) => r.cells ?? []);

test("the fixture actually covers some case studies", () => {
  assert.ok(slugs.length >= 3, `expected at least 3 bento layouts, got ${slugs.length}`);
});

test("every row fills the twelve columns and names one height", () => {
  for (const slug of slugs) {
    for (const [i, row] of rows(layout(slug)).entries()) {
      const width = (row.cells ?? []).reduce((sum, c) => sum + (c.w ?? 0), 0);
      assert.equal(width, 12, `${slug}: row ${i} spans ${width} of 12`);
      assert.ok(Number.isInteger(row.h) && row.h >= 1, `${slug}: row ${i} needs an integer height`);
    }
  }
});

test("every picture has an alt and every embed has a title", () => {
  for (const slug of slugs) {
    const l = layout(slug);
    for (const cell of cells(l)) {
      if (cell.kind === "embed") {
        assert.ok(cell.title, `${slug}: an embed with no title is a dead end for a screen reader`);
      }
      if ((cell.kind ?? "media") === "media") {
        assert.equal(typeof cell.alt, "string", `${slug}: ${cell.src} needs an alt (use "" if it is decorative)`);
      }
    }
    assert.ok(l.hero, `${slug}: needs a hero`);
    assert.ok(l.title?.h1, `${slug}: needs title.h1`);
  }
});

test("each converted study builds, with one <h1>, a hero to grow into, and the strip", () => {
  for (const slug of slugs) {
    const path = `projects/${slug}.html`;
    assert.ok(exists(path), `${path}: not built`);
    const html = read(path);
    assert.equal([...html.matchAll(/<h1\b/gi)].length, 1, `${slug}: expected exactly one <h1>`);
    assert.equal([...html.matchAll(/data-vt-hero/g)].length, 1, `${slug}: exactly one hero is marked for the thumbnail → hero transition`);
    assert.match(html, /<section class="cs-strip"/, `${slug}: the Challenge / Solution strip is missing`);
    assert.match(html, /<div class="bento-doc">/, `${slug}: not rendered as a bento`);
  }
});

test("a bento page leaves the hand-built stylesheets behind", () => {
  // design-system.css redefines :root. A page that still loads it is not on
  // the site's tokens, which is the whole reason for converting it.
  for (const slug of slugs) {
    const html = read(`projects/${slug}.html`);
    assert.equal(html.includes("design-system.css"), false, `${slug}: still loads design-system.css`);
    assert.equal(html.includes("project-page.css"), false, `${slug}: still loads project-page.css`);
  }
});

test("a study that declares itself dark ships dark and stays dark", () => {
  const html = read("projects/resona.html");
  assert.match(html, /<html lang="en" data-theme="dark" data-theme-lock="dark"/);
});

test("a converted study no longer keeps a hand-built body around", () => {
  for (const slug of slugs) {
    assert.equal(
      existsSync(join(ROOT, "src", "case-studies", `${slug}.html`)),
      false,
      `${slug}: two sources for one page — delete src/case-studies/${slug}.* when you convert it`,
    );
  }
});

test("a case study's slug and a page's name never name the same page", () => {
  // The pages about the person live in src/bento/pages/ so their names cannot
  // collide with a slug ("about" is a plausible name for either), and the two
  // are read through separate globs (src/lib/bento.mjs). This check is what
  // keeps that true as either set grows.
  const pagesDir = join(BENTO_DIR, "pages");
  const pages = existsSync(pagesDir)
    ? readdirSync(pagesDir).filter((n) => n.endsWith(".json")).map((n) => n.replace(/\.json$/, ""))
    : [];
  for (const name of pages) {
    assert.equal(slugs.includes(name), false, `${name}: a case study and a page of its own both claim this name`);
    assert.equal(
      existsSync(join(ROOT, "src", "fragments", `${name}.html`)),
      false,
      `${name}: two sources for one page — delete src/fragments/${name}.* when you convert it`,
    );
  }
});
