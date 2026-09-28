// The Motion Lab's style registry (docs/motion-lab/engine-contract.md §2, §4).
// Every cover / reveal / boot / idle the engine (src/scripts/motion.js) can
// play, and the panel (src/scripts/motion-lab.js) can offer. Each module in
// this folder default-exports an array of styles; the core ones live here.
//
// Pure: no DOM at import time, so the registry can be tested in Node.
import slabs from "./slabs.mjs";
import field from "./field.mjs";
import wipe from "./wipe.mjs";
import band from "./band.mjs";
import bootSlabs from "./boot-slabs.mjs";
import idle from "./idle.mjs";

const done = () => Promise.resolve();

// The core: the v1 behaviour, as styles. box-first and odometer are played by
// motion.js itself (run() — the existing pane/text/media engine and the rail
// intro); their play() is never called and only resolves.
const core = [
  { kind: "cover", id: "none", label: "None (no cover)", source: "new", labOnly: false, params: {}, in: done, out: done },
  { kind: "reveal", id: "box-first", label: "Box-first (outline → fill → text)", source: "A2", labOnly: false, params: {}, play: done },
  { kind: "reveal", id: "cut", label: "Cut (instant)", source: "new", labOnly: false, params: {}, play: done },
  { kind: "boot", id: "odometer", label: "Odometer (rail intro)", source: "A1", labOnly: false, params: {}, play: done },
  { kind: "idle", id: "none", label: "None", source: "new", labOnly: false, params: {}, start: () => () => {} },
];

export const STYLES = [...core, ...slabs, ...field, ...wipe, ...band, ...bootSlabs, ...idle];

/** The id each kind falls back to when the JSON names a style that does not exist. */
export const DEFAULT_IDS = { cover: "none", reveal: "box-first", boot: "odometer", idle: "none" };

export const byKind = (kind) => STYLES.filter((s) => s.kind === kind);

export const find = (kind, id) =>
  STYLES.find((s) => s.kind === kind && s.id === id) ?? STYLES.find((s) => s.kind === kind && s.id === DEFAULT_IDS[kind]);

export const defaultParams = (kind, id) => {
  const out = {};
  for (const [key, spec] of Object.entries(find(kind, id)?.params ?? {})) out[key] = spec.default;
  return out;
};

/** The style's defaults with the JSON's params over them: numbers clamped to min/max, options and types checked, unknown keys dropped. */
export const resolveParams = (kind, id, params) => {
  const given = params && typeof params === "object" ? params : {};
  const out = {};
  for (const [key, spec] of Object.entries(find(kind, id)?.params ?? {})) {
    const v = given[key];
    let x = spec.default;
    if (Array.isArray(spec.options)) { if (spec.options.includes(v)) x = v; }
    else if (typeof spec.default === "boolean") { if (typeof v === "boolean") x = v; }
    else if (typeof spec.default === "number") {
      const n = v === undefined || v === null || v === "" ? NaN : Number(v);
      if (Number.isFinite(n)) x = n;
      if (Number.isFinite(spec.min)) x = Math.max(spec.min, x);
      if (Number.isFinite(spec.max)) x = Math.min(spec.max, x);
    } else if (typeof v === typeof spec.default) x = v;
    out[key] = x;
  }
  return out;
};
