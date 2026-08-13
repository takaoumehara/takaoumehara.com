# ポートフォリオ階層化 — Featured 6 件の選定

> Written by: superforge-ui · Last updated: 2026-08-13
> 対象: `projects/` 全 34 件（`*-slides-preview.html` 2 件は試作ページなので除外）

---

## 0. 何をどこまで読んだか

- 全 34 件について: `<title>` / meta description / メタデータブロック（Client・Role・Year・
  Impact・Scope）/ 本文冒頭 / `<img>` `<video>` 数 / アセット実容量
- 上位候補 6 件（extraordinary・ela-quests・coca-cola・verizon-totalwireless・kitadoko・
  tmobile）については本文を読んだ
- **読んでいないもの**: 残り 28 件の本文全文。順位が割れる可能性があるのは §5 に明記した。

---

## 1. 現状の情報設計

サイトは既に 4 つのハブに分かれている。

| ハブ | 件数 | 中身 |
|---|---|---|
| `work.html` | 13 | Product Design |
| `brand.html` | 12 | Brand & Visual（+ Konosaki は外部リンク） |
| `ai-products.html` | 3 + 外部 3 | Amazon Fire TV / Marubatsu / Verizon AI Agents ＋ Typespace・Rakugaki Jam・Resona |
| `ai-tools.html` | 6 | Claude Code スキル・CLI 群 |

**問題**: 4 ハブ合計 34 件が横並びで、どれが代表作かをサイト自身が主張していない。
訪問者はどうせ 2〜3 件しか見ないので、その 2〜3 件の決定権を手放している状態。

---

## 2. 選定基準

`docs/landing-design.md` §1 が定義した主張から逆算した 3 条件。

1. **AI プロダクトを実際に設計・出荷した証拠**（差別化）
2. **誰でも知っているクライアント名**（借り物の信用）
3. **AI 以前の 20 年**（「AI から始めていない」の回収）

これに、今回のビジュアル先行デザインで新たに効く 2 条件を追加した。

4. **見せられるビジュアルが実在するか**（全画面ヒーローを張れるか）
5. **事業成果の数字があるか**

---

## 3. Featured — 6 件

| # | プロジェクト | 満たす条件 | 決め手 |
|---|---|---|---|
| 1 | **Verizon — AI-Powered UX Workflow Transformation** | 1 + 2 | 10 体の AI エージェント / 42 デザイナー / 6 ブランド。主張の核そのもの。外すと positioning が消える |
| 2 | **Playable AI Experiments**（新規・4 件を 1 件に束ねる） | 1 | Typespace / Rakugaki Jam / Resona / Marubatsu。**触れる証拠は他の誰も持っていない。** 現状 `ai-products.html` と外部 Vercel に散っていて、代表作として扱われていない |
| 3 | **T-Mobile BOPIS Experience** | 2 + 5 | 3 タッチポイント（App / Kiosk・Locker / Voice AI）。**「T-Mobile の preferred innovation partner に選ばれた」** という事業成果。動画 3 本あり |
| 4 | **Kitadoko — Hair Salon Rebranding** | 3 + 4 + 5 | 創業 1871 年 / リピート率 **0% → 90%**。「美意識ではなく事業から入った」と本文が明言。ブランド・サービス・空間まで及ぶ射程。写真が強い |
| 5 | **Amplify ELA Quests** | 3 + 4 + 5 | **2014–2025 の 11 年継続**。millions of students、AR、動画 4 本、実アセット 219MB。単発ではなく信頼が続いた証明 |
| 6 | **Coca-Cola — Global Visual Directions** | 2 + 4 | サイト内で単体最強のブランド名。VP of Design David Butler 体制下。信用の担保として置く |

### 束ね方（#2 のみ新規制作が要る）

現状バラバラの 4 件を 1 つの Featured ケーススタディにまとめる。

- 4 件それぞれのライブ canvas をそのまま全画面背景として使える（**転送量 0 バイト**）
- 「AI 時代の体験を設計できる」を説明ではなく実演で示す唯一の枠
- 既に `index.html` の Playable band で動いている実装を流用できる

---

## 4. Tier 2 — Selected（索引に置く）

名前・クライアント・年・一行のみ。到達可能・検索可能だが、注目を奪い合わない。

**特に強い 2 件**（Featured から漏れた理由付き）:

| プロジェクト | 強み | Featured にしなかった理由 |
|---|---|---|
| **Verizon Total Wireless** | 6 本の live-coded HTML プロトタイプ。line-item pricing が**実出荷プロダクトに採用**。「彼は実際に作る」の証明 | Verizon は #1 で既に代表されている。同じクライアントで 2 枠は使えない |
| **extra•ordinary**（書籍） | Rockport 刊、11,000 部、DESIGN QUARTERLY（日本）掲載、LA でローンチ展。共著＋撮影＋アートディレクション | **2013 年＝13 年前**。ユニークだが「AI 時代のデザイナー」の主張からは遠い。→ **`about.html` に移すことを推奨**。人物像のページでこそ効く |

残り: carnegie / cli-studios / credit-card-portal / edutrack / hummingbird / menlomath /
ux-audit / vocab-app / web3-wallet / amazon-firetv / dnt / extraordinary / festival-design /
graffitiwear / koji-fizz / konosaki / odell-education / skateboard-egift / value-frontier / xq

## Tier 3 — AI Tools

`ai-tools.html` の 6 件（cross-model-handoff / failforward / interactive-experience-skills /
multilingual-readme / snap-pair / superforge）は作品ではなく道具。現状の独立ハブのままでよい。
Featured に混ぜると種類が違うものが並んで両方弱る。

---

## 5. 判断が割れる 2 枠（要決定）

**枠 5（ELA Quests）vs extra•ordinary**
- ELA Quests: スケールと 11 年の継続。ただし「もう一つの EdTech プロダクト事例」に見える危険
- extra•ordinary: 記憶に残る。エンタープライズ UX ばかりの中で唯一「人間」が見える
- **採った方: ELA Quests**（現在進行形であることを優先）。ただし extra•ordinary を
  About に置けば人物像は回収できる、という前提での判断

**枠 6（Coca-Cola）vs Verizon Total Wireless**
- Coca-Cola: 名前の強さ。ただし役割は代理店の Senior Designer で、OOH・パッケージ寄り
- Verizon Total Wireless: 「コードを書いて出荷に影響した」の証明。ただしクライアント重複
- **採った方: Coca-Cola**（#1〜#5 に「作る証明」は既に十分あり、不足しているのは
  純粋なブランド名の強さだと判断した）

**どちらも覆せる。** 覆す場合、変更は 1 行（Featured 配列の入れ替え）で済む構造にする。

---

## 6. 実装前に潰すべき制約

### 6-1. NDA 案件はビジュアルが弱い（設計に直接効く）

全画面ヒーローを前提にする以上、これは無視できない。

| プロジェクト | ページ本文の記載 |
|---|---|
| T-Mobile | 「All designs have had branding elements removed. Visual details have been anonymized」 |
| Verizon Total Wireless | 「visuals were re-created from scratch for portfolio purposes」 |

→ **Featured #3（T-Mobile）のヒーローは、UI スクリーンショットではなく
キオスク／ロッカーの体験図か動画を使う。** 匿名化された UI を全画面に引き伸ばすと
弱さが目立つ。

### 6-2. アセットが 1.1GB ある

| 種別 | 量 |
|---|---|
| `assets/` 合計 | **1.1GB** |
| 2MB 超の画像 | **61 枚 / 229MB** |
| mp4 合計 | **328MB** |

最大のもの: `value-frontier/Website/VF-Web-screenshot00001.png` **14.5MB**、
`odell-education/Stylescapes_OE_Stylescape_04.png` 8.5MB、
`ela-quests/QUEST-Video_Introducing_The_Contraption.mp4` **92MB**。

`preload="metadata"` は付いているので初期表示は壊れていないが、Featured 6 件を
ビジュアル先行で作る前に、**その 6 件ぶんのアセットだけは先に再エンコードする**。
全 1.1GB の対処は別作業でよい。

---

## 7. 次の実装

1. `index.html` / `work.html` に **Featured 6** の概念を導入（`data-tier="featured"`）
2. Featured グリッドのカードを `<div data-href>` → **`<a href>`** に変更
   （現状 `assets/work-card-grid.js` が `window.location.assign()` でナビゲートしており、
   中クリック・新規タブ・クローラビリティが効いていない）
3. **shared-element morph**（View Transitions API, cross-document）を Featured カード →
   プロジェクトヒーローに適用
4. Featured 6 件のアセット再エンコード
5. Playable AI Experiments のケーススタディ新規作成（#2）
