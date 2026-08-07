import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFileSync(join(root, name), 'utf8');
const cardCount = (html) => [...html.matchAll(/<article\b[^>]*\bclass\s*=\s*["'][^"']*\bwork-card\b[^"']*["']/gi)].length;

test('AI Products, AI Tools and Interactive Experience use the shared thumbnail-led portfolio grid', () => {
  const products = read('ai-products.html');
  const tools = read('ai-tools.html');
  const interactive = read('interactive.html');

  for (const html of [products, tools, interactive]) {
    assert.match(html, /assets\/work-card-grid\.css/);
    assert.match(html, /assets\/work-card-grid\.js/);
    assert.match(html, /class="work-grid"/);
  }
  // Marubatsu moved to the Interactive Experience page's Game group, leaving five here.
  assert.equal(cardCount(products), 5);
  assert.equal(cardCount(tools), 7);
  assert.equal(cardCount(interactive), 7);
});
