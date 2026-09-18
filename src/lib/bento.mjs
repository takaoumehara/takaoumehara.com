// Bento layouts: src/bento/<slug>.json describes a case study as rows of cells.
//
// A layout is deliberately not free-form. It is a list of ROWS, and every row
// names its height once and its cells' widths out of twelve. The build refuses
// a row whose widths do not add up to twelve, which is what guarantees the
// page tiles perfectly at every window width (src/styles/bento.css explains
// why the geometry works out that way).
//
// A case study with no file here keeps its hand-built body — the two live side
// by side on purpose while the set is converted one at a time.
import { assetExists } from "./site.mjs";

const files = import.meta.glob("../bento/*.json", { eager: true, import: "default" });
// The pages about the person live in their own folder, so their names can never
// collide with a case study's slug (tests/bento.test.mjs enforces one source per
// page, and "about" is a plausible slug for either).
const pageFiles = import.meta.glob("../bento/pages/*.json", { eager: true, import: "default" });

const COLUMNS = 12;
const MEDIA_KINDS = new Set(["media", "video"]);
// A page of prose opens on a sentence rather than a picture.
const HERO_KINDS = new Set([...MEDIA_KINDS, "statement"]);

/** slug → layout, for every file in src/bento/. */
export function bentoLayouts() {
  const out = new Map();
  for (const [path, data] of Object.entries(files)) {
    out.set(path.split("/").pop().replace(/\.json$/, ""), data);
  }
  return out;
}

export const bentoLayout = (slug) => bentoLayouts().get(slug) ?? null;

/** name → layout, for every file in src/bento/pages/ (about, now, publications…). */
export function bentoPageLayouts() {
  const out = new Map();
  for (const [path, data] of Object.entries(pageFiles)) {
    out.set(path.split("/").pop().replace(/\.json$/, ""), data);
  }
  return out;
}

export const bentoPageLayout = (name) => bentoPageLayouts().get(name) ?? null;

/** Every row of a layout, flattened out of its sections, each with its section label. */
export function bentoRows(layout) {
  const rows = [];
  for (const section of layout.sections ?? []) {
    for (const row of section.rows ?? []) rows.push({ section, row });
  }
  return rows;
}

/** Whatever is wrong with a layout, in words. Empty when it is sound. */
export function validateBento(slug, layout, { checkAssets = true } = {}) {
  const errors = [];
  const where = `bento:${slug}`;
  // Site-relative paths must be on disk. An absolute URL (a YouTube embed) is
  // somebody else's file and is left alone.
  const seenAsset = (path, at) => {
    if (!path || /^https?:/.test(path)) return;
    if (checkAssets && !assetExists(path)) errors.push(`${where}: ${at} "${path}" does not exist on disk`);
  };

  if (!layout.hero) errors.push(`${where}: needs a hero`);
  else {
    const hero = layout.hero;
    const kind = hero.kind ?? "media";
    if (!HERO_KINDS.has(kind)) errors.push(`${where}: hero.kind must be "media", "video" or "statement"`);
    if (kind === "statement" && !hero.text) errors.push(`${where}: a statement hero needs hero.text`);
    seenAsset(hero.src, "hero.src");
    seenAsset(hero.poster, "hero.poster");
    for (const source of hero.sources ?? []) seenAsset(source.src, "hero.sources[].src");
  }

  // Exactly one <h1>: a case study's title band, or a prose page's statement hero.
  const statementHero = (layout.hero?.kind ?? "media") === "statement";
  if (statementHero && layout.title?.h1) errors.push(`${where}: a statement hero is already the <h1> — drop title.h1`);
  if (!statementHero && !layout.title?.h1) errors.push(`${where}: needs title.h1 — the page's one <h1>`);

  let index = 0;
  for (const { row } of bentoRows(layout)) {
    const at = `sections[..].rows[${index}]`;
    index += 1;
    const cells = row.cells ?? [];
    if (!cells.length) { errors.push(`${where}: ${at} has no cells`); continue; }
    const width = cells.reduce((sum, cell) => sum + (cell.w ?? 0), 0);
    if (width !== COLUMNS) {
      errors.push(`${where}: ${at} spans ${width} of ${COLUMNS} columns — a row must fill the grid exactly`);
    }
    if (!Number.isInteger(row.h) || row.h < 1 || row.h > 14) {
      errors.push(`${where}: ${at} needs an integer h between 1 and 14, got ${row.h}`);
    }
    for (const cell of cells) {
      // An <iframe> with no accessible name is a dead end for a screen reader.
      if (cell.kind === "embed" && !cell.title) errors.push(`${where}: ${at} an embed needs a title`);
      seenAsset(cell.src, `${at} ${cell.kind ?? "media"}.src`);
      seenAsset(cell.poster, `${at} ${cell.kind}.poster`);
      for (const source of cell.sources ?? []) seenAsset(source.src, `${at} ${cell.kind}.sources[].src`);
    }
  }
  return errors;
}

/** Throws on the first unsound layout, so a bad row fails the build rather than the page. */
export function validateAllBento(options) {
  const errors = [];
  for (const [slug, layout] of bentoLayouts()) errors.push(...validateBento(slug, layout, options));
  for (const [name, layout] of bentoPageLayouts()) errors.push(...validateBento(`pages/${name}`, layout, options));
  if (errors.length) throw new Error(`Bento layout validation failed (${errors.length}):\n  - ${errors.join("\n  - ")}`);
}
