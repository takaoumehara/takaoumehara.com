# Structured Tech Editorial

> Written by: superforge-ui · Last updated: 2026-08-24

## Surface

Mode: Persuade — a hiring manager or client decides to open the work and start a conversation.
Sacrificing: dense repeat-use controls and decorative motion.
Scope: redesign.
Out of scope: rewriting case studies, editing `v3/`, CMS, contact form.
Pinned by the brief: sans-serif first, modern and simple, strong rather than delicate, five named categories, strict rectangles, seamless detail transition, responsive, accessible.

## Design DNA

Route: B — existing design.

### Sources

| Source | What is carried forward | Deliberate divergence |
|---|---|---|
| User-supplied Portfolio Minimal `.dc.html` | Card-to-detail spatial continuity and generous reading space | Replace thin Newsreader and low-opacity text with firm sans hierarchy and measured contrast |
| `v3/` portfolio | Verified projects, facts, images, About language | Reduce several visual languages to one index system |
| User brief | Five categories, About, LinkedIn, aligned rectangles, mobile and desktop | No decorative 3D or persistent animation |

### Extracted

- Structure: header → claim → category index → five proof sections → About/contact.
- Space: 8px base; 2× steps inside components, 3–6× between groups, 12–16× between major sections.
- Type: 1.25 Major Third; hierarchy comes from size and weight; body measure 45–75 Latin characters.
- Colour: warm ground, near-black ink, one blue reserved for focus/selection/action.
- Motion: crisp, rare, spatial; only card → detail and its reverse.
- Imagery: repeated 4:3 card frames; 16:9 detail frame; no mixed masonry ratios.

### Deliberate divergence

The source prototype used delicacy as its personality. v4 moves personality into strict alignment and decisive weight, keeping the calm without sacrificing legibility.

```yaml
version: alpha
name: Structured Tech Editorial
description: A firm sans-serif portfolio system where an aligned rectangle becomes the project detail.
mode: light-only

colors:
  ground: "#FBFAF7"
  surface: "#FFFFFF"
  surfaceSubtle: "#F2EFE6"
  ink: "#111210"
  inkSecondary: "#585A53"
  accent: "#0E56FA"
  accentInk: "#FFFFFF"
  borderSubtle: "rgba(17, 18, 16, 0.08)"
  borderStrong: "#111210"
  disabledSurface: "#DEDCD4"
  disabledInk: "#6E706A"
  error: "#B42318"

typography:
  display:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3rem, 8vw, 7.5rem)"
    fontWeight: 700
    lineHeight: 0.94
    letterSpacing: "-0.04em"
  section:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 5rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 2.4vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  bodyLarge:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 1.8vw, 1.5rem)"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.08em"

spacing:
  1: "0.25rem"
  2: "0.5rem"
  3: "0.75rem"
  4: "1rem"
  6: "1.5rem"
  8: "2rem"
  12: "3rem"
  16: "4rem"
  24: "6rem"
  32: "8rem"

rounded:
  card: "0"
  control: "0.125rem"
  full: "9999px"

border:
  subtle: "1px solid {colors.borderSubtle}"
  strong: "2px solid {colors.borderStrong}"
  focus: "3px solid {colors.accent}"

motion:
  feedback: "120ms"
  small: "220ms"
  expand: "460ms"
  collapse: "340ms"
  easeOut: "cubic-bezier(0.22, 1, 0.36, 1)"
  easeIn: "cubic-bezier(0.7, 0, 0.84, 0)"
  easeSpatial: "cubic-bezier(0.65, 0, 0.35, 1)"

components:
  projectCard:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    borderTop: "{border.strong}"
    rounded: "{rounded.card}"
    focus: "{border.focus}"
  action:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accentInk}"
    rounded: "{rounded.control}"
    padding: "{spacing.3} {spacing.4}"
  navigationLink:
    textColor: "{colors.ink}"
    minHeight: "2.75rem"
    focus: "{border.focus}"
```

## Intent

The page should feel like someone who can set the system and make the surface: direct enough for engineering, spacious enough for design. The signature is not an effect added to the page; it is the selected rectangle becoming the reading space.

The spatial transition begins from the selected card's media rectangle inside the dialog top layer. Its preview releases early while the expanding warm ground progressively reveals the project hierarchy beneath it, which enters in a restrained 20ms stagger. Closing uses the same `easeSpatial` trajectory in reverse, with a shorter duration. Only `transform` and `opacity` animate; reduced-motion users get the final state immediately.

## Colour rationale

- Ground is warm rather than pure white so large areas remain comfortable without reducing text contrast.
- Ink is near-black. Secondary ink is a chromatic neutral and still measures 7.05:1 on the ground.
- Blue appears for selection, focus, and the one project action. It measures 4.56:1 on the ground and white measures 5.19:1 on blue.
- Only light mode is supported in this first review because the supplied reference and all selected source thumbnails were evaluated on a light editorial ground. Dark mode is a future direction, not an automatic inversion.

## Type rationale

Instrument Sans carries the full reading hierarchy in weights 400, 600, and 700. IBM Plex Mono is restricted to literal metadata: year/status, category index, and count. Japanese falls back to the platform sans stack without changing the layout contract.

## Density

Desktop cards appear three to a row except the two-item AI Products section; tablet uses two; mobile uses one. Nothing is masonry. Text inside a card is compact, while category sections receive enough separation to be distinct destinations.

## Budget

- Time to something useful: under 2.5s on a mid-range phone over 4G. If exceeded, optimise the first visible images or remove a webfont weight.
- Visible response: under 100ms after card activation. If exceeded, simplify the transition controller before changing the number.
- First screen: under 1MB transferred; HTML/CSS/JS under 150KB. If exceeded, reduce imagery before adding infrastructure.

## Don'ts

- No serif display face, gradient text, glass panel, glow, or decorative blur.
- No opacity-based disabled state and no text below AA contrast.
- No rounded card grid, masonry, or image ratios that break row alignment.
- No monospace as a costume for paragraphs or headlines.
- No motion beyond feedback and the single spatial transition.

## Component states

- Default: firm top rule, ground surface, full-contrast text.
- Hover: image moves no more than 2%; action cue becomes blue.
- Focus: 3px blue outline with 4px offset, independent of hover.
- Active: 0.99 scale for no more than 120ms.
- Disabled: named disabled surface and ink; no opacity shortcut.
- Loading: reserved 4:3 media block with a static structural placeholder after 200ms.
- Error: high-contrast replacement panel naming the project and recovery link.
- Empty: category explanation and a link to the complete v3 index.

## New patterns needed

- A verified dark token set if dark mode is requested later.
- Local self-hosted Instrument Sans files before production deployment if third-party font delivery is not acceptable.
