# v4 implementation plan

> Written by: superforge-dev · Last updated: 2026-08-23
> Detailed plan: `docs/superpowers/plans/2026-08-23-structured-tech-editorial.md`

## Assumptions made

- `v4/` is the isolated implementation workspace; no additional worktree is needed.
- User approval「すすめて」authorizes implementation on a feature branch and merging it into local `main` after verification.
- Selected work is representative rather than exhaustive: 3 Interactive Experience, 2 AI Products, 3 AI Tools, 3 Product Design, 3 Brand Experience projects.
- English is the primary review language. Japanese layout safety is demonstrated in `docs/design.html`; bilingual portfolio content is outside this first v4 pass.
- `v3/` remains unchanged and supplies verified facts and source thumbnails.

## Wave 1 — shared foundation

- [x] Verified project registry and test foundation
  - Files: `package.json`, `.gitignore`, `tests/portfolio.test.mjs`, `scripts/project-data.mjs`, `assets/thumbs/*`
  - Proof: `npm test` exits 0 and every selected local image exists.
- [x] Mirrored design system and static page structure
  - Files: `docs/design.md`, `docs/design.html`, `index.html`, `styles.css`, `tests/portfolio.test.mjs`
  - Proof: source-contract tests pass and text payload is below 150KB.

## Wave 2 — interaction

- [x] URL helpers and reversible project dialog
  - Files: `tests/history.test.mjs`, `scripts/history.mjs`, `scripts/app.mjs`, `tests/portfolio.spec.mjs`, `playwright.config.mjs`, `package.json`, `index.html`, `styles.css`
  - Proof: Playwright opens a card, changes URL, goes Back, and restores focus.

## Wave 3 — accessibility and release evidence

- [x] Responsive, keyboard, reduced-motion, and axe coverage
  - Files: `tests/portfolio.spec.mjs`, `scripts/app.mjs`, `styles.css`, `index.html`
  - Proof: Node and Playwright suites pass at desktop and 320px.
- [x] Seven-pass WCAG evidence and final audit
  - Files: `docs/accessibility.md`, `docs/design.md`, `docs/design.html`, `docs/plan.md`, `docs/superforge-log.md`
  - Proof: audit ledger records all A/AA criteria and final verification commands exit 0.

## Progress log

- 2026-08-23: Design specification approved by the user. Implementation plan created; execution starts from Wave 1.
- 2026-08-23: Registry RED reproduced as a missing module, then GREEN with 14 verified projects and 12 local thumbnails (`npm test`: 1/1 passing).
- 2026-08-23: Static-contract RED reproduced for missing `index.html`, `styles.css`, and design artifacts; GREEN after implementing the five-section grid and mirrored design system (`npm test`: 4/4 passing, text source 46,272 bytes).
- 2026-08-23: History-helper RED reproduced before adding URL state; GREEN after implementing the native dialog, card-to-viewport transition, and Back restoration (`npm test`: 7/7 passing; focused Playwright flow: 1/1 passing).
- 2026-08-23: Browser audit reproduced an active-category transition contrast failure and a 13px forced-spacing overflow at 320px. Removed the contrast-unsafe colour tween, strengthened mobile heading reflow, aligned visible and accessible control names, and reached GREEN across 9 Playwright flows. Desktop, mobile, and open-dialog screenshots were inspected.
- 2026-08-23: Completed the seven-pass evidence pack with the 55-row WCAG 2.2 A/AA ledger, full desktop Tab loop, Chromium accessibility-tree inspection, forced-colors check, direct/invalid URL and one-step Next/Back flows. VoiceOver + Safari listening remains explicitly not assessed, so the audit does not overclaim conformance.
