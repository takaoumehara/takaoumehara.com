// The search index: one small document per work, built from the evidence
// record and the page's own body text, so a search finds a project by its
// client ("Amplify"), its role, its stack, a capability or a word that only
// appears in a beat — not just by the title and one line the card shows.
// Served as /search-index.json; src/scripts/search.js ranks it with Fuse.js.

const text = (v) => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(text).join(" ");
  if (typeof v === "object") return Object.values(v).map(text).join(" ");
  return String(v);
};

const stripHtml = (html) =>
  String(html ?? "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * @param {Array<{item:any}>} entries   gridEntries()
 * @param {Map<string,string>} labels   capability id → label
 * @param {(item:any) => string} bodyOf the page's beat HTML for a record, or ""
 */
export function buildSearchIndex(entries, labels, bodyOf) {
  return entries.map(({ item }) => {
    const n = item.narrative ?? {};
    return {
      slug: item.slug,
      title: text([item.title, item.shortTitle]),
      jp: text([item.jpTitle, item.detail?.name?.jp]),
      org: text([item.organization, item.detail?.client]),
      kind: text([item.cardKind, item.role, item.input, item.chapter]),
      tags: text([
        item.stack, item.detail?.stack,
        (item.capabilities ?? []).map((c) => labels.get(c.id) ?? c.id),
        item.context,
      ]),
      summary: text([item.cardLine, item.summary, item.challenge, item.solution]),
      body: text([n.situation, n.problem, n.built, item.contribution?.mine]) + " " + stripHtml(bodyOf(item)),
    };
  });
}

/** Fuse.js keys and weights: a name or client hit outranks a word in the body. */
export const SEARCH_KEYS = [
  { name: "title", weight: 4 },
  { name: "jp", weight: 3 },
  { name: "org", weight: 3 },
  { name: "kind", weight: 2 },
  { name: "tags", weight: 1.5 },
  { name: "summary", weight: 1 },
  { name: "body", weight: 0.5 },
];
