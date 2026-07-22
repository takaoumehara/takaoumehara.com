# AI Tools & Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bilingual AI Tools & Infrastructure portfolio section and dedicated page that make Takao's applied AI systems capability immediately legible, while moving `cross-model-handoff` out of AI Products.

**Architecture:** Keep the v3 site dependency-free and static: inline page CSS, semantic HTML, and the existing localStorage-backed EN/JP switch. Add one focused `ai-tools.html` page, one editorial homepage section, and a built-in Node test that treats page structure, copy, links, navigation, classification, and accessibility affordances as a regression contract.

**Tech Stack:** Static HTML5, inline CSS, vanilla JavaScript, Node.js 22 built-in `node:test`, local `python3 -m http.server`, existing Geist Sans / DM Serif Display / Noto Sans JP typography.

## Global Constraints

- The binding spec is `docs/superpowers/specs/2026-07-20-ai-tools-infrastructure-design.md`; do not broaden or reinterpret it during implementation.
- Section and page title must be exactly `AI Tools & Infrastructure`; primary navigation label must be exactly `AI Tools`.
- Homepage order must be `Selected Work` → `AI Tools & Infrastructure` → `AI Products`.
- Preserve the existing warm-neutral palette, editorial typography, thin rules, and restrained 5-3C'02 Rich hover language.
- Every new visitor-facing sentence must have EN and JP variants using the existing `.t-en`, `.t-jp`, and `.t-jp.is-block` convention.
- Do not claim adoption, production usage, performance, or business outcomes not documented by the repositories.
- External GitHub links must use `target="_blank"`, `rel="noopener"`, and a descriptive accessible label; no essential information may depend on hover or animation.
- Wide project rows must become a single-column reading order below `768px`; keyboard focus must be visible; `prefers-reduced-motion` must disable new motion.
- Do not add dependencies, screenshots, analytics, deployment work, repository changes, or a visual-system redesign.
- This workspace is not a Git repository: do not run or add commit steps.

## File Map

- Create `tests/ai-tools-portfolio.test.mjs`: dependency-free structural, copy, classification, navigation, link, and accessibility contract tests.
- Create `v3/ai-tools.html`: dedicated bilingual portfolio page for both open-source systems.
- Modify `v3/index.html`: add the editorial homepage section, its styles, the nav item, and remove the old `cross-model-handoff` AI Product card.
- Modify `v3/ai-products.html`: remove `cross-model-handoff`, change the displayed count from 12 to 11, and add the nav item.
- Modify `v3/work.html`, `v3/about.html`, `v3/contact.html`, `v3/breakbias.html`, `v3/intentfirst.html`, `v3/404.html`: add `AI Tools` to the current top-level primary nav. Archived `index-grad.html`, `index-v1.html`, and `index-v53.html`, and project-detail navigation are not main-page scope.

---

### Task 1: Add the static portfolio contract

**Files:**
- Create: `tests/ai-tools-portfolio.test.mjs`

**Interfaces:**
- Consumes: the approved spec and current `v3/*.html` files.
- Produces: named Node tests that later tasks can run independently with `--test-name-pattern`.

- [ ] **Step 1: Create the failing contract test**

Use `apply_patch` to create `tests/ai-tools-portfolio.test.mjs` with this complete content:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const v3 = join(root, 'v3');
const read = (name) => readFileSync(join(v3, name), 'utf8');
const count = (source, needle) => source.split(needle).length - 1;

const mainPages = [
  'index.html',
  'work.html',
  'ai-tools.html',
  'ai-products.html',
  'about.html',
  'contact.html',
  'breakbias.html',
  'intentfirst.html',
  '404.html',
];

test('homepage presents AI Tools between Selected Work and AI Products', () => {
  const html = read('index.html');
  const selected = html.indexOf('id="selected-work"');
  const tools = html.indexOf('id="ai-tools"');
  const products = html.indexOf('id="ai-products"');

  assert.ok(selected >= 0, 'Selected Work needs id="selected-work"');
  assert.ok(tools > selected, 'AI Tools must follow Selected Work');
  assert.ok(products > tools, 'AI Products must follow AI Tools');
  assert.match(html, /AI Tools &amp; Infrastructure/);
  assert.match(html, /AIエージェントと働く人のための、ツール・スキル・基盤を設計し、実装しています。/);
  assert.match(html, /Carry AI coding work across tools without rebuilding context\./);
  assert.match(html, /Turn many phones into one live, shared experience—without an app install\./);
  assert.match(html, /href="ai-tools\.html#cross-model-handoff"/);
  assert.match(html, /href="ai-tools\.html#snap-pair-core"/);
  assert.match(html, /href="ai-tools\.html"[^>]*>[\s\S]*Explore AI tools →/);
});

test('dedicated page tells two bilingual, evidence-based project stories', () => {
  assert.ok(existsSync(join(v3, 'ai-tools.html')), 'v3/ai-tools.html must exist');
  const html = read('ai-tools.html');

  assert.match(html, /<title>AI Tools &amp; Infrastructure — Takao Umehara<\/title>/);
  assert.match(html, /<h1[^>]*>[\s\S]*AI Tools &amp; Infrastructure[\s\S]*<\/h1>/);
  assert.equal(count(html, '<article class="tool-story"'), 2);
  assert.match(html, /id="cross-model-handoff"/);
  assert.match(html, /id="snap-pair-core"/);
  assert.match(html, /Agent workflow · Plugin · Skill system/);
  assert.match(html, /Realtime infrastructure · React · Firebase · Agent skill/);
  assert.match(html, /Claude Code, Codex, Gemini CLI, Antigravity, Cursor/);
  assert.match(html, /five-language documentation/);
  assert.match(html, /rooms up to 300 participants/);
  assert.match(html, /QR or six-character pairing/);
  assert.match(html, /emulator and production paths/);
  assert.equal(count(html, 'class="story-label"><span class="t-en">Problem</span>'), 2);
  assert.equal(count(html, 'class="story-label"><span class="t-en">System</span>'), 2);
  assert.equal(count(html, 'class="story-label"><span class="t-en">Evidence</span>'), 2);
  assert.match(html, /href="https:\/\/github\.com\/takaoumehara\/cross-model-handoff"[^>]*target="_blank"[^>]*rel="noopener"[^>]*aria-label="View cross-model-handoff on GitHub \(opens in a new tab\)"/);
  assert.match(html, /href="https:\/\/github\.com\/takaoumehara\/snap-pair-core"[^>]*target="_blank"[^>]*rel="noopener"[^>]*aria-label="View snap-pair-core on GitHub \(opens in a new tab\)"/);
});

test('cross-model-handoff is classified only under AI Tools', () => {
  const home = read('index.html');
  const products = read('ai-products.html');
  const tools = read('ai-tools.html');

  assert.doesNotMatch(products, /cross-model-handoff/);
  assert.match(products, /<div class="page-count">11 products<\/div>/);
  assert.equal(count(home, 'cross-model-handoff'), 2, 'homepage row: anchor plus visible name');
  assert.match(tools, /id="cross-model-handoff"/);
});

test('all main-page navs expose AI Tools without losing existing destinations', () => {
  for (const page of mainPages) {
    const html = read(page);
    const nav = html.match(/<ul class="nav-links">([\s\S]*?)<\/ul>/)?.[1] ?? '';
    assert.match(nav, /href="ai-tools\.html"/, `${page}: missing AI Tools nav link`);
    assert.match(nav, />AI Tools<\/a>/, `${page}: wrong AI Tools nav label`);
    assert.match(nav, /href="work\.html"/, `${page}: Work link was lost`);
    assert.match(nav, /href="ai-products\.html"/, `${page}: AI Products link was lost`);
    assert.match(nav, /href="about\.html"/, `${page}: About link was lost`);
    assert.match(nav, /href="contact\.html"/, `${page}: Contact link was lost`);
  }

  const activeNav = read('ai-tools.html').match(/<ul class="nav-links">([\s\S]*?)<\/ul>/)?.[1] ?? '';
  assert.match(activeNav, /href="ai-tools\.html" class="is-active" aria-current="page">AI Tools<\/a>/);
});

test('new UI has bilingual hooks, focus styles, mobile rows, and reduced-motion fallback', () => {
  for (const page of ['index.html', 'ai-tools.html']) {
    const html = read(page);
    assert.match(html, /class="t-en"/);
    assert.match(html, /class="t-jp(?: is-block)?"/);
    assert.match(html, /:focus-visible/);
    assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
  }

  const tools = read('ai-tools.html');
  assert.match(tools, /@media \(max-width: 767px\)[\s\S]*\.tool-story[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(tools, /const saved = localStorage\.getItem\("tu-lang"\) \|\| "en"/);
  assert.match(tools, /document\.querySelector\('\.nav-links'\)/);
});

test('new internal HTML links resolve to files and optional fragments', () => {
  for (const page of ['index.html', 'ai-tools.html']) {
    const html = read(page);
    const hrefs = [...html.matchAll(/href="([^"#]+\.html)(#[^"]+)?"/g)];
    for (const [, target, fragment] of hrefs) {
      const targetPath = join(v3, target);
      assert.ok(existsSync(targetPath), `${page}: missing ${target}`);
      if (fragment) {
        const targetHtml = read(target);
        assert.match(targetHtml, new RegExp(`id="${fragment.slice(1)}"`), `${page}: missing ${target}${fragment}`);
      }
    }
  }
});
```

- [ ] **Step 2: Run the suite and verify the intended red state**

Run:

```bash
node --test tests/ai-tools-portfolio.test.mjs
```

Expected: FAIL. The first relevant failures must report missing `id="ai-tools"`, missing `v3/ai-tools.html`, the old `cross-model-handoff` entry in `ai-products.html`, and missing `AI Tools` nav links. Syntax errors or fixture-path errors are not an acceptable red state.

---

### Task 2: Build the homepage section and dedicated project-story page

**Files:**
- Modify: `v3/index.html:635-738` (section-specific CSS), `v3/index.html:892-949` (responsive/focus/reduced-motion additions), `v3/index.html:1025-1030` (nav), `v3/index.html:1061` and `v3/index.html:1246-1346` (section IDs, new section, AI Product cleanup).
- Create: `v3/ai-tools.html`
- Test: `tests/ai-tools-portfolio.test.mjs`

**Interfaces:**
- Consumes: existing `.section-head`, `.section-title`, `.section-link`, `--line`, `--surface`, `--ink*`, and `--t1`–`--t4` tokens.
- Produces: `#selected-work`, `#ai-tools`, `#ai-products`, internal project anchors, homepage `.tools-*` styles, and a complete bilingual `ai-tools.html` with two project stories.

- [ ] **Step 1: Mark the existing section landmarks and add the nav destination**

Use `apply_patch` to make these exact start-tag and nav changes:

```html
<section class="work-section" id="selected-work">
```

```html
<ul class="nav-links">
  <li><a href="work.html">Work</a></li>
  <li><a href="ai-tools.html">AI Tools</a></li>
  <li><a href="ai-products.html">AI Products</a></li>
  <li><a href="about.html">About</a></li>
  <li><a href="contact.html">Contact</a></li>
</ul>
```

Change the existing AI Products start tag to:

```html
<section class="ai-section" id="ai-products">
```

- [ ] **Step 2: Add the homepage section markup between Selected Work and AI Products**

Insert this exact block after the closing `</section>` for `#selected-work` and before `<!-- ── AI Products ── -->`:

```html
<!-- ── AI Tools & Infrastructure ── -->
<section class="tools-section" id="ai-tools" aria-labelledby="ai-tools-title">
  <div class="section-head tools-head">
    <div>
      <h2 class="section-title" id="ai-tools-title">AI Tools &amp; Infrastructure</h2>
      <p class="tools-intro">
        <span class="t-en">I design and build practical tools, skills, and systems for people working with AI agents.</span>
        <span class="t-jp is-block">AIエージェントと働く人のための、ツール・スキル・基盤を設計し、実装しています。</span>
      </p>
    </div>
    <a href="ai-tools.html" class="section-link">
      <span class="t-en">Explore AI tools →</span>
      <span class="t-jp">AI ツールを見る →</span>
    </a>
  </div>

  <div class="tools-list">
    <article class="tools-row">
      <div class="tools-primary">
        <p class="tools-index" aria-hidden="true">01</p>
        <h3 class="tools-name">cross-model-handoff</h3>
        <p class="tools-outcome">
          <span class="t-en">Carry AI coding work across tools without rebuilding context.</span>
          <span class="t-jp is-block">AI コーディングの文脈を作り直さず、ツールをまたいで作業を引き継ぐ。</span>
        </p>
      </div>
      <div class="tools-meta">
        <p class="tools-classification">Agent workflow · Plugin · Skill system</p>
        <p class="tools-stack">AGENTS.md · Claude Code hooks · Markdown</p>
        <a href="ai-tools.html#cross-model-handoff" class="tools-link">
          <span class="t-en">View project →</span><span class="t-jp">プロジェクトを見る →</span>
        </a>
      </div>
    </article>

    <article class="tools-row">
      <div class="tools-primary">
        <p class="tools-index" aria-hidden="true">02</p>
        <h3 class="tools-name">snap-pair-core</h3>
        <p class="tools-outcome">
          <span class="t-en">Turn many phones into one live, shared experience—without an app install.</span>
          <span class="t-jp is-block">アプリをインストールせず、何台ものスマートフォンをひとつのライブ体験につなぐ。</span>
        </p>
      </div>
      <div class="tools-meta">
        <p class="tools-classification">Realtime infrastructure · React · Firebase · Agent skill</p>
        <p class="tools-stack">Firebase Auth · Cloud Functions · Realtime Database</p>
        <a href="ai-tools.html#snap-pair-core" class="tools-link">
          <span class="t-en">View project →</span><span class="t-jp">プロジェクトを見る →</span>
        </a>
      </div>
    </article>
  </div>
</section>
```

- [ ] **Step 3: Add the restrained editorial styles**

Insert the following complete style block immediately before the existing `/* ─── AI Products section ─── */` block:

```css
/* ─── AI Tools & Infrastructure ─── */
.tools-section {
  padding: 78px 0 86px;
  border-top: 1px solid var(--line);
}
.tools-head { align-items: flex-end; }
.tools-head > div { max-width: 720px; }
.tools-intro {
  margin-top: 18px;
  max-width: 680px;
  font-size: 16px;
  line-height: 1.7;
  color: var(--ink-mid);
}
.tools-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
  border-top: 1px solid var(--line);
}
.tools-row {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.28fr) minmax(260px, 0.72fr);
  gap: clamp(32px, 7vw, 104px);
  padding: 38px 0 42px;
  border-bottom: 1px solid var(--line);
}
.tools-row:nth-child(2) {
  grid-template-columns: minmax(0, 0.92fr) minmax(300px, 1.08fr);
}
.tools-row::before {
  content: "";
  position: absolute;
  top: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, var(--t1), var(--t2), var(--t3), var(--t4));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 460ms cubic-bezier(0.22, 0.84, 0.22, 1);
}
.tools-row:hover::before,
.tools-row:focus-within::before { transform: scaleX(1); }
.tools-index {
  margin-bottom: 22px;
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--ink-dim);
}
.tools-name {
  font-family: "DM Serif Display", Georgia, serif;
  font-size: clamp(28px, 3.4vw, 46px);
  font-weight: 400;
  letter-spacing: -0.025em;
  line-height: 1;
}
.tools-outcome {
  margin-top: 16px;
  max-width: 650px;
  font-size: clamp(17px, 1.8vw, 22px);
  line-height: 1.45;
  color: var(--ink-mid);
}
.tools-meta {
  align-self: end;
  display: grid;
  gap: 12px;
}
.tools-classification {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink);
}
.tools-stack {
  font-size: 12px;
  line-height: 1.55;
  color: var(--ink-dim);
}
.tools-link {
  justify-self: start;
  margin-top: 10px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-mid);
  text-decoration: none;
  transition: color 160ms ease, transform 240ms ease;
}
.tools-link:hover { color: var(--ink); transform: translateX(3px); }
.tools-link:focus-visible,
.tools-head .section-link:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 4px;
}
```

Extend the responsive and reduced-motion blocks with:

```css
@media (max-width: 767px) {
  .tools-head { align-items: flex-start; }
  .tools-list { padding: 0 20px; }
  .tools-row,
  .tools-row:nth-child(2) {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 32px 0 36px;
  }
  .tools-meta { align-self: auto; }
}

@media (prefers-reduced-motion: reduce) {
  .tools-row::before,
  .tools-link { transition: none !important; }
  .tools-link:hover { transform: none; }
}
```

- [ ] **Step 4: Remove the duplicate homepage AI Product card**

Delete the entire existing `<a ... class="ai-card">` block whose visible name is `cross-model-handoff` (currently `v3/index.html:1279-1290`). Leave `failforward`, MyBrainSpec, BreakBias Studio, Typespace, and Verizon AI Workflow unchanged.

- [ ] **Step 5: Run the homepage contract**

Run:

```bash
node --test --test-name-pattern="homepage presents" tests/ai-tools-portfolio.test.mjs
```

Expected: PASS, one matching test passed and the other tests skipped.

Run:

```bash
rg -n "id=\"selected-work\"|id=\"ai-tools\"|id=\"ai-products\"|cross-model-handoff" v3/index.html
```

Expected: landmark IDs appear in that order; `cross-model-handoff` appears only in the new AI Tools row (once in the visible name and once in its fragment URL).

---

#### Task 2B: Complete the dedicated project-story page

**Files:**
- Create: `v3/ai-tools.html`
- Test: `tests/ai-tools-portfolio.test.mjs`

**Interfaces:**
- Consumes: the same tokens, nav, fixed language switch, footer presentation, and mobile-menu behavior already used by `v3/ai-products.html`.
- Produces: fragment targets `#cross-model-handoff` and `#snap-pair-core`, two GitHub CTAs, bilingual Problem/System/Evidence stories, and the active `AI Tools` nav state.

- [ ] **Step 1: Create the complete page shell and metadata**

Use `apply_patch` to create `v3/ai-tools.html`. Its head must contain these exact metadata values and the same font imports / `@font-face` declarations as `v3/ai-products.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <title>AI Tools &amp; Infrastructure — Takao Umehara</title>
  <meta name="description" content="Open-source AI agent workflows and realtime infrastructure designed and built by Takao Umehara: cross-model-handoff and snap-pair-core.">
  <meta property="og:title" content="AI Tools &amp; Infrastructure — Takao Umehara">
  <meta property="og:description" content="Practical tools, skills, and systems for people working with AI agents.">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&amp;family=Noto+Sans+JP:wght@400;500;600&amp;display=swap" rel="stylesheet">
```

Use the existing v3 token values without modification (`--bg`, `--ink`, `--ink-mid`, `--ink-dim`, `--line`, `--border`, `--surface`, `--shadow`, `--ff`, `--ff-jp`, `--t1`–`--t4`). Copy the existing `.site-nav`, `.nav-logo*`, `.nav-links`, `.nav-toggle`, `.lang-switch`, `.lang-btn`, `.t-en` / `.t-jp`, and base `body` rules from `v3/ai-products.html` into this page so the new route behaves like the other top-level routes.

- [ ] **Step 2: Add the dedicated-page styles**

After the shared rules, add this complete page-specific CSS:

```css
.tools-hero {
  max-width: 1200px;
  margin: 0 auto;
  padding: 72px 32px 64px;
  border-bottom: 1px solid var(--line);
}
.tools-eyebrow {
  margin-bottom: 14px;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-dim);
}
.tools-title {
  max-width: 900px;
  font-family: "DM Serif Display", Georgia, serif;
  font-size: clamp(44px, 7vw, 84px);
  font-weight: 400;
  letter-spacing: -0.04em;
  line-height: 0.94;
}
.tools-positioning {
  max-width: 720px;
  margin-top: 28px;
  font-size: clamp(17px, 2vw, 21px);
  line-height: 1.65;
  color: var(--ink-mid);
}
.stories {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px 72px;
}
.tool-story {
  display: grid;
  grid-template-columns: minmax(260px, 0.72fr) minmax(0, 1.28fr);
  gap: clamp(42px, 8vw, 120px);
  padding: 76px 0 82px;
  border-bottom: 1px solid var(--line);
  scroll-margin-top: 84px;
}
.tool-story:nth-child(2) {
  grid-template-columns: minmax(0, 1.12fr) minmax(280px, 0.88fr);
}
.story-summary { position: sticky; top: 96px; align-self: start; }
.story-number {
  margin-bottom: 18px;
  font-size: 10px;
  letter-spacing: 0.18em;
  color: var(--ink-dim);
}
.story-name {
  font-family: "DM Serif Display", Georgia, serif;
  font-size: clamp(34px, 4.2vw, 58px);
  font-weight: 400;
  letter-spacing: -0.03em;
  line-height: 0.98;
  overflow-wrap: anywhere;
}
.story-outcome {
  margin-top: 18px;
  font-size: 17px;
  line-height: 1.58;
  color: var(--ink-mid);
}
.story-classification {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  font-size: 11px;
  line-height: 1.6;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-dim);
}
.story-details { display: grid; gap: 0; }
.story-section {
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  gap: 24px;
  padding: 24px 0;
  border-top: 1px solid var(--line);
}
.story-section:first-child { border-top: 0; padding-top: 0; }
.story-label {
  padding-top: 3px;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-dim);
}
.story-copy {
  font-size: 15px;
  line-height: 1.76;
  color: var(--ink-mid);
}
.story-cta {
  justify-self: start;
  display: inline-block;
  margin-top: 28px;
  padding: 13px 18px;
  border: 1px solid var(--ink);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink);
  text-decoration: none;
  transition: background 180ms ease, color 180ms ease, transform 240ms ease;
}
.story-cta:hover { background: var(--ink); color: #fff; transform: translateY(-2px); }
.story-cta:focus-visible,
.nav-links a:focus-visible,
.nav-logo:focus-visible,
.lang-btn:focus-visible,
.nav-toggle:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 4px;
}
.site-footer {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}
.footer-logo { font-size: 15px; font-weight: 600; letter-spacing: -0.018em; }
.footer-llc { margin-top: 5px; font-size: 11px; color: var(--ink-dim); }
.footer-links { display: flex; gap: 24px; list-style: none; flex-wrap: wrap; }
.footer-links a { font-size: 12px; color: var(--ink-dim); text-decoration: none; }
html.lang-jp .tools-title,
html.lang-jp .story-name { line-height: 1.14; }

@media (max-width: 767px) {
  .site-nav, .tools-hero, .stories, .site-footer { padding-left: 20px; padding-right: 20px; }
  .tools-hero { padding-top: 54px; padding-bottom: 48px; }
  .tool-story,
  .tool-story:nth-child(2) {
    grid-template-columns: 1fr;
    gap: 40px;
    padding: 56px 0 60px;
  }
  .story-summary { position: static; }
  .story-section { grid-template-columns: 1fr; gap: 9px; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .story-cta { transition: none !important; }
  .story-cta:hover { transform: none; }
}
```

- [ ] **Step 3: Add the semantic bilingual page body**

Use this exact body content after the opening `<body>`:

```html
<nav class="site-nav" aria-label="Primary navigation">
  <a href="index.html" class="nav-logo">
    <span class="nav-logo-name">Takao Umehara</span>
    <span class="nav-logo-tag">creativity is everywhere</span>
  </a>
  <ul class="nav-links">
    <li><a href="work.html">Work</a></li>
    <li><a href="ai-tools.html" class="is-active" aria-current="page">AI Tools</a></li>
    <li><a href="ai-products.html">AI Products</a></li>
    <li><a href="about.html">About</a></li>
    <li><a href="contact.html">Contact</a></li>
  </ul>
  <button class="nav-toggle" id="nav-toggle" type="button" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
</nav>

<div class="lang-switch" id="lang-switch" aria-label="Language">
  <button class="lang-btn is-active" type="button" data-lang="en">EN</button>
  <span class="lang-sep" aria-hidden="true">|</span>
  <button class="lang-btn" type="button" data-lang="jp">JP</button>
</div>

<main>
  <header class="tools-hero">
    <p class="tools-eyebrow">Designed &amp; built by Takao</p>
    <h1 class="tools-title">AI Tools &amp; Infrastructure</h1>
    <p class="tools-positioning">
      <span class="t-en">I design and build practical tools, skills, and systems for people working with AI agents.</span>
      <span class="t-jp is-block">AIエージェントと働く人のための、ツール・スキル・基盤を設計し、実装しています。</span>
    </p>
  </header>

  <div class="stories">
    <article class="tool-story" id="cross-model-handoff" aria-labelledby="cross-model-handoff-title">
      <header class="story-summary">
        <p class="story-number" aria-hidden="true">01</p>
        <h2 class="story-name" id="cross-model-handoff-title">cross-model-handoff</h2>
        <p class="story-outcome">
          <span class="t-en">Carry AI coding work across tools without rebuilding context.</span>
          <span class="t-jp is-block">AI コーディングの文脈を作り直さず、ツールをまたいで作業を引き継ぐ。</span>
        </p>
        <p class="story-classification">Agent workflow · Plugin · Skill system</p>
      </header>
      <div class="story-details">
        <section class="story-section">
          <h3 class="story-label"><span class="t-en">Problem</span><span class="t-jp">課題</span></h3>
          <p class="story-copy"><span class="t-en">Switching AI coding tools or clearing context forces people to explain the work again and loses running state that source control cannot capture.</span><span class="t-jp is-block">AI コーディングツールを切り替えたり、コンテキストを消去したりするたびに、作業の背景を説明し直し、ソース管理では残せない実行中の状態まで失ってしまいます。</span></p>
        </section>
        <section class="story-section">
          <h3 class="story-label"><span class="t-en">System</span><span class="t-jp">仕組み</span></h3>
          <p class="story-copy"><span class="t-en">A lightweight handoff protocol built from `.handoff/` notes, memorable passphrases, `AGENTS.md`, three reusable skills, and Claude Code hooks.</span><span class="t-jp is-block">`.handoff/` のメモ、覚えやすいパスフレーズ、`AGENTS.md`、3 つの再利用可能なスキル、Claude Code のフックで構成した軽量な引き継ぎプロトコルです。</span></p>
        </section>
        <section class="story-section">
          <h3 class="story-label"><span class="t-en">Evidence</span><span class="t-jp">実装実績</span></h3>
          <p class="story-copy"><span class="t-en">Works across Claude Code, Codex, Gemini CLI, Antigravity, Cursor, and other tools that read project instructions. Includes five-language documentation and an MIT license.</span><span class="t-jp is-block">Claude Code、Codex、Gemini CLI、Antigravity、Cursor をはじめ、プロジェクト指示を読むツール間で利用できます。ドキュメントは 5 言語に対応し、MIT ライセンスで公開しています。</span></p>
        </section>
        <a class="story-cta" href="https://github.com/takaoumehara/cross-model-handoff" target="_blank" rel="noopener" aria-label="View cross-model-handoff on GitHub (opens in a new tab)"><span class="t-en">View cross-model-handoff on GitHub ↗</span><span class="t-jp">GitHub で cross-model-handoff を見る ↗</span></a>
      </div>
    </article>

    <article class="tool-story" id="snap-pair-core" aria-labelledby="snap-pair-core-title">
      <header class="story-summary">
        <p class="story-number" aria-hidden="true">02</p>
        <h2 class="story-name" id="snap-pair-core-title">snap-pair-core</h2>
        <p class="story-outcome"><span class="t-en">Turn many phones into one live, shared experience—without an app install.</span><span class="t-jp is-block">アプリをインストールせず、何台ものスマートフォンをひとつのライブ体験につなぐ。</span></p>
        <p class="story-classification">Realtime infrastructure · React · Firebase · Agent skill</p>
      </header>
      <div class="story-details">
        <section class="story-section">
          <h3 class="story-label"><span class="t-en">Problem</span><span class="t-jp">課題</span></h3>
          <p class="story-copy"><span class="t-en">Safe, temporary multi-device experiences repeatedly need the same difficult foundation: pairing, presence, shared state, room capacity, and authorization.</span><span class="t-jp is-block">安全で一時的なマルチデバイス体験をつくるたびに、ペアリング、プレゼンス、共有状態、定員管理、認可という同じ基盤を一から実装する必要があります。</span></p>
        </section>
        <section class="story-section">
          <h3 class="story-label"><span class="t-en">System</span><span class="t-jp">仕組み</span></h3>
          <p class="story-copy"><span class="t-en">A React hook plus Firebase Auth, callable Cloud Functions, Realtime Database rules, cleanup, tests, a one-file Lite example, and an AI-agent skill that generates safe integrations.</span><span class="t-jp is-block">React hook、Firebase Auth、callable Cloud Functions、Realtime Database のセキュリティルール、クリーンアップ、テスト、1 ファイルの Lite サンプル、安全な統合を生成する AI エージェント向けスキルをまとめています。</span></p>
        </section>
        <section class="story-section">
          <h3 class="story-label"><span class="t-en">Evidence</span><span class="t-jp">実装実績</span></h3>
          <p class="story-copy"><span class="t-en">Supports QR or six-character pairing, rooms up to 300 participants, server-assisted membership, emulator and production paths, multilingual documentation, and an MIT license.</span><span class="t-jp is-block">QR コードまたは 6 文字コードでのペアリング、最大 300 人のルーム、サーバー側で管理するメンバーシップ、エミュレーターと本番環境の両方の導入経路に対応。多言語ドキュメントを備え、MIT ライセンスで公開しています。</span></p>
        </section>
        <a class="story-cta" href="https://github.com/takaoumehara/snap-pair-core" target="_blank" rel="noopener" aria-label="View snap-pair-core on GitHub (opens in a new tab)"><span class="t-en">View snap-pair-core on GitHub ↗</span><span class="t-jp">GitHub で snap-pair-core を見る ↗</span></a>
      </div>
    </article>
  </div>
</main>

<footer class="site-footer">
  <div><div class="footer-logo">Takao Umehara</div><div class="footer-llc">Freelance &amp; consulting through <strong>Creativity Is Everywhere LLC</strong></div></div>
  <ul class="footer-links"><li><a href="index.html">Home</a></li><li><a href="work.html">Work</a></li><li><a href="ai-products.html">AI Products</a></li><li><a href="about.html">About</a></li><li><a href="contact.html">Contact</a></li></ul>
</footer>
```

The contract deliberately uses backticks as visible punctuation in the System paragraph; do not convert those to `<code>` unless the test and both languages are changed together.

- [ ] **Step 4: Add the existing language and mobile-nav behavior, including expanded state**

Close the page with this exact script and closing tags:

```html
<script>
(() => {
  const html = document.documentElement;
  const btns = [...document.querySelectorAll(".lang-btn")];
  const saved = localStorage.getItem("tu-lang") || "en";
  const setLang = (lang) => {
    html.classList.toggle("lang-jp", lang === "jp");
    html.lang = lang === "jp" ? "ja" : "en";
    btns.forEach((button) => button.classList.toggle("is-active", button.dataset.lang === lang));
    localStorage.setItem("tu-lang", lang);
  };
  setLang(saved);
  btns.forEach((button) => button.addEventListener("click", () => setLang(button.dataset.lang)));
})();

(() => {
  const toggle = document.getElementById('nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  const close = () => {
    toggle.classList.remove('is-open');
    links.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };
  toggle.addEventListener('click', () => {
    const open = !links.classList.contains('is-open');
    toggle.classList.toggle('is-open', open);
    links.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
  links.querySelectorAll('a').forEach((link) => link.addEventListener('click', close));
})();
</script>
</body>
</html>
```

- [ ] **Step 5: Run the dedicated-page contract**

Run:

```bash
node --test --test-name-pattern="dedicated page|new UI|new internal" tests/ai-tools-portfolio.test.mjs
```

Expected: the three matching tests PASS; nonmatching tests are skipped.

Run:

```bash
rg -n "adoption|users|production usage|performance|business outcome" v3/ai-tools.html
```

Expected: no matches.

---

### Task 3: Move the classification, update navigation, and complete verification

**Files:**
- Modify: `v3/ai-products.html:484-489`, `v3/ai-products.html:509`, `v3/ai-products.html:545-560`
- Modify: `v3/work.html:679-684`
- Modify: `v3/about.html:550-555`
- Modify: `v3/contact.html:459-464`
- Modify: `v3/breakbias.html:564-569`
- Modify: `v3/intentfirst.html:254-259`
- Modify: `v3/404.html:369-374`
- Test: `tests/ai-tools-portfolio.test.mjs`

**Interfaces:**
- Consumes: the exact existing top-level navigation order.
- Produces: one `AI Tools` nav item between Work and AI Products on every in-scope main page; `ai-products.html` with 11 entries and no `cross-model-handoff` classification.

- [ ] **Step 1: Remove `cross-model-handoff` from AI Products and fix its count**

In `v3/ai-products.html`, change:

```html
<div class="page-count">12 products</div>
```

to:

```html
<div class="page-count">11 products</div>
```

Delete the complete `cross-model-handoff` `<article class="lab-card">…</article>` block currently between `failforward` and `Marubatsu Arena`. Do not change the copy, status, or order of the remaining 11 products.

- [ ] **Step 2: Add the nav item to each in-scope main page**

In `v3/ai-products.html`, `v3/work.html`, `v3/about.html`, `v3/contact.html`, `v3/breakbias.html`, `v3/intentfirst.html`, and `v3/404.html`, insert this exact list item immediately after the Work item:

```html
<li><a href="ai-tools.html">AI Tools</a></li>
```

Preserve each page's existing `.is-active` and `aria-current="page"` attributes. Do not add an active state to AI Tools anywhere except `v3/ai-tools.html`.

- [ ] **Step 3: Run classification and navigation contracts**

Run:

```bash
node --test --test-name-pattern="classified only|main-page navs" tests/ai-tools-portfolio.test.mjs
```

Expected: both matching tests PASS; nonmatching tests are skipped.

Run:

```bash
rg -l 'href="ai-tools.html"' v3/{index,work,ai-tools,ai-products,about,contact,breakbias,intentfirst,404}.html | sort
```

Expected: all 9 named files are listed.

Run:

```bash
rg -n "cross-model-handoff|page-count" v3/ai-products.html
```

Expected: one `page-count` match showing `11 products`; no `cross-model-handoff` match.

---

#### Task 3B: Full verification and visual-quality gate

**Files:**
- Verify: `v3/index.html`
- Verify: `v3/ai-tools.html`
- Verify: `v3/ai-products.html`
- Verify: `v3/work.html`, `v3/about.html`, `v3/contact.html`, `v3/breakbias.html`, `v3/intentfirst.html`, `v3/404.html`
- Test: `tests/ai-tools-portfolio.test.mjs`

**Interfaces:**
- Consumes: all completed markup, CSS, navigation, and scripts.
- Produces: evidence that the static contract, local routing, responsive layout, language switching, focus behavior, and reduced motion work together.

- [ ] **Step 1: Run the complete automated contract**

Run:

```bash
node --test tests/ai-tools-portfolio.test.mjs
```

Expected: 6 tests, 6 passed, 0 failed.

- [ ] **Step 2: Serve the actual v3 directory and smoke-test routes**

Run in a persistent terminal:

```bash
python3 -m http.server 4173 --directory v3
```

Expected: `Serving HTTP on :: port 4173` (or the equivalent IPv4 message).

In another terminal, run:

```bash
for route in index.html ai-tools.html ai-products.html work.html about.html contact.html; do
  status=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:4173/$route")
  test "$status" = "200" || { echo "$route $status"; exit 1; }
done
echo "all main routes: 200"
```

Expected: `all main routes: 200`.

- [ ] **Step 3: Verify desktop, boundary, and mobile layouts in a real browser**

Open `http://127.0.0.1:4173/index.html` and `http://127.0.0.1:4173/ai-tools.html` with the browser inspection tool. Capture or inspect each at `1440×900`, `768×1024`, and `390×844`.

Expected at `1440×900`: the homepage shows two wide ruled rows with deliberately unequal column proportions; the dedicated page shows summary and Problem/System/Evidence columns; no title, nav item, or CTA clips.

Expected at `768×1024`: the desktop story grid remains readable at the boundary, and the primary nav changes to its menu at the existing `max-width: 768px` rule without horizontal overflow.

Expected at `390×844`: each project reads in the DOM order name → outcome → classification/technologies → link; each story reads summary → Problem → System → Evidence → GitHub CTA; the mobile menu contains Work, AI Tools, AI Products, About, Contact and closes after choosing a link.

If any overflow or collision is observed, fix only the responsible `.tools-*` rule and rerun the complete Node suite. Do not change global typography or spacing tokens.

- [ ] **Step 4: Verify EN/JP switching and persistence**

On both `index.html` and `ai-tools.html`, click JP and inspect every new string; reload the page; navigate between the two routes; then switch back to EN.

Expected: all new EN prose disappears in JP mode, all Japanese equivalents appear, `document.documentElement.lang` is `ja` on `ai-tools.html`, the choice survives reload/navigation through `tu-lang`, and no mixed-language sentence remains except product names, classifications, and technology names.

- [ ] **Step 5: Verify keyboard focus, fragments, external links, and reduced motion**

Using keyboard-only navigation on `ai-tools.html`, tab through logo, primary nav, language buttons, and both GitHub CTAs. Activate `index.html` links to `ai-tools.html#cross-model-handoff` and `ai-tools.html#snap-pair-core`. Emulate `prefers-reduced-motion: reduce` and repeat hover/focus checks.

Expected: every interactive element has a visible focus outline; fragment links land below the sticky nav due to `scroll-margin-top`; both GitHub CTAs open the correct repository in a new tab; all information remains visible without hover; reduced motion removes smooth scrolling and CTA/row motion.

- [ ] **Step 6: Stop the local server and run the final regression checks**

Stop the foreground server with `Ctrl-C`, then run:

```bash
node --test tests/ai-tools-portfolio.test.mjs
rg -n "cross-model-handoff" v3/ai-products.html
rg -n "href=\"(index|work|ai-tools|ai-products|about|contact)\.html" v3/{index,work,ai-tools,ai-products,about,contact}.html >/dev/null
```

Expected: all 6 tests pass; the second command has no output and exits 1 because AI Products has no `cross-model-handoff`; the final link scan exits 0.

## Self-Review Record

- Spec coverage: homepage placement, dedicated page, two repository CTAs, classification move/count correction, repository-supported evidence, all in-scope main-page navs, bilingual behavior, mobile layout, focus, reduced motion, and broken-link checks each map to a named task and test.
- Scope: no repository edits, screenshots, analytics, deployment, dependencies, invented metrics, project-detail nav refactor, or visual-system redesign.
- Copy safety: the only numeric capability claim is the repository-documented `up to 300 participants`; five-language docs, supported AI tools, pairing methods, Firebase components, emulator/production paths, and MIT license are all documented in the source READMEs.
- Placeholder scan: clean; all copy, selectors, paths, commands, expected outcomes, and responsive values are explicit.
- Consistency: `#cross-model-handoff`, `#snap-pair-core`, `#selected-work`, `#ai-tools`, `#ai-products`, `tu-lang`, `.tool-story`, `.story-*`, and `.tools-*` names match between tests and implementation steps.
