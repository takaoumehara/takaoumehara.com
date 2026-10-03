# Handoff — takaoumehara.com: 「色で繋いで、箱で組む」

> 2026-09-28 04:10 UTC · branch `claude/tender-ride-9fie49` · head `584289c` · PR takaoumehara/takaoumehara.com#27 (draft)
> 会話: 日本語 / docs: 日本語（`docs/superforge.md` の設定）

## Objective
1. 各プロジェクトの AI セッションに詳細ページの中身と素材計画を書かせるプロンプト（v4）— 完了
2. Festival Reinvention ページを旧ページの全ゲーム・全写真で復元 — 完了
3. 過去のローディング/遷移（グラデーション・フィールド等）と Takao のスラブ HTML を Motion Lab に全部取り込む — **提案まで（未実装）**

## Verified state
- `npm test` 159/159 pass（`584289c`）。Vercel preview 2 本とも成功（`584289c`）。merge 可、レビューなし。
- Festival: 13 beats、webp 46 枚（`public/assets/festival-design/web/`）、1440px EN / 390px JP でスクショ確認・壊れ画像 0。
  除外: `korinto2.png`（子どもの顔が未処理）、`katanuki-bulk.jpg`（作者不明）。Cloudinary の制作動画は未検証（サンドボックスから到達不可）。
- Motion Lab 下書きページ（別スレッド commit `56706ea`）: private、dev と Vercel preview でのみビルド。
- 並行作業: PR #28（`claude/wizardly-franklin-8srztg`）が `src/data/motion.json` / `src/scripts/motion-lab.js` を更新中 — **未マージ**。

## Preview
- https://takaoumehara-com-git-cla-924a30-takaoumehara-gmailcoms-projects.vercel.app/projects/festival-design.html
- …/projects/motion-lab.html · …/lab/stage.html（同じホスト）

## Running processes / ports
なし（ローカルの http.server:4322 は停止済み）。PR #27 の再確認チェックインが send_later で 1 時間ごとに入っている。

## docs/ ledger
| File | Status | Last updated | Open questions |
|---|---|---|---|
| superforge.md | settings | 2026-09-26 | — 会話=日本語 / docs=日本語 |
| motion-lab/library-plan.md | **提案（未実装）** | 2026-09-28 | §6: スラブボードの置き場 / 音を本番で許すか / PR #28 後に着手でよいか |
| motion-archive.md | — | 2026-09-27（§H 追補 2026-09-28） | E: ゲーム内ローダーは本人ヒアリング待ち |
| motion-lab-plan.md | — | 2026-09-27 | 本番プリセットは Takao が選択待ち |
| motion-lab/journal/2026-09-28.md · configs/ · references/ | log | 2026-09-28 | — |
| project-detail-intake-prompt.md | v4 | 2026-09-27 | 各プロジェクトからの返答待ち |
| portfolio-content-intake-prompt.md | superseded by v4 | 2026-08-12 | — |
| project-page-format.md | locked format | 2026-09-25 更新 | — |
| page-transitions.md | — | 2026-09-12 | — |
| sidebar-layout-proposal.md | 提案・本人回答待ち | 2026-09-17 | §6 の 3 問 |
| portfolio-interactive-content.md | published 7 / wip 11 / retired 3 | 2026-09-06 | — |
| adaptive-portfolio-architecture.md | — | 2026-09-16 | — |
| astro-architecture.md | — | 2026-09-17 | — |
| admin.md | — | 2026-09-26 | — |
| accessibility.md | — | 2026-09-12 | — |
| japanese-voice.md | — | 2026-09-11 | — |
| design/twist-proposal.md | — | 2026-09-25 | — |
| design/porto-rocha/ (DESIGN.md, MEASURE-2026-09-25.txt, tokens.json, variables.css) | reference | 2026-09-25 | — |
| case-study-format-audit.md | — | 2026-08-02 | — |
| content-audit-2026-09-26.md · content-audit-2026-09-26-clients-b.md | — | 2026-09-26 | — |
| evidence-gaps.md · prod-alignment-2026-09-25.md · devin-pdp-audit-and-fix.md | — | — | — |
| gemini-studio-salvage-review.md | — | 2026-09-11 | — |
| landing-design.md · landing-hero.md | — | 2026-08-09 / 08-10 | — |
| portfolio-generative-upgrade.md · portfolio-ia.md · portfolio-template-system.md | — | 2026-08-06 / 08-12 / 08-01 | — |
| verizon-work-transformation-slides.md | — | — | — |
| superpowers/plans (3) · superpowers/specs (5) | historical | 2026-07 | — |
| plan.md | — | — | **not written**（library-plan.md §5 が代わり） |
| verification.md | — | — | **not run yet** |
| security.md | — | — | **not run yet** |
| ship-readiness.md | — | — | **not run yet** |
| failforward.md | — | — | **0 entries / file absent** |

## Immediate next steps
1. Takao の §6 の 3 回答を待つ（library-plan.md）。回答なしで着手しない。
2. PR #28 がマージされたら `git merge origin/main` → library-plan §5 の 1（エンジンの型 + motion.json v2、見た目不変をテストで保証）。
3. 続けて §5-2 スラブ幕 5 種（H3b）→ §5-3 グラデーション・フィールド（H1、色は `cfd2e7e:landing-b-index.html` の 14 組）。
4. PR #27 は Takao のマージ待ち。CI/レビューが動いたら対応。

## Files to read first
`docs/superforge.md` → `docs/motion-lab/library-plan.md` → `docs/motion-archive.md` §H →
`docs/motion-lab/references/living-architectural-slabs-v4.html` → `src/scripts/motion.js` → `src/scripts/motion-lab.js` → `src/data/motion.json`
