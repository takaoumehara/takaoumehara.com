# Motion Lab — エンジンの契約（v2）

> 2026-09-28 · library-plan §1〜§3 を、実装者が迷わない「関数の約束」に落としたもの。
> **この文書が正。** 各スタイルの実装（`src/scripts/styles/*.mjs`）はこの型だけを守り、
> motion.js の内部（box-first の振付）には触らない。

## 1. motion.json v2（v1 の値はそのまま残す）

```jsonc
{
  "version": 2,
  "preset": "…",
  "global": {}, "rail": {}, "pane": {}, "out": {}, "text": {}, "heading": {}, "label": {}, "body": {}, "media": {},   // ← v1 のまま
  "transition": {
    "cover":  { "style": "none",      "params": {} },   // 幕。none = 幕なし（v1 と同じ）
    "reveal": { "style": "box-first", "params": {} },   // 開き方。box-first = 既存の pane/text/media エンジン
    "holdMs": 300,                                      // 幕が閉じてから開き始めるまで（cover が none なら無視）
    "revealDelayMs": 0                                  // 幕が上がり始めてから reveal が始まるまで（負なら幕の下で先に組む）
  },
  "boot":  { "style": "odometer", "params": {} },       // タブで最初の 1 回。odometer = 既存の rail 演出
  "idle":  { "style": "none",     "params": {} },       // 表示中ずっと。none = 何もしない
  "sound": { "enabled": false, "volume": 0.25 },        // 既定オフ。ユーザー操作のあとでしか鳴らない
  "interactions": {}                                    // クリック・ホバーの手触り（motion-interactions.mjs が既定値を持つ）
}
```

- **v1 → v2**: `resolveConfig()` が `transition` / `boot` / `idle` / `sound` / `interactions` の無い JSON を
  上の既定で埋める。**v1 の JSON を読んだ結果は、v2 の既定 JSON を読んだ結果と deep-equal** でなければならない
  （テストで固定。見た目が変わらないことの根拠）。
- Copy JSON は常に v2 で書き出す。Import は v1 / v2 どちらも受ける。

## 2. スタイル・モジュールの型

`src/scripts/styles/<name>.mjs` は **配列を default export** する。1 要素 = 1 スタイル。

```js
export default [
  {
    kind: "cover",                    // "cover" | "reveal" | "boot" | "idle"
    id: "slabs.quad-stagger",         // JSON の style に入る文字列。kind の中で一意
    label: "Slab curtain · 4-way offset",
    source: "H3b-1",                  // docs/motion-archive.md の記号。復元元が無い新作は "new"
    labOnly: false,                   // true = 本番不可（blur など規則外）。Lab の一覧に「Lab only」と出る
    params: {                         // パネルの操作部はここから自動生成される（motion-lab.js が読む）
      staggerMs: { default: 60, min: 0, max: 300, step: 10, unit: "ms", label: "Stagger" },
      corner:    { default: "round", options: ["round", "sharp"], label: "Corners" },
      snap:      { default: true, label: "Snap sound" }        // boolean → toggle
    },
    // kind ごとに 1〜2 個の関数。すべて Promise を返し、reduced motion では即 resolve する（ctx.still）。
    in(ctx, p)  {},   // cover:  画面が完全に覆われたら resolve
    out(ctx, p) {},   // cover:  幕が上がり切って DOM から消えたら resolve
    play(ctx, p){},   // reveal / boot: 演出が終わったら resolve
    start(ctx, p){},  // idle:  stop() を返す（Promise ではない）
  },
];
```

`p` は `params` の既定に JSON の `params` を重ねたもの（数値は min/max に丸める）。

### ctx（エンジンが渡すもの）

| 名前 | 中身 |
|---|---|
| `ctx.layer(name)` | 幕・演出用のオーバーレイ要素（`position:fixed; inset:0; pointer-events:none; z-index` はエンジンが決める）。**`document.documentElement` の直下**に付く（Astro のルーターは `<body>` を差し替えるが `<html>` の子は残るので、幕が遷移をまたいで生き残る）。同じ name は同じ要素を返す。`ctx.drop(name)` で消す |
| `ctx.k` | 速度係数（`global.speed` と nav の `navSpeed`。**duration に掛ける**: `ms * ctx.k`） |
| `ctx.ease(name)` | motion.js の `EASINGS` の名前 → CSS easing 文字列 |
| `ctx.own(anim)` | WAAPI の Animation を登録する。**入力で `finishAll()` されたとき一緒に finish される**。登録しない Animation は禁止 |
| `ctx.still` | reduced motion なら true。true なら何もせず即 resolve（幕は出さない、呼吸は止まる） |
| `ctx.dir` | +1 / −1 / 0（レールの上下方向。site.js の Direction） |
| `ctx.stage` | `document.getElementById("main")`（ペイン）。`ctx.rail` はレール（無ければ null） |
| `ctx.tokens` | `{ ink: "var(--pr-ink)", paper: "var(--pr-canvas)", card: "var(--pr-card)", line: "var(--pr-line-2)" }`。**色はここから**。生の hex は tint（H1 のプロジェクト色）だけ |
| `ctx.tint` | `[c1, c2]` か null。行き先ページの 2 色（`src/data/tints.json`、`html[data-tint]`）。field 系が使う |
| `ctx.sound.play(name)` | `"snap"` / `"swoosh"`。`sound.enabled` が false、またはユーザー操作前なら何もしない |
| `ctx.capMs` | この段の上限 ms。**どのスタイルも capMs を超えたら自分で finish する**（固まらない） |

### 規則（library-plan §3 と同じ、全スタイル共通）
1. **動かすのは transform / opacity / clip-path だけ。** blur を使うなら `labOnly: true`。
2. **WAAPI（`element.animate`）だけ。** GSAP / Tailwind / CSS keyframes の追加は禁止。
3. **終わったら DOM を元に戻す。** 幕の要素は `ctx.drop()`、付けた class / style / attribute は外す。テキストを触るなら元の文字列に正確に戻す。
4. **reduced motion では何も動かない**（`ctx.still`）。
5. **finishAll に従う**（`ctx.own`）。入力があれば途中でも即完了し、見た目は「終わった状態」になる。
6. 音は `ctx.sound.play()` 経由だけ。自分で AudioContext を作らない。

## 3. エンジンの流れ（motion.js が担当。スタイル側は知らなくてよい）

```
[ページ遷移]  astro:before-preparation
   finishAll()
   cover.in(ctx, p)  ∥  paneOut(dir)      ← 同時。loader は両方を待つ
   （swap）
   hold(transition.holdMs)
   cover.out(ctx, p) ∥ (revealDelayMs 後に) reveal.play(ctx, p)   ← box-first は run({pane, rail, nav, dir})
   settle → idle.start(ctx, p)

[初回]  intro()
   boot.play(ctx, p)  → box-first なら従来どおり run({pane, rail})   ← boot=odometer は既存の rail 演出のまま
   settle → idle.start()

[Lab の再生]  replay("nav")  = 上の遷移を、swap なし・同じページで再生
              replay("load") = 初回を再生
[離脱]  before-preparation で idle.stop()
```

- `transition.cover.style === "none"` のとき、動きは v1 と**完全に同じ**でなければならない。
- `transition.reveal.style === "box-first"` は既存エンジンそのもの。`"cut"` は何もせず即表示。

## 4. レジストリ（`src/scripts/styles/index.mjs`）

```js
import slabs from "./slabs.mjs"; import field from "./field.mjs"; import wipe from "./wipe.mjs";
import band from "./band.mjs"; import bootSlabs from "./boot-slabs.mjs"; import idle from "./idle.mjs";
export const STYLES = […core, …slabs, …field, …wipe, …band, …bootSlabs, …idle];   // core = none / cut / box-first / odometer
export const byKind = (kind) => STYLES.filter((s) => s.kind === kind);
export const find = (kind, id) => …;                       // 無い id は kind の既定（none / box-first / odometer / none）に落とす
export const defaultParams = (kind, id) => …;
export const resolveParams = (kind, id, params) => …;      // 既定 + JSON、min/max に丸め
```

各モジュールは **自分のファイルだけ**を書く。index.mjs の import 行は最初から全部ある（空配列のスタブ）。

## 5. 他のモジュールの約束（並列作業のための境界）

| ファイル | export | 使う側 |
|---|---|---|
| `src/scripts/styles/sound.mjs` | `makeSound(soundCfg) → { play(name), unlock() }` | motion.js が 1 つ作って `ctx.sound` に渡す。`unlock()` は最初の pointerdown で呼ばれる |
| `src/scripts/motion-interactions.mjs` | `INTERACTION_DEFAULTS`（motion.json の `interactions` の既定）、`INTERACTION_FIELDS`（motion-lab.js の field 形式の配列）、`applyInteractions(interactions)`（`<html>` に CSS 変数を書く） | motion.js が setConfig のたびに apply、motion-lab.js が「Interactions」グループを描く |
| `src/scripts/motion-export.mjs` | `exportCode(config) → { css, js, note }`（貼って動く CSS + WAAPI の断片。対応しない部分は note に書く） | motion-lab.js の「Export code」ボタン |
| `src/scripts/motion-pick.js` | `mountPick(root, { apply(config), candidates() })`（採る／捨てるの二択 UI） | `/lab/motion` ページ |
| `src/data/tints.json` | `{ "<slug>": ["#…", "#…"] }` | field 系。無い slug は ink/paper の 2 色 |

## 6. パネル（motion-lab.js）が自動でやること
- 「Transition」グループ: cover / reveal の select（レジストリの `byKind`、`labOnly` は「Lab only」付き）、holdMs、revealDelayMs、
  選んだスタイルの `params` から生成した操作部。「Boot」「Idle」「Sound」グループも同様。
- 「Interactions」グループ: `INTERACTION_FIELDS`。
- 「Export code」ボタン: `exportCode()` の結果を IO 欄に出す。
