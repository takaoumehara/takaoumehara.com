// Data for src/pages/about.astro — the #books, #writing (articles), Talks &
// Workshops and Teaching & Mentoring cells. Plain data so the page component
// stays about layout, not content.
//
// Every fact below is carried over unchanged from a source already in the
// repo (docs/superforge.md: never invent numbers). Sources, verbatim:
//   BOOKS         src/data/projects/extraordinary.json (validated evidence
//                 record — publisher, year, copies, feature) + src/case-studies/
//                 extraordinary.json (co-author credit) + src/fragments/
//                 publications.html (book-meta table wording).
//   WRITING       src/fragments/publications.html — the old Publications
//                 page: 3 Substack pieces (intentfirst.substack.com), 3 Medium
//                 pieces (breakbias.medium.com), 3 Shoeisha Biz/Zine columns
//                 with their real bizzine.jp URLs.
//   WORKSHOPS     src/fragments/workshop.html — the old Workshops page: the
//                 8 BreakBias tool names, the 3 delivery formats, and the
//                 trained-client badge list.
//   TEACHING      src/fragments/about.html — the old About page's "Teaching,
//                 mentoring & playful learning" section (SVA, SOSV, kanji
//                 puzzle), cross-checked against src/data/roles.json (sva,
//                 sosv ids) for period/org agreement.
//
// The extra•ordinary book's year: the evidence record + docs/evidence-gaps.md
// both say 2013; two old, unmaintained fragment pages say "2005" for the same
// book. 2013 (the actively-validated record) is used here — see
// scratchpad/NOTES-A.md for the discrepancy.

export const BOOKS = [
  {
    id: "extraordinary",
    title: { en: "extra•ordinary", jp: "extra•ordinary" },
    subtitle: {
      en: "An Amusing Guide for Unleashing Your Creativity",
      jp: "日常に潜む創造性を解き放つ本",
    },
    year: "2013",
    publisher: "Rockport Publishers",
    role: { en: "Co-author, Art Director & Designer", jp: "共著・アートディレクション・デザイン" },
    coAuthor: "Hisako Ichiki",
    copies: "11,000+",
    feature: { en: "Featured in DESIGN QUARTERLY (Japan)", jp: "日本の DESIGN QUARTERLY に掲載" },
    summary: {
      en: "Everyday objects have latent possibilities far beyond their manufactured purpose — a paper clip becomes an architectural cantilever, a rubber band a musical chord. Co-authored, photographed and designed with architect Hisako Ichiki; launched with an LA gallery installation built from the book's own ideas.",
      jp: "日用品には本来の用途を超えた可能性が潜む。クリップは建築の梁になり、輪ゴムは楽器の弦になる。建築家・一木久子氏との共著。写真とデザインも自ら手がけ、本の世界観をそのまま LA のギャラリー展示にした。",
    },
    cover: "/assets/extraordinary/extraordinary_bookcover.png",
    links: {
      caseStudy: "/projects/extraordinary.html",
      buy: "https://www.amazon.com/Extra-Ordinary-Amusing-Unleashing-Creativity/dp/1592531229",
    },
  },
];

export const WRITING_PLATFORMS = [
  {
    id: "intentfirst",
    name: "Intent First",
    host: "intentfirst.substack.com",
    url: "https://intentfirst.substack.com",
    kind: { en: "Substack", jp: "Substack" },
    blurb: {
      en: "Deep dives into AI-native product architecture, agent orchestration, and why precision of intent replaces manual UI scaffolding.",
      jp: "AI 前提のプロダクト設計、エージェントの協調、そして「意図の明確さ」が UI 制作をどう置き換えるかを掘り下げる。",
    },
    articles: [
      {
        title: {
          en: "Why Intent Precedes Execution in Agentic Systems",
          jp: "エージェント設計においてなぜ「意図」が実装に先行するのか",
        },
      },
      {
        title: {
          en: "From One Giant Prompt to an Agent Filesystem",
          jp: "巨大なプロンプト 1 枚からエージェントファイルシステムへ",
        },
      },
      {
        title: {
          en: "The Human-in-the-Loop Judgment Boundary",
          jp: "人間が介入すべき「判断の境界線」",
        },
      },
    ],
  },
  {
    id: "breakbias",
    name: "BreakBias",
    host: "breakbias.medium.com",
    url: "https://breakbias.medium.com",
    kind: { en: "Medium", jp: "Medium" },
    blurb: {
      en: "Cognitive biases that cripple product innovation, and the 8 systematic thinking tools that free teams from them.",
      jp: "新規事業やプロダクト開発を阻む無意識の思い込みと、そこから抜け出す 8 つの発想フレームワーク。",
    },
    articles: [
      {
        title: {
          en: "Breaking the Functional Fixedness Trap",
          jp: "「機能的固着」の罠を打ち破る",
        },
      },
      {
        title: {
          en: "Systematic Innovation: 8 Thinking Tools",
          jp: "体系的イノベーション：8 つの思考ツール",
        },
      },
      {
        title: {
          en: "How Global Leaders Apply BreakBias",
          jp: "グローバル企業における BreakBias 実践例",
        },
      },
    ],
  },
  {
    id: "bizzine",
    name: "Shoeisha Biz/Zine",
    host: "bizzine.jp",
    url: "https://bizzine.jp/article/detail/2977",
    kind: { en: "Column series (JP)", jp: "連載（翔泳社 Biz/Zine）" },
    blurb: {
      en: "A 3-part column series in Shoeisha's business innovation journal Biz/Zine on eliminating cognitive bias in corporate strategy.",
      jp: "翔泳社のビジネスメディア「Biz/Zine」に寄稿した連載。イノベーション推進者や新規事業担当者に向け、思考バイアスの打破法を解説。",
    },
    articles: [
      {
        title: {
          en: "Why Teams Fail to Innovate: The Trap of Unconscious Bias",
          jp: "なぜイノベーションは起きないのか？無意識の思い込み「思考バイアス」の正体",
        },
        url: "https://bizzine.jp/article/detail/2977",
      },
      {
        title: {
          en: "Systematic Frameworks to Break Creative Deadlocks",
          jp: "発想の膠着状態を打開する 8 つのフレームワーク実践",
        },
        url: "https://bizzine.jp/article/detail/3290",
      },
      {
        title: {
          en: "From Concept to Organizational Culture: Scaling Innovation",
          jp: "組織に「バイアスを壊す文化」を定着させる組織デザイン",
        },
        url: "https://bizzine.jp/article/detail/3267",
      },
    ],
  },
];

// The 8 BreakBias transformation tools — src/fragments/workshop.html.
export const BREAKBIAS_TOOLS = [
  "Subtraction", "Division", "Multiplication", "Task Unification",
  "Attribute Dependency", "Inversion", "Extreme Constraint", "Intent Scaffolding",
];

// Delivery formats — src/fragments/workshop.html "Delivery Formats" section.
export const WORKSHOP_FORMATS = [
  {
    time: { en: "Half-Day / Full-Day", jp: "半日 〜 1 日" },
    name: { en: "Executive Sprint", jp: "エグゼクティブ・スプリント" },
    desc: {
      en: "Intensive immersion for leadership and cross-functional teams to align on an opportunity or unblock a strategic barrier.",
      jp: "経営陣やリーダー層を対象に、課題の突破や新規施策の方向性合意を 1 日で一気に達成する集中セッション。",
    },
  },
  {
    time: { en: "2–3 Days Intensive", jp: "2〜3 日間の合宿" },
    name: { en: "Innovation Lab & Build", jp: "イノベーション・ラボ" },
    desc: {
      en: "From raw problem definition through BreakBias transformations to working prototypes built alongside AI coding agents.",
      jp: "課題定義から BreakBias 変形、動くプロトタイプの制作までを一気通貫でやり切る実践型合宿。",
    },
  },
  {
    time: { en: "Multi-Week Cohort", jp: "複数週にわたるコホート" },
    name: { en: "Organizational Transformation", jp: "組織変革プログラム" },
    desc: {
      en: "Recurring workshops paired with bi-weekly advisory coaching to embed disciplined creative thinking into corporate culture.",
      jp: "ワークショップと定期メンタリングを組み合わせ、組織にイノベーションを自走させるプログラム。",
    },
  },
];

// Trained-client badges — src/fragments/workshop.html "Proven Clients".
export const WORKSHOP_CLIENTS = [
  "Google", "Microsoft", "Tiffany & Co.", "Dentsu", "Havas Worldwide",
  "School of Visual Arts (SVA)", "SOSV", "Amplify Education", "Verizon",
  "Tokyo Metropolitan Government",
];

// Teaching & mentoring — src/fragments/about.html "Teaching, mentoring &
// playful learning" section, cross-checked against roles.json (sva, sosv).
export const TEACHING = [
  {
    tag: { en: "Higher Education", jp: "大学教育" },
    title: { en: "Adjunct Professor, School of Visual Arts (SVA)", jp: "SVA 非常勤教授" },
    period: "2024",
    desc: {
      en: "Developed and taught an intensive Advanced Typography course for the Graphic Design Department in New York City — historical typography and contemporary, dynamic digital expression.",
      jp: "ニューヨーク本校のグラフィックデザイン学部にてアドバンスド・タイポグラフィの集中講義を設計・指導。歴史的タイポグラフィと現代の動的デジタル表現を扱った。",
    },
  },
  {
    tag: { en: "Venture Coaching", jp: "ベンチャー育成" },
    title: { en: "Startup Coach, SOSV", jp: "SOSV スタートアップコーチ" },
    period: "2019–2020",
    desc: {
      en: "Mentored 20 founders of Food and Blockchain seed-stage startups on customer discovery, UX strategy, identity design and go-to-market storytelling.",
      jp: "フードテックおよびブロックチェーン分野の創業者 20 名に対し、ユーザー体験設計、ブランド構築、事業立ち上げの実践的ガイダンスを提供。",
    },
  },
  {
    tag: { en: "Playful Learning", jp: "遊びと学びの実験" },
    title: { en: "Classroom Games & Discovery Tools", jp: "学びのツール制作" },
    desc: {
      en: "Designed tactile learning tools and classroom games, including a kanji recombination puzzle that lets children assemble character components like building blocks.",
      jp: "漢字を部首やパーツに分けて組み立てるパズルなど、子ども向けの学習ゲームやツールを制作。",
    },
  },
];
