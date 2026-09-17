// Web-standard Request → Response handlers for the Studio's API: GitHub
// sign-in (owner only), fetching a posting server-side, and publishing a lens.
// Plain functions — no Astro, no framework — so tests/studio.test.mjs calls
// them directly with a stubbed GitHub, and src/pages/api/** wrap each one in
// a thin `export const GET/POST: APIRoute = ({ request }) => handleX(...)`.
import { env, cookie, redirect, origin, isSecure, parseCookies, seal, currentUser, json, errorResponse, STATE_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE } from "./session.mjs";
import { exchangeCode, fetchUser } from "./github.mjs";
import { publishLens } from "./publish.mjs";
import { readJobText, guessCompany } from "../analyze/jd.mjs";

// GET /api/auth/login → GitHub's authorization page. Only the repository owner
// gets a session back (checked in handleCallback); scope public_repo is what
// the publish commit needs and nothing more.
export function handleLogin(request) {
  try {
    const state = crypto.randomUUID();
    const params = new URLSearchParams({
      client_id: env("GITHUB_CLIENT_ID"),
      redirect_uri: `${origin(request)}/api/auth/callback`,
      scope: "public_repo",
      state,
      allow_signup: "false",
    });
    return redirect(`https://github.com/login/oauth/authorize?${params}`, { "set-cookie": cookie(STATE_COOKIE, state, { maxAge: 600, secure: isSecure(request) }) });
  } catch (error) { return errorResponse(error); }
}

// GET /api/auth/callback?code&state → verifies the state, exchanges the code,
// and issues a session only when the GitHub login is OWNER_LOGIN.
export async function handleCallback(request, { fetchImpl = globalThis.fetch } = {}) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookies = parseCookies(request);
    if (!code || !state || cookies[STATE_COOKIE] !== state) return json({ error: "Login state did not match. Start again from /api/auth/login." }, { status: 400 });
    const token = await exchangeCode({ code, clientId: env("GITHUB_CLIENT_ID"), clientSecret: env("GITHUB_CLIENT_SECRET"), redirectUri: `${origin(request)}/api/auth/callback`, fetchImpl });
    const user = await fetchUser(token, { fetchImpl });
    const owner = env("OWNER_LOGIN");
    if ((user.login ?? "").toLowerCase() !== owner.toLowerCase()) {
      return json({ error: `The Studio publishes to ${owner}'s site, so only ${owner} can sign in. You are ${user.login}.`, reason: "forbidden" }, { status: 403, headers: { "set-cookie": cookie(STATE_COOKIE, "", { clear: true, secure: isSecure(request) }) } });
    }
    const session = await seal({ login: user.login, token, exp: Date.now() + SESSION_MAX_AGE * 1000 }, env("SESSION_SECRET"));
    const headers = new Headers({ location: "/studio/" });
    headers.append("set-cookie", cookie(SESSION_COOKIE, session, { secure: isSecure(request) }));
    headers.append("set-cookie", cookie(STATE_COOKIE, "", { clear: true, secure: isSecure(request) }));
    return new Response(null, { status: 302, headers });
  } catch (error) { return errorResponse(error); }
}

// GET /api/auth/me → { login } for the signed-in owner, 401 otherwise.
export async function handleMe(request) {
  try {
    const user = await currentUser(request);
    if (!user) return json({ error: "Not signed in", reason: "unauthorized" }, { status: 401 });
    return json({ login: user.login, exp: user.exp });
  } catch (error) { return errorResponse(error); }
}

// GET /api/auth/logout → clears the session and returns to the Studio.
export function handleLogout(request) {
  return redirect("/studio/", { "set-cookie": cookie(SESSION_COOKIE, "", { clear: true, secure: isSecure(request) }) });
}

// GET /api/fetch-jd?url= → the posting's text, read server-side (a browser
// cannot fetch another site's page). Owner only, so the site is nobody's proxy.
export async function handleFetchJd(request, { fetchImpl = globalThis.fetch, user = null } = {}) {
  if (!user) return json({ error: "Sign in to fetch a posting by URL, or paste its text.", reason: "unauthorized" }, { status: 401 });
  const url = new URL(request.url).searchParams.get("url");
  if (!url || !/^https?:\/\//.test(url)) return json({ error: "Pass a full http(s) URL.", reason: "bad-url" }, { status: 400 });
  try {
    const job = await readJobText({ url, fetchImpl });
    return json({ ...job, company: job.company ?? guessCompany(url) ?? null });
  } catch (error) {
    return json({ error: error.message, reason: error.reason ?? "fetch", partial: error.partial?.text?.slice(0, 2000) ?? null }, { status: 422 });
  }
}

// POST /api/publish { lens } → validates against the library and commits
// src/lenses/<slug>.json as the signed-in owner. `site` is { lib, lenses,
// categories }: the Astro endpoint passes getSite({ checkAssets: false }),
// tests pass loadLibrary() / loadLenses() / loadCategories().
export async function handlePublish(request, { user = null, env: envOverride = process.env, fetchImpl = globalThis.fetch, site, lib, lenses, categories } = {}) {
  if (!user) return json({ error: "Sign in with GitHub to publish.", reason: "unauthorized" }, { status: 401 });
  let body;
  try { body = await request.json(); } catch { return json({ error: "Body must be JSON: { lens }", reason: "bad-request" }, { status: 400 }); }
  try {
    const result = await publishLens({
      lens: body?.lens,
      user,
      env: { REPO: envOverride.REPO ?? "takaoumehara/takaoumehara.com", PUBLISH_BRANCH: envOverride.PUBLISH_BRANCH ?? "main", PUBLISH_MODE: envOverride.PUBLISH_MODE ?? "commit", SITE_URL: envOverride.SITE_URL },
      fetchImpl,
      lib: site?.lib ?? lib,
      lenses: site?.lenses ?? lenses,
      categories: site?.categories ?? categories,
    });
    return json(result);
  } catch (error) { return errorResponse(error); }
}
