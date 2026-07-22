# takaoumehara.com v3 — 抜本的ブラッシュアップ設計書
Date: 2026-07-10
Status: Approved via /goal directive (finish complete portfolio site entirely)

## 決定事項（ユーザー確認済み）
1. **ブランディング: 個人名主軸。** takaoumehara.com が主。ナビは「Takao Umehara」、
   Creativity Is Everywhere は会社レイヤーとして footer / about に明記。
   creativityiseverywhere.com はリダイレクト。
2. **AI Products セクション必須。** 12件のAIプロダクト + Verizon実案件を追加。
3. 旧サイト（existing-takaoumehara-com / live site）はデザインの模倣ではなく
   情報ハイアラーキー・画像・動画の参照源として使う。

## 診断結果（v3の問題点）
- 破損参照 17件（画像15 + iframe 1×2回）— 別紙リスト（v3インベントリ）
- YouTube embed マークアップは全10本正しく、動画も全て公開中。
  「見れない」原因は (a) file:// で直接開いた場合のブラウザ挙動、
  (b) learning.amplify.com のライブiframe 2本（X-Frame-Optionsでブロック）。
- 画像過多: ELA 41, Kitadoko 31, Festival 30, CLI 27, VF 25 など。
  SITE-PLAN の目標値に沿って選別する。
- 孤児アセット 194ファイル（firstpremier/hero/menlomath/odell-education/unbound/vocab-app）
- フォルダ横断参照が乱雑（coca-cola が extraordinary/koji-fizz/graffitiwear の画像を使う等）
- verizon-totalwireless: プロトタイプ BottomPanel03.html 欠損
- SITE-PLAN P0未完: 19ページのテンプレ統一、モバイルnav、meta/OG、404

## 新しい情報ハイアラーキー

### ナビゲーション（全ページ共通）
Work / AI Products / About / Contact（+ ロゴ = Takao Umehara / creativity is everywhere）
- BreakBias と intentfirst は Initiatives として index と About から導線を維持
- <768px はハンバーガーメニュー

### index.html
1. Hero（現行の gradient hero 踏襲）
2. Selected Work — 実務の代表作 8件:
   ELA Quests / Verizon TotalWireless / T-Mobile / CLI Studios /
   Web3 Wallet / Kitadoko / KOJI FIZZ / extra•ordinary
3. **AI Products（新設）** — "Building with AI" ストリップ:
   代表 4-6件 + 「View all products →」で ai-products.html へ
4. Initiatives — BreakBias / intentfirst
5. What I do（現行踏襲）

### ai-products.html（新規ページ）
12件をステータス付きカードで一覧。テキスト主体・エディトリアル。
- Shipped: cross-model-handoff, failforward, Marubatsu Arena, Konosaki(※)
- Near-launch: MyBrainSpec
- Prototype: BreakBias Studio, Ren UX Guard, Typespace, EmojiDrop, InstaLink
- Concept/Lab: Amazon Dynamic UI, Motion
※Konosaki は AIプロダクトではなく会社サイト実績 → 「Client & Venture Work」小区分に置く
各カード: 名前 / 一行タグライン / 2-3文説明 / stack / status badge / リンク(あれば)

### work.html
既存21カード + フィルタに「AI Products」タブ追加（ai-products.htmlへの導線 or カード統合）

### プロジェクト詳細ページ（全ページ共通の直し方）
- 構造: Hero → Tension → Approach → Shift(成果数字) → 厳選ギャラリー → 詳細
- 画像は SITE-PLAN 目標値まで選別。ヒーロー/重要画像を大きく、補助画像は小さく。
  旧サイトのヒーロー画像・掲載順を優先参照。
- 破損参照は代替 or 削除。extraordinary の misc/ パスは extraordinary/ に修正。
- Amplify ライブ iframe → スクリーンショット + 外部リンクに置換。
- YouTube embed は現行フォーマット維持（正しいため）。

### verizon-totalwireless.html
実案件として本格ケーススタディ化（Verizonフォルダ調査結果に基づく）。
BottomPanel03.html を total-wireless-flow 等から探して復旧、なければ該当embedを削除。

### 横断対応（SITE-PLAN P0/P1消化）
- meta description / OG タグ全ページ
- favicon 全ページ確認
- モバイルハンバーガーnav
- 404.html
- index-grad/index-v1/index-v53 の変種ファイルは残置（触らない）

## 実装体制（モデル割当）
- Fable（本体）: 統括・設計・最終レビュー・検証
- Opus: index.html 改修 / ai-products.html 新規 / Verizon ケーススタディ
- Sonnet: プロジェクト詳細ページ20件の改修（並列・1ページ1オーナー）/ 404 / ハンバーガーnav
- Haiku: meta/OG 一括付与などの機械的横断修正

## 検証
- 全ページの img/iframe/href 参照をスクリプトで存在チェック（0 broken を確認）
- ローカルHTTPサーバで主要ページを目視相当の確認（embed生存はoEmbedで確認済み）
- ナビ・footer・言語トグルの全ページ一貫性チェック
