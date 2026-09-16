// Phase 3b — the Studio (studio/) and its API (api/).
//
// The page runs the engine in the browser on the same modules the build uses;
// the API signs the owner in with GitHub and commits a lens under their name.
// These tests run the handlers directly with a stubbed GitHub.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { loadLibrary, loadLenses, ROOT } from "../src/lib/load.mjs";
import { hydrateLibrary } from "../src/lib/library.mjs";
import { renderAll } from "../src/build.mjs";
import { seal, unseal, currentUser, parseCookies, cookie, SESSION_COOKIE, STATE_COOKIE } from "../api/_lib/session.mjs";
import { commitFiles } from "../api/_lib/github.mjs";
import { prepareLens, publishLens } from "../api/_lib/publish.mjs";
import { GET as login } from "../api/auth/login.mjs";
import { handleCallback } from "../api/auth/callback.mjs";
import { handleFetch } from "../api/fetch-jd.mjs";
import { handlePublish } from "../api/publish.mjs";

process.env.GITHUB_CLIENT_ID = "test-client";
process.env.GITHUB_CLIENT_SECRET = "test-secret";
process.env.SESSION_SECRET = "a-long-random-secret-for-tests";
process.env.OWNER_LOGIN = "takaoumehara";
process.env.SITE_URL = "https://takaoumehara.com";

const lib = loadLibrary();
const lenses = loadLenses();
const owner = { login: "takaoumehara", token: "gho_test", exp: Date.now() + 60_000 };
const stripeDraft = () => JSON.parse(readFileSync(join(ROOT, "src", "lenses", "stripe.json"), "utf8"));

/** A fake GitHub: records every call, answers the Git Data API the way GitHub does. */
function fakeGitHub({ user = { login: "takaoumehara" } } = {}) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url, method: init.method ?? "GET", body });
    const reply = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
    if (url === "https://github.com/login/oauth/access_token") return reply({ access_token: "gho_test", token_type: "bearer" });
    if (url.endsWith("/user")) return reply(user);
    if (/\/git\/ref\/heads\//.test(url)) return reply({ object: { sha: "base-sha" } });
    if (/\/git\/commits\/base-sha$/.test(url)) return reply({ sha: "base-sha", tree: { sha: "base-tree" } });
    if (/\/git\/blobs$/.test(url)) return reply({ sha: `blob-${calls.length}` });
    if (/\/git\/trees$/.test(url)) return reply({ sha: "new-tree" });
    if (/\/git\/commits$/.test(url)) return reply({ sha: "new-commit", html_url: "https://github.com/x/y/commit/new-commit" });
    if (/\/git\/refs\/heads\//.test(url)) return reply({ ref: "refs/heads/main", object: { sha: "new-commit" } });
    if (/\/git\/refs$/.test(url)) return reply({ ref: body.ref });
    if (/\/pulls$/.test(url)) return reply({ html_url: "https://github.com/x/y/pull/99" });
    return reply({ message: `unexpected ${url}` }, 404);
  };
  return { calls, fetchImpl };
}

// ── Sessions ────────────────────────────────────────────────────────────────

test("a session is sealed with the secret and cannot be read or forged without it", async () => {
  const token = await seal({ login: "takaoumehara", token: "gho_x" }, "secret-a");
  assert.deepEqual(await unseal(token, "secret-a"), { login: "takaoumehara", token: "gho_x" });
  assert.equal(await unseal(token, "secret-b"), null);
  assert.equal(await unseal("not-a-token", "secret-a"), null);
  const c = cookie(SESSION_COOKIE, token);
  assert.match(c, /HttpOnly/); assert.match(c, /SameSite=Lax/); assert.match(c, /Secure/); assert.match(c, /Path=\//);
  assert.equal(parseCookies(new Request("https://x/", { headers: { cookie: `a=1; ${SESSION_COOKIE}=${encodeURIComponent(token)}` } }))[SESSION_COOKIE], token);
});

test("only the owner's session counts, and an expired one does not", async () => {
  const mk = async (payload) => new Request("https://takaoumehara.com/api/auth/me", { headers: { cookie: `${SESSION_COOKIE}=${encodeURIComponent(await seal(payload, process.env.SESSION_SECRET))}` } });
  assert.equal((await currentUser(await mk(owner)))?.login, "takaoumehara");
  assert.equal(await currentUser(await mk({ ...owner, login: "someone-else" })), null);
  assert.equal(await currentUser(await mk({ ...owner, exp: Date.now() - 1 })), null);
  assert.equal(await currentUser(new Request("https://takaoumehara.com/api/auth/me")), null);
});

// ── OAuth ───────────────────────────────────────────────────────────────────

test("login sends the owner to GitHub with a state cookie and the public_repo scope only", () => {
  const r = login(new Request("https://takaoumehara.com/api/auth/login"));
  assert.equal(r.status, 302);
  const to = new URL(r.headers.get("location"));
  assert.equal(to.origin + to.pathname, "https://github.com/login/oauth/authorize");
  assert.equal(to.searchParams.get("client_id"), "test-client");
  assert.equal(to.searchParams.get("scope"), "public_repo");
  assert.equal(to.searchParams.get("redirect_uri"), "https://takaoumehara.com/api/auth/callback");
  const state = to.searchParams.get("state");
  assert.match(r.headers.get("set-cookie"), new RegExp(`${STATE_COOKIE}=${state}`));
});

test("the callback refuses a mismatched state, refuses anyone but the owner, and issues a session to the owner", async () => {
  const req = (state, cookieState) => new Request(`https://takaoumehara.com/api/auth/callback?code=abc&state=${state}`, { headers: { cookie: `${STATE_COOKIE}=${cookieState}` } });
  assert.equal((await handleCallback(req("s1", "s2"), { fetchImpl: fakeGitHub().fetchImpl })).status, 400);
  const stranger = await handleCallback(req("s1", "s1"), { fetchImpl: fakeGitHub({ user: { login: "mallory" } }).fetchImpl });
  assert.equal(stranger.status, 403);
  assert.match(await stranger.text(), /only takaoumehara can sign in/);
  const gh = fakeGitHub();
  const ok = await handleCallback(req("s1", "s1"), { fetchImpl: gh.fetchImpl });
  assert.equal(ok.status, 302);
  assert.equal(ok.headers.get("location"), "/studio/");
  const cookies = ok.headers.getSetCookie();
  const session = cookies.find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  assert.ok(session && /HttpOnly/.test(session));
  const sealed = decodeURIComponent(session.split(";")[0].slice(SESSION_COOKIE.length + 1));
  assert.equal((await unseal(sealed, process.env.SESSION_SECRET)).login, "takaoumehara");
  assert.ok(gh.calls.some((c) => c.url === "https://github.com/login/oauth/access_token" && c.body.code === "abc"));
});

// ── Fetching a posting ──────────────────────────────────────────────────────

test("fetch-jd needs the owner, reads a page server-side, and reports an unreadable one with the paste workaround", async () => {
  const anon = await handleFetch(new Request("https://takaoumehara.com/api/fetch-jd?url=https://jobs.example.com/1"));
  assert.equal(anon.status, 401);
  const page = `<html><body><main><h1>Senior Product Designer</h1>${"<p>Design systems, prototyping in code, user research, partnering with engineering.</p>".repeat(8)}</main></body></html>`;
  const fetchImpl = async () => new Response(page, { status: 200, headers: { "content-type": "text/html" } });
  const ok = await handleFetch(new Request("https://takaoumehara.com/api/fetch-jd?url=https://boards.greenhouse.io/acme/jobs/1"), { user: owner, fetchImpl });
  assert.equal(ok.status, 200);
  const data = await ok.json();
  assert.match(data.text, /Senior Product Designer/);
  assert.equal(data.company, "Acme");
  const empty = await handleFetch(new Request("https://takaoumehara.com/api/fetch-jd?url=https://jobs.example.com/1"), { user: owner, fetchImpl: async () => new Response("<html><body><div id=app></div></body></html>") });
  assert.equal(empty.status, 422);
  assert.equal((await empty.json()).reason, "unreadable");
});

// ── Publishing ──────────────────────────────────────────────────────────────

test("publish validates like the build, renders the same HTML, and commits lens + page + library index in one commit", async () => {
  const gh = fakeGitHub();
  const draft = stripeDraft();
  const result = await publishLens({ lens: draft, user: owner, env: { REPO: "takaoumehara/takaoumehara.com", PUBLISH_BRANCH: "main", PUBLISH_MODE: "commit", SITE_URL: "https://takaoumehara.com" }, fetchImpl: gh.fetchImpl, lib, lenses });
  assert.equal(result.url, "https://takaoumehara.com/lens/stripe");
  assert.equal(result.sha, "new-commit");
  assert.deepEqual(result.files, ["src/lenses/stripe.json", "lens/stripe/index.html", "assets/studio/library.json"]);
  const blobs = gh.calls.filter((c) => /\/git\/blobs$/.test(c.url)).map((c) => c.body.content);
  const published = { ...draft, status: "published" };
  const expected = renderAll({ lib, lenses: [...lenses.filter((l) => l.slug !== "stripe").map(({ _file, ...l }) => l), published], assetExists: () => true });
  assert.equal(blobs[1], expected.get("lens/stripe/index.html"), "the committed page is byte-for-byte what node src/build.mjs would write");
  assert.equal(JSON.parse(blobs[0]).status, "published");
  assert.ok(gh.calls.some((c) => c.method === "PATCH" && /refs\/heads\/main/.test(c.url)), "fast-forwards main");
  assert.ok(gh.calls.every((c) => !c.url.includes("/user") || c.method === "GET"));
  const commit = gh.calls.find((c) => /\/git\/commits$/.test(c.url));
  assert.match(commit.body.message, /publish from the Studio/);
  assert.equal(commit.body.parents[0], "base-sha");
});

test("publish refuses an invalid lens with the guard's findings, and the default lens outright", async () => {
  const gh = fakeGitHub();
  const bad = stripeDraft();
  bad.hero.body = { en: "I led 400 designers.", jp: "400 人を率いた。" };
  await assert.rejects(publishLens({ lens: bad, user: owner, env: { REPO: "x/y" }, fetchImpl: gh.fetchImpl, lib, lenses }), (e) => e.status === 422 && e.details.some((d) => /Claim Guard/.test(d)));
  assert.equal(gh.calls.length, 0, "nothing reaches GitHub");
  assert.throws(() => prepareLens({ ...stripeDraft(), slug: "default" }), /default lens/);
  assert.throws(() => prepareLens({ ...stripeDraft(), slug: "Bad Slug" }), /kebab-case/);
});

test("PUBLISH_MODE=pr commits to a new branch and opens a pull request instead", async () => {
  const gh = fakeGitHub();
  const result = await publishLens({ lens: stripeDraft(), user: owner, env: { REPO: "x/y", PUBLISH_BRANCH: "main", PUBLISH_MODE: "pr" }, fetchImpl: gh.fetchImpl, lib, lenses });
  assert.equal(result.prUrl, "https://github.com/x/y/pull/99");
  assert.match(result.branch, /^studio\/stripe-/);
  assert.ok(!gh.calls.some((c) => c.method === "PATCH"), "main is not touched");
});

test("the publish handler needs a session and a JSON body", async () => {
  const anon = await handlePublish(new Request("https://takaoumehara.com/api/publish", { method: "POST", body: "{}" }));
  assert.equal(anon.status, 401);
  const noBody = await handlePublish(new Request("https://takaoumehara.com/api/publish", { method: "POST", body: "nope" }), { user: owner });
  assert.equal(noBody.status, 400);
  const gh = fakeGitHub();
  const ok = await handlePublish(new Request("https://takaoumehara.com/api/publish", { method: "POST", body: JSON.stringify({ lens: stripeDraft() }) }), { user: owner, fetchImpl: gh.fetchImpl, lib, lenses, env: { REPO: "x/y", SITE_URL: "https://takaoumehara.com" } });
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).url, "https://takaoumehara.com/lens/stripe");
});

test("commitFiles sends one blob per file and one commit on top of the branch head", async () => {
  const gh = fakeGitHub();
  const r = await commitFiles({ token: "t", repo: "x/y", branch: "main", message: "m", files: { "a.txt": "A", "b/c.txt": "C" }, fetchImpl: gh.fetchImpl });
  assert.equal(r.sha, "new-commit");
  const tree = gh.calls.find((c) => /\/git\/trees$/.test(c.url)).body;
  assert.deepEqual(tree.tree.map((t) => t.path), ["a.txt", "b/c.txt"]);
  assert.equal(tree.base_tree, "base-tree");
});

// ── The page and its modules ────────────────────────────────────────────────

test("the Studio is noindex, off the nav, and every module it imports is browser-safe (no node: imports anywhere in the graph)", () => {
  const html = readFileSync(join(ROOT, "studio", "index.html"), "utf8");
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /studio\.mjs/);
  assert.ok(!/studio/.test(readFileSync(join(ROOT, "src", "render", "shell.mjs"), "utf8")), "the Studio is not in the site nav");

  const seen = new Set();
  const walk = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(/^import\s[^'"]*['"]([^'"]+)['"]/gm)) {
      const spec = m[1];
      assert.ok(!spec.startsWith("node:"), `${file.replace(ROOT, "")} imports ${spec}, which a browser cannot load`);
      if (spec.startsWith(".")) walk(resolve(dirname(file), spec));
    }
  };
  walk(join(ROOT, "studio", "studio.mjs"));
  walk(join(ROOT, "try", "try.mjs"));
  assert.ok(seen.size >= 10, `walked ${seen.size} modules`);
  assert.ok(!/robots" content="noindex/.test(readFileSync(join(ROOT, "try", "index.html"), "utf8")), "the public demo is meant to be found");
  for (const f of ["src/analyze/jd.mjs", "src/analyze/draft.mjs", "src/render/page.mjs", "src/validate.mjs", "src/lib/library.mjs"]) assert.ok(seen.has(join(ROOT, f)), `${f} is in the graph`);
});

test("the library JSON the Studio loads hydrates into the same evidence the build uses", () => {
  const json = JSON.parse(readFileSync(join(ROOT, "assets", "studio", "library.json"), "utf8"));
  const hydrated = hydrateLibrary(json);
  assert.equal(hydrated.evidence.size, lib.evidence.size);
  assert.ok(hydrated.lexicon?.capabilities, "the lexicon travels with the library");
  assert.ok(hydrated.lensSlugs.includes("default"));
  for (const [slug, item] of lib.evidence) {
    const { _notes, ...rest } = item;
    assert.deepEqual(hydrated.evidence.get(slug), rest, `${slug} survives the round trip (without _notes)`);
  }
  const vercelignore = readFileSync(join(ROOT, ".vercelignore"), "utf8");
  assert.ok(!/^src\s*$/m.test(vercelignore), "src/ must be deployed: the Studio imports it as ES modules");
  assert.match(vercelignore, /src\/pitches\/\*/);
  assert.ok(existsSync(join(ROOT, "vercel.json")));
});
