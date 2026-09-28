// Search across every work's full text (client, role, stack, capabilities,
// summary and the page's own beats), not just what a card shows. The index
// (/search-index.json) and Fuse.js load the first time a search box opens;
// until they arrive — or if they never do — the old visible-text match runs.
import { SEARCH_KEYS } from "../lib/search-index.mjs";

let ready = null;
export function loadSearch() {
  ready ??= Promise.all([
    import("fuse.js"),
    fetch("/search-index.json").then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
  ])
    .then(([{ default: Fuse }, docs]) => ({
      docs,
      fuse: new Fuse(docs, {
        keys: SEARCH_KEYS,
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    }))
    .catch(() => null);
  return ready;
}

const fold = (s) => String(s ?? "").normalize("NFKC").toLowerCase().trim();

/**
 * The slugs that match `query`, or null when there is no query or no index.
 * Every word must hit (AND); an exact substring anywhere in a work counts as a
 * hit, and Fuse adds the near misses ("amplfy", "rakugaki jam").
 */
export async function matchSlugs(query) {
  const q = fold(query);
  if (!q) return null;
  const s = await loadSearch();
  if (!s) return null;
  const words = q.split(/\s+/).filter(Boolean);
  const blob = new Map(s.docs.map((d) => [d.slug, fold(Object.values(d).join(" "))]));
  let hits = null;
  for (const w of words) {
    const set = new Set([...blob].filter(([, b]) => b.includes(w)).map(([slug]) => slug));
    if (w.length >= 3) for (const r of s.fuse.search(w)) set.add(r.item.slug);
    hits = hits ? new Set([...hits].filter((x) => set.has(x))) : set;
  }
  return hits;
}

/**
 * Wires one search box to a list of elements. `slugOf(el)` names the work an
 * element shows; `after()` runs once visibility is applied (group headers,
 * empty states). Late answers to an older query are dropped.
 */
export function bindSearch(input, elements, slugOf, after = () => {}) {
  let seq = 0;
  const apply = (keep) => {
    for (const el of elements()) el.style.display = keep(el) ? "" : "none";
    after();
  };
  input.addEventListener("focus", () => loadSearch(), { once: true });
  input.addEventListener("input", async () => {
    const q = fold(input.value);
    const mine = ++seq;
    if (!q) return apply(() => true);
    apply((el) => fold(el.textContent).includes(q)); // instant, visible text only
    const hits = await matchSlugs(q);
    if (mine !== seq || !hits) return;
    apply((el) => hits.has(slugOf(el)));
  });
}
