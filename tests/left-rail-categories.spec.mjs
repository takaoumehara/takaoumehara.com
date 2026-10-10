// The rail's categories (src/components/Sidebar.astro, src/scripts/site.js).
//
// Desktop: ONE always-visible list — the accordion's own header rows
// (number, name, count, +/−), left-aligned. Exclusive: opening one closes
// the others, clicking the open one closes it; the matching cards in the
// page take the inverted .is-category-active style while it is open.
// Phone (≤ 900px): the rail is behind Menu, so a chip list under the top bar
// shows the categories without opening it; chips are 44px tall and wrap.
//
// Also the 390px checks for item 9/J: no horizontal overflow on /, /about,
// /work, the phone top bar's status line is not clipped, and new strings
// switch with the EN/JP toggle.
import { test, expect } from "@playwright/test";

const desktopOnly = (testInfo) => test.skip(testInfo.project.name !== "desktop", "desktop layout");
const phoneOnly = (testInfo) => test.skip(testInfo.project.name !== "phone", "phone layout");

const expanded = (loc) => loc.evaluateAll((els) => els.map((el) => el.getAttribute("aria-expanded")));

test.describe("Left rail categories — desktop", () => {
  test("the header rows are the one category list: visible, left-aligned, ≥44px, no chip list", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.goto("/");
    await expect(page.locator(".side-cats-phone")).toBeHidden();
    const headers = page.locator("#side .side-group-header");
    expect(await headers.count()).toBe(5);
    for (const header of await headers.all()) {
      await expect(header).toBeVisible();
      await expect(header).toHaveAttribute("aria-controls", /side-group-.+-items/);
      const box = await header.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
      const parts = await header.evaluate((el) => {
        const r = (sel) => el.querySelector(sel).getBoundingClientRect();
        return { left: el.getBoundingClientRect().left, num: r(".side-group-number").left, title: r(".side-group-title").left, count: r(".side-count").left, align: getComputedStyle(el).textAlign };
      });
      expect(parts.align).toBe("left");
      expect(parts.num).toBeLessThan(parts.title);
      expect(parts.title).toBeLessThan(parts.count);
      // The name starts right after the number, not centred in the row.
      expect(parts.title - parts.left).toBeLessThan(80);
      const textLeft = await header.locator(".side-group-title").evaluate((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return range.getBoundingClientRect().left - el.getBoundingClientRect().left;
      });
      expect(textLeft).toBeLessThan(2);
    }
  });

  test("exclusive accordion: one open at a time, the open one closes on click", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.goto("/");
    const headers = page.locator("#side .side-group-header");
    await headers.nth(1).click();
    expect(await expanded(headers)).toEqual(["false", "true", "false", "false", "false"]);
    await expect(page.locator("#side .side-group").nth(1).locator(".side-group-items")).toBeVisible();
    await expect(page.locator("#side .side-group").nth(0).locator(".side-group-items")).toBeHidden();
    await headers.nth(0).click();
    expect(await expanded(headers)).toEqual(["true", "false", "false", "false", "false"]);
    await headers.nth(0).click();
    expect(await expanded(headers)).toEqual(["false", "false", "false", "false", "false"]);
  });

  test("an open category inverts its cards on the page; closing clears it", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.goto("/");
    const interactive = page.locator('#side .side-group-header[data-cat="interactive"]');
    await interactive.click();
    const active = page.locator("#main .hn-article.is-category-active");
    await expect.poll(() => active.count()).toBeGreaterThan(0);
    // Polled: the card's background has a short transition.
    await expect.poll(() => active.first().evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(0, 0, 0)"); // --pr-ink, light theme
    // Rail rows themselves are never highlighted.
    expect(await page.locator("#side .is-category-active").count()).toBe(0);
    await interactive.click();
    await expect(page.locator(".is-category-active")).toHaveCount(0);
  });

  test("keyboard: Enter and Space toggle a focused row", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.goto("/");
    const header = page.locator("#side .side-group-header").nth(2);
    await header.focus();
    await expect(header).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(header).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Space");
    await expect(header).toHaveAttribute("aria-expanded", "false");
  });

  test("after a client-side navigation a row still toggles exactly once", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.goto("/");
    await page.locator('#side .side-about a[href="/about"]').click();
    await page.waitForURL(/\/about$/);
    await page.waitForTimeout(300);
    const header = page.locator("#side .side-group-header").nth(3);
    const before = await header.getAttribute("aria-expanded");
    await header.click();
    await expect(header).toHaveAttribute("aria-expanded", before === "true" ? "false" : "true");
  });

  test("jumping to a project from the page opens its category in the rail, closing the one open before", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.goto("/");
    const headers = page.locator("#side .side-group-header");
    await page.locator('#side .side-group-header[data-cat="brand"]').click();
    // A reader who just scrolled the rail is not scrolled for — but the category still opens.
    await page.locator("#side").dispatchEvent("wheel");
    await page.locator('#main a[href="/projects/resona.html"]:visible').first().click();
    await page.waitForURL(/\/projects\/resona/);
    await expect(page.locator('#side .side-group-header[data-cat="interactive"]')).toHaveAttribute("aria-expanded", "true");
    expect((await expanded(headers)).filter((v) => v === "true")).toHaveLength(1);
    await expect(page.locator('#side .side-item[aria-current="page"][data-cat="interactive"]')).toBeVisible();
  });

  test("EN/JP toggle switches the new home strings", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.goto("/");
    const title = page.locator(".intro-role");
    await expect(title.locator(".t-en")).toBeVisible();
    await page.locator("#lang-cycle").click();
    await expect(title.locator(".t-jp")).toBeVisible();
    await expect(title.locator(".t-en")).toBeHidden();
    await expect(page.locator(".home-updates-heading .t-jp")).toBeVisible();
    await expect(page.locator(".about-intro-actions .t-jp").first()).toBeVisible();
    await page.locator("#lang-cycle").click();
    await expect(title.locator(".t-en")).toBeVisible();
  });
});

test.describe("Left rail categories — phone", () => {
  test("a chip list is visible without opening Menu; chips are ≥44px and wrap inside 390", async ({ page }, testInfo) => {
    phoneOnly(testInfo);
    await page.goto("/");
    await expect(page.locator("#side-toggle")).toHaveAttribute("aria-expanded", "false");
    const chips = page.locator(".side-cats-phone .side-cat-chip");
    expect(await chips.count()).toBe(5);
    const tops = new Set();
    for (const chip of await chips.all()) {
      await expect(chip).toBeVisible();
      const box = await chip.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
      tops.add(Math.round(box.y));
    }
    expect(tops.size).toBeGreaterThan(1); // wrapped onto more than one row
  });

  test("a chip opens only its category, in the menu", async ({ page }, testInfo) => {
    phoneOnly(testInfo);
    await page.goto("/");
    const chips = page.locator(".side-cats-phone .side-cat-chip");
    await chips.nth(2).click();
    expect(await expanded(chips)).toEqual(["false", "false", "true", "false", "false"]);
    expect(await expanded(page.locator("#side .side-group-header"))).toEqual(["false", "false", "true", "false", "false"]);
    await expect(page.locator("#side")).toHaveClass(/is-open/);
    await expect(page.locator("#side .side-group").nth(2).locator(".side-group-items")).toBeVisible();
  });

  test("arriving on a project opens its category, so Menu shows it", async ({ page }, testInfo) => {
    phoneOnly(testInfo);
    await page.goto("/");
    await page.locator('#main a[href="/projects/resona.html"]:visible').first().click();
    await page.waitForURL(/\/projects\/resona/);
    await expect(page.locator('#side .side-group-header[data-cat="interactive"]')).toHaveAttribute("aria-expanded", "true");
    await page.locator("#side-toggle").click();
    await expect(page.locator('#side .side-item[aria-current="page"][data-cat="interactive"]')).toBeVisible();
  });

  test("the top bar's status line is not clipped behind Menu", async ({ page }, testInfo) => {
    phoneOnly(testInfo);
    await page.goto("/");
    const status = page.locator(".side-top-status");
    await expect(status).toBeVisible();
    const s = await status.boundingBox();
    const m = await page.locator("#side-toggle").boundingBox();
    expect(s.x + s.width).toBeLessThanOrEqual(390);
    expect(s.y).toBeGreaterThanOrEqual(m.y + m.height - 1); // its own row, under the name and Menu
    const clipped = await status.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
    expect(clipped).toBe(false);
  });

  for (const path of ["/", "/about", "/work"]) {
    test(`no horizontal overflow at 390 on ${path}`, async ({ page }, testInfo) => {
      phoneOnly(testInfo);
      await page.goto(path);
      const width = await page.evaluate(() => document.scrollingElement.scrollWidth);
      expect(width).toBeLessThanOrEqual(390);
    });
  }

  test("dark mode: the new About buttons and chips use the dark tokens", async ({ page }, testInfo) => {
    phoneOnly(testInfo);
    await page.goto("/");
    await page.locator("#side-toggle").click();
    await page.locator("#theme-switch").click();
    await page.locator("#side-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    // Polled: colours have short transitions.
    const btn = page.locator(".intro-about");
    await expect.poll(() => btn.evaluate((el) => getComputedStyle(el).color)).toBe("rgb(255, 255, 255)");
    await expect.poll(() => page.locator(".about-intro").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(22, 22, 22)"); // --pr-card, dark
    const chip = page.locator(".side-cat-chip").first();
    await expect.poll(() => chip.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(22, 22, 22)");
  });
});
