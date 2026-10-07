import { test, expect } from '@playwright/test';

test('sand appears on entry, settles, and returns for newly scrolled cards only', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/work');
  await expect(page.locator('.sand-layer').first()).toBeVisible();
  await expect(page.locator('.mo-layer')).toHaveCount(0);
  await expect(page.locator('.sand-layer')).toHaveCount(0, { timeout: 3000 });
  const slug = await page.locator('.tile:not([data-sand-played])').nth(3).getAttribute('id');
  const next = page.locator(`.tile[id="${slug}"]`);
  await next.scrollIntoViewIfNeeded();
  await expect(next.locator('.sand-layer')).toBeVisible();
  await expect(next.locator('.sand-layer')).toHaveCount(0, { timeout: 3000 });
  await page.locator('.tile').first().scrollIntoViewIfNeeded();
  await expect(page.locator('.tile').first().locator('.sand-layer')).toHaveCount(0);
});

test('reduced motion shows content directly and cancels a running entrance', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/work');
  await expect(page.locator('.tile').first()).toBeVisible();
  await expect(page.locator('.sand-layer, .mo-layer')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload();
  await expect(page.locator('.sand-layer').first()).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.sand-layer')).toHaveCount(0);
});

test('accordion animates its height and survives reversal; closed links are inert', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/work');
  const header = page.locator('.side-group-header').first();
  const panel = page.locator('.side-group-items').first();
  await header.click();
  const animation = await panel.evaluate(el => el.getAnimations().map(a => a.effect.getTiming().duration));
  expect(animation).toContain(220);
  // Reverse without waiting for the opening animation to finish.
  await header.evaluate(el => el.click());
  await expect(header).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();
  expect(await panel.evaluate(el => el.inert)).toBe(true);
  await header.click();
  await expect.poll(() => panel.evaluate(el => el.getAnimations().length)).toBe(0);
  expect(await panel.evaluate(el => el.inert)).toBe(false);
  expect(await panel.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(100);
});

test('project captions sit below the media rather than covering it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/work');
  const positions = await page.locator('.tile').first().evaluate(el => ({
    image: el.querySelector('.tile-media').getBoundingClientRect().bottom,
    text: el.querySelector('.tile-body').getBoundingClientRect().top,
  }));
  expect(positions.text).toBeGreaterThanOrEqual(positions.image - 1);
  const media = await page.locator('.tile').first().evaluate(el => {
    const image = el.querySelector('.tile-media img');
    return { fit: getComputedStyle(image).objectFit, gap: el.querySelector('.tile-media').getBoundingClientRect().bottom - image.getBoundingClientRect().bottom };
  });
  expect(media.fit).toBe('cover');
  expect(Math.abs(media.gap)).toBeLessThan(1);
  await page.goto('/');
  expect(await page.locator('.hh-bar').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(
    await page.locator('.hh-stage').evaluate(el => el.getBoundingClientRect().bottom));
});
