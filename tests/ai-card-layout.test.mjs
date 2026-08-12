import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFileSync(join(root, name), 'utf8');
const cardCount = (html) => [...html.matchAll(/<article\b[^>]*\bclass\s*=\s*["'][^"']*\bwork-card\b[^"']*["']/gi)].length;

test('the three lead category pages use the shared thumbnail-led portfolio grid', () => {
  // Interactive Experience was split out of ai-products.html: designing an AI
  // product and staging a room-scale experience are sold to different buyers,
  // so they no longer share a page.
  const pages = {
    'ai-products.html': 5,
    'interactive.html': 8,
    'ai-tools.html': 6,
  };

  for (const [page, expectedCount] of Object.entries(pages)) {
    const html = read(page);
    assert.match(html, /assets\/work-card-grid\.css/, `${page} needs the shared grid stylesheet`);
    assert.match(html, /assets\/work-card-grid\.js/, `${page} needs the shared grid script`);
    assert.match(html, /class="work-grid"/, `${page} needs a work-grid`);
    assert.equal(cardCount(html), expectedCount, `${page} needs ${expectedCount} work cards`);
  }
});
