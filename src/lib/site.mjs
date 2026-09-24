// The evidence library, the lenses and the categories as the Astro pages see
// them. Everything comes in through Vite's import.meta.glob, so it is bundled
// at build time — the on-demand /lens/preview route and the /api functions
// carry the data with them instead of reading src/ from disk at request time.
//
// validateAll() runs once per build. An invalid record, an invented number or a
// notMine phrase in a lens aborts the build, exactly as src/build.mjs used to.
import { assembleLibrary, sourceExists } from "./load.mjs";
import { validateAll } from "../validate.mjs";
import lexicon from "../analyze/lexicon.json";

const dataFiles = import.meta.glob("../data/**/*.json", { eager: true, import: "default" });
const lensFiles = import.meta.glob("../lenses/*.json", { eager: true, import: "default" });
const categoryFiles = import.meta.glob("../categories/*.json", { eager: true, import: "default" });

const rel = (path, dir) => path.slice(path.indexOf(`/${dir}/`) + dir.length + 2);

function buildLibrary() {
  const files = {};
  for (const [path, data] of Object.entries(dataFiles)) files[rel(path, "data")] = data;
  return assembleLibrary(files);
}

const byFile = (map) => Object.entries(map)
  .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  .map(([path, data]) => ({ ...data, _file: path.split("/").pop() }));

/** Build time only: the prerender step runs from a bundle, so the check is by the project root (cwd). */
export const assetExists = (path) => sourceExists(path, process.cwd());

let cache = null;
/**
 * Library + lenses + categories, validated once. Throws (and so fails the build)
 * on any violation. The on-demand routes pass checkAssets: false — assets were
 * verified at build time and the function's bundle does not carry public/.
 */
export function getSite({ checkAssets = true } = {}) {
  if (cache) return cache;
  const lib = buildLibrary();
  const lenses = byFile(lensFiles);
  const categories = byFile(categoryFiles);
  const errors = validateAll(lib, lenses, { assetExists: checkAssets ? assetExists : () => true }, categories);
  if (errors.length) {
    const error = new Error(`Validation failed (${errors.length}):\n  - ${errors.join("\n  - ")}`);
    error.details = errors;
    throw error;
  }
  cache = { lib, lenses, categories, lexicon };
  return cache;
}

export const getLibrary = () => getSite().lib;
export const getLenses = () => getSite().lenses;
export const getCategories = () => getSite().categories;
export const publishedLenses = () => getLenses().filter((l) => l.status === "published");
export const defaultLens = () => getLenses().find((l) => l.slug === "default");

/** The category files in navigation order — the order the old nav listed them. */
export const CATEGORY_ORDER = ["interactive", "ai-products", "ai-tools", "work", "brand"];
export const orderedCategories = () => {
  const cats = getCategories();
  return CATEGORY_ORDER.map((slug) => cats.find((c) => c.slug === slug)).filter(Boolean);
};

/**
 * Every public item across every category's groups, in category order,
 * deduplicated — the home page's image grid (src/components/grid/WorkGrid.astro).
 * An item that sits in more than one category (verizon-ai-workflow: ai-products
 * and work) keeps every category slug on `category`, space-separated, so the
 * home page's filter pills can find it under either one.
 */
export function gridEntries() {
  const lib = getLibrary();
  const byId = new Map();
  for (const cat of orderedCategories()) {
    for (const id of cat.groups.flatMap((g) => g.items)) {
      const item = lib.evidence.get(id);
      if (!item) continue;
      if (!byId.has(id)) byId.set(id, { item, categories: new Set() });
      byId.get(id).categories.add(cat.slug);
    }
  }
  return [...byId.values()].map(({ item, categories }) => ({ item, category: [...categories].join(" ") }));
}

const CTA = {
  live: { en: "Try it ↗", jp: "触ってみる ↗" },
  caseStudy: { en: "Case study →", jp: "ケーススタディ →" },
  repo: { en: "Source ↗", jp: "ソース ↗" },
  external: { en: "Open ↗", jp: "開く ↗" },
};

/** The one destination a card (or a sidebar row) opens, and the words on it. Site paths are root-absolute. */
export function destination(item) {
  const l = item.links ?? {};
  // Always prioritize case study / project detail page first
  if (l.caseStudy) return { url: `/${l.caseStudy}`, label: CTA.caseStudy, external: false };
  // For items without explicit caseStudy link, generate one from slug
  if (item.slug) return { url: `/projects/${item.slug}.html`, label: CTA.caseStudy, external: false };
  // Fallback to external links only if no detail page exists
  if (item.playable && l.live) return { url: l.live, label: CTA.live, external: true };
  if (l.live) return { url: l.live, label: CTA.external, external: true };
  if (l.external) return { url: l.external, label: CTA.external, external: true };
  if (l.repo) return { url: l.repo, label: CTA.repo, external: true };
  return null;
}

/** The evidence record whose links.caseStudy is "projects/<slug>.html", or null. Case-study page slugs and
 *  record slugs usually match (but not always — e.g. "festival-design" is the record "festival-reinvention"),
 *  so this always resolves through links.caseStudy rather than assuming they're the same string. */
export function evidenceForCaseStudy(slug) {
  const target = `projects/${slug}.html`;
  for (const item of getLibrary().evidence.values()) {
    if (item.links?.caseStudy === target) return item;
  }
  return null;
}

/** Two site paths name the same page: "/about", "/about.html", "/about/" and "/about/index.html" agree. */
export const samePage = (a, b) => normalizePath(a) === normalizePath(b);
export function normalizePath(path) {
  if (!path) return "/";
  let p = path.split(/[?#]/)[0];
  p = p.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p || "/";
}
