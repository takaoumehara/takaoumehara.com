// "Say what you want → 3 candidate configs → Jev sorts them" for the Motion
// Lab (docs/jev.md, "提案（Suggest 3）").
//
// Generation is rule-based on purpose (docs/superforge.md Round 5: "AI の生成
// は鍵を増やさない"): a small lexicon turns words in the request (JP and EN)
// into deltas on a motion config — speed, caps, cover / reveal, text mode,
// sound — and a seeded RNG picks among the allowed styles, so the same request
// and seed always give the same three. Jev only sorts them (by its
// "matchesRequest" answer); without the key the three come back unsorted and
// the route still answers 200.
//
// Plain functions, no Astro: tests/suggest.test.mjs runs them with a stubbed
// fetch, and src/pages/api/admin/jev/suggest.ts wraps handleSuggest.
import { APIError, APIConnectionError } from "@typesafe-ai/sdk";
import DEFAULTS from "../data/motion.json" with { type: "json" };
import { upgradeConfig } from "../scripts/motion-config.mjs";
import { INTERACTION_DEFAULTS } from "../scripts/motion-interactions.mjs";
import { find as findStyle } from "../scripts/styles/index.mjs";
import { judgeMotion, jevConfigured, MAX_BODY, MAX_REQUEST_CHARS } from "./jev.mjs";

// ── Vocabulary ─────────────────────────────────────────────────────────────
// The cover / reveal ids the lexicon may name. Only those the registry
// actually has (find() returns the style itself, not the fallback) are offered.
export const COVER_VOCAB = ["none", "slabs.quad-stagger", "slabs.quad-center", "slabs.split-sharp", "slabs.split-round", "slabs.dynamic", "field", "wipe", "band-sweep", "dissolve"];
export const REVEAL_VOCAB = ["box-first", "field-lift", "dissolve", "cut"];

export const availableStyles = (kind, vocab) => vocab.filter((id) => findStyle(kind, id)?.id === id);

// The looks a candidate may start from: the text/box/fill parts of the Lab's
// presets (src/scripts/motion-lab.js PRESETS, which the server cannot import
// — that module is browser-only). Timing (global) always comes from the base.
const both = (o) => ({ rail: o, pane: o });
const deep = (...parts) => {
  const out = {};
  const put = (dst, src) => {
    for (const [k, v] of Object.entries(src)) {
      if (v && typeof v === "object" && !Array.isArray(v)) put((dst[k] ??= {}), v);
      else dst[k] = v;
    }
  };
  parts.forEach((p) => put(out, p));
  return out;
};
export const PRESET_LOOKS = {
  Blueprint: deep(
    both({ outline: { style: "trace", color: "blue", drawMs: 1000, easing: "standard", lingerMs: 520, fadeOutMs: 520 }, fill: { style: "wipe-up", durationMs: 520, afterOutlineMs: 140, easing: "expo-out" } }),
    { text: { mode: "typewriter", cursor: false, cps: 60, maxLineMs: 1200 }, media: { mode: "wipe", durationMs: 520, easing: "expo-out" } },
  ),
  Viewfinder: deep(
    both({ outline: { style: "viewfinder", color: "ink", drawMs: 700, easing: "console", lingerMs: 200 }, fill: { style: "mask-reveal", durationMs: 620, easing: "console", fromXPx: -24, afterOutlineMs: -120 } }),
    { text: { mode: "scramble-typewriter", cursor: false }, media: { mode: "fade", durationMs: 520, easing: "console" } },
  ),
  Terminal: deep(
    both({ outline: { style: "march", color: "ink-2", dashPx: 2, gapPx: 3, drawMs: 600, lingerMs: 80 }, fill: { style: "scan", steps: 8, durationMs: 420 } }),
    { text: { mode: "typewriter", glyphs: "latin", cps: 38, cursor: true, cursorChar: "█", cursorBlinkMs: 380, untyped: "hide", maxLineMs: 2200, lineStaggerMs: 140 },
      media: { mode: "scanline", steps: 8, durationMs: 480, easing: "linear" } },
  ),
  Samurai: deep(
    both({ outline: { style: "corners", color: "ink", drawMs: 480, cornerPx: 14 }, fill: { style: "pixel-step", steps: 6, durationMs: 300 } }),
    { text: { mode: "scramble", glyphs: "auto", holdMs: 200, resolveCps: 60, framesPerChar: 3 }, out: { style: "outline-vanish", durationMs: 340 } },
  ),
  Decode: deep(
    both({ outline: { style: "sides", drawMs: 560 } }),
    { text: { mode: "scramble", glyphs: "symbols", jpGlyphs: "mixed", framesPerChar: 10, frameMs: 45, holdMs: 800, resolveCps: 28, direction: "random", maxLineMs: 2600, cursor: false } },
  ),
  Paper: deep(
    both({ outline: { style: "none" }, fill: { style: "fade", durationMs: 700, easing: "ease-out" } }),
    { text: { mode: "fade", long: "fade", longMs: 700 }, media: { mode: "fade", durationMs: 700, easing: "ease-out", label: { mode: "off" } }, out: { style: "fade", durationMs: 360 } },
  ),
  Skeleton: deep(
    both({ outline: { style: "none" }, fill: { style: "skeleton", durationMs: 1100, easing: "ease-in-out" } }),
    { text: { mode: "scramble", glyphs: "blocks", jpGlyphs: "same", holdMs: 400, resolveCps: 60, cursor: false },
      media: { mode: "fade", durationMs: 500, label: { mode: "always", text: "LOADING", minVisibleMs: 500 } } },
  ),
  Iris: deep(
    both({ outline: { style: "midpoints", drawMs: 560 }, fill: { style: "iris", durationMs: 520, easing: "expo-out" } }),
    { text: { direction: "center-out" }, media: { mode: "scale", durationMs: 520, easing: "expo-out" } },
  ),
  Kanji: deep(
    both({ outline: { style: "corners", color: "ink" } }),
    { text: { mode: "scramble-typewriter", glyphs: "katakana", jpGlyphs: "kanji", direction: "center-out", cursor: false } },
  ),
};

// ── Lexicon ────────────────────────────────────────────────────────────────
// Each entry: the words that trigger it (ASCII words match at a word start,
// case-insensitive; Japanese by substring), a label for the candidate's name,
// the deltas, and a short Japanese note for the "why" line. Unknown words are
// ignored. covers / reveals / presets are the allowed pools; "slabs.*" means
// every slab curtain.
export const LEXICON = [
  { key: "quiet", label: "Quiet", words: ["静か", "穏やか", "控えめ", "落ち着", "quiet", "calm", "subtle", "gentle"],
    speed: 0.75, covers: ["none", "dissolve", "field"], reveals: ["box-first", "dissolve", "field-lift"], text: "fade", note: "静か → 速度 ×0.75、文字は fade" },
  { key: "fast", label: "Fast", words: ["速い", "速く", "素早", "キビキビ", "fast", "quick", "snappy"],
    speed: 1.6, navSpeed: 1.3, cap: 0.7, note: "速い → 速度 ×1.6、上限を短く" },
  { key: "loud", label: "Loud", words: ["派手", "大胆", "loud", "bold", "dramatic"],
    covers: ["slabs.*", "wipe", "band-sweep"], out: "reverse", note: "派手 → 幕あり、退場は reverse" },
  { key: "slow", label: "Slow", words: ["遅い", "遅く", "ゆっくり", "のんびり", "slow"],
    speed: 0.6, note: "ゆっくり → 速度 ×0.6" },
  { key: "curtain", label: "Curtain", words: ["幕", "スラブ", "curtain", "slab"],
    covers: ["slabs.*"], note: "幕 → スラブの幕" },
  { key: "colour", label: "Colour", words: ["色", "グラデ", "colour", "color", "gradient"],
    covers: ["field"], reveals: ["field-lift"], note: "色 → グラデーションの field" },
  { key: "type", label: "Type", words: ["文字", "タイプ", "type", "typing", "typewriter"],
    presets: ["Terminal", "Decode", "Kanji"], note: "文字 → タイプ／スクランブル系" },
  { key: "box", label: "Boxes", words: ["箱", "骸骨", "枠", "box", "skeleton", "frame"],
    presets: ["Skeleton", "Viewfinder"], note: "箱 → Skeleton／Viewfinder" },
  { key: "sound", label: "Sound", words: ["音", "sound"],
    sound: true, note: "音 → サウンド on" },
  { key: "mobile", label: "Mobile", words: ["スマホ", "携帯", "mobile", "phone"],
    capMax: 1200, note: "スマホ → 上限 1.2 s" },
];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hit = (text, word) => (/^[\x00-\x7f]+$/.test(word) ? new RegExp(`\\b${escapeRe(word)}`, "i").test(text) : text.includes(word));

/** The lexicon entries a request names, in lexicon order. */
export const readRequest = (request) => {
  const text = String(request ?? "");
  return LEXICON.filter((e) => e.words.some((w) => hit(text, w)));
};

// ── Seeded choice ──────────────────────────────────────────────────────────
/** mulberry32: a tiny deterministic RNG in [0, 1). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** A request's own seed, so the same words give the same three. */
const hashSeed = (text) => { let h = 2166136261; for (const ch of String(text)) h = Math.imul(h ^ ch.codePointAt(0), 16777619); return h >>> 0; };
const shuffle = (list, rand) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const clone = (o) => JSON.parse(JSON.stringify(o));
/** What motion.js resolveConfig() does: the site's defaults with `partial` over them, always v2. */
const resolve = (partial) => upgradeConfig(partial, DEFAULTS, INTERACTION_DEFAULTS);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const expand = (pool, available) => pool.flatMap((id) => (id.endsWith(".*") ? available.filter((a) => a.startsWith(id.slice(0, -1))) : [id]));
const within = (pool, available) => { const set = new Set(expand(pool, available)); return available.filter((id) => set.has(id)); };
const shortLabel = (kind, id) => String(findStyle(kind, id)?.label ?? id).split(" (")[0].replaceAll(" · ", " ");

// ── Generation ─────────────────────────────────────────────────────────────
/**
 * Three distinct candidate configs for a request.
 * `base` — the caller's current config (v1 or v2; motion.json when absent).
 * `presets` — { name: partial } looks to start from (PRESET_LOOKS by default).
 * `covers` / `reveals` — the allowed ids (the vocabulary the registry has).
 * `seed` — any integer; defaults to a hash of the request.
 * Returns [{ name, config, why }] — config is a full v2 config.
 */
export function suggest(request, { base, presets = PRESET_LOOKS, covers, reveals, seed } = {}) {
  const ask = String(request ?? "").trim().slice(0, MAX_REQUEST_CHARS);
  const rand = rng(Number.isFinite(seed) ? seed : hashSeed(ask));
  const baseCfg = resolve(base && typeof base === "object" ? base : null);
  const coverIds = covers ?? availableStyles("cover", COVER_VOCAB);
  const revealIds = reveals ?? availableStyles("reveal", REVEAL_VOCAB);
  const hits = readRequest(ask);

  // What the words ask for, folded together.
  const speed = hits.reduce((f, e) => f * (e.speed ?? 1), 1);
  const navSpeed = hits.reduce((f, e) => f * (e.navSpeed ?? 1), 1);
  const capF = hits.reduce((f, e) => f * (e.cap ?? 1), 1);
  const capMax = Math.min(...hits.map((e) => e.capMax ?? Infinity));
  const textMode = hits.find((e) => e.text)?.text;
  const outStyle = hits.find((e) => e.out)?.out;
  const sound = hits.some((e) => e.sound);
  // Cover pool: what every cover-naming word allows; if they disagree, any of them; if the registry has none of those, anything it has.
  const pool = (field, ids) => {
    const asks = hits.filter((e) => e[field]).map((e) => within(e[field], ids));
    if (!asks.length) return null;
    const all = asks.reduce((acc, a) => acc.filter((id) => a.includes(id)));
    return all.length ? all : [...new Set(asks.flat())];
  };
  let coverPool = pool("covers", coverIds);
  if (coverPool && !coverPool.length) coverPool = coverIds.filter((id) => id !== "none");
  if (!coverPool || !coverPool.length) coverPool = coverIds.length ? coverIds : ["none"];
  const revealPool = pool("reveals", revealIds);
  const named = [...new Set(hits.flatMap((e) => e.presets ?? []))].filter((n) => n in presets);

  // Where the three start: the named presets first, then the base, then other presets.
  const others = Object.keys(presets).filter((n) => !named.includes(n));
  const starts = [...shuffle(named, rand), null, ...shuffle(others, rand)];
  const coverOrder = shuffle(coverPool, rand);
  const revealOrder = revealPool?.length ? shuffle(revealPool, rand) : null;
  const mood = hits.length ? hits.slice(0, 2).map((e) => e.label).join(" + ") : "Pick";

  const out = [];
  const seen = new Set();
  for (const start of starts) {
    if (out.length === 3) break;
    const i = out.length;
    let c;
    if (start) {
      c = resolve(presets[start]);
      for (const k of ["global", "boot", "idle", "sound", "transition", "interactions"]) c[k] = clone(baseCfg[k]);
    } else c = clone(baseCfg);

    const g = c.global;
    g.speed = clamp(+(g.speed * speed).toFixed(3), 0.3, 4);
    g.navSpeed = clamp(+(g.navSpeed * navSpeed).toFixed(3), 0.25, 5);
    const cap = (v, dflt, hi) => clamp(Math.round(Math.min((v > 0 ? v : dflt) * capF, capMax)), 300, hi);
    g.capMs = cap(g.capMs, DEFAULTS.global.capMs, 10000);
    g.navCapMs = cap(g.navCapMs, DEFAULTS.global.navCapMs, 5000);
    if (textMode) {
      c.text.mode = textMode;
      for (const k of ["heading", "label", "body"]) if (c[k] && !c[k].follow) c[k].mode = textMode;
    }
    if (outStyle) c.out.style = outStyle;
    if (sound) c.sound.enabled = true;
    const cover = coverOrder[i % coverOrder.length];
    c.transition.cover = { style: cover, params: {} };
    if (revealOrder) c.transition.reveal = { style: revealOrder[i % revealOrder.length], params: {} };

    const look = start ?? "Current";
    const name = `${mood} · ${look}${cover !== "none" ? ` + ${shortLabel("cover", cover)}` : ""}`;
    const notes = hits.length ? hits.map((e) => e.note) : ["指定なし → 見た目だけ変える"];
    const why = [...notes, `幕は ${cover}`, `土台: ${start ?? "今の設定"}`].join("、");
    const config = resolve({ ...c, preset: name });
    const key = JSON.stringify({ ...config, preset: "" });
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, config, why });
  }
  return out;
}

// ── Jev sorts ──────────────────────────────────────────────────────────────
const matchOf = (answers) => {
  const a = answers?.matchesRequest ?? answers?.rules;
  return Number.isFinite(a?.noul) ? a.noul : null;
};

/**
 * suggest(), then Jev judges each candidate against the request and the three
 * are sorted by the "matchesRequest" answer (most likely true first). Without
 * the key, or when Jev fails, they come back unsorted with judged: false.
 */
export async function suggestAndSort(request, { env, fetchImpl, timeout, ...gen } = {}) {
  const ask = String(request ?? "").trim().slice(0, MAX_REQUEST_CHARS);
  const candidates = suggest(ask, gen);
  if (!jevConfigured(env ?? process.env)) return { request: ask, candidates, judged: false, error: "Jev is not configured" };
  try {
    const results = await Promise.all(candidates.map((c) => judgeMotion(c.config, { request: ask, env, fetchImpl, timeout })));
    const judged = candidates.map((c, i) => ({ ...c, readings: results[i].readings, match: matchOf(results[i].answers) }));
    judged.sort((a, b) => (b.match ?? -1) - (a.match ?? -1));
    return { request: ask, candidates: judged, judged: true, model: results[0]?.model };
  } catch (error) {
    const why = error.code === "jev-not-configured" ? "Jev is not configured"
      : error instanceof APIError ? `Jev refused (${error.status})`
      : error instanceof APIConnectionError ? "Jev unreachable" : "Jev unreachable";
    return { request: ask, candidates, judged: false, error: why };
  }
}

// ── HTTP ───────────────────────────────────────────────────────────────────
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
});

/**
 * POST { request?, config? } → { ok, request, candidates, judged, error? }.
 * Who may ask is decided before this (middleware + requireAdmin in the
 * route). Same body checks as handleJudgeMotion; a missing key is not an
 * error here — the three still come back, unsorted.
 */
export async function handleSuggest(request, { env, fetchImpl, timeout, seed } = {}) {
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return json({ ok: false, error: "unsupported-media-type", message: "Send application/json." }, 415);
  }
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ ok: false, error: "too-large", message: "The payload is too large." }, 413);
  let body;
  try { body = JSON.parse(text); } catch { return json({ ok: false, error: "bad-json", message: "The body is not valid JSON." }, 400); }
  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
  if (!isObj(body) || (body.config !== undefined && !isObj(body.config)) || (body.request !== undefined && typeof body.request !== "string")) {
    return json({ ok: false, error: "invalid", message: "Send { request?: <string>, config?: <motion config object> }." }, 422);
  }
  const ask = (body.request ?? "").trim().slice(0, MAX_REQUEST_CHARS);
  const result = await suggestAndSort(ask, { base: body.config, seed, env, fetchImpl, timeout });
  return json({ ok: true, ...result });
}
