// The Contact "page can't scroll" bug. Contact links go to /about#work-with-me,
// the last section of /about, so the page lands at (or near) its bottom with
// the pointer still over the left rail. The rail is its own scroller
// (position: sticky; overflow-y: auto); with `overscroll-behavior: contain`
// a wheel over it never chained to the page, so the page felt frozen. These
// checks fail if that comes back (or if the phone menu stays open / locks
// the page after Contact).
import { test, expect } from "@playwright/test";

const scrollY = (page) => page.evaluate(() => window.scrollY);

test.describe("Contact keeps the page scrollable", () => {
  test("desktop: rail Contact → /about#work-with-me, then wheel-up over the rail scrolls the page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop layout");
    await page.goto("/");
    await page.locator('#side .side-nav a[href="/about#work-with-me"]').click();
    await page.waitForURL(/\/about#work-with-me$/);
    await expect(page.locator("#work-with-me")).toBeInViewport();
    await page.waitForTimeout(400); // let the hash jump settle

    const side = page.locator("#side");
    expect(await side.evaluate((el) => getComputedStyle(el).overscrollBehaviorY)).not.toBe("contain");
    const box = await side.boundingBox();
    const before = await scrollY(page);
    expect(before).toBeGreaterThan(0);
    await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height, 800) / 2);
    await page.mouse.wheel(0, -600);
    await expect.poll(() => scrollY(page), { timeout: 3000 }).toBeLessThan(before);
  });

  test("phone: Menu → Contact closes the menu and the page still scrolls", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "phone", "phone layout");
    await page.goto("/");
    const toggle = page.locator("#side-toggle");
    await toggle.click();
    await expect(page.locator("#side")).toHaveClass(/is-open/);
    await page.locator('#side .side-nav a[href="/about#work-with-me"]').click();
    await page.waitForURL(/\/about#work-with-me$/);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#side")).not.toHaveClass(/is-open/);
    await page.waitForTimeout(400);

    const locked = await page.evaluate(() => [document.documentElement, document.body].some((el) => getComputedStyle(el).overflowY === "hidden"));
    expect(locked).toBe(false);
    const before = await scrollY(page);
    await page.mouse.move(195, 600);
    await page.mouse.wheel(0, before > 0 ? -600 : 600);
    await expect.poll(() => scrollY(page), { timeout: 3000 }).not.toBe(before);
  });
});
