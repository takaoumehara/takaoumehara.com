// H3b slab curtains (docs/motion-archive.md §H3; the original is
// docs/motion-lab/references/living-architectural-slabs-v4.html,
// executeQuadStagger/QuadCenter/SplitSharp/SplitRound/DynamicTransition):
// ink / paper slabs close over the page, hold for the swap, and leave.
// Contract: docs/motion-lab/engine-contract.md §2.
//
// Pure at import (no DOM until in()/out() run), so the registry loads in Node.
// Only transform is animated, with WAAPI; the original's timelines are rewritten
// as one Animation per slab, every one registered with ctx.own().

const LAYER = "slabs";
// Arrival: the original's power3 / expo.out → the engine's "decel". Departure:
// its power4.in (easeInQuint), which no EASINGS entry matches.
const ARRIVE = "decel";
const LEAVE = "cubic-bezier(0.64, 0, 0.78, 0)";
const LEAVE_RATIO = 0.85; // the original leaves a little faster than it arrives (0.25s vs 0.3s)

// The slabs in() drew, per cover, for out() to send away.
const drawn = new WeakMap();

const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
const px = (x, y) => `translate(${x}px, ${y}px)`;

// Every animation settled (a cancelled one counts), or the stage's cap — past
// it the style finishes its own animations rather than hang.
function settle(ctx, anims) {
  let t = 0;
  const cap = Number.isFinite(ctx.capMs) ? ctx.capMs : 10000;
  const done = Promise.allSettled(anims.map((a) => a.finished));
  const late = new Promise((resolve) => {
    t = setTimeout(() => {
      for (const a of anims) { try { a.finish(); } catch (e) { try { a.cancel(); } catch (e2) {} } }
      resolve();
    }, cap);
  });
  return Promise.race([done, late]).finally(() => clearTimeout(t));
}

// A slab in the layer: absolute box (numbers are px, strings as given).
function slab(layer, box, bg, radius, extra = "") {
  const el = document.createElement("div");
  const v = (x) => (typeof x === "number" ? `${x}px` : x);
  el.style.cssText =
    `position:absolute;box-sizing:border-box;will-change:transform;` +
    `left:${v(box.left)};top:${v(box.top)};width:${v(box.width)};height:${v(box.height)};` +
    `background:${bg};border-radius:${radius};${extra}`;
  layer.append(el);
  return el;
}

// The shared cover: draw() lays the slabs out and returns
// [{ el, from, to, exit, delayIn, delayOut }] (transforms as strings);
// in() slides each from `from` to `to`, out() from `to` to `exit`.
function cover(draw) {
  return {
    in(ctx, p) {
      if (ctx.still) return Promise.resolve();
      const layer = ctx.layer(LAYER);
      layer.replaceChildren();
      const slabs = draw(ctx, p, layer);
      drawn.set(ctx, slabs);
      const ms = num(p.durationMs, 620) * ctx.k;
      const easing = ctx.ease(ARRIVE);
      if (p.snap !== false) ctx.sound.play("swoosh");
      const anims = slabs.map((s) => ctx.own(s.el.animate(
        [{ transform: s.from }, { transform: s.to }],
        { duration: ms, delay: s.delayIn * ctx.k, easing, fill: "both" },
      )));
      return settle(ctx, anims).then(() => { if (p.snap !== false) ctx.sound.play("snap"); });
    },
    out(ctx, p) {
      if (ctx.still) return Promise.resolve(); // in() drew nothing
      const slabs = drawn.get(ctx) ?? [];
      drawn.delete(ctx);
      const ms = num(p.durationMs, 620) * LEAVE_RATIO * ctx.k;
      const easing = ctx.ease(LEAVE);
      const anims = slabs.map((s) => ctx.own(s.el.animate(
        [{ transform: s.to }, { transform: s.exit }],
        { duration: ms, delay: s.delayOut * ctx.k, easing, fill: "both" },
      )));
      return settle(ctx, anims).then(() => ctx.drop(LAYER));
    },
  };
}

const DURATION = { default: 620, min: 100, max: 2000, step: 10, unit: "ms", label: "Duration" };
const STAGGER = { default: 60, min: 0, max: 300, step: 10, unit: "ms", label: "Stagger" };
const RADIUS = { default: 22, min: 0, max: 48, step: 1, unit: "px", label: "Corner radius" };
const SNAP = { default: true, label: "Swoosh + snap sound" };

// Four 53% quadrants, overlapping by 6% in the middle. `order` is the arrival
// order (later ones on top); `dist` how far off-screen they start, as a
// multiple of the viewport; `stagger` whether the arrival is staggered.
function quads(order, dist, stagger) {
  return (ctx, p, layer) => {
    const W = innerWidth, H = innerHeight;
    const r = `${num(p.radiusPx, 22)}px`;
    const st = num(p.staggerMs, 60);
    const n = order.length;
    return order.map(([cx, cy, tone], i) => {
      const el = slab(layer, { left: cx < 0 ? "0" : "49%", top: cy < 0 ? "0" : "49%", width: "53%", height: "53%" },
        ctx.tokens[tone], r, tone === "ink" ? `border:1px solid ${ctx.tokens.line};` : "");
      el.style.zIndex = String(10 + i);
      const off = px(cx * dist * W, cy * dist * H);
      return {
        el,
        from: `${off} scale(${stagger ? 1.02 : 1})`,
        to: "translate(0px, 0px) scale(1)",
        exit: `${off} scale(1)`,
        delayIn: stagger ? i * st : 0,
        // 4-way offset leaves in reverse order; 4-way center in its own order.
        delayOut: (stagger ? n - 1 - i : i) * st,
      };
    });
  };
}

// Two full-height halves close from the sides and leave up / down.
function split(width, round) {
  return (ctx, p, layer) => {
    const r = round ? num(p.radiusPx, 22) : 0;
    const st = num(p.staggerMs, 60);
    const left = slab(layer, { left: "0", top: "0", width, height: "100%" }, ctx.tokens.ink,
      `0 ${r}px ${r}px 0`, `border-right:1px solid ${ctx.tokens.line};`);
    const right = slab(layer, { left: "auto", top: "0", width, height: "100%" }, ctx.tokens.paper, `${r}px 0 0 ${r}px`, "right:0;");
    const pct = round ? 105 : 101;
    return [
      { el: left, from: `translate(-${pct}%, 0%)`, to: "translate(0%, 0%)", exit: "translate(0%, -105%)", delayIn: 0, delayOut: 0 },
      { el: right, from: `translate(${pct}%, 0%)`, to: "translate(0%, 0%)", exit: "translate(0%, 105%)", delayIn: 0, delayOut: st },
    ];
  };
}

// A grid of slabs, checkered ink / paper, each from a random edge; they
// leave towards that edge with a little drift, in a shuffled order.
function dynamic(ctx, p, layer) {
  const W = innerWidth, H = innerHeight;
  const n = Math.round(num(p.grid, 3));
  const r = `${num(p.radiusPx, 22)}px`;
  const st = num(p.staggerMs, 60);
  const colW = (1.04 * W) / n, rowH = (1.04 * H) / n;
  const edges = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const slabs = [];
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const paper = (row + col) % 2 === 1;
      const el = slab(layer,
        { left: col * colW - 0.02 * W, top: row * rowH - 0.02 * H, width: colW + 0.04 * W, height: rowH + 0.04 * H },
        paper ? ctx.tokens.paper : ctx.tokens.ink, r, paper ? "" : `border:1px solid ${ctx.tokens.line};`);
      el.style.zIndex = String(slabs.length + 6);
      const [ex, ey] = edges[(Math.random() * 4) | 0];
      const drift = (Math.random() - 0.5) * 0.3;
      slabs.push({
        el,
        from: `${px(ex * 1.35 * W, ey * 1.35 * H)} scale(1.03)`,
        to: "translate(0px, 0px) scale(1)",
        exit: `${px(ex ? ex * 1.4 * W : drift * W, ey ? ey * 1.4 * H : drift * H)} scale(1)`,
        delayIn: slabs.length * st,
        delayOut: 0,
      });
    }
  }
  const order = slabs.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [order[i], order[j]] = [order[j], order[i]]; }
  order.forEach((idx, i) => { slabs[idx].delayOut = i * st; });
  return slabs;
}

export default [
  {
    kind: "cover",
    id: "slabs.quad-stagger",
    label: "Slab curtain · 4-way offset",
    source: "H3b-1",
    labOnly: false,
    params: { durationMs: DURATION, staggerMs: STAGGER, radiusPx: RADIUS, snap: SNAP },
    // Arrival order bottom-right → bottom-left → top-right → top-left.
    ...cover(quads([[1, 1, "paper"], [-1, 1, "ink"], [1, -1, "ink"], [-1, -1, "paper"]], 1.1, true)),
  },
  {
    kind: "cover",
    id: "slabs.quad-center",
    label: "Slab curtain · 4-way center",
    source: "H3b-2",
    labOnly: false,
    params: { durationMs: DURATION, staggerMs: STAGGER, radiusPx: RADIUS, snap: SNAP },
    // All four at once; the stagger spaces their departure.
    ...cover(quads([[-1, -1, "ink"], [1, -1, "paper"], [-1, 1, "paper"], [1, 1, "ink"]], 0.6, false)),
  },
  {
    kind: "cover",
    id: "slabs.split-sharp",
    label: "Slab curtain · 2-split sharp",
    source: "H3b-3",
    labOnly: false,
    params: { durationMs: DURATION, staggerMs: STAGGER, snap: SNAP },
    ...cover(split("50.5%", false)),
  },
  {
    kind: "cover",
    id: "slabs.split-round",
    label: "Slab curtain · 2-split round",
    source: "H3b-4",
    labOnly: false,
    params: { durationMs: DURATION, staggerMs: STAGGER, radiusPx: RADIUS, snap: SNAP },
    ...cover(split("52%", true)),
  },
  {
    kind: "cover",
    id: "slabs.dynamic",
    label: "Slab curtain · dynamic grid",
    source: "H3b-5",
    labOnly: false,
    params: {
      durationMs: DURATION, staggerMs: STAGGER, radiusPx: RADIUS,
      grid: { default: 3, min: 2, max: 5, step: 1, label: "Grid (n × n)" },
      snap: SNAP,
    },
    ...cover(dynamic),
  },
];
