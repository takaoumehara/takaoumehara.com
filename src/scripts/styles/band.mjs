// B5 gradient band sweep and B4 dissolve (docs/motion-archive.md §B4, §B5;
// B5's keyframes are docs/motion-lab/references/band-sweep-keyframes.css).
// Contract: docs/motion-lab/engine-contract.md §2.
//
// Pure at import (no DOM until a function runs), so the registry loads in
// Node. Only transform and opacity are animated.

// Every animation settled (a cancelled one counts), or the stage's cap — past
// it the style finishes its own animations rather than hang.
function settle(ctx, anims) {
  let t = 0;
  const cap = Number.isFinite(ctx.capMs) ? ctx.capMs : 10000;
  const done = Promise.all(anims.map((a) => a.finished.then(() => {}, () => {})));
  const late = new Promise((resolve) => {
    t = setTimeout(() => {
      for (const a of anims) { try { a.finish(); } catch (e) { try { a.cancel(); } catch (e2) {} } }
      resolve();
    }, cap);
  });
  return Promise.race([done, late]).finally(() => clearTimeout(t));
}

const colours = (ctx) => (Array.isArray(ctx.tint) && ctx.tint.length >= 2 ? ctx.tint : [ctx.tokens.ink, ctx.tokens.paper]);

// The band's path, in px for the viewport as it is now: its centre travels
// from just off the left edge to just off the right, the "just" being half
// its rotated width so no corner shows at either end. It is twice the
// viewport's height (so a tilt up to 45° still spans top to bottom) and is
// placed with its centre at x = 0; translateX moves that centre.
function path(p) {
  const W = window.innerWidth, H = window.innerHeight;
  const bw = (W * p.bandPct) / 100, h = 2 * H, rad = (Math.abs(p.angle) * Math.PI) / 180;
  const half = (bw * Math.cos(rad) + h * Math.sin(rad)) / 2;
  const tf = (x) => `translateX(${x}px) rotate(${p.angle}deg)`;
  return { bw, H, from: tf(-half), mid: tf(W / 2), to: tf(W + half) };
}

const fade = (id, colour) => {
  const el = document.createElement("div");
  el.dataset.moFill = id;
  Object.assign(el.style, { position: "absolute", inset: "0", background: colour, opacity: "0" });
  return el;
};

export default [
  {
    kind: "cover",
    id: "band-sweep",
    label: "Gradient band sweep",
    source: "B5",
    labOnly: false,
    params: {
      bandPct: { default: 18, min: 5, max: 60, step: 1, unit: "%", label: "Band width" },
      angle: { default: 12, min: -45, max: 45, step: 1, unit: "deg", label: "Angle" },
      durationMs: { default: 900, min: 200, max: 3000, step: 10, unit: "ms", label: "Duration" },
    },
    // The band's first half (off-screen → centre) while a fill of its first
    // colour fades in behind it: the page is covered when the band is mid-way.
    in(ctx, p) {
      if (ctx.still) return Promise.resolve();
      const [c1, c2] = colours(ctx);
      const g = path(p);
      const layer = ctx.layer("band");
      layer.replaceChildren();
      const fill = fade("band", c1);
      const band = document.createElement("div");
      band.dataset.moBand = "band";
      Object.assign(band.style, {
        position: "absolute",
        left: `${-g.bw / 2}px`,
        top: `${-g.H / 2}px`,
        width: `${g.bw}px`,
        height: `${2 * g.H}px`,
        background: `linear-gradient(90deg, ${c1}, ${c2})`,
        transform: g.from,
        willChange: "transform",
      });
      layer.append(fill, band);
      const ms = (p.durationMs / 2) * ctx.k;
      const a = ctx.own(band.animate([{ transform: g.from }, { transform: g.mid }], { duration: ms, easing: ctx.ease("ease-in"), fill: "forwards" }));
      const b = ctx.own(fill.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms, easing: ctx.ease("standard"), fill: "forwards" }));
      return settle(ctx, [a, b]);
    },
    // The fill fades and the band finishes its travel off the right edge.
    out(ctx, p) {
      if (ctx.still) return Promise.resolve();
      const layer = ctx.layer("band");
      const band = layer.querySelector("[data-mo-band]"), fill = layer.querySelector("[data-mo-fill]");
      if (!band || !fill) { ctx.drop("band"); return Promise.resolve(); }
      const g = path(p);
      const ms = (p.durationMs / 2) * ctx.k;
      const a = ctx.own(band.animate([{ transform: g.mid }, { transform: g.to }], { duration: ms, easing: ctx.ease("ease-out"), fill: "forwards" }));
      const b = ctx.own(fill.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: ctx.ease("standard"), fill: "forwards" }));
      return settle(ctx, [a, b]).then(() => ctx.drop("band"));
    },
  },
  {
    kind: "cover",
    id: "dissolve",
    label: "Dissolve (ink fade)",
    source: "B4",
    labOnly: false,
    params: {
      durationMs: { default: 400, min: 100, max: 1500, step: 10, unit: "ms", label: "Duration" },
    },
    in(ctx, p) {
      if (ctx.still) return Promise.resolve();
      const layer = ctx.layer("dissolve");
      layer.replaceChildren();
      const fill = fade("dissolve", ctx.tokens.paper);
      layer.append(fill);
      const a = ctx.own(fill.animate([{ opacity: 0 }, { opacity: 1 }], { duration: p.durationMs * ctx.k, easing: ctx.ease("standard"), fill: "forwards" }));
      return settle(ctx, [a]);
    },
    out(ctx, p) {
      if (ctx.still) return Promise.resolve();
      const fill = ctx.layer("dissolve").querySelector("[data-mo-fill]");
      if (!fill) { ctx.drop("dissolve"); return Promise.resolve(); }
      const a = ctx.own(fill.animate([{ opacity: 1 }, { opacity: 0 }], { duration: p.durationMs * ctx.k, easing: ctx.ease("standard"), fill: "forwards" }));
      return settle(ctx, [a]).then(() => ctx.drop("dissolve"));
    },
  },
  {
    kind: "reveal",
    id: "dissolve",
    label: "Dissolve in",
    source: "B4",
    labOnly: false,
    params: {
      durationMs: { default: 320, min: 100, max: 1500, step: 10, unit: "ms", label: "Duration" },
    },
    // The pane fades in. fill "none" with no delay: the first frame is
    // opacity 0 at once, and when it ends (or is finished) the pane is back at
    // its own opacity with no inline style left behind.
    play(ctx, p) {
      if (ctx.still || !ctx.stage) return Promise.resolve();
      const a = ctx.own(ctx.stage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: p.durationMs * ctx.k, easing: ctx.ease("standard"), fill: "none" }));
      return settle(ctx, [a]);
    },
  },
];
