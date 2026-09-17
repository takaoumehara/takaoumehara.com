# Astro への全面移行 + サイドバー型レイアウト

> `.handoff/2026-09-16-adaptive-pitch-studio.md` の続き。あちらの Phase 2/3 の内容はそのまま有効。

## Resume Capsule

Project: takaoumehara.com
Handoff: `.handoff/2026-09-17-astro-rebuild.md`
Passphrase: 「サイドバーは動かない、右だけが変わる」
Goal: 本人の決定「Astro で完全に作り直しちゃって」（2026-09-17）。参照は PORTO ROCHA —
  左に固定サイドバー（カテゴリ別の作品一覧）、右にページ本文。手書き HTML をやめる。
State: **完了して push 済み。** ブランチ `claude/exciting-cerf-xgoyxb`、PR #19（draft）。
  `npm test`（astro build + node --test）118/118、`npm run test:e2e`（axe WCAG 2.2 AA・キーボード・
  言語スイッチ・サイドバー・Studio・/lens/preview）48/48。
  旧 `src/render/*`・`src/build.mjs`・生成 HTML・手書き HTML はすべて削除。
Next: **本人が Preview デプロイ（PR #19 の Vercel コメント）を見て「これで行く」を言う。** その後 draft を外してマージ。
  マージ後に確認: (1) Vercel が Astro としてビルドしたか（`vercel.json` の `framework`）、
  (2) `/work/` → `/all/`、`/now.html` → `/now/` の転送（`public/` の静的ページ）、(3) `/studio/` の Publish が Lens JSON だけを commit するか。
  コード側の次: ケーススタディを 1 件ずつ MDX へ（`src/components/case/` の部品はまだ無い）。
Read first: `docs/astro-architecture.md`（設計と §7 の落とし穴）、`docs/sidebar-layout-proposal.md`（なぜこの形か）、
  `src/layouts/Site.astro` + `src/components/Sidebar.astro`（シェル）、`src/lib/site.mjs`（データの入口）。
Running: プロセス無し。PR #19 を subscribe 中。

## 何がどこへ行ったか

| 旧 | 新 |
|---|---|
| `src/render/*.mjs`（文字列レンダラー）+ `src/build.mjs` | `src/components/lens/*.astro`, `category/`, `archive/`, `now/`；ページは `src/pages/` |
| `index.html` / `ja/` / `lens/<slug>/`（commit された生成物） | ビルド時に生成（commit しない） |
| `projects/*.html`（手書き 42） | `src/case-studies/<slug>.{html,css,json}` + `src/pages/projects/[slug].astro`（`scripts/extract-page.mjs` で切り出し） |
| `about.html` ほか手書き 8 | `src/fragments/<name>.{html,css,json}` + `src/pages/<name>.astro` |
| `studio/`, `try/`, `api/` | `src/pages/studio/`, `src/pages/try/`, `src/studio/*.mjs`, `src/pages/api/*.ts`, `src/server/*.mjs` |
| `assets/` | `public/assets/` |
| プレビュー（ブラウザ内の文字列レンダラー） | `POST /lens/preview`（オンデマンド、実コンポーネントで描画） |
| `/work/`（Work Archive） | `/all/`（静的ページで転送） |
| `now.html` | `/now/`（静的ページで転送） |

## 決めたこと（本人の 3 問への既定値）

Q1 トップ右カラム = ヒーロー + Selected work / Q2 サイドバーはカテゴリ折りたたみ・現在地だけ展開 /
Q3 Ink & Paper のまま。覆すなら `Sidebar.astro` と `shell.css`。

## 未検証（正直に）

- ~~Vercel 上の実ビルド~~ → **確認済み**（`94d5962` で両プロジェクトとも Ready）。落ちていた原因は
  `.vercelignore` の無指定パターン（`tools` / `scripts` が `src/data/tools` と `src/scripts` にも一致）と、
  除外フォルダ `src/pitches` の中にあったサンプル求人票。再現法: `git ls-files -ci --exclude-from=.vercelignore`
  で消える一覧を出し、それを消したコピーで `npm ci && npm run build`。
- Preview URL の中身（ページが実際に表示されるか）はこの環境から通信できず未確認。本人が開いて見る。
- `/api/*` と `/studio/` の Publish は GitHub をスタブしたテストのみ（前回と同じ）。
- `index-*.html`（旧ホームページの保存版 5 枚）はリポジトリ直下に残したまま。配信されない。

## main との合流（PR #20 werewolf 更新）

`f166d96`（werewolf ケーススタディの全面更新 + カードツール 3 ページ + 画像 134MB）を merge commit で取り込んだ。

- `projects/werewolf.html` → `scripts/extract-page.mjs` で `src/case-studies/werewolf.{html,css,json}` を再抽出。末尾の `<script>` にカードデッキの IIFE が同居していたので、抽出器がボイラープレートだけ捨てるよう修正。`data-vt-hero` を hero に付け直し。
- `projects/werewolf-card-{gallery,viewer,position-editor}.html` は nav/footer を持たない単体ツール → `public/projects/` にそのまま置く（`../assets/werewolf/...` 参照はそのまま通る）。`src/lib/load.mjs` の `sourceExists` が `public/projects/` も見るようにした。
- `assets/werewolf/**` → `public/assets/werewolf/**`。生成物（`interactive.html` `work/index.html` `assets/studio/library.json`）は取り込まない（ビルドが作る）。
- `src/styles/site.css` の「衝突」は git が `interactive.html` との改名と誤認したもの。HEAD 側をそのまま採用。

## 第 2 段: 見た目を PORTO ROCHA に寄せた（同日、本人「見た目を original に近づけて」）

トークン・サイドバー・遷移は `docs/superforge.md` の pin（「見た目は PORTO ROCHA」「サイドバー」「ページ遷移は同一文書内」「トップページ」「ケーススタディの冒頭」）が正。実装の場所:

| 何 | どこ |
|---|---|
| トークン（明・暗） | `src/styles/tokens.css`（`--pr-*` が正、旧名は別名） |
| サイドバー | `src/components/Sidebar.astro` + `src/styles/shell.css` |
| 同一文書内の遷移・テーマ・言語・時計 | `src/layouts/Site.astro`（`<ClientRouter />`、inline の prefs script）+ `src/scripts/site.js` |
| トップのグリッド／カテゴリ／all | `src/components/grid/{WorkGrid,GridCard}.astro` + `src/styles/grid.css`、`src/lib/site.mjs` の `gridEntries()` |
| default lens | `/lens/default/`（`src/pages/lens/[slug]/index.astro` が default も出す） |
| ケーススタディ冒頭のカード列 | `src/components/project/ProjectStrip.astro`（`src/pages/projects/[slug].astro` が直接 `<Site>` を描く） |

分担: シェルは Fable 5.1（このセッション）、グリッドと冒頭カードは Sonnet 5 のサブエージェント 2 体（worktree で並行、branch merge で合流）。

## 未検証（第 2 段）

- Vercel 上での動作は commit ごとに Ready を確認しているが、Preview の中身（同一文書内の遷移が Vercel の CDN 経由でも同じに動くか）はこの環境から開けない。本人が開いて、左のリストが消えないこと・時計が止まらないことを見る。
- ダークモードでの手書きページ 33 本（`theme: light` のもの）は KOJI FIZZ しか目視していない。`design-system.css` のトークンで描かれている部分は反転するが、色を直書きした箇所（例: 白背景の画像）は暗いまま残る。気になるページがあれば `theme: "light"` を lock にする案（`data-theme-lock="light"`）が最短。
