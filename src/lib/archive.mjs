// The discipline tags behind the /work archive's filter bar. Ported from
// src/render/archive.mjs so WorkArchive.astro and a test can both import
// getFilterTags without duplicating the slug lists.
//
// A project can carry several tags (e.g. an AI product that is also playable);
// "all" is implicit on every item so the "All" filter never has to special-case it.
const PRODUCT_SLUGS = new Set([
  "verizon-ai-workflow", "verizon-totalwireless", "tmobile", "cli-studios",
  "web3-wallet", "credit-card-portal", "hummingbird", "ux-audit",
  "ela-quests", "menlomath", "vocab-app", "edutrack", "carnegie",
]);

const AI_PRODUCT_SLUGS = new Set([
  "intentfirst", "mybrainspec", "moime", "verizon-ai-workflow", "amazon-firetv", "breakbias",
]);

const AI_TOOL_SLUGS = new Set([
  "superforge", "snap-pair", "interactive-experience-skills", "intuitive-game-design",
  "cross-model-handoff", "failforward", "multilingual-readme",
]);

const INTERACTIVE_SLUGS = new Set([
  "resona", "kao-game", "rakugaki-jam", "typespace", "koe-baku",
  "emoji-blast", "marubatsu", "werewolf",
]);

const BRAND_SLUGS = new Set([
  "coca-cola", "value-frontier", "odell-education", "konosaki", "dnt",
  "kitadoko", "festival-reinvention", "xq", "extraordinary", "koji-fizz",
  "graffitiwear", "skateboard-egift",
]);

export function getFilterTags(item) {
  const tags = new Set(["all"]);
  const slug = item.slug;

  if (PRODUCT_SLUGS.has(slug)) tags.add("product");
  if (AI_PRODUCT_SLUGS.has(slug)) tags.add("ai-products");
  if (AI_TOOL_SLUGS.has(slug)) tags.add("ai-tools");
  if (INTERACTIVE_SLUGS.has(slug)) tags.add("interactive");
  if (BRAND_SLUGS.has(slug)) tags.add("brand");

  return [...tags];
}

export const FILTERS = [
  { id: "all", label: { en: "All", jp: "すべて" } },
  { id: "interactive", label: { en: "Interactive & Playable", jp: "インタラクティブ" } },
  { id: "ai-products", label: { en: "AI Products", jp: "AI プロダクト" } },
  { id: "ai-tools", label: { en: "AI Tools", jp: "AI ツール" } },
  { id: "product", label: { en: "Product Design", jp: "プロダクト" } },
  { id: "brand", label: { en: "Brand & Creative", jp: "ブランド" } },
];
