// GET /api/auth/login → GitHub's authorization page. Renders on demand: the
// handler (src/server/handlers.mjs) is what tests/studio.test.mjs exercises
// directly; this file just wires it to Astro's endpoint contract.
import type { APIRoute } from "astro";
import { handleLogin } from "../../../server/handlers.mjs";

export const prerender = false;

export const GET: APIRoute = ({ request }) => handleLogin(request);
