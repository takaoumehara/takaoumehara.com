// Unpublished work. A record with `visibility: "private"` — and a page that
// exists only for one, like /lab/stage — is built everywhere except the
// production deployment: `npm run dev`, a local `npm run build` (so the tests
// see it) and Vercel preview deployments. Production leaves it out entirely,
// so there is no URL to find. Built or not, it is noindex, no category or
// lens may list it (src/validate.mjs), and the Studio's library leaves it out
// (serializeLibrary in ./load.mjs). Publishing is: visibility "public", then
// list it in a category.
//
// Fails closed: on Vercel without a VERCEL_ENV, the build counts as production.

/** True for the production deployment's build. */
export const isProductionBuild = (env = process.env) =>
  env.VERCEL_ENV === "production" || (Boolean(env.VERCEL) && !env.VERCEL_ENV);

/** Whether this build writes a page for the record. */
export const pageBuilt = (item, env = process.env) => item?.visibility !== "private" || !isProductionBuild(env);

/** Whether this build writes the pages that exist only for unpublished work. */
export const draftPagesBuilt = (env = process.env) => !isProductionBuild(env);
