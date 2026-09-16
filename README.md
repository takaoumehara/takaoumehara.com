# takaoumehara.com

Personal site of Takao Umehara. **One Takao. One evidence base. Different lenses.**

The homepage and every `/lens/<slug>` page are generated from a structured career
evidence library. A Lens is a configuration that selects, orders and frames that
evidence for one audience — it cannot add facts. Architecture and rationale:
`docs/adaptive-portfolio-architecture.md`.

```
src/data/            the Career Evidence Library (projects, ventures, experiments, tools, roles, theses, taxonomy)
src/lenses/          one JSON per lens — default.json → /, <slug>.json → /lens/<slug>
src/render/          components: (data, ctx) => HTML string. lens.css is inlined at build time
src/validate.mjs     schema checks + Claim Guard + NotMine Guard (build fails on any violation)
src/build.mjs        deterministic publishing: writes index.html and lens/<slug>/index.html
src/schema.d.ts      the types, for editor completion and as documentation
src/analyze/         Phase 2: job-description analysis → evidence matching → lens draft (no model calls)
scripts/             generate-pitch.mjs (JD → lens draft + report), audit-evidence.mjs (record gaps)
studio/              the Studio: the engine and the renderer running in the browser, publish through api/
api/                 Vercel Functions: GitHub sign-in (owner only), fetch a posting, publish a lens as a commit
```

## Editing

1. Edit or add evidence in `src/data/**/*.json`, or a lens in `src/lenses/*.json`.
2. `npm run generate` (or `node src/build.mjs`). Generated files are committed — the diff is what gets published.
3. `npm test`.

To add a lens for one opportunity: copy `src/lenses/creative.json` to `src/lenses/<slug>.json`,
change the hero, the `items` and the CTA, keep `"noindex": true`, build, commit. The page is
`https://takaoumehara.com/lens/<slug>`.

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
A page the engine cannot read (JavaScript-rendered, login) is refused with a paste workaround.

Then: read the report, rewrite the hero in your own words, `npm run preview` (renders drafts
to `lens/_preview/<slug>/`, git-ignored), set `"status": "published"`, `npm run generate`,
`npm test`, commit. Every sentence you write is checked by the Claim Guard and NotMine Guard.

**In the browser:** `/studio/` runs the same engine on the same modules (no build step, no
dependencies): paste a posting, see the proof, the Fit Ledger and the rendered page, adjust what a
person may adjust, and publish. Publishing signs the owner in with GitHub (`api/auth/*`) and commits
the lens and the built page in one commit (`api/publish.mjs`). Setup and the environment variables
it needs: `docs/adaptive-portfolio-architecture.md` §16.7. Without the API (a local
`python3 -m http.server`), the Studio still works up to "Download JSON".

`npm run audit` writes `docs/evidence-gaps.md`: for each record, the questions a recruiter
asks that the record cannot answer yet (how much was yours, team size, dates, outcome).
Answer them in `src/data/**` — or record `outcome.status: "unknown"` honestly.
Design notes: `docs/adaptive-portfolio-architecture.md` §16.

Everything else (`about.html`, `work.html`, `projects/*.html`, …) is still hand-built HTML and is
linked from the evidence as case-study detail. `index-console.html` is the previous hand-built homepage.

## Local preview

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`.

## Verification

```bash
npm test
```
