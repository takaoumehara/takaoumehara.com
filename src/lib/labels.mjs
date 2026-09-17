// Bilingual labels and small display helpers shared by the lens sections, the
// category pages, the archive and the sidebar. Ported from src/render.
import { t, esc } from "./html.mjs";

const STATUS_LABEL = {
  building: { en: "Building", jp: "開発中" }, exploring: { en: "Exploring", jp: "構想中" },
  active: { en: "Active", jp: "進行中" }, validating: { en: "Validating", jp: "検証中" }, prototype: { en: "Prototype", jp: "プロトタイプ" },
  "case-study": { en: "Case Study", jp: "ケーススタディ" }, "case study": { en: "Case Study", jp: "ケーススタディ" },
  paused: { en: "Paused", jp: "一時停止" }, archived: { en: "Archived", jp: "アーカイブ" }, "handed-off": { en: "Handed off", jp: "引き継ぎ済み" },
  live: { en: "Live", jp: "公開中" }, "in-progress": { en: "In progress", jp: "制作中" }, shipped: { en: "Shipped", jp: "リリース済み" },
  released: { en: "Released", jp: "公開済み" },
};
/** A status pill, or "" when the record has no status. HTML string. */
export const status = (value) => {
  if (!value) return "";
  const label = STATUS_LABEL[value] ?? value;
  return `<span class="pill pill--status">${t(label)}</span>`;
};

// The input vocabulary is the argument on the interactive cards, so it is bilingual.
const INPUT_LABEL = {
  Voice: { en: "Voice", jp: "声" }, Face: { en: "Face", jp: "表情" },
  Handwriting: { en: "Handwriting", jp: "手描き" }, Typing: { en: "Typing", jp: "タイピング" },
  Pointer: { en: "Pointer", jp: "ポインタ" }, Body: { en: "Body", jp: "身体" },
  "Two phones": { en: "Two phones", jp: "2 台のスマホ" },
  "Every phone": { en: "Every phone", jp: "その場の全端末" },
};
export const inputLabel = (value) => t(INPUT_LABEL[value] ?? value);

/** A card heading. Several "titles" are sentences, not names, so they need Japanese. HTML string. */
export const displayTitle = (item) =>
  item.jpTitle && item.jpTitle !== item.title ? t({ en: item.title, jp: item.jpTitle }) : esc(item.title);

/** The card heading by the name people use, not the full title of the work. HTML string. */
export const cardName = (item) => {
  const name = item.shortTitle ?? item.title;
  return item.jpTitle && item.jpTitle !== name ? t({ en: name, jp: item.jpTitle }) : esc(name);
};

/** Several records' names joined, English with Japanese when any differs. HTML string. */
export function evidenceName(items) {
  const en = items.map((i) => i.shortTitle ?? i.title).join(" · ");
  const jp = items.map((i) => i.jpTitle ?? i.shortTitle ?? i.title).join(" · ");
  return en === jp ? esc(en) : t({ en, jp });
}

export const periodLabel = (period) => {
  if (!period) return "";
  if (!period.end) return period.start;
  return `${period.start}–${period.end === "present" ? "present" : period.end}`;
};

const ENGAGEMENT_LABEL = {
  volunteer: { en: "Volunteer role", jp: "ボランティア" },
  "own-venture": { en: "Own venture", jp: "自身のベンチャー" },
  "open-source": { en: "Open source", jp: "オープンソース" },
  concept: { en: "Self-initiated concept", jp: "自主制作コンセプト" },
  freelance: { en: "Independent", jp: "独立案件" },
  employee: null, unstated: null,
};
export const engagementLabel = (value) => ENGAGEMENT_LABEL[value] ?? null;

// The one flag a recruiter scans for: how much of this was the person's. It
// comes from contribution.level / teamSize on the record, never from a lens, and
// it prints nothing when the record does not say.
const LEVEL_LABEL = {
  solo: { en: "Solo", jp: "ひとりで" },
  led: { en: "Led", jp: "率いた" },
  "co-led": { en: "Co-led", jp: "共同で率いた" },
  contributor: { en: "Contributor", jp: "一員として" },
  advised: { en: "Advised", jp: "助言" },
};
/** HTML string: " <span class=card-flag …>" or "". */
export function roleFlag(item) {
  const level = LEVEL_LABEL[item.contribution?.level];
  if (!level) return "";
  const size = item.contribution.teamSize;
  const label = size && item.contribution.level !== "solo"
    ? { en: `${level.en} · team of ${size}`, jp: `${level.jp} · ${size} 人` }
    : level;
  return ` <span class="card-flag card-flag--role">${t(label)}</span>`;
}
