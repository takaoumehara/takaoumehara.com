# Interactive Experience 5件 — ケーススタディ素材の所在と、この家族に固有の決めごと

Updated: 2026-09-06

対象: Rakugaki Jam / Typespace / Resona / Marubatsu 2.0 / EmojiDrop Ultimate。
このサイトで「Playable」傘（`interactive.html`）に並ぶ5件について、**素材ヒアリング指示書 v3**
（`docs/portfolio-content-intake-prompt.md`）を各プロジェクトのAIセッションに渡し、
`portfolio-case-study-<slug>/` の4〜5ファイルを書き出させた。その結果の索引と、
HTML化のときに効く判断をここにまとめる。

会社サイト側（creativityiseverywhere.com）には、同じ5件について**会社の立場から書いた1枚の
中間ページ**が別に存在する。役割分担は §4。

**2026-09-06 追記 — 会社サイトのデザインが替わっていた。** このブランチは
`claude/company-site-build-begu28` から切っていたが、`main` は別系統で
「one board（ブロックが育ってページになる）」に作り直されていた。両者は `dadecce` で
分岐したきり合流していない。本人確認のうえ `main` を正とし、会社側の5ページは
board の語彙（`panel` / `panel__title` / `stats` / `sub` / `row__see`、2色のみ）で
作り直した。**ここ（takaoumehara.com）側の素材・スパイン・判定は影響を受けない** —
変わったのは会社側の見た目と、下の §4 の表の3行だけ。

---

## 1. 所在と判定

| プロジェクト | 素材フォルダ | 判定 | 枚数 | 入力ラベル | 公開URL | 主な未確定 |
|---|---|---|---|---|---|---|
| Rakugaki Jam | `rakugaki-jam/portfolio-case-study-rakugaki-jam/` | **B** 物語先行 | 12 | `Handwriting` | `rakugaki-jam.vercel.app`（本セッションからは未開封） | 実イベントで一度でも回したか（CONCEPT は pre-first-event、7/29の文書は会場フィードバックに言及） |
| Typespace | `typespace/portfolio-case-study-typespace/` | **B** | 12 | `Typing` | `typespace-rho.vercel.app` | **本番が現行ビルドを配信しているか**（7/28のブロッカーが未解決のまま） |
| Resona | `resona/portfolio-case-study-resona/` | **B**（8/12作成分を更新） | 12 | `Body` | `www.resonamotion.com` | 凍結宣言後の再開理由（本人判断）。**掲載は公開済み7作のみ**（本人指示 2026-09-06） |
| Marubatsu 2.0 | `marubatsu-arena-local/portfolio-case-study-marubatsu/` | **A** 証拠先行 | 11 | `Two phones` | `marubatsu20.vercel.app`（スクショの URL バーで確認） | 旧ドメインの生死・息子の名乗り方 |
| EmojiDrop Ultimate | `EmojiDropUltimate/portfolio-case-study-emojidrop/` | **B** | 12 | `Two phones` | **無し**（未確認・推測禁止） | 公開URL・名称（Emoji Blast か） |

各フォルダの `OPEN-QUESTIONS.md` の ★ 項目が、本人にしか答えられない最短経路。
5件で合計 **約80問**。先に効く順は: Typespace Q-1（本番確認）→ EmojiDrop Q-1（URL）→
Rakugaki Q-2（実イベント有無）→ 全件の「使える機材」→ 全件の「② 生成の着手可否」。

---

## 2. 既存ページとの食い違い（この作業で直したもの・残したもの）

素材書き出しの過程で、サイトの現行記述が**リポジトリの事実と食い違っている**箇所が出た。
真実ルール（`docs/superforge.md`）に従い、直せるものはこのブランチで直した。

| 場所 | 現行の記述 | 事実（出典） | 処置 |
|---|---|---|---|
| `projects/marubatsu.html` | 4×4 であることだけを売りにしていた | 2.0 の芯は **一手で二つ置く**（`use-game-state.ts` L108/168） | ヒーロー・キッカー・メカ表に追記 |
| 同 | "Gemini reads your patterns" | Gemini は第一候補で、鍵欠落・不正応答時は端末内ミニマックスが代打（`use-computer-player.ts` L586-603） | 文言を「まず Gemini、使えないときは端末内の探索」に |
| 同 | "rooms live 24h · reconnect-safe" | 24h 失効を実装するコードは無い。ゲスト ID は sessionStorage なのでブラウザ再起動で席を失う | 「リロードしても席は残る」に縮めた |
| 同 | "Powered by Snap Pair / Built with Snap Pair" | このリポジトリに Snap Pair 依存は無い（ペアリングは自前 `use-online-room.ts`） | 「Snap Pair の出発点」に言い換え |
| `interactive.html` EmojiDrop | "head-to-head" "no server relay either" | 協力プレイ（残機共有・ボスHP共有・糸）。任意の中継サーバーが実装済み（既定オフ） | カード文言を協力プレイに修正 |
| `interactive.html` Marubatsu | "Real-time online tic-tac-toe with an AI opponent" | ルール変更が一切書かれていない | 「4×4・一手で二つ」を1文説明に |
| `interactive.html` Typespace | 「AI は使っていません」 | 作品の**中**に AI は無い（正しい）。制作にはエージェントを大量使用 | **残した**。ケーススタディ §6.5 と並べるときに「作品の中には」と補う（Typespace Q-8） |

残っている食い違いで**本人判断が要るもの**: Marubatsu ページの「フェリーで何百回」「マンハッタン」
の裏付け（リポジトリの証拠は "a father & son collaboration" のみ）、EmojiDrop の本体 README が
「6体」のまま（コードは16体）。

---

## 2-2. Resona は公開済みの7作だけを載せる（本人指示 2026-09-06）

`src/brand/works.ts` の登記簿では 21 件（Resona 本体 00 ＋ 連作 01〜20）が登録されていて、
状態は **`published` 7 / `wip` 11 / `retired` 3**。本人の指示は「公開しているものだけに絞る」。

公開済みの7作（すべてカメラ入力・登記簿の順）:

| no | 漢字 | Latin | URL | 動詞 |
|---|---|---|---|---|
| 01 | 張 | TENSION | `/studies/tension.html` | Reach · Grab · Pull · Release · Strum |
| 02 | 声 | VOICE | `/studies/voice.html` | Shape · Sustain · Harmonize |
| 04 | 間 | BETWEEN | `/studies/between.html` | Approach · Dwell |
| 05 | 墨 | INK | `/studies/ink.html` | Paint · Pour |
| 07 | 眼 | GAZE | `/studies/gaze.html` | Look · Dwell |
| 09 | 灯 | SPARKLER | `/studies/sparkler.html` | Pinch · Burn |
| 20 | 綾 | AYA | `/studies/aya.html` | Weave · Twist · Resonate |

この判断が波及する先（**数字は7作で数え直す**）:

- ケーススタディの主語は「連作20作」ではなく「完成した7作」。未公開作は §1 の状態欄に
  1行だけ（制作中のものがあり、掲載しない）。作品名は出さない。
- **地図（atlas）の踏破率は7作で数え直す。** 「描画◯種のうち△、音◯種のうち□」は
  全作で数えた値だった。**この案件で一番強い主張なので、概算は禁止。**
- リポジトリ全体の数字（テスト数・行数・コミット・期間）はリポジトリの数字として
  そのまま使ってよい。ただし「リポジトリの」と明記する。
- 実画面 `mass-*.png` の 塊 MASS は **`wip`**。**公開作の画像は1枚も無い**ので、
  サムネイルは撮り下ろし（`MEDIA.md` T-1、TENSION と AYA）が必須。
- `interactive.html` のカード文と会社サイトの2か所（`resona.html` / `index.html` の
  Playable パネル）は 2026-09-06 に7作の記述へ差し替え済み。会社側の `playable.html` は
  board 化でリダイレクト用スタブになったので、対象から外れた。

## 3. この家族（Interactive Experience）に固有の決めごと

指示書 v3 と `portfolio-template-system.md` は全カテゴリー共通。5件を並べて初めて見えた、
この家族だけの癖を書いておく。次にこの家族のページを組む人のため。

1. **5件中4件が B（物語先行）になった。理由は全部同じ — 実画面が無い。**
   Rakugaki Jam はリポジトリに画像ゼロ、Typespace は 7/23 の古い5枚のみ、EmojiDrop は og.png
   だけ、Resona は `mass-*.png` の4枚。動くものを作る人ほど止め絵を残さない。
   → **各 MEDIA.md の T-1（本人が撮る・30分以内）が終わった瞬間に A に化ける**案件が多い。
   Rakugaki Jam は製品自身に録画機能（✦ 直近15〜30秒）があり、AUTO モードで観客なしでも
   壁が埋まるので、撮影コストはほぼゼロ。HTML化の前に T-1 を回収する。
2. **Retrospective は5件とも同じ一行を持っている: 「初見の他人が触るところを、まだ見ていない。」**
   これは弱点ではなく、この家族の**共通の宿題**。1ページごとに謝るのではなく、
   `interactive.html` の傘の下に1回だけ正直に書く方が強い（会社サイト側は各ページで書いている。
   会社は「実験を公開で回すスタジオ」を名乗るので、ページごとに書くのが正しい。個人サイトでは
   1回でよい）。
3. **「AIが書いた比率」を出すかは、5件で答えを揃える。** Rakugaki Jam 81/89 コミット、
   EmojiDrop 48/50 がエージェント名義。Marubatsu は 54/56 が本人名義（AI は後期のみ）、
   Typespace・Resona は vault に Claude/Codex の記録が濃い。Craft スライド（§6.5）は
   「AI の何が駄目で、人として何を足したか」が主役なので、比率を隠すと成立しない。
   **推奨: 数字を出す。** ただし5件で出す・出さないを揃える（1件だけ隠すと、そこだけ疑われる）。
4. **アクセント色が3件で衝突している。** Rakugaki Jam・Typespace・EmojiDrop・Marubatsu が
   揃ってティール `#0d9488` を提案してきた（指定表の Interactive 基調色に従っただけ）。
   `interactive.html` の並び順（Resona → Kao → Rakugaki → Typespace → Koe Baku → EmojiDrop →
   Marubatsu → Werewolf）で隣接が同色にならないよう、HTML化時に割り当て直す。
   案: Resona＝ティール、Rakugaki Jam＝紫、Typespace＝青、EmojiDrop＝黄、Marubatsu＝緑
   （Marubatsu は現行ページが紫なので、Rakugaki を紫にするなら Marubatsu を変える）。
5. **入力ラベル `Two phones` が2件（EmojiDrop・Marubatsu）で同じ。** 傘の主張は「入力で並べて
   読める」ことなので、同じで正しい。区別は説明文の1語目（協力／対戦相手）で付ける。
6. **公開URLの真偽はこの環境から確認できない**（`*.vercel.app` への CONNECT を proxy が 403 で
   拒否。ネットワークポリシーなので再試行しても無駄）。各素材は「開ける」と書く根拠を
   別の一次情報（スクショの URL バー・GitHub の homepage 欄・既存カード）から取り、
   その出典を明記している。**HTML化の前に本人が5本のURLを実際に開く。**

---

## 4. 個人サイトと会社サイトの役割分担

| | takaoumehara.com（ここ） | creativityiseverywhere.com |
|---|---|---|
| 主語 | 私（一人称） | we（スタジオ） |
| 形 | 10〜12枚のスライド型ケーススタディ（スパイン v2） | 350〜1,000語の1枚。質問→決定→証明→顧客の形 |
| 画像 | 実画面・実写真（必須） | 画像ゼロ。**canvas も無い**（計測のうえ廃止済み）。文字と2色だけ |
| 言語 | EN/JP 切替 | EN のみ |
| 読者 | 採用担当・協業相手（30秒〜2分） | イベント制作者・ブランド・信用の確認に来た人 |
| リンク | 会社ページ → 個人ケーススタディへ（**個人側のページが公開されたら**会社側に足す） | ボードの Playable 行 → `Read` → 会社ページ → 本体アプリ |
| 素材の源 | `portfolio-case-study-<slug>/README.md` | 同フォルダの `DISTRIBUTION-FACTS.md` |

会社側の仕様は `creativityiseverywhere.com/docs/project-pages.md`、配信計画は同 `docs/distribution/`。
**同じ事実シートから両方を書いている**ので、片方だけ数字を更新すると食い違う。数字を直すときは
`DISTRIBUTION-FACTS.md` を先に直し、両サイトをそこから引き直す。

---

## 5. 次の手（順番どおりに）

1. 各 `OPEN-QUESTIONS.md` の ★ に答える（合計で30分程度）。
2. 各 `MEDIA.md` 先頭の「本人のTODO」を回収する。サムネイル 760×570 が最優先（無いと索引に置けない）。
3. 判定を再確認する（T-1 を撮った案件は B → A に変わる可能性がある）。
4. `interactive.html` の並び順で色を割り当て、5ページを `projects/<slug>.html` に組む。
   参照実装は Variant A = `projects/cli-studios.html`、B = `projects/verizon-ai-agents.html`。
   Marubatsu は既存ページを v2 に**移行**（Tension / Structure / Craft / Proof / Retrospective の
   5枚が欠けている — `portfolio-case-study-marubatsu/README.md` §0-2 に照合表）。
5. 公開できたら、会社サイトの各ページ末尾に「Founder’s case study」リンクを足す
   （`creativityiseverywhere.com/tests/inventory.test.mjs` の allowlist に URL を加える）。
