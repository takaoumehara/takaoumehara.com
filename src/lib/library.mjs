// Browser-safe half of the loader: a serialized library (assets/studio/library.json)
// back into the shape loadLibrary() returns. No filesystem access.
export function hydrateLibrary(json) {
  const evidence = new Map();
  for (const item of json.evidence ?? []) evidence.set(item.slug, item);
  return {
    profile: json.profile,
    capabilities: json.capabilities,
    chapters: json.chapters,
    roles: json.roles,
    theses: json.theses,
    ideas: json.ideas ?? [],
    now: json.now ?? null,
    evidence,
    sources: new Map(),
    lensSlugs: json.lenses ?? [],
    lexicon: json.lexicon,
  };
}
