// Job-description intake and analysis. Pure functions, no dependencies, no
// model calls: the same posting always produces the same analysis, and nothing
// here can invent a capability that is not in the taxonomy.
//
//   readJobText({ url | file | text })  → { text, title?, company?, source }
//   extractJobText(html)                → text (schema.org JobPosting first, then the page body)
//   analyzeJob(text, { lexicon, capabilities, title, company }) → JobAnalysis
//
// A JobAnalysis says what the posting asks for, in the taxonomy's terms:
//   capabilityWeights   { [capabilityId]: 0..1 }   — 1 = the thing they mention most
//   themes              [{ id, label, score, capabilities }]  — what it is really about
//   seniority           { id, label }
//   requirements        [{ name, hits }]             — named tools / credentials found
//   lines               [{ text, section, weight }]  — the posting, sectioned
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const loadLexicon = () => JSON.parse(readFileSync(join(HERE, "lexicon.json"), "utf8"));

// ── Intake ──────────────────────────────────────────────────────────────────

export const MIN_WORDS = 80;

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", bull: "•", middot: "·" };
export function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

/** HTML fragment → readable text with one block per line and "- " bullets. */
export function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li\b[^>]*>/gi, "\n- ")
      .replace(/<\/(p|div|section|article|li|ul|ol|h[1-6]|tr|table|blockquote|header|footer|main|dd|dt|dl|pre)>/gi, "\n")
      .replace(/<(h[1-6]|p|div|section|article|tr)\b[^>]*>/gi, "\n")
      // Inline tags vanish without a space, so "<b>system</b>." stays "system."
      .replace(/<\/?(a|b|i|u|em|strong|span|code|small|sup|sub|mark|abbr|time)\b[^>]*>/gi, "")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findJobPostings(node, found = []) {
  if (Array.isArray(node)) { node.forEach((n) => findJobPostings(n, found)); return found; }
  if (!node || typeof node !== "object") return found;
  const type = [].concat(node["@type"] ?? []).map(String);
  if (type.some((t) => /JobPosting/i.test(t))) found.push(node);
  if (node["@graph"]) findJobPostings(node["@graph"], found);
  return found;
}

/** The posting as text. Prefers the schema.org JobPosting most job boards embed; falls back to the visible page. */
export function extractJobText(html) {
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data;
    try { data = JSON.parse(match[1].trim()); } catch { continue; }
    const posting = findJobPostings(data)[0];
    if (!posting?.description) continue;
    const org = posting.hiringOrganization;
    return {
      via: "json-ld",
      title: posting.title ? htmlToText(String(posting.title)) : undefined,
      company: typeof org === "string" ? org : org?.name,
      text: [posting.title, htmlToText(String(posting.description))].filter(Boolean).join("\n\n"),
    };
  }
  const title = decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/\s+/g, " ").trim() || undefined;
  const body = html.replace(/<(nav|header|footer|aside)\b[\s\S]*?<\/\1>/gi, " ");
  const main = body.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? body.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ?? body;
  return { via: "html", title, text: htmlToText(main) };
}

/** Latin words, plus Japanese counted at roughly two characters a word. */
export const wordCount = (text) => {
  const latin = (text.match(/[A-Za-z0-9][A-Za-z0-9'’\-\/]*/g) ?? []).length;
  const japanese = (text.match(/[\u3040-\u30ff\u4e00-\u9fff]/g) ?? []).length;
  return latin + Math.round(japanese / 2);
};

export async function fetchJobPage(url, { fetchImpl = globalThis.fetch, timeoutMs = 20000 } = {}) {
  const response = await fetchImpl(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9,ja;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText || ""}`.trim());
  return response.text();
}

/**
 * Resolve the posting text from whichever input was given. Throws an Error
 * with `.reason` = "unreadable" when a fetched page carries too little text
 * (a JavaScript-rendered board, a login wall), so the caller can offer paste.
 */
export async function readJobText({ url, file, text, fetchImpl } = {}) {
  if (text != null) return { text: String(text).trim(), source: "text" };
  if (file) return { text: readFileSync(file, "utf8").trim(), source: file };
  if (url) {
    let html;
    try { html = await fetchJobPage(url, { fetchImpl }); } catch (error) {
      const failure = new Error(`Could not fetch ${url}: ${error.message}`);
      failure.reason = "fetch";
      throw failure;
    }
    const extracted = /^\s*[{[]/.test(html) ? { via: "json", text: htmlToText(html) } : extractJobText(html);
    if (wordCount(extracted.text) < MIN_WORDS) {
      const failure = new Error(`The page at ${url} yielded only ${wordCount(extracted.text)} words — it is probably rendered by JavaScript or behind a login.`);
      failure.reason = "unreadable";
      failure.partial = extracted;
      throw failure;
    }
    return { ...extracted, source: url, hostname: safeHostname(url) };
  }
  throw new Error("No job description given: pass --url, --jd <file>, or paste it on stdin.");
}

export function safeHostname(url) {
  try { return new URL(url).hostname; } catch { return undefined; }
}

/** "boards.greenhouse.io/stripe" → "Stripe"; "stripe.com" → "Stripe"; "jobs.lever.co/acme-inc" → "Acme Inc". */
export function guessCompany(url) {
  let parsed;
  try { parsed = new URL(url); } catch { return undefined; }
  const host = parsed.hostname.replace(/^www\./, "");
  const boards = /(greenhouse\.io|lever\.co|ashbyhq\.com|workable\.com|myworkdayjobs\.com|smartrecruiters\.com|bamboohr\.com|jobvite\.com|recruitee\.com|breezy\.hr|rippling\.com|applytojob\.com)$/;
  const titleCase = (s) => s.split(/[-_]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  if (boards.test(host)) {
    const segment = parsed.pathname.split("/").filter(Boolean)[0];
    if (/myworkdayjobs/.test(host)) return titleCase(host.split(".")[0]);
    return segment ? titleCase(segment) : undefined;
  }
  if (/linkedin\.com|indeed\.com|glassdoor\.com|wantedly\.com|bizreach\.jp|green-japan\.com/.test(host)) return undefined;
  const parts = host.split(".");
  const base = parts.length > 2 && parts[parts.length - 2].length <= 3 ? parts[parts.length - 3] : parts[parts.length - 2] ?? parts[0];
  return base ? titleCase(base) : undefined;
}

export const slugify = (name) => String(name).normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "company";

// ── Analysis ────────────────────────────────────────────────────────────────

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");
const isLatin = (s) => /^[\x00-\x7F]+$/.test(s);
/** A phrase becomes a case-insensitive regex; Latin phrases must sit on word boundaries. */
export function phraseRegex(phrase, { isPattern = false } = {}) {
  if (isPattern) return new RegExp(phrase, "giu");
  const body = escapeRe(phrase).replace(/\s+/g, "[\\s\\-]+");
  return isLatin(phrase) ? new RegExp(`(?<![A-Za-z0-9])${body}(?![A-Za-z0-9])`, "giu") : new RegExp(body, "giu");
}
const countMatches = (re, text) => { re.lastIndex = 0; let n = 0; while (re.exec(text)) n += 1; return n; };

/** Split the posting into lines, each tagged with the section heading above it. */
export function sectionize(text, lexicon) {
  const sections = Object.entries(lexicon.sections).filter(([k]) => !k.startsWith("$"));
  const lines = [];
  let current = { id: "body", weight: 1 };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^[\s\-•·*]+/, "").trim();
    if (!line) continue;
    const looksLikeHeading = line.length <= 60 && !/[.。]$/.test(line) && (isLatin(line) ? line.split(/\s+/).length <= 8 : line.length <= 20);
    if (looksLikeHeading) {
      const lower = line.toLowerCase();
      const hit = sections.find(([, s]) => s.headings.some((h) => lower.includes(h.toLowerCase())));
      if (hit) { current = { id: hit[0], weight: hit[1].weight }; continue; }
    }
    lines.push({ text: line, section: current.id, weight: current.weight });
  }
  return lines;
}

export function detectSeniority(title, text, lexicon) {
  const probe = (s) => lexicon.seniority.levels.find((lvl) => lvl.patterns.some((p) => new RegExp(p, "iu").test(s)));
  return probe(title ?? "") ?? probe((text ?? "").split(/\n/).slice(0, 3).join(" ")) ?? lexicon.seniority.default;
}

/** The job title: given, or the first short line that names a design/product role. */
export function detectTitle(text, given) {
  if (given) return given.trim();
  const roleWords = /designer|design|product|creative|director|manager|lead|head|engineer|research|strategist|デザイナー|デザイン|プロダクト|ディレクター|マネージャー|リード/i;
  for (const raw of text.split(/\n/).slice(0, 12)) {
    const line = raw.replace(/^[\s\-•·*#]+/, "").trim();
    if (!line || line.length > 80) continue;
    if (roleWords.test(line) && (isLatin(line) ? line.split(/\s+/).length <= 10 : line.length <= 30)) return line.replace(/\s*[|–—-]\s*.*$/, "").trim();
  }
  return "the role";
}

const MAX_HITS_PER_PHRASE = 4;

export function analyzeJob(text, { lexicon = loadLexicon(), capabilities, title, company } = {}) {
  const capIds = new Set(capabilities.map((c) => c.id));
  const lines = sectionize(text, lexicon);
  const jobTitle = detectTitle(text, title);
  const seniority = detectSeniority(jobTitle, text, lexicon);

  // Capability weights: every phrase hit, scaled by the section it sits in.
  const raw = {};
  const evidence = {}; // capabilityId → phrases that fired, for the report
  for (const [capId, phrases] of Object.entries(lexicon.capabilities)) {
    if (!capIds.has(capId)) throw new Error(`lexicon.json names unknown capability "${capId}"`);
    const contributions = [];
    const fired = [];
    for (const { p, w } of phrases) {
      const re = phraseRegex(p);
      let hits = 0;
      let weighted = 0;
      for (const line of lines) {
        const n = countMatches(re, line.text);
        if (!n) continue;
        hits += n;
        weighted += n * line.weight;
      }
      if (!hits) continue;
      const capped = Math.min(hits, MAX_HITS_PER_PHRASE) * (weighted / hits);
      contributions.push(capped * w);
      fired.push({ phrase: p, hits });
    }
    // The title is what the recruiter reads first; count it once more.
    for (const { p, w } of phrases) if (phraseRegex(p).test(jobTitle)) contributions.push(2 * w);
    // The strongest phrase counts in full, the rest at half: a capability with
    // a long list of everyday words ("build", "ship", "code") must not outweigh
    // one the posting names outright ("design system").
    contributions.sort((a, b) => b - a);
    const score = contributions.length ? contributions[0] + 0.5 * contributions.slice(1).reduce((a, b) => a + b, 0) : 0;
    if (score > 0) { raw[capId] = score; evidence[capId] = fired.sort((a, b) => b.hits - a.hits || a.phrase.localeCompare(b.phrase)); }
  }
  const max = Math.max(0, ...Object.values(raw));
  const capabilityWeights = Object.fromEntries(
    Object.entries(raw).map(([id, s]) => [id, max ? Number((s / max).toFixed(3)) : 0]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
  );

  const themes = Object.entries(lexicon.themes)
    .filter(([id]) => !id.startsWith("$"))
    .map(([id, theme]) => ({
      id, label: theme.label, angles: theme.angles, quiet: Boolean(theme.quiet), capabilities: theme.capabilities,
      score: Number(theme.capabilities.reduce((sum, c) => sum + (capabilityWeights[c] ?? 0), 0).toFixed(3)),
    }))
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  // Industry words: which of the record's domains the posting is in.
  const domains = Object.entries(lexicon.domains ?? {})
    .filter(([id]) => !id.startsWith("$"))
    .map(([id, dom]) => ({ id, label: dom.label, industries: dom.industries, hits: dom.patterns.reduce((n, p) => n + countMatches(phraseRegex(p, { isPattern: true }), text), 0) }))
    // One stray word is not a domain; a posting in a domain says so repeatedly.
    .filter((d) => d.hits >= 2)
    .sort((a, b) => b.hits - a.hits || a.id.localeCompare(b.id));

  const requirements = lexicon.requirements.items
    .map((item) => {
      const hits = item.patterns.reduce((n, p) => n + countMatches(phraseRegex(p, { isPattern: true }), text), 0);
      const found = item.patterns.map((p) => text.match(phraseRegex(p, { isPattern: true }))?.[0]).filter(Boolean);
      return { name: item.name, patterns: item.patterns, screen: Boolean(item.screen), hits, found: [...new Set(found)] };
    })
    .filter((r) => r.hits > 0);

  return {
    title: jobTitle,
    company: company ?? null,
    seniority: { id: seniority.id, label: seniority.label },
    words: wordCount(text),
    sections: Object.fromEntries(["requirements", "preferred", "responsibilities", "context", "body"].map((s) => [s, lines.filter((l) => l.section === s).length])),
    capabilityWeights,
    capabilityEvidence: evidence,
    themes,
    domains,
    requirements,
    lines,
  };
}
