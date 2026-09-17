// GET /api/auth/callback?code&state → verifies the state, exchanges the code,
// and issues a session only when the GitHub login is OWNER_LOGIN.
import type { APIRoute } from "astro";
import { handleCallback } from "../../../server/handlers.mjs";

export const prerender = false;

export const GET: APIRoute = ({ request }) => handleCallback(request);
