# Adaptive Career Portfolio — アーキテクチャ提案 (Phase 1)

> Written by: superforge (architecture) · Last updated: 2026-09-11
> 原則: **One Takao. One evidence base. Different lenses.**
> 実装は `src/` 以下。生成物は `index.html` と `lens/<slug>/index.html`。

---

## 0. 結論（先に）

| 問い | 答え |
|---|---|
| フレームワークを入れるか | **入れない。** 依存ゼロの Node スクリプト（`src/build.mjs`）で静的 HTML を生成する。Vercel の設定変更も不要 |
| 動的ルートをどう作るか | **ビルド時に生成**。`src/lenses/<slug>.json` を置くと `lens/<slug>/index.html` が生成される。訪問時に LLM は一切走らない（AI-assisted authoring, deterministic publishing） |
| 生成物はコミットするか | **する。** PR の diff が「公開される HTML そのもの」になるので、人間の承認（principle 17）が git のレビューで完結する。鮮度はテストで担保 |
| 既存 35 ページはどうするか | **触らない。** 既存のケーススタディ HTML は「証拠の詳細ページ」として残し、データ側から `caseStudyUrl` でリンクする |
| 現在の `index.html` は | `index-console.html` として保存（この repo の慣習: index-b / index-grad / index-v1 / index-v53 と同じ）。新しい `index.html` は default lens から生成 |

---

## 1. 現在のコードベースで再利用できるもの

| 資産 | 再利用 |
|---|---|
| デザイントークン（`--bg #fbfaf7`, `--ink`, `--line`, DM Serif Display + Geist + Noto Sans JP） | そのまま。lens ページは同じ変数を使う |
| サイト共通シェル（7 項目の 2 段ナビ・縦書き EN/JP スイッチ・フッター・モバイルメニュー） | `src/render/shell.mjs` に 1 か所で持ち、全生成ページに配る |
| `.t-en / .t-jp` の言語切替規約 + `localStorage("tu-lang")` | データ側の文字列は `string | {en, jp}` を受け付け、`{en,jp}` なら既存の span 規約で出力 |
| `assets/thumbs/*.jpg`（27 件）・`assets/hero/*` | Project の `assets.thumb / assets.hero` から参照 |
| 既存のケーススタディ 30 ページ | 証拠の詳細先。書き直さない |
| `tests/*.test.mjs`（node:test、依存なし） | 同じ流儀で `tests/lens-system.test.mjs` を追加 |
| `docs/superforge.md` の pin（推測数値を書かない・不明は不明と書く） | データ検証ルールに昇格させる（§6 Claim Guard） |

## 2. 変えるべきもの

| 現状 | 問題 | 変更 |
|---|---|---|
| コンテンツが各 HTML に直書き（同じ案件の説明が index / work / brand / project page に 4 回存在） | 一度直すと 4 か所直す。Lens を増やすほど悪化 | `src/data/` を唯一の正とし、ページは生成する |
| 現在の `index.html` は「Product Designer, Agentic UX」を売る Persuade ページ | 新しい positioning（Design & AI Executive · Venture Builder / 「I like the beginning of things」）と一致しない | default lens として作り直す |
| `tests/ai-tools-portfolio.test.mjs` の homepage 3 テストが旧構成（Selected Work 7 枚＋カテゴリ索引）を固定している。**現状 main で既に 6 件 fail** | 新しい構成と矛盾 | homepage 3 テストを新構成向けに書き換え、nav テストは新 `index.html` で通す（fail 6 → 0） |
| 「Agentic UX」表記の残骸 | pin（2026-08-06）で `AI Products` に変更済み | 生成ページは pin に従う |

---

## 3. データアーキテクチャ（Career Evidence Library）

```
src/
  data/
    capabilities.json         # 能力タクソノミー（6 群・27 項目）
    chapters.json             # キャリアの章（Brand → Interactive → EdTech/Product → Enterprise/CX → AI/Ventures）
    roles.json                # 雇用・リーダー職（org / title / period / location）
    theses.json               # 信じていること（"I like the beginning of things" など）
    profile.json              # 名前・所在地・連絡先・スタジオ（lens が上書きしない固定部分）
    projects/<slug>.json      # PROJECT   クライアント／組織の仕事
    ventures/<slug>.json      # VENTURE   現在つくっている製品・事業
    experiments/<slug>.json   # EXPERIMENT 遊べる・触れる・探索的な制作
    tools/<slug>.json         # TOOL      AI ツール・OSS
  lenses/<slug>.json          # Lens 設定（データを複製しない）
  schema.d.ts                 # 型（エディタ補完用。実行時検証は validate.mjs）
  validate.mjs                # スキーマ検証 + Claim Guard
  render/                     # コンポーネント（純関数: data → HTML 文字列）
  build.mjs                   # lenses → index.html / lens/<slug>/index.html
```

### 3.1 共通の Evidence 型（全 kind に共通）

```ts
type Evidence = {
  id: string                 // "project:koji-fizz" のように kind を含めない。kind はディレクトリで決まる
  kind: "project" | "venture" | "experiment" | "tool"
  slug: string
  title: string
  shortTitle?: string
  organization?: string
  period?: { start: string; end?: string | "present" }   // "2023-04" 形式
  location?: string
  role: string               // 肩書き（"Producer / Creative Partner"）
  engagement: "employee" | "freelance" | "volunteer" | "own-venture" | "open-source" | "concept"
  summary: Localized         // Lens が何も指定しない時の説明（60 語以内）
  angles?: Record<string, Localized>   // ★ 同じ事実の別の語り口。Lens は angle 名を選ぶだけ
  capabilities: { id: CapabilityId; strength: "strong" | "moderate" | "adjacent" }[]  // ★ 能力ごとに強度
  contribution: {
    mine: string[]           // ★ 自分がしたこと
    team?: string[]          // ★ チーム／パートナーがしたこと
    notMine?: string[]       // ★ 自分は「していない」こと（例: cinematography）。Claim Guard が参照
  }
  metrics?: Metric[]
  chapter?: ChapterId
  context?: { industries?: string[]; audiences?: string[]; mediums?: string[]; markets?: ("US"|"JP"|"Global")[] }
  assets?: { thumb?: string; hero?: string; art?: string }   // art = 画像が無い時の CSS アート class
  links?: { caseStudy?: string; live?: string; repo?: string; external?: string }
  visibility: "public" | "lens-only" | "private"
}

type Metric = {
  id: string                 // "games-revenue-3x"
  value: string              // "3×"
  label: Localized           // "game revenue growth over ~3 years"
  basis?: string             // 何をどう測ったか（"vs. pre-COVID game revenue"）
  confidence: "stated" | "approximate" | "unverified"
}

type Localized = string | { en: string; jp?: string }
```

ユーザー案からの改善点:

1. **`contribution.mine / team / notMine`** — 「WHAT I DID vs WHAT THE TEAM DID」を構造で分離。さらに `notMine` を持たせ、Lens 側の文言検査に使う（KOJI FIZZ で "cinematography" を書けなくする）。
2. **`capabilities[].strength`** — 強度を案件単位ではなく能力単位で持つ。将来の JD 解析で DIRECT / TRANSFERABLE / GAP を機械的に出せる（§8）。
3. **`angles`** — 「同じ案件の別の説明」を Lens ではなく **証拠側** に置く。Lens が選べるのは承認済みの語り口だけ。Lens 側の自由記述（`summaryOverride`）は残すが Claim Guard の対象。
4. **`Metric.confidence`** — pin「推測数値を書かない」を型にした。`unverified` の指標は Lens が highlight できない（ビルドが落ちる）。
5. `situation / problem / opportunity / thesis / whatWasBuilt / constraints / impact` は **`narrative`** に束ねる（下記）。全 kind に必須にしない。

### 3.2 kind 別の拡張

```ts
type Project = Evidence & {
  kind: "project"
  narrative?: {
    situation?: string; problem?: string; opportunity?: string
    constraints?: string[]
    built?: string[]                       // 何ができたか
    impact?: { business?: string[]; user?: string[]; organizational?: string[] }
  }
}

type Venture = Evidence & {               // 「サイドプロジェクトの一覧」にしないための 4 点セット
  kind: "venture"
  thesis: Localized                       // 何を信じているか
  experiment: Localized                   // 何をつくったか
  question: Localized                     // 何を学ぼうとしているか
  status: "active" | "validating" | "prototype" | "paused" | "archived" | "handed-off"
}

type Experiment = Evidence & {            // Interactive / Playable
  kind: "experiment"
  input: string                           // "voice" | "face" | "handwriting" | "every phone" …（interactive.html の語彙をそのまま）
  status: "live" | "in-progress" | "prototype" | "shipped"
  playable: boolean                       // 公開 URL があり、今すぐ開けるか
}

type Tool = Evidence & { kind: "tool"; status: "released" | "in-progress"; stack?: string[] }
```

### 3.3 例: `src/data/projects/koji-fizz.json`

```json
{
  "kind": "project",
  "slug": "koji-fizz",
  "title": "KOJI FIZZ — Short Film Series",
  "shortTitle": "KOJI FIZZ",
  "organization": "KOJI FIZZ (Japanese sparkling sake brand)",
  "period": { "start": "2023" },
  "location": "New York",
  "role": "Producer / Creative Partner",
  "engagement": "freelance",
  "summary": "A promotional short-film series for a new Japanese sparkling sake, told through real New York creatives. I ran the client side and the creative intent; a director and production team made the films.",
  "angles": {
    "creative": "A brand film series built on a single decision: let real New York creatives, not actors, carry the story. I shaped the concept, chose the director and guided what the films were about.",
    "leadership": "Client-facing creative production: translating a new brand's intent into a brief, selecting the director, and keeping a small production team pointed at the same story."
  },
  "capabilities": [
    { "id": "creative-direction", "strength": "strong" },
    { "id": "film-production", "strength": "strong" },
    { "id": "storytelling", "strength": "strong" },
    { "id": "brand", "strength": "strong" },
    { "id": "partner-direction", "strength": "strong" },
    { "id": "executive-partnership", "strength": "moderate" }
  ],
  "contribution": {
    "mine": [
      "Client communication and expectation-setting",
      "Shaping the overall concept",
      "Selecting and hiring the film director",
      "Deciding who the story should focus on",
      "Shaping the narrative / short story",
      "Guiding creative intention with the director and production team"
    ],
    "team": [
      "Directing, cinematography and editing — film director and production team"
    ],
    "notMine": ["cinematography", "film directing", "editing", "directed the film", "shot the film"]
  },
  "metrics": [],
  "chapter": "brand",
  "context": { "industries": ["beverage"], "mediums": ["film"], "markets": ["US", "JP"] },
  "assets": { "thumb": "assets/thumbs/koji-fizz.jpg" },
  "links": { "caseStudy": "projects/koji-fizz.html" },
  "visibility": "public"
}
```

`metrics` が空なのは意図的。既存ページには "Exceeded client expectations" しかなく、数値の裏付けが無い。**書けない指標は書かない。**

---

## 4. Lens アーキテクチャ

```ts
type Lens = {
  slug: string                          // URL: / (default) または /lens/<slug>
  title: string                         // 管理用
  audience?: string                     // "Creative Director roles" — 管理用メモ
  status: "published" | "draft"         // draft はビルドから除外
  identity?: { tagline: Localized }     // 名前の下の一行。省略時は profile.json の既定
  hero: { eyebrow?: Localized; title: Localized; body: Localized; note?: Localized }
  capabilityPriority: CapabilityId[]    // "Where I can be useful" の順序 + カードのチップ順
  sections: Section[]                   // ★ 順序 = 表示順。無いセクションは出ない
  chapters?: ChapterId[]                // career-arc で強調する章（省略時は全章）
  cta: { title: Localized; body?: Localized; primary: { label: Localized; href: string }; secondary?: {...} }
  seo: { title: string; description: string; noindex: boolean }
  lensNote?: boolean                    // 末尾に "Same experience. Different lens." を出す（default: /lens/* は true）
}

type Section =
  | { type: "proof";       title?: Localized; items: ProofRef[] }        // Selected proof
  | { type: "exploring";   title?: Localized; items: string[] }          // What I'm exploring now（venture / thesis id）
  | { type: "experiments"; title?: Localized; items: ProofRef[] }        // I make things to think
  | { type: "ventures";    title?: Localized; items: string[] }          // Things I'm betting on
  | { type: "career-arc";  title?: Localized }                           // chapters + roles
  | { type: "capabilities"; title?: Localized }                          // capabilityPriority から生成
  | { type: "studio";      title?: Localized }                           // creativityiseverywhere.com への導線
  | { type: "contact" }                                                  // cta から生成

type ProofRef = {
  id: string                            // "koji-fizz"（kind は id 解決で判定）
  angle?: string                        // evidence.angles のキー。無ければ summary
  summaryOverride?: Localized           // 逃げ道。Claim Guard の対象
  emphasis?: Localized                  // カード上部の一行（"Film · Brand · Client leadership"）
  metricIds?: string[]                  // 強調する指標。evidence.metrics に存在し confidence != unverified であること
  size?: "lead" | "standard"            // 先頭 1 件を大きく
}
```

**Lens は id と語り口を選ぶだけ**で、事実（役割・貢献・指標）を新たに書けない。`summaryOverride` だけが自由記述で、§6 の Claim Guard を通らないとビルドが落ちる。

### 4.1 例: `src/lenses/creative.json`（抜粋）

```json
{
  "slug": "creative",
  "title": "Creative Executive",
  "status": "published",
  "identity": { "tagline": "Creative Director · Design & AI Executive" },
  "hero": {
    "eyebrow": "Creative leadership, across mediums",
    "title": "Different medium. Same instinct.",
    "body": "Brand films, room-scale interactive work, a festival rebuilt from scratch, and now AI. I like the beginning of things — the part where the idea is still soft and needs someone to make it real enough to react to."
  },
  "capabilityPriority": ["creative-direction", "brand", "storytelling", "film-production", "interactive", "creative-technology", "partner-direction", "ai"],
  "sections": [
    { "type": "proof", "items": [
      { "id": "rakugaki-jam", "size": "lead", "emphasis": "Interactive · Live" },
      { "id": "koji-fizz", "angle": "creative", "emphasis": "Film · Brand · Storytelling" },
      { "id": "festival-reinvention", "angle": "creative", "metricIds": ["games-revenue-3x"] },
      { "id": "coca-cola", "emphasis": "Global brand" },
      { "id": "kitadoko", "angle": "creative", "metricIds": ["repeat-rate"] },
      { "id": "verizon-ai-workflow", "angle": "creative-tech" }
    ]},
    { "type": "experiments", "items": [{ "id": "resona" }, { "id": "typespace" }, { "id": "koe-baku" }] },
    { "type": "capabilities" },
    { "type": "career-arc" },
    { "type": "studio" },
    { "type": "contact" }
  ],
  "cta": { "title": "If the brief doesn't have a name yet, that's a good place to start.", "primary": { "label": "Talk to Takao", "href": "../../contact.html" } },
  "seo": { "title": "Takao Umehara — Creative Director", "description": "…", "noindex": true }
}
```

### 4.2 同じ案件が 2 つの Lens でどう変わるか（Festival Reinvention）

| | default `/` | creative `/lens/creative` | ai-product `/lens/ai-product` |
|---|---|---|---|
| 位置 | 3 番目 | 3 番目 | 出ない（`sections[proof]` に無い） |
| 説明 | `summary`: 「COVID で 2 年止まった学校祭を、食から**ゲーム**へ収益の軸を移して再設計。ボランティア」 | `angles.creative`: 「祭りの identity・ブース・ゲーム体験・"知行合一" ブランディングを一貫して設計」 | — |
| 強調指標 | `games-revenue-3x` | `games-revenue-3x` + `years-iterated-3` | — |
| emphasis 行 | "Business transformation · Volunteer" | "Experience · Brand · Operations" | — |

事実（role = volunteer、指標、貢献）は 1 か所（`projects/festival-reinvention.json`）にしかない。変わるのは **選択・順序・語り口・強調** だけ。

---

## 5. コンポーネントアーキテクチャ

すべて **純関数 `(data, ctx) => string`**。フレームワーク無し、テンプレートリテラルのみ。

```
src/render/
  html.mjs         esc(), t()（Localized → .t-en/.t-jp span）, attr()
  shell.mjs        document(head, nav, langSwitch, footer, scripts)  ← 既存 7 項目ナビを唯一の場所で保持
  hero.mjs         Hero（identity tagline + eyebrow + title + body + note）
  proof.mjs        ProofSection / ProofCard（lead / standard）, MetricRow, EmphasisLine, Chips
  exploring.mjs    ExploringSection（venture の thesis / question を 3 カラム）
  experiments.mjs  ExperimentsSection（input 語彙・playable バッジ・"Try it ↗"）
  ventures.mjs     VenturesSection（Thesis / Experiment / Question / Status の 4 行カード）
  career.mjs       CareerArc（chapters → roles）
  capabilities.mjs CapabilityGroups（capabilityPriority で並べ、taxonomy の群ごとに表示）
  studio.mjs       StudioSection（creativityiseverywhere.com）
  contact.mjs      ContactSection（cta）
  lensNote.mjs     "This view surfaces work … Same experience. Different lens."
  page.mjs         lens + resolved data → sections を順に描画
assets/lens.css    生成ページ共通のスタイル（1 ファイル。inline にしない）
```

`page.mjs` は `section.type` → コンポーネントの辞書。**新しいセクション型を足す = 関数を 1 つ足す**。

## 6. Validation と Claim Guard（`src/validate.mjs`）

ビルドは以下を満たさないと失敗する（= 「Lens は経験を発明できない」の機械的保証）。

1. 全 evidence の `capabilities[].id` が `capabilities.json` に存在する。
2. `contribution.mine` が 1 件以上ある。
3. Lens の `items[].id` が存在する evidence を指す。`visibility: private` は参照不可。
4. `angle` は evidence.angles に存在する。`metricIds` は evidence.metrics に存在し `confidence !== "unverified"`。
5. **Claim Guard**: `summaryOverride` / `emphasis` / `hero.body` に含まれる数値トークン（`3×`, `40+`, `$10K`, `90%`…）は、参照している evidence（hero の場合はその Lens の全 evidence）の `summary / angles / metrics / narrative` のどこかに **同じ文字列で** 存在しなければならない。
6. **NotMine Guard**: `summaryOverride` / `emphasis` に、その evidence の `contribution.notMine` の語が含まれてはならない。
7. `capabilityPriority` の各 id について、その Lens 内の evidence のどれかが `strong` か `moderate` で持っていること（「持っていない能力を売らない」）。

## 7. ルートアーキテクチャ

| URL | ファイル | 生成元 | 索引 |
|---|---|---|---|
| `/` | `index.html` | `src/lenses/default.json` | index |
| `/lens/creative` | `lens/creative/index.html` | `src/lenses/creative.json` | noindex |
| `/lens/ai-product` | `lens/ai-product/index.html` | `src/lenses/ai-product.json` | noindex |
| `/lens/<any>` | `lens/<any>/index.html` | `src/lenses/<any>.json` を置いて `node src/build.mjs` | Lens ごとに設定 |
| 既存ページ | そのまま | — | — |

- Vercel は `dir/index.html` を `/dir` で配信するので **設定変更なし**。
- Lens ページは主ナビに載せない（ナビは既存 7 項目。Lens はリンクを知っている人だけが来る）。
- `status: "draft"` の Lens は生成されない → 「Preview」は将来 draft を `lens/_preview/<slug>/` に出す拡張で対応可能。
- `robots` は Lens 単位。`seo.noindex` が既定 true。

## 8. 将来の JD 解析が乗る場所（Phase 2、今回は作らない）

```
JD text ──▶ analyze (LLM) ──▶ JobAnalysis { capabilityWeights, ... }
                                   │
                                   ▼
                     match(JobAnalysis, evidenceLibrary)
                       = for each capability:
                           strong   evidence exists → DIRECT
                           moderate / adjacent only → TRANSFERABLE
                           none                     → GAP
                                   │
                                   ▼
                     recommendLens() → src/lenses/<slug>.json （draft）
                                   │
                          Takao edits & sets status: published
                                   │
                                   ▼
                          node src/build.mjs  （決定論的）
```

Phase 1 のデータが `capabilities[].strength` を持つのは、この `match()` をルールベースで書けるようにするため。**サイトのアーキテクチャは一切変えずに** Phase 2 が乗る（成功基準 F）。

---

## 9. ワイヤーフレーム

### 9.1 Canonical homepage `/`

```
┌──────────────────────────────────────────────────────────────┐
│ Takao Umehara / creativity is everywhere   Interactive AI Products AI Tools │ Product Design Brand About Contact │
├──────────────────────────────────────────────────────────────┤
│ TAKAO UMEHARA · Design & AI Executive · Venture Builder · New York ↔ Japan  │
│                                                              │
│ I like the beginning of things.                 (DM Serif, italic, 92px) │
│                                                              │
│ New ideas. New technologies. New behaviors. New possibilities.│
│ I explore opportunities before the answers are obvious … (2 文) │
│ [ Start a conversation ]   Hiring? Same inbox →              │
├──────────────────────────────────────────────────────────────┤
│ SELECTED PROOF                                               │
│ ┌────────────────────────┐ ┌──────────┐ ┌──────────┐         │
│ │ Rakugaki Jam (LEAD)    │ │ Verizon  │ │ Festival │         │
│ │ Interactive · Live     │ │ 40+ des. │ │ 3× games │         │
│ │ [Try it ↗]             │ │ 80+ stkh │ │ volunteer│         │
│ └────────────────────────┘ └──────────┘ └──────────┘         │
│ ┌──────────┐ ┌──────────┐                                    │
│ │ Intent   │ │ Amplify  │  each card: emphasis · title · summary │
│ │ First    │ │ ELA Q.   │  · metric row · "I did / team did" toggle? (no: link to case study) │
│ └──────────┘ └──────────┘                                    │
├──────────────────────────────────────────────────────────────┤
│ WHAT I'M EXPLORING NOW                                       │
│ Human × AI      │ Agentic UX       │ Intent First             │
│ (thesis)        │ (thesis)         │ (venture: question)      │
├──────────────────────────────────────────────────────────────┤
│ I MAKE THINGS TO THINK                                       │
│ [Resona] [Typespace] [Koe Baku] [Marubatsu] [Kao Game] …     │
│  input label · status · Try it ↗                             │
├──────────────────────────────────────────────────────────────┤
│ THINGS I'M BETTING ON                                        │
│ Intent First   │ AgentReady Local │ MyBrainSpec  │ BreakBias │
│ THESIS ……      │ THESIS ……        │ …            │           │
│ EXPERIMENT ……  │                  │              │           │
│ QUESTION ……    │                  │              │           │
│ STATUS active  │ validating       │ prototype    │ active    │
├──────────────────────────────────────────────────────────────┤
│ CAREER ARC                                                   │
│ Brand ──▶ Interactive ──▶ Product / EdTech ──▶ Enterprise / CX ──▶ AI / Ventures │
│ (each: years · 1 line · 2–3 roles)                           │
├──────────────────────────────────────────────────────────────┤
│ WHERE I CAN BE USEFUL TO LEADERSHIP                          │
│ New ventures · AI · Product / CX · Brand / Creative · Innovation · US ↔ Japan │
│ (capabilityPriority を群ごとに、証拠件数付き)                   │
├──────────────────────────────────────────────────────────────┤
│ CREATIVITY IS EVERYWHERE  — studio → creativityiseverywhere.com │
├──────────────────────────────────────────────────────────────┤
│ If what you're trying to build doesn't have a name yet,      │
│ that's probably a good place to start.   [ Talk to Takao ]   │
├──────────────────────────────────────────────────────────────┤
│ footer                                                        │
└──────────────────────────────────────────────────────────────┘
```

### 9.2 Creative Executive Lens `/lens/creative`

```
┌──────────────────────────────────────────────────────────────┐
│ (同じナビ)                                                    │
├──────────────────────────────────────────────────────────────┤
│ TAKAO UMEHARA · Creative Director · Design & AI Executive     │
│ CREATIVE LEADERSHIP, ACROSS MEDIUMS                          │
│ Different medium. Same instinct.                              │
│ Brand films, room-scale interactive work, a festival rebuilt  │
│ from scratch, and now AI. I like the beginning of things …    │
├──────────────────────────────────────────────────────────────┤
│ SELECTED PROOF                                               │
│ ┌────────────────────────┐ ┌──────────┐ ┌──────────┐         │
│ │ Rakugaki Jam (LEAD)    │ │ KOJI FIZZ│ │ Festival │         │
│ │ Interactive · Live     │ │ Film ·   │ │ Experience│        │
│ │                        │ │ Brand    │ │ · Brand  │         │
│ └────────────────────────┘ └──────────┘ └──────────┘         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│ │Coca-Cola │ │ Kitadoko │ │ Verizon  │ ← angle: "creative-tech" │
│ │Global    │ │ 0→90%    │ │ AI as a  │                       │
│ │brand     │ │ repeat   │ │ creative │                       │
│ └──────────┘ └──────────┘ └──────────┘                       │
├──────────────────────────────────────────────────────────────┤
│ I MAKE THINGS TO THINK  (Resona · Typespace · Koe Baku)       │
├──────────────────────────────────────────────────────────────┤
│ WHERE I CAN BE USEFUL — Creative Direction · Brand · Storytelling · Film · Interactive · Creative Tech · Partner Direction · AI │
├──────────────────────────────────────────────────────────────┤
│ CAREER ARC（全章。Brand と Interactive を強調）               │
├──────────────────────────────────────────────────────────────┤
│ studio → creativityiseverywhere.com                           │
├──────────────────────────────────────────────────────────────┤
│ If the brief doesn't have a name yet, that's a good place to start. [Talk to Takao] │
│ This view surfaces work from Takao's career archive most      │
│ relevant to this opportunity. Same experience. Different lens.│
└──────────────────────────────────────────────────────────────┘
```

「Exploring now」「Ventures」セクションは creative lens では **出さない**（`sections` に無い）。同じデータ、同じコンポーネント、違う構成。

---

## 10. 実装順序

| # | 作業 | 成果物 | 検証 |
|---|---|---|---|
| 1 | タクソノミー・章・profile・theses | `src/data/{capabilities,chapters,roles,theses,profile}.json` | validate が通る |
| 2 | 中核 evidence（手書き・判断が要る 8 件）: Verizon AI Workflow, KOJI FIZZ, Festival, Rakugaki Jam, Resona, Intent First, BreakBias, Amplify ELA Quests | `src/data/{projects,experiments,ventures}/*.json` | `contribution.mine/team` が分離されている |
| 3 | 長尾 evidence（既存ページから機械的に転記できる ~25 件） | 同上 | Sonnet に委譲 → 全件レビュー |
| 4 | schema.d.ts + validate.mjs（Claim Guard 含む） | `src/` | 壊れた lens でビルドが落ちる |
| 5 | render/* + assets/lens.css | `src/render/` | — |
| 6 | Lens 3 本: default / creative / ai-product | `src/lenses/*.json` | — |
| 7 | build.mjs → `index.html`, `lens/*/index.html`。旧 index → `index-console.html` | 生成物 | Playwright スクリーンショット・横スクロール 0・JS エラー 0 |
| 8 | tests/lens-system.test.mjs + 旧 homepage テスト差し替え | `tests/` | `node --test tests/*.test.mjs` 全通過 |
| 9 | Draft PR | — | diff = 公開される HTML |

Phase 2（JD 解析）は **`src/analyze/`** に閉じる。Phase 1 のファイルは触らない。

## 11. 成功基準との対応

| 基準 | 担保 |
|---|---|
| A. 一度入力した案件が複数の物語に出る | evidence は 1 ファイル。Lens は id 参照 |
| B. Lens 設定だけで変わる | テストが 3 Lens 間で hero / 順序 / 説明 / セクション / CTA の差を検証 |
| C. Lens は経験を発明できない | validate.mjs（§6）でビルドが落ちる |
| D. 「フィルタされた DB」に見えない | angle / emphasis / hero が Lens ごとに書かれた文章。カードに tag 一覧を並べない |
| E. `/` は完全な物語 | default lens は全セクションを持つ唯一の Lens |
| F. JD 解析が後から乗る | `capabilities[].strength` + Lens JSON という出口 |
| G. CMS 無しで保守 | JSON + `node src/build.mjs` + テスト。エディタ補完は `schema.d.ts` |
| H. サイト自体が思考の証拠 | このドキュメントと `src/` が公開 repo にある |

---

## 12. 実装状況（2026-09-11、Phase 1 完了）

| 項目 | 状態 |
|---|---|
| 証拠ライブラリ | 41 件（projects 26 · experiments 8 · ventures 4 · tools 7）+ roles 7 · chapters 5 · theses 5 · capabilities 28 |
| Lens | default → `/`、creative → `/lens/creative`、ai-product → `/lens/ai-product` |
| 検証 | `tests/lens-system.test.mjs` 22 件 + 既存 22 件 = 44 件すべて通過。Chromium で 1440 / 390px の横スクロール 0、JS エラー 0 |
| 要確認（本人） | ① `roles.json` の在籍年（about.html に年が無い）② `executive-partnership` は moderate の証拠しか無い ③ AgentReady Local はサイトに事実が無いため未登録 ④ KOJI FIZZ のケーススタディページの "produce and direct" 表記をデータ側の記録に合わせる ⑤ `_notes` に "should be confirmed" と書かれた venture の thesis / question |

## 13. 日本語とレイアウト（2026-09-11 追記）

Phase 1 の直後に見つかった 2 つの欠陥と、その対処。

| 欠陥 | 実態 | 対処 |
|---|---|---|
| 日本語ページが日本語でない | 読者が見る 273 文字列のうち **216 が素の英語**。`Localized` の素の文字列は両言語で表示されるため、日本語表示でも英語が出ていた | 全件 `{en, jp}` 化。基準は `docs/japanese-voice.md`。テストが強制 |
| 本文の幅が 3 種類 | 1200 / 1240 / **1680**px。1680px は 1440px 画面より広く、実質フルブリード | 全ページ `--col: 1200px`。実測で全 6 ページの grid 左端が一致 |

列数は個別指定ではなく規則で決める。**説明文つき = 3 列 / 名前と 1 行 = 4 列。** 4 列だと
1 枚 279px になり、日本語が 13 字で折り返す。

副産物として直したバグ:

1. Claim Guard の数字抽出器が `30 minutes` の `m` を百万の接尾辞と誤読していた
2. Claim Guard が経歴と無関係な数字まで弾き、日本語を壊す回避策を書かせていた
3. `.venture-row dd .t-en` が `html.lang-jp .t-en` と同詳細度・後勝ちで、日本語表示に
   英語が出ていた。**データは正しいのに画面だけ英語**という、データ検査では見つからない型
4. カード見出しが `jpTitle` を持っていながら英語を出していた

3 番目が示す教訓: **描画結果を測らないと見つからない欠陥がある。** データのテストだけでは足りない。
