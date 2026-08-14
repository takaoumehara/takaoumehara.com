# ページ遷移 — 2つの方式と、採らなかった方の記録

> Written by: superforge-ui · Last updated: 2026-08-14
> Status: **morph = 棚上げ（superseded）／色の連続 = 現行**
> 対象: `assets/view-transitions.css` · `assets/work-card-grid.js` ·
> `landing-b-index.html` · `projects/rakugaki-jam.html`

## 現在の結論（先に読むところ）

**採用: 色の連続（§5）。** ホバー時点で遷移先のグラデーションが全画面にあるので、
クリックは「それを壊さない」だけでよい。View Transitions API を使わないため、
下の §3 にある 5〜8/10 の不安定さが**構造的に発生しない**。

**棚上げ: shared-element morph（§1〜§4）。** 実装は残してあり、旧グリッド
（`work.html` / `brand.html` / `index.html`）では今も動く。ただし
**ユーザーが実機で「morph が見えない」と報告**し、それは §3 の実測（5〜8/10）と
一致した。原因は未特定のまま。B 案を採る場合、この機能は不要になる。

以下 §1〜§4 は morph の記録。現行方式は §5。

---

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

### 未解決の欠陥 — これは出荷前に潰す必要がある

**同じ操作を繰り返すと、遷移は 10 回中 5〜8 回しか走らない。**

当初これを「headless 環境のばらつき」と書いたが、**測り直したら誤りだった。**
依存の無い最小 2 ページを同じハーネスで 10 回走らせると **10/10 で安定する**。
つまり環境ではなく、**このサイトのページ側に原因がある。**

切り分けで潰した候補:

| 疑ったもの | 結果 |
|---|---|
| `prefers-reduced-motion` が効いている | 違う（明示的に no-preference で実行） |
| Playwright の起動フラグ（PaintHolding / bfcache 無効化など） | 違う（4 構成すべて同じ） |
| ブラウザが cross-document 遷移に非対応 | 違う（最小対照は 10/10） |
| **ページ重量・ヒーロー画像の重さ** | **違う。相関しない** — ela-quests（1.77MB）は 3/3、vocab-app（0.05MB）は 2/3。FCP は全ページ 200〜370ms で差が無い |
| 外部リソース（Google Fonts / jsdelivr）の読み込み | **一部寄与する**。`<link>` と `<script src=https://…>` を剥がすと 6/10 → 8/10。ただし 10/10 にはならない |

**残りの原因は未特定。** ページ内の JS（`reveal-on-scroll` の IntersectionObserver、
言語切替の DOM 書き換え、カードの長いホバー遷移）が候補として残っているが、
**確かめていない。**

なお、到達できない render-blocking なスタイルシートが遷移を殺すことは
別途対照実験で確認済み（インライン opt-in→動く／外部 CSS→動く／
**外部 CSS ＋届かない Google Fonts→動かない**）。これは上の「一部寄与する」と
整合するが、全体の説明にはならない。

### したがって現在の状態

**この機能は「動くことがある」段階であって、「動く」とは言えない。**
実ブラウザ（headed / 実デプロイ）で同じ確率で落ちるのかどうかも未確認。
このサンドボックスからは Vercel プレビューに到達できないため、
**実機で触った結果が次の判断材料になる。**

## 4. やっていないこと

- **ホバーでの動画再生**（bpowell / Channel Studio 型）。構造ではなく装飾なので後から足せる
- **アセットの再エンコード**。`assets/` は 1.1GB のまま（`docs/portfolio-tiering.md` §6-2）
- **Featured 6 の実装**。階層化はまだドキュメントのみで、UI には出ていない
- `index-v1` / `index-v53` / `index-grad` は `<a>` 化のみ。遷移は入れていない（旧版のため）

---

## 5. 現行方式 — 色の連続（`landing-b-index.html` → `projects/rakugaki-jam.html`）

### 仕組み

```
ホバー   → body に --tint / --tint-2 を設定、.field を opacity:1
          （遷移先の全画面グラデーションが、クリック前から画面にある）
クリック → body.is-leaving：リストだけ落とす。フィールドは動かさない
          260ms 後に location.href
到着     → 遷移先が同一のグラデーションで開く。中身だけ rise-in
```

**遷移先の CSS はインラインで持つ。** 外部スタイルシートは1フレーム遅れて届くこと
があり、その1フレームで色の連続が切れる。§3 で「到達できない外部 CSS が遷移を殺す」
と分かっているので、ここは意図的にインライン。

### 検証（Chromium 141・実行して確認）

| 確認したこと | 結果 |
|---|---|
| 両ページの `background-image` 計算値が一致 | **完全一致**（`oklab(0.472212 0.0432401 -0.0930929)` まで同一） |
| 遷移先の canvas が生きている／実際に描ける | **確認**（ドラッグして描画を検出） |
| 横スクロール（1440 / 375px） | **0px** |
| JS エラー | **0** |
| EN/JP 同時表示 | **0**（下記の欠陥を修正後） |

### 同時に見つけて直した既存欠陥

**`.nums span` / `.proof span` / `.facts span` の詳細度が `.t-jp{display:none}` を
上回り、日英が同時に表示されていた。** index に4箇所、新規ページに3箇所。
4ページすべてに不変条件（`html:not(.lang-jp) .t-jp{display:none!important}`）を入れ、
`tests/view-transitions.test.mjs` で固定した。

### 未確認

- **Firefox / Safari での実機確認**（この方式は API 非依存なので動く想定だが、未確認）
- morph 側の 5〜8/10 の根本原因（棚上げしたため未追跡）
