import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../src/lib/load.mjs";
import { read, exists } from "./_dist.mjs";
import { formatNowUpdated } from "../src/data/about.mjs";

// One Now list, three places: the About Now section (/about#now — where /now and
// /now/ redirect, vercel.json), About's #now cell, and the legacy
// now/index.html build target. All three render src/components/now/
// NowList.astro from src/data/now.json summary[], with the same "Updated
// <Mon YYYY>" label.
const now = JSON.parse(readFileSync(join(ROOT, "src", "data", "now.json"), "utf8"));
const firstEn = (html) => html.match(/<li class="now-list-item"[^>]*>\s*<span class="t-en"[^>]*>([\s\S]*?)<\/span>/)?.[1];

test("/now redirects to the About Now section; now.html and now/index.html point there too", () => {
  const vercel = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8"));
  for (const source of ["/now", "/now/"]) {
    const r = vercel.redirects.find((x) => x.source === source);
    assert.equal(r?.destination, "/about#now", `${source} must redirect to /about#now`);
  }
  assert.match(read("now.html"), /http-equiv="refresh" content="0; url=\/about#now"/, "now.html must redirect to /about#now");
  assert.ok(exists("now/index.html"), "now/index.html must exist (legacy build target)");
  assert.match(read("now/index.html"), /href="\/about#now"/, "now/index.html must link to /about#now");
  assert.match(read("about.html"), /<section id="now"/, "About needs the #now section");
});

test("home Now, About #now and /now render the same now.json summary bullets and Updated label", () => {
  const home = read("index.html");
  const about = read("about.html");
  const legacy = read("now/index.html");
  for (const [name, html] of [["about", about], ["now", legacy]]) {
    assert.equal(firstEn(html), now.summary[0].en, `${name}: the first Now bullet must be now.json summary[0]`);
    assert.ok(html.includes(`Updated ${formatNowUpdated(now.updatedAt).en}`), `${name}: the Updated label must come from now.json updatedAt`);
  }
  const count = (html) => (html.match(/<li class="now-list-item"/g) ?? []).length;
  assert.equal(count(home), 0, "Now belongs only to About");
  assert.equal(count(about), now.summary.length, "About shows every bullet");
  // The old items[] cards (Moime.app, MyBrainSpec …) are not on the home page.
  assert.ok(!/MyBrainSpec/.test(home.match(/<section class="home-now[\s\S]*?<\/section>/)?.[0] ?? ""), "home Now must not use now.json items[]");
});

test("a Now bullet shows a 'Latest' date only from a real news.mjs entry", () => {
  const home = read("about.html");
  const latest = [...home.matchAll(/class="now-list-latest"[^>]*>[\s\S]*?<time datetime="([^"]+)"/g)].map((m) => m[1]);
  const expected = now.summary.filter((b) => b.latest).length;
  assert.equal(latest.length, expected, "one Latest link per bullet with a `latest` news slug");
  for (const date of latest) assert.match(date, /^\d{4}-\d{2}(-\d{2})?$/);
});

// The rail's old page list (which had its own "Now" link) is gone, and the
// live route /now (and /now/) permanently redirects to /about#now (vercel.json). now/index.html is kept only as a legacy build target for the
// bare URL; it renders the same shared sidebar as everything else, which
// rightly does not claim any entry as "this page" for it.
test("/now/index.html (a legacy page superseded by the /about#now redirect) does not falsely mark any sidebar entry as current", () => {
  const html = read("now/index.html");
  const side = html.match(/<aside[^>]*class="side"[\s\S]*?<\/aside>/i)?.[0];
  assert.ok(side, "missing sidebar");
  assert.equal(/aria-current="page"/.test(side), false, "no sidebar entry should claim to be the current page for the superseded /now/ route");
});

test("work-with-me.html exists and features Good Fit guidelines and Studio bridge", () => {
  assert.ok(exists("work-with-me.html"), "work-with-me.html must exist");
  const html = read("work-with-me.html");
  assert.match(html, /Where I am a great fit/, "must include Great Fit guidance");
  assert.match(html, /Where Studio or others fit better/, "must include studio referral boundaries");
  assert.match(html, /Creativity Is Everywhere LLC/, "must link to studio LLC");
});

test("the sidebar reads its own tokens, which no hand-built page redefines", () => {
  // The hand-built pages' design-system.css redefines :root (--bg, --ink,
  // --ff). The rail reads --pr-* names from src/styles/tokens.css, which
  // nothing else declares, so it looks the same on every page.
  const tokens = readFileSync(join(ROOT, "src", "styles", "tokens.css"), "utf8");
  for (const token of ["--pr-ink:", "--pr-ink-2:", "--pr-canvas:", "--pr-card:", "--pr-line:", "--pr-blue:", "--pr-ff:"]) {
    assert.match(tokens, new RegExp(token), `must declare ${token}`);
  }
  assert.match(tokens, /html\[data-theme="dark"\] \{[^}]*--pr-canvas: #000000/, "the dark theme turns the same tokens over");
  const css = readFileSync(join(ROOT, "src", "styles", "shell.css"), "utf8");
  assert.match(css, /\.side \{[^}]*background: var\(--pr-canvas\)/);
  assert.match(css, /\.side \{[^}]*font-family: var\(--pr-ff\)/);
  assert.equal(/var\(--ff\)|var\(--bg\)|var\(--ink\)/.test(css), false, "shell.css must not read the overridable aliases");
});
