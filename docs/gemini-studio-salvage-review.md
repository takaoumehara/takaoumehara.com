# Lens Studio（別ブランチ実装）サルベージレビュー

> Written by: superforge · Last updated: 2026-09-11
> 対象: `takaoumehara/takaoumehara.com` ブランチ `codex/monumental-editorial-redesign`
> 目的: 「見た目ではなくエンジンに流用できるものがあるか」の判定
> 手法: Sonnet 5 サブエージェント 3 本で分担読解 → Opus 5 が主張を実コードで裏取り

---

## 0. 結論（先に）

| 問い | 答え |
|---|---|
| エンジンに流用価値はあるか | **ある。ただし 3 つの「小道具」に限る**（プロバイダ抽象・JSON 復旧・Playwright+axe テスト） |
| Lens の中核設計（データモデル・ガード・ビルド）は | **こちらが全面的に上位互換。** 学んで補強すべき箇所はほぼ無い |
| JD 解析（Phase 2）の実装は使えるか | **発想は使える。実装は作り直し。** 「捏造ゼロ」を謳いながら検証が projectId のみで、設計原則が破綻している |
| PR #15 に手戻りは発生するか | **しない。** Phase 1 の作り直しを迫る発見は無かった |
| 本当の論点は何か | **同じ問題を解く実装が 2 本、同じ repo に並存している**こと。片方を殺す判断が要る（§5） |

---

## 1. 何が見つかったか

Vercel プレビューはネットワークポリシーで到達不能（CONNECT 403）。ソースを直接探索し、
ブランチ `codex/monumental-editorial-redesign` に発見した。

```
studio.html                16KB   Lens Studio（JD 貼り付け → レンズ合成 UI）
scripts/studio-app.mjs     29KB   Studio の UI コントローラ
scripts/lens-engine.mjs    37KB   ★ ロジック本体（マッチャー・LLM・URL 圧縮）
scripts/evidence-db.mjs    39KB   証拠データ（13 件）
scripts/lenses.mjs         21KB   レンズ定義 4 本（手書きの静的オブジェクト）
scripts/build-lenses.mjs    8KB   静的ビルド
scripts/app.mjs / renderer.mjs    ランタイム再描画
lens/{creative,ai-product,advisor,venture}/
```

`docs/superforge-log.md` によれば、このブランチは Codex と Gemini 3.7 Flash が混在して作っている。
`studio.html` 最新コミットは 2026-09-11 14:59（多プロバイダ LLM 対応）。

**つまりこれは「参考にする外部実装」ではなく、Phase 1 と同じ問題を解いた競合実装である。**

---

## 2. 盗む価値があるもの（優先順）

### A. `LLM_PROVIDERS` レジストリ + `callLLM` アダプタ — STEAL

`lens-engine.mjs:569-840`。9 プロバイダ（OpenAI / Anthropic / Gemini / Groq / OpenRouter /
SiliconFlow / DeepSeek / Kimi / Custom）を、**テーブル 1 枚 + 本質的に形の違う 3 分岐**で処理している。

```js
if (provider === 'gemini')    { /* generateContent 形式 */ }
if (provider === 'anthropic') { /* Messages API, system 別出し */ }
// 残りは全部 OpenAI 互換の共通ブロック
if (['openai','groq','deepseek','siliconflow'].includes(provider)) {
  payload.response_format = { type: 'json_object' };
}
```

UI 側（`studio-app.mjs:556-594`）はこのテーブルを読むだけでモーダルを組み立てる。
if/else 地獄ではない、妥当なアダプタ設計。**OpenAI 互換系はテーブルに 1 行足すだけで増える。**

工数: 半日〜1 日。

### B. `extractJsonFromLlm` の 2 段階 JSON 復旧 — STEAL

`lens-engine.mjs:702-716`。```json フェンス除去 → `JSON.parse` → 失敗したら最初の `{` と
最後の `}` を切り出して再パース。20 行程度でコスト対効果が高い。

工数: 数十分。

### C. Playwright + axe-core による a11y / レイアウト回帰テスト — STEAL

`tests/portfolio.spec.mjs`。これは正直に中身がある:

- axe-core の WCAG A/AA スキャンを複数状態（既定・ダイアログ・モバイルメニュー・生成レンズ）で実施
- 320px リフロー時のオーバーフロー検出
- 200% 文字ズーム時の横スクロール検出
- Tab 全走査（可視性・アウトライン幅・ヘッダー被り）
- forced-colors モード、スキップリンクのフォーカス順

**これは現在のこちらの唯一の穴を正確に埋める。** `tests/lens-system.test.mjs`（22/22 pass）は
データ誠実性のビジネスルールを強制していて Gemini 側より一段上だが、**実ブラウザでの a11y /
レイアウト検証が皆無**。ハンドオフの「a11y 未実施」がここで具体的な TODO になる。

移植ではなく新規執筆（対象ページが違う）。工数: 中。

### D. URL 圧縮によるゼロバックエンド共有 — ADAPT（条件付き）

`lens-engine.mjs:17-255`。`CompressionStream('deflate-raw')` + base64url で Lens 設定 JSON 全体を
`?c=` に埋め込み、サーバーも DB も無しに共有リンクを発行する。非対応環境へのフォールバックあり、
ラウンドトリップのテストあり（`studio.test.mjs:64-88`）。技術としては地に足がついている。

**ただし機能ごと持ち込んではいけない。** 復元されるのは訪問者が渡した任意の JSON であり、
そのまま描画すると `src/validate.mjs` の Claim Guard / NotMine Guard を**完全に迂回する**。
導入するなら「復元 → 必ず同じ validate パイプラインに通す → 落ちたら描かない」が前提。

工数: 技術要素だけなら半日。設計層を足すなら中〜大。

### E. `CLUSTERS` 中間表現と決定論マッチャー — ADAPT（発想のみ）

`lens-engine.mjs:259-565`。`{keywords, primaryProjects, theses, defaultRole}` を束ねた
「意味クラスタ」は、こちらのフラットな capability タグより表現力が高い。スコアリングは
キーワード部分一致の重み付き加算（埋め込みも形態素解析も無い、完全オフライン・決定論的）:

```js
for (const kw of dominantCluster.keywords)  { if (blob.includes(kw)) score += 3;   }
for (const kw of secondaryCluster.keywords) { if (blob.includes(kw)) score += 1.5; }
```

**「LLM が使えない/失敗した時に決定論的経路へ静かに落ちる」という二段構え**は良い設計。
ただし CLUSTERS / COMMON_GAPS の中身は Takao 固有ハードコードで、こちらの capability id と
evidence slug に噛み合わせ直す必要がある。

工数: 半日〜1 日。

### F. `history.mjs` の URL 状態純粋関数 — STEAL（将来用）

25 行、DOM 非依存、テスト付き（3/3 pass）。`URL`/`URLSearchParams` 経由なので他のクエリや
ハッシュを壊さない。完全静的の現構成では出番が無いので「使う日が来たら」の保管。

### G. `assets.previewType` discriminant — ADAPT

`evidence-db.mjs:163` の `previewType: 'canvas'`。カードが「ライブ Canvas デモ」か静止画かを
型で区別している。こちらの `assets`（`schema.d.ts:135-141`）には `art`/`artLabel` はあるが
この分岐が無い。任意フィールドとして足すだけ。工数: 数時間。

---

## 3. 盗まないもの・地雷

| 対象 | 判定 | 理由（すべて実コードで確認済み） |
|---|---|---|
| `build-lenses.mjs` のビルド構造 | **SKIP** | 検証ゲートが無く `throw` も無い。壊れたデータをそのまま公開する。さらに `:47` の `.replace(/href="#/g, 'href="#')` は置換前後が同一文字列の **no-op バグ**。こちらの `build.mjs`（validate 必須・draft スキップ・`--check`・depth 動的算出）が明確に上位互換 |
| `evidenceStrength`（案件単位の一律強度） | **SKIP** | 全 13 件が `'strong'`。実質死んだフィールド。こちらの capability 単位 `strength` の方が上 |
| build と runtime で `renderer.mjs` を共有する構成 | **SKIP** | `app.mjs:343` が `mainContent.innerHTML = htmlParts.join('\n')` で**ビルド済み HTML と寸分違わぬ HTML を起動時に丸ごと作り直している**。差分適用なし。正規ページ訪問で再描画をスキップする分岐も無い。真似ると後退 |
| `project-data.mjs`（311 行） | **SKIP・要警戒** | どこからも import されていない**孤立ファイル**（grep 確認済み）。`CATEGORY_LINKS` が `../v3/...` を指す旧データ。「Gemini のデータモデルを参考に」と言われた時にうっかり読むと古い情報を持ち込む地雷 |
| `reducedMotion` / `view.scrollY` / スペーシャルトランジション | **SKIP** | `reducedMotion` は `app.mjs:78` で宣言されるだけで一度も参照されない。`scrollY` は `:202/:204` で history に積まれるが `popstate` ハンドラに `scrollTo` が無く**読み戻されない**。`data-transition-surface` は Playwright spec 内にしか存在せず実装が無い。**盗む実体が無い** |
| `portfolio.test.mjs` の文字列存在確認スタイル | **SKIP** | `assert.match(html, /id="advisory"/)` 的な確認が大半。こちらの validate 駆動テストの方が厳格 |
| ネイティブ DnD 並び替え（`studio-app.mjs:274-327`） | **SKIP** | HTML5 DnD のみでタッチ非対応。↑↓ ボタンで代替されている |
| `activeProviderBadge` の絵文字 if/else（`studio-app.mjs:520-554`） | **SKIP** | 絵文字違いのためだけの 9 分岐。`LLM_PROVIDERS` にフィールドを足せば消える「テーブル化し忘れ」 |

---

## 4. 最大の欠陥（Phase 2 で必ず塞ぐこと）

**`studio.html` は画面に "Zero fabricated claims" と書いているが、実装はそれを保証していない。**

決定論パスは capability を taxonomy と照合している:

```js
// lens-engine.mjs:409
for (const cap of ALL_CAPABILITIES) { ... directMatches.push(cap); }
```

ところが LLM パスは照合しない:

```js
// lens-engine.mjs:1016-1019
capabilityPriority: [
  ...(parsed.directMatches || []),   // ← LLM が書いた生文字列をそのまま採用
  ...(parsed.transferable || [])
].slice(0, 6),
```

LLM 出力に対して実際に走る検証は **projectId の実在確認だけ**:

```js
// lens-engine.mjs:973-975
const validatedProjects = (parsed.featuredProjects || [])
  .filter((p) => getProjectById(p.projectId))
  .slice(0, 5);
```

したがって以下は全部素通りする:

- 実在しない能力名（「Kubernetes 運用経験」等）が "Direct Proof Match" として表示される
- `customTagline` / `customSummary` / `highlightMetrics` の**数値の水増し**（92% → 98%）
- プロンプトに `CRITICAL RULE: YOU MUST NEVER INVENT OR HALLUCINATE...`（`:912-928`）と
  書いてあるが、**これは検証ではなくお願い**

さらにシステムプロンプトはプロジェクト 13 件の説明を**手打ちで二重管理**している
（`:915-928`）。`evidence-db.mjs` に同じ情報が構造化データとして存在するのに、そこから
動的生成していない。更新漏れが確実に起きる。

**Phase 2 の設計原則（ここから導く）:**

> **LLM には「選択」と「タグ付け」だけをさせる。事実文言（summary / metrics）は
> evidence library から逐語で取得する。LLM が書いた自由文は必ず `validateLens` を通し、
> 落ちたら公開しない。**

これは既に `schema.d.ts` の `angles`（承認済みの言い換えのみ選択可）と
`validate.mjs` の Claim Guard / NotMine Guard が持っている思想そのもので、
**Phase 1 の設計が正しかったことの裏付けになっている。**

---

## 5. 本当の論点 — 実装が 2 本並存している

| | `claude/stoic-pasteur-zhusuy`（PR #15） | `codex/monumental-editorial-redesign` |
|---|---|---|
| レンズ | 3（default / creative / ai-product） | 4（+ advisor / venture）※ すべて手書きの静的定義 |
| データモデル | `Localized` EN/JP・`angles`・capability 単位 `strength`・`metrics[].confidence`・`contribution.notMine` | 英語のみ・自由記述の `customTagline`・案件単位 `evidenceStrength`（全件 strong） |
| 事実ガード | Claim Guard / NotMine Guard をビルド失敗として強制 | 無し（表示レイヤーでの列分けと、プロンプトでのお願いのみ） |
| ビルド | validate 必須・draft スキップ・`--check`・depth 動的 | 検証なし・draft 概念なし・no-op バグあり |
| JD 解析 | 未実装（Phase 2 の置き場だけ用意） | **動く実装あり**（9 プロバイダ・URL 共有） |
| a11y テスト | 無し | **Playwright + axe で実測あり** |

**どちらかが死ぬべきで、それは `codex/monumental-editorial-redesign` の方。**
ただし上表の太字 2 つ（JD 解析の実装経験と a11y テスト）は、死ぬ前に回収する価値がある。

---

## 6. 訂正

サブエージェントの 1 本が「`index.html` と `styles.css` が存在せずテストが 2 件失敗する」と
報告したが、これは**こちらの抽出漏れ**（scratchpad に `scripts/` と `tests/` しか展開しなかった）
であって Gemini 側の欠陥ではない。両ファイルはブランチ上に存在する。

---

## 7. 次の一手（本人の判断待ち）

1. **PR #15 はこのまま出せる。** このレビューで手戻りは発生しない
2. Playwright + axe のテストを Phase 1.5 として足すか（§2-C）— ハンドオフの「a11y 未実施」の解消
3. Phase 2 に着手する時、§2-A/B と §4 の設計原則を出発点にする
4. `codex/monumental-editorial-redesign` を閉じるか、残すか
