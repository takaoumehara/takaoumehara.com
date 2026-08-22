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
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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
};

function cardFor(slug) {
  return document.querySelector(`[data-project="${CSS.escape(slug)}"]`);
}

function setStatus(message) {
  if (status) status.textContent = message;
}

function wireImageFallback(root = document) {
  root.querySelectorAll('.project-card__media img').forEach((image) => {
    image.addEventListener('error', () => {
      image.closest('.project-card__media')?.classList.add('is-image-error');
    }, { once: true });
  });
}

function renderMedia(entry, sourceCard) {
  if (!fields.media) return;
  fields.media.replaceChildren();

  const sourceMedia = sourceCard?.querySelector('.project-card__media');
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

  fields.count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(PROJECTS.length).padStart(2, '0')}`;
  fields.category.textContent = entry.category;
  fields.title.textContent = entry.title;
  fields.summary.textContent = entry.summary;
  fields.role.textContent = entry.role || 'Independent project';
  fields.year.textContent = entry.year || 'Current';
  fields.meta.textContent = entry.meta;
  fields.nextTitle.textContent = next.title;

  fullProjectLink.href = entry.href;
  fullProjectLink.target = '_blank';
  fullProjectLink.rel = 'noopener noreferrer';
  fullProjectLink.removeAttribute('aria-label');
  fullProjectLinkContext.textContent = ` (${entry.title}, opens in a new tab)`;

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
  view.transitionSurface?.getAnimations().forEach((animation) => animation.cancel());
  view.transitionSurface?.remove();
  view.transitionSurface = null;
}

async function animateSurface(rect, opening) {
  if (reducedMotion.matches || !rect || rect.width <= 0 || rect.height <= 0) return;

  removeTransitionSurface();
  const surface = document.createElement('div');
  surface.setAttribute('data-transition-surface', '');
  surface.setAttribute('aria-hidden', 'true');
  document.body.append(surface);
  view.transitionSurface = surface;

  const scaleX = rect.width / window.innerWidth;
  const scaleY = rect.height / window.innerHeight;
  const cardTransform = `translate3d(${rect.left}px, ${rect.top}px, 0) scale(${scaleX}, ${scaleY})`;
  const viewportTransform = 'translate3d(0, 0, 0) scale(1, 1)';
  const keyframes = opening
    ? [{ transform: cardTransform, opacity: 1 }, { transform: viewportTransform, opacity: 1 }]
    : [{ transform: viewportTransform, opacity: 1 }, { transform: cardTransform, opacity: 1 }];

  const animation = surface.animate(keyframes, {
    duration: cssTime(opening ? '--motion-expand' : '--motion-collapse', opening ? 420 : 300),
    easing: cssValue(opening ? '--ease-out' : '--ease-in', opening ? 'ease-out' : 'ease-in'),
    fill: 'both',
  });

  try {
    await animation.finished;
  } catch {
    // A new navigation can interrupt the cosmetic surface without blocking input.
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
    view.scrollY = window.scrollY;
    view.cardRect = trigger?.getBoundingClientRect() ?? null;
    view.historyPushed = pushHistory;
  }

  view.active = entry;
  const { sourceCard } = fillDialog(entry);
  dialogScroll.scrollTop = 0;

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
  }

  setStatus(`${entry.title} opened.`);

  if (openingFromClosed && animate) {
    void animateSurface(view.cardRect ?? sourceCard?.getBoundingClientRect(), true)
      .finally(() => closeButton?.focus({ preventScroll: true }));
  } else {
    closeButton?.focus({ preventScroll: true });
  }

  return true;
}

async function closeProject({ animate = true } = {}) {
  if (!dialog?.open) return;

  const closingEntry = view.active;
  const trigger = view.trigger ?? cardFor(closingEntry?.slug);
  const currentRect = trigger?.getBoundingClientRect() ?? view.cardRect;

  if (animate) await animateSurface(currentRect, false);

  dialog.close();
  document.body.classList.remove('is-dialog-open');
  removeTransitionSurface();
  window.scrollTo(0, view.scrollY);
  trigger?.focus({ preventScroll: true });
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

cards.forEach((card) => {
  card.addEventListener('click', (event) => {
    if (isModifiedActivation(event)) return;
    if (!dialog || typeof dialog.showModal !== 'function') return;

    const slug = card.dataset.project;
    if (!projectBySlug(slug)) return;

    event.preventDefault();
    openProject(slug, { pushHistory: true, animate: true, trigger: card });
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

window.addEventListener('popstate', () => {
  const slug = projectSlug(window.location.href);

  if (slug && projectBySlug(slug)) {
    openProject(slug, { pushHistory: false, animate: false, trigger: cardFor(slug) });
    return;
  }

  if (dialog?.open) void closeProject();
});

document.querySelectorAll('.mobile-nav a').forEach((link) => {
  link.addEventListener('click', () => link.closest('details')?.removeAttribute('open'));
});

if ('IntersectionObserver' in window) {
  const sectionLinks = [...document.querySelectorAll('.desktop-nav a, .category-index a')]
    .filter((link) => link.hash);
  const sections = sectionLinks
    .map((link) => document.querySelector(link.hash))
    .filter(Boolean);

  const observer = new IntersectionObserver((entries) => {
    const active = entries.find((entry) => entry.isIntersecting);
    if (!active) return;
    sectionLinks.forEach((link) => {
      if (link.hash === `#${active.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  sections.forEach((section) => observer.observe(section));
}

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
