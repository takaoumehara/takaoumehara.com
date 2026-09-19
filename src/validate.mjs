// Validation for the Career Evidence Library and for Lens configurations.
//
// The build refuses to run when any of these fail. That is deliberate: it is
// the mechanical guarantee behind "no Lens can invent experience".
//
//   validateLibrary(lib)      → structural checks on the evidence base
//   validateLens(lens, lib)   → references, angles, metrics, and the two guards:
//       Claim Guard   — a number in Lens-authored text must already exist in the
//                       evidence it is framing (or, for the hero, in the Lens's
//                       evidence, theses or profile).
//       NotMine Guard — Lens-authored text about an item must not contain any
//                       phrase the item lists under contribution.notMine.

const ENGAGEMENTS = new Set(["employee", "freelance", "volunteer", "own-venture", "open-source", "concept", "unstated"]);
const STRENGTHS = new Set(["strong", "moderate", "adjacent"]);
const CONFIDENCE = new Set(["stated", "approximate", "unverified"]);
const VISIBILITY = new Set(["public", "lens-only", "private"]);
const SECTION_TYPES = new Set(["proof", "exploring", "experiments", "ventures", "ideas", "tools", "career-arc", "capabilities", "studio", "contact", "fit"]);
const VENTURE_STATUS = new Set(["active", "validating", "prototype", "paused", "archived", "handed-off"]);
const EXPERIMENT_STATUS = new Set(["live", "in-progress", "prototype", "shipped"]);
const TOOL_STATUS = new Set(["released", "in-progress"]);
// How much of the work was the person's. Printed on the card as a flag, so it
// must be one of these words and nothing softer.
const LEVELS = new Set(["solo", "led", "co-led", "contributor", "advised"]);
// Whether an outcome is on record at all. "unknown" is a legitimate, honest value.
const OUTCOME_STATUS = new Set(["measured", "reported", "shipped", "unknown"]);

// The Fit Ledger's levels, highest first, with the share of the bar each fills.
// "direct" is the record answering the line with a specific thing the person
// did; "none" is an honest empty row. See fitCeiling() for the rule.
export const FIT_LEVELS = { direct: 100, partial: 60, adjacent: 30, none: 0 };
const FIT_RANK = { direct: 3, partial: 2, adjacent: 1, none: 0 };

/**
 * The highest level the record supports for one ledger row. Computed from the
 * cited evidence only, so a lens may lower a row's level but never raise it:
 *   direct    strong evidence on a row capability AND a verbatim contribution line
 *   partial   strong evidence without a line, or moderate evidence with one
 *   adjacent  moderate without a line, or adjacent only
 *   none      nothing cited, or the cited record has none of the row's capabilities
 */
export function fitCeiling(row, lib) {
  let best = "none";
  for (const ref of row.evidence ?? []) {
    const item = lib.evidence.get(ref?.id);
    if (!item) continue;
    const order = { strong: 3, moderate: 2, adjacent: 1 };
    let strength = "";
    for (const c of item.capabilities) {
      if ((row.capabilities ?? []).includes(c.id) && (order[c.strength] ?? 0) > (order[strength] ?? 0)) strength = c.strength;
    }
    if (!strength) continue;
    const hasLine = typeof ref.line === "string" && item.contribution.mine.includes(ref.line);
    const level = strength === "strong" ? (hasLine ? "direct" : "partial")
      : strength === "moderate" ? (hasLine ? "partial" : "adjacent")
        : "adjacent";
    if (FIT_RANK[level] > FIT_RANK[best]) best = level;
  }
  return best;
}

/** Flatten a Localized value to the text it carries (both languages). */
export function localizedText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return [value.en, value.jp].filter(Boolean).join(" ");
}

/** All the text an evidence item is allowed to be described with. */
export function evidenceCorpus(item) {
  const parts = [
    item.title, item.shortTitle, item.jpTitle, item.organization, item.role,
    localizedText(item.summary),
    ...Object.values(item.angles ?? {}).map(localizedText),
    ...(item.metrics ?? []).flatMap((m) => [m.value, localizedText(m.label), m.basis]),
    localizedText(item.cardLine), localizedText(item.cardKind),
    ...(item.contribution?.mine ?? []),
    ...(item.contribution?.team ?? []),
    ...(item.narrative ? JSON.stringify(item.narrative) : []),
    localizedText(item.outcome?.note),
    localizedText(item.thesis), localizedText(item.experiment), localizedText(item.question),
    ...(item.stack ?? []),
  ];
  if (item.period) parts.push(item.period.start, item.period.end);
  return parts.filter(Boolean).join(" \n ");
}

/** Numeric claims in a piece of text, normalised so "3x" and "3 ×" compare equal. */
export function numericTokens(text) {
  const found = new Set();
  // The suffix must not be the first letter of a word: "30 minutes" is the
  // number 30, not 30 million. Without the lookahead the "m" of "minutes" was
  // read as a magnitude suffix and the token became "30m", which matched nothing.
  const re = /\$?\d[\d,.]*(?:\s?(?:×|x|%|\+|[KkMm]\+?))?(?![A-Za-z])/g;
  for (const match of text.matchAll(re)) found.add(normaliseToken(match[0]));
  return found;
}

const normaliseToken = (token) => token.replace(/\s+/g, "").replace(/x/gi, "×").replace(/,/g, "").replace(/\.$/, "");

// Numbers that are not claims about Takao's experience, so the Claim Guard must
// let them through. Without this the guard degrades the copy: it rejected the
// "30" in "a question worth thirty minutes" and forced a Japanese sentence to be
// written as 三十分 to sneak past, which is worse writing than the guard saved.
// The guard exists to stop invented experience, not to police ordinary numbers.
const NON_EVIDENTIAL_FIGURES = new Set(["0", "30", "15", "20", "60", "1", "2", "3"]);

function tokensMissingFrom(text, corpus) {
  const have = numericTokens(corpus);
  const missing = [];
  for (const token of numericTokens(text)) {
    const bare = token.replace(/[×%+KkMm]+$/, "");
    // A bare number is satisfied by the same number with a suffix ("40" is fine
    // when the corpus says "40+"), but not the other way round.
    const ok = NON_EVIDENTIAL_FIGURES.has(token)
      || have.has(token)
      || [...have].some((h) => h === bare || (h.replace(/[×%+KkMm]+$/, "") === bare && token === bare));
    if (!ok) missing.push(token);
  }
  return missing;
}

export function validateLibrary(lib, { assetExists } = {}) {
  const errors = [];
  const capIds = new Set(lib.capabilities.capabilities.map((c) => c.id));
  const groupIds = new Set(lib.capabilities.groups.map((g) => g.id));
  const chapterIds = new Set(lib.chapters.map((c) => c.id));
  const roleIds = new Set(lib.roles.map((r) => r.id));

  for (const cap of lib.capabilities.capabilities) {
    if (!groupIds.has(cap.group)) errors.push(`capabilities.json: "${cap.id}" has unknown group "${cap.group}"`);
  }
  for (const chapter of lib.chapters) {
    for (const role of chapter.roles ?? []) if (!roleIds.has(role)) errors.push(`chapters.json: chapter "${chapter.id}" lists unknown role "${role}"`);
  }
  for (const role of lib.roles) {
    if (!ENGAGEMENTS.has(role.engagement)) errors.push(`roles.json: role "${role.id}" has invalid engagement "${role.engagement}"`);
    for (const ev of role.evidence ?? []) if (!lib.evidence.has(ev)) errors.push(`roles.json: role "${role.id}" references unknown evidence "${ev}"`);
  }
  for (const thesis of lib.theses) {
    for (const ev of thesis.evidence ?? []) if (!lib.evidence.has(ev)) errors.push(`theses.json: thesis "${thesis.id}" references unknown evidence "${ev}"`);
  }

  for (const [slug, item] of lib.evidence) {
    const where = `${item.kind}/${slug}`;
    if (item.slug !== slug) errors.push(`${where}: slug mismatch`);
    if (!item.title) errors.push(`${where}: missing title`);
    if (!item.role) errors.push(`${where}: missing role`);
    if (!ENGAGEMENTS.has(item.engagement)) errors.push(`${where}: invalid engagement "${item.engagement}"`);
    if (!localizedText(item.summary)) errors.push(`${where}: missing summary`);
    if (!VISIBILITY.has(item.visibility)) errors.push(`${where}: invalid visibility "${item.visibility}"`);
    if (!Array.isArray(item.contribution?.mine) || item.contribution.mine.length === 0) errors.push(`${where}: contribution.mine must list at least one thing Takao did`);
    if (item.contribution?.level != null && !LEVELS.has(item.contribution.level)) errors.push(`${where}: contribution.level "${item.contribution.level}" must be one of ${[...LEVELS].join(" / ")}`);
    if (item.contribution?.teamSize != null && !(Number.isInteger(item.contribution.teamSize) && item.contribution.teamSize > 0)) errors.push(`${where}: contribution.teamSize must be a whole number of people (omit it when unknown)`);
    if (item.contribution?.level === "solo" && item.contribution.teamSize > 1) errors.push(`${where}: contribution.level "solo" with teamSize ${item.contribution.teamSize} contradicts itself`);
    if (item.outcome != null) {
      if (!OUTCOME_STATUS.has(item.outcome.status)) errors.push(`${where}: outcome.status "${item.outcome.status}" must be one of ${[...OUTCOME_STATUS].join(" / ")}`);
      if (item.outcome.status === "measured" && !(item.metrics ?? []).some((m) => m.confidence !== "unverified")) errors.push(`${where}: outcome.status "measured" needs at least one metric that is not unverified`);
    }
    if (!Array.isArray(item.capabilities) || item.capabilities.length === 0) errors.push(`${where}: needs at least one capability`);
    for (const claim of item.capabilities ?? []) {
      if (!capIds.has(claim.id)) errors.push(`${where}: unknown capability "${claim.id}"`);
      if (!STRENGTHS.has(claim.strength)) errors.push(`${where}: capability "${claim.id}" has invalid strength "${claim.strength}"`);
    }
    if (item.chapter && !chapterIds.has(item.chapter)) errors.push(`${where}: unknown chapter "${item.chapter}"`);
    const metricIds = new Set();
    for (const metric of item.metrics ?? []) {
      if (!metric.id || !metric.value || !localizedText(metric.label)) errors.push(`${where}: metric needs id, value and label`);
      if (!CONFIDENCE.has(metric.confidence)) errors.push(`${where}: metric "${metric.id}" has invalid confidence "${metric.confidence}"`);
      if (metricIds.has(metric.id)) errors.push(`${where}: duplicate metric id "${metric.id}"`);
      metricIds.add(metric.id);
    }
    if (item.kind === "venture") {
      for (const field of ["thesis", "experiment", "question"]) if (!localizedText(item[field])) errors.push(`${where}: venture needs ${field}`);
      if (!VENTURE_STATUS.has(item.status)) errors.push(`${where}: invalid venture status "${item.status}"`);
    }
    if (item.kind === "experiment") {
      if (!item.input) errors.push(`${where}: experiment needs input`);
      if (!EXPERIMENT_STATUS.has(item.status)) errors.push(`${where}: invalid experiment status "${item.status}"`);
      if (item.playable && !item.links?.live) errors.push(`${where}: playable requires links.live`);
    }
    if (item.kind === "tool" && !TOOL_STATUS.has(item.status)) errors.push(`${where}: invalid tool status "${item.status}"`);
    if (assetExists) {
      for (const key of ["thumb", "hero"]) {
        const path = item.assets?.[key];
        if (path && !assetExists(path)) errors.push(`${where}: assets.${key} "${path}" does not exist on disk`);
      }
      const preview = item.assets?.preview;
      if (preview) {
        for (const format of ["webm", "mp4"]) {
          const path = preview[format];
          if (!path) errors.push(`${where}: assets.preview needs a ${format} — one encoding does not reach every browser`);
          else if (!assetExists(path)) errors.push(`${where}: assets.preview.${format} "${path}" does not exist on disk`);
        }
        if (!(item.assets.thumb ?? item.assets.hero)) errors.push(`${where}: assets.preview needs a still behind it`);
      }

      const caseStudy = item.links?.caseStudy;
      if (caseStudy && !assetExists(caseStudy)) errors.push(`${where}: links.caseStudy "${caseStudy}" does not exist on disk`);
    }
  }
  return errors;
}

function checkGuards(errors, where, text, item, corpus) {
  const plain = localizedText(text);
  if (!plain) return;
  const missing = tokensMissingFrom(plain, corpus);
  if (missing.length) errors.push(`${where}: Claim Guard — "${missing.join('", "')}" not found in the evidence it describes`);
  if (item) {
    const lower = plain.toLowerCase();
    for (const phrase of item.contribution?.notMine ?? []) {
      if (lower.includes(phrase.toLowerCase())) errors.push(`${where}: NotMine Guard — "${phrase}" is listed as not Takao's contribution on ${item.slug}`);
    }
  }
}

/** The text a ledger row's note may draw numbers from: the records it cites, plus the lens's own. */
function heroCorpusFor(row, lib, used) {
  const items = new Map(used);
  for (const ref of row.evidence ?? []) { const item = lib.evidence.get(ref?.id); if (item) items.set(item.slug, item); }
  return [...items.values()].map(evidenceCorpus).join(" \n ");
}

export function lensEvidenceIds(lens) {
  const ids = [];
  for (const section of lens.sections ?? []) {
    if (section.type === "proof" || section.type === "experiments") ids.push(...section.items.map((ref) => ref.id));
    if (section.type === "ventures" || section.type === "tools" || section.type === "exploring") ids.push(...section.items);
  }
  return ids;
}

export function validateLens(lens, lib) {
  const errors = [];
  const where = `lens/${lens.slug ?? "?"}`;
  const capIds = new Set(lib.capabilities.capabilities.map((c) => c.id));
  const thesisIds = new Set(lib.theses.map((t) => t.id));
  const chapterIds = new Set(lib.chapters.map((c) => c.id));

  if (!lens.slug || !/^[a-z0-9-]+$/.test(lens.slug)) errors.push(`${where}: slug must be kebab-case`);
  if (!["published", "draft"].includes(lens.status)) errors.push(`${where}: status must be published or draft`);
  if (!localizedText(lens.hero?.title) || !localizedText(lens.hero?.body)) errors.push(`${where}: hero needs title and body`);
  if (!lens.cta?.primary?.href || !localizedText(lens.cta?.primary?.label)) errors.push(`${where}: cta.primary needs label and href`);
  if (!lens.seo?.title || !lens.seo?.description || typeof lens.seo?.noindex !== "boolean") errors.push(`${where}: seo needs title, description and noindex`);
  if (!Array.isArray(lens.sections) || lens.sections.length === 0) errors.push(`${where}: needs at least one section`);
  for (const chapter of lens.chapters ?? []) if (!chapterIds.has(chapter)) errors.push(`${where}: unknown chapter "${chapter}"`);

  const used = new Map(); // slug → item
  const seen = new Set();
  for (const [index, section] of (lens.sections ?? []).entries()) {
    const sw = `${where}: sections[${index}] (${section.type})`;
    if (!SECTION_TYPES.has(section.type)) { errors.push(`${sw}: unknown section type`); continue; }

    if (section.type === "proof" || section.type === "experiments") {
      if (!Array.isArray(section.items) || section.items.length === 0) { errors.push(`${sw}: needs items`); continue; }
      for (const ref of section.items) {
        const item = lib.evidence.get(ref.id);
        if (!item) { errors.push(`${sw}: unknown evidence "${ref.id}"`); continue; }
        if (item.visibility === "private") errors.push(`${sw}: "${ref.id}" is private`);
        if (seen.has(ref.id)) errors.push(`${sw}: "${ref.id}" appears twice in this lens`);
        seen.add(ref.id);
        used.set(ref.id, item);
        if (section.type === "experiments" && item.kind !== "experiment") errors.push(`${sw}: "${ref.id}" is a ${item.kind}, not an experiment`);
        if (ref.angle && !item.angles?.[ref.angle]) errors.push(`${sw}: "${ref.id}" has no angle "${ref.angle}" (has: ${Object.keys(item.angles ?? {}).join(", ") || "none"})`);
        for (const metricId of ref.metricIds ?? []) {
          const metric = (item.metrics ?? []).find((m) => m.id === metricId);
          if (!metric) errors.push(`${sw}: "${ref.id}" has no metric "${metricId}"`);
          else if (metric.confidence === "unverified") errors.push(`${sw}: metric "${metricId}" on "${ref.id}" is unverified and cannot be highlighted`);
        }
        const corpus = evidenceCorpus(item);
        checkGuards(errors, `${sw}: "${ref.id}" summaryOverride`, ref.summaryOverride, item, corpus);
        checkGuards(errors, `${sw}: "${ref.id}" emphasis`, ref.emphasis, item, corpus);
      }
    }
    if (section.type === "ventures" || section.type === "tools") {
      const kind = section.type === "ventures" ? "venture" : "tool";
      for (const id of section.items ?? []) {
        const item = lib.evidence.get(id);
        if (!item) errors.push(`${sw}: unknown evidence "${id}"`);
        else if (item.kind !== kind) errors.push(`${sw}: "${id}" is a ${item.kind}, not a ${kind}`);
        else used.set(id, item);
      }
    }
    if (section.type === "exploring") {
      for (const id of section.items ?? []) {
        if (thesisIds.has(id)) continue;
        const item = lib.evidence.get(id);
        if (!item) errors.push(`${sw}: "${id}" is neither a thesis nor evidence`);
        else if (item.kind !== "venture") errors.push(`${sw}: "${id}" is a ${item.kind}; exploring takes theses or ventures`);
        else used.set(id, item);
      }
    }
  }

  // The Fit Ledger: every row cites real records, quotes them verbatim, and
  // claims no more than the record supports.
  const hasFitSection = (lens.sections ?? []).some((s) => s.type === "fit");
  if (hasFitSection && !lens.fit) errors.push(`${where}: a "fit" section needs a fit block`);
  if (lens.fit) {
    if (!Array.isArray(lens.fit.rows)) errors.push(`${where}: fit.rows must be an array`);
    for (const [index, row] of (lens.fit.rows ?? []).entries()) {
      const rw = `${where}: fit.rows[${index}]`;
      if (!row.ask || typeof row.ask !== "string") errors.push(`${rw}: ask must be the posting's line, verbatim`);
      if (!(row.level in FIT_LEVELS)) errors.push(`${rw}: level "${row.level}" must be one of ${Object.keys(FIT_LEVELS).join(" / ")}`);
      for (const capId of row.capabilities ?? []) if (!capIds.has(capId)) errors.push(`${rw}: unknown capability "${capId}"`);
      for (const [j, ref] of (row.evidence ?? []).entries()) {
        const item = lib.evidence.get(ref?.id);
        if (!item) { errors.push(`${rw}: evidence[${j}] names unknown record "${ref?.id}"`); continue; }
        if (item.visibility === "private") errors.push(`${rw}: evidence[${j}] "${ref.id}" is private`);
        if (ref.line != null && !item.contribution.mine.includes(ref.line)) errors.push(`${rw}: evidence[${j}] line is not a verbatim contribution.mine line of "${ref.id}"`);
        checkGuards(errors, `${rw}: evidence[${j}].line`, ref.line, item, evidenceCorpus(item));
      }
      const ceiling = fitCeiling(row, lib);
      if (row.level in FIT_LEVELS && FIT_RANK[row.level] > FIT_RANK[ceiling]) errors.push(`${rw}: level "${row.level}" exceeds what the cited record supports ("${ceiling}") — a lens may lower a level, never raise it`);
      checkGuards(errors, `${rw}: note`, row.note, null, heroCorpusFor(row, lib, used));
    }
    for (const [index, req] of (lens.fit.requirements ?? []).entries()) {
      for (const id of req.foundIn ?? []) if (!lib.evidence.has(id)) errors.push(`${where}: fit.requirements[${index}] names unknown record "${id}"`);
    }
  }

  // Capability priority: only sell what the evidence in this lens actually shows.
  for (const capId of lens.capabilityPriority ?? []) {
    if (!capIds.has(capId)) { errors.push(`${where}: unknown capability "${capId}" in capabilityPriority`); continue; }
    const backed = [...used.values()].some((item) => item.capabilities.some((c) => c.id === capId && c.strength !== "adjacent"));
    if (!backed) errors.push(`${where}: capabilityPriority "${capId}" is not backed by strong or moderate evidence in this lens`);
  }

  // Hero claim guard: any number in the hero must exist somewhere in this lens's evidence, the theses, or the profile.
  const heroCorpus = [
    ...[...used.values()].map(evidenceCorpus),
    ...lib.theses.map((t) => localizedText(t.statement) + " " + localizedText(t.body)),
    ...lib.profile.positioning.map(localizedText),
  ].join(" \n ");
  for (const field of ["eyebrow", "title", "body", "note"]) checkGuards(errors, `${where}: hero.${field}`, lens.hero?.[field], null, heroCorpus);
  checkGuards(errors, `${where}: cta.title`, lens.cta?.title, null, heroCorpus);
  checkGuards(errors, `${where}: cta.body`, lens.cta?.body, null, heroCorpus);
  for (const [index, section] of (lens.sections ?? []).entries()) {
    checkGuards(errors, `${where}: sections[${index}].lede`, section.lede, null, heroCorpus);
    checkGuards(errors, `${where}: sections[${index}].title`, section.title, null, heroCorpus);
  }
  // lensNote may be a boolean (show the standard note or not) or the note itself.
  if (lens.lensNote != null && typeof lens.lensNote !== "boolean") {
    if (!localizedText(lens.lensNote)) errors.push(`${where}: lensNote must be true, false, or a Localized string`);
    checkGuards(errors, `${where}: lensNote`, lens.lensNote, null, heroCorpus);
  }
  // tailoredResume is never rendered, but it is text a person may paste into a
  // résumé, so it is held to the same standard as the page.
  if (lens.tailoredResume) {
    checkGuards(errors, `${where}: tailoredResume.summary`, lens.tailoredResume.summary, null, heroCorpus);
    for (const [index, h] of (lens.tailoredResume.highlights ?? []).entries()) {
      const item = h?.id ? lib.evidence.get(h.id) : null;
      if (!item) { errors.push(`${where}: tailoredResume.highlights[${index}] must name evidence by id`); continue; }
      if (!used.has(h.id)) errors.push(`${where}: tailoredResume.highlights[${index}] cites "${h.id}", which this lens does not show`);
      checkGuards(errors, `${where}: tailoredResume.highlights[${index}]`, h.line, item, evidenceCorpus(item));
    }
  }

  return errors;
}

/**
 * A category page is an index, so the bar is different from a lens: it may not
 * invent copy about the work (it has none — every card's words come from the
 * record), but it must not point at anything that is not there, and it must not
 * quietly drop a project by misspelling its id.
 */
export function validateCategory(category, lib, { assetExists = () => true } = {}) {
  const errors = [];
  const where = `category:${category.slug}`;
  if (!category.output?.endsWith(".html")) errors.push(`${where}: output must be a .html path at the site root`);
  if (!category.title?.en || !category.title?.jp) errors.push(`${where}: title needs both languages`);
  if (!category.lede?.en || !category.lede?.jp) errors.push(`${where}: lede needs both languages`);
  if (!category.groups?.length) errors.push(`${where}: needs at least one group`);

  const seen = new Set();
  for (const [index, group] of (category.groups ?? []).entries()) {
    if (group.title && (!group.title.en || !group.title.jp)) errors.push(`${where}: group ${index} title needs both languages`);
    if (group.note && (!group.note.en || !group.note.jp)) errors.push(`${where}: group ${index} note needs both languages`);
    if (!group.items?.length) errors.push(`${where}: group ${index} is empty`);
    for (const id of group.items ?? []) {
      if (!lib.evidence.has(id)) errors.push(`${where}: unknown evidence "${id}"`);
      else if (seen.has(id)) errors.push(`${where}: "${id}" is listed twice`);
      seen.add(id);
      const item = lib.evidence.get(id);
      if (item && item.visibility !== "public") errors.push(`${where}: "${id}" is ${item.visibility}, so it cannot sit on a public index`);
      const caseStudy = item?.links?.caseStudy;
      if (caseStudy && !assetExists(caseStudy)) errors.push(`${where}: "${id}" links to "${caseStudy}", which is not on disk`);
    }
  }
  return errors;
}

export function validateAll(lib, lenses, options = {}, categories = []) {
  const errors = validateLibrary(lib, options);
  const slugs = new Set();
  for (const lens of lenses) {
    if (slugs.has(lens.slug)) errors.push(`lens/${lens.slug}: duplicate slug`);
    slugs.add(lens.slug);
    errors.push(...validateLens(lens, lib));
  }
  const outputs = new Set();
  // A piece of work belongs to ONE category. Listing it in two put the same
  // card in the rail twice and made every count disagree with every other
  // count (the rail said 45 rows for 44 projects; /all/'s disciplines summed
  // to one more than its total). validateCategory's own `seen` set is scoped
  // to a single file, so it cannot catch this — that is why the check is here.
  const homes = new Map();
  for (const category of categories) {
    if (outputs.has(category.output)) errors.push(`category:${category.slug}: two categories write ${category.output}`);
    outputs.add(category.output);
    errors.push(...validateCategory(category, lib, options));
    for (const id of (category.groups ?? []).flatMap((g) => g.items ?? [])) {
      const home = homes.get(id);
      if (home && home !== category.slug) {
        errors.push(`category:${category.slug}: "${id}" is already in category "${home}" — a project belongs to one category`);
      } else {
        homes.set(id, category.slug);
      }
    }
  }
  return errors;
}
