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

  // Preview clips: never on load, never with reduced motion, never on a tap.
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!still.matches) {
    document.querySelectorAll('.card-clip').forEach((clip) => {
      const card = clip.closest('.work-card');
      const frame = clip.closest('.card-image');
      if (!card || !frame) return;
      let playing = false;
      const start = () => {
        if (playing || still.matches) return;
        playing = true;
        const started = clip.play();
        if (started && started.catch) started.catch(() => { playing = false; });
        clip.classList.add('is-playing');
        frame.classList.add('is-clipping');
      };
      const stop = () => {
        if (!playing) return;
        playing = false;
        clip.classList.remove('is-playing');
        frame.classList.remove('is-clipping');
        clip.pause();
        clip.currentTime = 0;
      };
      card.addEventListener('pointerenter', start);
      card.addEventListener('pointerleave', stop);
      card.addEventListener('focusin', start);
      card.addEventListener('focusout', stop);
    });
  }
})();
