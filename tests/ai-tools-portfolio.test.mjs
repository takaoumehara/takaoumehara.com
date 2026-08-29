import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const v3 = root;
const read = (name) => readFileSync(join(v3, name), 'utf8');
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

function hasFinalClosedMobileNavOverride(html) {
  const baseFlexRules = [...html.matchAll(/\.nav-links\s*\{[^}]*\bdisplay\s*:\s*flex\b[^}]*\}/gi)];
  const lastBaseFlex = baseFlexRules.at(-1);
  if (!lastBaseFlex) return false;
  const cssAfterBaseFlex = html.slice(lastBaseFlex.index + lastBaseFlex[0].length);
  // The invariant is "hidden until is-open", not the pixel it happens at.
  // The landing page collapses at 940px because its five category labels
  // are words rather than abbreviations; the rest still collapse at 768.
  return /@media\s*\(max-width:\s*\d{3,4}px\)\s*\{[\s\S]*?\.nav-links\s*\{[^}]*\bdisplay\s*:\s*none\b[^}]*\}[\s\S]*?\.nav-links\.is-open\s*\{[^}]*\bdisplay\s*:\s*flex\b[^}]*\}/i.test(cssAfterBaseFlex);
}

function navDestinations(html, page) {
  const nav = html.match(/<ul\b[^>]*\bclass\s*=\s*(?:"[^"]*\bnav-links\b[^"]*"|'[^']*\bnav-links\b[^']*')[^>]*>([\s\S]*?)<\/ul>/i)?.[1];
  assert.ok(nav, `${page}: missing primary nav`);
  return [...nav.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)].map((match) => ({
    href: attr(match[0], 'href'), label: match[1].replace(/<[^>]+>/g, '').trim(), tag: match[0],
  }));
}

// ── Nav consistency across the four-theme reorg ──

// Six equal nav items read as a generalist. The three the work is sold as now
// lead at full ink; the two decades underneath sit behind a hairline rule.
//
// The five category names are the owner's, and they are the same five words
// on every page — a section that is called one thing in the nav and another
// on its own page is two sections as far as a visitor is concerned.
const CATEGORY_NAV = [
  ['interactive.html', 'Interactive Experience'],
  ['ai-products.html', 'AI Products'],
  ['ai-tools.html', 'AI Tools &amp; Skills'],
  ['work.html', 'Product Design'],
  ['brand.html', 'Branded Experience'],
];

test('all main-page navs carry the two-tier order, with the lead three marked', () => {
  const expected = [...CATEGORY_NAV, ['about.html', 'About'], ['contact.html', 'Contact']];
  const lead = new Set(['interactive.html', 'ai-products.html', 'ai-tools.html']);

  // index.html runs the Studio Oker shell, whose nav is deliberately flat —
  // it is asserted separately below until the other pages are ported to it.
  for (const page of mainPages.filter((name) => name !== 'index.html')) {
    const html = read(page);
    const nav = navDestinations(html, page);
    assert.deepEqual(nav.slice(0, 7).map(({ href, label }) => [href, label]), expected, `${page}: primary-nav order`);
    for (const { href, tag } of nav.slice(0, 7)) {
      assert.equal(hasClass(tag, 'is-lead'), lead.has(href), `${page}: ${href} lead-tier marking`);
    }
    // Drawn as a pseudo-element on the first base-tier item, so the nav's
    // spacing stays even — a separator element made that one gap double-width.
    assert.match(html, /<li\b[^>]*\bclass\s*=\s*["']is-tierbreak["'][^>]*><a href="(?:\.\.\/)?work\.html"/i, `${page}: needs the tier separator`);
    assert.equal(/class\s*=\s*["']nav-rule["']/i.test(html), false, `${page}: the separator must not occupy a nav slot`);
  }
});

// The landing page runs the Monumental Editorial shell. Its masthead is
// deliberately four items — the approved reference's own nav — and the five
// categories are reached through the Work Index and the footer instead.
// Two tiers, which is what the spec asks for; the five still have to be
// there, in order, and spelled the same way.
test('the landing page masthead is the four, and the five live in the index', () => {
  const html = read('index.html');

  const masthead = html.match(/<ul\b[^>]*\bclass\s*=\s*["']masthead__nav["'][^>]*>([\s\S]*?)<\/ul>/i)?.[1];
  assert.ok(masthead, 'index.html: missing the masthead nav');
  const labels = [...masthead.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim());
  assert.deepEqual(labels, ['Work', 'Practice', 'About', 'LinkedIn ↗'],
    'index.html: the masthead is Work / Practice / About / LinkedIn');

  const index = html.match(/<section\b[^>]*\bid\s*=\s*["']index["'][^>]*>([\s\S]*?)<\/section>/i)?.[0] ?? '';
  assert.ok(index, 'index.html: needs the Work Index');
  const rows = [...index.matchAll(/<a\b[^>]*\bclass\s*=\s*["']index__row["'][^>]*>/gi)].map((m) => m[0]);
  assert.deepEqual(rows.map((tag) => attr(tag, 'href')), CATEGORY_NAV.map(([href]) => href),
    'the Work Index carries the five, in order');
  for (const [, label] of CATEGORY_NAV) {
    assert.ok(index.includes(label), `the Work Index must name "${label}" exactly`);
  }

  // The footer is the other way in, and it must not disagree with the index.
  const foot = html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/i)?.[0] ?? '';
  for (const [href, label] of CATEGORY_NAV) {
    assert.match(foot, new RegExp(`href\\s*=\\s*["']${escape(href)}["'][^>]*>${escape(label)}<`),
      `the footer must link ${label} → ${href}`);
  }
});

test('each themed page marks its own nav item active', () => {
  const activeByPage = {
    'ai-products.html': 'ai-products.html',
    'interactive.html': 'interactive.html',
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
  // index.html carries no .nav-links at all — the editorial masthead is four
  // short items that wrap rather than collapse behind a toggle, so there is
  // no disclosure to leave open. Its width is asserted below instead.
  const pages = mainPages.filter((page) => page !== 'ai-tools.html' && page !== 'index.html');
  const missingOverrides = pages.filter((page) => !hasFinalClosedMobileNavOverride(read(page)));
  assert.deepEqual(missingOverrides, [], `mobile override must hide .nav-links until it is-open: ${missingOverrides.join(', ')}`);
  assert.ok(hasFinalClosedMobileNavOverride(read('ai-tools.html')), 'ai-tools.html must hide .nav-links until it is-open');
});

// ── The landing page: Monumental Editorial ──

// Approved 2026-08-26 against docs/evidence/monumental-editorial-preview.png.
// One ground, one ink, four type steps, real work shown large. These tests
// guard the rules that are easy to erode one commit at a time.

test('the landing page runs statement → selected work → practice → index → about → contact', () => {
  const html = read('index.html');
  const at = (id) => html.indexOf(`id="${id}"`);
  const order = ['work', 'practice', 'index', 'about', 'contact'].map(at);
  assert.ok(order.every((i) => i >= 0), 'the landing page needs all five sections');
  assert.deepEqual(order, [...order].sort((a, b) => a - b), 'sections must run in order');

  // The statement carries the page; it is the only display-size run above
  // the fold, and it is one h1.
  assert.equal([...html.matchAll(/<h1\b/gi)].length, 1, 'one h1');
  assert.match(html, /class="display lead__statement/, 'the statement is the display step');

  // Everything the previous landing pages stacked here now lives on its
  // category page. The archive is the Work Index, not the front door.
  for (const removed of ['id="agentic-ux"', 'id="playable"', 'id="ai-tools"', 'id="selected-work"', 'class="wall"']) {
    assert.equal(html.includes(removed), false, `${removed} belongs on a category page, not the landing page`);
  }
});

test('selected work is six real pieces, every one an image the site actually holds', () => {
  const html = read('index.html');
  const section = html.match(/<section\b[^>]*\bid\s*=\s*["']work["'][^>]*>([\s\S]*?)<\/section>/i)?.[0] ?? '';
  assert.ok(section, 'the landing page needs Selected Work');

  const pieces = [...section.matchAll(openWithClass('a', 'piece'))].map((m) => m[0]);
  assert.equal(pieces.length, 6, 'six, not sixteen — the archive is the index below');

  const imgs = [...section.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  assert.equal(imgs.length, 6, 'every piece is carried by a photograph');
  for (const tag of imgs) {
    const src = attr(tag, 'src');
    assert.ok(src && existsSync(join(v3, src)), `selected work image missing from the repo: ${src}`);
    assert.ok((attr(tag, 'alt') ?? '').length > 12, `${src} needs a real alt, not a filename`);
  }

  // The spec rejects CSS-drawn stand-ins in the work slots: a generated
  // panel with the project's own name set on it is a label, not the work.
  assert.equal(/card-art|play-art|tile-shout/.test(section), false,
    'no generated stand-in art in a work slot');
  assertNoUnsupportedClaims(section, 'landing page selected work');
});

test('the Work Index counts match what each category page actually holds', () => {
  const html = read('index.html');
  const section = html.match(/<section\b[^>]*\bid\s*=\s*["']index["'][^>]*>([\s\S]*?)<\/section>/i)?.[0] ?? '';

  const holds = {
    'interactive.html': [8, /class="work-card/g],
    'ai-products.html': [5, /class="work-card/g],
    'ai-tools.html': [7, /class="work-card/g],
    'work.html': [13, /idx-tile-name/g],
    'brand.html': [12, /idx-tile-name/g],
  };
  for (const [page, [claimed, pattern]] of Object.entries(holds)) {
    assert.match(section, new RegExp(`href\\s*=\\s*["']${escape(page)}["'][\\s\\S]*?<span class="meta">${claimed}<`),
      `the Work Index must list ${page} as ${claimed}`);
    assert.equal((read(page).match(pattern) ?? []).length, claimed,
      `${page} must actually hold the ${claimed} it is advertised as`);
  }
  assert.equal(section.includes('Innovation Workshop'), false, 'a category with no case study must not be advertised');
});

test('the editorial system keeps one ground, no elevation, and no rounded corners', () => {
  const css = readFileSync(join(v3, 'assets/editorial.css'), 'utf8');

  // Elevation is replaced by the void; radius is 0 everywhere. Both are
  // absolute in the spec, so absence is the assertion.
  assert.equal(/box-shadow\s*:/i.test(css), false, 'no shadows — the system separates with space and hairlines');
  assert.equal(/border-radius\s*:/i.test(css), false, 'no radius anywhere');

  // Colour lives in the work. Any hex that is not the greyscale ground,
  // ink or rule is an accent the spec does not allow.
  const allowed = new Set(['#f3f2ed', '#e9e7e0', '#14140f', '#5c5c55', '#0b0b09']);
  const hexes = [...css.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((m) => m[0].toLowerCase());
  const stray = [...new Set(hexes)].filter((h) => !allowed.has(h));
  assert.deepEqual(stray, [], 'the palette is the ground, the ink and the rule — colour belongs to the work');
});

test('the first-paint animation cannot leave the page blank', () => {
  const css = readFileSync(join(v3, 'assets/editorial.css'), 'utf8');
  const html = read('index.html');

  // A render-blocking stylesheet that stalls leaves the document timeline
  // unstarted, and an unstarted animation still paints its first keyframe.
  // Gate the animation behind a class the page only adds once `load` has
  // fired, so a stall means "no animation", never "no headline".
  assert.match(css, /html\.is-ready\s+\.rise\s*\{[^}]*animation\s*:/i,
    'the rise animation must be gated on html.is-ready');
  assert.equal(/^\s*\.rise\s*\{[^}]*animation\s*:/mi.test(css), false,
    '.rise must not animate on its own — that is the blank-page path');
  assert.match(html, /addEventListener\(\s*'load'\s*,[\s\S]{0,90}is-ready/,
    'the page must arm is-ready on load');
});

// ── AI Tools dedicated page (ai-tools.html) ──

test('AI Tools page tells seven bilingual tool stories, superforge first', () => {
  assert.ok(existsSync(join(v3, 'ai-tools.html')), 'v3/ai-tools.html must exist');
  const html = read('ai-tools.html');
  assert.match(html, /<title>\s*AI Tools — Takao Umehara\s*<\/title>/);
  assert.equal([...html.matchAll(/<h1\b/gi)].length, 1, 'AI Tools page needs exactly one h1');

  // Order is the argument: the skill system, then the library every
  // interactive piece runs on, then the two that serve that same work.
  const order = [...html.matchAll(/<article class="work-card" id="([a-z-]+)"/g)].map((m) => m[1]);
  assert.deepEqual(order, [
    'superforge', 'snap-pair', 'interactive-experience-skills', 'intuitive-game-design',
    'cross-model-handoff', 'failforward', 'multilingual-readme',
  ], 'AI Tools order');

  assert.match(html, /\bid\s*=\s*["']snap-pair-core["']/, 'ai-tools.html must keep the legacy #snap-pair-core anchor for existing links');
  // The claim that used to sit in the identity meta row now lives in the copy.
  assert.match(html, /open source and installable today/, 'the page must still say the tools are open source');
  assert.equal(html.includes('Six skills, one shelf'), false, 'the old placeholder headline must be gone');
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
    ['intuitive-game-design', 'projects/intuitive-game-design.html'],
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
    ['projects/intuitive-game-design.html', 'https://github.com/takaoumehara/intuitive-game-design-skill', 'intuitive-game-design'],
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

test('AI Products page is five products, with the interactive work moved out', () => {
  const html = read('ai-products.html');
  assert.match(html, /<title>\s*AI Products — Takao Umehara\s*<\/title>/);
  assert.equal([...html.matchAll(openWithClass('article', 'work-card'))].length, 5, 'AI Products page needs five work cards');
  // The identity meta row repeated the nav and footer on every page.
  assert.equal(/class\s*=\s*["']idx-meta["']/.test(html), false, 'the identity meta row must be gone');
  // Interactive Experience is its own category now; nothing of it may linger
  // here, markup or dead stylesheet.
  for (const stale of ['snap-section', 'play-group', 'Interactive Experience &amp; Games']) {
    assert.equal(html.includes(stale), false, `${stale} moved to interactive.html`);
  }
  assert.match(html, /<h2\b[^>]*\bclass\s*=\s*["']card-title["'][^>]*>\s*intentfirst\.ai\s*<\/h2>/);
  assert.match(html, /<h2\b[^>]*\bclass\s*=\s*["']card-title["'][^>]*>\s*Verizon AI Workflow\s*<\/h2>/);
  assert.match(html, /<h2\b[^>]*\bclass\s*=\s*["']card-title["'][^>]*>\s*Amazon Shopping on Fire TV\s*<\/h2>/);
  assert.equal(html.includes('BreakBias Studio'), false, 'BreakBias Studio must be removed — absorbed into superforge');
  assert.equal(html.includes('Ren UX Guard'), false, 'Ren UX Guard must be removed — absorbed into cross-model-handoff');
  // InstaLink → mypick.link → moimee.app → Moime.app. Still being rebuilt, so
  // it is listed as in production, and carries no "Visit" until it is public.
  assert.match(html, /Moime\.app/, 'the product must carry its current name, Moime.app');
  for (const retired of ['mypick.link', 'moimee']) {
    assert.equal(html.includes(retired), false, `the retired ${retired} name must be gone`);
  }
  assert.match(html, /Now under production/, 'Moime.app must be marked as in production, not shipped');
  assert.equal(html.includes('Visit ↗'), false, 'nothing in production should invite a visit yet');
});

// ── Interactive Experience page (interactive.html) ──

test('Interactive Experience is its own category page of eight projects', () => {
  assert.ok(existsSync(join(v3, 'interactive.html')), 'interactive.html must exist');
  const html = read('interactive.html');
  assert.match(html, /<title>\s*Interactive Experience — Takao Umehara\s*<\/title>/);
  assert.equal([...html.matchAll(/<h1\b/gi)].length, 1, 'interactive.html needs exactly one h1');
  assert.equal([...html.matchAll(openWithClass('article', 'work-card'))].length, 8, 'five experiences plus three games');
  assert.equal(/class\s*=\s*["']idx-meta["']/.test(html), false, 'the identity meta row must be gone');

  // "Interactive" is true of any button, so the two named bands carry the
  // meaning the umbrella cannot.
  assertPair(html, 'Experiences', '体験', 'experiences band');
  assertPair(html, 'Games', 'ゲーム', 'games band');

  // The input is the argument, so it is set as a specification and then
  // repeated as the leading label on every card.
  assert.match(html, /class="io-strip"/, 'the input/output specification must be present');
  const inputs = [...html.matchAll(/<span class="pill pill--in"><span class="t-en">([^<]+)</g)].map((m) => m[1]);
  assert.deepEqual(inputs, ['Pointer', 'Face', 'Handwriting', 'Typing', 'Voice', 'Up to four phones', 'Two phones', 'Every phone'], 'every card leads with its input');

  const titles = [...html.matchAll(/<h2 class="card-title">([A-Za-z0-9. ]+)/g)].map((m) => m[1].trim());
  assert.deepEqual(titles, ['Resona', 'Kao Game', 'Rakugaki Jam', 'Typespace', 'Koe Baku', 'EmojiDrop', 'Marubatsu 2.0', 'Werewolf Card Game'], 'card order');
  assertNoUnsupportedClaims(html, 'Interactive Experience page');
});

test('AI Products page no longer lists failforward, cross-model-handoff, or Konosaki', () => {
  const html = read('ai-products.html');
  assert.equal(html.includes('failforward'), false, 'failforward must have moved to AI Tools');
  assert.equal(html.includes('cross-model-handoff'), false, 'cross-model-handoff was never an AI Products entry');
  assert.equal(html.includes('Konosaki'), false, 'Konosaki must have moved to Brand & Visual');
});

// ── Brand & Visual page (brand.html) ──

// brand.html is now a banded index rather than a card grid: .idx-tile anchors
// carrying a thumbnail from assets/thumbs/, not <article class="work-card">.
test('Branded Experience page lists twelve projects and keeps Konosaki on its live URL', () => {
  assert.ok(existsSync(join(v3, 'brand.html')), 'v3/brand.html must exist');
  const html = read('brand.html');
  assert.match(html, /<title>\s*Branded Experience — Takao Umehara\s*<\/title>/);
  assert.equal([...html.matchAll(/<a\b[^>]*\bclass\s*=\s*["']idx-tile["']/gi)].length, 12, 'Brand & Visual page needs twelve tiles');
  const konosaki = html.match(/<a\b[^>]*href\s*=\s*["']https:\/\/konosaki-co\.vercel\.app\/?["'][\s\S]*?<\/a>/i)?.[0];
  assert.ok(konosaki, 'the Konosaki tile must still point at konosaki-co.vercel.app');
  assert.match(konosaki, /Konosaki/);
  assert.match(konosaki, /assets\/thumbs\/konosaki\.jpg/);
  assert.match(html, /<link\b[^>]*href\s*=\s*["']assets\/index-grid\.css["']/, 'brand.html must use the shared index system');
});

test('AI index pages expose thumbnail-led work-card grids', () => {
  const expectations = [
    ['ai-products.html', 5],
    ['interactive.html', 8],
    ['ai-tools.html', 7],
  ];

  for (const [page, expectedCount] of expectations) {
    const html = read(page);
    assert.match(html, /<div\b[^>]*\bclass\s*=\s*["'][^"']*\bwork-grid\b[^"']*["']/i, `${page} needs a work-grid`);
    assert.equal([...html.matchAll(openWithClass('article', 'work-card'))].length, expectedCount, `${page} needs ${expectedCount} work cards`);
    assert.match(html, /class=["'][^"']*\bcard-image\b[^"']*["']/i, `${page} needs card thumbnails`);
  }
});

// ── Product Design page (work.html) ──

test('Product Design page is an index of thirteen projects, with brand work still on brand.html', () => {
  const html = read('work.html');
  assert.match(html, /<title>\s*Product Design — Takao Umehara\s*<\/title>/);
  for (const moved of ['Coca-Cola', 'KOJI FIZZ', 'Kitadoko', 'DO! NUTS TOKYO', 'XQ Super School', 'GraffitiWear', 'extra•ordinary', 'Konosaki']) {
    assert.equal(html.includes(moved), false, `${moved} must have moved to brand.html`);
  }
  assert.equal([...html.matchAll(/<a\b[^>]*\bclass\s*=\s*["']idx-tile["']/gi)].length, 13, 'Product Design page needs thirteen tiles');
  assert.match(html, /Verizon Total Wireless/);
  assert.match(html, /Verizon AI Agents/);
  assert.match(html, /<link\b[^>]*href\s*=\s*["']assets\/index-grid\.css["']/, 'work.html must use the shared index system');
  // the card grid's filter bar and reveal script are gone; nothing may still
  // reference the count label they shared, which threw on every load.
  assert.equal(html.includes('id="count-label"'), false, 'the retired filter count label must be gone');
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
