// The Challenge / Solution section that opens a project detail page, now
// rendered by the shared template (src/components/project/ProjectDetail.astro,
// class "project-cs") from detailFields(item).challenge/.solution
// (src/lib/detail.mjs) rather than the old, removed ProjectStrip component
// (".cs-strip", narrative.problem/.situation, an Overview card built from
// .summary). See docs/superforge.md "Pinned by the user" (Astro rebuild,
// 2026-09-24 Porto Rocha IA redesign) and tests/detail-format.test.mjs, which
// locks the rest of this template.
import test from "node:test";
import assert from "node:assert/strict";
import { loadLibrary } from "../src/lib/load.mjs";
import { detailFields } from "../src/lib/detail.mjs";
import { esc } from "../src/lib/html.mjs";
import { read, exists } from "./_dist.mjs";

const lib = loadLibrary();

const stripOf = (html) => {
  const m = html.match(/<section class="project-cs"[^>]*>[\s\S]*?<\/section>/);
  return m ? m[0] : null;
};

// Only records actually routed through src/pages/projects/[slug].astro — a
// case-study fragment under src/case-studies/, built to /projects/<slug>.html.
// (breakbias/intentfirst point at "breakbias.html"/"intentfirst.html", their
// own full Astro pages at the site root — real pages, but not this route, and
// not carrying ProjectDetail's Challenge/Solution section.)
const caseStudyRecords = [...lib.evidence.values()].filter((item) => {
  const cs = item.links?.caseStudy;
  return cs && cs.startsWith("projects/") && exists(`/${cs}`);
});

test("the fixture actually covers case studies", () => {
  // A sanity check on the test setup itself: if this ever drops to 0, every
  // test below would pass vacuously without checking anything.
  assert.ok(caseStudyRecords.length >= 40, `expected ~41 routed case studies, got ${caseStudyRecords.length}`);
});

test("every project's challenge (detailFields, from detail.challenge or the record's own challenge) shows up in its page's Challenge/Solution section", () => {
  let checked = 0;
  for (const item of caseStudyRecords) {
    const d = detailFields(item);
    if (!d.challenge) continue;
    checked += 1;
    const html = read(`/${item.links.caseStudy}`);
    const strip = stripOf(html);
    assert.ok(strip, `${item.slug}: expected a .project-cs on /${item.links.caseStudy}`);
    assert.ok(strip.includes(esc(d.challenge.en)), `${item.slug}: Challenge/Solution section is missing its challenge text`);
  }
  // Currently the 8 Interactive experiments + the 10-project Client set (see
  // tests/detail-format.test.mjs's INTERACTIVE_8 / CLIENT_10).
  assert.ok(checked >= 18, `expected at least 18 projects with a challenge, checked ${checked}`);
});

test("an experiment page (Resona) shows its Challenge and Solution copy, in both languages", () => {
  const html = read("/projects/resona.html");
  const strip = stripOf(html);
  assert.ok(strip, "resona.html should carry a Challenge/Solution section");
  assert.match(strip, /<span class="t-en"[^>]*>Challenge<\/span><span class="t-jp"[^>]*>課題<\/span>/);
  assert.match(strip, /<span class="t-en"[^>]*>Solution<\/span><span class="t-jp"[^>]*>解決<\/span>/);
  const resona = lib.evidence.get("resona");
  assert.ok(strip.includes(esc(resona.challenge.en)), "the section should carry challenge.en");
  assert.ok(strip.includes(resona.challenge.jp), "the section should carry challenge.jp for the jp layer");
  assert.ok(strip.includes(esc(resona.solution.en)), "the section should carry solution.en");
  assert.ok(strip.includes(resona.solution.jp), "the section should carry solution.jp for the jp layer");
});

test("a record's Challenge/Solution section appears exactly when detailFields resolves both a challenge and a solution — never a bare, empty one", () => {
  for (const item of caseStudyRecords) {
    const d = detailFields(item);
    const html = read(`/${item.links.caseStudy}`);
    const strip = stripOf(html);
    assert.equal(!!strip, !!(d.challenge && d.solution), `${item.slug}: section presence should match detailFields having a challenge and a solution`);
  }
});

test("no Challenge/Solution section carries the page's hero view-transition name", () => {
  for (const item of caseStudyRecords) {
    const html = read(`/${item.links.caseStudy}`);
    const strip = stripOf(html);
    if (!strip) continue;
    assert.equal(strip.includes("data-vt-hero"), false, `${item.slug}: the section must not contain data-vt-hero`);
  }
});

test("every built project page still has exactly one <h1>", () => {
  for (const item of caseStudyRecords) {
    const html = read(`/${item.links.caseStudy}`);
    const count = [...html.matchAll(/<h1\b/gi)].length;
    assert.equal(count, 1, `${item.slug}: expected exactly one <h1>, got ${count}`);
  }
});
