# Motion comparison lab

Open `/work?lab=1` (or `/?lab=1` on Home). `/lab/motion` opens the Home lab.
The panel travels with client-side navigation, so the same take can be viewed on
Home, About, categories, archive, lens, and detail pages.

Choose a preset, change its controls, then Replay. Auto replay can be disabled.
Sand presets: fine & quick (700ms), snap (450ms), soft (1000ms), previous coarse
(2200ms). Original — before particles restores the saved original choreography.
Blueprint, Viewfinder, Terminal, Samurai, Decode, Paper, Skeleton, Iris, Kanji,
Lens (blur), Instant are available for legacy comparisons. Off settles everything.

The shared config now contains global.engine (sand/legacy/off), sand, interaction,
layout, and all original rail/pane/text/media/out controls. Only relevant effect
controls are shown. The accordion's open/close duration and easing are independent
of the entrance effect. Name placement previews current vs top-left without
changing public layout defaults.

Copy JSON or Download JSON exports the complete current configuration to
`takao-motion-config.json`; send it back to Codex for applying to the site.
Import JSON accepts the same file pasted into the textarea; older legacy files
without a sand/engine section are treated as legacy. Changes are saved locally
for the lab tab and work on reload/navigation. Closing the lab restores public
defaults. The exported file contains configuration only, no credentials.

Sand now samples rounded box backgrounds as well as contents. The real box's
background, border and shadow are transparent during scatter, then return as
particles settle. This is a Canvas 2D reconstruction with real DOM crossfade;
video, CSS gradients/art and embedded tools are not full captured textures.
Grain size, budget, scatter X/Y, swirl, gravity, stagger, background contrast,
ambient dust, content timing, duration and concurrent box limit are adjustable.
Numeric bounds protect against invalid imported values, selectors stay trusted,
and reduced-motion preferences remain respected. Focus immediately settles its
surface and cleanup restores background animations and text on mode changes.
