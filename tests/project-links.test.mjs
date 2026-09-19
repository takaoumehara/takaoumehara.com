// Every project has a detail page, and the real thing is one click from it.
//
// The rule this file guards (docs/superforge.md): a card's own click always
// opens the piece's detail page — never the live site, not even for something
// playable — and the live site is reachable twice over, from a pill on the
// detail page and from the ↗ on the card. Before this, destination() preferred
// links.live for a `playable` record, so six pieces had a detail page that no
// card on the site pointed at.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../src/lib/load.mjs";
import { read, exists } from "./_dist.mjs";

const KINDS = ["projects", "experiments", "tools", "ventures"];
const records = KINDS.flatMap((kind) => {
  const dir = join(ROOT, "src", "data", kind);
  return readdirSync(dir).filter((n) => n.endsWith(".json"))
    .map((n) => JSON.parse(readFileSync(join(dir, n), "utf8")));
});
const links = (r) => r.links ?? {};
const outward = (r) => [links(r).live, links(r).repo, links(r).external].filter(Boolean);

test("the fixture covers the whole library", () => {
  assert.ok(records.length >= 45, `expected the whole library, got ${records.length}`);
});

test("every case-study link points at a page that was built", () => {
  for (const record of records) {
    const target = links(record).caseStudy;
    if (!target) continue;
    assert.ok(exists(target), `${record.slug}: links.caseStudy "${target}" was not built`);
  }
});

test("a detail page names where the work itself lives", () => {
  // ProjectStrip builds this row from the record, so it reaches the hand-built
  // bodies and the bento layouts alike — no page is edited to get one.
  for (const record of records) {
    const target = links(record).caseStudy;
    const urls = outward(record);
    // BreakBias and Intent First point at hand-built root pages rather than a
    // case study, so they are not drawn through ProjectStrip at all.
    if (!target?.startsWith("projects/") || !urls.length) continue;
    const html = read(target);
    assert.match(html, /<p class="cs-strip-links">/, `${record.slug}: no outward links on ${target}`);
    for (const url of urls) {
      assert.ok(
        html.includes(`<a href="${url}" target="_blank" rel="noopener">`),
        `${record.slug}: ${target} does not link out to ${url}`,
      );
    }
  }
});

test("a playable piece opens its own page first, not the demo", () => {
  const playable = records.filter((r) => r.playable && links(r).live);
  assert.ok(playable.length >= 5, `expected several playable pieces, got ${playable.length}`);
  const rail = read("interactive.html");
  for (const record of playable) {
    const page = `/${links(record).caseStudy}`;
    assert.ok(
      rail.includes(`<a class="side-item" href="${page}"`),
      `${record.slug}: the rail row still skips ${page}`,
    );
    assert.ok(!rail.includes(`<a class="side-item" href="${links(record).live}"`),
      `${record.slug}: a rail row still points straight at the demo`);
  }
});

test("a card with somewhere to go carries the shortcut, and no card nests a link", () => {
  const withOutward = records.filter((r) => outward(r).length).length;
  for (const page of ["index.html", "interactive.html", "all/index.html"]) {
    const html = read(page);
    assert.match(html, /class="card-live"/, `${page}: no card carries the ↗ shortcut`);
    // <a> inside <a> is not markup, and the rail is where that was a real risk:
    // its row used to be one big <a>. The ↗ is a sibling of it now.
    assert.ok(!/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*?<a\b/.test(html), `${page}: a link is nested inside a link`);
  }
  // The rail is on every page with a shell: one ↗ per record that has one.
  const rail = read("interactive.html");
  assert.equal(
    [...rail.matchAll(/class="side-live"/g)].length,
    withOutward,
    "every record with an outward link should have exactly one ↗ in the rail",
  );
});

test("the shortcut opens in a new tab and says where it goes", () => {
  const html = read("interactive.html");
  const shortcut = html.match(/<a class="side-live"[^>]*>/);
  assert.ok(shortcut, "no rail shortcut was built");
  assert.match(shortcut[0], /target="_blank"/);
  assert.match(shortcut[0], /rel="noopener"/);
  assert.match(shortcut[0], /aria-label="[^"]+ — [^"]+"/, "the ↗ must say what it opens");
});

test("a layout no longer hand-writes a link the record already carries", () => {
  // ela-quests and resona each had their live URL typed into title.links as
  // well; the strip prints it from the record now, so the page would say it
  // twice.
  for (const name of readdirSync(join(ROOT, "src", "bento")).filter((n) => n.endsWith(".json"))) {
    const slug = name.replace(/\.json$/, "");
    const layout = JSON.parse(readFileSync(join(ROOT, "src", "bento", name), "utf8"));
    const record = records.find((r) => links(r).caseStudy === `projects/${slug}.html`);
    if (!record) continue;
    for (const link of layout.title?.links ?? []) {
      assert.ok(
        !outward(record).includes(link.href),
        `${slug}: title.links repeats ${link.href}, which the strip already prints`,
      );
    }
  }
});

test("Kanji Puzzle stays out of sight", () => {
  // Takao: 「この作品はみせないで」 — no detail page, no category, nowhere in
  // the built site.
  const record = records.find((r) => r.slug === "kanji-puzzle");
  assert.ok(record, "the record itself stays in src/data");
  assert.equal(links(record).caseStudy, undefined, "kanji-puzzle must not get a detail page");
  assert.equal(existsSync(join(ROOT, "src", "bento", "kanji-puzzle.json")), false);
  for (const page of ["index.html", "all/index.html", "interactive.html"]) {
    assert.ok(!read(page).includes("Kanji Puzzle"), `${page} shows Kanji Puzzle`);
  }
});

test("the preview clips run on their own, everywhere they appear", () => {
  // They used to wait for a hover, so a grid of moving work looked still — and
  // on a phone there is no hover at all.
  for (const page of ["index.html", "interactive.html", "all/index.html"]) {
    const html = read(page);
    const clips = [...html.matchAll(/<video class="card-clip"[^>]*>/g)].map((m) => m[0]);
    assert.ok(clips.length > 0, `${page}: no preview clips`);
    for (const clip of clips) {
      assert.match(clip, /\bautoplay\b/, `${page}: a clip still waits to be started`);
      assert.match(clip, /\bloop\b/);
      assert.match(clip, /\bmuted\b/);
      assert.match(clip, /\bplaysinline\b/);
      assert.match(clip, /preload="auto"/, `${page}: a clip that autoplays must not preload="none"`);
      assert.match(clip, /aria-hidden="true"/, "the still is what a screen reader reads");
    }
  }
});
