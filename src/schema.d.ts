/**
 * takaoumehara.com — Career Evidence Library schema
 * ─────────────────────────────────────────────────────────────────────────
 * One Takao. One evidence base. Different lenses.
 *
 * This file is documentation + editor typing for the JSON under src/data and
 * src/lenses. Runtime validation lives in src/validate.mjs and mirrors it.
 *
 * Principles encoded here:
 *  - WHAT I DID vs WHAT THE TEAM DID is structural (contribution.mine / team),
 *    and contribution.notMine records what must never be claimed.
 *  - Evidence strength is recorded per capability, not per project, so a
 *    future JD analysis can compute DIRECT / TRANSFERABLE / GAP by rule.
 *  - Alternative framings of a project ("angles") live WITH the evidence, so a
 *    Lens can only pick an approved framing, never invent one.
 *  - A Lens is a selection + ordering + framing. It duplicates no facts.
 */

/** A string, or an EN/JP pair rendered with the site's .t-en/.t-jp convention. */
export type Localized = string | { en: string; jp?: string };

// ── Taxonomy ────────────────────────────────────────────────────────────────

export type CapabilityGroupId =
  | "creative" | "product" | "business" | "technology" | "leadership" | "context";

export interface Capability {
  id: string;                 // kebab-case, e.g. "creative-direction"
  label: Localized;
  group: CapabilityGroupId;
  /** One line a recruiter can read: what this capability means for Takao. */
  note?: Localized;
}

export interface CapabilityTaxonomy {
  groups: { id: CapabilityGroupId; label: Localized }[];
  capabilities: Capability[];
}

export interface Chapter {
  id: string;                 // "brand" | "interactive" | "product-edtech" | "enterprise-cx" | "ai-ventures"
  label: Localized;
  /** Rough span. Omit when unknown — never guess. */
  period?: string;
  summary: Localized;
  /** Role ids that belong to this chapter, in display order. */
  roles?: string[];
}

export interface Role {
  id: string;
  organization: string;
  title: string;
  period?: { start: string; end?: string | "present" };
  location?: string;
  summary: Localized;
  engagement: Engagement;
  /** Evidence ids produced while in this role. */
  evidence?: string[];
}

export interface Thesis {
  id: string;                 // "beginning-of-things"
  statement: Localized;       // "I like the beginning of things."
  body?: Localized;
  /** Evidence ids that make this thesis credible. */
  evidence?: string[];
}

export interface Profile {
  name: string;
  tagline: Localized;         // default identity line under the name
  location: Localized;
  studio: { name: string; url: string; note: Localized };
  contact: { email: string; linkedin: string; github?: string; medium?: string };
  positioning: Localized[];   // canonical positioning paragraphs (north star)
}

// ── Evidence ────────────────────────────────────────────────────────────────

export type Engagement =
  | "employee" | "freelance" | "volunteer" | "own-venture" | "open-source"
  | "concept"                 // self-initiated, not affiliated with the named org
  | "unstated";               // the source page does not say; render nothing

export type Strength = "strong" | "moderate" | "adjacent";

export interface CapabilityClaim {
  id: string;                 // Capability.id
  strength: Strength;
}

export interface Metric {
  id: string;                 // "games-revenue-3x"
  value: string;              // "3×"
  label: Localized;           // "game revenue growth, 2022→2024"
  /** What was measured against what. Keep it honest and short. */
  basis?: string;
  /** stated = on a published page; approximate = Takao's own rounding;
   *  unverified = cannot be highlighted by any Lens (build fails). */
  confidence: "stated" | "approximate" | "unverified";
}

export interface Contribution {
  mine: string[];             // required, ≥ 1
  team?: string[];            // what others did — name them where the source does
  /** Phrases that must never appear in any Lens text about this item. */
  notMine?: string[];
}

export interface EvidenceBase {
  kind: "project" | "venture" | "experiment" | "tool";
  slug: string;               // unique across all kinds; used as the reference id
  title: string;
  shortTitle?: string;
  jpTitle?: string;
  organization?: string;
  period?: { start: string; end?: string | "present" };
  location?: string;
  role: string;
  engagement: Engagement;
  summary: Localized;         // ≤ 60 words; used when a Lens picks no angle
  /** One sentence for a card. The full summary is for the page behind it. */
  cardLine?: Localized;
  /** Two or three words under a card's name: what it is, not what it does. */
  cardKind?: Localized;
  /** Approved alternative framings of the SAME facts, keyed by angle name. */
  angles?: Record<string, Localized>;
  capabilities: CapabilityClaim[];
  contribution: Contribution;
  metrics?: Metric[];
  chapter?: string;           // Chapter.id
  context?: {
    industries?: string[];
    audiences?: string[];
    mediums?: string[];
    markets?: ("US" | "JP" | "Global")[];
  };
  assets?: {
    thumb?: string;           // site-relative path, e.g. "assets/thumbs/koji-fizz.jpg"
    hero?: string;
    /**
     * A muted loop played on hover/focus over `thumb`. Both encodings are
     * required: open-source Chromium builds carry no H.264, and Safari's
     * VP9 support is too recent to rely on alone.
     */
    preview?: { webm: string; mp4: string };
    /** CSS art class from assets/work-card-grid.css when there is no image. */
    art?: string;
    artLabel?: string;
  };
  links?: {
    caseStudy?: string;       // existing page, site-relative
    live?: string;
    repo?: string;
    external?: string;
  };
  visibility: "public" | "lens-only" | "private";
  /** Free-form maintenance notes. Never rendered. */
  _notes?: string[];
}

export interface Project extends EvidenceBase {
  kind: "project";
  narrative?: {
    situation?: string;
    problem?: string;
    opportunity?: string;
    constraints?: string[];
    built?: string[];
    impact?: { business?: string[]; user?: string[]; organizational?: string[] };
  };
}

export interface Venture extends EvidenceBase {
  kind: "venture";
  thesis: Localized;          // what I believe
  experiment: Localized;      // what I built
  question: Localized;        // what I am trying to learn
  status: "active" | "validating" | "prototype" | "paused" | "archived" | "handed-off";
}

export interface Experiment extends EvidenceBase {
  kind: "experiment";
  /** The input vocabulary from interactive.html: voice, face, handwriting, typing, pointer, two phones, every phone… */
  input: string;
  status: "live" | "in-progress" | "prototype" | "shipped";
  /** True only when a public URL exists and opens right now. */
  playable: boolean;
  stack?: string[];
}

export interface Tool extends EvidenceBase {
  kind: "tool";
  status: "released" | "in-progress";
  stack?: string[];
  license?: string;
}

export type Evidence = Project | Venture | Experiment | Tool;

// ── Lens ────────────────────────────────────────────────────────────────────

export interface ProofRef {
  id: string;                 // Evidence.slug
  angle?: string;             // key of Evidence.angles
  /** Escape hatch. Subject to the Claim Guard and NotMine Guard. */
  summaryOverride?: Localized;
  /** One short line above the title, e.g. "Film · Brand · Client leadership". */
  emphasis?: Localized;
  /** Metric ids to surface on the card. Must exist and not be "unverified". */
  metricIds?: string[];
  size?: "lead" | "standard";
}

export type Section =
  | { type: "proof"; title?: Localized; lede?: Localized; items: ProofRef[] }
  | { type: "exploring"; title?: Localized; lede?: Localized; items: string[] }      // thesis ids and/or venture slugs
  | { type: "experiments"; title?: Localized; lede?: Localized; items: ProofRef[] }
  | { type: "ventures"; title?: Localized; lede?: Localized; items: string[] }       // venture slugs
  | { type: "tools"; title?: Localized; lede?: Localized; items: string[] }          // tool slugs
  | { type: "career-arc"; title?: Localized; lede?: Localized }
  | { type: "capabilities"; title?: Localized; lede?: Localized }
  | { type: "studio"; title?: Localized; lede?: Localized }
  | { type: "contact" };

export interface Lens {
  slug: string;               // "default" renders to /index.html; others to /lens/<slug>/
  title: string;              // maintenance label
  audience?: string;          // maintenance note: who this lens is for
  status: "published" | "draft";
  identity?: { tagline: Localized };
  hero: { eyebrow?: Localized; title: Localized; body: Localized; note?: Localized };
  capabilityPriority: string[];
  sections: Section[];
  /** Chapter ids to emphasise in the career arc. Omit = all, none emphasised. */
  chapters?: string[];
  cta: {
    title: Localized;
    body?: Localized;
    primary: { label: Localized; href: string };
    secondary?: { label: Localized; href: string };
  };
  seo: { title: string; description: string; noindex: boolean };
  /** Show the one-line "Same experience. Different lens." note. Default: true for /lens/*, false for default. */
  lensNote?: boolean;
}
