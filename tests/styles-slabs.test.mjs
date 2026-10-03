// The H3b slab curtains (src/scripts/styles/slabs.mjs): shape per
// docs/motion-lab/engine-contract.md §2, the registry's view of them, the
// motion rules read off the source, and the reduced-motion path. No browser:
// the module must import in Node and touch the DOM only inside in()/out().
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../src/lib/load.mjs";
import slabs from "../src/scripts/styles/slabs.mjs";
import { find, resolveParams, byKind } from "../src/scripts/styles/index.mjs";

const IDS = ["slabs.quad-stagger", "slabs.quad-center", "slabs.split-sharp", "slabs.split-round", "slabs.dynamic"];
const SRC = readFileSync(join(ROOT, "src", "scripts", "styles", "slabs.mjs"), "utf8");

test("slabs.mjs default-exports the five H3b covers", () => {
  assert.ok(Array.isArray(slabs));
  assert.deepEqual(slabs.map((s) => s.id), IDS);
  for (const s of slabs) {
    assert.equal(s.kind, "cover", s.id);
    assert.equal(typeof s.label, "string", s.id);
    assert.ok(s.label.length > 0, s.id);
    assert.match(s.source, /^H3b/, s.id);
    assert.equal(s.labOnly, false, s.id);
    assert.equal(typeof s.in, "function", s.id);
    assert.equal(typeof s.out, "function", s.id);
  }
});

test("each cover has the required params and defaults", () => {
  for (const s of slabs) {
    const P = s.params;
    assert.deepEqual(
      { d: P.durationMs.default, min: P.durationMs.min, max: P.durationMs.max, step: P.durationMs.step, unit: P.durationMs.unit },
      { d: 620, min: 100, max: 2000, step: 10, unit: "ms" }, s.id);
    assert.deepEqual([P.staggerMs.default, P.staggerMs.min, P.staggerMs.max], [60, 0, 300], s.id);
    assert.equal(P.snap.default, true, s.id);
    if (s.id === "slabs.split-sharp") assert.ok(!P.radiusPx || P.radiusPx.default === 0, s.id);
    else assert.deepEqual([P.radiusPx.default, P.radiusPx.min, P.radiusPx.max], [22, 0, 48], s.id);
  }
  const grid = slabs.find((s) => s.id === "slabs.dynamic").params.grid;
  assert.deepEqual([grid.default, grid.min, grid.max, grid.step], [3, 2, 5, 1]);
});

test("the registry finds each id and clamps its params", () => {
  const covers = byKind("cover").map((s) => s.id);
  for (const id of IDS) {
    assert.equal(find("cover", id).id, id);
    assert.ok(covers.includes(id), id);
    const p = resolveParams("cover", id, { durationMs: 99999, staggerMs: -5 });
    assert.equal(p.durationMs, 2000, id);
    assert.equal(p.staggerMs, 0, id);
    assert.equal(p.snap, true, id);
  }
  assert.equal(resolveParams("cover", "slabs.dynamic", { grid: 9 }).grid, 5);
});

test("the source keeps the motion rules", () => {
  assert.doesNotMatch(SRC, /gsap/i);
  assert.doesNotMatch(SRC, /@keyframes/);
  assert.doesNotMatch(SRC, /blur\(/);
  assert.doesNotMatch(SRC, /#0b0b0b|#f2f1ea/i);
  assert.doesNotMatch(SRC, /#[0-9a-fA-F]{3,6}\b/);
  for (const needle of ["ctx.own(", "ctx.still", "ctx.drop("]) assert.ok(SRC.includes(needle), needle);
});

test("with ctx.still, in() and out() resolve at once without a DOM", async () => {
  assert.equal(typeof globalThis.document, "undefined");
  const touched = [];
  const ctx = {
    still: true, k: 1, capMs: 1000, dir: 0, tint: null,
    tokens: { ink: "var(--pr-ink)", paper: "var(--pr-canvas)", card: "var(--pr-card)", line: "var(--pr-line-2)" },
    layer: (n) => { touched.push(`layer:${n}`); throw new Error("layer() under still"); },
    drop: () => {},
    ease: (n) => n,
    own: (a) => { touched.push("own"); return a; },
    sound: { play: (n) => touched.push(`sound:${n}`) },
  };
  for (const s of slabs) {
    const p = resolveParams("cover", s.id, {});
    const t0 = Date.now();
    await s.in(ctx, p);
    await s.out(ctx, p);
    assert.ok(Date.now() - t0 < 50, s.id);
  }
  assert.deepEqual(touched, []);
});
