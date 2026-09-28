# superforge-log — 例外だけの記録（活動ログではない）

## 2026-09-28 · superforge-brain / superforge-dev · 「その前にこっちをやって Typesafe.ai の Jev を開発に組み込んで」
Ran: BreakBias 掃引の分解の途中で中断 → Jev 組み込み（Medium、inline）→ 検証・セキュリティ確認・docs を Sonnet 3 台に分担 → 掃引を再開
Wrote: src/server/jev.mjs, src/pages/api/admin/jev/motion.ts, src/scripts/motion-lab-jev.js, tests/jev.test.mjs, docs/jev.md
Corrected: 「その前にこっちをやって」（掃引より Jev を先に）／「必要なエージェントの数を立ち上げ…無駄遣いしないモデルをアサインして…Fable 5.1 が豪華すぎるなら Opus 5.5 とか他のモデルをちゃんとアサインしてください」
Wrong: 初回の実装で、ブラウザ側スクリプトの 503 用の文言に環境変数名 `TYPESAFE_API_KEY` の文字列を書き、自分のテスト（鍵の名前がブラウザに出ない）が落ちた。別コンテキストの検証エージェントが検出、文言を差し替えて 173/173。

## 2026-09-28 · superforge-brain · 「B」（BreakBias sweep、standard）
Ran: 分解（Fable）→ 生成 Opus × 4（310 セル）→ 選別 Opus × 4 → 救済（Fable、36 件中 9 件を戻す）→ 再訪 → 審判 Sonnet × 4（286 件）→ 統合
Wrote: docs/product-idea.md, docs/product-idea.html, docs/motion-lab/breakbias/{brief,kill-pass,judge}.md, ledger/*, scripts/breakbias-{ledger,report}.mjs
Corrected: 「これが必ずしもいけないとは思わないんですけどね 簡単に使わなきゃいけないから」（禁止 3 案への異議 → 禁止は生成だけ、再訪で全件を審判に戻すと説明）
Wrong: 選別エージェント 4 台とも、セルの「除去した版」だけを見て C（既出・勝ち筋なし）を付け、「代替する版」の勝ち筋を見落とした（36 件中 9 件が誤殺）。救済パスで検出。次回は kill-pass.md に「両方の枝を見る」と明記する。
