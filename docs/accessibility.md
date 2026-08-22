# Accessibility audit — portfolio v4

> Audited: 2026-08-23 · Standard: WCAG 2.2 · Target: Level AA

## Scope and verdict

- Surfaces: portfolio index, five category sections, mobile navigation, project dialog, direct project URL, About, and LinkedIn links.
- Platform executed: Chromium via Playwright 1.62.1 on macOS; desktop 1440×900, 1280×1024 with 200% text scaling, and 320×800 reflow.
- States executed: default, card focus, dialog open, dialog closed by Back and Escape, next project, expanded mobile menu, invalid URL, reduced motion, forced colours, and forced WCAG text spacing.
- Not executed: a listening-only VoiceOver + Safari pass. Chromium's accessibility tree was inspected instead, so announcement quality and auditory noise remain `not assessed`.

**Verdict:** no WCAG 2.2 A/AA failures remain in the rendered states assessed here, but full conformance is not claimed until a VoiceOver + Safari listening pass is completed.

## Seven-pass evidence

### 1. Automated

`npm run test:e2e` runs `axe-core` 4.13.0 through `@axe-core/playwright` against the default page, open project dialog, and expanded mobile menu. Tags: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`. Result: zero violations after fixes.

This covers the automatable rule set only. It cannot judge meaningful sequence, focus order quality, link-purpose quality, predictable behaviour, or the other manual criteria listed by axe's own coverage limits.

### 2. Keyboard

Executed sequence in Chromium:

1. `Tab` from page start → skip link is the first stop; `Enter` → `#main-content`.
2. `Tab` through every visible desktop link, card, summary, and button → every control reached once, 3px focus outline visible, none entirely hidden by the sticky header.
3. Focus `superforge` card → `Enter` → dialog opens and focus moves to Close.
4. `Tab` stays within the native modal; `Escape` → dialog closes and focus returns to the card.
5. Card → Next project → browser Back → one reversible history step closes the dialog and restores the original trigger and scroll position.

Result: pass for the tested primary flow. There are no drag-only or timed controls.

### 3. Screen reader / accessibility tree

Chromium CDP `Accessibility.getFullAXTree` exposed one banner, one main, one contentinfo, named navigation landmarks, one H1, six H2s, and fourteen project H3s. Decorative thumbnails are hidden with empty alt text because the adjacent project title and description carry the same information. Dialog controls expose names, roles, and state; the status live region announces open/return/not-found updates.

Result: tree inspection pass. VoiceOver announcement quality remains not assessed.

### 4. Zoom and reflow

- 320×800 CSS viewport (400% zoom equivalent): no page-level horizontal scroll.
- 1280×1024 with root text scaled to 200%: no page-level horizontal scroll.
- Forced spacing: line-height 1.5, paragraph spacing 2×, letter-spacing 0.12em, word-spacing 0.16em; no clipped text or horizontal scroll.
- Portrait and landscape-responsive layouts are available; orientation is not locked.

Result: pass. The audit found and fixed a 13px overflow in long mobile category headings.

### 5. Colour and contrast

Measured with `superforge-a11y/scripts/contrast.py`:

| Pair | Ratio | Requirement | Result |
|---|---:|---:|---|
| Ink `#11110F` / ground `#F2F0EA` | 16.59:1 | 4.5:1 text | Pass |
| Secondary ink `#4F514C` / ground | 7.05:1 | 4.5:1 text | Pass |
| White / accent `#165DFF` | 5.19:1 | 4.5:1 text | Pass |
| Accent / ground | 4.56:1 | 3:1 UI | Pass |
| Accent / white | 5.19:1 | 3:1 UI | Pass |
| White / error `#B42318` | 6.57:1 | 4.5:1 text | Pass |
| Strong border / ground | 16.59:1 | 3:1 UI | Pass |

Forced-colors emulation preserved content and a visible 3px focus outline. Meaning is carried by text, borders, link treatment, and `aria-current`, not colour alone. The audit removed a background-colour tween whose intermediate frame failed contrast.

### 6. Motion and time

With `prefers-reduced-motion: reduce`, the card-to-viewport transition surface is not created and CSS animation/transition duration collapses to 0.01ms. Default motion is limited to transform, colour feedback, and one spatial open/close transition (420ms/300ms). There is no autoplay, flashing, auto-update, audio, or time limit.

Result: pass for the implemented motion.

### 7. Forms and errors

No form, authentication, legal/financial submission, or destructive data action is present. Invalid project URL state is recovered in text through a pre-existing polite status region.

Result: not present for form criteria.

## Findings resolved

| Severity | Finding | Person blocked | Resolution |
|---|---|---|---|
| Major | Active-category colour transition passed through a 1.34:1 text frame | Low-vision reader during scrolling | Removed the colour tween; state now changes directly to the measured 5.19:1 pair |
| Major | Forced text spacing produced 13px page overflow at 320px | Low-vision reader using custom text spacing | Reduced mobile heading scale and allowed safe emergency wrapping |
| Major | Close and full-project controls had accessible names that did not contain the visible label | Voice-control user | Made visible text the accessible-name prefix and moved extra context into screen-reader-only text |

No unresolved code finding remains in the assessed states.

## WCAG 2.2 A/AA criterion ledger

| SC | Level | Status | Evidence / reason |
|---|---|---|---|
| 1.1.1 Non-text Content | A | Pass | Decorative thumbnails use empty alt; text equivalents are adjacent |
| 1.2.1 Audio-only and Video-only | A | Not present | No time-based media |
| 1.2.2 Captions (Prerecorded) | A | Not present | No prerecorded media |
| 1.2.3 Audio Description or Media Alternative | A | Not present | No prerecorded media |
| 1.2.4 Captions (Live) | AA | Not present | No live media |
| 1.2.5 Audio Description (Prerecorded) | AA | Not present | No prerecorded media |
| 1.3.1 Info and Relationships | A | Pass | Semantic sections, headings, lists/definition list, landmarks; axe/tree |
| 1.3.2 Meaningful Sequence | A | Pass | DOM order matches visual and complete Tab order |
| 1.3.3 Sensory Characteristics | A | Pass | No instruction relies on position, shape, or sound alone |
| 1.3.4 Orientation | AA | Pass | No orientation lock; responsive layouts |
| 1.3.5 Identify Input Purpose | AA | Not present | No personal-data fields |
| 1.4.1 Use of Color | A | Pass | Labels, borders, underline/focus, and state semantics supplement colour |
| 1.4.2 Audio Control | A | Not present | No audio |
| 1.4.3 Contrast (Minimum) | AA | Pass | Measured ratios table; rendered axe states |
| 1.4.4 Resize Text | AA | Pass | 200% text test without content/function loss |
| 1.4.5 Images of Text | AA | Pass | UI copy is real text; screenshots are project evidence, not UI labels |
| 1.4.10 Reflow | AA | Pass | 320px test has no page-level horizontal scroll |
| 1.4.11 Non-text Contrast | AA | Pass | Focus and strong UI boundaries measured above 3:1 |
| 1.4.12 Text Spacing | AA | Pass | Forced-spacing browser test |
| 1.4.13 Content on Hover or Focus | AA | Not present | No tooltip or hover-only content |
| 2.1.1 Keyboard | A | Pass | Complete desktop Tab loop and dialog flow |
| 2.1.2 No Keyboard Trap | A | Pass | Native dialog traps only while modal and exits with Escape |
| 2.1.4 Character Key Shortcuts | A | Not present | No single-key shortcuts |
| 2.2.1 Timing Adjustable | A | Not present | No time limits |
| 2.2.2 Pause, Stop, Hide | A | Not present | No ongoing motion or auto-update |
| 2.3.1 Three Flashes or Below Threshold | A | Pass | No flashing content |
| 2.4.1 Bypass Blocks | A | Pass | First-focus skip link reaches main |
| 2.4.2 Page Titled | A | Pass | Descriptive document title; project URL dialog labelled |
| 2.4.3 Focus Order | A | Pass | DOM-order loop; dialog entry/return verified |
| 2.4.4 Link Purpose (In Context) | A | Pass | Project and profile actions are named in their card/section context |
| 2.4.5 Multiple Ways | AA | Pass | Header navigation and category index both reach work sections |
| 2.4.6 Headings and Labels | AA | Pass | Accessibility-tree outline is descriptive |
| 2.4.7 Focus Visible | AA | Pass | 3px outline verified at every desktop stop |
| 2.4.11 Focus Not Obscured (Minimum) | AA | Pass | Full Tab loop checks sticky-header overlap |
| 2.5.1 Pointer Gestures | A | Not present | No multipoint or path gestures |
| 2.5.2 Pointer Cancellation | A | Pass | Native click activation occurs on release |
| 2.5.3 Label in Name | A | Pass | Visible Close/Open full project labels prefix accessible names |
| 2.5.4 Motion Actuation | A | Not present | No device-motion input |
| 2.5.7 Dragging Movements | AA | Not present | No dragging interaction |
| 2.5.8 Target Size (Minimum) | AA | Pass | axe target-size rule and 44px primary-control minimums |
| 3.1.1 Language of Page | A | Pass | `lang="en"`; isolated Japanese proper name is exempt |
| 3.1.2 Language of Parts | AA | Not present | No foreign-language passage; only a proper name |
| 3.2.1 On Focus | A | Pass | Focus alone does not change context |
| 3.2.2 On Input | A | Not present | No input controls |
| 3.2.3 Consistent Navigation | AA | Pass | One-page repeated navigation stays in consistent order |
| 3.2.4 Consistent Identification | AA | Pass | Work/About/LinkedIn/Close retain consistent names |
| 3.2.6 Consistent Help | A | Not present | No help mechanism |
| 3.3.1 Error Identification | A | Not present | No form validation; invalid URL status is textual |
| 3.3.2 Labels or Instructions | A | Not present | No form fields |
| 3.3.3 Error Suggestion | AA | Not present | No correctable form errors |
| 3.3.4 Error Prevention | AA | Not present | No legal, financial, or destructive submission |
| 3.3.7 Redundant Entry | A | Not present | No data-entry process |
| 3.3.8 Accessible Authentication | AA | Not present | No authentication |
| 4.1.2 Name, Role, Value | A | Pass | Native controls/dialog/details plus axe and tree inspection |
| 4.1.3 Status Messages | AA | Pass | Pre-existing polite atomic status region receives updates |

## Remaining manual release check

On a Mac, open `index.html` in Safari, enable VoiceOver (`Cmd+F5`), and complete: headings rotor → landmark rotor → open `superforge` → read summary/meta → Next project → Escape/Back. Record the spoken output before making a conformance claim.
