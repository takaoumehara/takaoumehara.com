// Guardrails for the adaptive portfolio: one evidence base, many lenses.
//
// These tests are the executable form of the success criteria in
// docs/adaptive-portfolio-architecture.md:
//   A/B  a project is entered once and appears in several lenses, differently
//   C    no lens can invent experience (validator + claim guard + notMine guard)
//   E    the root page still tells the whole story
//   —    the committed HTML is exactly what the build produces (deterministic publishing)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadLibrary, loadLenses, ROOT } from "../src/lib/load.mjs";
import { validateAll, validateLens, numericTokens } from "../src/validate.mjs";
import { renderAll, outputPath } from "../src/build.mjs";

const lib = loadLibrary();
const lenses = loadLenses();
const byslug = (slug) => lenses.find((l) => l.slug === slug);
const clone = (value) => JSON.parse(JSON.stringify(value));
const assetExists = (path) => existsSync(join(ROOT, path));
const text = (html) => html.replace(/<style>[\s\S]*?<\/style>/g, "").replace(/<script>[\s\S]*?<\/script>/g, "");

// ── Evidence base ───────────────────────────────────────────────────────────

test("the evidence library validates: taxonomy, references, contribution split, metrics, assets", () => {
  const errors = validateAll(lib, lenses, { assetExists });
  assert.deepEqual(errors, []);
});

test("every evidence item separates what Takao did from what the team did", () => {
  for (const [slug, item] of lib.evidence) {
    assert.ok(item.contribution.mine.length >= 1, `${slug}: contribution.mine`);
    if (item.kind === "project") assert.ok(Array.isArray(item.contribution.team), `${slug}: projects must state the team's part ([] for solo work)`);
  }
});

test("KOJI FIZZ is recorded as producer / creative partner, not as director or cinematographer", () => {
  const koji = lib.evidence.get("koji-fizz");
  assert.match(koji.role, /Producer/);
  assert.ok(koji.contribution.notMine.some((p) => /directing/i.test(p)));
  assert.ok(koji.contribution.team.some((p) => /director/i.test(p)));
  const claimed = koji.capabilities.map((c) => c.id);
  assert.ok(claimed.includes("film-production") && claimed.includes("creative-direction"));
});

test("Festival Reinvention states the volunteer role and keeps the revenue metric approximate", () => {
  const festival = lib.evidence.get("festival-reinvention");
  assert.equal(festival.engagement, "volunteer");
  const revenue = festival.metrics.find((m) => m.id === "games-revenue-3x");
  assert.equal(revenue.confidence, "approximate");
});

test("Verizon is modelled as enterprise AI and product operations, not only UX", () => {
  const verizon = lib.evidence.get("verizon-ai-workflow");
  const strong = new Set(verizon.capabilities.filter((c) => c.strength === "strong").map((c) => c.id));
  for (const id of ["ai", "agentic-ux", "business-transformation", "operations", "cross-functional-leadership", "enterprise"]) {
    assert.ok(strong.has(id), `verizon-ai-workflow should claim "${id}" strongly`);
  }
});

test("every capability in the taxonomy is backed by evidence, and the weakly backed ones are known", () => {
  const strong = new Set();
  const moderate = new Set();
  for (const item of lib.evidence.values()) for (const c of item.capabilities) (c.strength === "strong" ? strong : moderate).add(c.id);
  const ids = lib.capabilities.capabilities.map((c) => c.id);
  assert.deepEqual(ids.filter((id) => !strong.has(id) && !moderate.has(id)), [], "capabilities with no evidence at all");
  // Capabilities that exist in the taxonomy but have only moderate evidence on the site so far.
  // Adding strong evidence (or removing the capability) should update this list deliberately.
  assert.deepEqual(ids.filter((id) => !strong.has(id)), ["executive-partnership"]);
});

// ── Lenses cannot invent experience ─────────────────────────────────────────

test("a lens cannot reference evidence that does not exist", () => {
  const lens = clone(byslug("creative"));
  lens.sections[0].items.push({ id: "nobel-prize" });
  assert.ok(validateLens(lens, lib).some((e) => /unknown evidence "nobel-prize"/.test(e)));
});

test("a lens cannot claim a number the evidence does not contain (Claim Guard)", () => {
  const lens = clone(byslug("creative"));
  const koji = lens.sections[0].items.find((ref) => ref.id === "koji-fizz");
  koji.summaryOverride = "A film series that reached 12 million viewers.";
  const errors = validateLens(lens, lib);
  assert.ok(errors.some((e) => /Claim Guard/.test(e) && /12/.test(e)), errors.join("\n"));
});

test("a lens cannot claim what the evidence lists as not Takao's (NotMine Guard)", () => {
  const lens = clone(byslug("creative"));
  const koji = lens.sections[0].items.find((ref) => ref.id === "koji-fizz");
  koji.emphasis = "Film directing · Cinematography";
  const errors = validateLens(lens, lib);
  assert.ok(errors.some((e) => /NotMine Guard/.test(e)), errors.join("\n"));
});

test("a lens cannot highlight an unverified metric", () => {
  const lens = clone(byslug("ai-product"));
  lens.sections[0].items[0].metricIds.push("rework-10x");
  assert.ok(validateLens(lens, lib).some((e) => /unverified/.test(e)));
});

test("a lens cannot sell a capability its evidence does not back", () => {
  const lens = clone(byslug("ai-product"));
  lens.capabilityPriority.push("film-production");
  assert.ok(validateLens(lens, lib).some((e) => /film-production.*not backed/.test(e)));
});

test("a lens cannot pick an angle the evidence does not offer", () => {
  const lens = clone(byslug("default"));
  lens.sections[0].items[1].angle = "cinematic";
  assert.ok(validateLens(lens, lib).some((e) => /no angle "cinematic"/.test(e)));
});

test("the hero itself is subject to the Claim Guard", () => {
  const lens = clone(byslug("default"));
  lens.hero.body = "I have led 400 designers.";
  assert.ok(validateLens(lens, lib).some((e) => /hero\.body.*Claim Guard/.test(e)));
});

test("numeric tokens compare the way a reader reads them", () => {
  assert.deepEqual([...numericTokens("3× growth, 40+ people, $10K+, 90%")], ["3×", "40+", "$10K+", "90%"]);
  assert.deepEqual([...numericTokens("3x growth")], ["3×"]);
});

// ── One project, many narratives ────────────────────────────────────────────

const pages = renderAll({ lib, lenses });
const home = pages.get("index.html");
const creative = pages.get("lens/creative/index.html");
const aiProduct = pages.get("lens/ai-product/index.html");

test("the three MVP routes render", () => {
  assert.ok(home && creative && aiProduct);
  assert.equal(outputPath(byslug("default")), "index.html");
  assert.equal(outputPath(byslug("creative")), "lens/creative/index.html");
});

test("changing only the lens config changes hero, order, framing, sections and CTA", () => {
  const firstProof = (html) => text(html).match(/<article class="proof-card[^"]*"[^>]*data-href="([^"]+)"/)?.[1];
  const h1 = (html) => text(html).match(/<h1 class="hero-line">([\s\S]*?)<\/h1>/)[1].replace(/<[^>]+>/g, " ").trim();

  // hero
  assert.notEqual(h1(home), h1(creative));
  assert.notEqual(h1(home), h1(aiProduct));
  // order: the lead card differs between default and ai-product
  assert.match(firstProof(home), /rakugaki/);
  assert.match(firstProof(aiProduct), /verizon-ai-agents/);
  // framing: the same Festival evidence is described with a different approved angle
  const festival = lib.evidence.get("festival-reinvention");
  assert.ok(home.includes(festival.angles.business.slice(0, 60)));
  assert.ok(creative.includes(festival.angles.creative.slice(0, 60)));
  assert.ok(!aiProduct.includes("festival-design.html"), "the ai-product lens omits the festival entirely");
  // sections toggled
  assert.ok(home.includes('id="ventures"') && !creative.includes('id="ventures"'));
  assert.ok(home.includes('id="experiments"') && !aiProduct.includes('id="experiments"'));
  // CTA
  const cta = (html) => text(html).match(/<h2 class="end-line">([\s\S]*?)<\/h2>/)[1].replace(/<[^>]+>/g, " ").trim();
  assert.notEqual(cta(home), cta(creative));
  assert.notEqual(cta(home), cta(aiProduct));
});

test("no evidence text is duplicated into the lens configs", () => {
  for (const lens of lenses) {
    const json = JSON.stringify(lens);
    for (const item of lib.evidence.values()) {
      if (typeof item.summary === "string") assert.ok(!json.includes(item.summary), `${lens.slug} copies ${item.slug}'s summary instead of referencing it`);
    }
  }
});

test("lens pages are noindex, hidden from the main nav, and carry the one-line lens note; the root page is neither", () => {
  for (const html of [creative, aiProduct]) {
    assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
    assert.match(html, /Same experience\. Different lens\./);
    assert.ok(!/<ul class="nav-links"[\s\S]*?lens\//.test(html), "lens pages must not be in the nav");
  }
  assert.ok(!/noindex/.test(home));
  assert.ok(!/Same experience\. Different lens\./.test(home));
});

test("the root page tells the whole story: every canonical section, in the canonical order", () => {
  const ids = ["proof", "exploring", "experiments", "ventures", "career", "capabilities", "studio", "contact"];
  let last = -1;
  for (const id of ids) {
    const at = home.indexOf(`id="${id}"`);
    assert.ok(at > last, `home: section "${id}" missing or out of order`);
    last = at;
  }
  assert.match(home, /I like the beginning of things\./);
  assert.match(home, /I make things to think/);
});

test("every card can show what Takao did and what the team did", () => {
  for (const html of [home, creative, aiProduct]) {
    const cards = html.match(/<article class="proof-card/g).length;
    const details = html.match(/<details class="contrib">/g).length;
    assert.equal(details, cards);
  }
});

test("lens pages resolve every site-relative link and asset from their own depth", () => {
  for (const [path, html] of pages) {
    const depth = path.split("/").length - 1;
    for (const match of text(html).matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url = match[1];
      if (/^(?:https?:|mailto:|tel:|#)/.test(url)) continue;
      const relative = url.split("#")[0];
      if (!relative) continue;
      const target = join(ROOT, path.split("/").slice(0, depth).join("/"), relative);
      assert.ok(existsSync(target), `${path}: "${url}" does not resolve`);
    }
  }
});

// ── Deterministic publishing ────────────────────────────────────────────────

test("the committed pages are exactly what the build produces (run: node src/build.mjs)", () => {
  for (const [path, html] of pages) {
    const file = join(ROOT, path);
    assert.ok(existsSync(file), `${path} is not committed — run node src/build.mjs`);
    assert.equal(readFileSync(file, "utf8"), html, `${path} is stale — run node src/build.mjs`);
  }
});
