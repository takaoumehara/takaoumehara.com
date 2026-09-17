// How a flat list of work becomes a bento.
//
// The grid is cut into ROWS, never into free-floating tiles. Every pattern's
// widths add up to twelve and every cell in a row shares one height, so the
// result tiles the twelve columns exactly — no holes, whatever order the cards
// come in and however many there are. Sizes vary from row to row, which is
// where the "big one, four small ones" rhythm comes from.
//
// The same table is used twice: once on the server, walked deterministically,
// so the HTML ships a real layout for a reader with no JavaScript; and once in
// the browser, walked with Math.random(), so the page re-cuts itself on every
// reload. src/components/landing/LandingGrid.astro hands this table to the
// inline script with define:vars, so the two can never drift apart.

export const BENTO_PATTERNS = [
  { w: [12], h: [5, 6] },
  { w: [6, 6], h: [4, 5, 6] },
  { w: [6, 6], h: [3] },
  { w: [4, 4, 4], h: [3, 4, 5] },
  { w: [3, 3, 3, 3], h: [3, 4, 5] },
  { w: [6, 3, 3], h: [4, 5] },
  { w: [3, 3, 6], h: [4, 5] },
  { w: [4, 4, 4], h: [4] },
];

// The page opens on one of these: something wide enough to be a first
// impression rather than a thumbnail.
export const BENTO_OPENERS = [
  { w: [12], h: [6] },
  { w: [6, 6], h: [5] },
  { w: [6, 3, 3], h: [5] },
];

/**
 * `count` cards → one { w, h } per card, in order.
 * `pick(n)` returns an integer in [0, n): Math.random-based in the browser,
 * deterministic on the server.
 */
export function cutBento(count, pick) {
  const shapes = [];
  let left = count;
  let first = true;
  while (left > 0) {
    const table = first ? BENTO_OPENERS : BENTO_PATTERNS;
    first = false;
    const options = table.filter((p) => p.w.length <= left);
    const pattern = options.length ? options[pick(options.length)] : { w: [12], h: [5] };
    const h = pattern.h[pick(pattern.h.length)];
    for (const w of pattern.w) {
      if (left === 0) break;
      shapes.push({ w, h });
      left -= 1;
    }
  }
  return shapes;
}

/** A fresh pick() with no randomness in it, for the HTML the build writes out.
 *  A factory, not a shared closure: /  and /ja/ must come out identical. */
export function steadyPick() {
  let step = 0;
  return (n) => {
    step += 1;
    return (step * 5 + 2) % n;
  };
}
