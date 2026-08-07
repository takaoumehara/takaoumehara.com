# PDP 移行ステータス — 全36ページの実測と、次に必要な回答

Updated: 2026-08-07
上位文書: `docs/portfolio-template-system.md`（ページの正） /
`docs/case-study-format-audit.md`（内容の正・スパイン v2）

この文書は「どのページが新レイアウトに乗っているか」を**推測ではなく実測**で並べ、
残りを組み直すために**本人しか答えられないこと**を projects 単位で列挙するもの。

---

## 0. 結論（先に読む用）

1. スパイン v2 に乗っているのは **2ページだけ**（`cli-studios` と、今回の `ai-window-deck`）。
2. ただし残り34ページのうち **7ページは移行対象ではない**。Variant C（ツール紹介）は
   `case-study-format-audit.md` §4 で「3〜4枚のまま。ツール紹介に8章は過剰」と決めてある。
3. よって実際の残数は **26ページ**。うち22が Variant A（実素材あり）、4が Variant B。
4. 26ページを機械的に組み直すことは**できない**。v2 が追加した3スロット
   （Structure / Craft / Retrospective）は、いずれも**ページ本文から導けない情報**を要求する。
   捏造せずに埋めるには、1案件あたり最短3問の回答が要る。§3 にその質問をまとめた。

---

## 1. 実測スロット表（2026-08-07 走査）

`wds-hero` / `wds-worlds` / `wds-statement` / `wds-structure` / `wds-evidence` /
`wds-craft` / `wds-proof` / `wds-retro` / `wds-closing` の9スロットの有無。

### 移行済み（2）

| ページ | スロット | deck | 画像 | 動画 |
|---|---|---|---|---|
| `cli-studios.html` | 9/9 | ✓ | 27 | 2 |
| `ai-window-deck.html` | 9/9 | ✓ | 0（素材待ち） | 0 |

### 移行対象外 — Variant C / ツール紹介（7）

Hero + Mechanism + Closing の3〜4枚で完結している。**触らない。**

`snap-pair` · `superforge` · `cross-model-handoff` · `failforward` ·
`multilingual-readme` · `interactive-experience-skills` · `marubatsu`

> `marubatsu` だけは判断が割れる。ゲームとして遊べる実物があるので Variant A に
> 上げる余地がある。→ §3 の質問 Q0。

### 移行待ち — Variant A（実素材が多い・22）

| ページ | クライアント / 役割 | 年 | 画像 | 動画 |
|---|---|---|---|---|
| `verizon-totalwireless.html` | Verizon / UX Designer & Prototyper | 2024 | 19 | 0 |
| `tmobile.html` | T-Mobile (via Concentrix Catalyst) / Lead UX | 2024 | 18 | 0 |
| `ux-audit.html` | USAA / Lead UX | 2024 | 19 | 0 |
| `credit-card-portal.html` | First PREMIER Bank / Lead Product Designer | 2022–23 | 14 | 0 |
| `carnegie.html` | Carnegie Foundation / Lead Product Designer | 2024 | 14 | 0 |
| `web3-wallet.html` | 不明・要確認 / Lead Product Designer | 2023 | 15 | 0 |
| `ela-quests.html` | Amplify Education / Lead Product Designer | 2014–2025 | 34 | 8 |
| `hummingbird.html` | Amplify Education / Lead Product Designer | 2024 | 20 | 0 |
| `vocab-app.html` | Amplify Education / UX Design | 不明・要確認 | 12 | 0 |
| `menlomath.html` | SunBay Math / 不明・要確認 | 不明・要確認 | 17 | 0 |
| `odell-education.html` | Odell Education | 2023–24 | 30 | 0 |
| `xq.html` | Emerson Collective / Design Director | 不明・要確認 | 16 | 2 |
| `konosaki.html` | Konosaki LLC / Design & Build | 2023–26 | 31 | 0 |
| `value-frontier.html` | Value Frontier Inc. / Brand Strategist & CD | 2019–21 | 34 | 0 |
| `kitadoko.html` | Kitadoko Hair Salon / CD & Design Strategist | 不明・要確認 | 29 | 0 |
| `festival-design.html` | 不明・要確認 | 2022–24 | 33 | 0 |
| `dnt.html` | 東京都 / Value Frontier / Creative Director | 2021 | 20 | 0 |
| `graffitiwear.html` | Japanese Weekend School of NY / CD & Lead | 2025 | 13 | 0 |
| `koji-fizz.html` | See the Sun / 森永製菓 | 不明・要確認 | 12 | 4 |
| `coca-cola.html` | The Coca-Cola Company / Senior Designer, Ogilvy | 2014 | 14 | 0 |
| `extraordinary.html` | 不明・要確認 | 2013 | 23 | 0 |
| `skateboard-egift.html` | 不明・要確認 | 2024 | 13 | 0 |

### 移行待ち — Variant B（実画面が出せない・4）

| ページ | 状態 |
|---|---|
| `verizon-ai-agents.html` | 部分的に v2。**190KB・スライド過多**。§2-2 の10〜13枚へ圧縮が本題 |
| `amazon-firetv.html` | 画像0枚。プロトタイプ実演が主役 |
| `edutrack.html` | 画像7枚。Concept / Prototype 段階 |
| `marubatsu.html` | §上記のとおり判断待ち |

### 孤立ファイル（2）

`ela-quests-slides-preview.html` と `verizon-totalwireless-slides-preview.html` は
本番導線から未リンク。`portfolio-template-system.md` §3 フェーズ2 で
「内容を本ページに昇格させ、preview を削除」と決めてある。**未着手。**

---

## 2. なぜ機械的に組み直せないのか

スパイン v2 が旧テンプレートに足した3スロットは、いずれも既存ページに**存在しない情報**を
要求する。既存ページ本文からの再構成でどこまで行けるかを、`cli-studios` の実装で試した
結果が `case-study-format-audit.md` §7 に残っている — **7項目のうち3項目が「要確認」で
残った**。同じことを26ページで繰り返せば、要確認が78件たまるだけになる。

| スロット | 必要な情報 | ページ本文から導けるか |
|---|---|---|
| Structure | 再設計**前**のIA / 画面遷移 | ✗ ほぼ全ページで「症状の要約」しか無い |
| Craft | その案件でAIを使ったか / 採用しなかった案 | ✗ 全34ページで記述ゼロ（監査 §2） |
| Retrospective | うまくいかなかったこと | ✗ 本人の実感なので原理的に導けない |
| Proof | 数字が実測か見込みか、出典 | △ 数字はあるが、実測/見込みの別が書かれていない |

---

## 3. 本人への質問 — 案件単位

### Q0. 先に決めたい3つ → **回答済み（2026-08-07）**

1. **どの順で組み直すか。** → **(a) 採用担当が最初に見る順**（work.html の並び上位から）で確定。
   バッチ構成は §5 を参照。
2. **`marubatsu` は Variant C のままか、A に上げるか。** → 未回答。バッチ1には影響しないので保留。
3. **`verizon-ai-agents` の圧縮を先にやるか、後回しにするか。** → **別ファイルで作成済み。**
   `projects/verizon-ai-agents-compact.html`（44枚 → 13枚）。**本ファイルは1行も変更していない。**
   両方を見比べて、どちらを本番にするか決める（§6）。

### Q1. Craft スライド — AIを使ったか（全案件・必須）

監査 §6 で確定済み: T-Mobile **なし** / CLI Studios **なし** / Verizon AI Agents **あり** /
Amazon Fire TV **なし（既定値・要確認）**。残りは未確認。

「なし」は弱点ではない（監査 §6 の但し書き）。**なしの場合は「単独作業だったか」
「使ったツール」だけ答えてもらえれば、Craft は採用しなかった案で埋める。**

| 案件 | AI使用 | 単独 / チーム |
|---|---|---|
| verizon-totalwireless | ? | ? |
| ux-audit | ? | ? |
| credit-card-portal | ? | ? |
| carnegie | ? | ? |
| web3-wallet | ? | ? |
| ela-quests | ? | ? |
| hummingbird | ? | ? |
| vocab-app | ? | ? |
| menlomath | ? | ? |
| odell-education | ? | ? |
| xq | ? | ? |
| konosaki | ? | ? |
| value-frontier | ? | ? |
| kitadoko | ? | ? |
| festival-design | ? | ? |
| dnt | ? | ? |
| graffitiwear | ? | ? |
| koji-fizz | ? | ? |
| coca-cola | ? | ? |（2014年・年代的に「なし」で確定してよいか） |
| extraordinary | ? | ? |（2013年・同上） |
| skateboard-egift | ? | ? |
| amazon-firetv | なし（既定） | ? |
| edutrack | ? | ? |
| marubatsu | ? | ? |

### Q2. Retrospective — 各案件1〜3個（必須・本人しか書けない）

各案件について「成果の欄には書けないが残ったこと」を1〜3個。
**うち最低1つは、うまくいかなかったこと。** 本当に無ければ
「まだ振り返れるほど時間が経っていない」で可（これは有効な回答）。

### Q3. Structure — 再設計前の構造（Variant A は必須）

記憶で構わない。「おそらく3層だった」「4層目があったかは不確か」のように
確信度を添えて。図は CSS で組むので画像は不要。

### Q4. Proof — 数字の実測 / 見込み

現在ページに載っている数字について、**実測か見込みか**と出典。
言えない数字は外して1文にする。

- `cli-studios` の「25%削減」の出典（監査 §6-2 から持ち越し・未解決）
- `verizon-ai-agents` の「42人 / 6ブランド / 10エージェント」は実測か

### Q5. 素材の欠落 → **保留（2026-08-07）**

`assets/ai-window-deck/` は空。ビジュアルの詳細は後日伝える、とのことなので**このまま待つ**。
`docs/portfolio-case-study-ai-window-deck/case-study.md` §8 に受け入れパスを書いてあるので、
そのファイル名でコミットすれば表示に切り替わる。ページ側の変更は不要。

§14 の4つの質問（「3ステップ」「8種類以上」の出典ほか）も同じく保留。

---

## 4. 進め方の提案

1問1問を待つと止まるので、**1バッチ = 4〜5ページ**で回すのが速い。
1バッチにつき必要な回答は Q1〜Q4 × 4〜5案件 = 15〜20項目。
回答が来た分だけ組み、来ていない項目は「不明・要確認」でページに出さずに保留する
（**捏造しない**が最優先・`docs/superforge.md` の pin）。

| フェーズ | 内容 | 状態 |
|---|---|---|
| 0 | `ai-window-deck` を v2 で新規作成、AI Tools 配下に追加 | **完了** |
| 0 | Interactive を `interactive.html` として独立、ナビに追加 | **完了** |
| 1 | Q0 の回答で順番を確定 | **完了** — (a) 採用担当順 |
| 2 | `verizon-ai-agents` の圧縮版を別ファイルで作成 | **完了** — §6 |
| 3 | バッチ1（5ページ）を v2 で再構築 | **回答待ち** — `docs/pdp-batch1-questions.md` |
| 4 | バッチ2以降 | 未着手 |
| 5 | preview 2枚を本ページに昇格し、preview を削除 | 未着手 |

---

## 5. バッチ構成 — 採用担当が最初に見る順（確定）

`work.html` の実際の並び（2026-08-07 実測）から、移行済み2ページと Variant C を除いた順。

> **訂正**: 会話中に「バッチ1は verizon-totalwireless から」と伝えたが、**これは誤り**だった。
> `verizon-totalwireless` は work.html の**13番目**（最後）で、上位ではない。
> 以下が実測に基づく正しい順。

| バッチ | ページ | work.html 順位 | 画像 |
|---|---|---|---|
| **1** | `ela-quests` | 1 | 34 + 動画8 |
| **1** | `tmobile` | 3 | 18 |
| **1** | `web3-wallet` | 5 | 15 |
| **1** | `hummingbird` | 6 | 20 |
| **1** | `credit-card-portal` | 7 | 14 |
| 2 | `ux-audit` | 8 | 19 |
| 2 | `edutrack` | 9 | 7 |
| 2 | `menlomath` | 10 | 17 |
| 2 | `vocab-app` | 11 | 12 |
| 2 | `carnegie` | 12 | 14 |
| 3 | `verizon-totalwireless` | 13 | 19 |
| 3 | 以降は work.html の並び順に継続 | — | — |

バッチ1の質問票は **`docs/pdp-batch1-questions.md`**。
`tmobile` の Q1（AI使用）だけは監査 §6 で「なし」が確定済みなので、質問から外してある。

---

## 6. `verizon-ai-agents` 圧縮版 — 比較用

| | 本番（既存） | 圧縮版（新規） |
|---|---|---|
| ファイル | `projects/verizon-ai-agents.html` | `projects/verizon-ai-agents-compact.html` |
| スライド | 44枚 | **13枚** |
| サイズ | 186KB | 126KB |
| ページ高（1440px） | 10,481px | 9,526px |
| 導線 | work.html からリンク | **未リンク**・`noindex`（比較用のため） |

**本番ファイルは1行も変更していない。** 圧縮版は既存ページの本文ブロックを選び直したもので、
**新しい文章は書いていない**（`docs/superforge.md` の「推測を書かない」pin に従う）。

残した13枚 —
①一行サマリ+数字 ②組織のかたちが問題 ③全工程の痛み ④Listen→map→pilot ⑤艦隊6体
⑥Master Brain ⑦Justin Case ⑧Sally ⑨WDS 5体 ⑩号令をかけなかった ⑪ワークフロー変革
⑫成果 ⑬4つの教訓

落とした31枚は各エージェントの深掘り（mb-feed 図、jc の3つの罠とスキャン、Sally の
インタビュー/フレームワーク/選択肢の階段/出力一覧、WDS のターミナル比較と技法一覧、
Cognitive Shift）。**14〜16枚に戻すなら、まず Sally の「選択肢の階段」と WDS の技法一覧が候補。**

### 検証

- 40コンポーネント × 11 CSSプロパティを両ファイルで計算値比較 → **差分 0**
- `<div>` 開閉バランス 329/329、JSエラー 0、横スクロール 0（1440px / 390px）
- deck-v モードで13枚を認識（本番は44枚）
- `node --test tests/*.test.mjs` → 21/21 pass

### 未解決（本番・圧縮版に共通）

- WDS 5体のポートレート画像5枚が**リポジトリに存在しない**
  （`agent-mimir/saga/freya/idunn/eira-portrait.jpg`）。`onerror` で消える実装なので
  表示は壊れないが、色面だけが出ている状態。**これは既存ページからの持ち越しで、今回の変更ではない。**
- Q4 の「42人 / 6ブランド / 10エージェント」が実測か見込みか、は未回答のまま。
  圧縮版は既存ページの数字をそのまま引き継いでいる（勝手に消していない）。
