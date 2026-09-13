// Loads the Career Evidence Library and the Lens configurations from disk.
// Pure data access — no rendering, no validation (see validate.mjs).
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DATA_DIR = join(ROOT, "src", "data");
export const LENS_DIR = join(ROOT, "src", "lenses");
export const CATEGORY_DIR = join(ROOT, "src", "categories");

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

function readDir(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => ({ file: join(dir, name), data: readJson(join(dir, name)) }));
}

/** @returns {import("./types").Library} */
export function loadLibrary(dataDir = DATA_DIR) {
  const evidence = new Map();
  const sources = new Map();
  for (const kind of ["projects", "ventures", "experiments", "tools"]) {
    for (const { file, data } of readDir(join(dataDir, kind))) {
      if (evidence.has(data.slug)) throw new Error(`Duplicate evidence slug "${data.slug}" (${file})`);
      evidence.set(data.slug, data);
      sources.set(data.slug, file);
    }
  }
  return {
    profile: readJson(join(dataDir, "profile.json")),
    capabilities: readJson(join(dataDir, "capabilities.json")),
    chapters: readJson(join(dataDir, "chapters.json")).chapters,
    roles: readJson(join(dataDir, "roles.json")).roles,
    theses: readJson(join(dataDir, "theses.json")).theses,
    evidence,
    sources,
  };
}

export function loadLenses(lensDir = LENS_DIR) {
  return readDir(lensDir).map(({ file, data }) => ({ ...data, _file: file }));
}

export function loadCategories(categoryDir = CATEGORY_DIR) {
  return readDir(categoryDir).map(({ file, data }) => ({ ...data, _file: file }));
}
