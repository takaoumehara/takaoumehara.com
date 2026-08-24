import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { CATEGORY_ORDER, PROJECTS, projectBySlug } from '../scripts/project-data.mjs';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

test('page exposes approved navigation and progressive fallback links', () => {
  const indexUrl = new URL('../index.html', import.meta.url);
  assert.ok(existsSync(indexUrl), 'index.html should exist');
  const html = readFileSync(indexUrl, 'utf8');

  for (const category of CATEGORY_ORDER) {
    assert.match(html, new RegExp(`>${escapeRegExp(category)}<`));
  }

  assert.match(html, /href="https:\/\/linkedin\.com\/in\/takaoumehara"/);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /<dialog[^>]+id="project-dialog"/);
  assert.doesNotMatch(html, /Mirai Abe|miraiabe|Lorem ipsum/);

  for (const entry of PROJECTS) {
    assert.match(html, new RegExp(`data-project="${escapeRegExp(entry.slug)}"`));
    assert.match(html, new RegExp(`href="${escapeRegExp(entry.href)}"`));
    if (!/^https?:/.test(entry.href)) {
      assert.ok(existsSync(new URL(entry.href, indexUrl)), `${entry.href} should resolve on disk`);
    }
  }
});

test('CSS includes semantic tokens and accessibility states', () => {
  const stylesUrl = new URL('../styles.css', import.meta.url);
  assert.ok(existsSync(stylesUrl), 'styles.css should exist');
  const css = readFileSync(stylesUrl, 'utf8');

  for (const token of [
    '--color-ground',
    '--color-ink',
    '--color-accent',
    '--space-8',
    '--motion-expand',
    '--ease-spatial',
  ]) {
    assert.ok(css.includes(token), `${token} should be declared`);
  }

  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media\s*\(max-width:\s*40rem\)/);
  assert.match(css, /\[data-transition-preview\]/);
});

test('machine and human design-system artifacts are both present', () => {
  const markdownUrl = new URL('../docs/design.md', import.meta.url);
  const htmlUrl = new URL('../docs/design.html', import.meta.url);
  assert.ok(existsSync(markdownUrl));
  assert.ok(existsSync(htmlUrl));
  for (const artifact of [readFileSync(markdownUrl, 'utf8'), readFileSync(htmlUrl, 'utf8')]) {
    assert.match(artifact, /460ms/);
    assert.match(artifact, /340ms/);
    assert.match(artifact, /easeSpatial/);
  }
});
