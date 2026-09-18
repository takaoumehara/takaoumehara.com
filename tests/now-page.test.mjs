import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../src/lib/load.mjs";
import { read, exists } from "./_dist.mjs";

test("/now page is built at now/index.html, and the old now.html address redirects to it", () => {
  assert.ok(exists("now/index.html"), "now/index.html must exist");
  assert.match(read("now.html"), /http-equiv="refresh" content="0; url=\/now\/"/, "now.html must redirect to /now/");
  assert.match(read("work/index.html"), /http-equiv="refresh" content="0; url=\/all\/"/, "the old archive address must redirect to /all/");

  const html = read("now/index.html");
  // The bench opens on the same statement hero as every other page about the
  // person (src/components/bento/BentoPage.astro) — it is the page's one <h1>.
  assert.match(html, /<h1 class="bento-statement"><span class="t-en">What I’m Working On<\/span>/, "must open on the statement hero");
  assert.match(html, /Live Lab Bench · Updated/, "must say when the bench was last updated");
  assert.match(html, /Moime\.app/, "must feature Moime");
  assert.match(html, /MyBrainSpec/, "must feature MyBrainSpec");
  assert.match(html, /Intent First/, "must feature Intent First");
  assert.match(html, /FailForward/, "must feature FailForward / Superforge");
});

test("/now cards display Why it exists and What's next", () => {
  const html = read("now/index.html");
  assert.match(html, /Why it exists/, "must have Why it exists section");
  assert.match(html, /What&#39;s next/, "must have What's next section");
  // Status rides in the cell's label, next to what kind of thing it is.
  assert.match(html, /0→1 Product · Building/, "cards must say where they are");
});

test("/now can be narrowed, and every card declares which group it is in", () => {
  const html = read("now/index.html");
  // The bar is a cell of the grid, so it lands under the lede rather than
  // floating above it (src/pages/now/index.astro).
  assert.match(html, /<nav class="bento-body bento-filters"[^>]*aria-label="Filter current work">/);
  for (const key of ["all", "ai-product", "interactive", "developer-tool"]) {
    assert.match(html, new RegExp(`<button type="button" class="bento-filter" data-filter="${key}"`), `the bar must offer ${key}`);
  }
  // A card carries its group, which is how the bar hides it.
  for (const group of ["ai-product", "ai-tool", "thesis", "developer-tool", "interactive"]) {
    assert.match(html, new RegExp(`data-filter="${group}"`), `a card must be in ${group}`);
  }
});

test("/now marks Now as the current page in the sidebar", () => {
  const html = read("now/index.html");
  // Now is a card row in the rail's "The person" group, like every other link.
  assert.match(
    html,
    /<a class="side-item side-item--page" href="\/now\/"[^>]*aria-current="page"/,
    "the Now row must be aria-current",
  );
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
