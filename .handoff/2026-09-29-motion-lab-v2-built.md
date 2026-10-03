# Handoff — 2026-09-29 · Motion Lab v2 built, publish waits for Takao

**Project & passphrase**: takaoumehara/takaoumehara.com — 「普通の道具を先に、BreakBias は棚から」
**Branch / PR**: `claude/tender-ride-9fie49` → PR #27 (draft), head `d5c78f5`, base `main` @ `2ec8e39`. No reviews, no conflict.

## Objective
Motion Lab を「自分のサイト（スクショ／URL）を舞台に、Takao の過去 6 系統の演出を選ぶだけで試し、JSON か CSS+WAAPI で持ち帰れる、公開された道具」にする。課金は二の次。判定基準は「5 人でも便利」か「就職に有利」。

## Verified state (2026-09-28, commit 851baee → docs on d5c78f5)
- `npm test` (build + unit): 265/265. Independent verifier (Sonnet, separate context): 81 checks, 80 PASS (the 1 fail is the verifier's own mocked-401 console assertion). Report: `docs/motion-lab/journal/2026-09-28-verify.md`.
- e2e: 47 pass / 3 fail — all 3 pre-existing on `main` (Werewolf colour contrast; homepage has 0 `[data-href]` cards). Out of scope, recorded only.
- Built: engine v2 (cover/reveal/boot/idle/sound/interactions), 6 style families restored (slabs ×5, field, wipe, band-sweep, dissolve, slabs-puzzle boot, breathing idle, snap/swoosh), `/lab/motion` tool (site/screenshot/URL stages, phone frame default ON, keep-or-toss, Copy JSON), panel groups + Export code + Suggest 3 (rule-based → Jev sorts), click/hover feel as `--ix-*` params.
- Vercel: previews deployed up to `7210def`; later heads hit the free-tier quota (100 deploys/day) on 09-28. Resets ~08:30 UTC 09-29. Preview URL: takaoumehara-com-git-cla-924a30-takaoumehara-gmailcoms-projects.vercel.app
- Known small issue: `aria-busy` drops for ~150–300 ms between OUT and IN during `replay("nav")` (pre-existing v1 path, `paneOut()` never calls `busy()`), low severity.

## Blocked / waiting on Takao
1. **Publishing** (visibility public, list in Interactive, drop draft gate on `/lab/stage`, `/lab/breakbias` page) — the session's auto-permission refused "create public surface". Needs Takao's explicit "公開してOK". Manual path: `src/data/experiments/motion-lab.json` visibility → "public"; add `motion-lab` to `src/categories/interactive.json`; remove the `draftPagesBuilt()` condition in `src/pages/lab/[page].astro` getStaticPaths; then invert `tests/motion-lab.test.mjs`.
2. **Credit line** in Export code header (`Made with Motion Lab — takaoumehara.com/lab/motion`) — proposed, not decided.
3. **Live Ask Jev check** on a preview (`/admin` → `/?lab=1` → Ask Jev). Needs Clerk keys in Vercel (`docs/admin.md` §2) and a fresh preview.

## Running processes / ports
None. All dev servers stopped. A `send_later` check-in for PR #27 re-arms hourly (last: 04:30 UTC 09-29); stop it once merged/closed.

## docs/ ledger
| File | Status | Last updated | Open questions |
|---|---|---|---|
| superforge.md | agreed (Round 5 appended) | 2026-09-28 header says 09-26 | 会話=日本語 / docs=日本語. Round 5: publish waits for explicit OK; engine-contract is canonical; Opus 5.5 impl / Sonnet 5 verify+docs / session model decides |
| superforge-log.md | 3 entries | 2026-09-28 | Round 5 entry: publish refused by permission; Vercel quota; T9 broke 2 engine tests (fixed) |
| product-idea.md | draft, Chosen direction rewritten 09-28 | 2026-09-28 | users not interviewed; Hero 1/2/3/5 shelved until 5 users |
| critique.md | single-pass roast | 2026-09-28 | its 10 fixes: ①③④⑤⑥⑨ built, ②/⑦/⑧ pending publish, ⑩ done in docs |
| jev.md | current (Suggest 3 section added) | 2026-09-28 | cost per call 不明・要確認; live call unverified |
| admin.md | current | 2026-09-26 | Clerk keys in Vercel? unknown |
| motion-lab/engine-contract.md | **canonical** | 2026-09-28 | interactions block now filled (§1 updated) |
| motion-lab/library-plan.md | 実装済み table | 2026-09-28 | unported: A3 lens, B1–B3, D2, C3 |
| motion-lab/breakbias/{brief,kill-pass,judge}.md + ledger/ | done; kill-pass has "両方の枝を見る" | 2026-09-28 | — |
| motion-lab/journal/2026-09-28-*.md (12) | evidence per module + verify | 2026-09-28 | — |
| motion-archive.md, motion-lab-plan.md | reference | 2026-09-27 | motion-lab-plan.md not updated to point at engine-contract |
| verification.md | — | — | **not written as a docs/ file**; the verify journal stands in |
| security.md | — | — | **not run as a file**; Jev review was in-session (docs/jev.md notes it); peek SSRF checks in verify journal |
| ship-readiness.md | — | — | **not run yet** (publish not approved) |
| failforward.md | — | — | none |

## Immediate next steps
1. If Takao says 公開 OK → run the T10 brief (publish + `/lab/breakbias` + tests + docs); then `superforge-verify` → `superforge-ship`.
2. After Vercel quota resets: push a small commit (or Takao clicks Redeploy) so `d5c78f5` gets a preview; then ask Takao for the live Ask Jev check.
3. If credit line approved: add the header line in `src/scripts/motion-export.mjs` + test.
4. Optional later: `motion-lab-plan.md` pointer line; the aria-busy gap; the two pre-existing a11y failures (separate PR).

## Files to read first
`docs/superforge.md` (Round 5), `docs/motion-lab/engine-contract.md`, `docs/motion-lab/journal/2026-09-28-verify.md`, `docs/product-idea.md` "Chosen direction", `docs/critique.md` §🔨, this file.
