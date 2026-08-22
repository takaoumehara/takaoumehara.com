import { test, expect } from '@playwright/test';

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
