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
const escapeHtml = (value) => value
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

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
  // A magnitude suffix cannot be the first letter of the next word: "30 minutes"
  // is thirty, not thirty million. This read as "30m" and matched nothing.
  assert.deepEqual([...numericTokens("a question worth 30 minutes")], ["30"]);
  assert.deepEqual([...numericTokens("10M users")], ["10M"]);
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
  const en = (value) => (typeof value === "string" ? value : value.en);
  assert.ok(home.includes(escapeHtml(en(festival.angles.business)).slice(0, 60)));
  assert.ok(creative.includes(escapeHtml(en(festival.angles.creative)).slice(0, 60)));
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

// ── Japanese is not an afterthought ─────────────────────────────────────────
//
// Before these tests, 216 of 273 reader-facing strings were plain English, so
// the Japanese page rendered 79% English. A plain string shows in BOTH
// languages, which makes the leak invisible until someone reads the page in
// Japanese. These tests make it visible in CI instead.
// The rules the Japanese itself follows are in docs/japanese-voice.md.

/** Walk the reader-facing Localized fields and report which ones carry no Japanese. */
function englishOnlyPaths(lib, lenses) {
  const missing = [];
  const check = (path, value) => {
    if (value == null) return;
    if (typeof value === "string") { missing.push(path); return; }
    if (!value.jp) missing.push(path);
  };
  const checkMany = (path, obj) => {
    for (const [key, value] of Object.entries(obj ?? {})) check(`${path}.${key}`, value);
  };

  for (const [slug, item] of lib.evidence) {
    check(`${slug}.summary`, item.summary);
    checkMany(`${slug}.angles`, item.angles);
    for (const metric of item.metrics ?? []) check(`${slug}.metrics[${metric.id}].label`, metric.label);
    for (const field of ["thesis", "experiment", "question"]) {
      if (item[field] != null) check(`${slug}.${field}`, item[field]);
    }
  }
  // Capability labels stay English on purpose (0→1, UX, AI read as terms, not as
  // untranslated text). Their notes are what has to carry the Japanese.
  for (const cap of lib.capabilities.capabilities) check(`capability:${cap.id}.note`, cap.note);
  for (const group of lib.capabilities.groups) check(`capability-group:${group.id}.label`, group.label);
  for (const chapter of lib.chapters) { check(`chapter:${chapter.id}.label`, chapter.label); check(`chapter:${chapter.id}.summary`, chapter.summary); }
  for (const role of lib.roles) check(`role:${role.id}.summary`, role.summary);
  for (const thesis of lib.theses) { check(`thesis:${thesis.id}.statement`, thesis.statement); check(`thesis:${thesis.id}.body`, thesis.body); }
  check("profile.tagline", lib.profile.tagline);
  check("profile.location", lib.profile.location);
  check("profile.studio.note", lib.profile.studio.note);
  lib.profile.positioning.forEach((p, i) => check(`profile.positioning[${i}]`, p));

  for (const lens of lenses) {
    for (const field of ["eyebrow", "title", "body", "note"]) {
      if (lens.hero?.[field] != null) check(`lens:${lens.slug}.hero.${field}`, lens.hero[field]);
    }
    for (const field of ["title", "body"]) {
      if (lens.cta?.[field] != null) check(`lens:${lens.slug}.cta.${field}`, lens.cta[field]);
    }
    check(`lens:${lens.slug}.cta.primary.label`, lens.cta.primary.label);
    if (lens.cta.secondary) check(`lens:${lens.slug}.cta.secondary.label`, lens.cta.secondary.label);
    if (lens.identity?.tagline != null) check(`lens:${lens.slug}.identity.tagline`, lens.identity.tagline);
    for (const [index, section] of lens.sections.entries()) {
      for (const field of ["title", "lede"]) {
        if (section[field] != null) check(`lens:${lens.slug}.sections[${index}].${field}`, section[field]);
      }
      for (const ref of section.items ?? []) {
        if (typeof ref === "string") continue;
        for (const field of ["emphasis", "summaryOverride"]) {
          if (ref[field] != null) check(`lens:${lens.slug}.${ref.id}.${field}`, ref[field]);
        }
      }
    }
  }
  return missing;
}

test("every reader-facing string carries Japanese, so the JP page is not English", () => {
  const missing = englishOnlyPaths(lib, lenses);
  assert.deepEqual(missing, [], `no Japanese on ${missing.length} field(s):\n  ${missing.join("\n  ")}`);
});

test("the Japanese avoids the transliterations that made it unreadable", () => {
  // docs/japanese-voice.md §3.2. Each of these is an English job-title or
  // buzzword written in katakana: it occupies space without carrying meaning.
  const banned = [
    "ベンチャービルディング", "エグゼクティブアドバイザリー", "フラクショナル",
    "ビジネストランスフォーメーション", "ステークホルダー", "ソリューション",
    "オペレーション", "コミットメント", "アサイン", "エンゲージメント",
    "三十分",  // a workaround for the Claim Guard; the guard now allows "30"
  ];
  const offenders = [];
  const scan = (path, value) => {
    if (value == null) return;
    if (typeof value === "string") return;              // plain strings are English by definition
    if (Array.isArray(value)) return value.forEach((v, i) => scan(`${path}[${i}]`, v));
    if (typeof value !== "object") return;
    if (typeof value.jp === "string") {
      for (const word of banned) if (value.jp.includes(word)) offenders.push(`${path}: 「${word}」`);
      return;
    }
    for (const [key, v] of Object.entries(value)) scan(`${path}.${key}`, v);
  };
  for (const [slug, item] of lib.evidence) scan(slug, item);
  scan("profile", lib.profile);
  scan("capabilities", lib.capabilities);
  lib.theses.forEach((t) => scan(`thesis:${t.id}`, t));
  lib.chapters.forEach((c) => scan(`chapter:${c.id}`, c));
  lib.roles.forEach((r) => scan(`role:${r.id}`, r));
  lenses.forEach((l) => scan(`lens:${l.slug}`, l));
  assert.deepEqual(offenders, [], `transliterated katakana in the Japanese:\n  ${offenders.join("\n  ")}`);
});

test("Latin and Japanese are separated by a space, the way the rest of the site sets them", () => {
  // The site's own convention, set by the hand-built pages: 「ほぼ AI ではありません」
  // 「42 名・6 ブランド」. Without it the machine-written copy reads as 「COVIDで2年」.
  // Punctuation is excluded — 「AI 。」 would be wrong.
  const JP = "\\u3041-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u4E00-\\u9FFF\\u3005-\\u3007";
  const unspaced = new RegExp(`(?:[A-Za-z0-9%)\\]][${JP}]|[${JP}][A-Za-z0-9$(\\[])`);
  const offenders = [];
  const scan = (path, value) => {
    if (value == null || typeof value === "string") return;
    if (Array.isArray(value)) return value.forEach((v, i) => scan(`${path}[${i}]`, v));
    if (typeof value !== "object") return;
    if (typeof value.jp === "string") {
      const hit = value.jp.match(unspaced);
      if (hit) offenders.push(`${path}: 「${hit[0]}」`);
      return;
    }
    for (const [key, v] of Object.entries(value)) scan(`${path}.${key}`, v);
  };
  for (const [slug, item] of lib.evidence) scan(slug, item);
  scan("profile", lib.profile);
  scan("capabilities", lib.capabilities);
  lib.theses.forEach((t) => scan(`thesis:${t.id}`, t));
  lib.chapters.forEach((c) => scan(`chapter:${c.id}`, c));
  lib.roles.forEach((r) => scan(`role:${r.id}`, r));
  lenses.forEach((l) => scan(`lens:${l.slug}`, l));
  assert.deepEqual(offenders, [], `missing space between Latin and Japanese:\n  ${offenders.join("\n  ")}`);
});

test("the Claim Guard no longer forces bad writing to get past it", () => {
  // It rejected the "30" in "a question worth thirty minutes", which is not a
  // claim about experience. A guard that degrades the copy is a broken guard.
  const lens = clone(byslug("default"));
  lens.cta.body = { en: "Or a question worth 30 minutes.", jp: "あるいは、30 分話すだけの価値がある問い。" };
  assert.deepEqual(validateLens(lens, lib).filter((e) => /Claim Guard/.test(e)), []);

  // It must still reject an invented achievement.
  lens.cta.body = { en: "I have led 400 designers.", jp: "400 人のデザイナーを率いた。" };
  assert.ok(validateLens(lens, lib).some((e) => /Claim Guard/.test(e)));
});

test("nothing can out-specify the language switch", () => {
  // `.venture-row dd .t-en` scored the same specificity as `html.lang-jp .t-en`
  // and came later in the file, so it won — and the Japanese page showed the
  // English text for all four ventures. Layout rules that touch .t-en or .t-jp
  // must wrap them in :where(), which contributes no specificity.
  const css = readFileSync(join(ROOT, "src", "render", "lens.css"), "utf8");
  const offenders = [];
  for (const match of css.matchAll(/^([^{@\n][^{\n]*)\{/gm)) {
    const selector = match[1].trim();
    if (selector.startsWith("html.lang-jp") || selector === ".t-jp") continue;
    if (/(^|[\s,])\.t-(en|jp)\b/.test(selector)) offenders.push(selector);
  }
  assert.deepEqual(offenders, [], `these must wrap .t-en / .t-jp in :where():\n  ${offenders.join("\n  ")}`);
});
