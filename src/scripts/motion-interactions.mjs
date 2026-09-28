// The feel of clicks and hovers (motion.json "interactions",
// docs/motion-lab/engine-contract.md §5). The motion itself is CSS
// (src/styles/transitions.css, "Feel" / "Nudge" / "Magnetic links"); this
// module only sets the --ix-* variables it reads, on <html>. Their :root
// defaults there are INTERACTION_DEFAULTS below, so with the defaults nothing
// changes. What stays in site.js: the 80ms minimum hold of the rail nudge,
// the 120ms echo delay, the magnetic drift radius — all JS timings.
//   INTERACTION_DEFAULTS: the defaults of motion.json's "interactions".
//   INTERACTION_FIELDS:   the Motion Lab's controls (motion-lab.js field format).
//   applyInteractions():  writes them on <html>; motion.js calls it on every setConfig.

export const INTERACTION_DEFAULTS = {
  press: { enabled: true, scale: 0.985, downMs: 90, springMs: 380 },
  hover: { enabled: true, leanPx: 5, magnetPx: 4 },
  rail: { nudgePx: 3, nudgeMs: 60 },
};

const range = (key, label, min, max, step, unit) => ({ key, label, type: "range", min, max, step, unit, norand: true });
const toggle = (key, label) => ({ key, label, type: "toggle", norand: true });

export const INTERACTION_FIELDS = [
  toggle("interactions.press.enabled", "Press: sink under the pointer"),
  range("interactions.press.scale", "Press scale", 0.9, 1, 0.005, "×"),
  range("interactions.press.downMs", "Press down", 0, 1000, 10, "ms"),
  range("interactions.press.springMs", "Spring back", 0, 1000, 10, "ms"),
  toggle("interactions.hover.enabled", "Hover: image lean and magnetic arrow"),
  range("interactions.hover.leanPx", "Image lean (full card width)", 0, 16, 1, "px"),
  range("interactions.hover.magnetPx", "Magnetic arrow slide", 0, 16, 1, "px"),
  range("interactions.rail.nudgePx", "Rail row nudge", 0, 16, 1, "px"),
  range("interactions.rail.nudgeMs", "Rail row nudge in", 0, 1000, 10, "ms"),
];

// [CSS variable, path under "interactions", unit]; "on" = a 1/0 multiplier.
const VARS = [
  ["--ix-press", ["press", "enabled"], "on"],
  ["--ix-press-scale", ["press", "scale"], ""],
  ["--ix-press-ms", ["press", "downMs"], "ms"],
  ["--ix-spring-ms", ["press", "springMs"], "ms"],
  ["--ix-hover", ["hover", "enabled"], "on"],
  ["--ix-lean-px", ["hover", "leanPx"], "px"],
  ["--ix-magnet-px", ["hover", "magnetPx"], "px"],
  ["--ix-nudge-px", ["rail", "nudgePx"], "px"],
  ["--ix-nudge-ms", ["rail", "nudgeMs"], "ms"],
];
const LIMITS = Object.fromEntries(INTERACTION_FIELDS.map((f) => [f.key, f]));

/** Writes `interactions` as the --ix-* variables on <html>. A value that is
 * missing or not a number is removed (the stylesheet's default applies);
 * numbers are clamped to the lab's ranges. No-op outside a browser. */
export function applyInteractions(interactions) {
  if (typeof document === "undefined" || !document.documentElement) return;
  const style = document.documentElement.style;
  const ix = interactions && typeof interactions === "object" ? interactions : {};
  for (const [name, path, unit] of VARS) {
    const v = path.reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), ix);
    if (unit === "on") {
      if (typeof v === "boolean") style.setProperty(name, v ? "1" : "0");
      else style.removeProperty(name);
      continue;
    }
    const n = typeof v === "number" || typeof v === "string" ? Number(v) : NaN;
    if (v === "" || !Number.isFinite(n)) { style.removeProperty(name); continue; }
    const f = LIMITS[`interactions.${path.join(".")}`];
    const c = Math.min(f.max, Math.max(f.min, n));
    style.setProperty(name, `${Number(c.toFixed(4))}${unit}`);
  }
}
