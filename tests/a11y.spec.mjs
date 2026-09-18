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
  ["/publications.html", "Writing"],
  ["/workshop.html", "Workshops"],
  ["/contact.html", "Work with me"],
  ["/work-with-me.html", "Work with me, at its other address"],
  ["/projects/koji-fizz.html", "a case study (KOJI FIZZ)"],
  ["/projects/werewolf.html", "a dark case study (Werewolf)"],
  ["/projects/value-frontier.html", "a bento case study (Value Frontier)"],
  ["/projects/ela-quests.html", "a bento case study with video and embeds (ELA Quests)"],
  ["/projects/resona.html", "a dark bento case study (Resona)"],
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

const PERSON_PAGES = ["/about.html", "/now/", "/publications.html", "/workshop.html", "/contact.html", "/work-with-me.html"];

test("the dark-mode switch reaches every page about the person", async ({ page }) => {
  // It did not. Each of these was a hand-built page that set --bg on :root,
  // which design-system.css's html[data-theme="light"] block beat in light mode
  // and which beat the dark block (it only patches --nav-*) in dark mode — so
  // About, Writing, Workshops and Work with me stayed on paper whatever the
  // switch said. They are bento now, on one set of tokens.
  for (const path of PERSON_PAGES) {
    await page.goto(path, { waitUntil: "load" });
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg, `${path} ignored the dark-mode switch`).toBe("rgb(0, 0, 0)");
  }
});

test("every page about the person opens at the same place, in the same type", async ({ page }) => {
  // The complaint this answers: "なんかこれそれぞれフォーマットが違いますよね".
  const shape = [];
  for (const path of PERSON_PAGES) {
    await page.goto(path, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    shape.push([
      path,
      await page.evaluate(() => {
        const h1 = document.querySelector("h1");
        const box = h1.getBoundingClientRect();
        const style = getComputedStyle(h1);
        return {
          top: Math.round(document.querySelector(".bento-doc > .bento-wrap").getBoundingClientRect().top),
          left: Math.round(box.left),
          size: style.fontSize,
          weight: style.fontWeight,
        };
      }),
    ]);
  }
  const first = JSON.stringify(shape[0][1]);
  for (const [path, box] of shape) {
    expect(JSON.stringify(box), `${path} starts somewhere else than ${shape[0][0]}`).toBe(first);
  }
});

test("the Japanese switch changes the document language, not only the visible text", async ({ page }) => {
  // Half this site is Japanese behind a toggle. If <html lang> stays "en", a
  // screen reader reads the Japanese with an English voice.
  await page.goto("/", { waitUntil: "load" });
  // The landing page has no rail, so no phone menu to open first; every other
  // page keeps the switch behind it.
  const menu = page.getByRole("button", { name: "Menu" });
  if (await menu.count()) await menu.click();
  await page.getByRole("button", { name: "Switch to Japanese" }).click();
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

test("the sidebar lists every section of the work open, marks the current row, and opens on a phone from a button", async ({ page }, testInfo) => {
  await page.goto("/projects/koji-fizz.html", { waitUntil: "load" });
  const side = page.locator("#side");
  // Six folds: the person, then the five categories.
  const groups = side.locator("details.side-group");
  await expect(groups).toHaveCount(6);
  await expect(side.locator("details.side-group[open]")).toHaveCount(6);
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
    await expect(page.getByRole("switch", { name: "Dark mode" })).toHaveAttribute("aria-checked", "false");
    // Nothing in the right column may run under the sidebar or past the viewport.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "horizontal overflow").toBeLessThanOrEqual(0);
  }
});

test("clicking a card brings the rail in, turns its row over, and scrolls to it", async ({ page }, testInfo) => {
  // The whole point of the rail: never lose where you are. This used to fail
  // twice over — the row was a blue word, and astro:after-swap restored the
  // rail's OLD scroll position, so the new row was usually off screen.
  test.skip(testInfo.project.name === "phone", "the rail is a fold-out menu on a phone");
  await page.goto("/", { waitUntil: "load" });
  await expect(page.locator("#side")).toHaveCount(0);

  await page.locator('#work-bento [data-href="/projects/koji-fizz.html"]').first().click();
  await page.waitForURL("**/koji-fizz.html");
  const current = page.locator('#side .side-item[aria-current="page"]');
  await expect(current).toHaveCount(1);
  await expect(current).toBeInViewport();

  // Turned over, not tinted: the row's fill is the ink colour.
  const inverted = await current.evaluate((el) => {
    const row = getComputedStyle(el).backgroundColor;
    const rail = getComputedStyle(document.getElementById("side")).backgroundColor;
    return row !== rail && row !== "rgba(0, 0, 0, 0)";
  });
  expect(inverted, "the current row must read as inverted").toBe(true);

  // Somewhere else entirely in the list, and it follows.
  await page.locator('#side .side-item[href="/projects/resona.html"], #side .side-item[href="/projects/xq.html"]').first().click();
  await page.waitForTimeout(1500);
  await expect(page.locator('#side .side-item[aria-current="page"]')).toHaveCount(1);
  await expect(page.locator('#side .side-item[aria-current="page"]')).toBeInViewport();
});

test("the chips say how much work there is, and jump to it from the keyboard", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "phone", "the rail is a fold-out menu on a phone");
  await page.goto("/about.html", { waitUntil: "load" });
  const chips = page.locator("#side-chips .side-chip");
  await expect(chips).toHaveCount(6); // All work + five categories
  // On a first visit the five folds open one after another; let the rail reach
  // its full height before measuring, or the jump has nowhere to go yet.
  await expect(page.locator("#side details.side-group[open]")).toHaveCount(6);
  await page.waitForFunction(() => {
    const side = document.getElementById("side");
    return side.scrollHeight > side.clientHeight * 3;
  });
  const before = await page.evaluate(() => document.getElementById("side").scrollTop);
  const brand = page.locator('.side-chip[data-jump="brand"]');
  await brand.focus();
  await expect(brand).toBeFocused();
  await brand.press("Enter");
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => document.getElementById("side").scrollTop);
  expect(after, "the chip should move the rail to its group").not.toBe(before);
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
