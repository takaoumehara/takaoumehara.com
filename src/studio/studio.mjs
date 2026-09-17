// The Studio: paste a posting, see the lens the engine would draft, adjust
// what a person may adjust (framing, level down, words on the page), publish.
//
// Everything up to "Publish" runs here in the browser on the same modules the
// build uses: src/analyze (the engine) and src/validate.mjs (the guards). The
// preview is rendered server-side by /lens/preview — the same components the
// built pages use — so the Studio never carries its own copy of the renderer.
// Publishing posts the lens to /api/publish, which re-validates and commits
// it under the owner's GitHub identity.
import { analyzeJob, guessCompany, slugify, phraseRegex } from "../analyze/jd.mjs";
import { scoreEvidence, selectProof, requirementCheck } from "../analyze/match.mjs";
import { draftLens } from "../analyze/draft.mjs";
import { renderReport } from "../analyze/report.mjs";
import { validateLens, evidenceCorpus, fitCeiling, FIT_LEVELS } from "../validate.mjs";
import { hydrateLibrary } from "../lib/library.mjs";
import sample from "../pitches/samples/stripe-senior-product-designer.txt?raw";

const $ = (id) => document.getElementById(id);
const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else if (v != null && v !== false) node.setAttribute(k, v === true ? "" : v);
  }
  for (const c of [].concat(children)) if (c != null) node.append(c);
  return node;
};
const clone = (v) => JSON.parse(JSON.stringify(v));
const today = () => new Date().toISOString().slice(0, 10);

const state = { lib: null, lexicon: null, user: null, api: true, analysis: null, scored: null, picks: null, requirements: null, base: null, lens: null, source: "", edits: null };

// ── Boot ────────────────────────────────────────────────────────────────────
async function boot() {
  const libJson = await fetch("/assets/studio/library.json").then((r) => r.json());
  state.lib = hydrateLibrary(libJson);
  state.lexicon = libJson.lexicon;
  await checkAuth();
  $("status").textContent = `${state.lib.evidence.size} records loaded.`;
}

async function checkAuth() {
  const auth = $("auth");
  try {
    const r = await fetch("/api/auth/me", { cache: "no-store" });
    if (r.status === 404) throw new Error("no api");
    if (r.ok) {
      state.user = await r.json();
      auth.replaceChildren(el("span", { text: `Signed in as ${state.user.login}` }), el("a", { class: "st-btn st-btn--ghost", href: "/api/auth/logout", text: "Sign out" }));
    } else {
      state.user = null;
      auth.replaceChildren(el("a", { class: "st-btn", href: "/api/auth/login", text: "Sign in with GitHub" }));
    }
  } catch {
    state.api = false;
    state.user = null;
    auth.replaceChildren(el("span", { class: "st-muted", text: "No API here (local preview) — download the JSON to publish." }));
  }
  updatePublish();
}

// ── Intake ──────────────────────────────────────────────────────────────────
$("sample").addEventListener("click", () => {
  $("jd").value = sample;
  $("company").value = "Stripe";
  $("url").value = "";
  $("status").textContent = "Sample loaded (an illustrative posting, not a real listing).";
});

$("fetch").addEventListener("click", async () => {
  const url = $("url").value.trim();
  if (!url) return;
  $("fetch-hint").textContent = "Fetching…";
  try {
    const r = await fetch(`/api/fetch-jd?url=${encodeURIComponent(url)}`, { cache: "no-store" });
    const data = await r.json().catch(() => ({}));
    if (r.ok) {
      $("jd").value = data.text;
      if (data.company && !$("company").value) $("company").value = data.company;
      if (data.title && !$("role").value) $("role").value = data.title;
      $("fetch-hint").textContent = `Read ${data.via === "json-ld" ? "the structured posting" : "the page"} from ${data.hostname ?? url}.`;
    } else if (r.status === 401) {
      $("fetch-hint").textContent = "Sign in to fetch by URL — or open the posting, copy the text, and paste it below.";
    } else {
      $("fetch-hint").textContent = `${data.error ?? "Could not read that page."} Paste the text below instead.`;
      if (data.partial) $("jd").value = data.partial;
    }
  } catch {
    $("fetch-hint").textContent = "No API here. Open the posting, copy the text, and paste it below.";
  }
  if (!$("company").value) $("company").value = guessCompany(url) ?? "";
});

$("company").addEventListener("input", () => { if (!$("slug").dataset.touched) $("slug").value = slugify($("company").value); });
$("slug").addEventListener("input", () => { $("slug").dataset.touched = "1"; });

$("intake").addEventListener("submit", (event) => {
  event.preventDefault();
  try { analyze(); } catch (error) { $("status").textContent = error.message; console.error(error); }
});

function analyze() {
  const text = $("jd").value.trim();
  if (!text) { $("status").textContent = "Paste the posting first."; return; }
  const url = $("url").value.trim();
  const company = $("company").value.trim() || guessCompany(url) || "";
  if (!company) { $("status").textContent = "Which company? Fill in the name."; $("company").focus(); return; }
  const slug = slugify($("slug").value.trim() || company);
  const { lib, lexicon } = state;
  const analysis = analyzeJob(text, { lexicon, capabilities: lib.capabilities.capabilities, title: $("role").value.trim() || undefined, company });
  if (!Object.keys(analysis.capabilityWeights).length) { $("status").textContent = "That text names nothing the lexicon knows. Is it a job description?"; return; }
  const scored = scoreEvidence(analysis, lib);
  const picks = selectProof(scored, analysis);
  const requirements = requirementCheck(analysis, lib, { phraseRegex, evidenceCorpus });
  const source = url || "pasted text";
  const base = draftLens({ company, slug, analysis, picks, lib, lexicon, source, scored, requirements, seenAt: today() });
  Object.assign(state, { analysis, scored, picks, requirements, base, source, company, slug });
  state.edits = { hidden: new Set(), angles: {}, ledger: {}, copy: {} };
  state.lens = clone(base);
  renderControls();
  refresh();
  $("result").hidden = false;
  $("status").textContent = `${picks.length} pieces of proof, ${base.fit?.rows?.length ?? 0} ledger rows.`;
}

// ── Controls ────────────────────────────────────────────────────────────────
const label = (id) => { const c = state.lib.capabilities.capabilities.find((x) => x.id === id); return typeof c?.label === "string" ? c.label : c?.label?.en ?? id; };
const name = (id) => { const it = state.lib.evidence.get(id); return it ? (it.shortTitle ?? it.title) : id; };

function renderControls() {
  const { analysis, picks, base, lib } = state;
  $("summary").innerHTML = `<b>${esc(analysis.title)}</b> · ${esc(analysis.seniority.label.en)} · ${analysis.words} words<br>Themes: ${analysis.themes.filter((t) => !t.quiet).slice(0, 3).map((t) => esc(t.label.en)).join(" · ")}<br>Top asks: ${Object.entries(analysis.capabilityWeights).slice(0, 6).map(([id, w]) => `${esc(label(id))} ${Math.round(w * 100)}%`).join(", ")}`;

  // Proof cards
  const proof = $("proof");
  proof.replaceChildren();
  $("proof-count").textContent = `${picks.length}`;
  for (const ref of base.sections.find((s) => s.type === "proof").items) {
    const item = lib.evidence.get(ref.id);
    const pick = picks.find((p) => p.item.slug === ref.id);
    const angleSelect = el("select", { onchange: (e) => { state.edits.angles[ref.id] = e.target.value; refresh(); } },
      [el("option", { value: "", text: "card line (default)" }), ...Object.keys(item.angles ?? {}).map((a) => el("option", { value: a, text: `angle: ${a}`, selected: ref.angle === a }))]);
    const hide = el("input", { type: "checkbox", checked: true, onchange: (e) => { if (e.target.checked) state.edits.hidden.delete(ref.id); else state.edits.hidden.add(ref.id); li.classList.toggle("is-off", !e.target.checked); refresh(); } });
    const li = el("li", { class: "st-item" }, [
      el("div", { class: "st-item-head" }, [el("b", { text: item.shortTitle ?? item.title }), el("span", { class: `st-tag is-${pick?.match ?? "transferable"}`, text: pick?.match === "direct" ? "Direct evidence" : "Transferable" })]),
      el("p", { class: "st-hint", text: `${pick?.matched.slice(0, 3).map((m) => `${label(m.id)} (${m.strength})`).join(" · ") ?? ""}` }),
      el("div", { class: "st-mini" }, [el("label", {}, ["Framing", angleSelect]), el("label", {}, ["On the page", el("div", {}, [hide, " show this card"])])]),
    ]);
    proof.append(li);
  }

  // Ledger
  const ledger = $("ledger");
  ledger.replaceChildren();
  (base.fit?.rows ?? []).forEach((row, index) => {
    const first = row.evidence[0];
    const item = first ? lib.evidence.get(first.id) : null;
    const ceiling = fitCeiling(row, lib);
    const levels = Object.keys(FIT_LEVELS).filter((l) => FIT_LEVELS[l] <= FIT_LEVELS[ceiling]);
    const levelSelect = el("select", { onchange: (e) => { edit(index).level = e.target.value; refresh(); } }, levels.map((l) => el("option", { value: l, text: `${l} (${FIT_LEVELS[l]})`, selected: l === row.level })));
    const lineSelect = item ? el("select", { onchange: (e) => { edit(index).line = e.target.value; refresh(); } },
      [el("option", { value: "", text: "(no specific line)" }), ...item.contribution.mine.map((l) => el("option", { value: l, text: l.length > 90 ? `${l.slice(0, 90)}…` : l, selected: l === first.line }))]) : el("span", { class: "st-muted", text: "nothing on record" });
    const noteEn = el("input", { type: "text", placeholder: "note (EN, optional)", oninput: (e) => { edit(index).noteEn = e.target.value; refresh(); } });
    const noteJp = el("input", { type: "text", placeholder: "注記（日本語、任意）", oninput: (e) => { edit(index).noteJp = e.target.value; refresh(); } });
    ledger.append(el("li", { class: "st-item" }, [
      el("p", { class: "st-ask", text: row.ask }),
      el("div", { class: "st-mini" }, [el("label", {}, [`Level (record allows up to ${ceiling})`, levelSelect]), el("label", {}, [`What I did · ${item ? name(first.id) : "—"}`, lineSelect])]),
      el("div", { class: "st-mini" }, [noteEn, noteJp]),
    ]));
  });

  // Copy
  const copy = $("copy");
  copy.replaceChildren();
  const fields = [
    ["hero.eyebrow", "Eyebrow"], ["hero.title", "Headline"], ["hero.body", "Body"], ["hero.note", "Note"],
    ["proofLede", "Proof lede"], ["cta.title", "Closing line"], ["cta.body", "Closing body"],
  ];
  const wrap = el("div", { class: "st-copy" });
  for (const [path, title] of fields) {
    const value = getCopy(base, path) ?? { en: "", jp: "" };
    const en = el("textarea", { oninput: (e) => { (state.edits.copy[path] ??= {}).en = e.target.value; refresh(); } }); en.value = value.en ?? "";
    const jp = el("textarea", { oninput: (e) => { (state.edits.copy[path] ??= {}).jp = e.target.value; refresh(); } }); jp.value = value.jp ?? "";
    wrap.append(el("label", {}, [`${title} · EN`, en]), el("label", {}, [`${title} · JP`, jp]));
  }
  copy.append(wrap);
}

const edit = (index) => (state.edits.ledger[index] ??= {});
function getCopy(lens, path) {
  if (path === "proofLede") return lens.sections.find((s) => s.type === "proof")?.lede;
  return path.split(".").reduce((o, k) => o?.[k], lens);
}
function setCopy(lens, path, value) {
  if (path === "proofLede") { lens.sections.find((s) => s.type === "proof").lede = value; return; }
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((o, k) => (o[k] ??= {}), lens);
  target[last] = value;
}

/** The lens as edited: the draft, with the person's changes applied on top. */
function rebuild() {
  const { base, edits, lib } = state;
  const lens = clone(base);
  const proof = lens.sections.find((s) => s.type === "proof");
  proof.items = proof.items.filter((ref) => !edits.hidden.has(ref.id)).map((ref, i) => {
    const out = { ...ref };
    delete out.size;
    if (i === 0) out.size = "lead";
    if (ref.id in edits.angles) { if (edits.angles[ref.id]) out.angle = edits.angles[ref.id]; else delete out.angle; }
    return out;
  });
  const shown = proof.items.map((r) => lib.evidence.get(r.id));
  lens.capabilityPriority = lens.capabilityPriority.filter((cap) => shown.some((it) => it.capabilities.some((c) => c.id === cap && c.strength !== "adjacent")));
  for (const [index, e] of Object.entries(edits.ledger)) {
    const row = lens.fit?.rows?.[index];
    if (!row) continue;
    if (e.level) row.level = e.level;
    if ("line" in e && row.evidence[0]) { if (e.line) row.evidence[0].line = e.line; else delete row.evidence[0].line; }
    const noteEn = (e.noteEn ?? "").trim(); const noteJp = (e.noteJp ?? "").trim();
    if (noteEn || noteJp) row.note = { en: noteEn || noteJp, jp: noteJp || noteEn }; else delete row.note;
  }
  for (const [path, value] of Object.entries(edits.copy)) {
    const current = getCopy(base, path) ?? { en: "", jp: "" };
    setCopy(lens, path, { en: value.en ?? current.en, jp: value.jp ?? current.jp });
  }
  if (lens.tailoredResume) lens.tailoredResume.highlights = lens.tailoredResume.highlights.filter((h) => !edits.hidden.has(h.id));
  return lens;
}

// The local guard runs on every edit so the Studio reacts instantly, before
// any network round trip. Only once it is clean do we ask /lens/preview to
// render the page — that request is debounced separately (see schedulePreview)
// so a burst of keystrokes does not fire one render per keystroke.
let timer = null;
function refresh() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    state.lens = rebuild();
    const errors = validateLens(state.lens, state.lib);
    const list = $("errors");
    list.replaceChildren(...(errors.length ? errors.map((e) => el("li", { text: e.replace(/^lens\/[^:]+: /, "") })) : [el("li", { class: "st-ok", text: "Nothing to fix. Every number and every claim on this page exists in the record." })]));
    state.errors = errors;
    updatePublish();
    if (!errors.length) schedulePreview();
    else $("preview-note").textContent = "Fix the guard's findings to refresh the preview.";
  }, 200);
}

// ── Preview (rendered server-side by /lens/preview) ────────────────────────
let previewTimer = null;
let previewToken = 0;
function schedulePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => { void preview(); }, 300);
}

async function preview() {
  const token = ++previewToken;
  const slug = state.lens.slug;
  $("preview-note").textContent = "Rendering…";
  try {
    const r = await fetch("/lens/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lens: { ...state.lens, status: "published" } }),
    });
    if (token !== previewToken) return; // a newer edit already asked
    if (r.ok) {
      const html = await r.text();
      $("preview").srcdoc = html;
      $("preview-label").textContent = `Preview · /lens/${slug}`;
      $("preview-note").textContent = "The page, rendered by the same code that builds the site.";
    } else {
      const data = await r.json().catch(() => ({}));
      const list = $("errors");
      list.replaceChildren(...(data.errors ?? [`The preview route rejected this lens (${r.status}).`]).map((e) => el("li", { text: e })));
      $("preview-note").textContent = "The preview route found something to fix.";
    }
  } catch (error) {
    if (token !== previewToken) return;
    $("preview-note").textContent = `Could not reach /lens/preview: ${error.message}`;
  }
}

function updatePublish() {
  const btn = $("publish");
  const hint = $("publish-hint");
  const ready = state.lens && !(state.errors ?? []).length;
  btn.disabled = !(ready && state.user);
  if (!state.lens) hint.textContent = "";
  else if (!state.api) hint.textContent = "Download the JSON, put it in src/lenses/, set status to published, commit, and let Vercel build it.";
  else if (!state.user) hint.textContent = "Sign in with GitHub (as the site's owner) to publish. Or download the JSON and commit it yourself.";
  else if (!ready) hint.textContent = "The guard has findings; publishing is disabled until the page is clean.";
  else hint.textContent = `Publishes /lens/${state.lens.slug}: one commit with the lens, under your GitHub name. Vercel builds and deploys it in about a minute.`;
}

// ── Publish / download ──────────────────────────────────────────────────────
$("publish").addEventListener("click", async () => {
  const btn = $("publish");
  const out = $("publish-result");
  btn.disabled = true; out.hidden = false; out.textContent = "Validating and committing…";
  try {
    const r = await fetch("/api/publish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lens: state.lens }) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      out.replaceChildren(el("b", { text: data.error ?? `Publish failed (${r.status}).` }), ...(data.details ?? []).map((d) => el("div", { class: "st-muted", text: d })));
      if (r.status === 401) await checkAuth();
    } else {
      out.replaceChildren(
        el("div", {}, ["Published. ", el("a", { href: data.url, target: "_blank", rel: "noopener", text: data.url })]),
        el("div", { class: "st-muted" }, [data.prUrl ? el("a", { href: data.prUrl, target: "_blank", rel: "noopener", text: "Pull request opened — merge it to go live." }) : el("a", { href: data.htmlUrl, target: "_blank", rel: "noopener", text: `Commit ${String(data.sha).slice(0, 7)} on ${data.branch}. Live after Vercel builds and deploys (about a minute).` })]),
      );
    }
  } catch (error) {
    out.textContent = `Publish failed: ${error.message}`;
  }
  btn.disabled = false;
});

function download(filename, text, type = "application/json") {
  const a = el("a", { href: URL.createObjectURL(new Blob([text], { type })), download: filename });
  document.body.append(a); a.click(); a.remove();
}
$("download").addEventListener("click", () => download(`${state.lens.slug}.json`, JSON.stringify(state.lens, null, 2) + "\n"));
$("download-report").addEventListener("click", () => {
  const { company, slug, analysis, picks, lib, requirements, source, scored, lens } = state;
  download(`${slug}-report.md`, renderReport({ company, slug, analysis, picks, lib, lensPath: `src/lenses/${slug}.json`, source, requirements, scoredCount: scored.length, fit: lens.fit }), "text/markdown");
});

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

boot().catch((error) => { $("status").textContent = `Could not start: ${error.message}`; console.error(error); });
