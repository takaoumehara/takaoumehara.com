// The click / hover feel (src/scripts/motion-interactions.mjs): its defaults,
// the Motion Lab fields, the --ix-* variables it writes on <html>, and that
// transitions.css reads them with the same defaults (so the site looks and
// feels exactly as before until the lab changes something).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../src/lib/load.mjs";
import { INTERACTION_DEFAULTS, INTERACTION_FIELDS, applyInteractions } from "../src/scripts/motion-interactions.mjs";

const CSS = readFileSync(join(ROOT, "src", "styles", "transitions.css"), "utf8");
const MOTION = JSON.parse(readFileSync(join(ROOT, "src", "data", "motion.json"), "utf8"));
const at = (o, path) => path.reduce((x, k) => (x == null ? x : x[k]), o);

// A stand-in <html> that records what is written on its style.
function withFakeDocument(fn) {
  const props = new Map();
  globalThis.document = { documentElement: { style: {
    setProperty(name, value) { props.set(name, String(value)); },
    removeProperty(name) { props.delete(name); },
  } } };
  try { fn(props); } finally { delete globalThis.document; }
}

test("defaults: press / hover / rail with the current feel", () => {
  assert.deepEqual(INTERACTION_DEFAULTS, {
    press: { enabled: true, scale: 0.985, downMs: 90, springMs: 380 },
    hover: { enabled: true, leanPx: 5, magnetPx: 4 },
    rail: { nudgePx: 3, nudgeMs: 60 },
  });
});

test("every lab field is an absolute interactions.* path into the defaults, typed like its value", () => {
  assert.ok(INTERACTION_FIELDS.length >= 9);
  for (const f of INTERACTION_FIELDS) {
    const [head, ...rest] = f.key.split(".");
    assert.equal(head, "interactions", f.key);
    const v = at(INTERACTION_DEFAULTS, rest);
    assert.notEqual(v, undefined, `${f.key} resolves`);
    assert.equal(typeof f.label, "string");
    if (f.type === "toggle") assert.equal(typeof v, "boolean", f.key);
    else {
      assert.equal(f.type, "range", f.key);
      assert.equal(typeof v, "number", f.key);
      assert.ok(f.min <= v && v <= f.max, `${f.key} default in range`);
      assert.ok(f.step > 0);
    }
  }
  const covered = new Set(INTERACTION_FIELDS.map((f) => f.key));
  const leaves = (o, pre) => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? leaves(v, `${pre}.${k}`) : [`${pre}.${k}`]));
  for (const key of leaves(INTERACTION_DEFAULTS, "interactions")) assert.ok(covered.has(key), `${key} has a control`);
});

test("applyInteractions: a no-op in Node", () => {
  assert.equal(typeof document, "undefined");
  assert.doesNotThrow(() => applyInteractions(INTERACTION_DEFAULTS));
  assert.doesNotThrow(() => applyInteractions(undefined));
});

test("applyInteractions writes the --ix-* variables; disabled → 0 multipliers; clamps; idempotent", () => {
  withFakeDocument((props) => {
    applyInteractions(INTERACTION_DEFAULTS);
    assert.equal(props.get("--ix-press-scale"), "0.985");
    assert.equal(props.get("--ix-press"), "1");
    assert.equal(props.get("--ix-hover"), "1");
    assert.equal(props.get("--ix-press-ms"), "90ms");
    assert.equal(props.get("--ix-lean-px"), "5px");
    const once = new Map(props);
    applyInteractions(INTERACTION_DEFAULTS);
    assert.deepEqual(props, once, "idempotent");

    const next = structuredClone(INTERACTION_DEFAULTS);
    next.press.scale = 0.9;
    next.hover.enabled = false;
    applyInteractions(next);
    assert.equal(props.get("--ix-press-scale"), "0.9");
    assert.equal(props.get("--ix-hover"), "0");
    assert.equal(props.get("--ix-press"), "1");

    next.press.enabled = false;
    next.press.scale = 0.2;       // below the lab's range
    next.rail.nudgePx = 99;       // above it
    applyInteractions(next);
    assert.equal(props.get("--ix-press"), "0");
    assert.equal(props.get("--ix-press-scale"), "0.9");
    assert.equal(props.get("--ix-nudge-px"), "16px");

    applyInteractions({});        // nothing given: the stylesheet's defaults apply
    assert.equal(props.size, 0);
  });
});

test("transitions.css reads the variables instead of the old literals", () => {
  assert.match(CSS, /var\(--ix-press-scale\)/);
  assert.doesNotMatch(CSS, /scale\(0\.985\)/);
  for (const v of ["--ix-press", "--ix-press-ms", "--ix-spring-ms", "--ix-hover", "--ix-lean-px", "--ix-magnet-px", "--ix-nudge-px", "--ix-nudge-ms"]) {
    assert.match(CSS, new RegExp(`var\\(${v}\\)`), v);
  }
  assert.doesNotMatch(CSS, /translateX\(4px\)|translateX\(3px\)/);
});

test("transitions.css :root defaults equal INTERACTION_DEFAULTS", () => {
  const root = CSS.match(/:root\s*\{([^}]*)\}/)[1];
  const val = (name) => {
    const m = root.match(new RegExp(`${name}:\\s*([^;]+);`));
    assert.ok(m, `${name} is on :root`);
    return m[1].trim();
  };
  const D = INTERACTION_DEFAULTS;
  assert.equal(val("--ix-press"), D.press.enabled ? "1" : "0");
  assert.equal(val("--ix-press-scale"), String(D.press.scale));
  assert.equal(val("--ix-press-ms"), `${D.press.downMs}ms`);
  assert.equal(val("--ix-spring-ms"), `${D.press.springMs}ms`);
  assert.equal(val("--ix-hover"), D.hover.enabled ? "1" : "0");
  assert.equal(val("--ix-lean-px"), `${D.hover.leanPx}px`);
  assert.equal(val("--ix-magnet-px"), `${D.hover.magnetPx}px`);
  assert.equal(val("--ix-nudge-px"), `${D.rail.nudgePx}px`);
  assert.equal(val("--ix-nudge-ms"), `${D.rail.nudgeMs}ms`);
});

test("motion.json's interactions block is exactly the defaults", () => {
  assert.deepEqual(MOTION.interactions, INTERACTION_DEFAULTS);
});
