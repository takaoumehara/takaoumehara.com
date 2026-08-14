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
  // Two ways to satisfy this, and a page needs exactly one of them:
  //   1. the grid system — a shared-element morph via the view-transition sheet
  //   2. the colour-continuity system — the landing page paints the project's
  //      gradient before the click, and the project page opens on that same
  //      gradient, inlined so it is present in the first frame
  for (const page of PROJECT_PAGES) {
    const html = read(page);
    const morph = /\.\.\/assets\/view-transitions\.css/.test(html);
    const field = /--tint:\s*#[0-9a-f]{3,8}/i.test(html) && /linear-gradient\(152deg,\s*var\(--tint\)/.test(html);
    assert.ok(morph || field, `${page} has neither a shared-element morph nor an arrival field`);
  }
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
    if (!/--tint:/.test(page)) continue; // still on the old grid system
    const pageTint = page.match(/--tint:\s*(#[0-9a-f]{3,8})/i)?.[1];
    const pageTint2 = page.match(/--tint-2:\s*(#[0-9a-f]{3,8})/i)?.[1];
    assert.equal(pageTint?.toLowerCase(), tint.toLowerCase(), `${href}: opens in a different colour than it is hovered in`);
    assert.equal(pageTint2?.toLowerCase(), tint2?.toLowerCase(), `${href}: second gradient stop does not match`);
    checked += 1;
  }
  assert.ok(checked > 0, 'expected at least one project page on the colour-continuity system');
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
