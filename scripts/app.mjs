// ============================================================================
// Adaptive Career Narrative App — takaoumehara.com
// "One Takao. One evidence base. Different lenses."
// ============================================================================

import {
  PROJECTS,
  getProjectById,
  getProjectBySlug,
} from './evidence-db.mjs';
import {
  defaultLens,
  getLensBySlug,
  getLensById,
  LENSES,
} from './lenses.mjs';
import {
  renderHero,
  renderShowcase,
  renderSelectedProof,
  renderExplorations,
  renderCareerArc,
  renderAdvisory,
  renderClosing,
  fillProjectModal,
} from './renderer.mjs';
import {
  clearProjectUrl,
  historyState,
  projectSlug,
  projectUrl,
} from './history.mjs';
import { decodeLensFromUrlParam } from './lens-engine.mjs';

// Determine active lens from dataset, query param, or pathname
export async function resolveActiveLens() {
  const params = new URLSearchParams(window.location.search);

  // 1. Check custom compressed lens parameter (?c=... or ?lens_data=...)
  const customParam = params.get('c') || params.get('lens_data');
  if (customParam) {
    const customLens = await decodeLensFromUrlParam(customParam);
    if (customLens) {
      return customLens;
    }
  }

  // 2. Check query parameter (?lens=creative)
  const lensParam = params.get('lens');
  if (lensParam) {
    return getLensBySlug(lensParam);
  }

  // 3. Check URL pathname (e.g. /lens/creative/ or /lens/ai-product/)
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const lensIndex = pathParts.indexOf('lens');
  if (lensIndex !== -1 && pathParts[lensIndex + 1]) {
    return getLensBySlug(pathParts[lensIndex + 1]);
  }

  // 4. Check body dataset attribute (useful for pre-rendered pages)
  if (document.body.dataset.lens) {
    return getLensById(document.body.dataset.lens);
  }

  return defaultLens;
}

let activeLens = defaultLens;

// DOM elements
const mainContent = document.querySelector('#main-content');
const dialog = document.querySelector('#project-dialog');
const dialogScroll = dialog?.querySelector('[data-dialog-scroll]');
const closeButton = dialog?.querySelector('[data-dialog-close]');
const nextButton = dialog?.querySelector('[data-dialog-next]');
const status = document.querySelector('[data-status]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const view = {
  active: null,
  trigger: null,
  scrollY: 0,
  cardRect: null,
  historyPushed: false,
};

function setStatus(message) {
  if (status) status.textContent = message;
}

function wireImageFallback(root = document) {
  root.querySelectorAll('.project-card__media img, .featured-preview img').forEach((image) => {
    image.addEventListener('error', () => {
      const container = image.closest('.project-card__media, .featured-preview');
      container?.classList.add('is-image-error');
    }, { once: true });
  });
}

// ── Showcase Carousel State & Logic ──
let currentFeaturedIndex = 0;
let featuredSlides = [];
let trackerCurrent = null;
let trackerBtns = [];

function updateShowcaseSlide(index, shouldScroll = false) {
  if (featuredSlides.length === 0) return;
  currentFeaturedIndex = (index + featuredSlides.length) % featuredSlides.length;

  featuredSlides.forEach((slide, i) => {
    const isActive = i === currentFeaturedIndex;
    slide.classList.toggle('is-active', isActive);
    if (isActive) {
      slide.removeAttribute('aria-hidden');
      if (shouldScroll) {
        slide.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else {
      slide.setAttribute('aria-hidden', 'true');
    }
  });

  trackerBtns.forEach((btn, i) => {
    const isActive = i === currentFeaturedIndex;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  if (trackerCurrent) {
    trackerCurrent.textContent = String(currentFeaturedIndex + 1).padStart(2, '0');
  }
}

function initShowcaseControls() {
  const showcase = document.querySelector('[data-featured-showcase]');
  if (!showcase) return;

  featuredSlides = [...showcase.querySelectorAll('[data-featured-slide]')];
  trackerCurrent = showcase.querySelector('[data-showcase-current]');
  trackerBtns = [...showcase.querySelectorAll('[data-showcase-goto]')];

  trackerBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetIndex = Number(btn.getAttribute('data-showcase-goto'));
      if (!Number.isNaN(targetIndex)) {
        updateShowcaseSlide(targetIndex, true);
      }
    });
  });

  // Spacebar to cycle slides when not focused in input/dialog
  window.addEventListener('keydown', (e) => {
    if (dialog?.open) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if (e.code === 'Space' && !e.repeat) {
      const activeEl = document.activeElement;
      if (activeEl?.tagName === 'BUTTON' || activeEl?.tagName === 'A') {
        // Let natural button activate
        return;
      }
      e.preventDefault();
      updateShowcaseSlide(currentFeaturedIndex + 1, true);
    }
  });
}

// ── Project Modal Dialog Handlers ──
function openProject(entry, options = {}) {
  if (!dialog || !entry) return;
  const { restoreFocus = true, trigger = null, pushHistory = true, replaceHistory = false } = options;

  view.active = entry;
  view.trigger = trigger ?? (restoreFocus ? document.activeElement : null);
  view.scrollY = window.scrollY;

  fillProjectModal(dialog, entry, activeLens);

  // Set next button target
  if (nextButton) {
    const currentIndex = PROJECTS.findIndex((p) => p.id === entry.id);
    const nextProject = PROJECTS[(currentIndex + 1) % PROJECTS.length];
    const nextTitleEl = dialog.querySelector('[data-dialog-next-title]');
    if (nextTitleEl) nextTitleEl.textContent = nextProject.title;
    nextButton.onclick = () => openProject(nextProject, { restoreFocus: false, pushHistory: false, replaceHistory: true });
  }

  if (typeof dialog.showModal === 'function') {
    if (!dialog.open) {
      dialog.showModal();
    }
  } else {
    dialog.setAttribute('open', '');
  }

  document.body.classList.add('is-dialog-open');
  if (dialogScroll) dialogScroll.scrollTop = 0;
  closeButton?.focus();

  if (replaceHistory) {
    history.replaceState(historyState(entry.slug, view.scrollY), '', projectUrl(window.location.href, entry.slug));
  } else if (pushHistory) {
    history.pushState(historyState(entry.slug, view.scrollY), '', projectUrl(window.location.href, entry.slug));
    view.historyPushed = true;
  }

  setStatus(`Opened project details for ${entry.title}`);
}

function closeProject(options = {}) {
  if (!dialog || !dialog.open) return;
  const { updateUrl = true } = options;

  dialog.close();
  document.body.classList.remove('is-dialog-open');

  if (updateUrl) {
    history.replaceState(null, '', clearProjectUrl(window.location.href));
    view.historyPushed = false;
  }

  if (view.trigger && typeof view.trigger.focus === 'function') {
    view.trigger.focus();
  }

  setStatus(`Closed project details for ${view.active?.title || 'project'}`);
  view.active = null;
  view.trigger = null;
}

function initDialogListeners() {
  closeButton?.addEventListener('click', () => closeProject({ updateUrl: true }));

  dialog?.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeProject({ updateUrl: true });
  });

  dialog?.addEventListener('click', (e) => {
    if (e.target === dialog) {
      closeProject({ updateUrl: true });
    }
  });

  window.addEventListener('popstate', (e) => {
    const slug = e.state?.portfolioProject ?? projectSlug(window.location.href);
    if (!slug) {
      if (dialog?.open) closeProject({ updateUrl: false });
      return;
    }

    const matched = getProjectBySlug(slug);
    if (matched) {
      openProject(matched, { restoreFocus: false, pushHistory: false });
    }
  });
}

function bindOpenButtons(root = document) {
  root.querySelectorAll('[data-open-detail]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const slug = btn.getAttribute('data-open-detail');
      const project = getProjectBySlug(slug) || getProjectById(slug);
      if (project) {
        openProject(project, { trigger: btn, pushHistory: true });
      }
    });
  });

  root.querySelectorAll('[data-project]').forEach((card) => {
    const handleOpen = (e) => {
      e.preventDefault();
      const slug = card.getAttribute('data-project');
      const project = getProjectBySlug(slug) || getProjectById(slug);
      if (project) {
        openProject(project, { trigger: card, pushHistory: true });
      }
    };

    card.addEventListener('click', handleOpen);
  });
}

function renderCustomLensNotice(lens) {
  const existing = document.querySelector('.custom-lens-banner');
  if (existing) existing.remove();

  if (!lens?.isCustom) return;

  const header = document.querySelector('.site-header');
  if (!header) return;

  const banner = document.createElement('aside');
  banner.className = 'custom-lens-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Tailored perspective notice');
  banner.innerHTML = `
    <div class="custom-lens-banner__inner">
      <span class="custom-lens-banner__pill">Adaptive Career Lens</span>
      <p class="custom-lens-banner__msg">
        Viewing tailored evidence curated for <strong>${lens.name}</strong>
      </p>
      <div class="custom-lens-banner__actions">
        <a href="./studio.html?c=${encodeURIComponent(new URLSearchParams(window.location.search).get('c') || '')}" class="custom-lens-banner__link">Edit in Studio ↗</a>
        <a href="./" class="custom-lens-banner__link custom-lens-banner__link--reset">Reset to Canonical</a>
      </div>
    </div>
  `;
  header.insertAdjacentElement('afterend', banner);
}

// ── Initial Mount & Adaptive Render ──
export function renderApp(lens = activeLens) {
  activeLens = lens;
  if (!mainContent) return;

  // Update page title and meta description
  document.title = lens.meta.title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', lens.meta.description);

  // Update site mark tag in header
  const siteTag = document.querySelector('.site-mark__tag');
  if (siteTag) {
    siteTag.textContent = lens.isCanonical ? 'Design & Systems · Venture Builder' : `Lens: ${lens.name}`;
  }

  // Render custom notice banner if active
  renderCustomLensNotice(lens);

  // Build semantic sections
  const htmlParts = [
    renderHero(lens),
    renderShowcase(lens),
    renderSelectedProof(lens),
    renderExplorations(lens),
    renderCareerArc(lens),
    renderAdvisory(lens),
    renderClosing(lens)
  ];

  mainContent.innerHTML = htmlParts.join('\n');

  // Initialize interactive controls
  initShowcaseControls();
  bindOpenButtons(mainContent);
  wireImageFallback(mainContent);

  // Check if URL specifies a project slug to open initially
  const initialSlug = projectSlug(window.location.href) || (window.location.hash ? window.location.hash.replace(/^#/, '') : null);
  if (initialSlug) {
    const initialProject = getProjectBySlug(initialSlug);
    if (initialProject) {
      openProject(initialProject, { restoreFocus: false, pushHistory: false });
    } else {
      history.replaceState(null, '', clearProjectUrl(window.location.href));
      setStatus('Project not found');
    }
  }
}

async function init() {
  initDialogListeners();
  activeLens = await resolveActiveLens();
  renderApp(activeLens);
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
