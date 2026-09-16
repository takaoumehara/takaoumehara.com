// Phase 2 — the Adaptive Pitch Engine (scripts/generate-pitch.mjs).
//
// What these tests guarantee:
//   - a posting is read into the taxonomy's terms, deterministically, without a model
//   - the proof it picks is 3–5 items, direct before transferable, and "direct" is earned
//   - the draft it writes passes every guard the hand-written lenses pass
//   - the fetch path reads schema.org JobPosting pages and refuses unreadable ones
//   - the record's new honesty fields (level, teamSize, outcome) render and validate
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { loadLibrary, loadLenses, ROOT } from "../src/lib/load.mjs";
import { validateLens, validateLibrary, validateAll } from "../src/validate.mjs";
import { renderAll } from "../src/build.mjs";
import { analyzeJob, loadLexicon, extractJobText, htmlToText, readJobText, guessCompany, slugify, sectionize } from "../src/analyze/jd.mjs";
import { scoreEvidence, selectProof, classify, capabilityCoverage, chooseMetrics } from "../src/analyze/match.mjs";
import { draftLens, jpSpacing } from "../src/analyze/draft.mjs";
import { auditItem } from "../scripts/audit-evidence.mjs";
import { generatePitch } from "../scripts/generate-pitch.mjs";

const lib = loadLibrary();
const lexicon = loadLexicon();
const caps = lib.capabilities.capabilities;
const sample = (name) => readFileSync(join(ROOT, "src", "pitches", "samples", name), "utf8");
const stripe = sample("stripe-senior-product-designer.txt");
const creative = sample("creative-director-brand-studio.txt");
const japanese = sample("jp-new-business-product-designer.txt");
const clone = (v) => JSON.parse(JSON.stringify(v));

function pitch(text, company = "Acme") {
  const analysis = analyzeJob(text, { lexicon, capabilities: caps, company });
  const scored = scoreEvidence(analysis, lib);
  const picks = selectProof(scored, analysis);
  const lens = draftLens({ company, slug: slugify(company), analysis, picks, lib, lexicon, source: "test", scored });
  return { analysis, scored, picks, lens };
}

// ── Reading the posting ─────────────────────────────────────────────────────

test("the lexicon only names capabilities that exist in the taxonomy, and covers all of them", () => {
  const ids = new Set(caps.map((c) => c.id));
  for (const id of Object.keys(lexicon.capabilities)) assert.ok(ids.has(id), `lexicon names unknown capability "${id}"`);
  for (const id of ids) assert.ok(lexicon.capabilities[id]?.length >= 5, `taxonomy capability "${id}" has too few phrases in the lexicon`);
  for (const theme of Object.values(lexicon.themes)) if (theme.capabilities) for (const id of theme.capabilities) assert.ok(ids.has(id), `theme names unknown capability "${id}"`);
});

test("a payments product-design posting reads as product UX, prototyping in code, B2B and a regulated enterprise", () => {
  const { analysis } = pitch(stripe, "Stripe");
  assert.equal(analysis.title, "Senior Product Designer, Payments");
  assert.equal(analysis.seniority.id, "senior");
  const top = Object.keys(analysis.capabilityWeights).slice(0, 6);
  for (const id of ["ux-cx", "prototyping", "b2b", "enterprise"]) assert.ok(top.includes(id), `expected ${id} in the top asks, got ${top.join(", ")}`);
  assert.ok(analysis.capabilityWeights["design-systems"] >= 0.3, "design systems is named twice; it must register");
  assert.ok(analysis.capabilityWeights["film-production"] == null || analysis.capabilityWeights["film-production"] < 0.1, "nothing in the posting is about film");
  assert.ok(analysis.domains.some((d) => d.id === "fintech"), "the posting is in payments");
  assert.equal(analysis.themes[0].id, "product-ux");
});

test("a brand-and-film creative-director posting reads as creative direction, brand, film and partner direction", () => {
  const { analysis } = pitch(creative, "Meridian");
  assert.equal(analysis.seniority.id, "director");
  const top = Object.keys(analysis.capabilityWeights).slice(0, 5);
  for (const id of ["creative-direction", "brand", "film-production", "partner-direction"]) assert.ok(top.includes(id), `expected ${id} in the top five, got ${top.join(", ")}`);
  assert.equal(analysis.themes[0].id, "brand-creative");
});

test("a Japanese posting is read in Japanese", () => {
  const { analysis } = pitch(japanese, "ミナト");
  assert.match(analysis.title, /新規事業プロダクトデザイナー/);
  assert.equal(analysis.seniority.id, "lead");
  const top = Object.keys(analysis.capabilityWeights).slice(0, 4);
  for (const id of ["ai", "zero-to-one", "new-ventures"]) assert.ok(top.includes(id), `expected ${id}, got ${top.join(", ")}`);
  assert.ok(analysis.words > 150, `Japanese text must count as text, got ${analysis.words} words`);
});

test("lines under Requirements weigh more than lines under Benefits, and Nice-to-have sits between", () => {
  const lines = sectionize("About us\nWe make widgets.\nRequirements\n5 years of design.\nNice to have\nFigma.\nBenefits\nDental.", lexicon);
  const by = Object.fromEntries(lines.map((l) => [l.text, l]));
  assert.equal(by["We make widgets."].section, "context");
  assert.equal(by["5 years of design."].section, "requirements");
  assert.equal(by["Figma."].section, "preferred");
  assert.equal(by["Dental."].section, "context");
  assert.ok(by["5 years of design."].weight > by["Figma."].weight && by["Figma."].weight > by["Dental."].weight);
});

test("the same posting always yields the same analysis and the same draft", () => {
  const a = pitch(stripe, "Stripe");
  const b = pitch(stripe, "Stripe");
  assert.deepEqual(a.analysis.capabilityWeights, b.analysis.capabilityWeights);
  assert.deepEqual(a.lens, b.lens);
});

test("a page with a schema.org JobPosting is read from the JSON-LD, not the chrome around it", () => {
  const html = `<html><head><title>Careers</title><script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "JobPosting", title: "Staff Product Designer", hiringOrganization: { "@type": "Organization", name: "Acme Corp" }, description: "<p>Own the <b>design system</b>.</p><ul><li>Prototype in code</li></ul>" })}</script></head><body><nav>Home Jobs Login</nav><main><h1>Join us</h1></main></body></html>`;
  const out = extractJobText(html);
  assert.equal(out.via, "json-ld");
  assert.equal(out.title, "Staff Product Designer");
  assert.equal(out.company, "Acme Corp");
  assert.match(out.text, /Own the design system\./);
  assert.match(out.text, /- Prototype in code/);
  assert.ok(!/Login/.test(out.text));
});

test("a plain page is read from <main>, without nav, scripts or styles; entities are decoded", () => {
  const html = `<html><head><style>.x{}</style><script>var a=1;</script></head><body><header>Menu</header><main><h2>What you&#39;ll do</h2><p>Design &amp; ship</p></main><footer>©</footer></body></html>`;
  const out = extractJobText(html);
  assert.equal(out.via, "html");
  assert.match(out.text, /What you'll do\n+Design & ship/);
  assert.ok(!/Menu|var a|\.x/.test(out.text));
  assert.equal(htmlToText("a<br>b&nbsp;c"), "a\nb c");
});

test("a JavaScript-rendered or empty page is refused with a paste workaround, not analysed as blank", async () => {
  const fetchImpl = async () => ({ ok: true, status: 200, text: async () => "<html><body><div id=app></div></body></html>" });
  await assert.rejects(readJobText({ url: "https://jobs.example.com/123", fetchImpl }), (e) => e.reason === "unreadable");
  const failing = async () => ({ ok: false, status: 403, statusText: "Forbidden", text: async () => "" });
  await assert.rejects(readJobText({ url: "https://jobs.example.com/123", fetchImpl: failing }), (e) => e.reason === "fetch" && /403/.test(e.message));
});

test("fetching a real HTTP server end to end", async () => {
  const page = `<html><body><main><h1>Senior Product Designer</h1>${"<p>Design systems, prototyping in code, user research, cross-functional partnership with engineering and product.</p>".repeat(6)}</main></body></html>`;
  const server = createServer((req, res) => { res.setHeader("content-type", "text/html"); res.end(page); });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    const url = `http://127.0.0.1:${server.address().port}/jobs/42`;
    const out = await readJobText({ url });
    assert.equal(out.source, url);
    assert.match(out.text, /Senior Product Designer/);
  } finally { server.close(); }
});

test("the company is guessed from job-board and company URLs, and slugs are kebab-case", () => {
  assert.equal(guessCompany("https://boards.greenhouse.io/stripe/jobs/123"), "Stripe");
  assert.equal(guessCompany("https://jobs.lever.co/acme-inc/abc"), "Acme Inc");
  assert.equal(guessCompany("https://stripe.com/jobs/listing/x/1"), "Stripe");
  assert.equal(guessCompany("https://careers.example.co.uk/role"), "Example");
  assert.equal(guessCompany("https://www.linkedin.com/jobs/view/1"), undefined);
  assert.equal(slugify("Meridian Studio"), "meridian-studio");
  assert.equal(slugify("株式会社ミナト"), "company");
});

// ── Choosing the proof ──────────────────────────────────────────────────────

test("proof is 3 to 5 items, direct before transferable, no private evidence, no duplicates", () => {
  for (const [text, company] of [[stripe, "Stripe"], [creative, "Meridian"], [japanese, "ミナト"]]) {
    const { picks } = pitch(text, company);
    assert.ok(picks.length >= 3 && picks.length <= 5, `${company}: ${picks.length} picks`);
    const order = picks.map((p) => p.match);
    assert.deepEqual(order, [...order].sort((a, b) => (a === b ? 0 : a === "direct" ? -1 : 1)), `${company}: direct must lead`);
    assert.equal(new Set(picks.map((p) => p.item.slug)).size, picks.length);
    for (const p of picks) assert.notEqual(p.item.visibility, "private");
  }
});

test('"direct" is earned: strong on two of the five heaviest asks, or the heaviest plus the domain', () => {
  const { analysis, scored } = pitch(stripe, "Stripe");
  const row = (slug) => scored.find((r) => r.item.slug === slug);
  assert.equal(classify(row("verizon-totalwireless"), analysis), "direct");
  assert.equal(classify(row("koji-fizz"), analysis), "transferable", "a brand film is not direct evidence for a payments designer");
  assert.equal(classify(row("festival-reinvention"), analysis), "transferable", "a volunteer festival is not direct evidence for a payments designer");
});

test("the posting's domain lifts the record from that domain into the proof", () => {
  const { picks } = pitch(stripe, "Stripe");
  assert.ok(picks.some((p) => p.item.slug === "credit-card-portal"), `a fintech portal must appear for a payments posting; got ${picks.map((p) => p.item.slug).join(", ")}`);
});

test("a creative-director posting leads with creative work, not the AI fleet", () => {
  const { picks } = pitch(creative, "Meridian");
  assert.equal(picks[0].match, "direct");
  const first3 = picks.slice(0, 3).map((p) => p.item.slug);
  assert.ok(first3.includes("koji-fizz"), `KOJI FIZZ (film) must be in the first three, got ${first3.join(", ")}`);
  assert.ok(first3.includes("coca-cola"), `Coca-Cola (global brand) must be in the first three, got ${first3.join(", ")}`);
});

test("a metric a lens highlights is never unverified; stated comes before approximate", () => {
  const verizon = lib.evidence.get("verizon-ai-workflow");
  const ids = chooseMetrics(verizon, { max: 10 });
  assert.ok(!ids.includes("rework-10x"));
  const festival = lib.evidence.get("festival-reinvention");
  const picked = chooseMetrics(festival).map((id) => festival.metrics.find((m) => m.id === id).confidence);
  assert.deepEqual(picked, ["stated", "stated"]);
});

test("coverage names the gaps honestly, and the gaps never enter the lens", () => {
  const text = `${stripe}\n\nRequirements\n- Deep experience with film production and cinematography.\n- Kubernetes operations experience.`;
  const { analysis, lens } = pitch(text, "Stripe");
  const coverage = capabilityCoverage(analysis, lib);
  assert.ok(coverage.length > 0);
  for (const row of coverage) assert.ok(["direct", "transferable", "gap"].includes(row.status));
  // Everything the lens sells is backed by strong or moderate evidence in the lens itself.
  const used = lens.sections.flatMap((s) => (s.items ?? []).map((i) => (typeof i === "string" ? i : i.id))).map((id) => lib.evidence.get(id));
  for (const cap of lens.capabilityPriority) assert.ok(used.some((it) => it.capabilities.some((c) => c.id === cap && c.strength !== "adjacent")), `${cap} sold without backing`);
});

// ── The draft ───────────────────────────────────────────────────────────────

test("the draft passes every validation a hand-written lens passes, for all three samples", () => {
  for (const [text, company] of [[stripe, "Stripe"], [creative, "Meridian Studio"], [japanese, "ミナト"]]) {
    const { lens } = pitch(text, company);
    assert.deepEqual(validateLens(lens, lib), [], `${company}`);
    assert.equal(lens.status, "draft");
    assert.equal(lens.seo.noindex, true);
  }
});

test("the draft never writes a notMine phrase or a summaryOverride, and every card uses an angle the record offers", () => {
  const { lens } = pitch(creative, "Meridian Studio");
  const proof = lens.sections.find((s) => s.type === "proof");
  for (const ref of proof.items) {
    const item = lib.evidence.get(ref.id);
    assert.equal(ref.summaryOverride, undefined);
    if (ref.angle) assert.ok(item.angles?.[ref.angle], `${ref.id}: angle ${ref.angle}`);
    const text = JSON.stringify(ref).toLowerCase();
    for (const phrase of item.contribution.notMine ?? []) assert.ok(!text.includes(phrase.toLowerCase()), `${ref.id}: "${phrase}"`);
  }
});

test("five cards do not all carry the same emphasis line", () => {
  const { lens } = pitch(stripe, "Stripe");
  const lines = lens.sections[0].items.map((i) => i.emphasis.en);
  assert.ok(new Set(lines).size >= Math.min(3, lines.length), lines.join(" | "));
  for (const line of lines) assert.match(line, /^(Direct evidence|Transferable) · /);
});

test("every reader-facing string in the draft carries Japanese, spaced the way the site sets it", () => {
  const JP = "\\u3041-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u4E00-\\u9FFF\\u3005-\\u3007";
  const unspaced = new RegExp(`(?:[A-Za-z0-9%)\\]][${JP}]|[${JP}][A-Za-z0-9$(\\[])`);
  const { lens } = pitch(stripe, "Stripe");
  const walk = (path, v) => {
    if (v == null) return;
    if (Array.isArray(v)) return v.forEach((x, i) => walk(`${path}[${i}]`, x));
    if (typeof v !== "object") return;
    if (typeof v.en === "string") { assert.ok(typeof v.jp === "string" && v.jp.length, `${path}: no Japanese`); assert.ok(!unspaced.test(v.jp), `${path}: 「${v.jp.match(unspaced)?.[0]}」`); return; }
    for (const [k, x] of Object.entries(v)) walk(`${path}.${k}`, x);
  };
  walk("lens", lens);
  assert.equal(jpSpacing("Stripeの募集。AIプロダクト"), "Stripe の募集。AI プロダクト");
});

test("the lens note names the company and its focus; the standard note still renders for the other lenses", () => {
  const { lens } = pitch(stripe, "Stripe");
  assert.match(lens.lensNote.en, /Stripe's focus on .*Same experience\. Different lens\./);
  lens.status = "published";
  lens.slug = "zz-test";
  const pages = renderAll({ lib, lenses: [...loadLenses(), lens] });
  const html = pages.get("lens/zz-test/index.html");
  assert.match(html, /Stripe&#39;s focus on/);
  assert.match(pages.get("lens/creative/index.html"), /most relevant to this opportunity\. Same experience\. Different lens\./);
});

test("the CLI writes the lens, the analysis and the report, and refuses to overwrite without --force", () => {
  const dir = mkdtempSync(join(tmpdir(), "pitch-"));
  try {
    const run = (args) => execFileSync("node", [join(ROOT, "scripts", "generate-pitch.mjs"), ...args], { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    const out = run(["--company", "Stripe", "--jd", join(ROOT, "src", "pitches", "samples", "stripe-senior-product-designer.txt"), "--out-dir", dir]);
    assert.match(out, /DIRECT/);
    for (const f of ["src/lenses/stripe.json", "src/pitches/stripe/report.md", "src/pitches/stripe/analysis.json", "src/pitches/stripe/jd.txt"]) assert.ok(existsSync(join(dir, f)), f);
    const lens = JSON.parse(readFileSync(join(dir, "src", "lenses", "stripe.json"), "utf8"));
    assert.deepEqual(validateLens(lens, lib), []);
    assert.match(readFileSync(join(dir, "src", "pitches", "stripe", "report.md"), "utf8"), /## 4\. Gaps/);
    assert.throws(() => run(["--company", "Stripe", "--jd", join(ROOT, "src", "pitches", "samples", "stripe-senior-product-designer.txt"), "--out-dir", dir]), /already exists/);
    // Paste mode: the posting on stdin.
    const pasted = execFileSync("node", [join(ROOT, "scripts", "generate-pitch.mjs"), "--company", "Stripe", "--slug", "stripe-2", "--out-dir", dir], { encoding: "utf8", input: stripe });
    assert.match(pasted, /pasted text/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("the committed Stripe draft is what the generator produces from the committed sample", async () => {
  const dir = mkdtempSync(join(tmpdir(), "pitch-"));
  try {
    const result = await generatePitch({ company: "Stripe", file: join(ROOT, "src", "pitches", "samples", "stripe-senior-product-designer.txt"), outDir: dir, lib, lexicon });
    const committed = JSON.parse(readFileSync(join(ROOT, "src", "lenses", "stripe.json"), "utf8"));
    const strip = (l) => { const { $comment, ...rest } = l; return rest; };
    assert.deepEqual(strip(result.lens), strip(committed), "src/lenses/stripe.json is stale — re-run: node scripts/generate-pitch.mjs --company Stripe --jd src/pitches/samples/stripe-senior-product-designer.txt --force");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("a draft lens is validated by the build but not written; --preview renders it under lens/_preview", () => {
  const lenses = loadLenses();
  assert.ok(lenses.some((l) => l.slug === "stripe" && l.status === "draft"));
  assert.deepEqual(validateAll(lib, lenses, { assetExists: (p) => existsSync(join(ROOT, p)) }), []);
  const pages = renderAll({ lib, lenses });
  assert.ok(!pages.has("lens/stripe/index.html"));
  const preview = renderAll({ lib, lenses, preview: true });
  assert.ok(preview.has("lens/_preview/stripe/index.html"));
  assert.match(preview.get("lens/_preview/stripe/index.html"), /data-lens="stripe"/);
  assert.match(readFileSync(join(ROOT, ".gitignore"), "utf8"), /lens\/_preview/);
});

// ── The honesty fields ──────────────────────────────────────────────────────

test("contribution.level renders as a role flag on proof cards, and only from the record", () => {
  const pages = renderAll({ lib, lenses: loadLenses() });
  const home = pages.get("index.html");
  assert.match(home, /card-flag--role"><span class="t-en">Solo<\/span>/, "Resona is recorded as solo work");
  const creative = pages.get("lens/creative/index.html");
  assert.match(creative, /card-flag--role"><span class="t-en">Led<\/span>/, "KOJI FIZZ is recorded as led");
  const lens = clone(loadLenses().find((l) => l.slug === "creative"));
  const item = clone(lib.evidence.get("koji-fizz"));
  item.contribution.teamSize = 6;
  const lib2 = { ...lib, evidence: new Map([...lib.evidence, ["koji-fizz", item]]) };
  const html = renderAll({ lib: lib2, lenses: [lens] }).get("lens/creative/index.html");
  assert.match(html, /Led · team of 6/);
});

test("the validator rejects a soft level, a fractional team, a solo team of five, and a measured outcome with no metric", () => {
  const broken = (mutate) => {
    const item = clone(lib.evidence.get("koji-fizz"));
    mutate(item);
    const lib2 = { ...lib, evidence: new Map([...lib.evidence, ["koji-fizz", item]]) };
    return validateLibrary(lib2);
  };
  assert.ok(broken((i) => { i.contribution.level = "mostly me"; }).some((e) => /contribution\.level/.test(e)));
  assert.ok(broken((i) => { i.contribution.teamSize = 2.5; }).some((e) => /teamSize/.test(e)));
  assert.ok(broken((i) => { i.contribution.level = "solo"; i.contribution.teamSize = 5; }).some((e) => /contradicts/.test(e)));
  assert.ok(broken((i) => { i.outcome = { status: "measured" }; i.metrics = []; }).some((e) => /outcome\.status "measured"/.test(e)));
  assert.deepEqual(broken((i) => { i.outcome = { status: "unknown", note: { en: "No numbers were kept.", jp: "数字は残っていない。" } }; }), []);
});

test("the guards reach tailoredResume and a custom lensNote", () => {
  const { lens } = pitch(stripe, "Stripe");
  const a = clone(lens); a.tailoredResume.summary = { en: "I led 400 designers.", jp: "400 人を率いた。" };
  assert.ok(validateLens(a, lib).some((e) => /tailoredResume\.summary.*Claim Guard/.test(e)));
  const b = clone(lens); b.tailoredResume.highlights[0] = { id: "koji-fizz", line: "Directed the film" };
  const errors = validateLens(b, lib);
  assert.ok(errors.some((e) => /highlights\[0\].*does not show/.test(e)));
  assert.ok(errors.some((e) => /NotMine Guard/.test(e)));
  const c = clone(lens); c.lensNote = { en: "Work for 400 companies.", jp: "400 社の仕事。" };
  assert.ok(validateLens(c, lib).some((e) => /lensNote.*Claim Guard/.test(e)));
});

test("the audit asks the recruiter's questions of every record that cannot answer them", () => {
  const verizon = auditItem(lib.evidence.get("verizon-ai-workflow"));
  const ids = verizon.map((g) => g.id);
  assert.ok(ids.includes("level") && ids.includes("engagement") && ids.includes("unverified") && ids.includes("decisions"), ids.join(", "));
  const resona = auditItem(lib.evidence.get("resona"));
  assert.ok(!resona.some((g) => g.id === "level"), "recorded as solo — nothing to ask");
  assert.ok(existsSync(join(ROOT, "docs", "evidence-gaps.md")), "run: node scripts/audit-evidence.mjs");
});
