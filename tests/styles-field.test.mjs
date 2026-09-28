// The H1 gradient field styles (src/scripts/styles/field.mjs) and the project
// colours they read (src/data/tints.json). Node only: the module must import
// without a DOM, and every function must resolve at once under ctx.still.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../src/lib/load.mjs";
import field from "../src/scripts/styles/field.mjs";
import { find, resolveParams } from "../src/scripts/styles/index.mjs";

const SRC = readFileSync(join(ROOT, "src", "scripts", "styles", "field.mjs"), "utf8");
const TINTS = JSON.parse(readFileSync(join(ROOT, "src", "data", "tints.json"), "utf8"));
const byId = (id) => field.find((s) => s.id === id);

// Every file name (without extension) under a directory, recursively.
const names = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? names(join(dir, e.name)) : [e.name.replace(/\.[^.]+$/, "")]);

const EXPECT = {
  field: { kind: "cover", fns: ["in", "out"], params: { angle: 152, veilMs: 420, liftMs: 440, lift: "fade" } },
  "field-lift": { kind: "reveal", fns: ["play"], params: { angle: 152, durationMs: 440, startOpacity: 0.9 } },
};

test("field.mjs exports exactly the two H1 styles", () => {
  assert.ok(Array.isArray(field));
  assert.deepEqual(field.map((s) => s.id).sort(), Object.keys(EXPECT).sort());
  for (const [id, e] of Object.entries(EXPECT)) {
    const s = byId(id);
    assert.equal(s.kind, e.kind, id);
    assert.equal(s.source, "H1", id);
    assert.equal(s.labOnly, false, id);
    assert.equal(typeof s.label, "string", id);
    for (const fn of e.fns) assert.equal(typeof s[fn], "function", `${id}.${fn}`);
    assert.equal(find(e.kind, id), s, `${id} is in the registry`);
  }
  assert.equal(byId("field").label, "Gradient field");
  assert.equal(byId("field-lift").label, "Field lift (colour → page)");
});

test("params: the stated keys and defaults, each with a label", () => {
  for (const [id, e] of Object.entries(EXPECT)) {
    const P = byId(id).params;
    assert.deepEqual(Object.keys(P).sort(), Object.keys(e.params).sort(), id);
    for (const [k, v] of Object.entries(e.params)) {
      assert.equal(P[k].default, v, `${id}.${k}`);
      assert.equal(typeof P[k].label, "string", `${id}.${k} label`);
    }
  }
  const f = byId("field").params, l = byId("field-lift").params;
  assert.deepEqual([f.angle.min, f.angle.max, f.angle.step, f.angle.unit], [0, 360, 1, "deg"]);
  assert.deepEqual([f.veilMs.min, f.veilMs.max], [100, 1500]);
  assert.deepEqual(f.lift.options, ["fade", "up"]);
  assert.deepEqual([l.startOpacity.min, l.startOpacity.max, l.startOpacity.step], [0, 1, 0.05]);
  assert.equal(resolveParams("cover", "field", { veilMs: 9999, lift: "sideways" }).veilMs, 1500);
  assert.equal(resolveParams("cover", "field", { lift: "sideways" }).lift, "fade");
});

test("tints.json: 12 project colour pairs, #rrggbb", () => {
  const entries = Object.entries(TINTS);
  assert.equal(entries.length, 12);
  for (const [slug, pair] of entries) {
    assert.ok(Array.isArray(pair) && pair.length === 2, slug);
    for (const c of pair) assert.match(c, /^#[0-9a-f]{6}$/i, slug);
  }
  assert.deepEqual(TINTS["verizon-ai-agents"], ["#101731", "#2c3f7a"]);
});

// The engine looks a tint up by the URL's last segment, so each key must be
// a slug the site has: a data file (src/data/**/<slug>.json), a case study
// (src/case-studies/<slug>.html → /projects/<slug>.html) or a top-level page
// (src/pages/<slug>.astro). verizon-ai-agents and ai-products have no
// src/data file of that name, only the latter two.
test("every tints.json key is a slug the site has", () => {
  const known = new Set([
    ...names(join(ROOT, "src", "data")),
    ...readdirSync(join(ROOT, "src", "case-studies")).filter((f) => f.endsWith(".html")).map((f) => f.slice(0, -5)),
    ...readdirSync(join(ROOT, "src", "pages")).filter((f) => f.endsWith(".astro")).map((f) => f.slice(0, -6)),
  ]);
  for (const slug of Object.keys(TINTS)) assert.ok(known.has(slug), slug);
  const data = new Set(names(join(ROOT, "src", "data")));
  for (const slug of ["tmobile", "kitadoko", "ela-quests", "coca-cola", "marubatsu", "rakugaki-jam", "snap-pair", "kao-game", "resona", "typespace"]) {
    assert.ok(data.has(slug), `${slug} under src/data`);
  }
});

test("source rules: WAAPI via ctx.own, no keyframes / GSAP / blur / raw hex", () => {
  for (const bad of ["gsap", "@keyframes", "blur("]) assert.equal(SRC.toLowerCase().includes(bad), false, bad);
  assert.doesNotMatch(SRC, /#[0-9a-f]{3,8}\b/i, "no hex colour literal");
  for (const need of ["ctx.own(", "ctx.still", "ctx.drop(", "ctx.tint"]) assert.ok(SRC.includes(need), need);
});

// A ctx that records what the styles do to a fake layer.
function fakeCtx({ still = false, tint = null } = {}) {
  const log = { layers: new Set(), dropped: [], anims: [] };
  const el = { style: {}, animate(frames, opts) { const a = { frames, opts, finished: Promise.resolve() }; log.anims.push(a); return a; } };
  return {
    log, el,
    ctx: {
      layer(name) { log.layers.add(name); return el; },
      drop(name) { log.dropped.push(name); },
      k: 1, ease: (n) => n, own: (a) => { a.owned = true; return a; },
      still, dir: 0, stage: null, rail: null,
      tokens: { ink: "var(--pr-ink)", paper: "var(--pr-canvas)", card: "var(--pr-card)", line: "var(--pr-line-2)" },
      tint, sound: { play() {} }, capMs: 300,
    },
  };
}
const P = (id) => resolveParams(byId(id).kind, id, {});

test("ctx.still: in / out / play resolve at once and draw nothing", async () => {
  const { ctx, log } = fakeCtx({ still: true });
  await byId("field").in(ctx, P("field"));
  await byId("field").out(ctx, P("field"));
  await byId("field-lift").play(ctx, P("field-lift"));
  assert.equal(log.anims.length, 0);
  assert.equal(log.layers.size, 0);
});

test("the field is the destination's tint, owned, capped, and dropped after", async () => {
  const { ctx, el, log } = fakeCtx({ tint: ["#101731", "#2c3f7a"] });
  await byId("field").in(ctx, P("field"));
  assert.match(el.style.background, /radial-gradient.*radial-gradient.*linear-gradient\(152deg, #101731 0%, #2c3f7a 100%\)/);
  assert.match(el.style.background, /color-mix\(in oklab, #101731 74%, white\)/);
  assert.deepEqual(log.anims[0].frames, [{ opacity: 0 }, { opacity: 1 }]);
  assert.equal(log.anims[0].opts.duration, 300, "420 ms capped at capMs");
  await byId("field").out(ctx, { ...P("field"), lift: "up" });
  assert.equal(log.anims[1].frames[1].transform, "translate3d(0, -100%, 0)");
  assert.ok(log.anims.every((a) => a.owned));
  assert.deepEqual(log.dropped, ["field"]);

  const none = fakeCtx();
  await byId("field-lift").play(none.ctx, P("field-lift"));
  assert.match(none.el.style.background, /linear-gradient\(152deg, var\(--pr-ink\) 0%, var\(--pr-canvas\) 100%\)/);
  assert.deepEqual(none.log.anims[0].frames, [{ opacity: 0.9 }, { opacity: 0 }]);
  assert.deepEqual(none.log.dropped, ["field"]);
});
