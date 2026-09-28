# モーション・アーカイブ — これまでに作ったローディング/トランジション全部

> Written by: R (research + plan) · 2026-09-27 · 対象: Motion Lab 企画の一次資料
> 目的: Takao が「今まで頑張って作ったローディングアニメを再利用したい」と言ったので、
> このリポジトリの現在のコードと git 全履歴（`git log --all`、213 commits）を掘って、
> 存在した/存在するローディング・起動・トランジション・テキスト演出・メディア演出を
> 洗い出した。**このドキュメントに書いてある実装は、すべて実際にコード（現存 or 削除済みの
> diff）として確認したものだけ**。ゲーム本体（Unity 等、外部リポジトリ）の中身は見えないので
> 「不明」と明記し、憶測は書いていない。

各項目のフォーマット: **名前** — 場所 — 何をするか — 手法 — 現存/削除済み — 再利用度 (high/med/low) — Motion Lab へのパラメータ化案。

---

## A. サイト全体の起動 (boot / intro)

### A1. レールの起動シーケンス（オドメーター・カウントロール + 行スタガー）
- **場所**: `src/styles/transitions.css` L126–177（`html[data-boot]` ブロック）、
  `src/components/Sidebar.astro`（インラインスクリプト、`data-boot` / `data-mo-intro` を
  セッション初回だけ立てる部分、L93–121）
- **何をするか**: タブのセッションで最初の読み込みだけ（`sessionStorage` の `tu-booted` で判定）、
  左レールの各カテゴリの「件数」が 0 から実数へ**カウントアップ**し（CSS `@property --odo-n` +
  `counter()`）、見出し行とリンク行が上から順に 15ms 刻みでせり上がる（`boot-row` keyframes,
  `translateY(4px)→none`）。実際のテキストは常に本物の数字のまま、描画用の疑似要素だけが
  カウントする（スクリーンリーダー・コピーに影響しない）。
- **手法**: CSS keyframes + CSS Custom Properties（`@property` で整数を animate）+ `counter()`。
  JS 不要（発火は Sidebar.astro のインラインスクリプトが `data-boot` 属性を立てるだけ）。
- **現存/削除済み**: **現存**（現行サイトの起動演出そのもの）。
- **再利用度**: **high**
- **Motion Lab パラメータ化**: 「カウントロール」プリセット（数値の桁数・速度・イージング）、
  「行スタガー」プリセット（間隔ms・方向・移動量px）。`?lab=1` パネルの数値ノブにそのまま載る。

### A2. ペインの箱優先チョレオグラフィ（box → media → text）
- **場所**: `src/scripts/motion.js`（`revealUnit`, `choreograph`, `intro`, 全体）
- **何をするか**: 初回ロードでもクライアントサイド遷移でも、ペイン内の各セル
  （`.bento-cell` 等）が「空の箱（背景色/画像枠）→ メディアがクリップワイプで現れる →
  見出し/短文がスクランブル解読、長文はせり上がり」の順で、セルごとにランダムな遅延
  （0–140ms）を持って再生される。画面外のセルは `IntersectionObserver` で画面に入った
  ときに一度だけ再生。ポインタ押下/キー入力があると即座に全部フィニッシュする
  （`finishAll`）。
- **手法**: Web Animations API（`element.animate()`）、`fill: "backwards"`、
  `IntersectionObserver`、`requestAnimationFrame`（テキストのスクランブルのみ）。
- **現存/削除済み**: **現存**（2026-09-26, commit `6f1396a` で今の形に。旧「投げ込み/投げ返し」
  view-transition モーフを置き換えた — 下記 B2 参照）。
- **再利用度**: **high**（このドキュメントの中で最も再利用価値が高い実装。Motion Lab の
  「タイムライン」概念そのもの）
- **Motion Lab パラメータ化**: ユニット単位の box→media→text の各フェーズの持続時間・
  ステップ数・遅延レンジ・イージングを JSON 化すれば、そのまま `motion.json` の骨格になる
  （実際、M2 エージェントが今まさにこれを `src/data/motion.json` 化している — §Phase 0 参照）。

### A3. 「レンズ」ブラー・イン（boot-lens） — **削除済み**
- **場所（削除前）**: commit `1eccef2`（`6f1396a` の直前）の `src/styles/transitions.css`
  `@keyframes boot-lens`
  ```css
  @keyframes boot-lens {
    from { opacity: 0; filter: blur(4px); transform: scale(1.012) translateY(4px); }
    60%  { opacity: 1; }
    to   { opacity: 1; filter: blur(0); transform: none; }
  }
  ```
  `html[data-boot] [data-boot-i]` に `360ms` で適用、`--boot-i` ごとに 32ms ずつ遅延。
- **何をするか**: 起動時、各要素がわずかにボケて拡大した状態から、ピントが合うように
  シャープになりながら定位置へ収まる。カメラのフォーカスが合う感覚。
- **手法**: CSS keyframes（`filter: blur` + `transform: scale/translateY`）。
- **現存/削除済み**: **削除済み**（`6f1396a`, 2026-09-26。理由: サイトのモーション規則が
  「transform・opacity・clip-path のみ、shadow も blur も禁止」に統一されたため、
  `filter: blur` を使うこの演出は退場した）。
- **再利用度**: **med**（現行サイト本体には使えない = ルール違反だが、Motion Lab は
  「blur ありの世界を試す」実験場になり得るので、"forbidden but interesting" な比較用
  プリセットとしては価値が高い）。
- **Motion Lab パラメータ化**: 「フォーカス・イン」プリセット（blur px, scale, 遅延カーブ）。
  Lab 上で「サイト本番のルール（blur 禁止）」と「blur あり」を A/B 比較する良い題材。

### A4. Amazon Fire TV の起動スプラッシュ → オンボーディング
- **場所**: `public/projects/amazon-firetv/js/app.js` L807–920（`boot`, `dismissOnboard`）、
  `public/projects/amazon-firetv/css/style.css` L711–823（`.onboard`, `.splash`）
- **何をするか**: アプリが裏で隠れたまま描画され、まず全画面スプラッシュ（ロゴ + 不定進捗
  バー）が 900ms 出る → `.splash.gone`（opacity/visibility フェード）→ コンセプト説明の
  オンボーディング画面が、コピーの各行が 0.85s から 0.1s 刻みで下から順にフェード＋せり上がり
  （`.ob-copy > *:nth-child(n)` に `animation-delay`）で現れる。QR コードのペア待ち中は
  グレーの角丸ボックスが明滅するスケルトン（`.ob-qr-wait`）。
- **手法**: 純 CSS keyframes（`@keyframes load` = 不定進捗バー、`translateX(-100%→380%)`
  ループ; `@keyframes obIn` = fade+translateY; `@keyframes obPulse` = opacity 明滅）+
  JS のタイマー/クラス切り替え（`setTimeout`, `classList.toggle`）。
- **現存/削除済み**: **現存**（`public/projects/amazon-firetv/` は今もリポジトリ内、
  実際にビルド/デプロイされているプロトタイプ）。
- **再利用度**: **high**（不定進捗バー、スプラッシュ→オンボーディングの2段階構成、
  スケルトンパルスの3点セットがそのまま Motion Lab の「クラシック・ローダー」プリセット
  ファミリーになる）。
- **Motion Lab パラメータ化**: 「不定進捗バー」プリセット（幅%・速度・イージング・往復か
  ループか）、「スケルトン・パルス」プリセット（明滅速度・不透明度レンジ・角丸）、
  「段階的コピー登場」プリセット（行数・間隔・移動量）。

---

## B. ページトランジション

### B1. サムネイル→ヒーローの Cross-document View Transitions（現行）
- **場所**: `docs/page-transitions.md`（設計ドキュメント）、`tests/page-transitions.test.mjs`
  （テスト）。実装は各詳細ページ `<head>` 内 `<style>` の `[data-vt-hero]`、一覧側の
  カード画像枠に付く `view-transition-name: hero-media`。
- **何をするか**: カードを押すと、押されたサムネイル（3:2）がそのまま詳細ページのヒーロー帯
  （全面）へ**育つ**。ブラウザの Cross-document View Transitions
  （`@view-transition { navigation: auto }` + `pageswap` / `pagereveal`）を使い、JS で
  画面を差し替えず、通常のページ遷移のまま前後2枚のスナップショットをブラウザが繋ぐ。
  `object-fit: cover` で縦横比の違いを潰さず切り取る。名前は文書内で一意でなければならず
  （重複すると遷移全体が捨てられる）、`prefers-reduced-motion` では名前を付けずただの遷移になる。
- **手法**: **View Transitions API（同一名前を前後ページで共有する shared-element morph）**。
  JS 最小限（`pageswap` イベントで行き先に一致するカード1枚だけに名前を付ける）。
- **現存/削除済み**: **現存**。
- **再利用度**: **high** — Phase 2「トランジション・ラボ」の主役そのもの。
- **Motion Lab パラメータ化**: morph の duration・easing・object-fit・境界の border-radius
  維持、名前の付け外しタイミング（pageswap/pagereveal のどちらで付けるか）を JSON 化。

### B2. 「投げ込み/投げ返し（Throw / Return）」同一文書内 View Transition モーフ — **削除済み**
- **場所（削除前）**: commit `1eccef2` の `src/scripts/site.js`
  「── Throw / Return: the pressed thumbnail grows into the teaser ──」節、
  および同 commit の `src/styles/transitions.css`
  （`[data-vt-hero] { view-transition-name: hero; }`,
  `::view-transition-group(hero) { animation-duration: 440ms; ... var(--ease-throw); }`,
  `hero-fade-in` / `hero-fade-out`）
- **何をするか**: Astro のクライアントサイド・ルーター上で、押された要素（レール行の
  `.side-thumb` またはグリッドカードの `.grid-media`）に `view-transition-name: hero` を
  動的に付け、遷移後に外す。詳細ページへ「投げ込む」ときはそのサムネイルが詳細ページの
  ティーザーへ育ち（440ms, `var(--ease-throw)`）、詳細ページから戻る（"return"）ときは
  現在のレール行のサムネイルへ**逆再生的に**縮む。1文書に `hero` という名前を1つしか
  同時に持たせない排他制御（`thrown` 変数 + `astro:before-preparation` /
  `astro:before-swap` / `astro:after-swap` の3フックで管理）。レールの旧スナップショットは
  非表示（`::view-transition-old(side){display:none}`）にして、穴あきが見えないようにする。
- **手法**: **同一文書内 View Transitions**（Astro ClientRouter + `view-transition-name`
  の動的付け替え）。
- **現存/削除済み**: **削除済み**（commit `6f1396a`, 2026-09-26。コミットメッセージ
  「drop the throw/return morph」。理由: box-first チョレオグラフィ（A2/上記）に一本化した
  ため、隣接して存在していた2つの遷移演出を1つに絞った）。
- **再利用度**: **high** — Phase 2 が求める「shared-element morphs, direction-aware」を
  ほぼそのまま実装していた実例。復元候補として最有力。
- **Motion Lab パラメータ化**: 「投げ込み/投げ返し」プリセット（duration・イージング・
  受け側と送り側の要素セレクタ・往復対称性のオン/オフ）。

### B3. 方向つきルート・トランジション（data-nav-dir up/down） — **削除済み**
- **場所（削除前）**: commit `1eccef2` の `src/scripts/site.js`
  「── Direction: the pane travels the way you moved down or up the rail ──」節、
  `src/styles/transitions.css` の
  `html[data-nav-dir="down"]::view-transition-old(root){ animation: nav-out-up ... }` 等
- **何をするか**: レール上のリンクを上から下へ辿ったか下から上へ辿ったかを
  （リンクの並び順のインデックス比較で）判定し、`html[data-nav-dir]` に `"down"`/`"up"` を
  セット。ルート要素の view-transition アニメーションがその方向に応じて
  `nav-out-up`/`nav-out-down`/`nav-in-from-below`/`nav-in-from-above` に切り替わる
  （常に「動いた方向へページが流れる」）。
- **手法**: View Transitions API + JS でのインデックス比較（`data-match` 属性を持つ
  レールリンクの配列位置）。
- **現存/削除済み**: **削除済み**（同じく `6f1396a` で退場）。
- **再利用度**: **high** — Phase 2「direction-aware」の直接の前例。
- **Motion Lab パラメータ化**: 「方向つきクロスフェード」プリセット（移動量px・duration・
  上/下/左/右への一般化）。

### B4. ルートの単純ディゾルブ（root dissolve） — **削除済み（B3 と同時に退場した基準線）**
- **場所（削除前）**: commit `1eccef2` の `transitions.css`
  `@keyframes dissolve-out`（opacity 1→0, translateY 0→-6px）、
  `@keyframes dissolve-in`（opacity 0→1, translateY 10px→0）。
- **何をするか**: 方向判定が付かない遷移（レールに載っていないページ同士など）の
  デフォルトのクロスフェード。
- **手法**: View Transitions API の `::view-transition-old/new(root)` に keyframes。
- **現存/削除済み**: **削除済み**（現行は「素のカット」— `transitions.css` 冒頭コメント
  「the router swap is a plain cut」）。
- **再利用度**: med — シンプルすぎて単体の売りにはならないが、Motion Lab の
  「なし（cut）/ディゾルブ/モーフ」の3段階比較の中間項として使える。
- **Motion Lab パラメータ化**: 「ディゾルブ」プリセット（移動量・duration・easing）。

### B5. 画像の帯スイープ・トランジション（gradient-band-sweep / gradient-image-leave）
- **場所**: ルート直下の静的プロトタイプ `index-console.html`
  （および同系統の `index-grad.html` / `index-v1.html` / `index-v53.html` にも同じ
  keyframes が存在）。`@keyframes gradient-band-sweep`, `@keyframes gradient-image-leave`。
- **何をするか**: ワークカードのホバー/切り替え時、グラデーションの帯が左から現れて
  画面を横切り（`translateX(-1*var(--bar-width) → 232%)`）、退場する画像は右へ吹き飛ぶように
  スライドしながらフェードアウトする（`translate3d(-4%,0,0) → translate3d(124%,0,0)`,
  opacity 0.9→0）。
- **手法**: 純 CSS keyframes（`transform: translateX/translate3d` + `opacity`）。
  JS はホバー状態のクラス切り替えのみと推測（この4ファイルは Astro 化前の静的 HTML で、
  現行サイトの一部としては動いていない）。
- **現存/削除済み**: **現存**（ファイルとしてはリポジトリのルートに残っているが、
  Astro サイトの本番導線には組み込まれていない = 「参照用に置いてある過去案」）。
- **再利用度**: high（ページ/メディアが入れ替わる瞬間の「帯」演出として、現行の
  クリップワイプ以外の選択肢になる）。
- **Motion Lab パラメータ化**: 「帯スイープ」プリセット（帯幅・角度・速度・退場方向）。

---

## C. テキスト演出

### C1. スクランブル/デコード・テキスト（現行）
- **場所**: `src/scripts/motion.js` L111–158（`glyph`, `garble`, `scramble`, `textFrame`,
  `settleText`）
- **何をするか**: 見出しや短い行が、左→右に**ランダムな文字（英大文字/小文字/数字/記号/
  カタカナ・漢字風グリフ）が本物の文字へ解決していく**演出。元の文字列は一切書き換えず
  （テキストノードの `.data` を一時的に変えて最後に完全復元）、空白・句読点・矢印はそのまま
  保持されるので改行位置がズレない。大文字/小文字/日本語かどうかで文字種を合わせる
  （`glyph()` 関数）。進行は `p^2` の減速カーブ（`1 - (1-p)^2`）で、完了した文字数から
  左詰めで確定していく。
- **手法**: `requestAnimationFrame` ループ + テキストノード直接操作（DOM要素・属性は
  一切触らない）。
- **現存/削除済み**: **現存**。
- **再利用度**: **high** — Motion Lab の目玉テキストエフェクトになる完成度。
- **Motion Lab パラメータ化**: 文字セット（英数/記号比率/カナ・漢字有無）、速度・duration、
  解決方向（左→右/中央から/ランダム順）、フリッカー間隔（現在 45ms 固定）。

### C2. コンソール風タイプライター・キャレット（caret-blink）
- **場所**: `index-console.html` L1256–1261（`.console-caret`, `@keyframes caret-blink`）
- **何をするか**: 入力欄の末尾に立つ縦棒カーソルが `1.06s` 周期で点滅する
  （`steps(1, end)` — なめらかなフェードではなくカチッと切り替わる、本物のターミナル/
  テキストエディタのカーソルの再現）。`prefers-reduced-motion` では点滅を止めて常時表示。
- **手法**: 純 CSS keyframes（`opacity` の `steps()` アニメーション）。
- **現存/削除済み**: **現存**（静的プロトタイプとして。本番導線には未使用）。
- **再利用度**: med-high — 「タイプライター」プリセットの入力口として単体で使える。
- **Motion Lab パラメータ化**: 点滅周期・duty比（on/off の比率）、`steps()` vs なめらか
  fade の切り替え。

### C3. テキストのグラデーション・スイープ（text-flow / text-flow-out）
- **場所**: `index-console.html`（`@keyframes text-flow`, `@keyframes text-flow-out`）
- **何をするか**: ホバー時、テキストに乗ったグラデーションの `background-position` が
  スライドして「光が走る」ように見える。`-out` はカーソルが離れた位置から一気に
  140% まで流れて消える非対称な戻り方。
- **手法**: CSS keyframes（`background-position` アニメーション、`background-clip: text`
  相当のグラデーションテキストが前提）。
- **現存/削除済み**: **現存**（静的プロトタイプ内）。
- **再利用度**: med — ローディングというより装飾的ホバーだが、「テキストが生きている」
  質感の一部としてラボの比較対象になる。
- **Motion Lab パラメータ化**: 低優先度。時間があれば「グラデーション・テキスト」の
  補助プリセットとして。

---

## D. メディア・リビール（画像/動画が現れる瞬間）

### D1. クリップパス・ワイプ + 「NOW LOADING」ラベル（現行）
- **場所**: `src/scripts/motion.js` L200–274（`loadingLabel`, `revealUnit` のメディア部分）、
  `src/styles/transitions.css` L55–83（`.mo-loading`, `@keyframes mo-dots`）
- **何をするか**: 画像/動画が現れるとき、`clip-path: inset(0 0 100% 0) → inset(0 0 0 0)`
  を `steps(4, end)` で適用し、上から**カクカクと4段階**で見えてくる（なめらかなスライド
  ではなく、意図的にステップ状）。画像がまだデコードされていない場合だけ、その場所に
  モノスペースの「NOW LOADING」ラベル＋ドットが `.` → `..` → `...` と増えるアニメーション
  （`mo-dots`, `720ms steps(1,end) infinite`）が浮かび、画像が来たら消えてワイプが始まる。
  画像が 1100ms 以内に来なければ強制的にラベルを畳んで表示する（絶対に固まらない）。
- **手法**: WAAPI（`clip-path` アニメーション）+ CSS keyframes（ドット）+ `load`/
  `loadeddata`/`error` イベント + フェイルセーフタイマー。
- **現存/削除済み**: **現存**。
- **再利用度**: **high** — これも Motion Lab の核。
- **Motion Lab パラメータ化**: ワイプの方向（現在は上から）・ステップ数・duration、
  「NOW LOADING」ラベルの文言・出現までの遅延・ドットの速度。

### D2. マスク・リビール（mask-reveal, スクロール連動）
- **場所**: `index-console.html`（`@keyframes mask-reveal`）
- **何をするか**: `clip-path: inset(0 100% 0 0)` で右端が隠れた状態＋わずかな移動
  （`--from-x/--from-y` カスタムプロパティで方向を指定可能）から、`opacity` が先に少し
  上がってから（14%→30%で0→0.24）本体がクリップを開きながら定位置へ収まる、2段階の
  リビール。D1 より「間」を持たせた、じらしのあるバージョン。
- **手法**: 純 CSS keyframes（`clip-path` + `opacity` + `transform: translate3d`）、
  カスタムプロパティで方向をパラメータ化済み（`--from-x`, `--from-y`）。
- **現存/削除済み**: **現存**（静的プロトタイプ）。
- **再利用度**: **high** — 方向パラメータが既に変数化されており、Motion Lab の
  プリセット化がほぼそのまま流用できる。
- **Motion Lab パラメータ化**: `--from-x/--from-y`（開始位置のオフセット）、クリップの
  開き方向、2段階のタイミング配分。

### D3. プレスフレーム — 四辺が描き込まれるビューファインダー枠（press-frame）
- **場所**: `index-console.html` L474–485、`.press-frame` 要素（各ワークカードに1つずつ、
  L2193 以降で複数使用）
- **何をするか**: カードを押す/長押しすると、4辺のうっすらした罫線が
  `background-size: 0 1px, 1px 0, 0 1px, 1px 0 → 100% 1px, 1px 100%, 100% 1px, 1px 100%`
  で**同時に伸びて枠を完成させる**。カメラのフォーカス確定/AF枠のような質感。
- **手法**: 純 CSS keyframes（4方向グラデーション背景の `background-size` アニメーション）。
- **現存/削除済み**: **現存**（静的プロトタイプ）。
- **再利用度**: med-high — ローディングそのものではないが「読み込み/確定」の合図として
  Motion Lab に「フレーム確定」プリセットとして入れる価値がある。
- **Motion Lab パラメータ化**: 枠の太さ・伸びる速度・4辺の同時/順番出し分け。

### D4. スケルトン・パルス（Amazon Fire TV の QR 待ち）
- **場所**: `public/projects/amazon-firetv/css/style.css` L818（`.ob-qr-wait`,
  `@keyframes obPulse`）
- **何をするか**: QR ペアリング待ちの間、グレーの角丸ボックスが `opacity: 1 → 0.35` で
  ゆっくり明滅する、教科書的な「スケルトン・ローダー」。
- **手法**: CSS keyframes（`opacity` の ease-in-out alternate）。
- **現存/削除済み**: **現存**。
- **再利用度**: med — シンプルだが、Takao が「スケルトン」を明示的に挙げていたので
  基準点として archive に含める。
- **Motion Lab パラメータ化**: 明滅速度・不透明度レンジ・角丸半径。

---

## E. ゲーム内ローディング/イントロ（in-game）

`public/assets/{rakugaki-jam, typespace, resona, emoji-blast, marubatsu, kao-game,
koebaku, werewolf}/` には**プレビュー動画・静止画・素材だけ**が置かれている
（`preview.mp4/webm`, `*-screenshot.png`, `still.jpg`, `masters/`）。これらのゲーム本体の
ソースコード（Unity 等）はこのリポジトリには含まれておらず、`src/data/experiments/*.json`
のケーススタディ文にもローディング画面/タイトル画面に関する記述は見当たらなかった。

- **見つかったもの**: なし（実装がリポジトリ内に存在しない）。
- **判断**: ここは**捏造しない**。Takao 自身が各ゲームのプロジェクトフォルダ/別リポジトリを
  持っていれば、そこから個別に発掘してもらうのが確実。Motion Lab の「アーカイブ研究」に
  ゲーム内ローダーを含めたい場合は、Phase 0/1 の途中で Takao に直接ヒアリングし、
  スクリーン録画を送ってもらう運用にするのが現実的（下記プランの Open Questions 参照）。
- 唯一コード付きで見つかった関連ファイルは `public/projects/werewolf-card-gallery.html`
  他2ファイル（カードギャラリー/位置エディタ/ビューア、werewolf の**制作支援ツール**）だが、
  中身はホバー時のバネ状スケール（`cubic-bezier(0.34, 1.56, 0.64, 1)`, `translateY(-8px)
  scale(1.02)`）等の軽い hover/press トランジションのみで、ローディング/イントロ演出は
  含まれていない。イージングカーブ自体は「ポップ」プリセットの候補として記録だけしておく。

---

## F. 除外したもの（見つかったが対象外と判断）

- `public/assets/konosaki/support.js`, `public/assets/edutrack/prototype/support.js`,
  `public/assets/konosaki/deck-stage.js`: ファイル冒頭に
  「GENERATED from dc-runtime/src/*.ts — do not edit」と明記された**ツールの自動生成
  ランタイム**（`boot()` 関数はアプリの起動処理であって、視覚的なローディング演出ではない）。
  Motion Lab の対象外。
- `public/assets/verizon-totalwireless/storybook/_next/static/chunks/*.js`:
  Next.js/Storybook のビルド成果物（サードパーティのバンドルコード）。対象外。

---

## G. まとめ表（再利用度 high のみ抜粋）

| # | 名前 | 状態 | グループ |
|---|---|---|---|
| A2 | box→media→text チョレオグラフィ | 現存 | 起動/ページ内 |
| A1 | オドメーター起動 | 現存 | サイト起動 |
| A4 | Fire TV スプラッシュ+オンボーディング | 現存 | サイト起動 |
| B1 | サムネ→ヒーロー View Transition（cross-doc） | 現存 | ページ遷移 |
| B2 | Throw/Return モーフ（同一文書） | **削除済み** | ページ遷移 |
| B3 | 方向つき遷移（data-nav-dir） | **削除済み** | ページ遷移 |
| B5 | 帯スイープ（gradient-band-sweep） | 現存(未接続) | ページ遷移 |
| C1 | スクランブル/デコード・テキスト | 現存 | テキスト |
| D1 | クリップワイプ + NOW LOADING | 現存 | メディア |
| D2 | マスク・リビール | 現存(未接続) | メディア |

「現存(未接続)」= ルート直下の静的プロトタイプ (`index-*.html`) にコードはあるが、
現行 Astro サイトの本番導線には組み込まれていない、という意味。

---

## H. 追補（2026-09-28）— 上の棚卸しから漏れていたもの

Takao の指摘（「ローディングの時にグラデーションをやったりもしていた」）で掘り直した。
A〜G は `src/` と `index-*.html` を中心に見ていたため、ルート直下の旧 `assets/` にあった
遷移システムと、Takao が別途作った HTML プロトタイプが抜けていた。

### H1. グラデーション・フィールド遷移（handoff.js）— **削除済み・最有力の復元候補**
- **場所（削除前）**: commit `cfd2e7e`「Make the field one layer the whole site shares」の
  `assets/handoff.js`（前段: `a54359e`「Make the transition out of the index a colour,
  not an animation」）。各プロジェクトのリンクに `data-tint` / `data-tint2` / `data-art` /
  `data-tu-mode`。色の組は `cfd2e7e:landing-b-index.html` に 14 組残っている
  （例: Verizon `#101731→#2c3f7a`、Marubatsu `#2a1245→#7a35c9`、Rakugaki Jam 系 `#7a0c14→#d8262f`）。
- **何をするか**: 画面全体の地（`html::before`, `position:fixed; inset:0`）が、プロジェクト
  ごとの 2 色（radial ×2 + linear 152°）のグラデーションになる。一覧で**ホバーした時点で
  そのプロジェクトの色が全面に満ちる**ので、クリックの前に行き先の色がもう出ている。
  クリックすると色を保ったまま遷移し、行き先ページは最初のフレームから同じ色で開く
  （`sessionStorage` で 8 秒以内の受け渡しだけ有効）。3 つの形:
  - **colour**: 地の色をそのまま持ち越す（保持 280ms）
  - **image**: 押したサムネイルが全面まで飛び（`.tu-ghost`, 480ms）、行き先はその画像で開く（保持 440ms）
  - **veil**: 地を持てないページには同じ色の幕を上からかぶせ、読み込めたら持ち上げる（「必ず色 → ページ、白は挟まない」）
- **手法**: CSS custom properties + `color-mix(in oklab)` + `sessionStorage`。View Transitions
  API は使わない（当時 5〜8/10 回しか発火しなかったため）。`<head>` で同期ロード（1 フレーム目に色を出すため）。
- **現存/削除済み**: 削除済み（Astro 移行 `838d498` で旧 `assets/` ごと退場）。
- **再利用度**: **high**。現行の box-first ローディングと組み合わせられる
  （色で繋ぎ、箱で組み上げる）。
- **Motion Lab パラメータ化**: 2 色・グラデーションの形（stop 位置・角度）、保持 ms、
  モード（colour / image / veil）、ホバーで点灯するか。

### H2. モノクロ・グラフィック・ワイプ（wipe.js）— **無効化済み**
- **場所**: commit `1f56886` の `assets/wipe.js` / `assets/wipe.css`。現在の
  `public/assets/wipe.js` は中身を抜いた「Disarmed」スタブ（どこからも読み込まれていない）。
- **何をするか**: ink/paper の幕が「Takao Umehara / creativity is everywhere」の文字を載せて
  画面を横切り、ページを拭き取って次のページを出す。
- **再利用度**: med（H3 のスラブ幕の祖先。H3 に吸収するのが自然）。

### H3. Living Architectural Slabs（Takao の HTML プロトタイプ, v4）
- **場所**: `docs/motion-lab/references/living-architectural-slabs-v4.html`（2026-09-28 受領、原本のまま保存）。
  Tailwind CDN + GSAP 3.12 + Web Audio。
- **含まれる演出**（それぞれ独立したスタディとして扱える）:
  - **H3a スラブ・パズル起動**: 9 枚の白黒スラブが画面外（四方）から回転しつつ滑り込み、
    25ms 刻みで配置に噛み合う（0.62s, power4.out）。最後に「snap」音。
  - **H3b スラブ幕トランジション 5 種**: 中間点（midpoint）で中身を差し替える「覆う → 0.3s ため → 開く」の型。
    1. 4-Way Offset（四隅から時間差で重なり、逆順で退場）
    2. 4-Way Center（四象限が中央へ同時に合流）
    3. 2-Split Sharp（角丸なしの左右 2 枚が閉じ、上下へ裂けて退場）
    4. 2-Split Round（角丸つき 2 枚）
    5. Dynamic（3×3 のスラブが四方八方からランダムに来てランダムに去る）
  - **H3c 呼吸するボード**: 各スラブが sin/cos で微小に漂い、回転・拡縮し、マウス位置に
    応じてパララックス（ON/OFF トグルあり）。
  - **H3d 合成音**: Web Audio で「swoosh」（サイン波 140→35Hz + ローパス）と「snap」（三角波 880→160Hz）。
  - **H3e カーソル・ドット**: `mix-blend-mode: difference` の追従ドット、ホバーで拡大。
- **サイトの規則との関係**: 使っている変形は transform / opacity のみで、モーション規則に収まる。
  GSAP と Tailwind CDN はサイトに入れない（WAAPI と既存トークンで書き直す）。音は既定オフ。
