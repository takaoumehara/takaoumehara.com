// GET /api/auth/logout → clears the session and returns to the Studio.
import type { APIRoute } from "astro";
import { handleLogout } from "../../../server/handlers.mjs";

export const prerender = false;

export const GET: APIRoute = ({ request }) => handleLogout(request);
