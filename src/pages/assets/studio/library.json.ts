// GET /assets/studio/library.json — the evidence library as one JSON document,
// for the Studio (src/studio/studio.mjs) and the public demo (src/studio/try.mjs)
// to hydrateLibrary() in the browser. Prerendered like any other static page:
// it is built once and served as a plain file, not recomputed per request.
import { getLibrary, getSite, getLenses } from "../../../lib/site.mjs";
import { serializeLibrary } from "../../../lib/load.mjs";

export const GET = () =>
  new Response(
    JSON.stringify(serializeLibrary(getLibrary(), { lexicon: getSite().lexicon, lensSlugs: getLenses().map((l) => l.slug) })),
    { headers: { "content-type": "application/json" } },
  );
