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

// ── Nav consistency across the four-theme reorg ──

// Six equal nav items read as a generalist. The three the work is sold as now
// lead at full ink; the two decades underneath sit behind a hairline rule.
test('all main-page navs carry the two-tier order, with the lead three marked', () => {
  const expected = [
    ['interactive.html', 'Interactive'], ['ai-products.html', 'AI Products'], ['ai-tools.html', 'AI Tools'],
    ['work.html', 'Product Design'], ['brand.html', 'Brand &amp; Visual'],
    ['about.html', 'About'], ['contact.html', 'Contact'],
  ];
  const lead = new Set(['interactive.html', 'ai-products.html', 'ai-tools.html']);

  for (const page of mainPages) {
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

// ── Homepage: a curated few, then the full set by category ──

// The visitor decides in three seconds whether this person is at their level,
// and that decision is made on the strongest few. Stacking every section on
// the landing page buried them, so the homepage now leads with seven and
// hands the rest to the category pages.
test('homepage leads with Selected Work, then the category index', () => {
  const html = read('index.html');
  const selected = html.indexOf('id="selected-work"');
  const categories = html.indexOf('id="categories"');
  assert.ok(selected >= 0, 'homepage needs id="selected-work"');
  assert.ok(categories > selected, 'the category index must follow Selected Work');
  for (const removed of ['id="agentic-ux"', 'id="playable"', 'id="ai-tools"']) {
    assert.equal(html.includes(removed), false, `${removed} belongs on its category page, not the homepage`);
  }
});

test('homepage Selected Work is seven cards spanning all five categories', () => {
  const html = read('index.html');
  const section = html.match(/<section\b[^>]*\bid\s*=\s*["']selected-work["'][^>]*>([\s\S]*?)<\/section>/i)?.[0] ?? '';
  assert.ok(section, 'homepage needs a Selected Work section');
  assert.equal([...section.matchAll(openWithClass('article', 'work-card'))].length, 7, 'Selected Work is seven, not twenty-four');

  // One drawn from each category, so the range is visible without scrolling.
  for (const href of [
    'projects/verizon-ai-agents.html', 'projects/amazon-firetv.html', 'ai-tools.html',
    'projects/marubatsu.html', 'projects/cli-studios.html', 'projects/coca-cola.html',
    'projects/ela-quests.html',
  ]) {
    assert.match(section, new RegExp(`data-href\\s*=\\s*["']${escape(href)}["']`), `Selected Work must include ${href}`);
  }
  assertNoUnsupportedClaims(section, 'homepage Selected Work');
});

test('homepage category index carries five categories in two tiers with live counts', () => {
  const html = read('index.html');
  const section = html.match(/<section\b[^>]*\bid\s*=\s*["']categories["'][^>]*>([\s\S]*?)<\/section>/i)?.[0] ?? '';
  assert.ok(section, 'homepage needs a category index');

  const cards = [...section.matchAll(/<a\b[^>]*\bclass\s*=\s*["']cat-card["'][^>]*>/gi)].map((m) => m[0]);
  assert.equal(cards.length, 5, 'five categories — Innovation Workshop stays out until it has a case study');
  assert.deepEqual(cards.map((tag) => attr(tag, 'href')),
    ['interactive.html', 'ai-products.html', 'ai-tools.html', 'work.html', 'brand.html'],
    'lead three first, then the two foundations');

  // The base tier is a separate grid so it reads as support, not as a peer.
  assert.match(section, /<div\b[^>]*\bclass\s*=\s*["']cat-tier cat-tier--base["']/i, 'the two foundations need their own tier');

  // Counts must match what each category page actually holds.
  const counts = { 'interactive.html': 8, 'ai-products.html': 5, 'ai-tools.html': 7, 'work.html': 13, 'brand.html': 11 };
  for (const [page, count] of Object.entries(counts)) {
    assert.match(section, new RegExp(`href\\s*=\\s*["']${escape(page)}["'][\\s\\S]*?${count} projects`), `${page} must be listed as ${count} projects`);
  }

  assert.equal(section.includes('Innovation Workshop'), false, 'a category with no case study must not be advertised');
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
  assert.deepEqual(inputs, ['Pointer', 'Face', 'Handwriting', 'Typing', 'Voice', 'Two phones', 'Two phones', 'Every phone'], 'every card leads with its input');

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
test('Brand & Visual page lists twelve projects and keeps Konosaki on its live URL', () => {
  assert.ok(existsSync(join(v3, 'brand.html')), 'v3/brand.html must exist');
  const html = read('brand.html');
  assert.match(html, /<title>\s*Brand &amp; Visual — Takao Umehara\s*<\/title>/);
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
