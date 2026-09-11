import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  PROJECTS,
  CAPABILITY_TAXONOMY,
  CAREER_CHAPTERS,
  THESES,
  getProjectById,
} from '../scripts/evidence-db.mjs';
import { LENSES, defaultLens, getLensBySlug } from '../scripts/lenses.mjs';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('Career Evidence Library contains verified facts and strict boundaries', () => {
  assert.ok(PROJECTS.length >= 10, 'Should have at least 10 core projects/ventures');

  // Verify unique IDs and slugs
  const ids = new Set(PROJECTS.map((p) => p.id));
  assert.equal(ids.size, PROJECTS.length, 'All project IDs must be unique');

  // Verify KOJI FIZZ facts (Producer/Partner only, NO directing/cinematography claims)
  const koji = getProjectById('koji-fizz');
  assert.ok(koji, 'KOJI FIZZ must exist');
  assert.equal(koji.role, 'Producer & Creative Partner · Brand Direction');
  assert.ok(
    koji.myContribution.some((c) => c.includes('producer') || c.includes('concept') || c.includes('director')),
    'My contribution must mention producing/concept/director selection'
  );
  assert.ok(
    koji.teamContribution.some((c) => c.includes('cinematographer') || c.includes('camera')),
    'Team contribution must explicitly include cinematography/camera'
  );

  // Verify Festival Reinvention facts (Volunteer, 3x revenue growth, operations)
  const festival = getProjectById('festival-reinvention');
  assert.ok(festival, 'Festival Reinvention must exist');
  assert.equal(festival.engagementType, 'volunteer');
  assert.ok(
    festival.metrics.some((m) => m.value.includes('3x')),
    'Must include 3x revenue metric'
  );
  assert.ok(
    festival.myContribution.some((c) => c.includes('11+')),
    'Must specify 11+ original games designed'
  );

  // Verify Verizon AI Workflow facts (42 designers, Master Brain)
  const verizon = getProjectById('verizon-ai-workflow');
  assert.ok(verizon, 'Verizon AI Workflow must exist');
  assert.ok(
    verizon.myContribution.some((c) => c.includes('Master Brain')),
    'Must include Master Brain architecture'
  );
  assert.ok(
    verizon.metrics.some((m) => m.value === '42'),
    'Must cite 42 designers'
  );

  // Verify Interactive / Playable (Resona, Rakugaki Jam, Kao Game)
  const resona = getProjectById('resona');
  assert.ok(resona, 'Resona must exist');
  assert.equal(resona.type, 'experiment');
  assert.equal(resona.featuredOrder, 1, 'Resona must be first on Canonical showcase');
});

test('Role Lenses reference only valid projects with zero data fabrication', () => {
  assert.ok(LENSES.length >= 5, 'Must have at least 5 configured lenses');

  for (const lens of LENSES) {
    assert.ok(lens.id, 'Lens must have an ID');
    assert.ok(lens.meta.title, 'Lens must have a page title');
    assert.ok(lens.hero.title, 'Lens must have hero title');
    assert.ok(lens.featuredProjects.length >= 3, 'Lens must feature at least 3 projects');

    // Verify all referenced projects exist in Evidence DB
    for (const ref of lens.featuredProjects) {
      const project = getProjectById(ref.projectId);
      assert.ok(project, `Referenced project "${ref.projectId}" in lens "${lens.id}" must exist in Evidence DB`);
    }
  }

  // Check Creative Executive Lens priority
  const creative = getLensBySlug('creative');
  assert.ok(creative);
  assert.equal(creative.featuredProjects[0].projectId, 'resona');
  assert.equal(creative.featuredProjects[1].projectId, 'koji-fizz');

  // Check AI Product Lens priority
  const aiProduct = getLensBySlug('ai-product');
  assert.ok(aiProduct);
  assert.equal(aiProduct.featuredProjects[0].projectId, 'verizon-ai-workflow');
});

test('Canonical index.html renders valid semantic structure and accessible elements', () => {
  const indexUrl = new URL('../index.html', import.meta.url);
  assert.ok(existsSync(indexUrl), 'index.html should exist');
  const html = readFileSync(indexUrl, 'utf8');

  // Core Personal Positioning
  assert.match(html, /I like the beginning of things\./);
  assert.match(html, /Design &amp; AI Executive/);

  // Key Sections
  assert.match(html, /id="featured-showcase"/);
  assert.match(html, /id="selected-proof"/);
  assert.match(html, /id="explorations"/);
  assert.match(html, /id="career-arc"/);
  assert.match(html, /id="advisory"/);
  assert.match(html, /id="contact"/);

  // Fact boundary container in dialog
  assert.match(html, /data-dialog-facts/);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /<dialog[^>]+id="project-dialog"/);
  assert.match(html, /href="https:\/\/linkedin\.com\/in\/takaoumehara"/);

  // All projects are represented in evidence grid
  for (const project of PROJECTS) {
    assert.match(html, new RegExp(`data-project="${escapeRegExp(project.slug)}"`));
  }
});

test('Discrete static Role Lens pages are generated and linked correctly', () => {
  const lensSlugs = ['creative', 'ai-product', 'venture', 'advisor'];

  for (const slug of lensSlugs) {
    const lensUrl = new URL(`../lens/${slug}/index.html`, import.meta.url);
    assert.ok(existsSync(lensUrl), `Lens page for "${slug}" should exist`);
    const html = readFileSync(lensUrl, 'utf8');

    const lens = getLensBySlug(slug);
    assert.match(html, new RegExp(escapeRegExp(lens.hero.title)));
    assert.match(html, new RegExp(`data-lens="${escapeRegExp(lens.id)}"`));
  }
});

test('CSS includes semantic tokens, accessibility states, and adaptive lens additions', () => {
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

  // Accessibility & media states
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);

  // Adaptive Lens & Fact Boundary classes
  assert.match(css, /\.hero__lens-selector/);
  assert.match(css, /\.lens-pill/);
  assert.match(css, /\.modal-fact-section/);
  assert.match(css, /\.fact-heading--personal/);
  assert.match(css, /\.fact-heading--team/);
  assert.match(css, /\.career-arc-timeline/);
  assert.match(css, /\.advisory-grid/);
});
