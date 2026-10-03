# 2026-09-28 · Interactions（押下・ホバーの手触り）を Motion Lab から調整可能に

- `src/styles/transitions.css` のリテラルを `:root` の CSS 変数に置き換えた（既定値は元の値のままなので、見た目は変わらない）:
  押下 `scale(0.985)` → `--ix-press-scale`、押下 `90ms` → `--ix-press-ms`、バネ戻り `380ms` → `--ix-spring-ms`、
  レール行 `translateX(3px)` / `60ms` → `--ix-nudge-px` / `--ix-nudge-ms`、画像の寄り `5px`（= ポインタ位置 ±0.5 × 5px、最大 2.5px）→ `--ix-lean-px`、
  矢印 `translateX(4px)` → `--ix-magnet-px`。
- オン／オフ用の倍率 `--ix-press`（押下）と `--ix-hover`（画像の寄り＋拡大 1.04、矢印、リンクの吸い寄せ）を追加。既定は 1、0 で無効。
- `src/scripts/motion-interactions.mjs`: `INTERACTION_DEFAULTS` / `INTERACTION_FIELDS`（キーは `interactions.press.scale` のような絶対パス、norand）/
  `applyInteractions()`（`<html>` の style に `--ix-*` を書く。値が無ければ削除して CSS 既定に戻す。数値はパネルの範囲に丸める）。
- `src/data/motion.json` の `interactions`:
  `{ press: { enabled: true, scale: 0.985, downMs: 90, springMs: 380 }, hover: { enabled: true, leanPx: 5, magnetPx: 4 }, rail: { nudgePx: 3, nudgeMs: 60 } }`
- site.js に残したもの（JS のタイミングで CSS 変数にならない）: レール行 nudge の最低保持 80ms（`NUDGE_MS`）、エコーの遅れ 120ms（`ECHO_DELAY`）、
  吸い寄せの半径と最大 3px。エコーの背景色は色の変化なので対象外。reduced-motion のブロックは従来どおりすべて無効。
- 注意: `tests/motion-engine.test.mjs` の 1 と 5 は `motion.json.interactions` が `{}` であることを前提にしている（要更新、本作業の範囲外）。
- 検証: `tests/motion-interactions.test.mjs`、Playwright で押下 0.985 → Lab で 0.9 → 押下オフで 1、ホバーオフで画像が恒等変換。
