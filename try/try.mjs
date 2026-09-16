// The public demo: a visitor pastes a posting and sees the site arranged for
// it, in their browser, with nothing saved and nothing published. Same engine,
// same guards, same renderer as the build — that is the point of showing it.
import { analyzeJob, slugify } from "../src/analyze/jd.mjs";
import { scoreEvidence, selectProof, requirementCheck } from "../src/analyze/match.mjs";
import { phraseRegex } from "../src/analyze/jd.mjs";
import { draftLens } from "../src/analyze/draft.mjs";
import { validateLens, evidenceCorpus } from "../src/validate.mjs";
import { renderLens } from "../src/render/page.mjs";
import { hydrateLibrary } from "../src/lib/library.mjs";

const $ = (id) => document.getElementById(id);
const state = { lib: null, lexicon: null, css: null };

async function boot() {
  const [libJson, css] = await Promise.all([
    fetch("../assets/studio/library.json").then((r) => r.json()),
    fetch("../src/render/lens.css").then((r) => r.text()),
  ]);
  state.lib = hydrateLibrary(libJson);
  state.lexicon = libJson.lexicon;
  state.css = css;
  $("status").textContent = `${state.lib.evidence.size} records, one rule. Paste a posting.`;
}

$("sample").addEventListener("click", async () => {
  $("jd").value = await fetch("../src/pitches/samples/stripe-senior-product-designer.txt").then((r) => r.text());
  $("company").value = "Stripe";
  $("status").textContent = "An illustrative posting, not a real listing.";
});

$("intake").addEventListener("submit", (event) => {
  event.preventDefault();
  try { arrange(); } catch (error) { $("status").textContent = error.message; console.error(error); }
});

function arrange() {
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
  const html = renderLens({ lens: { ...lens, status: "published" }, lib, css: state.css, ctx: { base: "/", canonical: "https://takaoumehara.com/try/" } });
  $("preview").srcdoc = html;
  const fit = lens.fit;
  const direct = fit?.rows?.filter((r) => r.level === "direct").length ?? 0;
  const none = fit?.rows?.filter((r) => r.level === "none").length ?? 0;
  $("note").innerHTML = `<b>${esc(company)} — ${esc(analysis.title)}.</b> ${picks.length} pieces of work chosen for ${esc(analysis.themes.filter((t) => !t.quiet).slice(0, 3).map((t) => t.label.en).join(", "))}. The ledger answers ${fit?.rows?.length ?? 0} requirement lines: ${direct} with a specific thing I did${none ? `, ${none} not on record` : ""}. Scroll the page below; it is the same page I would publish, before I touch a word of it.`;
  $("result").hidden = false;
  $("status").textContent = "Arranged.";
  $("result").scrollIntoView({ behavior: "smooth", block: "start" });
}

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
boot().catch((error) => { $("status").textContent = `Could not load the record: ${error.message}`; });
