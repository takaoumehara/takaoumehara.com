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
