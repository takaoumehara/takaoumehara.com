// Where the tests read the site from: the build output. `npm test` builds
// first; `npm run test:unit` assumes a build is already there.
//
// The Vercel adapter writes the static pages to .vercel/output/static, at the
// same paths the site serves them: index.html, about.html, projects/<slug>.html,
// lens/<slug>/index.html, all/index.html, ja/index.html.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../src/lib/load.mjs";

export const DIST = join(ROOT, ".vercel", "output", "static");

if (!existsSync(join(DIST, "index.html"))) {
  throw new Error(`No build at ${DIST} — run: npm run build (or npm test, which builds first)`);
}

/** A built page by its site path ("about.html", "lens/creative/index.html", "/projects/x.html"). */
export const read = (page) => readFileSync(join(DIST, page.replace(/^\//, "")), "utf8");
export const exists = (page) => existsSync(join(DIST, page.replace(/^\//, "")));

/** Resolve a root-absolute or page-relative URL to a path under DIST, ignoring #fragment and ?query. */
export function resolveUrl(fromPage, url) {
  const clean = url.split(/[#?]/)[0];
  if (!clean) return fromPage;
  if (clean.startsWith("/")) return clean.replace(/^\//, "").replace(/\/$/, "/index.html");
  const dir = fromPage.includes("/") ? fromPage.slice(0, fromPage.lastIndexOf("/") + 1) : "";
  const parts = (dir + clean).split("/");
  const out = [];
  for (const p of parts) { if (p === "..") out.pop(); else if (p !== ".") out.push(p); }
  return out.join("/").replace(/\/$/, "/index.html");
}

/** The HTML without <style> and <script> blocks, for text assertions. */
export const text = (html) => html.replace(/<style[^>]*>[\s\S]*?<\/style>/g, "").replace(/<script[^>]*>[\s\S]*?<\/script>/g, "");
