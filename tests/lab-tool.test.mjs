// The Motion Lab as a tool: /lab/motion (src/pages/lab/motion.astro +
// src/scripts/lab-tool.js), its stages (/lab/stage, src/pages/lab/[page].astro
// + src/scripts/stage.js) and /api/lab/peek (src/server/peek.mjs).
//
// No network and no build: the peek parser runs on a fixture, the URL check
// on a list of hosts, and the pages are checked from their source.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../src/lib/load.mjs";
import { parsePeek, checkUrl, isPrivateHost, isHtml, decodeBody } from "../src/server/peek.mjs";

const src = (...p) => readFileSync(join(ROOT, "src", ...p), "utf8");

const FIXTURE = `<!doctype html><html><head>
<meta charset="utf-8">
<title>  Fallback &amp; title </title>
<meta property="og:title" content="Studio Kumo — Work">
<meta name="description" content="Small studio,
  quiet websites.">
<meta content="/img/share.png?v=2&amp;x=1" property="og:image">
<meta name="twitter:image" content="https://cdn.example.org/tw.png">
</head><body><h1>Hi</h1></body></html>`;

test("parsePeek: og:title, the description, og:image made absolute, the host", () => {
  const got = parsePeek(FIXTURE, "https://kumo.example.com/work/index.html");
  assert.deepEqual(got, {
    title: "Studio Kumo — Work",
    description: "Small studio, quiet websites.",
    image: "https://kumo.example.com/img/share.png?v=2&x=1",
    site: "kumo.example.com",
  });
});

test("parsePeek: falls back to <title> and twitter:image, and to nulls", () => {
  const got = parsePeek(`<title>Plain &#39;page&#x27;</title><meta name="twitter:image" content="pic.jpg">`, "http://a.example/b/");
  assert.equal(got.title, "Plain 'page'");
  assert.equal(got.image, "http://a.example/b/pic.jpg");
  assert.equal(got.description, null);
  assert.deepEqual(parsePeek("<p>no head</p>", "https://x.example/"), { title: null, description: null, image: null, site: "x.example" });
  assert.equal(parsePeek(`<meta property="og:image" content="javascript:alert(1)">`, "https://x.example/").image, null, "only http(s) images");
});

test("peek: HTML only, and the charset is honoured", () => {
  assert.equal(isHtml("text/html; charset=utf-8"), true);
  assert.equal(isHtml("application/xhtml+xml"), true);
  assert.equal(isHtml("application/json"), false);
  assert.equal(isHtml(null), false);
  const sjis = new Uint8Array([0x82, 0xa0]); // "あ" in Shift_JIS
  assert.equal(decodeBody(sjis, "text/html; charset=Shift_JIS"), "あ");
  assert.equal(decodeBody(new TextEncoder().encode("é"), "text/html"), "é");
});

test("peek: private and loopback hosts are refused, public http(s) is accepted", () => {
  const refused = [
    "http://localhost/", "http://localhost:4321/x", "http://127.0.0.1/", "http://127.1.2.3:8080/",
    "http://10.0.0.5/", "http://192.168.1.1/", "http://172.16.0.1/", "http://172.31.255.254/",
    "http://[::1]/", "http://printer.local/", "http://169.254.169.254/latest/meta-data/", "http://2130706433/",
  ];
  for (const u of refused) {
    const r = checkUrl(u);
    assert.equal(r.ok, false, `${u} is refused`);
    assert.equal(r.error, "private-host", `${u}: private-host`);
  }
  for (const u of ["ftp://example.com/", "javascript:alert(1)", "file:///etc/passwd", "not a url", ""]) assert.equal(checkUrl(u).ok, false, `${u} is refused`);
  for (const u of ["https://example.com", "http://example.com/page?q=1", "https://172.32.0.1/", "https://10.example.com/"]) {
    assert.equal(checkUrl(u).ok, true, `${u} is accepted`);
  }
  assert.equal(isPrivateHost("172.15.0.1"), false);
});

test("the peek route is on-demand, GET, capped, time-limited and cached briefly", () => {
  const route = src("pages", "api", "lab", "peek.ts");
  assert.match(route, /export const prerender = false/);
  assert.match(route, /export const GET/);
  assert.match(route, /AbortSignal\.timeout\(TIMEOUT_MS\)/);
  assert.match(route, /public, max-age=300/);
  assert.match(route, /415/);
  assert.match(route, /502/);
  assert.ok(route.split("\n").length <= 80, "peek.ts stays short");
  assert.doesNotMatch(src("middleware.ts"), /api\/lab/, "not behind the admin guard");
});

test("the stage handles the tool's messages, the three stages and the phone frame", () => {
  const stage = src("pages", "lab", "[page].astro");
  for (const t of ["stage:shot", "stage:peek", "stage:config", "stage:replay", "stage:ready"]) assert.ok(stage.includes(t), `handles ${t}`);
  assert.match(stage, /frame"\) === "phone"/, "?frame=phone");
  assert.match(stage, /html\.st-phone \.st-shell/, "the phone layout as a class too");
  assert.match(stage, /bar"\) === "0"/, "?bar=0");
  assert.match(stage, /e\.origin !== location\.origin/, "same origin only");
  assert.match(stage, /draftPagesBuilt\(\) \? \[\{ params: \{ page: "stage" \} \}\] : \[\]/, "the draft gate is unchanged");
  const helper = src("scripts", "stage.js");
  assert.match(helper, /Drop a screenshot in the tool/);
  assert.match(helper, /dataset\.tile/);
  assert.doesNotMatch(helper, /innerHTML/, "never writes HTML");
});

test("/lab/motion is the tool, not a redirect", () => {
  const page = src("pages", "lab", "motion.astro");
  assert.doesNotMatch(page, /location\.replace/);
  assert.match(page, /import "\.\.\/\.\.\/scripts\/lab-tool\.js"/);
  assert.match(page, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(page, /id="lab-pick"/);
  assert.match(page, /role="status"/);
});

test("the tool: keep-or-toss is mounted, phone check defaults on and is remembered", () => {
  const js = src("scripts", "lab-tool.js");
  assert.match(js, /import \{ mountPick \} from "\.\/motion-pick\.js"/);
  assert.match(js, /mountPick\(\$\("lab-pick"\), api\)/);
  assert.match(js, /"tu-lab-phone"/);
  assert.match(js, /let phone = store\.get\(PHONE_KEY\) !== "0";/, "on unless turned off");
  assert.match(js, /mlab:config/);
  for (const k of ["candidates(", "play(", "apply(", "copy,"]) assert.ok(js.includes(k), `api.${k}`);
});
