# Rakugaki Jam を基準に 8px の枠、ランディング刷新、TWIST、コンテンツ厚み — PR #24

> `.handoff/2026-09-17-astro-rebuild.md` の続き。PR #23（`cursor/fix-project-detail-navigation-3b61`）の上に積んだ。

## Resume Capsule

Project: takaoumehara.com
Handoff: `.handoff/2026-09-26-porto-twist-pr24.md`
Passphrase: 「サムネを壁へ投げる — 隙間は 8px」
Goal: 本人の依頼（2026-09-25）: (1) Rakugaki Jam を完璧にしてテンプレに、隙間は portorocha.com と同じ 8px、
  (2) ランディング = 作品スライドショー + 基本情報 + 日付つきニュース（サムネ付き）、(3) Porto Rocha と確実に違う「ひねり」、
  モバイル方針つき、(4) ハンドオフの続き: 本番整合レポート、Interactive 8 件の厚み、テスト、ビルド、push。
State: **すべて完了、push 済み。** ブランチ `claude/wizardly-franklin-8srztg` = `326d75b`（10 コミット）、
  PR #24（draft、base = PR #23 のブランチ）。`npm run build` 成功、`npm run test:unit` 146/146。
  Vercel Preview: https://takaoumehara-com-git-cla-bc79d8-takaoumehara-gmailcoms-projects.vercel.app
  本番の直接比較は未実施（作業環境の egress が www.takaoumehara.com / portorocha.com を遮断）。
Next: **本人が Preview を見て判断する。** 判断待ちの 5 点は PR #24 本文と下の Open questions。
  本人が OK なら: PR #23 をマージ → PR #24 の base を `main` に付け替えてマージ → 本番確認（`docs/prod-alignment-2026-09-25.md` の手順）。
  コード側の次: Kao Game の実写素材待ち、クライアント案件の空 Challenge/Solution（ela-quests, cli-studios, konosaki,
  festival-reinvention, menlomath, koji-fizz の順）、Werewolf の絵の出自の言い回し統一。
Read first: `docs/superforge.md`（Pinned、末尾 6 項目が今回の決定）、`docs/design/twist-proposal.md`、
  `docs/prod-alignment-2026-09-25.md`、`src/styles/transitions.css` + `src/scripts/site.js`（投げ込み / 手ざわり / エコー）、
  `src/components/home/HomeHero.astro` + `HomeNews.astro` + `src/data/news.mjs`、`src/lib/detail.mjs`（詳細ページの読み方）。
Running: プロセス無し（Astro dev はセッション終了で止まる）。PR #24 を subscribe 中、1 時間ごとの再チェックを予約。

## docs/
| File | Status | Last updated | Open questions |
|---|---|---|---|
| superforge.md | agreed（会話=日本語 / docs=日本語 / コード=英語可） | 2026-09-26 | — |
| design/twist-proposal.md | agreed → Phase 2 実装済み | 2026-09-25 | 起点をカードかステージか / 戻り先 / スタンプをレールにも出すか / 影の撤去 / blur の撤去 → 実装で既定を採用、本人未確認 |
| prod-alignment-2026-09-25.md | report（本番未取得） | 2026-09-25 | どちらの Vercel プロジェクトにドメインが付いているか |
| project-page-format.md | agreed（詳細ページの固定順序） | 2026-09-25 | — |
| verizon-work-transformation-slides.md | source dump | 2026-09-25 | 数値なし（KPI を書かない） |
| astro-architecture.md | agreed | 2026-09-17 | — |
| sidebar-layout-proposal.md | agreed | 2026-09-17 | — |
| adaptive-portfolio-architecture.md | agreed | 2026-09-16 | — |
| evidence-gaps.md | reference | 2026-09-16 | 記録が答えられない問い（未解消） |
| japanese-voice.md | agreed | 2026-09-11 | — |
| accessibility.md | measured（PR #15 時点） | 2026-09-12 | 今回の motion 追加は未計測（axe は e2e でのみ） |
| page-transitions.md | agreed | 2026-09-12 | 投げ込み実装を反映していない（追記候補） |
| case-study-format-audit.md | reference | 2026-08-02 | — |
| portfolio-interactive-content.md | source（8 件の素材の所在） | 2026-09-06 | Resona = Body、Werewolf の出自 |
| portfolio-template-system.md / portfolio-ia.md / landing-design.md / landing-hero.md | superseded（Astro 化前） | 2026-08 | — |
| portfolio-content-intake-prompt.md / portfolio-generative-upgrade.md / gemini-studio-salvage-review.md / devin-pdp-audit-and-fix.md | reference | 2026-08〜09 | — |
| design/porto-rocha/{DESIGN.md,tokens.json,variables.css,MEASURE-2026-09-25.txt} | source | 2026-09-17 / 09-25 | — |
| verification.md | — | — | **not run yet**（検証は Playwright 計測と 146 テストのみ） |
| security.md | — | — | **not run yet** |
| ship-readiness.md | — | — | **not run yet** |
| failforward.md | 0 entries | — | none |

## Open questions（本人待ち）
1. Interactive 8 件のニュースの実公開日（`src/data/news.mjs`、いま 2026-03〜09 の仮置き）。
2. Werewolf の絵の出自: データ「手描き」/ 旧ページ「生成背景」。本文は「版画調」に統一済み、`cardLine` / `summary` は未統一。
3. Resona の `input` を Pointer → Body に変更（`docs/portfolio-interactive-content.md` 準拠）。
4. Kao Game は実写素材がリポに無い（名前カードのティーザー、ビート 1 本）。
5. 入力スタンプをレール行にも出すか（現状グリッドとヒーローのみ）。
6. Verizon AI Workflow のレール一行文「42 designers」は既存記述。根拠がなければ外す。

## Chat Resume Prompt
```
次の作業を再開してください。

Project: takaoumehara.com
Handoff file: .handoff/2026-09-26-porto-twist-pr24.md
Goal: Porto Rocha の骨格に 8px の枠と本人の「投げ込み」の性格を足した PR #24 を、本人の判断を受けてマージまで運ぶ
State: ブランチ claude/wizardly-franklin-8srztg = 326d75b、PR #24 draft（base = PR #23）、build 成功、unit 146/146、Preview Ready
Next: 本人の Open questions 1〜6 の回答を反映 → PR #23 マージ → PR #24 の base を main に変更してマージ → 本番を docs/prod-alignment-2026-09-25.md の手順で確認
Read first: docs/superforge.md（末尾 6 項目）、docs/design/twist-proposal.md、docs/prod-alignment-2026-09-25.md、src/styles/transitions.css、src/scripts/site.js、src/data/news.mjs

上記のNextから開始してください。
```
