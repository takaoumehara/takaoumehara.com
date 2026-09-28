// H3c breathing board (docs/motion-archive.md §H3, the prototype's
// animateLivingBoard in docs/motion-lab/references/living-architectural-slabs-v4.html):
// while a page is on screen, its cells drift a few pixels, turn a fraction of
// a degree and swell a hair, each on its own phase; with parallax on, they
// also lean a little toward the pointer.
//
// Contract: docs/motion-lab/engine-contract.md §2. start() returns stop()
// (not a promise). The drift is one WAAPI animation per cell, composite
// "add" so it stacks on whatever transform the cell already has; the
// parallax is the cell's `translate` property (it composes with `transform`).
// stop() cancels both and puts every inline style back as it was. Text is
// never touched. Pure at import: nothing touches the DOM until start() runs.

// The cells: a bento cell (the site and /lab/stage), a grid card, a news
// article, any card that links through data-href.
const CELLS = ".bento-cell, .grid-card, .hn-article, [data-href]";

const noop = () => {};

export default [
  {
    kind: "idle",
    id: "breathing",
    source: "H3c",
    label: "Breathing board",
    labOnly: false,
    params: {
      driftPx: { default: 3, min: 0, max: 12, step: 1, unit: "px", label: "Drift" },
      rotateDeg: { default: 0.4, min: 0, max: 3, step: 0.1, unit: "deg", label: "Turn" },
      scale: { default: 0.01, min: 0, max: 0.05, step: 0.005, label: "Swell" },
      periodMs: { default: 6000, min: 2000, max: 20000, step: 500, unit: "ms", label: "Period" },
      parallax: { default: true, label: "Pointer parallax" },
      parallaxPx: { default: 4, min: 0, max: 16, step: 1, unit: "px", label: "Parallax" },
    },
    start(ctx, p) {
      if (ctx.still || !ctx.stage) return noop;
      // The outermost cells only: a card inside a cell moves with its cell.
      const cells = [...ctx.stage.querySelectorAll(CELLS)].filter((el) => {
        const up = el.parentElement?.closest(CELLS);
        return !up || !ctx.stage.contains(up);
      });
      if (!cells.length) return noop;

      const sign = () => (Math.random() < 0.5 ? -1 : 1);
      const anims = cells.map((el) => {
        const to = `translate(${sign() * p.driftPx}px, ${sign() * p.driftPx}px) rotate(${sign() * p.rotateDeg}deg) scale(${1 + p.scale})`;
        // A random start within the first period is each cell's phase; it
        // begins from where it rests, so nothing jumps.
        return ctx.own(el.animate([{ transform: "none" }, { transform: to }], {
          duration: p.periodMs,
          delay: Math.random() * p.periodMs,
          iterations: Infinity,
          direction: "alternate",
          easing: "ease-in-out",
          composite: "add",
        }));
      });

      // Parallax: the pointer's position (−1..1 on each axis), eased toward
      // on animation frames; each cell at its own depth.
      const saved = cells.map((el) => [el.hasAttribute("style"), el.style.translate]);
      const depth = cells.map(() => 0.5 + Math.random() * 0.5);
      let tx = 0, ty = 0, cx = 0, cy = 0, frame = 0;
      const tick = () => {
        frame = 0;
        cx += (tx - cx) * 0.12;
        cy += (ty - cy) * 0.12;
        if (Math.abs(tx - cx) < 0.002 && Math.abs(ty - cy) < 0.002) { cx = tx; cy = ty; }
        cells.forEach((el, i) => {
          el.style.translate = `${(cx * p.parallaxPx * depth[i]).toFixed(2)}px ${(cy * p.parallaxPx * depth[i]).toFixed(2)}px`;
        });
        if (cx !== tx || cy !== ty) frame = requestAnimationFrame(tick);
      };
      const move = (e) => {
        tx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth - 0.5) * 2));
        ty = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight - 0.5) * 2));
        if (!frame) frame = requestAnimationFrame(tick);
      };
      const parallax = p.parallax && p.parallaxPx > 0;
      if (parallax) window.addEventListener("pointermove", move, { passive: true });

      let stopped = false;
      return function stop() {
        if (stopped) return;
        stopped = true;
        anims.forEach((a) => { try { a.cancel(); } catch (e) {} });
        if (parallax) {
          window.removeEventListener("pointermove", move);
          cancelAnimationFrame(frame);
          cells.forEach((el, i) => {
            const [had, was] = saved[i];
            el.style.translate = was;
            if (!had && el.getAttribute("style") === "") el.removeAttribute("style");
          });
        }
      };
    },
  },
];
