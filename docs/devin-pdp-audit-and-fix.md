# Devin Task Brief: Portfolio PDP Comprehensive Audit & Fix

## Mission Overview
You are tasked with systematically auditing, fixing rendering failures, restoring missing media, and standardizing all Project Detail Pages (PDP) in `takaoumehara.com` (`/projects/*.html`).

Repository: `https://github.com/takaoumehara/takaoumehara.com.git`  
Root directory: repository root (or `/v3/` if working within that workspace structure).

---

## Core Design Principles & Rules (From Takao Umehara)

1. **Background Flexibility (Do NOT force dark backgrounds everywhere)**:
   - 「無理に黒いバックグラウンドにする必要はないですよ」
   - Both **clean white / light paper backgrounds** (`#ffffff`, `#fbfaf7`, `#f8f7f4`) and **dark backgrounds** (`#0b0c0e`, `#121316`) are fully valid.
   - Choose or preserve the background tone that best suits the project's brand identity (e.g., *Verizon AI Agents* and *T-Mobile* look best with crisp light paper backgrounds; game/interactive prototypes like *Resona* or *Emoji Blast* shine on dark surfaces).
   - **Critical Contrast Rule**: NEVER render white text on white/light gray cards (`.sol-friction`, `.sol-agent`, `.option-cards`), and never render dark gray text on black backgrounds. Test both text and background contrast in all view modes.

2. **Typography Standardization (`Outfit`)**:
   - The primary font family across all pages must be **`Outfit`** (Google Font: `'Outfit', sans-serif`).
   - Ensure the Google Fonts `<link>` tag includes `family=Outfit:wght@300;400;500;600;700&display=swap` and the CSS sets `font-family: 'Outfit', sans-serif;`.
   - Monospace font for tags/code: `'SF Mono', 'Menlo', monospace`.
   - Serif font for editorial highlights (if used): `'Newsreader', 'EB Garamond', serif`.

3. **Content Preservation (No Pruning)**:
   - Reformat and style elements gracefully, but **do not prune, summarize away, or discard existing project content**, case study copy, metrics, or walkthrough steps.

4. **Zero Script Dependency for Core Content**:
   - Every text paragraph, screenshot, and video must be visible even if JavaScript fails or before scripts run.
   - Avoid `.g-cell img { opacity: 0; }` or `.reveal-on-scroll { opacity: 0; }` without an immediate fallback. Content must have `opacity: 1` by default or reveal smoothly.

5. **Page Transitions Reliability (`wipe.js` / View Transitions)**:
   - When users click a thumbnail card from listing pages (`index.html`, `work.html`, `interactive.html`, etc.), navigation must be snappy and reliable.
   - The transition curtain must **never freeze or trap the screen** midway. Ensure all links cleanly navigate and that `assets/wipe.js` watchdog timers are active.

---

## Step-by-Step Audit & Execution Workflow

### Step 1: Automated Sanity Check
1. Run automated test suite:
   ```bash
   npm test
   ```
   Ensure all tests pass.
2. Check for syntax errors across all HTML pages:
   Verify there are no broken arrow functions (`( => {` or `= => {`) or method calls missing parentheses (`getBoundingClientRect` instead of `getBoundingClientRect()`, `preventDefault` instead of `preventDefault()`).

### Step 2: Full PDP Inventory Inspection (Visit all 39 pages)
Iterate through every project page in `projects/*.html`:
```
amazon-firetv.html
carnegie.html
cli-studios.html
coca-cola.html
credit-card-portal.html
cross-model-handoff.html
dnt.html
edutrack.html
ela-quests.html
emoji-blast.html
extraordinary.html
failforward.html
festival-design.html
graffitiwear.html
hummingbird.html
interactive-experience-skills.html
intuitive-game-design.html
kao-game.html
kitadoko.html
koji-fizz.html
konosaki.html
marubatsu.html
menlomath.html
multilingual-readme.html
odell-education.html
rakugaki-jam.html
resona.html
skateboard-egift.html
snap-pair.html
superforge.html
tmobile.html
typespace.html
ux-audit.html
value-frontier.html
verizon-ai-agents.html
verizon-totalwireless.html
vocab-app.html
web3-wallet.html
xq.html
```

For each page, systematically verify:
1. **Header & Navigation**:
   - Navigation links: `Interactive`, `AI Products`, `AI Tools`, `Product Design`, `Brand & Visual`, `About`, `Contact`.
   - Brand logo / backlink (`/` or `index.html`).
   - Language toggle button (EN / JP) if applicable.
2. **Hero Section**:
   - Title, kicker/category, summary, metadata grid (`ROLE`, `YEAR`, `CONTEXT`, `STACK`).
   - Ensure media or hero graphic loads properly and has correct aspect ratio (not squashed or over-stretched).
3. **Media & Image Rendering**:
   - Check all `<img>` tags: do the `src` files exist? If relative, do they correctly resolve from `/projects/` to `../assets/...`?
   - Check all `<video>` tags: are sources valid? Are controls or autoplay parameters configured correctly?
   - Look for invisible images: check if any CSS rule (`opacity: 0`, `display: none`, `visibility: hidden`) is keeping them hidden because of an un-triggered observer.
4. **Layout & Boxiness**:
   - Avoid ugly, heavy grey boxes or boxed containers with cramped borders.
   - Use spacious modern layout rhythm: generous padding, subtle separators, high-contrast readable text.
5. **View Mode Switching (if page includes deck/scroll mode)**:
   - Ensure `Scroll` vs `Slides` toggle buttons function without crashing.
   - Default view should be seamless vertical scroll.

---

## Known Bugs & Fix Patterns (Reference Guide)

### 1. The "Invisible Gallery" Bug (seen in `tmobile.html`)
- **Symptom**: Images are present in DOM but rendered invisible (completely blank screen area).
- **Cause**: CSS set `.g-cell img { opacity: 0; }` waiting for an IntersectionObserver callback, but a JS syntax error prevented the script from running.
- **Fix**: Set `.g-cell img { opacity: 1; }` by default. Use subtle transitions:
  ```css
  .g-cell img { opacity: 1; transition: opacity 0.3s ease; }
  ```

### 2. The "White-on-White Text" Contrast Bug (seen in `verizon-ai-agents.html`)
- **Symptom**: Cards in sections like friction points, solution agents, or option cards have white backgrounds with invisible white text.
- **Cause**: A global dark theme set `--ink: #ffffff;` on `:root`, but cards had explicit `#fff` or `rgba(255,255,255,0.9)` background colors.
- **Fix**: Keep the page on its authentic light paper theme:
  ```css
  :root {
    --bg: #fbfaf7;
    --ink: #121212;
    --ink-mid: #4c4841;
    --surface: #ffffff;
    --border: rgba(0, 0, 0, 0.08);
  }
  ```
  Ensure text color `--ink` contrasts strongly with `--surface` (minimum 4.5:1 ratio).

### 3. The "Unstyled Text Dump" Bug (seen in `resona.html`)
- **Symptom**: Elements have classes like `.pj-hero`, `.pj-kicker`, `.pj-facts`, `.pj-point` but appear as unformatted plain text.
- **Cause**: The HTML adopted the new `.pj-*` naming convention before `assets/project-page.css` contained the matching class definitions.
- **Fix**: Link `../assets/project-page.css` in the `<head>` and ensure `.pj-*` utility classes are defined.

### 4. Oversized Hero Video (seen in `amazon-firetv.html`)
- **Symptom**: Video or canvas element blows out to massive heights, pushing all content off-screen.
- **Fix**: Constrain media containers with `max-width: 1200px; width: 100%; aspect-ratio: 16/9; max-height: 70vh; margin: 0 auto; object-fit: contain;`.

### 5. Transition Freezing / Trapping
- **Symptom**: Clicking a thumbnail from `index.html` or category pages sometimes freezes on a blank or black curtain screen.
- **Cause**: View transition or wipe overlay intercepted the click (`e.preventDefault()`) but failed to complete navigation if the target took >300ms to parse.
- **Fix**: Ensure `assets/wipe.js` has safety watchdog timers and handles `pageshow`, `popstate`, and fallback navigation.

---

## Verification & Acceptance Criteria
Before concluding your work:
1. `npm test` passes 100% (all 55 tests pass).
2. All 39 PDPs have been inspected.
3. Every image and video element displays valid content without 404s or opacity: 0 blocks.
4. Typography is confirmed as `Outfit` across all inspected pages.
5. Contrast passes WCAG AA readability (no dark-on-dark or white-on-white text).
6. Commit all changes cleanly with clear commit messages and push to `origin main`.
