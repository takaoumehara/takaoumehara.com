# Handoff — takaoumehara.com: Jev を判定役に、Motion Lab を製品として掃引

> 2026-09-28 06:50 UTC · branch `claude/tender-ride-9fie49` · head は `git log -1` · PR takaoumehara/takaoumehara.com#27（draft、green、mergeable）
> 会話: 日本語 / docs: 日本語（`docs/superforge.md`）· 前の引き継ぎ: `.handoff/2026-09-28-motion-library-and-detail-pages.md`

## Objective
1. Jev（TypeSafe AI）を Motion Lab の判定役として組み込む — **完了**（`17e0e9e`）。実機確認は Takao 待ち。
2. Motion Lab を「表現を研究する一般向けの道具（課金を目指す）」として BreakBias 掃引 — **完了**（`docs/product-idea.md`）。利用者への確認は未実施。
3. 過去のローディング/遷移とスラブを Motion Lab に取り込む（library-plan §5）— **未着手**。PR #28 マージ後。

## Verified state
- `npm test` 173/173（`17e0e9e`）。その後の commit は docs と `scripts/breakbias-*.mjs`（テスト対象外）。Vercel preview は全 head で green。
- `docs/product-idea.html` は headless Chromium で読み込み確認: JS エラー 0、286 点の象限図、禁止 3 案の再訪 3 枚、棚のカード 25 枚。
- Jev の実通信は**未確認**（サンドボックスから api.typesafe.ai に届かない）。鍵は Vercel に設定済み（本人）。Clerk の鍵が Vercel に入っているかは不明 — `/admin` が「not configured」なら `docs/admin.md` §2。
- PR #28（`claude/wizardly-franklin-8srztg`、motion.json / motion-lab.js）は未マージ。

## Decisions made today（`docs/superforge.md` Round 4 に固定）
- 積む順: 選ぶだけで作る → 動きの契約（Jev の合否）→ 生きている仕様。被り見張りは v2。音は Lab。
- library-plan §6: スラブのボードは仮想サイトのテンプレート、音は道具の設定、§5-1 は PR #28 後。
- モデルの割り当て: 量は Opus 5.5、閉じた手順は Sonnet 5、判断はセッションのモデル。審判は別コンテキスト。

## Immediate next steps
1. Takao: Ask Jev の実機確認（プレビューの `/admin` → `/?lab=1` → Ask Jev）と、`docs/product-idea.md` の「Chosen direction」への可否。
2. 1 日の実験（product-idea.md §Experiment roadmap）: `/lab/stage` に「採る / 捨てる」と Jev の「合格 / 不合格」の 1 行 → 5 人に触ってもらう。
3. PR #28 マージ後: `git merge origin/main` → library-plan §5-1（エンジンの型と motion.json v2、見た目不変をテストで保証）。
4. 掃引の反省を kill-pass.md に反映: 「除去した版と代替する版の両方を見る」を明記（superforge-log.md 参照）。

## Files to read first
`docs/superforge.md`（Round 4）→ `docs/product-idea.md` → `docs/jev.md` → `docs/motion-lab/library-plan.md` → `src/server/jev.mjs` → `scripts/breakbias-ledger.mjs`

## Running processes / ports
なし。PR #27 の再確認は send_later で 1 時間ごと（次: 06:49 UTC）。
