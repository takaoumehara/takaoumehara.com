// The evidence library, the lenses and the categories as the Astro pages see
// them. Everything comes in through Vite's import.meta.glob, so it is bundled
// at build time — the on-demand /lens/preview route and the /api functions
// carry the data with them instead of reading src/ from disk at request time.
//
// validateAll() runs once per build. An invalid record, an invented number or a
// notMine phrase in a lens aborts the build, exactly as src/build.mjs used to.
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { assembleLibrary } from "./load.mjs";
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

/**
 * A site-relative path the data points at exists. Build time only, from the
 * project root (the prerender step runs from a bundle, so no import.meta.url):
 *   assets/…            → public/assets/…
 *   projects/<slug>.html → src/case-studies/<slug>.html (a fragment) or the
 *                          hand-built projects/<slug>.html until it is extracted
 *   <page>.html          → src/fragments/<page>.html or src/pages/<page>.astro
 */
export function assetExists(path) {
  const root = process.cwd();
  const at = (...p) => existsSync(resolve(root, ...p));
  const m = /^projects\/([a-z0-9-]+)\.html$/.exec(path);
  if (m) return at("src", "case-studies", `${m[1]}.html`) || at("src", "pages", "projects", `${m[1]}.astro`) || at("src", "pages", "projects", `${m[1]}.mdx`) || at(path);
  const p = /^([a-z0-9-]+)\.html$/.exec(path);
  if (p) return at("src", "fragments", `${p[1]}.html`) || at("src", "pages", `${p[1]}.astro`) || at(path);
  return at("public", path) || at(path);
}

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

const CTA = {
  live: { en: "Try it ↗", jp: "触ってみる ↗" },
  caseStudy: { en: "Case study →", jp: "ケーススタディ →" },
  repo: { en: "Source ↗", jp: "ソース ↗" },
  external: { en: "Open ↗", jp: "開く ↗" },
};

/** The one destination a card (or a sidebar row) opens, and the words on it. Site paths are root-absolute. */
export function destination(item) {
  const l = item.links ?? {};
  if (item.playable && l.live) return { url: l.live, label: CTA.live, external: true };
  if (l.caseStudy) return { url: `/${l.caseStudy}`, label: CTA.caseStudy, external: false };
  if (l.live) return { url: l.live, label: CTA.external, external: true };
  if (l.external) return { url: l.external, label: CTA.external, external: true };
  if (l.repo) return { url: l.repo, label: CTA.repo, external: true };
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
