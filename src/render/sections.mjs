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
  building: { en: "Building", jp: "開発中" }, exploring: { en: "Exploring", jp: "構想中" },
  active: { en: "Active", jp: "進行中" }, validating: { en: "Validating", jp: "検証中" }, prototype: { en: "Prototype", jp: "プロトタイプ" },
  "case-study": { en: "Case Study", jp: "ケーススタディ" }, "case study": { en: "Case Study", jp: "ケーススタディ" },
  paused: { en: "Paused", jp: "一時停止" }, archived: { en: "Archived", jp: "アーカイブ" }, "handed-off": { en: "Handed off", jp: "引き継ぎ済み" },
  live: { en: "Live", jp: "公開中" }, "in-progress": { en: "In progress", jp: "制作中" }, shipped: { en: "Shipped", jp: "リリース済み" },
  released: { en: "Released", jp: "公開済み" },
};
export const status = (value) => {
  if (!value) return "";
  const label = STATUS_LABEL[value] ?? value;
  return `<span class="pill pill--status">${t(label)}</span>`;
};

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

// ── What I'm building now ───────────────────────────────────────────────────
export function venturesSection({ section, lib, ctx }) {
  const nowMap = new Map((lib.now?.items ?? []).map((item) => [item.id, item]));
  const cards = section.items.map((id) => {
    const v = lib.evidence.get(id);
    if (!v) return "";
    const nowItem = nowMap.get(id);
    const itemStatus = nowItem?.status ?? v.status;
    const whyText = nowItem?.why ?? v.thesis;
    const whatText = nowItem?.oneLine ?? v.experiment;
    const nextText = nowItem?.next ?? v.question;
    const link = nowItem?.links?.live ?? nowItem?.links?.caseStudy ?? nowItem?.links?.repo ?? nowItem?.links?.external ?? v.links?.external ?? v.links?.caseStudy;

    const rows = [
      [{ en: "Why", jp: "なぜ" }, whyText],
      [{ en: "What", jp: "何をつくったか" }, whatText],
      [{ en: "Next", jp: "次に確かめたいこと" }, nextText],
    ].map(([label, value]) => `<div class="venture-row"><dt>${t(label)}</dt><dd>${tb(value)}</dd></div>`).join("");
    return `      <article class="venture-card">
        <div class="venture-head"><h3 class="card-title">${displayTitle(v)}</h3>${status(itemStatus)}</div>
        <dl class="venture-rows">${rows}</dl>
        ${link ? `<a class="card-link" href="${esc(href(ctx, link))}"${/^https?:/.test(link) ? ' target="_blank" rel="noopener"' : ""}>${/^https?:/.test(link) ? `<span class="t-en">Open ↗</span><span class="t-jp">開く ↗</span>` : `<span class="t-en">Read more →</span><span class="t-jp">詳しく →</span>`}</a>` : ""}
      </article>`;
  }).filter(Boolean).join("\n");
  return `  <section class="band ventures" id="ventures">
${sectionHead(section.title ?? { en: "What I'm building now", jp: "いま、つくっているもの。" }, section.lede ?? { en: "Products, ventures, tools, and experiments currently in motion. Some may grow into businesses. Others may simply teach me what to build next.", jp: "プロダクト、事業、ツール、実験。事業として育つものもあれば、試して終わるものもあります。どちらも、次に何をつくるかを考えるための材料です。" })}
    <div class="venture-grid">
${cards}
    </div>
  </section>`;
}

// ── Ideas & methods ─────────────────────────────────────────────────────────
export function ideasSection({ section, lib, ctx }) {
  const items = lib.ideas ?? [];
  const cards = items.map((idea) => {
    const link = idea.links?.external ?? idea.links?.caseStudy;
    const linkHtml = link
      ? `<a class="card-link" href="${esc(href(ctx, link))}"${/^https?:/.test(link) ? ' target="_blank" rel="noopener"' : ""}>${/^https?:/.test(link) ? `<span class="t-en">Explore ↗</span><span class="t-jp">詳細 ↗</span>` : `<span class="t-en">Read more →</span><span class="t-jp">詳しく →</span>`}</a>`
      : "";
    const coverHtml = idea.assets?.cover
      ? `<div class="idea-cover"><img src="${esc(href(ctx, idea.assets.cover))}" alt="${esc(idea.title)}" loading="lazy" /></div>`
      : "";
    const taglineHtml = idea.tagline
      ? `<p class="idea-tagline">${t(idea.tagline)}</p>`
      : "";
    return `      <article class="idea-card${coverHtml ? " has-cover" : ""}">
        ${coverHtml}
        <div class="idea-content">
          <div class="idea-head">
            <span class="pill">${esc(idea.year)}</span>
            <h3 class="card-title">${esc(idea.title)}</h3>
            <span class="idea-role">${esc(idea.role)}</span>
          </div>
          ${taglineHtml}
          <p class="idea-summary">${tb(idea.summary)}</p>
          ${linkHtml}
        </div>
      </article>`;
  }).join("\n");
  return `  <section class="band ideas" id="ideas">
${sectionHead(section.title ?? { en: "Ideas & methods", jp: "ずっと考えてきたこと" }, section.lede ?? { en: "Long before my current work in AI and ventures, I was interested in a simpler question: How do we see possibilities in things we normally overlook?", jp: "AI よりずっと前から、僕が興味を持ってきたのは、「見慣れたものを、どうすれば違って見られるか」ということでした。扱うテーマや技術は変わってきましたが、この問いは今の仕事にも深くつながっています。" })}
    <div class="ideas-grid">
${cards}
    </div>
  </section>`;
}

// ── Tools ───────────────────────────────────────────────────────────────────
export function toolsSection({ section, lib, ctx }) {
  const rows = section.items.map((id) => {
    const tool = lib.evidence.get(id);
    if (!tool) return "";
    const link = tool.links?.caseStudy ? href(ctx, tool.links.caseStudy) : tool.links?.repo;
    return `      <li class="tool-row">
        <a class="tool-name" href="${esc(link)}">${esc(tool.title)}</a>
        <span class="tool-desc">${tb(tool.summary)}</span>
        <span class="tool-meta">${esc((tool.stack ?? []).slice(0, 3).join(" · "))}${tool.license ? ` · ${esc(tool.license)}` : ""}</span>
      </li>`;
  }).filter(Boolean).join("\n");
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
${sectionHead(section.title ?? { en: "Different mediums. Same instinct.", jp: "媒体は変わっても、感覚は同じ。" }, section.lede ?? { en: "20+ years across brand, interactive experiences, education, product, enterprise systems, and AI. The medium kept changing — the underlying instinct did not.", jp: "ブランド、空間体験、教育、プロダクト、企業基盤、そして AI。20 年以上にわたりメディアは変わり続けても、根底にある衝動は変わりません。" })}
    <ol class="arc">
${cells}
    </ol>
    <p class="arc-more"><a href="${esc(href(ctx, "about.html"))}"><span class="t-en">Full background →</span><span class="t-jp">経歴の詳細 →</span></a></p>
  </section>`;
}

// ── Where I can be useful ───────────────────────────────────────────────────
const LEADERSHIP_AREAS = [
  {
    id: "zero-to-one",
    title: { en: "0→1 Products & Ventures", jp: "0→1 / 新規事業" },
    desc: {
      en: "Taking ambiguous concepts from zero to validated working products and new business models.",
      jp: "まだ答えのない曖昧な発想から、実際に検証できる動くプロダクトや事業の形をつくる。"
    },
    evidence: "Intent First · MyBrainSpec · Break Bias"
  },
  {
    id: "interactive-experiences",
    title: { en: "Interactive Experiences", jp: "インタラクティブ体験" },
    desc: {
      en: "Designing playful, multi-device physical and digital experiences that bring people together.",
      jp: "画面にとどまらず、身体や音、複数のスマホを使って人が集まり熱中する場を設計する。"
    },
    evidence: "Resona · Rakugaki Jam · Festival Reinvention"
  },
  {
    id: "ai-prototypes",
    title: { en: "AI Prototypes", jp: "AI プロトタイプ" },
    desc: {
      en: "Building functional AI agents and working software to validate possibilities before full-scale engineering.",
      jp: "本格開発に入る前に、動く AI エージェントやソフトウェアを直接つくり可能性を素早く確かめる。"
    },
    evidence: "Verizon AI Workflow · AI Tools · Moime"
  },
  {
    id: "product-cx-ai",
    title: { en: "Product / CX / AI", jp: "Product / CX / AI" },
    desc: {
      en: "Architecting complex enterprise product systems and embedding AI directly into human workflows.",
      jp: "大規模なプロダクト基盤を設計し、日々の業務や体験に馴染む形で AI を組み込む。"
    },
    evidence: "Verizon · T-Mobile · Amplify ELA Quests"
  },
  {
    id: "brand-creative",
    title: { en: "Brand & Creative Direction", jp: "Brand / Creative Direction" },
    desc: {
      en: "Defining brand narrative, visual language, and interaction craft from strategy through launch.",
      jp: "企業の核となる物語、視覚言語、手ざわりを定め、世に出るまで貫く。"
    },
    evidence: "KOJI FIZZ · extra•ordinary · Ogilvy"
  },
  {
    id: "japan-us",
    title: { en: "Japan ↔ US", jp: "Japan ↔ US" },
    desc: {
      en: "Bridging product sensibilities, business cultures, and cross-border expansion between Tokyo and New York.",
      jp: "ニューヨークと東京の両方の商習慣・文化感覚を理解し、プロダクトの越境を支える。"
    },
    evidence: "Bilingual Practice · NY ↔ Tokyo"
  }
];

export function capabilitiesSection({ section, lens, lib, ctx, usedEvidence }) {
  const cards = LEADERSHIP_AREAS.map((area) => `      <div class="cap-card">
        <h3 class="cap-title">${t(area.title)}</h3>
        <p class="cap-desc">${t(area.desc)}</p>
        <span class="cap-evidence">${esc(area.evidence)}</span>
      </div>`).join("\n");

  return `  <section class="band capabilities" id="capabilities">
${sectionHead(section.title ?? { en: "Where I can be useful", jp: "一緒に考えられること" }, section.lede ?? { en: "I work best before the answer is known — taking unclear ideas and making them tangible enough to test and move forward.", jp: "僕がいちばん役に立つのは、すでに決まったものをきれいに仕上げるときより、「そもそも何をつくるべきか」というところから考えるときです。" })}
    <div class="cap-grid">
${cards}
    </div>
  </section>`;
}

// ── Studio ──────────────────────────────────────────────────────────────────
export function studioSection({ section, lib }) {
  const s = lib.profile.studio;
  return `  <section class="band studio" id="studio">
${sectionHead(section.title ?? { en: "creativity is everywhere", jp: "creativity is everywhere" }, section.lede ?? { en: "The independent design & innovation studio I founded in 2006. This is where client work, ventures, interactive experiments, and executive partnerships take concrete shape.", jp: "2006 年から続けているデザイン＆イノベーションスタジオです。クライアントワークだけでなく、自分たちのプロダクト、実験、新規事業、経営チームとの仕事もここから動かしています。" })}
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

