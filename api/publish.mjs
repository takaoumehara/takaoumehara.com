// POST /api/publish { lens } → validates, renders and commits the lens as the
// signed-in owner; Vercel deploys /lens/<slug> from that commit.
import { currentUser, json, errorResponse } from "./_lib/session.mjs";
import { publishLens } from "./_lib/publish.mjs";

export async function handlePublish(request, { user = null, env = process.env, fetchImpl = globalThis.fetch, ...deps } = {}) {
  if (!user) return json({ error: "Sign in with GitHub to publish.", reason: "unauthorized" }, { status: 401 });
  let body;
  try { body = await request.json(); } catch { return json({ error: "Body must be JSON: { lens }", reason: "bad-request" }, { status: 400 }); }
  try {
    const result = await publishLens({ lens: body?.lens, user, env: { REPO: env.REPO ?? "takaoumehara/takaoumehara.com", PUBLISH_BRANCH: env.PUBLISH_BRANCH ?? "main", PUBLISH_MODE: env.PUBLISH_MODE ?? "commit", SITE_URL: env.SITE_URL }, fetchImpl, ...deps });
    return json(result);
  } catch (error) { return errorResponse(error); }
}

export async function POST(request) {
  try { return await handlePublish(request, { user: await currentUser(request) }); } catch (error) { return errorResponse(error); }
}
export default POST;
