# Jev（TypeSafe AI）— Motion Lab の判定役

> Last updated: 2026-09-28 / 対象: `src/server/jev.mjs`, `/api/admin/jev/motion`, `src/scripts/motion-lab-jev.js`

---

## 1. Jev とは何か、何に使うか

Jev は TypeSafe AI の「System One」というモデル。文章を書くモデルではない。
状態（state）と、名前つきの質問（questions）を渡すと、質問ごとに型つきの答えと確信度
（confidence）を返す。質問には 3 種類ある。

- `noul` … はい/いいえを確率で返す
- `choice` … 選択肢を 1 つと、各選択肢の確率を返す
- `score` … 順序のあるルーブリックの中の点数を返す

Jev はテキストを生成しない。答えは常にこの型のどれかで、確率つきで返る。

このサイトでは Motion Lab（読み込みアニメーションの調整画面）の判定役として使っている。
理由は、Motion Lab で調整する内容が「人が目で見て判断すること」だから。
たとえば読み込みがどう感じられるか、体感としてどれくらいの時間に見えるか、
指定した雰囲気（リクエスト文）に合っているか。これらは数値の比較だけでは決められない。

逆に、コードの 1 行で判定できるルール（`prefers-reduced-motion` を尊重しているか、
上限（cap）があるか、など）は Jev に聞かない。そうしたチェックは引き続きコードで行う。
`src/server/jev.mjs` の冒頭コメントにも同じ切り分けが書いてある。

---

## 2. 仕組み

```
Motion Lab パネル（?lab=1 をつけて開いたページ）
  └─ 「Ask Jev」ボタン
       └─ POST /api/admin/jev/motion（Clerk でサインイン済みの管理者のみ・same-origin）
            └─ src/pages/api/admin/jev/motion.ts
                 ├─ requireAdmin() … 管理者でなければ 401 / 403
                 ├─ sameOrigin() … 別オリジンからの POST は 403
                 └─ handleJudgeMotion()（src/server/jev.mjs）
                      └─ TypeSafeClient.systemOne() で
                           POST https://api.typesafe.ai/v1/systemone
                           （Authorization: Bearer <TYPESAFE_API_KEY>）
                                └─ Jev の答え（answers・確信度・usage）
                      └─ readAnswers() が答えを 1 行ずつの文字列に変換
       └─ src/scripts/motion-lab-jev.js が応答をパネルのステータス行に表示
```

鍵（`TYPESAFE_API_KEY`）はサーバー（`src/server/jev.mjs`）でしか読まない。
ブラウザに届くのは `/api/admin/jev/motion` のレスポンス（答えと読み上げ用の文字列）だけで、
鍵そのものがブラウザに渡ることはない。`tests/jev.test.mjs` がこれを検査している
（レスポンス本文に鍵の値が含まれないこと、`motion-lab.js` などのブラウザ側スクリプトが
`@typesafe-ai/sdk` や鍵の変数名を含まないこと）。

---

## 3. 鍵の置き場

環境変数名は `TYPESAFE_API_KEY`（`src/server/jev.mjs` の `ENV_KEY`）。置き場は 3 か所。

1. Vercel のプロジェクトの Environment Variables（2026-09-28 に設定済み）
2. Claude のクラウド環境の設定（今後のエージェントのセッションからも呼べるように）
3. ローカルの `.env`（`.gitignore` 済みなのでコミットされない。`.env.example` の
   「Jev（TypeSafe AI）」の節に変数名だけが書いてある）

ルール: 鍵をチャットに貼らない。コミットしない。この 3 か所以外に置かない。

鍵が無いあいだは、`/api/admin/jev/motion` は 503 を返し、エラーコードは
`jev-not-configured`。パネルはこれを受けて「Jev is not configured: …」とステータス行に表示する
（`describeJevResult` in `src/scripts/motion-lab-jev.js`）。Motion Lab のそれ以外の機能
（プリセットの調整・プレビュー・書き出しなど）は鍵の有無に関係なく動く。

---

## 4. いま Jev に聞いていること

質問は `src/server/jev.mjs` の `motionQuestions()` が組み立てる。渡す状態（state）は
`motionState()` が作り、config 本体・用語集（`MOTION_GLOSSARY`）・サイトのルール
（`MOTION_RULES`）、リクエスト文があればそれも含む。

| 質問名 | 型 | 聞いている内容（要約） | 答えの表示（`readAnswers()`） |
|---|---|---|---|
| `feel` | choice | 用語集に照らして、初めて訪れた人がこの読み込みをどう感じるか（quiet / lively / loud） | `feel: <選択肢> (<確信度>%)` |
| `wait` | score | 最初の読み込みが体感どれくらいの長さに感じるか（`WAIT_LEVELS` の 4 段階のルーブリック） | `wait: <段階名> (<点数>/3)` |
| `readable` | noul | 最初の読み込みから約 1 秒以内に本文を読み始められるか | `readable in 1 s: <確信度>%` |
| `rules` | noul | `state.rules`（`MOTION_RULES`）の範囲に収まっているか | `within the rules: <確信度>%` |
| `matchesRequest` | noul | `state.request` が指定する雰囲気に config が合っているか | `matches the request: <確信度>%` |

`matchesRequest` は、パネルの入力欄にリクエスト文が入力されているときだけ質問に加わる
（空欄や空白だけの入力では加わらない。`judgeMotion()` の `ask` 判定を参照）。

リクエスト文は `MAX_REQUEST_CHARS`（`src/server/jev.mjs` で `600`）文字にトリムしてから送る。
先頭と末尾の空白を取り、`slice(0, MAX_REQUEST_CHARS)` で切り詰める。

---

## 5. 使い方

1. `/admin` でサインインする（オーナーのアカウント。`ADMIN_EMAILS` に登録された、
   プライマリで確認済みのメールアドレスのみ。`docs/admin.md` 参照）。一度サインインすれば、
   同じブラウザで Motion Lab を開くたびにやり直す必要はない（Clerk のセッションが続く間）。
2. 任意のページを `?lab=1` を付けて開く（例: `https://takaoumehara.com/?lab=1`）。
   Motion Lab パネルが表示される。
3. プリセットやスライダーで config を調整する。
4. 必要なら「What should it feel like?」の欄に、狙っている雰囲気を短い文で入力する
   （任意。空欄なら `matchesRequest` は聞かれない）。
5. 「Ask Jev」を押す。ボタンが一時的に無効になり、「Asking Jev…」の後にステータス行へ
   答えが並ぶ（例: `Jev (jev-latest): feel: lively (71%) · wait: brief (1.3/3) · …`）。

ステータス行に出るエラーの意味（`describeJevResult()`）。

- **401**: サインインしていない。`/admin` で先にサインインしてから、もう一度押す。
- **403**: サインインはしているが、そのアカウントはオーナーとして許可されていない。
- **503**: `TYPESAFE_API_KEY` が設定されていない（§3 参照）。
- **502**: Jev が拒否した、または応答できなかった（TypeSafe 側のエラー、もしくは
  ネットワークに到達できない）。

---

## 6. 質問を増やす・変える

編集する場所はすべて `src/server/jev.mjs`。

- `motionQuestions()` … 質問そのもの（名前・型・文面・選択肢やルーブリック）
- `readAnswers()` … その答えをステータス行にどう表示するか
- `MOTION_GLOSSARY` … config のキーが何を意味するかを Jev に説明する用語集
- `MOTION_RULES` … Jev に守ってほしいサイトのルールの一覧

質問を追加・変更したら、**同じ変更の中で** `tests/jev.test.mjs` も更新する
（新しい質問のキー、型、答えの表示形式をテストが検査しているため）。

3 つの質問型の使い分け。

- `noul` … はい/いいえで割り切れる判定に使う（例: ルールを守っているか）。
- `choice` … 互いに排他な選択肢からひとつ選ばせたいときに使う（例: quiet / lively / loud）。
- `score` … 段階のあるものさし（ルーブリック）で測りたいときに使う（例: 体感の長さ）。

---

## 7. 費用と上限

料金・レート制限・トークン上限は不明・要確認（TypeSafe のコンソールで確認）。

SDK 側の既定値として分かっているのは次のとおり。

- SDK の既定は「初回に加えて 2 回リトライ（408 / 429 / 5xx）、1 回の試行あたり 10,000 ms」。
  このサイトでは `jevClient()` が上書きしている（`RETRY`, `TIMEOUT_MS`）:
  リトライは 1 回だけ、**429（レート制限）は再試行しない**（試すほど課金が増えるため）、
  1 回の試行は 6,000 ms。Vercel の関数の既定の実行上限（10 秒）に収めるための値。

このサイトの API ハンドラー（`handleJudgeMotion()`）側では、リクエスト本文の上限を
`MAX_BODY`（`src/server/jev.mjs` で 64 * 1024、64 KB）に定めていて、これを超えると
Jev を呼ぶ前に 413 を返す。

---

## 8. 確認方法

`npm test` を実行すると `tests/jev.test.mjs` が走る。TypeSafe への実通信はせず、
`fetch` をスタブ（`fakeJev()`）に差し替えて、リクエストの中身・鍵の扱い・エラー応答の形を検証する。

実際に TypeSafe へ通信して確かめる場合は、Vercel のプレビュー環境で `/admin` にサインインし、
Motion Lab の「Ask Jev」を押して確認する。

Claude のクラウド環境は、現時点では `api.typesafe.ai` への通信をネットワークポリシーで
許可していない。そのため、この環境で作業するエージェントは、スタブを使った
`tests/jev.test.mjs` の実行までを確認手段とし、実際の疎通確認は Vercel のプレビューで行う。

---

## 9. 未決・次の候補

- CLI（例: `scripts/jev-motion.mjs`）を追加し、ブラウザを開かずに `motion.json` を
  ターミナルから Jev に判定させられるようにするかどうか。他の AI セッションが
  config を検証したいときに使える。
- ユーザーごとのレート制限を `/api/admin/jev/motion` に足すかどうか（現状は
  管理者のみに絞る以外の制限は無い）。
- 将来の v2 の config（`docs/motion-lab/library-plan.md`）も Jev の判定対象にするかどうか。

---

## 提案（Suggest 3）

Motion Lab の「Judge with Jev」の行にある **Suggest 3** は、入力欄の一文（空でもよい）と今の config から、
候補の config を 3 つ出す。

- **生成は規則ベース（LLM なし）**: `src/server/motion-suggest.mjs` の `LEXICON` が、言葉（日本語・英語）を
  config の差分に変える。例: 静か/quiet → 速度 ×0.75・幕は none/dissolve/field・文字は fade、
  速い/fast → 速度 ×1.6・上限を短く、派手/loud → スラブの幕・wipe・band-sweep と退場 reverse、
  ゆっくり/slow → ×0.6、幕/curtain → スラブ、色/グラデ → field、文字/type → Terminal・Decode・Kanji、
  箱/skeleton → Skeleton・Viewfinder、音/sound → サウンド on、スマホ/mobile → 上限 1.2 s。
  知らない言葉は無視し、言葉が無くても見た目の違う 3 案を出す。幕・開き方は、語彙の中で
  スタイル・レジストリ（`src/scripts/styles/index.mjs`）に実在する id だけを使う。
  乱数はシード付き（同じ文・同じシードなら同じ 3 案）。結果は必ず `upgradeConfig()` を通した v2 で、
  `global.speed` は 0.3〜4、上限（capMs / navCapMs）は 300 ms 以上に丸める。
- **Jev は並べ替えるだけ**: 3 案それぞれを `judgeMotion()` に一文つきで渡し、`matchesRequest` の確率が
  高い順に並べる（カードに Jev の読みも出る）。
- **鍵が無くても動く**: `TYPESAFE_API_KEY` が無い、または Jev が失敗したときは、3 案を並べ替えずに返す
  （`judged: false`、`error: "Jev is not configured"` / `"Jev unreachable"`）。この場合も 200 を返す。
- **管理者のみ**: `POST /api/admin/jev/suggest`（`src/pages/api/admin/jev/suggest.ts`）。
  `/api/admin/jev/motion` と同じく middleware + `requireAdmin` + 同一オリジン。本文の検査も同じ
  （415 / 413 / 400、形が違えば 422）。一文は 600 文字で切る。
- **カード**: 「Try」で候補をパネルに読み込み（自動再生が on なら再生される）、「Copy JSON」でその config を
  クリップボードへ。テストは `tests/suggest.test.mjs`。
