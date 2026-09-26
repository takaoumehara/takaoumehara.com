// Universal Page Transitions: Clean Fade Out / Fade In
// Guards the site-wide cross-fade transition requested by Takao Umehara:
// - Replaces awkward thumbnail-expansion morphs and black curtain wipes with clean root cross-fade.
// - Asserts @view-transition opt-in, clean root animations, and reduced-motion safety.
// - The sidebar is its own transition group, so it stays put while the page cross-fades.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadLibrary, ROOT } from "../src/lib/load.mjs";
import { read, exists } from "./_dist.mjs";

const source = (name) => readFileSync(join(ROOT, name), "utf8");
const head = (html) => html.slice(0, html.indexOf("<body"));

const destinations = [...loadLibrary().evidence.values()]
  .map((item) => item.links?.caseStudy)
  .filter(Boolean)
  .filter((path, index, all) => all.indexOf(path) === index)
  .sort();

test("every project page is built and opts into view transitions through the site stylesheet", () => {
  assert.ok(destinations.length >= 30, `only ${destinations.length} destinations found`);
  for (const path of destinations) {
    assert.ok(exists(path), `${path}: not built`);
    const html = read(path);
    // The site stylesheet (with @view-transition) is bundled into every page by the layout.
    assert.match(head(html), /<link rel="stylesheet" href="\/_astro\/[^"]+\.css">|@view-transition \{ navigation: auto; \}/, `${path}: must load the site stylesheet`);
    assert.match(html, /data-vt-hero/, `${path}: the hero must be marked for the thumbnail → hero transition`);
  }
});

test("the listing pages carry the site stylesheet too", () => {
  // "All work" is now one canonical page, the fullscreen archive at /work
  // (src/pages/work.astro); all/index.html is just a static meta-refresh
  // redirect stub to it (see tests/strategic-refinement.test.mjs), with none
  // of the page chrome, so it is not a listing page here — work.html is.
  for (const path of ["index.html", "ja/index.html", "lens/creative/index.html", "interactive.html", "work.html", "now/index.html"]) {
    assert.match(head(read(path)), /<link rel="stylesheet" href="\/_astro\/[^"]+\.css">/, `${path}: no site stylesheet in head`);
  }
});

test("root cross-fade transitions are defined in site.css and design-system.css", () => {
  const site = source("src/styles/site.css");
  assert.match(site, /@view-transition \{ navigation: auto; \}/);
  assert.match(site, /@keyframes\s+vt-fade-out/);
  assert.match(site, /@keyframes\s+vt-fade-in/);
  assert.match(site, /::view-transition-old\(root\)/);
  assert.match(site, /::view-transition-new\(root\)/);

  const ds = source("public/assets/design-system.css");
  assert.match(ds, /@keyframes\s+vt-fade-out/);
  assert.match(ds, /@keyframes\s+vt-fade-in/);
});

test("the sidebar is its own view-transition group and does not animate", () => {
  const shell = source("src/styles/shell.css");
  assert.match(shell, /\.side \{[^}]*view-transition-name: side/);
  assert.match(shell, /::view-transition-group\(side\)[^{]*\{[^}]*animation: none/);
});

test("reduced motion disables transition animation delay and duration", () => {
  const site = source("src/styles/site.css");
  assert.match(
    site.slice(site.lastIndexOf("@media (prefers-reduced-motion: reduce)")),
    /animation-duration:\s*1ms/,
  );

  const ds = source("public/assets/design-system.css");
  assert.match(
    ds.slice(ds.lastIndexOf("@media (prefers-reduced-motion: reduce)")),
    /animation-duration:\s*1ms/,
  );
});
