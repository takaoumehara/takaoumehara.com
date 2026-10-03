// Reading a motion config (docs/motion-lab/engine-contract.md §1): the
// defaults with a partial config merged over them, a v1 config upgraded to v2
// on the way. Pure (no DOM), so it is tested in Node; motion.js's
// resolveConfig() is this with src/data/motion.json as the defaults.

export const VERSION = 2;

// What v2 adds to v1. A v1 JSON (no such blocks) reads as these, which play
// exactly as v1 did: no cover, the box-first reveal, the odometer boot, no
// idle, no sound.
export const V2_BLOCKS = {
  transition: {
    cover: { style: "none", params: {} },
    reveal: { style: "box-first", params: {} },
    holdMs: 300,
    revealDelayMs: 0,
  },
  boot: { style: "odometer", params: {} },
  idle: { style: "none", params: {} },
  sound: { enabled: false, volume: 0.25 },
  interactions: {},
};

const clone = (o) => JSON.parse(JSON.stringify(o));
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

// Adds what `src` has and `dst` lacks, at every depth; never overwrites.
function fillIn(dst, src) {
  for (const [k, v] of Object.entries(src)) {
    if (!(k in dst)) dst[k] = clone(v);
    else if (isObj(dst[k]) && isObj(v)) fillIn(dst[k], v);
  }
  return dst;
}

// The partial over the base: only keys the base has, each coerced to the
// base's type. A style's "params" is free-form (its keys depend on the style;
// styles/index.mjs resolveParams() checks them when the style plays).
export function merge(base, over) {
  if (!isObj(over)) return base;
  for (const [k, v] of Object.entries(over)) {
    if (!(k in base)) continue; // unknown keys are ignored
    if (k === "params" && isObj(base[k])) { if (isObj(v)) base[k] = clone(v); continue; }
    if (isObj(base[k])) merge(base[k], v);
    else if (Array.isArray(base[k])) { if (Array.isArray(v)) base[k] = v.slice(0, base[k].length).map(Number); }
    else if (typeof base[k] === "number") { const n = Number(v); if (Number.isFinite(n)) base[k] = n; }
    else if (typeof base[k] === "boolean") base[k] = Boolean(v);
    else if (typeof v === "string") base[k] = v;
  }
  return base;
}

/**
 * The resolved config: `defaults` (v1 or v2; missing v2 blocks are filled in,
 * and `interactionDefaults` sit under its "interactions"), with `partial`
 * (v1, v2, or null) merged over it. Always v2.
 */
export function upgradeConfig(partial, defaults, interactionDefaults = {}) {
  const c = fillIn(clone(defaults ?? {}), V2_BLOCKS);
  c.interactions = fillIn(c.interactions, interactionDefaults ?? {});
  merge(c, partial);
  if (isObj(c.global)) c.global.respectReducedMotion = true; // not negotiable
  c.version = VERSION;
  return c;
}
