import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const v3 = root;
const read = (name) => readFileSync(join(v3, name), 'utf8');
const mainPages = [
  'index.html', 'work.html', 'brand.html', 'ai-tools.html', 'ai-products.html', 'about.html',
  'contact.html', 'breakbias.html', 'intentfirst.html', '404.html',
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

function hasFinalClosedMobileNavOverride(html) {
  const baseFlexRules = [...html.matchAll(/\.nav-links\s*\{[^}]*\bdisplay\s*:\s*flex\b[^}]*\}/gi)];
  const lastBaseFlex = baseFlexRules.at(-1);
  if (!lastBaseFlex) return false;
  const cssAfterBaseFlex = html.slice(lastBaseFlex.index + lastBaseFlex[0].length);
  return /@media\s*\(max-width:\s*76[78]px\)\s*\{[\s\S]*?\.nav-links\s*\{[^}]*\bdisplay\s*:\s*none\b[^}]*\}[\s\S]*?\.nav-links\.is-open\s*\{[^}]*\bdisplay\s*:\s*flex\b[^}]*\}/i.test(cssAfterBaseFlex);
}

function navDestinations(html, page) {
  const nav = html.match(/<ul\b[^>]*\bclass\s*=\s*(?:"[^"]*\bnav-links\b[^"]*"|'[^']*\bnav-links\b[^']*')[^>]*>([\s\S]*?)<\/ul>/i)?.[1];
  assert.ok(nav, `${page}: missing primary nav`);
  return [...nav.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)].map((match) => ({
    href: attr(match[0], 'href'), label: match[1].replace(/<[^>]+>/g, '').trim(), tag: match[0],
  }));
}

// ── Nav consistency across the four-theme reorg ──

test('all main-page navs order AI Products, AI Tools, Product Design, Brand & Visual, About, and Contact', () => {
  const expected = [
    ['ai-products.html', 'AI Products'], ['ai-tools.html', 'AI Tools'], ['work.html', 'Product Design'],
    ['brand.html', 'Brand &amp; Visual'], ['about.html', 'About'], ['contact.html', 'Contact'],
  ];
  for (const page of mainPages) {
    const nav = navDestinations(read(page), page);
    assert.deepEqual(nav.slice(0, 6).map(({ href, label }) => [href, label]), expected, `${page}: primary-nav order`);
  }
});

test('each themed page marks its own nav item active', () => {
  const activeByPage = {
    'ai-products.html': 'ai-products.html',
    'ai-tools.html': 'ai-tools.html',
    'work.html': 'work.html',
    'brand.html': 'brand.html',
    'about.html': 'about.html',
    'contact.html': 'contact.html',
  };
  for (const [page, href] of Object.entries(activeByPage)) {
    const active = navDestinations(read(page), page).find((item) => item.href === href)?.tag;
    assert.ok(active && hasClass(active, 'is-active') && attr(active, 'aria-current') === 'page', `${page}: its own nav item must be active`);
  }
});

test('final polish: repeated main-page mobile navs remain closed by default', () => {
  const pages = mainPages.filter((page) => page !== 'ai-tools.html');
  const missingOverrides = pages.filter((page) => !hasFinalClosedMobileNavOverride(read(page)));
  assert.deepEqual(missingOverrides, [], `mobile override must hide .nav-links until it is-open: ${missingOverrides.join(', ')}`);
  assert.ok(hasFinalClosedMobileNavOverride(read('ai-tools.html')), 'ai-tools.html must hide .nav-links until it is-open');
});

// ── Homepage: AI Products + Playable + AI Tools + Selected Work ──

test('homepage orders AI Products, then AI Tools, then Selected Work', () => {
  const html = read('index.html');
  const agentic = html.indexOf('id="agentic-ux"');
  const tools = html.indexOf('id="ai-tools"');
  const selected = html.indexOf('id="selected-work"');
  assert.ok(agentic >= 0, 'homepage needs id="agentic-ux"');
  assert.ok(tools > agentic, 'AI Tools must follow AI Products');
  assert.ok(selected > tools, 'Selected Work must follow AI Tools');
});

test('homepage AI Products section presents the three flagship items', () => {
  const html = read('index.html');
  const section = html.match(/<section\b[^>]*\bid\s*=\s*["']agentic-ux["'][^>]*>([\s\S]*?)<\/section>/i)?.[0] ?? '';
  assert.match(section, /AI Products/);
  assert.equal([...section.matchAll(openWithClass('a', 'ai-card'))].length, 3, 'AI Products needs three cards');
  assert.match(section, /href\s*=\s*["']https:\/\/intentfirst\.ai["']/);
  assert.match(section, /href\s*=\s*["']projects\/verizon-ai-agents\.html["']/);
  assert.match(section, /href\s*=\s*["']projects\/amazon-firetv\.html["']/);
  assertPair(section, 'Designing how humans and AI agents share work — framework research, an enterprise agent fleet, and living prototypes you can touch.', '人と AI エージェントがどう仕事を分担するかのデザイン。フレームワーク研究、エンタープライズのエージェント艦隊、そして実際に触れる動くプロトタイプ。', 'homepage AI Products intro');
  assertNoUnsupportedClaims(section, 'homepage AI Products section');
});

test('homepage AI Tools section presents six project rows in order', () => {
  const html = read('index.html');
  const section = html.match(/<section\b[^>]*\bid\s*=\s*["']ai-tools["'][^>]*>([\s\S]*?)<\/section>/i)?.[0] ?? '';
  assert.equal([...section.matchAll(openWithClass('article', 'tools-row'))].length, 6, 'AI Tools needs six project rows');
  const names = [...section.matchAll(/<h3\b[^>]*\bclass\s*=\s*["']tools-name["'][^>]*>([\s\S]*?)<\/h3>/gi)].map((m) => m[1].trim());
  assert.deepEqual(names, ['Snap Pair', 'superforge', 'cross-model-handoff', 'failforward', 'multilingual-readme', 'interactive-experience-skills'], 'AI Tools rows must lead with Snap Pair and superforge, the two flagships, then the rest');
  for (const anchor of ['snap-pair', 'superforge', 'cross-model-handoff', 'failforward', 'multilingual-readme', 'interactive-experience-skills']) {
    assert.match(section, new RegExp(`href\\s*=\\s*["']ai-tools\\.html#${escape(anchor)}["']`), `homepage row must link ai-tools.html#${anchor}`);
  }
  assertPair(section, 'View project →', 'プロジェクトを見る →', 'homepage AI Tools project CTAs');
  assertPair(section, 'Explore AI tools →', 'AI Tools を見る →', 'homepage AI Tools section CTA');
  assertNoUnsupportedClaims(section, 'homepage AI Tools section');
});

// ── AI Tools dedicated page (ai-tools.html) ──

test('AI Tools page tells six bilingual tool stories with the right ids', () => {
  assert.ok(existsSync(join(v3, 'ai-tools.html')), 'v3/ai-tools.html must exist');
  const html = read('ai-tools.html');
  assert.match(html, /<title>\s*AI Tools — Takao Umehara\s*<\/title>/);
  assert.equal([...html.matchAll(/<h1\b/gi)].length, 1, 'AI Tools page needs exactly one h1');
  for (const id of ['snap-pair', 'failforward', 'cross-model-handoff', 'superforge', 'interactive-experience-skills', 'multilingual-readme']) {
    assert.match(html, new RegExp(`\\bid\\s*=\\s*["']${escape(id)}["']`), `ai-tools.html must have an anchor id="${id}"`);
  }
  assert.match(html, /\bid\s*=\s*["']snap-pair-core["']/, 'ai-tools.html must keep the legacy #snap-pair-core anchor for existing links');
  assertPair(html, 'AI Tools — open source, designed &amp; built by Takao', 'AI Tools — オープンソース · Takaoが設計・実装', 'AI Tools page eyebrow');
});

test('AI Tools index cards link to internal project detail pages, not straight to GitHub', () => {
  const html = read('ai-tools.html');
  const expected = [
    ['snap-pair', 'projects/snap-pair.html'],
    ['failforward', 'projects/failforward.html'],
    ['cross-model-handoff', 'projects/cross-model-handoff.html'],
    ['superforge', 'projects/superforge.html'],
    ['interactive-experience-skills', 'projects/interactive-experience-skills.html'],
    ['multilingual-readme', 'projects/multilingual-readme.html'],
  ];
  for (const [id, href] of expected) {
    const card = html.match(new RegExp(`<article\\b[^>]*\\bid\\s*=\\s*["']${escape(id)}["'][^>]*>`, 'i'))?.[0];
    assert.ok(card, `ai-tools.html needs a #${id} card`);
    assert.equal(attr(card, 'data-href'), href, `${id} card must link to ${href}`);
    assert.equal(attr(card, 'data-external'), undefined, `${id} card must not be marked external (it's an internal project page)`);
  }
});

test('each AI Tools project detail page exists with its GitHub CTA and a link back to AI Tools', () => {
  const expected = [
    ['projects/snap-pair.html', 'https://github.com/takaoumehara/snap-pair-skill', 'Snap Pair'],
    ['projects/failforward.html', 'https://github.com/takaoumehara/failforward-skill', 'failforward'],
    ['projects/cross-model-handoff.html', 'https://github.com/takaoumehara/cross-model-handoff', 'cross-model-handoff'],
    ['projects/superforge.html', 'https://github.com/takaoumehara/superforge-skill', 'superforge'],
    ['projects/interactive-experience-skills.html', 'https://github.com/takaoumehara/interactive-experience-skills', 'interactive-experience-skills'],
    ['projects/multilingual-readme.html', 'https://github.com/takaoumehara/multilingual-readme-skill', 'multilingual-readme'],
  ];
  for (const [page, githubUrl, label] of expected) {
    assert.ok(existsSync(join(v3, page)), `${page} must exist`);
    const html = read(page);
    const cta = anchors(html).find((tag) => attr(tag, 'href') === githubUrl);
    assert.ok(cta, `${label}: missing GitHub CTA linking ${githubUrl}`);
    assert.equal(attr(cta, 'target'), '_blank', `${label}: CTA must open a new tab`);
    assert.match(attr(cta, 'rel') ?? '', /\bnoopener\b/, `${label}: CTA needs rel=noopener`);
    assert.match(html, /<a[^>]+href="\.\.\/ai-tools\.html"/, `${label}: page must link back to AI Tools`);
  }
});

test('AI Tools page reduced motion disables controls, diagrams, and reveal transitions', () => {
  const reduced = cssAtRuleBlock(read('ai-tools.html'), /@media\s*\(prefers-reduced-motion:\s*reduce\)/i);
  assert.ok(reduced, 'ai-tools.html needs a reduced-motion media block');
  for (const selector of ['.nav-toggle span', '.nav-links a', '.lang-btn', '.story-cta', '.rail-item']) {
    assert.match(cssRuleBody(reduced, selector), /\btransition\s*:\s*none(?:\s*!important)?\s*;/i, `${selector} transition must be disabled for reduced motion`);
  }
  assert.match(reduced, /\.diagram \.draw\s*\{[^}]*\btransition\s*:\s*none/i, 'diagram draw-in must be disabled for reduced motion');
  assert.match(reduced, /\.diagram \.dot,\s*\.diagram \.pulse\s*\{[^}]*\banimation\s*:\s*none/i, 'diagram loops must be disabled for reduced motion');
});

test('AI Tools page mobile toggle exposes state, control, and collapses stories to one column', () => {
  const html = read('ai-tools.html');
  const toggle = html.match(/<button\b(?=[^>]*\bclass\s*=\s*(?:"[^"]*\bnav-toggle\b[^"]*"|'[^']*\bnav-toggle\b[^']*'))[^>]*>/i)?.[0];
  assert.ok(toggle, 'ai-tools.html needs a mobile nav toggle');
  assert.equal(attr(toggle, 'type'), 'button');
  assert.equal(attr(toggle, 'aria-expanded'), 'false');
  assert.match(html, /toggle\.addEventListener\(\s*['"]click['"]\s*,[\s\S]*?toggle\.setAttribute\(\s*['"]aria-expanded['"]\s*,/, 'toggle click must update aria-expanded');

  const blocks = cssAtRuleBlocks(html, /@media\s*\(max-width:\s*9?00px\)/i);
  const collapsesToOneColumn = blocks.some((block) => /\bgrid-template-columns\s*:\s*1fr\s*[;,]/i.test(cssRuleBody(block, '.mech-grid')));
  assert.ok(collapsesToOneColumn, 'ai-tools.html must collapse .mech-grid to one column at or below 900px (covers the 768px breakpoint)');
});

// ── AI Products page (ai-products.html) ──

test('AI Products page presents a curated products grid plus a Playable showcase', () => {
  const html = read('ai-products.html');
  assert.match(html, /<title>\s*AI Products — Takao Umehara\s*<\/title>/);
  assert.match(html, /<div\b[^>]*\bclass\s*=\s*["'][^"']*\bpage-count\b[^"']*["'][^>]*>\s*13 projects\s*<\/div>/i);
  assert.equal([...html.matchAll(openWithClass('article', 'work-card'))].length, 13, 'AI Products page needs thirteen work cards (5 products + 5 interactive + 3 games)');
  assertPair(html, 'Interactive Experience &amp; Games', 'インタラクティブ体験とゲーム', 'interactive section title');
  // The two named groups are the point: "interactive" alone is true of a button.
  assertPair(html, 'Interactive Experience', '体験', 'interactive-experience group');
  assertPair(html, 'Games', 'ゲーム', 'games group');
  assert.match(html, /<h2\b[^>]*\bclass\s*=\s*["']card-title["'][^>]*>\s*intentfirst\.ai\s*<\/h2>/);
  assert.match(html, /<h2\b[^>]*\bclass\s*=\s*["']card-title["'][^>]*>\s*Verizon AI Workflow\s*<\/h2>/);
  assert.match(html, /<h2\b[^>]*\bclass\s*=\s*["']card-title["'][^>]*>\s*Amazon Shopping on Fire TV\s*<\/h2>/);
  assert.equal(html.includes('BreakBias Studio'), false, 'BreakBias Studio must be removed — absorbed into superforge');
  assert.equal(html.includes('Ren UX Guard'), false, 'Ren UX Guard must be removed — absorbed into cross-model-handoff');
  assert.match(html, /mypick\.link/, 'InstaLink must be renamed to mypick.link');
});

test('AI Products page no longer lists failforward, cross-model-handoff, or Konosaki', () => {
  const html = read('ai-products.html');
  assert.equal(html.includes('failforward'), false, 'failforward must have moved to AI Tools');
  assert.equal(html.includes('cross-model-handoff'), false, 'cross-model-handoff was never an AI Products entry');
  assert.equal(html.includes('Konosaki'), false, 'Konosaki must have moved to Brand & Visual');
});

// ── Brand & Visual page (brand.html) ──

test('Brand & Visual page uses the supplied Konosaki thumbnail and live URL', () => {
  assert.ok(existsSync(join(v3, 'brand.html')), 'v3/brand.html must exist');
  const html = read('brand.html');
  assert.match(html, /<title>\s*Brand &amp; Visual — Takao Umehara\s*<\/title>/);
  assert.equal([...html.matchAll(openWithClass('article', 'work-card'))].length, 12, 'Brand & Visual page needs twelve cards');
  const konosaki = html.match(/<article\b[^>]*\bdata-href\s*=\s*["']https:\/\/konosaki-co\.vercel\.app\/?["'][^>]*>[\s\S]*?<\/article>/i)?.[0];
  assert.ok(konosaki, 'Brand & Visual page needs a Konosaki card linking to konosaki-co.vercel.app');
  assert.match(konosaki, /Konosaki/);
  assert.match(konosaki, /assets\/konosaki\/KONOSAKI-logo\/KONOSAKI_WEWORK-VERTICAL\.svg/);
});

test('AI index pages expose thumbnail-led work-card grids', () => {
  const expectations = [
    ['ai-products.html', 13],
    ['ai-tools.html', 6],
  ];

  for (const [page, expectedCount] of expectations) {
    const html = read(page);
    assert.match(html, /<div\b[^>]*\bclass\s*=\s*["'][^"']*\bwork-grid\b[^"']*["']/i, `${page} needs a work-grid`);
    assert.equal([...html.matchAll(openWithClass('article', 'work-card'))].length, expectedCount, `${page} needs ${expectedCount} work cards`);
    assert.match(html, /class=["'][^"']*\bcard-image\b[^"']*["']/i, `${page} needs card thumbnails`);
  }
});

// ── Product Design page (work.html) ──

test('Product Design page dropped the brand/visual cards and Konosaki', () => {
  const html = read('work.html');
  assert.match(html, /<title>\s*Product Design — Takao Umehara\s*<\/title>/);
  for (const moved of ['Coca-Cola Rebranding', 'KOJI FIZZ Films', 'Kitadoko', 'DO! NUTS TOKYO', 'XQ Super School', 'GraffitiWear', 'extra•ordinary', 'Konosaki']) {
    assert.equal(html.includes(moved), false, `${moved} must have moved to brand.html`);
  }
  assert.match(html, /Verizon TotalWireless/);
  assert.match(html, /AI Workflow Transformation/);
});

// ── Amazon Fire TV project page ──

test('Amazon Fire TV project page labels itself under AI Products and links AI Tools next', () => {
  const html = read('projects/amazon-firetv.html');
  assert.match(html, /<a href="\.\.\/ai-products\.html">AI Products<\/a>/, 'breadcrumb must read AI Products');
  assert.match(html, /Next: AI Tools/, 'bottom nav must point to AI Tools, not the old AI Tools & Infrastructure label');
  assert.match(html, /class="demo-full/, 'the live simulator must use the full-bleed demo-full container');
});

// ── Cross-cutting integrity checks ──

test('internal HTML links on every main page resolve to files and fragments', () => {
  for (const page of mainPages) {
    assert.ok(existsSync(join(v3, page)), `v3/${page} must exist`);
    const html = read(page);
    for (const tag of anchors(html)) {
      const href = attr(tag, 'href');
      if (!href || /^(?:https?:|mailto:|tel:|javascript:)/i.test(href)) continue;
      const [target = '', fragment] = href.split('#');
      if (target && !target.endsWith('.html')) continue;
      const targetPage = target || page;
      const targetPath = join(v3, targetPage);
      assert.ok(existsSync(targetPath), `${page}: missing ${targetPage}`);
      if (fragment) assert.match(read(targetPage), new RegExp(`\\bid\\s*=\\s*["']${escape(fragment)}["']`), `${page}: missing ${href}`);
    }
  }
});

test('no main page carries the stale "Agentic UX" or "AI Tools & Infrastructure" labels', () => {
  for (const page of mainPages) {
    const html = read(page);
    assert.equal(/>\s*Agentic UX\s*</.test(html), false, `${page}: stale "Agentic UX" label`);
    assert.equal(/AI Tools\s*&amp;\s*Infrastructure/.test(html), false, `${page}: stale "AI Tools & Infrastructure" label`);
  }
});
