# EduTrack Design System

Design system for **EduTrack** — a year-long lesson planner and standards-tracking companion for K–5 classroom teachers, built around the rhythm **Plan · Do · Review**. Tagline: *"Plan it. Teach it. Grow from it."*

**Source of truth:** the live prototype in this project, `EduTrack.dc.html`. Every token, component, and motion value here was extracted from that implementation (not invented).

**Browse it:** open `EduTrack Storybook.dc.html` — interactive storybook with foundations, atoms → organisms, motion/micro-interaction demos, the mobile system, and copyable React code for every component.

---

## The big idea

EduTrack looks like a beloved **paper planbook**, not a dashboard. Lessons are physical index cards you pick up and place on days. Surfaces are warm paper; corners are square; shadows say how far off the desk a piece of paper is. Deliberately the opposite of sterile edtech.

## CONTENT FUNDAMENTALS

- **Two voices, always paired.** Structural copy is Oswald UPPERCASE and terse ("MATERIALS TO PREP", "STANDARDS TODAY"). Human copy is EB Garamond italic, warm and encouraging ("Reflect on what you've taught", "Tap a reader to log a conference note").
- **Speaks to "you", about "your classroom."** Second person, never "the user". ("Your whole year of lessons, one drag away.")
- **Teacher-workshop vocabulary**, used precisely: readers, jots, confer, anchor text, teaching point, turn-and-talk, striving readers.
- **Encouraging, never nagging.** Empty states invite ("Nothing planned for this day yet." + GO TO PLAN); nothing shames.
- **No emoji.** The only pictographic characters are functional: ✓ ✗ › ⌄ ❮ ❯ ×.
- **Numbers are honest and specific:** "3 of 8 lessons planned", "Week 2 of 38", "105-minute block".
- Peer notes are quoted with attribution: *"Print extras." — Mr. Okafor · Rm 118*.

## VISUAL FOUNDATIONS

- **Color:** warm paper neutrals (desk `#d6d3ca` → sheet `#e9e7df` → frame `#f6f5f1` → card `#fff`) plus exactly four functional colors: **lesson brown** `#6f4e2f`, **vitamin green** `#8cba52`, **assignment orange** `#e8871e`, **accent blue** `#4da4e0` (user-swappable to orange/olive/purple). Color is never decoration — every hue means something.
- **Type:** Oswald (condensed, 500–600, uppercase, tracked 1–3px) for structure; EB Garamond italic for dates, day numerals and editorial asides; Helvetica Neue for body. Big display moments (the 42px PLAN | DO | REVIEW masthead) are navigation, not decoration.
- **Corners:** square everywhere. The ONLY circles are dots, radio-style indicators, and the DoneCheck ring. No border radii on cards, buttons, inputs, tags.
- **Shadows = physics.** Resting card `0 2px 7px .20`; hover-lift `0 10px 22px .26`; airborne drag ghost `0 12px 28px .38` (+ rotate(-3deg)); popover `0 16px 44px .38`; modal `0 24px 60px .42`. One special case: the card tray uses a HARD offset shadow `7px 7px 0` (a stack of fresh cards).
- **Borders & rules:** hairlines from `#eceae3` (row separators) to `#b9b5aa` (tag borders). Signature motif: the **5px near-black bar** (`#1c1b19`) under the timeline; 2px rules under section labels.
- **Backgrounds:** flat paper tones only. No gradients, no textures, no imagery in the chrome. Photography/illustration is absent by design.
- **Layout:** the app lives in a framed sheet (5px `#f6f5f1` border + shadow) on the desk color. Dense but airy; sidebars use ruled sections.
- **Hover:** paper lifts (translateY(-2 to -4px) + deeper shadow). Text/links change color to accent or dim opacity.
- **Press:** compress scale(.94–.96) — paper squeezed under a finger.
- **Focus:** input borders turn accent. No glow rings.
- **Transparency & blur:** none. Overlays are flat warm scrims (`rgba(40,38,32,.1–.52)`). No backdrop-filter.

## INTERACTION & MOTION

Motion metaphor: **physical paper**. Full principles + live demos in the storybook's Motion section.

- **House easing** `cubic-bezier(.22,1,.36,1)` (`--ease-settle`) for everything spatial — decisive, no wobble.
- **Reward easing** `cubic-bezier(.34,1.56,.64,1)` (`--ease-reward`) ONLY for celebration moments (checkmark pop).
- **Durations:** 150ms press · 180ms hover · 250ms fades/popovers · 320ms drop/check · 400ms spotlight travel. Nothing over 400ms except decorative page-load rises.
- **Keyframe vocabulary** (all in `tokens/motion.css`): `et-pop` (panel entrance), `et-drop` (card lands: falls, squashes 0.97, settles), `et-check` (mark overshoots 1.3 then settles), `et-fade` (view crossfade), `et-rise` (section entrance).
- **Drag & drop:** pointer-based with an 8px movement threshold before drag starts (below = tap/open). The ghost tilts -3° and floats at drag shadow; drop targets show a dashed accent outline + tinted fill; release plays `et-drop`.
- **View changes crossfade** (200ms). Screens never slide.
- **Micro-interactions:** checkbox mark pops; capture notes drop in when spawned; over-scheduled days get an orange minute-count badge that fades in; the tour spotlight glides between targets at 400ms.

## ICONOGRAPHY

There is **no icon set** — by design. The system communicates with:
- **Color-coded squares** (the card metaphor itself) as the primary "icon" language.
- **Unicode glyphs** for functional marks: ✓ (done), × (remove), › ⌄ (disclosure), ❮ ❯ (paging), | (nav separator).
- **Clip-path arrow shapes** for assignment START/DUE flags.
Do not introduce an icon font or SVG icon set without a deliberate decision; if icons become necessary, they must read as printed marks (single-color, square-cornered). No emoji, ever.
**No logo exists** — the wordmark is simply "EDUTRACK" set in Oswald 600/700. Do not draw a mark.

## MOBILE SYSTEM

Mobile is a **companion in the pocket**, optimized for DO (the teaching day) first.

- **Navigation:** masthead collapses to a bottom `MobileTabBar` (PLAN / DO / REVIEW), 3px accent indicator, safe-area aware.
- **Hit targets:** ≥ 44px (`--tap-min`); DoneCheck keeps 36px visual with padded 44px tap area.
- **Type:** display scales down (42→30px), body scales UP (13→15px) for thumb-distance reading.
- **PLAN on mobile:** the 8-day horizontal timeline becomes a **vertical day list**; drag-and-drop becomes **tap-to-assign** (tap a card → tap a day). Long-press = the desktop hover (peek).
- **DO on mobile:** the primary surface — agenda cards full-width, side rail sections stack below.
- **Spacing:** 16px gutters (`--m-gutter`); the desk/frame chrome disappears — the sheet IS the screen.
- Live demos in the storybook's Mobile section.

## INDEX

| Path | What |
|---|---|
| `styles.css` | Entry point — imports all tokens |
| `tokens/` | `colors` · `typography` · `spacing` · `elevation` · `motion` (keyframes live here) |
| `components/atoms/` | Button, Tag, Checkbox, TextField, SectionLabel, AssignmentFlag, DoneCheck |
| `components/molecules/` | LessonCard, RatingToggle, CoverageRow, CaptureNote, AgendaItem |
| `components/organisms/` | AppHeader, LessonPopover, TourTip (+TourSpotlight), MobileTabBar |
| `guidelines/` | Foundation specimen cards (@dsCard-tagged) |
| `EduTrack Storybook.dc.html` | **The storybook** — browse everything, copy component code |
| `EduTrack.dc.html` | The live product prototype (source of truth) |
| `EduTrack Case Study.dc.html` | Portfolio case study |

Each component ships as `.jsx` (self-contained, React-only, styled via tokens) + `.d.ts` (props contract) + `.prompt.md` (usage). Copy the `.jsx` directly into a React codebase; it only assumes the token CSS is loaded.

**Intentional additions** (not in the prototype, added for the mobile system): `MobileTabBar`. Everything else is extracted 1:1 from `EduTrack.dc.html`.
