// What a project detail page shows, resolved from one evidence record.
//
// The locked detail format (docs/project-page-format.md §0): teaser → name +
// one-liner + Play → Challenge | Solution → 0–3 body beats → Role / Year /
// Client, stack in a quiet footer. A record may carry a `detail` block to
// override any of these; otherwise they come from the record's own fields.

const NON_CLIENT = new Set(["own-venture", "concept"]);

/** "Werewolf: Dark Gothic Card Game" → "Werewolf". The H1 is the name only. */
export const stripTagline = (title) => String(title ?? "").split(/\s*[:：]\s+|\s+[—–]\s+/)[0].trim();

export function detailName(item) {
  if (item.detail?.name) return item.detail.name;
  return { en: stripTagline(item.shortTitle ?? item.title) };
}

export function detailPlay(item) {
  if (!item.playable || !item.links?.live) return null;
  const name = detailName(item);
  const label = item.detail?.play ?? { en: `Play ${name.en}`, jp: `${name.jp ?? name.en} を遊ぶ` };
  return { href: item.links.live, label };
}

export function detailYear(item) {
  if (item.year) return item.year;
  const p = item.period;
  if (!p?.start) return null;
  if (!p.end) return p.start;
  if (p.end === "present") return { en: `${p.start}–Present`, jp: `${p.start}–現在` };
  return `${p.start}–${p.end}`;
}

export function detailClient(item) {
  if (item.detail && "client" in item.detail) return item.detail.client || null;
  if (NON_CLIENT.has(item.engagement)) return null;
  return item.organization ?? null;
}

/**
 * The teaser: a muted loop, a still, or — when the record has no real media —
 * the typographic fallback (name, client, or client logo) in the same box.
 */
export function detailTeaser(item) {
  const d = item.detail?.teaser ?? {};
  const a = item.assets ?? {};
  const fallback = { kind: "fallback", name: detailName(item), client: d.client ?? detailClient(item), logo: d.logo };
  if (d.fallback) return fallback;
  const still = d.image ?? a.hero ?? a.thumb;
  if (!d.image && a.preview && (a.preview.webm || a.preview.mp4)) {
    return { kind: "video", webm: a.preview.webm, mp4: a.preview.mp4, poster: still };
  }
  if (still) return { kind: "image", src: still, fit: d.fit ?? "cover", position: d.position, background: d.background };
  return fallback;
}

export function detailFields(item) {
  const challenge = item.detail?.challenge ?? item.challenge;
  const solution = item.detail?.solution ?? item.solution;
  return {
    name: detailName(item),
    oneLiner: item.detail?.oneLiner ?? item.cardLine ?? item.summary,
    play: detailPlay(item),
    challenge: challenge && solution ? challenge : null,
    solution: challenge && solution ? solution : null,
    role: item.detail?.role ?? item.role ?? null,
    year: detailYear(item),
    client: detailClient(item),
    stack: item.detail?.stack ?? item.stack ?? [],
    teaser: detailTeaser(item),
  };
}
