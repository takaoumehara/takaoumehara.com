// Evidence matching: JobAnalysis × evidence library → ranked, classified proof.
//
//   scoreEvidence(analysis, lib)      → [{ item, score, strongWeight, matched, kind }]
//   selectProof(scored, analysis)     → 3–5 picks, ordered, each direct | transferable
//   capabilityGaps(analysis, lib)     → what the posting asks for that the record does not show
//   chooseAngle(item, analysis, lex)  → the approved framing that fits the posting, or undefined
//   chooseMetrics(item, analysis)     → metric ids a lens may highlight (never "unverified")
//
// Everything is a rule you can read. A "direct" match means the item holds
// STRONG evidence for one of the posting's top capabilities; "transferable"
// means the overlap is there, but at moderate strength or on lower-weight
// asks. The classification is printed on the card, so it has to be honest.

export const STRENGTH = { strong: 1, moderate: 0.55, adjacent: 0.2 };
// Client and employer work is what a hiring manager screens on first. The
// posting's own weights still let an experiment win when it asks for that.
export const KIND = { project: 1, venture: 0.85, tool: 0.6, experiment: 0.6 };

// A self-initiated concept is honest work, but a screener reads it after the
// paid and shipped kind. The flag on the card says which is which.
export const CREDIBILITY = { employee: 1, freelance: 1, volunteer: 1, unstated: 1, "own-venture": 0.9, "open-source": 0.9, concept: 0.8 };
export const DOMAIN_BONUS = 1.3;

export const usableMetrics = (item) => (item.metrics ?? []).filter((m) => m.confidence !== "unverified");

/** The posting's domains this record shares (context.industries vs lexicon domains). */
export function domainMatches(item, analysis) {
  const industries = (item.context?.industries ?? []).map((i) => i.toLowerCase());
  return (analysis.domains ?? []).filter((d) => d.industries.some((tag) => industries.some((i) => i.includes(tag.toLowerCase()))));
}

export function scoreEvidence(analysis, lib) {
  const weights = analysis.capabilityWeights;
  const rows = [];
  for (const item of lib.evidence.values()) {
    if (item.visibility === "private") continue;
    let base = 0;
    let strongWeight = 0;
    const matched = [];
    for (const claim of item.capabilities) {
      const w = weights[claim.id] ?? 0;
      if (!w) continue;
      base += w * STRENGTH[claim.strength];
      if (claim.strength === "strong") strongWeight += w;
      matched.push({ id: claim.id, weight: w, strength: claim.strength });
    }
    if (!base) continue;
    matched.sort((a, b) => b.weight * STRENGTH[b.strength] - a.weight * STRENGTH[a.strength] || a.id.localeCompare(b.id));
    const metricBonus = 1 + 0.05 * Math.min(3, usableMetrics(item).length);
    const caseStudyBonus = item.links?.caseStudy ? 1.05 : 1;
    const recent = item.period?.end === "present" || Number(String(item.period?.end ?? item.period?.start ?? 0).slice(0, 4)) >= new Date().getFullYear() - 2;
    const recencyBonus = recent ? 1.05 : 1;
    const domains = domainMatches(item, analysis);
    const domainBonus = domains.length ? DOMAIN_BONUS : 1;
    const score = base * (KIND[item.kind] ?? 0.6) * (CREDIBILITY[item.engagement] ?? 1) * metricBonus * caseStudyBonus * recencyBonus * domainBonus;
    rows.push({ item, score: Number(score.toFixed(4)), base: Number(base.toFixed(4)), strongWeight: Number(strongWeight.toFixed(3)), matched, domains: domains.map((d) => d.id) });
  }
  return rows.sort((a, b) => b.score - a.score || a.item.slug.localeCompare(b.item.slug));
}

export const topCapabilities = (analysis, n = 3) => Object.keys(analysis.capabilityWeights).slice(0, n);

/**
 * "Direct" is printed on the card, so it is earned, not granted: strong evidence
 * on at least two of the posting's five heaviest asks, or on the single heaviest
 * one plus the posting's domain. Everything else is transferable.
 */
export function classify(row, analysis) {
  const top5 = topCapabilities(analysis, 5);
  const strongTop = row.matched.filter((m) => m.strength === "strong" && top5.includes(m.id)).map((m) => m.id);
  if (strongTop.length >= 2) return "direct";
  if (strongTop.includes(top5[0]) && row.domains?.length) return "direct";
  return "transferable";
}

/**
 * Greedy, coverage-aware selection. After the first pick, a candidate's score is
 * discounted by how much of its strong evidence the picks already cover, so five
 * cards do not tell the same story five times. Between 3 and `max` picks; stops
 * early when the next candidate is a distant also-ran.
 */
export function selectProof(scored, analysis, { min = 3, max = 5, floor = 0.25, discount = 0.5 } = {}) {
  const weights = analysis.capabilityWeights;
  const top = new Set(topCapabilities(analysis, 6));
  const picks = [];
  const covered = new Set();
  const remaining = [...scored];
  while (picks.length < max && remaining.length) {
    let best = null;
    for (const row of remaining) {
      // Overlap is measured on the posting's heaviest asks only: two cards that
      // both prove "prototyping" are redundant; two that share a minor skill are not.
      const strong = row.matched.filter((m) => m.strength === "strong" && top.has(m.id));
      const total = strong.reduce((s, m) => s + weights[m.id], 0);
      // No strong evidence on any heavy ask is as redundant as repeating one:
      // both add nothing the reader was screening for.
      const overlap = total ? strong.filter((m) => covered.has(m.id)).reduce((s, m) => s + weights[m.id], 0) / total : 1;
      // A record from the posting's own domain keeps its bonus through the discount.
      const adjusted = row.score * (1 - discount * overlap) * (row.domains?.length ? 1 + (DOMAIN_BONUS - 1) * discount * overlap : 1);
      if (!best || adjusted > best.adjusted || (adjusted === best.adjusted && row.item.slug < best.row.item.slug)) best = { row, adjusted };
    }
    if (picks.length >= min && best.adjusted < floor * picks[0].adjusted) break;
    picks.push(best);
    for (const m of best.row.matched) if (m.strength === "strong") covered.add(m.id);
    remaining.splice(remaining.indexOf(best.row), 1);
  }
  const classified = picks.map(({ row, adjusted }) => ({ ...row, adjusted: Number(adjusted.toFixed(4)), match: classify(row, analysis) }));
  // Direct evidence leads; within a class, keep the coverage order.
  return [...classified.filter((p) => p.match === "direct"), ...classified.filter((p) => p.match !== "direct")];
}

/** For every capability the posting cares about: does the whole library back it, and how strongly? */
export function capabilityCoverage(analysis, lib, { threshold = 0.3 } = {}) {
  const rows = [];
  for (const [id, weight] of Object.entries(analysis.capabilityWeights)) {
    if (weight < threshold) continue;
    let best = "none";
    const holders = { strong: [], moderate: [] };
    for (const item of lib.evidence.values()) {
      if (item.visibility === "private") continue;
      const claim = item.capabilities.find((c) => c.id === id);
      if (!claim || claim.strength === "adjacent") continue;
      holders[claim.strength].push(item.slug);
      if (claim.strength === "strong") best = "strong";
      else if (best !== "strong") best = "moderate";
    }
    rows.push({ id, weight, status: best === "strong" ? "direct" : best === "moderate" ? "transferable" : "gap", strong: holders.strong.sort(), moderate: holders.moderate.sort() });
  }
  return rows;
}

export const capabilityGaps = (analysis, lib, opts) => capabilityCoverage(analysis, lib, opts).filter((r) => r.status !== "direct");

/** The approved framing to show, chosen by the posting's leading themes. Undefined = the record's own card line. */
export function chooseAngle(item, analysis, lexicon) {
  const angles = Object.keys(item.angles ?? {});
  if (!angles.length) return undefined;
  for (const theme of analysis.themes.filter((t) => !t.quiet)) {
    const preferred = lexicon.themes[theme.id]?.angles ?? [];
    const hit = preferred.find((a) => angles.includes(a));
    if (hit) return hit;
  }
  return undefined;
}

/** Up to `max` metrics a lens may highlight: stated before approximate, never unverified. */
export function chooseMetrics(item, { max = 2 } = {}) {
  const order = { stated: 0, approximate: 1 };
  return usableMetrics(item)
    .map((m, index) => ({ m, index }))
    .sort((a, b) => order[a.m.confidence] - order[b.m.confidence] || a.index - b.index)
    .slice(0, max)
    .map(({ m }) => m.id);
}

/** Named tools / credentials the posting asks for, looked up in the record. */
export function requirementCheck(analysis, lib, { phraseRegex, evidenceCorpus }) {
  return analysis.requirements.map((req) => {
    const where = [];
    for (const item of lib.evidence.values()) {
      if (item.visibility === "private") continue;
      const corpus = evidenceCorpus(item);
      if (req.patterns.some((p) => phraseRegex(p, { isPattern: true }).test(corpus))) where.push(item.slug);
    }
    return { name: req.name, asked: req.found, screen: Boolean(req.screen), foundIn: where.sort() };
  });
}
