// The Motion Lab's "Export code" (docs/motion-lab/engine-contract.md §5): the
// current config as paste-and-run CSS + a self-contained WAAPI script for
// someone else's site. exportCode(config) → { css, js, note }.
//
// What it exports is the TRANSITION only: the cover (none / the five slab
// curtains / field / wipe / band-sweep / dissolve) and a minimal reveal (cut,
// dissolve). The box-first choreography, boot, idle, sound and interactions
// stay in the JSON and the site's motion.js; the note says so.
//
// The generated code only depends on the config: each cover is a template
// below (not the engine's style modules, which may change or not be written
// yet). The registry is read for one thing: the defaults and label a style
// declares there, so an export of `params: {}` plays with the same defaults as
// the Lab. Pure (no DOM), never throws.
import { find } from "./styles/index.mjs";

// Copied from motion.js EASINGS (and the slab module's departure curve) so
// the export moves like the engine.
const EASE = {
  in: "cubic-bezier(0.16, 1, 0.3, 1)",    // decel
  out: "cubic-bezier(0.4, 0, 1, 1)",      // accel
  fade: "cubic-bezier(0.4, 0, 0.2, 1)",   // standard
  leave: "cubic-bezier(0.64, 0, 0.78, 0)", // the slabs' departure (power4.in)
};
const INK = "#0b0b0b";
const PAPER = "#f2f1ea";

// ── Params: the export's own defaults and bounds, per cover ──────────────────
const num = (def, min, max, int = false) => ({ def, min, max, int });
const pick = (def, options) => ({ def, options });
// (The registry's defaults and bounds win when the style is registered.)
const DURATION = num(620, 100, 2000), STAGGER = num(60, 0, 300), RADIUS = num(22, 0, 48);
const PARAMS = {
  none: {},
  "slabs.quad-stagger": { durationMs: DURATION, staggerMs: STAGGER, radiusPx: RADIUS },
  "slabs.quad-center": { durationMs: DURATION, staggerMs: STAGGER, radiusPx: RADIUS },
  "slabs.split-sharp": { durationMs: DURATION, staggerMs: STAGGER },
  "slabs.split-round": { durationMs: DURATION, staggerMs: STAGGER, radiusPx: RADIUS },
  "slabs.dynamic": { durationMs: DURATION, staggerMs: STAGGER, radiusPx: RADIUS, grid: num(3, 2, 5, true) },
  field: { angle: num(152, 0, 360), veilMs: num(420, 100, 1500), liftMs: num(440, 100, 1500), lift: pick("fade", ["fade", "up"]) },
  wipe: {
    durationMs: num(700, 100, 2000),
    direction: pick("ltr", ["ltr", "rtl", "ttb", "btt"]),
    text: { def: "", maxLen: 80 },
    edge: pick("straight", ["straight", "slant"]),
  },
  "band-sweep": { durationMs: num(900, 200, 3000), bandPct: num(18, 5, 60), angle: num(12, -45, 45) },
  dissolve: { durationMs: num(400, 100, 1500) },
};
const REVEAL_PARAMS = { durationMs: num(320, 100, 1500) };

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const clampNum = (v, spec, fallback) => {
  const n = v === undefined || v === null || v === "" || typeof v === "boolean" ? NaN : Number(v);
  let x = Number.isFinite(n) ? n : fallback;
  x = Math.min(spec.max, Math.max(spec.min, x));
  return spec.int ? Math.round(x) : Math.round(x * 100) / 100;
};
const fitsSpec = (v, spec) =>
  spec.options ? spec.options.includes(v) : "maxLen" in spec ? typeof v === "string" : Number.isFinite(v);

// The registry's style, only when it is the id asked for (find() falls back).
function registryStyle(kind, id) {
  try {
    const s = find(kind, id);
    return s && s.id === id ? s : null;
  } catch (_) {
    return null;
  }
}

function resolve(kind, id, specs, given) {
  const reg = registryStyle(kind, id)?.params ?? {};
  const out = {};
  for (const [key, mine] of Object.entries(specs)) {
    const r = reg[key] ?? {};
    const spec = { ...mine };
    if (spec.int !== undefined) {
      if (Number.isFinite(r.min)) spec.min = r.min;
      if (Number.isFinite(r.max)) spec.max = r.max;
    }
    const def = fitsSpec(r.default, spec) ? r.default : spec.def;
    const v = given[key];
    if (spec.options) out[key] = spec.options.includes(v) ? v : def;
    else if ("maxLen" in spec) out[key] = (typeof v === "string" ? v.trim() : def).slice(0, spec.maxLen);
    else out[key] = clampNum(v, spec, clampNum(def, spec, spec.def));
  }
  return out;
}

// ── Safe text in generated code ──────────────────────────────────────────────
const lit = (v) => JSON.stringify(v).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
const comment = (s) => String(s).replace(/\*\//g, "* /").replace(/[\r\n<]+/g, " ").slice(0, 120);
const COLOR = /^(#[0-9a-f]{3,8}|[a-z]{3,20}|(rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color)\([0-9a-z.,%/\s+-]{1,80}\))$/i;
const color = (v) => (typeof v === "string" && COLOR.test(v.trim()) ? v.trim() : null);
const objLit = (o) => `{ ${Object.entries(o).map(([k, v]) => `${k}: ${lit(v)}`).join(", ")} }`;

// ── The covers: build(root) draws into the .ml-cover layer and returns
//    { in: [animations], out: () => [animations] } ──────────────────────────
// Arrival: the in stagger per slab (ms, before ÷ speed); departure: the out
// order. Quadrants are 53% boxes overlapping 6% in the middle.
const quadCover = (slabs, inScale, inStagger, outOrder) => `// Four slabs close on the quadrants, then leave the way they came (H3b).
const S = ${slabs};
const R = P.radiusPx + "px";
const els = S.map((s, i) => box(root, { left: s.x, top: s.y, width: "53vw", height: "53vh", borderRadius: R, zIndex: String(10 + i) }, "ml-slab ml-slab--" + s.c));
const away = (s) => "translate(" + s.fx + ", " + s.fy + ")";
const order = ${outOrder}; // departure order
return {
  in: els.map((el, i) => run(el, [{ transform: away(S[i]) + " scale(${inScale})" }, { transform: "none" }], P.durationMs, EASE.in, ${inStagger})),
  out: () => order.map((i, n) => run(els[i], [{ transform: "none" }, { transform: away(S[i]) }], P.durationMs * 0.85, EASE.leave, n * P.staggerMs)),
};`;

const splitCover = (width, round) => `// Two full-height slabs close from the sides, then tear away up and down (H3b).
const R = ${round ? `P.radiusPx + "px"` : `"0px"`};
const left = box(root, { left: "0", top: "0", bottom: "0", width: "${width}vw", borderRadius: "0 " + R + " " + R + " 0" }, "ml-slab ml-slab--ink");
const right = box(root, { right: "0", top: "0", bottom: "0", width: "${width}vw", borderRadius: R + " 0 0 " + R }, "ml-slab ml-slab--paper");
return {
  in: [
    run(left, [{ transform: "translateX(-${round ? 105 : 101}%)" }, { transform: "none" }], P.durationMs, EASE.in),
    run(right, [{ transform: "translateX(${round ? 105 : 101}%)" }, { transform: "none" }], P.durationMs, EASE.in),
  ],
  out: () => [
    run(left, [{ transform: "none" }, { transform: "translateY(-105%)" }], P.durationMs * 0.85, EASE.leave),
    run(right, [{ transform: "none" }, { transform: "translateY(105%)" }], P.durationMs * 0.85, EASE.leave, P.staggerMs),
  ],
};`;

const BUILD = {
  none: () => `return { in: [], out: () => [] };`,
  "slabs.quad-stagger": () => quadCover(
    `[ // arrival: bottom-right → bottom-left → top-right → top-left
  { x: "49vw", y: "49vh", fx: "110vw", fy: "110vh", c: "paper" },
  { x: "0vw", y: "49vh", fx: "-110vw", fy: "110vh", c: "ink" },
  { x: "49vw", y: "0vh", fx: "110vw", fy: "-110vh", c: "ink" },
  { x: "0vw", y: "0vh", fx: "-110vw", fy: "-110vh", c: "paper" },
]`, 1.02, "i * P.staggerMs", "[3, 2, 1, 0]"),
  "slabs.quad-center": () => quadCover(
    `[ // all four at once, meeting in the middle
  { x: "0vw", y: "0vh", fx: "-60vw", fy: "-60vh", c: "ink" },
  { x: "49vw", y: "0vh", fx: "60vw", fy: "-60vh", c: "paper" },
  { x: "0vw", y: "49vh", fx: "-60vw", fy: "60vh", c: "paper" },
  { x: "49vw", y: "49vh", fx: "60vw", fy: "60vh", c: "ink" },
]`, 1, "0", "[0, 1, 2, 3]"),
  "slabs.split-sharp": () => splitCover(50.5, false),
  "slabs.split-round": () => splitCover(52, true),
  "slabs.dynamic": () => `// An n × n grid of slabs flies in from every side, then scatters in a shuffled order (H3b).
const n = P.grid, cw = 104 / n, rh = 104 / n, R = P.radiusPx + "px";
const cells = [];
for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
  const edge = (Math.random() * 4) | 0, d = ((Math.random() - 0.5) * 30).toFixed(1);
  const from = ["translate(-135vw, 0)", "translate(135vw, 0)", "translate(0, -135vh)", "translate(0, 135vh)"][edge];
  const exit = ["translate(-140vw, " + d + "vh)", "translate(140vw, " + d + "vh)", "translate(" + d + "vw, -140vh)", "translate(" + d + "vw, 140vh)"][edge];
  const el = box(root, { left: c * cw - 2 + "vw", top: r * rh - 2 + "vh", width: cw + 4 + "vw", height: rh + 4 + "vh", borderRadius: R, zIndex: String(cells.length + 6) }, "ml-slab ml-slab--" + ((r + c) % 2 ? "paper" : "ink"));
  cells.push({ el, from, exit });
}
const order = cells.map((_, i) => i).sort(() => Math.random() - 0.5);
return {
  in: cells.map((s, i) => run(s.el, [{ transform: s.from + " scale(1.03)" }, { transform: "none" }], P.durationMs, EASE.in, i * P.staggerMs)),
  out: () => order.map((i, k) => run(cells[i].el, [{ transform: "none" }, { transform: cells[i].exit }], P.durationMs * 0.85, EASE.leave, k * P.staggerMs)),
};`,
  field: () => `// The H1 gradient field arrives as a veil (colour, then page, never white), then lifts (handoff.js).
const T1 = "var(--ml-tint-1, " + INK + ")", T2 = "var(--ml-tint-2, " + PAPER + ")";
const veil = box(root, {
  left: "0", top: "0", right: "0", bottom: "0",
  background: "radial-gradient(122% 92% at 18% 10%, color-mix(in oklab, " + T1 + " 74%, white) 0%, transparent 60%), " +
    "radial-gradient(104% 84% at 84% 90%, color-mix(in oklab, " + T2 + " 84%, black) 0%, transparent 64%), " +
    "linear-gradient(" + P.angle + "deg, " + T1 + " 0%, " + T2 + " 100%)",
}, "ml-field");
return {
  in: [run(veil, [{ opacity: 0 }, { opacity: 1 }], P.veilMs, "ease")],
  out: () => [run(veil, P.lift === "up"
    ? [{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }]
    : [{ opacity: 1 }, { opacity: 0 }], P.liftMs, EASE.in)],
};`,
  wipe: () => `// An ink shutter wipes across, covers the page for the swap, then carries on out the far side (H2).
const X = P.direction === "ltr" || P.direction === "rtl";
const sign = P.direction === "ltr" || P.direction === "ttb" ? 1 : -1;
const css = { left: "0", top: "0", right: "0", bottom: "0" };
if (P.edge === "slant") {
  // A parallelogram overhanging 12 units each side: the leading edge leans, the viewport stays covered.
  if (X) Object.assign(css, { left: "-12vw", right: "-12vw", clipPath: "polygon(12vw 0, 100% 0, calc(100% - 12vw) 100%, 0 100%)" });
  else Object.assign(css, { top: "-12vh", bottom: "-12vh", clipPath: "polygon(0 12vh, 100% 0, 100% calc(100% - 12vh), 0 100%)" });
}
const panel = box(root, css, "ml-wipe");
if (P.text) {
  const t = document.createElement("span");
  t.className = "ml-wipe-text";
  t.textContent = P.text;
  panel.appendChild(t);
}
const at = (pct) => "translate" + (X ? "X" : "Y") + "(" + pct + "%)";
return {
  in: [run(panel, [{ transform: at(-100 * sign) }, { transform: "none" }], P.durationMs, EASE.in)],
  out: () => [run(panel, [{ transform: "none" }, { transform: at(100 * sign) }], P.durationMs, EASE.out)],
};`,
  "band-sweep": () => `// A tilted gradient band sweeps to the middle while a fill of its first colour fades up behind it;
// then the fill fades and the band carries on off the right edge (B5). durationMs is the whole sweep.
const T1 = "var(--ml-tint-1, " + INK + ")", T2 = "var(--ml-tint-2, " + PAPER + ")";
const W = innerWidth, H = innerHeight, bw = (W * P.bandPct) / 100, rad = (Math.abs(P.angle) * Math.PI) / 180;
const half = (bw * Math.cos(rad) + 2 * H * Math.sin(rad)) / 2;
const at = (x) => "translateX(" + x + "px) rotate(" + P.angle + "deg)";
const fill = box(root, { left: "0", top: "0", right: "0", bottom: "0", background: T1 }, "ml-band-fill");
const band = box(root, { left: -bw / 2 + "px", top: -H / 2 + "px", width: bw + "px", height: 2 * H + "px", background: "linear-gradient(90deg, " + T1 + ", " + T2 + ")" }, "ml-band");
return {
  in: [
    run(band, [{ transform: at(-half) }, { transform: at(W / 2) }], P.durationMs / 2, "ease-in"),
    run(fill, [{ opacity: 0 }, { opacity: 1 }], P.durationMs / 2, EASE.fade),
  ],
  out: () => [
    run(band, [{ transform: at(W / 2) }, { transform: at(W + half) }], P.durationMs / 2, "ease-out"),
    run(fill, [{ opacity: 1 }, { opacity: 0 }], P.durationMs / 2, EASE.fade),
  ],
};`,
  dissolve: () => `// A paper sheet fades over the page, then fades away (B4).
const sheet = box(root, { left: "0", top: "0", right: "0", bottom: "0" }, "ml-sheet");
return {
  in: [run(sheet, [{ opacity: 0 }, { opacity: 1 }], P.durationMs, EASE.fade)],
  out: () => [run(sheet, [{ opacity: 1 }, { opacity: 0 }], P.durationMs, EASE.fade)],
};`,
};

// ── CSS ──────────────────────────────────────────────────────────────────────
const STYLE_CSS = {
  slabs: `.ml-slab { will-change: transform; }
.ml-slab--ink { background: var(--ml-ink); border: 1px solid color-mix(in oklab, var(--ml-paper) 18%, transparent); }
.ml-slab--paper { background: var(--ml-paper); border: 1px solid color-mix(in oklab, var(--ml-ink) 10%, transparent); }`,
  field: `.ml-field { will-change: opacity, transform; }`,
  wipe: `.ml-wipe { display: flex; align-items: center; justify-content: center; background: var(--ml-ink); will-change: transform; }
.ml-wipe-text { position: static; font: 600 16px/1.2 system-ui, sans-serif; letter-spacing: -0.02em; color: var(--ml-paper); }`,
  "band-sweep": `.ml-band { will-change: transform; }
.ml-band-fill { will-change: opacity; }`,
  dissolve: `.ml-sheet { background: var(--ml-paper); will-change: opacity; }`,
};

function makeCss({ preset, cover, reveal, speed, holdMs, coverMs, tint }) {
  const vars = [
    `  --ml-speed: ${speed};`,
    `  --ml-cover-ms: ${Math.round(coverMs / speed)}ms; /* how long the cover takes to close, ÷ speed (the JS holds its own copy) */`,
    `  --ml-hold-ms: ${holdMs}ms;`,
    `  --ml-ink: ${INK};`,
    `  --ml-paper: ${PAPER};`,
  ];
  if (tint) vars.push(`  --ml-tint-1: ${tint[0]};`, `  --ml-tint-2: ${tint[1]};`);
  else if (cover === "field" || cover === "band-sweep") vars.push(`  /* --ml-tint-1 / --ml-tint-2: set them (per page) to colour the ${cover}; without them it is ink → paper. */`);
  const family = cover.startsWith("slabs.") ? "slabs" : cover;
  return [
    `/* Motion Lab export · ${comment(preset)} · cover ${cover} · reveal ${reveal} */`,
    `:root {\n${vars.join("\n")}\n}`,
    `.ml-cover { position: fixed; inset: 0; z-index: 900; pointer-events: none; overflow: hidden; }
.ml-cover div { position: absolute; box-sizing: border-box; }`,
    STYLE_CSS[family] ?? "",
    `@media (prefers-reduced-motion: reduce) { .ml-cover { display: none !important; } }`,
  ].filter(Boolean).join("\n");
}

// ── JS ───────────────────────────────────────────────────────────────────────
function makeJs({ preset, cover, reveal, speed, holdMs, params, revealMs, target }) {
  return `/* Motion Lab export · ${comment(preset)} · cover ${cover} · reveal ${reveal}. Paste before </body>. */
(() => {
  "use strict";
  const SPEED = ${speed};      // global.speed: every duration below is divided by it
  const HOLD_MS = ${holdMs};    // transition.holdMs: covered time between the swap and the reveal (as is, like the site)
  const COVER = ${lit(cover)};
  const REVEAL = ${lit(reveal)};
  const REVEAL_MS = ${revealMs};  // dissolve reveal: fade-in of TARGET
  const TARGET = ${lit(target)};
  const P = ${objLit(params)}; // transition.cover.params
  const EASE = ${objLit(EASE)};
  const INK = "var(--ml-ink, ${INK})", PAPER = "var(--ml-paper, ${PAPER})";

  const still = () => typeof Element.prototype.animate !== "function" || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const running = new Set();
  let hurry = false, wake = null, layer = null, lift = null;

  // Every animation goes through run(): registered, so input can finish it.
  const run = (el, frames, ms, easing, delay = 0) => {
    const a = el.animate(frames, { duration: ms / SPEED, delay: delay / SPEED, easing, fill: "both" });
    running.add(a);
    const end = () => running.delete(a);
    a.finished.then(end, end);
    if (hurry) a.finish();
    return a;
  };
  const settled = (anims) => Promise.all(anims.map((a) => a.finished.catch(() => {})));
  // Input wins: a click or a key finishes everything at once (and skips the hold).
  const finishAll = () => {
    hurry = true;
    for (const a of [...running]) { try { a.finish(); } catch (_) { /* already gone */ } }
    if (wake) wake();
  };
  addEventListener("pointerdown", finishAll, true);
  addEventListener("keydown", finishAll, true);

  const box = (parent, css, cls) => {
    const d = document.createElement("div");
    d.className = cls;
    Object.assign(d.style, css);
    parent.appendChild(d);
    return d;
  };
  const drop = () => { if (layer) layer.remove(); layer = null; lift = null; };
  const mount = () => {
    drop();
    layer = document.createElement("div");
    layer.className = "ml-cover";
    layer.setAttribute("aria-hidden", "true");
    document.documentElement.appendChild(layer); // under <html>: survives a <body> swap
    return layer;
  };
  const hold = (ms) => new Promise((resolve) => {
    if (hurry || ms <= 0) return resolve();
    const t = setTimeout(done, ms);
    function done() { clearTimeout(t); wake = null; resolve(); }
    wake = done;
  });

  // The cover (${cover}): draws into the layer; returns { in, out() }.
  function build(root) {
${BUILD[cover]().replace(/^/gm, "    ")}
  }

  // Resolves when the screen is covered.
  function cover() {
    hurry = false;
    if (COVER === "none" || still()) return Promise.resolve();
    const c = build(mount());
    lift = c.out;
    return settled(c.in);
  }
  // Lifts the cover (and plays the reveal); resolves when it is gone.
  function reveal() {
    const anims = lift ? lift() : [];
    lift = null;
    if (REVEAL === "dissolve" && !still()) {
      let el = null;
      try { el = document.querySelector(TARGET); } catch (_) { /* not a selector */ }
      const a = run(el || document.body, [{ opacity: 0 }, { opacity: 1 }], REVEAL_MS, EASE.fade);
      a.finished.then(() => a.cancel(), () => {});
      anims.push(a);
    }
    return settled(anims).then(drop);
  }
  // cover → swap → hold → reveal.
  async function play(swap) {
    if (still()) { drop(); if (swap) await swap(); return; }
    await cover();
    if (swap) await swap();
    if (COVER !== "none") await hold(HOLD_MS);
    await reveal();
  }

  window.MotionLab = { cover, reveal, play };
})();`;
}

// ── Note ─────────────────────────────────────────────────────────────────────
function makeNote({ preset, cover, coverAsked, reveal, revealAsked, speed, holdMs, params, target, boot, idle }) {
  const label = registryStyle("cover", cover)?.label;
  const lines = [
    `Motion Lab export — ${comment(preset)}`,
    "",
    "IN this export:",
    `- Cover: ${cover}${label ? ` (${label})` : ""}${Object.keys(params).length ? ` with ${Object.entries(params).map(([k, v]) => `${k} ${JSON.stringify(v)}`).join(", ")}` : ""}.`,
  ];
  if (coverAsked !== cover) lines.push(`  (The config asks for cover "${comment(coverAsked)}", which the export does not know; it exports "none".)`);
  lines.push(
    reveal === "dissolve" ? `- Reveal: dissolve — fades "${comment(target)}" (or <body>) from 0 to 1.` : `- Reveal: cut — the new content is simply there when the cover lifts.`,
    `- Timing: every duration ÷ speed ${speed}; hold ${holdMs} ms between swap and reveal${cover === "none" ? " (ignored: no cover)" : ""}.`,
    "- window.MotionLab.cover() / .reveal() / .play(swap). A click or key finishes it at once; prefers-reduced-motion draws nothing.",
    "",
    "NOT in this export (use the JSON for those, or the site's motion.js):",
  );
  if (revealAsked === "box-first") lines.push("- The box-first reveal (outline → fill → text scramble → media choreography) — exported as a cut.");
  else if (revealAsked !== reveal) lines.push(`- The reveal "${comment(revealAsked)}" — exported as a cut.`);
  else lines.push("- box-first (the outline / fill / text / media choreography) and its settings.");
  lines.push(
    `- Boot (${comment(boot)}), idle (${comment(idle)}), sound, interactions.`,
    "- The site-only timing: navSpeed, capMs / navCapMs, revealDelayMs.",
    "",
    "How to use: paste the CSS into your stylesheet, the JS before </body>, call `MotionLab.play(() => swapYourContent())` on navigation.",
  );
  return lines.join("\n");
}

// ── exportCode ───────────────────────────────────────────────────────────────
export function exportCode(config) {
  try {
    if (!isObj(config)) return { css: "", js: "", note: "Nothing to export: the config is not an object (expected a Motion Lab JSON, version 2)." };
    const g = isObj(config.global) ? config.global : {};
    const t = isObj(config.transition) ? config.transition : {};
    const coverCfg = isObj(t.cover) ? t.cover : {};
    const revealCfg = isObj(t.reveal) ? t.reveal : {};
    const coverAsked = typeof coverCfg.style === "string" ? coverCfg.style : "none";
    const cover = coverAsked in PARAMS ? coverAsked : "none";
    const revealAsked = typeof revealCfg.style === "string" ? revealCfg.style : "box-first";
    const reveal = revealAsked === "dissolve" ? "dissolve" : "cut";
    const given = isObj(coverCfg.params) ? coverCfg.params : {};
    const params = resolve("cover", cover, PARAMS[cover], given);
    const sp = Number(g.speed);
    const speed = Number.isFinite(sp) && sp > 0 ? Math.max(0.05, sp) : 1;
    const hm = Number(t.holdMs);
    const holdMs = Number.isFinite(hm) ? Math.round(Math.min(10000, Math.max(0, hm))) : 300;
    const rp = isObj(revealCfg.params) ? revealCfg.params : {};
    const revealMs = resolve("reveal", "dissolve", REVEAL_PARAMS, rp).durationMs;
    const target = typeof config.exportTarget === "string" && config.exportTarget.trim() ? config.exportTarget.trim().slice(0, 200) : "main";
    const rawTint = Array.isArray(given.tint) ? given.tint : Array.isArray(config.tint) ? config.tint : null;
    const tint = rawTint && color(rawTint[0]) && color(rawTint[1]) ? [color(rawTint[0]), color(rawTint[1])] : null;
    const preset = typeof config.preset === "string" && config.preset ? config.preset : "untitled";
    const coverMs = cover === "field" ? params.veilMs : cover === "band-sweep" ? params.durationMs / 2 : params.durationMs ?? 0;
    const boot = isObj(config.boot) && typeof config.boot.style === "string" ? config.boot.style : "odometer";
    const idle = isObj(config.idle) && typeof config.idle.style === "string" ? config.idle.style : "none";
    return {
      css: makeCss({ preset, cover, reveal, speed, holdMs, coverMs, tint }),
      js: makeJs({ preset, cover, reveal, speed, holdMs, params, revealMs, target }),
      note: makeNote({ preset, cover, coverAsked, reveal, revealAsked, speed, holdMs, params, target, boot, idle }),
    };
  } catch (e) {
    return { css: "", js: "", note: `Export failed: ${e && e.message ? e.message : String(e)}` };
  }
}
