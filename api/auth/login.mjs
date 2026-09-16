// GET /api/auth/login → GitHub's authorization page. Only the repository owner
// gets a session back (checked in callback.mjs); scope public_repo is what the
// publish commit needs and nothing more.
import { env, cookie, redirect, origin, isSecure, STATE_COOKIE, errorResponse } from "../_lib/session.mjs";

export function GET(request) {
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
export default GET;
