// Generate share cards for the tool pages, which carry no photography of their own.
//
// The card language is deliberately the one those pages already use: a dark field,
// the page's own accent tint, thin-stroke diagram geometry and a monospace label.
// It is NOT the site's DM Serif headline language — that font only exists on a CDN,
// and a serif card set in a substitute face would read as a mistake. Diagram geometry
// is what these pages actually look like, so the card tells the truth about them.
//
// The mark is deterministic: the same slug always produces the same figure.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";

// Playwright is not a dependency of this site — point PLAYWRIGHT_PATH at a global
// install, or npm i -D playwright before running. This script is run by hand when
// a tool page is added or renamed; the cards it writes are committed.
const require_ = createRequire(import.meta.url);
const { chromium } = require_(process.env.PLAYWRIGHT_PATH || "playwright");

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "assets/og");
mkdirSync(OUT, { recursive: true });

const CARDS = [
  { slug: "ai-tools", label: "AI Tools", accent: "#c2870a", kicker: "Open source",
    desc: "Skills and command-line tools built while working with AI every day." },
  { slug: "superforge", label: "superforge", accent: "#0e9bbd", kicker: "Skill system · 14 skills",
    desc: "One sentence in. Fourteen skills carry it from idea to pre-launch check." },
  { slug: "failforward", label: "failforward", accent: "#f97316", kicker: "Debug memory",
    desc: "Bugs are recorded with their root cause, so the same one is never re-solved." },
  { slug: "multilingual-readme", label: "multilingual-readme", accent: "#e04c8a", kicker: "Documentation",
    desc: "A README that speaks every language your readers do." },
  { slug: "cross-model-handoff", label: "cross-model-handoff", accent: "#9061f9", kicker: "Session capsule",
    desc: "Move the work to another model without losing what was decided." },
  { slug: "interactive-experience-skills", label: "interactive-experience", accent: "#16a394", kicker: "Skill set",
    desc: "Experiences where the input is a voice, a hand, or a drawn line." },
  { slug: "snap-pair", label: "Snap Pair", accent: "#4f8ef7", kicker: "Utility",
    desc: "Pair two screenshots into one comparison without opening a design tool." },
];

// FNV-1a — small, deterministic, and enough to vary a figure by name.
const hash = (s) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

// A hub with branches — the shape every one of these tools actually has.
const figure = (slug, accent) => {
  const h = hash(slug);
  const rows = 4 + (h % 2);
  const cx = 664;
  const cy = 315;
  const bx = 880;
  const gap = 68;
  const top = cy - ((rows - 1) * gap) / 2;
  const spine = [`M ${cx + 68} ${cy} L ${bx - 54} ${cy}`];
  const nodes = [];
  for (let i = 0; i < rows; i += 1) {
    const y = top + i * gap;
    const w = 108 + (((h >>> (i * 4)) & 3) * 28);
    spine.push(`M ${bx - 54} ${cy} L ${bx - 54} ${y} L ${bx} ${y}`);
    nodes.push(
      `<rect x="${bx}" y="${y - 16}" width="${w}" height="32" rx="3" fill="none" ` +
      `stroke="${accent}" stroke-opacity="${(0.92 - i * 0.14).toFixed(2)}" stroke-width="1.8"/>`
    );
  }
  return `
    <rect x="${cx - 68}" y="${cy - 33}" width="136" height="66" rx="4"
      fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1.8"/>
    <circle cx="${cx}" cy="${cy}" r="6" fill="${accent}"/>
    <path d="${spine.join(" ")}" fill="none" stroke="${accent}" stroke-opacity="0.55"
      stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    ${nodes.join("\n")}`;
};

const nameSize = (label) => (label.length > 20 ? 46 : label.length > 13 ? 58 : 76);

const page = (c) => `<!doctype html><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1200px;height:630px}
  body{background:#0d0d0f;color:#fff;position:relative;overflow:hidden;
       font-family:ui-monospace,"DejaVu Sans Mono",monospace}
  .glow{position:absolute;right:-10%;top:-44%;width:66%;height:182%;
        background:radial-gradient(ellipse at center, ${c.accent}7a, transparent 66%)}
  svg{position:absolute;inset:0}
  .who{position:absolute;left:76px;top:62px;z-index:2;font-size:14px;
       letter-spacing:.26em;text-transform:uppercase;color:#ffffff7d}
  .in{position:absolute;left:76px;top:50%;transform:translateY(-50%);right:648px;z-index:2}
  .kick{font-size:15px;letter-spacing:.19em;text-transform:uppercase;color:${c.accent};font-weight:700}
  .name{margin-top:18px;font-size:${nameSize(c.label)}px;letter-spacing:-.025em;
        line-height:1.02;font-weight:700}
  .desc{margin-top:24px;font-size:20px;line-height:1.6;color:#ffffffb8;
        font-family:"DejaVu Sans","Liberation Sans",sans-serif}
  .rule{position:absolute;left:76px;bottom:72px;width:112px;height:3px;background:${c.accent}}
  .dom{position:absolute;left:76px;bottom:38px;font-size:14px;letter-spacing:.2em;color:#ffffff66}
</style>
<div class="glow"></div>
<svg viewBox="0 0 1200 630">${figure(c.slug, c.accent)}</svg>
<div class="who">Takao Umehara</div>
<div class="in">
  <div class="kick">${c.kicker}</div>
  <div class="name">${c.label}</div>
  <div class="desc">${c.desc}</div>
</div>
<div class="rule"></div>
<div class="dom">takaoumehara.com</div>`;

const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const c of CARDS) {
  await tab.setContent(page(c), { waitUntil: "load" });
  await tab.screenshot({ path: path.join(OUT, `${c.slug}.jpg`), type: "jpeg", quality: 92 });
  console.log(`wrote assets/og/${c.slug}.jpg`);
}
await browser.close();
