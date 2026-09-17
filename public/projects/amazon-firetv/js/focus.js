/* ============================================================
   Spatial focus engine for D-pad / remote navigation (10-ft UI)
   - Geometric nearest-neighbor search in the pressed direction
   - Explicit overrides via data-nav-up/down/left/right="selector"
   - Row memory: horizontal rows remember their last focused item
   - Auto-scrolls rows (x) and pages (y) to keep focus visible
   ============================================================ */

const Focus = (() => {
  let current = null;
  let enabled = true;
  const listeners = { focus: [], select: [], back: [] };

  const FOCUSABLE = '[tabindex="-1"].focusable';

  function visible(el) {
    if (!el || el.disabled || el.getAttribute('aria-hidden') === 'true') return false;
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function candidates(scope) {
    const root = scope || document;
    return [...root.querySelectorAll(FOCUSABLE)].filter(visible);
  }

  function center(r) { return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

  /* Score candidates: primary = distance along direction axis,
     penalized heavily for misalignment on the cross axis. */
  function findInDirection(from, dir) {
    const fr = from.getBoundingClientRect();
    const fc = center(fr);
    let best = null, bestScore = Infinity;

    for (const el of candidates()) {
      if (el === from) continue;
      const r = el.getBoundingClientRect();
      const c = center(r);
      const dx = c.x - fc.x, dy = c.y - fc.y;

      let primary, secondary, overlap;
      if (dir === 'left' || dir === 'right') {
        if (dir === 'left' ? r.right - 4 > fr.left : r.left + 4 < fr.right) continue;
        primary = Math.abs(dx);
        // Vertical overlap between the two rects (favor same row strongly)
        overlap = Math.max(0, Math.min(fr.bottom, r.bottom) - Math.max(fr.top, r.top));
        secondary = overlap > 0 ? 0 : Math.abs(dy);
      } else {
        if (dir === 'up' ? r.bottom - 4 > fr.top : r.top + 4 < fr.bottom) continue;
        primary = Math.abs(dy);
        overlap = Math.max(0, Math.min(fr.right, r.right) - Math.max(fr.left, r.left));
        secondary = overlap > 0 ? 0 : Math.abs(dx);
      }
      const score = primary + secondary * 6 + (overlap > 0 ? 0 : 800);
      if (score < bestScore) { bestScore = score; best = el; }
    }
    return best;
  }

  function resolveOverride(el, dir) {
    const sel = el.dataset['nav' + dir[0].toUpperCase() + dir.slice(1)];
    if (!sel) return null;
    if (sel === 'none') return el; // trap edge
    const row = el.closest('[data-row]');
    let target = (row && row.querySelector(sel)) || document.querySelector(sel);
    if (target && target.dataset.row !== undefined) target = rowEntry(target);
    return target && visible(target) ? target : null;
  }

  /* When landing on a row container, restore its remembered item */
  function rowEntry(rowEl) {
    const remembered = rowEl.querySelector('.focusable.row-memory');
    return remembered || rowEl.querySelector(FOCUSABLE);
  }

  function scrollIntoViewSmart(el) {
    // Horizontal: scroll the nearest row container
    const row = el.closest('.rail-track, .row-scroll');
    if (row) {
      const rr = row.getBoundingClientRect(), er = el.getBoundingClientRect();
      const pad = 60;
      if (er.left < rr.left + pad) row.scrollBy({ left: er.left - rr.left - pad, behavior: 'smooth' });
      else if (er.right > rr.right - pad) row.scrollBy({ left: er.right - rr.right + pad, behavior: 'smooth' });
    }
    // Vertical: scroll the active screen's scroll container
    const page = el.closest('.screen-scroll');
    if (page) {
      const pr = page.getBoundingClientRect(), er = el.getBoundingClientRect();
      const padT = 130, padB = 90;
      if (er.top < pr.top + padT) page.scrollBy({ top: er.top - pr.top - padT, behavior: 'smooth' });
      else if (er.bottom > pr.bottom - padB) page.scrollBy({ top: er.bottom - pr.bottom + padB, behavior: 'smooth' });
    }
  }

  function focus(el, opts = {}) {
    if (!el || !visible(el)) return false;
    if (current) {
      current.classList.remove('tv-focus');
      const oldRow = current.closest('[data-row]');
      if (oldRow) {
        oldRow.querySelectorAll('.row-memory').forEach(n => n.classList.remove('row-memory'));
        current.classList.add('row-memory');
      }
    }
    current = el;
    el.classList.add('tv-focus');
    if (!opts.silent) listeners.focus.forEach(f => f(el));
    if (!opts.noScroll) scrollIntoViewSmart(el);
    return true;
  }

  function move(dir) {
    if (!enabled || !current || !visible(current)) {
      focus(candidates()[0]);
      return;
    }
    const target = resolveOverride(current, dir) || findInDirection(current, dir);
    if (target && target !== current) {
      focus(target);
      window.SFX && SFX.move();
    } else {
      // Edge bump feedback
      current.classList.remove('bump-' + dir);
      void current.offsetWidth;
      current.classList.add('bump-' + dir);
    }
  }

  function select() {
    if (!enabled || !current) return;
    window.SFX && SFX.select();
    current.classList.add('pressing');
    setTimeout(() => current && current.classList.remove('pressing'), 160);
    listeners.select.forEach(f => f(current));
    if (current) current.click();
  }

  function onKey(e) {
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    else if (e.key === 'Enter') { e.preventDefault(); select(); }
    else if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'GoBack') {
      e.preventDefault(); window.SFX && SFX.back(); listeners.back.forEach(f => f());
    }
  }

  document.addEventListener('keydown', e => { if (enabled) onKey(e); });

  return {
    focus, move, select,
    back: () => { window.SFX && SFX.back(); listeners.back.forEach(f => f()); },
    get current() { return current; },
    setEnabled: v => { enabled = v; },
    focusFirst: (scope) => focus(candidates(scope)[0]),
    on: (evt, fn) => listeners[evt].push(fn),
    candidates,
  };
})();
window.Focus = Focus;
