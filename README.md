# takaoumehara.com

Personal site of Takao Umehara. **One Takao. One evidence base. Different lenses.**

Built with [Astro](https://astro.build). The landing page, every `/lens/<slug>` page, the
category pages and the work archive are rendered from a structured career evidence
library. A Lens is a configuration that selects, orders and frames that evidence for
one audience — it cannot add facts. Architecture and rationale:
`docs/adaptive-portfolio-architecture.md` (the data model, the lenses, the pitch engine)
and `docs/astro-architecture.md` (how the site is built).

```
src/data/            the Career Evidence Library (projects, ventures, experiments, tools, roles, theses, taxonomy)
src/lenses/          one JSON per lens — default.json → /, <slug>.json → /lens/<slug>
src/categories/      the five sections of the work, one JSON each → /interactive.html, /ai-products.html …
src/layouts/         Site.astro — the shell: the sidebar (the work by category), the page, the footer. chrome={false} drops the rail (the landing page)
src/components/      Astro components: lens sections, category cards, the archive, /now, the bento (bento/) and the landing page (landing/)
src/bento/           one JSON per case study drawn as a bento — rows of cells that fill the viewport (docs/bento-layout.md)
src/case-studies/    the case-study bodies not converted yet (HTML fragments), one per /projects/<slug>.html
src/fragments/       the bodies of the hand-built pages (about, contact, publications, workshop …)
src/pages/           routes (about.astro → /about.html, projects/[slug].astro → /projects/<slug>.html, all/index.astro → /all/). Static except /lens/preview and /api/*
src/styles/          site.css (the design), shell.css (the sidebar), bento.css (the bento grid), grid.css, landing.css
src/lib/             site.mjs (data for the pages, validated once per build), html.mjs, labels.mjs, load.mjs
src/validate.mjs     schema checks + Claim Guard + NotMine Guard (the build fails on any violation)
src/analyze/         the Adaptive Pitch Engine: job description → evidence matching → lens draft (no model calls)
src/studio/          the Studio (/studio/) and the public demo (/try/), running the engine in the browser
src/server/          the API behind the Studio: GitHub sign-in, fetch a posting, publish a lens as a commit
scripts/             generate-pitch.mjs (JD → lens draft + report), audit-evidence.mjs, extract-page.mjs
public/              static files: assets/, favicon.svg
tests/               node:test over the built site (.vercel/output/static) + Playwright/axe in a real browser
```

## Editing

1. Edit or add evidence in `src/data/**/*.json`, a lens in `src/lenses/*.json`, a category in `src/categories/*.json`.
2. `npm run dev` and open `http://localhost:4321/`. Every guard runs on every page load; a violation is an error overlay.
3. `npm test` builds the site and runs the tests over the output. Commit the source; Vercel builds the pages.

To add a lens for one opportunity: copy `src/lenses/creative.json` to `src/lenses/<slug>.json`,
change the hero, the `items` and the CTA, keep `"noindex": true`, set `"status": "published"`.
The page is `https://takaoumehara.com/lens/<slug>`. A `"draft"` lens is validated but not built;
the dev server renders it at `/lens/<slug>/` so it can be read before it is published.

## A lens from a job description

```bash
node scripts/generate-pitch.mjs --url "https://boards.greenhouse.io/<company>/jobs/<id>"
node scripts/generate-pitch.mjs --company "Stripe" --jd path/to/jd.txt
node scripts/generate-pitch.mjs --company "Stripe"        # then paste the posting, Ctrl-D
```

It reads the posting into the capability taxonomy (no model, no API key — a lexicon in
`src/analyze/lexicon.json`), scores every record, picks 3–5 pieces of proof, and writes
`src/lenses/<slug>.json` as a **draft** plus `src/pitches/<slug>/report.md`: what matched,
what did not, and which record fields a hiring manager will ask about that are still empty.

**In the browser:** `/studio/` runs the same engine on the same modules: paste a posting, see
the proof, the Fit Ledger and the rendered page (rendered by `/lens/preview`, the same components
that build the site), adjust what a person may adjust, and publish. Publishing signs the owner in
with GitHub (`/api/auth/*`) and commits the lens JSON (`/api/publish`); Vercel builds the page.
Setup and the environment variables: `docs/adaptive-portfolio-architecture.md` §16.7.

`npm run audit` writes `docs/evidence-gaps.md`: for each record, the questions a recruiter
asks that the record cannot answer yet. Answer them in `src/data/**` — or record
`outcome.status: "unknown"` honestly.

## Verification

```bash
npm test            # astro build + node --test tests/*.test.mjs
npm run test:e2e    # Playwright: axe at WCAG 2.2 AA, keyboard, language switch, the Studio
```
