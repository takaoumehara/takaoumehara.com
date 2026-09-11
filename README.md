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
```

## Editing

1. Edit or add evidence in `src/data/**/*.json`, or a lens in `src/lenses/*.json`.
2. `npm run generate` (or `node src/build.mjs`). Generated files are committed — the diff is what gets published.
3. `npm test`.

To add a lens for one opportunity: copy `src/lenses/creative.json` to `src/lenses/<slug>.json`,
change the hero, the `items` and the CTA, keep `"noindex": true`, build, commit. The page is
`https://takaoumehara.com/lens/<slug>`.

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
