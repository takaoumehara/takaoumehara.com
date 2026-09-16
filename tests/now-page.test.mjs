import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(root, name), "utf8");

test("/now page is generated at both now/index.html and root alias now.html", () => {
  assert.ok(existsSync(join(root, "now/index.html")), "now/index.html must exist");
  assert.ok(existsSync(join(root, "now.html")), "now.html alias must exist");

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

test("/now page marks Now nav item active", () => {
  const html = read("now/index.html");
  assert.match(html, /<li class="nav-item">\s*<a href="(?:\.\.\/)?now\.html" class="nav-link is-active" aria-current="page">Now<\/a>/, "Now nav must be active page");
});

test("work-with-me.html exists and features Good Fit guidelines and Studio bridge", () => {
  assert.ok(existsSync(join(root, "work-with-me.html")), "work-with-me.html must exist");
  const html = read("work-with-me.html");
  assert.match(html, /Where I am a great fit/, "must include Great Fit guidance");
  assert.match(html, /Where Studio or others fit better/, "must include studio referral boundaries");
  assert.match(html, /Creativity Is Everywhere LLC/, "must link to studio LLC");
});

test("navigation uses self-contained tokens without inheriting body colors", () => {
  const css = read("src/render/lens.css");
  assert.match(css, /--nav-bg:/, "must declare --nav-bg token");
  assert.match(css, /--nav-drop-bg:/, "must declare --nav-drop-bg token");
  assert.match(css, /--nav-drop-fg:/, "must declare --nav-drop-fg token");
  assert.match(css, /--nav-drop-dot:/, "must declare active dot token");
});
