#!/usr/bin/env node
// Adaptive Pitch Engine (Phase 2): a job description in, a Lens draft out.
//
//   node scripts/generate-pitch.mjs --url "https://…/jobs/123"                      # fetch the posting
//   node scripts/generate-pitch.mjs --company "Stripe" --jd path/to/jd.txt         # from a file
//   node scripts/generate-pitch.mjs --company "Stripe"                             # paste it, then Ctrl-D
//   cat jd.txt | node scripts/generate-pitch.mjs --company "Stripe"                # or pipe it
//
// Options
//   --company <name>   The company. Guessed from the URL or the page when omitted; required otherwise.
//   --role <title>     The job title, when the posting's own is unclear.
//   --slug <slug>      Lens slug (default: the company, kebab-cased). Page: /lens/<slug>
//   --max <n>          Proof cards, 3–5 (default 5)
//   --force            Overwrite an existing src/lenses/<slug>.json
//   --publish          Write status "published" instead of "draft" (you still have to build)
//   --out-dir <dir>    Write everywhere under <dir> instead of the repo (tests)
//   --json             Print the analysis as JSON on stdout instead of the summary
//   --seen <date>      Date the posting was seen (default: today); printed under the Fit Ledger
//
// Writes
//   src/lenses/<slug>.json          the Lens draft (validated with src/validate.mjs before writing)
//   src/pitches/<slug>/jd.txt       the posting as analysed
//   src/pitches/<slug>/analysis.json  capability weights, themes, picks
//   src/pitches/<slug>/report.md    what matched, what did not, what to fill in
//
// Nothing here calls a model. The analysis is a lexicon (src/analyze/lexicon.json),
// the selection is a rule, and the draft's sentences are the record's own or a
// template. See docs/adaptive-portfolio-architecture.md §16.
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadLibrary, ROOT } from "../src/lib/load.mjs";
import { validateLens, evidenceCorpus } from "../src/validate.mjs";
import { analyzeJob, guessCompany, slugify, phraseRegex, MIN_WORDS } from "../src/analyze/jd.mjs";
import { loadLexicon, readJobInput } from "../src/analyze/intake.node.mjs";
import { scoreEvidence, selectProof, requirementCheck } from "../src/analyze/match.mjs";
import { draftLens } from "../src/analyze/draft.mjs";
import { renderReport } from "../src/analyze/report.mjs";

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith("--")) { args._.push(a); continue; }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (["force", "publish", "json", "help"].includes(key)) args[key] = true;
    else if (next == null || next.startsWith("--")) args[key] = true;
    else { args[key] = next; i += 1; }
  }
  return args;
}

async function readStdin({ interactive }) {
  if (interactive) {
    process.stderr.write("Paste the job description below. When done, press Enter, then Ctrl-D (or type END on its own line).\n\n");
  }
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
    if (interactive && /(^|\n)END\s*$/.test(Buffer.concat(chunks).toString("utf8"))) break;
  }
  return Buffer.concat(chunks).toString("utf8").replace(/(^|\n)END\s*$/, "").trim();
}

export async function generatePitch({ company, role, slug, url, file, text, max = 5, force = false, publish = false, outDir = ROOT, lib = loadLibrary(), lexicon = loadLexicon(), fetchImpl, seenAt = new Date().toISOString().slice(0, 10) } = {}) {
  const job = await readJobInput({ url, file, text, fetchImpl });
  company = company ?? job.company ?? (url ? guessCompany(url) : undefined);
  if (!company) {
    const error = new Error("Could not tell which company this is. Pass --company \"Name\".");
    error.reason = "company";
    throw error;
  }
  slug = slugify(slug ?? company);
  const lensPath = join(outDir, "src", "lenses", `${slug}.json`);
  if (existsSync(lensPath) && !force) {
    const error = new Error(`${lensPath} already exists. Pass --force to overwrite it, or --slug to write a different lens.`);
    error.reason = "exists";
    throw error;
  }

  const analysis = analyzeJob(job.text, { lexicon, capabilities: lib.capabilities.capabilities, title: role ?? job.title, company });
  if (!Object.keys(analysis.capabilityWeights).length) {
    const error = new Error(`The text (${analysis.words} words) matched nothing in the lexicon. Is it a job description?`);
    error.reason = "empty";
    throw error;
  }
  const scored = scoreEvidence(analysis, lib);
  const picks = selectProof(scored, analysis, { max: Math.max(3, Math.min(5, Number(max) || 5)) });
  const source = job.source === "text" ? "pasted text" : job.source;
  const requirements = requirementCheck(analysis, lib, { phraseRegex, evidenceCorpus });
  const lens = draftLens({ company, slug, analysis, picks, lib, lexicon, source, scored, requirements, seenAt });
  if (publish) lens.status = "published";

  const errors = validateLens(lens, lib);
  if (errors.length) {
    const error = new Error(`The draft did not pass validation, so nothing was written:\n  - ${errors.join("\n  - ")}`);
    error.reason = "invalid";
    error.details = errors;
    throw error;
  }
  const report = renderReport({ company, slug, analysis, picks, lib, lensPath: `src/lenses/${slug}.json`, source, requirements, scoredCount: scored.length, fit: lens.fit });

  const pitchDir = join(outDir, "src", "pitches", slug);
  mkdirSync(join(outDir, "src", "lenses"), { recursive: true });
  mkdirSync(pitchDir, { recursive: true });
  writeFileSync(lensPath, JSON.stringify(lens, null, 2) + "\n");
  writeFileSync(join(pitchDir, "jd.txt"), job.text + "\n");
  const { lines, ...analysisOut } = analysis;
  writeFileSync(join(pitchDir, "analysis.json"), JSON.stringify({ ...analysisOut, source, picks: picks.map((p) => ({ id: p.item.slug, match: p.match, score: p.score, adjusted: p.adjusted, matched: p.matched })) }, null, 2) + "\n");
  writeFileSync(join(pitchDir, "report.md"), report);
  return { company, slug, lens, analysis, picks, scored, requirements, report, lensPath, pitchDir, source };
}

function summary(result) {
  const { company, slug, analysis, picks, requirements } = result;
  const lib = loadLibrary();
  const label = (id) => { const c = lib.capabilities.capabilities.find((c) => c.id === id); return typeof c?.label === "string" ? c.label : c?.label?.en ?? id; };
  const out = [];
  out.push(`\n${company} — ${analysis.title} (${analysis.seniority.label.en}) · ${analysis.words} words from ${result.source}`);
  out.push(`Themes: ${analysis.themes.filter((t) => !t.quiet).slice(0, 3).map((t) => t.label.en).join(" · ")}`);
  out.push(`Top asks: ${Object.entries(analysis.capabilityWeights).slice(0, 6).map(([id, w]) => `${label(id)} ${Math.round(w * 100)}%`).join(", ")}`);
  out.push("");
  for (const [i, p] of picks.entries()) out.push(`  ${i + 1}. ${p.match === "direct" ? "DIRECT      " : "TRANSFERABLE"} ${p.item.shortTitle ?? p.item.title}  ← ${p.matched.slice(0, 3).map((m) => `${label(m.id)}/${m.strength}`).join(", ")}`);
  const fit = result.lens.fit;
  if (fit?.rows?.length) {
    out.push(`\nFit ledger (${fit.rows.length} requirement lines):`);
    for (const row of fit.rows) out.push(`  ${row.level.padEnd(8)} ${row.ask.slice(0, 70)}${row.ask.length > 70 ? "…" : ""}${row.evidence?.[0] ? `  ← ${row.evidence[0].id}${row.evidence[0].line ? " (quoted)" : ""}` : ""}`);
  }
  const missing = requirements.filter((r) => !r.foundIn.length);
  if (missing.length) out.push(`\nNamed in the posting, not in the record: ${missing.map((r) => r.name).join(", ")}`);
  out.push(`\nWrote ${result.lensPath}\n      ${join(result.pitchDir, "report.md")}`);
  out.push(`Next: read the report, edit the hero, then  node src/build.mjs --preview  →  lens/_preview/${slug}/index.html`);
  return out.join("\n") + "\n";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 28).map((l) => l.replace(/^\/\/ ?/, "")).join("\n")); return; }
  let text;
  const interactive = process.stdin.isTTY;
  if (!args.url && !args.jd) {
    text = await readStdin({ interactive });
    if (!text) { console.error("Nothing to analyse. Pass --url, --jd <file>, or paste the posting."); process.exit(2); }
  }
  try {
    const result = await generatePitch({ company: args.company, role: args.role, slug: args.slug, url: args.url, file: args.jd, text, max: args.max, force: args.force, publish: args.publish, outDir: args["out-dir"] ?? ROOT, ...(args.seen ? { seenAt: args.seen } : {}) });
    if (args.json) { const { lines, ...rest } = result.analysis; console.log(JSON.stringify({ ...rest, picks: result.picks.map((p) => ({ id: p.item.slug, match: p.match, score: p.score })) }, null, 2)); }
    else process.stdout.write(summary(result));
  } catch (error) {
    if (error.reason === "unreadable" || error.reason === "fetch") {
      console.error(`\n${error.message}\n`);
      console.error(`Workaround: open the posting in your browser, copy just the job description (title through requirements), then run:\n\n  node scripts/generate-pitch.mjs --company "${args.company ?? "Company"}"\n\nand paste it (Ctrl-D to finish). A file works too: --jd path/to/jd.txt\n(A page needs at least ${MIN_WORDS} words of readable text to count as fetched.)`);
      process.exit(3);
    }
    console.error(`\n${error.message}\n`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) main();
