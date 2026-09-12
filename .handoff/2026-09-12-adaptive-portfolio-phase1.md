# Adaptive Career Portfolio — Phase 1 出荷済み、PR #15 レビュー待ち

> これは `.handoff/2026-09-11-adaptive-portfolio-phase1.md` の更新版。古い方は読まなくてよい。

## Resume Capsule

Project: takaoumehara.com
Handoff: `.handoff/2026-09-12-adaptive-portfolio-phase1.md`
Passphrase: 「一人の梅原、ひとつの証拠、複数のレンズ」
Goal: サイトを adaptive career narrative system に作り替える。Phase 1 =
  構造化された Career Evidence Library から `/` と `/lens/<slug>` を生成する仕組み。
State: **Phase 1 実装 + 日本語の全面書き直し + レイアウト統一まで完了・push 済み。**
  Draft PR #15 open。HEAD `da30854`、Vercel `success`、テスト **49/49 通過**（本日再実行）、
  `origin/main` は HEAD の祖先（マージ競合なし）、レビューコメント 0、作業ツリー clean。
Next: **本人の判断待ちが 2 つ**（「未決」参照）。コードとして着手待ちのものは無い。
  再開時は先に PR #15 の状態を確認すること（人がレビューした可能性がある）。
Read first: `docs/adaptive-portfolio-architecture.md`, `docs/japanese-voice.md`,
  `src/schema.d.ts`, `src/validate.mjs`
Running: プロセスは無し（ローカル http.server は停止済み、ポート開放なし）。
  このセッションは PR #15 を subscribe 中。1 時間ごとの self check-in を `send_later` で
  再武装している（trigger ID は毎回変わる。直近 `trig_01Q7qL5RXsarQNLQtS8jiKua`、
  08:21 UTC 発火予定）。PR が merge/close されるまで継続。

## docs/

| File | Status | Last updated | Open questions |
|---|---|---|---|
| superforge.md | agreed | ヘッダは 2026-08-02（**古い** — 本文の pin は 2026-09-11 まで更新済み） | — **会話＝日本語 / docs＝日本語**。pin: 推測数値を書かない・カテゴリ名（AI Products / Playable）・Agentic UX は能力/thesis ラベルとしては可・日本語の書き方・レイアウト規則 |
| adaptive-portfolio-architecture.md | agreed（§12 実装状況、§13 日本語とレイアウト） | 2026-09-11 | 本人確認 5 件（下記「本人が決めること」） |
| japanese-voice.md | agreed | 2026-09-11 | — テストが強制する |
| gemini-studio-salvage-review.md | agreed | 2026-09-11 | §5「2 実装のどちらを畳むか」が未決 |
| portfolio-ia.md | agreed | 2026-08-12 | Innovation Workshop は証拠写真が入るまで 6 番目のカテゴリにしない |
| portfolio-content-intake-prompt.md | agreed（v3） | 2026-08-12 | 各案件の AI セッションに貼る用 |
| portfolio-template-system.md | agreed | 2026-08-01 | 既存ケーススタディ 30 ページ用。lens とは別系統 |
| portfolio-interactive-content.md | agreed | 2026-09-06 | Interactive 5 件の素材所在 |
| case-study-format-audit.md | draft | 2026-08-02 | 8 章フォーマットとのギャップ未解消 |
| portfolio-generative-upgrade.md | draft | 2026-08-06 | 描画技術の方向づけ。未実装 |
| landing-design.md | **superseded** | 2026-08-09 | 対象だった `index.html` は生成物になった。旧版は `index-console.html` |
| landing-hero.md | **superseded** | 2026-08-10 | 同上 |
| brief.md | — | — | **存在しない**（intake 未実施） |
| verification.md | — | — | **未実施**。ただし Chromium 実測は PR #15 に記録（1440/390px 横スクロール 0、JS エラー 0） |
| a11y / accessibility.md | — | — | **未実施**。lens ページ未監査。`codex` ブランチに Playwright+axe の実装あり（回収候補） |
| security.md | — | — | **未実施**（静的サイト・秘密情報なし） |
| ship-readiness.md | — | — | **未実施** |
| failforward.md | — | — | **存在しない（0 件）**。このセッションで直したバグ 4 件は PR #15 の本文とテストにのみ記録 |
| docs/superpowers/ | — | 2026-07 | 旧 plans/specs のアーカイブ。現行の設計には効いていない |

## 本人が決めること（コードではなくデータ）

1. `src/data/roles.json` に在籍年が無い（about.html に年が無いため推測しなかった）
2. `executive-partnership` は moderate の証拠しか無い。テストが明示的に名指ししている
3. AgentReady Local はサイトに事実が無いため未登録
4. `projects/koji-fizz.html` の "produce and direct" 表記 vs データの producer / creative partner
5. MyBrainSpec・Moime の thesis / question は `_notes` に「要確認」と記載

## 未決（コードではなく判断）

1. **カテゴリページ（interactive / ai-products / brand）を新方針で残すか。**
   今回は「存在を前提に揃える」だけ実施。幅・列数・サムネイル比率は統一済み。
2. **`codex/monumental-editorial-redesign` をどうするか。**
   `docs/gemini-studio-salvage-review.md` §5 の結論は「畳む。ただし JD 解析の実装経験と
   Playwright+axe テストは回収する」。
3. Preview で `/`・`/lens/creative`・`/lens/ai-product` を目視 → PR #15 のマージ判断。

## Phase 2 の置き場

JD → 解析 → Lens 草案は `src/analyze/` に閉じて乗る。Phase 1 のファイルは触らない。

## Files to read first

- `docs/adaptive-portfolio-architecture.md` — 設計・ワイヤーフレーム・§12 実装状況
- `docs/japanese-voice.md` — 日本語の基準（テストが強制する）
- `src/schema.d.ts` — Evidence / Lens の型と、なぜその形なのか
- `src/validate.mjs` — Claim Guard / NotMine Guard
- `tests/lens-system.test.mjs` — 成功基準の実行可能な形
- `README.md` — 編集手順（`node src/build.mjs` → commit）
