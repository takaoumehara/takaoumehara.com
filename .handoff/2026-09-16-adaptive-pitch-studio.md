# Adaptive Pitch Engine + Studio — Phase 2 / 3a / 3b / 3c

> `.handoff/2026-09-16-adaptive-pitch-phase2.md` を置き換える。古い方は読まなくてよい。

## Resume Capsule

Project: takaoumehara.com
Handoff: `.handoff/2026-09-16-adaptive-pitch-studio.md`
Passphrase: 「Direct は与えるものではなく、稼ぐもの」
Goal: 求人票を読んで、証拠ライブラリから見せるべき実績を選び、採用側に「何をしたか」で答える
  ページを作る。LLM を呼ばず、規則と語彙表だけで。最終的には他人にも配る。
State: **Phase 2（JD→Lens 下書き）・3a（Fit Ledger）・3b（Studio ＋ GitHub 公開）・
  3c（公開デモ `/try/`）実装済み・push 済み。3d（配布）は §16.9 に計画だけ、未着手。**
  ブランチ `claude/peaceful-rubin-j7wsvg`、PR #17（draft）、HEAD `d0b21d4`、作業ツリー clean。
  `npm test` **118/118**。Chromium: Studio と `/try/` 各 1 件通過。
  `npm run test:e2e` の axe は**既存の欠陥 2 種で落ちる**（`.nav-logo-tag` のコントラスト、
  contact.html の `.fit-badge`。どちらも main にもある。この PR で増やしていない）。
Next: **本人の 3 手順。① GitHub OAuth App を作る（GitHub App ではない。§16.7）
  ② Vercel に環境変数 4 つ ③ PR #17 をマージ → `/studio/` で 1 回 Publish して `/lens/<slug>` を確認。**
  コード側で次に着手するのは 3d（§16.9）。その前に `docs/evidence-gaps.md` の空欄を埋めると台帳が強くなる。
Read first: `docs/adaptive-portfolio-architecture.md` §16（とくに 16.6 台帳・16.7 Studio・16.9 配布）、
  `src/analyze/lexicon.json`（語彙表。ここを育てると精度が上がる）、`src/pitches/stripe/report.md`
Running: プロセスは無し。PR #17 を subscribe 中、1 時間ごとの自己チェックを予約済み。

## docs/

| File | Status | Last updated | Open questions |
|---|---|---|---|
| superforge.md | 設定・pin（会話=日本語 / ファイル=日本語） | 2026-09-16 | — |
| adaptive-portfolio-architecture.md | 本体。§16 が Phase 2–3 | 2026-09-16 | §16.9（3d）は計画のみ |
| evidence-gaps.md | 生成物。46 件中 **31 件に空欄** | 2026-09-16 | decisions 26・teamSize 25・level 24・constraints 24 件 |
| japanese-voice.md | 基準（テストが強制） | 2026-09-11 | — |
| accessibility.md | 測定済み（PR #15 時点） | 2026-09-12 | 実機スクリーンリーダー・400% リフロー未実施 |
| page-transitions.md | 決定済み | 2026-09-12 | — |
| project-page-format.md | 決定済み（本人決裁） | 2026-09-12 | — |
| gemini-studio-salvage-review.md | 回収完了（§4 が Phase 2 の出発点） | 2026-09-11 | — |
| portfolio-content-intake-prompt.md | v3。3d の導入スキルの下敷き | 2026-08-12 | — |
| portfolio-ia.md | 決定済み | 2026-08-12 | — |
| portfolio-template-system.md | 決定済み | 2026-08-01 | — |
| case-study-format-audit.md | 分析 | 2026-08-02 | **要確認 3 件**（CLI Studios の旧 IA・検討案・Retrospective） |
| portfolio-interactive-content.md | 素材の所在 | 2026-09-06 | — |
| portfolio-generative-upgrade.md | 方向づけ | 2026-08-06 | §7（クロール未実施） |
| landing-design.md / landing-hero.md | 決定済み | 2026-08-09 / 08-10 | — |
| devin-pdp-audit-and-fix.md | 過去のタスク指示 | — | — |
| verification.md | — | — | **未作成** |
| security.md | — | — | **未作成。`api/` を書いたので一度走らせる価値がある** |
| ship-readiness.md | — | — | **未作成** |
| failforward.md | — | — | **未作成**（Phase 1 から未作成のまま） |

## このセッションで決めたこと

1. **採用側に見せるのは点数ではなく台帳。** 求人票の 1 行ずつに、`contribution.mine` の逐語と
   度合い（direct 100 / partial 60 / adjacent 30 / none 0）。合計 % は出さない。→ §16.6
2. **level は記録から機械的に決まる上限まで。** 本人は下げられるが上げられない（`fitCeiling`）。
   引用は逐語のみ。「記録に無い」行はページから消さない。
3. **Studio は最初から GitHub ログイン＋自動 commit**（本人の決定）。公開 = 1 commit。→ §16.7
4. **公開デモ `/try/` を作る**（本人の決定）。誰が並べたかをページに明記する。→ §16.8
5. **配布はテンプレート repo・デザイナー用タクソノミー 1 種・MIT**（本人の決定）。→ §16.9
6. LLM は引き続き呼ばない。生成器は事実文を書かない。

## 未検証（正直に）

- `--url` と `/api/fetch-jd` の**実サイトでの取得**。作業環境から外向き通信が塞がれていた。
  ローカル HTTP サーバーと schema.org `JobPosting` の HTML で検証した。
- **Vercel 上での `api/` の実行と、実 GitHub での OAuth**。テストは GitHub をスタブしている。
  Web 標準ハンドラ（`export function GET(request)`）が Vercel の Node ランタイムで動く前提。
  動かなければ `(req, res)` 形式への薄い変換を `api/_lib` に足す。
- `/studio/` の Publish を**一度も本番で押していない**。押して `git pull` し、`npm test` が
  通る（= 生成 HTML が一致する）ことを確認して初めて 3b は完成。

## Files to read first

- `docs/adaptive-portfolio-architecture.md` §16.6 / §16.7 / §16.9
- `src/analyze/fit.mjs` と `src/validate.mjs` の `fitCeiling()` — 台帳の規則
- `api/_lib/publish.mjs` — 公開が何を commit するか
- `src/pitches/stripe/report.md` — 実際の出力例
- `docs/evidence-gaps.md` — 本人が埋める空欄
