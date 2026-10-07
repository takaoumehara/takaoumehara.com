Mode: single-pass (grader = implementer)

# Home / About 整理の検証 — 2026-10-07

環境: macOS、Node v22.17.0、Chromium。クリーンな clone に npm ci。
対象: feat/home-about-now。実装担当者による単独検証。公開・マージは行っていない。

## 再現可能な結果（A）

### ビルド

`npm test` 内の `npm run build`:

04:13:56 [build] Server built in 7.22s
04:13:56 [build] Complete!

### Node テスト

`npm test`:

```
  type: 'test'
  ...
1..157
# tests 157
# suites 0
# pass 153
# fail 4
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1369.581166
```

失敗は次の4件。変更前の HEAD を別ディレクトリでビルドし、同じ4件が失敗した。

not ok 70 - Latin and Japanese are separated by a space, the way the rest of the site sets them
not ok 110 - the committed Stripe draft is what the generator produces from the committed sample
not ok 124 - every project's challenge (detailFields, from detail.challenge or the record's own challenge) shows up in its page's Challenge/Solution section
not ok 126 - a record's Challenge/Solution section appears exactly when detailFields resolves both a challenge and a solution — never a bare, empty one

変更前 `npm test`:

```
  type: 'test'
  ...
1..152
# tests 152
# suites 0
# pass 148
# fail 4
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1137.037292
```

### 変更範囲のブラウザ検証

`npx playwright test tests/home-about-navigation.spec.mjs tests/left-rail-categories.spec.mjs tests/contact-scroll.spec.mjs --workers=3`

```

  15 skipped
  21 passed (10.5s)
```

15件の skip は PC 専用テストを phone、phone 専用テストを desktop で除外するもの。
1440×900 / 390×844。Home / About / Work の axe、横スクロール、言語、ダークモード、
繰り返しのクライアント遷移、検索とカテゴリフィルタの併用、フォーム失敗時の入力保持と成功時のリセット。
フォームの成功・失敗レスポンスはモック。実配送ではない。
`tests/contact.test.mjs` の5件は provider 呼び出し、返信先、入力検証、origin、本文容量、
キー未設定、provider失敗、連続送信制限を検証した。

### 全ブラウザテスト

`npx playwright test --workers=3`:

```
  5 failed
    [desktop] › tests/a11y.spec.mjs:30:3 › AI Product lens has no axe violation at WCAG 2.2 AA ─────
    [desktop] › tests/a11y.spec.mjs:51:1 › every card that opens something can be reached and opened from the keyboard 
    [desktop] › tests/a11y.spec.mjs:65:1 › the sidebar lists every section of the work open, marks the current row, and opens on a phone from a button 
    [phone] › tests/a11y.spec.mjs:51:1 › every card that opens something can be reached and opened from the keyboard 
    [phone] › tests/a11y.spec.mjs:65:1 › the sidebar lists every section of the work open, marks the current row, and opens on a phone from a button 
  15 skipped
  66 passed (26.9s)
```

4件は、旧 data-href カードと details 型サイドバーを期待する既存テスト。
変更前のサーバー（4185、別 checkout）でも同じ4件が失敗した。

AI Product lens の axe は全体実行で色のコントラストを1回検出。該当 hero ソースは今回未変更。
単独の再実行（変更前・変更後とも PC / phone）は通過。タイミング依存の疑いがあるが原因は未確定。

`npx playwright test tests/a11y.spec.mjs --grep 'AI Product lens' --workers=1`:

```
  ✓  2 [phone] › tests/a11y.spec.mjs:30:3 › AI Product lens has no axe violation at WCAG 2.2 AA (699ms)

  2 passed (4.6s)
```

`git diff --check`: exit 0、出力なし。

## 観察した画面（B）

`outputs/home-desktop.png`, `home-mobile.png`, `about-desktop.png`, `about-mobile.png`,
`contact-desktop.png`, `contact-mobile.png` に実際のブラウザ画面を保存。
PC 1440×900、phone 390×844、reduced-motion 有効。
フォームは PC で相談案内と左右配置、phone で縦積み。

## 体験上の判断（C）

上記の画面と遷移テストを根拠に、初訪問者には作品→短い紹介、作品を探す人には
左パネルを保った一覧、詳しく見る人には能力と対応作品→経歴、という順序で読める。
実際の訪問者によるユーザーテストは行っていない。

## 確認していないこと

- Resend のキー、送信ドメイン認証、実際の受信・返信・配送完了。
- Vercel WAF の分散レート制限。コード内の制限は各インスタンスのみ。
- Vercel Preview 上の runtime と本番。公開やマージはしていない。
- 全 WCAG 基準の手動評価・支援技術。axe の合格を完全準拠とは扱わない。
- 上記既存テストの4件ずつの失敗と、AI Product lens の検査タイミングの根本修正。
- モーションの全デバイス測定。

## 結論

変更範囲の機能・レイアウトは上記の検証を通過。全体スイートは未合格。
フォームの実配送と本番公開は未確認。設定手順は docs/contact-form.md。

## Sand motion / captions — 2026-10-07

Mode: single-pass (grader = implementer). Independent Canvas 2D entrance, not the
CanvasUI React component. Implementation decisions/limits: docs/sand-motion.md.

Fresh `npm run build`: complete, Server built in 5.42s.

`npx playwright test tests/sand-motion.spec.mjs tests/home-about-navigation.spec.mjs tests/left-rail-categories.spec.mjs --workers=3 --reporter=line`:

```
14 skipped
26 passed (12.4s)
```

Includes first viewport and newly scrolled card grains, one-shot cleanup, no legacy
motion overlays, live reduced-motion cancellation, accordion height animation and
reversal with inert closed links, stable captions below media, existing navigation,
EN/JP/theme, mobile layout, form mocks and axe checks. Device skips are intentional.
The grain test initially used a selector that excluded its target as soon as the
entrance began, then an incorrect data-slug attribute; fixed to a stable card id.

1440×900 and 390×844 Chromium captures and a short WebM of first paint, scrolling,
accordion and Home saved to this task's outputs. No browser page errors observed.
The user's in-app browser at port 4190 was refreshed for local review. Performance
on actual low-end devices, Safari, and Firefox is unverified. Full-suite baseline
failures above are historical evidence, not a fresh all-suite pass for this change.
