// ============================================================================
// Adaptive Page Renderer — takaoumehara.com
// Dynamically renders the portfolio based on the active Role Lens
// ============================================================================

import {
  PROJECTS,
  CAREER_CHAPTERS,
  THESES,
  getProjectById,
  getProjectBySlug,
} from './evidence-db.mjs';
import { LENSES, defaultLens } from './lenses.mjs';

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Builds the visual media for a project slide/card
 */
export function buildMediaMarkup(project, isFeatured = false) {
  if (project.assets?.previewType === 'canvas' && project.assets?.art === 'resona') {
    return `
      <div class="featured-preview featured-preview--resona" role="img" aria-label="Resona dynamic orbit motion physics visualization">
        <div class="resona-interactive-stage">
          <span class="resona-orbit-ring"></span>
          <span class="resona-orbit-point"></span>
          <span class="resona-core-pulse"></span>
        </div>
        <span class="preview-caption">${escapeHtml(project.assets.caption || 'Mass · Friction · Pseudo-Haptics')}</span>
      </div>
    `;
  }

  if (project.assets?.previewType === 'canvas' && project.assets?.art === 'rakugaki') {
    return `
      <div class="featured-preview featured-preview--rakugaki" role="img" aria-label="Rakugaki Jam interactive canvas preview">
        <div class="rakugaki-stage-mini">
          <span class="rakugaki-dot d1"></span>
          <span class="rakugaki-dot d2"></span>
          <span class="rakugaki-dot d3"></span>
          <span class="rakugaki-stroke"></span>
        </div>
        <span class="preview-caption">${escapeHtml(project.assets.caption || 'Realtime Multiplayer Canvas')}</span>
      </div>
    `;
  }

  if (project.assets?.previewType === 'canvas' && project.assets?.art === 'moime') {
    return `
      <div class="featured-preview featured-preview--moime" role="img" aria-label="Moime.app camera scanning interface">
        <div class="moime-scanner-reticle">
          <span class="reticle-corner tl"></span>
          <span class="reticle-corner tr"></span>
          <span class="reticle-corner bl"></span>
          <span class="reticle-corner br"></span>
          <span class="reticle-laser"></span>
        </div>
        <span class="preview-caption">${escapeHtml(project.assets.caption || 'Multimodal Vision Scanner')}</span>
      </div>
    `;
  }

  if (project.assets?.previewType === 'canvas' && project.assets?.art === 'kao') {
    return `
      <div class="featured-preview featured-preview--kao" role="img" aria-label="Kao Game face controller preview">
        <div class="kao-face-reticle">
          <span class="face-eye left"></span>
          <span class="face-eye right"></span>
          <span class="face-smile"></span>
        </div>
        <span class="preview-caption">${escapeHtml(project.assets.caption || 'Face Landmark Detection')}</span>
      </div>
    `;
  }

  if (project.assets?.thumbnail) {
    return `
      <div class="featured-preview ${isFeatured ? 'featured-preview--image' : ''}">
        <img src="${escapeHtml(project.assets.thumbnail)}" alt="${escapeHtml(project.title)} preview" loading="lazy" />
        ${project.assets.caption ? `<span class="preview-caption">${escapeHtml(project.assets.caption)}</span>` : ''}
      </div>
    `;
  }

  return `
    <div class="featured-preview dialog-media-fallback">
      <span class="fallback-title">${escapeHtml(project.title)}</span>
      <span class="preview-caption">${escapeHtml(project.tagline)}</span>
    </div>
  `;
}

/**
 * Renders the Adaptive Hero Section
 */
export function renderHero(lens) {
  const isCanonical = lens.isCanonical;
  
  // Lens Selector pills
  const lensPills = LENSES.map((l) => {
    const active = l.id === lens.id ? 'is-active' : '';
    const href = l.isCanonical ? './' : (lens.isCanonical ? `./lens/${l.slug}/` : `../${l.slug}/`);
    return `<a href="${href}" class="lens-pill ${active}" data-lens-id="${l.id}">${escapeHtml(l.name)}</a>`;
  }).join('');

  return `
    <section class="hero" id="top" aria-labelledby="hero-title">
      <div class="hero__header-strip">
        <p class="hero__meta">${escapeHtml(lens.hero.eyebrow)}</p>
        <div class="hero__lens-selector" aria-label="Role perspective switcher">
          <span class="lens-selector__label">Lens:</span>
          <div class="lens-selector__pills">
            ${lensPills}
          </div>
        </div>
      </div>

      ${!isCanonical ? `
        <div class="hero__lens-notice" role="note">
          <span class="lens-notice__badge">${lens.isCustom ? 'Tailored Lens' : 'Role Lens'}: ${escapeHtml(lens.name)}</span>
          <span class="lens-notice__text">Curated perspective from Takao’s single career evidence archive. Same factual work, tailored narrative.</span>
          ${lens.isCustom ? '<a href="./studio.html" class="lens-notice__reset">Studio ↗</a>' : ''}
          <a href="./" class="lens-notice__reset">Reset to Canonical</a>
        </div>
      ` : ''}

      <h1 id="hero-title">${escapeHtml(lens.hero.title)}</h1>

      <div class="hero__foot">
        <p class="hero__lead">${escapeHtml(lens.hero.lead)}</p>
        
        <div class="hero__capabilities">
          <span class="capabilities-label">Core Capabilities:</span>
          <div class="capability-tag-list">
            ${lens.capabilityPriority.map((cap) => `<span class="capability-tag">${escapeHtml(cap)}</span>`).join('')}
          </div>
        </div>

        ${lens.analysis ? `
          <div class="hero__alignment-strip">
            <div class="alignment-pill-group">
              <span class="alignment-pill-label">Direct Alignment:</span>
              ${(lens.analysis.directMatches || []).slice(0, 3).map((m) => `<span class="alignment-pill alignment-pill--direct">${escapeHtml(m)}</span>`).join('')}
            </div>
            ${(lens.analysis.gaps || []).length > 0 ? `
              <div class="alignment-pill-group">
                <span class="alignment-pill-label">Explicit Boundaries:</span>
                ${(lens.analysis.gaps || []).slice(0, 2).map((g) => `<span class="alignment-pill alignment-pill--gap">${escapeHtml(typeof g === 'string' ? g : g.title)}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        ` : ''}

        <div class="hero__actions">
          <a class="button-action" href="${escapeHtml(lens.hero.ctaPrimary.href)}">
            <span>${escapeHtml(lens.hero.ctaPrimary.text)}</span>
            <span class="action-icon" aria-hidden="true">${escapeHtml(lens.hero.ctaPrimary.icon || '↓')}</span>
          </a>
          <a class="text-action" href="${escapeHtml(lens.hero.ctaSecondary.href)}">
            <span>${escapeHtml(lens.hero.ctaSecondary.text)}</span>
            <span aria-hidden="true">${escapeHtml(lens.hero.ctaSecondary.icon || '→')}</span>
          </a>
        </div>
      </div>
    </section>
  `;
}

/**
 * Renders the Featured Showcase (5 ordered hero projects)
 */
export function renderShowcase(lens) {
  const slides = lens.featuredProjects.map((override, index) => {
    const project = getProjectById(override.projectId);
    if (!project) return '';

    const slideNum = String(index + 1).padStart(2, '0');
    const totalCount = String(lens.featuredProjects.length).padStart(2, '0');
    const tagline = override.customTagline || project.tagline;
    const summary = override.customSummary || project.summary;
    const metrics = (project.metrics || []).slice(0, 3);

    return `
      <article class="featured-slide ${index === 0 ? 'is-active' : ''}" data-featured-slide="${index}" data-featured-slug="${escapeHtml(project.slug)}" id="featured-${escapeHtml(project.slug)}">
        <div class="featured-slide__inner">
          <div class="featured-slide__header">
            <span class="featured-slide__badge">Featured ${slideNum} / ${totalCount}</span>
            <span class="featured-slide__category">${escapeHtml(override.emphasis || project.role)}</span>
          </div>

          <div class="featured-slide__grid">
            <div class="featured-slide__content">
              <p class="featured-slide__tagline">${escapeHtml(tagline)}</p>
              <h2 class="featured-slide__title">${escapeHtml(project.title)}</h2>
              ${project.subtitle ? `<p class="featured-slide__subtitle">${escapeHtml(project.subtitle)}</p>` : ''}
              <p class="featured-slide__summary">${escapeHtml(summary)}</p>

              <!-- Metrics Strip -->
              ${metrics.length > 0 ? `
                <div class="featured-slide__metrics-strip">
                  ${metrics.map((m) => `
                    <div class="metric-pill">
                      <span class="metric-value">${escapeHtml(m.value)}</span>
                      <span class="metric-label">${escapeHtml(m.label)}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              <div class="featured-slide__meta-grid">
                <div class="meta-item">
                  <span class="meta-label">My Role</span>
                  <span class="meta-value">${escapeHtml(project.role)}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Capabilities</span>
                  <div class="tech-tags">
                    ${project.capabilities.slice(0, 3).map((c) => `<span class="tech-tag">${escapeHtml(c)}</span>`).join('')}
                  </div>
                </div>
              </div>

              <div class="featured-slide__actions">
                ${project.links?.live ? `
                  <a class="button-primary" href="${escapeHtml(project.links.live)}" target="_blank" rel="noopener noreferrer">
                    <span>Launch Live</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ` : ''}
                <button class="button-secondary" type="button" data-open-detail="${escapeHtml(project.slug)}">
                  <span>View Evidence &amp; Specs</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>

            <div class="featured-slide__media">
              ${buildMediaMarkup(project, true)}
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');

  const trackerButtons = lens.featuredProjects.map((override, index) => {
    const project = getProjectById(override.projectId);
    const num = String(index + 1).padStart(2, '0');
    return `
      <button class="showcase-tracker__btn ${index === 0 ? 'is-active' : ''}" type="button" data-showcase-goto="${index}" aria-label="Jump to ${escapeHtml(project?.title || '')}">
        ${num}
      </button>
    `;
  }).join('');

  return `
    <section class="featured-showcase" id="featured-showcase" aria-label="Featured Projects Showcase" data-featured-showcase>
      <nav class="showcase-tracker" aria-label="Featured projects quick navigation" data-showcase-tracker>
        <div class="showcase-tracker__counter"><span data-showcase-current>01</span> / 05</div>
        <div class="showcase-tracker__nav">
          ${trackerButtons}
        </div>
        <div class="showcase-tracker__space-hint" aria-hidden="true">
          <kbd>Space</kbd> <span>to cycle</span>
        </div>
      </nav>

      ${slides}
    </section>
  `;
}

/**
 * Renders the All Career Evidence Grid
 */
export function renderSelectedProof(lens) {
  const cards = PROJECTS.map((p, idx) => {
    // Check if project has an override in this lens
    const override = lens.featuredProjects.find((o) => o.projectId === p.id);
    const emphasis = override?.emphasis || p.role;
    const summary = override?.customSummary || p.summary;

    return `
      <a class="project-card ${idx % 3 === 0 ? 'two-col' : 'three-col'}" data-project="${escapeHtml(p.slug)}" id="card-${escapeHtml(p.slug)}" href="?project=${escapeHtml(p.slug)}" aria-haspopup="dialog" aria-label="Open case study for ${escapeHtml(p.title)}">
        <div class="project-card__inner">
          <div class="project-card__head">
            <span class="project-card__category">${escapeHtml(emphasis)}</span>
            <span class="project-card__year">${escapeHtml(p.period)}</span>
          </div>

          <div class="project-card__media">
            ${buildMediaMarkup(p, false)}
          </div>

          <div class="project-card__body">
            <h3 class="project-card__title">${escapeHtml(p.title)}</h3>
            <p class="project-card__tagline">${escapeHtml(p.tagline)}</p>
            <p class="project-card__summary">${escapeHtml(summary)}</p>

            ${p.metrics && p.metrics.length > 0 ? `
              <div class="project-card__metrics">
                <span class="metric-strong">${escapeHtml(p.metrics[0].value)}</span>
                <span class="metric-label">${escapeHtml(p.metrics[0].label)}</span>
              </div>
            ` : ''}

            <div class="project-card__footer">
              <span class="project-card__role">${escapeHtml(p.role)}</span>
              <span class="project-card__cue">
                <span>View Evidence</span>
                <span aria-hidden="true">→</span>
              </span>
            </div>
          </div>
        </div>
      </a>
    `;
  }).join('');

  return `
    <section class="selected-proof-section" id="selected-proof" aria-labelledby="proof-title">
      <div class="section-header">
        <p class="section-eyebrow">Career Evidence Base</p>
        <h2 id="proof-title">Complete Work &amp; Case Studies</h2>
        <p class="section-lead">A unified archive of verified delivery across enterprise AI, spatial experiences, brand systems, and 0→1 products.</p>
      </div>

      <div class="project-grid">
        ${cards}
      </div>
    </section>
  `;
}

/**
 * Renders "What I'm Exploring Now" (Theses & Intent)
 */
export function renderExplorations(lens) {
  if (!lens.sections.showExplorations) return '';

  return `
    <section class="explorations-section" id="explorations" aria-labelledby="explorations-title">
      <div class="section-header">
        <p class="section-eyebrow">Operating Theses</p>
        <h2 id="explorations-title">What I’m Exploring Now</h2>
        <p class="section-lead">Core bets on how human capability, autonomous software, and sensory experience are shifting.</p>
      </div>

      <div class="theses-grid">
        ${THESES.map((t) => `
          <div class="thesis-card">
            <h3 class="thesis-statement">“${escapeHtml(t.statement)}”</h3>
            <p class="thesis-elaboration">${escapeHtml(t.elaboration)}</p>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

/**
 * Renders "Career Arc" (Narrative Progression)
 */
export function renderCareerArc(lens) {
  if (!lens.sections.showCareerArc) return '';

  return `
    <section class="career-arc-section" id="career-arc" aria-labelledby="career-arc-title">
      <div class="section-header">
        <p class="section-eyebrow">Evolution &amp; Disciplines</p>
        <h2 id="career-arc-title">Career Arc: From Craft to Systems</h2>
        <p class="section-lead">One trajectory moving from visual craft to interactive computing, enterprise scale, and venture architecture.</p>
      </div>

      <div class="career-arc-timeline">
        ${CAREER_CHAPTERS.map((ch, idx) => `
          <div class="arc-step">
            <div class="arc-step__number">0${idx + 1}</div>
            <div class="arc-step__content">
              <span class="arc-step__period">${escapeHtml(ch.period)}</span>
              <h3 class="arc-step__title">${escapeHtml(ch.title)}</h3>
              <p class="arc-step__summary">${escapeHtml(ch.summary)}</p>
              <div class="arc-step__tags">
                ${ch.capabilities.map((c) => `<span class="tech-tag">${escapeHtml(c)}</span>`).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

/**
 * Renders "Where I Can Be Useful to Leadership" (Advisory)
 */
export function renderAdvisory(lens) {
  if (!lens.sections.showAdvisory) return '';

  const advisoryAreas = [
    {
      title: '0→1 Venture Building',
      desc: 'Formulating the initial thesis, building working prototypes, validating with early adopters, and creating enough clarity for a team to execute.'
    },
    {
      title: 'Enterprise AI & Workflow Systems',
      desc: 'Designing agentic UX and decision-support systems that integrate with existing human workflows rather than forcing separate destinations.'
    },
    {
      title: 'Experience & Model Transformation',
      desc: 'Reimagining products or business models when external disruptions render legacy playbooks unviable.'
    },
    {
      title: 'US ↔ Japan Cross-Border Bridges',
      desc: 'Advising global companies on cultural nuance, product localization, and strategic design between Tokyo and New York.'
    }
  ];

  return `
    <section class="advisory-section" id="advisory" aria-labelledby="advisory-title">
      <div class="section-header">
        <p class="section-eyebrow">Engagement Modes</p>
        <h2 id="advisory-title">Where I Can Be Useful to Leadership</h2>
        <p class="section-lead">Working as a venture builder, fractional executive, or confidential advisory partner.</p>
      </div>

      <div class="advisory-grid">
        ${advisoryAreas.map((a) => `
          <div class="advisory-card">
            <h3 class="advisory-card__title">${escapeHtml(a.title)}</h3>
            <p class="advisory-card__desc">${escapeHtml(a.desc)}</p>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

/**
 * Renders the Studio Link & Closing CTA
 */
export function renderClosing(lens) {
  return `
    ${lens.sections.showStudioLink ? `
      <section class="studio-callout" aria-labelledby="studio-title">
        <div class="studio-callout__inner">
          <span class="studio-eyebrow">Studio Partnership</span>
          <h2 id="studio-title">Creativity is Everywhere</h2>
          <p>For client commissions, brand innovation sprints, and venture partnerships, explore my independent creative studio.</p>
          <a href="https://creativityiseverywhere.com" class="button-secondary" target="_blank" rel="noopener noreferrer">
            <span>Visit creativityiseverywhere.com</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    ` : ''}

    <section class="contact-cta-section" id="contact" aria-labelledby="contact-title">
      <div class="contact-cta__inner">
        <h2 id="contact-title">${escapeHtml(lens.cta.heading)}</h2>
        <p class="contact-cta__sub">${escapeHtml(lens.cta.subheading)}</p>
        <div class="contact-cta__actions">
          <a href="${escapeHtml(lens.cta.primaryAction.href)}" class="button-action">
            <span>${escapeHtml(lens.cta.primaryAction.text)}</span>
            <span aria-hidden="true">→</span>
          </a>
          ${lens.cta.secondaryAction ? `
            <a href="${escapeHtml(lens.cta.secondaryAction.href)}" class="text-action" target="_blank" rel="noopener noreferrer">
              <span>${escapeHtml(lens.cta.secondaryAction.text)}</span>
              <span aria-hidden="true">↗</span>
            </a>
          ` : ''}
        </div>
      </div>
    </section>
  `;
}

/**
 * Fills the deep-dive Modal Dialog with strict fact separation
 */
export function fillProjectModal(dialogEl, project, lens) {
  if (!dialogEl || !project) return;

  const countEl = dialogEl.querySelector('[data-dialog-count]');
  const categoryEl = dialogEl.querySelector('[data-dialog-category]');
  const titleEl = dialogEl.querySelector('[data-dialog-title]');
  const summaryEl = dialogEl.querySelector('[data-dialog-summary]');
  const roleEl = dialogEl.querySelector('[data-dialog-role]');
  const yearEl = dialogEl.querySelector('[data-dialog-year]');
  const mediaEl = dialogEl.querySelector('[data-dialog-media]');
  const factContainer = dialogEl.querySelector('[data-dialog-facts]');
  const fullLink = dialogEl.querySelector('[data-dialog-link]');

  if (titleEl) titleEl.textContent = project.title;
  if (categoryEl) categoryEl.textContent = `${project.organization || ''} · ${project.role}`;
  if (yearEl) yearEl.textContent = project.period || '';
  if (roleEl) roleEl.textContent = project.role || '';

  // Use lens override summary if available
  const override = lens?.featuredProjects.find((o) => o.projectId === project.id);
  if (summaryEl) summaryEl.textContent = override?.customSummary || project.summary;

  // Media
  if (mediaEl) {
    mediaEl.innerHTML = buildMediaMarkup(project, true);
  }

  // Fact boundary container (What I did vs What Team did)
  if (factContainer) {
    factContainer.innerHTML = `
      <div class="modal-fact-section">
        <h4 class="fact-heading fact-heading--personal">What Takao Personally Did</h4>
        <ul class="fact-list fact-list--personal">
          ${(project.myContribution || []).map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
        </ul>
      </div>

      ${project.teamContribution && project.teamContribution.length > 0 ? `
        <div class="modal-fact-section">
          <h4 class="fact-heading fact-heading--team">What the Team Executed</h4>
          <ul class="fact-list fact-list--team">
            ${project.teamContribution.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${project.businessImpact && project.businessImpact.length > 0 ? `
        <div class="modal-fact-section">
          <h4 class="fact-heading">Business &amp; Strategic Impact</h4>
          <ul class="fact-list">
            ${project.businessImpact.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${project.constraints && project.constraints.length > 0 ? `
        <div class="modal-fact-section">
          <h4 class="fact-heading">Severe Constraints Overcome</h4>
          <ul class="fact-list">
            ${project.constraints.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <div class="modal-fact-section">
        <h4 class="fact-heading">Capabilities Demonstrated</h4>
        <div class="tech-tags">
          ${project.capabilities.map((c) => `<span class="tech-tag">${escapeHtml(c)}</span>`).join('')}
        </div>
      </div>
    `;
  }

  // Links
  if (fullLink) {
    const textSpan = fullLink.querySelector('span:first-child');
    if (project.links?.live) {
      fullLink.href = project.links.live;
      if (textSpan) textSpan.textContent = 'Open full project';
      fullLink.style.display = 'inline-flex';
    } else if (project.links?.github) {
      fullLink.href = project.links.github;
      if (textSpan) textSpan.textContent = 'Open full project';
      fullLink.style.display = 'inline-flex';
    } else if (project.links?.caseStudy && !project.links.caseStudy.startsWith('../v3')) {
      fullLink.href = project.links.caseStudy;
      if (textSpan) textSpan.textContent = 'Open full project';
      fullLink.style.display = 'inline-flex';
    } else {
      fullLink.style.display = 'none';
    }
  }
}
