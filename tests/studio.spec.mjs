// Real-browser check of the Studio: the engine runs in the page on the same
// modules the build uses, the preview is the rendered lens, and the guard
// catches an invented number before it can be published.
import { test, expect } from "@playwright/test";

test.describe("Studio", () => {
  test("paste a posting → proof, ledger, preview; an invented number is caught", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/studio/", { waitUntil: "load" });
    await expect(page.locator("#status")).toContainText("records loaded", { timeout: 15000 });
    await page.click("#sample");
    await expect(page.locator("#jd")).not.toHaveValue("");
    await expect(page.locator("#company")).toHaveValue("Stripe");
    await page.click("#analyze");
    await expect(page.locator("#result")).toBeVisible();
    await expect(page.locator("#proof .st-item")).toHaveCount(5);
    expect(await page.locator("#ledger .st-item").count()).toBeGreaterThanOrEqual(5);
    await expect(page.locator("#errors .st-ok")).toBeVisible();
    const frame = page.frameLocator("#preview");
    await expect(frame.locator("#proof .proof-card")).toHaveCount(5, { timeout: 10000 });
    await expect(frame.locator("#fit .fit-row").first()).toBeVisible();
    await expect(page.locator("#publish")).toBeDisabled();

    const body = page.locator("#copy textarea").nth(4);
    await body.fill("I led 400 designers.");
    await expect(page.locator("#errors li").first()).toContainText("Claim Guard");
    await expect(page.locator("#publish")).toBeDisabled();
    expect(errors, errors.join("\n")).toEqual([]);
  });
});
