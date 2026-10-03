// Jev (TypeSafe AI's System One model) as the Motion Lab's judge. Server only:
// the key is TYPESAFE_API_KEY, read at request time (Vercel project settings,
// the cloud environment, or .env locally — never bundled, never in the page).
//
// Jev does not write text. It takes a state (here: a motion config and, when
// given, the sentence the config was asked to deliver) and named questions of
// three kinds — noul (a yes/no probability), choice (one label with
// probabilities), score (an ordered rubric) — and answers each with a
// confidence. So it is used for the judgement calls a person would otherwise
// make by eye: how a loading feels, how long it seems to take, whether it
// matches what was asked. Rules that a line of code can check (reduced motion
// honoured, caps present) stay code; see docs/jev.md.
//
// Plain functions, no Astro: tests/jev.test.mjs runs them with a stubbed
// fetch, and src/pages/api/admin/jev/motion.ts wraps handleJudgeMotion.
import { TypeSafeClient, APIError, APIConnectionError, choice, noul, score } from "@typesafe-ai/sdk";

export const ENV_KEY = "TYPESAFE_API_KEY";
export const MAX_BODY = 64 * 1024;
export const MAX_REQUEST_CHARS = 600;

/** True when the key is set (empty or whitespace does not count, as in the SDK). */
export const jevConfigured = (env = process.env) => Boolean(env[ENV_KEY]?.trim());

/** What the fields Jev is asked about mean — the config alone is only numbers. */
export const MOTION_GLOSSARY = {
  "global.speed": "Multiplier on every duration; 1 is real time, 2 is twice as fast.",
  "global.capMs": "Hard cap in ms on the first load's animation; everything finishes by then.",
  "global.navSpeed": "Speed multiplier used on navigations between pages (not the first load).",
  "global.navCapMs": "Hard cap in ms on a navigation's animation.",
  "global.respectReducedMotion": "When true, a visitor with reduced motion sees the content at once, nothing animates.",
  "rail": "The left sidebar (the site's list of work).",
  "pane": "The right column (the page's content).",
  "*.outline.style": "How each box is drawn before it fills: trace (a line draws the border), sides, viewfinder (corner brackets), corners, midpoints, march (dashes), none.",
  "*.outline.drawMs": "How long the outline takes to draw, in ms.",
  "*.fill.style": "How each box's content appears: fade, wipe-*, iris, pixel-step, scan, mask-reveal, skeleton (grey pulse placeholders), lens (blur), none.",
  "*.fill.durationMs": "How long the fill takes, in ms.",
  "*.spreadMs": "The window in ms over which the boxes start, in the chosen order.",
  "*.randomDelayMs": "Extra random delay range in ms added per box.",
  "out.style": "How the old page leaves on navigation: collapse, fade, ...",
  "text.mode": "How text appears: scramble (random glyphs resolve into the words), typewriter, scramble-typewriter, fade, none.",
  "text.glyphs": "Which random glyphs the scramble uses: auto, blocks (█▓▒░), katakana, ...",
  "text.holdMs": "How long the scrambled glyphs hold before resolving, in ms.",
  "text.cps": "Typing speed in characters per second.",
  "text.cursor": "Whether a typing cursor is shown.",
  "media.mode": "How images appear: pop, fade, wipe, pixelate (blocky then sharp), ...",
  "media.label.mode": "Whether a LOADING label is shown over images: off, slow (only when they are slow), always.",
};

/** The site's motion rules Jev is asked to keep in mind; the checkable ones are also checked in code. */
export const MOTION_RULES = [
  "Only transform, opacity and clip-path animate; blur (the 'lens' fill) is for the Lab, not the live site.",
  "With reduced motion nothing animates; the content appears at once.",
  "Every loading has a cap; a visitor can always read within a few seconds.",
  "The loading is a way in, not a show: it should not delay reading the page more than it rewards.",
];

/** The first-load wait rubric, index = score. */
export const WAIT_LEVELS = [
  "Instant: the page is readable within about 400 ms.",
  "Brief: settles within about 1.2 s; a visitor barely notices a loading.",
  "Noticeable: about 1.2–2.5 s; the loading is clearly a moment of its own.",
  "Long: over about 2.5 s before the page is readable.",
];

/** The questions. `request` adds one more: does the config deliver what was asked? */
export function motionQuestions({ request } = {}) {
  const q = {
    feel: choice("Judging the config against the glossary, how would a first-time visitor experience this loading?", {
      quiet: "Calm and understated: little movement, short durations, plain fills, no scramble or labels.",
      lively: "Clearly animated but composed: some movement or text effects, everything settles quickly.",
      loud: "Attention-seeking: many effects at once, long durations, scrambled text, labels, big movement.",
    }),
    wait: score("How long does the FIRST load feel like it takes before the page is readable? Consider speed, capMs, the outline and fill durations, spreadMs, random delays, text holdMs and cps.", WAIT_LEVELS),
    readable: noul("Can a visitor start reading the main text within about one second of the first load?", {
      true: "Text resolves or appears within about a second even if boxes and images are still animating.",
      false: "Text is held, scrambled or typed for longer than about a second before it can be read.",
    }),
    rules: noul("Does this config stay within the site's motion rules as listed in state.rules?", {
      true: "Reduced motion is respected, caps are present and sane, no blur fill on the live site.",
      false: "A rule is broken or the loading is likely to delay reading well beyond what it rewards.",
    }),
  };
  if (request) {
    q.matchesRequest = noul("Does the config deliver what state.request asks for?", {
      true: "The feel, timing and effects are what the request describes.",
      false: "The config contradicts or misses the request's main ask.",
    });
  }
  return q;
}

/** The state Jev judges: the config, the glossary, the rules, and the request when given. */
export function motionState(config, { request } = {}) {
  const state = { config, glossary: MOTION_GLOSSARY, rules: MOTION_RULES };
  if (request) state.request = request;
  return state;
}

/** One line per answer, for the Lab's status row and the docs. */
export function readAnswers(answers) {
  const pct = (p) => `${Math.round(p * 100)}%`;
  const out = [];
  if (answers.feel) out.push(`feel: ${answers.feel.choice} (${pct(answers.feel.confidence)})`);
  if (Number.isFinite(answers.wait?.score)) {
    const level = Math.min(WAIT_LEVELS.length - 1, Math.max(0, Math.round(answers.wait.score)));
    out.push(`wait: ${WAIT_LEVELS[level].split(":")[0].toLowerCase()} (${answers.wait.score.toFixed(1)}/${WAIT_LEVELS.length - 1})`);
  }
  if (answers.readable) out.push(`readable in 1 s: ${pct(answers.readable.noul)}`);
  if (answers.rules) out.push(`within the rules: ${pct(answers.rules.noul)}`);
  if (answers.matchesRequest) out.push(`matches the request: ${pct(answers.matchesRequest.noul)}`);
  return out;
}

/**
 * Retries, kept short on purpose: the route runs inside a Vercel function
 * (10 s by default), and a 429 means the account is being throttled — trying
 * again spends more, so it is left out of the retried statuses.
 */
export const RETRY = { maxRetries: 1, httpStatuses: new Set([408, 500, 502, 503, 504]) };
export const TIMEOUT_MS = 6_000;

/** A client bound to the environment's key. Throws a 503-shaped error when there is none. */
export function jevClient({ env = process.env, fetchImpl = globalThis.fetch, timeout = TIMEOUT_MS } = {}) {
  if (!jevConfigured(env)) {
    const error = new Error(`Jev is not configured: set ${ENV_KEY} (TypeSafe console → API keys) in the Vercel project, the cloud environment, or .env. / ${ENV_KEY} が未設定です。Vercel のプロジェクト設定・クラウド環境・.env のいずれかに入れてください。`);
    error.status = 503;
    error.code = "jev-not-configured";
    throw error;
  }
  return new TypeSafeClient({ apiKey: env[ENV_KEY].trim(), fetch: fetchImpl, timeout, retry: RETRY, logLevel: "off" });
}

/**
 * Judge a motion config. Returns { model, answers, readings, usage, requestId }.
 * `request` is the sentence the config was asked to deliver (optional).
 */
export async function judgeMotion(config, { request, env, fetchImpl, timeout } = {}) {
  const client = jevClient({ env, fetchImpl, timeout });
  const ask = request?.trim() ? request.trim().slice(0, MAX_REQUEST_CHARS) : undefined;
  const { data, requestId } = await client
    .systemOne({ state: motionState(config, { request: ask }), questions: motionQuestions({ request: ask }) })
    .withResponse();
  return { model: data.model, answers: data.answers, readings: readAnswers(data.answers), usage: data.usage, requestId };
}

// ── HTTP ────────────────────────────────────────────────────────────────────
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
});

/**
 * POST { config, request? } → the judgement. Who may ask is decided before
 * this (src/middleware.ts + requireAdmin in the route); this only validates
 * the body and talks to Jev. Fails closed and says why: 503 without a key,
 * 502 when Jev refuses or cannot be reached, never a fake answer.
 */
export async function handleJudgeMotion(request, { env, fetchImpl, timeout } = {}) {
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return json({ ok: false, error: "unsupported-media-type", message: "Send application/json." }, 415);
  }
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ ok: false, error: "too-large", message: "The payload is too large." }, 413);
  let body;
  try { body = JSON.parse(text); } catch { return json({ ok: false, error: "bad-json", message: "The body is not valid JSON." }, 400); }
  const config = body?.config;
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return json({ ok: false, error: "invalid", message: "Send { config: <motion config object>, request?: <string> }." }, 422);
  }
  const ask = typeof body.request === "string" ? body.request : undefined;
  try {
    const result = await judgeMotion(config, { request: ask, env, fetchImpl, timeout });
    return json({ ok: true, ...result });
  } catch (error) {
    if (error.code === "jev-not-configured") return json({ ok: false, error: error.code, message: error.message, missing: [ENV_KEY] }, 503);
    if (error instanceof APIError) return json({ ok: false, error: "jev-refused", message: `Jev answered ${error.status}: ${error.message}`, status: error.status, requestId: error.requestId }, 502);
    if (error instanceof APIConnectionError) return json({ ok: false, error: "jev-unreachable", message: `Jev could not be reached: ${error.message}` }, 502);
    return json({ ok: false, error: "jev-failed", message: error.message }, 500);
  }
}
