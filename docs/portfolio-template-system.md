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

### 2-5. 大面積の色は「深く・彩度を落として」使う

フルブリードのパネルに上記の原色をそのまま敷き、それを隣接させると色が振動して「ガチガチ」に
見える。**大面積の塗りは専用のパネルトーンを使い、原色は小さなアクセント（ドット・罫・数字・
`<em>`）に限定する。**

| 用途 | 原色 | パネルトーン |
|---|---|---|
| violet | `#7c3aed` | `--p-violet: #57359b` |
| blue | `#2563eb` | `--p-blue: #1f4a9c` |
| orange | `#f97316` | `--p-orange: #c9620e` |
| green | `#16a34a` | `--p-green: #16783c` |
| amber | `#eab308` / `#f59400` | `--p-amber: #cf7d10` |

パネルトーンは白文字が乗る前提の明度にしてある（原色オレンジに黒文字を乗せる旧実装は、彩度と
文字色の両方で悪目立ちしていた）。実装例: `projects/verizon-ai-agents.html`。

### 2-6. デスクトップのタイポ下限

本文を `clamp(14px, 1.35vw, 16px)` のような「上限16px」で組むと、1500px超のディスプレイでは
見出しとの落差が大きすぎて本文が小さく見える。**本文系は上限19px前後、ラベル・数字も同様に
上限を引き上げる**。コンテナ幅も 1240px では左右の余白が勝ちすぎるため 1360px を基準とする。
実装例: `projects/cli-studios.html`。

### 2-7. スライドモード（deck-v）の方針

各ケーススタディは右下のスイッチャーで **Scroll / Slides** を切り替えられる。

- **Variant A（証拠先行）は deck-v のみ提供する。** 証拠パネル（13ページのデザインシステム、
  5枚のビフォー/アフター）は本質的に1画面より高く、deck-h（横送り）にすると各スライドの半分が
  内部スクロールに隠れる。deck-v なら「上から始まって自然にスクロールする」で正しく扱える。
- **Variant B / C は deck-h も出してよい**（1枚が1画面に収まる構成のため）。
- deck-v は「スナップするページ」では不十分。①フルブリード化 ②クローム除去 ③縦中央寄せ
  （ただし色面パネルは stretch）④**高さ(vh)基準の型指定** ⑤入場のビート、の5点で初めて
  スライドに見える。詳細は `keynote-slide-page` スキルの `references/deck-modes.md`
  「deck-v needs the same framing as deck-h」節に、この案件の知見として記録済み。
- モバイルと `prefers-reduced-motion` では deck を無効化し scroll にフォールバックする。
- **モードの数はバリアントに従う**（ボタンを揃えるのではなく、ルールを揃える）:
  Variant A = Scroll / Slides の2つ、Variant B = Scroll / Slides / Deck の3つ。

### 2-8. 浮遊コントロールは1つのクラスターにまとめる

言語切替・ビュー切替・スライドカウンター・キーボードヒントが別々に浮くと、右端に高さの違う
オブジェクトが4つ並び、作品より目立ってしまう。**画面上に浮くのは常に1つ**にする。

```
右下 .page-controls（1つの箱）      上端 .deck-progress（3pxの帯・ambient）
┌──────────────────┐
│      1 / 10      │ ← deck時のみ
│   EN   │   JP    │
│ ────────────────  │
│ ≡ Scroll         │
│ ↓ Slides         │
│ ────────────────  │
│ SPACE で次へ      │ ← 初回送りで消える
└──────────────────┘
```

設計上の判断:

- **控えめにする方法は「小ささ・ヘアライン・余白」であり、透明度ではない。** クラスター全体の
  `opacity` を下げるとラベルのコントラストが WCAG AA を割る。落ち着きは寸法で作り、
  hover/focus で背景と枠線だけがわずかに前に出る。
- **隠しはしない。** 見つけられない機能は存在しないのと同じ。ただしラベルは10.5px・
  `--ink-mid` に留め、色は使わない（色を使うと作品の色と競合する）。
- **使えない環境ではボタンを消す**（薄く残さない）。モバイルと reduced-motion では
  ビュー切替の行ごと削除する。無効化されたボタンが見えている状態は、答えを返さない
  ディストラクションでしかない。
- 進捗バーだけは上端に分離してよい。ウィジェットではなく現在位置の表示だからである。

**未移行ページへの申し送り**: 残りのページは旧来の縦書き `.lang-switch`（右端 `bottom:80px`）
のまま。テンプレート移行のタイミングで、このクラスター（ビュー切替なしの言語のみ版）に
差し替えて統一する。

### 2-9. 動画は「同期させる」のではなく「合成して1本にする」

2つのプレイヤーを同時再生して揃えようとしないこと。YouTube の iframe でも
ローカルの `<video>` でも、それぞれが独立に読み込み・バッファするため、
再生開始のズレは端末とネットワークで毎回変わる。JS で `currentTime` を
補正しても、モバイル Safari では片方だけ停止することがある。

判断は「その動画が何を主張しているか」で決まる:

| 主張 | 実装 | 例 |
|---|---|---|
| **同時性そのもの**（スマホを触ると壁が反応する） | **編集で1本に合成**。小窓か分割で1ファイルにし、1つのプレイヤーで再生する | Rakugaki Jam, Koe Baku, Werewolf |
| **比較**（前はこう、今はこう） | **2本を別々に置く。同期しない**。見る人が自分のペースで往復するため | `projects/cli-studios.html` の Before/After |

合成の場合、同期は編集時に一度解決すれば永久に正しく、ページ側に JS は要らない。
撮影手順（2ソース + 同期マーカー）は
`docs/portfolio-content-intake-prompt.md` §8-3 に置いた。

現状の実装: YouTube iframe（9:16 ×2、`controls=1`、`projects/cli-studios.html`）と
ローカル `<video controls preload="metadata" poster>`（tmobile, ela-quests 等）が併存。
**どちらも自動再生しない。** ポスター画像は必須。

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
