const PROJECT_PARAM = 'project';

export function projectUrl(value, slug) {
  const url = new URL(value);
  url.searchParams.set(PROJECT_PARAM, slug);
  return url.href;
}

export function clearProjectUrl(value) {
  const url = new URL(value);
  url.searchParams.delete(PROJECT_PARAM);
  return url.href;
}

export function projectSlug(value) {
  const slug = new URL(value).searchParams.get(PROJECT_PARAM)?.trim();
  return slug || null;
}

export function historyState(slug, scrollY) {
  return {
    portfolioProject: slug,
    scrollY: Math.max(0, Number(scrollY) || 0),
  };
}
