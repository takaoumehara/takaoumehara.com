# 8章フォーマット照合 — 現行テンプレートとのギャップ分析

Updated: 2026-08-02

参照する2つの上位文書:
- **内容の正**: 「AI時代のデザイナー向け ケーススタディ構成・記述指針」（8章構成）
- **ページの正**: `docs/portfolio-template-system.md`（1スパイン＋3バリアント）

この文書は、後者が前者をどこまで満たしているかを照合し、改訂案を出すもの。

---

## 0. 結論

1. 8章のうち**6章は既に現行スパインにある**。構造的に欠けているのは
   **第6章（Human Craft + AI Collaboration）**と**第8章後半（Retrospective）**の2つ。
2. ただし本当の問題は欠落ではなく**粒度のズレ**。8章は「文章の義務リスト」、
   現行スパインは「スライドの並び」。1:1に写すと全ページ12枚超になり、
   `portfolio-template-system.md` §1-1 で「採用担当の30秒スキャンには長い」と
   指摘した verizon の肥大を、全ページで再生産する。
3. 最も明確な実装バグ: intake prompt §5 が集めている**「採用しなかった選択肢」に
   ページ側の置き場が無い**。集めておいて捨てている。

---

## 1. 照合表

| 8章 | 現行スパインの対応 | 実装（`projects/cli-studios.html`） | 判定 |
|---|---|---|---|
| 1. Title & Tagline | Hero: kick + serif見出し | "Five usability problems. One root cause. A redesign that started with **structure**." | ✓ |
| 2. Executive Summary | Hero: リード3〜4文 | 課題・介入・結果が1段落に入っている | ✓ |
| 3. Context & The "Ugly" Problem | Tension（before側） | チップ3個＋2〜3文 | △ 要約のみ。**混乱の実物が無い** |
| 4. Re-framing the Insight | Approach | "Structure first, then surface." ＋ root cause の言語化 | ✓ 現行で最も強い章 |
| 5. System & Information Architecture | 専用スロット無し（Fixes と Evidence に分散） | IAの**結果**（4セクション、命名変更）は載るが、**IAそのもの**は載らない | △ |
| 6. Human Craft + AI Collaboration | **無し** | 該当記述なし | ✗ |
| 7. The Refined Solution | Tension（after側）＋ Evidence | 実画面5枚・動画・デザインシステム13頁 | ✓ |
| 8. Impact & Retrospective | Proof ＋ Closing | Impact はあるが Retrospective は無い | 半分 |

---

## 2. 全34ページの実測（2026-08-02 走査）

| 観点 | 結果 |
|---|---|
| AIとの協働を**プロセスとして**書いたページ | **0 / 34** |
| Retrospective（教訓・やり直すなら）を持つページ | **1 / 34**（`verizon-ai-agents.html`「Four Lessons」のみ） |
| 「採用しなかった選択肢」を明示したページ | **0 / 34** |

注記:

- AIに言及するページは9枚あるが（`verizon-ai-agents`, `superforge`, `failforward`,
  `cross-model-handoff`, `marubatsu`, `snap-pair`, `konosaki`,
  `interactive-experience-skills`, `multilingual-readme`）、いずれも**AIが題材**であって
  作り方ではない。デザイン受託案件側（`cli-studios`, `tmobile`, `coca-cola`, `xq`,
  `carnegie`, `kitadoko`, `festival-design`, `amazon-firetv` 等）は言及ゼロ。
  → **指針の価値②（AIをどう手懐け、どう超えたか）が、サイトに一行も存在しない。**
- 教育案件（`ela-quests`, `edutrack`, `odell-education`）の「学び / lesson」ヒットは
  題材語の誤検出。目視で除外済み。

---

## 3. 個別の指摘

### 3-1. 第6章がテンプレートに存在しない ← 最重要

現行スパインは「課題 → 判断 → 証拠 → 成果」という**成果物の因果**で組まれており、
「どう作ったか」の層が設計に入っていない。スロットを足さない限り、intake prompt を
いくら書き換えても行き先が無い。

**ただし捏造してはならない。** 2024年以前の受託案件で実際にAIを使っていないなら、
AI協働の記述は第6章の目的（本物の判断を見せる）と正面から矛盾する。

→ **「Craft」スロットとして定義し、2通りの埋め方を認める。**

| 案件の性質 | Craft スライドの中身 |
|---|---|
| AIを実際に使った | AIが出した「平均的で綺麗な解」の何がダメで、人間として何を足したか。試した数と選定理由 |
| AIを使っていない | AIには出せない判断＝**何を捨てたか、なぜこの形か**（採用しなかった選択肢もここ） |

読み手に効く軸（判断の可視化）は両者で同一。スロットは1つで足りる。

### 3-2. 第5章は結果だけで過程が無い

指針が要求する三段——**カオスなビフォー → 思考のプロセスマップ → 洗練されたアフター**——の
うち、真ん中が無い。`cli-studios` の Tension ビフォーは「モーダル過多」等のチップ3個＝要約で、
混乱そのものを見せていない。Evidence に "Interaction Flow Research" はあるが、
ギャラリーの1枚扱いで物語の骨になっていない。

→ **Structure スライドを新設**。旧IAツリー／旧フローと新IAを並置する。既存の
`wds-worlds`（2カラム対比）の図版版として実装できるので、新規CSSは最小で済む。

### 3-3. Impact が「量」で書かれている

`cli-studios` の Proof は `25%（見込み） / 5問題 / 13ページ`。後ろ2つは**作った量**であって
ビジネスインパクトではない。指針の価値③が要求するのは「業務効率が◯%」「解約率」「新市場の定義」。

原因は intake prompt §9 の逃がし方——「数字が無い場合は定性証明3つ」——にある。
→ 逃がし方を変える。数字が無い場合も**「この設計が誰の何時間／何ドル／どの判断を動かしたか」を
1文で言い切る**を必須にする（推測数値の禁止はそのまま維持）。

### 3-4. Retrospective が Closing（箴言）に潰されている

現行 Closing は「構造を直せば、表面はついてくる」——普遍的な一文。美しいが、
これは**教訓ではなく標語**。読み手が知りたいのは「何がうまくいかなかったか」
「もう一度やるならどこを変えるか」。`verizon-ai-agents` の Four Lessons だけが正解を出している。

→ Closing の直前に **Retrospective スライドを1枚**（3項目まで、各1〜2文）。Closing は残す。

---

## 4. 改訂案 — スパイン v2

| # | スライド | 8章対応 | 必須範囲 |
|---|---|---|---|
| 1 | Hero | 1, 2 | 全バリアント |
| 2 | The Tension | 3 | 全バリアント |
| 3 | **Structure**（旧IA → 新IA） | 5 | Variant A 必須 / B 任意 |
| 4 | Approach ＋ **採用しなかった選択肢** | 4 | 全バリアント |
| 5–6 | Evidence | 7 | A: 実素材 / B: 図解 |
| 7 | **Craft**（AI協働 or 人間の判断） | 6 | 全バリアント |
| 8 | Proof | 8前半 | 全バリアント |
| 9 | **Retrospective**（教訓3つまで） | 8後半 | 全バリアント |
| 10 | Closing | — | 全バリアント |

### 枚数の帳尻（これを守らないと肥大する）

新規3枚は**短いスライド**（大見出し1行＋リード1本＋3項目まで）に固定する。
増分は Evidence ギャラリーの統合で相殺する。

| バリアント | 現行 | v2 |
|---|---|---|
| A（証拠先行） | 8〜10枚 | **9〜11枚**（Evidence を1枚統合して相殺） |
| B（物語先行） | 10〜14枚 | **10〜13枚**（深掘りの圧縮で相殺） |
| C（ツール紹介） | 3〜4枚 | **3〜4枚のまま**。ツール紹介に8章は過剰 |

### intake prompt への追加

| 追加/変更 | 内容 |
|---|---|
| §5 | 「採用しなかった選択肢」の**出力先を Approach スライドと明記**（現状は集めるだけ） |
| §6.5（新設） | Craft — AIを使ったか否かを最初に判定させ、使った場合のみAI協働を書かせる |
| §7 | Structure グループを必須化（旧IA/旧フローの素材有無を必ず答えさせる） |
| §9 | 「数字が無ければ定性3つ」→「数字が無くてもインパクトを1文で言い切る」 |
| §10.5（新設） | Retrospective — 教訓3つまで。うち1つは**うまくいかなかったこと**を必須 |

---

## 5. 適用順

| # | 作業 | 状態 |
|---|---|---|
| 1 | この照合文書を docs に追加 | 今回 |
| 2 | `cli-studios.html` に Structure / Craft / Retrospective を追加し v2 参照実装にする | 未（要承認） |
| 3 | `portfolio-content-intake-prompt.md` を8章対応に改訂 | 未 |
| 4 | `portfolio-template-system.md` §2-1 のスパイン表を v2 に差し替え | 未 |
| 5 | 残り18ページを v2 で移行 | 未 |

---

## 6. 未確定（本人確認が必要）

- **旧受託案件（CLI Studios, T-Mobile, Verizon TotalWireless, Coca-Cola, Amazon Fire TV 等）で
  AIを実際に使ったか。** 使っていない案件の Craft スロットは「人間の判断」側で埋める。
  ここを推測で埋めると、第6章の存在意義そのものが崩れる。
- `cli-studios` の「25%削減（見込み）」の出典。見込み値のままでよいか、実測に差し替えられるか。
