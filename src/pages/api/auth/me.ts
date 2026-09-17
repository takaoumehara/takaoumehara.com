// GET /api/auth/me → { login } for the signed-in owner, 401 otherwise.
import type { APIRoute } from "astro";
import { handleMe } from "../../../server/handlers.mjs";

export const prerender = false;

export const GET: APIRoute = ({ request }) => handleMe(request);
