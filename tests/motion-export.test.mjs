// The Motion Lab's "Export code" (src/scripts/motion-export.mjs,
// docs/motion-lab/engine-contract.md §5): exportCode(config) → { css, js, note }.
// Node only: the generated JS is parsed here; it is run in a real browser by
// the proof script (see docs/motion-lab/journal/2026-09-28-export.md).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../src/lib/load.mjs";
import { exportCode } from "../src/scripts/motion-export.mjs";

const MOTION = JSON.parse(readFileSync(join(ROOT, "src", "data", "motion.json"), "utf8"));
const withCover = (style, params = {}, extra = {}) => ({
  ...MOTION,
  ...extra,
  transition: { ...MOTION.transition, cover: { style, params } },
});

// id → what its exported JS must carry (its key constants at their defaults).
const COVERS = {
  none: [/const COVER = "none"/],
  "slabs.quad-stagger": [/radiusPx: \d+/, /staggerMs: \d+/, /\[3, 2, 1, 0\]/],
  "slabs.quad-center": [/radiusPx: \d+/, /\[0, 1, 2, 3\]/],
  "slabs.split-sharp": [/durationMs: \d+/, /staggerMs: \d+/, /translateY\(-105%\)/],
  "slabs.split-round": [/radiusPx: \d+/, /translateY\(-105%\)/],
  "slabs.dynamic": [/radiusPx: \d+/, /grid: \d+/],
  field: [/angle: 152/, /veilMs: \d+/, /liftMs: \d+/, /lift: "fade"/, /radial-gradient\(122% 92% at 18% 10%/, /color-mix\(in oklab/],
  wipe: [/direction: "ltr"/, /edge: "straight"/, /durationMs: \d+/],
  "band-sweep": [/bandPct: \d+/, /angle: -?\d+/, /durationMs: \d+/],
  dissolve: [/durationMs: \d+/, /ml-sheet/],
};

test("motion.json (cover none) exports CSS, a MotionLab script and a note naming box-first", () => {
  const x = exportCode(MOTION);
  assert.ok(x.css.length > 0);
  assert.match(x.css, /^\/\* Motion Lab export · /);
  assert.match(x.css, /\.ml-cover/);
  assert.match(x.css, /prefers-reduced-motion/);
  assert.match(x.css, /--ml-speed: 1\.7/);
  assert.match(x.css, /--ml-hold-ms: 300ms/);
  assert.match(x.js, /window\.MotionLab/);
  assert.doesNotThrow(() => new Function(x.js));
  assert.match(x.note, /box-first/);
  assert.match(x.note, /How to use: paste the CSS into your stylesheet, the JS before <\/body>/);
  assert.match(x.note, /MotionLab\.play\(\(\) => swapYourContent\(\)\)/);
});

test("bad input never throws and returns strings", () => {
  for (const bad of [null, undefined, "x", 42, [], { transition: "nope" }, { global: { speed: "fast" }, transition: { cover: { style: 7, params: "p" } } }]) {
    let x;
    assert.doesNotThrow(() => { x = exportCode(bad); });
    assert.equal(typeof x.css, "string");
    assert.equal(typeof x.js, "string");
    assert.equal(typeof x.note, "string");
    assert.ok(x.note.length > 0);
    if (x.js) assert.doesNotThrow(() => new Function(x.js));
  }
  assert.equal(exportCode(null).css, "");
  assert.equal(exportCode("x").js, "");
});

for (const [id, patterns] of Object.entries(COVERS)) {
  test(`cover ${id}: the JS parses and carries its constants`, () => {
    const x = exportCode(withCover(id));
    assert.doesNotThrow(() => new Function(x.js), `${id}: the exported JS parses`);
    assert.match(x.js, new RegExp(`const COVER = "${id.replace(/\./g, "\\.")}"`));
    for (const re of patterns) assert.match(x.js, re, `${id}: ${re}`);
    assert.match(x.js, /window\.MotionLab = \{ cover, reveal, play \}/);
    assert.match(x.js, /fill: "both"/);
    assert.match(x.js, /addEventListener\("pointerdown", finishAll, true\)/);
    assert.match(x.js, /addEventListener\("keydown", finishAll, true\)/);
    assert.match(x.js, /prefers-reduced-motion: reduce/);
    assert.doesNotMatch(x.js, /\bimport\b/);
    assert.ok(x.js.split("\n").length <= 300, `${id}: ${x.js.split("\n").length} lines`);
    assert.match(x.css, /\.ml-cover \{ position: fixed; inset: 0; z-index: 900; pointer-events: none;/);
    assert.match(x.css, /@media \(prefers-reduced-motion: reduce\) \{ \.ml-cover \{ display: none/);
    assert.match(x.note, /box-first/);
  });
}

test("a given param lands in the JS (durationMs 1234 on every cover that has it)", () => {
  for (const id of Object.keys(COVERS)) {
    if (id === "none" || id === "field") continue;
    const js = exportCode(withCover(id, { durationMs: 1234 })).js;
    assert.match(js, /durationMs: 1234\b/, id);
  }
  const field = exportCode(withCover("field", { veilMs: 1234, angle: 90, lift: "up" })).js;
  assert.match(field, /veilMs: 1234/);
  assert.match(field, /angle: 90/);
  assert.match(field, /lift: "up"/);
  const wipe = exportCode(withCover("wipe", { direction: "btt", edge: "slant", text: "Hello" })).js;
  assert.match(wipe, /direction: "btt"/);
  assert.match(wipe, /edge: "slant"/);
  assert.match(wipe, /text: "Hello"/);
});

test("params are checked: unknown options fall back, numbers are clamped, text cannot break out of the script", () => {
  const wipe = exportCode(withCover("wipe", { direction: "diagonal", durationMs: 1e9, text: "</script><script>alert(1)</script>" })).js;
  assert.match(wipe, /direction: "ltr"/);
  assert.doesNotMatch(wipe, /durationMs: 1000000000/);
  assert.doesNotMatch(wipe, /<\/script>/i);
  assert.doesNotThrow(() => new Function(wipe));
  const x = exportCode({ ...withCover("dissolve"), preset: "evil */ body { color: red } /*" });
  const first = x.css.split("\n")[0];
  assert.ok(first.endsWith("*/") && first.indexOf("*/") === first.length - 2, "the preset cannot close the header comment early");
});

test("global.speed divides every duration: the JS embeds SPEED and divides by it", () => {
  const two = exportCode(withCover("slabs.quad-stagger", { durationMs: 600 }, { global: { ...MOTION.global, speed: 2 } }));
  assert.match(two.js, /const SPEED = 2;/);
  assert.match(two.js, /duration: ms \/ SPEED, delay: delay \/ SPEED/);
  assert.match(two.css, /--ml-cover-ms: 300ms/, "600 ms at speed 2 → 300 ms");
  const one = exportCode(withCover("slabs.quad-stagger", { durationMs: 600 }, { global: { ...MOTION.global, speed: 1 } }));
  assert.match(one.css, /--ml-cover-ms: 600ms/);
  assert.match(exportCode(withCover("wipe", {}, { global: { speed: -3 } })).js, /const SPEED = 1;/, "a bad speed reads as 1");
});

test("reveal: dissolve fades the export target, cut and box-first export as a cut", () => {
  const dis = exportCode({ ...withCover("wipe"), transition: { ...MOTION.transition, cover: { style: "wipe", params: {} }, reveal: { style: "dissolve", params: { durationMs: 500 } } }, exportTarget: "#app" });
  assert.match(dis.js, /const REVEAL = "dissolve"/);
  assert.match(dis.js, /const REVEAL_MS = 500;/);
  assert.match(dis.js, /const TARGET = "#app"/);
  const box = exportCode(MOTION);
  assert.match(box.js, /const REVEAL = "cut"/);
  assert.match(box.js, /const TARGET = "main"/);
  assert.match(box.note, /box-first reveal/);
});

test("unknown cover ids export as none and say so", () => {
  const x = exportCode(withCover("slabs.nope"));
  assert.match(x.js, /const COVER = "none"/);
  assert.match(x.note, /slabs\.nope/);
});

test("tints, when the config has them, become --ml-tint-1/2 (and only valid colours)", () => {
  const ok = exportCode({ ...withCover("field"), tint: ["#2a1245", "#7a35c9"] });
  assert.match(ok.css, /--ml-tint-1: #2a1245;/);
  assert.match(ok.css, /--ml-tint-2: #7a35c9;/);
  const bad = exportCode({ ...withCover("field"), tint: ["red; } body { display:none", "#fff"] });
  assert.doesNotMatch(bad.css, /--ml-tint-1:/);
  assert.match(bad.js, /var\(--ml-tint-1, /);
});
