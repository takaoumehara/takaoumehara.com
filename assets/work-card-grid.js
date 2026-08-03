(() => {
  const openCard = (card) => {
    const href = card.dataset.href;
    if (!href) return;
    if (card.dataset.external === 'true') {
      window.open(href, '_blank', 'noopener');
      return;
    }
    window.location.assign(href);
  };

  document.querySelectorAll('.work-card[data-href]').forEach((card) => {
    // Expose the whole-card click target to assistive tech: without a role it
    // is announced as a plain group, so the link is invisible to screen readers.
    if (!card.hasAttribute('role')) card.setAttribute('role', 'link');
    if (!card.hasAttribute('aria-label')) {
      const title = card.querySelector('.card-title')?.textContent.trim();
      if (title) {
        card.setAttribute(
          'aria-label',
          card.dataset.external === 'true' ? `${title} (opens in a new tab)` : title
        );
      }
    }
    card.addEventListener('click', () => openCard(card));
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openCard(card);
    });
  });
})();
