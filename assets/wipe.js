/**
 * Monochrome Graphic Wipe Transition — Reliable Edition
 * Inspired by creativityiseverywhere.com
 * Sweeps an ink/paper graphic shutter across the screen to wipe out the current page
 * and reveals the destination page smoothly without ever freezing midway.
 */
(() => {
  if (typeof window === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Create curtain element if not present
  let curtain = document.getElementById('wipe-curtain');
  if (!curtain) {
    curtain = document.createElement('div');
    curtain.id = 'wipe-curtain';
    curtain.setAttribute('aria-hidden', 'true');
    curtain.innerHTML = `
      <div class="wipe-inner">
        <span class="wipe-mark">Takao Umehara</span>
        <span class="wipe-sub">creativity is everywhere</span>
      </div>
    `;
    document.body.appendChild(curtain);
  }

  let resetTimer = null;
  const forceDismissCurtain = () => {
    if (!curtain) return;
    curtain.classList.remove('is-wiping-out', 'is-wiping-in');
    curtain.style.transition = 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)';
    curtain.style.transform = 'translateX(101%)';
    setTimeout(() => {
      curtain.style.transition = 'none';
      curtain.style.transform = 'translateX(-101%)';
    }, 280);
    if (resetTimer) clearTimeout(resetTimer);
  };

  // Handle incoming page load wipe reveal
  const hasWiped = sessionStorage.getItem('tu_wiping');
  if (hasWiped) {
    sessionStorage.removeItem('tu_wiping');
    curtain.style.transition = 'none';
    curtain.style.transform = 'translateX(0)';
    curtain.classList.add('is-wiping-out');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        curtain.style.transition = 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1)';
        curtain.classList.remove('is-wiping-out');
        curtain.classList.add('is-wiping-in');
        setTimeout(() => {
          curtain.classList.remove('is-wiping-in');
          curtain.style.transition = 'none';
          curtain.style.transform = 'translateX(-101%)';
        }, 340);
      });
    });

    // Failsafe watchdog: if anything stalls, force dismiss in 600ms
    setTimeout(forceDismissCurtain, 600);
  }

  // Intercept navigational clicks on cards and internal links
  document.addEventListener('click', (e) => {
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
    if (targetUrl.startsWith('#') || targetUrl.startsWith('mailto:') || targetUrl.startsWith('tel:') || targetUrl.startsWith('javascript:')) return;
    
    // Check if external domain
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      try {
        const u = new URL(targetUrl, window.location.href);
        if (u.origin !== window.location.origin) return;
      } catch (_) {
        return;
      }
    }

    // Don't intercept modifier keys (Cmd/Ctrl/Shift new tabs)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    sessionStorage.setItem('tu_wiping', 'true');

    curtain.style.transition = 'transform 260ms cubic-bezier(0.4, 0, 0.2, 1)';
    curtain.style.transform = 'translateX(0)';
    curtain.classList.add('is-wiping-out');

    // Reset timer watchdog: never stay locked if navigation stalls
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(forceDismissCurtain, 1200);

    setTimeout(() => {
      window.location.href = targetUrl;
    }, 240);
  }, { capture: true });

  // Handle browser back/forward and visibility change
  window.addEventListener('pageshow', forceDismissCurtain);
  window.addEventListener('pagehide', forceDismissCurtain);
  window.addEventListener('popstate', forceDismissCurtain);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') forceDismissCurtain();
  });
})();
