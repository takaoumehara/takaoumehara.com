// Middleware: only /admin and /api/admin/* are touched; every other request
// (and every prerendered page at build time) passes straight through, so the
// public site never loads Clerk.
//
// For the admin routes it decides, on the server, who is asking and stores
// the answer in locals.admin (see src/pages/api/admin/_auth.ts):
//   - Clerk keys missing → admin is "not configured": /admin explains which
//     env vars to set, /api/admin/* answers 503. Clerk is never loaded.
//   - Otherwise Clerk's own middleware authenticates the request (session
//     cookie or Bearer session token, issued for this origin only), and the
//     user's primary *verified* email must be in ADMIN_EMAILS.
//   - /api/admin/* is refused here already (401 / 403); the handlers check again.
import { defineMiddleware } from "astro:middleware";
import { adminConfig, isAdminApi, isAdminPath, denyUnlessAdmin, primaryVerifiedEmail, type AdminState } from "./pages/api/admin/_auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  if (!isAdminPath(pathname) || context.isPrerendered) return next();

  const api = isAdminApi(pathname);
  const config = adminConfig();
  if (!config.configured) {
    const state: AdminState = { configured: false, missing: config.missing, signedIn: false, allowed: false, userId: null, email: null, reason: null };
    context.locals.admin = state;
    if (api) return denyUnlessAdmin(state)!;
    return next();
  }

  // Loaded only when configured: no Clerk code runs for a site without keys.
  const { clerkMiddleware } = await import("@clerk/astro/server");
  const guard = clerkMiddleware(async (auth, ctx, nextInner) => {
    const session = auth();
    const userId = session?.userId ?? null;
    const state: AdminState = { configured: true, missing: [], signedIn: !!userId, allowed: false, userId, email: null, reason: userId ? null : "signed-out" };
    if (userId) {
      try {
        const user = await ctx.locals.currentUser();
        state.email = primaryVerifiedEmail(user);
        state.allowed = !!state.email && config.adminEmails.includes(state.email);
        if (!state.allowed) state.reason = state.email ? "not-allowed" : "no-verified-email";
      } catch {
        state.reason = "lookup-failed";
      }
    }
    ctx.locals.admin = state;
    if (api) {
      const denied = denyUnlessAdmin(state);
      if (denied) return denied;
    }
    return nextInner();
  }, { authorizedParties: [context.url.origin] });
  return guard(context, next);
});
