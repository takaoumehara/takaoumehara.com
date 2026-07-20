# takaoumehara.com v3 — Completion Plan
Updated: 2026-04-08

---

## Current Status

**26 pages built.** 6 main + 20 project pages.
All pages have: DM Serif Display, EN/JP toggle, LLC mention, standardized footer.

### What's Done ✓
- [x] Homepage (index.html) — featured grid, initiatives, capabilities
- [x] Work page (work.html) — 21 cards, 5-tab filter with animation
- [x] About page — career timeline, expertise, clients
- [x] BreakBias page — dark hero, 3 audience cards
- [x] intentfirst.html — 8 Context Tokens, dark hero
- [x] Contact page — 3 contact blocks
- [x] 20 project detail pages with editorial gallery system
- [x] DM Serif Display on all 26 pages
- [x] Gradient restrained to card hovers only
- [x] Scroll-reveal + image fade-in on project pages
- [x] Filter animation on work.html
- [x] Footer normalization across all project pages

---

## Remaining Work — Priority Order

### P0 — Must Fix Before Launch

#### 1. Project page template upgrade (19 pages)
Only `cli-studios.html` uses the new "Tension → Approach → Shift" structure.
The other 19 still use "The Ask" (old) or minimal labels.

**Structure to apply to all:**
```
Hero (image + title + client/role/year)
↓
The Tension (what was broken and why it was hard)
My Approach (Takao's specific judgment/decision)
↓
The Shift (outcome — 1-2 numbers max)
↓
Visual evidence (editorial gallery — curated, not exhaustive)
↓
Project details (role/team/deliverables — compact, bottom)
```

**Per-project plan (read original site → write new text):**

| Project | Original URL | Key Tension | Key Decision | Key Number |
|---|---|---|---|---|
| ELA Quests | /productdesignarchive/elaquests | Teachers couldn't deliver engaging ELA without special skills | Immersive quest format with AR | Millions of students |
| T-Mobile | /productdesignarchive/tmobile | BOPIS disconnected digital/physical touchpoints | Integrated kiosk + staff app + voice AI | Selected as preferred innovation partner |
| Web3 Wallet | /productdesignarchive/web3wallet | Event management lacked security + usability balance | White-label custodial wallet per user role | 2023 Merit Gold Award |
| Hummingbird | /productdesignarchive/hummingbird | Teachers couldn't give real-time feedback without disruption | Co-designed with teachers, 5 prototype iterations | 40% efficiency boost |
| Credit Card | /productdesignarchive/creditcardportal | Portal was redundant and aesthetically dated | Modular design system (125+ components) | Set design precedent for entire bank |
| UX Audit | /productdesignarchive/uxaudit | Insurance app ignored trauma-informed design principles | Heuristic eval + trauma-informed lens | 40% nav improvement, 25% dropout reduction |
| EduTrack | /productdesignarchive/edutrack | Educational scheduling was clunky and hard to track | Intuitive visual planner for iPad | Enhanced teacher/student productivity |
| Carnegie | /productdesignarchive/carnegie | PDSA cycle was inefficient for improvement communities | Vertical scrolling validated over horizontal | 40% adoption increase |
| Value Frontier | /visual-design-projects/vf | Sustainability firm needed repositioning for new markets | Brand DNA → identity system → sub-brand launch | Launched DO! NUTS TOKYO |
| Coca-Cola | /visual-design-projects/coke | Global brand needed fresh visual directions | Two parallel directions: Animal World + SketchVibe | Global deployment |
| KOJI FIZZ | /visual-design-projects/kojifizz | New product needed authentic creative endorsement | Short film series with real NY creatives | Exceeded client expectations |
| Kitadoko | /visual-design-projects/kitadoko | 150-year-old barbershop alienated modern/female clients | Full CX rewrite: brand + service + space | 0%→90% repeat rate |
| DNT | /visual-design-projects/dnt | Tokyo needed citizen engagement for zero-emission goals | Social innovation platform + youth ambassadors | 2021 AGDA Award |
| XQ | /visual-design-projects/xq | US high schools needed a redesign competition platform | XQ Canvas Framework (inspired by BMC) | Nationwide engagement |
| GraffitiWear | /visual-design-projects/template-g6nwa-5e535 | School lacked a unified community identity | NYC street culture × school values apparel | 50%+ adoption |
| Festival | /festival-design | Post-COVID festival needed complete reimagination | Hand-built games + "知行合一" branding | 3X revenue |
| extraordinary | /extraordinary | People don't see creativity in everyday objects | Book concept: repurpose the mundane | 11,000+ copies sold |
| Skateboard E-Gift | /stakeboard-e-gift | E-gift cards lack emotional impact | Physical card set + branded packaging | Made friend stoked |
| Verizon | (new — info pending) | Prepaid subscribers needed smoother account management | Post-login UX redesign | TBD — info from Takao |

#### 2. Image curation (reduce where excessive)

| Project | Current | Target | What to cut |
|---|---|---|---|
| ELA Quests | 49 | 20-25 | 2014 screenshots (6), similar Robot Quest shots, duplicate Declare screens |
| Kitadoko | 42 | 28-32 | Mask+group variations (keep 3 of 9), process pages (keep strongest 12 of 18) |
| Festival | 36 | 22-25 | Keep 2 per game (design+photo), reduce pattern variants |
| Hummingbird | 31 | 18-22 | Similar workshop photos, reduce RS_ prototype screens |
| extraordinary | 30 | 20-22 | Interior spread selection (keep 8 of 12), reduce exhibition duplicates |
| Value Frontier | 29 | 20-22 | Brand DNA pages (keep 8 of 13), reduce collateral duplicates |
| DNT | 29 | 18-20 | Zoom backgrounds (keep 3 of 7), reduce platform screenshots |
| UX Audit | 26 | 16-18 | Reduce similar evaluation pages (many look alike) |

#### 3. Mobile navigation
Current: 5 nav links overflow on small screens.
Fix: Add hamburger menu for <768px.

#### 4. Favicon
Create and add to all 26 pages.

---

### P1 — Should Do Before Launch

#### 5. T-Mobile page — pending assets
Takao will provide:
- Video/movie files for BOPIS demo
- Possibly Customer Care App screens
- Voice AI prototype visuals
→ Update `projects/tmobile.html` when received

#### 6. Verizon TotalWireless — pending content
Currently "Coming soon" placeholder.
Takao to provide project details → build full page.

#### 7. Meta tags for SEO
Add to all pages:
```html
<meta name="description" content="...">
<meta property="og:title" content="...">
<meta property="og:image" content="...">
```

#### 8. 404 page
Create `404.html` with branded design.

---

### P2 — Nice to Have

#### 9. Prev/Next navigation on project pages
Add consistent project-to-project navigation at bottom of each detail page.

#### 10. Print stylesheet
Add `@media print` rules for clean portfolio printing.

#### 11. Performance optimization
- Image srcset for responsive sizes
- Preload hero images
- Add `loading="lazy"` consistently (mostly done)

#### 12. Case study PDF/slide deck
Separate deliverable for interview preparation.
Deeper process detail, more images, stakeholder quotes.
→ Priority projects for deck: CLI Studios, Kitadoko, ELA Quests, T-Mobile

---

## Design System Summary

### Typography
- Display: DM Serif Display (italic for hero, regular for sections)
- Body: Google Sans / system-ui sans-serif
- Meta: 11px, 0.16em tracking, uppercase

### Color
- Background: #fbfaf7
- Ink: #121212 / #4c4841 / #79746d
- Lines: rgba(18,18,18,0.08)
- Gradient (card hover ONLY): 5-3C'02 Rich palette

### Layout
- Max-width: 1200px, 32px padding
- Grid gaps: 4px (galleries), 2px (cards)
- Breakpoints: 900px, 600px

### Project Page Template
```
.project-hero (full-width image + overlay + title)
.project-body (max-width: 1200px)
  .project-overview (2-col: aside stats + main text)
    The Tension → My Approach
  .outcomes-grid (3-col numbers)
  .gallery (labeled sections, .g-row/.g-cell)
  footer (standardized)
```

### Gallery Cell Types
- `.g-cell.dark` — black bg, height: auto (UI screenshots)
- `.g-cell.natural` — light bg, height: auto (sketches, diagrams)
- `.g-cell.brand` — white bg, max-height: 520px (identity assets)
- `.g-cell.photo` — 4:3, object-fit: cover (photography)

---

## File Structure
```
v3/
├── index.html         (homepage)
├── work.html          (all projects grid + filter)
├── about.html         (profile, timeline, clients)
├── breakbias.html     (BreakBias initiative)
├── intentfirst.html   (intentfirst.ai intro)
├── contact.html       (3 contact methods)
├── SITE-PLAN.md       (this file)
└── projects/
    ├── ela-quests.html
    ├── tmobile.html        ← pending video assets
    ├── cli-studios.html    ← template reference (Tension/Approach)
    ├── web3-wallet.html
    ├── hummingbird.html
    ├── credit-card-portal.html
    ├── ux-audit.html
    ├── edutrack.html
    ├── carnegie.html
    ├── verizon-totalwireless.html  ← pending full content
    ├── value-frontier.html
    ├── coca-cola.html
    ├── koji-fizz.html
    ├── kitadoko.html
    ├── dnt.html
    ├── xq.html
    ├── graffitiwear.html
    ├── festival-design.html
    ├── extraordinary.html
    └── skateboard-egift.html
```
