// GET /api/auth/callback?code&state → verifies the state, exchanges the code,
// and issues a session only when the GitHub login is OWNER_LOGIN.
import { env, cookie, redirect, origin, isSecure, parseCookies, seal, STATE_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE, errorResponse, json } from "../_lib/session.mjs";
import { exchangeCode, fetchUser } from "../_lib/github.mjs";

export async function handleCallback(request, { fetchImpl = globalThis.fetch } = {}) {
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
}

export async function GET(request) {
  try { return await handleCallback(request); } catch (error) { return errorResponse(error); }
}
export default GET;
