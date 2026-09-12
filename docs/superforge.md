# superforge — project settings

> Written by: superforge · Last updated: 2026-08-02

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
- **Adaptive portfolio**（2026-09-11）: `index.html` と `lens/*/index.html` は生成物。
  手で編集せず `src/data` / `src/lenses` を直して `node src/build.mjs`。
  設計は `docs/adaptive-portfolio-architecture.md`。
  - 「Agentic UX」は **能力タクソノミーと thesis のラベルとしては使用可**（本人のブリーフに明記）。
    カテゴリ名としては引き続き `AI Products`。
  - 旧ホームページは `index-console.html` として保存。
- **日本語の書き方**（2026-09-11）: 基準は `docs/japanese-voice.md`。
  - `Localized` は原則 `{en, jp}` で書く。素の文字列は「英語が日本語ページに出る」と同義。
    `tests/lens-system.test.mjs` がこれを検査して落とす。
  - 能力の **label は英語のまま**（0→1 / UX / AI は用語として通用する）。**note は必ず日本語**。
  - カタカナ音写（ベンチャービルディング／エグゼクティブアドバイザリー／ソリューション 等）は
    テストで禁止。`docs/japanese-voice.md` §3.2 の右側を使う。
- **レイアウト**（2026-09-11）: 本文の列は **1200px** 一択（`--col`）。左右は `clamp(20px, 3vw, 32px)`。
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
