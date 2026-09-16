// GET /api/fetch-jd?url= → the posting's text, read server-side (a browser
// cannot fetch another site's page). Owner only, so the site is nobody's proxy.
import { currentUser, json, errorResponse } from "./_lib/session.mjs";
import { readJobText, guessCompany } from "../src/analyze/jd.mjs";

export async function handleFetch(request, { fetchImpl = globalThis.fetch, user = null } = {}) {
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

export async function GET(request) {
  try { return await handleFetch(request, { user: await currentUser(request) }); } catch (error) { return errorResponse(error); }
}
export default GET;
