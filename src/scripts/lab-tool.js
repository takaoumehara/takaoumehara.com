// /lab/motion — the Motion Lab as a tool (src/pages/lab/motion.astro).
//
// The page holds the controls; the stages are /lab/stage iframes
// (src/pages/lab/[page].astro) that play the real engine (motion.js). Every
// change becomes one resolved v2 config, set here with motion.setConfig and
// posted to each stage. The protocol (same origin only):
//   to a stage:   { type: "stage:config", config }   set it and replay the load
//                 { type: "stage:replay", kind }      "load" | "nav"
//                 { type: "stage:shot", dataUrl, title }
//                 { type: "stage:peek", title, description, image, site }
//   from a stage: { type: "stage:ready" }              then it gets the current state
//
// Phone check is on unless the visitor turned it off (localStorage
// "tu-lab-phone" = "0"). "Keep or toss" is src/scripts/motion-pick.js.

import * as motion from "./motion.js";
import { PRESETS } from "./motion-lab.js";
import { byKind } from "./styles/index.mjs";
import { mountPick } from "./motion-pick.js";

const PHONE_KEY = "tu-lab-phone";
const MAX_SHOT = 4 * 1024 * 1024;
const ORIGIN = location.origin;
const $ = (id) => document.getElementById(id);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
};
const still = motion.isStill();
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const short = (label) => String(label).replace(/\s*\(.*\)\s*$/, "");
const baseName = (n) => String(n || "Default").replace(/ \(edited\)$/, "");

const presetSel = $("lt-preset"), coverSel = $("lt-cover"), revealSel = $("lt-reveal");
const titleIn = $("lt-title"), statusEl = $("lt-status"), box = $("lt-frames");
const say = (msg) => { statusEl.textContent = msg; };

// ── The config: a preset with a cover and a reveal over it ──────────────────
for (const name of Object.keys(PRESETS)) presetSel.add(new Option(name, name));
for (const s of byKind("cover")) coverSel.add(new Option(s.label, s.id));
for (const s of byKind("reveal")) revealSel.add(new Option(s.label, s.id));
presetSel.value = "Default";
coverSel.value = "none";
revealSel.value = "box-first";

/** A partial config: the preset, its transition with this cover and reveal. */
function compose(name, cover, reveal) {
  const P = PRESETS[name] ?? {};
  const tr = P.transition ?? {};
  const own = (tr.cover?.style ?? "none") === cover && (tr.reveal?.style ?? "box-first") === reveal;
  return {
    ...P,
    preset: own ? name : `${name} (edited)`,
    transition: {
      ...tr,
      cover: { style: cover, params: tr.cover?.style === cover ? tr.cover.params ?? {} : {} },
      reveal: { style: reveal, params: tr.reveal?.style === reveal ? tr.reveal.params ?? {} : {} },
    },
  };
}
let current = motion.setConfig(compose(presetSel.value, coverSel.value, revealSel.value));

function keep(config, flag) {
  store.set(motion.LAB_KEY, JSON.stringify(config));
  if (flag) { try { sessionStorage.setItem(motion.LAB_FLAG, "1"); } catch (e) {} }
}
const setIf = (sel, v) => { if ([...sel.options].some((o) => o.value === v)) sel.value = v; };

// ── The stages ──────────────────────────────────────────────────────────────
const state = { stage: "site", shot: null, peek: null };
const frames = new Map(); // iframe → ready
let phone = store.get(PHONE_KEY) !== "0"; // on by default

const title = () => titleIn.value.trim() || "Your site";
function stageSrc(kind) {
  const q = new URLSearchParams({ stage: state.stage, bar: "0" });
  if (state.stage === "shot") q.set("title", title());
  if (kind === "phone") q.set("frame", "phone");
  return `/lab/stage?${q}`;
}
function send(f, msg) { if (frames.get(f)) f.contentWindow?.postMessage(msg, ORIGIN); }
const post = (msg) => frames.forEach((ready, f) => send(f, msg));
function sendState(f) {
  send(f, { type: "stage:config", config: current });
  if (state.stage === "shot" && state.shot) send(f, { type: "stage:shot", dataUrl: state.shot, title: title() });
  if (state.stage === "peek" && state.peek) send(f, { type: "stage:peek", ...state.peek });
}
function addFrame(kind) {
  const fig = document.createElement("figure");
  fig.className = `lt-frame lt-${kind}`;
  const f = document.createElement("iframe");
  f.title = kind === "phone" ? "Stage, phone frame 390 × 760" : "Stage, desktop frame";
  f.dataset.frame = kind;
  f.src = stageSrc(kind);
  const cap = document.createElement("figcaption");
  cap.className = "lt-label";
  cap.textContent = kind === "phone" ? "Phone · 390 × 760" : "Desktop";
  fig.append(f, cap);
  box.append(fig);
  frames.set(f, false);
}
function reloadFrames() {
  for (const f of frames.keys()) { frames.set(f, false); f.src = stageSrc(f.dataset.frame); }
}
window.addEventListener("message", (e) => {
  if (e.origin !== ORIGIN || e.data?.type !== "stage:ready") return;
  for (const f of frames.keys()) if (f.contentWindow === e.source) { frames.set(f, true); sendState(f); }
});
addFrame("desk");
if (phone) addFrame("phone");

function choose() {
  current = motion.setConfig(compose(presetSel.value, coverSel.value, revealSel.value));
  post({ type: "stage:config", config: current });
  say(`${current.preset}${still ? "" : " — playing"}`);
}
[presetSel, coverSel, revealSel].forEach((s) => s.addEventListener("change", choose));

function replay(kind) {
  if (still) { say("Reduced motion is on: nothing plays."); return; }
  post({ type: "stage:replay", kind });
}
$("lt-load").addEventListener("click", () => replay("load"));
$("lt-nav").addEventListener("click", () => replay("nav"));

// Phone check
const phoneIn = $("lt-phone");
phoneIn.checked = phone;
phoneIn.addEventListener("change", () => {
  phone = phoneIn.checked;
  store.set(PHONE_KEY, phone ? "1" : "0");
  const f = [...frames.keys()].find((x) => x.dataset.frame === "phone");
  if (phone && !f) addFrame("phone");
  if (!phone && f) { frames.delete(f); f.closest("figure").remove(); }
});

// The lab panel, if it is ever opened on this page: follow it.
window.addEventListener("mlab:config", (e) => {
  if (!e.detail || typeof e.detail !== "object") return;
  current = motion.setConfig(e.detail);
  post({ type: "stage:config", config: current });
});

if (still) $("lt-still").hidden = false;

// ── Stage: which page is on it ─────────────────────────────────────────────
const radios = [...document.querySelectorAll('input[name="lt-stage"]')];
function setStage(kind) {
  radios.forEach((r) => { r.checked = r.value === kind; });
  document.querySelectorAll(".lt-sub").forEach((el) => { el.hidden = el.dataset.for !== kind; });
  if (state.stage === kind) return;
  state.stage = kind;
  reloadFrames();
}
radios.forEach((r) => r.addEventListener("change", () => r.checked && setStage(r.value)));

function useShot(file) {
  if (!file) return;
  if (!/^image\//.test(file.type)) { say("That file is not an image."); return; }
  if (file.size > MAX_SHOT) { say(`That image is ${(file.size / 1048576).toFixed(1)} MB; the limit is 4 MB.`); return; }
  const reader = new FileReader();
  reader.onload = () => {
    state.shot = String(reader.result);
    if (state.stage !== "shot") setStage("shot"); // the stages ask for it when they are ready
    else post({ type: "stage:shot", dataUrl: state.shot, title: title() });
    say(`Screenshot on the stage: ${file.name || "pasted image"}.`);
  };
  reader.onerror = () => say("That image could not be read.");
  reader.readAsDataURL(file);
}
const fileIn = $("lt-file"), drop = $("lt-drop");
fileIn.addEventListener("change", () => { useShot(fileIn.files?.[0]); fileIn.value = ""; });
drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("is-over"); });
drop.addEventListener("dragleave", () => drop.classList.remove("is-over"));
drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("is-over"); useShot(e.dataTransfer?.files?.[0]); });
document.addEventListener("paste", (e) => {
  const file = [...(e.clipboardData?.files ?? [])].find((f) => /^image\//.test(f.type));
  if (file) { e.preventDefault(); useShot(file); }
});
let titleTimer = 0;
titleIn.addEventListener("input", () => {
  clearTimeout(titleTimer);
  titleTimer = setTimeout(() => { if (state.stage === "shot" && state.shot) post({ type: "stage:shot", dataUrl: state.shot, title: title() }); }, 400);
});

$("lt-peek").addEventListener("submit", async (e) => {
  e.preventDefault();
  const url = $("lt-url").value.trim();
  if (!url) return;
  say("Reading the page…");
  try {
    const res = await fetch(`/api/lab/peek?url=${encodeURIComponent(url)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { say(data.message || `The page could not be read (${res.status}).`); return; }
    state.peek = { title: data.title ?? null, description: data.description ?? null, image: data.image ?? null, site: data.site ?? null };
    if (state.stage !== "peek") setStage("peek");
    else post({ type: "stage:peek", ...state.peek });
    say(`On the stage: ${state.peek.title || state.peek.site}.`);
  } catch (err) {
    say("The page could not be read (offline?).");
  }
});

// ── Take it home ───────────────────────────────────────────────────────────
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;left:-9999px;top:0";
  document.body.append(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (e) {}
  ta.remove();
  return ok;
}
$("lt-copy").addEventListener("click", async () => {
  const ok = await copy(JSON.stringify(motion.getConfig(), null, 2));
  say(ok ? `Copied “${current.preset}” as JSON (v2).` : "Copy failed: your browser blocked the clipboard.");
});
// The full panel opens with what is chosen here.
$("lt-fine").addEventListener("click", () => keep(current, false));

// ── Keep or toss ───────────────────────────────────────────────────────────
const api = {
  /** n candidates: a random preset with a random cover, and 30% of the time a random reveal other than box-first. */
  candidates(n = 3) {
    const count = Math.max(1, Math.min(12, Number(n) || 3));
    const names = Object.keys(PRESETS), covers = byKind("cover"), reveals = byKind("reveal").filter((s) => s.id !== "box-first");
    const out = [], seen = new Set();
    for (let i = 0; out.length < count && i < count * 20; i++) {
      const p = pick(names), c = pick(covers), r = reveals.length && Math.random() < 0.3 ? pick(reveals) : null;
      const key = `${p}|${c.id}|${r?.id ?? ""}`;
      if (seen.has(key) && i < count * 10) continue;
      seen.add(key);
      const name = `${p}${c.id !== "none" ? ` + ${short(c.label)}` : ""}${r ? ` · ${short(r.label)}` : ""}`;
      out.push({ name, config: motion.resolveConfig(compose(p, c.id, r?.id ?? "box-first")) });
    }
    return out;
  },
  play(config) {
    post({ type: "stage:config", config: motion.resolveConfig(config) });
  },
  apply(config) {
    current = motion.setConfig(config);
    if (baseName(current.preset) in PRESETS) presetSel.value = baseName(current.preset);
    setIf(coverSel, current.transition?.cover?.style);
    setIf(revealSel, current.transition?.reveal?.style);
    keep(current, true);
    post({ type: "stage:config", config: current });
    say(`Kept “${current.preset}”. The full panel (/?lab=1) opens with it.`);
  },
  copy,
};
mountPick($("lab-pick"), api);
