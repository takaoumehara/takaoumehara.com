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

test('spatial transition stays in the dialog layer and choreographs the project content', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('[data-project="superforge"]');
  await card.scrollIntoViewIfNeeded();
  await card.click();

  const dialog = page.locator('#project-dialog');
  const surface = dialog.locator(':scope > [data-transition-surface]');
  await expect(surface).toBeVisible();
  await expect(surface.locator('[data-transition-preview]')).toHaveCount(1);

  const { motionTracks, previewReleaseOffset } = await surface.evaluate((element) => {
    const ignored = new Set(['offset', 'computedOffset', 'easing', 'composite']);
    const tracks = element.getAnimations().map((animation) => {
      const frames = animation.effect.getKeyframes();
      return {
        properties: [...new Set(
          frames.flatMap((frame) => Object.keys(frame))
            .filter((property) => !ignored.has(property)),
        )].sort(),
        offsets: frames.map((frame) => frame.offset),
        opacities: frames.map((frame) => frame.opacity ?? null),
      };
    });
    const preview = element.querySelector('[data-transition-preview]');
    const previewFrames = preview?.getAnimations()[0]?.effect.getKeyframes() ?? [];
    const offset = previewFrames.find((frame) => Number(frame.opacity) === 0)?.offset ?? 1;
    return { motionTracks: tracks, previewReleaseOffset: offset };
  });
  const geometryTrack = motionTracks.find(({ properties }) => properties.join() === 'transform');
  expect(geometryTrack?.offsets).toEqual([0, 1]);
  const revealTrack = motionTracks.find(({ properties }) => properties.join() === 'opacity');
  const firstRevealOffset = revealTrack?.offsets.find((offset, index) => Number(revealTrack.opacities[index]) < 1) ?? 1;
  expect(firstRevealOffset).toBeLessThanOrEqual(0.55);
  expect(previewReleaseOffset).toBeLessThanOrEqual(0.32);

  await expect.poll(() => page.locator('[data-dialog-title]').evaluate((element) => {
    const animation = element.getAnimations()[0];
    if (!animation) return null;
    return {
      delay: animation.effect.getComputedTiming().delay,
      duration: animation.effect.getComputedTiming().duration,
      startTransform: animation.effect.getKeyframes()[0]?.transform,
    };
  })).not.toBeNull();
  const measuredTitleMotion = await page.locator('[data-dialog-title]').evaluate((element) => {
    const animation = element.getAnimations()[0];
    return {
      delay: animation.effect.getComputedTiming().delay,
      duration: animation.effect.getComputedTiming().duration,
      startTransform: animation.effect.getKeyframes()[0]?.transform,
    };
  });
  expect(measuredTitleMotion.delay).toBeGreaterThanOrEqual(120);
  expect(measuredTitleMotion.delay).toBeLessThanOrEqual(130);
  expect(measuredTitleMotion.duration).toBeGreaterThanOrEqual(340);
  expect(measuredTitleMotion.startTransform).toContain('0.375rem');
  await expect(surface).toHaveCount(0);
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

  for (let step = 0; step < 60; step += 1) {
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

  const expectedCount = await page.evaluate(() => [...document.querySelectorAll('a[href], button, summary')]
    .filter((element) => {
      const closedDialog = element.closest('dialog:not([open])');
      const closedDetails = element.closest('details:not([open])');
      return !closedDialog && (!closedDetails || element.tagName === 'SUMMARY') && element.getClientRects().length;
    }).length);
  expect(seen.size).toBe(expectedCount);
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
    name: 'Designing the interface. Building the system behind it.',
    level: 1,
  });
  expect(headings.filter((heading) => heading.level === 2)).toHaveLength(6);
  expect(headings.filter((heading) => heading.level === 3)).toHaveLength(15);
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
  const tracker = page.locator('[data-showcase-tracker]');
  await expect(page.locator('[data-featured-slide]')).toHaveCount(5);

  // Press Space to advance to slide 2 (Rakugaki Jam)
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  const slide2 = page.locator('[data-featured-slug="rakugaki-jam"]');
  await expect(slide2).toBeInViewport();

  // Press Space to advance to slide 3 (Kao Game)
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  const slide3 = page.locator('[data-featured-slug="kao-game"]');
  await expect(slide3).toBeInViewport();
});
