# PR #11 — Monumental Editorial は PR #15（Lens 方式）に上書きされる側

## Resume Capsule

Project: takaoumehara.com — 「二つのランディングが並走していた。本線は #15」
Handoff: `.handoff/2026-09-13-pr11-superseded-by-lens.md`
Goal（このブランチ）: 承認済み Monumental Editorial で `index.html` と `projects/kitadoko.html` を再構築、
  5カテゴリー名を全ページに、アポストロフィを全ページで正字化しテストで固定。
State: **完了・push 済み。** Draft PR #11 open、HEAD `89660ba`（main `3caa4f1` をマージ済み・競合なし）。
  テスト 28/28。Vercel green。作業ツリー clean。
  **ただし 9/13 に本人が「これです」と示した画面は PR #15（`claude/stoic-pasteur-zhusuy`、別セッション）。**
  #15 = Adaptive Career Portfolio（`src/data/` の証拠ベースから `/` と `/lens/<slug>` を生成）。
  本人が 9/12 に「基本的にクロードが作った方法を採用」と承認済み。19 commits / 187 files / 52+26 テスト。
  → #11 のランディングと kitadoko 詳細は**採用されない前提**で扱う。
Next: **#11 から #15 へ回収すべきものを 1 件だけ移す** — `tests/typography.test.mjs` と変換スクリプト。
  #15 には直線アポストロフィが **260 箇所／44 ファイル**、`src/data/*.json`（生成元）にも残っており、
  本人の「今後一切起こさない」指示（9/12）が本線で未担保。回収後 #11 は閉じる（本人判断）。
Read first: `docs/monumental-editorial.md` §0・§4、`tests/typography.test.mjs`、
  #15 側の `.handoff/2026-09-12-adaptive-portfolio-phase1.md`（`git show origin/claude/stoic-pasteur-zhusuy:…`）
Running: `python3 -m http.server 8899`（このコンテナ限り）。PR #11 を subscribe 中、check-in trigger 稼働中。

## 本人の質問への答え（9/12「レジュメ分析でカスタマイズする機能はどこ？」）
**#15 の Lens 方式がそれ。** `src/lenses/<slug>.json` が対象読者ごとに証拠を選び直す。
JD（求人票）解析は #15 の Phase 2（`src/analyze/` 予定）で**未着手**。#11 には存在しない。

## #11 で決めたこと・保留したこと
- Studio Oker（黒）→ 本人がプレビュー比較の上で却下。実装は `76d1920` に残置、docs は削除。
- EmojiDrop の人数: main/#15 の「協力プレイ・Emoji Blast・`emojiblast.vercel.app`」が正。8/13 の「4人」は撤回。
- 5カテゴリー名（8/22 本人指定）: `Interactive Experience / AI Products / AI Tools & Skills / Product Design / Branded Experience`。
  **#15 のナビは旧名のまま**（Interactive / AI Tools / Brand & Visual）。要すり合わせ。
- `docs/superforge.md` の「Interactive Experience → Playable（既定値）」は 8/22 の本人指定で失効。未更新。

## docs/（このブランチ）— ヘッダーから転記
| File | Status | Last updated | Open questions |
|---|---|---|---|
| superforge.md | agreed | 2026-08-02 | 会話=日本語 / docs=日本語。**Playable の既定値が失効（上記）** |
| monumental-editorial.md | 実装記録 | 2026-08-29 | §4: 英語のみ・残りページ未展開・画像重い。§5: 実書体未確認。**#15 に上書きされる見込み** |
| portfolio-interactive-content.md | 記録 | 2026-09-06 | 約80問中 EmojiDrop URL/名称は #15 で決着。Resona は公開7作のみ（本人 9/6） |
| portfolio-content-intake-prompt.md | v3 | 2026-08-12 | none |
| portfolio-ia.md | — | 2026-08-12 | none（Status 欄なし） |
| portfolio-template-system.md | — | 2026-08-01 | #15 で slide format は廃止（`eeac61e`）。本書は旧仕様 |
| case-study-format-audit.md | — | 2026-08-02 | 8章と現テンプレの差分。未消化 |
| portfolio-generative-upgrade.md | 方向づけ | 2026-08-06 | §3・§5 は追記で自己訂正済み |
| landing-design.md / landing-hero.md | superseded | 2026-08-09/10 | index は以後2回作り直された。参照価値は判断の記録のみ |
| superpowers/specs ×5, plans ×3 | — | 2026-07 | 全て7月の作業。現行と無関係 |
| accessibility.md / japanese-voice.md / adaptive-portfolio-architecture.md | — | — | **この枝には無い。#15 にある**（a11y は #15 で実測済み） |
| verification.md / security.md / ship-readiness.md | — | — | **どちらの枝にも無い。未実施** |
| failforward.md | 0 entries | — | **未作成。** 本セッションの失敗（不可視の見出し・横スクロール・引用符の向き）は commit 本文にのみ記録 |

## 本セッションで踏んだ失敗（failforward.md が無いのでここに）
1. `opacity:0` 起点の入場アニメが、フォント CDN 遮断でタイムライン未開始のまま止まり**見出しが不可視**。
   → `load` 後に付くクラスでゲート。テスト2件。
2. `plate--bleed` の負マージンをパディング無し親に置き横スクロール。→ `.wrap` で包む。
3. 自作の引用符変換: `function`/`const` をコード判定して英文をスキップ／開閉状態が持続して閉じが `“` に。
   → 差分を読んで発見、修正、対で数を検証。
4. **並走ブランチの存在に 9/13 まで気づかなかった。** `git branch -r` の日付一覧を最初に見るべきだった。

## 判断待ち（本人）
1. #11 を閉じるか（タイポ回収後）。 2. #15 のナビを 5カテゴリー名に揃えるか。
3. `emojiblast.vercel.app` が実際に開くか（両セッションとも外向き通信不可で未確認）。
