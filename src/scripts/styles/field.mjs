// H1 gradient field (docs/motion-archive.md §H1; the original is
// docs/motion-lab/references/handoff.js). The destination's two colours
// (ctx.tint, from src/data/tints.json or html[data-tint]) laid out as the old
// --tu-field: two radial washes over a linear gradient, mixed in oklab. With
// no tint the field is drawn from the site's own ink / paper tokens.
//
//   field       the "veil" shape as a cover: the field fades up over the page
//               (colour, then page, never white) and lifts after the swap.
//   field-lift  the same veil as a reveal on its own: the new page is already
//               there under a wash of its colour, which fades off.
//
// Dropped from handoff.js: the "image" shape (a thumbnail flying to
// full-bleed needs the clicked element, which a cover does not get) and the
// hover lighting of the index (not a transition). Only opacity / transform
// are animated; the gradient is a static background on the layer.
//
// Pure at import: the DOM is touched only inside in / out / play.

const ms = (ctx, v) => Math.max(0, Math.min(Number(v) * ctx.k, ctx.capMs));

// The one definition of the field (handoff.js's --tu-field), at any angle.
function field(ctx, angle) {
  const [a, b] = ctx.tint ?? [ctx.tokens.ink, ctx.tokens.paper];
  return [
    `radial-gradient(122% 92% at 18% 10%, color-mix(in oklab, ${a} 74%, white) 0%, transparent 60%)`,
    `radial-gradient(104% 84% at 84% 90%, color-mix(in oklab, ${b} 84%, black) 0%, transparent 64%)`,
    `linear-gradient(${Number(angle)}deg, ${a} 0%, ${b} 100%)`,
  ].join(", ");
}

// One owned WAAPI animation; resolves when it ends, however it ends.
function play(ctx, el, frames, duration, easing) {
  const a = ctx.own(el.animate(frames, { duration, easing, fill: "both" }));
  return a.finished.then(() => {}, () => {});
}

const angle = { default: 152, min: 0, max: 360, step: 1, unit: "deg", label: "Gradient angle" };

export default [
  {
    kind: "cover",
    id: "field",
    label: "Gradient field",
    source: "H1",
    labOnly: false,
    params: {
      angle,
      veilMs: { default: 420, min: 100, max: 1500, step: 10, unit: "ms", label: "Veil fade in" },
      liftMs: { default: 440, min: 100, max: 1500, step: 10, unit: "ms", label: "Lift" },
      lift: { default: "fade", options: ["fade", "up"], label: "Lift shape" },
    },
    async in(ctx, p) {
      if (ctx.still) return;
      const el = ctx.layer("field");
      el.style.background = field(ctx, p.angle);
      await play(ctx, el, [{ opacity: 0 }, { opacity: 1 }], ms(ctx, p.veilMs), ctx.ease("ease"));
    },
    async out(ctx, p) {
      if (!ctx.still) {
        const el = ctx.layer("field");
        const frames = p.lift === "up"
          ? [{ opacity: 1, transform: "translate3d(0, 0, 0)" }, { opacity: 1, transform: "translate3d(0, -100%, 0)" }]
          : [{ opacity: 1 }, { opacity: 0 }];
        await play(ctx, el, frames, ms(ctx, p.liftMs), ctx.ease("decel"));
      }
      ctx.drop("field");
    },
  },
  {
    kind: "reveal",
    id: "field-lift",
    label: "Field lift (colour → page)",
    source: "H1",
    labOnly: false,
    params: {
      angle,
      durationMs: { default: 440, min: 100, max: 1500, step: 10, unit: "ms", label: "Duration" },
      startOpacity: { default: 0.9, min: 0, max: 1, step: 0.05, label: "Start opacity" },
    },
    async play(ctx, p) {
      if (!ctx.still) {
        const el = ctx.layer("field");
        el.style.background = field(ctx, p.angle);
        await play(ctx, el, [{ opacity: p.startOpacity }, { opacity: 0 }], ms(ctx, p.durationMs), ctx.ease("decel"));
      }
      ctx.drop("field");
    },
  },
];
