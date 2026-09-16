// GET /api/auth/logout → clears the session and returns to the Studio.
import { cookie, redirect, isSecure, SESSION_COOKIE } from "../_lib/session.mjs";

export function GET(request) {
  return redirect("/studio/", { "set-cookie": cookie(SESSION_COOKIE, "", { clear: true, secure: isSecure(request) }) });
}
export default GET;
