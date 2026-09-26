import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../src/lib/load.mjs";
import { read, exists } from "./_dist.mjs";

test("/now page is built at now/index.html, and the old now.html address redirects to it", () => {
  assert.ok(exists("now/index.html"), "now/index.html must exist");
  assert.match(read("now.html"), /http-equiv="refresh" content="0; url=\/now\/"/, "now.html must redirect to /now/");
  // The archive's own redirect (/all/ → /work) is checked in
  // tests/strategic-refinement.test.mjs, which owns that route.

  const html = read("now/index.html");
  assert.match(html, /<h1 class="now-title">/, "must have now-title h1");
  assert.match(html, /class="now-pulse-dot"/, "must have live pulsing lab bench indicator");
  assert.match(html, /Moime\.app/, "must feature Moime");
  assert.match(html, /MyBrainSpec/, "must feature MyBrainSpec");
  assert.match(html, /Intent First/, "must feature Intent First");
  assert.match(html, /FailForward/, "must feature FailForward / Superforge");
});

test("/now cards display Why it exists and What's next", () => {
  const html = read("now/index.html");
  assert.match(html, /Why it exists/, "must have Why it exists section");
  assert.match(html, /What's next/, "must have What's next section");
  assert.match(html, /pill--now-status/, "cards must have status badges");
});

// The rail's old page list (which had its own "Now" link) is gone — Now's
// content lives inside About's #now section now (src/pages/about.astro), and
// the live route /now (and /now/) permanently redirects to /about#now
// (vercel.json). now/index.html is kept only as a legacy build target for the
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
