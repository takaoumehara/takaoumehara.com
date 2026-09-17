# Astro への全面移行 — 設計と決定

> Written by: superforge (architecture) · Last updated: 2026-09-17
> 本人の決定（2026-09-17）:「Astro で完全に作り直しちゃって」。
> 前提の提案は `docs/sidebar-layout-proposal.md`（§7 が Astro の推奨理由）。
> `docs/adaptive-portfolio-architecture.md` §0 の「フレームワークを入れない」は**この決定で覆る**。

---

## 0. 結論（先に）

| 問い | 答え |
|---|---|
| バージョン | **Astro 7.3**（8.0 は MDX / Vercel アダプタが未対応。peer が `^7`） |
| 出力 | `output: 'static'` + `@astrojs/vercel`。ほぼ全ページは静的。**オンデマンド描画は 2 種だけ** — `/lens/preview`（Studio と /try のプレビュー）と `/api/*` |
| URL | **ほぼそのまま。** `build.format: 'preserve'`（Vercel アダプタが `directory` に上書きするので、アダプタの後で戻す）で `about.astro → about.html`、`projects/[slug].astro → projects/<slug>.html`、`lens/[slug]/index.astro → lens/<slug>/index.html`。**例外 2 つ**: Astro は `work.html` と `work/` を同じ経路とみなすので、Work Archive は `/work/` → **`/all/`** に移動（`public/` の静的リダイレクトページで転送）。同じ理由で `now.html` は廃止し `/now/` へ転送 |
| 生成 HTML の commit | **やめる。** commit するのはソース。公開 HTML は Vercel がビルドする。「PR の diff = 公開 HTML」の役割は Vercel の Preview デプロイが担う |
| データ | `src/data`・`src/lenses`・`src/categories` は**無変更**。`validate.mjs`（Claim Guard）・`analyze/`（求人票エンジン）も無変更 |
| 旧レンダラー `src/render/*.mjs`・`src/build.mjs` | `.astro` コンポーネントに移植して**削除** |
| 手書き HTML（ケーススタディ 42 + 一般 8） | **中身は触らず**、シェル（nav / footer / 共通スクリプト）を剥がして本文だけを `src/case-studies/` `src/fragments/` に切り出す。Astro の Layout（サイドバー）に流し込む。MDX への書き換えは 1 件ずつ後で |
| レイアウト | `docs/sidebar-layout-proposal.md` の既定値 — Q1 (a) トップ右カラム = ヒーロー + Selected work、Q2 (a) カテゴリ折りたたみ・現在地だけ展開、Q3 (a) Ink & Paper のまま |

---

## 1. ディレクトリ

```
astro.config.mjs
public/                      ← 旧 assets/ を public/assets/ へ git mv。favicon.svg、projects/amazon-firetv/（静的デモ）
  projects/*.html            シェルを持たない単体ツール（shopping-on-fire-tv、werewolf-card-{gallery,viewer,position-editor}）。抽出せずそのまま配信
src/
  data/ lenses/ categories/  無変更
  analyze/ lib/ validate.mjs 無変更（lib/site.mjs を追加: Vite の import.meta.glob で同じ Library を組む）
  styles/site.css            旧 lens.css（フォント URL を /assets/fonts に）+ sidebar.css
  layouts/Site.astro         head・サイドバー・右カラム・フッター・共通スクリプト。全ページがこれを使う
  components/
    Sidebar.astro            カテゴリ別の作品一覧（src/categories）・About カード・ページ nav・言語スイッチ
    lens/                    Hero / Proof / Exploring / Experiments / Ventures / Ideas / Tools / CareerArc / Capabilities / Fit / Studio / Contact / LensPage
    category/                CategoryPage / Card
    archive/ now/            Work Archive / Living Lab Bench
  case-studies/<slug>.html   ケーススタディ本文（nav〜footer の間）。<slug>.css = 旧 head の <style>。<slug>.json = title / description / og / 追加 CSS
  fragments/<name>.html      一般ページ（about など）の本文。同じ 3 点セット
  pages/
    index.astro  ja/index.astro  lens/[slug]/index.astro  lens/preview.astro (prerender=false, POST)
    interactive.astro ai-products.astro ai-tools.astro work.astro brand.astro   ← src/categories/*.json
    all/index.astro（Work Archive、旧 /work/）  now/index.astro
    projects/[slug].astro     ← src/case-studies
    about.astro contact.astro publications.astro workshop.astro breakbias.astro intentfirst.astro work-with-me.astro 404.astro
    studio/index.astro try/index.astro       クライアントスクリプトは src/studio/*.mjs
    assets/studio/library.json.ts            静的エンドポイント（旧 assets/studio/library.json）
    api/auth/{login,callback,me,logout}.ts api/publish.ts api/fetch-jd.ts   prerender=false
scripts/extract-page.mjs     手書き HTML → 本文 / CSS / meta の切り出し（1 回きり。記録のため残す）
tests/                       dist（.vercel/output/static）を検査
```

## 2. サイドバー（Layout）

- `<aside class="side">` は `position: sticky; top: 0; height: 100vh; overflow: auto`。幅 `clamp(280px, 24vw, 360px)`。
- 中身: 名前 + 一行（`/`）・「All work」（`/all/`）・言語スイッチ・About カード・ページ nav（Now / Writing / Workshops / About / Work with me / Studio ↗）・**カテゴリ別の作品一覧**（`<details>` × 5、現在地のカテゴリだけ `open`、項目 = サムネ + 名前 + `cardLine`）。
- 右カラム `<div class="main">` はページ本文。旧 `--col: 1200px` は右カラム内の最大幅として残る。
- 900px 以下: サイドバーは上部バー（名前 + Menu）になり、一覧はボタンで開く。
- サイドバーのトークンは `--side-*` で独立させる。手書きページは `design-system.css` が `:root` を上書きする（ダーク既定）ので、共通トークンに乗ると崩れる。逆に `site.css` はページ CSS より後に束ねられるので、`data-theme="dark"` のページ（Interactive の 8 本）には `site.css` 側で `html[data-theme="dark"] { --bg … }` を再宣言して暗いまま出す（無いと紙色の上に白文字が乗る）。
- Cross-document View Transitions は継続。サイドバーに `view-transition-name: side` を与え、右だけ入れ替わる。

## 3. データの読み方

- ビルド時: `src/lib/site.mjs` の `getLibrary()`。`import.meta.glob('../data/**/*.json', { eager: true })` から `assembleLibrary()`（`load.mjs` と共有）で組む。**1 度だけ** `validateAll` を通し、エラーがあればビルドを落とす（今と同じ）。
- Node（tests / scripts / analyze）: `load.mjs` の `loadLibrary()` のまま。両者が同じ結果を返すことをテストで確認。
- オンデマンドの `/lens/preview` と `/api/publish` も同じ `getLibrary()`（バンドル済み。関数の中で fs を読まない）。

## 4. Studio / try / api

- `/lens/preview`（POST、`prerender = false`）: body の Lens JSON を `validateLens` に通し、`LensPage.astro` で描画して返す。Studio と /try は `fetch` して `iframe.srcdoc` に入れる。**描画コードは 1 つ**（旧 `src/render/page.mjs` の役割）。
- `/api/publish`: Lens JSON と `library.json` を commit していたのを、**Lens JSON だけ**にする。Vercel がビルドする。
- 認証・fetch-jd は `api/*.mjs` の Web 標準ハンドラを Astro のエンドポイント（`export const GET = ({ request }) => …`）に包み直すだけ。
- 環境変数 4 つ（`GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `SESSION_SECRET` / `OWNER_LOGIN`）は変わらない。

## 5. テスト

- `npm test` = `astro build` → `node --test tests/*.test.mjs`。読み取り元は `.vercel/output/static/`（`tests/_dist.mjs`）。
- 旧「commit された HTML = build の出力」テストは廃止（commit しない）。代わりに「build が通る = Claim Guard が通る」。
- Playwright は `.vercel/output/static` を `python3 -m http.server` で配信。`/api` はローカルで動かない前提（今までも同じ）。Studio の spec は `/lens/preview` が要るので **`astro dev` を webServer にする**。
- `docs/superforge.md` の pin を更新: 1200px 一択 → 右カラム内の最大幅、生成物を commit → しない。

## 6. やらないこと（この PR では）

- MDX への書き換え。部品（`src/components/case/`）と 1 件の見本は次の PR。
- `/ja/...` の i18n ルーティング。`.t-en / .t-jp` + スイッチのまま（`/ja/` の別ページは今まで通り生成）。
- `<Image>` による画像最適化。手書き本文の `<img>` はそのまま。

## 7. 移植で分かったこと（次に触る人へ）

- **手書きページの末尾 `<script>` は、ページ固有の IIFE と共通ボイラープレート（言語切替・モバイル nav）が 1 つの `<script>` に融合していることがある**（werewolf.html のカードデッキ）。`scripts/extract-page.mjs` はトップレベルの `})();` で分割し、ボイラープレート部分だけ捨てる。main 側で手書きページが更新されたら、そのファイルを `projects/` に置いて抽出し直す（ROOT_PAGES を空にしたコピーで 1 件だけ回せる）。
- 抽出し直した本文に `data-vt-hero` が無いと `tests/page-transitions.test.mjs` が落ちる。ヒーローの media 要素に付け直す。

- **Astro のフロントマターは、テンプレートリテラルの `${…}` の中に別のテンプレートリテラルを
  入れると解析できない**（`` `<dl>${rows.map((r) => `<div>${r}</div>`).join("")}</dl>` `` の形）。
  エラーは `Expected '}'` と出て、行番号は近くの `interface Props` を指すので気づきにくい。
  内側の断片を先に `const` で組んでから外側に入れる。旧 `src/render/*.mjs` はこの形を多用していた。
- `getStaticPaths()` は分離して実行されるので、フロントマターの変数（`import.meta.glob` の結果を
  含む）を参照できない。glob は関数の中で呼ぶか、`props` で渡す。
- `now.astro` と `now/index.astro` のように同じ経路を 2 か所で定義すると警告（次の版でエラー）。
  旧サイトの `work.html`（カテゴリ）と `/work/`（アーカイブ）のような組は、別の経路名で分ける。
