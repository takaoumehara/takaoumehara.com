# サイドバー型レイアウトへの移行 — 実現性と進め方（提案）

> Written by: superforge · Last updated: 2026-09-17
> 状態: **提案。本人の回答待ち（§6 の 3 問）。** 決まったら §2 の pin を `docs/superforge.md` に移す。
> 参照: PORTO ROCHA（portorocha.com）— 左に固定サイドバー、右にプロジェクト本文。
> refero.design のリンクと portorocha.com は作業環境から開けなかった。スクリーンショット 4 枚から読んだ。

---

## 0. 結論

| 問い | 答え |
|---|---|
| 今のサイト全体をこの形に変えられるか | **変えられる。** 左のプロジェクト一覧は `src/categories/*.json`（5 カテゴリ・45 件）とサムネ・一行説明（46 件すべてに `cardLine` あり）がすでに構造化されているので、生成器から吐くだけ |
| 一番重いのは何か | **`projects/*.html` の 42 ページ**。手書きで、各ページが自分の nav と全幅 1120px のレイアウトを持つ。中身は触らず、シェルだけ一括で差し替える |
| SPA にする必要があるか | **ない。** PORTO ROCHA も各プロジェクトが URL を持つ普通のページ遷移。サイドバーが同じ位置にあるから「切り替え」に見える。うちには Cross-document View Transitions がすでにあるので、サイドバーを固定して右だけ入れ替える動きが CSS だけで作れる |
| Lens / Studio / 求人票エンジンはどうなるか | **そのまま生きる。** むしろ良くなる — Lens が「サイドバーの並び順と強調」を決めるようになる |

---

## 1. 参照サイトの構造 → うちの構造への対応

| PORTO ROCHA | takaoumehara.com での対応 | 出どころ |
|---|---|---|
| 左上「Show all projects」→ 全件グリッド | 今の `/work`（Work Archive）をそのまま全件ビューに | `src/render/archive.mjs` |
| 名前・時計 | 名前 + 一行（時計は入れない。目的に無い） | `src/data/profile.json` |
| 「About us」カード | 「About」カード（1 文 + `about.html` へ） | `profile.json` |
| プロジェクト一覧（サムネ + 名前 + 一行） | **カテゴリ見出しつき**の一覧。Interactive → AI Products → AI Tools → Product → Brand | `src/categories/*.json` |
| 右カラム: ヒーロー画像 → The Challenge / The Solution → 全幅画像 | 既存の `projects/*.html` 本文（`data-vt-hero` のヒーロー → 本文） | 変更なし |
| 右カラムに「About」ページ | `about.html` も同じシェルに入る | — |

本人の言葉との対応:
- 「カテゴリーに分けた形でプロジェクトが見れる」→ サイドバーの見出しがカテゴリ。参照サイトには無い、うち独自の追加。
- 「左にメニューがあってどんどん切り替えて見れる」→ サイドバー固定 + 右カラム入れ替え。
- 「トップページはグリッド状だが目的に合わせる」→ トップの右カラムは全件グリッドではなく、**今のヒーロー + Selected work を短くしたもの**（§6 Q1 の既定値）。

---

## 2. 今の pin と衝突するところ（決まったら `docs/superforge.md` を直す）

| 今の pin（2026-09-11） | 変わる点 |
|---|---|
| 本文の列は 1200px 一択（`--col`） | 右カラム幅 = 画面幅 − サイドバー（約 380px）。`--col` は右カラム内の最大幅に読み替える |
| グリッドは 3 列 / 4 列の 2 種類 | 右カラム内では 2 列 / 3 列に落ちる。規則そのものは残す（説明つき = 少ない列、タイル = 多い列） |
| カテゴリページ（`interactive.html` 等）は索引として残す | **残す。** ただし役割は「Show all のカテゴリ絞り込み」に近づく。事実は引き続き `src/data/` が正 |
| ページ遷移: サムネ → ヒーロー | 残す。加えてサイドバーを `view-transition-name` で固定し、右だけ動かす |

衝突しないもの: Ink & Paper のトークン、Outfit、`{en, jp}` の言語規約、Claim Guard、WCAG 2.2 AA。

---

## 3. やり方の選択肢

| 案 | 内容 | 工数 | 判断 |
|---|---|---|---|
| **A. シェル差し替え** | 生成器がサイドバー HTML を 1 か所で作り、`build.mjs` が生成ページ（index / ja / lens / categories / work / now）に組み込む。手書きページ（`projects/*.html`・`about.html` 等）は `<nav class="site-nav">…</nav>` をサイドバーに置換し、body を 2 カラムにする CSS を `design-system.css` / `project-page.css` に足す。**中身は触らない** | 中 | **推奨** |
| B. プロジェクトページも data から生成 | 正しい最終形だが、42 ページ × 500 行の本文移行が要る | 大 | 今はやらない。A の後で 1 ページずつ |
| C. SPA / iframe | 右カラムだけ JS で差し替え | 中 | 不要。SEO と View Transitions を失う |

A の根拠: 前回の nav 変更（`78603c2`）も 27 ファイル一括置換で済ませている。同じ流儀。

---

## 4. 正直に言う「重いところ」

1. **`project-page.css`（3,521 行）の全幅前提。** `max-width: 960px / 1120px`、`100vw` の full-bleed が右カラム幅で崩れる箇所を個別に潰す。ここが工数の大半。ページごとの `style=""` 直書きもある。
2. **テスト。** `tests/ai-tools-portfolio.test.mjs`（nav の形を固定）、`lens-system`、`strategic-refinement`、`a11y.spec.mjs`（axe）を新シェル向けに書き直す。
3. **モバイル。** サイドバーは畳んでヘッダー + ドロワー（今の `nav-toggle` を流用）。参照サイトも同じ。
4. **サムネの無い 6 件**（kao-game / kanji-puzzle / ventures 4 件）→ 既存の CSS アート（`assets.art`）か文字タイル。
5. **45 件をそのまま縦に並べると長い。** 参照サイトは十数件。カテゴリごとに折りたたみ、現在地のカテゴリだけ開く（§6 Q2）。

---

## 5. 段階と担当モデル

| 段階 | 内容 | 完了の証拠 | モデル |
|---|---|---|---|
| **0. 試作**（半日） | サイドバー付きの試作 3 ページ（トップ + プロジェクト 2 本）を `lens/_preview/` に出す。本人が見て「これで行く」を言う | Chromium のスクリーンショット 3 枚 | 設計 Opus 5 / 実装 Sonnet 5 |
| 1. 生成ページ | `src/render/shell.mjs` にサイドバー、`lens.css` に 2 カラム。index / ja / lens / categories / work / now | `npm test` 緑、`node src/build.mjs` の差分がシェルだけ | Sonnet 5 |
| 2. 手書きページ | `projects/*.html` 42 + `about` 等の nav 置換 + CSS の崩れ潰し | 42 ページの axe 通過、右カラムで横スクロール無し | 置換 Haiku 4.5 / 崩れの判断 Opus 5 / 直し Sonnet 5 |
| 3. 仕上げ | テスト書き直し、pin 更新、View Transitions のサイドバー固定 | `npm run test:all` 緑 | Sonnet 5 |

トポロジー: Subagents（Sonnet 5 ワーカー）。議論が要るのは段階 0 の設計だけで、それはインライン。

---

## 6. 本人に聞くこと（3 つまで。答えが無ければ既定値で進める）

| # | 問い | 既定値（推測） |
|---|---|---|
| Q1 | トップページの右カラムに何を出すか。(a) 今のヒーロー + Selected work を短く (b) About (c) 最初のプロジェクトをそのまま | **(a)** — 「目的に合わせる」の目的 = 採用と受注。3 秒で「この人のレベル」を答える面は残す |
| Q2 | サイドバーの 45 件をどう見せるか。(a) カテゴリ折りたたみ、現在地だけ展開 (b) 全件展開（参照サイトと同じ） (c) カテゴリごとに上位 3 件 + 「すべて」 | **(a)** |
| Q3 | 見た目をどこまで寄せるか。(a) 構造だけ移し、Ink & Paper / Outfit のまま (b) 参照サイトの薄いグレー角丸カードに寄せる | **(a)** — creativityiseverywhere.com と揃えた既定があるため |
