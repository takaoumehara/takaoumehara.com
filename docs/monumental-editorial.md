# Monumental Editorial — 実装記録

> Written by: superforge-ui · 2026-08-29
> 対象: `index.html`、`projects/kitadoko.html`、`assets/editorial.css`
> 承認: 2026-08-26、`docs/evidence/monumental-editorial-preview.png`
> （`codex/monumental-editorial-redesign` ブランチ）
> 仕様: 同ブランチの
> `docs/superpowers/specs/2026-08-26-monumental-editorial-redesign-design.md`

---

## 0. 経緯 — 何が決まっていて、何が実装されていなかったか

8/26 に Monumental Editorial の**仕様とプレビューが承認**された。しかし
codex ブランチの実装は、その承認より後のコミットも含めて**別物**だった。
実際にレンダリングして確認した差分:

| 承認仕様 | codex ブランチの実装 |
|---|---|
| 極細ウェイトの大文字見出し | 極太 |
| 極小ナビ4項目 | 8項目 |
| ボタンを使わない | 黒塗りボタン |
| モノスペースを装飾に使わない | メタ行がモノスペース |
| 青は使わない（色は作品画像内のみ） | `#0e56fa` が badge と tagline に描画 |

つまり承認された方向は、この実装が最初になる。

**同時に破棄した方向**: `docs/oker-direction.md` に記録していた Studio Oker
（純黒・スカーレット）。オーナーがプレビューを見た上で Monumental
Editorial を選んだため、ドキュメントごと削除した。`assets/play-tiles.js`
（canvas ライブタイル6枚）も参照が無くなったので削除。復活させる場合は
`git show 76d1920:assets/play-tiles.js` で取り出せる。

---

## 1. 実装した規則

`assets/editorial.css` の冒頭にも同じリストがある。緩めていない。

| 規則 | 実装 | テスト |
|---|---|---|
| 地は1色、インクは1色。色は作品画像の中だけ | `--bone` / `--carbon` ほか計5色 | 許可した5つ以外の hex があれば落ちる |
| 影を使わない。奥行きは空白で作る | `box-shadow` ゼロ | `box-shadow:` の存在で落ちる |
| 角丸ゼロ | `border-radius` ゼロ | 同上 |
| 階層はサイズと空白で作る。ウェイトはほぼ動かさない | 400 と 500 のみ | — |
| タイプは4段だけ | `.meta` / body / `.title` / `.display` | — |
| 画像に枠・角丸・影・オーバーレイを付けない | `.piece__frame` は overflow のみ | — |
| モーションは初回表示と作品の開閉だけ | `.rise` と `@view-transition` | — |

### フォント

Founders Grotesk は参照サイトの書体でライセンスが無い。仕様が代替として
指名している **Instrument Sans**（400/500）を使用。日本語は Noto Sans JP。

`:lang(ja)` と `.jp` では **`letter-spacing: 0` と `text-transform: none`**
に戻している。`-0.021em` は欧文のためのもので、和文では字間が潰れる。
大文字変換は和文に対しては何もしないが、規則としてそこで止めている。

---

## 2. 実測して直した2つの不具合

### ① 見出しが不可視になる — 演出がコンテンツの可視性を握っていた

初版は `.rise { animation: rise 760ms both; }` で、キーフレームは
`from { opacity: 0 }` から始まっていた。検証すると**見出しが完全に透明**
のままだった。

```
getAnimations() → { playState: 'running', startTime: null, currentTime: 0 }
```

原因は、**レンダーブロッキングの `<link>`（Google Fonts）が解決しないと
ドキュメントのタイムラインが開始しない**こと。開始していないアニメーション
は「最初のキーフレームを適用した状態」で止まる。つまり
`opacity: 0` のまま、それを解除するものが来ない。

検証環境ではフォント CDN が遮断されているため常に再現したが、これは
**実ユーザーにも起こりうる**。フォント CDN が遅い・落ちている・企業
プロキシに塞がれている場合、ランディングページの見出しが出ない。

修正: アニメーションは `load` 後に JS が付ける `html.is-ready` 経由でのみ
適用する。演出が動かなければ「演出が無い」だけで、「文字が無い」には
ならない。テストで両方（CSS のゲートと HTML の1行）を固定した。

> 教訓として一般化するなら: **入場アニメーションに `opacity: 0` の初期状態を
> 持たせるなら、それを解除する経路が必ず走ることを保証できるときだけにする。**

### ② 横スクロールが出る — フルブリードの相殺先が無かった

`.plate--bleed` は `margin-inline: calc(var(--edge) * -1)` で親の左右
パディングを打ち消す。ヒーロー画像だけ親がパディングを持たない位置に
置いていたため、画像が両側に 34px はみ出してページ全体が横スクロール
していた。`.wrap` で包んで解決。

---

## 3. 構成

### ランディング (`index.html`)

```
極小マストヘッド（Work / Practice / About / LinkedIn — 4項目）
  ↓
Statement（display、4行を手で折っている）
  ↓
Selected Work（6件・2カラム・実画像）
  ↓
Practice（3カラム）
  ↓
Work Index（5カテゴリー・テキストのみ）
  ↓
About（本文＋事実の一覧）
  ↓
Contact（唯一の黒面）
```

**5カテゴリーはナビに置いていない。** 参照サイトのナビは4項目で、仕様も
「5領域を、代表6件とカテゴリ別 Work Index の二階層へ変換する」と書いて
いる。カテゴリーへの導線は Work Index とフッターの2箇所。テストが
「ナビは4項目」「Work Index に5つが順番どおり」「フッターと表記が一致」
を固定している。

### Selected Work の6件

全て実画像。生成した代替ビジュアル（プロジェクト名を組んだ OG カード等）
は使っていない — 仕様がそれを「UIそのものが主役になっている」問題として
名指しで却下しているため。

| 作品 | カテゴリー | 画像 |
|---|---|---|
| Verizon AI Workflow | AI Products | `verizon-ai-agents/hero-agents-network.jpg` |
| Amplify ELA Quests | Product Design | `shared/Quest_teaser_tr.png` |
| Kitadoko | Branded Experience | `kitadoko/kitadoko-retail-interior.jpg` |
| T-Mobile BOPIS | Product Design | `shared/M−Mobile_teaser2.jpg` |
| Coca-Cola | Branded Experience | `coca-cola/Billboard_0045…jpeg` |
| Koe Baku 声爆 | Interactive Experience | `koebaku/hero.jpg` |

**AI Tools & Skills だけ代表6件に入っていない。** 実画像が無いため。
`assets/thumbs/superforge.jpg`（codex ブランチ）は存在するが、プロジェクト名
を組んだ生成カードであって作品ではないので使わなかった。Work Index には
7件として載っている。実スクリーンショットが用意できれば差し替えられる。

### プロジェクト詳細 (`projects/kitadoko.html`)

このシステムでの詳細ページの実装例。Kitadoko を選んだのは、実写真が
揃っていて、数字（0%→90% ほか）が本人の記録に存在するため。

```
マストヘッド → タイトル（display）とリード
  → 主張を担う1枚（フルブリード）
  → クレジット（ラベル／値、箱なし）
  → 01 Opportunity（対比2枚）
  → 02 Direction（ワードマークの展開）
  → 03 Scope（フルブリード）
  → 04 Results（巨大な数字4つ）
  → Next（黒面）→ フッター
```

数字・固有名詞・成果はすべて既存の `projects/kitadoko.html` から取った。
新しい主張は足していない。

---

## 4. 未着手

- **英語のみ。** 仕様が「まずは、英語サイトだけつくります」と明記している
  ため、この2ページから EN/JP 切替を外した。**他の46ページは EN/JP 併記
  のまま**なので、現在サイトは英語のページと併記のページが混在している。
  和文を戻すかどうかは判断待ち。CSS 側には `:lang(ja)` の扱いを既に
  入れてあるので、戻す場合は文言を足すだけで済む。
- **残りのページ。** カテゴリー5枚 → About / Contact → ケーススタディ約35枚
  の順。`.piece` と `.plate` と `.figures` は `assets/editorial.css` に
  出してあるので、そのまま使える。
- **画像の解像度。** `assets/thumbs/*.jpg` は全て幅 760px で、このレイアウト
  の 2カラム枠（1440px 時に約 690 CSS px）には Retina で足りない。今回の
  代表6件は原寸のオリジナルを直接参照しているが、そのぶん重い
  （`Quest_teaser_tr.png` は 1.8MB）。**代表6件の再エンコードが必要。**

## 5. 確認したこと / していないこと

**確認済み**（ローカル HTTP、1440px と 390px）:
横スクロールなし、JS エラーなし、404 なし、全画像がデコード完了、
初回表示アニメーションが `is-ready` 後に走る、テスト25件が通る。

**未確認**: 実際の Instrument Sans での字面。検証環境から Google Fonts が
遮断されているため、スクリーンショットは全てフォールバック書体。
特に `-0.021em` を掛けた display（最大104px）は、実書体で要確認。
