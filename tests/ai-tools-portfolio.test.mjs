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
  return /@media\s*\(max-width:\s*76[78]px\)\s*\{[\s\S]*?\.nav-links\s*\{[^}]*\bdisplay\s*:\s*none\b[^}]*\}[\s\S]*?\.nav-links\.is-open\s*\{[^}]*\bdisplay\s*:\s*flex\b[^}]*\}/i.test(cssAfterBaseFlex);
}

function navDestinations(html, page) {
  const nav = html.match(/<ul\b[^>]*\bclass\s*=\s*(?:"[^"]*\bnav-links\b[^"]*"|'[^']*\bnav-links\b[^']*')[^>]*>([\s\S]*?)<\/ul>/i)?.[1];
  assert.ok(nav, `${page}: missing primary nav`);
  return [...nav.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)].map((match) => ({
    href: attr(match[0], 'href'), label: match[1].replace(/<[^>]+>/g, '').trim(), tag: match[0],
  }));
}

// ── Nav consistency ──

// The nav used to mark Interactive / AI Products / AI Tools as a "lead tier" at
// full ink and leave the rest grey. On a Brand & Visual page that rendered
// Product Design as though it were disabled, for a reason no reader could
// infer. One rule now: every item is equal, and only the page you are on is
// emphasised. The divider separates the five sections of work from the two
// pages about the person.
test('every nav item carries the same weight — only the current page is marked', () => {
  const expected = [
    ['interactive.html', 'Interactive'], ['ai-products.html', 'AI Products'], ['ai-tools.html', 'AI Tools'],
    ['work.html', 'Product Design'], ['brand.html', 'Brand &amp; Visual'],
    ['about.html', 'About'], ['contact.html', 'Contact'],
  ];

  for (const page of mainPages) {
    const html = read(page);
    const nav = navDestinations(html, page);
    assert.deepEqual(nav.slice(0, 7).map(({ href, label }) => [href, label]), expected, `${page}: primary-nav order`);
    for (const { href, tag } of nav.slice(0, 7)) {
      assert.equal(hasClass(tag, 'is-lead'), false, `${page}: ${href} must not carry the retired lead tier`);
    }
    assert.equal(/\.nav-links a\.is-lead\s*\{/.test(html), false, `${page}: the lead-tier rule must be gone from the CSS too`);
    // Drawn as a pseudo-element on the item after the work sections, so the
    // nav's spacing stays even — a separator element made that gap double-width.
    assert.match(html, /<li\b[^>]*\bclass\s*=\s*["']is-tierbreak["'][^>]*><a href="(?:\.\.\/)?about\.html"/i, `${page}: the divider sits before About`);
    assert.equal(/class\s*=\s*["']nav-rule["']/i.test(html), false, `${page}: the separator must not occupy a nav slot`);
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
  const pages = mainPages.filter((page) => page !== 'ai-tools.html');
  const missingOverrides = pages.filter((page) => !hasFinalClosedMobileNavOverride(read(page)));
  assert.deepEqual(missingOverrides, [], `mobile override must hide .nav-links until it is-open: ${missingOverrides.join(', ')}`);
  assert.ok(hasFinalClosedMobileNavOverride(read('ai-tools.html')), 'ai-tools.html must hide .nav-links until it is-open');
});

// ── Homepage: generated from the default Lens ──

// The homepage is no longer hand-built. It is rendered from src/lenses/default.json
// over the evidence library in src/data (see docs/adaptive-portfolio-architecture.md),
// so these tests check the composition, not the markup of any one card.
test('homepage is generated from the default lens and leads with the hero, then Selected proof', () => {
  const html = read('index.html');
  assert.match(html, /GENERATED by src\/build\.mjs from src\/lenses\/default\.json/, 'index.html must be a build output');
  assert.match(html, /<html lang="en" data-lens="default">/);
  const hero = html.indexOf('class="hero"');
  const proof = html.indexOf('id="proof"');
  assert.ok(hero >= 0 && proof > hero, 'the hero must come first, then Selected proof');
  assert.match(html, /I like the beginning of things\./, 'the canonical positioning must open the page');
});

test('homepage Selected proof spans experiment, enterprise and venture evidence', () => {
  const html = read('index.html');
  const section = html.match(/<section\b[^>]*\bid\s*=\s*["']proof["'][^>]*>([\s\S]*?)<\/section>/i)?.[0] ?? '';
  assert.ok(section, 'homepage needs a Selected proof section');
  const cards = [...section.matchAll(openWithClass('article', 'proof-card'))].length;
  assert.ok(cards >= 5 && cards <= 7, `Selected proof is a curated five to seven, got ${cards}`);
  for (const href of ['https://rakugaki-jam.vercel.app', 'projects/verizon-ai-agents.html', 'projects/festival-design.html', 'projects/ela-quests.html']) {
    assert.match(section, new RegExp(`data-href\\s*=\\s*["']${escape(href)}["']`), `Selected proof must include ${href}`);
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
    assert.ok(existsSync(join(v3, page)), `${page} must exist`);
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
    // "Agentic UX" is fine as a capability or thesis label; it must not come back as a category (nav item or section title).
    const nav = html.match(/<ul\b[^>]*\bclass\s*=\s*["'][^"']*\bnav-links\b[^"']*["'][^>]*>[\s\S]*?<\/ul>/i)?.[0] ?? '';
    assert.equal(/>\s*Agentic UX\s*</.test(nav), false, `${page}: stale "Agentic UX" nav label`);
    assert.equal(/<h2\b[^>]*>\s*(?:<span[^>]*>)?\s*Agentic UX\s*</.test(html), false, `${page}: stale "Agentic UX" section title`);
    assert.equal(/AI Tools\s*&amp;\s*Infrastructure/.test(html), false, `${page}: stale "AI Tools & Infrastructure" label`);
  }
});
