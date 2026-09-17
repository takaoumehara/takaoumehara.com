// The Challenge / Solution strip (src/components/project/ProjectStrip.astro)
// that opens every case study with the data for it. Wired in through
// src/pages/projects/[slug].astro, above the hand-built body.
//
// The strip's markup uses `.cs-strip` (not `.pj-strip`) on purpose:
// public/assets/design-system.css already owns a whole family of `.pj-*`
// class names on these same pages (.pj-hero, .pj-body, .pj-media, …), and
// reusing that prefix risks a real collision the day someone edits that
// file without knowing about this component.
import test from "node:test";
import assert from "node:assert/strict";
import { loadLibrary } from "../src/lib/load.mjs";
import { esc } from "../src/lib/html.mjs";
import { read, exists } from "./_dist.mjs";

const lib = loadLibrary();

const stripOf = (html) => {
  const m = html.match(/<section class="cs-strip"[^>]*>[\s\S]*?<\/section>/);
  return m ? m[0] : null;
};

// Only records actually routed through src/pages/projects/[slug].astro — a
// case-study fragment under src/case-studies/, built to /projects/<slug>.html.
// (breakbias/intentfirst point at "breakbias.html"/"intentfirst.html", their
// own full Astro pages at the site root — real pages, but not this route, and
// not carrying ProjectStrip.)
const caseStudyRecords = [...lib.evidence.values()].filter((item) => {
  const cs = item.links?.caseStudy;
  return cs && cs.startsWith("projects/") && exists(`/${cs}`);
});

test("the fixture actually covers case studies", () => {
  // A sanity check on the test setup itself: if this ever drops to 0, every
  // test below would pass vacuously without checking anything.
  assert.ok(caseStudyRecords.length >= 40, `expected ~41 routed case studies, got ${caseStudyRecords.length}`);
});

test("every project's narrative.problem (or .situation, as its fallback) shows up in its page's strip", () => {
  let checked = 0;
  for (const item of caseStudyRecords) {
    const challenge = item.narrative?.problem ?? item.narrative?.situation;
    if (!challenge) continue;
    checked += 1;
    const html = read(`/${item.links.caseStudy}`);
    const strip = stripOf(html);
    assert.ok(strip, `${item.slug}: expected a .cs-strip on /${item.links.caseStudy}`);
    assert.ok(strip.includes(esc(challenge)), `${item.slug}: strip is missing its narrative text`);
  }
  assert.ok(checked >= 26, `expected at least 26 projects with a narrative challenge, checked ${checked}`);
});

test("an experiment page (Resona) shows the Overview card built from its summary", () => {
  const html = read("/projects/resona.html");
  const strip = stripOf(html);
  assert.ok(strip, "resona.html should carry a strip");
  assert.match(strip, /<span class="t-en">Overview<\/span><span class="t-jp">概要<\/span>/);
  const resona = lib.evidence.get("resona");
  assert.ok(strip.includes(esc(resona.summary.en)), "the Overview card should carry summary.en");
  assert.ok(strip.includes(resona.summary.jp), "the Overview card should carry summary.jp for the jp layer");
});

test("a record's strip appears exactly when it has a narrative challenge or a summary — never a bare, empty one", () => {
  for (const item of caseStudyRecords) {
    const hasChallenge = !!(item.narrative?.problem ?? item.narrative?.situation);
    const hasSummary = !!item.summary;
    const html = read(`/${item.links.caseStudy}`);
    const strip = stripOf(html);
    assert.equal(!!strip, hasChallenge || hasSummary, `${item.slug}: strip presence should match having a challenge or a summary`);
  }
});

test("no strip carries the page's hero view-transition name", () => {
  for (const item of caseStudyRecords) {
    const html = read(`/${item.links.caseStudy}`);
    const strip = stripOf(html);
    if (!strip) continue;
    assert.equal(strip.includes("data-vt-hero"), false, `${item.slug}: the strip must not contain data-vt-hero`);
  }
});

test("every built project page still has exactly one <h1>", () => {
  for (const item of caseStudyRecords) {
    const html = read(`/${item.links.caseStudy}`);
    const count = [...html.matchAll(/<h1\b/gi)].length;
    assert.equal(count, 1, `${item.slug}: expected exactly one <h1>, got ${count}`);
  }
});
