# アクセシビリティ — 実ブラウザでの測定結果

> Written by: superforge-a11y · 2026-09-12 · 対象: `claude/stoic-pasteur-zhusuy`（PR #15）

`docs/gemini-studio-salvage-review.md` §2-C で「回収する価値がある」と判定した
Playwright + axe を、このリポジトリ向けに新規執筆して実行した。ハンドオフに
「a11y 未実施」と書かれていた穴はこれで埋まる。

## 走らせ方

```bash
npm install              # @playwright/test と @axe-core/playwright
npx playwright install chromium
npm run test:e2e         # 10 ページ × 1440 / 390px
```

既に Chromium がある環境では `PLAYWRIGHT_CHROMIUM_PATH` にそのパスを渡せば
ダウンロードは走らない。

`tests/a11y.spec.mjs` の中身は 4 つ:

1. 10 ページを axe で WCAG 2.2 AA（`wcag2a` / `wcag2aa` / `wcag21a` / `wcag21aa` / `wcag22aa`）走査
2. 言語スイッチが `<html lang>` も変えること
3. 開くカードがすべてキーボードで到達・実行できること
4. `prefers-reduced-motion` でプレビュー動画が動かないこと

スキャナに見つけられるものは 1 が見る。**2〜4 はスキャナには見つけられない**
——「動くけれど読み上げが壊れている」「マウスでしか押せない」「止めてと言ったのに動く」
はどれも axe を通る。

## 初回の走行で出た欠陥（3 件、すべて修正済み）

| 欠陥 | 実測 | 影響範囲 | 対処 |
|---|---|---|---|
| **`--ink-dim` が AA に届いていない** | `#79746d` on `#fbfaf7` = **4.44:1**（必要 4.5:1） | サイト全体のキャプション・メタ行。`/`・lens 2 枚・AI Tools で検出 | `#76716a`（**4.64:1**）へ。55 ファイルで同じリテラルだったので一括置換 |
| **言語を切り替えても `<html lang>` が `en` のまま** | クラスは `lang-jp` に変わるが属性は変わらない | 言語スイッチを持つ **54 ファイル全部** | `setLang` で `html.lang` も切り替える。スクリーンリーダーが日本語を英語の声で読む問題 |
| **リンクのタップ目標が小さい** | `.idx-meta-col a` が **17.5px 高・20.5px 間隔**。WCAG 2.2 §2.5.8 の寸法条件も間隔の例外も満たさない | `work.html` / `brand.html` | メタ行全体を 24px のリズムに。リンクだけ大きくすると 4 列の高さが揃わなくなるため |

### lens ページの「静かなセル」— 設計の判断が必要だった 1 件

`/lens/<slug>` は、その Lens が主役にしない章を `.arc-cell.is-quiet { opacity: 0.55 }`
で沈めていた。実測するとその中の文字は:

| 要素 | 実効色 | 比 |
|---|---|---|
| `.arc-label` | `#7b7a79` | 4.10:1 |
| `.arc-summary` | `#9b9893` | 2.75:1 |
| `.arc-title` | `#b2afa9` | **2.09:1** |

**不透明度を上げても解決しない。** `--ink-dim` は最大でも 4.64:1 しかないので、
0.55 でも 0.9 でも `.arc-title` は AA に届かない。

そこで**不透明度ではなくインクの段を 1 つ下げる**方式に変えた。`ink → ink-mid`、
`ink-mid → ink-dim`。17.95:1 と 8.71:1 の差は目で見てはっきり「静か」で、
かつどの段も AA を通る。「目立たせない」は WCAG 1.4.3 の免除理由にならない。

## 副産物 — 自分で踏んだ罠

最初の修正で `.idx-meta-col span { display: flex }` と書いた。これは
`.t-jp { display: none }` を詳細度で上回り、**英語表示なのに日本語が並んで出た**。
`docs/adaptive-portfolio-architecture.md` §13 に書かれている「言語スイッチを
out-specify してはならない」とまったく同じ欠陥を、別のファイルで再発させたことになる。

既存のテストは `src/render/lens.css` しか見ていなかった。`assets/*.css` も見るように広げ、
さらに **`display` を持つ子孫 `span` セレクタ**（`.t-en` / `.t-jp` に届いてしまう形）も
落とすようにした。直接子 `> span` なら通る。

## 現在の状態

```
26 passed (desktop 1440px / phone 390px × 13)
```

## まだ見ていないもの

| 項目 | 状態 |
|---|---|
| `projects/*.html`（35 ページ） | **未走査**。`--ink-dim` と `<html lang>` の修正は届いているが、axe は当てていない |
| `index-console.html` ほか旧版スナップショット | **対象外**（保存物） |
| 実際のスクリーンリーダー（VoiceOver / NVDA） | 未実施。自動テストは読み上げの「正しさ」を測れない |
| 拡大 400% / リフロー（WCAG 1.4.10） | 未実施 |
| forced-colors モード | 未実施 |
