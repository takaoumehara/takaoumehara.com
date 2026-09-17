// Screenshot a page with the pre-installed Chromium, for a visual check.
//   node tools/shot.mjs <url> <out.png> [width] [height] [fullPage 0|1]
// Prints any console error the page raised.
import { chromium } from "@playwright/test";
const [url, out, w = "1440", h = "900", full = "0"] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto(url, { waitUntil: "networkidle" });
await page.screenshot({ path: out, fullPage: full === "1" });
console.log("shot", out, errors.length ? "ERRORS: " + errors.join(" | ") : "no console errors");
await browser.close();
