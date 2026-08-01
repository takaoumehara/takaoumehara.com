# Portfolio Page Template System — 検証結果と統一仕様

Updated: 2026-08-01
Supersedes the "Project Page Template" section of `SITE-PLAN.md`. The content-side
counterpart is `docs/portfolio-content-intake-prompt.md`(各プロジェクトのAIセッションから
内容を書き出させるヒアリング指示書)— このテンプレートのスロットと1:1対応する。

---

## 1. 検証結果(2026-08-01 監査)

### 1-1. サイトには3つのページ文法が併存している

| 文法 | 代表ページ | 枚数 | 強み | 弱み |
|---|---|---|---|---|
| A. Editorial gallery(旧お手本) | `cli-studios.html` +19ページ | 20 | 実物証拠(スクショ・動画・成果物)が豊富。落ち着いた編集調 | スキムレイヤーが無い(見出しが小さくリズムが平坦)。成果数字が2回重複表示。シェルが旧世代 |
| B. Keynote-slide フル | `verizon-ai-agents.html` | 1 | スキム性・物語性が最強。NDAで実画面が出せない案件の正解 | 2057行・スライド過多(システム深掘り4連)。採用担当の30秒〜2分スキャンには長い |
| C. Keynote-slide コンパクト | `superforge.html` 等スキル/ツール系 | 7 | 3〜4枚で完結。密度が適正 | — (現状ほぼ完成形) |

さらに孤立した試作が2枚: `ela-quests-slides-preview.html`(ビジュアル多案件のkeynote化実験
— 画像34→7枚に圧縮)と `verizon-totalwireless-slides-preview.html`。本番導線から未リンク。

### 1-2. シェル(共通枠)が2世代に分裂している

| 機能 | スキル系(superforge等) | ケーススタディ系(cli-studios等) |
|---|---|---|
| JP表示時の Noto Sans JP 切替 | ✓ | ✗(JPがGeistのフォールバックで表示) |
| 言語切替時の `html.lang` 更新 | ✓ | ✗(スクリーンリーダーが英語のまま読む) |
| Breadcrumb | ✓ | ✗(ela-quests等は無し。verizonは有り) |
| `:focus-visible` スタイル | ✓ | ✗ |
| 前後ナビのクラス | `.project-nav` | `.project-nav` / `.nav-project` が混在 |

### 1-3. keynote-slide-page スキル自体の不足(実地で判明)

1. **ギャラリー=証拠の受け皿が無い。** ビジュアル多案件では実物ギャラリーこそが証明力の
   源泉だが、スキルにはフルブリード画像スライドのアーキタイプが無い。preview版は
   flow-stripへの画像埋め込みを発明したが、34→7枚への圧縮は証拠を捨てすぎ。
2. **実写真を敷くヒーローの型が無い。** preview版が `wds-hero` の背景に実画像+スクリムを
   敷く手法を発明した(これは正式化する価値がある)。
3. **ページ長の上限ガイダンスが無い。** verizonの肥大はこれが原因。
4. **メタ情報(Client/Role/Year)の置き場が未定義。** preview版の `wds-hero-meta` を正式化する。

**結論: スキルに従うのではなく、スキルの語彙を土台に、この仕様書をサイトの正とする。**

---

## 2. 統一方針 — 1つのスパイン、2つの証拠モード

全ケーススタディは同じ**物語スパイン**(keynote文法)を持ち、**証拠(Evidence)の出し方だけ**
をプロジェクトの性質で切り替える。「ビジュアル多用テンプレート」と「ビジュアル少テンプレート」
は別物ではなく、同一テンプレートのバリアントである。これが一貫性の担保になる。

### 2-1. 物語スパイン(全バリアント共通・intake promptと対応)

| # | スライド | アーキタイプ | intake項目 |
|---|---|---|---|
| 1 | **Hero** — dark + アクセントglow + 大セリフ見出し(成果が主語) + リード + chips + meta(Client/Role/Year) | Photo hero(実画像があれば背景に敷く)/ plain dark hero | 1, 2 |
| 2 | **The Tension** — 課題の対比 | Two worlds / Hero statement | 3 |
| 3 | **My Approach** — 意思決定 | Hero statement + read layer / Numbered moves(2〜4個) | 4, 5 |
| 4 | **Evidence** — 証拠(バリアント分岐点。下記2-2) | Evidence gallery / 図解系アーキタイプ | 8 |
| 5 | **Proof** — 数字は**ページ内この1回だけ**(最大3つ) | Proof stats(cream) | 6 |
| 6 | **Closing** — vivid アクセント1枚 + 前後ナビ | Closing statement | — |

Problems Solved(intake 7)がある案件は 3 と 4 の間に Before/After スライドを1枚追加可。

### 2-2. バリアント

**Variant A — Evidence-led(ビジュアル多: 実スクショ・動画・成果物がある案件)**
- 対象: CLI Studios, Kitadoko, ELA Quests, Festival, extraordinary 等
- スパイン5〜6枚 + Evidence galleryスライド2〜4枚 = **全8〜10枚**
- Evidence gallery スライド = cream(#f4efe4)または dark(#111)のフルブリードスライド内に
  既存の `.g-row`/`.g-cell` グリッドをそのまま入れる。ラベル+1行リード付き。
  **画像はSITE-PLANのキュレーション上限に従う**(証拠は捨てないが、重複は削る)。
- 動画は Video pair スライド(9/16 iframe ×2、dark)1枚。
- 参照実装: **`projects/cli-studios.html`**(本仕様のリファレンス)

**Variant B — Narrative-led(ビジュアル少: NDA案件・プロセス系・思考が主役)**
- 対象: Verizon AI Agents, T-Mobile(実画面が出せない部分)等
- 全**10〜14枚上限**。証拠はCSS/SVG図解・フロー・ワークフローバーで作る。
- 深掘りが4系統あっても全系統をフル展開しない。代表1系統をフル + 残りはfleet-grid的な
  一覧1枚に圧縮。詳細が必要な読者はいない前提で書く(面接で話す持ちネタとして温存)。
- 参照実装: `projects/verizon-ai-agents.html`(ただし現状は長すぎ。圧縮は移行フェーズ2で)

**Variant C — Tool compact(スキル・ツール紹介)**
- Hero → Mechanism(+図) → (Routing等の補足1枚) → Closing の3〜4枚。
- 参照実装: `projects/superforge.html`(現状のまま正)

### 2-3. 共通シェル契約(全ページ必須)

1. sticky nav(既存) + **breadcrumb**(カテゴリページ → 本ページ)
2. 言語切替: `html.lang` を `en`/`ja` に更新 + `html.lang-jp body { font-family: var(--ff-jp) }`
   (Noto Sans JP をロード)。`.t-en`/`.t-jp` パターン、**中国語混入禁止**
3. `:focus-visible` アウトライン(リンク・ボタン・トグル全部)
4. `prefers-reduced-motion` で reveal/アニメ全停止(既存を維持)
5. footer は `.site-footer` クラス版に統一(inline style版は廃止)
6. 前後ナビは `.project-nav` に統一
7. アクセントは**1プロジェクト1色**。glow・`<em>`・border-top・数字がすべて同じ色

### 2-4. アクセント色の割当(6色パレット)

カテゴリで基調を決め、隣接ページ(work.htmlの並び順)で同色が連続しないよう調整する。

| 色 | 基調カテゴリ | 割当済み |
|---|---|---|
| blue `#2563eb` / tint `#60a5fa` | Product Design | **cli-studios** |
| green `#16a34a` / `#4ade80` | Education | ela-quests, hummingbird |
| orange `#f97316` / `#f7a63a` | Brand & Visual | kitadoko, festival |
| yellow `#eab308` / `#fbbf24` | AI Tools | superforge(済) |
| violet `#7c3aed` / `#a78bfa` | Agentic UX | verizon-ai-agents |
| teal `#0d9488` / `#2dd4bf` | Interactive / その他 | konosaki系 |

---

## 3. 移行計画

| フェーズ | 内容 | 状態 |
|---|---|---|
| 1 | シェル統一: verizon-ai-agents に JPフォント/lang/focus-visible | 今回 |
| 1 | `cli-studios.html` を Variant A リファレンスとして再構築 | 今回 |
| 2 | preview 2枚の内容を本ページに昇格させ、preview を削除(ファイル名は本体を維持) | 未 |
| 2 | verizon-ai-agents を 10〜14枚に圧縮 | 未 |
| 3 | 残り18ページを work.html 掲載順に Variant A/B へ移行(intake promptで内容を再収集してから) | 未 |

移行時の作法: ファイル名変更禁止(既存仕様)。1ページ移行するたびに reveal無効レンダリングで
スクリーンショット検証(keynote-slide-page スキルの手順)+ EN/JP 両表示チェック。
