// Real-browser audit of every /projects/<slug>.html page (src/case-studies/*.html).
//   npx astro dev --port 4173 --host 127.0.0.1 &
//   node tools/pdp-audit.mjs [slug ...]
// Reports: failed requests, console errors, broken / invisible images and videos,
// oversized media, off-brand fonts, low-contrast text, and horizontal overflow.
import { chromium } from "@playwright/test";
import { readdirSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = "http://127.0.0.1:4173";
const root = resolve(new URL("..", import.meta.url).pathname);
const only = process.argv.slice(2);
const pages = readdirSync(resolve(root, "src", "case-studies"))
  .filter((f) => f.endsWith(".html"))
  .filter((f) => !only.length || only.includes(f.replace(/\.html$/, "")));
const shotDir = resolve(root, ".audit");
mkdirSync(shotDir, { recursive: true });

const lum = ([r, g, b]) => {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
let problems = 0;

for (const file of pages) {
  const failed = [];
  const errors = [];
  // Media range requests the browser cancels itself and the optional prototype API are not page bugs.
  const ignorable = (url, err) => (err === "net::ERR_ABORTED" && /\.(mp4|webm|mov)(\?|$)/.test(url)) || url.endsWith("/api/tts/status");
  const onReq = (r) => { const err = r.failure()?.errorText; if (!ignorable(r.url(), err)) failed.push(`${err} ${r.url()}`); };
  const onRes = (r) => { if (r.status() >= 400 && !ignorable(r.url())) failed.push(`${r.status()} ${r.url()}`); };
  const onErr = (e) => errors.push(e.message.split("\n")[0]);
  const onCon = (m) => { if (m.type() === "error" && !m.text().includes("Permissions policy violation")) errors.push(m.text().split("\n")[0]); };
  page.on("requestfailed", onReq); page.on("response", onRes); page.on("pageerror", onErr); page.on("console", onCon);

  await page.goto(`${BASE}/projects/${file}`, { waitUntil: "load" });
  await page.waitForTimeout(400);
  // scroll through the page so lazy/observer-driven media get a chance to reveal
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
    window.scrollTo(0, 0);
    for (const i of document.images) i.loading = "eager";
    await Promise.race([
      Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.addEventListener("load", r, { once: true }); i.addEventListener("error", r, { once: true }); })))),
      new Promise((r) => setTimeout(r, 20000)),
    ]);
  });
  await page.waitForTimeout(300);

  const report = await page.evaluate(() => {
    const out = { imgs: [], videos: [], oversized: [], fonts: new Map(), contrast: [], overflow: false, title: document.title };
    const vis = (el) => {
      let e = el;
      while (e && e !== document.documentElement) {
        const cs = getComputedStyle(e);
        if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) return false;
        e = e.parentElement;
      }
      return true;
    };
    const parseA = (c) => { const m = c.match(/[\d.]+/g); if (!m) return null; const a = m.length > 3 ? parseFloat(m[3]) : 1; return { rgb: m.slice(0, 3).map(Number), a }; };
    const parse = (c) => { const p = parseA(c); return p && p.a > 0 ? p.rgb : null; };
    const blend = (top, a, under) => top.map((v, i) => Math.round(v * a + under[i] * (1 - a)));
    const bgOf = (el) => {
      const layers = [];
      let e = el;
      while (e) {
        const cs = getComputedStyle(e);
        const c = parseA(cs.backgroundColor);
        if (c && c.a > 0) {
          layers.push(c);
          if (c.a >= 1) break;
        }
        if (cs.backgroundImage !== "none") return "image";
        e = e.parentElement;
      }
      let bg = [255, 255, 255];
      for (let i = layers.length - 1; i >= 0; i--) bg = blend(layers[i].rgb, layers[i].a, bg);
      return bg;
    };
    const opacityOf = (el) => { let o = 1, e = el; while (e && e !== document.documentElement) { o *= parseFloat(getComputedStyle(e).opacity); e = e.parentElement; } return o; };
    out.overflow = document.documentElement.scrollWidth > window.innerWidth + 2;
    const inScroller = (el) => { for (let e = el.parentElement; e; e = e.parentElement) { const o = getComputedStyle(e).overflowY; if (o === "auto" || o === "scroll") return true; } return false; };
    for (const img of document.querySelectorAll("img")) {
      if (!img.getAttribute("src")) continue; // lightbox placeholders get a src on open
      const r = img.getBoundingClientRect();
      const inLayout = r.width > 0 && r.height > 0;
      if (!img.complete || img.naturalWidth === 0) out.imgs.push(`BROKEN ${img.getAttribute("src")}`);
      else if (inLayout && !vis(img)) out.imgs.push(`INVISIBLE ${img.getAttribute("src")}`);
      if (r.height > window.innerHeight * 1.05 && !inScroller(img)) out.oversized.push(`img ${Math.round(r.width)}x${Math.round(r.height)} ${img.getAttribute("src")}`);
    }
    for (const v of document.querySelectorAll("video")) {
      const r = v.getBoundingClientRect();
      const srcs = [v.getAttribute("src"), ...[...v.querySelectorAll("source")].map((s) => s.getAttribute("src"))].filter(Boolean);
      if (v.error || v.networkState === 3) out.videos.push(`BROKEN ${srcs.join(",")}`);
      else if (r.width > 0 && !vis(v)) out.videos.push(`INVISIBLE ${srcs.join(",")}`);
      if (r.height > window.innerHeight * 1.05) out.oversized.push(`video ${Math.round(r.width)}x${Math.round(r.height)} ${srcs[0]}`);
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    let n;
    while ((n = walker.nextNode())) {
      const t = n.textContent.trim();
      if (t.length < 3) continue;
      const el = n.parentElement;
      if (!el || ["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(el.tagName)) continue;
      if (!vis(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const cs = getComputedStyle(el);
      const fam = cs.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
      out.fonts.set(fam, (out.fonts.get(fam) || 0) + 1);
      const bg = bgOf(el);
      const fgA = parseA(cs.color);
      if (!fgA || fgA.a === 0 || bg === "image") continue;
      const fg = blend(fgA.rgb, fgA.a * opacityOf(el), bg);
      const key = `${cs.color}|${bg}|${el.className}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.contrast.push({ fg, bg, size: parseFloat(cs.fontSize), text: t.slice(0, 50), sel: `${el.tagName.toLowerCase()}${el.className ? "." + String(el.className).split(" ")[0] : ""}` });
    }
    out.fonts = [...out.fonts.entries()];
    out.liveSrcs = [...document.querySelectorAll("img[src]")].map((i) => i.currentSrc || i.src);
    return out;
  });

  const lowContrast = report.contrast
    .map((c) => ({ ...c, ratio: ratio(c.fg, c.bg) }))
    .filter((c) => c.ratio < (c.size >= 24 ? 3 : 4.5))
    .filter((c) => c.ratio < 3.5 || c.size < 24);
  const badFonts = report.fonts.filter(([f]) => !/^(Outfit|SF Mono|Menlo|Newsreader|EB Garamond|monospace|ui-monospace|serif)$/i.test(f));

  // A 404 image that an onerror fallback removed from the DOM is degraded gracefully, not broken.
  const handled404 = (f) => { const m = f.match(/^404 (\S+\.(?:jpe?g|png|gif|webp|svg|avif))$/i); return m && !report.liveSrcs.includes(m[1]); };
  const lines = [];
  for (const f of failed) if (!handled404(f)) lines.push(`  404/fail: ${f}`);
  for (const e of errors) if (!(e.includes("404") && failed.every(handled404))) lines.push(`  jserr: ${e}`);
  for (const i of report.imgs) lines.push(`  img: ${i}`);
  for (const v of report.videos) lines.push(`  video: ${v}`);
  for (const o of report.oversized) lines.push(`  oversized: ${o}`);
  if (badFonts.length) lines.push(`  fonts: ${badFonts.map(([f, c]) => `${f}(${c})`).join(", ")}`);
  for (const c of lowContrast) lines.push(`  contrast ${c.ratio.toFixed(2)} ${c.sel} fg=${c.fg} bg=${c.bg} "${c.text}"`);
  if (report.overflow) lines.push("  horizontal overflow");

  await page.screenshot({ path: resolve(shotDir, file.replace(".html", ".png")), fullPage: true });
  console.log(`${lines.length ? "✗" : "✓"} ${file}  fonts=${report.fonts.map(([f, c]) => `${f}:${c}`).join(" ")}`);
  for (const l of lines) console.log(l);
  problems += lines.length;

  page.off("requestfailed", onReq); page.off("response", onRes); page.off("pageerror", onErr); page.off("console", onCon);
}
await browser.close();
console.log(`\n${problems} issue lines across ${pages.length} pages`);
