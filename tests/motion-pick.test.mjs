// The keep-or-toss picker of /lab/motion (src/scripts/motion-pick.js): the
// round state machine and the shortlist storage are pure
// (src/scripts/motion-pick-core.mjs) and tested here; the DOM file and its CSS
// are checked as text (Node cannot import the CSS the module pulls in).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ROUNDS, KEY, readKept, writeKept, nextRound } from "../src/scripts/motion-pick-core.mjs";

const SRC = readFileSync(new URL("../src/scripts/motion-pick.js", import.meta.url), "utf8");
const CSS = readFileSync(new URL("../src/styles/motion-pick.css", import.meta.url), "utf8");

const cand = (i) => ({ name: `c${i}`, config: { version: 2, i } });
const queueOf = (n) => Array.from({ length: n }, (_, i) => cand(i + 1));
const fresh = (queue = queueOf(8), kept = []) => nextRound({ phase: "intro", round: 0, queue, kept }, "start");

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
  };
}

test("start opens round 1 of 8", () => {
  const s = fresh();
  assert.equal(ROUNDS, 8);
  assert.equal(s.phase, "round");
  assert.equal(s.round, 0);
  assert.deepEqual(s.kept, []);
});

test("eight verdicts walk the eight rounds and end on the list", () => {
  let s = fresh();
  const verdicts = ["keep", "toss", "keep", "toss", "toss", "keep", "toss", "keep"];
  verdicts.forEach((v, i) => {
    assert.equal(s.phase, "round", `round ${i + 1} is on screen`);
    assert.equal(s.round, i);
    s = nextRound(s, v, 1000 + i);
  });
  assert.equal(s.phase, "list");
  assert.deepEqual(s.kept.map((k) => k.name), ["c1", "c3", "c6", "c8"]);
  assert.deepEqual(s.kept[0], { name: "c1", config: { version: 2, i: 1 }, at: 1000 });
  assert.equal(nextRound(s, "keep"), s, "a verdict after the list changes nothing");
});

test("toss never keeps", () => {
  let s = fresh();
  for (let i = 0; i < 8; i++) s = nextRound(s, "toss");
  assert.equal(s.phase, "list");
  assert.deepEqual(s.kept, []);
});

test("finish early goes to the list with what was kept so far", () => {
  let s = fresh();
  s = nextRound(s, "keep");
  s = nextRound(s, "toss");
  s = nextRound(s, "finish");
  assert.equal(s.phase, "list");
  assert.deepEqual(s.kept.map((k) => k.name), ["c1"]);
  assert.equal(nextRound({ phase: "intro", round: 0, queue: [], kept: [] }, "finish").phase, "intro");
});

test("keep dedupes by name, across sets of rounds too", () => {
  const dup = [{ name: "same", config: { a: 1 } }, { name: "same", config: { a: 2 } }, cand(3)];
  let s = fresh(dup);
  s = nextRound(s, "keep");
  s = nextRound(s, "keep");
  s = nextRound(s, "keep");
  assert.deepEqual(s.kept.map((k) => k.name), ["same", "c3"]);
  assert.deepEqual(s.kept[0].config, { a: 1 }, "the first keep stays");
  // Another 8 starting from the same shortlist
  s = nextRound({ ...s, queue: queueOf(8) }, "start");
  assert.equal(s.phase, "round");
  s = nextRound(s, "keep"); // c1 is new
  s = nextRound(s, "keep"); // c2 is new
  s = nextRound(s, "keep"); // c3 again
  assert.deepEqual(s.kept.map((k) => k.name), ["same", "c3", "c1", "c2"]);
});

test("a short queue ends early; an empty queue goes straight to the list", () => {
  let s = fresh(queueOf(3));
  s = nextRound(s, "toss");
  s = nextRound(s, "toss");
  assert.equal(s.phase, "round");
  s = nextRound(s, "keep");
  assert.equal(s.phase, "list");
  assert.equal(fresh([]).phase, "list");
  let long = fresh(queueOf(12));
  for (let i = 0; i < 8; i++) long = nextRound(long, "toss");
  assert.equal(long.phase, "list", "never more than 8 rounds");
});

test("readKept round-trips writeKept and ignores garbage", () => {
  const store = fakeStorage();
  const list = [{ name: "a", config: { x: 1 }, at: 5 }];
  assert.equal(writeKept(list, store), true);
  assert.deepEqual(JSON.parse(store.data[KEY]), { v: 1, kept: list });
  assert.deepEqual(readKept(store), list);

  assert.equal(KEY, "tu-motion-kept");
  for (const bad of ["{", "null", "42", '"x"', "[]", '{"v":2,"kept":[]}', '{"v":1,"kept":{}}', '{"v":1}']) {
    assert.deepEqual(readKept(fakeStorage({ [KEY]: bad })), [], bad);
  }
  const mixed = JSON.stringify({ v: 1, kept: [null, 3, { name: "" , config: {} }, { name: "n", config: [] },
    { name: "ok", config: { y: 2 }, at: 9 }, { name: "ok", config: { y: 3 }, at: 10 }, { name: "noat", config: {} }] });
  assert.deepEqual(readKept(fakeStorage({ [KEY]: mixed })), [
    { name: "ok", config: { y: 2 }, at: 9 },
    { name: "noat", config: {}, at: 0 },
  ]);
  assert.deepEqual(readKept(fakeStorage()), []);
  assert.deepEqual(readKept(undefined), [], "no storage at all");
  const throwing = { getItem() { throw new Error("denied"); }, setItem() { throw new Error("quota"); } };
  assert.deepEqual(readKept(throwing), []);
  assert.equal(writeKept(list, throwing), false);
});

test("motion-pick.js: the api, the keys, the live status, the bilingual spans", () => {
  assert.match(SRC, /export function mountPick\(root, api\)/);
  assert.match(SRC, /export \{ readKept, writeKept, nextRound \}/);
  assert.match(SRC, /destroy\(\)/);
  assert.match(SRC, /KEEP OR TOSS/);
  assert.match(SRC, /import "\.\.\/styles\/motion-pick\.css"/);
  for (const k of ['"k"', '"j"', '"ArrowRight"', '"ArrowLeft"']) assert.ok(SRC.includes(k), k);
  assert.match(SRC, /"aria-live", "polite"/);
  assert.match(SRC, /"t-en"/);
  assert.match(SRC, /"t-jp"/);
  assert.match(SRC, /root\.contains\(active\)/, "keys only from inside the picker or body");
  assert.match(SRC, /INPUT\|TEXTAREA\|SELECT/, "never from a field");
  assert.match(SRC, /removeEventListener\("keydown"/, "destroy drops the key listener");
  for (const call of ["api.candidates(", "api.play(", "api.apply(", "api.copy("]) assert.ok(SRC.includes(call), call);
  // Top-level statements (unindented lines) never reach for the DOM or storage:
  // they run at import, in Node too.
  const topLevel = SRC.split("\n").filter((l) => /^\S/.test(l) && !l.startsWith("//"));
  assert.ok(topLevel.every((l) => !/\b(document|localStorage|window)\b/.test(l)), "no DOM or storage at import");
});

test("motion-pick.css: quiet tokens, 44px targets, no hex, no shadow", () => {
  assert.ok(/min-height:\s*44px/.test(CSS) || /--tap/.test(CSS), "44px tap target");
  assert.ok(CSS.includes("var(--pr-card)"));
  assert.ok(CSS.includes("var(--pr-blue)"));
  assert.doesNotMatch(CSS, /#[0-9a-f]{3,8}\b/i, "colours come from tokens only");
  assert.doesNotMatch(CSS, /box-shadow/);
  assert.doesNotMatch(CSS, /font-weight:\s*(?!400)\d+/, "weight 400 only");
});
