// H2 monochrome graphic wipe (docs/motion-archive.md §H2; the original is
// docs/motion-lab/references/wipe.js + wipe.css): an ink shutter, optionally
// carrying a line of text, sweeps across, covers the page for the swap, then
// carries on off the far side. Contract: docs/motion-lab/engine-contract.md §2.
//
// Pure at import (no DOM until in()/out() run), so the registry loads in Node.
// Only transform is animated; the slant is a static clip-path on the shutter.

const AXIS = { ltr: "X", rtl: "X", ttb: "Y", btt: "Y" };
const SIGN = { ltr: -1, rtl: 1, ttb: -1, btt: 1 }; // the side it enters from (−: left / top)
const SLANT = 16.667; // % of a 120% shutter = the 20% it overhangs

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

// The shutter's box and clip for a direction and edge. A slanted shutter is
// 120% long on its travel axis, the extra 20% sitting on its leading side,
// and its leading edge runs diagonally across that extra, so at rest (0) it
// still covers the whole viewport.
function geometry(direction, edge) {
  const slant = edge === "slant";
  const long = slant ? "120%" : "100%";
  const over = slant ? "-20%" : "0";
  const s = SLANT, e = 100 - SLANT;
  const box = {
    ltr: { left: "0", top: "0", width: long, height: "100%" },
    rtl: { left: over, top: "0", width: long, height: "100%" },
    ttb: { left: "0", top: "0", width: "100%", height: long },
    btt: { left: "0", top: over, width: "100%", height: long },
  }[direction];
  const clip = !slant ? "" : {
    ltr: `polygon(0 0, 100% 0, ${e}% 100%, 0 100%)`,
    rtl: `polygon(0 0, 100% 0, 100% 100%, ${s}% 100%)`,
    ttb: `polygon(0 0, 100% 0, 100% ${e}%, 0 100%)`,
    btt: `polygon(0 0, 100% ${s}%, 100% 100%, 0 100%)`,
  }[direction];
  // Where the viewport sits inside the shutter at rest (for centring the text).
  const view = !slant ? "0" : {
    ltr: `0 ${s}% 0 0`, rtl: `0 0 0 ${s}%`, ttb: `0 0 ${s}% 0`, btt: `${s}% 0 0 0`,
  }[direction];
  return { box, clip, view };
}

const at = (direction, pct) => `translate${AXIS[direction]}(${pct}%)`;

export default [
  {
    kind: "cover",
    id: "wipe",
    label: "Graphic wipe (ink shutter)",
    source: "H2",
    labOnly: false,
    params: {
      direction: { default: "ltr", options: ["ltr", "rtl", "ttb", "btt"], label: "Direction" },
      durationMs: { default: 700, min: 100, max: 2000, step: 10, unit: "ms", label: "Duration" },
      edge: { default: "straight", options: ["straight", "slant"], label: "Leading edge" },
      text: { default: "", label: "Text" },
    },
    in(ctx, p) {
      if (ctx.still) return Promise.resolve();
      const direction = AXIS[p.direction] ? p.direction : "ltr";
      const { box, clip, view } = geometry(direction, p.edge);
      const layer = ctx.layer("wipe");
      layer.replaceChildren();
      const shutter = document.createElement("div");
      shutter.dataset.moWipe = "shutter";
      Object.assign(shutter.style, box, {
        position: "absolute",
        background: ctx.tokens.ink,
        transform: at(direction, SIGN[direction] * 100),
        willChange: "transform",
      });
      if (clip) shutter.style.clipPath = clip;
      const text = typeof p.text === "string" ? p.text.trim() : "";
      if (text) {
        const label = document.createElement("div");
        Object.assign(label.style, {
          position: "absolute",
          inset: view,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 8vw",
          textAlign: "center",
          color: ctx.tokens.paper,
          fontFamily: "var(--pr-ff-display, inherit)",
          fontSize: "clamp(20px, 4vw, 56px)",
          lineHeight: "1.1",
          letterSpacing: "-0.02em",
        });
        label.textContent = text;
        shutter.append(label);
      }
      layer.append(shutter);
      const a = ctx.own(shutter.animate(
        [{ transform: at(direction, SIGN[direction] * 100) }, { transform: at(direction, 0) }],
        { duration: p.durationMs * ctx.k, easing: ctx.ease("decel"), fill: "forwards" },
      ));
      return settle(ctx, [a]);
    },
    out(ctx, p) {
      if (ctx.still) return Promise.resolve();
      const direction = AXIS[p.direction] ? p.direction : "ltr";
      const shutter = ctx.layer("wipe").querySelector("[data-mo-wipe]");
      if (!shutter) { ctx.drop("wipe"); return Promise.resolve(); }
      const a = ctx.own(shutter.animate(
        [{ transform: at(direction, 0) }, { transform: at(direction, -SIGN[direction] * 100) }],
        { duration: p.durationMs * ctx.k, easing: ctx.ease("accel"), fill: "forwards" },
      ));
      return settle(ctx, [a]).then(() => ctx.drop("wipe"));
    },
  },
];
