// A short, one-shot sand entrance. Real HTML stays in place and accessible;
// the temporary canvas samples local images and visible text, never the DOM
// into an experimental html-in-canvas renderer. No scroll interception.
import "../styles/sand.css";
import TOKENS from "../data/sand-motion.json";
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let observer;
const playing = new Map();
const pending = new Set();
function finish(canvas) {
  canvas.parentElement?.classList.remove("sand-active");
  canvas.remove();
  playing.delete(canvas);
}
function pump() {
  for (const el of pending) {
    if (playing.size >= TOKENS.maxConcurrent) break;
    pending.delete(el);
    if (reveal(el)) observer?.unobserve(el);
  }
}

export function stopSand() {
  observer?.disconnect();
  observer = null;
  pending.clear();
  for (const [canvas, frame] of playing) { cancelAnimationFrame(frame); finish(canvas); }
  playing.clear();
}
// A focused or pressed control must become readable immediately.
for (const event of ["pointerdown", "focusin"]) document.addEventListener(event, e => {
  for (const [canvas, frame] of playing) {
    if (canvas.parentElement?.contains(e.target)) { cancelAnimationFrame(frame); finish(canvas); }
  }
  pump();
}, { passive: true });
reduced.addEventListener("change", () => { if (reduced.matches) stopSand(); else initSand(); });
document.addEventListener("visibilitychange", () => { if (document.hidden) stopSand(); else initSand(); });
let resizeTimer;
window.addEventListener("resize", () => {
  stopSand();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(initSand, 150);
}, { passive: true });

function paintSource(el, source, rect) {
  const ctx = source.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  for (const img of el.querySelectorAll("img")) {
    const box = img.getBoundingClientRect();
    const imageStyle = getComputedStyle(img);
    if (imageStyle.visibility === "hidden" || img.closest(".hh-slide:not(.is-active)")) continue;
    if (!img.complete || !img.naturalWidth || box.width === 0 || box.height === 0) continue;
    // Remote media must never taint the canvas or introduce a request.
    if (new URL(img.currentSrc || img.src, location.href).origin !== location.origin) continue;
    const fit = imageStyle.objectFit === "contain" ? Math.min : Math.max;
    const scale = fit(box.width / img.naturalWidth, box.height / img.naturalHeight);
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    const fraction = value => ({ left: 0, top: 0, center: 0.5, right: 1, bottom: 1 })[value] ?? (value.endsWith("%") ? parseFloat(value) / 100 : 0.5);
    const [horizontal = "50%", vertical = "50%"] = imageStyle.objectPosition.split(" ");
    ctx.save();
    ctx.beginPath(); ctx.rect(box.x - rect.x, box.y - rect.y, box.width, box.height); ctx.clip();
    ctx.drawImage(img, box.x - rect.x + (box.width - w) * fraction(horizontal), box.y - rect.y + (box.height - h) * fraction(vertical), w, h);
    ctx.restore();
  }
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node, count = 0;
  while ((node = walker.nextNode()) && count < 180) {
    if (!node.textContent.trim() || node.parentElement.closest("script, style, .sr-only, .visually-hidden")) continue;
    const style = getComputedStyle(node.parentElement);
    if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) continue;
    const range = document.createRange();
    // Measure words, not whole paragraphs, to preserve their actual wrapping.
    for (const match of node.textContent.matchAll(/\S+/g)) {
      range.setStart(node, match.index); range.setEnd(node, match.index + match[0].length);
      const box = range.getBoundingClientRect();
      if (!box.width || !box.height || box.bottom < rect.top || box.top > rect.bottom) continue;
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ctx.fillStyle = style.color;
      ctx.textBaseline = "top";
      ctx.fillText(match[0], box.x - rect.x, box.y - rect.y);
    }
    count++;
  }
  return ctx;
}

function reveal(el) {
  if (reduced.matches || !el.isConnected || document.hidden) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;
  // Sample in CSS pixels, with a strict cap independent of DPR and card size.
  const source = document.createElement("canvas");
  source.width = Math.ceil(rect.width); source.height = Math.min(1200, Math.ceil(rect.height));
  let pixels;
  try { pixels = paintSource(el, source, rect)?.getImageData(0, 0, source.width, source.height).data; } catch { /* Normal HTML is the fallback. */ }
  if (!pixels) return;
  const canvas = document.createElement("canvas");
  canvas.className = "sand-layer";
  canvas.style.height = `${source.height}px`;
  canvas.setAttribute("aria-hidden", "true");
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = Math.ceil(rect.width * dpr); canvas.height = Math.ceil(source.height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  const style = getComputedStyle(el);
  const background = style.backgroundColor === "rgba(0, 0, 0, 0)" ? getComputedStyle(document.documentElement).getPropertyValue("--pr-canvas").trim() : style.backgroundColor;
  const ink = getComputedStyle(document.documentElement).getPropertyValue("--pr-ink-2").trim();
  const grains = [];
  const step = Math.max(2, Math.sqrt(source.width * source.height / TOKENS.particleBudget));
  for (let y = 1; y < source.height; y += step) {
    for (let x = 1; x < source.width; x += step) {
      const pos = (Math.floor(y) * source.width + Math.floor(x)) * 4;
      const hasContent = pixels[pos + 3] > 80;
      const luminance = (pixels[pos] + pixels[pos+1] + pixels[pos+2]) / 3;
      const neighbor = Math.min(pixels.length - 4, pos + Math.round(step) * 4);
      const contrast = Math.abs(luminance - (pixels[neighbor] + pixels[neighbor+1] + pixels[neighbor+2]) / 3);
      const chroma = Math.max(pixels[pos], pixels[pos+1], pixels[pos+2]) - Math.min(pixels[pos], pixels[pos+1], pixels[pos+2]);
      // Flat black/white regions produce soot or static; keep their edges and
      // the actual image colours, plus a few quieter grains over empty cells.
      if (hasContent && contrast < 12 && chroma < 24 && (luminance < 40 || luminance > 225) && Math.random() > 0.25) continue;
      if (!hasContent && Math.random() > TOKENS.ambientDensity) continue;
      grains.push({ x, y, dx: (Math.random() - 0.5) * TOKENS.horizontalSpreadPx, dy: 40 + Math.random() * TOKENS.verticalSpreadPx,
        delay: Math.random() * 0.2, size: TOKENS.minGrainPx + Math.random() * TOKENS.grainVariationPx,
        color: hasContent ? `rgb(${pixels[pos]},${pixels[pos+1]},${pixels[pos+2]})` : ink,
        alpha: hasContent ? 1 : 0.7 });
    }
  }
  canvas.dataset.grainCount = String(grains.length);
  el.style.setProperty("--sand-duration", `${TOKENS.durationMs}ms`);
  el.style.setProperty("--sand-reveal-delay", `${TOKENS.durationMs * TOKENS.contentRevealStart}ms`);
  el.style.setProperty("--sand-reveal-duration", `${TOKENS.durationMs * (TOKENS.contentRevealEnd - TOKENS.contentRevealStart)}ms`);
  if (style.position === "static") el.classList.add("sand-positioned");
  el.classList.add("sand-active");
  el.append(canvas);
  el.dataset.sandPlayed = "true";
  const start = performance.now();
  function frame(now) {
    if (!el.isConnected || reduced.matches || now - start > TOKENS.durationMs) { finish(canvas); pump(); return; }
    const t = Math.min(1, (now - start) / TOKENS.durationMs);
    ctx.clearRect(0, 0, rect.width, source.height);
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - TOKENS.contentRevealStart) / (TOKENS.contentRevealEnd - TOKENS.contentRevealStart));
    ctx.fillStyle = background || "transparent";
    ctx.fillRect(0, 0, rect.width, source.height);
    for (const g of grains) {
      const p = Math.max(0, Math.min(1, (t - g.delay) / (1 - g.delay)));
      const remaining = (1 - p) ** 2;
      ctx.globalAlpha = g.alpha * Math.min(1, t * 12) * Math.min(1, (1 - t) * 6);
      ctx.fillStyle = g.color;
      ctx.fillRect(g.x + g.dx * remaining + Math.sin(p * Math.PI) * 24, g.y + g.dy * remaining, g.size, g.size);
    }
    ctx.globalAlpha = 1;
    playing.set(canvas, requestAnimationFrame(frame));
  }
  playing.set(canvas, requestAnimationFrame(frame));
  return true;
}

export function initSand() {
  stopSand();
  if (reduced.matches || !("IntersectionObserver" in window)) return;
  // Shared surface taxonomy plus structural fallback: pages need no bespoke
  // motion code. Explicit surfaces win over nested children and whole sections.
  const explicit = [...document.querySelectorAll(`#main :is(${TOKENS.surfaceSelector})`)];
  const fallback = [...document.querySelectorAll(`#main :is(${TOKENS.fallbackSelector})`)]
    .filter(el => !el.querySelector(TOKENS.surfaceSelector));
  const candidates = new Set([...explicit, ...fallback]);
  const targets = [...candidates].filter(el => {
    if (el.dataset.sandPlayed || el.closest(TOKENS.excludeSelector)) return false;
    for (let parent = el.parentElement; parent; parent = parent.parentElement) {
      if (candidates.has(parent)) return false;
    }
    el.dataset.sandSurface = "";
    return true;
  });
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) pending.add(entry.target);
      else pending.delete(entry.target);
    }
    pump();
  }, { threshold: 0.08 });
  for (const el of targets) observer.observe(el);
}
