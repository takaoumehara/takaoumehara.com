# 2026-09-28 — H3a スラブ起動 / H3c 呼吸 / H3d 合成音

- **boot `slabs-puzzle`（`styles/boot-slabs.mjs`）**: `ctx.layer("boot")` に `grid`×`grid`（既定 3）の ink / paper 市松スラブを敷き、四方（左・上・右・下の順）から `±rotateDeg` 回転 + scale 1.05 で滑り込ませる。`stepMs` 刻み・`durationMs`・イージングは power4.out 相当の `cubic-bezier(0.23, 1, 0.32, 1)`。最後が着地したら `snap`、`holdMs` 待って全枚 opacity 1→0 / scale 1→1.04 で退場、`ctx.drop("boot")`。
- **速度と上限**: 全 duration に `ctx.k` を掛け、合計が `ctx.capMs` を超えるなら全体を同じ比で縮める。/lab/stage の既定（speed 1.7）では約 0.85 秒。
- **入力で即終了**: hold も「値の変わらない WAAPI」を `ctx.own` して待つので、入力の `finishAll()` で途中でも切れる。レイヤーが外されていたら（入力・次の replay）以降は何もしない。paper スラブは地と同色なので `tokens.line` の 1px 内側線を付けた。
- **idle `breathing`（`styles/idle.mjs`）**: `#main` の最外側のセル（`.bento-cell, .grid-card, .hn-article, [data-href]`）ごとに、`none → translate(±drift) rotate(±turn) scale(1+swell)` を `alternate` / `Infinity` / `ease-in-out` / `composite: "add"`。位相は負の delay ではなく 0〜period の正の delay で付けた（開始時に跳ねないため）。
- **パララックス**: `pointermove` → rAF で目標へ 0.12 ずつ寄せ、各セルの `style.translate`（transform と合成される個別プロパティ）に書く。セルごとに奥行き 0.5〜1。`stop()` で全アニメを cancel、リスナーを外し、`translate` と（元に無ければ）空の `style` 属性まで戻す。
- **sound（`styles/sound.mjs`）**: `unlock()` 前は何も作らない。unlock 時に sound が有効なら AudioContext を作る。無効なら作らず、後で有効にされた最初の `play()` で作る（本番の既定オフで全訪問者に音声デバイスを開かないため）。swoosh = sine 140→35Hz / 0.32s + lowpass 800Hz、snap = triangle 880→160Hz / 0.08s（音量は volume × 0.72、原本の 0.18 : 0.25）。60ms に 1 回まで。全部 try/catch。
- **確認**: `node --test tests/styles-boot-idle-sound.test.mjs` 7/7。Playwright（/lab/stage, dev 4304）で boot 中 9 枚の `.mo-overlay`・終了後オーバーレイ 0・テキスト不変、idle 7 セル・replay 直後 0 → 落ち着くと 7、idle none でアニメ 0・translate 0、音はジェスチャ前 0 / 後 1 / 無効 0、コンソールエラー 0。
- **注意**: 同じ作業ツリーを他の担当者が編集中だと、Vite の HMR がページを再読み込みしたり、書きかけのファイルが 500 になってページのスクリプトが走らないことがある。証明スクリプトは HMR の WebSocket を塞ぎ、`bindMotion()` を自分でも呼ぶ（冪等）。
