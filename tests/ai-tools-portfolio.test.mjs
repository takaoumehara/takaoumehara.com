import test from 'node:test';
import assert from 'node:assert/strict';
import { read, exists, resolveUrl } from './_dist.mjs';
const mainPages = [
  'index.html', 'work.html', 'brand.html', 'ai-tools.html', 'ai-products.html', 'interactive.html',
  'about.html', 'contact.html', 'breakbias.html', 'intentfirst.html', '404.html',
];

const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const classSelector = (name) =>
  `(?=[^>]*\\bclass\\s*=\\s*(?:"[^"]*\\b${escape(name)}\\b[^"]*"|'[^']*\\b${escape(name)}\\b[^']*'))`;
const openWithClass = (tag, name) => new RegExp(`<${tag}\\b${classSelector(name)}[^>]*>`, 'gi');
const langSpan = (lang, text) =>
  `<span\\b${classSelector(lang)}[^>]*>\\s*${escape(text)}\\s*<\\/span>`;
const paired = (en, jp) => new RegExp(`${langSpan('t-en', en)}\\s*${langSpan('t-jp', jp)}`);
const attr = (tag, name) => tag.match(new RegExp(`\\b${escape(name)}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'))?.slice(1).find(Boolean);
const hasClass = (tag, name) => new RegExp(`\\bclass\\s*=\\s*(?:"[^"]*\\b${escape(name)}\\b[^"]*"|'[^']*\\b${escape(name)}\\b[^']*')`, 'i').test(tag);
const anchors = (html) => [...html.matchAll(/<a\b[^>]*>/gi)].map((match) => match[0]);

function assertPair(html, en, jp, label) {
  assert.ok(paired(en, jp).test(html), `${label} needs adjacent EN/JP spans`);
}

function assertNoUnsupportedClaims(html, label) {
  const unsupported = /\b(?:adoption|production usage|production-proven|proven at scale)\b/i;
  assert.equal(unsupported.test(html), false, `${label} must not claim unsupported adoption or production usage`);
}

function cssAtRuleBlocks(css, pattern) {
  const flags = [...new Set(`${pattern.flags}g`)].join('');
  const blocks = [];
  for (const match of css.matchAll(new RegExp(pattern.source, flags))) {
    const open = css.indexOf('{', match.index);
    let depth = 1;
    for (let index = open + 1; index < css.length; index += 1) {
      if (css[index] === '{') depth += 1;
      if (css[index] === '}') depth -= 1;
      if (depth === 0) {
        blocks.push(css.slice(open + 1, index));
        break;
      }
    }
  }
  return blocks;
}

function cssAtRuleBlock(css, pattern) {
  return cssAtRuleBlocks(css, pattern)[0] ?? '';
}

function cssRuleBody(css, selector) {
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (match[1].split(',').map((value) => value.trim()).includes(selector)) return match[2];
  }
  return '';
}

function sidebar(html, page) {
  const side = html.match(/<aside[^>]*class="side"[\s\S]*?<\/aside>/i)?.[0];
  assert.ok(side, `${page}: missing sidebar`);
  return side;
}
function workGroups(html, page) {
  const nav = sidebar(html, page).match(/<nav class="side-work"[^>]*>([\s\S]*?)<\/nav>/i)?.[1];
  assert.ok(nav, `${page}: missing the work groups`);
  return [...nav.matchAll(/<details class="side-group"( open)?[^>]*>\s*<summary[^>]*>\s*<span[^>]*>([\s\S]*?)<\/span>/gi)].map((match) => ({
    open: Boolean(match[1]), label: match[2].replace(/<[^>]+>/g, '').trim(),
  }));
}

// ── Sidebar consistency ──

// The old top-of-rail <nav class="side-pages"> (Now / Writing / Workshops /
// Work with me / Studio, each a standalone page) is gone: those pages'
// content now lives inside About's own sections (src/pages/about.astro —
// "consolidates all person pages into one", #now #writing #workshops
// #work-with-me #studio), so the rail no longer links to them separately.
// What the rail carries on every page now: the About card (a single link +
// the positioning line, no sub-list) and the five sections of the work (in
// one order, every group open, every piece in it). Only the page you are on
// is marked — with aria-current, not with a colour someone has to infer.
test('every page carries the same sidebar: the About card (no longer a page list) and the five sections in order', () => {
  const expectedGroups = [ 'Interactive &amp; Playable', 'AI Products &amp; Systems', 'AI Tools', 'Product &amp; Experience Design', 'Brand &amp; Creative' ];
  for (const page of mainPages) {
    const html = read(page);
    const side = sidebar(html, page);
    // The old per-page-type nav is gone; nothing should resurrect it.
    assert.equal(/<nav class="side-pages"/.test(side), false, `${page}: the old side-pages nav must not come back`);
    assert.deepEqual(workGroups(html, page).map((g) => g.label), expectedGroups, `${page}: work groups`);
    assert.match(side, /<a class="side-all" href="\/work"/, `${page}: the "All work" link`);
    assert.match(side, /<a class="side-label" href="\/about"[^>]*data-match="\/about \/about\.html"/, `${page}: the About card links to the About page`);
    assert.match(side, /<button class="side-theme" id="theme-switch" type="button" role="switch"/, `${page}: the theme switch`);
    assert.match(side, /<button class="side-lang" id="lang-cycle" type="button"/, `${page}: the language button`);
    assert.match(side, /<button class="side-toggle" id="side-toggle" type="button" aria-expanded="false" aria-controls="side-panel">/, `${page}: the phone menu button`);
  }
});

test('each page marks itself current in the sidebar, and only itself', () => {
  // Without a page list, the only "current page" markers left in the rail
  // are the About card, the "All work" link, and a project's own row.
  assert.match(sidebar(read('about.html'), 'about'), /<a class="side-label" href="\/about"[^>]*aria-current="page"/, 'about.html: the About card marks itself');
  assert.match(sidebar(read('work.html'), 'work'), /<a class="side-all" href="\/work"[^>]*aria-current="page"/, 'work.html: the "All work" link marks itself');
  for (const page of ['index.html', 'interactive.html', 'brand.html', 'contact.html']) {
    const side = sidebar(read(page), page);
    assert.equal(/<a class="side-label"[^>]*aria-current="page"/.test(side), false, `${page}: the About card must not be current`);
  }
  // Every group is open on every page (the reference lists everything), and
  // a case study marks its own row and nothing else.
  for (const page of ['interactive.html', 'brand.html', 'projects/koji-fizz.html']) {
    const groups = workGroups(read(page), page);
    assert.equal(groups.length, 5, `${page}: five groups`);
    assert.ok(groups.every((g) => g.open), `${page}: every group open`);
  }
  const koji = read('projects/koji-fizz.html');
  assert.match(sidebar(koji, 'koji'), /<a class="side-item" href="\/projects\/koji-fizz\.html"[^>]*aria-current="page"/);
  assert.equal((sidebar(koji, 'koji').match(/class="side-item"[^>]*aria-current="page"/g) ?? []).length, 1, 'koji: one current row');
});

// ── The canonical lens: generated from the default Lens, at /lens/default/ ──

// `/` is now the PORTO ROCHA image grid (src/pages/index.astro). The
// whole-story page — hero, then Selected proof, then every other section —
// is still rendered from src/lenses/default.json over the evidence library in
// src/data (see docs/adaptive-portfolio-architecture.md), just at
// /lens/default/ (src/pages/lens/[slug]/index.astro) instead of `/`. These
// tests check the composition, not the markup of any one card.
test('the default lens is rendered from src/lenses/default.json and leads with the hero, then Selected proof', () => {
  const html = read('lens/default/index.html');
  assert.match(html, /<html lang="en"[^>]* data-lens="default">/);
  const hero = html.indexOf('class="hero"');
  const proof = html.indexOf('id="proof"');
  assert.ok(hero >= 0 && proof > hero, 'the hero must come first, then Selected proof');
  assert.match(html, /I like the beginning of things\./, 'the canonical positioning must open the page');
});

test('the default lens\' Selected proof spans experiment, enterprise and venture evidence', () => {
  const html = read('lens/default/index.html');
  const section = html.match(/<section\b[^>]*\bid\s*=\s*["']proof["'][^>]*>([\s\S]*?)<\/section>/i)?.[0] ?? '';
  assert.ok(section, 'homepage needs a Selected proof section');
  const cards = [...section.matchAll(openWithClass('article', 'proof-card'))].length;
  assert.ok(cards >= 5 && cards <= 7, `Selected proof is a curated five to seven, got ${cards}`);
  for (const href of [/(?:https:\/\/rakugakijam\.creativityiseverywhere\.com\/|https:\/\/rakugaki-jam\.vercel\.app|\/projects\/rakugaki-jam\.html)/, '/projects/verizon-ai-agents.html', '/projects/festival-design.html', '/projects/ela-quests.html']) {
    const pattern = typeof href === 'string' ? `data-href\\s*=\\s*["']${escape(href)}["']` : `data-href\\s*=\\s*["']${href.source}["']`;
    assert.match(section, new RegExp(pattern), `Selected proof must include ${href}`);
  }
  assertNoUnsupportedClaims(section, 'homepage Selected proof');
});

// ── AI Tools dedicated page (ai-tools.html) ──

test('each AI Tools project detail page exists with its GitHub CTA and a link back to AI Tools', () => {
  const expected = [
    ['projects/snap-pair.html', 'https://github.com/takaoumehara/snap-pair-skill', 'Snap Pair'],
    ['projects/failforward.html', 'https://github.com/takaoumehara/failforward-skill', 'failforward'],
    ['projects/cross-model-handoff.html', 'https://github.com/takaoumehara/cross-model-handoff', 'cross-model-handoff'],
    ['projects/superforge.html', 'https://github.com/takaoumehara/superforge-skill', 'superforge'],
    ['projects/interactive-experience-skills.html', 'https://github.com/takaoumehara/interactive-experience-skills', 'interactive-experience-skills'],
    ['projects/multilingual-readme.html', 'https://github.com/takaoumehara/multilingual-readme-skill', 'multilingual-readme'],
    ['projects/intuitive-game-design.html', 'https://github.com/takaoumehara/intuitive-game-design-skill', 'intuitive-game-design'],
  ];
  for (const [page, githubUrl, label] of expected) {
    assert.ok(exists(page), `${page} must exist`);
    const html = read(page);
    const cta = anchors(html).find((tag) => attr(tag, 'href') === githubUrl);
    assert.ok(cta, `${label}: missing GitHub CTA linking ${githubUrl}`);
    assert.equal(attr(cta, 'target'), '_blank', `${label}: CTA must open a new tab`);
    assert.match(attr(cta, 'rel') ?? '', /\bnoopener\b/, `${label}: CTA needs rel=noopener`);
    assert.match(html, /<a[^>]+href="\.\.\/ai-tools\.html"/, `${label}: page must link back to AI Tools`);
  }
});

// ── AI Products page (ai-products.html) ──

// ── Interactive Experience page (interactive.html) ──

// ── Brand & Visual page (brand.html) ──

// ── Product Design page (work.html) ──

// ── Amazon Fire TV project page ──

// The old per-page breadcrumb ("AI Products"), "Next: AI Tools" bottom nav,
// and full-bleed .demo-full simulator container belonged to the old,
// individually hand-built project pages. Detail pages now share one template
// (src/components/project/ProjectDetail.astro — teaser, Challenge | Solution,
// no breadcrumb, no prev/next nav, no bespoke simulator chrome), and
// categorization lives only in the sidebar, shared by every page, once.
test('Amazon Fire TV project page renders through the shared Challenge/Solution template, with no old breadcrumb/Next-nav chrome, and is grouped under AI Products & Systems in the sidebar', () => {
  const html = read('projects/amazon-firetv.html');
  assert.ok(!html.includes('demo-full'), 'the old full-bleed demo-full simulator container must not remain');
  assert.equal(/Next:\s*AI Tools/.test(html), false, 'the old bottom-nav "Next: AI Tools" chrome must not remain');
  assert.equal(/<a href="\.\.\/ai-products\.html">AI Products<\/a>/.test(html), false, 'the old in-page breadcrumb must not remain');

  const article = html.match(/<article class="project-detail"[\s\S]*?<\/article>/)?.[0];
  assert.ok(article, 'must render through the shared project-detail template');
  assert.ok(article.includes('project-cs'), 'Challenge | Solution present');

  const side = sidebar(html, 'projects/amazon-firetv.html');
  const group = side.match(/<details class="side-group"[^>]*>\s*<summary[^>]*>\s*<span[^>]*>\s*<span class="t-en">AI Products &amp; Systems<\/span>[\s\S]*?<\/details>/)?.[0];
  assert.ok(group, 'sidebar must carry the AI Products & Systems group');
  assert.match(group, /href="\/projects\/amazon-firetv\.html"/, 'Amazon Fire TV must be listed under AI Products & Systems in the sidebar, not labeled in-page');
});

// ── Cross-cutting integrity checks ──

test('internal HTML links on every main page resolve to built pages and fragments', () => {
  for (const page of mainPages) {
    assert.ok(exists(page), `${page} must be built`);
    const html = read(page);
    for (const tag of anchors(html)) {
      const href = attr(tag, 'href');
      if (!href || /^(?:https?:|mailto:|tel:|javascript:)/i.test(href)) continue;
      const [target = '', fragment] = href.split('#');
      if (target && !target.endsWith('.html') && !target.endsWith('/')) continue;
      const targetPage = target ? resolveUrl(page, target) : page;
      assert.ok(exists(targetPage), `${page}: missing ${targetPage} (from ${href})`);
      if (fragment) assert.match(read(targetPage), new RegExp(`\\bid\\s*=\\s*["']${escape(fragment)}["']`), `${page}: missing ${href}`);
    }
  }
});

test('no main page carries the stale "Agentic UX" or "AI Tools & Infrastructure" labels', () => {
  for (const page of mainPages) {
    const html = read(page);
    // "Agentic UX" is fine as a capability or thesis label; it must not come back as a category (a sidebar group or section title).
    const side = sidebar(html, page);
    assert.equal(/>\s*Agentic UX\s*</.test(side), false, `${page}: stale "Agentic UX" sidebar label`);
    assert.equal(/<h2\b[^>]*>\s*(?:<span[^>]*>)?\s*Agentic UX\s*</.test(html), false, `${page}: stale "Agentic UX" section title`);
    assert.equal(/AI Tools\s*&amp;\s*Infrastructure/.test(html), false, `${page}: stale "AI Tools & Infrastructure" label`);
  }
});
