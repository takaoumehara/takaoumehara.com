# AI Window Deck (Windows Resizer) — ケーススタディ素材

Source: 本人提供（ヒアリング指示書 v2 の回答）
Updated: 2026-08-07
実装先: `projects/ai-window-deck.html`（スパイン v2 / Variant A）

> この文書は**入力**であって出力ではない。ページ側で文字数・重複の都合により
> 変更した箇所は §13「ページ実装時に変えた点」に全部記録してある。

---

## 0. このプロジェクトの見せ方

- **A: 証拠先行型** — 実際の画面、手書きワイヤーフレーム、D&D・リサイズ操作の
  UIコンポーネント画像が揃っているため。
- **ただし現時点で素材はリポジトリに未搬入**（本人が後で渡す）。ページは Evidence の
  枠と説明文を先に確定させ、画像スロットを `is-pending` プレースホルダで置いてある。
  → §8 の受け入れパスに置けば、それだけで表示に切り替わる。

## 1. 基本情報

| 項目 | 内容 |
|---|---|
| プロジェクト名 | AI Window Deck / Windows Resizer |
| クライアント/対象 | Personal Project（自主開発） |
| 自分の役割 | Lead Designer, Full-stack Extension Developer, Prompt Engineer |
| 制作年・期間 | 2026年（約2週間） |
| 公開リンク | リポジトリ `takaoumehara/ai-window-deck`（Chrome Web Store 公開準備中） |
| 機密上の制約 | 無し |

## 2. 一覧カード用の要約

- カード用タイトル: **AI Window Deck**
- カテゴリタグ: `Chrome Extension` / `UI/UX Design` / `Productivity`
- 1文の説明: 複数モニター環境の大量のタブとウィンドウを、数値入力ではなく
  ドラッグで格子レイアウトに割り付ける Chrome 拡張機能。

## 3. Hero スライド

- 大見出し（EN）: A layout you can see, not a form you have to **fill in**.
- 大見出し（JP）: 入力する設定画面から、**見て置く**キャンバスへ。
- リード文（EN）: Dozens of tabs across several monitors, and the only way to place
  them was to type numbers into a form — a form that wiped every window already
  registered. I rebuilt the setup screen as a two-pane canvas: real monitors on the
  left, a live split grid on the right, drag a window onto a cell to assign it.
  Registration moved into its own modal, so saved work is never overwritten again.
- リード文（JP）: 複数ディスプレイに散らばる大量のタブを配置する手段が、フォームへの
  数値入力しか無かった。しかもその画面は、開くたびに登録済みのウィンドウを全消去した。
  私は設定画面を2カラムのキャンバスに作り直した — 左に実在のモニター、右にライブの分割
  グリッド、枠へドラッグすれば割り付く。登録はモーダルに分離し、保存済みのデータが
  上書きされることは無くなった。
- チップ: `Manifest V3` / `Vanilla JS` / `Grid Engine`

## 4. Tension スライド

**「前」側**

- タグ: Where it started / 出発点
- 見出し: A form that erased your work / 開くたびに消える設定画面
- 本文: 設定画面を開くたびに既存の登録内容が全消去され、テキストファイルからの
  再貼り付けを強いられていた。さらにポップアップ表示では幅200pxに要素が縦潰れした。
- チップ: 画面崩壊 / 全消去事故 / 導線の分断

**「後」側**

- タグ: What it became / 再設計後の姿
- 見出し: A canvas you drag onto / 手で置ける、生きたキャンバス
- 本文: 実在するモニターカードの選択、アコーディオン型ライブラリからの D&D、
  モーダル経由の安全な一括追加により、1件も失わずに画面を分割配置できるようになった。
- チップ: 実モニター検知 / スマートD&D / リサイズ自在

## 5. Approach スライド

- 大見出し（EN）: Visual first, **dynamic after**.
- 大見出し（JP）: 視覚が先、**自動適合は後**。
- リード文（EN）: Users did not need a numeric form; they needed to see their own
  screens and the shape of the windows on them. I made the physical display and the
  drag-and-drop slots the interactive centre of the product, and pushed the grid maths
  behind them — the layout adapts to whatever monitors are attached, but only after
  the user has placed things by hand.
- リード文（JP）: 必要だったのは数値フォームではなく、自分の画面と、その上の窓の形が
  見えることだった。物理ディスプレイと D&D の枠をプロダクトの中心に据え、グリッド計算は
  その裏に回した。レイアウトは接続中のモニターに合わせて自動で適合するが、それは
  ユーザーが手で置いたあとの話にした。

## 5.5. Structure スライド

**再設計前の構造**

```
Step 1  ディスプレイ選択（テキストの数字のみ）
Step 2  グリッド分割選択（固定 2x2 / 4x2 のラジオボタン）
Step 3  ウィンドウアサイン（巨大テキストエリアに直貼り）
```

壊れていた点: 登録ボタンを押した瞬間に既存カードが全消去され、やり直しが発生した。
ポップアップ画面では縦スクロールがロックされていた。

**再設計後の構造**

```
Step 1  ディスプレイ選択カード（実在のモニター名を視覚表示）
Step 2  2カラム統合ワークスペース
          左: Windows ライブラリ（アコーディオン）
          右: ライブ分割キャンバス（D&D / リサイズ）
Sub     ウィンドウ登録モーダル（単一登録 / テキスト一括追記）
```

命名変更: 「Step 3 テキスト貼り付け」→「Register a window モーダル」。
理由: 既存データを上書き消去せず、安全に追記登録できるように分離したため。

一番言いたいこと: 画面の概念を「数値」から「視覚的なキャンバス」に変え、
データの消失事故をゼロにした。

## 6. Moves スライド

| # | 見出し | 説明 |
|---|---|---|
| 01 | 手書きワイヤーフレームからのUI構造抽出 | 自分で描いた3枚のスケッチから、画面配置と D&D の核となるメンタルモデルを定義した |
| 02 | 本物のモニター名・位置の自動検知 | `chrome.system.display.getInfo()` から実在のモニター名を取得し、ダミー表示を排除した |
| 03 | ドロップ位置に応じたスマートアサイン＋自動増枠 | 分割枠へのドロップでアサイン、枠外の余白へのドロップで画面数を自動的に増やす |
| 04 | リサイズハンドルとレイアウト検索 | 各仮想ウィンドウに `← \| →` を置き、ヘッダーにレイアウト検索・作成のドロップダウンを追加した |

## 6.5. Craft スライド

**判定: AIを使った**

- AIに何をさせたか: DOM構築、CSS Dynamic Grid の計算ロジック（`computeDynamicLayout`）の
  実装、レスポンシブ崩れ（`body.as-popup` の幅 `780px` 固定）のデバッグ、
  レイアウト検索ドロップダウンの設計。
- AIが出した案のどこがダメだったか: 生成された CSS が `.modal-overlay` に
  `display: flex;` を直接指定したため、HTML の `hidden` 属性が打ち消され、
  拡張機能の起動時に画面全域がモーダルで塞がれる致命的バグになった。
- そこに人間として何を足したか: 手書きワイヤーフレームを3枚描き直し、UIルール
  （アコーディオン編集、空きスペースへのドロップで枠を自動増加、リサイズハンドル）を
  厳格に指示して修正させた。
- 試した案の数と選定基準: 3案。直感性と**データ安全性（既存データを消さないこと）**を
  最優先の基準にした。

**採用しなかった選択肢**

| 案 | 魅力 | 捨てた理由 |
|---|---|---|
| ポップアップ内の多段固定フォーム | 実装が極めて簡単でコード量が少ない | Chrome ポップアップの狭い領域で破綻し、スクロール地獄になる |
| 全テキスト入力によるプロンプト起動 | CLI ライクで入力だけで完結する | モニター間の位置関係とカードの配置が想像できない |

## 7. Evidence（証拠）

| グループ | 見出し | リード文 | 素材 |
|---|---|---|---|
| 1. 手書きスケッチ | 手書きの想いを、そのままコンポーネントに | 思考スケッチを忠実に再現し、操作に迷わない配置にした | 手書きワイヤーフレーム 3枚 |
| 2. 実モニター検出 / キャンバス D&D | 画面を直接触って配置する | 接続中のモニター名をリアルタイムに検知し、D&D で枠へ割り付ける | モニターカード・キャンバス D&D スクショ |
| 3. リサイズ / レイアウト検索 | 細部まで届く操作性 | 各枠の `← \| →` によるリサイズと、ドロップダウンからの検索・新規作成 | リサイズハンドル・ドロップダウン スクショ |

> ページ実装では **2 と 3 を1枚のスライドに統合**し、内部を `gallery-label` で
> 2ブロックに分けている（スライド枚数を10枚に収めるため。§13 参照）。

## 8. メディア素材リスト — 受け入れパス

画像はまだリポジトリに入っていない。**下のファイル名でコミットすれば、
`projects/ai-window-deck.html` を編集せずに表示に切り替わる。**
（`is-pending` のプレースホルダを `<img>` に差し替える1行だけは必要。
差し替え手順は HTML 内のコメントに書いてある。）

| 種別 | 有無 | 取得方法 | 受け入れパス |
|---|---|---|---|
| Hero背景画像 | 既存あり（4枚） | 本人が渡す | `assets/ai-window-deck/hero.jpg` |
| UI screenshot | 既存あり（3枚） | 本人が渡す | `assets/ai-window-deck/ui-monitors.png`, `ui-canvas-dnd.png`, `ui-resize.png`, `ui-layout-search.png` |
| Dark UI shot | 不明・要確認 | — | — |
| Photo | 無い | 未定（相談） | — |
| Diagram（手書きワイヤー） | 既存あり（3枚） | 本人が渡す | `assets/ai-window-deck/sketch-1.jpg` 〜 `sketch-3.jpg` |
| Before/After動画 | 無い | 未定（相談） | — |
| Brand asset | 不明・要確認 | — | `assets/ai-window-deck/icon.png` |

本人環境の元パス（参考・リポジトリ外）:
`brain/tempmediaStorage/media__1785977159526.png` ほか /
`/Users/takao/.gemini/antigravity-ide/brain/5071b6a6-391d-4144-b4d6-fb786adeb720/`

## 9. Proof（成果）

- 数値化できる成果: **不明・要確認**（Chrome Web Store 公開準備中のため実測値なし）。
- 数字が無い場合の1文: 「この設計は、複数モニターと大量のタブを毎日行き来する
  開発者から、レイアウトを組み直すたびの再入力作業を無くした。」
- 使った技術・ツール・手法: Chrome Extension Manifest V3 / Vanilla CSS /
  Dynamic Grid Engine (`computeDynamicLayout`) / Chrome Display API

## 10. Retrospective スライド

1. **初期レスポンシブの破綻** — ポップアップ表示（`800x600`）とフルページ表示の
   切り替えで、CSS の幅固定漏れによるレイアウト崩れが出た。コンテナへの明確な幅定義の
   重要性を再確認した。
2. **超多分割時の視認性** — 16分割以上の極端なレイアウトで、仮想カード内の URL テキストの
   可読性をどう保つかは、まだ答えを持っていない。

## 11. Closing

- 見出し（EN）: Let people **place** it, and the numbers stop mattering.
- 見出し（JP）: **置ける**ようにすれば、数値は要らなくなる。

## 12. アクセント色

Cobalt Blue `#2F5BFF`（tint `#8aa6ff`）。

---

## 13. ページ実装時に変えた点（本人確認したい差分）

| 箇所 | 提供された案 | ページでの実装 | 理由 |
|---|---|---|---|
| Hero 見出し EN | "Multi-window chaos to structured workspaces, starting with structure." | "A layout you can see, not a form you have to **fill in**." | 68字で上限60字を超過。また "structured…structure" が同語反復 |
| Hero リード | 「3ステップで完成」「8種類以上の動的レイアウト」 | **どちらも書いていない** | §5.5 の新構造は Step1＋2カラム＋モーダルで3ステップと数え方が合わない。8種類の出典も未確認。§14 で質問 |
| Approach 見出し EN | "Visual layout first, then dynamic fits."（39字） | "Visual first, **dynamic after**." | 強調語1つのルールに合わせて圧縮 |
| Evidence | 3スライド | 2スライド（グループ2と3を統合） | Variant A の枚数上限12枚を守り、素材待ちの空スライドを増やさないため |
| Proof | 数値なし | 数値グリッドを置かず、1文＋技術タグのみ | 「作った量」を数字に見せかけないため（`docs/case-study-format-audit.md` §3-3） |
| Closing EN | "Fix the structure, and the visual flow follows." | "Let people **place** it, and the numbers stop mattering." | `cli-studios.html` の Closing が "Fix the structure, and the surface follows." で、ほぼ同一の締めが2ページ並ぶため |

## 14. 本人に確認したいこと

1. **「8種類以上の動的レイアウト」は実装済みの数か、見込みか。** 実測なら Proof に置ける。
2. **ユーザー体験を「3ステップ」と呼んでよいか。** §5.5 の新構造だと2ステップ＋モーダルに見える。
3. 手書きワイヤーフレームは3枚とも公開してよいか（個人情報・社名の写り込みの有無）。
4. Chrome Web Store の公開URLが出たら Hero のリンクを差し替える。現状はリポジトリのみ。
