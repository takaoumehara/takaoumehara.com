# AI pages card layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present Agentic UX and AI Tools as thumbnail-led, scannable portfolio card grids, and replace the Konosaki placeholder with its supplied image and live URL.

**Architecture:** Add a small shared stylesheet and behavior script for the card-grid treatment, then render the AI pages through this shared pattern without disturbing their bilingual nav, footer, or existing anchors. Reuse the supplied Konosaki SVG as a card background image.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node's built-in test runner.

## Global Constraints

- Preserve existing EN/JP language switching and active navigation.
- Keep `ai-tools.html` anchors `#snap-pair`, `#snap-pair-core`, `#failforward`, and `#cross-model-handoff` valid.
- Preserve existing GitHub URLs and their safe external-link attributes.
- Use `assets/konosaki/KONOSAKI_WEWORK-VERTICAL.svg` and `https://konosaki-co.vercel.app/` for Konosaki.
- Keep mobile layout, keyboard activation, focus-visible feedback, and `prefers-reduced-motion` support.

---

### Task 1: Cover the new portfolio-card contract

**Files:**
- Modify: `tests/ai-tools-portfolio.test.mjs`
- Modify: `ai-products.html`
- Modify: `ai-tools.html`
- Modify: `brand.html`

**Interfaces:**
- Consumes: static page HTML.
- Produces: assertions for `.work-grid`, `.work-card`, the Konosaki image path, and its new URL.

- [ ] **Step 1: Write the failing test**

```js
test('AI index pages use thumbnail-led work-card grids and Konosaki uses the supplied image', () => {
  for (const page of ['ai-products.html', 'ai-tools.html']) {
    const html = read(page);
    assert.match(html, /class="work-grid"/);
    assert.ok([...html.matchAll(openWithClass('article', 'work-card'))].length >= 3);
  }
  const brand = read('brand.html');
  assert.match(brand, /data-href="https:\/\/konosaki-co\.vercel\.app\/"/);
  assert.match(brand, /assets\/konosaki\/KONOSAKI-logo\/KONOSAKI_WEWORK-VERTICAL\.svg/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ai-tools-portfolio.test.mjs`

Expected: FAIL because the shared grid markup and Konosaki URL/image are absent.

- [ ] **Step 3: Keep the focused test in the suite**

Keep the test above after implementation so it protects the visual information architecture and Konosaki asset contract.

- [ ] **Step 4: Run the focused test after implementation**

Run: `node --test tests/ai-tools-portfolio.test.mjs`

Expected: PASS.

### Task 2: Implement shared card-grid presentation and interactions

**Files:**
- Create: `assets/work-card-grid.css`
- Create: `assets/work-card-grid.js`
- Modify: `ai-products.html`
- Modify: `ai-tools.html`

**Interfaces:**
- Consumes: `.work-grid`, `.work-card`, `.card-image`, `.card-body`, and optional `data-href`/`data-external` attributes.
- Produces: responsive, keyboard-activatable portfolio cards with reduced-motion-safe hover treatment.

- [ ] **Step 1: Add the shared stylesheet and behavior script**

```js
document.querySelectorAll('.work-card[data-href]').forEach((card) => {
  const open = () => card.dataset.external === 'true'
    ? window.open(card.dataset.href, '_blank', 'noopener')
    : window.location.assign(card.dataset.href);
  card.addEventListener('click', open);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  });
});
```

- [ ] **Step 2: Render the Agentic UX index as eleven cards**

Use one `.work-card` per existing product. Each card contains a distinct thumbnail treatment, existing category/status, name, bilingual one-sentence description, and stack/role footer. Preserve direct destinations for intentfirst.ai, the Verizon case study, and Fire TV prototype.

- [ ] **Step 3: Render the AI Tools index as three cards**

Use Snap Pair, failforward, and cross-model-handoff cards. Preserve the exact tool anchor ids and GitHub destinations, with the current tool descriptions condensed into card copy.

- [ ] **Step 4: Run the focused test**

Run: `node --test tests/ai-tools-portfolio.test.mjs`

Expected: PASS.

### Task 3: Update Konosaki and run complete verification

**Files:**
- Modify: `brand.html`
- Test: `tests/ai-tools-portfolio.test.mjs`

**Interfaces:**
- Consumes: the supplied `assets/konosaki/KONOSAKI-logo/KONOSAKI_WEWORK-VERTICAL.svg` asset.
- Produces: a clickable Konosaki work card that opens the correct public site in a new tab.

- [ ] **Step 1: Replace the Konosaki placeholder image**

```html
<div class="card-img-bg" style="background-image:url('assets/konosaki/KONOSAKI-logo/KONOSAKI_WEWORK-VERTICAL.svg'); background-position:center;"></div>
```

- [ ] **Step 2: Update the card URL**

```html
<article class="work-card" tabindex="0" data-href="https://konosaki-co.vercel.app/" data-external="true" data-cat="brand">
```

- [ ] **Step 3: Run full verification**

Run: `node --test tests/ai-tools-portfolio.test.mjs`

Expected: PASS with no failures.

- [ ] **Step 4: Inspect the changed-file diff**

Run: `git diff --check && git diff -- ai-products.html ai-tools.html brand.html assets/work-card-grid.css assets/work-card-grid.js tests/ai-tools-portfolio.test.mjs`

Expected: no whitespace errors and only the planned files changed, apart from the pre-existing user work.
