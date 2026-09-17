// The public demo: a visitor pastes a posting and sees the site arranged for
// it, in their browser, with nothing saved and nothing published. Same engine,
// same guards as the build; the page itself is rendered server-side by
// /lens/preview — the same components the built pages use.
import { analyzeJob, slugify } from "../analyze/jd.mjs";
import { scoreEvidence, selectProof, requirementCheck } from "../analyze/match.mjs";
import { phraseRegex } from "../analyze/jd.mjs";
import { draftLens } from "../analyze/draft.mjs";
import { validateLens, evidenceCorpus } from "../validate.mjs";
import { hydrateLibrary } from "../lib/library.mjs";
import sample from "../analyze/samples/stripe-senior-product-designer.txt?raw";

const $ = (id) => document.getElementById(id);
const state = { lib: null, lexicon: null };

async function boot() {
  const libJson = await fetch("/assets/studio/library.json").then((r) => r.json());
  state.lib = hydrateLibrary(libJson);
  state.lexicon = libJson.lexicon;
  $("status").textContent = `${state.lib.evidence.size} records, one rule. Paste a posting.`;
}

$("sample").addEventListener("click", () => {
  $("jd").value = sample;
  $("company").value = "Stripe";
  $("status").textContent = "An illustrative posting, not a real listing.";
});

$("intake").addEventListener("submit", (event) => {
  event.preventDefault();
  arrange().catch((error) => { $("status").textContent = error.message; console.error(error); });
});

async function arrange() {
  const text = $("jd").value.trim();
  const company = $("company").value.trim();
  if (!text) { $("status").textContent = "Paste the posting first."; return; }
  if (!company) { $("status").textContent = "Which company? One word is enough."; $("company").focus(); return; }
  const { lib, lexicon } = state;
  const analysis = analyzeJob(text, { lexicon, capabilities: lib.capabilities.capabilities, title: $("role").value.trim() || undefined, company });
  if (!Object.keys(analysis.capabilityWeights).length) { $("status").textContent = "That text names nothing the rule knows. Is it a job description?"; return; }
  const scored = scoreEvidence(analysis, lib);
  const picks = selectProof(scored, analysis);
  const requirements = requirementCheck(analysis, lib, { phraseRegex, evidenceCorpus });
  const lens = draftLens({ company, slug: slugify(company), analysis, picks, lib, lexicon, source: "a posting pasted by a visitor", scored, requirements, seenAt: new Date().toISOString().slice(0, 10) });
  // Say plainly who arranged this view. The visitor did, through their posting; nobody wrote for them.
  lens.hero.note = {
    en: `Arranged from the posting you pasted, in your browser. Nothing here was written for you: the cards, the quotes and the ledger below come from the record, chosen by a rule. What the record cannot answer says so.`,
    jp: `いま貼られた求人票から、ブラウザの中で並べ替えた表示。このために書き下ろした文は無い。カードも引用も台帳も記録から規則で選んだもので、記録に無いものは無いと書いてある。`,
  };
  lens.lensNote = {
    en: `This view was arranged from a posting pasted by the visitor, not edited by ${lib.profile.name}. Same experience. Different lens.`,
    jp: `このページは、訪問者が貼った求人票から自動で並べたもので、${lib.profile.name} が手を入れたものではない。同じ経験。違うレンズ。`,
  };
  const errors = validateLens(lens, lib);
  if (errors.length) { console.warn(errors); $("status").textContent = "The rule produced something the guard would not publish; please try another posting."; return; }
  $("status").textContent = "Rendering…";
  const r = await fetch("/lens/preview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lens: { ...lens, status: "published" } }) });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    console.warn(data.errors);
    $("status").textContent = "The preview route would not render this; please try another posting.";
    return;
  }
  $("preview").srcdoc = await r.text();
  const fit = lens.fit;
  const direct = fit?.rows?.filter((row) => row.level === "direct").length ?? 0;
  const none = fit?.rows?.filter((row) => row.level === "none").length ?? 0;
  $("note").innerHTML = `<b>${esc(company)} — ${esc(analysis.title)}.</b> ${picks.length} pieces of work chosen for ${esc(analysis.themes.filter((t) => !t.quiet).slice(0, 3).map((t) => t.label.en).join(", "))}. The ledger answers ${fit?.rows?.length ?? 0} requirement lines: ${direct} with a specific thing I did${none ? `, ${none} not on record` : ""}. Scroll the page below; it is the same page I would publish, before I touch a word of it.`;
  $("result").hidden = false;
  $("status").textContent = "Arranged.";
  $("result").scrollIntoView({ behavior: "smooth", block: "start" });
}

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
boot().catch((error) => { $("status").textContent = `Could not load the record: ${error.message}`; });
