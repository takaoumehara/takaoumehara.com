# Portfolio Reorganization — Design Spec

Date: 2026-07-21
Site: takaoumehara.com v3 (`creativityiseverywhere/v3/`)
Goal: AI 企業（Anthropic / OpenAI / Samsung FutureLab 系）の採用担当・AI 案件クライアントに、AI 時代の作品が 3 秒で伝わる情報設計にする。

## 承認済みの決定事項

1. **4テーマ再編**（ユーザー承認済み）
   - ナビ: `Agentic UX · AI Tools · Product Design · Brand & Visual · About · Contact`
   - 「AI Infrastructure」は不採用（GPU/推論基盤と誤読されるため）。「AI Tools」に確定。
2. **Agentic UX**（ファイル名は `ai-products.html` を維持、H1/ラベルのみ変更）
   - 一行定義を H1 直下に置く: "Designing how humans and AI agents share work"
   - 3層構成:
     - **Flagship**: intentfirst.ai（筆頭）→ Verizon AI Workflow → Amazon Shopping on Fire TV
     - **Agent Products**: Ren UX Guard / BreakBias Studio / MyBrainSpec / Marubatsu Arena / InstaLink（Shipped / Near launch / Prototype の棚）
     - **Lab & Play**: Typespace / EmojiDrop / Motion（"Built with AI agents" 枠）
   - intentfirst のリンクは当面 intentfirst.ai。リデザイン（intentfirst-redesign.vercel.app）が本番化したら差し替え。
3. **AI Tools**（`ai-tools.html` 全面再設計）
   - 3本柱: **Snap Pair**（snap-pair-core から改名）/ cross-model-handoff / **failforward**（AI Products から移動）
   - 各項目: ユーザー視点の「WHAT IT DOES」大活字、種別バッジ（Claude Skill / MCP Server / AI Agent / CLI 等）、統一 SVG アイコン
   - スライド並みの伝達速度（大型タイポ、1画面1メッセージ）
   - Snap Pair 配下に「Built with Snap Pair」レール: Amazon Fire TV（現在）、TypeSpace・ミニデモ・カードゲーム（今後追加）
4. **Product Design**（`work.html` をラベル変更・ブランド系を分離）
   - 残す: ELA Quests, Verizon AI Workflow(クロスリスト・AIバッジ), T-Mobile, CLI Studios, Web3 Wallet, Hummingbird, Credit Card Portal, USAA, EduTrack, Menlo Math, Vocab App, Carnegie, Verizon TotalWireless
5. **Brand & Visual**（`brand.html` 新規）
   - Coca-Cola, KOJI FIZZ, Kitadoko, DNT, XQ, GraffitiWear, Akimatsuri, extra•ordinary, E-Gift, Odell, Value Frontier, **Konosaki**（AI Products から移動、"AI-assisted build" をプロセスとして明記）
6. **index.html**: ヒーロー肩書きを AI 主導に更新 → Flagship 3本柱 → Agentic UX 帯 → AI Tools 帯（3枚）→ Selected Work 帯
7. **Amazon Fire TV ページ**（`projects/amazon-firetv.html`）
   - 順序: ヒーロー（Live Demo 外部リンクボタン追加）→ 注意書き → Product Walkthrough 動画 → Live Simulator（**ビューポート幅100%フルブリード**）→ "Try it yourself" CTA（amazonshoppingon-tv.vercel.app へ新規タブ）→ 既存の Overview 以降
   - 新しい白背景版 demo（`AmazonShoppingFireTV/app/`）を `v3/projects/amazon-firetv/` に一式再同期

## 実施順

1. Amazon ページ再構成＋新デモ同期
2. AI Tools 全面再設計（アイコンシステム、failforward ピース、Snap Pair 改名）
3. サイト再編（ナビ6項目統一、brand.html 新設、カード移動、index 再構成）

## 制約

- ファイル名変更はしない（`ai-products.html` / `ai-tools.html` / `work.html` を維持し、デプロイ済み URL を壊さない）
- 全ページ EN/JP バイリンガル維持（`.t-en` / `.t-jp` パターン）
- ビルドツールなしの静的 HTML を維持
- 中国語は一切使用しない
