// Opening a card is a move, not a cut: the thumbnail grows into the hero band
// of the page it opens. docs/page-transitions.md explains the mechanism; this
// file is the part that keeps it working.
//
// It needs guarding because both of its failure modes are silent. A detail page
// that forgets its half still loads — it just cuts. And a page that names two
// elements `hero-media` aborts the whole transition rather than picking one,
// which is exactly what the old class-based rule did on verizon-ai-agents.html,
// where nine elements matched `.project-hero, .wds-hero`.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadLibrary, ROOT } from "../src/lib/load.mjs";
import { renderAll } from "../src/build.mjs";

const read = (name) => readFileSync(join(ROOT, name), "utf8");
const head = (html) => html.slice(0, html.indexOf("<body"));
const body = (html) => html.slice(html.indexOf("<body"));

// Every page a card can open, taken from the records rather than a list kept by
// hand — a new case study is covered the day it is referenced.
const destinations = [...loadLibrary().evidence.values()]
  .map((item) => item.links?.caseStudy)
  .filter(Boolean)
  .filter((path, index, all) => all.indexOf(path) === index)
  .sort();

test("every page a card opens carries the receiving half of the transition", () => {
  assert.ok(destinations.length >= 30, `only ${destinations.length} destinations found`);
  for (const path of destinations) {
    const html = read(path);
    assert.ok(
      head(html).includes("@view-transition { navigation: auto; }"),
      `${path}: no opt-in, or the opt-in is below <body> where it can be parsed too late`,
    );
    assert.ok(
      head(html).includes("[data-vt-hero] { view-transition-name: hero-media; }"),
      `${path}: opts in but never names its hero`,
    );
  }
});

test("exactly one element per page is named, because a second one aborts the transition", () => {
  for (const path of [...destinations, ...readdirSync(join(ROOT, "projects")).map((f) => `projects/${f}`)]) {
    if (!path.endsWith(".html")) continue;
    const html = read(path);
    const named = body(html).match(/data-vt-hero/g)?.length ?? 0;
    assert.equal(named, 1, `${path}: ${named} elements marked data-vt-hero, expected exactly 1`);
    assert.ok(
      !/\.(?:project-hero|wds-hero)[^{]*\{[^}]*view-transition-name/.test(html),
      `${path}: still names the hero by class — the class matches more than one element on some pages`,
    );
  }
});

test("the two snapshots are cropped, not stretched, on both sides of the navigation", () => {
  // A 3:2 thumbnail and a full-bleed hero are different shapes, and the default
  // object-fit is `fill`. Without this the picture visibly squashes mid-flight.
  const crop = /::view-transition-old\(hero-media\),\s*::view-transition-new\(hero-media\)\s*\{[^}]*object-fit: cover/;
  assert.match(read("src/render/lens.css"), crop, "lens.css (the listing half)");
  for (const path of destinations) assert.match(read(path), crop, path);
});

test("the listing half names one card at a time, around the navigation itself", () => {
  const shell = read("src/render/shell.mjs");
  // Naming every card up front would be the obvious implementation and would
  // break the feature outright: the name has to be unique in the document.
  assert.ok(!/querySelectorAll\([^)]*\)\.forEach\(\s*\(?\w+\)?\s*=>\s*{?[^}]*viewTransitionName\s*=\s*"hero-media"/.test(shell));
  assert.match(shell, /addEventListener\("pageswap"/);
  assert.match(shell, /addEventListener\("pagereveal"/);
  assert.match(shell, /viewTransition\.finished\.then\(clear, clear\)/, "a name left behind makes the next navigation ambiguous");
  assert.match(shell, /prefers-reduced-motion: reduce/);
});

test("the generated pages ship both halves", () => {
  for (const [path, html] of renderAll()) {
    assert.ok(head(html).includes("@view-transition { navigation: auto; }"), `${path}: no opt-in`);
    assert.match(html, /pageswap/, `${path}: no script to name the card that was clicked`);
  }
});

test("reduced motion gets the navigation without the move", () => {
  // These pages carry several reduced-motion blocks, so the check is that the
  // one containing the opt-out is a reduced-motion block, not that any is.
  const optOut = "[data-vt-hero] { view-transition-name: none; }";
  for (const path of destinations) {
    const css = read(path);
    const at = css.indexOf(optOut);
    assert.ok(at > 0, `${path}: the morph is never switched off for reduced motion`);
    const opener = css.lastIndexOf("@media", at);
    assert.match(css.slice(opener, at), /prefers-reduced-motion: reduce/, path);
  }
  // The listing half never assigns the name at all under reduced motion, so
  // there is nothing to switch off there — only the cross-fade is shortened.
  const lens = read("src/render/lens.css");
  assert.match(lens.slice(lens.lastIndexOf("@media (prefers-reduced-motion: reduce)")), /animation-duration: 1ms/);
});
