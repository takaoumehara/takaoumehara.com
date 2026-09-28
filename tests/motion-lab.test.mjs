// The Motion Lab project page, while it is unpublished (src/lib/draft.mjs):
// built here (a local build is not production) in the locked detail format,
// with its live stage as the teaser — and invisible to everything public:
// noindex, listed nowhere, linked from no other page, absent from the
// Studio's library. Production would build neither page.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { loadLibrary, serializeLibrary } from "../src/lib/load.mjs";
import { pageBuilt, draftPagesBuilt, isProductionBuild } from "../src/lib/draft.mjs";
import { read, exists, DIST } from "./_dist.mjs";

const lib = loadLibrary();
const record = lib.evidence.get("motion-lab");
const PAGE = "projects/motion-lab.html";
const STAGE = "lab/stage.html";

test("draft gate: unpublished pages are left out of production builds only", () => {
  assert.equal(isProductionBuild({ VERCEL: "1", VERCEL_ENV: "production" }), true);
  assert.equal(isProductionBuild({ VERCEL: "1", VERCEL_ENV: "preview" }), false);
  assert.equal(isProductionBuild({ VERCEL: "1" }), true, "fails closed on Vercel without VERCEL_ENV");
  assert.equal(isProductionBuild({}), false, "a local build is not production");
  assert.equal(pageBuilt(record, { VERCEL: "1", VERCEL_ENV: "production" }), false);
  assert.equal(pageBuilt(record, { VERCEL: "1", VERCEL_ENV: "preview" }), true);
  assert.equal(pageBuilt(lib.evidence.get("kao-game"), { VERCEL: "1", VERCEL_ENV: "production" }), true, "public records are unaffected");
  assert.equal(draftPagesBuilt({ VERCEL: "1", VERCEL_ENV: "production" }), false);
});

test("motion-lab is recorded as unpublished", () => {
  assert.ok(record, "the record exists");
  assert.equal(record.visibility, "private");
  assert.equal(record.hideInArchive, true);
});

test("the page and its stage are built outside production, and noindex", () => {
  assert.ok(exists(PAGE), `${PAGE} is built`);
  assert.ok(exists(STAGE), `${STAGE} is built`);
  for (const page of [PAGE, STAGE]) assert.match(read(page), /<meta name="robots" content="noindex, nofollow"/, `${page} is noindex`);
});

test("the page follows the detail format, with the live stage as its teaser", () => {
  const html = read(PAGE);
  const article = html.match(/<article class="project-detail"[\s\S]*?<\/article>/)?.[0] ?? "";
  assert.ok(article, "rendered through the shared detail template");
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, "exactly one h1");
  assert.match(article, /<iframe class="project-teaser-media project-teaser-frame" src="\/lab\/stage"/, "the teaser is the live stage");
  assert.ok(article.includes("project-cs"), "Challenge | Solution present");
  assert.equal((article.match(/class="beat"/g) ?? []).length, 3, "three beats");
  assert.match(article, /href="\/lab\/motion"/, "Play opens the lab");
  assert.ok(!/placeholder|coming soon|lorem/i.test(article));
});

test("the beats' numbers are the record's metrics", () => {
  const html = read(PAGE);
  const nums = [...html.matchAll(/<p class="beat-fact-num">([^<]+)<\/p>/g)].map((m) => m[1]);
  assert.deepEqual(nums, record.metrics.map((m) => m.value));
});

test("the stage's images are on disk", () => {
  const html = read(STAGE);
  for (const [, src] of html.matchAll(/<img[^>]*\ssrc="(\/[^"]+)"/g)) assert.ok(exists(src), `asset exists: ${src}`);
});

test("no other page links to the unpublished pages", () => {
  const pages = [];
  (function walk(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== "_astro" && e.name !== "assets") walk(full); }
      else if (e.name.endsWith(".html")) pages.push(relative(DIST, full).split(sep).join("/"));
    }
  })(DIST);
  const found = [];
  for (const page of pages) {
    if (page === PAGE || page === STAGE) continue;
    const html = readFileSync(join(DIST, page), "utf8");
    if (/projects\/motion-lab\b|\/lab\/stage\b/.test(html)) found.push(page);
  }
  assert.deepEqual(found, []);
});

test("the Studio's library leaves unpublished records out", () => {
  const json = serializeLibrary(lib);
  assert.ok(!json.evidence.some((item) => item.slug === "motion-lab"));
  assert.ok(!read("assets/studio/library.json").includes("\"motion-lab\""));
});
