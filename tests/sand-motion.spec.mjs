import { test, expect } from '@playwright/test';

test('sand appears on entry, settles, and returns for newly scrolled cards only', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/work');
  await expect(page.locator('.sand-layer').first()).toBeVisible();
  await expect(page.locator('.mo-layer')).toHaveCount(0);
  await expect(page.locator('.sand-layer')).toHaveCount(0, { timeout: 6500 });
  const slug = await page.locator('.tile:not([data-sand-played])').nth(3).getAttribute('id');
  const next = page.locator(`.tile[id="${slug}"]`);
  await next.scrollIntoViewIfNeeded();
  await expect(next.locator('.sand-layer')).toBeVisible();
  await expect(next.locator('.sand-layer')).toHaveCount(0, { timeout: 6500 });
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


for (const route of ['/', '/about', '/interactive', '/brand', '/ai', '/projects/typespace.html', '/lens/creative/', '/intentfirst.html', '/workshop.html', '/publications.html', '/breakbias.html']) {
  test(`shared sand system automatically covers ${route}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(route);
    const canvas = page.locator('.sand-layer').first();
    await expect(canvas).toBeVisible();
    // More than a fleeting dust speck: substantial particles remain visible
    // before the contents start appearing, using the same shared tokens.
    expect(Number(await canvas.getAttribute('data-grain-count'))).toBeGreaterThan(100);
    const duration = await canvas.evaluate(el => getComputedStyle(el.parentElement).getPropertyValue('--sand-duration'));
    expect(duration).toBe('700ms');
    await expect(page.locator('.sand-layer')).toHaveCount(0, { timeout: 9000 });
    await expect(page.locator('.sand-active')).toHaveCount(0);
  });
}

test('keyboard focus finishes the decorative overlay without blocking the link', async ({ page }) => {
  await page.goto('/work');
  const canvas = page.locator('.tile .sand-layer').first();
  await expect(canvas).toBeVisible();
  const id = await canvas.evaluate(el => el.parentElement.id);
  const tile = page.locator(`.tile[id="${id}"]`);
  await tile.focus();
  await expect(tile.locator('.sand-layer')).toHaveCount(0);
  await expect(tile).toBeFocused();
});

test('visible surfaces beyond the concurrency limit eventually receive their entrance', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.setViewportSize({ width: 1440, height: 2000 });
  await page.goto('/work');
  const visibleIds = await page.locator('.tile').evaluateAll(els => els.filter(el => {
    const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0;
  }).map(el => el.id));
  expect(visibleIds.length).toBeGreaterThan(6);
  await expect.poll(async () => page.locator('.tile[data-sand-played]').evaluateAll(
    (els, ids) => ids.every(id => els.some(el => el.id === id)), visibleIds), { timeout: 12000 }).toBe(true);
  await expect(page.locator('.sand-layer')).toHaveCount(0, { timeout: 9000 });
});
