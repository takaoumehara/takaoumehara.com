# Sand entrances — 2026-10-07

The approved direction is visible sand gathering into a bento's images and text.
The previous frame-drawing, image wipes, and text decryption are paused, including
saved Motion Lab overrides. Their source stays available for a future decision.

`src/scripts/sand.js` is an independent Canvas 2D implementation inspired by the
CanvasUI Particle Scroll direction, not a port of its React/WebGL component.
It samples same-origin images and visible text positions. The real DOM remains
in place; the temporary decorative canvas fades off as the particles settle.
Videos and CSS artwork keep their real rendering underneath; those are not
captured into particle textures. Images still downloading enter with text grains.

- Initial viewport, client-side page entry, and newly visible bento cells: one
  entrance per element, 2200ms plus one frame for removal.
- No reverse dissolve, repeated scroll scrubbing, or intercepted scrolling.
- Six simultaneous canvases maximum; further visible cells queue and play as slots free.
- About long cells sample only their first 1200 CSS pixels; DPR capped at 1.5.
- Flat black/white image areas are excluded to avoid noisy fields of soot/static.
- Canvas overlays accept no pointer events and are hidden from accessibility APIs.
- Runtime reduced-motion, tab visibility, resize, and navigation cancel animation;
  observers reconnect for unseen cells when visibility/size/preference changes.

The rail accordion uses 220ms opening / 180ms closing with ease-out and no bounce.
Reversals start at the current rendered height; collapsed links are inert.
Reduced motion switches directly. Persistent rail and mobile chip triggers share
one category state.

Hero captions sit below the image, with controls alongside on desktop and below
on phones. Archive captions are a stable part of each tile below the media.
No white plaque covers artwork and caption hover does not alter card geometry.

A real-browser check caught media styles missing on `set:html` images: Astro's
scoped descendant selector did not match generated children. Use `:global(img)`
(and video/art equivalents) under the locally scoped media parent. The browser
regression checks image fit and bottom alignment, besides caption placement.

Aceternity's hover-expanding sidebar was considered and not adopted: this site
uses long category titles and nested project links, which benefit from a stable
rail width. Its React/Motion dependencies are unnecessary for this refinement.

## Visibility and shared system revision

The initial 950ms overlay was too subtle in actual use. The current default is
2200ms, with 1.5–3px grains, a 230px horizontal / 155px vertical scatter range,
full opacity for source grains, and a distinct particle-first phase. Real child
content begins appearing at 46% and reaches full opacity at 88% of the sequence.
All numerical controls and surface discovery rules live in
`src/data/sand-motion.json`; edit this file to change the whole site's treatment.

The engine is loaded once through the shared Site script. Existing bento, archive,
category, AI, proof and other lens cards are discovered by their shared classes.
Structural section/header/figure fallbacks also cover legacy FragmentPage pages.
Nested surfaces are deduplicated; there is no per-route animation code. A new
page using these components or normal section structure inherits the treatment.
A special surface can opt out with `data-sand="off"`. Admin, studio tools, forms
as standalone surfaces, and the sidebar remain excluded; normal form containers
reveal with the rest of their bento, and focusing a control immediately settles it.

Six simultaneous canvases are allowed. Additional visible surfaces queue instead
of silently losing their entrance; leaving the viewport removes a queued surface.
Focus or pointer input settles its own surface immediately. Existing one-shot,
cleanup, and live reduced-motion rules remain in force. All current defaults are defined by the shared JSON token file.
