// POST /api/publish { lens } → validates the lens against the whole library
// and commits src/lenses/<slug>.json as the signed-in owner; Vercel rebuilds
// the site (and /lens/<slug>) from that commit. getSite({ checkAssets: false })
// hands the handler the bundled library/lenses/categories — no filesystem
// access at request time.
import type { APIRoute } from "astro";
import { handlePublish } from "../../server/handlers.mjs";
import { currentUser, errorResponse } from "../../server/session.mjs";
import { getSite } from "../../lib/site.mjs";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await currentUser(request);
    const { lib, lenses, categories } = getSite({ checkAssets: false });
    return await handlePublish(request, { user, site: { lib, lenses, categories } });
  } catch (error) {
    return errorResponse(error as Error & { status?: number });
  }
};
