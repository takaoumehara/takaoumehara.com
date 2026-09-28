// The Motion Lab: a panel for tuning the loading choreography live
// (src/scripts/motion.js) and exporting the result as JSON.
//
// Open it with ?lab=1 on any page (or visit /lab/motion); it stays open in
// the tab across navigations until ?lab=0 or its × button. It is loaded as a
// separate chunk, only then (site.js), so normal visitors never download it.
//
// Every parameter of src/data/motion.json has a control here. The working
// config is kept in localStorage ("tu-motion-lab") and, while the lab is open,
// it drives every real navigation too. "Copy JSON" copies the full resolved
// config: pasting it over src/data/motion.json makes it the site's default.

import * as motion from "./motion.js";
import "../styles/motion-lab.css";

// ── Presets: partial configs merged over the defaults ──────────────────────
// Named after where they come from when they reuse an earlier piece of the
// site (docs/motion-archive.md).
const both = (o) => ({ rail: o, pane: o });
const deep = (...parts) => {
  const out = {};
  const put = (dst, src) => {
    for (const [k, v] of Object.entries(src)) {
      if (v && typeof v === "object" && !Array.isArray(v)) put((dst[k] ??= {}), v);
      else dst[k] = v;
    }
  };
  parts.forEach((p) => put(out, p));
  return out;
};
export const PRESETS = {
  Default: {},
  Blueprint: deep(
    { global: { speed: 0.85, capMs: 5200 }, rail: { order: "top-down" }, pane: { order: "by-column", spreadMs: 700 } },
    both({ outline: { style: "trace", color: "blue", drawMs: 1000, easing: "standard", lingerMs: 520, fadeOutMs: 520 }, fill: { style: "wipe-up", durationMs: 520, afterOutlineMs: 140, easing: "expo-out" } }),
    { text: { mode: "typewriter", cursor: false, cps: 60, maxLineMs: 1200 }, media: { mode: "wipe", durationMs: 520, easing: "expo-out" } },
  ),
  // Viewfinder: from index-console.html's press-frame edge draw-in.
  Viewfinder: deep(
    both({ outline: { style: "viewfinder", color: "ink", drawMs: 700, easing: "console", lingerMs: 200 }, fill: { style: "mask-reveal", durationMs: 620, easing: "console", fromXPx: -24, afterOutlineMs: -120 } }),
    { text: { mode: "scramble-typewriter", cursor: false }, media: { mode: "fade", durationMs: 520, easing: "console" } },
  ),
  Terminal: deep(
    { global: { capMs: 5500 }, rail: { order: "top-down" }, pane: { order: "reading" } },
    both({ outline: { style: "march", color: "ink-2", dashPx: 2, gapPx: 3, drawMs: 600, lingerMs: 80 }, fill: { style: "scan", steps: 8, durationMs: 420 } }),
    { text: { mode: "typewriter", glyphs: "latin", cps: 38, cursor: true, cursorChar: "█", cursorBlinkMs: 380, untyped: "hide", maxLineMs: 2200, lineStaggerMs: 140 },
      media: { mode: "scanline", steps: 8, durationMs: 480, easing: "linear" } },
  ),
  Samurai: deep(
    { global: { capMs: 5000 }, pane: { order: "random", randomDelayMs: [0, 700] } },
    both({ outline: { style: "corners", color: "ink", drawMs: 480, cornerPx: 14 }, fill: { style: "pixel-step", steps: 6, durationMs: 300 } }),
    { text: { mode: "scramble", glyphs: "auto", holdMs: 200, resolveCps: 60, framesPerChar: 3 },
      media: { mode: "pop", randomDelayMs: [200, 1200], label: { mode: "always", minVisibleMs: 700, text: "NOW LOADING", minWidthPx: 120 } },
      out: { style: "outline-vanish", durationMs: 340 } },
  ),
  Decode: deep(
    { global: { capMs: 5500 } },
    both({ outline: { style: "sides", drawMs: 560 } }),
    { text: { mode: "scramble", glyphs: "symbols", jpGlyphs: "mixed", framesPerChar: 10, frameMs: 45, holdMs: 800, resolveCps: 28, direction: "random", maxLineMs: 2600, cursor: false } },
  ),
  Paper: deep(
    { rail: { order: "top-down", spreadMs: 900 }, pane: { order: "top-down", spreadMs: 900, randomDelayMs: [0, 200] } },
    both({ outline: { style: "none" }, fill: { style: "fade", durationMs: 700, easing: "ease-out" } }),
    { text: { mode: "fade", long: "fade", longMs: 700 }, media: { mode: "fade", durationMs: 700, easing: "ease-out", label: { mode: "off" } }, out: { style: "fade", durationMs: 360 } },
  ),
  // Skeleton: grey pulse placeholders, after the Amazon Fire TV prototype's
  // loading screen (public/projects/amazon-firetv).
  Skeleton: deep(
    both({ outline: { style: "none" }, fill: { style: "skeleton", durationMs: 1100, easing: "ease-in-out" } }),
    { text: { mode: "scramble", glyphs: "blocks", jpGlyphs: "same", holdMs: 400, resolveCps: 60, cursor: false },
      media: { mode: "fade", durationMs: 500, label: { mode: "always", text: "LOADING", minVisibleMs: 500 } } },
  ),
  Iris: deep(
    { rail: { order: "center-out" }, pane: { order: "spiral", spreadMs: 900 } },
    both({ outline: { style: "midpoints", drawMs: 560 }, fill: { style: "iris", durationMs: 520, easing: "expo-out" } }),
    { text: { direction: "center-out" }, media: { mode: "scale", durationMs: 520, easing: "expo-out" } },
  ),
  Kanji: deep(
    both({ outline: { style: "corners", color: "ink" } }),
    { text: { mode: "scramble-typewriter", glyphs: "katakana", jpGlyphs: "kanji", direction: "center-out", cursor: false } },
  ),
  // Lens: the retired boot-lens blur intro (commit 1eccef2); the only blur.
  "Lens (blur)": deep(
    both({ outline: { style: "none" }, fill: { style: "lens", durationMs: 640, easing: "decel" } }),
    { text: { mode: "fade", long: "fade" }, media: { mode: "fade" } },
  ),
  Instant: deep(
    { global: { speed: 6, capMs: 500, navCapMs: 300 } },
    both({ outline: { style: "none" }, fill: { style: "fade", durationMs: 120 } }),
    { text: { mode: "none" }, media: { mode: "fade", durationMs: 120, randomDelayMs: [0, 0], label: { mode: "off" } }, out: { style: "fade", durationMs: 80, staggerMs: 0 } },
  ),
};

// ── Schema: one control per parameter ──────────────────────────────────────
const BODY_MODES = ["same", "scramble-typewriter", "scramble", "typewriter", "rise", "fade", "wipe", "pixelate", "none"];
const BODY = ["default", ...BODY_MODES];
const ORDERS = ["random", "top-down", "bottom-up", "left-right", "reading", "by-column", "spiral", "center-out", "edges-in", "distance-from-click", "dom"];
const OUTLINES = ["trace", "sides", "viewfinder", "corners", "midpoints", "march", "none"];
const FILLS = ["fade", "wipe-left", "wipe-right", "wipe-up", "wipe-down", "iris", "pixel-step", "scan", "mask-reveal", "skeleton", "lens", "none"];
const COLORS = ["line-2", "line", "ink", "ink-2", "blue", "live"];
const r = (key, label, min, max, step = 10, unit = "ms", o = {}) => ({ key, label, type: "range", min, max, step, unit, ...o });
const s = (key, label, options, o = {}) => ({ key, label, type: "select", options, ...o });
const b = (key, label, o = {}) => ({ key, label, type: "toggle", ...o });
const p = (key, label, min, max, step = 10, unit = "ms", o = {}) => ({ key, label, type: "pair", min, max, step, unit, ...o });
const e = (key, label) => ({ key, label, type: "easing" });
const t = (key, label, o = {}) => ({ key, label, type: "text", ...o });
const c = (key, label) => ({ key, label, type: "color" });
const outlineFields = (pre) => [
  s(`${pre}.outline.style`, "Draw style", OUTLINES),
  b(`${pre}.outline.reverse`, "Counter-clockwise"),
  r(`${pre}.outline.drawMs`, "Draw duration", 0, 3000),
  e(`${pre}.outline.easing`, "Draw easing"),
  r(`${pre}.outline.strokeWidth`, "Stroke width", 0.5, 4, 0.5, "px"),
  c(`${pre}.outline.color`, "Stroke colour"),
  r(`${pre}.outline.jitterPx`, "Jitter", 0, 20, 1, "px", { rand: [0, 6] }),
  r(`${pre}.outline.cornerPx`, "Corner bracket", 0, 60, 1, "px"),
  r(`${pre}.outline.dashPx`, "March dash", 1, 20, 1, "px"),
  r(`${pre}.outline.gapPx`, "March gap", 1, 20, 1, "px"),
  r(`${pre}.outline.lingerMs`, "Linger after fill", 0, 3000, 10, "ms", { rand: [0, 800] }),
  r(`${pre}.outline.fadeOutMs`, "Fade out", 0, 2000, 10, "ms", { rand: [80, 700] }),
  s(`${pre}.outline.unboxed`, "Boxes without fill", ["skip", "outline"]),
];
const fillFields = (pre) => [
  s(`${pre}.fill.style`, "Fill style", FILLS, { randOptions: FILLS.filter((f) => f !== "lens" && f !== "none") }),
  r(`${pre}.fill.durationMs`, "Fill duration", 0, 2000, 10, "ms", { rand: [120, 900] }),
  r(`${pre}.fill.afterOutlineMs`, "Delay after outline", -1000, 1500, 10, "ms", { rand: [-200, 300] }),
  e(`${pre}.fill.easing`, "Fill easing"),
  r(`${pre}.fill.steps`, "Steps (pixel/scan)", 1, 24, 1, "", { rand: [3, 12] }),
  r(`${pre}.fill.fromXPx`, "Mask from X", -80, 80, 1, "px"),
  r(`${pre}.fill.fromYPx`, "Mask from Y", -80, 80, 1, "px"),
];
export const SCHEMA = [
  { id: "global", label: "Global", fields: [
    b("global.enabled", "Enabled", { norand: true }),
    r("global.speed", "Speed", 0.1, 4, 0.05, "×", { rand: [0.6, 1.6] }),
    s("global.runOn", "Pane plays on", ["both", "first-load", "every-navigation"], { norand: true }),
    b("global.respectReducedMotion", "Respect reduced motion", { locked: true, norand: true }),
    r("global.seed", "Random seed (0 = new each time)", 0, 9999, 1, "", { norand: true }),
    s("global.relation", "Rail ↔ pane", ["overlap", "simultaneous", "rail-then-pane", "pane-then-rail"]),
    r("global.offsetMs", "Overlap offset (pane after rail)", -1500, 1500, 10, "ms", { rand: [-400, 600] }),
    r("global.staggerBaseMs", "Base delay", 0, 1500, 10, "ms", { rand: [0, 200] }),
    r("global.capMs", "Total cap, first load (0 = none)", 0, 10000, 100, "ms", { norand: true }),
    r("global.navSpeed", "Navigation speed", 0.25, 5, 0.05, "×", { rand: [1.4, 2.6] }),
    r("global.navCapMs", "Total cap, navigation (0 = none)", 0, 5000, 50, "ms", { norand: true }),
  ] },
  { id: "rail", label: "Rail (left)", fields: [
    s("rail.playOn", "Rail plays on", ["session-first", "every-load", "always", "never"], { norand: true }),
    s("rail.order", "Order", ORDERS),
    r("rail.spreadMs", "Spread across order", 0, 3000, 10, "ms", { rand: [200, 1400] }),
    p("rail.randomDelayMs", "Per-box random delay", 0, 2000, 10, "ms", { rand: [0, 700] }),
    r("rail.maxUnits", "Max boxes", 1, 60, 1, ""),
    s("rail.body", "Body text (default = Body group)", BODY),
  ] },
  { id: "rail-outline", label: "Rail · outline", fields: outlineFields("rail") },
  { id: "rail-fill", label: "Rail · fill", fields: fillFields("rail") },
  { id: "pane", label: "Pane (right)", fields: [
    s("pane.order", "Order", ORDERS),
    r("pane.spreadMs", "Spread across order", 0, 3000, 10, "ms", { rand: [200, 1400] }),
    p("pane.randomDelayMs", "Per-box random delay", 0, 2000, 10, "ms", { rand: [0, 800] }),
    r("pane.maxUnits", "Max boxes", 1, 80, 1, ""),
    s("pane.belowFold", "Below the fold", ["play", "fast", "instant"]),
    r("pane.enterTravelPx", "Travel on navigation", 0, 40, 1, "px", { rand: [0, 12] }),
    s("pane.body", "Body text (default = Body group)", BODY),
  ] },
  { id: "pane-outline", label: "Pane · outline", fields: outlineFields("pane") },
  { id: "pane-fill", label: "Pane · fill", fields: fillFields("pane") },
  { id: "text", label: "Text · headers (headings, labels)", fields: [
    s("text.mode", "Mode", ["scramble-typewriter", "scramble", "typewriter", "fade", "none"], { randOptions: ["scramble-typewriter", "scramble", "typewriter"] }),
    s("text.glyphs", "Glyph set", ["auto", "latin", "digits", "symbols", "katakana", "kanji", "binary", "blocks", "hex", "custom"]),
    t("text.customGlyphs", "Custom glyphs", { norand: true }),
    s("text.jpGlyphs", "Glyphs for Japanese", ["katakana", "kanji", "mixed", "same"]),
    b("text.matchCase", "Match case"),
    r("text.symbolRate", "Symbol rate (auto)", 0, 1, 0.05, ""),
    r("text.cps", "Typing speed", 2, 240, 1, "cps", { rand: [20, 90] }),
    r("text.frameMs", "Glyph flicker", 16, 300, 1, "ms", { rand: [30, 120] }),
    r("text.framesPerChar", "Scramble frames per char", 0, 40, 1, "", { rand: [1, 12] }),
    s("text.settle", "Settle", ["sweep", "lag"]),
    r("text.holdMs", "Random hold before settling", 0, 3000, 10, "ms", { rand: [0, 700] }),
    r("text.resolveCps", "Settle speed", 2, 400, 1, "cps", { rand: [30, 140] }),
    s("text.direction", "Reveal direction", ["ltr", "rtl", "random", "center-out"]),
    s("text.untyped", "Untyped characters", ["hide", "space", "dot", "underscore", "block"]),
    b("text.cursor", "Cursor"),
    t("text.cursorChar", "Cursor character", { norand: true, maxlength: 2 }),
    r("text.cursorBlinkMs", "Cursor blink", 0, 1200, 10, "ms"),
    r("text.maxLineMs", "Max duration per line", 100, 6000, 50, "ms", { rand: [600, 2400] }),
    r("text.lineStaggerMs", "Stagger between lines", 0, 600, 5, "ms", { rand: [0, 200] }),
    r("text.maxStaggered", "Lines staggered (max)", 0, 30, 1, ""),
    r("text.afterFillMs", "Delay after fill", -500, 1500, 10, "ms", { rand: [-100, 300] }),
    p("text.randomDelayMs", "Per-line random delay", 0, 2000, 10, "ms", { rand: [0, 400] }),
    r("text.kidsFadeMs", "Content fade-in", 0, 1000, 10, "ms", { rand: [40, 300] }),
    b("text.headings", "Type headings"),
    r("text.headingMaxChars", "Heading max chars", 0, 400, 1, "chars"),
    b("text.labels", "Type mono labels"),
    r("text.shortMaxChars", "Short line max chars", 0, 400, 1, "chars", { rand: [40, 140] }),
    s("text.long", "Too long or off-screen", ["rise", "fade", "wipe", "pixelate", "none"]),
    r("text.longMs", "Too long / off-screen duration", 0, 2000, 10, "ms", { rand: [200, 900] }),
    r("text.longRisePx", "Too long / off-screen rise", 0, 40, 1, "px", { rand: [0, 12] }),
    r("text.longPixelPx", "Too long / off-screen pixel size", 2, 32, 1, "px", { rand: [6, 16] }),
    r("text.longSteps", "Too long / off-screen pixel steps", 1, 8, 1, "", { rand: [2, 6] }),
    b("text.clip", "Clip overflow while typing"),
  ] },
  { id: "body", label: "Body text", fields: [
    s("body.mode", "Mode (same = like the headers)", BODY_MODES),
    s("body.relation", "Starts", ["after-header", "during-header", "with-header", "independent"]),
    r("body.headerPct", "During header: start at", 0, 100, 1, "%", { rand: [20, 90] }),
    r("body.offsetMs", "Offset from that point", -1500, 1500, 10, "ms", { rand: [-200, 400] }),
    r("body.speed", "Body speed", 0.1, 4, 0.05, "×", { rand: [0.6, 1.8] }),
    s("body.glyphs", "Glyph set", ["auto", "latin", "digits", "symbols", "katakana", "kanji", "binary", "blocks", "hex", "custom"]),
    t("body.customGlyphs", "Custom glyphs", { norand: true }),
    s("body.jpGlyphs", "Glyphs for Japanese", ["katakana", "kanji", "mixed", "same"]),
    b("body.matchCase", "Match case"),
    r("body.symbolRate", "Symbol rate (auto)", 0, 1, 0.05, ""),
    r("body.cps", "Typing speed", 2, 240, 1, "cps", { rand: [20, 120] }),
    r("body.frameMs", "Glyph flicker", 16, 300, 1, "ms", { rand: [30, 120] }),
    r("body.framesPerChar", "Scramble frames per char", 0, 40, 1, "", { rand: [1, 12] }),
    s("body.settle", "Settle", ["sweep", "lag"]),
    r("body.holdMs", "Random hold before settling", 0, 3000, 10, "ms", { rand: [0, 700] }),
    r("body.resolveCps", "Settle speed", 2, 400, 1, "cps", { rand: [30, 200] }),
    s("body.direction", "Reveal direction", ["ltr", "rtl", "random", "center-out"]),
    s("body.untyped", "Untyped characters", ["hide", "space", "dot", "underscore", "block"]),
    b("body.cursor", "Cursor"),
    t("body.cursorChar", "Cursor character", { norand: true, maxlength: 2 }),
    r("body.cursorBlinkMs", "Cursor blink", 0, 1200, 10, "ms"),
    r("body.maxLineMs", "Max duration per paragraph", 100, 6000, 50, "ms", { rand: [600, 2400] }),
    r("body.lineStaggerMs", "Stagger between paragraphs", 0, 600, 5, "ms", { rand: [0, 200] }),
    r("body.maxStaggered", "Paragraphs staggered (max)", 0, 30, 1, ""),
    p("body.randomDelayMs", "Per-paragraph random delay", 0, 2000, 10, "ms", { rand: [0, 400] }),
    b("body.clip", "Clip overflow while typing"),
    r("body.durationMs", "Duration (rise/fade/wipe/pixelate)", 0, 3000, 10, "ms", { rand: [200, 900] }),
    r("body.risePx", "Rise distance", 0, 40, 1, "px", { rand: [0, 12] }),
    r("body.pixelPx", "Pixel size (pixelate)", 2, 32, 1, "px", { rand: [6, 16] }),
    r("body.pixelSteps", "Pixelate steps", 1, 8, 1, "", { rand: [2, 6] }),
  ] },
  { id: "media", label: "Media (images, thumbnails)", fields: [
    s("media.mode", "Mode", ["pop", "pixelate", "wipe", "fade", "scale", "scanline", "none"], { randOptions: ["pop", "pixelate", "wipe", "fade", "scale", "scanline"] }),
    r("media.durationMs", "Duration", 0, 2000, 10, "ms", { rand: [160, 900] }),
    e("media.easing", "Easing"),
    r("media.steps", "Steps (pixelate/scanline)", 1, 12, 1, "", { rand: [3, 8] }),
    r("media.afterFillMs", "Delay after fill", -500, 2000, 10, "ms", { rand: [-100, 400] }),
    p("media.randomDelayMs", "Random delay", 0, 3000, 10, "ms", { rand: [0, 1400] }),
    r("media.minSizePx", "Smallest media animated", 0, 200, 1, "px"),
  ] },
  { id: "label", label: "Media · NOW LOADING", fields: [
    s("media.label.mode", "Label", ["slow", "always", "off"]),
    t("media.label.text", "Label text", { norand: true, maxlength: 40 }),
    r("media.label.dotMs", "Dot cadence (0 = no dots)", 0, 2000, 10, "ms"),
    r("media.label.minVisibleMs", "Min visible time", 0, 3000, 10, "ms", { rand: [0, 900] }),
    r("media.label.maxWaitMs", "Max wait for a slow image", 0, 6000, 50, "ms", { norand: true }),
    r("media.label.minWidthPx", "Only over media wider than", 0, 600, 1, "px"),
  ] },
  { id: "out", label: "Out (leaving a page)", fields: [
    s("out.style", "Style", ["collapse", "fade", "outline-vanish", "reverse", "none"], { randOptions: ["collapse", "fade", "outline-vanish", "reverse"] }),
    r("out.durationMs", "Duration", 0, 1500, 10, "ms", { rand: [160, 520] }),
    r("out.staggerMs", "Stagger", 0, 1000, 10, "ms", { rand: [0, 300] }),
    s("out.order", "Order", ORDERS),
    e("out.easing", "Easing"),
    r("out.scale", "Collapse scale", 0.5, 1.2, 0.01, "×", { rand: [0.9, 1] }),
    r("out.travelPx", "Travel (± direction)", -60, 60, 1, "px", { rand: [-16, 16] }),
  ] },
];
const EASE_NAMES = Object.keys(motion.EASINGS);

// ── State ───────────────────────────────────────────────────────────────────
const UI_KEY = "tu-motion-lab-ui";
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (err) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (err) {} },
};
let cfg = motion.getConfig();
let ui = { dock: "right", x: 0, y: 0, collapsed: false, open: ["global"], autoReplay: true, ...(store.get(UI_KEY) || {}) };
const getAt = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
const setAt = (obj, path, v) => {
  const ks = path.split(".");
  const last = ks.pop();
  const o = ks.reduce((acc, k) => (acc[k] ??= {}), obj);
  o[last] = v;
};
const baseName = (n) => String(n || "Default").replace(/ \(edited\)$/, "");

let panel = null, statusEl = null, saveTimer = 0, replayTimer = 0;
const saveUi = () => store.set(UI_KEY, ui);
function commit({ edited = true, replay = true } = {}) {
  if (edited) cfg.preset = `${baseName(cfg.preset)} (edited)`;
  cfg = motion.setConfig(cfg);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => store.set(motion.LAB_KEY, cfg), 120);
  const sel = panel?.querySelector("#mlab-preset");
  if (sel) sel.value = baseName(cfg.preset) in PRESETS ? baseName(cfg.preset) : "";
  const tag = panel?.querySelector(".mlab-edited");
  if (tag) tag.hidden = !/\(edited\)$/.test(cfg.preset);
  if (replay && ui.autoReplay) {
    clearTimeout(replayTimer);
    replayTimer = setTimeout(() => doReplay("load"), 450);
  }
}
function say(msg) { if (statusEl) statusEl.textContent = msg; }
async function doReplay(kind) {
  if (motion.isStill()) { say("Reduced motion is on: nothing plays."); return; }
  const ms = await motion.replay(kind);
  say(`${kind === "nav" ? "Navigation" : "First load"}: ${(ms / 1000).toFixed(2)} s`);
}

// ── Controls ────────────────────────────────────────────────────────────────
let uid = 0;
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  kids.flat().forEach((kid) => kid && n.append(kid));
  return n;
};
const fmt = (v, step) => (step < 1 ? Number(v).toFixed(String(step).split(".")[1]?.length ?? 2) : String(Math.round(v)));
const updaters = [];
function field(f) {
  const id = `mlab-f${++uid}`;
  const row = el("div", { class: `mlab-f mlab-f-${f.type}` });
  const label = el("label", { for: id, text: f.label });
  const keyTip = el("span", { class: "mlab-key", text: f.key.split(".").slice(-1)[0], "aria-hidden": "true" });
  row.append(el("div", { class: "mlab-lab" }, label, keyTip));
  const set = (v) => { setAt(cfg, f.key, v); commit(); };
  if (f.type === "range") {
    const range = el("input", { type: "range", id, min: f.min, max: f.max, step: f.step });
    const num = el("input", { type: "number", min: f.min, max: f.max, step: f.step, "aria-label": `${f.label} value${f.unit ? ` (${f.unit})` : ""}`, class: "mlab-num" });
    const unit = el("span", { class: "mlab-unit", text: f.unit, "aria-hidden": "true" });
    const sync = () => { const v = getAt(cfg, f.key); range.value = v; num.value = fmt(v, f.step); };
    range.addEventListener("input", () => { num.value = fmt(range.value, f.step); set(Number(range.value)); });
    num.addEventListener("change", () => { const v = Number(num.value); if (Number.isFinite(v)) { range.value = v; set(v); } else sync(); });
    row.append(el("div", { class: "mlab-ctl" }, range, num, unit));
    updaters.push(sync);
  } else if (f.type === "pair") {
    const mk = (i, name) => {
      const rid = i === 0 ? id : `${id}b`;
      const range = el("input", { type: "range", id: rid, min: f.min, max: f.max, step: f.step, "aria-label": `${f.label} ${name}` });
      const num = el("input", { type: "number", min: f.min, max: f.max, step: f.step, "aria-label": `${f.label} ${name} value (${f.unit})`, class: "mlab-num" });
      const put = (v) => { const arr = getAt(cfg, f.key).slice(); arr[i] = v; set(arr); };
      range.addEventListener("input", () => { num.value = range.value; put(Number(range.value)); });
      num.addEventListener("change", () => { const v = Number(num.value); if (Number.isFinite(v)) { range.value = v; put(v); } });
      updaters.push(() => { const v = getAt(cfg, f.key)[i]; range.value = v; num.value = fmt(v, f.step); });
      return el("div", { class: "mlab-ctl" }, el("span", { class: "mlab-minmax", text: name, "aria-hidden": "true" }), range, num, el("span", { class: "mlab-unit", text: f.unit, "aria-hidden": "true" }));
    };
    label.textContent = `${f.label} (min–max)`;
    row.append(mk(0, "min"), mk(1, "max"));
  } else if (f.type === "select" || f.type === "color") {
    const opts = f.type === "color" ? COLORS : f.options;
    const sel = el("select", { id }, opts.map((o) => el("option", { value: o, text: f.type === "color" ? `--pr-${o}` : o })));
    const sw = f.type === "color" ? el("span", { class: "mlab-swatch", "aria-hidden": "true" }) : null;
    sel.addEventListener("change", () => { set(sel.value); if (sw) sw.style.background = `var(--pr-${sel.value})`; });
    row.append(el("div", { class: "mlab-ctl" }, sw, sel));
    updaters.push(() => { sel.value = getAt(cfg, f.key); if (sw) sw.style.background = `var(--pr-${sel.value})`; });
  } else if (f.type === "toggle") {
    const box = el("input", { type: "checkbox", id, role: "switch", class: "mlab-switch", disabled: f.locked });
    box.addEventListener("change", () => set(box.checked));
    row.append(el("div", { class: "mlab-ctl" }, box, f.locked ? el("span", { class: "mlab-unit", text: "always on" }) : null));
    updaters.push(() => { box.checked = Boolean(getAt(cfg, f.key)); });
  } else if (f.type === "easing") {
    const sel = el("select", { id }, [...EASE_NAMES, "custom"].map((o) => el("option", { value: o, text: o === "custom" ? "custom…" : o })));
    const custom = el("input", { type: "text", class: "mlab-text", "aria-label": `${f.label}: custom CSS easing`, placeholder: "cubic-bezier(.2,.8,.2,1)", spellcheck: "false" });
    const sync = () => {
      const v = getAt(cfg, f.key);
      const named = EASE_NAMES.includes(v);
      sel.value = named ? v : "custom";
      custom.hidden = named;
      if (!named) custom.value = v;
    };
    sel.addEventListener("change", () => {
      if (sel.value === "custom") { custom.hidden = false; custom.value = custom.value || motion.EASINGS[getAt(cfg, f.key)] || "cubic-bezier(0.2, 0.8, 0.2, 1)"; custom.focus(); set(custom.value); }
      else { custom.hidden = true; set(sel.value); }
    });
    custom.addEventListener("change", () => {
      const ok = CSS.supports("animation-timing-function", custom.value);
      custom.setAttribute("aria-invalid", String(!ok));
      if (ok) set(custom.value); else say(`Not a CSS easing: ${custom.value}`);
    });
    row.append(el("div", { class: "mlab-ctl mlab-ctl-col" }, sel, custom));
    updaters.push(sync);
  } else if (f.type === "text") {
    const inp = el("input", { type: "text", id, class: "mlab-text", maxlength: f.maxlength, spellcheck: "false" });
    inp.addEventListener("input", () => set(inp.value));
    row.append(el("div", { class: "mlab-ctl" }, inp));
    updaters.push(() => { inp.value = getAt(cfg, f.key) ?? ""; });
  }
  return row;
}
const refresh = () => updaters.forEach((u) => u());

// ── Randomize: sensible values within each control's range ─────────────────
function randomize() {
  const rnd = (a, b, step) => {
    const v = a + Math.random() * (b - a);
    return step >= 1 ? Math.round(v / step) * step : Math.round(v / step) * step;
  };
  SCHEMA.forEach((g) => g.fields.forEach((f) => {
    if (f.norand || f.locked) return;
    const [lo, hi] = f.rand ?? [f.min, f.max];
    if (f.type === "range") setAt(cfg, f.key, Number(fmt(rnd(lo, hi, f.step), f.step)));
    else if (f.type === "pair") { const a = rnd(lo, hi, f.step), b2 = rnd(lo, hi, f.step); setAt(cfg, f.key, [Math.min(a, b2), Math.max(a, b2)]); }
    else if (f.type === "select") { const opts = f.randOptions ?? f.options; setAt(cfg, f.key, opts[(Math.random() * opts.length) | 0]); }
    else if (f.type === "color") setAt(cfg, f.key, COLORS[(Math.random() * COLORS.length) | 0]);
    else if (f.type === "easing") setAt(cfg, f.key, EASE_NAMES[(Math.random() * EASE_NAMES.length) | 0]);
    else if (f.type === "toggle") setAt(cfg, f.key, Math.random() < 0.5);
  }));
  cfg.text.headings = true;
  cfg.preset = "Random";
  refresh();
  commit({ edited: true });
}

// ── JSON out and in ────────────────────────────────────────────────────────
const json = () => JSON.stringify(motion.getConfig(), null, 2);
function showIo(text, mode) {
  const io = panel.querySelector(".mlab-io");
  const ta = io.querySelector("textarea");
  io.hidden = false;
  io.dataset.mode = mode;
  io.querySelector(".mlab-io-apply").hidden = mode !== "import";
  io.querySelector(".mlab-io-title").textContent = mode === "import" ? "Paste a config and apply" : "Config JSON — select all and copy";
  ta.value = text;
  ta.focus();
  if (mode === "copy") ta.select();
}
async function copyJson() {
  const text = json();
  try {
    await navigator.clipboard.writeText(text);
    say(`Copied ${text.length.toLocaleString()} characters of JSON. Paste it to Claude, or over src/data/motion.json.`);
  } catch (err) {
    showIo(text, "copy");
    say("Clipboard unavailable: the JSON is in the box below.");
  }
}
function importJson(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch (err) { say(`Not valid JSON: ${err.message}`); return false; }
  if (!parsed || typeof parsed !== "object") { say("Not a config object."); return false; }
  cfg = motion.setConfig(parsed);
  refresh();
  commit({ edited: false });
  say(`Imported “${cfg.preset}”.`);
  return true;
}
function applyPreset(name) {
  if (!(name in PRESETS)) return;
  cfg = motion.resolveConfig(PRESETS[name]);
  cfg.preset = name;
  refresh();
  commit({ edited: false });
  say(`Preset: ${name}`);
}

// ── The panel ───────────────────────────────────────────────────────────────
function place() {
  panel.dataset.dock = ui.dock;
  panel.classList.toggle("is-collapsed", ui.collapsed);
  panel.querySelector(".mlab-collapse").setAttribute("aria-expanded", String(!ui.collapsed));
  panel.querySelector(".mlab-collapse").textContent = ui.collapsed ? "+" : "–";
  if (ui.dock === "float") {
    const w = panel.offsetWidth || 320, h = panel.offsetHeight || 60;
    ui.x = Math.min(Math.max(0, ui.x), Math.max(0, window.innerWidth - w));
    ui.y = Math.min(Math.max(0, ui.y), Math.max(0, window.innerHeight - Math.min(h, 80)));
    panel.style.left = `${ui.x}px`;
    panel.style.top = `${ui.y}px`;
  } else {
    panel.style.left = panel.style.top = "";
  }
}
function drag(head) {
  head.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0 || ev.target.closest("button, select, input")) return;
    const r = panel.getBoundingClientRect();
    const dx = ev.clientX - r.left, dy = ev.clientY - r.top;
    head.setPointerCapture(ev.pointerId);
    ui.dock = "float"; ui.x = r.left; ui.y = r.top;
    const move = (m) => { ui.x = m.clientX - dx; ui.y = m.clientY - dy; place(); };
    const up = () => { head.removeEventListener("pointermove", move); head.removeEventListener("pointerup", up); head.removeEventListener("pointercancel", up); saveUi(); };
    head.addEventListener("pointermove", move);
    head.addEventListener("pointerup", up);
    head.addEventListener("pointercancel", up);
  });
}
function build() {
  const presetSel = el("select", { id: "mlab-preset" },
    el("option", { value: "", text: "— custom —" }),
    Object.keys(PRESETS).map((n) => el("option", { value: n, text: n })));
  presetSel.addEventListener("change", () => applyPreset(presetSel.value));
  const btn = (text, onclick, o = {}) => el("button", { type: "button", class: "mlab-btn", onclick, ...o }, text);
  const auto = el("input", { type: "checkbox", id: "mlab-auto", class: "mlab-switch", role: "switch" });
  auto.checked = ui.autoReplay;
  auto.addEventListener("change", () => { ui.autoReplay = auto.checked; saveUi(); });
  const groups = SCHEMA.map((g) => {
    const d = el("details", { class: "mlab-group", "data-id": g.id, open: ui.open.includes(g.id) },
      el("summary", {}, el("span", { text: g.label }), el("span", { class: "mlab-count", text: String(g.fields.length), "aria-label": `${g.fields.length} parameters` })),
      el("div", { class: "mlab-fields" }, g.fields.map(field)));
    d.addEventListener("toggle", () => {
      ui.open = [...panel.querySelectorAll(".mlab-group[open]")].map((x) => x.dataset.id);
      saveUi();
    });
    return d;
  });
  const total = SCHEMA.reduce((n, g) => n + g.fields.length, 0);
  const head = el("header", { class: "mlab-head" },
    el("h2", { class: "mlab-title", id: "mlab-title" }, "Motion Lab", el("span", { class: "mlab-ver", text: `v${cfg.version} · ${total} params` })),
    el("div", { class: "mlab-tools" },
      btn("◧", () => { ui.dock = "left"; place(); saveUi(); }, { "aria-label": "Dock left", title: "Dock left" }),
      btn("◨", () => { ui.dock = "right"; place(); saveUi(); }, { "aria-label": "Dock right", title: "Dock right" }),
      btn("–", () => { ui.collapsed = !ui.collapsed; place(); saveUi(); }, { class: "mlab-btn mlab-collapse", "aria-controls": "mlab-body", "aria-label": "Collapse the lab" }),
      btn("×", closeLab, { "aria-label": "Close the lab (?lab=0)", title: "Close the lab" })));
  const io = el("div", { class: "mlab-io", hidden: true },
    el("label", { class: "mlab-io-title", for: "mlab-json" }, "Config JSON"),
    el("textarea", { id: "mlab-json", rows: "10", spellcheck: "false" }),
    el("div", { class: "mlab-actions" },
      btn("Apply", () => { if (importJson(panel.querySelector("#mlab-json").value)) io.hidden = true; }, { class: "mlab-btn mlab-io-apply" }),
      btn("Close", () => { io.hidden = true; })));
  panel = el("section", { class: "mlab", role: "region", "aria-labelledby": "mlab-title" },
    head,
    el("div", { class: "mlab-body", id: "mlab-body" },
      motion.isStill() ? el("p", { class: "mlab-note", text: "Your system asks for reduced motion, so nothing animates — the content appears at once. You can still edit and export the config; turn reduced motion off to preview it." }) : null,
      el("div", { class: "mlab-f mlab-f-select" },
        el("div", { class: "mlab-lab" }, el("label", { for: "mlab-preset", text: "Preset" }), el("span", { class: "mlab-edited", text: "edited", hidden: true })),
        el("div", { class: "mlab-ctl" }, presetSel)),
      el("div", { class: "mlab-actions" },
        btn("Replay", () => doReplay("load"), { class: "mlab-btn mlab-primary" }),
        btn("Replay navigation", () => doReplay("nav")),
        btn("Randomize", randomize),
        btn("Reset", () => applyPreset("Default")),
        btn("Copy JSON", copyJson),
        btn("Import JSON", () => showIo(json(), "import"))),
      el("div", { class: "mlab-f mlab-f-toggle" },
        el("div", { class: "mlab-lab" }, el("label", { for: "mlab-auto", text: "Replay on every change" })),
        el("div", { class: "mlab-ctl" }, auto)),
      io,
      el("p", { class: "mlab-status", role: "status", "aria-live": "polite" }),
      el("div", { class: "mlab-groups" }, groups)));
  statusEl = panel.querySelector(".mlab-status");
  drag(head);
  panel.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !ev.target.closest("select")) { ui.collapsed = true; place(); saveUi(); panel.querySelector(".mlab-collapse").focus(); }
  });
  return panel;
}
function closeLab() {
  try { sessionStorage.removeItem(motion.LAB_FLAG); } catch (err) {}
  motion.setConfig(null); // back to src/data/motion.json
  panel?.remove();
  panel = null;
  const u = new URL(location.href);
  if (u.searchParams.has("lab")) { u.searchParams.delete("lab"); history.replaceState(history.state, "", u); }
}

let opened = false;
export function openLab() {
  if (opened) return;
  opened = true;
  cfg = motion.getConfig();
  document.body.append(build());
  refresh();
  const sel = panel.querySelector("#mlab-preset");
  sel.value = baseName(cfg.preset) in PRESETS ? baseName(cfg.preset) : "";
  panel.querySelector(".mlab-edited").hidden = !/\(edited\)$/.test(cfg.preset);
  place();
  say(`Loaded “${cfg.preset}”. Changes apply to every navigation in this tab.`);
  // The router replaces <body> on every navigation: carry the panel across.
  document.addEventListener("astro:after-swap", () => { if (panel && !panel.isConnected) document.body.append(panel); });
  window.addEventListener("resize", () => panel && ui.dock === "float" && place());
}
