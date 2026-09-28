// The slab boot (H3a), the breathing idle (H3c) and the synthesized sounds
// (H3d) of the Motion Lab engine (docs/motion-lab/engine-contract.md §2, §5):
// their registry entries and params, the style rules in their source, and
// that each is safe to import and call in Node (no DOM, no AudioContext).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../src/lib/load.mjs";
import bootSlabs from "../src/scripts/styles/boot-slabs.mjs";
import idle from "../src/scripts/styles/idle.mjs";
import { makeSound } from "../src/scripts/styles/sound.mjs";
import { find, byKind, defaultParams, resolveParams } from "../src/scripts/styles/index.mjs";

const src = (name) => readFileSync(join(ROOT, "src", "scripts", "styles", name), "utf8");

test("boot-slabs exports one boot style, slabs-puzzle, with its params", () => {
  assert.equal(bootSlabs.length, 1);
  const s = bootSlabs[0];
  assert.equal(s.kind, "boot");
  assert.equal(s.id, "slabs-puzzle");
  assert.equal(s.source, "H3a");
  assert.equal(s.label, "Slab puzzle (boot)");
  assert.equal(s.labOnly, false);
  assert.equal(typeof s.play, "function");
  assert.deepEqual(defaultParams("boot", "slabs-puzzle"), {
    grid: 3, radiusPx: 22, rotateDeg: 12, stepMs: 25, durationMs: 620, holdMs: 240, leaveMs: 360,
  });
  const P = s.params;
  assert.deepEqual([P.grid.min, P.grid.max], [2, 4]);
  assert.deepEqual([P.stepMs.min, P.stepMs.max], [0, 120]);
  assert.deepEqual([P.durationMs.min, P.durationMs.max], [200, 2000]);
});

test("idle exports one idle style, breathing, with its params", () => {
  assert.equal(idle.length, 1);
  const s = idle[0];
  assert.equal(s.kind, "idle");
  assert.equal(s.id, "breathing");
  assert.equal(s.source, "H3c");
  assert.equal(s.label, "Breathing board");
  assert.equal(s.labOnly, false);
  assert.equal(typeof s.start, "function");
  assert.deepEqual(defaultParams("idle", "breathing"), {
    driftPx: 3, rotateDeg: 0.4, scale: 0.01, periodMs: 6000, parallax: true, parallaxPx: 4,
  });
  const P = s.params;
  assert.deepEqual([P.driftPx.min, P.driftPx.max], [0, 12]);
  assert.deepEqual([P.rotateDeg.min, P.rotateDeg.max, P.rotateDeg.step], [0, 3, 0.1]);
  assert.deepEqual([P.scale.min, P.scale.max, P.scale.step], [0, 0.05, 0.005]);
  assert.deepEqual([P.periodMs.min, P.periodMs.max], [2000, 20000]);
  assert.deepEqual([P.parallaxPx.min, P.parallaxPx.max], [0, 16]);
});

test("the registry finds both, and clamps their params", () => {
  assert.equal(find("boot", "slabs-puzzle"), bootSlabs[0]);
  assert.equal(find("idle", "breathing"), idle[0]);
  assert.ok(byKind("boot").some((s) => s.id === "slabs-puzzle"));
  assert.ok(byKind("idle").some((s) => s.id === "breathing"));
  assert.equal(resolveParams("boot", "slabs-puzzle", { grid: 9 }).grid, 4);
  assert.equal(resolveParams("boot", "slabs-puzzle", { grid: 1 }).grid, 2);
  assert.equal(resolveParams("idle", "breathing", { parallax: "no" }).parallax, true);
  assert.equal(resolveParams("idle", "breathing", { periodMs: 100 }).periodMs, 2000);
});

test("makeSound in Node: returns play / unlock, and neither throws", () => {
  for (const cfg of [{ enabled: true, volume: 0.25 }, { enabled: false }, undefined, null]) {
    const snd = makeSound(cfg);
    assert.equal(typeof snd.play, "function");
    assert.equal(typeof snd.unlock, "function");
    assert.doesNotThrow(() => { snd.play("snap"); snd.unlock(); snd.play("snap"); snd.play("swoosh"); snd.play("nope"); });
  }
  // Live getters, as motion.js passes them.
  const live = makeSound({ get enabled() { return true; }, get volume() { return 0.5; } });
  assert.doesNotThrow(() => { live.unlock(); live.play("swoosh"); });
});

test("sound.mjs uses Web Audio, only inside functions", () => {
  const s = src("sound.mjs");
  assert.match(s, /AudioContext/);
  assert.match(s, /export function makeSound\(soundCfg\)/);
  // Nothing at the top level creates a context: the only `new AC()` sits in an indented function body.
  const makers = s.split("\n").filter((line) => /new\s+(AC|AudioContext|webkitAudioContext|\(?\s*window)\b/.test(line));
  assert.ok(makers.length >= 1);
  for (const line of makers) assert.match(line, /^\s{2,}/, line);
});

test("boot-slabs.mjs and idle.mjs keep the style rules", () => {
  for (const name of ["boot-slabs.mjs", "idle.mjs"]) {
    const s = src(name);
    assert.doesNotMatch(s, /gsap/i, `${name}: no GSAP`);
    assert.doesNotMatch(s, /@keyframes/, `${name}: no CSS keyframes`);
    assert.doesNotMatch(s, /blur\(/, `${name}: no blur`);
    assert.doesNotMatch(s, /#[0-9a-fA-F]{3,8}\b/, `${name}: no hex colours`);
    assert.match(s, /ctx\.own\(/, `${name}: animations through ctx.own`);
    assert.match(s, /ctx\.still/, `${name}: reduced motion`);
    assert.doesNotMatch(s, /AudioContext/, `${name}: sound only through ctx.sound`);
  }
  assert.match(src("boot-slabs.mjs"), /ctx\.sound\.play\("snap"\)/);
  assert.match(src("boot-slabs.mjs"), /ctx\.drop\("boot"\)/);
});

test("still: boot resolves at once, idle returns a no-op stop", async () => {
  const stop = idle[0].start({ still: true }, defaultParams("idle", "breathing"));
  assert.equal(typeof stop, "function");
  assert.doesNotThrow(() => stop());
  const noStage = idle[0].start({ still: false, stage: null }, defaultParams("idle", "breathing"));
  assert.equal(typeof noStage, "function");
  assert.doesNotThrow(() => noStage());
  const r = bootSlabs[0].play({ still: true }, defaultParams("boot", "slabs-puzzle"));
  assert.ok(r instanceof Promise);
  assert.equal(await r, undefined);
});
