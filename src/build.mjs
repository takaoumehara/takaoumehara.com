#!/usr/bin/env node
// Deterministic publishing: src/data + src/lenses → index.html and lens/<slug>/index.html.
//
//   node src/build.mjs            write the pages
//   node src/build.mjs --check    validate only, write nothing
//
// The default lens renders to /index.html. Every other published lens renders
// to /lens/<slug>/index.html, which Vercel serves at /lens/<slug>. Draft lenses
// are skipped. Any validation error aborts the whole build.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { loadLibrary, loadLenses, ROOT } from "./lib/load.mjs";
import { validateAll } from "./validate.mjs";
import { renderLens } from "./render/page.mjs";

export const SITE_URL = "https://takaoumehara.com";

export function outputPath(lens) {
  return lens.slug === "default" ? "index.html" : `lens/${lens.slug}/index.html`;
}

/** Render every published lens. Returns Map<relativePath, html>. Throws on validation errors. */
export function renderAll({ lib = loadLibrary(), lenses = loadLenses() } = {}) {
  const errors = validateAll(lib, lenses, { assetExists: (path) => existsSync(join(ROOT, path)) });
  if (errors.length) {
    const error = new Error(`Validation failed (${errors.length}):\n  - ${errors.join("\n  - ")}`);
    error.details = errors;
    throw error;
  }
  const css = readFileSync(join(ROOT, "src", "render", "lens.css"), "utf8");
  const pages = new Map();
  for (const lens of lenses) {
    if (lens.status !== "published") continue;
    const path = outputPath(lens);
    const depth = path.split("/").length - 1;
    const ctx = {
      base: "../".repeat(depth),
      canonical: lens.slug === "default" ? `${SITE_URL}/` : `${SITE_URL}/lens/${lens.slug}`,
    };
    pages.set(path, renderLens({ lens, lib, css, ctx }));
  }
  return pages;
}

function main() {
  const checkOnly = process.argv.includes("--check");
  let pages;
  try {
    pages = renderAll();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
  if (checkOnly) {
    console.log(`ok — ${pages.size} page(s) would be written: ${[...pages.keys()].join(", ")}`);
    return;
  }
  for (const [path, html] of pages) {
    const target = join(ROOT, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, html);
    console.log(`wrote ${path} (${(html.length / 1024).toFixed(1)} KB)`);
  }
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) main();
