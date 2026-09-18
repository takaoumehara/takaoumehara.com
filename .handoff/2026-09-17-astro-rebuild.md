# Astro への全面移行 + サイドバー型レイアウト

> `.handoff/2026-09-16-adaptive-pitch-studio.md` の続き。あちらの Phase 2/3 の内容はそのまま有効。

## Resume Capsule

Project: takaoumehara.com
Handoff: `.handoff/2026-09-17-astro-rebuild.md`
Passphrase: 「サイドバーは動かない、右だけが変わる」／第 3 段は「行の合計はいつも 12」
Goal: 本人の決定「Astro で完全に作り直しちゃって」（2026-09-17）。参照は PORTO ROCHA —
  左に固定サイドバー（カテゴリ別の作品一覧）、右にページ本文。手書き HTML をやめる。
State: **第 3 段（ベントー）まで完了して push 済み。** ブランチ `claude/exciting-cerf-xgoyxb`、PR #19（draft）。
  `npm test`（astro build + node --test）138/138、`npm run test:e2e`（axe WCAG 2.2 AA・キーボード・
  言語スイッチ・サイドバー・Studio・/lens/preview）56/56。
  旧 `src/render/*`・`src/build.mjs`・生成 HTML・手書き HTML はすべて削除。
Next: **本人が Preview デプロイ（PR #19 の Vercel コメント）を見て「これで行く」を言う。** その後 draft を外してマージ。
  いちばん見てほしいのは第 3 段: トップのベントーが毎回変わるか、クリックで左のレールが入ってくるか、
  ベントーの 3 本（resona / ela-quests / value-frontier）が全幅で気持ちよく出ているか。
  マージ後に確認: (1) Vercel が Astro としてビルドしたか（`vercel.json` の `framework`）、
  (2) `/work/` → `/all/`、`/now.html` → `/now/` の転送（`public/` の静的ページ）、(3) `/studio/` の Publish が Lens JSON だけを commit するか。
  コード側の次: 残り 39 本のケーススタディを 1 本ずつベントーへ（`docs/bento-layout.md` の形に沿って）。
Read first: `docs/bento-layout.md`（ベントーの骨格と JSON の形）、`docs/astro-architecture.md`（設計と §7 の落とし穴）、
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

## 第 3 段: ベントー（同日、本人の指示 4 点）

本人の指示（原文の要点）:

1. スクロールバーがブラウザの一番右に 1 本だけ。左のリストに出るのは嬉しくない。
2. トップは名前と "I turn ambiguous ideas into …" をデカく、残りは大小のグリッド。
   元のインスピレーションより**さらにダイナミック**で、**毎回リロードするとシャッフル／大きさが変わる**と嬉しい。
   **クリックすると、この 2 つのリストとプロジェクトが見えるビューに変わっていく。**
3. PDP は hero graphic / motion がでかく、その下に概要。ほかの必要なテキストもベントーに入れる。
   ベントーは**ビューポートの幅を最大限**使う（Odell Education のようなマージンだらけをやめる）。
   2 / 3 / 4 分割、ほとんどは 100% か 2 分割。
4. まず resona（dark）/ amplify / value frontier の 3 本で形を固める。

本人に確認して決めたこと（`AskUserQuestion`）:

- **「amplify」= ELA Quests**（`src/data/projects/ela-quests.json`）。もう 1 件の Amplify（Vocabulary App）ではない。
- **トップにサイドバーは出さない。** 「2 つのリスト」＝ 左のレールと `/all/` の分野フィルタで、
  どちらも最初のクリックで現れる。

| 何 | どこ |
|---|---|
| ベントーの骨格（12 カラム・正方形の行ユニット・行単位の配置） | `src/styles/bento.css`、設計は `docs/bento-layout.md` |
| レイアウトの読み込みと検査（行が 12 を満たすか、画像が disk にあるか、embed に title があるか） | `src/lib/bento.mjs`（`getStaticPaths()` で走る＝ビルドが落ちる） |
| ケーススタディの描画 | `src/components/bento/{BentoPage,BentoCell}.astro` |
| ケーススタディの中身 | `src/bento/{resona,ela-quests,value-frontier}.json` |
| トップ（レールなし） | `src/pages/index.astro` + `src/components/landing/{Landing,LandingGrid}.astro` + `src/styles/landing.css` |
| 毎回変わる並び／大きさ | `src/lib/bentoShapes.mjs`（パターン表）。サーバーは `steadyPick()`、ブラウザは `Math.random()`。表は `define:vars` でインラインスクリプトに渡す（二重に書かない） |
| レールを消す口 | `Site.astro` の `chrome`（既定 true）。`.shell--bare`（`shell.css`） |
| レールが左から入ってくる遷移 | `::view-transition-new(side):only-child`（`shell.css`） |
| レールのスクロールバーを消す | `.side { scrollbar-width: none }` + `::-webkit-scrollbar`（`shell.css`） |

テスト: `npm test` 138/138、`npm run test:e2e` 56/56。
新しい `tests/bento.test.mjs` が、行が 12 を満たすこと・`<h1>` が 1 つ・`data-vt-hero` が 1 つ・
`cs-strip` があること・`design-system.css` を読んでいないこと・変換済み slug に手書き本文が残っていないこと、を見る。
`tests/home-grid.test.mjs` はランディング用に書き直した。a11y の PAGES にベントー 3 本を足した。

この環境で Playwright を回すときは `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:e2e`
（headless shell が入っていない。`npx playwright install` は禁止）。

### 残り（次に触る人へ）

- **ケーススタディ 42 本のうち 39 本は手書き本文のまま**（中央 1200px、`design-system.css`）。
  1 本ずつ `src/bento/<slug>.json` を足して `src/case-studies/<slug>.{html,css,json}` を消す。
  `tests/bento.test.mjs` が二重の出どころを落とすので、消し忘れは気づける。
- ベントーの本文の**日本語**。置き換え前のページが英語だけだった長文は英語のまま置いた
  （今までのページと同じ挙動）。見出し・ラベル・キャプションは `{en, jp}`。訳すなら別の変更で。
- 画像の切り取りはまだ `object-fit` 任せ。`fit: "contain"` / `focus` で個別に逃がしてあるが、
  本当に作り直したほうがいい素材（ELA Quests のスクリーンショット群）は残っている。
- Vercel 上での見え方は未確認（この環境から Preview を開けない）。本人が見る。

## 第 4 段: 迷子をなくす（2026-09-18、本人が Preview を触っての 8 点）

本人の指摘のうち **3 つは見た目ではなく実装のバグ**だった。

| 何 | どこ |
|---|---|
| ロゴブロック（`Takao Umehara` ＋ 梅原タカオ、全体が `/` へ） | `src/components/Sidebar.astro` の `.side-logo`、`profile.jpName` を追加 |
| カテゴリチップ列（`All work 45` ＋ 5 カテゴリ、押すとその群へ） | `Sidebar.astro` の `.side-chips`、ジャンプは `site.js` の `bindSidebar()` の委譲リスナー |
| 初回だけ 5 群を 90ms ずらして開く | `site.js` の `revealRailOnce()`、`localStorage "tu-rail-seen"` |
| 現在行の反転 | `shell.css` の `.side-item[aria-current="page"]` |
| 現在行への追従 | `site.js` の `revealCurrent()` / `scrollRailTo()` / `settleThenReveal()` |
| 人のページをカード行に | `Sidebar.astro` の `PAGES` ＋ `.side-item--page` / `.side-thumb--glyph` |
| 名前の下の肩書き | `Landing.astro` の `.landing-role`（`profile.tagline`。新しい文章ではない） |
| カテゴリ重複と件数 | `src/categories/{work,ai-products}.json`、`src/lib/archive.mjs`（導出に変更）、`src/validate.mjs` |
| ELA Quests の Contraption live link | `src/bento/ela-quests.json` |

### 直したバグ（次に触る人へ）

1. **追従とスクロール復元が打ち消し合っていた。** 追従は `bindSidebar()` の中で初回 1 回だけ走り、
   `astro:after-swap` が遷移前の位置を復元していた。今は `revealCurrent()` を `astro:page-load` から
   毎回呼び、復元は**現在行が変わらないときだけ**。
2. **Web フォントが後から届いてレールが 1.5 倍に伸びる**（3579 → 5387px）。最初のスクロール先が
   ずれるので `document.fonts.ready` で測り直す（`settleThenReveal()`）。
3. **出現アニメの `opacity` が axe の contrast 違反を起こす。** 半透明の行に乗った文字を拾う。
   断続的に 3〜7 本落ちていた原因がこれ。`transform` だけで動かす。
4. **`verizon-ai-workflow` が 2 カテゴリにいた** → レール 45 行／44 プロジェクト、`/all/` の分野合計が
   総数＋1。本籍は `ai-products`（`chapter: ai-ventures`）。`validateAll` が横断重複で落とすようにした。
5. **`/all/` のフィルタが手写しの slug 一覧だった** → カテゴリ JSON を直しても追従せず、
   AI Products が `/all/` 6・レール 5。`src/categories/*.json` から導出に変更。差だった `breakbias` は
   どのカテゴリにも入っていなかったので `ai-products.json` に入れた。

テスト: `npm test` 144/144、`npm run test:e2e` 58/58。
新規 `tests/rail-wayfinding.test.mjs` が「1 作品 1 カテゴリ」「レールに同じカードが 2 回出ない」
「チップの合計＝総数」「`/all/` の分野合計＝総数」「`/` を指すのはロゴだけ」を見る。
`tests/a11y.spec.mjs` に「クリックすると現在行が視界に入って反転する」「チップがキーボードで効く」を追加。

## 第 5 段（2026-09-18）— 人のページ 5 枚を同じ型に乗せる

指摘の 8 点目:「About / Now / Writing / Workshops / Work with me、なんかこれそれぞれフォーマットが
違いますよね……全部フォーマット一つの本を作って流し込む、と理解してるんですけど違いますか?」

**答え: まだやっていなかった、が正解。** 7 枚とも `FragmentPage.astro` の素通しで、旧サイトの手書き HTML と
ページ固有 CSS を丸ごと抱えていた。`--col` が 1200 / 1140 / 1120、本文開始の上余白が 48〜110px、
H1 のウェイトが 700 / 800（サイトは 400 一択）。`about.css` と `contact.css` は Outfit の `@font-face` を
design-system.css と二重に宣言していた。

### 見た目より重かったバグ

`public/assets/design-system.css` は `html[data-theme="light"]`（0-1-1）で `--bg` / `--ink` を定義するが、
`html[data-theme="dark"]` では **`--nav-*` しか定義していない**。fragment 側は `:root`（0-1-0）に
`--bg: #f3f2ee` を書く。だから明モードでは design-system が勝ち（各ページの紙色は死んでいた）、
暗モードでは暗いブロックが無いので fragment の明るい `:root` が源順で勝つ。つまり
**About / Writing / Workshops / Work with me はダークモードのスイッチを無視していた。**
ページ固有 CSS と design-system.css を外したので、これは副作用として消えた。

| 何 | どこ |
|---|---|
| 人のページの通り道（`stylesheets` 無し・`fonts` 上書き無し） | `src/components/BentoDoc.astro` |
| 散文のページ用の `kind: "statement"` ヒーロー（それが `<h1>`）、`title` 帯を任意に | `src/lib/bento.mjs`、`src/components/bento/BentoPage.astro` |
| 人のページのレイアウト（別 glob なので slug 衝突しない） | `src/bento/pages/{about,publications,workshop,contact}.json` |
| `/work-with-me.html` は contact と同じレイアウト＋`/try/` の 1 行だけ | `src/pages/work-with-me.astro` |
| `/now/` は `src/data/now.json` から行を切り出す（3 枚ずつ） | `src/pages/now/index.astro`（`NowPage.astro` は削除） |
| 絞り込みバー＝`kind: "filters"` のセル。隠れたセルはグリッドから抜け、`row dense` が詰め直す | `BentoCell.astro`、`bento.css` の `.bento-filters` |
| 全幅セルの中だけ本文を 68ch に | `src/styles/bento.css` |

削除: `src/fragments/{about,publications,workshop,contact,work-with-me}.{html,css,json}` 15 本、
`src/components/now/NowPage.astro`、`site.css` の `.now-*` 220 行。

### 移すときに踏んだこと

- **`t()` / `tb()` は EN / JP の両側を `esc()` に通す。** レイアウト JSON に `<em>` / `<strong>` を
  書くと画面にそのまま出る。手書きページの強調タグは落とした（言葉はそのまま）。
- **セルの幅は {3, 4, 6, 12} だけ。** 1100px 以下でグリッドが 6 列に落ちるので 5 / 7 / 8 は軌道からはみ出す。
- 全幅（w12）のリード行は `h: 1` でちょうど。`h: 2` だと本文の倍の高さの空白になる。

テスト: `npm test` 155/155、`npm run test:e2e` 68 passed / 2 skipped。
新規 `tests/bento-pages.test.mjs`（12 列・幅の集合・statement ヒーローが唯一の `<h1>`・
design-system.css を読まない・`:root` / `@font-face` / `--col` を持たない・inline HTML が無い・
fragment が残っていない）。`tests/a11y.spec.mjs` に「5 枚とも暗くなる」と
「5 枚とも `<h1>` の位置・字詰め・ウェイトが同じ」を追加。
`tests/strategic-refinement.test.mjs` の「紙色を `:root` に持て」という検査は**目的と逆**だったので、
「ページ固有の `:root` を持たない」に置き換えた。

### 残り

- ⚠️ **`breakbias.html` はダークモードを無視したまま。** 人のページではないので PR-B では触っていない
  （方法論のページ。`intentfirst.html` は design-system のトークンに乗っているので正しく反転する）。
- ページの統合はしていない。本人が「型を揃える／ページ数も減らす」で**前者**を選んだため
  （参考: contact ≒ work-with-me、breakbias ⊂ workshop なので、やるなら 7 → 4 枚にできる）。
- ベントー本文の日本語化（規模は第 3 段の節に記載）。
- 残り 39 本のケーススタディのベントー化。
