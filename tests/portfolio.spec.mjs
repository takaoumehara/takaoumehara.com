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

test('reduced motion opens the detail without a spatial transition surface', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('[data-project="superforge"]').click();

  await expect(page.locator('#project-dialog')).toBeVisible();
  await expect(page.locator('[data-transition-surface]')).toHaveCount(0);
});

test('direct project URLs open predictably and invalid slugs recover', async ({ page }) => {
  await page.goto('/?project=snap-pair');
  await expect(page.locator('#project-dialog')).toBeVisible();
  await expect(page.locator('[data-dialog-title]')).toHaveText('Snap Pair');

  await page.goto('/?project=not-a-project');
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
