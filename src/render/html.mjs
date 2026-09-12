// Tiny HTML helpers. No framework — every component is (data, ctx) => string.
export const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Inline Localized → text or the site's EN/JP span pair. */
export function t(value) {
  if (value == null) return "";
  if (typeof value === "string") return esc(value);
  const jp = value.jp ? `<span class="t-jp">${esc(value.jp)}</span>` : "";
  return `<span class="t-en">${esc(value.en)}</span>${jp}`;
}

/** Block Localized → the JP span gets is-block so it lays out as a paragraph when shown. */
export function tb(value) {
  if (value == null) return "";
  if (typeof value === "string") return esc(value);
  const jp = value.jp ? `<span class="t-jp is-block">${esc(value.jp)}</span>` : "";
  return `<span class="t-en">${esc(value.en)}</span>${jp}`;
}

/** Plain text of a Localized value (English), for attributes and <title>. */
export const plain = (value) => (value == null ? "" : typeof value === "string" ? value : value.en);

/** Site-relative href/src → correct for the page's depth. External URLs pass through. */
export const href = (ctx, path) => (/^(?:https?:|mailto:|tel:|#)/.test(path) ? path : ctx.base + path);

export const join = (parts) => parts.filter(Boolean).join("\n");

/**
 * The inside of a card's media box: the still, plus the muted loop that plays
 * on hover or focus when the record carries one. The <video> is preload="none"
 * and aria-hidden — the still is what the page, and a screen reader, rely on.
 */
export function mediaFill(item, ctx) {
  const image = item.assets?.thumb ?? item.assets?.hero;
  if (!image) {
    const art = item.assets?.art ?? "card-art--motion";
    const label = item.assets?.artLabel ?? item.shortTitle ?? item.title;
    return `<div class="card-art ${esc(art)}"><span class="card-art-label">${esc(label)}</span></div>`;
  }
  const still = `<img src="${esc(href(ctx, image))}" alt="" loading="lazy">`;
  const clip = item.assets?.preview;
  if (!clip) return still;
  return `${still}<video class="card-clip" src="${esc(href(ctx, clip))}" muted loop playsinline preload="none" tabindex="-1" aria-hidden="true"></video>`;
}
