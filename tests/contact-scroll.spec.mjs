// Test for the Contact scroll bug fix: clicking Contact should close the mobile menu.
// The issue was that the sidebar had `overscroll-behavior: contain` which blocked
// scroll chaining to the page when the rail reached its edge, and the menu close
// handler wasn't catching nested elements within the Contact link.
import { test, expect } from "@playwright/test";

test.describe("Contact functionality", () => {
  test("desktop: Contact link is visible in sidebar", async ({ page, viewport }) => {
    if (viewport.width !== 1440) return;

    await page.goto("/about", { waitUntil: "load" });

    // Contact link should be visible in sidebar footer
    const contactFooterLink = page.locator(".side-foot a[href*='#work-with-me']");
    await expect(contactFooterLink).toBeVisible();
  });

  test("mobile: Contact opens in menu and closes it on click", async ({ page, viewport }) => {
    if (viewport.width !== 390) return;

    await page.goto("/about", { waitUntil: "load" });

    // Open the mobile menu
    const menuToggle = page.locator("#side-toggle");
    await menuToggle.click();

    // Check menu is open
    const sidebar = page.locator("#side");
    await expect(sidebar).toHaveClass(/is-open/);

    // Contact link should be visible in mobile menu
    const contactNavLink = page.locator(".side-nav a[href*='#work-with-me']");
    await expect(contactNavLink).toBeVisible();

    // Click Contact in the mobile menu
    await contactNavLink.click();

    // Wait for menu to close
    await page.waitForTimeout(500);

    // Menu should be closed now
    const menuExpanded = await menuToggle.evaluate(el => el.getAttribute("aria-expanded"));
    expect(menuExpanded).toBe("false");

    // Sidebar should not have is-open class
    const sidebarClasses = await sidebar.evaluate(el => el.className);
    expect(sidebarClasses).not.toMatch(/is-open/);
  });
});
