// Accessibility, measured in a browser.
//
// Salvaged from `codex/monumental-editorial-redesign`, which had the only real
// a11y coverage in this repository — rewritten here because the pages are not
// the same ones (docs/gemini-studio-salvage-review.md §2-C, architecture §14.2).
//
// axe finds what a scanner can find. The three tests after it cover what a
// scanner cannot: that the keyboard can reach the work, that the language
// switch changes the language for a screen reader too, and that the preview
// clips stay still for a reader who asked for no motion.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = [
  ["/", "landing (generated from src/lenses/default.json)"],
  ["/lens/creative/", "Creative Executive lens"],
  ["/lens/ai-product/", "AI Product lens"],
  ["/interactive.html", "Interactive"],
  ["/ai-products.html", "AI Products"],
  ["/ai-tools.html", "AI Tools"],
  ["/work.html", "Product Design"],
  ["/brand.html", "Brand & Visual"],
  ["/about.html", "About"],
  ["/contact.html", "Contact"],
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

test("the Japanese switch changes the document language, not only the visible text", async ({ page }) => {
  // Half this site is Japanese behind a toggle. If <html lang> stays "en", a
  // screen reader reads the Japanese with an English voice.
  await page.goto("/", { waitUntil: "load" });
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

test("a reader who asked for no motion gets no motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "load" });
  const clips = page.locator("video.card-clip");
  const count = await clips.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) await expect(clips.nth(i)).toBeHidden();
  const card = page.locator(".exp-card").first();
  await card.hover();
  await page.waitForTimeout(1200);
  const playing = await page.evaluate(() => [...document.querySelectorAll("video.card-clip")].some((v) => !v.paused));
  expect(playing, "hovering must not start a clip under prefers-reduced-motion").toBe(false);
});
