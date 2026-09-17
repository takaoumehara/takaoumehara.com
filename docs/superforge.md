# superforge — project settings

> Written by: superforge · Last updated: 2026-09-17

## Language
会話: 日本語
docs/ のファイル: 日本語（既存の `docs/portfolio-*.md` に合わせる）

## Pinned by the user
- ケーススタディの内容仕様は「AI時代のデザイナー向け ケーススタディ構成・記述指針」
  （8章構成）を正とする。ページ仕様（`docs/portfolio-template-system.md`）は
  この8章を満たす手段であって、8章を上書きしない。
- 推測数値・未使用のツール名を書かない。書けないものは「不明・要確認」と明記する。
- **カテゴリ名**（2026-08-06）:
  - `Agentic UX` → **`AI Products`** に変更（本人判断。AIエージェント以外のプロダクトも
    含む枠に "Agentic" は語弊があるため）。職種名としての "Agentic UX" は
    `verizon-ai-agents.html` の役職表記にのみ残す。
  - `Interactive Experience` → **`Playable`**（傘）＋ 2つのサブグループに変更。
    **これは回答が得られなかったため置いた既定値** — 覆す場合は `index.html` の
    `.play-section` と `ai-products.html` の `#playable` の両方を直す。
    - `Shared Screen` / みんなの画面 … 複数人・複数端末・ひとつの大画面
    - `Motion & Feel` / 動きと手ざわり … 一人で開いて感覚を確かめるもの
    - 「インタラクティブ」だけでは、ボタンを押すことも該当してしまう。傘の名前に加えて
      **定義文をページ本文に書いている**（入力が声・手・線・その場の全端末であること）。
      名前だけで誤解を消そうとせず、名前＋1文で消す方針。
- **Adaptive portfolio**（2026-09-11、2026-09-17 更新）: ページはすべて Astro が
  `src/data` / `src/lenses` / `src/categories` から描画する。**生成 HTML は commit しない**
  （Vercel がビルドする）。手で HTML を書かない。データ設計は
  `docs/adaptive-portfolio-architecture.md`、サイトの作りは `docs/astro-architecture.md`。
  - 「Agentic UX」は **能力タクソノミーと thesis のラベルとしては使用可**（本人のブリーフに明記）。
    カテゴリ名としては引き続き `AI Products`。
  - 旧ホームページは `index-console.html` として保存。
- **日本語の書き方**（2026-09-11）: 基準は `docs/japanese-voice.md`。
  - `Localized` は原則 `{en, jp}` で書く。素の文字列は「英語が日本語ページに出る」と同義。
    `tests/lens-system.test.mjs` がこれを検査して落とす。
  - 能力の **label は英語のまま**（0→1 / UX / AI は用語として通用する）。**note は必ず日本語**。
  - カタカナ音写（ベンチャービルディング／エグゼクティブアドバイザリー／ソリューション 等）は
    テストで禁止。`docs/japanese-voice.md` §3.2 の右側を使う。
- **Astro + サイドバー**（2026-09-17、本人決定「Astro で完全に作り直しちゃって」）:
  左に固定サイドバー（カテゴリ別の作品一覧。当初は現在地のカテゴリだけ展開、同日の改訂で全展開に変更 — 下の「サイドバー」を見る）、右にページ本文。
  `src/layouts/Site.astro` が唯一のシェル。参照は PORTO ROCHA、判断は
  `docs/sidebar-layout-proposal.md`（Q1 (a) / Q2 (a) / Q3 (a) を既定値で採用）。
  ケーススタディの本文は `src/case-studies/<slug>.html` の断片（中身は旧ページのまま）。
  MDX への書き換えは 1 件ずつ、次の PR から。
  - **URL は原則そのまま。例外 2 つ**: Work Archive は `/work/` → **`/all/`**、`now.html` は廃止して
    `/now/` へ（どちらも `public/` の静的リダイレクトページで転送）。Astro が `work.html` と `work/` を同じ経路とみなすため。
  - `vercel.json` の `framework: "astro"` / `installCommand` / `buildCommand` は Vercel の画面設定より優先される。消さない。
  - テストはビルド出力（`.vercel/output/static`）を読む。`npm test` がビルドしてから走る。
- **レイアウト**（2026-09-11、2026-09-17 読み替え）: 本文の列は **1200px** 一択（`--col`）
  — ただしサイドバーの右カラムの中での最大幅。左右は `clamp(20px, 3vw, 32px)`。
  グリッドは 2 種類だけ — **説明文つきカード = 3 列 / 名前と 1 行のタイル = 4 列**。
  サムネイルは **3:2**（先頭の大カードのみ 16:8.5）。列数は個別指定ではなくこの規則で決める。
  - 追記（2026-09-12）: `size: "feature"` = **全幅 1 枚・21:9**。1 ページに 1 枚までの
    「いちばん大きい主張」で、写真がないカードは中央に大きな字を置く扉絵として扱う。
    どれを feature にするかは lens が決める（`src/lenses/*.json`）。記録側は関与しない。
- **ページ遷移**（2026-09-12）: 詳細は `docs/page-transitions.md`。
  カードのサムネイルが詳細ページのヒーローへ育つ（Cross-document View Transitions）。
  受け側のページは `<head>` に所定の `<style>` ブロックを持ち、ヒーロー要素に
  **`data-vt-hero` をちょうど 1 つ**付ける。**クラス名で指定しない** — 同じクラスが
  複数一致すると、ブラウザは片方を選ばず遷移ごと捨てる（実際に 1 ページで起きていた）。
  `tests/page-transitions.test.mjs` が両側の存在と個数を検査する。
- **カテゴリページ**（2026-09-12）: `interactive.html` 等の**カテゴリページは索引として残す**。
  `/` と `/lens/<slug>` が主張、カテゴリページが全件。ただし
  **事実がカテゴリページにしか存在してはならない** — 先に `src/data/` に入れる。
  詳細は `docs/adaptive-portfolio-architecture.md` §14.1。
- **`codex/monumental-editorial-redesign`**（2026-09-12）: **畳む。**
  Playwright + axe は回収して新規執筆、JD 解析は設計原則だけ Phase 2 へ。§14.2。
- **Emoji Blast**（2026-09-12、本人）: 旧称 **EmojiDrop** から改名。
  `src/data/experiments/emoji-blast.json`。旧ホームページの保存版 `index-console.html` は
  スナップショットなので旧名のまま。
- **カードのプレビュー動画**（2026-09-12）: 静止画（`assets.thumb`）が主、
  `assets.preview` の H.264 MP4 はホバー／フォーカスで重ねて再生するだけ。
  自動再生しない・`preload="none"`・`aria-hidden`・`prefers-reduced-motion` で無効。
  素材のマスターは `assets/<slug>/masters/`（`.vercelignore` で配信対象外）。
- **アクセシビリティ**（2026-09-12）: 基準は WCAG 2.2 AA。`npm run test:e2e` が強制する。
  - `--ink-dim` = `#76716a`（4.64:1）が**最も薄い文字色**。これより薄い色を文字に使わない。
  - **不透明度で文字を沈めない。** 静けさはインクの段（`ink → ink-mid → ink-dim`）で表す。
  - 言語スイッチは `<html lang>` も `ja` / `en` に切り替える。
  - `display` を指定する**子孫** `span` セレクタは `.t-en` / `.t-jp` に届く。`> span` を使う。
  - タップ目標は 24px（WCAG 2.2 §2.5.8）。
- **Adaptive Pitch Engine**（2026-09-16、Phase 2）: 求人票 → `scripts/generate-pitch.mjs` →
  `src/lenses/<slug>.json`（draft）＋ `src/pitches/<slug>/report.md`。**LLM は呼ばない**（語彙表と規則）。
  生成器は事実文を書かない。"Direct" は上位 5 能力のうち 2 つ以上に strong があるときだけ。
  記録の空欄は `scripts/audit-evidence.mjs` → `docs/evidence-gaps.md`。**無い数字は無いまま**
  （`outcome.status: "unknown"`）。設計は `docs/adaptive-portfolio-architecture.md` §16。
  draft は build されない。見るなら `npm run dev` → `/lens/<slug>/`。
- **見た目は PORTO ROCHA**（2026-09-17、本人「見た目を original に近づけて」）: トークンは
  `docs/design/porto-rocha/`（本人が添付した tokens.json / DESIGN.md）を正とし、`src/styles/tokens.css` に写す。
  - 色は **黒・グレー・白 + System Blue（#007aff、リンクと現在地だけ）**。カードは枠線でも影でもなく
    **薄いグレーの塗り（`--pr-card`）** で区切る。角丸 8px。装飾なし（紙のグレインは廃止）。
  - 書体は **SF Pro（Apple）→ Inter → system-ui**、**ウェイトは 400 だけ**。階層はサイズと色で作る。
    本文 14px / 補足 13px グレー / 見出し 23px（+0.02em）。日本語は Hiragino Sans → Noto Sans JP。
  - グレーの文字色は `#808080` ではなく **`#666666`**（白地で 5.7:1、現在行のグレー `#e9e9e9` 上で 4.8:1）、青い文字は `#007aff` ではなく **`#0062cc`**（5.3:1）。
    a11y の pin「4.5:1 未満の文字色を使わない」を優先。`#007aff` そのものは文字を持たない塗り（トグルのトラック）にだけ使う（`--pr-blue-fill`）。
  - **ダークモード**あり（サイドバーのスイッチ、`localStorage "tu-theme"`、`html[data-theme]`）。
    `theme: "dark"` のケーススタディ（Interactive の 8 本）は `data-theme-lock` で常に暗く、スイッチは無効表示。
- **サイドバー**（2026-09-17 改訂）: 幅 `clamp(320px, 25vw, 420px)`。上から
  「Show all projects」ピル（→ `/all/`）＋ダークモードのトグル＋言語ボタン（JP/EN を交互に）、
  ワードマーク（大文字・23px）＋ニューヨーク時刻の時計、About カード（`positioning[1]` と
  Now / Writing / Workshops / Work with me / Studio のリンク行）、カテゴリごとの作品行
  （グレーのカード・64px サムネ・14px 名前・13px グレー 1 行・行間 8px、**全カテゴリ展開**、折りたたみ可）。
  About は独立リンクではなくカードのラベルがリンク。
- **ページ遷移は同一文書内**（2026-09-17）: Astro の `<ClientRouter />` で右カラムだけ差し替え、
  `<aside class="side">` は `transition:persist` で残す（スクロール位置・折りたたみ・時計が消えない）。
  `src/scripts/site.js` は `astro:page-load` で毎回初期化し直し、`astro:after-swap` で言語クラスと
  テーマ属性を戻す（ルーターは `<html>` の属性を新ページのもので置き換えるため）。
  カードの `data-href` は `navigate()` 経由。**`window.location` で遷移しない。**
  ケーススタディ本文の inline `<script>` は遷移後も実行される（werewolf のデッキで確認済み）。
- **トップページ**（2026-09-17）: 画像グリッド **3 列 → 1100px 以下 2 列 → 640px 以下 1 列**。
  見出しは `positioning[1]`（"I turn ambiguous ideas into …"）。default lens は `/lens/default/` に移動。
  カテゴリページと `/all/` も同じカード部品。「説明文つき 3 列 / タイル 4 列」の旧規則はこれで置き換え。
- **ケーススタディの冒頭**（2026-09-17）: 本文の前に `narrative.problem` / `narrative.built` /
  `narrative.impact` から **The challenge / The solution / Impact** のグレーカード列を出す
  （`src/components/project/ProjectStrip.astro`）。データに無いものは出さない。文章は書き足さない。
