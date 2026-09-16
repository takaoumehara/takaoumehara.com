// Tests for the Final Strategic Refinement of takaoumehara.com
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadLibrary, ROOT } from "../src/lib/load.mjs";

const read = (path) => readFileSync(join(ROOT, path), "utf8");
const lib = loadLibrary();

test("Work archive (/work/index.html) is generated from lib.evidence with 7 filter tabs", () => {
  assert.ok(existsSync(join(ROOT, "work/index.html")), "work/index.html must exist");
  const html = read("work/index.html");

  // All 46 evidence items must be present
  const cards = [...html.matchAll(/<article class="cat-card"/g)];
  assert.equal(cards.length, lib.evidence.size, "all evidence items must be rendered");

  // Filter tabs must exist
  const expectedFilters = ["all", "zero-to-one", "ai", "interactive", "product", "brand", "learning"];
  for (const f of expectedFilters) {
    assert.match(html, new RegExp(`data-filter="${f}"`), `Filter tab ${f} must exist`);
  }

  // Canonical tag must point to /work
  assert.match(html, /<link rel="canonical" href="https:\/\/takaoumehara\.com\/work">/);
});

test("Japanese edition (/ja/index.html) is generated with native Japanese hero and root class", () => {
  assert.ok(existsSync(join(ROOT, "ja/index.html")), "ja/index.html must exist");
  const html = read("ja/index.html");

  // Root must declare Japanese
  assert.match(html, /<html lang="ja" class="lang-jp"/);

  // Exact Japanese hero copy required by strategic positioning
  assert.match(html, /何かが始まるときが、いちばんおもしろい。/);
  assert.match(html, /曖昧なアイデアを、実際に触れる体験や、動く AI プロトタイプ、0→1 のプロダクトにする。/);
  assert.match(html, /まだ答えが見えていないところから入り、デザイン、テクノロジー、AI、プロダクト、ビジネスをつなぎながら/);

  // Canonical tag
  assert.match(html, /<link rel="canonical" href="https:\/\/takaoumehara\.com\/ja">/);
});

test("Contact page features 4 personal entry points and studio bridge without duplicate service catalog", () => {
  const html = read("contact.html");

  // H1
  assert.match(html, /Let’s make something tangible\./);

  // Four personal entry points
  assert.match(html, /Full-time \/ Leadership Roles/);
  assert.match(html, /Fractional \/ Advisory/);
  assert.match(html, /0→1 Product &amp; Technology Collaboration/);
  assert.match(html, /Speaking \/ Workshops/);

  // Studio bridge link
  assert.match(html, /Looking for a studio partner\?/);
  assert.match(html, /href="https:\/\/creativityiseverywhere\.com"/);

  // No duplicate studio service catalog
  assert.ok(!html.includes("Four Ways to Engage"));
  assert.ok(!html.includes("01 / 04 — Venture Creation"));
});

test("Workshops page is centered around Break Bias with 4 use cases and studio routing", () => {
  const html = read("workshop.html");

  // H1
  assert.match(html, /<h1 class="hero-title">[\s\S]*?Break Bias[\s\S]*?<\/h1>/);

  // Four use cases
  assert.match(html, /For New Ventures/);
  assert.match(html, /For Product &amp; Innovation Teams/);
  assert.match(html, /For Creative Challenges/);
  assert.match(html, /For Leadership Teams/);

  // Studio routing in CTA
  assert.match(html, /href="https:\/\/creativityiseverywhere\.com"/);
  assert.match(html, /Explore Studio Engagements/);
});

test("About page uses updated professional descriptor", () => {
  const html = read("about.html");
  assert.match(html, /Design &amp; AI Executive · 0→1 Product &amp; Experience Builder/);
});

test("Publications page uses refined hero title", () => {
  const html = read("publications.html");
  assert.match(html, /Books and ideas on creativity, design, bias, and AI\./);
});

test("AI Products category page splits into self-built products and organizational work", () => {
  const html = read("ai-products.html");
  assert.match(html, /AI Products &amp; Systems/);
  assert.match(html, /Products I’m Building/);
  assert.match(html, /AI Product \/ System Work/);
});

test("Brand category page visible title is Brand & Creative", () => {
  const html = read("brand.html");
  assert.match(html, /Brand &amp; Creative/);
});

test("Interactive category page visible title is Interactive & Playable", () => {
  const html = read("interactive.html");
  assert.match(html, /Interactive &amp; Playable/);
});

test("workshop.html and publications.html are warm paper light mode and not dark mode", () => {
  const ws = read("workshop.html");
  const pub = read("publications.html");

  assert.match(ws, /--bg:\s*#f3f2ee/);
  assert.ok(!ws.includes("--bg: #0c0d0e"));
  assert.match(ws, /color:\s*#4a4a44/); // nav-sub text contrast

  assert.match(pub, /--bg:\s*#f3f2ee/);
  assert.ok(!pub.includes("--bg: #0c0d0e"));
  assert.match(pub, /color:\s*#4a4a44/); // nav-sub text contrast
});

test("Resona emphasis is Creative technology and never Web animation", () => {
  const index = read("index.html");
  const jaIndex = read("ja/index.html");

  assert.match(index, /Creative technology · Live now/);
  assert.ok(!index.includes("Web animation · Live now"));

  assert.match(jaIndex, /Creative technology · Live now/);
  assert.match(jaIndex, /クリエイティブテクノロジー · 公開中/);
  assert.ok(!jaIndex.includes("ウェブアニメーション · 公開中"));
});

