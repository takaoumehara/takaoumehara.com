# Motion Library — 過去のモーションを全部まるっと取り込む方法（提案）

> 2026-09-28 · 前提: `docs/motion-archive.md`（A〜H）、`docs/motion-lab-plan.md`
> 状態: **§1〜§4 は実装済み（2026-09-28、`docs/motion-lab/engine-contract.md` が正）**。下の §5 に現状の表、§6 は解消済み。

## 0. いまどうなっているか（正直に）

- Motion Lab（`src/data/motion.json` + `?lab=1` パネル + `/lab/stage`）が扱えるのは、
  **現行の box-first ローディング 1 系統だけ**。パラメータはいじれるが、演出の「種類」は選べない。
- 過去のグラデーション遷移（H1 handoff.js）は**取り込まれていない**。アーカイブにも漏れていた
  （今回 §H に追記）。帯スイープ（B5）、マスク・リビール（D2）なども「記録だけ」の状態。
- スラブの HTML（H3）は今日受け取ったもの。原本は `docs/motion-lab/references/` に保存済み。

つまり、今の Motion Lab は「1 つの楽器のつまみ」はあるが「楽器の持ち替え」ができない。

## 1. 方針: 1 つの型に揃えて、全部を「持ち替えられる楽器」にする

過去の実装は作り方がばらばら（CSS keyframes、WAAPI、GSAP、sessionStorage、View Transitions）だが、
やっていることは 3 種類しかない。そこで**3 つの層 × 共通の型**に揃える。

| 層 | いつ | 型（関数の約束） | 入るもの |
|---|---|---|---|
| **Boot**（起動） | タブで最初の 1 回 | `boot(stage, cfg) → Promise` | オドメーター（A1）、スラブ・パズル（H3a）、レンズ（A3）、スプラッシュ＋進捗バー（A4） |
| **Transition**（遷移） | ページを移るたび | `cover(stage, cfg, payload) → Promise` → 中身を差し替え → `reveal(stage, cfg) → Promise` | 素のカット、box-first（A2）、グラデーション・フィールド（H1）、スラブ幕 5 種（H3b）、モノクロ・ワイプ（H2）、帯スイープ（B5）、ディゾルブ（B4）、方向つき（B3）、投げ込み/投げ返し（B2）、サムネ→ヒーロー（B1） |
| **Idle**（常時） | 表示中ずっと（任意） | `idle(stage, cfg) → stop()` | 呼吸するボード＋パララックス（H3c）、テキストのグラデーション・フロー（C3）、カーソル・ドット（H3e） |

ポイントは Transition の **cover → 差し替え → reveal** の型。スラブ幕（H3b）はもともとこの型
（midpoint コールバック）で、グラデーション・フィールドの veil（H1）も、モノクロ・ワイプ（H2）も
同じ形に入る。box-first（A2）は「cover なし・reveal だけ」の特殊形として同じ型に収まる。
型が揃えば、**サイト本番の遷移にも、`/lab/stage` にも、同じコードがそのまま差さる**
（Astro の `astro:before-preparation` で cover、`astro:after-swap` で reveal）。

組み合わせも自然にできる: 例「**色（H1）で繋いで、箱（A2）で組み上げる**」
「**スラブ幕（H3b）で覆って、box-first で開く**」。cover と reveal を別々に選べるようにする。

## 2. `motion.json` の拡張（既存の値はそのまま残す）

```jsonc
{
  "version": 2,
  "boot":       { "style": "odometer",  "params": { /* 現行 rail.* をここへ */ } },
  "transition": {
    "cover":  { "style": "none" | "field" | "slabs.quad-stagger" | "slabs.quad-center"
                         | "slabs.split-sharp" | "slabs.split-round" | "slabs.dynamic"
                         | "wipe" | "band-sweep" | "dissolve", "params": {} },
    "reveal": { "style": "box-first" | "cut" | "dissolve" | "field-lift", "params": { /* 現行 pane/text/media */ } },
    "holdMs": 300
  },
  "idle":  { "style": "none" | "breathing", "params": {} },
  "sound": { "enabled": false, "volume": 0.25 }
}
```

- v1 の JSON は読み込み時に v2 へ変換（`boot=odometer`, `cover=none`, `reveal=box-first`）。
  いま Takao が選んだ設定は**そのまま同じ見え方**になる。
- プロジェクトごとの 2 色は、evidence JSON（`src/data/**/<slug>.json`）に `tint: ["#…","#…"]`
  として持たせる（H1 の 14 組を初期値に）。フィールド遷移と一覧のホバーが同じ値を読む。

## 3. 移植のルール（スラブ HTML などを「そのまま」使わない理由）

- **GSAP・Tailwind CDN は入れない**。タイムラインは WAAPI（`element.animate`）に書き直す。
  サイトは依存ゼロで、既存の motion.js も WAAPI なので揃う。
- **色はトークンから**（ink `#0b0b0b` / paper `#f2f1ea` は既存トークンに寄せる）。
- **動かすのは transform / opacity / clip-path だけ**（サイトのモーション規則）。
  blur を使うレンズ（A3）は「Lab 専用・本番不可」の印をつけて比較用に残す。
- **reduced motion では何も動かない**。幕は出さずに即切り替え、呼吸は止まる。
- **音は既定オフ**。オンにしてもユーザー操作の後でしか鳴らさない。
- **どれを選んでも固まらない**: 各 cover/reveal に上限時間（既存 `capMs` と同じ考え方）を持たせ、
  キー入力・クリックで即完了（既存の `finishAll` と同じ）。

## 4. Lab での見せ方

- `/lab/stage` に「Boot / Cover / Reveal / Idle」の 4 つのセレクタを足すだけで、全スタディを
  持ち替えて再生できる。A/B 比較は同じステージを 2 つ並べる（`motion-lab-plan.md` Phase 1）。
- スラブ HTML の**ボード（6 枚の入口 + 引き出し）そのもの**は、遷移とは別の 1 スタディ
  `/lab/slabs` として置く。サイト本体の構成には混ぜない（§6 の判断待ち）。
- 各スタディにはアーカイブの記号（H1、H3b-2 など）と出どころのコミットを表示し、
  「一度作って、捨てて、また拾った」過程がそのままプロジェクトページの材料になるようにする。

## 5. いまあるもの（2026-09-28）

| 記号 | スタイル id | 種類 | ファイル |
|---|---|---|---|
| A2 | `box-first` | reveal（既存エンジン） | `src/scripts/motion.js` |
| A1 | `odometer` | boot（既存のレール演出） | `src/scripts/motion.js` |
| H3b-1〜5 | `slabs.quad-stagger` / `slabs.quad-center` / `slabs.split-sharp` / `slabs.split-round` / `slabs.dynamic` | cover | `src/scripts/styles/slabs.mjs` |
| H1 | `field` / `field-lift` | cover / reveal | `src/scripts/styles/field.mjs`（色は `src/data/tints.json`） |
| H2 | `wipe` | cover | `src/scripts/styles/wipe.mjs` |
| B5 / B4 | `band-sweep` / `dissolve` | cover（dissolve は reveal も） | `src/scripts/styles/band.mjs` |
| H3a | `slabs-puzzle` | boot | `src/scripts/styles/boot-slabs.mjs` |
| H3c | `breathing` | idle | `src/scripts/styles/idle.mjs` |
| H3d | snap / swoosh | `ctx.sound`（既定オフ） | `src/scripts/styles/sound.mjs` |
| — | `none` / `cut` | cover / reveal | `src/scripts/styles/index.mjs` |

未着手: レンズ A3（Lab 専用・blur）、方向つき B3、投げ込み B2、サムネ→ヒーロー B1、マスク・リビール D2、テキストのグラデーション C3。
足すときは `src/scripts/styles/<name>.mjs` に配列を 1 つ足し、`index.mjs` の import に並べるだけ。

道具の側: `/lab/motion`（舞台の切替: 自サイト / スクショ / URL、スマホ枠は既定 ON、採る／捨てる、Copy JSON）、`?lab=1` のパネル（Transition / Boot / Idle / Sound / Interactions の各グループ、Export code、Ask Jev、Suggest 3）。

## 6. 決めてもらったこと（解消済み）

1. **スラブのボード（入口 6 枚の画面）の扱い**: Lab の 1 スタディに留める / creativity is everywhere
   （スタジオ）側のトップとして別に作る / takaoumehara.com のトップ候補として比較する
2. **音**: 本番でも選べるようにするか、Lab 専用にするか
3. **着手のタイミング**: モーションの別作業（PR #28, `claude/wizardly-franklin-8srztg` が
   `motion.json` と `motion-lab.js` を更新中）が入ってから、その上に積むのが安全
