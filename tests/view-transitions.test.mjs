import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFileSync(join(root, name), 'utf8');

const GRID_PAGES = ['index.html', 'work.html', 'brand.html', 'ai-products.html', 'ai-tools.html'];
const PROJECT_PAGES = readdirSync(join(root, 'projects'))
  .filter((name) => name.endsWith('.html'))
  .map((name) => `projects/${name}`);

const cardOpenTags = (html) =>
  [...html.matchAll(/<(a|article)\b[^>]*\bclass\s*=\s*["'][^"']*\bwork-card\b[^"']*["'][^>]*>/gi)];

test('every work card that links somewhere is a real anchor', () => {
  for (const page of GRID_PAGES) {
    const html = read(page);
    for (const [tag] of cardOpenTags(html)) {
      // A card either navigates (and must be an <a href>) or it does not link
      // at all. data-href on a non-anchor is what this change removed: it broke
      // middle-click, open-in-new-tab, and crawling.
      assert.doesNotMatch(tag, /\bdata-href\s*=/i, `${page}: card still carries data-href — ${tag.slice(0, 90)}`);
      if (/^<article/i.test(tag)) {
        assert.doesNotMatch(tag, /\bhref\s*=/i, `${page}: a linking card must be <a>, not <article>`);
      } else {
        assert.match(tag, /\bhref\s*=\s*["'][^"']+["']/i, `${page}: anchor card needs an href`);
      }
    }
  }
});

test('cards opening a new tab carry rel=noopener', () => {
  for (const page of GRID_PAGES) {
    const html = read(page);
    for (const [tag] of cardOpenTags(html)) {
      if (!/\btarget\s*=\s*["']_blank["']/i.test(tag)) continue;
      assert.match(tag, /\brel\s*=\s*["'][^"']*\bnoopener\b/i, `${page}: _blank card needs rel="noopener"`);
    }
  }
});

test('no page navigates work cards from script any more', () => {
  for (const page of GRID_PAGES) {
    const html = read(page);
    assert.doesNotMatch(html, /card\.dataset\.href/, `${page}: still navigates cards in JS`);
  }
  assert.doesNotMatch(read('assets/work-card-grid.js'), /location\.(assign|href)\s*=/, 'grid script must not navigate');
});

test('grid pages opt into view transitions and name the outgoing card', () => {
  for (const page of GRID_PAGES) {
    const html = read(page);
    assert.match(html, /assets\/view-transitions\.css/, `${page} needs the view-transition stylesheet`);
    assert.match(html, /assets\/work-card-grid\.js/, `${page} needs the script that names the shared element`);
  }
});

test('every project page arrives without a hard cut', () => {
  // Every project page must be reachable without a white flash. Since the
  // shared handoff layer paints the arriving colour (or the arriving frame)
  // before the page draws, loading it is the whole requirement — the old
  // per-page gradient contract is gone.
  for (const page of PROJECT_PAGES) {
    assert.match(read(page), /assets\/handoff\.js/, `${page} does not load the arrival layer`);
  }
});

test('the field is the viewport on both sides of a navigation', () => {
  // This is the bug the system exists to prevent: the index resolved its
  // gradient against the viewport and the project page resolved the identical
  // CSS against an 880px-tall hero, so the same string drew a different
  // picture and the colour jumped at the click. One selector, one box.
  const js = read('assets/handoff.js');
  assert.match(js, /html::before\s*\{[^}]*position:fixed;inset:0/, 'the ground layer must be the viewport');
  assert.match(js, /html::after\s*\{[^}]*position:fixed;inset:0/, 'the veil must be the viewport');
  assert.match(js, /--tu-field:/, 'both layers must share one gradient definition');

  // A page that hosts the field must not paint a competing one of its own in
  // some other box.
  const rakugaki = read('projects/rakugaki-jam.html');
  assert.match(rakugaki, /<html[^>]*\bdata-tu-adopt\b/, 'a page sitting on the field declares it');
  assert.doesNotMatch(rakugaki, /\.hero::before/, 'the hero must not paint its own gradient');
  assert.match(rakugaki, /body\{[^}]*background:transparent/, 'an opaque body would cover the field');
});

test('the colour a project is hovered in is the colour it opens in', () => {
  const landing = read('landing-b-index.html');
  let checked = 0;
  for (const m of landing.matchAll(
    /<a\b[^>]*\bclass\s*=\s*["'][^"']*\bidx-item\b[^"']*["'][^>]*>/gi
  )) {
    const tag = m[0];
    const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/)?.[1];
    const tint = tag.match(/\bdata-tint\s*=\s*["']([^"']+)["']/)?.[1];
    const tint2 = tag.match(/\bdata-tint2\s*=\s*["']([^"']+)["']/)?.[1];
    if (!href || !href.startsWith('projects/') || !tint) continue;
    let page;
    try { page = read(href); } catch { continue; }
    // Only pages that host the field declare their own fallback tint; the rest
    // are veiled in the hovered colour and need no declaration.
    if (!/--tu-tint:/.test(page)) continue;
    const pageTint = page.match(/--tu-tint:\s*(#[0-9a-f]{3,8})/i)?.[1];
    const pageTint2 = page.match(/--tu-tint-2:\s*(#[0-9a-f]{3,8})/i)?.[1];
    assert.equal(pageTint?.toLowerCase(), tint.toLowerCase(), `${href}: opens in a different colour than it is hovered in`);
    assert.equal(pageTint2?.toLowerCase(), tint2?.toLowerCase(), `${href}: second gradient stop does not match`);
    checked += 1;
  }
  assert.ok(checked > 0, 'expected at least one project page hosting the field');
});

test('no row borrows another project\'s picture', () => {
  // Rakugaki Jam used to show Marubatsu's tic-tac-toe board, copied along with
  // Marubatsu's tint. A row now either points at an image that belongs to it,
  // or draws its own mechanic, or shows neither.
  const landing = read('landing-b-index.html');
  const rows = [...landing.matchAll(/<a\b[^>]*\bclass\s*=\s*["'][^"']*\bidx-item\b[^"']*["'][^>]*>/gi)].map((m) => m[0]);
  const arts = new Map();
  for (const tag of rows) {
    const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/)?.[1];
    const art = tag.match(/\bdata-art\s*=\s*["']([^"']+)["']/)?.[1];
    if (!art) continue;
    assert.ok(!arts.has(art) || arts.get(art) === href, `${href} shows the same photograph as ${arts.get(art)}`);
    arts.set(art, href);
  }
  // The built pieces have no photograph and must not be given one.
  const interactive = landing.slice(landing.indexOf('id="idx2"'));
  assert.doesNotMatch(interactive, /data-art=/, 'interactive rows draw themselves; they do not borrow photographs');
  assert.match(interactive, /data-motif="strokes"/, 'Rakugaki Jam draws its own mechanic');
});

test('all three landing variants transition through the same system', () => {
  for (const page of ['landing-a-editorial.html', 'landing-b-index.html', 'landing-c-reel.html']) {
    const html = read(page);
    assert.match(html, /<script src="assets\/handoff\.js"><\/script>/, `${page} must load the handoff layer`);
    assert.match(html, /\bdata-tu\b/, `${page} must opt its project links in`);
    assert.match(html, /html\.tu-leaving/, `${page} must say what leaves when a link is clicked`);
  }
  // A and C carry the project's own frame across; B carries its colour.
  assert.match(read('landing-a-editorial.html'), /data-tu-mode="image"/);
  assert.match(read('landing-c-reel.html'), /data-tu-mode="image"/);
});

test('no page shows both languages at once', () => {
  // Component rules that style a bare descendant span outrank .t-jp{display:none}
  // on specificity, which silently renders EN and JP together.
  for (const page of ['landing-a-editorial.html', 'landing-b-index.html', 'landing-c-reel.html', 'projects/rakugaki-jam.html']) {
    const html = read(page);
    assert.match(html, /html:not\(\.lang-jp\)\s+\.t-jp\s*\{\s*display:\s*none\s*!important/, `${page} needs the language visibility guard`);
    assert.match(html, /html\.lang-jp\s+\.t-en\s*\{\s*display:\s*none\s*!important/, `${page} needs the language visibility guard`);
  }
});

test('the shared element is named on both halves and honours reduced motion', () => {
  const css = read('assets/view-transitions.css');
  assert.match(css, /@view-transition\s*\{[^}]*navigation:\s*auto/, 'cross-document transitions must be opted into');
  assert.match(css, /\.project-hero-img\s*\{[^}]*view-transition-name:\s*project-hero/, 'the hero is the receiving half');
  assert.match(
    css,
    /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*@view-transition\s*\{\s*navigation:\s*none/,
    'reduced motion must turn the navigation transition off'
  );
  assert.match(read('assets/work-card-grid.js'), /viewTransitionName\s*=\s*NAME/, 'the outgoing card image is the sending half');
});

test('the card image and the project hero use the same asset often enough to morph', () => {
  const heroOf = new Map();
  for (const page of PROJECT_PAGES) {
    const match = read(page).match(/class="project-hero-img"[^>]*background-image:\s*url\(([^)]+)\)/);
    if (match) heroOf.set(page.replace('projects/', ''), match[1].trim().replace(/^['"]|['"]$/g, '').replace('../', ''));
  }

  let shared = 0;
  let linked = 0;
  for (const page of GRID_PAGES) {
    const html = read(page);
    for (const match of html.matchAll(
      /<a\b[^>]*\bclass\s*=\s*["'][^"']*\bwork-card\b[^"']*["'][^>]*\bhref\s*=\s*["'](projects\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
    )) {
      const hero = heroOf.get(match[1].replace('projects/', ''));
      if (!hero) continue;
      linked += 1;
      const card = match[2].match(/card-img-bg"[^>]*background-image:\s*url\(['"]?([^'")]+)/);
      if (card && card[1].trim() === hero) shared += 1;
    }
  }

  assert.ok(linked > 0, 'expected linked cards pointing at project pages with an image hero');
  // Pairs that do not share an asset still transition — they cross-fade instead
  // of morphing. This guards the ratio so a thumbnail swap does not quietly
  // turn the morph into a dissolve across the whole grid.
  assert.ok(
    shared / linked >= 0.8,
    `only ${shared}/${linked} cards share their hero image; the morph degrades to a cross-fade below 80%`
  );
});
