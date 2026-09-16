// The Fit Ledger: one row per line of the posting's requirements, answered
// with what the person actually did — a verbatim line from contribution.mine —
// and a level the record supports. The level is a rule (validate.mjs:
// fitCeiling), never a judgment, and the person can lower it but not raise it.
//
//   buildFit({ analysis, picks, lib, lexicon, seenAt }) → lens.fit
//
// No filesystem access: this runs in the browser too (Phase 3b Studio).
import { phraseRegex } from "./jd.mjs";
import { fitCeiling, FIT_LEVELS } from "../validate.mjs";

const STOP = new Set(("a an the and or of to in on for with at by from as is are be been being was were this that these those you your we our it its " +
  "experience experienced experiences ability able strong excellent comfortable comfort track record years year plus who what which where when how " +
  "work working works worked including include includes other others such more most very can will would should must have has had do does did " +
  "role team teams product products design designs designer designers designing across within into out over under about than also not").split(/\s+/));

/** Crude English stemming so "prototyping" meets "prototypes" and "led" meets "lead". */
export function stem(word) {
  let w = word.toLowerCase();
  if (w.length <= 3) return w;
  for (const suffix of ["ically", "ations", "ation", "ingly", "ities", "ness", "ments", "ment", "ings", "ing", "ers", "ies", "ed", "er", "es", "ly", "s"]) {
    if (w.endsWith(suffix) && w.length - suffix.length >= 3) { w = w.slice(0, -suffix.length); break; }
  }
  if (w === "led") w = "lead";
  return w;
}

export function contentTokens(text) {
  const out = new Set();
  for (const raw of String(text).toLowerCase().match(/[a-z][a-z0-9'’+\-\/]*/g) ?? []) {
    const word = raw.replace(/['’]s$/, "");
    if (word.length < 3 || STOP.has(word)) continue;
    out.add(stem(word));
  }
  return out;
}

/** Capabilities a single posting line names, from the same lexicon the analysis used. */
export function lineCapabilities(line, lexicon, { max = 3 } = {}) {
  const scores = [];
  for (const [capId, phrases] of Object.entries(lexicon.capabilities)) {
    let score = 0;
    for (const { p, w } of phrases) if (phraseRegex(p).test(line)) score += w;
    if (score > 0) scores.push({ id: capId, score });
  }
  scores.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  // A capability that one stray word dragged in ("workflows" → operations) must
  // not open the row to unrelated evidence: keep those near the line's strongest.
  const top = scores[0]?.score ?? 0;
  return scores.filter((s) => s.score >= 0.35 * top).slice(0, max).map((s) => s.id);
}

/** Domain words (payments, education, …) the ask uses, so a quoted line in the same domain counts. */
function askDomains(ask, lexicon) {
  return Object.entries(lexicon.domains ?? {})
    .filter(([id, dom]) => !id.startsWith("$") && dom.patterns.some((p) => phraseRegex(p, { isPattern: true }).test(ask)))
    .map(([id, dom]) => ({ id, patterns: dom.patterns }));
}

/** How well one contribution.mine line answers one posting line. */
export function lineMatch(ask, mine, capIds, lexicon, domains = askDomains(ask, lexicon)) {
  const a = contentTokens(ask);
  const m = contentTokens(mine);
  let shared = 0;
  for (const t of a) if (m.has(t)) shared += 1;
  let phrases = 0;
  const seen = new Set();
  for (const capId of capIds) {
    for (const { p } of lexicon.capabilities[capId] ?? []) {
      if (seen.has(p)) continue;
      if (phraseRegex(p).test(mine)) { phrases += 1; seen.add(p); }
    }
  }
  let domainHits = 0;
  for (const dom of domains) if (dom.patterns.some((p) => phraseRegex(p, { isPattern: true }).test(mine))) domainHits += 1;
  return { shared, phrases, domainHits, score: shared + 1.5 * phrases + 1.5 * domainHits };
}

const MIN_LINE_SCORE = 2; // two shared content words, or one capability phrase plus a word

const STRENGTH_RANK = { strong: 3, moderate: 2, adjacent: 1 };

/**
 * For one posting line: the best evidence and, when one exists, the verbatim
 * contribution line that answers it. Any public record may answer; a record
 * already on the page is preferred.
 */
export function answerLine(ask, capIds, { lib, lexicon, pickIds = new Set(), max = 2 }) {
  const candidates = [];
  const domains = askDomains(ask, lexicon);
  for (const item of lib.evidence.values()) {
    if (item.visibility === "private") continue;
    let strength = 0;
    for (const c of item.capabilities) if (capIds.includes(c.id)) strength = Math.max(strength, STRENGTH_RANK[c.strength]);
    if (!strength) continue;
    let best = null;
    for (const line of item.contribution.mine) {
      const m = lineMatch(ask, line, capIds, lexicon, domains);
      if (!best || m.score > best.score) best = { line, ...m };
    }
    const hasLine = best && best.score >= MIN_LINE_SCORE;
    // Shipped, paid or volunteer work answers a screener before a self-initiated concept does.
    const credibility = item.engagement === "concept" ? -1 : 0;
    const score = strength * 2 + (hasLine ? best.score : 0) + (pickIds.has(item.slug) ? 1.5 : 0) + credibility;
    candidates.push({ id: item.slug, strength, line: hasLine ? best.line : undefined, lineScore: hasLine ? best.score : 0, score });
  }
  candidates.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const [first, ...rest] = candidates;
  if (!first) return [];
  // A second citation earns its place only with a quoted line that clearly answers the ask.
  const second = rest.find((c) => c.line && c.lineScore >= MIN_LINE_SCORE + 1);
  return [first, ...(second && max > 1 ? [second] : [])].map(({ id, line }) => (line ? { id, line } : { id }));
}

/** Requirement lines worth a row: those that name a capability. Screening lines (years, degree) are set aside. */
export function ledgerLines(analysis, lexicon, { max = 12 } = {}) {
  const screen = lexicon.requirements.items.filter((r) => r.screen).flatMap((r) => r.patterns);
  const rows = [];
  const skipped = [];
  for (const line of analysis.lines.filter((l) => l.section === "requirements" || l.section === "preferred")) {
    const capabilities = lineCapabilities(line.text, lexicon);
    // "5+ years of …" is a screening line: the record cannot answer "how many
    // years" with a quoted deed, and a level on it would misread the ask.
    const isScreen = screen.some((p) => phraseRegex(p, { isPattern: true }).test(line.text));
    if (isScreen) { skipped.push({ text: line.text, why: "screening criterion (years, degree, portfolio) — answered in the résumé" }); continue; }
    if (!capabilities.length) { skipped.push({ text: line.text, why: "names no capability the lexicon knows" }); continue; }
    rows.push({ ask: line.text, section: line.section, capabilities });
  }
  return { rows: rows.slice(0, max), skipped: [...skipped, ...rows.slice(max).map((r) => ({ text: r.ask, why: "beyond the first 12 rows" }))] };
}

export function buildFit({ analysis, picks, lib, lexicon, seenAt, requirements = [] }) {
  const pickIds = new Set(picks.map((p) => p.item.slug));
  const { rows, skipped } = ledgerLines(analysis, lexicon);
  const fitRows = rows.map((row) => {
    const evidence = answerLine(row.ask, row.capabilities, { lib, lexicon, pickIds });
    const level = fitCeiling({ ...row, evidence }, lib);
    return { ask: row.ask, section: row.section, capabilities: row.capabilities, level, evidence };
  });
  return {
    source: { title: analysis.title, company: analysis.company, ...(seenAt ? { seenAt } : {}) },
    rows: fitRows,
    requirements: requirements.filter((r) => !r.screen).map((r) => ({ name: r.name, asked: r.asked, foundIn: r.foundIn })),
    skipped,
  };
}

export { FIT_LEVELS };
