// Selected proof: the cards that carry the argument. Each card shows the
// framing the Lens chose, the metrics the Lens chose to surface, and — behind
// a <details> — the honest split of what Takao did and what the team did.
import { esc, t, tb, plain, href } from "./html.mjs";
import { sectionHead, displayTitle } from "./sections.mjs";

const ENGAGEMENT_LABEL = {
  volunteer: { en: "Volunteer role", jp: "ボランティア" },
  "own-venture": { en: "Own venture", jp: "自身のベンチャー" },
  "open-source": { en: "Open source", jp: "オープンソース" },
  concept: { en: "Self-initiated concept", jp: "自主制作コンセプト" },
  freelance: { en: "Independent", jp: "独立案件" },
  employee: null, unstated: null,
};

export const periodLabel = (period) => {
  if (!period) return "";
  if (!period.end) return period.start;
  return `${period.start}–${period.end === "present" ? "present" : period.end}`;
};

export function cardMedia(item, ctx) {
  const image = item.assets?.thumb ?? item.assets?.hero;
  if (image) return `<div class="card-media"><img src="${esc(href(ctx, image))}" alt="" loading="lazy"></div>`;
  const art = item.assets?.art ?? "card-art--intent";
  const label = item.assets?.artLabel ?? item.shortTitle ?? item.title;
  return `<div class="card-media"><div class="card-art ${esc(art)}"><span class="card-art-label">${esc(label)}</span></div></div>`;
}

export function metricRow(item, metricIds) {
  if (!metricIds?.length) return "";
  const metrics = metricIds.map((id) => item.metrics.find((m) => m.id === id)).filter(Boolean);
  return `<dl class="metrics">${metrics.map((m) => `<div class="metric"><dt>${esc(m.value)}</dt><dd>${t(m.label)}</dd></div>`).join("")}</dl>`;
}

export function contributionDetails(item) {
  const mine = item.contribution.mine.map((line) => `<li>${esc(line)}</li>`).join("");
  const team = item.contribution.team?.length
    ? `<h4><span class="t-en">What the team did</span><span class="t-jp">チームがしたこと</span></h4><ul>${item.contribution.team.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>`
    : "";
  return `<details class="contrib"><summary><span class="t-en">What I did · what the team did</span><span class="t-jp">自分がしたこと · チームがしたこと</span></summary>
      <div class="contrib-body"><h4><span class="t-en">What I did</span><span class="t-jp">自分がしたこと</span></h4><ul>${mine}</ul>${team}</div></details>`;
}

export function proofCard({ ref, item, ctx, index }) {
  const summary = ref.summaryOverride ?? (ref.angle ? item.angles[ref.angle] : item.summary);
  const size = ref.size ?? (index === 0 ? "lead" : "standard");
  const engagement = ENGAGEMENT_LABEL[item.engagement];
  const meta = [item.organization, item.role, periodLabel(item.period)].filter(Boolean).map(esc).join(" · ");
  const link = item.links?.caseStudy
    ? `<a class="card-link" href="${esc(href(ctx, item.links.caseStudy))}"><span class="t-en">Case study →</span><span class="t-jp">ケーススタディ →</span></a>`
    : item.links?.live
      ? `<a class="card-link" href="${esc(item.links.live)}" target="_blank" rel="noopener"><span class="t-en">Open it ↗</span><span class="t-jp">開く ↗</span></a>`
      : "";
  const target = item.links?.caseStudy ? ` data-href="${esc(href(ctx, item.links.caseStudy))}"` : item.links?.live ? ` data-href="${esc(item.links.live)}" data-external="true"` : "";
  return `      <article class="proof-card is-${size}" tabindex="0"${target}>
        ${cardMedia(item, ctx)}
        <div class="card-body">
          ${ref.emphasis ? `<p class="card-emphasis">${t(ref.emphasis)}</p>` : ""}
          <h3 class="card-title">${displayTitle(item)}</h3>
          <p class="card-meta">${meta}${engagement ? ` <span class="card-flag">${t(engagement)}</span>` : ""}</p>
          <p class="card-desc">${tb(summary)}</p>
          ${metricRow(item, ref.metricIds)}
          ${contributionDetails(item)}
          ${link}
        </div>
      </article>`;
}

export function proofSection({ section, lens, lib, ctx }) {
  const cards = section.items.map((ref, index) => proofCard({ ref, item: lib.evidence.get(ref.id), ctx, index })).join("\n");
  return `  <section class="band proof" id="proof">
${sectionHead(section.title ?? { en: "Selected proof", jp: "選んだ証拠" }, section.lede)}
    <div class="proof-grid">
${cards}
    </div>
  </section>`;
}
