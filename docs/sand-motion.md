# Sand entrances — 2026-10-07

The approved direction is fine sand gathering into a bento's images and text.
The previous frame-drawing, image wipes, and text decryption are paused, including
saved Motion Lab overrides. Their source stays available for a future decision.

`src/scripts/sand.js` is an independent Canvas 2D implementation inspired by the
CanvasUI Particle Scroll direction, not a port of its React/WebGL component.
It samples same-origin images and visible text positions. The real DOM remains
in place; the temporary decorative canvas fades off as the particles settle.
Videos and CSS artwork keep their real rendering underneath; those are not
captured into particle textures. Images still downloading enter with text grains.

- Initial viewport, client-side page entry, and newly visible bento cells: one
  entrance per element, roughly 950ms plus one frame for removal.
- No reverse dissolve, repeated scroll scrubbing, or intercepted scrolling.
- Six simultaneous canvases maximum; further cells show normally under load.
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
