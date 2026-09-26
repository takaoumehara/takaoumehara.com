// Production routing: every internal link on every built page must reach a
// real file through the routes Vercel serves (.vercel/output/config.json) —
// redirects first, then the filesystem, then the clean-URL rewrites. /work
// once fell through to the 404 route because only work.html existed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { DIST } from "./_dist.mjs";

const config = JSON.parse(readFileSync(join(DIST, "..", "config.json"), "utf8"));
const fsAt = config.routes.findIndex((r) => r.handle === "filesystem");
const before = config.routes.slice(0, fsAt);
const after = config.routes.slice(fsAt + 1);

const isFile = (p) => {
  const f = join(DIST, p.replace(/^\//, ""));
  return existsSync(f) && !f.endsWith(sep) && readdirSafe(f) === null;
};
function readdirSafe(f) { try { return readdirSync(f); } catch { return null; } }
const isDirIndex = (p) => existsSync(join(DIST, p.replace(/^\//, ""), "index.html"));

/** Follow the route table for a path; returns the file served, or null for the 404 route. */
function serve(path, hops = 0) {
  assert.ok(hops < 5, `redirect loop at ${path}`);
  for (const r of before) {
    if (r.status >= 300 && r.status < 400 && new RegExp(r.src).test(path)) {
      const next = r.headers.Location.split(/[#?]/)[0];
      return serve(next, hops + 1);
    }
  }
  if (path === "/" || isFile(path)) return path === "/" ? "/index.html" : path;
  if (isDirIndex(path)) return join(path, "index.html");
  for (const r of after) {
    if (r.dest && !r.dest.startsWith("_render") && r.dest !== "/404.html" && new RegExp(r.src).test(path)) {
      return path.replace(new RegExp(r.src), r.dest);
    }
    if (r.dest === "_render" && new RegExp(r.src).test(path)) return "(on-demand)";
  }
  return null;
}

const pages = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "_astro" && e.name !== "assets") walk(full); }
    else if (e.name.endsWith(".html")) pages.push(relative(DIST, full).split(sep).join("/"));
  }
})(DIST);

test("extensionless page URLs are served, not 404", () => {
  for (const p of ["/work", "/about", "/work/", "/ja/about"]) {
    if (p === "/ja/about" && !existsSync(join(DIST, "ja/about.html"))) continue;
    assert.ok(serve(p), `${p} falls through to 404`);
  }
});

test("vercel.json redirects are part of the served routes", () => {
  assert.match(serve("/all") ?? "", /work\.html$/);
  assert.match(serve("/now") ?? "", /about\.html$/);
});

test("every root-absolute internal link on every page resolves", () => {
  const broken = [];
  for (const page of pages) {
    const html = readFileSync(join(DIST, page), "utf8");
    for (const [, href] of html.matchAll(/<a\b[^>]*\bhref="(\/[^"#?]*)[^"]*"/g)) {
      if (href.startsWith("//") || href.startsWith("/api/") || href.startsWith("/admin")) continue;
      if (!serve(decodeURIComponent(href))) broken.push(`${page} → ${href}`);
    }
  }
  assert.deepEqual([...new Set(broken)], []);
});
