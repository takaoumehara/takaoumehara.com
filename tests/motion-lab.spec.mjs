import { test, expect } from '@playwright/test';

test('lab compares sand and legacy, exports/imports a full configuration and previews name placement', async ({ page }) => {
  await page.goto('/work?lab=1');
  const lab = page.locator('.mlab');
  await expect(lab).toBeVisible();
  await page.locator('#mlab-preset').selectOption('Sand — fine & quick');
  await expect(lab.locator('[data-id="sand"]')).toBeVisible();
  await expect(lab.locator('[data-id="pane-outline"]')).toBeHidden();
  await page.getByLabel('Grain size · 粒のサイズ value (px)', { exact: true }).fill('0.8');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('takao-motion-config.json');
  const { readFile } = await import('node:fs/promises');
  const json = JSON.parse(await readFile(await download.path(), 'utf8'));
  expect(json.global.engine).toBe('sand');
  expect(json.sand.minGrainPx).toBe(0.8);
  expect(json.sand.boxParticles).toBe(true);
  await page.getByLabel('Name placement (preview)', { exact: true }).selectOption('top-left');
  await expect(page.locator('#side')).toHaveClass(/side-identity-top/);
  await expect(page.locator('.side-controls-left .side-wordmark')).toBeAttached();
  await page.locator('#mlab-preset').selectOption('Blueprint');
  await expect(lab.locator('[data-id="pane-outline"]')).toBeVisible();
  await expect(lab.locator('[data-id="sand"]')).toBeHidden();
  await expect(page.locator('.mo-layer').first()).toBeAttached();
  await expect(page.locator('.sand-layer')).toHaveCount(0);
  await page.getByRole('button', { name: 'Import JSON', exact: true }).click();
  await page.locator('#mlab-json').fill(JSON.stringify(json));
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(lab.locator('[data-id="sand"]')).toBeVisible();
  await expect(page.locator('.sand-layer').first()).toBeAttached();
  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.locator('.mlab')).toBeVisible();
  await expect(page.getByLabel('Effect family', { exact: true })).toHaveValue('sand');
  await page.locator('#mlab-preset').selectOption('Off — instant');
  await expect(page.locator('.sand-layer, .mo-layer')).toHaveCount(0);
});

test('whole box becomes transparent during sand and returns after settlement', async ({ page }) => {
  await page.goto('/work?lab=1');
  await page.locator('#mlab-auto').uncheck();
  await page.locator('#mlab-preset').selectOption('Sand — soft');
  await page.getByLabel('Duration · 表示時間 value (ms)', { exact: true }).fill('1500');
  await page.getByRole('button', { name: 'Replay', exact: true }).click();
  const tile = page.locator('.tile').first();
  await expect(tile.locator('.sand-layer')).toBeAttached();
  await expect.poll(() => tile.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  await expect(tile.locator('.sand-layer')).toHaveCount(0, { timeout: 3000 });
  expect(await tile.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
});

test('accordion controls apply a named easing and remain independent of the effect preset', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/work?lab=1');
  await page.locator('#mlab-auto').uncheck();
  await page.locator('.mlab-group[data-id="interaction"] > summary').click();
  await page.getByLabel('Accordion open · 開く時間 value (ms)', { exact: true }).fill('330');
  await page.getByLabel('Accordion open · 開く時間 value (ms)', { exact: true }).press('Tab');
  await page.getByLabel('Accordion easing · 開閉のイージング', { exact: true }).selectOption('standard');
  await page.locator('#mlab-preset').selectOption('Sand — soft');
  await page.locator('.side-group-header').first().click();
  const timing = await page.locator('.side-group-items').first().evaluate(el => el.getAnimations().map(a => a.effect.getTiming()));
  expect(timing.some(t => t.duration === 330 && t.easing === 'cubic-bezier(0.4, 0, 0.2, 1)')).toBe(true);
});
