// /api/admin/jev/motion — Jev judges a motion config for the Motion Lab.
//
//   POST { config, request? } → { ok, model, answers, readings, usage }
//
// Owner only: src/middleware.ts has already refused anyone but an allowed
// admin (Clerk session from /admin), and requireAdmin checks again, so the
// public site cannot spend the TypeSafe account. Same-origin only. The work
// is in src/server/jev.mjs; see docs/jev.md.
import type { APIRoute } from "astro";
import { handleJudgeMotion } from "../../../../server/jev.mjs";
import { json, requireAdmin, sameOrigin } from "../_auth";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const denied = requireAdmin(context);
  if (denied) return denied;
  if (!sameOrigin(context.request, context.url)) return json({ ok: false, error: "cross-origin", message: "Requests must come from this site." }, 403);
  return handleJudgeMotion(context.request);
};

export const ALL: APIRoute = () => json({ ok: false, error: "method-not-allowed" }, 405, { allow: "POST" });
