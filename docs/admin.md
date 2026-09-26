# 管理画面（/admin）— 設定と使い方

> Last updated: 2026-09-26
> 対象: `/admin`、`/api/admin/*`、`src/data/showcase.json`

サイトの一部を、コードを触らずにブラウザから変えるための画面。
最初の項目は **トップのスライド（Hero showcase）**：どの作品を、どの順番で、どの画像で出すか。
項目はあとから増やせる作りにしてある（§6）。

---

## 1. 仕組み（先に全体像）

```
/admin（ブラウザ）
  └─ Clerk でサインイン
       └─ サーバーが「プライマリで確認済みのメールアドレス」が ADMIN_EMAILS にあるか確認
            └─ 編集して「保存して公開」
                 └─ POST /api/admin/showcase
                      ├─ サーバーで再検証（作品が存在するか・画像が public/ にあるか・形式）
                      └─ GitHub の main に src/data/showcase.json をコミット
                           └─ Vercel が自動で再ビルド（1〜2 分）→ トップページに反映
```

- 公開ページはこれまでどおり**静的**。Clerk のスクリプトは `/admin` にしか載らない。
- 画面の表示も保存も、**許可はすべてサーバー側で判定**する。ブラウザ側の表示切り替えは信用しない。
- Clerk のキーが無いあいだは、`/admin` は「未設定です。この環境変数を入れてください」と表示し、
  `/api/admin/*` は 503 を返す。サイトのビルドと公開ページには影響しない。

---

## 2. Clerk の準備

1. <https://dashboard.clerk.com> でアプリケーションを作る（名前は例: `takaoumehara.com`）。
   サインイン方法は **Email** を有効にする（Google でのサインインも使うなら追加）。
2. **サインインできる人を絞る**（推奨）。Clerk ダッシュボードの制限設定（Restrictions）で、
   サインアップを制限し、許可リスト（Allowlist）に `takaoumehara@gmail.com` を入れる。
   - これをしなくても、ADMIN_EMAILS に無いアカウントは管理画面にも API にも入れない。
     ただ、関係ない人がアカウントを作れてしまう状態は避けたほうがよい。
3. **API keys** を開き、次の 2 つを控える。
   - Publishable key（`pk_test_…` または `pk_live_…`）
   - Secret key（`sk_test_…` または `sk_live_…`）— **サーバー専用。どこにも貼らない。**
4. 開発用（Development）インスタンスのキー（`pk_test_` / `sk_test_`）で、まず動作を確認できる。
   本番で使い続けるなら Production インスタンスを作り、ダッシュボードの案内どおりに
   `takaoumehara.com` の DNS レコードを追加してから、本番のキーに差し替える。

`takaoumehara@gmail.com` で一度サインインし、メールアドレスの確認（コード入力）を済ませておく。
**確認済みでないメールアドレスは管理者として扱わない。**

---

## 3. GitHub トークン（保存に必要）

保存は GitHub への commit なので、書き込み用のトークンが要る。

1. GitHub → Settings → Developer settings → **Fine-grained tokens** → Generate new token
2. Repository access: **Only select repositories** → `takaoumehara/takaoumehara.com`
3. Repository permissions: **Contents → Read and write**（ほかは不要）
4. 有効期限を決めて発行し、値を控える。期限が切れたら作り直して差し替える。

トークンが無くても管理画面は使える。そのときは「保存」で検証だけ行い、
`showcase.json` のダウンロードを案内する（§5.3）。

---

## 4. Vercel に環境変数を入れる

Vercel のプロジェクト **`takaoumehara-com`** → Settings → Environment Variables。

| 名前 | 値 | 備考 |
|---|---|---|
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_…` | Clerk の Publishable key |
| `CLERK_SECRET_KEY` | `sk_…` | Clerk の Secret key。Sensitive にする |
| `ADMIN_EMAILS` | `takaoumehara@gmail.com` | カンマ区切りで複数可。未設定でもこの値になる |
| `GITHUB_TOKEN` | `github_pat_…` | §3 のトークン。Sensitive にする |
| `GITHUB_REPO` | `takaoumehara/takaoumehara.com` | 任意（既定値と同じ） |
| `GITHUB_BRANCH` | `main` | 任意（既定値と同じ） |

- 対象環境は少なくとも **Production**。プレビューでも使うなら Preview にも入れる。
- 入れたら **Redeploy** する（環境変数は再デプロイ後に効く）。
- どれもリクエスト時に読むので、ビルドには不要。キーが無い状態でもビルドは通る。

ローカルで試すときは、`.env.example` を `.env` にコピーして値を入れ、`npm run dev` → <http://localhost:4321/admin>。
`.env` はコミットしない（`.gitignore` 済み）。

---

## 5. 使い方 — トップのスライド

### 5.1 画面

- **スライド一覧**：上から順にトップページのスライドになる。
  - 左端をドラッグして並べ替える。キーボードでは各行の **↑ / ↓** ボタンで動かす。
  - **画像の選択**：
    - `自動` … その作品の詳細ページが最初に見せるもの（動画があれば動画）。既定値。
    - `動画` … 作品のプレビュー動画（ある作品だけ表示される）
    - `ヒーロー画像` / `サムネイル` … 作品データに登録してある画像
    - そのほか … `public/assets/<作品のフォルダ>/` にある画像
  - **表示（On）**：外すと、一覧には残したままトップページから外れる。
  - **×**：一覧から外す。
- **作品を追加**：ライブラリの作品（インタラクティブ → クライアントワークの順）から選んで追加する。
- **プレビュー**：最初に表示されるスライドを、選んだ画像で確認できる。
- 既定の並びは、インタラクティブ作品が先、その後にクライアントワーク。

画像のない作品（例：いまの `kao-game`）は一覧に残せるが、トップページでは表示されない。
画像が追加されれば、自動で表示されるようになる。

### 5.2 保存

「保存して公開」を押すと、サーバーがもう一度すべて検証してから
`src/data/showcase.json` を `main` にコミットする。Vercel が再ビルドし、1〜2 分でトップページに反映される。
コミットには「どのアカウントが /admin から保存したか」が残る。元に戻したいときは、そのコミットを revert すればよい。

保存の直後は、管理画面に表示される「現在の内容」は再ビルドが終わるまで古いまま。
続けて編集する場合は、反映を待ってから再読み込みする（保存はファイル全体の上書きなので、古い画面から保存すると直前の変更を戻してしまう）。

### 5.3 GITHUB_TOKEN が無いとき

「保存して公開」は検証だけ行い、「保存は未設定です」と表示して、検証済みの `showcase.json` のダウンロードを案内する。
ダウンロードしたファイルを `src/data/showcase.json` に置いてコミットすれば、同じ結果になる。
「ダウンロード」ボタンはいつでも使える（検証前の、画面の内容そのまま）。

---

## 6. データと、項目の追加

`src/data/showcase.json`：

```json
{
  "slides": [
    { "slug": "werewolf", "media": "auto", "enabled": true },
    { "slug": "xq", "media": "assets/xq-canvas/XQCanvas_inAction.jpg", "enabled": true }
  ]
}
```

- `slug` … `src/data/<種類>/<slug>.json` の作品
- `media` … `auto` / `preview` / `hero` / `thumb` / `assets/…` の画像パス
- `enabled` … `false` でトップページから外す
- `src/data/news.mjs` の `SHOWCASE`（トップページが読む順番）は、このファイルから作られる。
- 解釈と検証は `src/lib/showcase.mjs` にまとまっている（トップページ・管理画面・API で同じコード）。

管理項目を増やすとき：

1. `src/pages/admin/_sections.ts` に項目を 1 つ足す（ナビに出る）。
2. `src/pages/admin/<項目>.astro` を作り、`_AdminShell.astro` の中に描く（`export const prerender = false`）。
3. 保存が要るなら `src/pages/api/admin/<項目>.ts` を作り、先頭で `requireAdmin()` と
   `sameOrigin()`（`_auth.ts`）を呼ぶ。`/admin` と `/api/admin/*` はミドルウェアが先に守っている。

---

## 7. セキュリティのメモ

- **判定はサーバーだけ**：`src/middleware.ts` が `/admin` と `/api/admin/*` で Clerk のセッションを検証し、
  プライマリで確認済みのメールアドレスが `ADMIN_EMAILS` にあるかを見る。API は各ハンドラーでもう一度確認する。
- **CSRF**：保存は同一オリジンからの `application/json` の POST だけを受け付ける（`Origin` / `Sec-Fetch-Site` を確認）。
  さらに Clerk のセッショントークンを `Authorization` ヘッダーで送り、そのトークンが同じオリジンで発行されたものかも確認する。
- **入力の検証**：作品が存在するか、画像パスが `assets/` 配下で実在するか、項目名と型、件数の上限、重複を検証する。
  画像の一覧はビルド時に `public/assets/` から作る（`astro.config.mjs` の `virtual:admin-media`）。
- **秘密はクライアントに出さない**：ブラウザに届くのは Publishable key だけ。Secret key と GitHub トークンはサーバーでのみ読む。
- `/admin` は `noindex`、キャッシュしない、フレーム埋め込み不可。

### Clerk の Astro 連携について

Clerk の公式手順（`clerk()` インテグレーション + `output: "server"`）は使っていない。
インテグレーションは**すべてのページ**に Clerk の読み込みスクリプトを差し込むため、公開ページを静的なまま保てない。
代わりに、Clerk のミドルウェア（`@clerk/astro/server`）を `/admin` と `/api/admin/*` だけで動かし、
ブラウザ側の初期化（`@clerk/astro/internal` の `runInjectionScript`、インテグレーションが差し込むのと同じ処理）を `/admin` のページだけで呼んでいる。
`@clerk/astro` を更新したときは、この 2 つの使い方が変わっていないかを確認する。
