# Handoff — 2026-10-01 · Motion Lab を別の AI セッションに渡す

**Project & passphrase**: takaoumehara/takaoumehara.com — 「普通の道具を先に、BreakBias は棚から」
**Branch / PR**: `claude/tender-ride-9fie49` → PR #27（draft、未マージ）、head `bb05bb4`、base `main` @ `2ec8e39`。
**重要**: Motion Lab v2 のコードは **このブランチにしかない**。`main`（＝本番）には v1 の `?lab=1` パネルだけがある。
変更するなら、このブランチから枝を切るか、このブランチに直接積む。`main` 起点で作ると v2 が無い状態から始まる。
会話は日本語、`docs/` も日本語（`docs/superforge.md`）。

## 何を作ろうとしているか（目的）
「自分のサイト（スクショか URL）を舞台に載せ、Takao の過去 6 系統の演出を選ぶだけで試し、コードか JSON で持ち帰れる、公開された Motion Lab」。
課金は二の次。判定基準は「5 人でも便利」か「就職に有利」（`docs/product-idea.md`「Chosen direction」、`docs/critique.md` §🔨）。
別リポジトリには分けない判断（`docs/motion-lab/journal/2026-09-29-session-outputs.md` §1）。

## 何を作ったか（すべて PR #27 上、検証済み: `npm test` 265/265、独立検証 80/81）
| 機能 | 場所 |
|---|---|
| エンジン v2（cover / reveal / boot / idle / sound / interactions、v1 JSON は同じ見た目に変換） | `src/scripts/motion.js`, `motion-config.mjs`, `src/data/motion.json` |
| 演出 6 系統のレジストリ（slabs×5, field, wipe, band-sweep, dissolve, slabs-puzzle boot, breathing idle, snap/swoosh 音） | `src/scripts/styles/*.mjs`（`index.mjs` が登録簿） |
| 全パラメータの調整パネル（どのページでも `?lab=1`） | `src/scripts/motion-lab.js` |
| Export code（貼って動く CSS + WAAPI） | `src/scripts/motion-export.mjs` |
| クリック・ホバーの手触りを `--ix-*` 変数で保存 | `src/scripts/motion-interactions.mjs`, `src/styles/transitions.css` |
| Ask Jev（判定）と Suggest 3（3 案生成→Jev で並べ替え）。**所有者のみ**（Clerk） | `src/server/jev.mjs`, `motion-suggest.mjs`, `/api/admin/jev/*`, `src/scripts/motion-lab-jev.js` |
| 道具の入口 `/lab/motion`（舞台＝サイト縮小版／スクショ／URL、PC とスマホ枠を並置、採る／捨てる 8 回、Copy JSON） | `src/pages/lab/motion.astro`, `src/scripts/lab-tool.js`, `motion-pick.js` |
| 舞台 `/lab/stage`（iframe、postMessage で操作） | `src/pages/lab/[page].astro`, `src/scripts/stage.js` |
| URL の title / description / og:image を読む API（私設ホスト拒否、リダイレクト再検査） | `src/pages/api/lab/peek.ts`, `src/server/peek.mjs` |
| 作品ページ（非公開の下書き） | `src/data/experiments/motion-lab.json`（`visibility: "private"`） |
| BreakBias の 313 案の台帳と判定 | `docs/motion-lab/breakbias/`, `docs/product-idea.html` |

## まだやっていないこと（＝これから作るもの）
1. **公開（T10）** — 本人の明示の「公開 OK」待ち。中身は 3 つ:
   `/lab/motion` と `/lab/stage` を本番でも build（`src/lib/draft.mjs` の `draftPagesBuilt()` 条件を外す）／
   作品ページを `visibility: "public"` にして `src/categories/interactive.json` に載せる（`hideInArchive` も外す）／
   `/lab/breakbias` ページを新設。その後 `tests/motion-lab.test.mjs` の「非公開」前提を反転し、docs 更新、検証、マージ。
2. Export code の先頭に `Made with Motion Lab — takaoumehara.com/lab/motion` を入れるか（本人判断待ち、`motion-export.mjs` + テスト）。
3. Ask Jev の実機確認（preview で `/admin` → `/?lab=1` → Ask Jev）。本人待ち。
4. 小さな既知の不具合: `replay("nav")` の OUT→IN 間で `aria-busy` が 150–300 ms 落ちる（`paneOut()` が `busy()` を呼ばない、v1 由来）。
5. 棚に残したもの（5 人が使うまで触らない）: 動きの契約、生きている仕様、被り見張り、購読・従量、MCP。未移植の演出: A3 lens, B1–B3, D2, C3（`library-plan.md` §5）。

## 変更するときの約束事（破ると既存テストか方針に反する）
- **`docs/motion-lab/engine-contract.md` が正。** 演出は `src/scripts/styles/<name>.mjs` に配列を default export するだけ。`motion.js` の box-first 振付には触らない。
- 動かすのは **transform / opacity / clip-path だけ**、**WAAPI だけ**。GSAP・Tailwind・CSS keyframes の追加は禁止。
- 終わったら DOM を元に戻す（`ctx.drop()`）。reduced motion では何も動かない（`ctx.still`）。入力で即完了（`ctx.own`）。音は `ctx.sound.play()` だけ。
- 色は `ctx.tokens` から。生の hex は `src/data/tints.json` だけ。
- `cover = "none"` のとき見た目は v1 と完全に同じ（テストで固定）。
- **公開系の変更は本人の明示の OK が要る**（自動実行の許可で止められた経緯あり、`docs/superforge-log.md`）。
- 鍵（`TYPESAFE_API_KEY`、Clerk）はチャットやコミットに書かない（`docs/jev.md`, `docs/admin.md`）。LLM 生成は鍵を増やさず規則で生成。
- Vercel 無料枠は 1 日 100 デプロイ。push の連打で preview が止まる（09-28 に発生）。
- 確認: `npm test`（build + unit）。`npm run test:all` は e2e 込み（e2e の 3 件失敗は `main` 由来、対象外）。

## 要確認（本人に聞いている）
09-29 20:32 UTC、PR の commit `179058c` の配備が Vercel 上で `www.takaoumehara.com` に付いた。`main` は未変更。
preview の昇格なら、下書きページが本番で見えている可能性がある。意図した操作かは未回答。こちらからは本番に接続できず未確認。

## docs/ ledger（Motion Lab 関係）
| File | Status | Last updated | Open questions |
|---|---|---|---|
| superforge.md | agreed（Round 5 まで） | header 2026-09-26（Round 5 は 09-28 追記） | 会話=日本語 / docs=日本語 |
| superforge-log.md | 3 entries | 2026-09-28 | 公開が自動許可で止まった、Vercel 枠、T9 でテスト 2 件破損→修正 |
| product-idea.md (+ .html) | draft | 2026-09-28 | 利用者に未確認。Hero 1/2/3/5 は棚 |
| critique.md | single-pass roast | 2026-09-28 | 10 項目中 ②⑦⑧ が公開待ち |
| jev.md | current | 2026-09-28 | 1 回あたりの費用は不明・要確認。実機未確認 |
| admin.md | current | 2026-09-26 | Vercel に Clerk の鍵があるか不明 |
| motion-lab/engine-contract.md | **canonical** | 2026-09-28 | — |
| motion-lab/library-plan.md | 実装済みの表 | 2026-09-28 | 未移植: A3, B1–B3, D2, C3 |
| motion-lab/breakbias/ | done | 2026-09-28 | — |
| motion-lab/journal/ (13) | 証跡 | 〜2026-09-29 | `2026-09-28-verify.md` が検証、`2026-09-29-session-outputs.md` が最新のまとめ |
| motion-archive.md, motion-lab-plan.md | 参照用 | 2026-09-27 | motion-lab-plan.md は engine-contract を指していない |
| verification.md / security.md / ship-readiness.md | — | — | **docs ファイルとしては未作成**。検証は journal の verify、peek の SSRF 確認もそこ。ship は公開未承認のため未実施 |
| failforward.md | — | — | なし |

## 動いているもの
なし。開発サーバーは止まっている。PR #27 の見張り（1 時間ごとの check-in）を元のセッションが続けている。

## 最初に読むファイル
`docs/motion-lab/engine-contract.md` → `docs/motion-lab/journal/2026-09-29-session-outputs.md` → `docs/product-idea.md`「Chosen direction」→ `docs/superforge.md`（Round 5）→ このファイル。
