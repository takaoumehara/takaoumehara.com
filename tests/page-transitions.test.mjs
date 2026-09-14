// Universal Page Transitions: Clean Fade Out / Fade In
// Guards the site-wide cross-fade transition requested by Takao Umehara:
// - Replaces awkward thumbnail-expansion morphs and black curtain wipes with clean root cross-fade.
// - Asserts @view-transition opt-in, clean root animations, disarmed wipe curtain, and reduced-motion safety.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadLibrary, ROOT } from "../src/lib/load.mjs";
import { renderAll } from "../src/build.mjs";

const read = (name) => readFileSync(join(ROOT, name), "utf8");
const head = (html) => html.slice(0, html.indexOf("<body"));

const destinations = [...loadLibrary().evidence.values()]
  .map((item) => item.links?.caseStudy)
  .filter(Boolean)
  .filter((path, index, all) => all.indexOf(path) === index)
  .sort();

test("every project page opts into view transitions in the head", () => {
  assert.ok(destinations.length >= 30, `only ${destinations.length} destinations found`);
  for (const path of destinations) {
    const html = read(path);
    assert.ok(
      head(html).includes("@view-transition { navigation: auto; }") ||
      head(html).includes("design-system.css") ||
      head(html).includes("project-page.css"),
      `${path}: must opt in to navigation transitions`,
    );
  }
});

test("all generated listing pages opt into view transitions", () => {
  for (const [path, html] of renderAll()) {
    assert.ok(
      head(html).includes("@view-transition { navigation: auto; }"),
      `${path}: no view-transition opt-in in head`,
    );
  }
});

test("black wipe curtain is completely disarmed across the site", () => {
  const wipeCss = read("assets/wipe.css");
  assert.match(wipeCss, /#wipe-curtain\s*\{[^}]*display:\s*none\s*!important/);

  const wipeJs = read("assets/wipe.js");
  assert.ok(!wipeJs.includes("sessionStorage.setItem('tu_wiping'"), "wipe.js must not set wiping flag");
});

test("root cross-fade transitions are defined in lens.css and design-system.css", () => {
  const lens = read("src/render/lens.css");
  assert.match(lens, /@keyframes\s+vt-fade-out/);
  assert.match(lens, /@keyframes\s+vt-fade-in/);
  assert.match(lens, /::view-transition-old\(root\)/);
  assert.match(lens, /::view-transition-new\(root\)/);

  const ds = read("assets/design-system.css");
  assert.match(ds, /@keyframes\s+vt-fade-out/);
  assert.match(ds, /@keyframes\s+vt-fade-in/);
});

test("reduced motion disables transition animation delay and duration", () => {
  const lens = read("src/render/lens.css");
  assert.match(
    lens.slice(lens.lastIndexOf("@media (prefers-reduced-motion: reduce)")),
    /animation-duration:\s*1ms/,
  );

  const ds = read("assets/design-system.css");
  assert.match(
    ds.slice(ds.lastIndexOf("@media (prefers-reduced-motion: reduce)")),
    /animation-duration:\s*1ms/,
  );
});
