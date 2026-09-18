// Tests for the Final Strategic Refinement of takaoumehara.com
import test from "node:test";
import assert from "node:assert/strict";
import { loadLibrary } from "../src/lib/load.mjs";
import { read, exists } from "./_dist.mjs";

const lib = loadLibrary();

test("Work archive (/all/index.html) is rendered from lib.evidence with 6 canonical discipline filter tabs", () => {
  assert.ok(exists("all/index.html"), "all/index.html must exist");
  const html = read("all/index.html");

  // All public archive items must be present (kanji-puzzle hidden). The grid
  // card (src/components/grid/GridCard.astro) carries `grid-card` alongside
  // the legacy `cat-card` class this test reads off.
  const cards = [...html.matchAll(/<article class="[^"]*\bcat-card\b[^"]*"/g)];
  assert.equal(cards.length, lib.evidence.size - 1, "all archive evidence items must be rendered (kanji-puzzle hidden)");
  assert.ok(!html.includes("Kanji Puzzle"), "Kanji Puzzle must be hidden from work archive");

  // Filter tabs must exist
  const expectedFilters = ["all", "product", "ai-products", "ai-tools", "interactive", "brand"];
  for (const f of expectedFilters) {
    assert.match(html, new RegExp(`data-filter="${f}"`), `Filter tab ${f} must exist`);
  }

  // Canonical tag must point to /all
  assert.match(html, /<link rel="canonical" href="https:\/\/takaoumehara\.com\/all">/);
});

test("Japanese edition (/ja/index.html) declares Japanese and its own canonical; the canonical hero copy lives on the default lens it points into", () => {
  assert.ok(exists("ja/index.html"), "ja/index.html must exist");
  const html = read("ja/index.html");

  // Root must declare Japanese
  assert.match(html, /<html lang="ja" class="lang-jp"/);

  // Canonical tag
  assert.match(html, /<link rel="canonical" href="https:\/\/takaoumehara\.com\/ja">/);

  // The whole-story page (hero, proof, every section) is now the default
  // lens, built at lens/default/index.html (src/pages/lens/[slug]/index.astro)
  // rather than at `/`, which is now the PORTO ROCHA image grid. t()/tb()
  // render both language spans into every page regardless of <html lang>, so
  // the exact Japanese hero copy required by strategic positioning is there
  // even though this one build's own <html> reads lang="en".
  const lens = read("lens/default/index.html");
  assert.match(lens, /何かが始まるときが、いちばんおもしろい。/);
  assert.match(lens, /曖昧なアイデアを、実際に触れる体験や、動く AI プロトタイプ、0→1 のプロダクトにする。/);
  assert.match(lens, /まだ答えが見えていないところから入り、デザイン、テクノロジー、AI、プロダクト、ビジネスをつなぎながら/);
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
  assert.match(html, /<h1 class="bento-statement">[\s\S]*?Break Bias[\s\S]*?<\/h1>/);

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

test("no page about the person carries a stylesheet or a :root of its own", () => {
  // This check used to demand a paper colour of each page's own :root. That was
  // exactly the bug: each hand-built page set --bg on :root (0-1-0), which
  // design-system.css's html[data-theme="light"] (0-1-1) beat in light mode and
  // which beat the dark block in dark mode — so four of these pages ignored the
  // theme switch entirely. The pages are bento now (src/components/BentoDoc.astro):
  // no page CSS, no design-system.css, one set of tokens, so the switch works.
  for (const page of ["about.html", "publications.html", "workshop.html", "contact.html", "work-with-me.html", "now/index.html"]) {
    const html = read(page);
    assert.ok(!html.includes("design-system.css"), `${page} must not load design-system.css`);
    assert.ok(!/--bg:\s*#/.test(html), `${page} must not redefine --bg`);
    assert.ok(!/:root\s*\{/.test(html), `${page} must not carry a :root of its own`);
    assert.ok(!/@font-face/.test(html), `${page} must not declare its own fonts`);
    assert.ok(!/--col:/.test(html), `${page} must not set its own column width`);
    assert.match(html, /<div class="bento-doc">/, `${page} must be drawn as a bento`);
  }
});

test("Resona emphasis is Creative technology and never Web animation", () => {
  // Proof-card emphasis is lens content — the default lens, built at
  // lens/default/index.html. t() renders both language spans in one build.
  const lens = read("lens/default/index.html");
  assert.match(lens, /Creative technology · Live now/);
  assert.match(lens, /クリエイティブテクノロジー · 公開中/);
  assert.ok(!lens.includes("Web animation · Live now"));
  assert.ok(!lens.includes("ウェブアニメーション · 公開中"));
});

test("contact.html and work-with-me.html are the same page, at two addresses", () => {
  // The two hand-built fragments were byte-identical apart from one link and
  // their <title>; they share one layout now (src/pages/work-with-me.astro).
  const contact = read("contact.html");
  const workWithMe = read("work-with-me.html");

  const body = (html) => html.slice(html.indexOf('<div class="bento-doc">'));
  const extra = /Hiring\? Paste your posting and see my work arranged for it →/;

  assert.match(workWithMe, extra, "work-with-me keeps its line for people hiring");
  assert.ok(!extra.test(contact), "contact does not carry that line");
  assert.equal(
    body(contact),
    body(workWithMe).replace(/<a href="\/try\/"[^>]*>(?:(?!<\/a>).)*<\/a>/s, ""),
    "the two pages are otherwise the same bento",
  );
});

test("Homepage headline leads with concrete high-business-value executive capability statement", () => {
  const index = read("index.html");
  const jaIndex = read("ja/index.html");

  // The landing page (src/components/landing/Landing.astro) leads with
  // profile.positioning[1], as the page's one <h1>.
  assert.match(index, /<h1 class="landing-line"><span class="t-en">I turn ambiguous ideas into interactive experiences, working AI prototypes, and 0→1 products\.<\/span>/);
  assert.match(jaIndex, /<h1 class="landing-line"><span class="t-en">I turn ambiguous ideas into interactive experiences, working AI prototypes, and 0→1 products\.<\/span>/);
  assert.match(jaIndex, /曖昧なアイデアを、実際に触れる体験や、動く AI プロトタイプ、0→1 のプロダクトにする。/);

  // The canonical lens (lens/default/index.html) still leads with the same
  // statement as its <h1>.
  const lens = read("lens/default/index.html");
  assert.match(lens, /<h1 class="hero-line"><span class="t-en">I turn ambiguous ideas into interactive experiences, working AI prototypes, and 0→1 products\.<\/span>/);
});

test("Homepage ventures section synchronizes live status and content from now.json", () => {
  // Ventures is a lens section, built at lens/default/index.html.
  const lens = read("lens/default/index.html");
  assert.match(lens, /Moime\.app<\/h3><span class="pill pill--status"><span class="t-en">Building<\/span>/);
});
