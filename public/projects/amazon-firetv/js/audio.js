/* Fire TV-style navigation sounds via WebAudio (subtle, synthesized). */
const SFX = (() => {
  let ctx = null;
  const ensure = () => {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* no audio */ } }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  // Unlock on first interaction
  ['keydown', 'pointerdown'].forEach(evt => document.addEventListener(evt, ensure, { once: true }));

  function tone(freq, dur, type = 'sine', gain = 0.05, when = 0, glide = 0) {
    const c = ensure(); if (!c) return;
    const t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  return {
    move:   () => tone(2600, 0.045, 'sine', 0.025),
    select: () => { tone(1320, 0.07, 'sine', 0.05); tone(1980, 0.09, 'sine', 0.04, 0.04); },
    back:   () => tone(880, 0.08, 'sine', 0.04, 0, 620),
    add:    () => { tone(1046, 0.09, 'sine', 0.05); tone(1568, 0.12, 'sine', 0.05, 0.07); tone(2093, 0.16, 'sine', 0.04, 0.14); },
    error:  () => tone(220, 0.18, 'square', 0.02),
    listen: () => { tone(740, 0.1, 'sine', 0.05); tone(1180, 0.14, 'sine', 0.05, 0.09); },
    done:   () => { tone(1180, 0.1, 'sine', 0.05); tone(740, 0.14, 'sine', 0.05, 0.09); },
  };
})();
window.SFX = SFX;
