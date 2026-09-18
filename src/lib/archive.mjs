// The discipline tags behind the /all archive's filter bar.
//
// These used to be five hand-written Sets of slugs — a copy of
// src/categories/*.json that nothing kept in sync. It drifted: /all/ counted
// six AI Products while the rail counted five, because `breakbias` was in the
// copy and in no category file. The tags are now DERIVED from the category
// files, so a project's discipline is stated in exactly one place.
//
// A project can still carry several tags; "all" is implicit on every item so
// the "All" filter never has to special-case it.

/** A category slug is the same idea as a filter id, except "work" reads as "product" on this bar. */
const FILTER_FOR_CATEGORY = {
  interactive: "interactive",
  "ai-products": "ai-products",
  "ai-tools": "ai-tools",
  work: "product",
  brand: "brand",
};

/**
 * slug → Set of filter ids, built once from the category files.
 * Pass the same `categories` array the pages use (src/lib/site.mjs's
 * getCategories(), or loadCategories() in Node).
 */
export function filterIndex(categories) {
  const index = new Map();
  for (const category of categories) {
    const filter = FILTER_FOR_CATEGORY[category.slug];
    if (!filter) continue;
    for (const id of (category.groups ?? []).flatMap((g) => g.items ?? [])) {
      if (!index.has(id)) index.set(id, new Set());
      index.get(id).add(filter);
    }
  }
  return index;
}

/** The filter ids one item answers to. `index` comes from filterIndex(categories). */
export function getFilterTags(item, index) {
  return ["all", ...(index.get(item.slug) ?? [])];
}

export const FILTERS = [
  { id: "all", label: { en: "All", jp: "すべて" } },
  { id: "interactive", label: { en: "Interactive & Playable", jp: "インタラクティブ" } },
  { id: "ai-products", label: { en: "AI Products", jp: "AI プロダクト" } },
  { id: "ai-tools", label: { en: "AI Tools", jp: "AI ツール" } },
  { id: "product", label: { en: "Product Design", jp: "プロダクト" } },
  { id: "brand", label: { en: "Brand & Creative", jp: "ブランド" } },
];
