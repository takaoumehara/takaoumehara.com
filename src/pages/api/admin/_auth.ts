// Who may use /admin, decided on the server only. src/middleware.ts fills
// context.locals.admin for /admin and /api/admin/* (through Clerk when it is
// configured); every /api/admin handler checks it again with requireAdmin().
// The leading underscore keeps this file out of the routes.
//
// Env (read at request time — Vercel project settings, never bundled):
//   PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY   Clerk (both, or admin is off)
//   ADMIN_EMAILS   comma/space separated; default takaoumehara@gmail.com
//   GITHUB_TOKEN   fine-grained token, contents:write on GITHUB_REPO (saving)
//   GITHUB_REPO    default takaoumehara/takaoumehara.com
//   GITHUB_BRANCH  default main

export interface AdminState {
  configured: boolean;
  missing: string[];
  signedIn: boolean;
  allowed: boolean;
  userId: string | null;
  email: string | null;
  reason: null | "signed-out" | "not-allowed" | "no-verified-email" | "lookup-failed";
}

export const DEFAULT_ADMIN_EMAILS = "takaoumehara@gmail.com";

export function readEnv(name: string): string | undefined {
  const value = typeof process !== "undefined" ? process.env?.[name] : undefined;
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || undefined;
}

export function adminConfig() {
  const missing = ["PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"].filter((n) => !readEnv(n));
  const adminEmails = (readEnv("ADMIN_EMAILS") ?? DEFAULT_ADMIN_EMAILS)
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return { configured: missing.length === 0, missing, adminEmails };
}

export function githubConfig() {
  return {
    token: readEnv("GITHUB_TOKEN"),
    repo: readEnv("GITHUB_REPO") ?? "takaoumehara/takaoumehara.com",
    branch: readEnv("GITHUB_BRANCH") ?? "main",
  };
}

export const isAdminPath = (pathname: string) => /^\/(?:admin|api\/admin)(?:\/|\.html$|$)/.test(pathname);
export const isAdminApi = (pathname: string) => /^\/api\/admin(?:\/|$)/.test(pathname);

/** The user's primary email address, only when it is verified. */
export function primaryVerifiedEmail(user: any): string | null {
  if (!user) return null;
  const list: any[] = Array.isArray(user.emailAddresses) ? user.emailAddresses : [];
  const primary = list.find((e) => e?.id && e.id === user.primaryEmailAddressId) ?? null;
  if (!primary || primary.verification?.status !== "verified") return null;
  return typeof primary.emailAddress === "string" ? primary.emailAddress.toLowerCase() : null;
}

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
      ...headers,
    },
  });

/** 503 / 401 / 403 as JSON, or null when the request comes from an allowed admin. */
export function denyUnlessAdmin(state: AdminState | undefined): Response | null {
  if (!state || !state.configured) {
    const missing = state?.missing?.length ? state.missing : adminConfig().missing;
    return json({ ok: false, error: "admin-not-configured", message: `Admin is not configured. Set ${missing.join(", ") || "the Clerk keys"} in the Vercel project.`, missing }, 503);
  }
  if (!state.signedIn) return json({ ok: false, error: "signed-out", message: "Sign in at /admin first." }, 401);
  if (!state.allowed) return json({ ok: false, error: "forbidden", message: "This account is not an admin." }, 403);
  return null;
}

/**
 * CSRF: a state-changing request must come from this origin. Browsers send
 * Origin on every cross-origin POST (and Sec-Fetch-Site everywhere current);
 * a request that carries neither is refused as well.
 */
export function sameOrigin(request: Request, url: URL): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  const origin = request.headers.get("origin");
  if (origin) return origin === url.origin;
  return site === "same-origin";
}

export function requireAdmin(context: { locals: any }): Response | null {
  return denyUnlessAdmin(context.locals?.admin as AdminState | undefined);
}
