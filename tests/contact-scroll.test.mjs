import { test, expect } from "@playwright/test";

test("Contact link should not lock scroll", async ({ page }) => {
  // Visit the home page
  await page.goto("/");

  // Get initial scroll state
  const canScrollBefore = await page.evaluate(() => {
    return document.documentElement.scrollHeight > window.innerHeight;
  });

  // If there's nothing to scroll on home, navigate to a page with content
  if (!canScrollBefore) {
    await page.goto("/about");
  }

  // Verify we can scroll before clicking Contact
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });

  const scrollPosBefore = await page.evaluate(() => window.scrollY);
  expect(scrollPosBefore).toBe(0);

  // Click Contact link
  const contactLink = page.locator('a[href*="work-with-me"]').first();
  await contactLink.click();

  // Wait for navigation and anchor scroll
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  // Try to scroll down
  await page.evaluate(() => {
    window.scrollBy(0, 100);
  });

  // Check if scroll actually moved
  const scrollPosAfter = await page.evaluate(() => window.scrollY);

  // Verify scroll worked (position should have changed, or we're at the element)
  const canScrollNow = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const htmlOverflow = window.getComputedStyle(html).overflow;
    const bodyOverflow = window.getComputedStyle(body).overflow;

    // Log the overflow state for debugging
    console.log("HTML overflow:", htmlOverflow);
    console.log("Body overflow:", bodyOverflow);
    console.log("scrollHeight:", html.scrollHeight);
    console.log("clientHeight:", html.clientHeight);

    // Return false if overflow is hidden on html or body
    if (
      htmlOverflow === "hidden" ||
      bodyOverflow === "hidden"
    ) {
      return false;
    }

    return html.scrollHeight > window.innerHeight;
  });

  expect(canScrollNow).toBe(true);
  console.log(`Scroll before: ${scrollPosBefore}, after click: ${scrollPosAfter}`);
});
