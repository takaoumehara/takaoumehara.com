import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const moduleUrl = new URL('../scripts/history.mjs', import.meta.url);

test('project URL round-trips without dropping unrelated state', async () => {
  assert.ok(existsSync(moduleUrl), 'scripts/history.mjs should exist');
  const { projectUrl, projectSlug } = await import(moduleUrl);

  const next = projectUrl(
    'https://example.com/?lang=en#product-design',
    'cli-studios',
  );

  assert.equal(
    next,
    'https://example.com/?lang=en&project=cli-studios#product-design',
  );
  assert.equal(projectSlug(next), 'cli-studios');
  assert.equal(projectSlug('https://example.com/?lang=en'), null);
});

test('history state preserves project and scroll position', async () => {
  assert.ok(existsSync(moduleUrl), 'scripts/history.mjs should exist');
  const { historyState } = await import(moduleUrl);

  assert.deepEqual(historyState('superforge', 840), {
    portfolioProject: 'superforge',
    scrollY: 840,
  });
});

test('removing a project keeps other URL state intact', async () => {
  assert.ok(existsSync(moduleUrl), 'scripts/history.mjs should exist');
  const { clearProjectUrl } = await import(moduleUrl);

  assert.equal(
    clearProjectUrl('https://example.com/?lang=en&project=superforge#ai-tools'),
    'https://example.com/?lang=en#ai-tools',
  );
});
