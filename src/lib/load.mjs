// Loads the Career Evidence Library and the Lens configurations from disk.
// Pure data access — no rendering, no validation (see validate.mjs).
//
// assembleLibrary() is the shape-building half, shared with src/lib/site.mjs,
// which feeds it the same files through Vite's import.meta.glob so the Astro
// pages — and the on-demand /lens/preview route — never touch the filesystem.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DATA_DIR = join(ROOT, "src", "data");
export const LENS_DIR = join(ROOT, "src", "lenses");
export const CATEGORY_DIR = join(ROOT, "src", "categories");

export const EVIDENCE_KINDS = ["projects", "ventures", "experiments", "tools"];

/**
 * A site-relative path the data points at exists in the source tree:
 *   assets/…             → public/assets/…
 *   projects/<slug>.html → src/case-studies/<slug>.html (a fragment) or
 *                          src/pages/projects/<slug>.astro|.mdx
 *   <page>.html          → src/fragments/<page>.html or src/pages/<page>.astro
 * Anything still sitting at the old place (a hand-built HTML at the repo root)
 * counts too, so the rule holds while pages are being moved.
 */
export function sourceExists(path, root = ROOT) {
  const at = (...p) => existsSync(resolve(root, ...p));
  const project = /^projects\/([a-z0-9-]+)\.html$/.exec(path);
  if (project) {
    const slug = project[1];
    return at("src", "case-studies", `${slug}.html`) || at("src", "pages", "projects", `${slug}.astro`) || at("src", "pages", "projects", `${slug}.mdx`) || at("public", path) || at(path);
  }
  const page = /^([a-z0-9-]+)\.html$/.exec(path);
  if (page) return at("src", "fragments", `${page[1]}.html`) || at("src", "pages", `${page[1]}.astro`) || at(path);
  return at("public", path) || at(path);
}

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

function readDir(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => ({ file: join(dir, name), data: readJson(join(dir, name)) }));
}

/**
 * Build a Library from a flat map of data files: { "projects/koji-fizz.json": {...},
 * "profile.json": {...}, ... }. Keys are paths relative to src/data, forward slashes.
 * @returns {import("./types").Library}
 */
export function assembleLibrary(files) {
  const evidence = new Map();
  const sources = new Map();
  const entries = Object.entries(files).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  for (const kind of EVIDENCE_KINDS) {
    for (const [path, data] of entries) {
      if (!path.startsWith(`${kind}/`)) continue;
      if (evidence.has(data.slug)) throw new Error(`Duplicate evidence slug "${data.slug}" (${path})`);
      evidence.set(data.slug, data);
      sources.set(data.slug, path);
    }
  }
  const one = (name) => files[name];
  return {
    profile: one("profile.json"),
    capabilities: one("capabilities.json"),
    chapters: one("chapters.json").chapters,
    roles: one("roles.json").roles,
    theses: one("theses.json").theses,
    ideas: one("ideas.json") ?? [],
    now: one("now.json") ?? null,
    evidence,
    sources,
  };
}

/** @returns {import("./types").Library} */
export function loadLibrary(dataDir = DATA_DIR) {
  const files = {};
  for (const kind of EVIDENCE_KINDS) {
    for (const { file, data } of readDir(join(dataDir, kind))) files[`${kind}/${file.split(/[\\/]/).pop()}`] = data;
  }
  for (const name of ["profile", "capabilities", "chapters", "roles", "theses", "ideas", "now"]) {
    const path = join(dataDir, `${name}.json`);
    if (existsSync(path)) files[`${name}.json`] = readJson(path);
  }
  const lib = assembleLibrary(files);
  // Node callers (tests, scripts) expect absolute source paths.
  for (const [slug, rel] of lib.sources) lib.sources.set(slug, join(dataDir, rel));
  return lib;
}

/**
 * The library as one JSON document, for the browser (studio/). Every item is
 * public data already rendered on the site; maintenance notes (_notes) are
 * dropped. hydrateLibrary() in ./library.mjs turns it back into a Library.
 */
export function serializeLibrary(lib, { lexicon, lensSlugs = [] } = {}) {
  const strip = ({ _notes, ...item }) => item;
  return {
    profile: lib.profile,
    capabilities: lib.capabilities,
    chapters: lib.chapters,
    roles: lib.roles,
    theses: lib.theses,
    ideas: lib.ideas ?? [],
    now: lib.now ?? null,
    evidence: [...lib.evidence.values()].map(strip),
    lenses: lensSlugs,
    ...(lexicon ? { lexicon } : {}),
  };
}

export function loadLenses(lensDir = LENS_DIR) {
  return readDir(lensDir).map(({ file, data }) => ({ ...data, _file: file }));
}

export function loadCategories(categoryDir = CATEGORY_DIR) {
  return readDir(categoryDir).map(({ file, data }) => ({ ...data, _file: file }));
}
