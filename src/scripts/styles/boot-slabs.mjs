// H3a slab boot (docs/motion-archive.md §H3, the prototype's playIntroSequence
// in docs/motion-lab/references/living-architectural-slabs-v4.html): a
// checker of ink / paper slabs slides in from the four sides, turning as it
// comes, and locks into a board that covers the viewport; a snap when the
// last one lands; then the board fades off the page underneath.
//
// Contract: docs/motion-lab/engine-contract.md §2. WAAPI only, transform and
// opacity only, every Animation through ctx.own (an input finishes it all at
// once), the board drawn on ctx.layer("boot") and dropped at the end.
// Pure at import: nothing touches the DOM until play() runs.

// The prototype's power4.out (easeOutQuint) as a cubic-bezier.
const POWER4_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
// The side each slab comes in from, in turn: left, top, right, bottom.
const SIDES = [[-1, 0], [0, -1], [1, 0], [0, 1]];

const settle = (anims) => Promise.allSettled(anims.map((a) => a.finished));

export default [
  {
    kind: "boot",
    id: "slabs-puzzle",
    source: "H3a",
    label: "Slab puzzle (boot)",
    labOnly: false,
    params: {
      grid: { default: 3, min: 2, max: 4, step: 1, label: "Grid (n×n)" },
      radiusPx: { default: 22, min: 0, max: 48, step: 1, unit: "px", label: "Corner radius" },
      rotateDeg: { default: 12, min: 0, max: 45, step: 1, unit: "deg", label: "Entry rotation" },
      stepMs: { default: 25, min: 0, max: 120, step: 5, unit: "ms", label: "Stagger" },
      durationMs: { default: 620, min: 200, max: 2000, step: 10, unit: "ms", label: "Slide in" },
      holdMs: { default: 240, min: 0, max: 1500, step: 10, unit: "ms", label: "Hold" },
      leaveMs: { default: 360, min: 100, max: 1500, step: 10, unit: "ms", label: "Leave" },
    },
    async play(ctx, p) {
      if (ctx.still) return;
      const n = Math.round(p.grid);
      const count = n * n;
      // Every duration scaled by the speed, and squeezed to fit the cap.
      const total = ((count - 1) * p.stepMs + p.durationMs + p.holdMs + p.leaveMs) * ctx.k;
      const f = ctx.k * Math.min(1, ctx.capMs / Math.max(1, total));

      const layer = ctx.layer("boot");
      const size = `${100 / n}%`;
      const slabs = [];
      for (let i = 0; i < count; i++) {
        const r = Math.floor(i / n), c = i % n;
        const ink = (r + c) % 2 === 0;
        const el = document.createElement("div");
        el.style.cssText = [
          "position:absolute",
          `left:${(100 / n) * c}%`,
          `top:${(100 / n) * r}%`,
          `width:${size}`,
          `height:${size}`,
          `border-radius:${p.radiusPx}px`,
          `background:${ink ? ctx.tokens.ink : ctx.tokens.paper}`,
          ink ? "" : `box-shadow:inset 0 0 0 1px ${ctx.tokens.line}`,
          "will-change:transform",
        ].filter(Boolean).join(";");
        layer.append(el);
        slabs.push(el);
      }
      const alive = () => layer.isConnected; // an input (finishAll) drops the layer

      // In: each slab from off-screen on its side, turned, and a little large.
      const ins = slabs.map((el, i) => {
        const [sx, sy] = SIDES[i % 4];
        const turn = (i % 2 ? 1 : -1) * p.rotateDeg;
        const from = `translate(${sx * 120}vw, ${sy * 120}vh) rotate(${turn}deg) scale(1.05)`;
        return ctx.own(el.animate(
          [{ transform: from }, { transform: "translate(0, 0) rotate(0deg) scale(1)" }],
          { duration: p.durationMs * f, delay: i * p.stepMs * f, easing: POWER4_OUT, fill: "both" },
        ));
      });
      await settle(ins);
      if (!alive()) return;
      ctx.sound.play("snap");

      // Hold: an owned no-op animation, so an input cuts it short too.
      if (p.holdMs > 0) {
        await settle([ctx.own(layer.animate([{ opacity: 1 }, { opacity: 1 }], { duration: p.holdMs * f }))]);
        if (!alive()) return;
      }

      // Out: the whole board fades and swells a little.
      const outs = slabs.map((el) => ctx.own(el.animate(
        [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.04)" }],
        { duration: p.leaveMs * f, easing: "ease-in", fill: "forwards" },
      )));
      await settle(outs);
      ctx.drop("boot");
    },
  },
];
