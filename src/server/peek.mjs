// The pure half of /api/lab/peek (src/pages/api/lab/peek.ts): which URLs it
// may fetch, and what it reads out of the HTML that comes back. No network,
// no DOM, so both are tested in Node (tests/lab-tool.test.mjs).
//
// The Motion Lab's "A URL" stage (/lab/motion) asks for a page's title,
// description and share image, and builds a template stage from them.

export const MAX_BYTES = 300 * 1024;
export const TIMEOUT_MS = 5000;
export const MAX_REDIRECTS = 3;

const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;
const PRIVATE_V4 = [/^127\./, /^10\./, /^192\.168\./, /^172\.(?:1[6-9]|2\d|3[01])\./, /^169\.254\./, /^0\./];

/** True for a host the server must never be asked to fetch: loopback, private, link-local, .local. */
export function isPrivateHost(hostname) {
  const host = String(hostname ?? "").toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!host) return true;
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (IPV4.test(host)) return PRIVATE_V4.some((r) => r.test(host));
  if (host.includes(":")) {
    // IPv6 (the URL parser has already normalised it): loopback, unspecified,
    // unique-local fc00::/7, link-local fe80::/10, and v4-mapped addresses.
    return host === "::1" || host === "::" || /^f[cd]/.test(host) || /^fe[89ab]/.test(host) || host.startsWith("::ffff:");
  }
  return false;
}

/** { ok: true, url } for a public http(s) URL, else { ok: false, error }. */
export function checkUrl(raw) {
  let url;
  try { url = new URL(String(raw ?? "").trim()); } catch { return { ok: false, error: "bad-url" }; }
  if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false, error: "bad-scheme" };
  if (isPrivateHost(url.hostname)) return { ok: false, error: "private-host" };
  return { ok: true, url };
}

/** Whether a Content-Type is an HTML page. */
export const isHtml = (type) => /^\s*(?:text\/html|application\/xhtml\+xml)\b/i.test(type ?? "");

/** The body as text, in the charset the header (or a <meta charset>) names; UTF-8 otherwise. */
export function decodeBody(bytes, contentType = "") {
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 2048));
  const name = /charset=["']?([\w-]+)/i.exec(contentType)?.[1] ?? /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1] ?? "utf-8";
  try { return new TextDecoder(name).decode(bytes); } catch { return new TextDecoder("utf-8").decode(bytes); }
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const unescape = (s) => s.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === "#") {
    const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : m;
  }
  return ENTITIES[e.toLowerCase()] ?? m;
});
const clean = (s, max) => {
  const t = unescape(String(s ?? "")).replace(/\s+/g, " ").trim();
  return t ? t.slice(0, max) : null;
};
const attrs = (tag) => {
  const out = {};
  for (const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
  return out;
};

/** { title, description, image, site } from a page's HTML; image is absolute (http/https) or null. */
export function parsePeek(html, finalUrl) {
  const meta = {};
  for (const [tag] of String(html ?? "").matchAll(/<meta\b[^>]*>/gi)) {
    const a = attrs(tag);
    const key = (a.property || a.name || "").toLowerCase();
    if (key && a.content !== undefined && !(key in meta)) meta[key] = a.content;
  }
  const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html ?? "")?.[1];
  let image = null;
  const rawImage = meta["og:image"] ?? meta["og:image:url"] ?? meta["og:image:secure_url"] ?? meta["twitter:image"] ?? meta["twitter:image:src"];
  if (rawImage) {
    try {
      const u = new URL(unescape(rawImage.trim()), finalUrl);
      if (u.protocol === "http:" || u.protocol === "https:") image = u.href;
    } catch {}
  }
  let site = null;
  try { site = new URL(finalUrl).hostname; } catch {}
  return {
    title: clean(meta["og:title"] ?? titleTag ?? meta["twitter:title"], 200),
    description: clean(meta["og:description"] ?? meta.description ?? meta["twitter:description"], 300),
    image,
    site,
  };
}
