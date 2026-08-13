# ページ遷移 — カードからプロジェクトヒーローへの morph

> Written by: superforge-ui · Last updated: 2026-08-13
> 対象: `assets/view-transitions.css` / `assets/work-card-grid.js` / 全グリッドページ / `projects/*.html`

---

## 1. 何を作ったか

グリッドのカードをクリックすると、**カードの画像がそのまま拡大してプロジェクトページの
ヒーローになる**。黒い幕を挟まない。

参考にした3サイトを実測した結果から、この方式を選んだ。

| サイト | 仕組み | 黒い時間 |
|---|---|---|
| Creative Giants | 黒い幕で覆って待つ | 約 1.5 秒 |
| Channel Studio | 同一ヒーロー画像を黒経由でクロスフェード | 約 0.8 秒 |
| bpowell | ホバー時点で遷移先の色を全画面に出す | 実質ゼロ |
| **本実装** | **shared-element morph** | **ゼロ（460ms の morph のみ）** |

bpowell 方式（ホバーで色を先出し）は採らなかった。**ホバーはモバイルに存在せず、
仕組みを2つ作ることになる。** morph はタッチでも同一に動く。

---

## 2. 実装

**JS は遷移を制御していない。** ブラウザの View Transitions API がやる。

```
assets/view-transitions.css   @view-transition { navigation: auto }
                              .project-hero-img { view-transition-name: project-hero }
                              ::view-transition-group(project-hero) { 460ms }

assets/work-card-grid.js      pageswap  → クリックされたカードの .card-img-bg に
                                          同じ view-transition-name を付ける
                              pagereveal → 戻る時に、元のカードへ名前を付け直す
```

受け側（プロジェクトページ）は**静的**。1ページにヒーローは1つしかないので
スクリプトが要らない。送り側だけが「どのカードか」を実行時に決める。

### 460ms にした理由

Creative Giants の 1.5 秒は、作品8件のアート制作会社だから演出として読める。
**35 件を見比べるサイトでは、1クリックごとの1.5秒は待ち時間になる。**
460ms は「ひとつの動き」として読める下限に近く、5件見ても体感に残らない。

### カードを `<a>` に変えた

以前は `<article data-href>` を `window.location.assign()` で遷移させていた。
これを **68 枚すべて `<a href>` に変換**した。View Transitions がネイティブの
ナビゲーションを要求するからだが、それ以前に、中クリック・新しいタブで開く・
右クリック・クローラビリティが**すべて効いていなかった**。

リンク先の無いカード（MyBrainSpec、Koe Baku など未公開の4枚）は `<article>` のまま。

---

## 3. 検証（Chromium 141 / 実行して確認したもの）

| 確認したこと | 結果 |
|---|---|
| 送り側 `pageswap` で `.card-img-bg` に名前が付く | **確認**（`{cls:"card-img-bg", name:"project-hero"}`） |
| 受け側ヒーローが同名を持つ | **確認**（`view-transition-name: project-hero`） |
| カード画像とヒーローが同一ファイル | **19/22 件**。残り3件（web3-wallet / odell-education / extraordinary）はクロスフェードになる |
| 実際に cross-document 遷移が走る | **確認**（`pagereveal` の `viewTransition` が非 null、`group` の duration が 0.46s） |
| モバイル 390px | **確認** |
| `prefers-reduced-motion: reduce` で無効になる | **確認**（遷移せず即時ナビゲート） |
| ヒーロー画像を持たないページ（verizon-ai-agents / amazon-firetv） | **確認**。共有要素なしのクロスフェードに退行、壊れない |
| Firefox | **未確認**。cross-document 未実装のため通常遷移になる想定 |

### 判明した実際の弱点

**render-blocking な外部スタイルシートが遅い／届かないと、遷移は静かに消える。**

対照実験で切り分けた（最小ページ 3 パターン）:

| 構成 | 結果 |
|---|---|
| インライン `<style>` で opt-in | 遷移する |
| 外部スタイルシートで opt-in | 遷移する |
| **外部スタイルシート ＋ 到達できない Google Fonts の `<link>`** | **遷移しない** |

到着側が時間内に描画できないと Chromium が遷移を破棄する。
`preconnect` は全ページに既に入っているので追加対応はしていないが、
**フォントが遅い訪問者では morph が出ない**ことは仕様として受け入れている
（機能が消えるだけで、ページは壊れない）。

### 検証の限界（正直に）

このサンドボックスの headless Chromium では、**同じ操作で 3 回中 2 回しか遷移が
走らないケースが多かった**。当初はページ重量が原因かと考えたが、**相関しなかった**:

- ela-quests（ヒーロー 1.77MB）→ 3/3 成功
- vocab-app（ヒーロー 0.05MB）→ 2/3
- FCP は全ページ 200〜370ms で差が無い

したがって**ページの重さが原因という仮説は成立しない**。headless 環境の
コンポジタ由来のばらつきと見ているが、**確証は無い**。
Vercel のプレビューを実ブラウザで触って確認する必要がある。

---

## 4. やっていないこと

- **ホバーでの動画再生**（bpowell / Channel Studio 型）。構造ではなく装飾なので後から足せる
- **アセットの再エンコード**。`assets/` は 1.1GB のまま（`docs/portfolio-tiering.md` §6-2）
- **Featured 6 の実装**。階層化はまだドキュメントのみで、UI には出ていない
- `index-v1` / `index-v53` / `index-grad` は `<a>` 化のみ。遷移は入れていない（旧版のため）
