# Home・About・作品一覧の役割

既存の二列レイアウト、モノクロ、bento、作品 Hero の表現を保つ整理。

- Home: 作品 Hero → 名前・肩書き・短い紹介 → Updates。
- About: 顔写真と人物紹介 → What I bring → 経歴 → 数字と企業名 → Now・出版・教育等 → Work with me。
- 左パネル: 名前・設定・募集中の情報 → About → All Work と検索 → 01–05 カテゴリ。
- `/work`: 左パネルを保ち、右側に検索とフィルタ付き全作品一覧。
- `/now` と旧別名は `/about#now` へ。Now は Home に重複させない。

## 紹介

Takao Umehara / Principal Product Designer & AI Product Builder

> I turn ambiguous ideas into brands, products, and experiences — across digital and physical worlds.

ブランドと実空間の体験を一文に含める。AI は肩書きで伝える。
サービス・体験・イノベーション戦略は About の具体的な強みと作品に結びつける。

顔写真は About のみ。Resume の共通導線は撤去。
企業名は一つの一覧とし、制作・教育・メンタリング・ワークショップを含む旨を一文で添える。
企業との関わり方の記録は `src/data/about.mjs` に残し、事実を変更しない。

新しい色・書体・ライブラリは追加せず、既存の `src/styles/tokens.css` を使用。
問い合わせフォームの設定は `docs/contact-form.md` を参照。
