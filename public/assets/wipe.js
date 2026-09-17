/**
 * assets/wipe.js — Disarmed
 * Black curtain wipe and thumbnail scaling removed per design review.
 * Page transitions are handled globally via CSS View Transitions (root cross-fade).
 */
(() => {
  // Clear any legacy wiping flags from sessionStorage
  try {
    sessionStorage.removeItem('tu_wiping');
  } catch (_) {}

  // Remove any existing wipe curtain if found in the DOM
  const existing = document.getElementById('wipe-curtain');
  if (existing) existing.remove();
})();
