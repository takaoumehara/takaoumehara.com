import { PROJECTS, projectBySlug } from './project-data.mjs';
import {
  clearProjectUrl,
  historyState,
  projectSlug,
  projectUrl,
} from './history.mjs';

const dialog = document.querySelector('#project-dialog');
const dialogScroll = dialog?.querySelector('[data-dialog-scroll]');
const closeButton = dialog?.querySelector('[data-dialog-close]');
const nextButton = dialog?.querySelector('[data-dialog-next]');
const fullProjectLink = dialog?.querySelector('[data-dialog-link]');
const fullProjectLinkContext = dialog?.querySelector('[data-dialog-link-context]');
const status = document.querySelector('[data-status]');
const cards = [...document.querySelectorAll('[data-project]')];
const openDetailButtons = [...document.querySelectorAll('[data-open-detail]')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Showcase elements
const featuredShowcase = document.querySelector('[data-featured-showcase]');
const featuredSlides = [...document.querySelectorAll('[data-featured-slide]')];
const trackerCurrent = document.querySelector('[data-showcase-current]');
const trackerBtns = [...document.querySelectorAll('[data-showcase-goto]')];
let currentFeaturedIndex = 0;

const fields = {
  count: dialog?.querySelector('[data-dialog-count]'),
  category: dialog?.querySelector('[data-dialog-category]'),
  title: dialog?.querySelector('[data-dialog-title]'),
  summary: dialog?.querySelector('[data-dialog-summary]'),
  role: dialog?.querySelector('[data-dialog-role]'),
  year: dialog?.querySelector('[data-dialog-year]'),
  meta: dialog?.querySelector('[data-dialog-meta]'),
  media: dialog?.querySelector('[data-dialog-media]'),
  nextTitle: dialog?.querySelector('[data-dialog-next-title]'),
};

const view = {
  active: null,
  trigger: null,
  scrollY: 0,
  cardRect: null,
  historyPushed: false,
  transitionSurface: null,
  contentAnimations: [],
};

const contentMotionTargets = [
  '.project-dialog__bar',
  '.project-dialog__category',
  '.project-dialog__content h2',
  '.project-dialog__summary',
  '.project-dialog__meta',
  '.project-dialog__media',
  '.project-dialog__content > .button-link',
];

function cardFor(slug) {
  return document.querySelector(`[data-project="${CSS.escape(slug)}"]`);
}

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

function renderMedia(entry, sourceCard) {
  if (!fields.media) return;
  fields.media.replaceChildren();

  const sourceMedia = sourceCard?.querySelector('.project-card__media, .featured-preview');
  if (sourceMedia) {
    const clone = sourceMedia.cloneNode(true);
    fields.media.append(clone);
    wireImageFallback(fields.media);
    return;
  }

  const fallback = document.createElement('div');
  fallback.className = 'dialog-media-fallback';
  fallback.textContent = entry.title;
  fields.media.append(fallback);
}

function fillDialog(entry) {
  const index = PROJECTS.indexOf(entry);
  const next = PROJECTS[(index + 1) % PROJECTS.length];
  const sourceCard = cardFor(entry.slug);

  if (fields.count) fields.count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(PROJECTS.length).padStart(2, '0')}`;
  if (fields.category) fields.category.textContent = entry.category;
  if (fields.title) fields.title.textContent = entry.title;
  if (fields.summary) fields.summary.textContent = entry.summary;
  if (fields.role) fields.role.textContent = entry.role || 'Independent project';
  if (fields.year) fields.year.textContent = entry.year || 'Current';
  if (fields.meta) fields.meta.textContent = entry.meta || entry.tech?.join(' · ') || '';
  if (fields.nextTitle) fields.nextTitle.textContent = next.title;

  if (fullProjectLink) {
    fullProjectLink.href = entry.href;
    fullProjectLink.target = '_blank';
    fullProjectLink.rel = 'noopener noreferrer';
    fullProjectLink.removeAttribute('aria-label');
    if (fullProjectLinkContext) fullProjectLinkContext.textContent = ` (${entry.title}, opens in a new tab)`;
  }

  renderMedia(entry, sourceCard);
  return { index, next, sourceCard };
}

function cssTime(token, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  if (raw.endsWith('ms')) return Number.parseFloat(raw);
  if (raw.endsWith('s')) return Number.parseFloat(raw) * 1000;
  return fallback;
}

function cssValue(token, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim() || fallback;
}

function removeTransitionSurface() {
  view.transitionSurface?.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
  view.transitionSurface?.remove();
  view.transitionSurface = null;
}

function cancelContentAnimations() {
  view.contentAnimations.forEach((animation) => animation.cancel());
  view.contentAnimations = [];
}

let lastUserScrollY = 0;
let scrollDebounceTimer = null;

window.addEventListener('scroll', () => {
  if (dialog?.open) return;
  const current = window.scrollY || document.documentElement.scrollTop || 0;
  if (!scrollDebounceTimer) {
    lastUserScrollY = current;
  }
  clearTimeout(scrollDebounceTimer);
  scrollDebounceTimer = setTimeout(() => {
    lastUserScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    scrollDebounceTimer = null;
  }, 120);
}, { passive: true });

async function animateDialogContent(opening) {
  cancelContentAnimations();
  if (reducedMotion.matches || !dialog) return;

  const elements = contentMotionTargets
    .map((selector) => dialog.querySelector(selector))
    .filter(Boolean);
  const duration = opening ? 360 : 160;

  view.contentAnimations = elements.map((element, index) => {
    return element.animate(
      opening
        ? [
          { opacity: 1, transform: 'translate3d(0, 0.375rem, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        ]
        : [
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
          { opacity: 1, transform: 'translate3d(0, -0.25rem, 0)' },
        ],
      {
        duration,
        delay: opening ? (index === 2 ? 125 : 60 + Math.min(index, 6) * 20) : 0,
        easing: cssValue(opening ? '--ease-out' : '--ease-spatial', 'cubic-bezier(0.22, 1, 0.36, 1)'),
        fill: 'both',
      },
    );
  });

  const activeAnimations = view.contentAnimations;
  await Promise.allSettled(activeAnimations.map((animation) => animation.finished));
  if (view.contentAnimations !== activeAnimations) return;
  activeAnimations.forEach((animation) => animation.cancel());
  view.contentAnimations = [];
}

function transitionPreview(sourceCard) {
  const sourceMedia = sourceCard?.querySelector('.project-card__media, .featured-preview');
  if (!sourceMedia) return null;

  const preview = sourceMedia.cloneNode(true);
  preview.setAttribute('data-transition-preview', '');
  preview.setAttribute('aria-hidden', 'true');
  return preview;
}

async function animateSurface(rect, opening, sourceCard = view.trigger) {
  if (reducedMotion.matches || !rect || rect.width <= 0 || rect.height <= 0 || !dialog) return;

  removeTransitionSurface();
  const surface = document.createElement('div');
  surface.setAttribute('data-transition-surface', '');
  surface.dataset.transitionPhase = opening ? 'opening' : 'closing';
  surface.setAttribute('aria-hidden', 'true');
  surface.style.width = `${rect.width}px`;
  surface.style.height = `${rect.height}px`;
  const preview = transitionPreview(sourceCard);
  if (preview) surface.append(preview);
  dialog.append(surface);
  view.transitionSurface = surface;

  const scaleX = window.innerWidth / rect.width;
  const scaleY = window.innerHeight / rect.height;
  const cardTransform = `translate3d(${rect.left}px, ${rect.top}px, 0) scale(1, 1)`;
  const viewportTransform = `translate3d(0, 0, 0) scale(${scaleX}, ${scaleY})`;
  const duration = cssTime(opening ? '--motion-expand' : '--motion-collapse', opening ? 460 : 340);
  const easing = cssValue('--ease-spatial', 'cubic-bezier(0.65, 0, 0.35, 1)');

  const geometryAnimation = surface.animate(
    opening
      ? [
        { transform: cardTransform, offset: 0 },
        { transform: viewportTransform, offset: 1 },
      ]
      : [
        { transform: viewportTransform, offset: 0 },
        { transform: cardTransform, offset: 1 },
      ],
    { duration, easing, fill: 'both' },
  );

  surface.animate(
    opening
      ? [
        { opacity: 1, offset: 0 },
        { opacity: 0.62, offset: 0.52 },
        { opacity: 0, offset: 1 },
      ]
      : [
        { opacity: 0, offset: 0 },
        { opacity: 0.62, offset: 0.48 },
        { opacity: 1, offset: 1 },
      ],
    { duration, easing, fill: 'both' },
  );

  preview?.animate(
    opening
      ? [
        { opacity: 1, transform: 'scale(1)', offset: 0 },
        { opacity: 0, transform: 'scale(1.015)', offset: 0.28 },
        { opacity: 0, transform: 'scale(1.015)', offset: 1 },
      ]
      : [
        { opacity: 0, transform: 'scale(1.015)', offset: 0 },
        { opacity: 0, transform: 'scale(1.015)', offset: 0.58 },
        { opacity: 1, transform: 'scale(1)', offset: 1 },
      ],
    { duration, easing, fill: 'both' },
  );

  try {
    await geometryAnimation.finished;
  } catch {
    // Interrupted gracefully
  } finally {
    if (view.transitionSurface === surface) {
      surface.remove();
      view.transitionSurface = null;
    }
  }
}

export function openProject(slug, options = {}) {
  const entry = projectBySlug(slug);
  if (!entry || !dialog || typeof dialog.showModal !== 'function') return false;

  const {
    pushHistory = true,
    animate = true,
    trigger = cardFor(slug),
  } = options;

  const openingFromClosed = !dialog.open;
  if (openingFromClosed) {
    view.trigger = trigger;
    view.scrollY = (lastUserScrollY > 0) ? lastUserScrollY : (window.scrollY || document.documentElement.scrollTop || 0);
    view.cardRect = trigger?.querySelector('.project-card__media, .featured-preview')?.getBoundingClientRect()
      ?? trigger?.getBoundingClientRect()
      ?? null;
    view.historyPushed = pushHistory;
  }

  view.active = entry;
  const { sourceCard } = fillDialog(entry);
  if (dialogScroll) dialogScroll.scrollTop = 0;

  if (pushHistory) {
    history.pushState(
      historyState(entry.slug, view.scrollY),
      '',
      projectUrl(window.location.href, entry.slug),
    );
  } else if (!openingFromClosed) {
    history.replaceState(
      historyState(entry.slug, view.scrollY),
      '',
      projectUrl(window.location.href, entry.slug),
    );
  }

  if (openingFromClosed) {
    dialog.showModal();
    document.body.classList.add('is-dialog-open');
    closeButton?.focus({ preventScroll: true });
  }

  setStatus(`${entry.title} opened.`);

  if (openingFromClosed && animate) {
    void Promise.all([
      animateSurface(view.cardRect ?? sourceCard?.getBoundingClientRect(), true, sourceCard),
      animateDialogContent(true),
    ]);
  } else {
    closeButton?.focus({ preventScroll: true });
  }

  return true;
}

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

async function closeProject({ animate = true, targetScrollY } = {}) {
  if (!dialog?.open) return;

  const closingEntry = view.active;
  const trigger = view.trigger ?? cardFor(closingEntry?.slug);
  const scrollDest = (typeof targetScrollY === 'number') ? targetScrollY : (view.scrollY ?? 0);
  const currentRect = trigger?.querySelector('.project-card__media, .featured-preview')?.getBoundingClientRect()
    ?? view.cardRect;

  if (animate) {
    await Promise.all([
      animateSurface(currentRect, false, trigger),
      animateDialogContent(false),
    ]);
  }

  dialog.close();
  document.body.classList.remove('is-dialog-open');
  removeTransitionSurface();
  cancelContentAnimations();
  
  window.scrollTo({ top: scrollDest, left: 0, behavior: 'instant' });
  if (trigger && typeof trigger.focus === 'function') {
    trigger.focus({ preventScroll: true });
  }
  window.scrollTo({ top: scrollDest, left: 0, behavior: 'instant' });
  
  requestAnimationFrame(() => {
    window.scrollTo({ top: scrollDest, left: 0, behavior: 'instant' });
  });

  setStatus(`Returned to ${closingEntry?.title ?? 'selected work'}.`);

  view.active = null;
  view.trigger = null;
  view.cardRect = null;
  view.historyPushed = false;
}

function requestClose() {
  if (!dialog?.open) return;

  if (view.historyPushed && projectSlug(window.location.href)) {
    history.back();
    return;
  }

  history.replaceState(null, '', clearProjectUrl(window.location.href));
  void closeProject();
}

function isModifiedActivation(event) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

// Wire project cards
cards.forEach((card) => {
  card.addEventListener('pointerdown', () => {
    lastUserScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  }, { passive: true });

  card.addEventListener('click', (event) => {
    if (isModifiedActivation(event)) return;
    if (!dialog || typeof dialog.showModal !== 'function') return;

    // If clicking on external direct link inside featured slide, let default action happen
    if (event.target.closest('a[target="_blank"]')) return;

    const slug = card.dataset.project;
    if (!projectBySlug(slug)) return;

    event.preventDefault();
    openProject(slug, { pushHistory: true, animate: true, trigger: card });
  });
});

// Wire open detail buttons (e.g. in Featured Showcase)
openDetailButtons.forEach((btn) => {
  btn.addEventListener('click', (event) => {
    event.preventDefault();
    const slug = btn.dataset.openDetail;
    if (!slug || !projectBySlug(slug)) return;
    const slide = btn.closest('[data-featured-slide]') ?? cardFor(slug);
    openProject(slug, { pushHistory: true, animate: true, trigger: slide });
  });
});

closeButton?.addEventListener('click', requestClose);

dialog?.addEventListener('cancel', (event) => {
  event.preventDefault();
  requestClose();
});

nextButton?.addEventListener('click', () => {
  if (!view.active) return;
  const index = PROJECTS.indexOf(view.active);
  const next = PROJECTS[(index + 1) % PROJECTS.length];
  openProject(next.slug, { pushHistory: false, animate: false, trigger: view.trigger });
});

window.addEventListener('popstate', (event) => {
  const slug = projectSlug(window.location.href);

  if (slug && projectBySlug(slug)) {
    openProject(slug, { pushHistory: false, animate: false, trigger: cardFor(slug) });
    return;
  }

  if (dialog?.open) {
    const targetScrollY = event.state?.scrollY ?? view.scrollY;
    void closeProject({ targetScrollY });
  }
});

document.querySelectorAll('.mobile-nav a').forEach((link) => {
  link.addEventListener('click', () => link.closest('details')?.removeAttribute('open'));
});

// ==========================================================================
// Featured Showcase Tracking & Space Bar Navigation
// ==========================================================================
function updateShowcaseTracker(index) {
  currentFeaturedIndex = index;
  if (trackerCurrent) {
    trackerCurrent.textContent = String(index + 1).padStart(2, '0');
  }
  trackerBtns.forEach((btn, i) => {
    btn.classList.toggle('is-active', i === index);
  });
}

// Tracker button click to smooth scroll
trackerBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const targetIdx = Number.parseInt(btn.dataset.showcaseGoto, 10);
    const targetSlide = featuredSlides[targetIdx];
    if (targetSlide) {
      targetSlide.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// IntersectionObserver for Showcase & Slides
if ('IntersectionObserver' in window) {
  // 1. Showcase Visibility Observer
  if (featuredShowcase) {
    const showcaseObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        featuredShowcase.classList.toggle('is-in-view', entry.isIntersecting);
      });
    }, { threshold: 0.1 });
    showcaseObserver.observe(featuredShowcase);
  }

  // 2. Individual Slide Observer
  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const slideIdx = Number.parseInt(entry.target.dataset.featuredSlide, 10);
        if (!Number.isNaN(slideIdx)) {
          updateShowcaseTracker(slideIdx);
        }
      }
    });
  }, { threshold: 0.55 });

  featuredSlides.forEach((slide) => slideObserver.observe(slide));

  // 3. Navigation Header Active Indicator Observer
  const sectionLinks = [...document.querySelectorAll('.desktop-nav a, .category-index a')]
    .filter((link) => link.hash);
  const sections = sectionLinks
    .map((link) => document.querySelector(link.hash))
    .filter(Boolean);

  const navObserver = new IntersectionObserver((entries) => {
    const active = entries.find((entry) => entry.isIntersecting);
    if (!active) return;
    sectionLinks.forEach((link) => {
      if (link.hash === `#${active.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  sections.forEach((section) => navObserver.observe(section));
}

// Keyboard Navigation (Space Bar to cycle featured projects)
window.addEventListener('keydown', (event) => {
  if (dialog?.open) return; // Allow normal modal interactions

  const activeElement = document.activeElement;
  const isFormElement = activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.tagName === 'SELECT' ||
    activeElement.isContentEditable
  );
  if (isFormElement) return;

  if (event.code === 'Space' || event.key === ' ') {
    event.preventDefault();
    if (!featuredSlides.length) return;

    if (event.shiftKey) {
      // Navigate Backwards
      if (currentFeaturedIndex > 0) {
        featuredSlides[currentFeaturedIndex - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        document.querySelector('#top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Navigate Forwards
      if (currentFeaturedIndex < featuredSlides.length - 1) {
        featuredSlides[currentFeaturedIndex + 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Move to category overview
        document.querySelector('#category-overview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
});

wireImageFallback();

const initialSlug = projectSlug(window.location.href);
if (initialSlug) {
  if (projectBySlug(initialSlug)) {
    openProject(initialSlug, { pushHistory: false, animate: false, trigger: cardFor(initialSlug) });
  } else {
    history.replaceState(null, '', clearProjectUrl(window.location.href));
    setStatus('Project not found. Showing selected work.');
  }
}
