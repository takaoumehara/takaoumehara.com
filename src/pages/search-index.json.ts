// /search-index.json — every work's searchable text, built with the site.
// See src/lib/search-index.mjs.
import { gridEntries } from "../lib/site.mjs";
import { buildSearchIndex } from "../lib/search-index.mjs";
import capabilities from "../data/capabilities.json";

const pages = import.meta.glob("../case-studies/*.html", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const labels = new Map((capabilities as any).capabilities.map((c: any) => [c.id, c.label]));

const bodyOf = (item: any) => {
  const slug = String(item.links?.caseStudy ?? `projects/${item.slug}.html`).match(/projects\/([^/]+)\.html$/)?.[1];
  return (slug && pages[`../case-studies/${slug}.html`]) || "";
};

export function GET() {
  return new Response(JSON.stringify(buildSearchIndex(gridEntries(), labels, bodyOf)), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
