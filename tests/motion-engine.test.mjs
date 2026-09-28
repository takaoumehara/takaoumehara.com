// The Motion Lab engine, v2 (docs/motion-lab/engine-contract.md): the config
// upgrade (src/scripts/motion-config.mjs, what motion.js's resolveConfig()
// runs), the style registry (src/scripts/styles/index.mjs), the stubs the
// style workers fill in, and the panel's new groups. No browser: motion.js
// itself touches the DOM at import, so what it reads is tested through the
// pure modules it imports.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../src/lib/load.mjs";
import { upgradeConfig, merge, V2_BLOCKS, VERSION } from "../src/scripts/motion-config.mjs";
import { STYLES, byKind, find, defaultParams, resolveParams, DEFAULT_IDS } from "../src/scripts/styles/index.mjs";
import { INTERACTION_DEFAULTS, INTERACTION_FIELDS, applyInteractions } from "../src/scripts/motion-interactions.mjs";
import { exportCode } from "../src/scripts/motion-export.mjs";
import { makeSound } from "../src/scripts/styles/sound.mjs";

const readJson = (...p) => JSON.parse(readFileSync(join(ROOT, ...p), "utf8"));
const src = (...p) => readFileSync(join(ROOT, ...p), "utf8");
const MOTION = readJson("src", "data", "motion.json");
const V1 = readJson("docs", "motion-lab", "configs", "2026-09-28-default.json");
const resolve = (partial) => upgradeConfig(partial, MOTION, INTERACTION_DEFAULTS);
const V2_KEYS = ["transition", "boot", "idle", "sound", "interactions"];

// Every leaf of an object, as [path, value] (arrays are leaves).
const leaves = (o, pre = []) => Object.entries(o).flatMap(([k, v]) =>
  v && typeof v === "object" && !Array.isArray(v) ? leaves(v, [...pre, k]) : [[[...pre, k], v]]);
const at = (o, path) => path.reduce((x, k) => (x == null ? x : x[k]), o);

test("motion.json is v2, with the contract's defaults for the new blocks", () => {
  assert.equal(MOTION.version, 2);
  assert.equal(VERSION, 2);
  assert.deepEqual(MOTION.transition, {
    cover: { style: "none", params: {} },
    reveal: { style: "box-first", params: {} },
    holdMs: 300,
    revealDelayMs: 0,
  });
  assert.deepEqual(MOTION.boot, { style: "odometer", params: {} });
  assert.deepEqual(MOTION.idle, { style: "none", params: {} });
  assert.deepEqual(MOTION.sound, { enabled: false, volume: 0.25 });
  assert.deepEqual(MOTION.interactions, INTERACTION_DEFAULTS, "the file carries the feel defaults (motion-interactions.mjs)");
  for (const k of V2_KEYS) if (k !== "interactions") assert.deepEqual(MOTION[k], V2_BLOCKS[k], `${k} matches the upgrade's defaults`);
});

test("motion.json keeps every v1 group", () => {
  for (const k of ["preset", "global", "rail", "pane", "out", "text", "heading", "label", "body", "media"]) assert.ok(k in MOTION, k);
  assert.equal(MOTION.global.respectReducedMotion, true);
});

test("v1 → v2 only adds the default blocks: a v1 JSON reads exactly like the same JSON with the v2 defaults", () => {
  assert.equal(V1.version, 1);
  for (const k of V2_KEYS) assert.equal(k in V1, false, `the v1 file has no ${k}`);
  const fromV1 = resolve(V1);
  const asV2 = { ...structuredClone(V1), version: 2 };
  for (const k of V2_KEYS) asV2[k] = structuredClone(MOTION[k]);
  assert.deepEqual(fromV1, resolve(asV2));
  assert.equal(fromV1.version, 2);
  for (const k of V2_KEYS) assert.deepEqual(fromV1[k], MOTION[k]);
});

test("v1 → v2 keeps every v1 key and value", () => {
  const fromV1 = resolve(V1);
  // Keys of an older v1 schema that the engine already ignored before v2
  // (text.headings, text.labels …) stay ignored; every other one survives.
  const known = leaves(V1).filter(([path]) => path[0] !== "version" && at(MOTION, path) !== undefined);
  assert.ok(known.length > 80, `${known.length} v1 values checked`);
  for (const [path, v] of known) assert.deepEqual(at(fromV1, path), v, path.join("."));
  // The v1 part of the result is exactly what v1's resolveConfig gave:
  // the v1 defaults (motion.json without the v2 blocks) with the file merged over.
  const v1Defaults = structuredClone(MOTION);
  for (const k of V2_KEYS) delete v1Defaults[k];
  v1Defaults.version = 1;
  const before = merge(structuredClone(v1Defaults), V1);
  before.global.respectReducedMotion = true;
  const after = structuredClone(fromV1);
  for (const k of V2_KEYS) delete after[k];
  after.version = 1;
  assert.deepEqual(after, before);
  // The site's own config reads as itself.
  assert.deepEqual(resolve(MOTION), MOTION);
  // A v1 upgrade is also what the defaults alone give, where the v1 file is silent.
  assert.deepEqual(resolve(null), MOTION);
});

test("v1 defaults are upgraded too, and style params pass through as given", () => {
  const fromOldDefaults = upgradeConfig(null, V1);
  for (const k of V2_KEYS) assert.deepEqual(fromOldDefaults[k], V2_BLOCKS[k]);
  const c = resolve({ transition: { cover: { style: "slabs.quad-stagger", params: { staggerMs: 90 } }, holdMs: "450" }, sound: { enabled: 1 }, bogus: 1 });
  assert.equal(c.transition.cover.style, "slabs.quad-stagger");
  assert.deepEqual(c.transition.cover.params, { staggerMs: 90 });
  assert.equal(c.transition.holdMs, 450);
  assert.equal(c.sound.enabled, true);
  assert.equal("bogus" in c, false);
  const i = upgradeConfig({ interactions: { press: 2, nope: 1 } }, { ...MOTION, interactions: {} }, { press: 1, lift: 3 });
  assert.deepEqual(i.interactions, { press: 2, lift: 3 }, "interaction defaults sit under the JSON's");
});

test("registry: the core styles exist and unknown ids fall back to each kind's default", () => {
  for (const [kind, id] of [["cover", "none"], ["reveal", "box-first"], ["reveal", "cut"], ["boot", "odometer"], ["idle", "none"]]) {
    assert.equal(find(kind, id)?.id, id, `${kind} ${id}`);
    assert.ok(byKind(kind).some((s) => s.id === id));
  }
  assert.deepEqual(DEFAULT_IDS, { cover: "none", reveal: "box-first", boot: "odometer", idle: "none" });
  for (const [kind, id] of Object.entries(DEFAULT_IDS)) assert.equal(find(kind, "no-such-style").id, id);
  assert.equal(find("reveal", undefined).id, "box-first");
});

test("registry: every style has kind, id, label, source, params and its kind's functions", () => {
  const FNS = { cover: ["in", "out"], reveal: ["play"], boot: ["play"], idle: ["start"] };
  const seen = new Set();
  for (const s of STYLES) {
    assert.ok(s.kind in FNS, `${s.id}: kind ${s.kind}`);
    assert.equal(typeof s.id, "string");
    assert.ok(!seen.has(`${s.kind}:${s.id}`), `${s.kind}:${s.id} is unique in its kind`);
    seen.add(`${s.kind}:${s.id}`);
    assert.equal(typeof s.label, "string");
    assert.equal(typeof s.source, "string");
    assert.ok(s.params && typeof s.params === "object");
    for (const fn of FNS[s.kind]) assert.equal(typeof s[fn], "function", `${s.kind}:${s.id}.${fn}`);
  }
});

test("registry: params resolve to defaults, clamped to min/max, typed", () => {
  // A throwaway spec on a real entry of the registry, removed afterwards.
  const s = find("reveal", "cut");
  const saved = s.params;
  s.params = {
    staggerMs: { default: 60, min: 0, max: 300, step: 10, unit: "ms", label: "Stagger" },
    corner: { default: "round", options: ["round", "sharp"], label: "Corners" },
    snap: { default: true, label: "Snap sound" },
  };
  try {
    assert.deepEqual(defaultParams("reveal", "cut"), { staggerMs: 60, corner: "round", snap: true });
    assert.deepEqual(resolveParams("reveal", "cut", {}), { staggerMs: 60, corner: "round", snap: true });
    assert.deepEqual(resolveParams("reveal", "cut", null), { staggerMs: 60, corner: "round", snap: true });
    assert.deepEqual(resolveParams("reveal", "cut", { staggerMs: 999, corner: "sharp", snap: false, extra: 1 }), { staggerMs: 300, corner: "sharp", snap: false });
    assert.deepEqual(resolveParams("reveal", "cut", { staggerMs: -5, corner: "oval", snap: "yes" }), { staggerMs: 0, corner: "round", snap: true });
    assert.deepEqual(resolveParams("reveal", "cut", { staggerMs: "120" }).staggerMs, 120);
    assert.deepEqual(resolveParams("reveal", "cut", { staggerMs: "x" }).staggerMs, 60);
  } finally {
    s.params = saved;
  }
  assert.deepEqual(resolveParams("cover", "none", { a: 1 }), {});
});

test("the stubs export the contract's names", async () => {
  for (const name of ["slabs", "field", "wipe", "band", "boot-slabs", "idle"]) {
    const mod = await import(`../src/scripts/styles/${name}.mjs`);
    assert.ok(Array.isArray(mod.default), `${name}.mjs default-exports an array`);
  }
  const snd = makeSound({ enabled: false, volume: 0.25 });
  assert.equal(typeof snd.play, "function");
  assert.equal(typeof snd.unlock, "function");
  assert.equal(typeof INTERACTION_DEFAULTS, "object");
  assert.ok(Array.isArray(INTERACTION_FIELDS));
  assert.equal(typeof applyInteractions, "function");
  const x = exportCode(MOTION);
  assert.equal(typeof x.css, "string");
  assert.equal(typeof x.js, "string");
  assert.equal(typeof x.note, "string");
  assert.match(src("src", "scripts", "motion-pick.js"), /export function mountPick\(root, api\)/);
  assert.equal(typeof readJson("src", "data", "tints.json"), "object");
});

test("motion.js reads configs through the upgrade and plays the registry's styles", () => {
  const js = src("src", "scripts", "motion.js");
  assert.match(js, /from "\.\/motion-config\.mjs"/);
  assert.match(js, /upgradeConfig\(partial, DEFAULTS, INTERACTION_DEFAULTS\)/);
  assert.match(js, /from "\.\/styles\/index\.mjs"/);
  assert.match(js, /applyInteractions\(/);
  assert.match(js, /makeSound\(/);
  assert.match(js, /document\.documentElement|html\.append\(el\)/, "overlays hang off <html>");
});

test("the lab panel has the Transition group, fed by the registry", () => {
  const lab = src("src", "scripts", "motion-lab.js");
  assert.match(lab, /from "\.\/styles\/index\.mjs"/);
  assert.match(lab, /\{ id: "transition", label: "Transition"/);
  for (const g of ["boot", "idle", "sound"]) assert.match(lab, new RegExp(`\\{ id: "${g}", label: "`), g);
  assert.match(lab, /INTERACTION_FIELDS/);
  assert.match(lab, /" \(Lab only\)"/);
  assert.match(lab, /"Export code"/);
  assert.match(lab, /exportCode\(motion\.getConfig\(\)\)/);
});
