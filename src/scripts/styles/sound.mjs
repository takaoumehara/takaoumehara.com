// The snap / swoosh sounds (ctx.sound; docs/motion-archive.md §H3d, the
// prototype's initAudio / playSound in
// docs/motion-lab/references/living-architectural-slabs-v4.html), synthesized
// with Web Audio: no files.
//
// Contract: docs/motion-lab/engine-contract.md §5. motion.js makes one for the
// tab, with a config whose `enabled` / `volume` are live getters, and calls
// unlock() on the first pointerdown. Nothing is created before that gesture;
// play() is silent unless the sound is enabled and unlocked. Never throws,
// and in Node (no window, no AudioContext) both calls are no-ops.

const NAMES = new Set(["snap", "swoosh"]);
const GAP_MS = 60; // at most one sound per 60 ms

export function makeSound(soundCfg) {
  const cfg = soundCfg && typeof soundCfg === "object" ? soundCfg : {};
  let unlocked = false;
  let ac = null;
  let last = -Infinity;

  const enabled = () => { try { return cfg.enabled === true; } catch (e) { return false; } };
  const volume = () => {
    try { const v = Number(cfg.volume); return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0; } catch (e) { return 0; }
  };
  // The context, made on the gesture when sound is on, else on the first
  // play after it (the page has had its gesture by then).
  const context = () => {
    if (ac || !unlocked || typeof window === "undefined") return ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (typeof AC === "function") ac = new AC();
    return ac;
  };
  const wake = () => { if (ac && ac.state === "suspended") ac.resume().catch(() => {}); };

  function swoosh(now, vol) {
    const osc = ac.createOscillator(), filter = ac.createBiquadFilter(), gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.32);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    osc.connect(filter).connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.34);
  }
  function snap(now, vol) {
    const osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);
    gain.gain.setValueAtTime(Math.max(0.0001, vol * 0.72), now); // the prototype's 0.18 against the swoosh's 0.25
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  return {
    play(name) {
      try {
        if (!unlocked || !enabled() || !NAMES.has(name)) return;
        const vol = volume();
        if (!(vol > 0)) return;
        const t = typeof performance !== "undefined" ? performance.now() : Date.now();
        if (t - last < GAP_MS) return;
        if (!context()) return;
        last = t;
        wake();
        (name === "snap" ? snap : swoosh)(ac.currentTime, vol);
      } catch (e) {}
    },
    unlock() {
      try {
        if (typeof window === "undefined") return;
        unlocked = true;
        if (enabled()) context();
        wake();
      } catch (e) {}
    },
  };
}
