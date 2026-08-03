# takaoumehara.com

Portfolio website for Takao Umehara / Creativity Is Everywhere LLC.

## Local preview

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`.

## Verification

```bash
node --test tests/
```

`tests/*.test.mjs` assert page markup; `tests/*.unit.test.mjs` exercise the site's
scripts (`assets/work-card-grid.js`, `projects/amazon-firetv/js/*`) against the small
DOM/WebAudio stubs in `tests/helpers/dom.mjs`. No dependencies required.

