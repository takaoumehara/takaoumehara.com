# Verification — portfolio v4 @ `00b89dc`

> Written by: superforge-verify · Last updated: 2026-08-24
> Mode: incremental (grader = implementer)
> Ran on: macOS · Node.js + Chromium · Source build: `00b89dc` · Baseline: `bd34c25`

## Verdict

**PASS for the requested local v4 handoff.** The baseline suite passed twice; the motion refinement then passed one complete fresh run from a new web server and browser context. This verdict is not permission to deploy, and it is not a WCAG conformance claim.

## Claim-to-evidence table

| チェック | 等級 | 証拠 | 結果 |
|---|---|---|---|
| JavaScript syntax | A | `npm run check:syntax`, twice | 3 modules parsed; 0 errors |
| Registry, URL state, source contracts | A | `npm test`, twice | 7 passed / 0 failed / 0 skipped |
| Rendered desktop/mobile behaviour | A | `npm run test:e2e`; baseline twice, motion delta once | 14 passed / 0 failed / 0 skipped |
| Project and local fallback links | A | `npm run check:links`, twice | 4 passed / 0 failed / 0 skipped |
| Spatial open/close transition | A | Playwright case 2 + desktop/mobile midpoint captures | Dialog top-layer surface; transform/opacity only; progressive reveal by 52% |
| Seamless open → Next/Back/Escape | A | Playwright cases 1, 4, 13, 14 | URL, dialog, scroll, and focus restored |
| 320px mobile and 200% text | A | Playwright cases 5 and 6 | No page-level horizontal overflow |
| WCAG automated states | A | Playwright case 3, axe-core 4.13.0 | 0 A/AA violations in default, dialog, expanded-menu states |
| Keyboard and focus | A | Playwright cases 4, 7, 8 | Full desktop Tab order reached; 3px focus; no sticky-header occlusion |
| Accessibility tree | A | Playwright case 9, Chromium CDP | 1 banner/main/footer, named navs, coherent H1/H2/H3 outline |
| Reduced motion / forced colours | A | Playwright cases 10 and 11 | Motion surface absent; focus remains visible |
| Desktop composition | B | `docs/evidence/portfolio-desktop-1440.jpg` | 1440×6932 capture; aligned three-column/two-column grid |
| Mobile composition | B | `docs/evidence/portfolio-mobile-390.jpg` | 390×11710 capture; single-column flow |
| Mobile project detail | B | `docs/evidence/project-dialog-mobile-390.jpg` | 390×844 capture; bar, hierarchy, metadata visible |
| WCAG 2.2 A/AA ledger | C | Derived from the A/B evidence above in `docs/accessibility.md` | 55/55 rows marked Pass or Not present; no Blocker |
| Text payload budget | A | `wc -c index.html styles.css scripts/*.mjs` | 57,436 bytes, below 150KB budget |
| Whitespace and repository state | A | `git diff --check` and `git status --short` at source commit | no output |

## 2026-08-24 motion refinement run

```text
$ npm test
1..7
# tests 7
# pass 7
# fail 0

$ npm run test:e2e
Running 14 tests using 1 worker
[1/14] card opens spatial detail and Back restores focus
[2/14] spatial transition stays in the dialog layer and choreographs the project content
[3/14] default, dialog, and expanded menu states have no automated WCAG A/AA violations
[4/14] keyboard opens and dismisses a project without losing the trigger
[5/14] 320px reflow and forced text spacing preserve the page
[6/14] 200% text-only zoom does not introduce page-level horizontal scrolling
[7/14] skip link is the first keyboard stop and reaches main content
[8/14] the complete desktop tab order stays visible and reaches every control
[9/14] the accessibility tree exposes a coherent outline and named landmarks
[10/14] forced-colors mode preserves content and a visible keyboard focus indicator
[11/14] reduced motion opens the detail without a spatial transition surface
[12/14] direct project URLs open predictably and invalid slugs recover
[13/14] Back restores the original scroll position
[14/14] Next project keeps one reversible history step
14 passed (11.8s)

$ npm run check:syntax && npm run check:links && git diff --check
3 modules parsed; 4 source-contract tests passed; no whitespace errors
```

The 230ms midpoint was inspected at 1440×1000 and 390×844. The selected media remains spatially connected while the detail hierarchy is already legible; the previous blank warm-ground interval is absent.

## Baseline cold run 1 — raw relevant output

```text
$ npm run check:syntax
> node --check scripts/app.mjs && node --check scripts/history.mjs && node --check scripts/project-data.mjs
[no errors]

$ npm test
ok 1 - project URL round-trips without dropping unrelated state
ok 2 - history state preserves project and scroll position
ok 3 - removing a project keeps other URL state intact
ok 4 - registry uses the five approved categories and verified assets
ok 5 - page exposes approved navigation and progressive fallback links
ok 6 - CSS includes semantic tokens and accessibility states
ok 7 - machine and human design-system artifacts are both present
1..7
# tests 7
# pass 7
# fail 0
# skipped 0

$ npm run test:e2e
Running 13 tests using 1 worker
[1/13] card opens spatial detail and Back restores focus
[2/13] default, dialog, and expanded menu states have no automated WCAG A/AA violations
[3/13] keyboard opens and dismisses a project without losing the trigger
[4/13] 320px reflow and forced text spacing preserve the page
[5/13] 200% text-only zoom does not introduce page-level horizontal scrolling
[6/13] skip link is the first keyboard stop and reaches main content
[7/13] the complete desktop tab order stays visible and reaches every control
[8/13] the accessibility tree exposes a coherent outline and named landmarks
[9/13] forced-colors mode preserves content and a visible keyboard focus indicator
[10/13] reduced motion opens the detail without a spatial transition surface
[11/13] direct project URLs open predictably and invalid slugs recover
[12/13] Back restores the original scroll position
[13/13] Next project keeps one reversible history step
13 passed (11.6s)

$ npm run check:links
ok 1 - registry uses the five approved categories and verified assets
ok 2 - page exposes approved navigation and progressive fallback links
ok 3 - CSS includes semantic tokens and accessibility states
ok 4 - machine and human design-system artifacts are both present
1..4
# tests 4
# pass 4
# fail 0
# skipped 0

$ git diff --check && git status --short
[no output]
```

## Baseline cold run 2 — raw relevant output

```text
$ npm run check:syntax
> node --check scripts/app.mjs && node --check scripts/history.mjs && node --check scripts/project-data.mjs
[no errors]

$ npm test
ok 1 - project URL round-trips without dropping unrelated state
ok 2 - history state preserves project and scroll position
ok 3 - removing a project keeps other URL state intact
ok 4 - registry uses the five approved categories and verified assets
ok 5 - page exposes approved navigation and progressive fallback links
ok 6 - CSS includes semantic tokens and accessibility states
ok 7 - machine and human design-system artifacts are both present
1..7
# tests 7
# pass 7
# fail 0
# skipped 0

$ npm run test:e2e
Running 13 tests using 1 worker
[1/13] card opens spatial detail and Back restores focus
[2/13] default, dialog, and expanded menu states have no automated WCAG A/AA violations
[3/13] keyboard opens and dismisses a project without losing the trigger
[4/13] 320px reflow and forced text spacing preserve the page
[5/13] 200% text-only zoom does not introduce page-level horizontal scrolling
[6/13] skip link is the first keyboard stop and reaches main content
[7/13] the complete desktop tab order stays visible and reaches every control
[8/13] the accessibility tree exposes a coherent outline and named landmarks
[9/13] forced-colors mode preserves content and a visible keyboard focus indicator
[10/13] reduced motion opens the detail without a spatial transition surface
[11/13] direct project URLs open predictably and invalid slugs recover
[12/13] Back restores the original scroll position
[13/13] Next project keeps one reversible history step
13 passed (11.4s)

$ npm run check:links
ok 1 - registry uses the five approved categories and verified assets
ok 2 - page exposes approved navigation and progressive fallback links
ok 3 - CSS includes semantic tokens and accessibility states
ok 4 - machine and human design-system artifacts are both present
1..4
# tests 4
# pass 4
# fail 0
# skipped 0

$ git diff --check && git status --short
[no output]
```

## Visual evidence checksums

```text
$ shasum -a 256 docs/evidence/*.jpg
0d41c2c050e64511bb5a1ef0ecb1409d94f135fdf189bf942cd2809c07eac33c  docs/evidence/portfolio-desktop-1440.jpg
a9dbc7c6906bbe7c6b11fcd862fe62f908f02122a78cd783b8bde00e191f61ce  docs/evidence/portfolio-mobile-390.jpg
443ab9d61bdb76ee49483795d311926bd7715f2b34f5f4b853337618eca50929  docs/evidence/project-dialog-mobile-390.jpg
```

## Three-persona usability pass

| Persona | Grade and basis | Simulated path | Abandonment point |
|---|---|---|---|
| 初回・急いでいる | C, from desktop/mobile captures and the category/card tests | Headline → Explore selected work/category index → first card | No forced abandonment in the checked flow; the work starts one scroll below the mobile hero |
| 慣れた常用者 | C, from header anchors and Back/Next tests | Header category → known card → Next/Back | No forced abandonment; one click opens detail and one Back returns to the exact card |
| 懐疑的・慎重 | C, from dialog capture and local-link test | Card → role/year/system → Open full project → About/LinkedIn | May abandon if expecting quantified outcomes inside the overlay; the complete case study is intentionally one extra action away |

## 確認していないこと

- VoiceOver + Safari was not run as a listening-only pass. Chromium accessibility-tree inspection cannot prove announcement quality or noise.
- Production hosting and the sibling `../v3/` deployment layout were not exercised. Local fallback files resolve on disk.
- External live URLs and LinkedIn availability were not contacted during the final offline/local gate.
- Network-throttled Core Web Vitals, offline font delivery, and CI on another operating system were not run.
- No linter is configured for this vanilla HTML/CSS/JavaScript project; syntax checks, source contracts, axe, and `git diff --check` ran instead.
- Native iOS/Android checks are not applicable because the deliverable is a web page.

## Release boundary

This report verifies the requested local v4 implementation. It does not run `superforge-ship`, security review, analytics/privacy review, DNS, hosting, or rollback checks, and therefore does not authorize public release.
