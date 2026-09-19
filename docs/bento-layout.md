# ベントーレイアウト — 設計と決定

> Written by: superforge (architecture) · Last updated: 2026-09-17
> 本人の決定（2026-09-17）:「すべてのプロジェクトは、左のリストをクリックすると、
> 右側のパネルの viewport 全部の幅を利用して bento box スタイルで角丸の四角に表現したい」
> 「まずは、hero graphic, motion がでかく。その下に、プロジェクトの概要を示す」
> 参照は PORTO ROCHA（`/all` の隙間の詰まったグリッド）。

---

## 0. 結論（先に）

| 問い | 答え |
|---|---|
| 幅 | **与えられた幅いっぱい。** 中央 1200px の列は使わない。外周も内側も余白は `--bento-gap`（12px / スマホ 8px）だけ |
| 骨格 | **12 カラム + 正方形の行ユニット。** 行ユニット＝列幅なので、`w` 列 × `h` 行のセルは常に **w : h の比**になる。ピクセルの高さを書く場所はどこにも無い |
| 行ユニットの出し方 | `grid-auto-rows: minmax(calc((100cqw - 11×gap) / 12), auto)`。`cqw` はコンテナ問い合わせ単位なので、`.bento` は必ず `.bento-wrap`（`container-type: inline-size`）の中に置く（コンテナは自分自身を問い合わせできない） |
| 穴が空かない理由 | レイアウトは**セルの自由配置ではなく「行」**。1 行のセルの `w` の合計は必ず 12、高さ `h` は行に 1 つ。ビルドがこれを検査して落とす（`src/lib/bento.mjs`） |
| はみ出さない理由 | 行は `minmax(unit, auto)`。文字が 1 行増えたセルは切れずに伸び、同じ行のセルも一緒に伸びる |
| 狭い画面 | 1100px 以下で **12 → 6 カラム**。`span` の数字はそのままなので比は変わらず、すべてが 2 倍の大きさになるだけ。`w = 12` のセルだけ個別の規則が要る（6 本の軌道に 12 は入らないため）。640px 以下は 1 列 + `aspect-ratio` |
| 中身の書き方 | `src/bento/<slug>.json`。**手で HTML を書かない。** ファイルがある slug だけ新レイアウト、無い slug は従来の `src/case-studies/<slug>.html` のまま |
| 文章の出どころ | 置き換え前のページに本人が書いた文と `src/data/`。**このレイアウトのために文章を書き足さない。** Challenge / Solution / Impact は今まで通り `ProjectStrip`（`src/data` の `narrative`）が出す |

---

## 1. ファイルの形

```jsonc
{
  "seo":   { "title": "…", "description": "…", "ogImage": "assets/…", "canonical": "https://…" },
  "theme": "dark",                       // 省略可。あると常に暗いページ（data-theme-lock）
  "hero":  { "kind": "media" | "video", "h": 6, "src" | "poster" + "sources", "alt", "fit", "caption" },
  "title": { "kicker", "h1", "h": 3, "lede", "links": [...], "meta": [{ "label", "value" }] },
  "sections": [
    { "label": { "en": "Brand identity", "jp": "アイデンティティ" },
      "rows": [
        { "h": 4, "cells": [ { "kind": "media", "w": 6, "src": "…", "alt": "…" },
                             { "kind": "text",  "w": 6, "heading": "…", "body": ["…"] } ] }
      ] }
  ]
}
```

- `w` は 12 のうちの列数。**1 行の合計は 12 ちょうど**。使う値は **3 / 4 / 6 / 12** に限る
  （8 のような値は 6 カラムに落ちたとき軌道からはみ出す）。
- `h` は行に 1 つ。文字だけの行は `h: 2` にして中身に高さを決めさせる。
- セルの `kind`:
  | kind | 何 |
  |---|---|
  | `media` | 写真 1 枚。`fit: "contain"` で切らない（ロゴ・デッキの 1 ページ）、`paper: true` で白地に置く |
  | `video` | 自前の動画。`poster` + `sources[]`。字幕は画像の**上**に出る（下はプレイヤーの操作列） |
  | `embed` | YouTube。`title` 必須（無いとビルドが落ちる。スクリーンリーダーの行き止まりになるため） |
  | `text` | `label` / `heading` / `body[]` / `list[]` / `links[]` |
  | `figure` | 数字ひとつと、それが何の数字か |
  | `statement` | 大きな 1 文 |
  | `links` | 行き先だけのカード。`tone: "ink"` で黒地 |
- `focus`（`object-position`）で切り取り位置を指定できる。スクリーンショットは `"50% 0%"`。

## 2. ビルドが落とす条件（`src/lib/bento.mjs`）

Claim Guard と同じ場所（`getStaticPaths()`）で走る。

- 行の `w` の合計が 12 でない
- `h` が 1〜14 の整数でない
- `hero` が無い / `title.h1` が無い
- 画像・動画・ポスターが `public/` に無い（絶対 URL は対象外）
- `embed` に `title` が無い

## 3. ページの並び

1. **ヒーロー** — 全幅 1 枚。動く作品なら動画。`data-vt-hero` はここに 1 つだけ
   （サムネイル → ヒーローの遷移。`tests/page-transitions.test.mjs` が個数を検査する）。
2. **タイトル + 案件の事実** — `w8` の見出しと `w4` の Role / Client / Year。
3. **The challenge / The solution / Impact** — `ProjectStrip`。ベントーの中では
   1200px の列をやめて 1 帯として並ぶ（`.bento-doc > .cs-strip`）。
4. **作品そのもの** — セクションごとの行。

## 4. トップページ（`/`）

同じ骨格を使うが中身は全作品。**サイドバーは無い**（`Site.astro` の `chrome={false}`）。

- 名前と `positioning[1]` を大きく、下に全作品のベントー。
- 並びと大きさは**読み込みのたびに変わる**。`src/lib/bentoShapes.mjs` の
  パターン表を、サーバーは決め打ちの `steadyPick()` で、ブラウザは `Math.random()` で歩く。
  表は `define:vars` でインラインスクリプトに渡しているので **2 か所に同じ表を書いていない**。
- インラインスクリプトはグリッドの**直後**に置いてある。解析中にその場で走るので、
  組み直しが見えることはない（ビルド済みの配置が一瞬見えてから飛ぶ、が起きない）。
  ルーター経由で `/` に戻ったときは `site.js` が `astro:page-load` で同じ関数を呼ぶ。
- 「2 つのリスト」＝ 左のレール（カテゴリ別の作品一覧）と `/all/` の分野フィルタ。
  トップにはどちらも無く、**最初のクリックで現れる**。レールは
  `::view-transition-new(side):only-child` で左から入ってくる
  （`:only-child` は「この要素の古い画像が無い」＝レールが無いページから来た、の意）。

## 5. まだ変えていないこと

- ケーススタディ **42 本のうち 3 本**（resona / ela-quests / value-frontier）だけがベントー。
  残りは `src/case-studies/<slug>.html` の手書き本文のまま（中央 1200px、`design-system.css`）。
  1 本変換するたびに `src/bento/<slug>.json` を足し、`src/case-studies/<slug>.{html,css,json}` を消す
  （`tests/bento.test.mjs` が「1 ページに 2 つの出どころ」を落とす）。
- 本文の日本語。置き換え前のページが英語だけだった長文は英語のまま置いた。
  見出し・ラベル・キャプションは `{en, jp}` で書いてある。訳すなら `docs/japanese-voice.md` に従って別の変更で。
