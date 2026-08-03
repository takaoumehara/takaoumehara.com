import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDocument, createWindow, runScript } from './helpers/dom.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'projects/amazon-firetv/js/data.js'), 'utf8');

const load = () => {
  const win = createWindow(buildDocument([]));
  runScript(source, { window: win, document: win.document });
  return win.AMZ_DATA;
};

const data = load();
const { CATALOG, CDN, BRAND_COLORS, SUGGESTIONS, RUFUS_SUMMARY, ACCOUNT, SEED_ORDERS } = data;

test('the catalog is exposed with a stable shape', () => {
  assert.ok(Array.isArray(CATALOG) && CATALOG.length > 0);
  assert.deepEqual(
    Object.keys(data).sort(),
    ['ACCOUNT', 'BRAND_COLORS', 'CATALOG', 'CDN', 'RUFUS_SUMMARY', 'SEED_ORDERS', 'SUGGESTIONS'],
  );
});

test('product ids are unique', () => {
  const ids = CATALOG.map((product) => product.id);
  assert.deepEqual([...new Set(ids)].length, ids.length);
});

test('every product carries the fields the UI renders', () => {
  for (const product of CATALOG) {
    const label = `product ${product.id}`;
    for (const field of ['id', 'asin', 'brand', 'title', 'short', 'img', 'unit', 'protein', 'type']) {
      assert.equal(typeof product[field], 'string', `${label}.${field} should be a string`);
      assert.notEqual(product[field], '', `${label}.${field} should not be empty`);
    }
    assert.ok(product.price > 0, `${label}.price should be positive`);
    assert.ok(product.rating > 0 && product.rating <= 5, `${label}.rating should be within 0-5`);
    assert.ok(Number.isInteger(product.ratings) && product.ratings > 0, `${label}.ratings`);
    assert.ok(Number.isInteger(product.servings) && product.servings > 0, `${label}.servings`);
    assert.equal(typeof product.prime, 'boolean', `${label}.prime`);
    for (const field of ['gallery', 'flavors', 'sizes', 'tags', 'bullets', 'reviews', 'rufus']) {
      assert.ok(Array.isArray(product[field]) && product[field].length > 0, `${label}.${field}`);
    }
  }
});

test('list prices, when present, are above the sale price', () => {
  for (const product of CATALOG) {
    if (product.listPrice === null || product.listPrice === undefined) continue;
    assert.ok(product.listPrice > product.price, `${product.id} list price should beat the sale price`);
  }
});

test('the first gallery image is the card thumbnail', () => {
  for (const product of CATALOG) {
    assert.equal(product.gallery[0], product.img, `${product.id} gallery should lead with the thumbnail`);
  }
});

test('size options include the base price and are labelled', () => {
  for (const product of CATALOG) {
    for (const size of product.sizes) {
      assert.equal(typeof size.label, 'string');
      assert.ok(size.price > 0);
    }
    assert.ok(
      product.sizes.some((size) => size.price === product.price),
      `${product.id} should offer a size at its headline price`,
    );
  }
});

test('reviews and Rufus answers are complete', () => {
  for (const product of CATALOG) {
    for (const review of product.reviews) {
      assert.ok(review.stars >= 1 && review.stars <= 5, `${product.id} review stars`);
      for (const field of ['title', 'author', 'date', 'text']) {
        assert.notEqual(review[field], undefined, `${product.id} review.${field}`);
      }
    }
    for (const entry of product.rufus) {
      assert.ok(entry.q.length > 0 && entry.a.length > 0, `${product.id} rufus entry`);
    }
  }
});

test('every product brand has a two-colour palette', () => {
  for (const product of CATALOG) {
    const palette = BRAND_COLORS[product.brand];
    assert.ok(palette, `missing palette for ${product.brand}`);
    assert.equal(palette.length, 2);
    palette.forEach((color) => assert.match(color, /^#[0-9a-f]{3,6}$/i));
  }
});

test('CDN builds a sized Amazon image URL and defaults to 600', () => {
  assert.equal(CDN('71Lw7FkgniL'), 'https://m.media-amazon.com/images/I/71Lw7FkgniL._AC_SL600_.jpg');
  assert.equal(CDN('71Lw7FkgniL', 1200), 'https://m.media-amazon.com/images/I/71Lw7FkgniL._AC_SL1200_.jpg');
  assert.equal(CDN('x', 0), 'https://m.media-amazon.com/images/I/x._AC_SL600_.jpg');
});

test('search suggestions are unique lowercase phrases', () => {
  assert.deepEqual([...new Set(SUGGESTIONS)].length, SUGGESTIONS.length);
  SUGGESTIONS.forEach((suggestion) => assert.equal(suggestion, suggestion.toLowerCase()));
});

test('every Rufus chip has a scripted answer', () => {
  assert.ok(RUFUS_SUMMARY.results.length > 0);
  assert.deepEqual(Object.keys(RUFUS_SUMMARY.answers).sort(), [...RUFUS_SUMMARY.chips].sort());
});

test('the seeded account and orders reference real products', () => {
  assert.match(ACCOUNT.zip, /^\d{5}$/);
  assert.equal(typeof ACCOUNT.prime, 'boolean');

  const ids = new Set(CATALOG.map((product) => product.id));
  for (const order of SEED_ORDERS) {
    assert.match(order.id, /^\d{3}-\d{7}-\d{7}$/);
    assert.ok(order.items.length > 0);
    for (const item of order.items) {
      assert.ok(ids.has(item.productId), `unknown product in order ${order.id}: ${item.productId}`);
      assert.ok(item.qty > 0 && item.price > 0);
    }
  }
});
