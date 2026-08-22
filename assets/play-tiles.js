/* ══════════════════════════════════════════════════════════════════════
   Live tiles — the miniatures on the wall.

   Each scene is a small canvas rewrite of one behaviour from a real
   piece, not a video and not an embed: ~1–3KB of code, ~32fps, paused
   the moment the tile leaves the viewport or the tab goes to the back.

   In the Studio Oker direction the canvas ground is #000000 like every
   other surface, so a tile has no edge of its own — the drawing simply
   appears in the void. Each piece keeps its own colour, the way a
   photograph on this wall keeps its own colour.
   ══════════════════════════════════════════════════════════════════════ */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;

  /* ── scenes: factory(w, h) → { draw(ctx, w, h, t, ptr) } ── */
  const scenes = {

    /* Typespace — points gather into a constellation, then return */
    typespace(w, h) {
      const shape = [[.16,.62],[.22,.36],[.28,.62],[.25,.50],[.19,.50],
                     [.38,.62],[.38,.36],[.45,.36],[.50,.44],[.45,.50],[.50,.62],
                     [.60,.36],[.60,.62],[.68,.62],[.76,.36],[.82,.50],[.76,.62]];
      const targets = shape.map(([a, b]) => ({ x: a * w, y: b * h }));
      const stars = [];
      for (let i = 0; i < 62; i++) {
        stars.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12,
          r: Math.random() * 1.0 + 0.45,
          t: i < targets.length ? targets[i] : null
        });
      }
      return { draw(ctx, w, h, t, ptr) {
        const c = (t % 8200) / 8200;
        let pull = 0;
        if (c < 0.14) pull = 0;
        else if (c < 0.34) pull = (c - 0.14) / 0.20;
        else if (c < 0.74) pull = 1;
        else if (c < 0.92) pull = 1 - (c - 0.74) / 0.18;
        pull = pull * pull * (3 - 2 * pull);

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);

        for (const s of stars) {
          s.x += s.vx; s.y += s.vy;
          if (s.x < 0 || s.x > w) s.vx *= -1;
          if (s.y < 0 || s.y > h) s.vy *= -1;
          if (ptr.active) {
            const dx = s.x - ptr.x, dy = s.y - ptr.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 3200 && d2 > 1) {
              const f = (1 - d2 / 3200) * 0.9;
              s.x += dx / Math.sqrt(d2) * f; s.y += dy / Math.sqrt(d2) * f;
            }
          }
          s.px = s.t ? s.x + (s.t.x - s.x) * pull : s.x;
          s.py = s.t ? s.y + (s.t.y - s.y) * pull : s.y;
        }

        if (pull > 0.24) {
          ctx.strokeStyle = 'rgba(150,196,236,' + ((pull - 0.24) * 0.5).toFixed(3) + ')';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          for (let i = 0; i < targets.length - 1; i++) {
            const a = stars[i], b = stars[i + 1];
            if (Math.hypot(a.px - b.px, a.py - b.py) > w * 0.2) continue;
            ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py);
          }
          ctx.stroke();
        }

        for (const s of stars) {
          const lit = s.t ? 0.66 + pull * 0.34 : 0.46;
          ctx.fillStyle = 'rgba(236,244,255,' + lit.toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(s.px, s.py, s.r * (s.t ? 1.25 + pull * 0.85 : 1.1), 0, TAU);
          ctx.fill();
        }
      }};
    },

    /* Rakugaki Jam — draw with the pointer, strokes land on the shared wall */
    rakugaki(w, h) {
      const wallX = w * 0.7;
      const live = [];          // active strokes
      const wall = [];          // strokes sent to the wall
      let cur = null, hue = 200, autoT = 0, autoPh = 0, wasDrawing = false;

      const push = (x, y) => {
        if (!cur) { cur = { pts: [], hue: (hue += 47) % 360, born: 0 }; live.push(cur); }
        const p = cur.pts;
        if (!p.length || Math.hypot(x - p[p.length - 1].x, y - p[p.length - 1].y) > 2) {
          p.push({ x, y });
          if (p.length > 90) p.shift();
        }
      };
      const send = () => {
        if (cur && cur.pts.length > 3) {
          wall.push({ pts: cur.pts.map((p) => ({ x: p.x / wallX, y: p.y / h })), hue: cur.hue });
          if (wall.length > 4) wall.shift();
        }
        if (cur) cur.dying = true;
        cur = null;
      };

      return { draw(ctx, w, h, t, ptr) {
        const dt = 16;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);

        const drawing = ptr.down && ptr.x < wallX;
        if (drawing) {
          if (!wasDrawing && cur) send();     /* a hand takes over from the demo */
          push(ptr.x, ptr.y);
          wasDrawing = true;
          autoT = -2400; autoPh = 0;
        } else if (wasDrawing) {
          send();
          wasDrawing = false;
        } else {
          autoT += dt;
          if (autoT > 0) {
            autoPh += 0.06;
            const x = wallX * 0.5 + Math.cos(autoPh * 1.7) * wallX * 0.3;
            const y = h * 0.5 + Math.sin(autoPh * 2.6) * h * 0.26;
            push(x, y);
            if (autoPh > 3.8) { send(); autoPh = 0; autoT = -700; }
          }
        }

        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (let i = live.length - 1; i >= 0; i--) {
          const s = live[i];
          s.born += dt;
          const a = s.dying ? Math.max(0, 1 - (s.born - (s.deadAt || (s.deadAt = s.born))) / 620) : 1;
          if (a <= 0) { live.splice(i, 1); continue; }
          ctx.strokeStyle = 'hsla(' + s.hue + ' 78% 66% / ' + a.toFixed(2) + ')';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          s.pts.forEach((p, j) => j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
          ctx.stroke();
        }

        /* the shared wall */
        ctx.fillStyle = 'rgba(255,255,255,0.035)';
        ctx.fillRect(wallX + 8, h * 0.12, w - wallX - 16, h * 0.76);
        ctx.strokeStyle = 'rgba(255,255,255,0.14)';
        ctx.lineWidth = 1;
        ctx.strokeRect(wallX + 8.5, h * 0.12 + 0.5, w - wallX - 17, h * 0.76);
        const bx = wallX + 14, by = h * 0.16, bw = w - wallX - 28, bh = h * 0.68;
        ctx.lineWidth = 1.4;
        wall.forEach((s, i) => {
          ctx.strokeStyle = 'hsla(' + s.hue + ' 74% 66% / ' + (0.32 + i * 0.16) + ')';
          ctx.beginPath();
          s.pts.forEach((p, j) => {
            const x = bx + p.x * bw, y = by + p.y * bh;
            j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          });
          ctx.stroke();
        });
      }};
    },

    /* Resona — pseudo-haptics: a body with mass, squash and trail */
    resona(w, h) {
      const b = { x: w / 2, y: h / 2, vx: 0, vy: 0 };
      const trail = [];
      return { draw(ctx, w, h, t, ptr) {
        const tx = ptr.active ? ptr.x : w / 2 + Math.cos(t / 1500) * w * 0.26;
        const ty = ptr.active ? ptr.y : h / 2 + Math.sin(t / 940)  * h * 0.20;
        b.vx = (b.vx + (tx - b.x) * 0.052) * 0.87;
        b.vy = (b.vy + (ty - b.y) * 0.052) * 0.87;
        b.x += b.vx; b.y += b.vy;

        trail.unshift({ x: b.x, y: b.y });
        if (trail.length > 7) trail.pop();

        const sp = Math.hypot(b.vx, b.vy);
        const st = Math.min(sp * 0.032, 0.46);
        const ang = sp > 0.4 ? Math.atan2(b.vy, b.vx) : 0;
        const size = Math.min(w, h) * 0.21;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);

        trail.forEach((p, i) => {
          if (!i) return;
          const a = (1 - i / trail.length) * 0.13;
          ctx.fillStyle = 'rgba(196,214,255,' + a.toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 0.5 * (1 - i * 0.06), 0, TAU);
          ctx.fill();
        });

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(ang);
        ctx.scale(1 + st, 1 - st * 0.72);
        ctx.fillStyle = '#eef3fb';
        const r = size * 0.24;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-size / 2, -size / 2, size, size, r);
        else ctx.rect(-size / 2, -size / 2, size, size);
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(tx, ty, 5, 0, TAU); ctx.stroke();
      }};
    },

    /* Marubatsu — games play themselves */
    marubatsu(w, h) {
      const GAMES = [
        { moves: [0, 4, 1, 7, 2], win: [0, 1, 2] },
        { moves: [4, 1, 0, 7, 8], win: [0, 4, 8] },
        { moves: [0, 4, 2, 1, 6, 7], win: [1, 4, 7] }
      ];
      let gi = 0, t0 = null;
      const MOVE = 460, STRIKE = 420, HOLD = 1100;

      return { draw(ctx, w, h, t) {
        const g = GAMES[gi];
        if (t0 === null) t0 = t;
        const e = t - t0;
        const total = g.moves.length * MOVE + STRIKE + HOLD;
        if (e > total) { gi = (gi + 1) % GAMES.length; t0 = t; }

        const s = Math.min(w, h) * 0.74;
        const ox = (w - s) / 2, oy = (h - s) / 2, c = s / 3;
        const cx = (i) => ox + (i % 3) * c + c / 2;
        const cy = (i) => oy + Math.floor(i / 3) * c + c / 2;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(255,255,255,0.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 1; i < 3; i++) {
          ctx.moveTo(ox + i * c, oy);      ctx.lineTo(ox + i * c, oy + s);
          ctx.moveTo(ox, oy + i * c);      ctx.lineTo(ox + s, oy + i * c);
        }
        ctx.stroke();

        const placed = Math.min(g.moves.length, Math.floor(e / MOVE));
        const r = c * 0.27;
        ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        for (let i = 0; i < placed; i++) {
          const cell = g.moves[i];
          const grow = Math.min(1, (e - i * MOVE) / 260);
          const k = grow * grow * (3 - 2 * grow);
          const x = cx(cell), y = cy(cell);
          if (i % 2 === 0) {
            ctx.strokeStyle = 'rgba(238,244,252,0.94)';
            ctx.beginPath(); ctx.arc(x, y, r * k, 0, TAU); ctx.stroke();
          } else {
            ctx.strokeStyle = 'rgba(150,196,236,0.94)';
            const q = r * 0.82 * k;
            ctx.beginPath();
            ctx.moveTo(x - q, y - q); ctx.lineTo(x + q, y + q);
            ctx.moveTo(x + q, y - q); ctx.lineTo(x - q, y + q);
            ctx.stroke();
          }
        }

        if (placed >= g.moves.length) {
          const p = Math.min(1, (e - g.moves.length * MOVE) / STRIKE);
          const a = g.win[0], b = g.win[2];
          ctx.strokeStyle = 'rgba(255,214,120,0.9)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx(a), cy(a));
          ctx.lineTo(cx(a) + (cx(b) - cx(a)) * p, cy(a) + (cy(b) - cy(a)) * p);
          ctx.stroke();
        }
      }};
    },

    /* Koe Baku — a shout becomes onomatopoeia */
    koebaku(w, h) {
      const WORDS = ['ドン', 'バン', 'ズドン', 'ゴォ', 'ワッ', 'パッ', 'ドカン'];
      const bursts = [];
      const bars = new Array(28).fill(0);
      let next = 600, acc = 0, wi = 0;

      const spawn = (x, y) => {
        bursts.push({
          x: x != null ? x : w * (0.22 + Math.random() * 0.56),
          y: y != null ? y : h * (0.24 + Math.random() * 0.5),
          word: WORDS[wi++ % WORDS.length],
          rot: (Math.random() - 0.5) * 0.44,
          age: 0
        });
        if (bursts.length > 4) bursts.shift();
        for (let i = 0; i < bars.length; i++) bars[i] = 0.35 + Math.random() * 0.65;
      };

      return { draw(ctx, w, h, t, ptr) {
        const dt = 16;
        acc += dt;
        if (acc > next) { acc = 0; next = 780 + Math.random() * 700; spawn(); }
        if (ptr.down && !ptr._fired) { ptr._fired = true; spawn(ptr.x, ptr.y); }
        if (!ptr.down) ptr._fired = false;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);

        /* on-device level meter */
        const bw = w / bars.length;
        for (let i = 0; i < bars.length; i++) {
          bars[i] *= 0.93;
          const bh = 3 + bars[i] * h * 0.20;
          ctx.fillStyle = 'rgba(150,196,236,' + (0.14 + bars[i] * 0.4).toFixed(3) + ')';
          ctx.fillRect(i * bw + 1, h - bh - 6, bw - 2, bh);
        }

        for (let i = bursts.length - 1; i >= 0; i--) {
          const b = bursts[i];
          b.age += dt;
          const p = b.age / 1500;
          if (p >= 1) { bursts.splice(i, 1); continue; }
          const pop = p < 0.18 ? p / 0.18 : 1;
          const k = 1 - Math.pow(1 - pop, 3);
          const a = p > 0.62 ? 1 - (p - 0.62) / 0.38 : 1;
          const size = Math.min(w, h) * (0.14 + k * 0.11);

          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(b.rot);
          ctx.globalAlpha = a;

          ctx.strokeStyle = 'rgba(255,214,120,0.55)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          for (let s = 0; s < 10; s++) {
            const ang = (s / 10) * TAU + b.rot;
            const r0 = size * (0.72 + k * 0.5), r1 = r0 + size * 0.34 * k;
            ctx.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0);
            ctx.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
          }
          ctx.stroke();

          ctx.font = '700 ' + size.toFixed(1) + 'px "Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.lineWidth = size * 0.16;
          ctx.strokeStyle = '#000000';
          ctx.strokeText(b.word, 0, 0);
          ctx.fillStyle = '#f4f7fc';
          ctx.fillText(b.word, 0, 0);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }};
    },

    /* EmojiDrop — four shooters, one per corner */
    emojidrop(w, h) {
      const CH = ['🍕', '🌵', '🐙', '🍋', '🛸', '🐸', '⚡', '🍄'];
      /* One origin per player. The tile claims four, so it fires from four. */
      const ORIGINS = [[0.16, 1], [0.84, 1], [0.16, 0], [0.84, 0]];
      const drops = [], shots = [], pops = [];
      let acc = 0, fire = 0, ci = 0;
      const size = Math.max(13, Math.min(w, h) * 0.11);
      for (let i = 0; i < 4; i++) {
        drops.push({
          x: w * (0.16 + Math.random() * 0.68), y: h * (0.1 + Math.random() * 0.6),
          vy: 1.3 + Math.random() * 0.9,
          ch: CH[ci++ % CH.length], spin: (Math.random() - 0.5) * 0.05, a: 0
        });
      }

      return { draw(ctx, w, h, t) {
        const dt = 16;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);

        acc += dt;
        if (acc > 320 && drops.length < 7) {
          acc = 0;
          drops.push({
            x: w * (0.16 + Math.random() * 0.68),
            y: -size - Math.random() * h * 0.5,
            vy: 1.3 + Math.random() * 0.9,
            ch: CH[ci++ % CH.length], spin: (Math.random() - 0.5) * 0.05, a: 0
          });
        }

        fire += dt;
        if (fire > 380 && drops.length) {
          fire = 0;
          const target = drops[Math.floor(Math.random() * drops.length)];
          const o = ORIGINS[Math.floor(Math.random() * ORIGINS.length)];
          const sx = w * o[0];
          const sy = o[1] ? h - 10 : 10;
          const d = Math.hypot(target.x - sx, target.y - sy) || 1;
          shots.push({ x: sx, y: sy, vx: (target.x - sx) / d * 4.2, vy: (target.y - sy) / d * 4.2 });
        }

        ctx.font = size + 'px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        for (let i = drops.length - 1; i >= 0; i--) {
          const d = drops[i];
          d.y += d.vy; d.a += d.spin;
          if (d.y > h + size) { drops.splice(i, 1); continue; }
          ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.a);
          ctx.fillText(d.ch, 0, 0); ctx.restore();
        }

        ctx.fillStyle = 'rgba(255,214,120,0.95)';
        for (let i = shots.length - 1; i >= 0; i--) {
          const s = shots[i];
          s.x += s.vx; s.y += s.vy;
          if (s.x < -20 || s.x > w + 20 || s.y < -20 || s.y > h + 20) { shots.splice(i, 1); continue; }
          let hitAt = -1;
          for (let j = 0; j < drops.length; j++) {
            if (Math.hypot(drops[j].x - s.x, drops[j].y - s.y) < size * 0.55) { hitAt = j; break; }
          }
          if (hitAt >= 0) {
            pops.push({ x: drops[hitAt].x, y: drops[hitAt].y, age: 0 });
            drops.splice(hitAt, 1); shots.splice(i, 1);
            continue;
          }
          ctx.beginPath(); ctx.arc(s.x, s.y, 2.4, 0, TAU); ctx.fill();
        }

        for (let i = pops.length - 1; i >= 0; i--) {
          const p = pops[i];
          p.age += dt;
          const k = p.age / 420;
          if (k >= 1) { pops.splice(i, 1); continue; }
          ctx.strokeStyle = 'rgba(255,214,120,' + (1 - k).toFixed(2) + ')';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(p.x, p.y, size * 0.4 + k * size * 0.7, 0, TAU); ctx.stroke();
        }

        /* the four players — one bar per origin, so the tile shows the
           same count the copy claims */
        ctx.fillStyle = 'rgba(236,244,255,0.5)';
        for (const o of ORIGINS) ctx.fillRect(w * o[0] - 11, o[1] ? h - 8 : 5, 22, 3);
      }};
    }
  };

  /* ── harness: DPR, visibility, reduced motion, pointer ── */
  const mount = (canvas) => {
    const factory = scenes[canvas.dataset.play];
    if (!factory) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const ptr = { x: -999, y: -999, active: false, down: false };
    let w = 0, h = 0, scene = null, raf = 0, onScreen = false, last = 0, start = 0;

    const paint = (now) => {
      if (!scene) return;
      ctx.save();
      scene.draw(ctx, w, h, now - start, ptr);
      ctx.restore();
    };

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 30) return;      /* ~32fps is plenty at this size */
      last = now;
      paint(now);
    };

    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const play = () => {
      if (raf || !scene) return;
      if (reduced.matches) { paint(performance.now()); return; }
      last = 0;
      raf = requestAnimationFrame(loop);
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.round(r.width); h = Math.round(r.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene = factory(w, h);
      start = performance.now();
      paint(start);
    };

    new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      if (onScreen) { if (!w) resize(); play(); } else stop();
    }, { rootMargin: '80px' }).observe(canvas);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else if (onScreen) play();
    });

    let rt = 0;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { if (onScreen) { resize(); } else { w = 0; } }, 180);
    });

    reduced.addEventListener('change', () => { stop(); if (onScreen) play(); });

    /* pointer — and don't navigate when the visitor was drawing */
    const stage = canvas.parentElement;
    const tile = canvas.closest('.play-tile');
    let downX = 0, downY = 0, moved = 0;

    const at = (e) => {
      const r = canvas.getBoundingClientRect();
      ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top;
    };
    stage.addEventListener('pointermove', (e) => { at(e); ptr.active = true; if (ptr.down) moved = Math.max(moved, Math.hypot(e.clientX - downX, e.clientY - downY)); });
    stage.addEventListener('pointerenter', (e) => { at(e); ptr.active = true; });
    stage.addEventListener('pointerleave', () => { ptr.active = false; ptr.down = false; ptr.x = -999; ptr.y = -999; });
    stage.addEventListener('pointerdown', (e) => { at(e); ptr.active = true; ptr.down = true; downX = e.clientX; downY = e.clientY; moved = 0; });
    window.addEventListener('pointerup', () => { ptr.down = false; });
    if (tile) {
      tile.addEventListener('click', (e) => {
        if (moved > 10) { e.preventDefault(); moved = 0; }
      });
    }
  };

  document.querySelectorAll('canvas[data-play]').forEach(mount);
})();
