# Adaptive Career Portfolio — Phase 1 + Interactive のメディア + a11y

> `.handoff/2026-09-11-*` と、同じ日付の旧版を置き換える。古い方は読まなくてよい。

## Resume Capsule

Project: takaoumehara.com
Handoff: `.handoff/2026-09-12-adaptive-portfolio-phase1.md`
Passphrase: 「一人の梅原、ひとつの証拠、複数のレンズ」
Goal: サイトを adaptive career narrative system に作り替える。Phase 1 =
  構造化された Career Evidence Library から `/` と `/lens/<slug>` を生成する仕組み。
State: **Phase 1 + 日本語書き直し + レイアウト統一 + Interactive のメディア +
  Phase 1.5（a11y）まで完了・push 済み。** Draft PR #15 open、HEAD `87ad13c`。
  テスト **52/52**（`npm test`）＋ **26/26**（`npm run test:e2e`、1440/390px）。
  `origin/main` はマージ済みで競合なし。レビューコメント 0。作業ツリー clean。
Next: **本人の目視確認と、データの空欄 5 件のみ。** コードとして着手待ちのものは無い。
  再開時は先に PR #15 の状態を確認すること。
Read first: `docs/adaptive-portfolio-architecture.md`（§14 決定・§15 a11y）、
  `docs/accessibility.md`、`docs/japanese-voice.md`、`src/schema.d.ts`、`src/validate.mjs`
Running: プロセスは無し。このセッションは PR #15 を subscribe 中。

## 2026-09-12 に決まったこと・やったこと

### 決定（本人: 「基本的にクロードが作った方法を採用」）

1. **カテゴリページは残す。** `/` と `/lens/<slug>` が主張、カテゴリページが全件の索引。
   歯止めは 1 行 — **事実がカテゴリページにしか存在してはならない**（先に `src/data/`）。
   → `docs/adaptive-portfolio-architecture.md` §14.1
2. **`codex/monumental-editorial-redesign` は畳む。** 紐づく PR は無いので閉じるものも無い。
   **ブランチの削除はしていない**（本人の判断用に残置）。回収は完了 — Playwright + axe は
   実施済み、JD 解析は設計原則として記録済み。→ §14.2

### Interactive のメディア（本人が `main` の `33f5c2f` に 12 本アップロード）

- 5 件が CSS のアートワークから**実物の画面**に。`assets/<slug>/` に
  `thumb.jpg`（3:2）/ `still.jpg`（16:9）/ `preview.webm` + `preview.mp4`。
  マスターは `assets/<slug>/masters/`（`.vercelignore` で配信対象外）
- 動画はホバー／フォーカスでのみ再生。`preload="none"`・`aria-hidden`・
  `prefers-reduced-motion` で無効。**読み込み時は 1 本も取りに行かない**（実測）
- **MP4 単独は不可**（オープンソース版 Chromium に H.264 が無い、実測）。WebM を先に置く
- **EmojiDrop → Emoji Blast**（本人）。収録の URL バーから `emojiblast.vercel.app` を
  `links.live` に入れ `status: live` に。日本語が「2 人対戦」だったのを協力プレイに訂正

### Phase 1.5 — a11y（`docs/accessibility.md`）

初回走行で欠陥 4 件。すべて修正済み:

| 欠陥 | 対処 |
|---|---|
| `--ink-dim` が 4.44:1（AA 未達） | `#76716a`（4.64:1）へ。55 ファイル一括 |
| 言語切替が `<html lang>` を変えない | 54 ファイルの `setLang` で属性も切替 |
| `.idx-meta-col a` が 17.5px（§2.5.8 未達） | メタ行全体を 24px リズムに |
| lens の静かなセルが `opacity: .55` で 2.09:1 | 不透明度をやめ**インクの段**で表現 |

## 本人が決めること（コードではなくデータ）

1. `src/data/roles.json` に在籍年が無い（about.html に年が無いため推測しなかった）
2. `executive-partnership` は moderate の証拠しか無い。テストが明示的に名指ししている
3. AgentReady Local はサイトに事実が無いため未登録
4. `projects/koji-fizz.html` の "produce and direct" 表記 vs データの producer / creative partner
5. MyBrainSpec・Moime の thesis / question は `_notes` に「要確認」と記載
6. **`emojiblast.vercel.app` が実際に開くか**（ビルド環境から外向き通信が塞がれていて未確認）

## 目視で見てほしいもの

Vercel プレビューで `/`・`/lens/creative`・`/lens/ai-product`・`/interactive.html`。
とくに **Interactive のカードにホバーしたときの動き**と、lens の Career Arc の
「静かなセル」の見え方（不透明度から色に変えた箇所）。

## まだ手を付けていない

| 項目 | 状態 |
|---|---|
| `projects/*.html` 35 ページの axe 走査 | 未実施（色と lang の修正自体は届いている） |
| 実機スクリーンリーダー・400% リフロー・forced-colors | 未実施 |
| カテゴリページの生成化 | Phase 3。今はやらない |
| JD 解析 | Phase 2。`src/analyze/` に閉じて乗る。Phase 1 のファイルは触らない |
| `index-console.html` 等の旧版スナップショット | 対象外。Emoji Blast の旧名もそのまま |
| `failforward.md` | 未作成。今回直した欠陥は PR #15 とテストにのみ記録 |

## Files to read first

- `docs/adaptive-portfolio-architecture.md` — 設計・§12 実装状況・§14 決定・§15 a11y
- `docs/accessibility.md` — 測ったことと、測っていないこと
- `docs/japanese-voice.md` — 日本語の基準（テストが強制する）
- `src/schema.d.ts` / `src/validate.mjs` — 型と Claim Guard / NotMine Guard
- `tests/lens-system.test.mjs` / `tests/a11y.spec.mjs` — 成功基準の実行可能な形
- `README.md` — 編集手順（`node src/build.mjs` → commit）
