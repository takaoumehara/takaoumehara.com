// GET /api/auth/me → { login } for the signed-in owner, 401 otherwise.
import { currentUser, json, errorResponse } from "../_lib/session.mjs";

export async function GET(request) {
  try {
    const user = await currentUser(request);
    if (!user) return json({ error: "Not signed in", reason: "unauthorized" }, { status: 401 });
    return json({ login: user.login, exp: user.exp });
  } catch (error) { return errorResponse(error); }
}
export default GET;
