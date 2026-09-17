// GET /api/fetch-jd?url= → the posting's text, read server-side. Owner only.
import type { APIRoute } from "astro";
import { handleFetchJd } from "../../server/handlers.mjs";
import { currentUser, errorResponse } from "../../server/session.mjs";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    return await handleFetchJd(request, { user: await currentUser(request) });
  } catch (error) {
    return errorResponse(error as Error & { status?: number });
  }
};
