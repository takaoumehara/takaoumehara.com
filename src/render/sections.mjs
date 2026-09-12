// The remaining sections. Each takes { section, lens, lib, ctx } and returns HTML.
import { esc, t, tb, plain, href, mediaFill } from "./html.mjs";

export function sectionHead(title, lede, opts = {}) {
  const lead = lede ? `<p class="section-lede">${tb(lede)}</p>` : "";
  return `    <div class="section-head">
      <h2 class="section-title">${t(title)}</h2>
      ${lead}
    </div>`;
}

const STATUS_LABEL = {
  active: { en: "Active", jp: "進行中" }, validating: { en: "Validating", jp: "検証中" }, prototype: { en: "Prototype", jp: "プロトタイプ" },
  paused: { en: "Paused", jp: "一時停止" }, archived: { en: "Archived", jp: "アーカイブ" }, "handed-off": { en: "Handed off", jp: "引き継ぎ済み" },
  live: { en: "Live", jp: "公開中" }, "in-progress": { en: "In progress", jp: "制作中" }, shipped: { en: "Shipped", jp: "リリース済み" },
  released: { en: "Released", jp: "公開済み" },
};
export const status = (value) => `<span class="pill pill--status">${t(STATUS_LABEL[value] ?? value)}</span>`;

// The input vocabulary is the argument on these cards, so it is bilingual.
// These are the exact words the hand-built interactive.html uses.
const INPUT_LABEL = {
  Voice: { en: "Voice", jp: "声" }, Face: { en: "Face", jp: "表情" },
  Handwriting: { en: "Handwriting", jp: "手描き" }, Typing: { en: "Typing", jp: "タイピング" },
  Pointer: { en: "Pointer", jp: "ポインタ" }, Body: { en: "Body", jp: "身体" },
  "Two phones": { en: "Two phones", jp: "2 台のスマホ" },
  "Every phone": { en: "Every phone", jp: "その場の全端末" },
};
export const inputLabel = (value) => t(INPUT_LABEL[value] ?? value);

/** A card heading. Several "titles" are sentences, not names, so they need Japanese. */
export const displayTitle = (item) =>
  item.jpTitle && item.jpTitle !== item.title ? t({ en: item.title, jp: item.jpTitle }) : esc(item.title);

/** A project's name for display: English, with the Japanese title when one exists. */
function evidenceName(items) {
  const en = items.map((i) => i.shortTitle ?? i.title).join(" · ");
  const jp = items.map((i) => i.jpTitle ?? i.shortTitle ?? i.title).join(" · ");
  return en === jp ? esc(en) : t({ en, jp });
}

// ── What I'm exploring now ──────────────────────────────────────────────────
export function exploringSection({ section, lib, ctx }) {
  const cells = section.items.map((id) => {
    const thesis = lib.theses.find((th) => th.id === id);
    if (thesis) {
      return `      <div class="explore-cell">
        <h3 class="explore-statement">${t(thesis.statement)}</h3>
        ${thesis.body ? `<p class="explore-body">${tb(thesis.body)}</p>` : ""}
      </div>`;
    }
    const venture = lib.evidence.get(id);
    const link = venture.links?.external ?? venture.links?.caseStudy;
    return `      <div class="explore-cell">
        <p class="explore-kicker">${esc(venture.shortTitle ?? venture.title)} ${status(venture.status)}</p>
        <h3 class="explore-statement">${t(venture.question)}</h3>
        <p class="explore-body">${tb(venture.thesis)}</p>
        ${link ? `<a class="card-link" href="${esc(href(ctx, link))}"${/^https?:/.test(link) ? ' target="_blank" rel="noopener"' : ""}>${esc(plain(venture.shortTitle ?? venture.title))} →</a>` : ""}
      </div>`;
  }).join("\n");
  return `  <section class="band exploring" id="exploring">
${sectionHead(section.title ?? { en: "What I'm exploring now", jp: "いま探っていること" }, section.lede)}
    <div class="explore-grid">
${cells}
    </div>
  </section>`;
}

// ── I make things to think ──────────────────────────────────────────────────
export function experimentsSection({ section, lib, ctx }) {
  const cards = section.items.map((ref) => {
    const item = lib.evidence.get(ref.id);
    // A card gets one line. The lens may still reframe it with an approved angle;
  // the full summary belongs on the page behind the card, not on the card.
  const summary = ref.summaryOverride ?? (ref.angle ? item.angles[ref.angle] : item.cardLine ?? item.summary);
    const live = item.playable && item.links?.live;
    const link = live
      ? `<a class="card-link" href="${esc(item.links.live)}" target="_blank" rel="noopener"><span class="t-en">Try it ↗</span><span class="t-jp">触ってみる ↗</span></a>`
      : item.links?.caseStudy ? `<a class="card-link" href="${esc(href(ctx, item.links.caseStudy))}"><span class="t-en">Case study →</span><span class="t-jp">ケーススタディ →</span></a>` : "";
    const target = live ? ` data-href="${esc(item.links.live)}" data-external="true"` : item.links?.caseStudy ? ` data-href="${esc(href(ctx, item.links.caseStudy))}"` : "";
    const art = mediaFill(item, ctx);
    return `      <article class="exp-card" tabindex="0"${target}>
        <div class="exp-media">${art}</div>
        <div class="card-body">
          <p class="chips"><span class="pill pill--in">${inputLabel(item.input)}</span>${status(item.status)}</p>
          <h3 class="card-title">${displayTitle(item)}</h3>
          <p class="card-desc">${tb(summary)}</p>
          ${link}
        </div>
      </article>`;
  }).join("\n");
  return `  <section class="band experiments" id="experiments">
${sectionHead(section.title ?? { en: "I make things to think", jp: "考えるために、つくる" }, section.lede ?? { en: "Input: a voice, a face, a drawn line, every phone in the room. Output: a screen bigger than the one you are holding. Almost none of it is AI — it is networking, tracking and timing.", jp: "入力は声・表情・手描きの線・その場のスマホ全部。出力は手元より大きな画面。ほとんど AI ではなく、通信とトラッキングとタイミングの仕事。" })}
    <div class="exp-grid">
${cards}
    </div>
  </section>`;
}

// ── Things I'm betting on ───────────────────────────────────────────────────
export function venturesSection({ section, lib, ctx }) {
  const cards = section.items.map((id) => {
    const v = lib.evidence.get(id);
    const link = v.links?.external ?? v.links?.caseStudy;
    const rows = [
      [{ en: "Thesis", jp: "仮説" }, v.thesis],
      [{ en: "Experiment", jp: "実験" }, v.experiment],
      [{ en: "Question", jp: "問い" }, v.question],
    ].map(([label, value]) => `<div class="venture-row"><dt>${t(label)}</dt><dd>${tb(value)}</dd></div>`).join("");
    return `      <article class="venture-card">
        <div class="venture-head"><h3 class="card-title">${displayTitle(v)}</h3>${status(v.status)}</div>
        <dl class="venture-rows">${rows}</dl>
        ${link ? `<a class="card-link" href="${esc(href(ctx, link))}"${/^https?:/.test(link) ? ' target="_blank" rel="noopener"' : ""}>${/^https?:/.test(link) ? `<span class="t-en">Open ↗</span><span class="t-jp">開く ↗</span>` : `<span class="t-en">Read more →</span><span class="t-jp">詳しく →</span>`}</a>` : ""}
      </article>`;
  }).join("\n");
  return `  <section class="band ventures" id="ventures">
${sectionHead(section.title ?? { en: "Things I'm betting on", jp: "いま賭けていること" }, section.lede ?? { en: "Not a gallery of side projects. Each one is a belief, the thing built to test it, and the question still open.", jp: "サイドプロジェクトの一覧ではない。それぞれが、ひとつの信念と、それを試すために作ったものと、まだ開いている問い。" })}
    <div class="venture-grid">
${cards}
    </div>
  </section>`;
}

// ── Tools ───────────────────────────────────────────────────────────────────
export function toolsSection({ section, lib, ctx }) {
  const rows = section.items.map((id) => {
    const tool = lib.evidence.get(id);
    const link = tool.links?.caseStudy ? href(ctx, tool.links.caseStudy) : tool.links?.repo;
    return `      <li class="tool-row">
        <a class="tool-name" href="${esc(link)}">${esc(tool.title)}</a>
        <span class="tool-desc">${tb(tool.summary)}</span>
        <span class="tool-meta">${esc((tool.stack ?? []).slice(0, 3).join(" · "))}${tool.license ? ` · ${esc(tool.license)}` : ""}</span>
      </li>`;
  }).join("\n");
  return `  <section class="band tools" id="tools">
${sectionHead(section.title ?? { en: "I build the tools I build with", jp: "道具のほうも、自分でつくる" }, section.lede)}
    <ul class="tool-list">
${rows}
    </ul>
  </section>`;
}

// ── Career arc ──────────────────────────────────────────────────────────────
export function careerArcSection({ section, lens, lib, ctx }) {
  const emphasised = new Set(lens.chapters ?? []);
  const cells = lib.chapters.map((chapter) => {
    const roles = (chapter.roles ?? []).map((id) => lib.roles.find((r) => r.id === id)).filter(Boolean);
    const roleRows = roles.map((r) => {
      const period = r.period ? `<span class="arc-period">${esc(r.period.start)}${r.period.end ? `–${esc(r.period.end)}` : ""}</span>` : "";
      return `<li><b>${esc(r.organization)}</b> <span class="arc-title">${esc(r.title)}</span>${period}</li>`;
    }).join("");
    const cls = emphasised.size ? (emphasised.has(chapter.id) ? " is-emphasised" : " is-quiet") : "";
    return `      <li class="arc-cell${cls}">
        <h3 class="arc-label">${t(chapter.label)}${chapter.period ? ` <span class="arc-period">${esc(chapter.period)}</span>` : ""}</h3>
        <p class="arc-summary">${tb(chapter.summary)}</p>
        ${roleRows ? `<ul class="arc-roles">${roleRows}</ul>` : ""}
      </li>`;
  }).join("\n");
  return `  <section class="band career" id="career">
${sectionHead(section.title ?? { en: "Career arc", jp: "これまでの流れ" }, section.lede ?? { en: "Twenty years, one instinct. The mediums changed; the move — find the real question, make it tangible, let people react — did not.", jp: "20年、ひとつの勘。媒体は変わっても、本当の問いを見つけ、形にして、人の反応を見るという動きは変わらなかった。" })}
    <ol class="arc">
${cells}
    </ol>
    <p class="arc-more"><a href="${esc(href(ctx, "about.html"))}"><span class="t-en">Full background →</span><span class="t-jp">経歴の詳細 →</span></a></p>
  </section>`;
}

// ── Where I can be useful ───────────────────────────────────────────────────
export function capabilitiesSection({ section, lens, lib, ctx, usedEvidence }) {
  const byId = new Map(lib.capabilities.capabilities.map((c) => [c.id, c]));
  const groups = lib.capabilities.groups;
  const rows = new Map(groups.map((g) => [g.id, []]));
  for (const capId of lens.capabilityPriority) {
    const cap = byId.get(capId);
    const backing = usedEvidence.filter((item) => item.capabilities.some((c) => c.id === capId && c.strength === "strong"));
    const examples = backing.length ? evidenceName(backing.slice(0, 3)) : "";
    rows.get(cap.group).push(`        <li class="cap">
          <span class="cap-label">${t(cap.label)}</span>
          ${cap.note ? `<span class="cap-note">${t(cap.note)}</span>` : ""}
          ${examples ? `<span class="cap-evidence">${examples}</span>` : ""}
        </li>`);
  }
  const columns = groups.filter((g) => rows.get(g.id).length).map((g) => `      <div class="cap-group">
        <h3 class="cap-group-label">${t(g.label)}</h3>
        <ul class="cap-list">
${rows.get(g.id).join("\n")}
        </ul>
      </div>`).join("\n");
  return `  <section class="band capabilities" id="capabilities">
${sectionHead(section.title ?? { en: "Where I can be useful to leadership", jp: "どこで役に立てるか" }, section.lede)}
    <div class="cap-grid">
${columns}
    </div>
  </section>`;
}

// ── Studio ──────────────────────────────────────────────────────────────────
export function studioSection({ section, lib }) {
  const s = lib.profile.studio;
  return `  <section class="band studio" id="studio">
${sectionHead(section.title ?? { en: "Creativity is everywhere", jp: "Creativity is everywhere" }, section.lede)}
    <div class="studio-row">
      <p class="studio-note">${tb(s.note)}</p>
      <a class="btn-secondary" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a>
    </div>
  </section>`;
}

// ── Contact / closing ───────────────────────────────────────────────────────
export function contactSection({ lens, lib, ctx, showLensNote }) {
  const secondary = lens.cta.secondary
    ? `<a href="${esc(href(ctx, lens.cta.secondary.href))}" class="hero-alt">${t(lens.cta.secondary.label)}</a>`
    : `<a href="${esc(lib.profile.contact.linkedin)}" target="_blank" rel="noopener" class="hero-alt"><span class="t-en">Or reach me on LinkedIn →</span><span class="t-jp">LinkedIn でも →</span></a>`;
  const note = showLensNote
    ? `    <p class="lens-note"><span class="t-en">This view surfaces work from Takao's career archive most relevant to this opportunity. Same experience. Different lens.</span><span class="t-jp">このページは、Takao のキャリアの記録から、この機会にもっとも関係の深い仕事を選んで見せています。同じ経験。違うレンズ。</span> <a href="${esc(href(ctx, "index.html"))}"><span class="t-en">The whole story →</span><span class="t-jp">全体の物語 →</span></a></p>`
    : "";
  return `  <section class="end" id="contact">
    <h2 class="end-line">${t(lens.cta.title)}</h2>
    ${lens.cta.body ? `<p class="end-sub">${tb(lens.cta.body)}</p>` : ""}
    <div class="end-actions">
      <a href="${esc(href(ctx, lens.cta.primary.href))}" class="btn-primary">${t(lens.cta.primary.label)}</a>
      ${secondary}
    </div>
    <p class="end-mail"><a href="mailto:${esc(lib.profile.contact.email)}">${esc(lib.profile.contact.email)}</a></p>
${note}
  </section>`;
}
