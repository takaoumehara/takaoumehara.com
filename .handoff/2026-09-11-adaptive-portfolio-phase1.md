# Adaptive Career Portfolio — Phase 1 shipped, PR open

## Resume Capsule

Project: takaoumehara.com
Handoff: `.handoff/2026-09-11-adaptive-portfolio-phase1.md`
Passphrase: 「一人の梅原、ひとつの証拠、複数のレンズ」
Goal: サイトを adaptive career narrative system に作り替える。Phase 1 =
  構造化された Career Evidence Library から `/` と `/lens/<slug>` を生成する仕組み。
State: **Phase 1 実装 + 日本語の全面書き直し + レイアウト統一まで完了・push 済み。**
  Draft PR #15 open、テスト **49/49 通過**、マージ競合なし、レビューコメント 0。
  ブランチ `claude/stoic-pasteur-zhusuy`、HEAD `d3141e9`。
Next: **本人の判断待ちが 2 つ**（下記「本人が決めること」と「未決」）。
  コードとして着手待ちのものは無い。
Read first: `docs/adaptive-portfolio-architecture.md`, `src/schema.d.ts`, `src/validate.mjs`
Running: このセッションは PR #15 を subscribe 中。1 時間ごとの self check-in を
  `send_later` で再武装している（trigger は毎回 ID が変わる。PR が merge/close
  されるまで継続）。ローカルの http.server は停止済み。

## docs/

| File | Status | Last updated | Open questions |
|---|---|---|---|
| superforge.md | agreed | 2026-09-11 | — **会話=日本語 / ファイル=日本語**。pin: 推測数値を書かない・カテゴリ名（AI Products / Playable）・Agentic UX は能力/thesis ラベルとしては可 |
| adaptive-portfolio-architecture.md | agreed（§12 に実装状況） | 2026-09-11 | 5 件、本人確認待ち（下記「本人が決めること」） |
| japanese-voice.md | agreed | 2026-09-11 | — 日本語の基準。テストが強制する |
| gemini-studio-salvage-review.md | agreed | 2026-09-11 | §5 の「2 実装のどちらを畳むか」が未決 |
| portfolio-ia.md | agreed | 2026-08-12 | Innovation Workshop は証拠写真が入るまで 6 番目のカテゴリにしない |
| landing-design.md | **superseded** | 2026-08-09 | 対象だった `index.html` は生成物になった。旧版は `index-console.html` |
| landing-hero.md | **superseded** | 2026-08-10 | 同上 |
| portfolio-template-system.md | agreed | 2026-08-12 | 既存ケーススタディ 30 ページ用。lens とは別系統 |
| case-study-format-audit.md | draft | 2026-08-06 | 8章フォーマットとのギャップ未解消 |
| portfolio-content-intake-prompt.md | agreed | 2026-08-12 | 各案件の AI セッションに貼る用 |
| portfolio-interactive-content.md | agreed | 2026-09-06 | Interactive 5 件の素材所在 |
| portfolio-generative-upgrade.md | draft | 2026-08-06 | 描画技術の方向づけ。未実装 |
| brief.md | — | — | **存在しない**（intake 未実施） |
| verification.md | — | — | **未実施**。ただし Chromium 実測は PR #15 に記録（1440/390px 横スクロール 0、JS エラー 0） |
| security.md | — | — | **未実施**（静的サイト・秘密情報なし） |
| ship-readiness.md | — | — | **未実施** |
| a11y / accessibility.md | — | — | **未実施**。lens ページは未監査。`codex` ブランチに Playwright+axe の実装あり（回収候補） |
| failforward.md | — | — | **存在しない**（0 件） |

## 本人が決めること（コードではなくデータ）

1. `src/data/roles.json` に在籍年が無い（about.html に年が無いため推測しなかった）
2. `executive-partnership` は moderate の証拠しか無い。テストが明示的に名指ししている
3. AgentReady Local はサイトに事実が無いため未登録
4. `projects/koji-fizz.html` の "produce and direct" 表記 vs データの producer / creative partner
5. MyBrainSpec・Moime の thesis / question は `_notes` に「要確認」と記載

## 未決（コードではなく判断）

1. **カテゴリページ（interactive / ai-products / brand）を新方針で残すか。**
   今回は「存在を前提に揃える」だけ実施。幅・列数・サムネイル比率は統一済み。
   残す/畳むの判断はまだ。
2. **`codex/monumental-editorial-redesign` をどうするか。**
   同じ問題を解く競合実装。`docs/gemini-studio-salvage-review.md` §5 が比較表。
   結論は「そちらを畳む。ただし JD 解析の実装経験と Playwright+axe テストは回収する」。
3. Preview で `/`・`/lens/creative`・`/lens/ai-product` を目視確認 → PR #15 のマージ判断。

## 完了済み（このセッション）

- Gemini/Codex 製 Lens Studio のサルベージレビュー → `docs/gemini-studio-salvage-review.md`
- 日本語の全面書き直し。**読者が見る文字列の英語残り 216 → 0**。基準は `docs/japanese-voice.md`
- レイアウト統一。全 6 ページで 1440px のグリッド左端 152px、390px で 20px、横スクロール 0
- 見つけて直したバグ 4 件（Claim Guard の数字抽出・検査範囲、CSS 詳細度で言語切替が負ける、
  カード見出しが日本語タイトルを使わない）。すべてテスト化

## Phase 2 の置き場

JD → 解析 → Lens 草案は `src/analyze/` に閉じて乗る。Phase 1 のファイルは触らない。

## Files to read first

- `docs/adaptive-portfolio-architecture.md` — 全体設計・ワイヤーフレーム・§12 実装状況
- `src/schema.d.ts` — Evidence / Lens の型と、なぜその形なのか
- `src/validate.mjs` — Claim Guard / NotMine Guard（「Lens は経験を発明できない」の実体）
- `tests/lens-system.test.mjs` — 成功基準の実行可能な形
- `README.md` — 編集手順（`node src/build.mjs` → commit）
