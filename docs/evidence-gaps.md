# 実績データの空欄 — 採用側が聞くこと、記録が答えられないこと

> 生成: `node scripts/audit-evidence.mjs`。手で直さず、`src/data/**` の該当フィールドを埋めてから再生成する。

採用担当（10〜30 秒）は **役割・規模・結果** を見る。現場の責任者（2〜5 分）は **制約と判断の理由** を見る。この文書は、その順に、各実績で記録に無いものを並べたもの。

## 埋め方の原則

- **嘘をつかない。** 数字が無い実績は無いままでよい。`outcome.status: "unknown"` と理由 1 行が、推測した数字より強い。
- **「提案」は記録から読めることの言い換えにすぎない。** 確認して書くのは本人。書いた瞬間にサイトのカードに出る（`contribution.level` は役割フラグとして表示される）。
- 書き方は `src/schema.d.ts` の `Contribution` / `outcome` / `narrative.decisions` を参照。

## 集計

| 質問 | 空欄の件数 |
|---|---|
| `contribution.level` — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言） | 24 |
| `contribution.teamSize` — 中心になって動いた人数（自分を含む）。分からなければ書かない | 25 |
| `period` — いつ。{ start: "YYYY" か "YYYY-MM", end?: … | "present" } | 12 |
| `engagement` — "unstated" は何も表示されない。employee / freelance / volunteer / own-venture / open-source / concept のどれか | 14 |
| `outcome / metrics` — その後どうなったか。根拠つきの数字か、誰かが述べた結果か、出荷したという事実か、正直に "unknown" と理由 1 行 | 3 |
| `metrics[].confidence` — この数字は "unverified" なので、どのページにも出せない。出どころを basis に書くか、消す | 3 |
| `narrative.constraints` — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと | 24 |
| `narrative.decisions` — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ | 26 |
| `contribution.mine` — 台帳はこの行を 1 行ずつ引用する。3 つの行為を 1 行に詰めた行や、40 語を超える行は割る。1 行 = 自分がした 1 つのこと | 0 |
| `angles` — 語り口が 1 つしかないので、どのレンズでも同じ話になる。承認済みの言い換えを 1〜2 本（product / business / creative / leadership など） | 2 |

対象 46 件のうち、空欄が 1 つ以上ある実績: 31 件

## 実績ごと（空欄の多い順）

### Odell Education — `project/odell-education`
役割: Brand & Product Design · unstated · 2023–2024 · ファイル: `src/data/projects/odell-education.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`engagement`** — "unstated" は何も表示されない。employee / freelance / volunteer / own-venture / open-source / concept のどれか
- [ ] **`outcome / metrics`** — その後どうなったか。根拠つきの数字か、誰かが述べた結果か、出荷したという事実か、正直に "unknown" と理由 1 行<br>　　提案（記録から読める範囲）: `narrative.impact exists but carries no number: record it as outcome.status "reported"`
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### Menlo Math — `project/menlomath`
役割: UX/UI Design · unstated · ファイル: `src/data/projects/menlomath.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`period`** — いつ。{ start: "YYYY" か "YYYY-MM", end?: … | "present" }
- [ ] **`engagement`** — "unstated" は何も表示されない。employee / freelance / volunteer / own-venture / open-source / concept のどれか
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### Vocabulary App — `project/vocab-app`
役割: UX Design · unstated · ファイル: `src/data/projects/vocab-app.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`period`** — いつ。{ start: "YYYY" か "YYYY-MM", end?: … | "present" }
- [ ] **`engagement`** — "unstated" は何も表示されない。employee / freelance / volunteer / own-venture / open-source / concept のどれか
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### CLI Studios — `project/cli-studios`
役割: Lead Product Designer · unstated · 2024 · ファイル: `src/data/projects/cli-studios.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない<br>　　提案（記録から読める範囲）: `1 (the record lists no team)`
- [ ] **`engagement`** — "unstated" は何も表示されない。employee / freelance / volunteer / own-venture / open-source / concept のどれか
- [ ] **`metrics[].confidence`** — この数字は "unverified" なので、どのページにも出せない。出どころを basis に書くか、消す<br>　　提案（記録から読める範囲）: `dev-time-25-projected (25%)`
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### Graffitiwear — `project/graffitiwear`
役割: Creative Director & Lead Designer · unstated · 2025 · ファイル: `src/data/projects/graffitiwear.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）<br>　　提案（記録から読める範囲）: `led`
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`engagement`** — "unstated" は何も表示されない。employee / freelance / volunteer / own-venture / open-source / concept のどれか
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ
- [ ] **`angles`** — 語り口が 1 つしかないので、どのレンズでも同じ話になる。承認済みの言い換えを 1〜2 本（product / business / creative / leadership など）

### UX Audit — `project/ux-audit`
役割: Lead UX · unstated · 2024 · ファイル: `src/data/projects/ux-audit.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`engagement`** — "unstated" は何も表示されない。employee / freelance / volunteer / own-venture / open-source / concept のどれか
- [ ] **`metrics[].confidence`** — この数字は "unverified" なので、どのページにも出せない。出どころを basis に書くか、消す<br>　　提案（記録から読める範囲）: `nav-efficiency-40 (40%), cognitive-load-30 (30%), dropout-25 (25%)`
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### Carnegie Learning — `project/carnegie`
役割: Lead Product Designer · unstated · 2024 · ファイル: `src/data/projects/carnegie.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`engagement`** — "unstated" は何も表示されない。employee / freelance / volunteer / own-venture / open-source / concept のどれか
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### Coca-Cola — `project/coca-cola`
役割: Senior Designer, Ogilvy Brand Integration Group · employee · ファイル: `src/data/projects/coca-cola.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`period`** — いつ。{ start: "YYYY" か "YYYY-MM", end?: … | "present" }
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### Do! Nuts Tokyo — `project/dnt`
役割: Creative Director · freelance · ファイル: `src/data/projects/dnt.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）<br>　　提案（記録から読める範囲）: `led`
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`period`** — いつ。{ start: "YYYY" か "YYYY-MM", end?: … | "present" }
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### Lesson Planner — `project/edutrack`
役割: Concept, Product Design & Prototype · unstated · 2026 · ファイル: `src/data/projects/edutrack.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`engagement`** — "unstated" は何も表示されない。employee / freelance / volunteer / own-venture / open-source / concept のどれか
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### Extraordinary — `project/extraordinary`
役割: Co-author, Art Director & Designer · unstated · 2013 · ファイル: `src/data/projects/extraordinary.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）<br>　　提案（記録から読める範囲）: `led`
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`engagement`** — "unstated" は何も表示されない。employee / freelance / volunteer / own-venture / open-source / concept のどれか
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### Hummingbird — `project/hummingbird`
役割: Lead Product Designer · unstated · 2024 · ファイル: `src/data/projects/hummingbird.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`engagement`** — "unstated" は何も表示されない。employee / freelance / volunteer / own-venture / open-source / concept のどれか
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### Kitadoko — `project/kitadoko`
役割: Creative Director & Design Strategist · freelance · ファイル: `src/data/projects/kitadoko.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）<br>　　提案（記録から読める範囲）: `led`
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`period`** — いつ。{ start: "YYYY" か "YYYY-MM", end?: … | "present" }
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### Konosaki — `project/konosaki`
役割: Design & Build (Creativity Is Everywhere LLC) · freelance · ファイル: `src/data/projects/konosaki.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない<br>　　提案（記録から読める範囲）: `1 (the record lists no team)`
- [ ] **`period`** — いつ。{ start: "YYYY" か "YYYY-MM", end?: … | "present" }
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### Total Wireless — `project/verizon-totalwireless`
役割: UX Designer & Prototyper · unstated · 2024 · ファイル: `src/data/projects/verizon-totalwireless.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`engagement`** — "unstated" は何も表示されない。employee / freelance / volunteer / own-venture / open-source / concept のどれか
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### Web3 Wallet — `project/web3-wallet`
役割: Lead Product Designer · unstated · 2023 · ファイル: `src/data/projects/web3-wallet.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`engagement`** — "unstated" は何も表示されない。employee / freelance / volunteer / own-venture / open-source / concept のどれか
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### XQ — `project/xq`
役割: Design Director · freelance · ファイル: `src/data/projects/xq.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）<br>　　提案（記録から読める範囲）: `led`
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`period`** — いつ。{ start: "YYYY" か "YYYY-MM", end?: … | "present" }
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### Verizon AI Workflow — `project/verizon-ai-workflow`
役割: Lead Product Designer (Agentic UX & AI Systems) · unstated · 2025–present · ファイル: `src/data/projects/verizon-ai-workflow.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`engagement`** — "unstated" は何も表示されない。employee / freelance / volunteer / own-venture / open-source / concept のどれか
- [ ] **`metrics[].confidence`** — この数字は "unverified" なので、どのページにも出せない。出どころを basis に書くか、消す<br>　　提案（記録から読める範囲）: `rework-10x (10×)`
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### Amazon Shopping on Fire TV — `project/amazon-firetv`
役割: Design & Engineering · concept · 2026 · ファイル: `src/data/projects/amazon-firetv.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない<br>　　提案（記録から読める範囲）: `1 (the record lists no team)`
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### Credit Card Portal — `project/credit-card-portal`
役割: Lead Product Designer · employee · 2022 · ファイル: `src/data/projects/credit-card-portal.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### ELA Quests — `project/ela-quests`
役割: Lead Product Designer · employee · 2014–2025 · ファイル: `src/data/projects/ela-quests.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### T-Mobile — `project/tmobile`
役割: Lead UX · freelance · 2024 · ファイル: `src/data/projects/tmobile.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### Value Frontier — `project/value-frontier`
役割: Brand Strategist & Creative Director · freelance · 2019 · ファイル: `src/data/projects/value-frontier.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）<br>　　提案（記録から読める範囲）: `led`
- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### KOJI FIZZ — `project/koji-fizz`
役割: Producer / Creative Partner · freelance · ファイル: `src/data/projects/koji-fizz.json`

- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`period`** — いつ。{ start: "YYYY" か "YYYY-MM", end?: … | "present" }
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### Skateboard eGift — `project/skateboard-egift`
役割: Designer (Solo) · unstated · 2024 · ファイル: `src/data/projects/skateboard-egift.json`

- [ ] **`engagement`** — "unstated" は何も表示されない。employee / freelance / volunteer / own-venture / open-source / concept のどれか
- [ ] **`narrative.constraints`** — 制約は何だったか。予算・期間・使える道具・社内事情・最初から選べなかったこと
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ
- [ ] **`angles`** — 語り口が 1 つしかないので、どのレンズでも同じ話になる。承認済みの言い換えを 1〜2 本（product / business / creative / leadership など）

### Festival Reinvention — `project/festival-reinvention`
役割: Festival Chairperson & Creative Director (volunteer) · volunteer · 2022–2024 · ファイル: `src/data/projects/festival-reinvention.json`

- [ ] **`contribution.teamSize`** — 中心になって動いた人数（自分を含む）。分からなければ書かない
- [ ] **`narrative.decisions`** — 自分が下した判断を 1 つ。なぜそうしたか、何を諦めたか。[{ decision, why, tradeoff }]。現場の責任者が見るのはここ

### Moime.app — `venture/moime`
役割: Creator · own-venture · ファイル: `src/data/ventures/moime.json`

- [ ] **`period`** — いつ。{ start: "YYYY" か "YYYY-MM", end?: … | "present" }
- [ ] **`outcome / metrics`** — その後どうなったか。根拠つきの数字か、誰かが述べた結果か、出荷したという事実か、正直に "unknown" と理由 1 行

### MyBrainSpec — `venture/mybrainspec`
役割: Creator · own-venture · ファイル: `src/data/ventures/mybrainspec.json`

- [ ] **`period`** — いつ。{ start: "YYYY" か "YYYY-MM", end?: … | "present" }
- [ ] **`outcome / metrics`** — その後どうなったか。根拠つきの数字か、誰かが述べた結果か、出荷したという事実か、正直に "unknown" と理由 1 行

### Kanji Puzzle — `experiment/kanji-puzzle`
役割: Creator & designer · own-venture · ファイル: `src/data/projects/kanji-puzzle.json`

- [ ] **`contribution.level`** — どこまで自分がやったか: solo（ひとりで）/ led（率いた）/ co-led（共同で率いた）/ contributor（一員として）/ advised（助言）<br>　　提案（記録から読める範囲）: `solo`

### BreakBias — `venture/breakbias`
役割: Creator · own-venture · ファイル: `src/data/ventures/breakbias.json`

- [ ] **`period`** — いつ。{ start: "YYYY" か "YYYY-MM", end?: … | "present" }

### intentfirst.ai — `venture/intentfirst`
役割: Founder · own-venture · ファイル: `src/data/ventures/intentfirst.json`

- [ ] **`period`** — いつ。{ start: "YYYY" か "YYYY-MM", end?: … | "present" }

## 空欄なし

- cross-model-handoff (`cross-model-handoff`)
- Emoji Blast (`emoji-blast`)
- failforward (`failforward`)
- interactive-experience-skills (`interactive-experience-skills`)
- intuitive-game-design (`intuitive-game-design`)
- Kao Game (`kao-game`)
- Koe Baku (`koe-baku`)
- Marubatsu 2.0 (`marubatsu`)
- multilingual-readme (`multilingual-readme`)
- Rakugaki Jam (`rakugaki-jam`)
- Resona (`resona`)
- Snap Pair (`snap-pair`)
- superforge (`superforge`)
- Typespace (`typespace`)
- Werewolf Card Game (`werewolf`)
