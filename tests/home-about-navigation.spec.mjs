import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home leads with work, then a short introduction; archive retains navigation through return visits', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.home-hero')).toBeVisible();
  await expect(page.locator('.about-intro h1')).toHaveText('Takao Umehara');
  await expect(page.locator('main img[alt="Takao Umehara"]')).toHaveCount(0);
  await expect(page.locator('.home-now')).toHaveCount(0);
  expect(await page.locator('.home-hero').evaluate(el => el.getBoundingClientRect().top)).toBeLessThan(await page.locator('.about-intro').evaluate(el => el.getBoundingClientRect().top));
  const phone = info.project.name === 'phone';
  if (phone) await page.locator('#side-toggle').click();
  await expect(page.locator('.side-work-heading .side-all')).toBeVisible();
  await page.locator('.side-work-heading .side-all').click();
  await expect(page.locator('.work-title')).toContainText('All Work');
  if (!phone) await expect(page.locator('.side')).toBeVisible();
  for (let visit = 0; visit < 2; visit++) {
    await page.locator('.filter-btn[data-filter="ai"]').click();
    await expect(page.locator('.filter-btn[data-filter="ai"]')).toHaveAttribute('aria-pressed', 'true');
    expect(await page.locator('.tile:not(.is-hidden)').evaluateAll(els => els.every(el => el.dataset.filter === 'ai'))).toBe(true);
    await page.locator('#work-search-toggle').click();
    await page.locator('#work-search-input').fill('Verizon');
    await expect(page.locator('.tile:not(.is-hidden)')).toHaveCount(1);
    await page.locator('#work-search-toggle').click();
    await page.goto('/about');
    await page.locator('.about-footer-link[href="/work"]').click();
  }
});

test('About capabilities lead; message form preserves input on failure and resets on confirmed success', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/about');
  await expect(page.locator('main img[alt="Takao Umehara"]')).toHaveCount(1);
  await expect(page.locator('#capabilities')).toContainText('A brand people can experience');
  const ids = await page.locator('.about-bento > section').evaluateAll(els => els.map(el => el.id));
  expect(ids.indexOf('capabilities')).toBeLessThan(ids.indexOf('experience'));
  await expect(page.locator('main a[href^="mailto:"]')).toHaveCount(0);
  await expect(page.locator('main a[href*="resume.pdf"]')).toHaveCount(0);
  await page.locator('[name="name"]').fill('Test Visitor');
  await page.locator('[name="email"]').fill('visitor@example.net');
  await page.locator('[name="message"]').fill('A project idea');
  await page.route('**/api/contact', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false}' }));
  await page.locator('.contact-form button').click();
  await expect(page.locator('.contact-status')).toContainText('temporarily unavailable');
  await expect(page.locator('[name="message"]')).toHaveValue('A project idea');
  await page.unroute('**/api/contact');
  await page.route('**/api/contact', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await page.locator('.contact-form button').click();
  await expect(page.locator('.contact-status')).toContainText('your message is on its way');
  await expect(page.locator('[name="message"]')).toHaveValue('');
});

test('changed pages have no horizontal overflow and pass automated accessibility checks', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const url of ['/', '/about', '/work']) {
    await page.goto(url);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
    if (url !== '/work') await page.screenshot({ path: `../${info.project.name}-${url === '/' ? 'home' : 'about'}.png`, fullPage: true });
  }
});
