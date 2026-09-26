// The right pane's choreography, on the first load and on every client-side
// navigation. The rail boots by drawing its blocks first and filling them in;
// the pane now does the same:
//
//   OUT   (astro:before-preparation, in parallel with the fetch) — every cell
//         on screen empties and shrinks away, each on its own short random
//         delay (≤ ~220ms in all). Cells off screen are not animated.
//   BOXES (astro:after-swap, or the first paint) — the new page's cells come
//         back as their empty grey blocks first, each at a random moment.
//   CONTENT — then, per cell: media steps in (a mono "NOW LOADING…" holds its
//         place only if the image is not decoded yet), then the type wakes
//         up — headings and short lines decode from random glyphs, left to
//         right; longer paragraphs rise in as a block.
//
// Cells below the fold wait (.mo-wait) and play the same sequence once, when
// they scroll into view. Nothing ever blocks input: a pointerdown or keydown
// anywhere finishes everything at once. Every animation is WAAPI with
// fill: "backwards" (so at rest nothing is left dimmed or moved), except the
// OUT, which holds its end state until the page it belongs to is swapped out.
// Under prefers-reduced-motion none of this runs.
//
// Text: only the data of leaf text nodes is ever changed, temporarily, and
// the exact original string is written back; elements, attributes and the
// .t-en/.t-jp structure are never touched. Each scrambled block keeps its
// size for the length of the decode (a WAAPI width/height hold), whitespace
// and punctuation stay put, and letters are swapped for letters of the same
// case (full-width glyphs for Japanese), so lines do not rewrap. While any
// of this is running #main carries aria-busy="true"; the decode lasts well
// under a second and ends on the real text.

const html = document.documentElement;
const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const rand = (a, b) => a + Math.random() * (b - a);
const DECEL = "cubic-bezier(0.16, 1, 0.3, 1)"; // --ease-decel
const ACCEL = "cubic-bezier(0.4, 0, 1, 1)";

// A pane "unit": a bento cell (or a detail page's beat, which becomes one at
// page-load), the home stage and its caption bar. Anything else in the pane
// that holds no unit — a page header, the /work filter bar, the footer — is a
// unit of its own, without a box stage.
const UNIT = ".bento-cell, .project-beats > .beat, .hh-stage, .hh-bar";
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEMPLATE", "LINK", "META", "NOSCRIPT"]);
const NO_TEXT = "script, style, noscript, svg, textarea, select, .sr-only, .vh, .mo-loading";
const ARROW = /[→↗]\s*$/; // site.js splits these off into .mag-arrow; leave them be

function unitsOf(root) {
  const out = [];
  const walk = (el) => {
    for (const child of el.children) {
      if (SKIP_TAGS.has(child.tagName)) continue;
      if (child.matches(UNIT)) out.push(child);
      else if (child.querySelector(UNIT)) walk(child);
      else out.push(child);
    }
  };
  if (root) walk(root);
  return out;
}
const inView = (r, margin = 0) => r.width > 0 && r.height > 0 && r.bottom > -margin && r.top < window.innerHeight + margin;
const hasBox = (el) => {
  const cs = getComputedStyle(el);
  if (cs.backgroundImage && cs.backgroundImage !== "none") return true;
  const m = cs.backgroundColor.match(/[\d.]+/g);
  return Boolean(m) && (m.length < 4 || Number(m[3]) > 0);
};
// Visible inside its unit: rendered, not visibility:hidden, and no ancestor
// between it and the unit at opacity 0 (a slide or caption that is not the
// active one). The unit's own opacity is ours, so it is not consulted.
function shown(el, unit, cache) {
  if (el.checkVisibility ? !el.checkVisibility({ visibilityProperty: true }) : !el.getClientRects().length) return false;
  for (let n = el; n && n !== unit; n = n.parentElement) {
    let o = cache.get(n);
    if (o === undefined) { o = getComputedStyle(n).opacity; cache.set(n, o); }
    if (o === "0") return false;
  }
  return true;
}

// ── Bookkeeping: everything we start can be finished at once ─────────────
const anims = new Set();
const finishers = new Set(); // media waiting to load, labels to remove
let busyUntil = 0, busyTimer = 0;
function own(a) {
  anims.add(a);
  const drop = () => anims.delete(a);
  a.finished.then(drop, drop);
  return a;
}
function busy(ms) {
  const main = document.getElementById("main");
  if (!main) return;
  busyUntil = Math.max(busyUntil, performance.now() + ms);
  main.setAttribute("aria-busy", "true");
  clearTimeout(busyTimer);
  busyTimer = setTimeout(unbusy, busyUntil - performance.now() + 20);
}
function unbusy() {
  clearTimeout(busyTimer);
  busyUntil = 0;
  document.getElementById("main")?.removeAttribute("aria-busy");
}
export function finishAll() {
  finishers.forEach((fn) => fn());
  finishers.clear();
  anims.forEach((a) => { try { a.finish(); } catch (e) { a.cancel(); } });
  anims.clear();
  settleText();
  unbusy();
}

// ── Scramble: random glyphs resolve left → right into the real text ──────
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGIT = "0123456789";
const SYMBOL = "#%&*+=/<>?!$@";
const KANA = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン日月火水木金土山川田人口目手力文字";
const pick = (set) => set[(Math.random() * set.length) | 0];
function glyph(c) {
  if (c >= "A" && c <= "Z") return Math.random() < 0.15 ? pick(SYMBOL) : pick(UPPER);
  if (c >= "a" && c <= "z") return pick(LOWER);
  if (c >= "0" && c <= "9") return pick(DIGIT);
  if (/[぀-ヿ㐀-鿿ｦ-ﾟ]/.test(c)) return pick(KANA);
  if (/[\p{L}\p{N}]/u.test(c)) return pick(c === c.toUpperCase() ? UPPER : LOWER);
  return c; // whitespace, punctuation, arrows: kept, so words and wraps stay put
}
function garble(chars, p) {
  const done = Math.floor(chars.length * (1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 2)));
  let s = "";
  for (let i = 0; i < chars.length; i++) s += i < done ? chars[i] : glyph(chars[i]);
  return s;
}
const texts = new Set();
let textRaf = 0;
function scramble(node, start, dur) {
  const orig = node.data;
  const rec = { node, orig, chars: Array.from(orig), start, dur, tick: 0, last: "" };
  rec.last = node.data = garble(rec.chars, 0);
  texts.add(rec);
  if (!textRaf) textRaf = requestAnimationFrame(textFrame);
}
function textFrame(now) {
  textRaf = 0;
  for (const r of texts) {
    if (r.node.data !== r.last) { texts.delete(r); continue; } // someone else rewrote it: theirs wins
    const p = (now - r.start) / r.dur;
    if (p >= 1) { r.node.data = r.orig; texts.delete(r); continue; }
    if (p < 0 || now - r.tick < 45) continue; // a flicker, not a blur of glyphs
    r.tick = now;
    r.last = r.node.data = garble(r.chars, p);
  }
  if (texts.size) textRaf = requestAnimationFrame(textFrame);
}
function settleText() {
  texts.forEach((r) => { if (r.node.data === r.last) r.node.data = r.orig; });
  texts.clear();
  cancelAnimationFrame(textRaf);
  textRaf = 0;
}

// ── A unit's content: its media and its text blocks ──────────────────────
const displayOf = (el, cache) => {
  let d = cache.get(el);
  if (d === undefined) { d = getComputedStyle(el).display; cache.set(el, d); }
  return d;
};
function textBlocks(unit, vis) {
  const disp = new Map();
  const blocks = new Map();
  const walker = document.createTreeWalker(unit, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.data.trim() && n.parentElement && !n.parentElement.closest(NO_TEXT) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!shown(n.parentElement, unit, vis)) continue;
    let b = n.parentElement;
    while (b !== unit && b.parentElement && /^(inline|contents)$/.test(displayOf(b, disp))) b = b.parentElement;
    if (!blocks.has(b)) blocks.set(b, []);
    blocks.get(b).push(n);
  }
  return [...blocks].map(([el, nodes]) => {
    const len = nodes.reduce((s, n) => s + n.data.trim().length, 0);
    const heading = /^H[1-6]$/.test(el.tagName) || el.matches(".beat-title");
    const r = el.getBoundingClientRect();
    const near = inView(r, 120);
    return { el, nodes, len, rect: r, scramble: near && (heading ? len <= 140 : len <= 80) };
  });
}
function mediaOf(unit, vis) {
  return [...unit.querySelectorAll("img, video, canvas, iframe")].filter((m) => {
    if (m.closest("svg")) return false;
    const r = m.getBoundingClientRect();
    return r.width >= 40 && r.height >= 40 && shown(m, unit, vis);
  });
}
const ready = (m) => {
  if (m.tagName === "IMG") return m.complete;
  if (m.tagName === "VIDEO") return m.readyState >= 2;
  return true;
};

// A mono "NOW LOADING" over media that is not in yet. Placed in document
// coordinates on <body> so no cell's own styles are touched; aria-hidden.
function loadingLabel(media) {
  const r = media.getBoundingClientRect();
  const label = document.createElement("span");
  label.className = "mo-loading";
  label.setAttribute("aria-hidden", "true");
  label.textContent = "NOW LOADING";
  label.style.top = `${r.top + window.scrollY}px`;
  label.style.left = `${r.left + window.scrollX}px`;
  label.style.width = `${r.width}px`;
  document.body.append(label);
  return label;
}

// ── IN: box first, then media, then type ─────────────────────────────────
const HIDDEN_CLIP = "inset(0 0 100% 0)";
function revealUnit(unit, at, { dir = 0, speed = 1 } = {}) {
  unit.classList.remove("mo-wait");
  const k = speed;
  const vis = new Map();
  const box = unit.matches(UNIT) && hasBox(unit);
  let t = at;

  if (box) {
    own(unit.animate(
      [{ opacity: 0, transform: `translateY(${dir * 6}px) scale(0.975)` }, { opacity: 1, transform: "none" }],
      { duration: 240 * k, delay: t, easing: DECEL, fill: "backwards" },
    ));
    t += (110 + rand(0, 40)) * k; // the empty box is seen before anything lands in it
  } else if (dir) {
    own(unit.animate([{ transform: `translateY(${dir * 6}px)` }, { transform: "none" }], { duration: 300 * k, delay: t, easing: DECEL, fill: "backwards" }));
  }

  // Everything inside the box appears at `t`; media and text then refine it.
  [...unit.children].forEach((kid) => {
    if (SKIP_TAGS.has(kid.tagName) || !shown(kid, unit, vis)) return;
    own(kid.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 90 * k, delay: t, fill: "backwards" }));
  });
  if (!unit.children.length && !box) {
    own(unit.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 90 * k, delay: t, fill: "backwards" }));
  }

  const media = mediaOf(unit, vis);
  let textAt = t;
  let end = t + 200 * k;
  media.forEach((m) => {
    const reveal = (delay = 0) => own(m.animate(
      [{ clipPath: HIDDEN_CLIP }, { clipPath: "inset(0 0 0 0)" }],
      { duration: 180 * k, delay, easing: "steps(4, end)", fill: "backwards" },
    ));
    if (ready(m)) { reveal(t); return; }
    // Not in yet: hold it, and let the label hold its place from `t`.
    const hold = own(m.animate([{ clipPath: HIDDEN_CLIP }, { clipPath: HIDDEN_CLIP }], { duration: t + 1400 }));
    let label = null, done = false;
    const show = () => {
      if (done) return;
      done = true;
      finishers.delete(finish);
      clearTimeout(timer);
      label?.remove();
      hold.cancel();
      reveal(0);
    };
    const finish = () => { done = true; clearTimeout(timer); label?.remove(); hold.cancel(); };
    finishers.add(finish);
    const timer = setTimeout(() => {
      if (ready(m)) return show();
      label = loadingLabel(m);
      m.addEventListener(m.tagName === "VIDEO" ? "loadeddata" : "load", show, { once: true });
      m.addEventListener("error", show, { once: true });
      setTimeout(show, 1100); // never hold the page for a slow image
    }, t);
    textAt = t + 180 * k; // the label wakes first, then the type, whatever the image does
  });
  if (media.length) textAt = Math.max(textAt, t + 80 * k);

  const blocks = textBlocks(unit, vis);
  blocks.forEach((b, i) => {
    const start = textAt + (Math.min(i, 6) * 28 + rand(0, 50)) * k;
    if (b.scramble) {
      const dur = Math.min(420, 280 + b.len * 3) * Math.max(0.7, k);
      const cs = getComputedStyle(b.el);
      // Keep the block's box exactly as it is while its glyphs flicker.
      own(b.el.animate([{ width: cs.width, height: cs.height }, { width: cs.width, height: cs.height }], { duration: start + dur }));
      own(b.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 60, delay: start, fill: "backwards" }));
      const t0 = performance.now() + start;
      b.nodes.forEach((n) => { if (!ARROW.test(n.data)) scramble(n, t0, dur); });
      end = Math.max(end, start + dur);
    } else {
      const dur = 320 * k;
      own(b.el.animate(
        [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }],
        { duration: dur, delay: start, easing: DECEL, fill: "backwards" },
      ));
      end = Math.max(end, start + dur);
    }
  });
  return end;
}

// Units on screen play now, each at its own random moment (with a slight
// top-to-bottom lean); the rest wait for the viewport, once.
let io = null;
function watch(unit, opts) {
  if (!("IntersectionObserver" in window)) { unit.classList.remove("mo-wait"); return; }
  io ??= new IntersectionObserver((entries) => {
    const batch = entries.filter((e) => e.isIntersecting);
    let end = 0;
    batch.forEach((e) => {
      io.unobserve(e.target);
      if (still()) { e.target.classList.remove("mo-wait"); return; }
      end = Math.max(end, revealUnit(e.target, rand(0, 120), { speed: opts.speed }));
    });
    if (end) busy(end);
  }, { rootMargin: "0px" });
  unit.classList.add("mo-wait");
  io.observe(unit);
}
function choreograph({ base = 0, speed = 1, dir = 0 } = {}) {
  const main = document.getElementById("main");
  const units = unitsOf(main);
  const now = [];
  units.forEach((u) => {
    const r = u.getBoundingClientRect();
    if (inView(r)) now.push([u, r]);
    else watch(u, { speed });
  });
  let end = 0;
  now.forEach(([u, r]) => {
    const lean = Math.min(1, Math.max(0, r.top / window.innerHeight)) * 50;
    const at = base + (rand(0, 140) + lean) * speed;
    end = Math.max(end, revealUnit(u, at, { dir, speed }));
  });
  if (end) busy(end);
}
function reset() {
  finishAll();
  io?.disconnect();
  io = null;
  document.querySelectorAll(".mo-loading").forEach((el) => el.remove());
}

// ── OUT: the cells on screen empty and shrink away ───────────────────────
function paneOut(dir) {
  const main = document.getElementById("main");
  const done = [];
  unitsOf(main).forEach((u) => {
    const r = u.getBoundingClientRect();
    if (!inView(r)) return;
    const d = rand(0, 50);
    [...u.children].forEach((kid) => {
      if (!SKIP_TAGS.has(kid.tagName)) own(kid.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 80, delay: d, easing: ACCEL, fill: "forwards" }));
    });
    const a = own(u.animate(
      [{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateY(${-dir * 8}px) scale(0.96)` }],
      { duration: 130, delay: d + 40, easing: ACCEL, fill: "forwards" },
    ));
    done.push(a.finished.catch(() => {}));
  });
  return Promise.all(done);
}
function cancelOut() {
  anims.forEach((a) => a.cancel());
  anims.clear();
}

// ── Wiring (called from site.js) ─────────────────────────────────────────
// `dir` is +1 when the destination sits lower in the rail than the page you
// are on, −1 when higher, 0 otherwise (site.js's Direction).
export function onBeforePreparation(event, dir) {
  finishAll();
  if (still()) return;
  const out = paneOut(dir);
  const load = event.loader;
  event.loader = async () => {
    try { await Promise.all([load(), out]); } catch (e) { cancelOut(); throw e; }
  };
}
export function onAfterSwap(dir) {
  reset();
  if (still()) return;
  choreograph({ dir });
}
// The first paint. Sidebar.astro's inline script set html[data-mo-intro]
// ("boot" on the first load of the session, "reload" after) and CSS keeps the
// pane transparent until this runs (with a timeout of its own, in case this
// never does). The first load waits for the rail's boot to begin; a later
// full reload plays the same sequence at 0.6× the timings.
export function intro() {
  const mode = html.getAttribute("data-mo-intro");
  if (mode === null) return;
  if (!still()) choreograph(mode === "boot" ? { base: 180, speed: 1 } : { base: 0, speed: 0.6 });
  html.removeAttribute("data-mo-intro");
}

let bound = false;
export function bindMotion() {
  if (bound) return;
  bound = true;
  // Input always wins: the first press or key finishes whatever is playing.
  const settle = () => { if (anims.size || texts.size || finishers.size) finishAll(); };
  document.addEventListener("pointerdown", settle, { capture: true, passive: true });
  document.addEventListener("keydown", settle, { capture: true });
  document.addEventListener("copy", settle, { capture: true });
  // A page restored from the back/forward cache after a full navigation that
  // began as a client-side one must not come back with its cells gone.
  window.addEventListener("pageshow", (e) => { if (e.persisted) cancelOut(); });
}
