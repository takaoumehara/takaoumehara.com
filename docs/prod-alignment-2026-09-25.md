# 本番 (www.takaoumehara.com) と PR #23 ブランチの整合レポート — 2026-09-25

> 作成: Claude Code セッション（ブランチ `claude/wizardly-franklin-8srztg`、PR #23 `cursor/fix-project-detail-navigation-3b61` の tip `bbd8f0c` から分岐）

## 結論

- **この作業環境からは本番を取得できなかった**（`www.takaoumehara.com` と `www.portorocha.com` への HTTPS は egress ポリシーで 403）。よって「本番 == 意図した Preview か」は**梅原さん側で下のチェックリストを実行して確認**してほしい。
- 手元でこのブランチをビルドした結果、ハンドオフに書かれた「新シェル」のマーカーはすべて揃っている（下表）。**本番に古いシェル（Inter・画像サムネの左レール・news-bento）が出るなら、原因はコードではなくデプロイの割り当て**。
- 最も可能性が高い原因: **Vercel の Production は `main` の自動デプロイに上書きされる**。`main` の tip は `045114d`（IA redesign）で、PR #23 のコミット（Outfit・イニシャルタイル・`/work` 全画面・Verizon 実写ティーザー）を含まない。Preview を Promote しても、その後に `main` へ push（またはダッシュボードの Redeploy）があると Production は `main` のビルドに戻る。
- **推奨の次の一手: PR #23（＋この作業を積んだ PR）を `main` にマージする。** Promote は一時的なスナップショットで、Git 連動の Production デプロイに毎回負ける。マージが本番を安定させる唯一の方法。

## 手元ビルドのマーカー（このブランチ、`npm run build` 成功）

| マーカー | 期待値（新シェル） | 手元ビルド |
|---|---|---|
| Google Fonts の `<link>` | `family=Outfit:wght@400;500;600` を含む | ✅ 含む |
| 左レールのイニシャルタイル | `class="side-initials"` が home HTML に存在 | ✅ 4 行（画像のない案件） |
| `/work` 全画面 | `work.html` の `<body class="work-fullscreen">` | ✅ |
| `/all` | `/work` へ 301/308 | ✅ `vercel.json` の redirects |
| Verizon AI Workflow のティーザー | `/projects/verizon-ai-agents.html` に `<img class="project-teaser-media" src="/assets/verizon-ai-agents/hero-agents-network.jpg">` | ✅ |
| home | 新ランディング（ヒーロー・スライドショー＋ニュース bento）※本 PR で追加 | 本 PR で確認 |

※ Verizon AI Workflow の URL は `/projects/verizon-ai-workflow` ではなく **`/projects/verizon-ai-agents.html`**（`links.caseStudy` 由来）。

## 梅原さんが 3 分でできる本番チェック

ターミナルで（ブラウザなら「ページのソースを表示」で同じ文字列を探す）:

```bash
curl -s https://www.takaoumehara.com/ | grep -o 'family=Outfit[^&"]*'          # 出れば新シェル
curl -s https://www.takaoumehara.com/ | grep -c 'class="side-initials"'        # 0 なら旧シェル
curl -s -o /dev/null -w '%{http_code}\n' https://www.takaoumehara.com/all      # 301/308 が期待
curl -s https://www.takaoumehara.com/work.html | grep -o 'class="work-fullscreen"'
curl -s https://www.takaoumehara.com/projects/verizon-ai-agents.html | grep -o 'hero-agents-network.jpg'
curl -sI https://www.takaoumehara.com/ | grep -i -E 'x-vercel-(id|cache)|age:|cache-control'
```

Vercel ダッシュボードで:

1. Project → **Deployments** → フィルタ **Production** → 一番上（Current）の **Source** のコミット SHA を見る。
   - `bbd8f0c`（またはそれ以降の PR ブランチのコミット）なら Promote は効いている。
   - `045114d` や `main` のコミットなら、**`main` の自動デプロイに上書きされている**（上の結論）。
2. Project → **Settings → Domains** → `www.takaoumehara.com` が **Production** に割り当てられているか（特定 deployment に固定されていないか）。
3. 古い HTML がまだ出るのに Current が新しい場合のみ、ブラウザのハードリロード（`x-vercel-cache: HIT` でも deployment が変われば無効化されるので CDN 側の残留は稀）。


## 追記: Vercel プロジェクトが 2 つある

この PR の Vercel bot コメントによると、同じリポジトリから **2 つの Vercel プロジェクト**（`takaoumehara-com` と `takaoumehara-com-ybtq`）が Preview をビルドしている。
**「Promote したのに本番が古い」の最有力候補はこれ**: `www.takaoumehara.com` のドメインが片方のプロジェクトにしか割り当てられておらず、Promote をもう片方のプロジェクトで行った可能性がある。

確認手順: Vercel → 両プロジェクトの **Settings → Domains** を見て、`www.takaoumehara.com` / `takaoumehara.com` がどちらに付いているかを確認し、**そのプロジェクト**で Production デプロイの Source コミットを見る。ドメインの無い方のプロジェクトは削除するか、Git 連携を切って混乱を止めるのが安全。

## 直し方の選択肢

| 方法 | 効果 | 副作用 |
|---|---|---|
| **A. PR をマージ（推奨）** | Production = main = 意図したシェル。以後の push も一貫 | PR #23 は draft。Takao の承認が要る（このセッションではマージしない） |
| B. 正しい Preview を再 Promote | 即時反映 | 次の `main` push / Redeploy で再び戻る |
| C. Production Branch を PR ブランチに変更（Settings → Git） | main を触らずに固定 | ブランチ運用が歪む。恒久策ではない |
| D. `main` を PR ブランチに fast-forward | A と同じ結果 | PR の履歴が残らない |

## この PR での前提

- このセッションの成果はブランチ `claude/wizardly-franklin-8srztg`（PR #23 の tip から分岐）に push し、**base を `cursor/fix-project-detail-navigation-3b61` にした draft PR** として積む。PR #23 をマージしたあと、この PR の base を `main` に付け替えれば差分はそのまま。
