# Festival photography edit — 2026-10-10

26 photographs on `projects/festival-design.html` now reference sibling edited assets in `public/assets/festival-design/editorial/`. Original image bytes are retained and verified against Git HEAD. Flat branding, banner artwork and the reward card keep their existing references.

Generation used the parent workspace's `.env.local` `KIE_AI_API` through KIE. Nano Banana Pro produced the photographic edits at 2K: neutral soft indoor daylight, natural skin, accurate saturated brand colors, adult volunteer happi over casual clothes, and modest crowds of children and families using the actual games. The Yurayura booth uses its original flat banner artwork and a reconstructed rigid crossbar with attachments. Detail photographs retain their tight equipment framing. GPT Image 2, also through KIE, performed a separate face replacement pass on the 22 images with visible people; four equipment-only images did not require that pass.

These are AI-edited reconstructions based on actual event photographs, not an untouched photographic record. Garments, added participants and the Yurayura support were synthesized. The supplied happi appearance was specified in text and supported by the original festival crest/pattern assets. Small garment lettering and fabric placement are generated interpretations.

`manifest.json` records source and output paths, actual dimensions, bytes and SHA-256 hashes. `prompts.json` records the per-photo prompt set without credentials or upload URLs. The editable job runner is `scripts/edit-festival-photos.py`; `scripts/prepare-festival-photo-assets.py` prepares the local site assets and comparison gallery without making network requests.

Local review artifacts are in `output/festival-photo-edit/` (Git-ignored): `review.html` shows originals beside the selected edits; `final-contact-sheet.jpg` shows the complete set. Raw generated images, task results and discarded attempts remain there for review and resumption. The edited set is approved for production publication at `https://www.takaoumehara.com/projects/festival-design.html`.

Validation: Astro production build passed; Chromium loaded all 26 edited photographs; no page errors or horizontal overflow at a 390-pixel mobile viewport. Desktop and mobile screenshots are in the review folder. All 26 original images match Git HEAD byte for byte.

During reference discovery, one local happi quotation PDF was mistakenly used as a garment reference and submitted to KIE before its contents were validated. That request and its output were excluded from all deliverables. The uploaded file's deletion on the provider side has not been verified. A failure-memory entry records the correction: inspect and validate reference contents before any upload.

Correction after publication: `korinto-photo-1600` was regenerated from the original empty booth, using `korinto-play` as a gameplay/style reference. It now shows exactly one child with their back toward the camera, both feet on the floor, and one adult volunteer watching. The second board remains empty; no people sit, kneel or climb on cafeteria furniture. The selected correction uses GPT Image 2 through KIE and creates fictional participants.
