import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../src/lib/load.mjs";
import { read, exists } from "./_dist.mjs";

test("/now page is built at both now/index.html and root alias now.html", () => {
  assert.ok(exists("now/index.html"), "now/index.html must exist");
  assert.ok(exists("now.html"), "now.html alias must exist");

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

test("/now marks Now as the current page in the sidebar", () => {
  for (const page of ["now/index.html", "now.html"]) {
    const html = read(page);
    assert.match(html, /<a href="\/now\.html" aria-current="page">Now<\/a>/, `${page}: the Now link must be aria-current`);
  }
});

test("work-with-me.html exists and features Good Fit guidelines and Studio bridge", () => {
  assert.ok(exists("work-with-me.html"), "work-with-me.html must exist");
  const html = read("work-with-me.html");
  assert.match(html, /Where I am a great fit/, "must include Great Fit guidance");
  assert.match(html, /Where Studio or others fit better/, "must include studio referral boundaries");
  assert.match(html, /Creativity Is Everywhere LLC/, "must link to studio LLC");
});

test("the sidebar uses self-contained tokens without inheriting page colors", () => {
  // The hand-built pages redefine :root (design-system.css is dark by default).
  // The sidebar must read the same on every page, so its colours are its own.
  const css = readFileSync(join(ROOT, "src", "styles", "shell.css"), "utf8");
  for (const token of ["--side-bg:", "--side-ink:", "--side-dim:", "--side-line:", "--side-surface:"]) {
    assert.match(css, new RegExp(token), `must declare ${token}`);
  }
  assert.match(css, /\.side \{[^}]*background: var\(--side-bg\)/);
});
