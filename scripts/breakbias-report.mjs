#!/usr/bin/env node
// docs/product-idea.html — the BreakBias sweep as one self-contained page that
// renders everything from the embedded ledger (docs/motion-lab/breakbias/ledger/):
// every generated cell (killed ones dimmed, never hidden, with their kill code
// and reason), the banned three with their revisit outcome, and three 2×2 maps
// computed from the judge's numbers at render time. No CDN, opens from file://.
//
//   node scripts/breakbias-report.mjs        (re)writes docs/product-idea.html
//
// Data: merged() from scripts/breakbias-ledger.mjs, plus ledger/meta.json
// ({ subject, resolution, date, banned: [{idea, revisit, outcome}], untouched,
//   heroes: [...], workhorses: [...], lab: [...], market: [...] }) when present.
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { merged } from "./breakbias-ledger.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const META = `${ROOT}docs/motion-lab/breakbias/ledger/meta.json`;
const meta = existsSync(META) ? JSON.parse(readFileSync(META, "utf8")) : {};
const cells = merged();

const data = { meta, cells, generated_at: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC" };
// `</script` inside the data would end the block early; escape it.
const json = JSON.stringify(data).replace(/<\//g, "<\\/");

const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Product idea — Motion Lab（BreakBias 掃引）</title>
<style>
:root{--bg:#f6f5f0;--ink:#161616;--ink2:#5a5a5a;--line:#d9d6cc;--card:#fff;--hero:#c8102e;--work:#1f5fbf;--lab:#7a35c9;--disc:#8a8a8a;--ok:#2a7a3b;--kill:#b23a3a}
:root[data-theme=dark]{--bg:#121212;--ink:#f0eee6;--ink2:#a8a8a8;--line:#333;--card:#1c1c1c;--disc:#6e6e6e}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#121212;--ink:#f0eee6;--ink2:#a8a8a8;--line:#333;--card:#1c1c1c;--disc:#6e6e6e}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.6 -apple-system,"Helvetica Neue","Hiragino Sans","Noto Sans JP",sans-serif}
main{max-width:1200px;margin:0 auto;padding:24px 16px 80px}
h1{font-size:26px;margin:0 0 4px}h2{font-size:18px;margin:40px 0 12px;padding-top:12px;border-top:1px solid var(--line)}h3{font-size:15px;margin:20px 0 8px}
.muted{color:var(--ink2)}.cov{font-family:ui-monospace,Menlo,monospace;font-size:12px;margin:8px 0 0}
.warn{color:var(--kill);font-weight:600}
button,select{font:inherit;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:6px;padding:4px 10px;cursor:pointer}
.bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px;cursor:pointer;position:relative}
.card.killed{opacity:.55}.card.killed .concept{text-decoration:line-through}
.card .id{font-family:ui-monospace,Menlo,monospace;font-size:11px;color:var(--ink2)}
.card .concept{font-weight:600;margin:2px 0 4px}
.badge{display:inline-block;font-size:11px;padding:1px 7px;border-radius:999px;border:1px solid var(--line);margin:2px 4px 0 0;color:var(--ink2)}
.badge.kill{border-color:var(--kill);color:var(--kill)}.badge.win{border-color:var(--ok);color:var(--ok)}.badge.fail{text-decoration:line-through}
.badge.q-Hero{border-color:var(--hero);color:var(--hero)}.badge.q-Workhorse{border-color:var(--work);color:var(--work)}.badge.q-Lab{border-color:var(--lab);color:var(--lab)}.badge.q-Discard{border-color:var(--disc);color:var(--disc)}
.badge.rev{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.maps{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px}
svg{width:100%;height:auto;background:var(--card);border:1px solid var(--line);border-radius:10px}
.axis{font-size:11px;fill:var(--ink2)}.qlabel{font-size:12px;font-weight:600;opacity:.85}
.pt{cursor:pointer}.pt:hover circle,.pt:hover rect{stroke:var(--ink);stroke-width:2}
.tray{font-size:12px;color:var(--ink2);margin-top:6px}
dialog{max-width:720px;border:1px solid var(--line);border-radius:12px;background:var(--card);color:var(--ink);padding:20px}
dialog::backdrop{background:rgba(0,0,0,.4)}dl{display:grid;grid-template-columns:120px 1fr;gap:4px 12px;margin:8px 0}dt{color:var(--ink2)}dd{margin:0}
table{border-collapse:collapse;width:100%;font-size:13px}td,th{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
.shelf .card{cursor:default}
.hero-t{color:var(--hero)}.work-t{color:var(--work)}.lab-t{color:var(--lab)}
</style>
</head>
<body>
<main>
<header>
  <div class="bar" style="justify-content:space-between">
    <div><h1 id="title"></h1><div class="muted" id="sub"></div></div>
    <button id="theme" type="button">🌓 表示切替</button>
  </div>
  <p class="cov" id="coverage"></p>
  <p class="warn" id="unfinished" hidden></p>
</header>

<section id="banned"><h2>先に禁止した平凡 3 案 — と、掃引後の再訪</h2><div id="banned-body"></div></section>

<section id="quadrant"><h2>独創軸 × 事業軸（審判の 2 つの和。象限は描画時に計算）</h2>
  <div class="maps"><div id="map-quad"></div><div id="quad-side"></div></div></section>

<section id="shelves" class="shelf"><h2>三つの棚</h2><div id="shelves-body"></div></section>

<section><h2>Impact × Effort（Hero と Workhorse）</h2><div class="maps"><div id="map-effort"></div><div id="effort-side"></div></div></section>
<section><h2>User Impact × Company Impact（事業軸の内訳）</h2><div class="maps"><div id="map-uc"></div><div id="uc-side"></div></div></section>

<section id="board"><h2>全セル（殺したものも消さない）</h2>
  <div class="bar">
    <select id="f-status"><option value="">状態: すべて</option><option value="alive">生存以上</option><option value="killed">殺したもの</option><option value="judged">採点済み</option></select>
    <select id="f-tech"><option value="">技法: すべて</option></select>
    <select id="f-kill"><option value="">kill: すべて</option><option value="G">G</option><option value="P">P</option><option value="C">C</option></select>
    <select id="f-quad"><option value="">象限: すべて</option><option>Hero</option><option>Workhorse</option><option>Lab</option><option>Discard</option></select>
    <select id="f-win"><option value="">勝ち筋: すべて</option><option value="delta">delta</option><option value="geo">geo</option><option value="timing">timing</option><option value="exec">exec</option></select>
    <span class="muted" id="count"></span>
  </div>
  <div id="board-body"></div>
</section>
</main>
<dialog id="dlg"></dialog>
<script type="application/json" id="ledger">${json}</script>
<script>
const DATA = JSON.parse(document.getElementById("ledger").textContent);
const { meta, cells } = DATA;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const quadrant = (c) => c.scores ? (c.originality >= 12 ? (c.viability >= 12 ? "Hero" : "Lab") : (c.viability >= 12 ? "Workhorse" : "Discard")) : null;
const TECHS = [...new Set(cells.map((c) => c.technique))];
const $ = (id) => document.getElementById(id);

// header
$("title").textContent = "Product idea — " + (meta.subject ?? "Motion Lab");
$("sub").textContent = \`Domain A · 解像度 \${meta.resolution ?? "standard"} · 生成 \${meta.date ?? ""} · この HTML は台帳から \${DATA.generated_at} に描画\`;
const n = (f) => cells.filter(f).length;
const killed = cells.filter((c) => c.status === "killed");
const pa = cells.filter((c) => c.prior_art?.exists);
const won = pa.filter((c) => c.prior_art_win);
const byWin = ["delta", "geo", "timing", "exec"].map((w) => \`\${w} \${won.filter((c) => c.prior_art_win === w).length}\`).join(" / ");
$("coverage").textContent = \`\${cells.length} generated · \${killed.length} killed (G \${n((c) => c.kill_code === "G")} / P \${n((c) => c.kill_code === "P")} / C \${n((c) => c.kill_code === "C")}) · \${pa.length} tagged 既出 → \${won.length} passed a win path (\${byWin}) · \${n((c) => c.salvaged)} salvaged · \${n((c) => c.revisited)} revisited · \${n((c) => c.status === "judged")} judged / \${cells.length} cells\` + (meta.untouched ? \` · 未踏破: \${meta.untouched}\` : "");
const pending = cells.filter((c) => c.status === "generated" || c.status === "todo").length;
if (pending) { $("unfinished").hidden = false; $("unfinished").textContent = \`未完了: \${pending} セルがまだ選別されていません。この掃引は終わっていません。\`; }

// banned three
$("banned-body").innerHTML = (meta.banned?.length ? meta.banned : [{ idea: "（meta.json 未作成）", revisit: "", outcome: "" }]).map((b, i) => \`<div class="card" style="cursor:default;margin-bottom:8px"><div class="id">禁止 #\${i + 1}</div><div class="concept">\${esc(b.idea)}</div><div class="muted">再訪: \${esc(b.revisit || "未実施 — 実施していないなら、それは報告すべき欠落")}</div><div>\${esc(b.outcome)}</div></div>\`).join("");

// cards
const badges = (c) => {
  let b = \`<span class="badge">\${esc(c.technique)} · \${esc(c.sub_method)}</span>\`;
  if (c.status === "killed") b += \`<span class="badge kill">kill \${esc(c.kill_code)}</span>\`;
  if (c.prior_art?.exists) {
    b += \`<span class="badge">既出</span>\`;
    if (c.kill_code === "C") b += ["delta", "geo", "timing", "exec"].map((w) => \`<span class="badge fail">w:\${w}</span>\`).join("");
    else if (c.prior_art_win) b += \`<span class="badge win">w:\${esc(c.prior_art_win)}</span>\`;
  }
  if (c.salvaged) b += \`<span class="badge">salvaged</span>\`;
  if (c.revisited) b += \`<span class="badge rev">revisited</span>\`;
  const q = quadrant(c); if (q) b += \`<span class="badge q-\${q}">\${q} \${c.originality}/\${c.viability}</span>\`;
  return b;
};
const card = (c) => \`<div class="card \${c.status === "killed" ? "killed" : ""}" data-id="\${esc(c.cell_id)}"><div class="id">\${esc(c.cell_id)} · \${esc(c.element)}</div><div class="concept">\${esc(c.concept)}</div><div class="muted" style="font-size:12px">\${esc(c.broken_bias)}</div>\${c.status === "killed" ? \`<div style="font-size:12px;color:var(--kill)">\${esc(c.reason)}</div>\` : ""}\${badges(c)}</div>\`;

// board with filters
for (const t of TECHS) $("f-tech").insertAdjacentHTML("beforeend", \`<option>\${esc(t)}</option>\`);
function renderBoard() {
  const fs = $("f-status").value, ft = $("f-tech").value, fk = $("f-kill").value, fq = $("f-quad").value, fw = $("f-win").value;
  const keep = cells.filter((c) => (!fs || (fs === "alive" ? c.status !== "killed" : fs === "killed" ? c.status === "killed" : c.status === "judged")) && (!ft || c.technique === ft) && (!fk || c.kill_code === fk) && (!fq || quadrant(c) === fq) && (!fw || c.prior_art_win === fw));
  $("count").textContent = \`\${keep.length} / \${cells.length}\`;
  $("board-body").innerHTML = TECHS.map((t) => { const g = keep.filter((c) => c.technique === t); return g.length ? \`<h3>\${esc(t)} <span class="muted">\${g.length}</span></h3><div class="grid">\${g.map(card).join("")}</div>\` : ""; }).join("");
}
["f-status", "f-tech", "f-kill", "f-quad", "f-win"].forEach((id) => $(id).addEventListener("change", renderBoard));
renderBoard();

// detail dialog: the full cell trace, on demand
document.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-id]"); if (!el) return;
  const c = cells.find((x) => x.cell_id === el.dataset.id); if (!c) return;
  const row = (k, v) => v == null || v === "" ? "" : \`<dt>\${k}</dt><dd>\${esc(typeof v === "object" ? JSON.stringify(v, null, 1) : v)}</dd>\`;
  $("dlg").innerHTML = \`<div class="id">\${esc(c.cell_id)}</div><h3 style="margin:4px 0 8px">\${esc(c.concept)}</h3>\${badges(c)}<dl>\${row("要素", c.element)}\${row("思い込み", c.bias)}\${row("技法", c.technique + " · " + c.sub_method)}\${row("ありえない形", c.impossible_form)}\${row("提供側の利点", c.benefit_provider)}\${row("利用者の利点", c.benefit_user)}\${row("市場 / 実現", c.market_feasibility)}\${row("代替しない版", c.alt_without)}\${row("代替する版", c.alt_with)}\${row("壊した思い込み", c.broken_bias)}\${row("既出", c.prior_art?.exists ? c.prior_art.where : "なし")}\${row("勝ち筋テスト", c.win_tests)}\${row("勝ち筋", c.win_note)}\${row("選別の理由", c.reason)}\${row("決定との衝突", c.decision_conflict)}\${row("採点", c.scores ? \`N \${c.scores.N} · W \${c.scores.W} · U \${c.scores.U} · C \${c.scores.C} → 独創 \${c.originality} / 事業 \${c.viability} · \${quadrant(c)} · effort \${c.effort ?? "-"}\` : null)}\${row("審判の注記", c.judge_note)}\${row("再参入条件", c.reentry)}</dl><form method="dialog"><button>閉じる</button></form>\`;
  $("dlg").showModal();
});

// maps
const judged = cells.filter((c) => c.scores);
const COLOR = { Hero: "var(--hero)", Workhorse: "var(--work)", Lab: "var(--lab)", Discard: "var(--disc)" };
function scatter(id, pts, { xl, yl, xmin, xmax, ymin, ymax, mid, labels, side, tray }) {
  const W = 560, H = 480, P = 44;
  const sx = (v) => P + ((v - xmin) / (xmax - xmin)) * (W - 2 * P), sy = (v) => H - P - ((v - ymin) / (ymax - ymin)) * (H - 2 * P);
  const mx = sx(mid[0]), my = sy(mid[1]);
  const jitter = new Map();
  const dots = pts.map((p) => { const k = p.x + "," + p.y; const j = jitter.get(k) ?? 0; jitter.set(k, j + 1); const dx = (j % 3 - 1) * 7, dy = Math.floor(j / 3) * 7; const q = quadrant(p.c); const shape = p.c.revisited ? \`<rect x="\${sx(p.x) + dx - 6}" y="\${sy(p.y) + dy - 6}" width="12" height="12" fill="\${COLOR[q] ?? "var(--ink)"}" />\` : \`<circle cx="\${sx(p.x) + dx}" cy="\${sy(p.y) + dy}" r="6" fill="\${COLOR[q] ?? "var(--ink)"}" />\`; return \`<g class="pt" data-id="\${esc(p.c.cell_id)}">\${shape}<title>\${esc(p.c.cell_id)} \${esc(p.c.concept)} — \${esc(p.title ?? "")}</title></g>\`; }).join("");
  $(id).innerHTML = \`<svg viewBox="0 0 \${W} \${H}" role="img" aria-label="\${esc(xl)} × \${esc(yl)}">
    <rect x="\${P}" y="\${P}" width="\${W - 2 * P}" height="\${H - 2 * P}" fill="none" stroke="var(--line)"/>
    <line x1="\${mx}" y1="\${P}" x2="\${mx}" y2="\${H - P}" stroke="var(--line)" stroke-dasharray="4 4"/><line x1="\${P}" y1="\${my}" x2="\${W - P}" y2="\${my}" stroke="var(--line)" stroke-dasharray="4 4"/>
    <text class="qlabel" x="\${P + 8}" y="\${P + 18}" fill="\${labels[0][1]}">\${labels[0][0]}</text><text class="qlabel" x="\${W - P - 8}" y="\${P + 18}" text-anchor="end" fill="\${labels[1][1]}">\${labels[1][0]}</text>
    <text class="qlabel" x="\${P + 8}" y="\${H - P - 10}" fill="\${labels[2][1]}">\${labels[2][0]}</text><text class="qlabel" x="\${W - P - 8}" y="\${H - P - 10}" text-anchor="end" fill="\${labels[3][1]}">\${labels[3][0]}</text>
    <text class="axis" x="\${W / 2}" y="\${H - 12}" text-anchor="middle">\${esc(xl)} →</text><text class="axis" transform="translate(14 \${H / 2}) rotate(-90)" text-anchor="middle">\${esc(yl)} →</text>
    \${dots}</svg>\` + (tray ? \`<div class="tray">\${tray}</div>\` : "");
  if (side) $(side.id).innerHTML = side.html;
}
if (judged.length) {
  scatter("map-quad", judged.map((c) => ({ x: c.viability, y: c.originality, c, title: quadrant(c) })), { xl: "事業軸（U + C）", yl: "独創軸（N + W）", xmin: 2, xmax: 20, ymin: 2, ymax: 20, mid: [11.5, 11.5], labels: [["Lab — 棚に置く", "var(--lab)"], ["Hero — 本命", "var(--hero)"], ["Discard", "var(--disc)"], ["Workhorse — 定番", "var(--work)"]],
    side: { id: "quad-side", html: \`<table><tr><th>象限</th><th>数</th></tr>\${["Hero", "Workhorse", "Lab", "Discard"].map((q) => \`<tr><td class="badge q-\${q}">\${q}</td><td>\${judged.filter((c) => quadrant(c) === q).length}</td></tr>\`).join("")}</table><p class="muted" style="font-size:12px">■ は禁止 3 案の再訪から来たもの。● は掃引のセル。点を押すと全経過が開く。Lab の点は再参入条件を持つ（無いものは下のトレイ）。</p>\` },
    tray: (() => { const bad = judged.filter((c) => quadrant(c) === "Lab" && !c.reentry); return bad.length ? \`<span class="warn">再参入条件の無い Lab（許されない組み合わせ）: \${bad.map((c) => c.cell_id).join(", ")}</span>\` : ""; })() });
  const hw = judged.filter((c) => ["Hero", "Workhorse"].includes(quadrant(c)));
  scatter("map-effort", hw.filter((c) => c.effort != null).map((c) => ({ x: c.effort, y: c.viability, c, title: "effort " + c.effort })), { xl: "Effort（1 = 1 画面で価値 … 5 = 全部要る）", yl: "Impact（U + C）", xmin: 0.5, xmax: 5.5, ymin: 2, ymax: 20, mid: [3, 11.5], labels: [["Low-hanging fruit — 先にやる", "var(--ok)"], ["Major bets — 計画して", "var(--ink)"], ["Fill-ins", "var(--disc)"], ["Thankless", "var(--disc)"]],
    side: { id: "effort-side", html: \`<p class="muted" style="font-size:12px">Impact は審判の U + C。Effort は審判が「次の実験」と「リスク」から 1〜5 で推定したもの（測定値ではない）。Effort 未記入の Hero / Workhorse: \${hw.filter((c) => c.effort == null).map((c) => c.cell_id).join(", ") || "なし"}</p>\` } });
  scatter("map-uc", judged.map((c) => ({ x: c.scores.C, y: c.scores.U, c, title: \`U \${c.scores.U} · C \${c.scores.C}\` })), { xl: "Company Impact", yl: "User Impact", xmin: 0.5, xmax: 10.5, ymin: 0.5, ymax: 10.5, mid: [5.5, 5.5], labels: [["利用者だけが得 — 別の課金を", "var(--ink)"], ["両方高い — Hero の最強形", "var(--hero)"], ["両方低い", "var(--disc)"], ["会社だけが得 — 罠", "var(--kill)"]],
    side: { id: "uc-side", html: \`<p class="muted" style="font-size:12px">事業軸の内訳。右上が最も強い。左上は課金の形を変えれば救える。右下は利用者の犠牲で会社が得る形で、名指しして避ける。</p>\` } });
} else {
  ["map-quad", "map-effort", "map-uc"].forEach((id) => { $(id).innerHTML = '<p class="muted">審判がまだ走っていない（judged 0）。地図は採点後に描かれる。</p>'; });
}

// shelves
const shelf = (title, cls, items, render) => items?.length ? \`<h3 class="\${cls}">\${title} <span class="muted">\${items.length}</span></h3><div class="grid">\${items.map(render).join("")}</div>\` : \`<h3 class="\${cls}">\${title}</h3><p class="muted">なし（meta.json 未作成、または該当なし）</p>\`;
const kv = (o, keys) => keys.map(([k, l]) => o[k] ? \`<div><span class="muted">\${l}: </span>\${esc(o[k])}</div>\` : "").join("");
$("shelves-body").innerHTML =
  shelf("Hero — 本命", "hero-t", meta.heroes, (h) => \`<div class="card" data-id="\${esc(h.cell_id ?? "")}"><div class="id">\${esc(h.cell_id ?? "")}</div><div class="concept">\${esc(h.name)}</div>\${kv(h, [["one_liner", "一行"], ["broken_bias", "壊した思い込み"], ["story", "体験"], ["business", "事業"], ["mvp", "MVP"], ["validation", "検証"], ["risks", "リスク"], ["next", "次の一歩"], ["market", "市場"]])}</div>\`) +
  shelf("Workhorse — ありふれているが、必要とされる", "work-t", meta.workhorses, (w) => \`<div class="card" data-id="\${esc(w.cell_id ?? "")}"><div class="id">\${esc(w.cell_id ?? "")}</div><div class="concept">\${esc(w.name)}</div>\${kv(w, [["win_path", "勝ち筋"], ["delta", "変える一点"], ["plan", "実行計画"], ["market", "市場（red は想定内）"]])}</div>\`) +
  shelf("Lab — 面白いが、今は金にならない", "lab-t", meta.lab, (l) => \`<div class="card" data-id="\${esc(l.cell_id ?? "")}"><div class="id">\${esc(l.cell_id ?? "")}</div><div class="concept">\${esc(l.name)}</div>\${kv(l, [["originality", "独創軸"], ["reentry", "戻ってくる条件"]])}</div>\`);

// theme
$("theme").addEventListener("click", () => { const r = document.documentElement; const cur = r.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); r.dataset.theme = cur === "dark" ? "light" : "dark"; });
</script>
</body>
</html>`;

writeFileSync(`${ROOT}docs/product-idea.html`, html);
console.log(`docs/product-idea.html: ${cells.length} cells, ${cells.filter((c) => c.scores).length} judged, ${(html.length / 1024).toFixed(0)} KB`);
