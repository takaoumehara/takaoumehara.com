/* ─── Work card grid ────────────────────────────────────────────────────────
 * Cards are plain <a> elements, so navigation, middle-click, open-in-new-tab
 * and crawling all work without script. The only job left here is naming the
 * shared element for the cross-document view transition: the card image the
 * visitor clicked has to carry the same view-transition-name as the hero it is
 * about to become.
 *
 * Paired with assets/view-transitions.css, which owns the receiving half and
 * the timing. Browsers without the API skip both listeners and navigate
 * normally.
 * ────────────────────────────────────────────────────────────────────────── */
(() => {
  const NAME = 'project-hero';

  const samePath = (a, b) => {
    try {
      return new URL(a, location.href).pathname === new URL(b, location.href).pathname;
    } catch {
      return false;
    }
  };

  const cardFor = (url) =>
    [...document.querySelectorAll('a.work-card[href]')].find((card) =>
      samePath(card.getAttribute('href'), url)
    );

  const clear = () => {
    document.querySelectorAll('[data-vt-named]').forEach((el) => {
      el.style.removeProperty('view-transition-name');
      el.removeAttribute('data-vt-named');
    });
  };

  /* Only one element may hold a given name at a time, so clear before naming. */
  const name = (card) => {
    clear();
    const image = card && card.querySelector('.card-img-bg, .card-art');
    if (!image) return;
    image.style.viewTransitionName = NAME;
    image.setAttribute('data-vt-named', '');
  };

  /* Leaving the grid: name the card we are navigating to. */
  window.addEventListener('pageswap', (event) => {
    if (!event.viewTransition) return;
    const url = event.activation?.entry?.url;
    if (url) name(cardFor(url));
  });

  /* Coming back to the grid: name the card we came from, so the hero collapses
     into the thumbnail it grew out of. */
  window.addEventListener('pagereveal', (event) => {
    if (!event.viewTransition) return;
    const from = window.navigation?.activation?.from?.url;
    if (from) name(cardFor(from));
    event.viewTransition.finished.finally(clear);
  });
})();
