// The pitch report: what the posting asks for, what the record shows, what it
// does not, and what to fill in before publishing. Markdown for the person.
// Written in English so anyone can reuse the engine; the lens itself is bilingual.
import { capabilityCoverage, usableMetrics } from "./match.mjs";

const pct = (n) => `${Math.round(n * 100)}%`;
const en = (v) => (v == null ? "" : typeof v === "string" ? v : v.en);

export function evidenceGapsFor(item) {
  const gaps = [];
  if (!item.contribution.level) gaps.push("contribution.level — solo / led / co-led / contributor / advised. A hiring manager asks this first.");
  if (item.contribution.teamSize == null && item.contribution.level !== "solo") gaps.push("contribution.teamSize — how many people did the core work.");
  if (!item.period) gaps.push("period — when. A card with no dates reads as unfinished.");
  if (item.engagement === "unstated") gaps.push('engagement — "unstated" prints nothing; was this employee, freelance, volunteer or a concept?');
  if (!usableMetrics(item).length && !item.outcome) gaps.push("outcome — no measured or stated result on record. If none exists, say so with outcome.status = \"unknown\" and a one-line note; do not invent one.");
  if ((item.metrics ?? []).some((m) => m.confidence === "unverified")) gaps.push(`metrics — ${item.metrics.filter((m) => m.confidence === "unverified").map((m) => m.id).join(", ")} are unverified and cannot be highlighted; find the basis or drop them.`);
  if (item.kind === "project" && !item.narrative?.constraints?.length) gaps.push("narrative.constraints — the limits you worked under. This is what a design manager reads for judgment.");
  if (item.kind === "project" && !item.narrative?.decisions?.length) gaps.push("narrative.decisions — one decision, why, and what it cost. The 'Why', not the 'What'.");
  if (!item.angles || !Object.keys(item.angles).length) gaps.push("angles — only one framing exists, so every lens must tell this the same way.");
  return gaps;
}

export function renderReport({ company, slug, analysis, picks, lib, lensPath, source, requirements, scoredCount, fit = null }) {
  const coverage = capabilityCoverage(analysis, lib);
  const label = (id) => en(lib.capabilities.capabilities.find((c) => c.id === id)?.label ?? id);
  const gaps = coverage.filter((r) => r.status === "gap");
  const partial = coverage.filter((r) => r.status === "transferable");
  const lines = [];
  const push = (...xs) => lines.push(...xs);

  push(`# Pitch report — ${company}`, "");
  push(`| | |`, `|---|---|`);
  push(`| Posting | ${analysis.title} (${en(analysis.seniority.label)}) |`);
  push(`| Source | ${source} |`);
  push(`| Length | ${analysis.words} words · requirements ${analysis.sections.requirements} lines · responsibilities ${analysis.sections.responsibilities} lines |`);
  push(`| Lens draft | \`${lensPath}\` (status: draft — not built until you publish it) |`);
  push(`| Evidence scored | ${scoredCount} of ${lib.evidence.size} items matched at least one capability |`, "");

  push(`## 1. What the posting is about`, "");
  push(`Top themes, from the capability weights below. These become the "focus on …" phrase in the lens note.`, "");
  for (const t of analysis.themes.filter((t) => !t.quiet).slice(0, 5)) push(`- **${en(t.label)}** — ${t.score.toFixed(2)} (${t.capabilities.map(label).join(", ")})`);
  push("", `## 2. Capability weights vs. the record`, "");
  push(`| Capability | Weight | Record | Backed by |`, `|---|---|---|---|`);
  for (const row of coverage) {
    const backed = row.status === "direct" ? `strong: ${row.strong.slice(0, 4).join(", ")}${row.strong.length > 4 ? " …" : ""}` : row.status === "transferable" ? `moderate only: ${row.moderate.slice(0, 4).join(", ")}` : "—";
    const fired = (analysis.capabilityEvidence[row.id] ?? []).slice(0, 3).map((f) => `"${f.phrase}"×${f.hits}`).join(" ");
    push(`| ${label(row.id)} | ${pct(row.weight)} | ${row.status.toUpperCase()} | ${backed} <br><small>${fired}</small> |`);
  }
  push("", `## 3. Selected proof (${picks.length})`, "");
  push(`Ordered as they will appear. "Direct" = strong evidence on at least two of the posting's five heaviest asks (or on the heaviest one, in the posting's own domain). "Transferable" = real overlap, but narrower or at moderate strength — the card says so; do not upgrade it by hand.`, "");
  if (analysis.domains?.length) push(`Domain words in the posting: ${analysis.domains.map((d) => `${en(d.label)} (×${d.hits})`).join(", ")}. A record from the same domain scores higher and keeps that through the diversity discount.`, "");
  for (const [i, p] of picks.entries()) {
    const it = p.item;
    push(`### ${i + 1}. ${it.shortTitle ?? it.title} — ${p.match.toUpperCase()}`);
    push(`- Record: \`${it.kind}/${it.slug}\` · role: ${it.role} · engagement: ${it.engagement}${it.period ? ` · ${it.period.start}${it.period.end ? `–${it.period.end}` : ""}` : ""}`);
    push(`- Why: ${p.matched.slice(0, 4).map((m) => `${label(m.id)} (${m.strength}, weight ${pct(m.weight)})`).join("; ")}`);
    push(`- Score ${p.score} → after coverage discount ${p.adjusted}${p.domains?.length ? ` · domain match: ${p.domains.join(", ")}` : ""}`);
    const angle = Object.keys(it.angles ?? {});
    push(`- Framings on record: ${angle.length ? angle.join(", ") : "none (card line / summary only)"}`);
    const metrics = usableMetrics(it);
    push(`- Metrics a lens may show: ${metrics.length ? metrics.map((m) => `${m.value} ${en(m.label)} [${m.confidence}]`).join("; ") : "none on record"}`);
    if (it.contribution.notMine?.length) push(`- Never claim: ${it.contribution.notMine.join(", ")}`);
    const eg = evidenceGapsFor(it);
    if (eg.length) { push(`- **A hiring manager will ask, and the record cannot answer yet:**`); for (const g of eg) push(`  - ${g}`); }
    push("");
  }

  if (fit) {
    push(`## 3b. Fit Ledger — each requirement line, answered`, "");
    push(`Rendered on the page as "What you asked for · what I did". Levels are computed (validate.mjs: fitCeiling); you may lower one or swap the quoted line for another verbatim contribution.mine line, never raise it.`, "");
    push(`| The posting says | Level | What I did (verbatim) | Record |`, `|---|---|---|---|`);
    for (const row of fit.rows) {
      const ev = row.evidence?.length ? row.evidence.map((e) => `${e.line ? `"${e.line}"` : "(no specific line)"} — \`${e.id}\``).join("<br>") : "—";
      push(`| ${row.ask} | **${row.level}** | ${ev.split(" — ")[0]} | ${row.evidence?.map((e) => `\`${e.id}\``).join(", ") || "—"} |`);
    }
    if (fit.skipped?.length) { push("", `Lines not in the ledger:`); for (const sk of fit.skipped) push(`- "${sk.text.slice(0, 100)}${sk.text.length > 100 ? "…" : ""}" — ${sk.why}`); }
    push("");
  }
  push(`## 4. Gaps — what the posting asks for that the record does not show`, "");
  if (!gaps.length && !partial.length) push(`None at the 30% threshold. Every capability the posting weights is backed by strong evidence somewhere in the record.`);
  if (gaps.length) {
    push(`**No evidence at all** (these must not appear in the lens; address them in the cover letter or the interview, honestly):`, "");
    for (const g of gaps) push(`- ${label(g.id)} — weight ${pct(g.weight)}`);
    push("");
  }
  if (partial.length) {
    push(`**Moderate evidence only** (the lens may list them, but a card cannot call them direct):`, "");
    for (const g of partial) push(`- ${label(g.id)} — weight ${pct(g.weight)} · moderate on ${g.moderate.join(", ")}`);
    push("");
  }

  push(`## 5. Named requirements`, "");
  const lookup = requirements.filter((r) => !r.screen);
  const screen = requirements.filter((r) => r.screen);
  if (!requirements.length) push(`The posting names no specific tools, methods or credentials the lexicon knows.`);
  if (lookup.length) {
    push(`| The posting says | In the record? |`, `|---|---|`);
    for (const r of lookup) push(`| ${r.name} (${r.asked.join(", ")}) | ${r.foundIn.length ? r.foundIn.join(", ") : "**not mentioned anywhere** — if true, it is a gap; if you have it, add it to the record first"} |`);
    push("");
  }
  if (screen.length) push(`Screening criteria to answer in the résumé, not on the page: ${screen.map((r) => `${r.name} (${r.asked.join(", ")})`).join("; ")}.`);
  push("", `## 6. Before publishing`, "");
  push(`1. Open \`${lensPath}\`. Rewrite \`hero.body\`, \`hero.note\`, the proof \`lede\` and \`cta\` in your own voice, in both languages. Keep every \`id\`, \`angle\` and \`metricIds\` — or change them to other values that exist on the record.`);
  push(`2. Fill the record gaps listed under each proof item (\`src/data/**\`), then re-run this script if you want the draft to pick them up.`);
  push(`3. \`node src/build.mjs --preview\` writes \`lens/_preview/${slug}/index.html\` (git-ignored). Open it. Check the 10-second read: eyebrow, first card, its flag and its numbers.`);
  push(`4. Set \`"status": "published"\`, run \`node src/build.mjs\`, then \`npm test\`. The Claim Guard and NotMine Guard run on everything you wrote.`);
  push(`5. Commit the JSON and the generated \`lens/${slug}/index.html\` together. The page is \`/lens/${slug}\`; it is \`noindex\` — share the link directly.`);
  return lines.join("\n") + "\n";
}
