# Resume Capsule — 2026-08-14

**Project / Passphrase**: `takaoumehara.com` : *the colour arrives before the click*

## Objective

ポートフォリオのレイアウトを抜本改善する。参考素材4つ（Creative Giants / Ingmar /
Freytag / Bpowell）＋ Channel Studio を実測し、**構造の違う3案を作ってユーザーが選定中**。
遷移は「シームレスでかっこよく」が最優先要件。

## Verified state（実行して確認したもの）

- **3案が動いてデプロイ済み** — `landing-a-editorial.html` / `landing-b-index.html` /
  `landing-c-reel.html`。1440・375px で横スクロール0px、JSエラー0、全画像 alt あり、h1は1つ
- **B の遷移が通っている** — `landing-b-index.html` → `projects/rakugaki-jam.html`。
  両ページの `background-image` 計算値が**完全一致**（色が切れない）
- **`projects/rakugaki-jam.html` のヒーローは実際に描ける canvas**（動画でも iframe でもない）
- **日英同時表示バグを修正**（詳細度の問題、7箇所）。テストで固定
- テスト **29 pass / 1 fail**。fail は変更前から存在する既存失敗
  （`homepage Agentic UX section presents the three flagship items`・未修正・範囲外）
- 全作業は PR #12（draft）に push 済み。CI green

## ⚠️ 棚上げした欠陥

**shared-element morph は「動くことがある」段階で止めた。** 10回中5〜8回しか走らず、
原因未特定（環境ではなく当サイトのページ側。重量・JS は無関係、外部リソースは一部寄与）。
ユーザーが実機で「見えない」と報告 → **色の連続方式に切り替えて回避**。
旧グリッド（work/brand/index）には morph 実装が残っている。詳細 `docs/page-transitions.md` §3。

## Running processes / ports

なし。検証は都度 `python3 -m http.server 8765` ＋ `npm i --no-save playwright-core`
（`node_modules` は `.gitignore` 済み。Chromium は `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`）。
**このサンドボックスから Vercel プレビューには到達できない**（実機確認はユーザー側）。

## docs/

| File | Status | Last updated | Open questions |
|---|---|---|---|
| superforge.md | agreed | 2026-08-02 | — （**会話=日本語 / docs=日本語**。推測数値・未使用ツール名を書かない） |
| landing-variants.md | **draft — 選定中** | 2026-08-14 | **5件**（軸にする案 / C冒頭の説明 / Featured枠5・6 / Kao Game不明 / 全画面の見せ方） |
| page-transitions.md | morph=**superseded** / 色連続=現行 | 2026-08-14 | morph の 5〜8/10 の根本原因は未特定（棚上げ） |
| portfolio-tiering.md | agreed（2枠を除く） | 2026-08-13 | **枠5・枠6が未決**。かつユーザーはインタラクティブ系をFeaturedに入れたい意向 |
| landing-design.md | agreed（現行 index.html の記録） | 2026-08-09 | — |
| portfolio-template-system.md | agreed | 既存 | — |
| case-study-format-audit.md | agreed | 既存 | — |
| portfolio-content-intake-prompt.md | agreed | 既存 | — |
| verification.md | — | — | **存在しない（/superforge-verify 未実行）** |
| security.md | — | — | **存在しない（未実行）** |
| ship-readiness.md | — | — | **存在しない（未実行）** |
| failforward.md | — | — | **存在しない（未実行）** |

## 未解決の技術負債（記録済み・未着手）

- `assets/` が **1.1GB**。2MB超の画像61枚=229MB、mp4 328MB。最大 `VF-Web-screenshot00001.png` 14.5MB /
  `QUEST-Video_Introducing_The_Contraption.mp4` 92MB → `docs/portfolio-tiering.md` §6-2
- **NDA案件は全画面ヒーローを張れない**（tmobile / verizon-totalwireless はビジュアル匿名化済み）

## Immediate next steps

1. **ユーザーがどの案を軸にするか待ち。** 混成案が有力:
   「B のリスト構造 ＋ Interactive だけ C 形式のフルスクリーン」
2. **Kao Game の中身をユーザーに聞く**（この環境からは 403/404 で取得不能）
3. 軸が決まったら、その案の遷移先ページを Featured 分だけ同じデザインシステムで作る
   （`projects/rakugaki-jam.html` が唯一の実例＝テンプレート）
4. Featured 6 の再検討（インタラクティブ系を入れるなら §3 の6件が組み替わる）

## Files to read first

1. `docs/landing-variants.md` — 3案と Open questions 5件
2. `docs/page-transitions.md` §5 — 現行の遷移方式
3. `landing-b-index.html` + `projects/rakugaki-jam.html` — 唯一通っている一対
4. `docs/portfolio-tiering.md` — Featured 6 の根拠と未決2枠
