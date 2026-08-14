/* ── field.js — the index's resting state, and what replaces the wrong photo ──
 *
 * Two problems, one surface.
 *
 * 1. With nothing hovered, the index was blank paper. It only became anything
 *    once the cursor found a name, which is backwards: the first thing a
 *    visitor sees is the thing that has to hold them.
 *
 * 2. Half the rows pointed at a photograph belonging to a different project.
 *    Rakugaki Jam showed Marubatsu's tic-tac-toe board. A wrong image is worse
 *    than none — it teaches the visitor that the visuals are decoration.
 *
 * Both are answered by one canvas with two states. Idle is a pointer-reactive
 * dot matrix. Hovering a name keeps the same dots and adds that project's own
 * motif drawn in the same vocabulary — Rakugaki Jam draws strokes that fly to
 * a wall, because that is literally what Rakugaki Jam does. Nothing is
 * borrowed, and the hover is not a competing layer: it is where the resting
 * state was always heading.
 *
 * Projects with real photography of their own keep the photograph (the DOM
 * layer). Motifs exist only for the built pieces, which have no photograph
 * and never needed one.
 *
 * Canvas, not Three.js: this is a dot grid and some strokes. A WebGL context
 * and a library over the network would cost more than it draws.
 * ────────────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  const cv = document.getElementById('tuField');
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SPACING = 26;      // dot pitch
  const REACH = 250;       // how far the pointer is felt
  const lerp = (a, b, t) => a + (b - a) * t;

  let W = 0, H = 0, wide = false;
  let px = 0, py = 0, tx = 0, ty = 0;     // pointer, smoothed then raw
  let lit = 0, litTarget = 0;             // 0 = paper, 1 = project colour
  let motif = null, motifName = null, motifT = 0;
  let running = false, last = 0, t = 0;

  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.75);
    W = innerWidth; H = innerHeight;
    wide = W >= 900;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = `${W}px`;
    cv.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!px && !py) { px = tx = W * 0.5; py = ty = H * 0.42; }
  };

  // Kept clear of the right-hand meta column. The old photo layer ran to the
  // screen edge and sat under the credits; line art at low alpha does not.
  const box = () => ({ x: W * 0.52, y: H * 0.18, w: W * 0.34, h: H * 0.64 });

  /* ── The dot matrix ───────────────────────────────────────────────────── */

  const dots = () => {
    // Ink on paper when idle; light on colour when a project is lit. One
    // interpolation, so the inversion happens with the colour rather than
    // after it.
    const c = Math.round(lerp(17, 255, lit));
    const dim = lerp(0.1, 0.16, lit);
    const hot = lerp(0.42, 0.55, lit);
    const base = 1.5;

    // A soft pool under the cursor. On paper it reads as a shadow, on a lit
    // field as a light — the same gesture either way, which is what keeps the
    // resting state and the hovered state feeling like one surface.
    if (!reduce) {
      const g = ctx.createRadialGradient(px, py, 0, px, py, REACH * 1.6);
      g.addColorStop(0, `rgba(${c},${c},${c},${lerp(0.045, 0.075, lit)})`);
      g.addColorStop(1, `rgba(${c},${c},${c},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.beginPath();
    const near = [];
    for (let y = SPACING * 0.5; y < H; y += SPACING) {
      for (let x = SPACING * 0.5; x < W; x += SPACING) {
        const dx = x - px, dy = y - py;
        const f = reduce ? 0 : Math.exp(-(dx * dx + dy * dy) / (REACH * REACH));
        const wave = reduce ? 0.5 : Math.sin(t * 0.85 + x * 0.0075 + y * 0.011) * 0.5 + 0.5;
        const s = base * (0.5 + 0.5 * wave) + f * 2.4;
        // Pushed gently away from the cursor — the field notices you without
        // chasing you.
        const ox = dx * 0.07 * f, oy = dy * 0.07 * f;
        if (f > 0.16) { near.push(x + ox, y + oy, s); continue; }
        ctx.rect(x + ox - s / 2, y + oy - s / 2, s, s);
      }
    }
    ctx.fillStyle = `rgba(${c},${c},${c},${dim})`;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < near.length; i += 3) {
      const s = near[i + 2];
      ctx.rect(near[i] - s / 2, near[i + 1] - s / 2, s, s);
    }
    ctx.fillStyle = `rgba(${c},${c},${c},${hot})`;
    ctx.fill();
  };

  /* ── Motifs — one per built piece, each drawing its own mechanic ──────── */

  const M = {};

  /* Rakugaki Jam: you scribble, the finished stroke flies to the wall. The
     project page runs this same mechanic for real; here it is the preview. */
  M.strokes = {
    hues: [318, 292, 262, 342, 196],
    reset() { this.live = []; this.n = 0; this.next = 0; },
    step(dt, b) {
      this.next -= dt;
      if (this.next <= 0 && this.live.length < 7) {
        this.next = 0.6;
        const cx = b.x + b.w * (0.08 + Math.random() * 0.28);
        const cy = b.y + b.h * (0.12 + Math.random() * 0.66);
        const r = b.h * (0.08 + Math.random() * 0.1);
        const turns = 1.3 + Math.random() * 1.2;
        const pts = [];
        for (let i = 0; i <= 30; i++) {
          const a = (i / 30) * Math.PI * 2 * turns;
          const k = 1 - i / 52;
          pts.push(cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k);
        }
        this.live.push({ pts, hue: this.hues[this.n++ % this.hues.length], age: 0 });
      }
      for (let i = this.live.length - 1; i >= 0; i--) {
        this.live[i].age += dt;
        if (this.live[i].age > 3.6) this.live.splice(i, 1);
      }
    },
    draw(b, alpha) {
      const wallX = b.x + b.w * 0.68;
      for (const s of this.live) {
        // draw (0–0.9s) → fly to the wall (0.9–1.9s) → sit on the wall
        const drawn = Math.min(1, s.age / 0.9);
        const flight = Math.max(0, Math.min(1, (s.age - 0.9) / 1.0));
        const e = 1 - Math.pow(1 - flight, 3);
        const k = 1 - 0.6 * e;
        const ox = (wallX - b.x) * e * 0.62;
        const fade = s.age > 3 ? 1 - (s.age - 3) / 0.6 : 1;
        const n = Math.max(2, Math.floor((s.pts.length / 2) * drawn));
        ctx.save();
        // The ground is deliberately almost colourless; all of the colour on
        // screen comes from here, so the strokes carry a marker's bloom.
        ctx.globalAlpha = alpha * (0.8 + 0.2 * e) * fade;
        ctx.strokeStyle = `hsl(${s.hue} 96% 70%)`;
        ctx.shadowColor = `hsl(${s.hue} 96% 62%)`;
        ctx.shadowBlur = 18 * k;
        ctx.lineWidth = 3.6 * k;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const x = b.x + (s.pts[i * 2] - b.x) * k + ox;
          const y = b.y + (s.pts[i * 2 + 1] - b.y) * k;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }
      // The wall the strokes are flying at.
      ctx.save();
      ctx.globalAlpha = alpha * 0.22;
      ctx.setLineDash([4, 7]);
      ctx.strokeStyle = 'rgba(255,255,255,.8)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(wallX, b.y); ctx.lineTo(wallX, b.y + b.h); ctx.stroke();
      ctx.restore();
    },
  };

  /* Typespace: words become constellations. */
  M.constellation = {
    reset() {
      this.p = [];
      for (let i = 0; i < 26; i++) this.p.push({ a: Math.random() * 6.28, r: Math.random(), s: 0.1 + Math.random() * 0.25, tw: Math.random() * 6.28 });
    },
    step(dt) { for (const q of this.p) { q.a += q.s * dt * 0.16; q.tw += dt * 2; } },
    draw(b, alpha) {
      const cx = b.x + b.w * 0.5, cy = b.y + b.h * 0.5;
      const R = Math.min(b.w, b.h) * 0.46;
      const xy = this.p.map((q) => [cx + Math.cos(q.a) * R * (0.35 + q.r * 0.65), cy + Math.sin(q.a) * R * (0.35 + q.r * 0.65) * 0.82]);
      ctx.save();
      ctx.strokeStyle = 'rgba(190,205,255,.75)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let i = 0; i < xy.length; i++) {
        for (let j = i + 1; j < xy.length; j++) {
          const d = Math.hypot(xy[i][0] - xy[j][0], xy[i][1] - xy[j][1]);
          if (d < R * 0.42) { ctx.moveTo(xy[i][0], xy[i][1]); ctx.lineTo(xy[j][0], xy[j][1]); }
        }
      }
      ctx.globalAlpha = alpha * 0.3; ctx.stroke();
      ctx.fillStyle = '#eaf0ff';
      for (let i = 0; i < xy.length; i++) {
        ctx.globalAlpha = alpha * (0.5 + 0.5 * (Math.sin(this.p[i].tw) * 0.5 + 0.5));
        const s = 1.6 + this.p[i].r * 1.8;
        ctx.beginPath(); ctx.arc(xy[i][0], xy[i][1], s, 0, 6.29); ctx.fill();
      }
      ctx.restore();
    },
  };

  /* Resona 響: pseudo-haptics — rings that carry weight, fast then heavy. */
  M.ripple = {
    reset() { this.r = [0, 0.33, 0.66].map((o) => ({ p: o })); },
    step(dt) { for (const q of this.r) q.p = (q.p + dt * 0.28) % 1; },
    draw(b, alpha) {
      const cx = b.x + b.w * 0.5, cy = b.y + b.h * 0.5;
      const R = Math.min(b.w, b.h) * 0.46;
      ctx.save();
      ctx.strokeStyle = 'rgba(150,240,226,.9)';
      for (const q of this.r) {
        const e = 1 - Math.pow(1 - q.p, 2.4);   // weight: it arrives, then settles
        ctx.globalAlpha = alpha * (1 - q.p) * 0.8;
        ctx.lineWidth = 1 + 2.4 * (1 - q.p);
        ctx.beginPath(); ctx.arc(cx, cy, R * e, 0, 6.29); ctx.stroke();
      }
      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle = 'rgba(150,240,226,.9)';
      ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, 6.29); ctx.fill();
      ctx.restore();
    },
  };

  /* Marubatsu Arena: the board, filling in and clearing. */
  M.grid = {
    seq: [[0, 0], [1, 1], [0, 2], [2, 0], [1, 0], [1, 2], [2, 2]],
    reset() { this.k = 0; this.acc = 0; },
    step(dt) { this.acc += dt; if (this.acc > 0.62) { this.acc = 0; this.k = (this.k + 1) % (this.seq.length + 2); } },
    draw(b, alpha) {
      const S = Math.min(b.w, b.h) * 0.74;
      const x0 = b.x + (b.w - S) / 2, y0 = b.y + (b.h - S) / 2, c = S / 3;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.globalAlpha = alpha * 0.26; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 1; i < 3; i++) {
        ctx.moveTo(x0 + c * i, y0); ctx.lineTo(x0 + c * i, y0 + S);
        ctx.moveTo(x0, y0 + c * i); ctx.lineTo(x0 + S, y0 + c * i);
      }
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.9; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
      for (let i = 0; i < Math.min(this.k, this.seq.length); i++) {
        const [r, col] = this.seq[i];
        const cx = x0 + c * col + c / 2, cy = y0 + c * r + c / 2, q = c * 0.26;
        ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,.92)' : 'rgba(170,150,255,.95)';
        ctx.beginPath();
        if (i % 2) { ctx.moveTo(cx - q, cy - q); ctx.lineTo(cx + q, cy + q); ctx.moveTo(cx + q, cy - q); ctx.lineTo(cx - q, cy + q); }
        else { ctx.arc(cx, cy, q, 0, 6.29); }
        ctx.stroke();
      }
      ctx.restore();
    },
  };

  /* Snap Pair: two devices finding each other, over and over. */
  M.pair = {
    reset() { this.p = 0; },
    step(dt) { this.p = (this.p + dt * 0.42) % 1; },
    draw(b, alpha) {
      const cy = b.y + b.h * 0.5, cx = b.x + b.w * 0.5;
      const open = Math.min(1, this.p / 0.55);
      const snap = this.p > 0.62 ? Math.min(1, (this.p - 0.62) / 0.18) : 0;
      const gap = b.w * 0.24 * (1 - snap) * open;
      const flash = snap > 0 && snap < 1 ? 1 - snap : 0;
      ctx.save();
      for (const s of [-1, 1]) {
        const x = cx + gap * s;
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillStyle = 'rgba(255,255,255,.92)';
        ctx.beginPath(); ctx.arc(x, cy, 7, 0, 6.29); ctx.fill();
        ctx.globalAlpha = alpha * 0.3;
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, cy, 7 + 16 * (1 - snap), 0, 6.29); ctx.stroke();
      }
      if (flash) {
        ctx.globalAlpha = alpha * flash * 0.8;
        ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, 10 + 40 * (1 - flash), 0, 6.29); ctx.stroke();
      }
      ctx.restore();
    },
  };

  /* ── Loop ─────────────────────────────────────────────────────────────── */

  const frame = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now; t += dt;

    px = lerp(px, tx, reduce ? 1 : 0.075);
    py = lerp(py, ty, reduce ? 1 : 0.075);
    lit = lerp(lit, litTarget, 0.09);

    ctx.clearRect(0, 0, W, H);
    dots();

    if (motif && wide && lit > 0.02) {
      motifT += dt;
      if (!reduce) motif.step(dt, box());
      motif.draw(box(), Math.min(1, lit * 1.1) * Math.min(1, motifT * 2.2));
    }
    requestAnimationFrame(frame);
  };

  const start = () => { if (running) return; running = true; last = performance.now(); requestAnimationFrame(frame); };
  const stop = () => { running = false; };

  addEventListener('resize', size);
  addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  size();
  start();

  window.TUField = {
    /* Called by the index when the hovered row changes. `name` is null for the
       resting state, or a motif key, or a name with no motif (photo projects,
       which keep their own image). */
    show(name) {
      litTarget = name === null ? 0 : 1;
      const next = name && M[name] ? name : null;
      if (next !== motifName) {
        motifName = next;
        motif = next ? M[next] : null;
        motifT = 0;
        if (motif) motif.reset(box());
      }
    },
  };
})();
