# やること

> 2026-09-20 時点。本番は `d78f740`（Vercel で promote 済み）。
> 決定は `docs/superforge.md`、作りは `docs/astro-architecture.md`、
> ベントーの型は `docs/bento-layout.md`、経緯は `.handoff/2026-09-17-astro-rebuild.md`。

---

## 0. すぐ。`main` を本番に揃える

`main` は `838d498` のまま、本番より **4 コミット遅れている**。
このまま誰かが `main` に push すると Vercel が `main` からビルドし直し、**本番が巻き戻る**。

- [ ] PR #21 をドラフトから外してマージする

---

## 1. ケーススタディ 38 本をベントーに（本丸）

最初の依頼「すべてのプロジェクトは…bento box スタイルで」のうち、**42 本中 3 本**しか終わっていない
（`resona` / `ela-quests` / `value-frontier`）。残りは旧サイトの手書き HTML のまま、
中央 1200px・`design-system.css` を抱えている。

仕組みは完成済み。1 本あたりの手順は:

1. `src/bento/<slug>.json` を書く（型は `docs/bento-layout.md` §1）
2. `src/case-studies/<slug>.{html,css,json}` を消す（`tests/bento.test.mjs` が消し忘れを検出する）
3. 行の `w` の合計は 12、幅は **{3, 4, 6, 12}** のみ。ビルドが検査して落とす

カテゴリ単位で進めるのが分かりやすい:

- [ ] **Interactive & Playable** — 未 7 本
- [ ] **AI Products & Systems** — 未 2 本
- [ ] **AI Tools** — 未 7 本
- [ ] **Product & Experience Design** — 未 11 本
- [ ] **Brand & Creative** — 未 11 本

---

## 2. 詳細ページが無い作品 2 本

- [ ] **moime** — ヒーロー画像待ち（`public/assets/moime/hero.png`、横長 1600px 以上）
- [ ] **MyBrainSpec** — 同上（`public/assets/mybrainspec/hero.png`）

画像が来たら `src/bento/<slug>.json` を組み、レコードに `"caseStudy": "projects/<slug>.html"` を足すだけ。
文章はレコードの `summary` / `thesis` / `experiment` / `question` / `contribution.mine` で足りる。
サムネイル（`assets/thumbs/<slug>.jpg`、3:2）もあればカードが文字の扉絵から写真になる。

**Kanji Puzzle は作らない**（本人「この作品はみせないで」）。

---

## 3. 画像をベントーに合わせて作り直す

> もしかしたら画像をクロップしたり 作り直したりする可能性もある

- [ ] **ELA Quests のスクリーンショット** — 今は `fit: "contain"` で逃げているだけ
- [ ] 他のケーススタディも、ベントー化するときに同じ判断が要る

---

## 4. 残っている不具合・副作用

- [ ] **`breakbias.html` がダークモードを無視する。** `design-system.css` は
      `html[data-theme="dark"]` に `--bg` / `--ink` を持たず、fragment の明るい `:root` が源順で勝つ。
      人のページ 5 枚は `BentoDoc` 経由にして直ったが、これは対象外にしたので残っている
- [ ] **`<em>` / `<strong>` の強調が消えた。** `t()` / `tb()`（`src/lib/html.mjs`）が
      EN/JP の両側を `esc()` に通すため、移行時に落とした（`extra•ordinary` の斜体、
      Work with me の小見出しの太字など）。言葉は全部ある。戻すなら許可するタグを決める必要がある

---

## 5. 積み残し

- [ ] **ベントー本文の日本語化。** 見出し・ラベル・キャプションは EN/JP 対。
      元ページで英語だけだった長い本文は英語のまま。規模は
      `.handoff/2026-09-17-astro-rebuild.md` 第 3 段に記載。基準は `docs/japanese-voice.md`
- [ ] **PR を 2 本に分ける。** 「2 本に分ける」と決めたが、セッションのブランチが 1 本に
      固定されていて分けられなかった。4 ラウンドを 4 コミットに分けた 1 本の PR になっている
- [ ] **ページの統合はしない**（「型を揃える」を選んだため）。参考までに
      `contact` ≒ `work-with-me`、`breakbias` ⊂ `workshop` なので、やるなら 7 → 4 枚にできる
