/* ── handoff.js — one transition system for the whole site ──────────────────
 *
 * The problem this replaces: each page painted its own "continuous" field in
 * its own box. The index used a fixed, viewport-sized layer; the project page
 * used a layer inside a hero that was `min(100dvh, 880px)` tall. Same CSS
 * string, different box — so the radial stops landed somewhere else and the
 * colour visibly jumped at the click. Then the colour ran out where the hero
 * ended, which read as the transition failing rather than the page beginning.
 *
 * So the field is no longer something a page builds. It is `html::before`,
 * `position:fixed; inset:0`, defined here and injected into every page that
 * loads this file. Both sides of a navigation resolve it against the same box
 * — the viewport — which is the only way the colour can survive a document
 * swap unchanged.
 *
 * Three transition shapes come out of that one layer:
 *
 *   colour  the field is already full-screen before the click (the index
 *           lights it on hover), so the click only has to not break it
 *   image   the clicked thumbnail flies to full-bleed, and the destination
 *           opens on that same image before fading to its own page
 *   veil    for destinations that cannot host the field (every legacy project
 *           page), the field arrives on top and lifts — colour, then page,
 *           never white
 *
 * No View Transitions API. `docs/page-transitions.md` §3 recorded that path
 * firing 5–8 times in 10 on this site with the cause unfound; nothing here
 * depends on the browser choosing to co-operate.
 *
 * Loaded render-blocking in <head> (no defer) on purpose: the arrival colour
 * has to be on screen in the first painted frame, and the CSS lives in this
 * file for the same reason — an external stylesheet can land a frame late,
 * and one frame is the whole illusion.
 * ────────────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  const KEY = 'tu:handoff';
  const html = document.documentElement;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── The shared layer ─────────────────────────────────────────────────── */

  const CSS = `
:root{
  --tu-tint:#101014; --tu-tint-2:#2a2a34; --tu-on:#ffffff;
  --tu-lit:0; --tu-veil-art:none; --tu-veil-ms:420ms;
  /* One definition of the field, reused by the ground layer and the veil so
     the two can never drift apart. */
  --tu-field:
    radial-gradient(122% 92% at 18% 10%, color-mix(in oklab, var(--tu-tint) 74%, white) 0%, transparent 60%),
    radial-gradient(104% 84% at 84% 90%, color-mix(in oklab, var(--tu-tint-2) 84%, black) 0%, transparent 64%),
    linear-gradient(152deg, var(--tu-tint) 0%, var(--tu-tint-2) 100%);
}
/* The ground. Every page that opts in resolves this against the viewport, so
   the picture is identical across a navigation. Pages sitting on it must keep
   body transparent and put their paper colour on <html>. */
html::before{
  content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;
  background:var(--tu-field);opacity:var(--tu-lit);
  transition:opacity 460ms ease, background 560ms ease;
}
/* The veil. Same field, on top. Used when the destination has its own design
   system and cannot host the ground layer. */
html::after{
  content:"";position:fixed;inset:0;z-index:2147483000;pointer-events:none;
  background:var(--tu-veil-art) center/cover no-repeat, var(--tu-field);
  opacity:0;transition:opacity var(--tu-veil-ms) ease;
}
html.tu-veil::after{opacity:1}
html.tu-veil-instant::after{transition:none}
/* The thumbnail in flight. Transform only — no layout, no repaint of the page
   under it. */
.tu-ghost{
  position:fixed;z-index:2147482000;pointer-events:none;
  background-size:cover;background-position:center;transform-origin:center center;
  will-change:transform;
  transition:transform 480ms cubic-bezier(.66,0,.28,1);
}
/* Arrival: the colour is already right, so only the content moves. */
html.tu-arrived .tu-rise{opacity:0;transform:translate3d(0,16px,0);
  animation:tu-rise 560ms cubic-bezier(.22,.84,.22,1) forwards}
html.tu-arrived .tu-rise-2{animation-delay:70ms}
html.tu-arrived .tu-rise-3{animation-delay:140ms}
@keyframes tu-rise{to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){
  html::before,html::after,.tu-ghost{transition-duration:1ms!important}
  html.tu-arrived .tu-rise{animation:none;opacity:1;transform:none}
}`;

  const style = document.createElement('style');
  style.id = 'tu-handoff';
  style.textContent = CSS;
  (document.head || html).appendChild(style);

  /* ── Tint plumbing ────────────────────────────────────────────────────── */

  const setTint = (p) => {
    if (!p) return;
    if (p.tint) html.style.setProperty('--tu-tint', p.tint);
    if (p.tint2) html.style.setProperty('--tu-tint-2', p.tint2);
    if (p.on) html.style.setProperty('--tu-on', p.on);
  };
  const setLit = (v) => html.style.setProperty('--tu-lit', String(v));

  const payloadOf = (el) => ({
    tint: el.dataset.tint || null,
    tint2: el.dataset.tint2 || null,
    on: el.dataset.on || null,
    // Absolute, because the sender and the receiver sit at different depths.
    art: el.dataset.art ? new URL(el.dataset.art, location.href).href : null,
    mode: el.dataset.tuMode || 'colour',
  });

  /* ── Arrival ──────────────────────────────────────────────────────────── */

  let inbound = null;
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      // Stale entries mean the visitor went somewhere else and came back; a
      // colour from a click two minutes ago is worse than no colour at all.
      if (d && typeof d.t === 'number' && Date.now() - d.t < 8000) inbound = d;
    }
  } catch (e) { /* private mode — the pages still work, they just cut */ }

  // A page declares `data-tu-adopt` when it is built to sit on the field. Any
  // other page gets the veil.
  const adopts = html.hasAttribute('data-tu-adopt');

  if (adopts) setLit(1);

  if (inbound) {
    setTint(inbound);
    if (adopts) {
      html.classList.add('tu-arrived');
    } else {
      const art = inbound.mode === 'image' && inbound.art ? `url("${inbound.art.replace(/"/g, '%22')}")` : 'none';
      html.style.setProperty('--tu-veil-art', art);
      html.classList.add('tu-veil', 'tu-veil-instant');

      let lifted = false;
      const lift = () => {
        if (lifted) return;
        lifted = true;
        html.classList.remove('tu-veil-instant');
        // One frame with the transition enabled and the veil still opaque,
        // otherwise the browser has nothing to animate from.
        requestAnimationFrame(() => requestAnimationFrame(() => {
          html.classList.remove('tu-veil');
          setTimeout(() => html.style.setProperty('--tu-veil-art', 'none'), 700);
        }));
      };
      // Whichever comes first: the page finishing, or a deadline. A slow hero
      // image must not hold the visitor under a coloured sheet.
      const deadline = setTimeout(lift, reduced() ? 0 : 620);
      addEventListener('load', () => { clearTimeout(deadline); lift(); }, { once: true });
    }
  }

  /* ── Departure ────────────────────────────────────────────────────────── */

  const HOLD = { colour: 280, image: 440 };

  const fly = (el, art) => {
    const img = el.querySelector('img');
    const src = art || (img && (img.currentSrc || img.src));
    const box = img || el;
    const r = box.getBoundingClientRect();
    if (!src || r.width < 8 || r.height < 8) return HOLD.colour;

    const ghost = document.createElement('div');
    ghost.className = 'tu-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.style.left = `${r.left}px`;
    ghost.style.top = `${r.top}px`;
    ghost.style.width = `${r.width}px`;
    ghost.style.height = `${r.height}px`;
    ghost.style.backgroundImage = `url("${src.replace(/"/g, '%22')}")`;
    document.body.appendChild(ghost);

    const scale = Math.max(innerWidth / r.width, innerHeight / r.height);
    const dx = innerWidth / 2 - (r.left + r.width / 2);
    const dy = innerHeight / 2 - (r.top + r.height / 2);
    requestAnimationFrame(() => {
      ghost.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
    });
    return HOLD.image;
  };

  const go = (el) => {
    const url = new URL(el.href, location.href);
    const p = payloadOf(el);
    setTint(p);

    try {
      sessionStorage.setItem(KEY, JSON.stringify({ ...p, t: Date.now() }));
    } catch (e) { /* the destination falls back to its own colour */ }

    html.classList.add('tu-leaving');
    document.dispatchEvent(new CustomEvent('tu:leave', { detail: { el, payload: p } }));

    let hold = 0;
    if (!reduced()) hold = p.mode === 'image' ? fly(el, p.art) : HOLD.colour;
    setTimeout(() => { location.href = url.href; }, hold);
  };

  const wire = () => {
    document.querySelectorAll('a[data-tu][href]').forEach((el) => {
      if (el.dataset.tuBound) return;
      el.dataset.tuBound = '1';
      el.addEventListener('click', (e) => {
        if (e.defaultPrevented || e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (el.target === '_blank' || el.hasAttribute('download')) return;
        let url;
        try { url = new URL(el.href, location.href); } catch (err) { return; }
        if (url.origin !== location.origin) return;
        e.preventDefault();
        go(el);
      });
    });
  };

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', wire, { once: true });
  else wire();

  /* Back button: the page comes out of the bfcache mid-exit otherwise —
     faded out, with a thumbnail frozen across the screen. */
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    html.classList.remove('tu-leaving', 'tu-veil', 'tu-veil-instant');
    document.querySelectorAll('.tu-ghost').forEach((g) => g.remove());
  });

  window.TU = Object.assign(window.TU || {}, { setTint, setLit, payloadOf });
})();
