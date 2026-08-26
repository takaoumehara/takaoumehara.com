# v4 Monumental Editorial — 英語版再設計仕様

> Written by: brainstorming + superforge-brand + superforge-ui · Last updated: 2026-08-26
> Status: Visual direction approved by the user on 2026-08-26
> Approved preview: `docs/evidence/monumental-editorial-preview.png`

## 目的

Takao Umehara のポートフォリオを、管理画面のような情報密度から、作品とタイポグラフィが主役のエディトリアルな英語サイトへ再設計する。

訪問者が最初の画面で「インターフェース、AIシステム、インタラクティブ体験を横断して設計・実装するプロダクトデザイナー」であると理解し、代表作品を見て、詳細または LinkedIn へ進めることを成功条件とする。

## Surface

- Mode: **Persuade** — 採用担当者、デザインリーダー、依頼者が、作品を開き会話を始めるか判断する表面。
- Sacrificing: 全作品を同じ密度で一画面に並べる一覧性、業務ツール的な常時ナビゲーション、装飾目的のUI部品。
- Scope: **redesign** — 作品名、クライアント、役割、リンクなどの事実と既存の詳細遷移は保ち、見た目と情報階層は置き換える。
- Target: `v4/` の英語版ホーム。
- Out of scope: 日本語版、言語切替、`v3/` の変更、CMS、問い合わせフォーム、未確認の成果数値、ケーススタディ本文の全面改稿。

## 解決する問題

現行の v4 は、次の理由で参考方向と衝突している。

1. 青いアクセント、モノスペース、バッジ、技術タグ、複数のボタンが、作品サイトよりプロダクト管理画面に見せている。
2. 5つの全画面 Featured と、その後の全カテゴリカードが同じ強さで続き、何が最重要か分からない。
3. CSS生成の疑似ビジュアルや画像なしの代替面が、実作品よりUIそのものを主役にしている。
4. モバイルはデスクトップの情報を一列へ縮めた構成で、最初の作品に到達するまでの判断量が多い。
5. 太い見出し、カード境界、複数のコントロールが、参考資料の「巨大で軽い文字、紙、写真、余白」という強さを打ち消している。

## ブランド座標

### VVA Matrix

- Tone Register: **TR-1 Monolithic Restrained** — 短く、正確で、誇張しない英語。
- Visual Purity: **VD-1 Monolithic Minimalist** — 一つの地、一つの文字色、作品画像だけが色を持つ。
- User Stance: **UA-2 Co-Builder Peer** — 権威を演出せず、仕事の事実と考え方を同じ目線で見せる。
- Sensory Tempo: **ST-3 Rhythmic Fluid** — 常時動かさず、初回表示と作品遷移だけを明確なリズムで見せる。

人格は **precise / editorial / assured** の3語とする。

## Design DNA

Route: **A — supplied references**

### Sources

| 参照 | 出所 | 取り入れるもの | 取り入れないもの |
|---|---|---|---|
| Dash Digital Studio live site | `https://dashdigital.studio/` | 巨大な左揃え見出し、暖かい紙色、2列の実画像、細い罫線、極小ナビ、余白による階層 | ロゴ、文章、写真、作品名、登録商標表現、固有のページ構成 |
| `dashdigital.mp4` | `/Users/takao/Desktop/dashdigital.mp4` | 黒い舞台と大きな作品面の交互配置、2〜7秒の静かな滞在と短い切替、ロゴだけの呼吸点 | 映像のカット順、クライアント素材、同じブランド演出 |
| Dash design extraction | `DESIGN (4).md`、`theme (4).css`、`tokens (4).json`、`variables (4).css` | Bone / Carbon Black の役割、4px基準、角丸と影を排した面、表示文字と本文の極端な倍率差 | Founders Grotesk の無断利用、抽出値の機械的コピー、全要素を低い line-height にすること |
| Existing v4 | 現在の `v4/` | 確認済みの作品情報、5カテゴリ、履歴対応の詳細表示、キーボード操作、アクセシビリティ基盤 | 青いアクセント、モノスペース中心のメタ、カードUI、技術タグ、疑似ダッシュボード表現 |

### Extracted system

- 構造: 極小ヘッダー → 70〜90vhの主張 → 代表作品6件 → Practice → 全作品インデックス → About → Contact。
- 空間: 4px基準。小:中:大の差は約 `1:3:8`。主要要素の前後へ 80〜144px の余白を置く。
- タイポ: 使うサイズは meta / body / project title / display の4段。階層は主にサイズと空間で作り、ウェイト差は小さくする。
- 色: UIは Bone と Carbon Black。黒い遷移面を1色追加する。色彩は作品画像内にのみ許可する。
- モーション: soft ではなく **rhythmic crisp**。初回表示と作品を開閉する遷移だけを動かし、スクロールごとのフェードは行わない。
- 画像: 角丸・枠・影・オーバーレイなし。代表作品は実画面または実制作物を同じ比率で大きく見せる。

### Deliberate divergence

- 参考サイトの見出し文、6項目のナビ、作品カードの固有構成はコピーしない。
- Takao の5領域を、代表6件とカテゴリ別 Work Index の二階層へ変換する。
- Founders Grotesk は使わず、既存の合法的な Instrument Sans variable を regular 主体で再調整する。
- 参考サイトより本文の line-height と操作領域を広げ、WCAG 2.2 AA と44pxタッチ領域を守る。
- 動画の黒いフレームは常設のダークテーマではなく、作品を開く一瞬の空間遷移として使う。

## 検討した3方向

### A. Monumental Editorial — 採用

- コンセプト: 紙のような明るい面に、巨大な主張と実作品を置く。
- 押す軸: タイポグラフィ。
- やらないこと: 青、影、角丸カード、モノスペースの装飾利用、技術タグ、常時アニメーション。
- 費用: 中。既存構造を簡潔に再編し、実作品画像と一つの遷移を丁寧に仕上げる。

### B. Black Reel — 不採用

動画の印象は最も強いが、全体を黒くすると作品ごとの色と採用判断に必要な一覧性が弱くなる。常時大きなメディアを使うため通信量も増える。

### C. Quiet Archive — 不採用

罫線リスト中心で高速かつ読みやすいが、Takao のインタラクティブ／ブランド領域を実画像で証明する力が不足する。

## 情報設計

### Header

- 左: `TAKAO UMEHARA`。トップへ戻る。
- 右: `WORK / PRACTICE / ABOUT / LINKEDIN ↗`。
- デスクトップは56〜64pxの非固定ヘッダー。blur、半透明、下影を使わない。
- モバイルは名前と `MENU +`。開くと同じ Bone 面の全幅メニューを表示する。
- LinkedIn は `https://linkedin.com/in/takaoumehara` を新規タブで開き、その事実を読み上げでも伝える。

### Hero

- 見出しは承認済みの次の英語を使用する。

  `A PRODUCT DESIGNER BUILDING INTERFACES, AI SYSTEMS & INTERACTIVE EXPERIENCES.`

- 小さな補足は `NEW YORK / PRODUCT DESIGN / CREATIVE TECHNOLOGY`。
- デスクトップは70〜90vhで、見出しが横幅の約85%を占める。
- モバイルは不自然な単語分断を避け、4〜7行で読めるサイズへ個別に組み直す。
- Hero 内にボタンを置かない。下に続く作品そのものを行動導線にする。

### Selected Work

代表6件を2列の大きな画像グリッドで表示する。選定は5領域を最低1件ずつ含み、最初の画面で現在の中心領域を優先する。

1. Resona — Interactive Experience
2. Verizon AI Workflow — AI Products
3. superforge — AI Tools
4. CLI Studios — Product Design
5. Coca-Cola — Brand Experience
6. Rakugaki Jam — Interactive Experience

各項目は次だけを表示する。

- 実画像
- project title
- discipline / role の短い1行
- year / status

要約、技術タグ、二つ目のCTAは一覧では表示しない。カード全体を一つの操作対象にし、詳細で情報を展開する。

画像未登録の Selected Work は、実際の公開プロダクトまたは既存ケーススタディから新しいスクリーンショットを取得する。CSSで作った抽象図形を代表画像として残さない。

### Practice

一つの大きなステートメントで、デザインと実装を同じ仕事として扱う姿勢を伝える。新しい実績数値や誇張表現は追加しない。本文は最大2段落、65ch以内。

### Work Index

全15件を5カテゴリの罫線リストへ配置する。Selected Work と重複する作品も正規のカテゴリ位置へ残す。

各行は `Project / Category / Year / Open +`。デスクトップは横一列、モバイルは2〜3行へ再構成する。交互色、カード背景、角丸を使わない。

### About / Contact

- About は現在確認済みのプロフィールから、現在の専門領域と仕事の進め方を2段落以内で編集する。
- Contact は巨大な `LET'S TALK.` と LinkedIn 導線で閉じる。
- 確認済みメールアドレスがプロジェクト内にない場合は作らない。

## タイポグラフィ

- Family: `Instrument Sans` variable。表示と本文を一書体で統一する。
- Display: weight 400、幅をやや condensed、`line-height: 0.82–0.88`、tight tracking。
- Project title: weight 400、24〜36px。
- Body: 16〜18px、weight 400、`line-height: 1.5`、45〜75ch。
- Meta / navigation: 12〜14px、weight 400、uppercase。モノスペースは使わない。
- ウェイトで威圧せず、サイズ差と余白で強さを作る。

## 色・面・形

- Ground / canvas: Bone `#f0f0f0` を基準にする。
- Primary ink: Carbon Black `#2a2a2a`。
- Transition field: near black。作品を開閉する瞬間と詳細の限定面だけに使う。
- Hairline: ink の低い透明度ではなく、測定可能なニュートラル境界色をトークン化する。
- UIアクセント色は持たない。フォーカスは色だけに依存せず、太い二重アウトラインまたは反転で示す。
- カード、画像、主要面の radius は0。ボタンが必要な場合だけ完全な pill を許可するが、一覧では使わない。
- shadow、gradient、glass、glow、背景blurを禁止する。

## モーション

### Initial reveal

ヘッダー、Heroの行、補足を一度だけ順番に表示する。表示は transform と opacity のみ、全体550ms以内。スクロールを待たせず、入力をブロックしない。

### Project hover / focus

- 画像の crop を最大2%だけ変化させる。
- タイトルと `Open +` の反転または罫線変化を100ms以内に開始する。
- hover にしか存在しない情報を作らない。

### Project open / close

1. 選択した画像面から黒い field が画面を覆う。
2. project title を一瞬だけ大きく表示する。
3. 既存の詳細内容を同じタイトル位置から開く。

入口420〜480ms、出口320〜360ms。transform と opacity のみを使い、既存のURL履歴、Esc、Back、フォーカス復帰を維持する。

`prefers-reduced-motion: reduce` では初回演出と黒い中間フレームを省略し、即時に最終状態を表示する。

## 状態とフォールバック

- Default: Bone 面、実画像、全コントラスト文字。
- Hover: 画像cropと罫線／文字の反転。
- Focus: 3px以上の非色依存アウトライン、4px offset。
- Active: 最大0.99 scale、120ms以下。
- Disabled: 今回の主要導線には設けない。リンク切れをdisabled表示で隠さず修正する。
- Loading: 200msを超えた画像だけ固定比率の静的な構造面を表示する。
- Error: 画像名と作品名を含む高コントラスト代替面を表示し、リンクは残す。
- Empty: カテゴリに作品がない場合は非表示にせず、短い説明と v3 の完全版リンクを表示する。
- JavaScript無効: 全作品は既存のhrefへ通常リンクとして移動できる。

## レスポンシブ

- Desktop `>1024px`: Heroは巨大な横組み、Selected Workは2列、Work Indexは横一列。
- Tablet `640–1024px`: Selected Workは2列を維持し、Heroと索引の文字量を縮める。
- Mobile `<640px`: Hero、作品、索引を1列にし、情報順を `image → title → category/year` に固定する。
- 390pxでHeroの主張と最初の作品画像の入口が最初の約1.2画面以内に見えることを目標にする。
- 320px、200%テキスト、400%ズームで横スクロールと操作欠落を起こさない。

## アクセシビリティ

- 目標はWCAG 2.2 AA。既存のskip link、意味のあるランドマーク、キーボード操作、dialogのフォーカス管理を維持する。
- 主要タッチ領域44px以上。極小ナビの見た目と操作面の大きさを分離する。
- Body 4.5:1、large text 3:1、UI境界／フォーカス3:1以上を実測する。
- 画像altは作品内容を説明し、隣のタイトルを繰り返さない。
- 色、画像変化、モーションだけで状態を伝えない。
- VoiceOver実機確認を行えない場合は未確認として記録し、自動検査だけで適合を宣言しない。

## パフォーマンス予算

- 1画面目で内容を理解できるまで: ローカル1秒以内、mid-range mobile 4Gで2.5秒以内を目標。
- 入力への視覚応答: 100ms以内。
- 初期HTML/CSS/JS: 合計150KB以内。
- 1画面目の転送量: 1MB以内。Selected Workの先頭以外はlazy-loadする。
- 自動再生動画、3D、canvas render loop、smooth-scrollライブラリは追加しない。

## 実装境界

- `index.html`: 新しい情報階層と英語コピー。
- `styles.css`: Monumental Editorial tokens、layout、states、responsive、motion。
- `scripts/project-data.mjs`: 既存の事実を保持し、featured orderと表示用の短いmetaだけを整理する。
- `scripts/app.mjs`: menu、project transition、dialog/history/focus restoration。
- `assets/thumbs/*`: 実画像のみ。既存資産を上書きせず、新規キャプチャは別名で保存する。
- `docs/brand.md`、`docs/design.md`、`docs/design.html`: 同じトークンと決定を記録し、同じターンで同期する。
- `tests/*`: 既存の事実・履歴・操作テストを新しい構造へ合わせ、英語版だけを検証する。

`v3/` は変更しない。現在の dirty worktree にあるユーザー変更は所有者不明として保持し、明示的に確認できない変更を破棄しない。

## 検証

1. Nodeの構造／リンク／データテスト。
2. Playwrightで1440×1000、390×844、320pxを確認。
3. 全ページのスクリーンショットと、詳細を開いた状態を目視比較。
4. keyboardのみで Header → Selected Work → Work Index → About → LinkedIn → project open/close/Back を操作。
5. axe、contrast、forced-colors、reduced-motion、200% text、400% zoom。
6. cold serverとfresh browser contextで主要フローを再実行。

## 受け入れ条件

- 承認済みプレビューと同じ空間・タイポグラフィ・画像リズムがデスクトップで再現される。
- UIに青、gradient、shadow、glass、rounded card、技術tag chipが残らない。
- 代表6件が実画像で大きく表示され、全15件がWork Indexから到達できる。
- 英語版のみが表示され、日本語切替や未完成の日本語UIを追加しない。
- 5カテゴリ、About、LinkedIn、各プロジェクトの既存リンクと事実が維持される。
- project open、Esc、Back、direct URL、focus restoration、reduced motionが動作する。
- デスクトップ、390px、320pxで横スクロールがなく、主要操作が44px以上である。
- 自動検査と実行検証の結果、未確認事項、スクリーンショットを `docs/verification.md` に記録する。
