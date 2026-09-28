// Jev as the Motion Lab's judge (src/server/jev.mjs, the route under
// /api/admin/jev, the panel row in src/scripts/motion-lab-jev.js).
//
// No network: TypeSafe is stubbed with a fetch that records the request and
// answers the way the API does. What is checked is the contract — where the
// request goes, what it carries, how a missing key and a refusal come back —
// and that the key never leaves the server.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../src/lib/load.mjs";
import { jevConfigured, judgeMotion, handleJudgeMotion, motionQuestions, motionState, readAnswers, ENV_KEY, WAIT_LEVELS, MAX_REQUEST_CHARS } from "../src/server/jev.mjs";
import { describeJevResult, askJev, JEV_ENDPOINT } from "../src/scripts/motion-lab-jev.js";

const config = JSON.parse(readFileSync(join(ROOT, "src", "data", "motion.json"), "utf8"));
const env = { [ENV_KEY]: "ts_test_key" };

const ANSWERS = {
  feel: { type: "choice", choice: "lively", confidence: 0.71, probabilities: { quiet: 0.2, lively: 0.71, loud: 0.09 } },
  wait: { type: "score", score: 1.3, confidence: 0.6, legend: {}, probabilities: {} },
  readable: { type: "noul", noul: 0.82 },
  rules: { type: "noul", noul: 0.95 },
};

/** A fake TypeSafe: records the call, answers like the API. */
function fakeJev({ status = 200, answers = ANSWERS, extra = {} } = {}) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, method: init.method, headers: init.headers, body: init.body ? JSON.parse(init.body) : null });
    if (status !== 200) return new Response(JSON.stringify({ error: { message: "nope" } }), { status, headers: { "content-type": "application/json" } });
    const body = { model: "jev-latest", answers: { ...answers, ...extra }, usage: { input_tokens: 1200, output_tokens: 8 } };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json", "x-typesafe-request-id": "req_test" } });
  };
  return { calls, fetchImpl };
}

const post = (body, { contentType = "application/json" } = {}) =>
  new Request("https://takaoumehara.com/api/admin/jev/motion", { method: "POST", headers: { "content-type": contentType }, body: typeof body === "string" ? body : JSON.stringify(body) });

test("configured only when the key is set and not blank", () => {
  assert.equal(jevConfigured({}), false);
  assert.equal(jevConfigured({ [ENV_KEY]: "  " }), false);
  assert.equal(jevConfigured(env), true);
});

test("the questions: four always, a fifth only with a request", () => {
  const q = motionQuestions();
  assert.deepEqual(Object.keys(q).sort(), ["feel", "readable", "rules", "wait"]);
  assert.equal(q.feel.type, "choice");
  assert.deepEqual(Object.keys(q.feel.criteria), ["quiet", "lively", "loud"]);
  assert.equal(q.wait.type, "score");
  assert.equal(q.wait.criteria.length, WAIT_LEVELS.length);
  assert.ok("matchesRequest" in motionQuestions({ request: "calm" }));
  assert.equal(motionQuestions({ request: "calm" }).matchesRequest.type, "noul");
});

test("the state carries the config, the glossary and the rules — and the request only when given", () => {
  const s = motionState(config);
  assert.equal(s.config, config);
  assert.ok(Object.keys(s.glossary).length > 10);
  assert.ok(s.rules.length >= 3);
  assert.equal("request" in s, false);
  assert.equal(motionState(config, { request: "quiet" }).request, "quiet");
});

test("judgeMotion posts to TypeSafe with the key as a bearer token and reads the answers", async () => {
  const jev = fakeJev();
  const result = await judgeMotion(config, { env, fetchImpl: jev.fetchImpl });
  assert.equal(jev.calls.length, 1);
  const [call] = jev.calls;
  assert.equal(call.url, "https://api.typesafe.ai/v1/systemone");
  assert.equal(call.method, "POST");
  assert.equal(call.headers.Authorization, "Bearer ts_test_key");
  assert.equal(call.body.model, "jev-latest");
  assert.deepEqual(call.body.state.config, config);
  assert.deepEqual(Object.keys(call.body.questions).sort(), ["feel", "readable", "rules", "wait"]);
  assert.equal(result.model, "jev-latest");
  assert.equal(result.answers.feel.choice, "lively");
  assert.equal(result.requestId, "req_test");
  assert.deepEqual(result.usage, { input_tokens: 1200, output_tokens: 8 });
  assert.deepEqual(result.readings, ["feel: lively (71%)", "wait: brief (1.3/3)", "readable in 1 s: 82%", "within the rules: 95%"]);
});

test("a request is trimmed, capped, and adds the matching question", async () => {
  const jev = fakeJev({ extra: { matchesRequest: { type: "noul", noul: 0.64 } } });
  const long = "  " + "calm ".repeat(200);
  const result = await judgeMotion(config, { request: long, env, fetchImpl: jev.fetchImpl });
  const { state, questions } = jev.calls[0].body;
  assert.equal(state.request.length, MAX_REQUEST_CHARS);
  assert.ok(!state.request.startsWith(" "));
  assert.ok("matchesRequest" in questions);
  assert.equal(result.readings.at(-1), "matches the request: 64%");
  const blank = fakeJev();
  await judgeMotion(config, { request: "   ", env, fetchImpl: blank.fetchImpl });
  assert.equal("matchesRequest" in blank.calls[0].body.questions, false, "a blank request asks nothing extra");
});

test("without a key nothing is sent and the error says which variable", async () => {
  const jev = fakeJev();
  await assert.rejects(judgeMotion(config, { env: {}, fetchImpl: jev.fetchImpl }), (e) => e.status === 503 && e.code === "jev-not-configured" && e.message.includes(ENV_KEY));
  assert.equal(jev.calls.length, 0);
});

test("readAnswers clamps the wait level and skips answers that are missing or malformed", () => {
  assert.deepEqual(readAnswers({ wait: { score: 9.4 } }), ["wait: long (9.4/3)"]);
  assert.deepEqual(readAnswers({ wait: { score: -1 } }), ["wait: instant (-1.0/3)"]);
  assert.deepEqual(readAnswers({}), []);
  assert.deepEqual(readAnswers({ wait: { score: "1" } }), [], "a non-numeric score is skipped, not thrown on");
  assert.deepEqual(readAnswers({ wait: {} }), []);
});

test("a throttled account is not retried, and a 5xx only once", async () => {
  const statuses = [];
  const reply = (status) => async () => { statuses.push(status); return new Response(JSON.stringify({ error: { message: "busy" } }), { status, headers: { "content-type": "application/json" } }); };
  await assert.rejects(judgeMotion(config, { env, fetchImpl: reply(429) }));
  assert.deepEqual(statuses, [429], "429 is sent once");
  statuses.length = 0;
  await assert.rejects(judgeMotion(config, { env, fetchImpl: reply(503) }));
  assert.deepEqual(statuses, [503, 503], "a 5xx is retried exactly once");
});

test("handler: validates the body before anything reaches Jev", async () => {
  const jev = fakeJev();
  const opts = { env, fetchImpl: jev.fetchImpl };
  assert.equal((await handleJudgeMotion(post({ config }, { contentType: "text/plain" }), opts)).status, 415);
  assert.equal((await handleJudgeMotion(post("{not json"), opts)).status, 400);
  assert.equal((await handleJudgeMotion(post({ config: "x" }), opts)).status, 422);
  assert.equal((await handleJudgeMotion(post({ config: [1] }), opts)).status, 422);
  assert.equal((await handleJudgeMotion(post({}), opts)).status, 422);
  assert.equal((await handleJudgeMotion(post({ config, pad: "x".repeat(70 * 1024) }), opts)).status, 413);
  assert.equal(jev.calls.length, 0);
});

test("handler: 200 with the readings, and the response never carries the key", async () => {
  const jev = fakeJev();
  const res = await handleJudgeMotion(post({ config, request: "quiet and quick" }), { env, fetchImpl: jev.fetchImpl });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  const text = await res.text();
  assert.ok(!text.includes("ts_test_key"), "the key is not in the response");
  const body = JSON.parse(text);
  assert.equal(body.ok, true);
  assert.equal(body.model, "jev-latest");
  assert.equal(body.readings.length, 4, "the stub answered four; the fifth is only read when answered");
  assert.equal(jev.calls[0].body.state.request, "quiet and quick");
});

test("handler: 503 without a key, 502 when Jev refuses, both saying why", async () => {
  const none = await handleJudgeMotion(post({ config }), { env: {}, fetchImpl: fakeJev().fetchImpl });
  assert.equal(none.status, 503);
  const noneBody = await none.json();
  assert.equal(noneBody.error, "jev-not-configured");
  assert.deepEqual(noneBody.missing, [ENV_KEY]);

  const refused = await handleJudgeMotion(post({ config }), { env, fetchImpl: fakeJev({ status: 401 }).fetchImpl });
  assert.equal(refused.status, 502);
  const refusedBody = await refused.json();
  assert.equal(refusedBody.error, "jev-refused");
  assert.equal(refusedBody.status, 401);

  const down = await handleJudgeMotion(post({ config }), { env, fetchImpl: async () => { throw new TypeError("fetch failed"); }, timeout: 500 });
  assert.equal(down.status, 502);
  assert.equal((await down.json()).error, "jev-unreachable");
});

test("the route is owner-only, on demand, and under /api/admin so the middleware guards it", () => {
  const route = readFileSync(join(ROOT, "src", "pages", "api", "admin", "jev", "motion.ts"), "utf8");
  assert.match(route, /export const prerender = false/);
  assert.match(route, /requireAdmin\(context\)/);
  assert.match(route, /sameOrigin\(context\.request, context\.url\)/);
  assert.match(route, /handleJudgeMotion\(context\.request\)/);
  assert.equal(JEV_ENDPOINT, "/api/admin/jev/motion");
});

test("the panel row turns each outcome into one line", async () => {
  assert.equal(describeJevResult(200, { ok: true, model: "jev-latest", readings: ["feel: quiet (80%)", "wait: brief (1.0/3)"] }), "Jev (jev-latest): feel: quiet (80%) · wait: brief (1.0/3)");
  assert.match(describeJevResult(401, { error: "signed-out" }), /sign in at \/admin/);
  assert.match(describeJevResult(403, {}), /owner only/);
  assert.match(describeJevResult(503, { message: `set ${ENV_KEY}` }), /not configured/);
  assert.match(describeJevResult(502, { message: "Jev answered 429" }), /429/);
  const sent = [];
  const line = await askJev(config, "quiet", { fetchImpl: async (url, init) => { sent.push({ url, init }); return new Response(JSON.stringify({ ok: true, model: "jev-latest", readings: ["feel: quiet (80%)"] }), { status: 200 }); } });
  assert.equal(sent[0].url, JEV_ENDPOINT);
  assert.equal(sent[0].init.credentials, "same-origin");
  assert.deepEqual(JSON.parse(sent[0].init.body), { config, request: "quiet" });
  assert.equal(line, "Jev (jev-latest): feel: quiet (80%)");
  assert.match(await askJev(config, "", { fetchImpl: async () => { throw new Error("offline"); } }), /could not be reached: offline/);
});

test("the SDK stays server-side: the browser chunk never imports it", () => {
  for (const file of ["motion-lab.js", "motion-lab-jev.js", "motion.js", "site.js"]) {
    const src = readFileSync(join(ROOT, "src", "scripts", file), "utf8");
    assert.ok(!src.includes("@typesafe-ai/sdk"), `${file} does not import the SDK`);
    assert.ok(!src.includes(ENV_KEY), `${file} does not mention the key`);
  }
});
