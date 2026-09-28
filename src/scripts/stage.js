// The other stages of /lab/stage (src/pages/lab/[page].astro): the pane
// rebuilt as the visitor's own page, so the same engine (motion.js) plays
// over it. The tool at /lab/motion sends what to show by postMessage.
//
//   ?stage=shot  a screenshot sliced into rows × cols .bento-cell tiles that
//                reassemble it, under a header cell whose H1 is the title;
//   ?stage=peek  a template from a URL's metadata: teaser image, H1 title,
//                one-line description, two grey cards, a strip of 3 crops.
//
// Everything is written with textContent / src / style, never HTML.

const clamp = (v, lo, hi, dflt) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
};

/** The stage's URL params, validated. */
export function readStageParams(search) {
  const q = new URLSearchParams(search);
  const stage = ["site", "shot", "peek"].includes(q.get("stage")) ? q.get("stage") : "site";
  return {
    stage,
    rows: clamp(q.get("rows"), 2, 6, 4),
    cols: clamp(q.get("cols"), 2, 6, 3),
    title: (q.get("title") || "").trim().slice(0, 120) || "Your site",
    phone: q.get("frame") === "phone",
    bar: q.get("bar") !== "0",
  };
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function header(title, line) {
  const cell = el("div", "bento-cell st-header");
  cell.append(el("h1", "st-title", title));
  if (line) cell.append(el("p", "st-oneliner", line));
  return cell;
}

const placeholder = (text) => {
  const cell = el("div", "bento-cell st-placeholder");
  cell.append(el("p", "st-label", text));
  return cell;
};

// ── Screenshot ──────────────────────────────────────────────────────────────
let shotImage = null, shotObserver = null;

/** Sizes each tile's background so the tiles, gaps and all, show one image: covering the grid, top-aligned. */
export function layoutTiles(grid) {
  if (!grid || !shotImage) return;
  const W = grid.clientWidth, H = grid.clientHeight;
  const w = shotImage.naturalWidth || 1, h = shotImage.naturalHeight || 1;
  const s = Math.max(W / w, H / h);
  const SW = w * s, SH = h * s, ox = (SW - W) / 2;
  for (const t of grid.children) {
    t.style.backgroundSize = `${SW}px ${SH}px`;
    t.style.backgroundPosition = `${-(t.offsetLeft + ox)}px ${-t.offsetTop}px`;
  }
}

/** Rebuilds the pane as the screenshot stage; resolves once the image (if any) is decoded and laid out. */
export async function buildShot(main, { rows, cols, title, dataUrl }) {
  shotObserver?.disconnect();
  shotImage = null;
  const ok = typeof dataUrl === "string" && /^data:image\/[\w.+-]+;base64,/.test(dataUrl);
  if (ok) {
    const img = new Image();
    img.src = dataUrl;
    try { await img.decode(); shotImage = img; } catch (e) { shotImage = null; }
  }
  const head = header(title);
  if (!shotImage) {
    main.replaceChildren(head, placeholder(ok ? "That image could not be read" : "Drop a screenshot in the tool"));
    return;
  }
  const grid = el("div", "st-tiles");
  grid.style.gridTemplate = `repeat(${rows}, minmax(0, 1fr)) / repeat(${cols}, minmax(0, 1fr))`;
  const url = `url("${dataUrl}")`;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = el("div", "bento-cell st-tile");
      t.dataset.tile = `${r}-${c}`;
      t.style.backgroundImage = url;
      grid.append(t);
    }
  }
  main.replaceChildren(head, grid);
  layoutTiles(grid);
  shotObserver = new ResizeObserver(() => layoutTiles(grid));
  shotObserver.observe(grid);
}

// ── A URL's metadata ────────────────────────────────────────────────────────
const httpUrl = (v) => {
  try { const u = new URL(String(v)); return u.protocol === "http:" || u.protocol === "https:" ? u.href : null; } catch (e) { return null; }
};
const text = (v, max) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/** Rebuilds the pane as the URL template; meta = { title, description, image, site } or null (placeholder). */
export function buildPeek(main, meta) {
  if (!meta) {
    main.replaceChildren(header("Your site"), placeholder("Enter a URL in the tool"));
    return;
  }
  const image = httpUrl(meta.image);
  const site = text(meta.site, 120) || "—";
  const img = (pos) => {
    const i = el("img");
    i.src = image;
    i.alt = "";
    i.referrerPolicy = "no-referrer";
    if (pos) i.style.objectPosition = pos;
    return i;
  };
  const teaser = el("div", "bento-cell st-teaser");
  if (image) teaser.append(img());
  const card = (label, body) => {
    const c = el("div", "bento-cell st-card");
    c.append(el("p", "st-label", label), el("p", "st-text", body));
    return c;
  };
  const cs = el("div", "st-cs");
  cs.append(card("Site", site), card("Preview", "A template from the page's title, description and share image."));
  const strip = el("div", "st-strip");
  ["left", "center", "right"].forEach((pos, i) => {
    const c = el("div", "bento-cell st-card st-shot");
    if (image) c.append(img(`${pos} center`));
    c.append(el("p", "st-label", `0${i + 1}`));
    strip.append(c);
  });
  main.replaceChildren(teaser, header(text(meta.title, 200) || site, text(meta.description, 300)), cs, strip);
}
