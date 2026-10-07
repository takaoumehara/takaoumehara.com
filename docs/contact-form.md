# メッセージフォーム

About の `#work-with-me` に配置。名前、返信先メール、メッセージだけを必須にする。
本人のメールアドレスは公開 HTML に出さない。フォームの成功表示は Resend が送信を受け付けた場合だけ。
実際の受信・配送完了は別途確認が必要。

## Vercel の設定

Preview と Production の必要な環境に、次をサーバー側環境変数として設定する。

- `RESEND_API_KEY`: Resend の送信専用キー。`PUBLIC_` 接頭辞を付けない。
- `CONTACT_FROM`: Resend で認証済みのドメインを使った送信元。
- `CONTACT_TO`: 本人の受信先。既存 Gmail を想定。設定は `.env.example` を参照。

ドメイン認証とキー設定は未実施。設定後は再デプロイして、実際の受信と返信先を確認する。
設定がない間は 503 を返し、フォームは LinkedIn の代替連絡先を案内する。

## 送信処理

`POST /api/contact` → Resend Email API。SDK を追加せず、サーバー側 fetch を使用。
仕様: https://resend.com/docs/api-reference/emails/send-email

同一 origin 検査、24 KB のストリーム制限、入力長とメール形式の検査、隠しフィールド、
インスタンスごとの 1 分 3 回制限、10 秒タイムアウト、再送用 idempotency key を使用。
受信者はサーバー設定から固定。訪問者のアドレスは `reply_to`。本文はプレーンテキスト。
秘密値やメッセージ本文をログに記録しない。

インスタンス内制限は分散された全サーバーを横断しない。公開時に Vercel WAF で
`POST /api/contact` の IP ごとのレート制限を設定する。未設定では分散ボット対策は未完了。

送信失敗時は入力内容を残す。JavaScript 無効時にも HTML の結果ページを返す。
訪問者への自動返信は送らない。第三者メールへの送信経路を作らないため。
