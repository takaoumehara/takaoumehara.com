# ページ遷移 — 2つの方式と、採らなかった方の記録

> Written by: superforge-ui · Last updated: 2026-08-14
> Status: **morph = 棚上げ（superseded）／色の連続 = 現行**
> 対象: `assets/view-transitions.css` · `assets/work-card-grid.js` ·
> `landing-b-index.html` · `projects/rakugaki-jam.html`

## 現在の結論（先に読むところ）

**採用: 共有ハンドオフ層（§6）。** フィールドはページが作るものではなく、
`assets/handoff.js` が全ページに注入する `html::before`（`position:fixed; inset:0`）
ひとつになった。両ページが**同じボックス＝ビューポート**に対して解決するので、
色がナビゲーションをまたいで変わることが**構造的に起こらない**。

**棚上げ: §5 の「ページごとに同じ CSS を書く」方式。** 文字列は同じでも
**箱が違った**（index はビューポート、プロジェクトページは `min(100dvh,880px)` の
hero）。これがユーザーの報告した「トランジション先で紫が切れている」の正体。
§5 の検証は計算値の**文字列**を比較していて、描画結果を比較していなかった。

**棚上げ: shared-element morph（§1〜§4）。** View Transitions API 依存。
実測 5〜8/10 の不安定さの原因は未特定のまま。§6 は API を使わない。

以下 §1〜§4 は morph の記録、§5 は旧「色の連続」の記録。現行方式は §6。

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


---

## 6. 現行方式 — 共有ハンドオフ層（`assets/handoff.js`）

### 何が壊れていたか

ユーザーの報告:「フルスクリーンで紫だけど、トランジション先は紫が切れている。
そこにギャップがある」。原因は3つあり、どれも独立していた。

| # | 原因 | 具体 |
|---|---|---|
| 1 | **色が借り物** | `landing-b-index.html` の Rakugaki Jam 行が `data-tint="#3b1d6e"` と `data-art="assets/marubatsu/hero.jpg"` を **02 行からコピペ**していた。画面に出ていた○×盤は Marubatsu の写真 |
| 2 | **同じ CSS が違う絵を描いていた** | index は `.field::before{position:fixed;inset:0}` → **ビューポート**基準。遷移先は `.hero::before{inset:0}` で hero が `min-height:min(100dvh,880px)` → **別の箱**。`120% 90% at 18% 12%` の解決先が変わる |
| 3 | **色が途中で終わる** | 遷移先の紫は hero の中だけ。スクロールすると切れる。index では全画面だった |

### 直し方

フィールドを**ページの持ち物にするのをやめた**。

```
assets/handoff.js   :root に --tu-tint / --tu-tint-2 / --tu-on / --tu-field
                    html::before  ground（z-index:-1, fixed, inset:0）
                    html::after   veil （z-index:2147483000, fixed, inset:0）
                    departure: a[data-tu] のクリックを奪い、payload を
                               sessionStorage へ書いて遷移
                    arrival:   payload があれば first paint 前に色を確定
```

CSS を**JS 内の文字列**で持ち、`<head>` に **defer なし**で読ませている。
到着色は最初のフレームに必要で、外部スタイルシートは1フレーム遅れうるため。

### 3つの遷移形（すべて同じ1枚の層）

| 形 | 使う場所 | 動き |
|---|---|---|
| `colour` | B | ホバー時点で遷移先の色が全画面。クリックはリストを落とすだけ |
| `image` | A / C | クリックしたサムネイルが全画面へ拡大（transform のみ）。遷移先は**同じ画像**で開いてからフェード |
| `veil` | 既存プロジェクトページ全部 | 到着時に色（または画像）が**上に**あり、持ち上がる。白い瞬間が無い |

`<html data-tu-adopt>` を宣言したページは ground を自分の地として使う
（`projects/rakugaki-jam.html`）。宣言しないページは veil で受ける。
**41 ページに `handoff.js` を追加**したので、A・C から既存ページへ飛んでも切れない。

### Rakugaki Jam の色

ユーザーの指摘「紫なのはわかるが、Rakugaki Jam が必ずしもその色ではない」に対して、
色を**作品から取った**。この作品は暗い部屋と投影された壁とネオンのマーカーなので、
地は `#131017 → #2e1b33` のほぼ無彩色、**画面上で彩度を持つのは誰かが描いた線だけ**。
ネオンの hue（318 / 292 / 262 / 342 / 196）は、ページ内の canvas が実際に
描いている値そのもの。index のプレビューと遷移先で**同じ hue・同じ bloom・同じ壁**。

### 借り物の写真をやめた（`assets/field.js`）

写真を持たない作品には `data-motif` を与え、canvas が**その作品の仕組み**を描く。

| 行 | motif | 描くもの |
|---|---|---|
| Rakugaki Jam | `strokes` | 線を描き、壁へ飛ばす（遷移先の実装と同じ挙動） |
| Typespace | `constellation` | 点が線で結ばれ星座になる |
| Resona 響 | `ripple` | 重さのある同心円 |
| Marubatsu Arena | `grid` | ○×盤が埋まっては消える |
| Snap Pair | `pair` | 2つの点が出会って繋がる |
| Kao Game | **なし** | 中身が未確認なので描かない（`docs/landing-variants.md` §4） |

同じ canvas がホバー前は**ドットマトリクス**として動き、カーソルに反応する。
ホバーは別レイヤーではなく、その続き。

### 検証（Chromium 141・Playwright で実行）

| 確認したこと | 結果 |
|---|---|
| index のホバー色と遷移先の `background-image` 計算値 | **完全一致**（`===` で比較） |
| 直接訪問した遷移先が、ハンドオフ経由と同じ絵か | **一致** |
| 遷移先の field opacity（hero を過ぎてスクロール後） | **1**（切れない） |
| hero の高さ = ビューポート | 900 / 900 |
| A: サムネイルが飛ぶ | **確認**（ghost 427×320 → 全画面、正しい画像） |
| A/C: 到着 veil が同じ画像を持って出て、持ち上がる | **確認** |
| C: 横スクロール（1440px） | 0px |
| モバイル 390px × 4ページ: 横スクロール / 日英同時表示 | **0 / 0** |
| JS エラー | **0**（記録された失敗はブロックした Google Fonts のみ） |

### 意図的にそうしていること

- **フォントが届かなくても遷移は死なない。** veil は `load` を待つが、
  620ms の締切で必ず持ち上がる。§3 の「届かない外部 CSS が遷移を殺す」問題は
  この方式には無い（API に依存していないため）
- **`index.html` は変更していない。** 3案と既存プロジェクトページのみ

### 未確認

- **Firefox / Safari の実機**（API 非依存なので動く想定だが、未確認）
- morph 側の 5〜8/10 の根本原因（棚上げのため未追跡）
