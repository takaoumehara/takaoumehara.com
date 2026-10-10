// Shared helpers for the news entries in src/data/news.mjs: the date label
// the Updates bento (HomeNews.astro) prints, and where an entry links to.
// NowList.astro uses both for its "Latest: <date>" links, so a Now bullet and
// the Updates card for the same release always show the same date and target.
import { NEWS } from "../data/news.mjs";
import { destination } from "./site.mjs";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "YYYY-MM-DD" → "Oct 5, 2026"; "YYYY-MM" (the day is not on record, see
// src/data/news.mjs) → "Oct 2026".
export function newsDateLabel(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!d) return { en: `${MONTHS[m - 1]} ${y}`, jp: `${y}年${m}月` };
  return { en: `${MONTHS[m - 1]} ${d}, ${y}`, jp: `${y}年${m}月${d}日` };
}

// Where a news entry goes: a tool entry's own href (docs / repo, external
// is fine), else the evidence record's detail page. null when neither exists.
export function newsLink(entry, lib) {
  if ((entry.kind ?? "experiment") === "tool") {
    return entry.href ? { href: entry.href, external: /^https?:/i.test(entry.href) } : null;
  }
  const item = entry.slug ? lib.evidence.get(entry.slug) : null;
  const to = item ? destination(item) : null;
  return to && !to.external ? { href: to.url, external: false } : null;
}

// The news entry with this slug, or null.
export function newsBySlug(slug) {
  return NEWS.find((entry) => entry.slug === slug) ?? null;
}
