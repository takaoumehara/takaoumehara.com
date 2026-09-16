# Adaptive Pitch Engine — Phase 2（JD → Lens 下書き）

> `.handoff/2026-09-12-adaptive-portfolio-phase1.md` の続き。Phase 1 の内容はそちら。

## Resume Capsule

Project: takaoumehara.com
Handoff: `.handoff/2026-09-16-adaptive-pitch-phase2.md`
Passphrase: 「Direct は与えるものではなく、稼ぐもの」
Goal: 求人票を読んで、証拠ライブラリから 3〜5 件を選び、企業専用 Lens の下書きと
  「何が合い・何が無いか」のレポートを出す。LLM を呼ばず、規則と語彙表だけで。
State: **Phase 2 ＋ 3a（Fit Ledger）＋ 3b（Studio、GitHub publish）完了。** `npm test` 118/118、Studio の Chromium テスト 1/1。ブランチ `claude/peaceful-rubin-j7wsvg`、PR #17。
  計画の全体（3b Studio＋GitHub ログイン publish、3c 公開デモ、3d 配布）は
  `/root/.claude/plans/glowing-roaming-nebula.md` に書いた内容を §16 に写す予定（次のセッション）。
  `src/lenses/stripe.json` は draft（未公開）。`lens/stripe/index.html` は無い。
Next: 本人の作業 — ①`docs/evidence-gaps.md` の空欄を埋める（31 件）②実在の求人 URL で
  `--url` を試す（作業環境からは外向き通信不可で未検証）③Stripe の下書きの hero を書き直して
  `--preview` で見る。
Read first: `docs/adaptive-portfolio-architecture.md` §16、`src/pitches/stripe/report.md`、
  `src/analyze/lexicon.json`（語彙表。ここを育てると精度が上がる）
Running: プロセスは無し。

## Phase 3a — Fit Ledger（2026-09-16、本人の要望で追加）

求人票の要件 1 行ずつに「自分が何をしたか（`contribution.mine` の逐語）」と度合い
（direct 100 / partial 60 / adjacent 30 / none 0）を並べる。`src/analyze/fit.mjs`、
`validate.mjs` の `fitCeiling()`（本人は level を下げられるが上げられない）、
`sections.mjs` の `fitSection()`。設計は §16.6。年数・学位の行は載せず、脚注で「履歴書で答える」。

## Phase 3b — Studio（2026-09-16）

`/studio/`。エンジンと描画をブラウザで（`src/` を ES モジュールとして配信）。公開は `api/publish`
（GitHub OAuth、owner のみ、Git Data API で 1 commit）。設計と**本人がやる 3 手順（OAuth App・環境変数・初回 Publish）**は §16.7。
**GitHub 実 API と Vercel 上の実行は未検証。**

## 使い方

```
node scripts/generate-pitch.mjs --url "https://…"                       # URL
node scripts/generate-pitch.mjs --company "Stripe" --jd path/to/jd.txt  # ファイル
node scripts/generate-pitch.mjs --company "Stripe"                      # 貼り付け → Ctrl-D
node src/build.mjs --preview   → lens/_preview/<slug>/index.html（git 管理外）
node scripts/audit-evidence.mjs → docs/evidence-gaps.md
```

## 決めたこと（ブリーフから変えた点は §16.1）

- LLM を呼ばない。語彙表 `src/analyze/lexicon.json` が知識の置き場。句を足せば賢くなる。
- 生成器は事実文を書かない。カードの文は承認済み angle か `cardLine`、hero は定型＋先頭カードの `cardLine`。
- "Direct" の条件: 求人の重い上位 5 能力のうち 2 つ以上に strong（または最重要 1 つ＋同じ業界）。
- 記録に 3 つの型を足した: `contribution.level / teamSize`、`outcome`、`narrative.decisions`。
  埋めたのは記録に文字どおりあるものだけ（22 件）。カードの役割フラグはここから出る。
- `lensNote` は `boolean | Localized`。`tailoredResume` は描画しないが validator が検査する。

## 検証したこと・していないこと

| 項目 | 状態 |
|---|---|
| サンプル JD 3 本（決済 / クリエイティブディレクター / 日本語の新規事業） | 選定結果を目視で確認。テストで固定 |
| URL 取得 | ローカル HTTP サーバー＋JSON-LD で検証。**実サイトは未検証** |
| プレビューの描画 | Chromium 1440 / 390px で横スクロール 0、JS エラー 0 |
| `npm run test:e2e` | 未実行（Playwright のブラウザパスが環境と合わず。既存の a11y テストは Phase 1 のまま） |
