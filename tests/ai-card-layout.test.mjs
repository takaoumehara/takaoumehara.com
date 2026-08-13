import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFileSync(join(root, name), 'utf8');
// Linked cards are <a href>; cards with nowhere to go stay <article>.
const cardCount = (html) => [...html.matchAll(/<(?:a|article)\b[^>]*\bclass\s*=\s*["'][^"']*\bwork-card\b[^"']*["']/gi)].length;

test('Agentic UX and AI Tools use the shared thumbnail-led portfolio grid', () => {
  const products = read('ai-products.html');
  const tools = read('ai-tools.html');

  assert.match(products, /assets\/work-card-grid\.css/);
  assert.match(tools, /assets\/work-card-grid\.css/);
  assert.match(products, /assets\/work-card-grid\.js/);
  assert.match(tools, /assets\/work-card-grid\.js/);
  assert.match(products, /class="work-grid"/);
  assert.match(tools, /class="work-grid"/);
  assert.equal(cardCount(products), 12);
  assert.equal(cardCount(tools), 6);
});
