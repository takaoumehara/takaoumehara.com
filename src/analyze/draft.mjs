// Turns a match into a Lens draft: src/lenses/<slug>.json, status "draft".
//
// The draft writes no facts. Every sentence about the work is either the
// record's own text (cardLine, angles, contribution.mine) or a template whose
// only variables are the company, the job title, capability labels and theme
// labels. The person then rewrites the hero in their own voice; the Claim
// Guard and NotMine Guard re-check whatever they write at build time.
import { chooseAngle, chooseMetrics } from "./match.mjs";
import { buildFit } from "./fit.mjs";

// The site sets a space between Latin and Japanese (docs/japanese-voice.md
// §3.3). Templates splice Latin names into Japanese sentences, so fix the seams.
const JP = "\\u3041-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u4E00-\\u9FFF\\u3005-\\u3007";
export const jpSpacing = (s) => s
  .replace(new RegExp(`([A-Za-z0-9%)\\]])([${JP}])`, "gu"), "$1 $2")
  .replace(new RegExp(`([${JP}])([A-Za-z0-9$(\\[])`, "gu"), "$1 $2");
/** Apply jpSpacing to every `jp` string in a draft, in place. */
export function fixJapaneseSpacing(node) {
  if (Array.isArray(node)) { node.forEach(fixJapaneseSpacing); return node; }
  if (!node || typeof node !== "object") return node;
  for (const [key, value] of Object.entries(node)) {
    if (key === "jp" && typeof value === "string") node.jp = jpSpacing(value);
    else fixJapaneseSpacing(value);
  }
  return node;
}

const MATCH_LABEL = {
  direct: { en: "Direct evidence", jp: "直接の証拠" },
  transferable: { en: "Transferable", jp: "転用できる強み" },
};

const capLabel = (lib, id) => {
  const cap = lib.capabilities.capabilities.find((c) => c.id === id);
  return typeof cap?.label === "string" ? cap.label : cap?.label?.en ?? id;
};

/** "A, B and C" / 「A・B・C」 */
const listEn = (parts) => (parts.length <= 1 ? parts.join("") : `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`);
const listJp = (parts) => parts.join("・");

export function keyAreas(analysis, { max = 3 } = {}) {
  return analysis.themes.filter((t) => !t.quiet).slice(0, max).map((t) => t.label);
}

const COUNT_EN = ["", "one", "two", "three", "four", "five"];

function heroBody(picks, lib, company, title, areasEn, areasJp) {
  // One sentence of context, then the lead card's own line, verbatim. The
  // person rewrites this; the draft only has to be true and short.
  const lead = picks[0]?.item.cardLine;
  const n = picks.length;
  const en = `For ${company}'s ${title}: ${COUNT_EN[n] ?? n} pieces of work chosen for ${areasEn}, each split into what I did and what the team did.`;
  const jp = `${company} の ${title} に向けて、${areasJp}を軸に ${n} 件を選んだ。どれも、自分がしたこととチームがしたことを分けてある。`;
  if (lead && typeof lead === "object" && lead.en && lead.jp) return { en: `${en} ${lead.en.trim()}`, jp: `${jp}${lead.jp.trim()}` };
  return { en, jp };
}

/**
 * The line above a card's title. Two capability labels, chosen so that five
 * cards do not all say the same two words: a label already used on an earlier
 * card is passed over when the item has another strong match to show.
 */
function emphasisFor(pick, lib, seen) {
  const candidates = pick.matched.filter((m) => m.strength !== "adjacent");
  const fresh = candidates.filter((m) => !seen.has(m.id));
  const chosen = [...fresh, ...candidates.filter((m) => seen.has(m.id))].slice(0, 2);
  for (const m of chosen) seen.add(m.id);
  const caps = chosen.map((m) => capLabel(lib, m.id));
  const label = MATCH_LABEL[pick.match];
  return { en: [label.en, ...caps].join(" · "), jp: [label.jp, ...caps].join(" · ") };
}

export function draftLens({ company, slug, analysis, picks, lib, lexicon, source, scored = [], requirements = [], seenAt }) {
  const name = lib.profile.name;
  const title = analysis.title;
  const areas = keyAreas(analysis);
  const areasEn = listEn(areas.map((a) => a.en));
  const areasJp = listJp(areas.map((a) => a.jp));
  const usedIds = new Set(picks.map((p) => p.item.slug));

  // Only sell what the chosen proof backs at strong or moderate (validate.mjs rule 7).
  const backed = (capId) => picks.some((p) => p.item.capabilities.some((c) => c.id === capId && c.strength !== "adjacent"));
  const capabilityPriority = Object.keys(analysis.capabilityWeights).filter(backed).slice(0, 8);

  const seenLabels = new Set();
  const items = picks.map((pick, index) => {
    const ref = { id: pick.item.slug };
    if (index === 0) ref.size = "lead";
    const angle = chooseAngle(pick.item, analysis, lexicon);
    if (angle) ref.angle = angle;
    ref.emphasis = emphasisFor(pick, lib, seenLabels);
    const metricIds = chooseMetrics(pick.item);
    if (metricIds.length) ref.metricIds = metricIds;
    return ref;
  });

  const fit = buildFit({ analysis, picks, lib, lexicon, seenAt, requirements });
  const sections = [{
    type: "proof",
    lede: {
      en: `Chosen for what ${company} is hiring for: ${areasEn}. Each card separates what I did from what the team did.`,
      jp: `${company} の募集内容に合わせて選んだ仕事。${areasJp}。どのカードも、自分がしたこととチームがしたことを分けて書いてある。`,
    },
    items,
  }];
  // The ledger sits right after the cards: the ten-second read, then the proof line by line.
  if (fit.rows.length) sections.push({ type: "fit" });

  // When the posting leans on AI or on interactive work, show the tools or the
  // playable pieces that back it — but only ones not already on a proof card.
  const themeIds = analysis.themes.filter((t) => !t.quiet).slice(0, 3).map((t) => t.id);
  const ranked = (predicate) => scored.filter((r) => predicate(r.item) && r.item.visibility === "public" && !usedIds.has(r.item.slug)).map((r) => r.item.slug).slice(0, 4);
  if (themeIds.includes("ai-products")) {
    const tools = ranked((i) => i.kind === "tool" && i.capabilities.some((c) => c.id === "ai" && c.strength === "strong"));
    if (tools.length) sections.push({ type: "tools", items: tools });
  }
  if (themeIds.includes("interactive-tech")) {
    const playable = ranked((i) => i.kind === "experiment" && i.playable);
    if (playable.length) sections.push({ type: "experiments", items: playable.map((id) => ({ id })) });
  }
  sections.push({ type: "capabilities" }, { type: "career-arc" }, { type: "contact" });

  const chapters = [...new Set(picks.map((p) => p.item.chapter).filter(Boolean))];
  const positioning = lib.profile.positioning[0];
  const heroTitle = typeof positioning === "string" ? { en: positioning, jp: positioning } : positioning;

  return fixJapaneseSpacing({
    $comment: `DRAFT generated by scripts/generate-pitch.mjs from ${source}. Rewrite hero.body and the ledes in your own voice; keep the ids. Set status to "published" and commit; Vercel builds /lens/${slug}.`,
    slug,
    title: `${company} — ${title}`,
    audience: `${title} at ${company} (${analysis.seniority.label.en})`,
    status: "draft",
    identity: { tagline: { en: `${title} · for ${company}`, jp: `${company} の ${title} 向け` } },
    hero: {
      eyebrow: { en: `${title} · ${company}`, jp: `${company} · ${title}` },
      title: heroTitle,
      body: heroBody(picks, lib, company, title, areasEn, areasJp),
      note: {
        en: `This page is arranged for ${company}'s focus on ${areasEn}. The evidence is the same as everywhere else on this site; only the selection and the framing change.`,
        jp: `このページは ${company} が重視する${areasJp}に合わせて並べてある。証拠はサイトの他の場所と同じ。選び方と語り口だけが違う。`,
      },
    },
    capabilityPriority,
    sections,
    fit,
    chapters,
    cta: {
      title: {
        en: `If ${company} is building something that does not have a name yet, that is where I am most useful.`,
        jp: `${company} で、まだ名前のないものを作っているなら。そこがいちばん役に立てるところだ。`,
      },
      body: {
        en: "A thirty-minute conversation about what the team is actually stuck on.",
        jp: "チームが本当に詰まっているところを、30 分で話す。",
      },
      primary: { label: { en: `Talk to ${name.split(" ")[0]}`, jp: "話してみる" }, href: "contact.html" },
    },
    lensNote: {
      en: `This view surfaces work from ${name}'s career archive relevant to ${company}'s focus on ${areasEn}. Same experience. Different lens.`,
      jp: `このページは、${name} のキャリアの記録から、${company} が重視する${areasJp}に関わる仕事を選んで見せている。同じ経験。違うレンズ。`,
    },
    seo: {
      title: `${name} — ${title} · ${company}`,
      description: `Work relevant to ${company}'s ${title}: ${areasEn}. Same experience, seen through one lens.`,
      noindex: true,
    },
    tailoredResume: {
      $comment: "Not rendered. Raw material for a résumé summary or cover letter: every highlight is a verbatim line from contribution.mine. The build's Claim Guard checks this block too.",
      summary: {
        en: `${title} at ${company} — ${name}. The closest evidence: ${listEn(picks.map((p) => p.item.shortTitle ?? p.item.title))}. ${areasEn ? `Strongest on ${areasEn}.` : ""}`.trim(),
        jp: `${company} の ${title} に向けた、${name} の要約。近い実績は ${listJp(picks.map((p) => p.item.jpTitle ?? p.item.shortTitle ?? p.item.title))}。${areasJp ? `${areasJp}に強い。` : ""}`.trim(),
      },
      highlights: picks.map((p) => ({ id: p.item.slug, role: p.item.role, match: p.match, line: p.item.contribution.mine[0] })),
    },
  });
}
