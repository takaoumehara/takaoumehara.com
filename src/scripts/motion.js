// The loading choreography of the rail (left) and the pane (right), on the
// first load and on every client-side navigation. Config-driven: every
// timing and behaviour comes from one object — the defaults in
// src/data/motion.json, merged with the Motion Lab's working copy when the lab
// is open (?lab=1, src/scripts/motion-lab.js). Each box on screen ("unit")
// plays the same four phases, each at its own moment:
//
//   OUTLINE  its frame is drawn on an overlay layer (trace / all sides /
//            corners / midpoints / dashed march), in an order across the
//            screen (random, top-down, by column, spiral, from the click …);
//   FILL     the real element appears inside the frame (fade, wipes, iris,
//            pixel steps, scan, mask reveal, skeleton pulse …) and the frame
//            lingers, then fades;
//   MEDIA    images and thumbnails appear at random moments (pop, pixelate,
//            wipe, scanline …), a mono "NOW LOADING" holding the place of any
//            that is not in yet (or always, if asked);
//   TEXT     short lines, labels and headings are typed as random glyphs and
//            then settle into the real type (scramble, typewriter, both, with
//            a cursor); long paragraphs rise in as a block.
//
// Leaving a page (astro:before-preparation), the units on screen go OUT
// (collapse / fade / outline-then-vanish / reverse of in) while the next
// page is fetched. Units below the fold wait (.mo-wait) and play once, when
// they scroll into view.
//
// Rules, whatever the config says:
//  - prefers-reduced-motion: nothing runs, content is there at once;
//  - input wins: pointerdown, keydown, a wheel turn, a resize or a copy
//    finishes everything at once; nothing ever blocks a click;
//  - every animation fills backwards only (the OUT holds its end until the
//    swap), so at rest nothing is dimmed, moved or clipped;
//  - text: only the data of leaf text nodes changes, temporarily, and the
//    exact original string is written back. A block keeps its size while it
//    types (a WAAPI width/height hold), so nothing around it moves;
//  - #main (and #side while the rail plays) carries aria-busy="true".

import DEFAULTS from "../data/motion.json";
import SAND_DEFAULTS from "../data/sand-motion.json";
const baseDefaults = () => ({ ...clone(DEFAULTS), sand: clone(SAND_DEFAULTS) });

export const EASINGS = {
  linear: "linear",
  ease: "ease",
  "ease-in": "ease-in",
  "ease-out": "ease-out",
  "ease-in-out": "ease-in-out",
  decel: "cubic-bezier(0.16, 1, 0.3, 1)",
  accel: "cubic-bezier(0.4, 0, 1, 1)",
  standard: "cubic-bezier(0.4, 0, 0.2, 1)",
  "expo-out": "cubic-bezier(0.19, 1, 0.22, 1)",
  "back-out": "cubic-bezier(0.34, 1.56, 0.64, 1)",
  console: "cubic-bezier(0.22, 0.84, 0.22, 1)",
  spring: "linear(0, 0.62 12%, 1.05 28%, 0.985 45%, 1.008 62%, 1)",
  "steps-4": "steps(4, end)",
  "steps-8": "steps(8, end)",
};

const html = document.documentElement;
const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const isStill = still;

// ── Config ──────────────────────────────────────────────────────────────────
export const LAB_FLAG = "tu-lab";          // sessionStorage: the lab is open in this tab
export const LAB_KEY = "tu-motion-lab";    // localStorage: the lab's working config
const clone = (o) => JSON.parse(JSON.stringify(o));
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
function merge(base, over) {
  if (!isObj(over)) return base;
  for (const [k, v] of Object.entries(over)) {
    if (!Object.hasOwn(base, k)) continue; // ignore unknown and inherited keys
    if (isObj(base[k])) merge(base[k], v);
    else if (Array.isArray(base[k])) { if (Array.isArray(v)) base[k] = v.slice(0, base[k].length).map(Number); }
    else if (typeof base[k] === "number") { const n = Number(v); if (Number.isFinite(n)) base[k] = n; }
    else if (typeof base[k] === "boolean") base[k] = Boolean(v);
    else if (typeof v === "string") base[k] = v;
  }
  return base;
}
export function resolveConfig(partial) {
  const c = merge(baseDefaults(), partial);
  if (!["sand", "legacy", "off"].includes(c.global.engine)) c.global.engine = "sand";
  const bounds = { durationMs: [150,5000], contentRevealStart: [0,0.85], contentRevealEnd: [0.1,1], maxConcurrent: [1,8], particleBudget: [500,24000], minGrainPx: [0.25,4], grainVariationPx: [0,3], horizontalSpreadPx: [0,400], verticalSpreadPx: [0,400], ambientDensity: [0,1], boxContrast: [0,0.8], swirlPx: [0,80], gravityPx: [0,200], staggerFraction: [0,0.6] };
  for (const [key,[min,max]] of Object.entries(bounds)) c.sand[key] = Math.max(min, Math.min(max, c.sand[key]));
  c.sand.maxConcurrent = Math.round(c.sand.maxConcurrent);
  for (const key of ["accordionOpenMs", "accordionCloseMs"]) c.interaction[key] = Math.max(0, Math.min(1000, c.interaction[key]));
  if (!CSS.supports("animation-timing-function", EASINGS[c.interaction.accordionEasing] || c.interaction.accordionEasing)) c.interaction.accordionEasing = DEFAULTS.interaction.accordionEasing;
  c.sand.contentRevealEnd = Math.max(c.sand.contentRevealStart + 0.05, c.sand.contentRevealEnd);
  // Import files can tune effects, never replace discovery/exclusion rules.
  for (const key of ["surfaceSelector","fallbackSelector","excludeSelector"]) c.sand[key] = SAND_DEFAULTS[key];
  c.global.respectReducedMotion = true; // not negotiable
  c.version = DEFAULTS.version;
  return c;
}
export function labActive() {
  try {
    const q = new URLSearchParams(location.search).get("lab");
    if (q === "1") sessionStorage.setItem(LAB_FLAG, "1");
    if (q === "0") sessionStorage.removeItem(LAB_FLAG);
    return sessionStorage.getItem(LAB_FLAG) === "1";
  } catch (e) { return false; }
}
function readLab() {
  try { return JSON.parse(localStorage.getItem(LAB_KEY) || "null"); } catch (e) { return null; }
}
let CFG = resolveConfig(labActive() ? readLab() : null);
export const defaults = baseDefaults;
const legacyEnabled = () => CFG.global.enabled && CFG.global.engine === "legacy";
export const getConfig = () => clone(CFG);
export function setConfig(partial) {
  finishAll();
  reset();
  CFG = resolveConfig(partial);
  document.dispatchEvent(new CustomEvent("tu:motion-config", { detail: getConfig() }));
  return getConfig();
}

// ── Randomness (seeded when global.seed ≠ 0, so a take can be repeated) ─────
let R = Math.random;
function seedRng(seed) {
  if (!seed) { R = Math.random; return; }
  let a = seed >>> 0;
  R = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rr = (a, b) => a + R() * (b - a);
const span = (v) => (Array.isArray(v) ? rr(Math.min(v[0] ?? 0, v[1] ?? 0), Math.max(v[0] ?? 0, v[1] ?? 0)) : Number(v) || 0);
const pick = (s) => s[(Math.random() * s.length) | 0];

// ── Easing ──────────────────────────────────────────────────────────────────

const easeCache = new Map();
function ease(v) {
  if (EASINGS[v]) {
    if (v === "spring" && !CSS.supports("animation-timing-function", EASINGS.spring)) return EASINGS["back-out"];
    return EASINGS[v];
  }
  if (!easeCache.has(v)) easeCache.set(v, typeof v === "string" && CSS.supports("animation-timing-function", v) ? v : EASINGS.decel);
  return easeCache.get(v);
}
const COLOR_TOKENS = ["line-2", "line", "ink", "ink-2", "blue", "live"];
const color = (t) => `var(--pr-${COLOR_TOKENS.includes(t) ? t : "line-2"})`;

// ── Units ───────────────────────────────────────────────────────────────────
// A pane unit: a bento cell (or a detail page's beat), the home stage and its
// caption bar; anything else in the pane that holds no unit (a page header,
// the /work filter bar, the footer) is a unit of its own. The rail's units
// are its controls, its head, the About card, the category heads and rows.
const PANE_UNIT = ".bento-cell, .project-beats > .beat, .hh-stage, .hh-bar";
const RAIL_UNIT = ".side-top > *, .side-all, .side-search-toggle, .side-theme, .side-lang, .side-head, .side-about, .side-group > summary, .side-item, .side-foot";
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEMPLATE", "LINK", "META", "NOSCRIPT"]);
const NO_TEXT = "script, style, noscript, svg, textarea, select, .sr-only, .vh, .mo-loading, .mo-layer";
const ARROW = /[→↗]\s*$/; // site.js splits these off into .mag-arrow; leave them be

function unitsOf(root, sel) {
  const out = [];
  const walk = (el) => {
    for (const child of el.children) {
      if (SKIP_TAGS.has(child.tagName) || child.classList.contains("mo-layer") || child.hidden) continue;
      if (child.matches(sel)) out.push(child);
      else if (child.querySelector(sel)) walk(child);
      else out.push(child);
    }
  };
  if (root) walk(root);
  return out;
}
const inView = (r, margin = 0) => r.width > 0 && r.height > 0 && r.bottom > -margin && r.top < window.innerHeight + margin && r.right > 0 && r.left < window.innerWidth;
const hasBox = (el) => {
  const cs = getComputedStyle(el);
  if (cs.backgroundImage && cs.backgroundImage !== "none") return true;
  const m = cs.backgroundColor.match(/[\d.]+/g);
  return Boolean(m) && (m.length < 4 || Number(m[3]) > 0);
};
const radiusOf = (el, w, h) => {
  const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  return Math.min(r, w / 2, h / 2);
};
// Visible inside its unit: rendered, not visibility:hidden, and no ancestor
// between it and the unit at opacity 0 (a slide that is not the active one).
function shown(el, unit, cache) {
  if (el.checkVisibility ? !el.checkVisibility({ visibilityProperty: true }) : !el.getClientRects().length) return false;
  for (let n = el; n && n !== unit; n = n.parentElement) {
    let o = cache.get(n);
    if (o === undefined) { o = getComputedStyle(n).opacity; cache.set(n, o); }
    if (o === "0") return false;
  }
  return true;
}

// ── Bookkeeping: everything we start can be finished at once ───────────────
// Each thing is tagged with a group: "main" (a load or a navigation) or
// "scroll" (a unit that played on scrolling into view). A wheel turn
// finishes "main" only, so scrolling does not cut the cells it reveals.
const anims = new Set();
const timers = new Map();   // id → group
const finishers = new Map(); // fn → group
function own(a, g = "main") {
  a.__g = g;
  anims.add(a);
  const drop = () => anims.delete(a);
  a.finished.then(drop, drop);
  return a;
}
function later(fn, ms, g = "main") {
  const id = setTimeout(() => { timers.delete(id); fn(); }, Math.max(0, ms));
  timers.set(id, g);
  return id;
}
let busyUntil = 0, busyTimer = 0;
function busy(ms, rail) {
  const main = document.getElementById("main");
  busyUntil = Math.max(busyUntil, performance.now() + ms);
  main?.setAttribute("aria-busy", "true");
  if (rail) document.getElementById("side")?.setAttribute("aria-busy", "true");
  clearTimeout(busyTimer);
  busyTimer = setTimeout(unbusy, busyUntil - performance.now() + 20);
}
function unbusy() {
  clearTimeout(busyTimer);
  busyUntil = 0;
  document.getElementById("main")?.removeAttribute("aria-busy");
  document.getElementById("side")?.removeAttribute("aria-busy");
  document.querySelectorAll(".mo-layer").forEach((l) => { if (!l.children.length) l.remove(); });
}
/** Milliseconds until what is playing now has settled (0 when idle). */
export const remainingMs = () => Math.max(0, busyUntil - performance.now());
const match = (g, only) => !only || g === only;
export function finishAll(only) {
  for (const [fn, g] of finishers) if (match(g, only)) { finishers.delete(fn); fn(); }
  for (const [id, g] of timers) if (match(g, only)) { clearTimeout(id); timers.delete(id); }
  for (const a of anims) if (match(a.__g, only)) { try { a.finish(); } catch (e) { a.cancel(); } anims.delete(a); }
  settleText(only);
  clearLayers(only);
  if (!only || (!anims.size && !texts.size)) unbusy();
}
const busyNow = () => anims.size || texts.size || finishers.size || timers.size;

// ── Layers: the overlay the frames, pixel canvases and labels are drawn on ──
// One in <body> for the pane (absolute, so it scrolls with the page) and one
// inside #side for the rail (it scrolls with the rail). aria-hidden, inert.
function layerFor(surface) {
  const host = surface === "rail" ? document.getElementById("side") : document.body;
  if (!host) return null;
  let layer = [...host.children].find((c) => c.classList.contains("mo-layer"));
  if (!layer) {
    layer = document.createElement("div");
    layer.className = `mo-layer mo-layer-${surface}`;
    layer.setAttribute("aria-hidden", "true");
    host.append(layer);
  }
  return layer;
}
function clearLayers(only) {
  document.querySelectorAll(".mo-layer > *").forEach((el) => { if (match(el.__g ?? "main", only)) el.remove(); });
  document.querySelectorAll(".mo-layer").forEach((l) => { if (!l.children.length) l.remove(); });
}
const at = (layer, r) => {
  const l = layer.getBoundingClientRect();
  return { x: r.left - l.left, y: r.top - l.top };
};

// ── Frames: a rounded rect as a walkable perimeter ─────────────────────────
// The perimeter starts just after the top-left corner and runs clockwise.
// Sub-paths of it (a side, a corner's two arms …) are what gets drawn.
const SVGNS = "http://www.w3.org/2000/svg";
function perimeter(w, h, r) {
  const pts = [];
  const push = (x, y) => pts.push([x, y]);
  const arc = (cx, cy, a0) => { for (let i = 1; i <= 6; i++) { const a = a0 + (i / 6) * (Math.PI / 2); push(cx + r * Math.cos(a), cy + r * Math.sin(a)); } };
  push(r, 0); push(w - r, 0);
  if (r) arc(w - r, r, -Math.PI / 2);
  push(w, h - r);
  if (r) arc(w - r, h - r, 0);
  push(r, h);
  if (r) arc(r, h - r, Math.PI / 2);
  push(0, r);
  if (r) arc(r, r, Math.PI);
  else push(0, 0);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const P = cum[cum.length - 1];
  const a = (Math.PI * r) / 2;
  const top = w - 2 * r, side = h - 2 * r;
  // Corner midpoints (TR, BR, BL, TL) and side midpoints (T, R, B, L).
  const corners = [top + a / 2, top + a + side + a / 2, 2 * top + 2 * a + side + a / 2, P - a / 2];
  const mids = [top / 2, top + a + side / 2, top + a + side + a + top / 2, 2 * top + 3 * a + side + side / 2];
  const pointAt = (s) => {
    s = ((s % P) + P) % P;
    let i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const f = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    return [pts[i - 1][0] + f * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + f * (pts[i][1] - pts[i - 1][1])];
  };
  // A path from s0 to s1 (s1 < s0 walks backwards), vertices included.
  const sub = (s0, s1) => {
    const out = [pointAt(s0)];
    const dir = s1 >= s0 ? 1 : -1;
    const len = Math.abs(s1 - s0);
    for (let k = 0; k < 4 && out.length < 400; k++) {
      for (let i = 0; i < cum.length; i++) {
        const s = cum[i] + (dir > 0 ? k * P : -k * P);
        const d = (s - s0) * dir;
        if (d > 0 && d < len) out.push({ s: d, p: pts[i] });
      }
    }
    const mid = out.slice(1).sort((m, n) => m.s - n.s).map((m) => m.p);
    const all = [out[0], ...mid, pointAt(s1)];
    return { d: "M" + all.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L"), len };
  };
  return { P, corners, mids, sub };
}
// The paths for an outline style, each with how it is drawn.
function framePaths(o, w, h, r) {
  const g = perimeter(w, h, r);
  const { P, corners, mids, sub } = g;
  const rev = o.reverse;
  const run = (s0, s1) => (rev ? sub(s1, s0) : sub(s0, s1));
  switch (o.style) {
    case "sides": case "viewfinder":
      return corners.map((c, i) => run(corners[(i + 3) % 4], corners[(i + 3) % 4] + (((c - corners[(i + 3) % 4]) % P) + P) % P));
    case "corners":
      return corners.flatMap((c, i) => {
        const before = mids[i], after = mids[(i + 1) % 4];
        const back = ((c - before) % P + P) % P, fwd = ((after - c) % P + P) % P;
        return [sub(c, c - back), sub(c, c + fwd)];
      }).map((p) => ({ ...p, corner: true }));
    case "midpoints":
      return mids.flatMap((m, i) => {
        const next = corners[i], prev = corners[(i + 3) % 4];
        return [sub(m, m + (((next - m) % P) + P) % P), sub(m, m - (((m - prev) % P) + P) % P)];
      });
    case "march":
      return [{ ...sub(corners[3], corners[3] + P), march: true }];
    case "trace": default:
      return [run(corners[3], corners[3] + P)];
  }
}
// Draws a unit's frame on the layer. Returns the <svg> (or null).
function drawFrame(layer, rect, el, o, t, k, g, { undraw = false } = {}) {
  if (!layer || o.style === "none" || !(o.strokeWidth > 0)) return null;
  const sw = Math.max(0.5, Number(o.strokeWidth) || 1);
  const w = rect.width, h = rect.height;
  const pos = at(layer, rect);
  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("class", "mo-frame");
  svg.setAttribute("width", w);
  svg.setAttribute("height", h);
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.style.cssText = `left:${pos.x}px;top:${pos.y}px;width:${w}px;height:${h}px;stroke:${color(o.color)};stroke-width:${sw}px`;
  svg.__g = g;
  const r = Math.max(0, radiusOf(el, w, h) - sw / 2);
  const inner = document.createElementNS(SVGNS, "g");
  inner.setAttribute("transform", `translate(${sw / 2} ${sw / 2})`);
  svg.append(inner);
  const dur = Math.max(1, o.drawMs * k);
  const easing = ease(o.easing);
  framePaths(o, Math.max(1, w - sw), Math.max(1, h - sw), r).forEach((p) => {
    const path = document.createElementNS(SVGNS, "path");
    path.setAttribute("d", p.d);
    inner.append(path);
    const L = Math.max(1, p.len);
    if (p.march) {
      const dash = Math.max(1, o.dashPx), gap = Math.max(1, o.gapPx);
      path.setAttribute("stroke-dasharray", `${dash} ${gap}`);
      own(path.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -(dash + gap) * Math.max(2, Math.round(dur / 90)) }], { duration: dur, delay: t, easing: "linear", fill: "both" }), g);
      own(path.animate([{ opacity: 0 }, { opacity: 1 }], { duration: Math.min(dur, 180 * k), delay: t, fill: "backwards" }), g);
      return;
    }
    path.setAttribute("stroke-dasharray", `${L} ${L}`);
    if (undraw) {
      own(path.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -L }], { duration: dur, delay: t, easing, fill: "both" }), g);
      return;
    }
    const frames = p.corner
      ? [{ strokeDashoffset: L, offset: 0 }, { strokeDashoffset: Math.max(0, L - o.cornerPx), offset: 0.3 }, { strokeDashoffset: Math.max(0, L - o.cornerPx), offset: 0.55 }, { strokeDashoffset: 0, offset: 1 }]
      : [{ strokeDashoffset: L }, { strokeDashoffset: 0 }];
    own(path.animate(frames, { duration: dur, delay: t, easing: p.corner ? "linear" : easing, fill: "both" }), g);
  });
  if (o.style === "viewfinder") own(svg.animate([{ opacity: 0 }, { opacity: 1, offset: 0.18 }, { opacity: 1 }], { duration: dur, delay: t, fill: "backwards" }), g);
  if (o.jitterPx > 0 && !undraw) {
    const j = o.jitterPx;
    own(svg.animate([{ transform: `translate(${rr(-j, j).toFixed(1)}px, ${rr(-j, j).toFixed(1)}px)` }, { transform: "none" }], { duration: dur, delay: t, easing, fill: "backwards" }), g);
  }
  layer.append(svg);
  return svg;
}

// ── Fill: the real element appears inside its frame ─────────────────────────
function fillFrames(f, el, w, h) {
  const r = radiusOf(el, w, h);
  const rd = r ? ` round ${r}px` : "";
  const full = `inset(0 0 0 0${rd})`;
  switch (f.style) {
    case "wipe-left": return { frames: [{ clipPath: `inset(0 100% 0 0${rd})` }, { clipPath: full }] };
    case "wipe-right": return { frames: [{ clipPath: `inset(0 0 0 100%${rd})` }, { clipPath: full }] };
    case "wipe-up": return { frames: [{ clipPath: `inset(100% 0 0 0${rd})` }, { clipPath: full }] };
    case "wipe-down": return { frames: [{ clipPath: `inset(0 0 100% 0${rd})` }, { clipPath: full }] };
    case "iris": return { frames: [{ clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(72% at 50% 50%)" }] };
    case "pixel-step": return { frames: [{ clipPath: `inset(50% 50% 50% 50%${rd})` }, { clipPath: full }], easing: `steps(${Math.max(1, Math.round(f.steps))}, end)` };
    case "scan": return { frames: [{ clipPath: `inset(0 0 100% 0${rd})` }, { clipPath: full }], easing: `steps(${Math.max(1, Math.round(f.steps))}, end)` };
    case "mask-reveal": return { frames: [
      { clipPath: `inset(0 100% 0 0${rd})`, opacity: 0, transform: `translate(${f.fromXPx}px, ${f.fromYPx}px)` },
      { clipPath: `inset(0 100% 0 0${rd})`, opacity: 0, transform: `translate(${f.fromXPx}px, ${f.fromYPx}px)`, offset: 0.14 },
      { opacity: 0.24, offset: 0.3 },
      { clipPath: full, opacity: 1, transform: "none" },
    ] };
    case "skeleton": return { frames: [{ opacity: 0 }, { opacity: 0.6, offset: 0.2 }, { opacity: 0.3, offset: 0.45 }, { opacity: 0.75, offset: 0.7 }, { opacity: 1 }], easing: "ease-in-out" };
    case "lens": return { frames: [{ opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0)" }] };
    case "none": return { frames: [{ opacity: 0 }, { opacity: 0, offset: 0.999 }, { opacity: 1 }], easing: "linear" };
    case "fade": default: return { frames: [{ opacity: 0 }, { opacity: 1 }] };
  }
}

// ── Text: random glyphs typed, then settled into the real type ─────────────
const SETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "#%&*+=/<>?!$@",
  katakana: "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン",
  kanji: "日月火水木金土山川田人口目手力文字上下中大小本天気雨電風空海森林光音形動",
  binary: "01",
  blocks: "░▒▓█▌▐▀▄",
  hex: "0123456789ABCDEF",
};
const JP = /[぀-ヿ㐀-鿿ｦ-ﾟ]/;
const WORDISH = /[\p{L}\p{N}]/u;
function glyph(c, T) {
  if (JP.test(c)) {
    if (T.jpGlyphs === "kanji") return pick(SETS.kanji);
    if (T.jpGlyphs === "mixed") return pick(SETS.katakana + SETS.kanji);
    if (T.jpGlyphs !== "same") return pick(SETS.katakana);
  }
  if (!WORDISH.test(c)) return c; // whitespace, punctuation, arrows: kept, so words and wraps stay put
  const up = c !== c.toLowerCase();
  switch (T.glyphs) {
    case "latin": return T.matchCase ? pick(up ? SETS.upper : SETS.lower) : pick(SETS.upper + SETS.lower);
    case "custom": return pick(T.customGlyphs || SETS.symbols);
    case "digits": case "symbols": case "katakana": case "kanji": case "binary": case "blocks": case "hex":
      return pick(SETS[T.glyphs]);
    case "auto": default:
      if (c >= "0" && c <= "9") return pick(SETS.digits);
      if (up) return Math.random() < T.symbolRate ? pick(SETS.symbols) : pick(SETS.upper);
      return pick(SETS.lower);
  }
}
const PLACE = { hide: "", space: " ", dot: "·", underscore: "_", block: "░" };
const placeholder = (c, T) => (T.untyped === "space" && JP.test(c) ? "　" : PLACE[T.untyped] ?? "");

// Per-character timings (ms from the block's start), from the text config.
function typePlan(chars, T) {
  const n = chars.length;
  const sig = [];
  for (let i = 0; i < n; i++) if (chars[i].trim()) sig.push(i);
  const m = sig.length || 1;
  const rank = new Array(n).fill(0);
  let order;
  switch (T.direction) {
    case "rtl": order = sig.slice().reverse(); break;
    case "random": order = sig.slice().sort(() => R() - 0.5); break;
    case "center-out": { const c = (m - 1) / 2; order = sig.map((idx, j) => [idx, Math.abs(j - c)]).sort((a, b) => a[1] - b[1]).map(([idx]) => idx); break; }
    default: order = sig;
  }
  order.forEach((idx, r) => { rank[idx] = r; });
  const gap = 1000 / Math.max(1, T.cps);
  const rgap = 1000 / Math.max(1, T.resolveCps);
  const lag = Math.max(0, T.framesPerChar) * Math.max(16, T.frameMs);
  const appear = new Array(n), settle = new Array(n);
  const typed = (m - 1) * gap;
  for (const i of sig) {
    const r = rank[i];
    if (T.mode === "typewriter") { appear[i] = r * gap; settle[i] = appear[i]; }
    else if (T.mode === "scramble") { appear[i] = 0; settle[i] = T.holdMs + r * rgap + lag; }
    else { // scramble-typewriter
      appear[i] = r * gap;
      settle[i] = T.settle === "lag" ? appear[i] + lag : typed + T.holdMs + r * rgap;
    }
  }
  // Whitespace appears with the character before it (so a typed line wraps
  // as it will at rest), and never scrambles.
  let prev = 0;
  for (let i = 0; i < n; i++) {
    if (appear[i] === undefined) { appear[i] = prev; settle[i] = prev; } else prev = appear[i];
  }
  let dur = Math.max(0, ...settle);
  if (T.maxLineMs > 0 && dur > T.maxLineMs) {
    const f = T.maxLineMs / dur;
    for (let i = 0; i < n; i++) { appear[i] *= f; settle[i] *= f; }
    dur = T.maxLineMs;
  }
  return { appear, settle, dur, typedEnd: Math.max(0, ...appear) };
}

const texts = new Set();
let textRaf = 0;
function runText(rec) {
  texts.add(rec);
  if (!textRaf) textRaf = requestAnimationFrame(textFrame);
}
function renderText(rec, t) {
  const { T, segs, plan } = rec;
  const reroll = t - rec.tick >= T.frameMs;
  if (reroll) rec.tick = t;
  const done = t >= plan.dur;
  // The cursor sits at the typing front while typing, then at the settling front.
  let cursorAt = -1;
  if (T.cursor && !done && T.mode !== "scramble") {
    let front = -1, frontT = -1;
    for (let i = 0; i < rec.flat.length; i++) {
      const a = plan.appear[i];
      if (a <= t && a >= frontT && rec.flat[i].trim()) { front = i; frontT = a; }
    }
    cursorAt = front;
  } else if (T.cursor && !done) {
    for (let i = rec.flat.length - 1; i >= 0; i--) if (plan.settle[i] <= t && rec.flat[i].trim()) { cursorAt = i; break; }
  }
  const blinkOn = T.cursorBlinkMs > 0 ? Math.floor(t / T.cursorBlinkMs) % 2 === 0 : true;
  const typing = t < plan.typedEnd;
  let gi = 0;
  for (const seg of segs) {
    let s = "";
    for (let j = 0; j < seg.chars.length; j++, gi++) {
      const c = seg.chars[j];
      if (t < plan.appear[gi]) s += placeholder(c, T);
      else if (t < plan.settle[gi]) {
        if (reroll || rec.cache[gi] === undefined) rec.cache[gi] = glyph(c, T);
        s += rec.cache[gi];
      } else s += c;
      if (gi === cursorAt && (typing || blinkOn)) s += T.cursorChar || "▍";
    }
    if (seg.dead) continue;
    if (seg.last !== null && seg.node.data !== seg.last) { seg.dead = true; continue; } // someone else rewrote it: theirs wins
    if (s !== seg.last) seg.last = seg.node.data = s;
  }
}
function activate(rec, now) {
  rec.active = true;
  const el = rec.el;
  const cs = getComputedStyle(el);
  if (!/^(inline|contents)$/.test(cs.display)) {
    const frame = { width: cs.width, height: cs.height };
    if (rec.T.clip && el !== rec.unit) frame.clipPath = "inset(-2px -2px -2px -2px)";
    own(el.animate([frame, frame], { duration: Math.max(1, rec.start + rec.plan.dur * rec.k - now + 40) }), rec.g);
  }
  rec.segs.forEach((s) => { s.last = null; });
}
function textFrame(now) {
  textRaf = 0;
  for (const rec of texts) {
    if (now < rec.start - 16) continue;
    if (!rec.active) activate(rec, now);
    const t = (now - rec.start) / rec.k;
    if (t >= rec.plan.dur) { restore(rec); texts.delete(rec); continue; }
    renderText(rec, Math.max(0, t));
    if (rec.segs.every((s) => s.dead)) texts.delete(rec);
  }
  if (texts.size) textRaf = requestAnimationFrame(textFrame);
}
function restore(rec) {
  rec.segs.forEach((s) => { if (!s.dead && (s.last === null || s.node.data === s.last)) s.node.data = s.orig; });
}
function settleText(only) {
  texts.forEach((rec) => { if (match(rec.g, only)) { if (rec.active) restore(rec); texts.delete(rec); } });
  if (!texts.size) { cancelAnimationFrame(textRaf); textRaf = 0; }
}

// A unit's text blocks: the nearest non-inline ancestor of each visible text
// node, classified as typed (headings, labels, short lines) or long.
// Text blocks inside a unit, each marked as a header (headings and mono or
// uppercase labels) or body (everything else). How each one plays is decided
// in planUnit: headers by the Text group, body by the Body group.
function textBlocks(unit, vis) {
  const disp = new Map();
  const displayOf = (el) => {
    let d = disp.get(el);
    if (d === undefined) { d = getComputedStyle(el).display; disp.set(el, d); }
    return d;
  };
  const blocks = new Map();
  const walker = document.createTreeWalker(unit, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.data.trim() && n.parentElement && !n.parentElement.closest(NO_TEXT) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!shown(n.parentElement, unit, vis)) continue;
    let b = n.parentElement;
    while (b !== unit && b.parentElement && /^(inline|contents)$/.test(displayOf(b))) b = b.parentElement;
    if (!blocks.has(b)) blocks.set(b, []);
    blocks.get(b).push(n);
  }
  return [...blocks].map(([el, nodes]) => {
    const len = nodes.reduce((s, n) => s + n.data.trim().length, 0);
    const heading = /^H[1-6]$/.test(el.tagName) || el.matches(".beat-title, .side-wordmark");
    const cs = getComputedStyle(el);
    const label = !heading && (/mono/i.test(cs.fontFamily) || cs.textTransform === "uppercase");
    const near = inView(el.getBoundingClientRect(), 160);
    return { el, nodes: nodes.filter((n) => !ARROW.test(n.data)), len, heading, label, body: !heading && !label, near };
  });
}
const TYPING = new Set(["scramble-typewriter", "scramble", "typewriter"]);
// Settings every text type (heading, label, body) can override. While a
// type's `follow` is on it uses the Text group's values: the preset's base.
export const TEXT_KEYS = ["mode", "glyphs", "customGlyphs", "jpGlyphs", "matchCase", "symbolRate", "cps", "frameMs", "framesPerChar", "settle", "holdMs", "resolveCps", "direction", "untyped", "cursor", "cursorChar", "cursorBlinkMs", "maxLineMs", "lineStaggerMs", "maxStaggered", "randomDelayMs", "clip", "long", "longMs", "longRisePx", "longPixelPx", "longSteps"];
function textFor(type, modeOverride) {
  const T = CFG.text, G = CFG[type];
  const X = { ...T };
  if (!G.follow) for (const key of TEXT_KEYS) X[key] = G[key];
  if (modeOverride && modeOverride !== "default") X.mode = modeOverride;
  return X;
}
// Typing modes type the text unless it is off-screen, empty or longer than
// the type's max; those, and every other mode, animate the whole block.
function kindOf(b, TT, maxChars) {
  if (TT.mode === "none") return ["none"];
  if (!TYPING.has(TT.mode)) return ["long", TT.mode];
  if (!b.near || !b.nodes.length || b.len > maxChars) return ["long", TT.long];
  return ["type"];
}
const scalePlan = (plan, f) => (f === 1 ? plan : {
  appear: plan.appear.map((x) => x * f), settle: plan.settle.map((x) => x * f), dur: plan.dur * f, typedEnd: plan.typedEnd * f,
});
const MEDIA = "img, video, canvas, iframe, .side-initials";
function mediaOf(unit, vis, M) {
  return [...unit.querySelectorAll(MEDIA)].filter((m) => {
    if (m.closest("svg, .mo-layer")) return false;
    const r = m.getBoundingClientRect();
    return r.width >= M.minSizePx && r.height >= M.minSizePx && shown(m, unit, vis);
  });
}
const ready = (m) => {
  if (m.tagName === "IMG") return m.complete && m.naturalWidth > 0;
  if (m.tagName === "VIDEO") return m.readyState >= 2;
  return true;
};

// ── Media: reveal styles, the pixel canvas, the NOW LOADING label ──────────
function loadingLabel(layer, m, L, g) {
  const r = m.getBoundingClientRect();
  const pos = at(layer, r);
  const label = document.createElement("span");
  label.className = "mo-loading";
  label.textContent = L.text || "NOW LOADING";
  if (!(L.dotMs > 0)) label.classList.add("no-dots");
  label.style.cssText = `left:${pos.x}px;top:${pos.y}px;width:${r.width}px;--mo-dot-ms:${Math.max(120, L.dotMs)}ms`;
  label.__g = g;
  layer.append(label);
  return label;
}
function pixelate(m, M, dur, layer, g, done) {
  const r = m.getBoundingClientRect();
  const src = m.tagName === "VIDEO" ? m : m.tagName === "IMG" ? m : null;
  const nw = src?.naturalWidth || src?.videoWidth, nh = src?.naturalHeight || src?.videoHeight;
  if (!src || !nw || !nh || !r.width || !r.height) return false;
  const canvas = document.createElement("canvas");
  const pos = at(layer, r);
  canvas.className = "mo-pix";
  canvas.style.cssText = `left:${pos.x}px;top:${pos.y}px;width:${r.width}px;height:${r.height}px;border-radius:${getComputedStyle(m).borderRadius}`;
  canvas.__g = g;
  const ctx = canvas.getContext("2d");
  const fit = getComputedStyle(m).objectFit;
  let sx = 0, sy = 0, sw = nw, sh = nh;
  if (fit === "cover") {
    const s = Math.max(r.width / nw, r.height / nh);
    sw = r.width / s; sh = r.height / s; sx = (nw - sw) / 2; sy = (nh - sh) / 2;
  }
  const steps = Math.max(1, Math.round(M.steps));
  const level = (i) => {
    const cols = Math.max(2, Math.min(Math.round(r.width / 2), Math.round(3 * Math.pow(2, i))));
    canvas.width = cols;
    canvas.height = Math.max(1, Math.round((cols * r.height) / r.width));
    try { ctx.imageSmoothingEnabled = false; ctx.drawImage(src, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height); } catch (e) { return false; }
    return true;
  };
  if (!level(0)) return false;
  layer.append(canvas);
  for (let i = 1; i < steps; i++) later(() => level(i), (dur * i) / steps, g);
  later(() => { canvas.remove(); done(); }, dur, g);
  return true;
}
// Paragraphs pixelate through SVG mosaic filters: each block of the text
// takes the colour of one sample point, then the blocks shrink to nothing.
// The text stays real text throughout; only its painting is filtered.
let pixSvg = null;
function pixelFilter(size) {
  const id = `mo-tpx-${size}`;
  if (!pixSvg?.isConnected) {
    pixSvg = document.createElementNS(SVGNS, "svg");
    pixSvg.setAttribute("aria-hidden", "true");
    pixSvg.setAttribute("width", "0");
    pixSvg.setAttribute("height", "0");
    pixSvg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    document.body.append(pixSvg);
  }
  if (!pixSvg.querySelector(`#${id}`)) {
    const c = Math.floor(size / 2);
    pixSvg.insertAdjacentHTML("beforeend",
      `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
      `<feFlood x="${c}" y="${c}" width="1" height="1"/><feComposite width="${size}" height="${size}"/>` +
      `<feTile result="a"/><feComposite in="SourceGraphic" in2="a" operator="in"/>` +
      `<feMorphology operator="dilate" radius="${c}"/></filter>`);
  }
  return `url(#${id})`;
}
function pixelTextFrames(pixelPx, steps) {
  const n = Math.max(1, Math.round(steps));
  const px = Math.max(2, Math.round(pixelPx));
  const sizes = Array.from({ length: n }, (_, i) => Math.max(2, Math.round(n === 1 ? px : px * Math.pow(2 / px, i / (n - 1)))));
  const e = 0.001;
  const frames = [{ opacity: 0, filter: pixelFilter(sizes[0]), offset: 0 }];
  sizes.forEach((size, i) => {
    const f = pixelFilter(size);
    frames.push({ opacity: 1, filter: f, offset: i === 0 ? e : i / n });
    frames.push({ opacity: 1, filter: f, offset: Math.max(i / n + e, (i + 1) / n - e) });
  });
  frames.push({ opacity: 1, filter: "none", offset: 1 });
  return frames;
}
function revealMedia(m, M, k, layer, g) {
  const dur = Math.max(1, M.durationMs * k);
  const easing = ease(M.easing);
  const steps = `steps(${Math.max(1, Math.round(M.steps))}, end)`;
  const play = (frames, e = easing) => own(m.animate(frames, { duration: dur, easing: e, fill: "backwards" }), g);
  let mode = M.mode;
  if (mode === "pixelate" && m.tagName !== "IMG" && m.tagName !== "VIDEO") mode = "pop";
  switch (mode) {
    case "pixelate": {
      const hold = own(m.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1e7 }), g);
      const ok = pixelate(m, M, dur, layer, g, () => hold.cancel());
      if (!ok) { hold.cancel(); play([{ opacity: 0 }, { opacity: 1 }]); }
      return;
    }
    case "wipe": return play([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }]);
    case "scanline": return play([{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }], steps);
    case "scale": return play([{ opacity: 0, transform: "scale(1.08)" }, { opacity: 1, transform: "none" }]);
    case "fade": return play([{ opacity: 0 }, { opacity: 1 }]);
    case "none": return;
    case "pop": default:
      return play([{ opacity: 0, transform: "scale(0.6)" }, { opacity: 1, transform: "scale(1.04)", offset: 0.6 }, { opacity: 1, transform: "none" }]);
  }
}
function scheduleMedia(m, t, M, k, layer, g) {
  const hold = own(m.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1e7 }), g);
  const big = m.getBoundingClientRect().width >= M.label.minWidthPx;
  const L = M.label;
  let label = null, done = false;
  const cleanup = () => { label?.remove(); label = null; };
  const finish = () => { done = true; cleanup(); hold.cancel(); };
  finishers.set(finish, g);
  const reveal = () => {
    if (done) return;
    done = true;
    finishers.delete(finish);
    cleanup();
    hold.cancel();
    revealMedia(m, M, k, layer, g);
  };
  const waitLoad = () => {
    m.addEventListener(m.tagName === "VIDEO" ? "loadeddata" : "load", reveal, { once: true });
    m.addEventListener("error", reveal, { once: true });
    later(reveal, Math.max(0, L.maxWaitMs), g); // never hold the page for a slow image
  };
  later(() => {
    if (L.mode === "always" && big && layer) {
      label = loadingLabel(layer, m, L, g);
      later(() => (ready(m) ? reveal() : waitLoad()), Math.max(0, L.minVisibleMs * k), g);
    } else if (ready(m)) reveal();
    else {
      if (L.mode !== "off" && big && layer) label = loadingLabel(layer, m, L, g);
      if (label && L.minVisibleMs > 0) later(waitLoad, L.minVisibleMs * k, g);
      else waitLoad();
    }
  }, t, g);
}

// ── Order: when each unit starts, as a 0…1 rank across the screen ──────────
let lastPointer = null;
function ranks(order, rects) {
  const n = rects.length;
  if (!n) return [];
  const cx = (r) => r.left + r.width / 2, cy = (r) => r.top + r.height / 2;
  const norm = (vals) => {
    const lo = Math.min(...vals), hi = Math.max(...vals);
    return vals.map((v) => (hi > lo ? (v - lo) / (hi - lo) : 0));
  };
  const idx = (keyed) => {
    const sorted = keyed.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
    const out = new Array(n);
    sorted.forEach(([, i], r) => { out[i] = n > 1 ? r / (n - 1) : 0; });
    return out;
  };
  const W = window.innerWidth, H = window.innerHeight;
  const dist = (p) => rects.map((r) => Math.hypot(cx(r) - p.x, cy(r) - p.y));
  switch (order) {
    case "top-down": return norm(rects.map((r) => r.top));
    case "bottom-up": return norm(rects.map((r) => -r.bottom));
    case "left-right": return norm(rects.map((r) => r.left));
    case "reading": return idx(rects.map((r) => Math.round(r.top / 48) * 1e5 + r.left));
    case "dom": return rects.map((_, i) => (n > 1 ? i / (n - 1) : 0));
    case "by-column": {
      const cols = [...new Set(rects.map((r) => Math.round(r.left / 32)))].sort((a, b) => a - b);
      const top = norm(rects.map((r) => r.top));
      return rects.map((r, i) => (cols.indexOf(Math.round(r.left / 32)) + top[i] * 0.9) / cols.length);
    }
    case "center-out": return norm(dist({ x: W / 2, y: H / 2 }));
    case "edges-in": return norm(dist({ x: W / 2, y: H / 2 }).map((d) => -d));
    case "spiral": {
      const d = norm(dist({ x: W / 2, y: H / 2 }));
      return norm(rects.map((r, i) => d[i] * 2 + ((Math.atan2(cy(r) - H / 2, cx(r) - W / 2) + Math.PI * 1.5) % (Math.PI * 2)) / (Math.PI * 2)));
    }
    case "distance-from-click": return norm(dist(lastPointer ?? { x: 0, y: 0 }));
    case "random": default: return rects.map(() => R());
  }
}

// ── The plan: every unit's phases as numbers, then played at a scale ────────
function planUnit(unit, rect, s, surface, box) {
  const S = CFG[surface], T = CFG.text, M = CFG.media;
  const o = S.outline, f = S.fill;
  const outlineOn = o.style !== "none" && (box || o.unboxed === "outline");
  const drawEnd = outlineOn ? s + o.drawMs : s;
  let fillAt = s, fillEnd = s;
  if (box) { fillAt = Math.max(s, drawEnd + (outlineOn ? f.afterOutlineMs : 0)); fillEnd = fillAt + f.durationMs; }
  else if (outlineOn) { fillAt = fillEnd = drawEnd + f.afterOutlineMs; }
  const vis = new Map();
  const media = mediaOf(unit, vis, M).map((m) => ({ m, at: fillEnd + M.afterFillMs + span(M.randomDelayMs) }));
  let end = Math.max(fillEnd, ...media.map((x) => x.at + M.durationMs));
  const segsOf = (b) => b.nodes.map((node) => ({ node, orig: node.data, chars: Array.from(node.data), last: null }));
  const blocks = [];
  const make = (b, at, TT, slow, maxChars) => {
    const [kind, style] = kindOf(b, TT, maxChars);
    let x = { ...b, at, kind, T: TT }, dur = 0;
    if (kind === "type") {
      const segs = segsOf(b);
      x = { ...x, segs, plan: scalePlan(typePlan(segs.flatMap((c) => c.chars), TT), slow) };
      dur = x.plan.dur;
    } else if (kind === "long") {
      x = { ...x, style, ms: TT.longMs * slow, rise: TT.longRisePx, px: TT.longPixelPx, steps: TT.longSteps };
      dur = x.ms;
    }
    end = Math.max(end, at + dur);
    blocks.push(x);
    return dur;
  };
  const raw = textBlocks(unit, vis);
  // Headers (headings and labels) start after the fill, staggered in order.
  const t0 = fillEnd + T.afterFillMs;
  let headStart = Infinity, headEnd = -Infinity;
  const heads = raw.filter((b) => !b.body);
  heads.forEach((b, i) => {
    const type = b.heading ? "heading" : "label";
    const TT = textFor(type), slow = 1 / Math.max(0.05, CFG[type].speed);
    const at = t0 + (Math.min(i, TT.maxStaggered) * TT.lineStaggerMs + span(TT.randomDelayMs)) * slow;
    const dur = make(b, at, TT, slow, CFG[type].maxChars);
    headStart = Math.min(headStart, at); headEnd = Math.max(headEnd, at + dur);
  });
  // Body text: timed against this unit's headers by body.relation.
  const B = CFG.body, TB = textFor("body", S.body), slow = 1 / Math.max(0.05, B.speed);
  let base = t0, from = heads.length;
  if (B.relation !== "independent" && heads.length) {
    from = 0;
    base = B.relation === "with-header" ? headStart
      : B.relation === "during-header" ? headStart + (headEnd - headStart) * Math.min(100, Math.max(0, B.headerPct)) / 100
      : headEnd;
  }
  base = Math.max(s, base + B.offsetMs);
  raw.filter((b) => b.body).forEach((b, j) => {
    make(b, base + (Math.min(j + from, TB.maxStaggered) * TB.lineStaggerMs + span(TB.randomDelayMs)) * slow, TB, slow, Infinity);
  });
  const fadeAt = fillEnd + o.lingerMs;
  if (outlineOn) end = Math.max(end, fadeAt + o.fadeOutMs);
  return { unit, rect, surface, box, s, outlineOn, fillAt, fillEnd, fadeAt, media, blocks, end };
}
function planSurface(surface, units, t0, spreadScale = 1) {
  const S = CFG[surface];
  const list = units.slice(0, Math.max(0, S.maxUnits));
  const rects = list.map((u) => u.getBoundingClientRect());
  const rk = ranks(S.order, rects);
  const items = list.map((u, i) => planUnit(u, rects[i], t0 + (rk[i] * S.spreadMs + span(S.randomDelayMs)) * spreadScale, surface, u.matches(surface === "rail" ? RAIL_UNIT : PANE_UNIT) && hasBox(u)));
  return { items, end: Math.max(0, ...items.map((x) => x.end)) };
}
function execute(item, k, g, dir) {
  const { unit, rect, surface, box } = item;
  const S = CFG[surface], T = CFG.text, M = CFG.media;
  const layer = layerFor(surface);
  const vis = new Map();
  if (item.outlineOn) {
    const svg = drawFrame(layer, rect, unit, S.outline, item.s * k, k, g);
    if (svg) {
      own(svg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: Math.max(1, S.outline.fadeOutMs * k), delay: item.fadeAt * k, fill: "forwards" }), g);
      later(() => svg.remove(), (item.fadeAt + S.outline.fadeOutMs) * k + 20, g);
    }
  }
  if (box) {
    const { frames, easing } = fillFrames(S.fill, unit, rect.width, rect.height);
    own(unit.animate(frames, { duration: Math.max(1, S.fill.durationMs * k), delay: item.fillAt * k, easing: easing ?? ease(S.fill.easing), fill: "backwards" }), g);
  }
  if (dir && surface === "pane" && CFG.pane.enterTravelPx) {
    own(unit.animate([{ transform: `translateY(${dir * CFG.pane.enterTravelPx}px)` }, { transform: "none" }], { duration: Math.max(1, (S.fill.durationMs + 120) * k), delay: item.fillAt * k, easing: ease("decel"), fill: "backwards" }), g);
  }
  // Everything inside appears once the box is filled; media and text refine it.
  const contentAt = item.fillEnd * k;
  const kids = [...unit.children].filter((kid) => !SKIP_TAGS.has(kid.tagName) && shown(kid, unit, vis));
  kids.forEach((kid) => own(kid.animate([{ opacity: 0 }, { opacity: 1 }], { duration: Math.max(1, T.kidsFadeMs * k), delay: contentAt, fill: "backwards" }), g));
  if (!kids.length && !box) own(unit.animate([{ opacity: 0 }, { opacity: 1 }], { duration: Math.max(1, T.kidsFadeMs * k), delay: contentAt, fill: "backwards" }), g);
  item.media.forEach(({ m, at: t }) => scheduleMedia(m, t * k, M, k, layer, g));
  const now = performance.now();
  item.blocks.forEach((b) => {
    if (b.kind === "none") return;
    if (b.kind === "long" && b.style === "pixelate") {
      own(b.el.animate(pixelTextFrames(b.px, b.steps), { duration: Math.max(1, b.ms * k), delay: b.at * k, fill: "backwards" }), g);
      return;
    }
    if (b.kind === "long") {
      const frames = b.style === "wipe"
        ? [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }]
        : b.style === "none" ? [{ opacity: 0 }, { opacity: 0, offset: 0.999 }, { opacity: 1 }]
        : [{ opacity: 0, transform: `translateY(${b.style === "rise" ? b.rise : 0}px)` }, { opacity: 1, transform: "none" }];
      own(b.el.animate(frames, { duration: Math.max(1, b.ms * k), delay: b.at * k, easing: ease("decel"), fill: "backwards" }), g);
      return;
    }
    own(b.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: Math.max(1, 40 * k), delay: b.at * k, fill: "backwards" }), g);
    runText({ el: b.el, unit, T: b.T, segs: b.segs, flat: b.segs.flatMap((x) => x.chars), plan: b.plan, start: now + b.at * k, k, g, tick: -1e9, cache: [], active: false });
  });
}

// Units on screen play now; below the fold, pane units wait for the viewport.
let io = null;
function watch(unit) {
  if (!("IntersectionObserver" in window) || CFG.pane.belowFold === "instant") return;
  io ??= new IntersectionObserver((entries) => {
    const batch = entries.filter((e) => e.isIntersecting).map((e) => e.target);
    if (!batch.length) return;
    batch.forEach((u) => { io.unobserve(u); u.classList.remove("mo-wait"); });
    if (still() || !legacyEnabled()) return;
    const plan = planSurface("pane", batch, 0, 0.3);
    const k = 1 / Math.max(0.05, CFG.global.speed) / (CFG.pane.belowFold === "fast" ? 2 : 1);
    plan.items.forEach((it) => execute(it, k, "scroll", 0));
    busy(plan.end * k);
  }, { rootMargin: "0px" });
  unit.classList.add("mo-wait");
  io.observe(unit);
}
function reset() {
  finishAll();
  io?.disconnect();
  io = null;
  document.querySelectorAll(".mo-wait").forEach((el) => el.classList.remove("mo-wait"));
  document.querySelectorAll(".mo-layer").forEach((el) => el.remove());
}

/** Plays the IN: the rail and/or the pane, with the sequencing in `global`. */
function run({ rail = false, pane = false, nav = false, dir = 0 } = {}) {
  reset();
  if (still() || !legacyEnabled() || (!rail && !pane)) return 0;
  const G = CFG.global;
  seedRng(G.seed);
  const side = document.getElementById("side");
  const railUnits = rail ? unitsOf(side, RAIL_UNIT).filter((u) => inView(u.getBoundingClientRect())) : [];
  const paneUnits = [];
  if (pane) {
    unitsOf(document.getElementById("main"), PANE_UNIT).forEach((u) => {
      if (inView(u.getBoundingClientRect())) paneUnits.push(u);
      else watch(u);
    });
  }
  const base = G.staggerBaseMs;
  let railPlan = { items: [], end: 0 }, panePlan = { items: [], end: 0 };
  const both = railUnits.length && paneUnits.length;
  if (G.relation === "pane-then-rail" && both) {
    panePlan = planSurface("pane", paneUnits, base);
    railPlan = planSurface("rail", railUnits, panePlan.end + G.offsetMs);
  } else if (G.relation === "rail-then-pane" && both) {
    railPlan = planSurface("rail", railUnits, base);
    panePlan = planSurface("pane", paneUnits, railPlan.end + G.offsetMs);
  } else {
    const off = G.relation === "overlap" && both ? G.offsetMs : 0;
    railPlan = planSurface("rail", railUnits, base + Math.max(0, -off));
    panePlan = planSurface("pane", paneUnits, base + Math.max(0, off));
  }
  const end = Math.max(railPlan.end, panePlan.end);
  let k = 1 / Math.max(0.05, G.speed * (nav ? G.navSpeed : 1));
  const cap = nav ? G.navCapMs : G.capMs;
  if (cap > 0 && end * k > cap) k = cap / end;
  railPlan.items.forEach((it) => execute(it, k, "main", 0));
  panePlan.items.forEach((it) => execute(it, k, "main", dir));
  busy(end * k, railPlan.items.length > 0);
  return end * k;
}

// ── OUT: the units on screen leave while the next page is fetched ──────────
function paneOut(dir) {
  const O = CFG.out;
  if (O.style === "none") return Promise.resolve();
  const units = unitsOf(document.getElementById("main"), PANE_UNIT).filter((u) => inView(u.getBoundingClientRect())).slice(0, CFG.pane.maxUnits);
  const rects = units.map((u) => u.getBoundingClientRect());
  seedRng(0);
  const rk = ranks(O.order, rects);
  const k = 1 / Math.max(0.05, CFG.global.speed);
  const dur = Math.max(1, O.durationMs * k), easing = ease(O.easing);
  const layer = layerFor("pane");
  const done = [];
  const hide = (el, delay, d, frames) => {
    const a = own(el.animate(frames ?? [{ opacity: 1 }, { opacity: 0 }], { duration: Math.max(1, d), delay, easing, fill: "forwards" }));
    done.push(a.finished.catch(() => {}));
  };
  units.forEach((u, i) => {
    const d = rk[i] * O.staggerMs * k;
    const kids = [...u.children].filter((kid) => !SKIP_TAGS.has(kid.tagName));
    const box = hasBox(u);
    switch (O.style) {
      case "fade": hide(u, d, dur); break;
      case "outline-vanish": case "reverse": {
        const o = { ...CFG.pane.outline, style: CFG.pane.outline.style === "none" ? "trace" : CFG.pane.outline.style, drawMs: O.durationMs * 0.5 };
        kids.forEach((kid) => hide(kid, d, dur * 0.3));
        if (O.style === "reverse" && box) {
          const { frames } = fillFrames(CFG.pane.fill, u, rects[i].width, rects[i].height);
          hide(u, d + dur * 0.2, dur * 0.45, frames.slice().reverse().map((f) => {
            const r = { ...f };
            if (r.offset === undefined) delete r.offset; else r.offset = 1 - r.offset;
            return r;
          }));
        } else hide(u, d + dur * 0.1, dur * 0.4);
        if (box || o.unboxed === "outline") {
          const svg = drawFrame(layer, rects[i], u, o, d + dur * 0.5, k, "main", { undraw: true });
          if (svg) done.push(Promise.allSettled(svg.getAnimations({ subtree: true }).map((a) => a.finished)));
        }
        break;
      }
      case "collapse": default:
        kids.forEach((kid) => hide(kid, d, dur * 0.35));
        hide(u, d + dur * 0.15, dur * 0.85, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateY(${-dir * O.travelPx}px) scale(${O.scale})` }]);
    }
  });
  return Promise.all(done);
}
function cancelOut() {
  anims.forEach((a) => a.cancel());
  anims.clear();
  document.querySelectorAll(".mo-layer").forEach((el) => el.remove());
}
const paneOnNav = () => ["every-navigation", "both"].includes(CFG.global.runOn);
const railOnNav = () => CFG.rail.playOn === "always";

// ── Wiring (called from site.js) ────────────────────────────────────────────
// `dir` is +1 when the destination sits lower in the rail than the page you
// are on, −1 when higher, 0 otherwise (site.js's Direction).
export function onBeforePreparation(event, dir) {
  finishAll();
  if (still() || !legacyEnabled() || !paneOnNav()) return;
  const out = paneOut(dir);
  const load = event.loader;
  event.loader = async () => {
    try { await Promise.all([load(), out]); } catch (e) { cancelOut(); throw e; }
  };
}
export function onAfterSwap(dir) {
  reset();
  if (still() || !legacyEnabled()) return;
  run({ pane: paneOnNav(), rail: railOnNav(), nav: true, dir });
}
// The first paint. Sidebar.astro's inline script set html[data-mo-intro]
// (the pane will play) and/or html[data-mo-rail] (the rail will play) and
// CSS keeps those surfaces transparent until this runs (with a timeout of
// its own, in case this never does). Waits briefly for the web fonts, so the
// frames are drawn around boxes that will not change size.
let introDone = Promise.resolve();
/** Resolves once the first paint's sequence (if any) and anything playing now has settled. */
export function whenSettled() {
  return introDone.then(() => new Promise((resolve) => {
    const tick = () => (remainingMs() > 0 ? setTimeout(tick, Math.min(remainingMs() + 20, 400)) : resolve());
    tick();
  }));
}
export function intro() {
  introDone = introPlay();
  return introDone;
}
async function introPlay() {
  const pane = html.hasAttribute("data-mo-intro"), rail = html.hasAttribute("data-mo-rail");
  const clear = () => { html.removeAttribute("data-mo-intro"); html.removeAttribute("data-mo-rail"); };
  if (!pane && !rail) return;
  if (still() || !legacyEnabled()) return clear();
  try { await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 350))]); } catch (e) {}
  run({ pane, rail });
  clear();
}
/** The lab: replay the first load, or a navigation, on the current page. */
export async function replay(kind = "load") {
  finishAll();
  if (still() || !legacyEnabled()) return 0;
  if (kind === "nav") {
    if (paneOnNav()) await paneOut(0);
    cancelOut();
    return run({ pane: paneOnNav(), rail: railOnNav(), nav: true });
  }
  return run({ pane: true, rail: CFG.rail.playOn !== "never" });
}

let bound = false;
export function bindMotion() {
  if (bound) return;
  bound = true;
  const inLab = (e) => e.target?.closest?.(".mlab");
  // Input always wins: the first press, key or wheel finishes what is playing.
  document.addEventListener("pointerdown", (e) => {
    lastPointer = { x: e.clientX, y: e.clientY };
    if (!inLab(e) && busyNow()) finishAll();
  }, { capture: true, passive: true });
  document.addEventListener("keydown", (e) => { if (!inLab(e) && busyNow()) finishAll(); }, { capture: true });
  document.addEventListener("wheel", (e) => { if (!inLab(e) && busyNow()) finishAll("main"); }, { capture: true, passive: true });
  document.addEventListener("copy", () => { if (busyNow()) finishAll(); }, { capture: true });
  let w = window.innerWidth;
  window.addEventListener("resize", () => { if (window.innerWidth !== w && busyNow()) finishAll(); w = window.innerWidth; });
  // A page restored from the back/forward cache after a full navigation that
  // began as a client-side one must not come back with its cells gone.
  window.addEventListener("pageshow", (e) => { if (e.persisted) cancelOut(); });
}
