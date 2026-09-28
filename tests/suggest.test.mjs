// "Suggest 3" (src/server/motion-suggest.mjs, the route under /api/admin/jev,
// the cards in src/scripts/motion-lab-jev.js).
//
// No network: TypeSafe is stubbed with a fetch that answers the way the API
// does (the same fake as tests/jev.test.mjs). What is checked: the rule-based
// generator (three distinct, valid, deterministic candidates that follow the
// words), Jev's sort, working without the key, the route's guard, and that
// the key stays on the server.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../src/lib/load.mjs";
import { ENV_KEY } from "../src/server/jev.mjs";
import { suggest, suggestAndSort, handleSuggest, readRequest, COVER_VOCAB, REVEAL_VOCAB, availableStyles } from "../src/server/motion-suggest.mjs";
import { describeSuggest, askSuggest, SUGGEST_ENDPOINT } from "../src/scripts/motion-lab-jev.js";

const base = JSON.parse(readFileSync(join(ROOT, "src", "data", "motion.json"), "utf8"));
const env = { [ENV_KEY]: "ts_test_key" };
const COVERS = ["none", "dissolve", "field", "wipe", "band-sweep", "slabs.quad-stagger", "slabs.dynamic"];
const REVEALS = ["box-first", "field-lift", "dissolve", "cut"];

const ANSWERS = {
  feel: { type: "choice", choice: "lively", confidence: 0.71, probabilities: { quiet: 0.2, lively: 0.71, loud: 0.09 } },
  wait: { type: "score", score: 1.3, confidence: 0.6, legend: {}, probabilities: {} },
  readable: { type: "noul", noul: 0.82 },
  rules: { type: "noul", noul: 0.95 },
};

/** A fake TypeSafe: records the call, answers like the API; matchesRequest per candidate name. */
function fakeJev({ status = 200, match = () => 0.5 } = {}) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url, method: init.method, headers: init.headers, body });
    if (status !== 200) return new Response(JSON.stringify({ error: { message: "nope" } }), { status, headers: { "content-type": "application/json" } });
    const answers = { ...ANSWERS };
    if (body?.questions?.matchesRequest) answers.matchesRequest = { type: "noul", noul: match(body.state.config.preset) };
    return new Response(JSON.stringify({ model: "jev-latest", answers, usage: { input_tokens: 1200, output_tokens: 8 } }), { status: 200, headers: { "content-type": "application/json", "x-typesafe-request-id": "req_test" } });
  };
  return { calls, fetchImpl };
}

const post = (body, { contentType = "application/json" } = {}) =>
  new Request("https://takaoumehara.com/api/admin/jev/suggest", { method: "POST", headers: { "content-type": contentType }, body: typeof body === "string" ? body : JSON.stringify(body) });

const distinct = (list) => new Set(list.map((c) => JSON.stringify({ ...c.config, preset: "" }))).size === list.length;

test("the lexicon reads Japanese and English, and ignores unknown words", () => {
  assert.deepEqual(readRequest("静かに、スマホでも").map((e) => e.key), ["quiet", "mobile"]);
  assert.deepEqual(readRequest("Quick and LOUD please").map((e) => e.key), ["fast", "loud"]);
  assert.deepEqual(readRequest("banana 林檎").map((e) => e.key), []);
});

test("静かに、スマホでも: three distinct, slower, capped at 1.2 s, covers from the allowed list", () => {
  const out = suggest("静かに、スマホでも", { base, covers: COVERS, reveals: REVEALS, seed: 7 });
  assert.equal(out.length, 3);
  assert.ok(distinct(out), "three different configs");
  assert.equal(new Set(out.map((c) => c.name)).size, 3, "three different names");
  for (const c of out) {
    assert.equal(c.config.version, 2);
    assert.ok(c.config.global.speed < base.global.speed, `${c.name}: slower than the base`);
    assert.ok(c.config.global.capMs <= 1200 && c.config.global.capMs >= 300, `${c.name}: capMs ${c.config.global.capMs}`);
    assert.ok(c.config.global.navCapMs <= 1200 && c.config.global.navCapMs >= 300, `${c.name}: navCapMs ${c.config.global.navCapMs}`);
    assert.ok(["none", "dissolve", "field"].includes(c.config.transition.cover.style), `${c.name}: cover ${c.config.transition.cover.style}`);
    assert.equal(c.config.text.mode, "fade");
    assert.equal(c.config.global.respectReducedMotion, true);
    assert.equal(c.config.preset, c.name);
    assert.ok(c.why.includes("静か") && c.why.includes("スマホ"), c.why);
  }
});

test("派手: covers from the loud pool, reverse exit; 音: sound on; 箱: Skeleton / Viewfinder", () => {
  for (const c of suggest("派手に", { base, covers: COVERS, reveals: REVEALS, seed: 1 })) {
    assert.ok(/^(slabs\.|wipe$|band-sweep$)/.test(c.config.transition.cover.style), c.config.transition.cover.style);
    assert.equal(c.config.out.style, "reverse");
  }
  assert.ok(suggest("音も欲しい", { base, covers: COVERS, seed: 1 }).every((c) => c.config.sound.enabled === true));
  const box = suggest("skeleton", { base, covers: COVERS, seed: 1 });
  assert.deepEqual(box.slice(0, 2).map((c) => c.name.split(" · ")[1].split(" + ")[0]).sort(), ["Skeleton", "Viewfinder"]);
});

test("an empty request still gives three, and the same seed gives the same three", () => {
  const a = suggest("", { base, covers: COVERS, reveals: REVEALS, seed: 42 });
  assert.equal(a.length, 3);
  assert.ok(distinct(a));
  assert.deepEqual(suggest("", { base, covers: COVERS, reveals: REVEALS, seed: 42 }), a);
  assert.deepEqual(suggest("fast colour", { base, seed: 3 }), suggest("fast colour", { base, seed: 3 }));
  assert.equal(suggest(undefined).length, 3, "no base, no request, no seed");
});

test("speed is clamped and caps never fall under 300 ms", () => {
  const fast = suggest("fast quick snappy 速い", { base: { ...base, global: { ...base.global, speed: 3.9, capMs: 350, navCapMs: 0 } }, seed: 1 });
  for (const c of fast) {
    assert.ok(c.config.global.speed <= 4);
    assert.ok(c.config.global.capMs >= 300 && c.config.global.navCapMs >= 300);
  }
  const slow = suggest("slow ゆっくり 遅い quiet", { base: { ...base, global: { ...base.global, speed: 0.4 } }, seed: 1 });
  assert.ok(slow.every((c) => c.config.global.speed >= 0.3));
});

test("with the registry: only ids it really has are offered", () => {
  const covers = availableStyles("cover", COVER_VOCAB);
  const reveals = availableStyles("reveal", REVEAL_VOCAB);
  assert.ok(covers.includes("none") && reveals.includes("box-first"));
  for (const q of ["", "派手", "静か", "curtain colour"]) {
    for (const c of suggest(q, { base, seed: 5 })) {
      assert.ok(covers.includes(c.config.transition.cover.style), c.config.transition.cover.style);
      assert.ok(reveals.includes(c.config.transition.reveal.style), c.config.transition.reveal.style);
    }
  }
});

test("suggestAndSort: Jev judges each candidate against the request and they come back best match first", async () => {
  const names = suggest("quiet", { base, covers: COVERS, seed: 9 }).map((c) => c.name);
  const score = { [names[0]]: 0.2, [names[1]]: 0.9, [names[2]]: 0.55 };
  const jev = fakeJev({ match: (preset) => score[preset] });
  const out = await suggestAndSort("  quiet  ", { base, covers: COVERS, seed: 9, env, fetchImpl: jev.fetchImpl });
  assert.equal(out.judged, true);
  assert.equal(out.request, "quiet");
  assert.equal(jev.calls.length, 3);
  assert.ok(jev.calls.every((c) => c.body.state.request === "quiet" && "matchesRequest" in c.body.questions));
  assert.deepEqual(out.candidates.map((c) => c.name), [names[1], names[2], names[0]]);
  assert.deepEqual(out.candidates.map((c) => c.match), [0.9, 0.55, 0.2]);
  assert.equal(out.candidates[0].readings.at(-1), "matches the request: 90%");
});

test("suggestAndSort without the key: three unsorted, judged false, nothing sent", async () => {
  const jev = fakeJev();
  const out = await suggestAndSort("quiet", { base, covers: COVERS, seed: 9, env: {}, fetchImpl: jev.fetchImpl });
  assert.equal(out.judged, false);
  assert.equal(out.error, "Jev is not configured");
  assert.equal(out.candidates.length, 3);
  assert.deepEqual(out.candidates.map((c) => c.name), suggest("quiet", { base, covers: COVERS, seed: 9 }).map((c) => c.name));
  assert.equal(jev.calls.length, 0);
});

test("suggestAndSort when Jev fails: unsorted, judged false, never throws", async () => {
  const refused = await suggestAndSort("quiet", { base, seed: 9, env, fetchImpl: fakeJev({ status: 401 }).fetchImpl });
  assert.equal(refused.judged, false);
  assert.match(refused.error, /Jev refused/);
  const down = await suggestAndSort("quiet", { base, seed: 9, env, fetchImpl: async () => { throw new TypeError("fetch failed"); }, timeout: 500 });
  assert.equal(down.judged, false);
  assert.equal(down.error, "Jev unreachable");
  assert.equal(down.candidates.length, 3);
});

test("handler: 415 / 413 / 400 / 422 before anything reaches Jev, 200 with three otherwise", async () => {
  const jev = fakeJev();
  const opts = { env, fetchImpl: jev.fetchImpl };
  assert.equal((await handleSuggest(post({ request: "quiet" }, { contentType: "text/plain" }), opts)).status, 415);
  assert.equal((await handleSuggest(post({ request: "quiet", pad: "x".repeat(70 * 1024) }), opts)).status, 413);
  assert.equal((await handleSuggest(post("{not json"), opts)).status, 400);
  assert.equal((await handleSuggest(post({ config: [1] }), opts)).status, 422);
  assert.equal((await handleSuggest(post({ request: 5 }), opts)).status, 422);
  assert.equal(jev.calls.length, 0);

  const res = await handleSuggest(post({ request: "静か " + "x".repeat(900), config: base }), opts);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  const text = await res.text();
  assert.ok(!text.includes("ts_test_key"), "the key is not in the response");
  const body = JSON.parse(text);
  assert.equal(body.ok, true);
  assert.equal(body.judged, true);
  assert.equal(body.candidates.length, 3);
  assert.equal(body.request.length, 600, "the request is capped at 600 characters");
  assert.ok(body.candidates.every((c) => c.config.version === 2 && c.name && c.why));
});

test("handler without the key: still 200 with three, unsorted", async () => {
  const jev = fakeJev();
  const res = await handleSuggest(post({}), { env: {}, fetchImpl: jev.fetchImpl });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.judged, false);
  assert.equal(body.candidates.length, 3);
  assert.equal(jev.calls.length, 0);
});

test("the route is owner-only, on demand, and under /api/admin so the middleware guards it", () => {
  const route = readFileSync(join(ROOT, "src", "pages", "api", "admin", "jev", "suggest.ts"), "utf8");
  assert.match(route, /export const prerender = false/);
  assert.match(route, /requireAdmin\(context\)/);
  assert.match(route, /sameOrigin\(context\.request, context\.url\)/);
  assert.match(route, /handleSuggest\(context\.request\)/);
  assert.equal(SUGGEST_ENDPOINT, "/api/admin/jev/suggest");
});

test("the panel: Suggest 3 posts to the route; the key and the SDK stay off the browser chunk", async () => {
  const src = readFileSync(join(ROOT, "src", "scripts", "motion-lab-jev.js"), "utf8");
  assert.ok(src.includes("Suggest 3"));
  assert.ok(src.includes("/api/admin/jev/suggest"));
  assert.ok(!src.includes(ENV_KEY));
  assert.ok(!src.includes("@typesafe-ai/sdk"));
  const sent = [];
  const { status, body } = await askSuggest(base, "quiet", { fetchImpl: async (url, init) => { sent.push({ url, init }); return new Response(JSON.stringify({ ok: true, judged: false, candidates: [] }), { status: 200 }); } });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal(sent[0].url, SUGGEST_ENDPOINT);
  assert.equal(sent[0].init.credentials, "same-origin");
  assert.deepEqual(JSON.parse(sent[0].init.body), { request: "quiet", config: base });
});

test("describeSuggest: one line per outcome", () => {
  const three = [{}, {}, {}];
  assert.match(describeSuggest(200, { ok: true, judged: true, candidates: three }), /Jev sorted 3/);
  assert.match(describeSuggest(200, { ok: true, judged: false, error: "Jev is not configured", candidates: three }), /Jev not configured: unsorted/);
  assert.match(describeSuggest(200, { ok: true, judged: false, error: "Jev unreachable", candidates: three }), /Jev unreachable: unsorted/);
  assert.match(describeSuggest(503, { message: `set ${ENV_KEY}` }), /not configured/);
  assert.match(describeSuggest(503, { candidates: three }), /not configured: unsorted/);
  assert.match(describeSuggest(401, {}), /sign in at \/admin/);
  assert.match(describeSuggest(403, {}), /owner only/);
});
