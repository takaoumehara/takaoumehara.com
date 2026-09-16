#!/usr/bin/env node
// Evidence-gap audit: what a recruiter or hiring manager will ask about each
// record that the record cannot answer yet. Prints a table and writes
// docs/evidence-gaps.md — a questionnaire to fill in, one section per item.
//
//   node scripts/audit-evidence.mjs            write docs/evidence-gaps.md and print the summary
//   node scripts/audit-evidence.mjs --dry      print only
//   node scripts/audit-evidence.mjs --kind project   only that kind
//
// It never fills anything in. Where the record already implies an answer
// (a role titled "Solo", a team list of one) it says "suggested", and the
// person confirms by writing the field.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadLibrary, ROOT } from "../src/lib/load.mjs";
import { usableMetrics } from "../src/analyze/match.mjs";

const en = (v) => (v == null ? "" : typeof v === "string" ? v : v.en);

/** The questions, in the order a hiring conversation asks them. */
export const QUESTIONS = [
  {
    id: "level", weight: 3, field: "contribution.level",
    ask: { en: "How much of this was yours: solo / led / co-led / contributor / advised?", jp: "どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）" },
    missing: (it) => !it.contribution.level,
    suggest: (it) => {
      if (/\bsolo\b/i.test(it.role)) return "solo";
      if (["experiment", "tool", "venture"].includes(it.kind) && !(it.contribution.team?.length)) return "solo";
      if (/chair|founder|head|director/i.test(it.role) && it.kind === "project") return "led";
      return null;
    },
  },
  {
    id: "teamSize", weight: 2, field: "contribution.teamSize",
    ask: { en: "How many people did the core work, including you? (a number; omit if you do not know)", jp: "中心になって動いた人数（自分を含む）。分からなければ書かない" },
    missing: (it) => it.contribution.teamSize == null && it.contribution.level !== "solo" && !(["experiment", "tool"].includes(it.kind) && !(it.contribution.team?.length)),
    suggest: (it) => (it.contribution.team?.length === 0 ? "1 (the record lists no team)" : null),
  },
  {
    id: "period", weight: 2, field: "period",
    ask: { en: "When? { start: \"YYYY\" or \"YYYY-MM\", end?: … | \"present\" }", jp: "いつ。{ start: \"YYYY\" か \"YYYY-MM\", end?: … | \"present\" }" },
    missing: (it) => !it.period && it.kind !== "tool" && it.kind !== "experiment",
    suggest: () => null,
  },
  {
    id: "engagement", weight: 2, field: "engagement",
    ask: { en: "\"unstated\" prints nothing. Employee, freelance, volunteer, own-venture, open-source or concept?", jp: "\"unstated\" は何も表示されない。employee / freelance / volunteer / own-venture / open-source / concept のどれか" },
    missing: (it) => it.engagement === "unstated",
    suggest: () => null,
  },
  {
    id: "outcome", weight: 3, field: "outcome / metrics",
    ask: { en: "What happened afterwards? A measured number with its basis; a result someone stated; that it shipped; or honestly \"unknown\" with one line on why.", jp: "その後どうなったか。根拠つきの数字か、誰かが述べた結果か、出荷したという事実か、正直に \"unknown\" と理由 1 行" },
    missing: (it) => !usableMetrics(it).length && !it.outcome && it.kind !== "experiment" && it.kind !== "tool",
    suggest: (it) => (it.narrative?.impact ? "narrative.impact exists but carries no number: record it as outcome.status \"reported\"" : null),
  },
  {
    id: "unverified", weight: 1, field: "metrics[].confidence",
    ask: { en: "These figures are \"unverified\", so no page may show them. Where do they come from? Give the basis, or remove them.", jp: "この数字は \"unverified\" なので、どのページにも出せない。出どころを basis に書くか、消す" },
    missing: (it) => (it.metrics ?? []).some((m) => m.confidence === "unverified"),
    suggest: (it) => (it.metrics ?? []).filter((m) => m.confidence === "unverified").map((m) => `${m.id} (${m.value})`).join(", "),
  },
  {
    id: "constraints", weight: 2, field: "narrative.constraints",
    ask: { en: "What were the constraints — budget, time, tooling, politics, what was off the table?", jp: "制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと" },
    missing: (it) => it.kind === "project" && !(it.narrative?.constraints?.length),
    suggest: () => null,
  },
  {
    id: "decisions", weight: 3, field: "narrative.decisions",
    ask: { en: "One decision you made, why, and what it cost. [{ decision, why, tradeoff }]. This is what a design manager reads for judgment.", jp: "自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ" },
    missing: (it) => it.kind === "project" && !(it.narrative?.decisions?.length),
    suggest: () => null,
  },
  {
    id: "angles", weight: 1, field: "angles",
    ask: { en: "Only one framing exists, so every lens tells this the same way. Add one or two approved retellings (product / business / creative / leadership …).", jp: "語り口が 1 つしかないので、どのレンズでも同じ話になる。承認済みの言い換えを 1〜2 本（product / business / creative / leadership など）" },
    missing: (it) => it.kind === "project" && !(it.angles && Object.keys(it.angles).length),
    suggest: () => null,
  },
];

export function auditItem(item) {
  const gaps = [];
  for (const q of QUESTIONS) {
    if (!q.missing(item)) continue;
    gaps.push({ id: q.id, field: q.field, ask: q.ask, weight: q.weight, suggested: q.suggest(item) });
  }
  return gaps;
}

export function auditLibrary(lib, { kind } = {}) {
  const rows = [];
  for (const item of lib.evidence.values()) {
    if (kind && item.kind !== kind) continue;
    const gaps = auditItem(item);
    rows.push({ item, gaps, score: gaps.reduce((s, g) => s + g.weight, 0) });
  }
  // Worst first; recruiters look at projects, so those with the most missing answers lead.
  return rows.sort((a, b) => b.score - a.score || a.item.slug.localeCompare(b.item.slug));
}

export function renderQuestionnaire(rows, lib) {
  const lines = [];
  const totals = {};
  for (const r of rows) for (const g of r.gaps) totals[g.id] = (totals[g.id] ?? 0) + 1;
  lines.push("# 実績データの空欄 — 採用側が聞くこと、記録が答えられないこと", "");
  lines.push("> 生成: `node scripts/audit-evidence.mjs`。手で直さず、`src/data/**` の該当フィールドを埋めてから再生成する。", "");
  lines.push("採用担当（10〜30 秒）は **役割・規模・結果** を見る。現場の責任者（2〜5 分）は **制約と判断の理由** を見る。この文書は、その順に、各実績で記録に無いものを並べたもの。", "");
  lines.push("## 埋め方の原則", "");
  lines.push("- **嘘をつかない。** 数字が無い実績は無いままでよい。`outcome.status: \"unknown\"` と理由 1 行が、推測した数字より強い。");
  lines.push("- **「提案」は記録から読めることの言い換えにすぎない。** 確認して書くのは本人。書いた瞬間にサイトのカードに出る（`contribution.level` は役割フラグとして表示される）。");
  lines.push("- 書き方は `src/schema.d.ts` の `Contribution` / `outcome` / `narrative.decisions` を参照。", "");
  lines.push("## 集計", "");
  lines.push("| 質問 | 空欄の件数 |", "|---|---|");
  for (const q of QUESTIONS) lines.push(`| \`${q.field}\` — ${q.ask.jp} | ${totals[q.id] ?? 0} |`);
  lines.push("", `対象 ${rows.length} 件のうち、空欄が 1 つ以上ある実績: ${rows.filter((r) => r.gaps.length).length} 件`, "");
  lines.push("## 実績ごと（空欄の多い順）", "");
  for (const r of rows) {
    if (!r.gaps.length) continue;
    const it = r.item;
    lines.push(`### ${it.shortTitle ?? it.title} — \`${it.kind}/${it.slug}\``);
    lines.push(`役割: ${it.role} · ${it.engagement}${it.period ? ` · ${it.period.start}${it.period.end ? `–${it.period.end}` : ""}` : ""} · ファイル: \`${lib.sources.get(it.slug).replace(ROOT + "/", "")}\``, "");
    for (const g of r.gaps) {
      lines.push(`- [ ] **\`${g.field}\`** — ${g.ask.jp}${g.suggested ? `<br>　　提案（記録から読める範囲）: \`${g.suggested}\`` : ""}`);
    }
    lines.push("");
  }
  const complete = rows.filter((r) => !r.gaps.length);
  if (complete.length) lines.push("## 空欄なし", "", complete.map((r) => `- ${r.item.shortTitle ?? r.item.title} (\`${r.item.slug}\`)`).join("\n"), "");
  return lines.join("\n");
}

function main() {
  const dry = process.argv.includes("--dry");
  const kindIndex = process.argv.indexOf("--kind");
  const kind = kindIndex > -1 ? process.argv[kindIndex + 1] : undefined;
  const lib = loadLibrary();
  const rows = auditLibrary(lib, { kind });
  const width = Math.max(...rows.map((r) => r.item.slug.length));
  for (const r of rows) console.log(`${r.item.slug.padEnd(width)}  ${String(r.gaps.length).padStart(2)} gap(s)  ${r.gaps.map((g) => g.id).join(", ")}`);
  const withGaps = rows.filter((r) => r.gaps.length).length;
  console.log(`\n${withGaps} of ${rows.length} items have at least one gap.`);
  if (!dry) {
    const target = join(ROOT, "docs", "evidence-gaps.md");
    writeFileSync(target, renderQuestionnaire(rows, lib));
    console.log(`wrote docs/evidence-gaps.md`);
  }
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) main();
