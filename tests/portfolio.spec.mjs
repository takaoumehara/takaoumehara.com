import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function expectNoAxeViolations(page) {
  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test('card opens spatial detail and Back restores focus', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('[data-project="superforge"]');

  await card.scrollIntoViewIfNeeded();
  await card.focus();
  await card.click();

  await expect(page.locator('#project-dialog')).toBeVisible();
  await expect(page.locator('[data-dialog-title]')).toHaveText('superforge');
  await expect(page).toHaveURL(/project=superforge/);

  await page.goBack();

  await expect(page.locator('#project-dialog')).not.toBeVisible();
  await expect(card).toBeFocused();
});

test('adaptive role lens alters narrative framing and showcases relevant projects', async ({ page }) => {
  // Check Creative Executive Lens
  await page.goto('/lens/creative/');
  await expect(page.locator('h1')).toHaveText('Giving tangible form to emerging ideas before they have a name.');
  await expect(page.locator('[data-featured-slide="0"] h2')).toHaveText('Resona 響');
  await expect(page.locator('[data-featured-slide="1"] h2')).toHaveText('KOJI FIZZ');

  // Check AI Product Lens
  await page.goto('/lens/ai-product/');
  await expect(page.locator('h1')).toHaveText('Reimagining how product teams and autonomous agents make decisions together.');
  await expect(page.locator('[data-featured-slide="0"] h2')).toHaveText('Verizon AI Workflow');
  await expect(page.locator('[data-featured-slide="1"] h2')).toHaveText('Moime.app');
});

test('project modal clearly distinguishes personal contribution from team execution', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('[data-project="festival-design"]');
  await card.scrollIntoViewIfNeeded();
  await card.click();

  const dialog = page.locator('#project-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.fact-heading--personal')).toHaveText('What Takao Personally Did');
  await expect(dialog.locator('.fact-heading--team')).toHaveText('What the Team Executed');
  await expect(dialog.locator('.fact-list--personal')).toContainText('11+ original physical game concepts');
  await expect(dialog.locator('.fact-list--team')).toContainText('volunteer parents');
});

test('default, dialog, and expanded menu states have no automated WCAG A/AA violations', async ({ page }) => {
  await page.goto('/');
  await expectNoAxeViolations(page);

  await page.locator('[data-project="superforge"]').click();
  await expect(page.locator('#project-dialog')).toBeVisible();
  await expectNoAxeViolations(page);

  await page.keyboard.press('Escape');
  await expect(page.locator('#project-dialog')).not.toBeVisible();
  await page.setViewportSize({ width: 320, height: 800 });
  await page.locator('#mobile-menu summary').click();
  await expectNoAxeViolations(page);
});

test('keyboard opens and dismisses a project without losing the trigger', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('[data-project="superforge"]');
  await card.focus();
  await page.keyboard.press('Enter');

  await expect(page.locator('#project-dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await expect(page.locator('[data-dialog-link]')).toHaveAccessibleName(/^Open full project/);
  await page.keyboard.press('Escape');

  await expect(page.locator('#project-dialog')).not.toBeVisible();
  await expect(card).toBeFocused();
});

test('320px reflow and forced text spacing preserve the page', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await page.addStyleTag({ content: `
    * { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }
    p { margin-block-end: 2em !important; }
  ` });

  const metrics = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    overflowingElements: [...document.querySelectorAll('body *')]
      .filter((element) => (
        element.getBoundingClientRect().right > document.documentElement.clientWidth + 1
        || element.scrollWidth > element.clientWidth + 1
      ))
      .map((element) => ({
        tag: element.tagName,
        className: element.className,
        right: Math.round(element.getBoundingClientRect().right),
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        text: element.textContent.trim().slice(0, 40),
      }))
      .slice(0, 12),
    clippedText: [...document.querySelectorAll('h1, h2, h3, p, a, button, summary')]
      .filter((element) => element.scrollWidth > element.clientWidth + 1 && getComputedStyle(element).overflowX === 'hidden')
      .map((element) => element.textContent.trim().slice(0, 60)),
  }));

  expect(metrics.documentWidth, JSON.stringify(metrics.overflowingElements, null, 2))
    .toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.clippedText).toEqual([]);
});

test('200% text-only zoom does not introduce page-level horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
  await page.goto('/');
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });

  const widths = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));

  expect(widths.documentWidth).toBeLessThanOrEqual(widths.viewportWidth);
});

test('skip link is the first keyboard stop and reaches main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main-content$/);
});

test('the complete desktop tab order stays visible and reaches every control', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const seen = new Set();

  for (let step = 0; step < 120; step += 1) {
    await page.keyboard.press('Tab');
    await page.evaluate(() => new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));
    await page.waitForFunction(() => {
      const rect = document.activeElement.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    }, null, { timeout: 1000 });
    const focus = await page.evaluate(() => {
      const active = document.activeElement;
      const focusable = [...document.querySelectorAll('a[href], button, summary')]
        .filter((element) => {
          const closedDialog = element.closest('dialog:not([open])');
          const closedDetails = element.closest('details:not([open])');
          return !closedDialog && (!closedDetails || element.tagName === 'SUMMARY') && element.getClientRects().length;
        });
      const rect = active.getBoundingClientRect();
      const headerBottom = document.querySelector('.site-header').getBoundingClientRect().bottom;
      const exemptFromHeader = Boolean(active.closest('.site-header') || active.matches('.skip-link'));
      return {
        index: focusable.indexOf(active),
        count: focusable.length,
        name: active.textContent.trim().replace(/\s+/g, ' ').slice(0, 80),
        outlineWidth: Number.parseFloat(getComputedStyle(active).outlineWidth),
        visible: rect.bottom > 0 && rect.top < window.innerHeight,
        obscured: !exemptFromHeader && rect.bottom <= headerBottom,
      };
    });

    if (focus.index === -1 || seen.has(focus.index)) break;
    expect(focus.index, focus.name).toBeGreaterThanOrEqual(0);
    expect(focus.outlineWidth, focus.name).toBeGreaterThanOrEqual(3);
    expect(focus.visible, focus.name).toBe(true);
    expect(focus.obscured, focus.name).toBe(false);
    seen.add(focus.index);
  }

  expect(seen.size).toBeGreaterThanOrEqual(25);
});

test('the accessibility tree exposes a coherent outline and named landmarks', async ({ page, context }) => {
  await page.goto('/');
  const session = await context.newCDPSession(page);
  const { nodes } = await session.send('Accessibility.getFullAXTree');
  const roles = nodes.map((node) => node.role?.value).filter(Boolean);
  const headings = nodes
    .filter((node) => node.role?.value === 'heading')
    .map((node) => ({ name: node.name?.value, level: node.properties?.find((item) => item.name === 'level')?.value?.value }));

  expect(roles.filter((role) => role === 'banner')).toHaveLength(1);
  expect(roles.filter((role) => role === 'main')).toHaveLength(1);
  expect(roles.filter((role) => role === 'contentinfo')).toHaveLength(1);
  expect(roles.filter((role) => role === 'navigation').length).toBeGreaterThanOrEqual(3);
  expect(headings[0]).toEqual({
    name: 'I like the beginning of things.',
    level: 1,
  });
});

test('forced-colors mode preserves content and a visible keyboard focus indicator', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');
  const target = page.locator('.hero .button-action');
  await target.focus();

  await expect(target).toBeVisible();
  const outline = await target.evaluate((element) => Number.parseFloat(getComputedStyle(element).outlineWidth));
  expect(outline).toBeGreaterThanOrEqual(3);
});

test('reduced motion opens the detail without a spatial transition surface', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('[data-project="resona"]').click();

  await expect(page.locator('#project-dialog')).toBeVisible();
  await expect(page.locator('[data-transition-surface]')).toHaveCount(0);
});

test('direct project URLs open predictably and invalid slugs recover', async ({ page }) => {
  await page.goto('/?project=superforge');
  await expect(page.locator('#project-dialog')).toBeVisible();
  await expect(page.locator('[data-dialog-title]')).toHaveText('superforge');

  await page.goto('/?project=does-not-exist');
  await expect(page).not.toHaveURL(/project=/);
  await expect(page.locator('#project-dialog')).not.toBeVisible();
  await expect(page.locator('[data-status]')).toContainText('Project not found');
});

test('Back restores the original scroll position', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('[data-project="superforge"]');
  await card.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);

  await card.click();
  await expect(page.locator('#project-dialog')).toBeVisible();
  await page.goBack();
  await expect(page.locator('#project-dialog')).not.toBeVisible();

  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(before);
});

test('Next project keeps one reversible history step', async ({ page }) => {
  await page.goto('/');
  const originCard = page.locator('[data-project="superforge"]');
  await originCard.click();
  await page.locator('[data-dialog-next]').click();

  await expect(page.locator('[data-dialog-title]')).toHaveText('Snap Pair');
  await expect(page).toHaveURL(/project=snap-pair/);
  await page.goBack();

  await expect(page.locator('#project-dialog')).not.toBeVisible();
  await expect(originCard).toBeFocused();
});

test('Space key cycles through the 5 full-screen featured slides', async ({ page }) => {
  await page.goto('/');
  const showcase = page.locator('[data-featured-showcase]');
  await showcase.scrollIntoViewIfNeeded();
  await expect(page.locator('[data-featured-slide]')).toHaveCount(5);

  // Press Space to advance to slide 2 (Verizon AI Workflow)
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  const slide2 = page.locator('[data-featured-slug="verizon-ai-agents"]');
  await expect(slide2).toBeInViewport();

  // Press Space to advance to slide 3 (Festival Reinvention)
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  const slide3 = page.locator('[data-featured-slug="festival-design"]');
  await expect(slide3).toBeInViewport();
});

test('Lens Studio loads cleanly and has zero WCAG AA accessibility violations', async ({ page }) => {
  await page.goto('/studio.html');
  await expect(page.locator('h1')).toContainText('Turn any Job Description into a tailored executive portfolio');
  await expectNoAxeViolations(page);
});

test('Lens Studio analyzes sample JD, supports project reordering, and publishes instant share link', async ({ page }) => {
  await page.goto('/studio.html');

  // Load sample JD
  await page.locator('[data-sample="ai_executive"]').click();
  await expect(page.locator('#studio-company')).toHaveValue('Anthropic');
  await expect(page.locator('#studio-role')).toHaveValue('Head of Enterprise AI & Agentic UX');

  // Click Analyze
  await page.locator('#studio-analyze-btn').click();
  await expect(page.locator('#studio-results')).toBeVisible();

  // Verify alignment and honest boundaries rendered
  await expect(page.locator('#analysis-direct-list .match-item')).not.toHaveCount(0);
  await expect(page.locator('#analysis-gaps-list .match-item')).not.toHaveCount(0);

  // Verify curated cards rendered
  const cards = page.locator('#curated-projects-list .curated-card');
  const initialCount = await cards.count();
  expect(initialCount).toBeGreaterThanOrEqual(3);

  // Test Move Down reordering
  const firstCardTitle = await cards.first().locator('.curated-card__title').textContent();
  await cards.first().locator('[data-action="move-down"]').click();
  const newSecondCardTitle = await cards.nth(1).locator('.curated-card__title').textContent();
  expect(newSecondCardTitle).toBe(firstCardTitle);

  // Click Publish
  await page.locator('#publish-instant-btn').click();
  await expect(page.locator('#publish-url-display')).toBeVisible();

  const publishedUrl = await page.locator('#publish-url-input').inputValue();
  expect(publishedUrl).toContain('?c=');

  // Open the published URL directly
  await page.goto(publishedUrl);
  await expect(page.locator('.custom-lens-banner')).toBeVisible();
  await expect(page.locator('.custom-lens-banner__msg')).toContainText('Anthropic');
  await expect(page.locator('.hero__meta')).toContainText('Anthropic');

  // Verify Axe accessibility on the generated custom lens page
  await expectNoAxeViolations(page);
});

