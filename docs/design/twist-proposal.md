# TWIST — Porto Rocha の骨格に、梅原の「入力と手ざわり」を一つ足す

> Written by: TWIST agent (design + interaction) · 2026-09-25 · Phase 1 = 提案のみ（実装は Phase 2）
> 前提: `src/layouts/Site.astro` の `<ClientRouter />`（同一文書 View Transitions）、レール `<aside class="side">` は `transition:persist`。
> 制約: WCAG 2.2 AA、`--ink-dim` より薄い文字なし、不透明度で文字を沈めない、タップ 24px、`data-vt-hero` は 1 ページ 1 個、`prefers-reduced-motion` 尊重、依存追加なし。

## 1. 差別化の方針

残すもの（Porto Rocha から）: 左レール＋右ペインの二列、`--pr-card` のグレー塗りで区切る行とカード、8px 単位のリズム、黒・グレー・白＋青一色、影なし・装飾なし。
変えないもの: 構造・情報・色。足すのは **「このサイト自体が、彼の共有画面作品のように振る舞う」** という一貫した一つの性格で、次の 4 手に絞る。

1. **投げ込み（Throw）** — レールの行やグリッドのカードを押すと、その 64px のサムネイルが *そのまま* 右ペインの 16:9 ティーザーへ育つ。Rakugaki Jam の「スマホから壁へ投げる」動きを、レール→ペインの向きでサイトの基本動作にする。戻るときは逆に、ティーザーがレールの現在行（インク反転）へ縮んで戻る。
2. **疑似触覚（Feel）** — ホバーで浮いて影が出る（今の `transitions.css` の `.cat-card:hover`、Porto Rocha の影禁止にも反する）をやめ、Resona のやり方で **押すと沈み、離すとバネで戻る**。ホバーは画像がカーソルへわずかに寄る（Werewolf のジャイロ視差の 1/10）。
3. **同じ画面を共有している感（Echo）** — ペインのカードに触れると、レールの同じ作品の行が一拍遅れて反応する。二つの面が一つのセッションで繋がっている、という彼の作品の前提をサイトの挙動にする。
4. **静止画でも違う — 入力ラベル（Input stamp）** — モーションではない差別化。彼の作品は「何を入力するか」で並べて読める（`src/data/experiments/*.json` の `input`: Handwriting / Typing / Pointer / Face / Voice / Two phones / Every phone）。これを Outfit 600・大文字・`--pr-ink` の小さなスタンプとして、レール行・グリッドカード・ランディングのスライドに置く。Porto Rocha は「名前と一行」しか持たない。加えて既に採っている Outfit 600 の見出し、詳細 H1 の負トラッキング（参照は +0.02em）、インク反転の現在行、流体タイポが、スクリーンショット一枚で参照と違うと読ませる。

## 2. インタラクション候補（優先順）

| # | 名前 | 見えるもの | 場所 | 技術 | コスト | リスク / 退避 | 触るファイル |
|---|---|---|---|---|---|---|---|
| 1 | **投げ込み** (a) | 押した行のサムネ (1:1) が右ペインの 16:9 ティーザーへ育つ。周囲は現行の dissolve | rail / grid → detail | VT 名付き要素: クリック時に起点へ `view-transition-name: hero`、受け側は既存 `[data-vt-hero]` | M | 名前重複で遷移ごと捨てられる（§4.1 で回避）。VT 非対応 (Firefox 143 以前) は Astro の fallback フェード。RM: 名前を付けない＝クロスフェードのみ | `src/scripts/site.js`, `src/styles/transitions.css` |
| 2 | **疑似触覚** (d) | 押下で 0.985 に沈み、離すと `linear()` のバネで戻る。ホバーで画像が 2–4px カーソルへ寄る。影は出さない | grid / rail / news | pointer events → `--px/--py`、CSS `:active`、`linear()` easing、transform のみ | S | 何もなし。RM: 沈みも寄りも無効、背景色の変化だけ残す | `transitions.css`, `site.js` |
| 3 | **初回登場のスタガー** (b) | 初回ロードだけ、レール行→ニュース→グリッドの順で 40ms 刻みにせり上がる。以降のナビは #1 が担う | home / rail / grid / news | CSS `@keyframes` + `--i`、IO（画面外は見えたとき） | S | VT 中に二重アニメ → 初回ロード限定で回避。RM: 即表示 | `transitions.css`, `site.js` |
| 4 | **投げ返し** (c) | 詳細→どこへ戻っても、ティーザーがレールの現在行へ縮む | detail → home / grid | #1 の逆方向、`astro:before-preparation` で起点を切替 | S（#1 の後） | 行き先が home のときランディングの `data-vt-hero` と名前が衝突（§4.1） | `site.js`, `transitions.css` |
| 5 | **スライドの入力スタンプ + 寄り** (e) | 各スライドに `input` が大きく打ち込まれ、画像はカーソル／傾きに 1–2% 寄る。進行バーは細いインクの線。画面外・非表示タブで停止 | home hero | Web Animations API（打ち込み）、pointer events、IO + `visibilitychange` | M | landing agent のクロスフェードを **拡張**。RM: スタンプは即表示、寄りなし、自動送りは止めて手動のみ | `src/components/home/*`（landing 完了後）, `transitions.css` |
| 6 | **エコー** (Echo) | カードにホバー／フォーカスで、レールの同じ行が 120ms 遅れて `--pr-card-2` に。押すと行が先に反転し、#1 が続く | grid ↔ rail | `data-href` 突合、pointerenter/focusin | S | ≤900px はレールが畳まれるので何もしない | `site.js`, `transitions.css` |
| 7 | **本文ビートのスクロール連動** | 詳細の各 `.beat` が、視界に入る量に応じて 12px→0 へせり上がる | detail | CSS scroll-driven `animation-timeline: view()`、非対応は IO の `.is-visible` | S | Safari 26 以前は IO 退避。RM: 即表示 | `transitions.css`, `site.js`（既存 `bindReveal` 流用） |
| 8 | **次／前の作品** | 詳細で ← → キー、モバイルは横スワイプでレール順に隣の作品へ。#1 の morph 付き | detail | keydown、pointer events（横 60px 超・縦 20px 未満）、`navigate()` | M | スワイプは水平スクロール要素と衝突しうる → ティーザー上だけで受ける。`aria-keyshortcuts` を H1 に | `site.js`, `ProjectDetail.astro`（属性 1 行、spacing 完了後） |

## 3. モバイル方針

**結論: 「両方。ホバーには押下の等価物を用意し、モバイル専用で必須のものは作らない。」**

- **同じ**: #1 投げ込み（Chrome Android 111+ / iOS Safari 18+ で同一文書 VT が動く。起点はグリッドのカード — レールは ≤900px で `Menu` の後ろに畳まれているので、行が見えないときは起点にしない）、#3 スタガー、#4 投げ返し（起点＝ティーザー、着地＝畳まれたレールでは見えないので **root の dissolve に退避**）、#7 ビート。
- **等価物**: #2 ホバーの「寄り」→ 押下の「沈み＋バネ戻り」。`:active` と `pointerdown/up` で、指が 300ms 以上乗っていたら遷移せず離しただけで戻す（誤タップ抑止）。#6 エコーは対象なし（レール不可視）。
- **モバイル専用（あっても困らないもの）**: #5 のスワイプ送り、#8 のティーザー上スワイプ。どちらも同じ内容にボタン／キーで届く。
- **自動送り**: 継続。ただし IO で画面外・`visibilitychange` で非表示タブは停止、RM では停止して手動のみ。
- **性能規則**: (1) アニメは `transform` / `opacity` のみ、`filter: blur` は現行 root dissolve から外す（GPU の再ラスタ）。(2) ポインタ追従は `requestAnimationFrame` で 1 回に間引き、`getBoundingClientRect` は pointerenter で 1 回だけ。(3) グリッド・ビートに `content-visibility: auto; contain-intrinsic-size` を与える（`site.css` の担当と調整）。(4) `.card-clip` 動画は既存どおりホバー時のみ、モバイルでは再生しない。(5) VT のスナップショットを軽くするため、morph 中はレール全体を `::view-transition-old(side){display:none}` にして新スナップショットだけ見せる。

## 4. Top-3 実装プラン（Phase 2）

### 4.1 投げ込み／投げ返し（#1 + #4）

**ファイル**: `src/scripts/site.js`（フック追加）、`src/styles/transitions.css`（hero 疑似要素）。詳細側は既存 `[data-vt-hero]` のまま。

仕組みは「一つの文書に `hero` は常に 1 個」を機械的に守ること。順序: `astro:before-preparation`（旧スナップショット前）→ swap → `astro:after-swap`（新スナップショット前）→ `astro:page-load`。

```js
// site.js — 起点は押されたリンクから逆引きする
let origin = null;
document.addEventListener("astro:before-preparation", (e) => {
  const src = e.sourceElement;                                  // 押された <a> / data-href のカード
  const row  = src?.closest?.(".side-item, .grid-card");
  const from = row?.querySelector(".side-thumb, .grid-media");   // 起点 = サムネ
  const leaving = document.querySelector("[data-vt-hero]");     // 詳細から出るとき = ティーザー
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // 戻り: ティーザー → レールの現在行（可視のときだけ）
  const back = !from && leaving && document.querySelector('.side-item[aria-current="page"] .side-thumb');
  const visible = (el) => el && el.getBoundingClientRect().width > 0;
  origin = visible(from) ? from : null;
  if (origin) { leaving && (leaving.style.viewTransitionName = "none"); origin.style.viewTransitionName = "hero"; }
  else if (visible(back)) { origin = back; origin.dataset.vtTarget = "1"; }   // 新文書側で名前を付ける
});
document.addEventListener("astro:after-swap", () => {
  const thumb = origin;
  if (!thumb) return;
  if (thumb.dataset.vtTarget) {          // 投げ返し: 新文書の [data-vt-hero]（home のステージ）を一度だけ黙らせる
    document.querySelector("[data-vt-hero]")?.style.setProperty("view-transition-name", "none");
    thumb.style.viewTransitionName = "hero";
  } else thumb.style.viewTransitionName = "";   // 投げ込み: レールは persist で同じ要素が残るので、ここで外す（詳細の hero と重複させない）
  markCurrent();                                // 反転行を新スナップショットに含める
});
document.addEventListener("astro:page-load", () => {
  if (origin) { origin.style.viewTransitionName = ""; delete origin.dataset.vtTarget; origin = null; }
  document.querySelector("[data-vt-hero]")?.style.removeProperty("view-transition-name");
});
```

```css
/* transitions.css — 1:1 → 16:9 を潰さず切り取る。角丸ごと育つ。 */
::view-transition-group(hero) { animation-duration: 420ms; animation-timing-function: cubic-bezier(.2,.7,.2,1); overflow: clip; border-radius: var(--r); }
::view-transition-old(hero), ::view-transition-new(hero) { height: 100%; object-fit: cover; animation: none; }
::view-transition-old(side) { display: none; }  /* 起点を抜いた古いレール（穴あき）を見せない */
::view-transition-old(root), ::view-transition-new(root) { /* blur を外し、opacity + 4px の translate だけに */ }
```

- **home のステージとの衝突**: ランディングの `[data-vt-hero]` ステージは home→detail でカードが起点のとき `none` にする（上のコード）。カード以外（テキストリンク等）からの遷移は従来どおりステージ→ティーザーで morph。
- **退避**: RM = 名前を付けない → 既存の 200ms フェード。VT 非対応 = `ClientRouter` の fallback フェード。名前重複が起きても「何も起きない」だけで壊れない。
- **検証**: `scratchpad/shot.mjs` に倣い、`page.addStyleTag({content:'::view-transition-group(*){animation-duration:4s !important}'})` → `.side-item` をクリック → 350ms 後にスクショ（1280×800）で、サムネがティーザーの矩形へ向かう中間フレームを確認。`page.emulateMedia({reducedMotion:'reduce'})` で `[style*="view-transition-name"]` が 0 件。390×844 では `.grid-card` 起点で同じ手順。遷移後 `document.querySelectorAll('[data-vt-hero]').length === 1` と、`.side-item[style]` が残っていないことを assert。`tests/page-transitions.test.mjs` は `site.css` の root フェードを見るので触らない。

### 4.2 疑似触覚（#2）＋エコー（#6）

**ファイル**: `src/styles/transitions.css`（`.cat-card:hover` の影ルールを置換）、`src/scripts/site.js`（`bindFeel()`）。

```css
:root { --ease-spring: linear(0, .6 12%, 1.05 28%, .98 45%, 1.01 62%, 1); }
.grid-card[data-href], .side-item, .news-card { transition: transform 360ms var(--ease-spring), background 140ms ease; will-change: auto; }
.grid-card[data-href]:active, .side-item:active, .news-card:active, .is-pressed { transform: scale(.985); transition-duration: 90ms; transition-timing-function: ease-out; }
.grid-card[data-href] .grid-media img { transition: transform 700ms cubic-bezier(.2,.7,.2,1); transform: translate(calc(var(--px, 0) * 4px), calc(var(--py, 0) * 4px)) scale(1.03); }
.side-item.is-echo { background: var(--pr-card-2); }        /* エコー: 文字色は動かさない（AA 維持） */
.cat-card:hover { transform: none; box-shadow: none; }    /* 影の浮きは廃止 */
@media (prefers-reduced-motion: reduce) { .grid-card[data-href] .grid-media img { transform: none; } .is-pressed, :active { transform: none; } }
```

```js
function bindFeel() {
  let raf = 0;
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest?.(".grid-card[data-href]"); if (!card || e.pointerType === "touch") return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { const r = card.getBoundingClientRect();
      card.style.setProperty("--px", ((e.clientX - r.left) / r.width - .5).toFixed(2));
      card.style.setProperty("--py", ((e.clientY - r.top) / r.height - .5).toFixed(2)); });
  }, { passive: true });
  document.addEventListener("pointerleave", (e) => e.target.style?.removeProperty("--px"), true);
  // エコー: カード ↔ レール行を data-href で突合
  document.addEventListener("pointerover", (e) => {
    const card = e.target.closest?.("[data-href]"); if (!card) return;
    document.querySelector(`.side-item[href="${CSS.escape(card.dataset.href)}"]`)?.classList.add("is-echo");
  });
  document.addEventListener("pointerout", (e) => { if (e.target.closest?.("[data-href]")) document.querySelectorAll(".side-item.is-echo").forEach(r => r.classList.remove("is-echo")); });
}
```

- 退避: RM でカードの寄りと沈みは無効（背景色の変化だけ）。`linear()` 非対応ブラウザは `cubic-bezier` にフォールバック（`@supports (animation-timing-function: linear(0,1))`）。
- 検証: 1280 で `.grid-card` に `page.hover()` → 対応する `.side-item.is-echo` が 1 件。`page.mouse.down()` 中に `getComputedStyle(card).transform` が `matrix(0.985…)`。390 で `page.touchscreen.tap` 前後で transform が単位行列に戻る。axe（`tests/a11y.spec.mjs`）が緑のまま。

### 4.3 初回スタガー（#3）＋入力スタンプ（静止画の差別化）

**ファイル**: `src/styles/transitions.css`、`src/scripts/site.js`（`bindEntrance()`）、`src/components/grid/GridCard.astro`・`src/components/Sidebar.astro`（スタンプ 1 行ずつ。Sidebar は他エージェントの対象外だが、spacing 完了後に差分最小で入れる）。

```css
.enter { animation: enter 420ms cubic-bezier(.2,.7,.2,1) both; animation-delay: calc(min(var(--i, 0), 10) * 40ms); }
@keyframes enter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .enter { animation: none; } }
.input-stamp { font-family: var(--pr-ff-display); font-weight: var(--fw-display); font-size: var(--text-xs); letter-spacing: .08em; text-transform: uppercase; color: var(--pr-ink); }
.side-item[aria-current="page"] .input-stamp { color: var(--pr-canvas); }
```

```js
function bindEntrance(firstLoad) {
  if (!firstLoad || matchMedia("(prefers-reduced-motion: reduce)").matches) return;   // ナビ時は VT が担う
  const sets = [".side-item", ".news-card", ".grid-card"];
  sets.forEach((sel) => document.querySelectorAll(sel).forEach((el, i) => { el.style.setProperty("--i", i); el.classList.add("enter"); }));
}
```

- 呼び出しは `onPageLoad` の中で `bindEntrance(!navigated)`（`astro:before-preparation` で `navigated = true`）。画面外のカードは `.enter` を付けても最初のペイントで遅延分だけ遅れて終わるだけなので IO は不要。
- 入力スタンプは `item.input` があるカード・行にだけ `<span class="input-stamp">Handwriting</span>` を名前の上に出す。テキストは英語固定（用語）。
- 退避: RM は即表示。JS なしでも `.enter` は付かないので常に可視（不透明度 0 のまま残る事故がない）。
- 検証: 初回ロード直後 100ms のスクショで下段カードが未到着、700ms で全到着（1280 / 390）。ナビ後は `.enter` が 0 件。`.input-stamp` のコントラスト（`#000`/`#f4f4f4`、反転行で `#fff`/`#000`）を axe で確認。`tests/home-grid.test.mjs` が壊れないよう既存クラスは保持。

## 5. 判断が必要な点

- **home のカードを押したとき、何が育つか**: 押したカード（推奨。「押したものが飛ぶ」が一貫する）か、ランディングのスライドステージか。カードならステージはその遷移だけ黙る。
- **戻り先**: ティーザー→レールの現在行（推奨。投げ返し）か、home のステージへ戻すか。レールが畳まれるモバイルは常に dissolve。
- **入力スタンプを載せるか**: レール行が 1 行分（約 14px）背が伸び、Porto Rocha より情報が一つ増える。載せるなら experiments（8 件）だけか、client 案件にも `input` 相当（"Screen"）を定義するか。
- **影の廃止**: `transitions.css` の `.cat-card:hover` の translateY + box-shadow は superforge の「影なし」と衝突している。沈み／バネに置換してよいか。
- **root dissolve の blur**: 現行の 6px blur は morph と重なると重い（特にモバイル）。opacity + 4px の移動だけに減らしてよいか。
