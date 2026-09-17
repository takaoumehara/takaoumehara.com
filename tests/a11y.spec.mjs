// Accessibility, measured in a browser.
//
// axe finds what a scanner can find. The tests after it cover what a scanner
// cannot: that the keyboard can reach the work, that the language switch
// changes the language for a screen reader too, that the sidebar's phone menu
// is a real disclosure, and that the preview clips stay still for a reader who
// asked for no motion.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = [
  ["/", "landing (rendered from src/lenses/default.json)"],
  ["/ja/", "Japanese edition"],
  ["/lens/creative/", "Creative Executive lens"],
  ["/lens/ai-product/", "AI Product lens"],
  ["/interactive.html", "Interactive"],
  ["/ai-products.html", "AI Products"],
  ["/ai-tools.html", "AI Tools"],
  ["/work.html", "Product Design"],
  ["/brand.html", "Brand & Visual"],
  ["/all/", "Work Archive"],
  ["/now/", "Now"],
  ["/about.html", "About"],
  ["/contact.html", "Contact"],
  ["/projects/koji-fizz.html", "a case study (KOJI FIZZ)"],
];

for (const [path, name] of PAGES) {
  test(`${name} has no axe violation at WCAG 2.2 AA`, async ({ page }) => {
    await page.goto(path, { waitUntil: "load" });
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const readable = violations.map((v) =>
      `${v.id} (${v.impact}) — ${v.help}\n      ${v.nodes.slice(0, 4).map((n) => n.target.join(" ")).join("\n      ")}`);
    expect(readable, `${path}\n    ${readable.join("\n    ")}`).toEqual([]);
  });
}

test("the Japanese switch changes the document language, not only the visible text", async ({ page, isMobile }, testInfo) => {
  // Half this site is Japanese behind a toggle. If <html lang> stays "en", a
  // screen reader reads the Japanese with an English voice.
  await page.goto("/", { waitUntil: "load" });
  if (testInfo.project.name === "phone") await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name: "JP" }).click();
  await expect(page.locator("html")).toHaveClass(/lang-jp/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
});

test("every card that opens something can be reached and opened from the keyboard", async ({ page }) => {
  await page.goto("/", { waitUntil: "load" });
  const cards = page.locator("[data-href]");
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    const card = cards.nth(i);
    await expect(card, `card ${i} must be reachable by Tab`).toHaveAttribute("tabindex", "0");
    // A card that is only clickable is invisible to anyone not using a mouse.
    const inner = card.locator("a[href]");
    expect(await inner.count(), `card ${i} needs a real link inside it`).toBeGreaterThan(0);
  }
});

test("the sidebar lists every section of the work, folds all but the current one, and opens on a phone from a button", async ({ page }, testInfo) => {
  await page.goto("/projects/koji-fizz.html", { waitUntil: "load" });
  const side = page.locator("#side");
  const groups = side.locator("details.side-group");
  await expect(groups).toHaveCount(5);
  await expect(side.locator("details.side-group[open]")).toHaveCount(1);
  await expect(side.locator('.side-item[aria-current="page"]')).toHaveCount(1);
  if (testInfo.project.name === "phone") {
    const panel = page.locator("#side-panel");
    await expect(panel).toBeHidden();
    const button = page.getByRole("button", { name: "Menu" });
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toBeVisible();
  } else {
    await expect(page.locator("#side-panel")).toBeVisible();
    // Nothing in the right column may run under the sidebar or past the viewport.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "horizontal overflow").toBeLessThanOrEqual(0);
  }
});

test("the preview clips do not play for a reader who asked for reduced motion", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/interactive.html", { waitUntil: "load" });
  const clips = page.locator("video.card-clip");
  const count = await clips.count();
  for (let i = 0; i < count; i += 1) {
    await expect(clips.nth(i)).toBeHidden();
  }
  await context.close();
});
