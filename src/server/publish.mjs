// Publish a lens: validate it against the whole library exactly as the build
// does — the same Claim Guard, NotMine Guard and reference checks — then
// commit only src/lenses/<slug>.json under the owner's own GitHub identity.
// Vercel rebuilds the site (and /lens/<slug>) from that commit; the Studio
// itself never renders or commits a page, so this stays a small, fast function.
//
// lib / lenses / categories are passed in rather than loaded here: the Astro
// endpoint (src/pages/api/publish.ts) gets them from getSite() (bundled at
// build time, no filesystem access at request time); tests pass what
// loadLibrary() / loadLenses() / loadCategories() return.
import { validateAll } from "../validate.mjs";
import { commitFiles } from "./github.mjs";

const SITE_URL = "https://takaoumehara.com";

/** The lens as the Studio submits it, made ready to publish: status set, noindex kept, the draft's own _file dropped. */
export function prepareLens(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) { const e = new Error("Body must be { lens: {...} }"); e.status = 400; throw e; }
  const lens = JSON.parse(JSON.stringify(input));
  delete lens._file;
  if (lens.slug === "default") { const e = new Error("The default lens cannot be published from the Studio"); e.status = 400; throw e; }
  if (!/^[a-z0-9-]+$/.test(lens.slug ?? "")) { const e = new Error("slug must be kebab-case"); e.status = 400; throw e; }
  lens.status = "published";
  lens.seo = { ...(lens.seo ?? {}), noindex: true };
  return lens;
}

export async function publishLens({ lens: input, user, env, fetchImpl, lib, lenses, categories = [] }) {
  const lens = prepareLens(input);
  const others = lenses.filter((l) => l.slug !== lens.slug).map(({ _file, ...l }) => l);
  // Assets were verified at the last build; the function's bundle does not carry public/.
  const errors = validateAll(lib, [...others, lens], { assetExists: () => true }, categories);
  if (errors.length) {
    const e = new Error(`Validation failed (${errors.length}):\n  - ${errors.join("\n  - ")}`);
    e.status = 422; e.reason = "invalid"; e.details = errors;
    throw e;
  }
  const files = { [`src/lenses/${lens.slug}.json`]: JSON.stringify(lens, null, 2) + "\n" };
  const repo = env.REPO;
  const branch = env.PUBLISH_BRANCH ?? "main";
  const message = `lens(${lens.slug}): publish from the Studio\n\n${lens.title ?? ""}\n\nCommitted by ${user.login} through /studio.`;
  const pullRequest = env.PUBLISH_MODE === "pr" ? { branch: `studio/${lens.slug}-${Date.now().toString(36)}`, title: `lens(${lens.slug}): publish from the Studio`, body: `Lens draft published from /studio by @${user.login}.` } : null;
  const result = await commitFiles({ token: user.token, repo, branch, message, files, pullRequest, fetchImpl });
  return { ...result, slug: lens.slug, url: `${env.SITE_URL ?? SITE_URL}/lens/${lens.slug}`, files: Object.keys(files) };
}
