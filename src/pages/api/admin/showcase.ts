// /api/admin/showcase — the home hero's slides (src/data/showcase.json).
//
//   GET   the list as this deployment was built with it
//   POST  { slides: [{ slug, media, enabled }] } → validated against the
//         library and the images the site ships, then committed to
//         GITHUB_REPO@GITHUB_BRANCH as src/data/showcase.json; Vercel rebuilds
//         the site from that commit. Without GITHUB_TOKEN the validated file is
//         returned (503 github-not-configured) so the admin can download it.
//
// src/middleware.ts has already refused anyone but an allowed admin; each
// handler checks again. POST also requires a same-origin request.
import type { APIRoute } from "astro";
import { commitFiles } from "../../../server/github.mjs";
import { getSite } from "../../../lib/site.mjs";
import { serializeShowcase, validateShowcase } from "../../../lib/showcase.mjs";
import showcase from "../../../data/showcase.json";
import mediaFiles from "virtual:admin-media";
import { githubConfig, json, requireAdmin, sameOrigin } from "./_auth";

export const prerender = false;

const MAX_BODY = 64 * 1024;
const FILE = "src/data/showcase.json";

export const GET: APIRoute = async (context) => {
  const denied = requireAdmin(context);
  if (denied) return denied;
  return json({ ok: true, file: FILE, showcase });
};

export const POST: APIRoute = async (context) => {
  const denied = requireAdmin(context);
  if (denied) return denied;
  const { request, url, locals } = context;
  if (!sameOrigin(request, url)) return json({ ok: false, error: "cross-origin", message: "Requests must come from this site." }, 403);
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return json({ ok: false, error: "unsupported-media-type", message: "Send application/json." }, 415);
  }

  const text = await request.text();
  if (text.length > MAX_BODY) return json({ ok: false, error: "too-large", message: "The payload is too large." }, 413);
  let body: unknown;
  try { body = JSON.parse(text); } catch { return json({ ok: false, error: "bad-json", message: "The body is not valid JSON." }, 400); }

  const { lib } = getSite({ checkAssets: false });
  const { value, errors, warnings } = validateShowcase(body, { lib, files: new Set(mediaFiles) });
  if (!value) return json({ ok: false, error: "invalid", message: `The showcase is not valid (${errors.length}).`, errors }, 422);
  const content = serializeShowcase(value);

  const gh = githubConfig();
  if (!gh.token) {
    return json({
      ok: false,
      error: "github-not-configured",
      message: "Saving is not configured: set GITHUB_TOKEN (contents: write on the repository) in the Vercel project. The changes are valid: download showcase.json and commit it to src/data/ by hand. / GITHUB_TOKEN が未設定のため保存できません。内容は有効です。showcase.json をダウンロードし、src/data/ にコミットしてください。",
      missing: ["GITHUB_TOKEN"],
      file: FILE,
      content,
      warnings,
    }, 503);
  }

  const who = locals.admin?.email ?? "an admin";
  const enabled = value.slides.filter((s) => s.enabled).map((s) => s.slug);
  const message = `showcase: update the home hero from /admin\n\n${enabled.length} slide(s): ${enabled.join(", ")}\n\nSaved by ${who} through /admin.`;
  try {
    const result = await commitFiles({ token: gh.token, repo: gh.repo, branch: gh.branch, message, files: { [FILE]: content } });
    return json({ ok: true, sha: result.sha, htmlUrl: result.htmlUrl, branch: gh.branch, repo: gh.repo, file: FILE, content, warnings });
  } catch (error) {
    const e = error as Error & { status?: number };
    return json({ ok: false, error: "github-failed", message: `GitHub refused the commit: ${e.message}`, file: FILE, content }, 502);
  }
};

export const ALL: APIRoute = () => json({ ok: false, error: "method-not-allowed" }, 405, { allow: "GET, POST" });
