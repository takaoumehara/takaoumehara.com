// Publish a lens: validate it against the whole library exactly as the build
// does, render the page with the same renderer, and commit both — plus the
// Studio's library index — in one commit under the owner's name. Vercel then
// deploys /lens/<slug>. Deterministic: the committed HTML is what
// `node src/build.mjs` would write, so the repo's own tests keep passing.
import { loadLibrary, loadLenses, loadCategories } from "../../src/lib/load.mjs";
import { renderAll, outputPath, SITE_URL } from "../../src/build.mjs";
import { commitFiles } from "./github.mjs";

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

export async function publishLens({ lens: input, user, env, fetchImpl, lib = loadLibrary(), lenses = loadLenses(), categories = loadCategories() }) {
  const lens = prepareLens(input);
  const others = lenses.filter((l) => l.slug !== lens.slug).map(({ _file, ...l }) => l);
  let pages;
  try {
    // Assets were verified at the last build; the function's bundle does not carry them.
    pages = renderAll({ lib, lenses: [...others, lens], categories, assetExists: () => true });
  } catch (error) {
    const e = new Error(error.message);
    e.status = 422; e.reason = "invalid"; e.details = error.details;
    throw e;
  }
  const path = outputPath(lens);
  const files = {
    [`src/lenses/${lens.slug}.json`]: JSON.stringify(lens, null, 2) + "\n",
    [path]: pages.get(path),
    "assets/studio/library.json": pages.get("assets/studio/library.json"),
  };
  const repo = env.REPO;
  const branch = env.PUBLISH_BRANCH ?? "main";
  const message = `lens(${lens.slug}): publish from the Studio\n\n${lens.title ?? ""}\n\nCommitted by ${user.login} through /studio.`;
  const pullRequest = env.PUBLISH_MODE === "pr" ? { branch: `studio/${lens.slug}-${Date.now().toString(36)}`, title: `lens(${lens.slug}): publish from the Studio`, body: `Lens draft published from /studio by @${user.login}.` } : null;
  const result = await commitFiles({ token: user.token, repo, branch, message, files, pullRequest, fetchImpl });
  return { ...result, slug: lens.slug, url: `${env.SITE_URL ?? SITE_URL}/lens/${lens.slug}`, files: Object.keys(files) };
}
