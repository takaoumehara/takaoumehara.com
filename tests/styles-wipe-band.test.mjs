// The H2 graphic wipe (src/scripts/styles/wipe.mjs) and the B5 band sweep /
// B4 dissolve (src/scripts/styles/band.mjs): their registry entries, params,
// the contract's source rules (docs/motion-lab/engine-contract.md §2) and
// that every function resolves at once under reduced motion. Node only; the
// browser run is in the journal (docs/motion-lab/journal/2026-09-28-wipe-band.md).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../src/lib/load.mjs";
import wipe from "../src/scripts/styles/wipe.mjs";
import band from "../src/scripts/styles/band.mjs";
import { find, resolveParams, defaultParams, byKind } from "../src/scripts/styles/index.mjs";

const src = (name) => readFileSync(join(ROOT, "src", "scripts", "styles", name), "utf8");
const FILES = ["wipe.mjs", "band.mjs"];

test("wipe.mjs exports one cover, wipe, with the H2 params", () => {
  assert.equal(wipe.length, 1);
  const [s] = wipe;
  assert.equal(s.kind, "cover");
  assert.equal(s.id, "wipe");
  assert.equal(s.source, "H2");
  assert.equal(s.label, "Graphic wipe (ink shutter)");
  assert.equal(s.labOnly, false);
  assert.deepEqual(s.params.direction.options, ["ltr", "rtl", "ttb", "btt"]);
  assert.equal(s.params.direction.default, "ltr");
  assert.deepEqual(s.params.edge.options, ["straight", "slant"]);
  assert.equal(s.params.edge.default, "straight");
  assert.equal(s.params.durationMs.default, 700);
  assert.equal(s.params.durationMs.min, 100);
  assert.equal(s.params.durationMs.max, 2000);
  assert.equal(s.params.text.default, "");
  assert.equal(typeof s.in, "function");
  assert.equal(typeof s.out, "function");
});

test("band.mjs exports cover band-sweep, cover dissolve and reveal dissolve", () => {
  const ids = band.map((s) => `${s.kind}:${s.id}`);
  assert.deepEqual(ids, ["cover:band-sweep", "cover:dissolve", "reveal:dissolve"]);
  const [sweep, cover, reveal] = band;
  assert.equal(sweep.source, "B5");
  assert.equal(sweep.label, "Gradient band sweep");
  assert.deepEqual([sweep.params.bandPct.default, sweep.params.bandPct.min, sweep.params.bandPct.max], [18, 5, 60]);
  assert.deepEqual([sweep.params.angle.default, sweep.params.angle.min, sweep.params.angle.max], [12, -45, 45]);
  assert.equal(sweep.params.durationMs.default, 900);
  assert.equal(cover.source, "B4");
  assert.equal(cover.label, "Dissolve (ink fade)");
  assert.deepEqual([cover.params.durationMs.default, cover.params.durationMs.min, cover.params.durationMs.max], [400, 100, 1500]);
  assert.equal(reveal.source, "B4");
  assert.equal(reveal.label, "Dissolve in");
  assert.equal(reveal.params.durationMs.default, 320);
  for (const s of [sweep, cover]) { assert.equal(typeof s.in, "function"); assert.equal(typeof s.out, "function"); }
  assert.equal(typeof reveal.play, "function");
});

test("every param spec has a label", () => {
  for (const s of [...wipe, ...band]) for (const [k, spec] of Object.entries(s.params)) assert.ok(typeof spec.label === "string" && spec.label, `${s.id}.${k}`);
});

test("the registry finds each style and resolves its params", () => {
  assert.equal(find("cover", "wipe").source, "H2");
  assert.equal(find("cover", "band-sweep").source, "B5");
  assert.equal(find("cover", "dissolve").label, "Dissolve (ink fade)");
  assert.equal(find("reveal", "dissolve").label, "Dissolve in");
  assert.ok(byKind("cover").some((s) => s.id === "wipe"));
  assert.ok(byKind("reveal").some((s) => s.id === "dissolve"));
  assert.deepEqual(defaultParams("cover", "wipe"), { direction: "ltr", durationMs: 700, edge: "straight", text: "" });
  assert.equal(resolveParams("cover", "band-sweep", { bandPct: 999 }).bandPct, 60);
  assert.equal(resolveParams("cover", "wipe", { direction: "diagonal" }).direction, "ltr");
  assert.equal(resolveParams("cover", "wipe", { direction: "btt", text: "creativity is everywhere" }).text, "creativity is everywhere");
});

test("source rules: no GSAP, keyframes, blur or hex colours; own / still / drop used", () => {
  for (const f of FILES) {
    const s = src(f);
    assert.equal(/gsap/i.test(s), false, `${f}: gsap`);
    assert.equal(s.includes("@keyframes"), false, `${f}: @keyframes`);
    assert.equal(s.includes("blur("), false, `${f}: blur(`);
    assert.equal(/#[0-9a-fA-F]{3,8}\b/.test(s), false, `${f}: hex colour`);
    for (const need of ["ctx.own(", "ctx.still", "ctx.drop("]) assert.ok(s.includes(need), `${f}: ${need}`);
  }
});

test("under reduced motion every function resolves at once (no DOM needed)", async () => {
  const ctx = { still: true };
  for (const s of [...wipe, ...band]) {
    const p = defaultParams(s.kind, s.id);
    for (const fn of ["in", "out", "play"]) {
      if (typeof s[fn] !== "function") continue;
      const r = s[fn](ctx, p);
      assert.ok(r instanceof Promise, `${s.kind}:${s.id}.${fn} returns a promise`);
      await r;
    }
  }
});
