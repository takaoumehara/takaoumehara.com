import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { CATEGORY_ORDER, PROJECTS, projectBySlug } from '../scripts/project-data.mjs';

test('registry uses the five approved categories and verified assets', () => {
  assert.deepEqual(CATEGORY_ORDER, [
    'Interactive Experience',
    'AI Products',
    'AI Tools',
    'Product Design',
    'Brand Experience',
  ]);

  assert.ok(PROJECTS.length >= 12);
  assert.equal(new Set(PROJECTS.map(({ slug }) => slug)).size, PROJECTS.length);
  assert.ok(PROJECTS.every(({ category }) => CATEGORY_ORDER.includes(category)));
  assert.ok(
    PROJECTS
      .filter(({ image }) => image)
      .every(({ image }) => existsSync(new URL(`../${image}`, import.meta.url))),
  );
  assert.equal(projectBySlug('superforge')?.title, 'superforge');
  assert.equal(projectBySlug('unknown'), null);
});
