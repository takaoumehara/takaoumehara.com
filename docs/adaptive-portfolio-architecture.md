# Adaptive Career Portfolio — アーキテクチャ提案 (Phase 1–3)

> Written by: superforge (architecture) · Last updated: 2026-09-16
> 原則: **One Takao. One evidence base. Different lenses.**
> 実装は `src/` 以下。
> **2026-09-17 追記**: サイトは Astro でビルドする（`docs/astro-architecture.md`）。§0 の
> 「フレームワークを入れない」「生成物を commit する」は本人の決定で覆った。データ設計（§3〜）、
> Lens（§4〜）、Claim Guard（§6）、求人票エンジン（§16）はそのまま有効。

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

## 14. 決定（2026-09-12）

ハンドオフに残っていた「未決」2 件を確定した。どちらも **Phase 1 の方針をそのまま延長する**
という判断。

### 14.1 カテゴリページは残す

`interactive.html` / `ai-products.html` / `brand.html` / `work.html` / `ai-tools.html` は
**索引として残す。** `/` と `/lens/<slug>` が「主張」を並べる場所であるのに対し、カテゴリ
ページは「そのカテゴリの全件がある場所」で、役割が違う。PR #15 で幅・列数・サムネイル比率を
統一したのは、この前提の上での作業だった。

| | `/` と `/lens/<slug>` | カテゴリページ |
|---|---|---|
| 中身 | Lens が選んだ証拠だけ | そのカテゴリの全件 |
| 生成 | `src/lenses/*.json` から生成 | 現状は手書き |
| 読者 | 特定の相手（採用担当・クライアント） | 深く見に来た人 |

**残すことで生まれる唯一の危険は二重管理。** それを次の 1 行の規則で塞ぐ:

> **事実がカテゴリページにしか存在してはならない。** 案件・実験・ベンチャーに関する事実は
> まず `src/data/` に入れ、カテゴリページはそれを表示する側に回る。

今回の Interactive のメディア追加はこの規則に沿って行った — 先に
`src/data/experiments/*.json` の `assets` を書き、`interactive.html` はその同じファイルを
指しているだけ。カテゴリページ自体の生成は Phase 3（`src/lenses/` と同じ仕組みで
`category/<slug>.json` を足す）に置く。今はやらない。

### 14.2 `codex/monumental-editorial-redesign` は畳む

`docs/gemini-studio-salvage-review.md` の結論どおり。同じ問題を 2 通りに解いた実装が
並存している状態を終わらせる。**未マージの PR は無い**（このブランチに紐づく PR は存在しない）
ので、畳むために閉じるものも無い。ブランチ自体の削除は本人が行う — 回収が済んだことを
確認してからで遅くない。

回収するもの:

| 回収対象 | 行き先 | 状態 |
|---|---|---|
| Playwright + axe の実ブラウザ a11y テスト | `tests/a11y.spec.mjs`（このリポジトリ向けに新規執筆） | **実施済み**。結果は `docs/accessibility.md`。初回で欠陥 3 件＋lens の設計判断 1 件 |
| JD 解析の実装経験 | `docs/gemini-studio-salvage-review.md` §4 の設計原則 | Phase 2 の出発点として記録済み |

回収しないものは同レビュー §3 の表のとおり。とくに `scripts/project-data.mjs` は
どこからも import されていない孤立ファイルで、旧データを持ち込む地雷。

## 15. アクセシビリティ（2026-09-12、Phase 1.5）

`docs/accessibility.md` が本体。設計に跳ね返った点だけここに残す。

1. **`--ink-dim` は 4.64:1 しかない。** これ以上薄い文字は作れない。「もう一段薄く」が
   欲しくなったら、色ではなくサイズ・字間・余白で差をつけること。
2. **不透明度で文字を沈めない。** `.arc-cell.is-quiet` は `opacity: 0.55` で
   最も薄い文字が 2.09:1 になっていた。静けさは**インクの段**で表す
   （`ink → ink-mid → ink-dim`）。
3. **言語スイッチは `<html lang>` も切り替える。** クラスだけ変えると、
   画面は日本語なのにスクリーンリーダーが英語の声で読む。
4. §13 の「言語スイッチを out-specify してはならない」は `lens.css` だけの話ではない。
   `assets/*.css` で同じ欠陥を再発させたので、テストの走査範囲を広げた。
   **`display` を指定する子孫 `span` セレクタは `.t-en` / `.t-jp` に届く。** `> span` を使う。

## 16. Phase 2 — Adaptive Pitch Engine（2026-09-16）

求人票（JD）を読み、証拠ライブラリから最も合う実績を選び、その企業専用の Lens の
**下書き**を書く。`scripts/generate-pitch.mjs`。§8 の図がそのまま実装になった。

```
node scripts/generate-pitch.mjs --url "https://…/jobs/123"                # URL から
node scripts/generate-pitch.mjs --company "Stripe" --jd path/to/jd.txt     # ファイルから
node scripts/generate-pitch.mjs --company "Stripe"                         # 貼り付け（Ctrl-D で確定）
```

出力は 4 つ。`src/lenses/<slug>.json`（status: draft）、`src/pitches/<slug>/report.md`
（何が合い、何が合わず、何を埋めるべきか）、同 `analysis.json`、同 `jd.txt`。

### 16.1 ブリーフからの変更点（検証して直したところ）

| ブリーフ | 実装 | 理由 |
|---|---|---|
| 「JD 解析（LLM）」 | **LLM を呼ばない。** 語彙表（`src/analyze/lexicon.json`）と規則だけ | 同じ JD から常に同じ結果が出る。API キー不要で他人も使える。`docs/gemini-studio-salvage-review.md` §4 の教訓 — LLM の自由文は検証ではなく「お願い」でしか縛れない — を、そもそも自由文を書かせないことで塞いだ |
| `angles` を「企業向けに上書き」 | Lens は **承認済み angle を選ぶだけ**。`summaryOverride` は生成しない | §4 の原則。上書きは Claim Guard の対象になるが、そもそも生成器に事実文を書かせない |
| `lensNote` に企業名と重点領域 | `lensNote` が `boolean | Localized` になった。文字列なら Claim Guard を通る | 既存の 2 lens は従来どおり定型文 |
| `tailoredResume` | Lens JSON に持つが**描画しない**。`highlights[].line` は `contribution.mine` の逐語。validator が Claim Guard / NotMine Guard を当てる | 履歴書に貼る文章もページと同じ基準 |
| カードに「役割・成果タグ」 | **役割フラグ 1 つ**（`contribution.level` + `teamSize` → "Led · team of 6"）。成果は既存の metric 行 | 成功基準 D「カードに tag 一覧を並べない」。空ピルは `1a7b109` で修正済み |
| 「27 能力・27 実績」 | 実際は 28 能力・46 実績（projects 26 · ventures 4 · experiments 8 · tools 8） | 数え直し |
| 「70 件のテスト」 | 70 → **99**（`tests/pitch-engine.test.mjs` 29 件を追加） | |

### 16.2 採用側の 2 つの読み方に対して、何を出すか

| 読者 | 時間 | ページで見えるもの | 出どころ |
|---|---|---|---|
| 人事・リクルーター | 10〜30 秒 | eyebrow（職種名 · 企業名）、先頭カードの emphasis（"Direct evidence · UX / CX · Enterprise"）、役割フラグ（"Led"）、数字 2 つ | JD の職種名、`capabilities[].strength`、`contribution.level`、`metrics`（unverified は出ない） |
| 現場の責任者 | 2〜5 分 | 承認済み angle の本文、「自分がしたこと · チームがしたこと」、ケーススタディの制約 | `angles`、`contribution.mine / team`、`narrative.constraints` |
| 本人（公開前） | — | `report.md` の「採用側が聞くが記録が答えられないこと」「JD が求めるが記録に無いもの」 | `scripts/audit-evidence.mjs` の質問と `capabilityCoverage()` |

**"Direct" は与えるものではなく、稼ぐもの。** 求人の重い上位 5 能力のうち 2 つ以上に
`strong` の証拠があるとき（または最重要 1 つ＋同じ業界のとき）だけ。それ以外は
"Transferable" とカードに書く。決済会社の求人に学校祭が "Direct" と出た初回の結果を見て、
この規則にした。

### 16.3 選び方（規則。全部読める）

1. **JD → 能力の重み**: 語彙表の句が、JD のどの節にあるかで重みを変えて数える
   （Requirements ×1.5 / Responsibilities ×1.25 / Preferred ×1.0 / 会社紹介・待遇 ×0.4）。
   1 つの能力の中では**最も強い句を満額、残りを半額**で足す —「build / ship / code」の
   羅列が「design system」の明示に勝たないように。
2. **実績のスコア**: Σ 重み × 強度（strong 1 / moderate .55 / adjacent .2）に、
   種別（project 1 / venture .85 / tool・experiment .6）、契約形態（concept .8）、
   使える指標の数、ケーススタディの有無、直近か、**同じ業界か（×1.3）** を掛ける。
3. **3〜5 件を選ぶ**: 貪欲法。重い上位 6 能力について、すでに選んだカードが証明済みの
   分だけ割り引く。**上位能力に strong が 1 つも無い実績は「全部重複」と同じ扱い** —
   これが無いと、クリエイティブディレクター求人で Coca-Cola より Verizon AI が先に出た。
4. **angle**: JD の主題（`lexicon.themes`）ごとに angle の優先順が決まっている。
   実績が持っていなければ `cardLine` に落ちる。
5. **指標**: `stated` → `approximate` の順に 2 つ。`unverified` は候補にすら入らない。

### 16.4 記録の空欄（`docs/evidence-gaps.md`）

採用側が必ず聞くのに、記録が答えられない項目を `scripts/audit-evidence.mjs` が洗い出す。
答えを入れる先として型を 3 つ足した（`src/schema.d.ts`）。

| フィールド | 値 | 意味 |
|---|---|---|
| `contribution.level` | `solo / led / co-led / contributor / advised` | どこまで自分がやったか。カードにフラグとして出る |
| `contribution.teamSize` | 整数 | 中心になって動いた人数。不明なら書かない |
| `outcome` | `{ status: measured / reported / shipped / unknown, note }` | 数字が無い実績の「その後」。**`unknown` は正当な値** — 推測した数字より強い |
| `narrative.decisions` | `[{ decision, why, tradeoff }]` | 判断とその理由。現場の責任者が見るのはここ |

今回埋めたのは、記録に文字どおり書いてあるものだけ（役職が "Solo"、`team` が空の
experiment / tool / venture → `solo`。Festival の chair と KOJI FIZZ の「クライアント側を
自分が回した」→ `led`）。残り 31 件の空欄は本人が埋める。**埋めないという選択も正しい** —
無い数字は無いまま、`unknown` と書く。

### 16.5 触っていないもの・できなかったもの

- 既存 3 lens の JSON、既存の証拠の事実、`index.html` の構成 — 変更なし
  （役割フラグが出るようになった分だけ生成 HTML は差分がある）。
- `--url` の**実サイトでの取得は未検証**（作業環境から外向き通信が塞がれていた）。
  ローカル HTTP サーバーと、schema.org `JobPosting` を埋め込んだ HTML でテストした。
  JS で描画される求人ページは読めないので、その場合は本文だけ貼り付ける（コマンドが案内する）。
- サンプルの JD 3 本（`src/analyze/samples/`）は**この実装のために書いた例文**で、
  実在の求人票の転載ではない。
- 生成した `src/lenses/stripe.json` は draft のまま。`lens/stripe/index.html` は
  コミットしていない（公開は本人が `status: "published"` にして build する。原則 17）。
  プレビューは `node src/build.mjs --preview` → `lens/_preview/stripe/index.html`（git 管理外）。

### 16.6 Fit Ledger — 求人票の 1 行ずつに「自分が何をしたか」で答える（Phase 3a、2026-09-16）

本人の要望: 「なぜ答えられるのか」を、ポートフォリオのリンクではなく**自分が実際にした行為**で示し、
どの程度答えられているかも出す。合計の % ではなく、**求人票の 1 行 = 台帳の 1 行**。

```
{ ask: "Experience contributing to or maintaining a design system at scale",   ← 求人票の行、逐語
  capabilities: ["design-systems", "enterprise"],                                ← その行が名指しした能力
  level: "direct",                                                               ← 規則で決まる上限（下げられるが上げられない）
  evidence: [{ id: "credit-card-portal",
               line: "Built the design system in three layers: …" }],           ← contribution.mine の逐語
  note?: { en, jp } }                                                            ← 本人の 1 行。Claim Guard 対象
```

| level | バー | 意味（`validate.mjs` の `fitCeiling()`） |
|---|---|---|
| `direct` | 100 | その行の能力に `strong` を持つ記録があり、かつその記録の `contribution.mine` に対応する逐語の 1 行がある |
| `partial` | 60 | `strong` はあるが対応する行が無い／`moderate` に対応する行がある |
| `adjacent` | 30 | `moderate` のみ、または `adjacent` のみ |
| `none` | 0 | 引用できる記録が無い。**行は消さない** |

規則（`src/analyze/fit.mjs`）:

1. 台帳に載るのは `requirements` / `preferred` の行。**年数・学位・ポートフォリオを問う行は載せない**（記録は「何年」に逐語で答えられない。履歴書で答える、と脚注に出す）。能力を 1 つも名指ししない行も載せない（言えることが無い）。
2. 行 → 能力: 語彙表の句で拾い、最も強い能力の半分未満の能力は捨てる（"workflows" 1 語で `operations` が紛れ込み、無関係な記録を連れてくるのを防ぐ）。
3. 記録 → 行: 語幹の重なり＋能力の句＋**業界語**（"payments" が問いと引用の両方にあれば加点）で `contribution.mine` の各行を採点。2 以上で「対応する行あり」。
4. 記録の順位: 強度 ×2 ＋ 行の一致 ＋ ページに載っている記録 +1.5 ＋ **自主制作コンセプトは −1**（"partnering with engineering" に一人で作った概念作品が先に出た初回の結果から）。2 件目の引用は、明確に一致する逐語の行があるときだけ。
5. `validate.mjs`: `evidence[].id` は公開記録、`line` はその記録の `contribution.mine` に逐語で存在、`level` は `fitCeiling()` の上限以下、`note` は Claim Guard / NotMine Guard。**本人は level を下げられるが上げられない。**

描画は `{ type: "fit" }` セクション（`sections.mjs` の `fitSection()`）。見出し「What you asked for · what I did」。
列は「求人票の行 / 度合いのバーと言葉 / 引用と記録へのリンク」。引用は英語の逐語（記録が英語なので、日本語表示でも訳さない）。
ページに載っている記録はカードの `#card-<slug>` へ、載っていない記録はケーススタディへ飛ぶ。

データへの含意: **`contribution.mine` の 1 行が台帳の説得力そのもの。** 1 行 = 自分がした 1 つの具体的な行為に整える。
`scripts/audit-evidence.mjs` が 40 語超の行や 3 つ以上を詰めた行を指摘する（`docs/evidence-gaps.md`）。

### 16.7 Studio — ブラウザで貼って、見て、GitHub の名前で公開する（Phase 3b、2026-09-16）

`/studio/`（noindex、nav に無い）。本人の決定は「最初から GitHub ログイン＋自動 commit」。

**画面はサーバー無しで動く。** `studio/studio.mjs` は `src/analyze`・`src/validate.mjs`・`src/render` を
**ビルドと同じ ES モジュールのまま**ブラウザで import する（バンドラ無し、依存ゼロ）。データは
`assets/studio/library.json`（`node src/build.mjs` が書く、証拠 46 件＋語彙表、`_notes` は落とす）。
そのために `.vercelignore` は `src/` を配信対象に戻した（`src/pitches/*` だけ除外、`samples` は配信）。
`src/analyze/jd.mjs` からファイル入力と語彙表の読み込みを `intake.node.mjs` に分けたので、
`studio.mjs` から辿れるモジュールに `node:` の import は 1 つも無い（テストが走査する）。

| 画面 | 何が起きるか |
|---|---|
| 貼る／URL | URL は `/api/fetch-jd`（サーバー側で取得。ログイン必須。読めなければ貼り付けへ誘導） |
| Analyze | `analyzeJob → scoreEvidence → selectProof → draftLens` をその場で実行。下書きと台帳とプレビュー |
| 直す | カードの framing（承認済み angle のみ）・表示/非表示、台帳の level（**上限までしか選べない**）・引用行（その記録の `mine` のみ）・注記、hero / lede / CTA の文（EN・JP） |
| Guard | 変更のたびに `validateLens` をブラウザで実行。赤い行が 1 つでもあれば公開ボタンは押せない |
| Preview | `renderLens` をブラウザで実行し iframe に描画。**ビルドと同じコード** |
| Publish | `POST /api/publish { lens }` → サーバーで再検証・再描画・**1 commit**（`src/lenses/<slug>.json`、`lens/<slug>/index.html`、`assets/studio/library.json`）→ Vercel が `/lens/<slug>` を配信 |
| Download | JSON と report.md。API が無い環境（ローカルの `python3 -m http.server`）でも手で commit できる |

**API（`api/`、Vercel Functions、Web 標準の `Request → Response`、依存ゼロ）**

| 関数 | 役割 |
|---|---|
| `auth/login` | GitHub OAuth（scope `public_repo`）。state cookie |
| `auth/callback` | code → token。**`OWNER_LOGIN` 以外は 403**。セッションは AES-GCM で封じた HttpOnly cookie（8 時間）。サーバーに保存しない |
| `auth/me` · `auth/logout` | |
| `fetch-jd` | `readJobText({ url })` をサーバーで |
| `publish` | `_lib/publish.mjs`: `validateAll` → `renderAll` → `_lib/github.mjs` の Git Data API で commit。`PUBLISH_MODE=pr` なら `studio/<slug>-…` ブランチ＋PR |

決定論: 関数が commit する HTML は `node src/build.mjs` が書くものと一字一句同じ（テストが比較する）。
`renderAll` に `assetExists` を渡せるようにした — 関数のバンドルには画像が無いので、画像の存在検査は
直前のビルドの結果を信頼する（新しい Lens は画像を足さない）。

**本人がやること（1 回だけ）**

1. GitHub → Settings → Developer settings → **OAuth Apps** → New OAuth App。
   Homepage URL: `https://takaoumehara.com` / Authorization callback URL: `https://takaoumehara.com/api/auth/callback`
   - **GitHub App ではない。** 画面が似ていて間違えやすいが、GitHub App は権限モデルと
     refresh token の扱いが違い、`api/auth/callback.mjs` の `exchangeCode()` が通らない。
   - callback URL は**ホスト名まで完全一致**。Vercel のプレビュー URL では動かない。
     試すのは本番ドメインで、この PR をマージしてデプロイした後（それまで `/api/auth/*` は存在しない）。
2. Vercel のプロジェクトの Environment Variables:
   `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`SESSION_SECRET`（`openssl rand -hex 32`）、`OWNER_LOGIN=takaoumehara`、
   任意で `REPO`（既定 `takaoumehara/takaoumehara.com`）、`PUBLISH_BRANCH`（既定 `main`）、`PUBLISH_MODE`（`commit` か `pr`）、`SITE_URL`
3. デプロイ後 `/studio/` → Sign in → サンプルで 1 回 Publish → `/lens/stripe` が開く → `git pull` して `npm test` が通ることを確認

**検証したこと・していないこと**: Node のテスト 12 件（封印、owner 以外の拒否、fetch-jd、publish の commit 内容と HTML の一致、PR モード）と、
Chromium で `/studio/` にサンプルを貼って 5 カード・台帳・プレビュー・Claim Guard の赤線が出ること。
**GitHub の実 API と Vercel 上の実行は未検証**（この作業環境から外向き通信不可）。Web 標準ハンドラ（`export function GET(request)`）が
Vercel の Node ランタイムで動く前提。動かなければ `(req, res)` 形式への薄い変換を `api/_lib` に足す。

### 16.8 公開デモ `/try/`（Phase 3c、2026-09-16）

訪問者（採用側）が自分の求人票を貼ると、このサイトがその求人向けに並べ替わる。保存も公開もしない、ブラウザ内だけ。
Studio と同じモジュール（`try/try.mjs`）で、調整 UI と公開ボタンが無いだけ。

- hero の note と lens note を**「訪問者が貼った求人票から自動で並べた表示で、本人は手を入れていない」**に差し替える。
  誰が並べたかを言わない表示は、承認していない主張に見えるから。
- 生成器は事実文を書かないので、見知らぬ求人票でも嘘は出ない。`validateLens` をブラウザでも通し、
  万一落ちたら描画せず「別の求人票で」と言う。
- 索引される（noindex ではない）。**これ自体が作品**: 「嘘をつかない機械」を採用側が自分の求人で触れる。
- 導線: `work-with-me.html` の "Hiring" の段に 1 行。ほかのページからの導線は本人の判断。

### 16.9 Phase 3d — 配布（計画。未着手、2026-09-16）

**他の人が自分のサイトで同じことをできる形にする。** 本人の決定は 3 つ。

| 論点 | 決定 |
|---|---|
| 形 | **GitHub テンプレート repo**（npm パッケージではない）。`adaptive-portfolio-template` |
| タクソノミー | **デザイナー用 1 種**だけ用意。他職種は導入スキルが面接形式で作る |
| ライセンス | **MIT**（`LICENSE` を追加。現在リポジトリにライセンスが無い） |

**中身**: engine（`src/analyze` / `src/validate.mjs` / `src/lib` / `src/render` の既定テーマ /
`scripts` / `studio` / `try` / `api`）＋ **空の `src/data`** ＋ 例 1 件 ＋ 導入スキル。
使う人は `Use this template` → AI コーディング環境で `/setup-portfolio` を走らせると、
面接形式で `profile` → 能力（デザイナー用タクソノミーから選ぶ）→ 実績 1 件ずつ
（`mine` / `team` / `notMine` / `metrics.confidence` を必ず聞く）が埋まり、
`node src/build.mjs --check` が通るまで付き合う。下敷きは `docs/portfolio-content-intake-prompt.md` v3。

**汎用化が要る箇所**（2026-09-16 に実測。すべて `profile.json` か新しい `site.json` から読む形に）:

| ファイル | 何が固有か |
|---|---|
| `src/validate.mjs` | エラー文 2 か所の "Takao"（`contribution.mine` と NotMine Guard） |
| `src/render/sections.mjs` | lens note の既定文（"work from Takao's career archive"） |
| `src/render/archive.mjs` · `now.mjs` | SEO の title / description |
| `src/render/shell.mjs` | ナビのロゴ名、スタジオの URL、7 項目のナビ構成そのもの |
| `studio/studio.mjs` · `studio/index.html` | `SITE` 定数、ブランド名 |
| `try/index.html` · `try/try.mjs` | title / description / canonical |
| `api/publish.mjs` · `api/_lib/github.mjs` | `REPO` の既定値、user-agent |

**テストの分割**: `tests/pitch-engine.test.mjs` と `tests/studio.test.mjs` は本人の記録に依存している
（`verizon-*` / `koji-fizz` / `festival-*` / `credit-card-portal`）。テンプレート側は例 1 件で通る
汎用テストに書き直す。`about-portrait` / `ai-tools-portfolio` / `lens-system` / `page-transitions` は
このサイト固有なので持って行かない。

**前提**: **3b が本人のサイトで実際に動いてから配る。** 自分で使っていないものは配らない。
