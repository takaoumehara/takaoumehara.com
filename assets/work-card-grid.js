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
    card.addEventListener('click', () => openCard(card));
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openCard(card);
    });
  });
})();
