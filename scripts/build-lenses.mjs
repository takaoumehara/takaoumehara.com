// ============================================================================
// Static Lens Generator — takaoumehara.com
// Pre-renders Canonical and Role Lens HTML pages for clean URL hosting
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LENSES, defaultLens } from './lenses.mjs';
import {
  renderHero,
  renderShowcase,
  renderSelectedProof,
  renderExplorations,
  renderCareerArc,
  renderAdvisory,
  renderClosing,
} from './renderer.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * Builds the page template with hydrated sections
 */
function buildHtmlForLens(lens, depth = 0) {
  const relPrefix = depth === 0 ? './' : '../'.repeat(depth);
  const isCanonical = lens.isCanonical;

  const sectionsHtml = [
    renderHero(lens),
    renderShowcase(lens),
    renderSelectedProof(lens),
    renderExplorations(lens),
    renderCareerArc(lens),
    renderAdvisory(lens),
    renderClosing(lens),
  ].join('\n');

  // Fix relative URLs in the generated HTML for nested depths
  let finalSections = sectionsHtml;
  if (depth > 0) {
    // Replace assets/ with ../assets/
    finalSections = finalSections
      .replace(/src="assets\//g, `src="${relPrefix}assets/`)
      .replace(/href="#/g, 'href="#');
  }

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${lens.meta.description}">
  ${lens.meta.noindex ? '<meta name="robots" content="noindex, nofollow">' : ''}
  <title>${lens.meta.title}</title>
  <meta property="og:title" content="${lens.meta.title}">
  <meta property="og:description" content="${lens.meta.description}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${relPrefix}assets/og/ai-tools.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${lens.meta.title}">
  <meta name="twitter:description" content="${lens.meta.description}">
  <meta name="twitter:image" content="${relPrefix}assets/og/ai-tools.jpg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&amp;family=Instrument+Sans:wdth,wght@75..100,400..700&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${relPrefix}styles.css">
  <link rel="icon" type="image/svg+xml" href="${relPrefix}favicon.svg">
</head>
<body data-lens="${lens.id}">
  <a class="skip-link" href="#main-content">Skip to selected work</a>

  <header class="site-header" data-site-header>
    <a class="site-mark" href="${relPrefix}#top" aria-label="Takao Umehara — back to top">
      <span class="site-mark__name">Takao Umehara</span>
      <span class="site-mark__tag">${isCanonical ? 'Design &amp; Systems · Venture Builder' : `Lens: ${lens.name}`}</span>
    </a>

    <nav class="desktop-nav" aria-label="Portfolio sections">
      <a href="#featured-showcase">Featured</a>
      <a href="#selected-proof">Career Archive</a>
      ${lens.sections.showCareerArc ? '<a href="#career-arc">Career Arc</a>' : ''}
      ${lens.sections.showAdvisory ? '<a href="#advisory">Advisory</a>' : ''}
      <a href="#contact">Contact</a>
    </nav>

    <nav class="utility-nav" aria-label="Profile links">
      <a href="${relPrefix}studio.html" class="utility-link--studio">
        Lens Studio <span aria-hidden="true">↗</span>
      </a>
      <a href="https://linkedin.com/in/takaoumehara" target="_blank" rel="noopener noreferrer">
        LinkedIn <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span>
      </a>
    </nav>

    <details class="mobile-nav" id="mobile-menu">
      <summary>Menu</summary>
      <nav aria-label="Mobile portfolio navigation">
        <a href="#featured-showcase">Featured</a>
        <a href="#selected-proof">Career Archive</a>
        ${lens.sections.showCareerArc ? '<a href="#career-arc">Career Arc</a>' : ''}
        ${lens.sections.showAdvisory ? '<a href="#advisory">Advisory</a>' : ''}
        <a href="#contact">Contact</a>
        <a href="${relPrefix}studio.html">Lens Studio ↗</a>
        <a href="https://linkedin.com/in/takaoumehara" target="_blank" rel="noopener noreferrer">
          LinkedIn ↗<span class="sr-only"> (opens in a new tab)</span>
        </a>
      </nav>
    </details>
  </header>

  <main id="main-content">
${finalSections}
  </main>

  <footer class="site-footer">
    <p><strong>Takao Umehara</strong><br>Creativity Is Everywhere LLC · New York · Tokyo</p>
    <nav aria-label="Footer navigation">
      <a href="#top">Top</a>
      <a href="#featured-showcase">Featured Work</a>
      <a href="#selected-proof">Evidence Base</a>
      <a href="${relPrefix}studio.html">Lens Studio</a>
      <a href="https://linkedin.com/in/takaoumehara" target="_blank" rel="noopener noreferrer">
        LinkedIn ↗<span class="sr-only"> (opens in a new tab)</span>
      </a>
    </nav>
  </footer>

  <dialog id="project-dialog" aria-labelledby="project-dialog-title" aria-describedby="project-dialog-summary">
    <div class="project-dialog__scroll" data-dialog-scroll>
      <header class="project-dialog__bar">
        <span class="project-dialog__count" data-dialog-count>01 / 12</span>
        <button class="icon-button" type="button" data-dialog-close>
          <span>Close</span><span aria-hidden="true"> ×</span>
        </button>
      </header>
      <article class="project-dialog__content">
        <p class="project-dialog__category" data-dialog-category>Category</p>
        <h2 id="project-dialog-title" data-dialog-title>Project</h2>
        <p class="project-dialog__summary" id="project-dialog-summary" data-dialog-summary></p>
        <dl class="project-dialog__meta">
          <div><dt>My Role</dt><dd data-dialog-role></dd></div>
          <div><dt>Period</dt><dd data-dialog-year></dd></div>
        </dl>
        <figure class="project-dialog__media" data-dialog-media></figure>
        
        <!-- Strict Fact Separation Container -->
        <div class="project-dialog__facts" data-dialog-facts></div>

        <div class="project-dialog__actions" style="margin-top: var(--space-6);">
          <a class="button-action" data-dialog-link href="#" target="_blank" rel="noopener noreferrer">
            <span>Open full project</span><span aria-hidden="true"> ↗</span>
          </a>
        </div>
      </article>
      <button class="project-dialog__next" type="button" data-dialog-next>
        <span>Next project: </span><strong data-dialog-next-title></strong>
      </button>
    </div>
  </dialog>

  <div class="sr-only" role="status" aria-live="polite" aria-atomic="true" data-status></div>
  <script type="module" src="${relPrefix}scripts/app.mjs"></script>
</body>
</html>
`;
}

// 1. Generate root index.html (Canonical site)
console.log('Generating Canonical index.html...');
const canonicalHtml = buildHtmlForLens(defaultLens, 0);
fs.writeFileSync(path.join(ROOT_DIR, 'index.html'), canonicalHtml, 'utf-8');

// 2. Generate discrete static pages for each role lens: /lens/:slug/index.html
const lensBaseDir = path.join(ROOT_DIR, 'lens');
if (!fs.existsSync(lensBaseDir)) {
  fs.mkdirSync(lensBaseDir, { recursive: true });
}

for (const lens of LENSES) {
  if (lens.isCanonical) continue;
  const lensDir = path.join(lensBaseDir, lens.slug);
  if (!fs.existsSync(lensDir)) {
    fs.mkdirSync(lensDir, { recursive: true });
  }

  console.log(`Generating Lens page: /lens/${lens.slug}/index.html...`);
  const lensHtml = buildHtmlForLens(lens, 2); // depth = 2 (../..)
  fs.writeFileSync(path.join(lensDir, 'index.html'), lensHtml, 'utf-8');
}

console.log('Static lens generation complete!');
