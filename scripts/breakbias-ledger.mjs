#!/usr/bin/env node
// The BreakBias ledger for the Motion Lab sweep (docs/motion-lab/breakbias/).
//
//   node scripts/breakbias-ledger.mjs list [A|B|C|D]     compact listing for the kill / win-path pass
//   node scripts/breakbias-ledger.mjs cards [A|B|C|D]    judge-facing cards (no technique, element or derivation)
//   node scripts/breakbias-ledger.mjs merge               cells-*.jsonl + decisions-*.jsonl + judgments-*.jsonl → merged.json
//   node scripts/breakbias-ledger.mjs coverage            the coverage line (counts by status / kill code / win path)
//
// Cells are written by the generating agents (cells-<group>.jsonl) and never
// edited; every later decision is a separate line in decisions-<group>.jsonl
// ({ cell_id, status, kill_code?, reason?, prior_art_win?, win_note?, salvaged? })
// and every score a line in judgments-<group>.jsonl ({ cell_id, N, W, U, C, note }).
// A later line for the same cell_id overrides an earlier one (salvage, revisit).
// merged.json is what docs/product-idea.html embeds, so the maps and the
// board are views over one object and cannot drift from the ledger.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = new URL("../docs/motion-lab/breakbias/ledger/", import.meta.url).pathname;
const readJsonl = (name) => (existsSync(join(DIR, name)) ? readFileSync(join(DIR, name), "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);

const readAll = (re) => readdirSync(DIR).filter((f) => re.test(f)).sort().flatMap(readJsonl);
export const loadCells = () => readAll(/^cells-[A-DR]\.jsonl$/);

export function merged() {
  const cells = loadCells();
  const decisions = new Map(readAll(/^decisions-.*\.jsonl$/).map((d) => [d.cell_id, d]));
  const judgments = new Map(readAll(/^judgments-.*\.jsonl$/).map((j) => [j.cell_id, j]));
  return cells.map((c) => {
    const d = decisions.get(c.cell_id) ?? {};
    const j = judgments.get(c.cell_id);
    const out = { ...c, ...d };
    if (!d.status) out.status = "generated";
    if (j) {
      out.scores = { N: j.N, W: j.W, U: j.U, C: j.C };
      out.originality = j.N + j.W;
      out.viability = j.U + j.C;
      out.judge_note = j.note ?? "";
      out.effort = j.effort ?? null;
      out.status = "judged";
    }
    return out;
  });
}

const cut = (s, n) => (s == null ? "" : String(s).replace(/\s+/g, " ").slice(0, n));

// CLI only when run directly; breakbias-report.mjs imports merged() without this.
const [cmd, arg] = process.argv.slice(2);
const isMain = process.argv[1] && new URL(import.meta.url).pathname === (await import("node:path")).resolve(process.argv[1]);
if (!isMain) {
  // imported as a module
} else if (cmd === "list") {
  for (const c of loadCells()) {
    if (arg && !c.cell_id.startsWith(arg + "-")) continue;
    const pa = c.prior_art?.exists ? ` [既出: ${cut(c.prior_art.where, 40)}]` : "";
    console.log(`${c.cell_id} | ${cut(c.concept, 40)}${pa}\n   壊した: ${cut(c.broken_bias, 90)}\n   形: ${cut(c.impossible_form, 150)}\n   利用者: ${cut(c.benefit_user, 110)}`);
  }
} else if (cmd === "cards") {
  // Judge-facing cards: what the judge may see and nothing else (judge.md).
  // No element, technique, sub-method, impossible form or derivation — only
  // the idea as a reader would meet it. Killed cells are left out.
  for (const c of merged()) {
    if (arg && !c.cell_id.startsWith(arg + "-")) continue;
    if (c.status === "killed") continue;
    console.log(JSON.stringify({
      cell_id: c.cell_id,
      concept: c.concept,
      one_liner: c.broken_bias,
      user_value: c.benefit_user,
      business_value: c.benefit_provider,
      market_and_risks: c.market_feasibility,
      prior_art: c.prior_art?.exists ? `${c.prior_art.where} — 勝ち筋: ${c.prior_art_win ?? "なし"}${c.win_note ? `（${c.win_note}）` : ""}` : "なし",
      decision_conflict: c.decision_conflict ?? null,
      banned_rephrase: Boolean(c.banned_rephrase),
    }));
  }
} else if (cmd === "merge") {
  const m = merged();
  writeFileSync(join(DIR, "merged.json"), JSON.stringify(m, null, 1));
  console.log(`merged.json: ${m.length} cells`);
} else if (cmd === "coverage") {
  const m = merged();
  const by = (f) => m.reduce((acc, c) => ((acc[f(c) ?? "-"] = (acc[f(c) ?? "-"] ?? 0) + 1), acc), {});
  console.log("total", m.length);
  console.log("status", by((c) => c.status));
  console.log("kill_code", by((c) => c.kill_code));
  console.log("prior_art", m.filter((c) => c.prior_art?.exists).length, "win", by((c) => (c.prior_art?.exists ? c.prior_art_win ?? "untested" : undefined)));
  console.log("salvaged", m.filter((c) => c.salvaged).length);
} else {
  console.log("usage: list [A|B|C|D] | cards [A|B|C|D] | merge | coverage");
}
