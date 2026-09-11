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
const SECTION_TYPES = new Set(["proof", "exploring", "experiments", "ventures", "tools", "career-arc", "capabilities", "studio", "contact"]);
const VENTURE_STATUS = new Set(["active", "validating", "prototype", "paused", "archived", "handed-off"]);
const EXPERIMENT_STATUS = new Set(["live", "in-progress", "prototype", "shipped"]);
const TOOL_STATUS = new Set(["released", "in-progress"]);

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
    ...(item.contribution?.mine ?? []),
    ...(item.contribution?.team ?? []),
    ...(item.narrative ? JSON.stringify(item.narrative) : []),
    localizedText(item.thesis), localizedText(item.experiment), localizedText(item.question),
    ...(item.stack ?? []),
  ];
  if (item.period) parts.push(item.period.start, item.period.end);
  return parts.filter(Boolean).join(" \n ");
}

/** Numeric claims in a piece of text, normalised so "3x" and "3 ×" compare equal. */
export function numericTokens(text) {
  const found = new Set();
  const re = /\$?\d[\d,.]*(?:\s?(?:×|x|%|\+|[KkMm]\+?))?/g;
  for (const match of text.matchAll(re)) found.add(normaliseToken(match[0]));
  return found;
}

const normaliseToken = (token) => token.replace(/\s+/g, "").replace(/x/gi, "×").replace(/,/g, "").replace(/\.$/, "");

function tokensMissingFrom(text, corpus) {
  const have = numericTokens(corpus);
  const missing = [];
  for (const token of numericTokens(text)) {
    // Allow a bare number to be satisfied by the same number with a suffix
    // ("40" is fine when the corpus says "40+"), but not the reverse.
    const bare = token.replace(/[×%+KkMm]+$/, "");
    const ok = have.has(token) || [...have].some((h) => h === bare || (h.replace(/[×%+KkMm]+$/, "") === bare && token === bare));
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

  return errors;
}

export function validateAll(lib, lenses, options = {}) {
  const errors = validateLibrary(lib, options);
  const slugs = new Set();
  for (const lens of lenses) {
    if (slugs.has(lens.slug)) errors.push(`lens/${lens.slug}: duplicate slug`);
    slugs.add(lens.slug);
    errors.push(...validateLens(lens, lib));
  }
  return errors;
}
