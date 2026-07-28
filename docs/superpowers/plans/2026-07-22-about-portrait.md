# About Portrait Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Place Takao Umehara's portrait in an editorial, responsive About-page hero without changing the current `work.html` URL or adding global search.

**Architecture:** Store the supplied image under the site's `assets/about/` directory and add a semantic image block beside the existing About hero copy. The CSS defines the desktop two-column composition and a mobile single-column fallback; a small static test protects the asset path and accessibility contract.

**Tech Stack:** Static HTML, CSS, PNG asset, Node built-in test runner.

## Global Constraints

- Keep `work.html` as the Product Design URL.
- Do not add an all-projects page or search.
- Use `assets/about/TakaoUmehara_passport.png` with descriptive `alt` text.
- Keep the portrait in a 4:5, `object-fit: cover` frame that stacks below hero copy on mobile.
- Do not modify Konosaki or other sessions' uncommitted files.

---

### Task 1: Cover the About portrait contract

**Files:**
- Create: `tests/about-portrait.test.mjs`
- Modify: `about.html`
- Create: `assets/about/TakaoUmehara_passport.png`

**Interfaces:**
- Consumes: the portrait asset path and About hero markup.
- Produces: a test that requires semantic portrait markup and responsive classes.

- [ ] **Step 1: Write the failing test**

```js
test('About hero includes Takao portrait with responsive editorial framing', () => {
  const html = read('about.html');
  assert.match(html, /assets\/about\/TakaoUmehara_passport\.png/);
  assert.match(html, /class="about-portrait"/);
  assert.match(html, /alt="Takao Umehara"/);
  assert.match(html, /\.about-portrait\s*\{[\s\S]*?aspect-ratio:\s*4\s*\/\s*5/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/about-portrait.test.mjs`

Expected: FAIL because the image asset and portrait markup do not yet exist.

- [ ] **Step 3: Copy the supplied image asset**

Copy `/Users/takao/Library/Mobile Documents/com~apple~CloudDocs/Takao portrait/TakaoUmehara_passport.png` to `assets/about/TakaoUmehara_passport.png`.

- [ ] **Step 4: Run test to verify it still fails before markup**

Run: `node --test tests/about-portrait.test.mjs`

Expected: FAIL because semantic hero markup is still absent.

### Task 2: Add the responsive About hero portrait

**Files:**
- Modify: `about.html`
- Test: `tests/about-portrait.test.mjs`

**Interfaces:**
- Consumes: `assets/about/TakaoUmehara_passport.png`.
- Produces: `.about-hero-grid`, `.about-portrait`, and `.about-portrait img` styles.

- [ ] **Step 1: Wrap hero copy and portrait in the two-column composition**

```html
<div class="about-hero-grid">
  <div class="about-hero-copy">…existing hero copy…</div>
  <figure class="about-portrait">
    <img src="assets/about/TakaoUmehara_passport.png" alt="Takao Umehara" width="1024" height="1024">
  </figure>
</div>
```

- [ ] **Step 2: Add the frame and responsive layout CSS**

```css
.about-hero-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(260px, 0.65fr); gap: clamp(32px, 6vw, 84px); align-items: end; }
.about-portrait { aspect-ratio: 4 / 5; overflow: hidden; background: #d6d0c5; }
.about-portrait img { width: 100%; height: 100%; object-fit: cover; object-position: center top; }
@media (max-width: 760px) { .about-hero-grid { grid-template-columns: 1fr; } }
```

- [ ] **Step 3: Run focused verification**

Run: `node --test tests/about-portrait.test.mjs && git diff --check`

Expected: PASS with no whitespace errors.

- [ ] **Step 4: Commit the scoped files**

```bash
git add about.html assets/about/TakaoUmehara_passport.png tests/about-portrait.test.mjs
git commit -m "feat: add About portrait"
```
