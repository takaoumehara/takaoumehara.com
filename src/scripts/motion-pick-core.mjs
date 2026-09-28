// The pure half of the keep-or-toss picker (motion-pick.js): the round state
// machine and the shortlist's storage. No DOM, no globals at import, so Node
// tests it directly (tests/motion-pick.test.mjs).

export const ROUNDS = 8;
export const KEY = "tu-motion-kept";

// The shortlist lives in localStorage["tu-motion-kept"] as
// { v: 1, kept: [{ name, config, at }] }. A missing, unreadable or broken
// value reads as an empty list; bad rows are dropped one by one.
export function readKept(storage = globalThis.localStorage) {
  try {
    const raw = storage && storage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!data || data.v !== 1 || !Array.isArray(data.kept)) return [];
    const seen = new Set();
    const out = [];
    for (const row of data.kept) {
      if (!row || typeof row.name !== "string" || !row.name) continue;
      if (!row.config || typeof row.config !== "object" || Array.isArray(row.config)) continue;
      if (seen.has(row.name)) continue;
      seen.add(row.name);
      out.push({ name: row.name, config: row.config, at: Number.isFinite(row.at) ? row.at : 0 });
    }
    return out;
  } catch {
    return [];
  }
}

// Returns whether the write went through (private windows and full quotas throw).
export function writeKept(list, storage = globalThis.localStorage) {
  try {
    if (!storage) return false;
    storage.setItem(KEY, JSON.stringify({ v: 1, kept: list }));
    return true;
  } catch {
    return false;
  }
}

// state = { phase: "intro" | "round" | "list", round, queue, kept }
//   round: index into queue of the candidate on screen (phase "round")
//   queue: the candidates of this set of rounds, [{ name, config }]
//   kept:  the shortlist, [{ name, config, at }]
// verdict:
//   "start"  → round 0 of state.queue (the caller fills the queue first);
//              an empty queue goes straight to the list
//   "keep"   → the current candidate joins kept (once per name), next round
//   "toss"   → next round
//   "finish" → the list, now
// After the last round (ROUNDS, or fewer if the queue is short) the phase is
// "list". A verdict that does not apply to the phase returns the state as is.
export function nextRound(state, verdict, now = Date.now()) {
  const queue = Array.isArray(state.queue) ? state.queue : [];
  const kept = Array.isArray(state.kept) ? state.kept : [];
  const total = Math.min(ROUNDS, queue.length);

  if (verdict === "start") {
    if (!total) return { ...state, phase: "list", round: 0, queue, kept };
    return { ...state, phase: "round", round: 0, queue, kept };
  }
  if (state.phase !== "round") return state;
  if (verdict === "finish") return { ...state, phase: "list" };
  if (verdict !== "keep" && verdict !== "toss") return state;

  let nextKept = kept;
  const current = queue[state.round];
  if (verdict === "keep" && current && !kept.some((k) => k.name === current.name)) {
    nextKept = [...kept, { name: current.name, config: current.config, at: now }];
  }
  const round = state.round + 1;
  if (round >= total) return { ...state, phase: "list", round: total, kept: nextKept };
  return { ...state, round, kept: nextKept };
}
