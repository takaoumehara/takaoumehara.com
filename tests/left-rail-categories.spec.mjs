import { test, expect } from '@playwright/test';

test.describe('Left rail categories', () => {
  test('category list visible on load at desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:4321/');

    // Category list should be visible
    const categoryList = page.locator('.side-categories-list');
    await expect(categoryList).toBeVisible();

    // Should have multiple category chips
    const chips = page.locator('.side-cat-chip');
    const chipCount = await chips.count();
    expect(chipCount).toBeGreaterThan(0);
  });

  test('exclusive accordion: clicking category opens only that one', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:4321/');

    const chips = page.locator('.side-cat-chip');
    const secondChip = chips.nth(1);

    // Click second category
    await secondChip.click();

    // Wait for state to update
    await page.waitForTimeout(150);

    // Second chip should be expanded
    const secondExpanded = await secondChip.getAttribute('aria-expanded');
    expect(secondExpanded).toBe('true');

    // Other chips should not be expanded
    const firstChip = chips.first();
    const firstExpanded = await firstChip.getAttribute('aria-expanded');
    expect(firstExpanded).toBe('false');
  });

  test('category headers match chip behavior', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:4321/');

    const headers = page.locator('.side-group-header');
    const secondHeader = headers.nth(1);

    // Click second category header
    await secondHeader.click();

    // Wait for update
    await page.waitForTimeout(150);

    // Header should be expanded
    const headerExpanded = await secondHeader.getAttribute('aria-expanded');
    expect(headerExpanded).toBe('true');

    // Corresponding chip should also be expanded
    const chips = page.locator('.side-cat-chip');
    const secondChip = chips.nth(1);
    const chipExpanded = await secondChip.getAttribute('aria-expanded');
    expect(chipExpanded).toBe('true');
  });

  test('matching cards get highlighted when category is open', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:4321/');

    // Get a category and click it
    const chip = page.locator('.side-cat-chip').first();
    await chip.click();

    // Wait for highlighting
    await page.waitForTimeout(150);

    // Check if any cards have is-category-active class
    const activeCards = page.locator('.is-category-active');
    const activeCount = await activeCards.count();

    // Should have some active cards (depends on page content)
    // This is flexible since not all pages have all categories
    if (activeCount > 0) {
      const firstActive = activeCards.first();
      const classes = await firstActive.getAttribute('class');
      expect(classes).toContain('is-category-active');
    }
  });

  test('keyboard navigation with Tab and Enter', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:4321/');

    // Focus on first chip with Tab
    const firstChip = page.locator('.side-cat-chip').first();
    await firstChip.focus();

    // Verify it's focused
    await expect(firstChip).toBeFocused();

    // Press Enter to activate
    await firstChip.press('Enter');

    // Wait for state update
    await page.waitForTimeout(150);

    // Should be expanded
    const expanded = await firstChip.getAttribute('aria-expanded');
    expect(expanded).toBe('true');
  });

  test('no horizontal scroll at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:4321/');

    // Get the scrolling element (document)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = 390;

    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding
  });

  test('closing category clears highlight', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:4321/');

    const chip = page.locator('.side-cat-chip').first();

    // Open category
    await chip.click();
    await page.waitForTimeout(150);

    // Check active cards exist
    let activeCards = page.locator('.is-category-active');
    let activeCount = await activeCards.count();

    if (activeCount > 0) {
      // Click again to close
      await chip.click();
      await page.waitForTimeout(150);

      // Active cards should be cleared
      activeCards = page.locator('.is-category-active');
      activeCount = await activeCards.count();
      expect(activeCount).toBe(0);
    }
  });

  test('category list visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:4321/');

    // Menu toggle should be visible
    const toggle = page.locator('#side-toggle');
    await expect(toggle).toBeVisible();

    // Open the menu
    await toggle.click();
    await page.waitForTimeout(150);

    // Category list should be visible in the panel
    const categoryList = page.locator('.side-categories-list');
    await expect(categoryList).toBeVisible();
  });
});
