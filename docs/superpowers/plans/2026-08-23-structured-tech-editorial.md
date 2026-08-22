# Structured Tech Editorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, responsive portfolio index in `v4/` whose aligned project cards expand into an accessible detail dialog and whose browser Back action restores the exact card, scroll position, and focus.

**Architecture:** A static, progressively enhanced page carries real project links in HTML so it remains navigable without JavaScript. A small ES-module registry provides verified project metadata, while a browser controller intercepts card links, fills one native `<dialog>`, manages History state, and animates only `transform` and `opacity`. CSS custom properties mirror `docs/design.md`; Playwright exercises the complete card → dialog → Back flow.

**Tech Stack:** Semantic HTML5, CSS custom properties/Grid, browser History and Dialog APIs, vanilla ES modules, Node.js test runner, Playwright, axe-core.

## Global Constraints

- Work only inside `/Users/takao/Documents/00_Product_Develpment/creativityiseverywhere/v4/`; `v3/` is read-only source material.
- Use exactly these categories: Interactive Experience, AI Products, AI Tools, Product Design, Brand Experience.
- Include About and `https://linkedin.com/in/takaoumehara` in header and footer.
- Use Instrument Sans with `ui-sans-serif, system-ui, sans-serif` fallback; IBM Plex Mono is metadata-only.
- Do not introduce a JavaScript framework, 3D, autoplay media, or a continuous animation loop.
- Target WCAG 2.2 AA; body text is at least 16px, targets at least 44px, and reduced motion disables spatial animation at runtime.
- Never invent a project, client, role, date, or result. Copy only claims present in `v3/`.
- Initial HTML/CSS/JS remains below 150KB, excluding images; below-fold images use `loading="lazy"`.
- All production behavior follows test-first RED → GREEN → REFACTOR.

---

## File Map

- `index.html` — semantic content, five category sections, real fallback links, dialog shell, About, footer.
- `styles.css` — all layout, tokens, interaction states, dialog animation states, responsive behavior.
- `scripts/project-data.mjs` — immutable verified project registry and category order.
- `scripts/history.mjs` — pure URL/history-state helpers that can be tested without a browser.
- `scripts/app.mjs` — DOM enhancement, dialog rendering, History integration, focus/scroll restoration, mobile menu.
- `assets/thumbs/` — copied, review-sized v3 thumbnails used by selected cards.
- `tests/portfolio.test.mjs` — registry, source structure, asset paths, token and copy regression tests.
- `tests/history.test.mjs` — project URL/state helper unit tests.
- `tests/portfolio.spec.mjs` — Playwright interaction, keyboard, responsive, reduced-motion, and axe tests.
- `package.json` / `playwright.config.mjs` — reproducible test commands and browser configuration.
- `docs/design.md` / `docs/design.html` — mirrored machine/human design system artifacts.
- `docs/accessibility.md` — seven-pass WCAG audit evidence and criterion ledger.
- `docs/plan.md` — resumable execution checklist and progress log.

---

### Task 1: Verified Project Registry and Test Foundation

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `tests/portfolio.test.mjs`
- Create: `scripts/project-data.mjs`
- Create: `assets/thumbs/*`

**Interfaces:**
- Produces: `CATEGORY_ORDER: readonly string[]`, `PROJECTS: readonly Project[]`, `projectBySlug(slug): Project | null`.
- `Project` fields: `slug`, `title`, `category`, `year`, `role`, `summary`, `href`, `image`, `imageAlt`, `meta`.

- [ ] **Step 1: Add the failing registry test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { CATEGORY_ORDER, PROJECTS, projectBySlug } from '../scripts/project-data.mjs';

test('registry uses the five approved categories and verified assets', () => {
  assert.deepEqual(CATEGORY_ORDER, [
    'Interactive Experience', 'AI Products', 'AI Tools',
    'Product Design', 'Brand Experience'
  ]);
  assert.ok(PROJECTS.length >= 12);
  assert.equal(new Set(PROJECTS.map(({ slug }) => slug)).size, PROJECTS.length);
  assert.ok(PROJECTS.every(({ category }) => CATEGORY_ORDER.includes(category)));
  assert.ok(PROJECTS.filter(({ image }) => image).every(({ image }) => existsSync(new URL(`../${image}`, import.meta.url))));
  assert.equal(projectBySlug('superforge')?.title, 'superforge');
  assert.equal(projectBySlug('unknown'), null);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test`
Expected: FAIL because `scripts/project-data.mjs` does not exist.

- [ ] **Step 3: Add the minimal immutable registry and copy only referenced images**

The registry exports frozen arrays and a lookup; every local `href` points to `../v3/projects/<slug>.html`, and every external project uses its verified live URL from `v3/interactive.html`.

- [ ] **Step 4: Run GREEN**

Run: `npm test`
Expected: one registry test passes with zero failures.

- [ ] **Step 5: Commit**

```bash
git add package.json .gitignore tests/portfolio.test.mjs scripts/project-data.mjs assets/thumbs
git commit -m "feat: add verified v4 project registry"
```

---

### Task 2: Mirrored Design System and Static Portfolio Structure

**Files:**
- Modify: `tests/portfolio.test.mjs`
- Create: `docs/design.md`
- Create: `docs/design.html`
- Create: `index.html`
- Create: `styles.css`

**Interfaces:**
- Consumes: the category and project values defined in `scripts/project-data.mjs` as the canonical facts.
- Produces: `.project-card[data-project]`, `#project-dialog`, `#mobile-menu`, and CSS semantic tokens used by Task 3.

- [ ] **Step 1: Add failing source-contract tests**

```js
test('page exposes the approved navigation and progressive fallback', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const category of CATEGORY_ORDER) assert.match(html, new RegExp(`>${category}<`));
  assert.match(html, /href="https:\/\/linkedin\.com\/in\/takaoumehara"/);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /<dialog[^>]+id="project-dialog"/);
  assert.doesNotMatch(html, /Mirai Abe|miraiabe|Lorem ipsum/);
  for (const project of PROJECTS) {
    assert.match(html, new RegExp(`data-project="${project.slug}"`));
    assert.match(html, new RegExp(`href="${escapeRegExp(project.href)}"`));
  }
});

test('CSS includes semantic tokens and accessibility states', () => {
  const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  for (const token of ['--color-ground', '--color-ink', '--color-accent', '--space-8', '--motion-expand']) {
    assert.ok(css.includes(token));
  }
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media\s*\(max-width:\s*40rem\)/);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test`
Expected: source-contract tests fail because `index.html` and `styles.css` are absent.

- [ ] **Step 3: Write `docs/design.md` and its live `docs/design.html` mirror**

Use `#f2f0ea` ground, `#11110f` ink, `#4f514c` secondary ink, `#165dff` accent, and semantic alpha borders; Instrument Sans weights 400/600/700; 8px spacing scale; zero card radius; 3px focus ring; 420ms enter/300ms exit.

- [ ] **Step 4: Write static semantic page and strict rectangular grid**

Every card is an `<a>` with a real `href`, fixed image ratio, visible category and year, and `data-project`. Include skip link, header navigation, compact mobile menu shell, five `<section>` elements, About, two LinkedIn links, status live region, and a native dialog shell.

- [ ] **Step 5: Run GREEN and measure source weight**

Run: `npm test && wc -c index.html styles.css scripts/*.mjs | tail -1`
Expected: all Node tests pass; combined text sources are under 150000 bytes.

- [ ] **Step 6: Commit**

```bash
git add docs/design.md docs/design.html index.html styles.css tests/portfolio.test.mjs
git commit -m "feat: build structured v4 portfolio grid"
```

---

### Task 3: Seamless Dialog, URL History, and Focus Restoration

**Files:**
- Create: `tests/history.test.mjs`
- Create: `scripts/history.mjs`
- Create: `tests/portfolio.spec.mjs`
- Create: `playwright.config.mjs`
- Modify: `package.json`
- Create: `scripts/app.mjs`
- Modify: `index.html`
- Modify: `styles.css`

**Interfaces:**
- `projectUrl(url, slug): string` sets `?project=<slug>` without losing hash-independent page position.
- `projectSlug(url): string | null` reads the query parameter.
- `historyState(slug, scrollY): { portfolioProject: string, scrollY: number }` creates a serializable state.
- `openProject(slug, { pushHistory, animate }): void` fills and opens the dialog.
- `requestClose({ fromPopState }): void` closes through browser history when a project state exists.

- [ ] **Step 1: Write failing pure history tests**

```js
test('project URL round-trips without dropping unrelated parameters', () => {
  const next = projectUrl('https://example.com/?lang=en#product-design', 'cli-studios');
  assert.equal(next, 'https://example.com/?lang=en&project=cli-studios#product-design');
  assert.equal(projectSlug(next), 'cli-studios');
});

test('history state preserves project and scroll position', () => {
  assert.deepEqual(historyState('superforge', 840), {
    portfolioProject: 'superforge', scrollY: 840
  });
});
```

- [ ] **Step 2: Run RED, implement pure helpers, run GREEN**

Run: `node --test tests/history.test.mjs`
Expected first run: FAIL because module is absent. Expected second run: two passes.

- [ ] **Step 3: Write failing Playwright flow test**

```js
test('card opens spatial detail and Back restores focus', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('[data-project="superforge"]');
  await card.scrollIntoViewIfNeeded();
  await card.focus();
  await card.click();
  await expect(page.locator('#project-dialog')).toBeVisible();
  await expect(page).toHaveURL(/project=superforge/);
  await page.goBack();
  await expect(page.locator('#project-dialog')).not.toBeVisible();
  await expect(card).toBeFocused();
});
```

- [ ] **Step 4: Install browser test tooling and verify RED**

Run: `npm install && npx playwright install chromium && npm run test:e2e -- --grep "Back restores focus"`
Expected: FAIL because `scripts/app.mjs` is absent and the dialog never opens.

- [ ] **Step 5: Implement minimal dialog controller**

Intercept only same-page project cards, render registry fields with `textContent`, preserve the original trigger/scroll/rect, call `showModal()`, push History state, map `popstate` and dialog `cancel` to one close path, and return focus after closing. Animate a cloned fixed surface from the card rect to the viewport with Web Animations using only `transform` and `opacity`; skip the animation when reduced motion matches.

- [ ] **Step 6: Run GREEN**

Run: `npm run test:e2e -- --grep "Back restores focus"`
Expected: one Playwright test passes.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json playwright.config.mjs tests/history.test.mjs tests/portfolio.spec.mjs scripts/history.mjs scripts/app.mjs index.html styles.css
git commit -m "feat: add reversible project detail transitions"
```

---

### Task 4: Responsive, Keyboard, Reduced-Motion, and Automated A11y Coverage

**Files:**
- Modify: `tests/portfolio.spec.mjs`
- Modify: `scripts/app.mjs`
- Modify: `styles.css`
- Modify: `index.html`

**Interfaces:**
- Produces complete mouse/touch/keyboard flows at 320px and desktop, an `aria-expanded` mobile menu, and runtime reduced-motion behavior.

- [ ] **Step 1: Add failing browser acceptance tests**

```js
test('320px layout reflows without horizontal document overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('reduced motion opens without a running transition surface', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('[data-project="superforge"]').click();
  await expect(page.locator('[data-transition-surface]')).toHaveCount(0);
});

test('automated axe pass has no serious or critical violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(({ impact }) => ['serious', 'critical'].includes(impact))).toEqual([]);
});
```

- [ ] **Step 2: Run RED**

Run: `npm run test:e2e`
Expected: at least one new responsive, reduced-motion, menu, or axe assertion fails.

- [ ] **Step 3: Implement minimum fixes by cause**

Use logical properties, `minmax(0, 1fr)`, `overflow-wrap:anywhere`, stacked mobile metadata, 44px menu rows, native buttons, explicit `aria-expanded`, visible focus, background inertness through modal dialog, and no JS animation object under reduced motion.

- [ ] **Step 4: Run GREEN**

Run: `npm test && npm run test:e2e`
Expected: all Node and Playwright tests pass with zero warnings.

- [ ] **Step 5: Commit**

```bash
git add tests/portfolio.spec.mjs scripts/app.mjs styles.css index.html
git commit -m "test: lock responsive and accessible portfolio flows"
```

---

### Task 5: Seven-Pass Accessibility Evidence and Final Verification

**Files:**
- Create: `docs/accessibility.md`
- Modify: `docs/design.md`
- Modify: `docs/design.html`
- Modify: `docs/plan.md`
- Create or modify: `docs/superforge-log.md`

**Interfaces:**
- Produces the criterion-by-criterion WCAG 2.2 A/AA ledger, measured contrast output, and a resumable completion record.

- [ ] **Step 1: Run the seven passes in order**

Automated: `npm test && npm run test:e2e`.
Keyboard: Playwright keyboard-only traversal plus manual source/runtime reasoning.
Screen reader: inspect accessibility tree; record VoiceOver device testing as not assessed if unavailable.
Zoom/reflow: Playwright at 320px, 200% text, and 400% zoom-equivalent viewport.
Colour: run `superforge-a11y/scripts/contrast.py` for every intended pair.
Motion/time: run reduced-motion tests and confirm no timeouts/autoplay.
Forms/errors: mark form criteria not present; exercise invalid project slug and broken-image fallback.

- [ ] **Step 2: Fix each real failure with a regression test first**

For every defect, add a failing Node or Playwright assertion, reproduce RED, change the causal component/token, and re-run to GREEN. If a colour token changes, regenerate both design artifacts in the same edit.

- [ ] **Step 3: Write the honest accessibility report**

Record evidence for every pass and all 55 WCAG 2.2 A/AA criteria. Use `not assessed` for device-only VoiceOver evidence not executed; do not claim whole-page conformance from axe.

- [ ] **Step 4: Run final proof commands**

```bash
npm test
npm run test:e2e
npm run check:links
wc -c index.html styles.css scripts/*.mjs
git diff --check
git status --short
```

Expected: test commands exit 0, all referenced local paths resolve, text payload is below 150KB, no whitespace errors, and only intended files are changed.

- [ ] **Step 5: Update execution log and commit**

```bash
git add docs/accessibility.md docs/design.md docs/design.html docs/plan.md docs/superforge-log.md
git commit -m "docs: record v4 design and accessibility evidence"
```
