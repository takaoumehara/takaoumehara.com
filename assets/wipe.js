/**
 * Monochrome Graphic Wipe Transition
 * Inspired by creativityiseverywhere.com
 * Sweeps an ink/paper graphic shutter across the screen to wipe out the current page
 * and reveals the destination page without distorting thumbnails.
 */
(() => {
  if (typeof window === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Create curtain element if not present
  let curtain = document.getElementById('wipe-curtain');
  if (!curtain) {
    curtain = document.createElement('div');
    curtain.id = 'wipe-curtain';
    curtain.innerHTML = `
      <div class="wipe-inner">
        <span class="wipe-mark">Takao Umehara</span>
        <span class="wipe-sub">creativity is everywhere</span>
      </div>
    `;
    document.body.appendChild(curtain);
  }

  // Handle incoming page load wipe reveal
  const hasWiped = sessionStorage.getItem('tu_wiping');
  if (hasWiped) {
    sessionStorage.removeItem('tu_wiping');
    // Start centered and wipe out to the right
    curtain.style.transition = 'none';
    curtain.style.transform = 'translateX(0)';
    curtain.classList.add('is-wiping-out');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        curtain.style.transition = '';
        curtain.classList.remove('is-wiping-out');
        curtain.classList.add('is-wiping-in');
        setTimeout(() => {
          curtain.classList.remove('is-wiping-in');
          curtain.style.transform = 'translateX(-101%)';
        }, 380);
      });
    });
  }

  // Intercept local navigational clicks on cards, thumbnails, and links
  document.addEventListener('click', (e) => {
    // Look for link or card with destination
    const link = e.target.closest('a[href]');
    const card = e.target.closest('[data-href]');

    let targetUrl = null;
    let isBlank = false;

    if (link) {
      targetUrl = link.getAttribute('href');
      isBlank = link.target === '_blank' || link.getAttribute('rel')?.includes('external');
    } else if (card) {
      targetUrl = card.getAttribute('data-href');
      isBlank = card.getAttribute('data-external') === 'true';
    }

    if (!targetUrl || isBlank) return;
    if (targetUrl.startsWith('#') || targetUrl.startsWith('mailto:') || targetUrl.startsWith('tel:')) return;
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      // If external domain, don't wipe
      try {
        const u = new URL(targetUrl, window.location.href);
        if (u.origin !== window.location.origin) return;
      } catch (_) {
        return;
      }
    }

    // Don't intercept if modifier keys pressed (Ctrl/Cmd/Shift for new tab)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    sessionStorage.setItem('tu_wiping', 'true');

    curtain.style.transition = 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)';
    curtain.style.transform = 'translateX(0)';
    curtain.classList.add('is-wiping-out');

    setTimeout(() => {
      window.location.href = targetUrl;
    }, 280);
  }, { capture: true });

  // Handle browser back/forward (pageshow)
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && curtain) {
      curtain.classList.remove('is-wiping-out', 'is-wiping-in');
      curtain.style.transform = 'translateX(-101%)';
    }
  });
})();
