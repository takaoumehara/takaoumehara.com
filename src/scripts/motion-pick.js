// The keep-or-toss picker of /lab/motion. Instead of the panel's sliders, the
// visitor watches one candidate loading and presses Keep or Toss; after eight
// rounds the kept ones form a shortlist to try, apply or copy.
//
//   mountPick(root, api) → { destroy() }
//   api.candidates(n) → [{ name, config }]   fresh random candidates (valid v2 configs)
//   api.play(config)                          plays it in the stage(s)
//   api.apply(config)                         makes it the tool's current selection
//   api.copy(text) → Promise                  clipboard
//
// The round logic and the storage (localStorage["tu-motion-kept"]) are pure,
// in motion-pick-core.mjs; this file is only the DOM around them.
import "../styles/motion-pick.css";
import { ROUNDS, readKept, writeKept, nextRound } from "./motion-pick-core.mjs";

export { readKept, writeKept, nextRound };

// <span class="t-en">…</span><span class="t-jp">…</span>, the site's bilingual pattern.
function bi(en, jp) {
  const f = document.createDocumentFragment();
  const a = document.createElement("span");
  a.className = "t-en";
  a.textContent = en;
  const b = document.createElement("span");
  b.className = "t-jp";
  b.textContent = jp;
  f.append(a, b);
  return f;
}

function el(tag, className, ...children) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.append(...children);
  return node;
}

function button(className, en, jp) {
  const b = el("button", "mp-btn " + className, bi(en, jp));
  b.type = "button";
  return b;
}

export function mountPick(root, api) {
  let state = { phase: "intro", round: 0, queue: [], kept: readKept() };
  if (state.kept.length) state.phase = "list";
  let applied = null;
  let alive = true;

  // ── the card ──────────────────────────────────────────────────────────────
  const label = el("p", "mp-label", bi("KEEP OR TOSS", "残すか 捨てるか"));

  const start = button("mp-start", "Start", "はじめる");
  const intro = el("div", "mp-intro",
    el("p", "mp-line", bi(
      "Watch one loading, press Keep or Toss. Eight rounds make a shortlist.",
      "読み込みを 1 つ見て、残すか捨てるかを押す。8 回で候補リストができる。")),
    start);

  const count = el("p", "mp-count");
  const name = el("p", "mp-name");
  const toss = button("mp-toss", "Toss", "捨てる");
  toss.setAttribute("aria-keyshortcuts", "J ArrowLeft");
  toss.append(el("kbd", "mp-key", "J"));
  const keep = button("mp-keep", "Keep", "残す");
  keep.setAttribute("aria-keyshortcuts", "K ArrowRight");
  keep.append(el("kbd", "mp-key", "K"));
  const replay = button("mp-small", "Replay", "もう一度再生");
  const finish = button("mp-small", "Finish early", "ここで終える");
  const round = el("div", "mp-round",
    count, name,
    el("div", "mp-choices", toss, keep),
    el("div", "mp-row", replay, finish));

  const empty = el("p", "mp-line mp-empty", bi("Nothing kept — another 8?", "残したものはありません。もう 8 回？"));
  const rows = el("ul", "mp-rows");
  const again = button("mp-small", "Another 8", "もう 8 回");
  const clear = button("mp-small", "Clear", "すべて消す");
  const list = el("div", "mp-list",
    el("p", "mp-sublabel", bi("SHORTLIST", "候補リスト")),
    empty, rows,
    el("div", "mp-row", again, clear));

  const status = el("p", "mp-status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const card = el("section", "mp", label, intro, round, list, status);
  card.setAttribute("aria-label", "Keep or toss");
  root.replaceChildren(card);

  const say = (en, jp) => { if (alive) status.replaceChildren(bi(en, jp)); };

  // ── drawing ───────────────────────────────────────────────────────────────
  function renderRows() {
    rows.replaceChildren();
    for (const item of state.kept) {
      const title = el("span", "mp-row-name", item.name);
      const tryIt = button("mp-small", "Try", "試す");
      const use = button("mp-small", "Use", "使う");
      const copy = button("mp-small", "Copy JSON", "JSON をコピー");
      const remove = el("button", "mp-btn mp-small mp-remove", "×");
      remove.type = "button";
      remove.setAttribute("aria-label", "Remove " + item.name);
      const li = el("li", "mp-item", title, el("span", "mp-item-actions", tryIt, use, copy, remove));
      if (applied === item.name) li.setAttribute("aria-current", "true");

      tryIt.addEventListener("click", () => api.play(item.config));
      use.addEventListener("click", () => {
        api.apply(structuredClone(item.config));
        applied = item.name;
        for (const other of rows.children) other.removeAttribute("aria-current");
        li.setAttribute("aria-current", "true");
        say("Applied — open Fine-tune to adjust", "適用しました — 細かい調整は Fine-tune で");
      });
      copy.addEventListener("click", () => {
        Promise.resolve()
          .then(() => api.copy(JSON.stringify(item.config, null, 2)))
          .then(() => say("Copied " + item.name + " as JSON", item.name + " を JSON でコピーしました"),
                () => say("Copy failed", "コピーできませんでした"));
      });
      remove.addEventListener("click", () => {
        state = { ...state, kept: state.kept.filter((k) => k.name !== item.name) };
        writeKept(state.kept);
        if (applied === item.name) applied = null;
        render(true);
        say("Removed " + item.name, item.name + " を外しました");
      });
      rows.append(li);
    }
  }

  // Shows the current phase. With `refocus`, focus lands on the phase's first
  // control when it was inside the picker (so the keyboard is never dropped
  // onto a control that just hid).
  function render(refocus) {
    const hadFocus = root.contains(document.activeElement);
    intro.hidden = state.phase !== "intro";
    round.hidden = state.phase !== "round";
    list.hidden = state.phase !== "list";
    if (state.phase === "round") {
      const total = Math.min(ROUNDS, state.queue.length);
      count.textContent = `${state.round + 1} / ${total}`;
      name.textContent = state.queue[state.round].name;
    }
    if (state.phase === "list") {
      renderRows();
      empty.hidden = state.kept.length > 0;
      rows.hidden = state.kept.length === 0;
      clear.hidden = state.kept.length === 0;
    }
    if (refocus && hadFocus) {
      const first = state.phase === "round" ? keep
        : state.phase === "list" ? (rows.querySelector("button") || again)
        : start;
      first.focus();
    }
  }

  const playCurrent = () => api.play(state.queue[state.round].config);

  // ── actions ───────────────────────────────────────────────────────────────
  function begin() {
    const fresh = api.candidates(ROUNDS);
    const queue = Array.isArray(fresh) ? fresh.filter((c) => c && c.config) : [];
    state = nextRound({ ...state, queue }, "start");
    render(true);
    if (state.phase === "round") {
      say(`Round 1 of ${Math.min(ROUNDS, queue.length)}`, `1 / ${Math.min(ROUNDS, queue.length)} 回目`);
      playCurrent();
    } else {
      say("No candidates to show", "候補がありません");
    }
  }

  function decide(verdict) {
    if (state.phase !== "round") return;
    const current = state.queue[state.round];
    const before = state.kept;
    state = nextRound(state, verdict);
    if (state.kept !== before) writeKept(state.kept);
    if (verdict === "keep") say("Kept " + current.name, current.name + " を残しました");
    else if (verdict === "toss") say("Tossed " + current.name, current.name + " を捨てました");
    if (state.phase === "list") {
      const n = state.kept.length;
      say(`Shortlist: ${n} kept`, `候補リスト: ${n} 件`);
    }
    render(true);
    if (state.phase === "round") playCurrent();
  }

  start.addEventListener("click", begin);
  again.addEventListener("click", begin);
  keep.addEventListener("click", () => decide("keep"));
  toss.addEventListener("click", () => decide("toss"));
  finish.addEventListener("click", () => decide("finish"));
  replay.addEventListener("click", () => { if (state.phase === "round") playCurrent(); });
  clear.addEventListener("click", () => {
    state = { ...state, kept: [] };
    applied = null;
    writeKept([]);
    render(true);
    say("Shortlist cleared", "候補リストを消しました");
  });

  // K / → keep, J / ← toss — only while a round is on screen, and only when
  // focus is in the picker or nowhere (body): never from a field elsewhere.
  function onKey(e) {
    if (state.phase !== "round" || e.defaultPrevented || e.repeat) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const active = document.activeElement;
    const free = !active || active === document.body || root.contains(active);
    if (!free) return;
    if (active && (active.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName))) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    let verdict = null;
    if (key === "k" || key === "ArrowRight") verdict = "keep";
    else if (key === "j" || key === "ArrowLeft") verdict = "toss";
    if (!verdict) return;
    e.preventDefault();
    decide(verdict);
  }
  document.addEventListener("keydown", onKey);

  render(false);

  return {
    destroy() {
      if (!alive) return;
      alive = false;
      document.removeEventListener("keydown", onKey);
      root.replaceChildren();
    },
  };
}
