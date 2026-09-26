// The home hero's slides, as the admin (/admin) edits them and the home page
// renders them. Pure functions, no filesystem, no Astro: the build, the
// on-demand admin routes and node --test all use the same code.
//
// src/data/showcase.json is the one source:
//   { "slides": [ { "slug", "media", "enabled" }, … ] }   (order = hero order)
//   slug     an evidence record (src/data/<kind>/<slug>.json)
//   media    "auto"    what the record's detail page opens on (detailTeaser)
//            "preview" the record's muted loop (assets.preview), still as poster
//            "hero"    assets.hero      "thumb"   assets.thumb
//            "assets/…" any image the site ships under public/assets/
//   enabled  false keeps the slide in the list but off the page
//
// SHOWCASE in src/data/news.mjs is derived from this file (enabled slugs, in order).
import { detailTeaser } from "./detail.mjs";

export const MEDIA_KEYWORDS = ["auto", "preview", "hero", "thumb"];
export const IMAGE_EXT = /\.(?:jpe?g|png|webp|avif|gif|svg)$/i;
const SLUG = /^[a-z0-9][a-z0-9-]{0,80}$/;
// Site-relative, under assets/, no traversal, no query, no scheme.
// Letters in any script (a few files are named in Japanese); the path must also be in the build's file list.
const ASSET_PATH = /^assets\/[\p{L}\p{N}\p{M}._\-\/ ()@+−]+$/u;
// Folders every record shares — listing them would offer everyone's images to every slide.
const SHARED_DIRS = new Set(["thumbs", "shared", "hero", "og", "fonts", "about", "superforge", "ai-tools"]);
export const MAX_SLIDES = 60;

const hasPreview = (item) => !!(item?.assets?.preview && (item.assets.preview.webm || item.assets.preview.mp4));
const stillOf = (item) => item?.detail?.teaser?.image ?? item?.assets?.hero ?? item?.assets?.thumb ?? null;

/** Enabled slugs in order — what src/data/news.mjs exports as SHOWCASE. */
export function showcaseOrder(config) {
  return (config?.slides ?? []).filter((s) => s && s.enabled !== false && typeof s.slug === "string").map((s) => s.slug);
}

/** slug → media choice for the enabled slides. */
export function showcaseMediaMap(config) {
  const map = new Map();
  for (const s of config?.slides ?? []) if (s && s.enabled !== false) map.set(s.slug, typeof s.media === "string" ? s.media : "auto");
  return map;
}

/**
 * What the hero stage shows for one record and one media choice — the same
 * shape as detailTeaser() ({ kind: "video" | "image" | "fallback", … }).
 * A choice the record cannot honour falls back to "auto"; `exists(path)`,
 * when given, is asked about an explicit path (the build passes a disk check).
 */
export function slideMedia(item, media = "auto", { exists } = {}) {
  const auto = detailTeaser(item);
  const a = item?.assets ?? {};
  if (!media || media === "auto") return auto;
  if (media === "preview") {
    if (!hasPreview(item)) return auto;
    return { kind: "video", webm: a.preview.webm, mp4: a.preview.mp4, poster: stillOf(item) };
  }
  if (media === "hero" || media === "thumb") {
    return a[media] ? { kind: "image", src: a[media], fit: "cover" } : auto;
  }
  if (isAssetPath(media) && IMAGE_EXT.test(media) && (!exists || exists(media))) {
    // Keep the teaser's framing only when the path is the teaser's own image.
    const d = item?.detail?.teaser ?? {};
    return d.image === media
      ? { kind: "image", src: media, fit: d.fit ?? "cover", position: d.position, background: d.background }
      : { kind: "image", src: media, fit: "cover" };
  }
  return auto;
}

export const isAssetPath = (p) => typeof p === "string" && p.length < 300 && ASSET_PATH.test(p)
  && p.split("/").every((seg) => seg !== "" && seg !== "." && seg !== "..");

/** The folders under public/assets/ a record's own media live in: assets/<slug> plus the folders its asset paths name. */
export function recordFolders(item) {
  const dirs = new Set([`assets/${item.slug}`]);
  const paths = [item.assets?.thumb, item.assets?.hero, item.detail?.teaser?.image, item.assets?.preview?.mp4, item.assets?.preview?.webm];
  for (const p of paths) {
    if (typeof p !== "string") continue;
    const seg = p.split("/");
    if (seg[0] === "assets" && seg.length > 2 && !SHARED_DIRS.has(seg[1])) dirs.add(`assets/${seg[1]}`);
  }
  return [...dirs];
}

/**
 * The media a slide may use, for the admin's picker: the keywords the record
 * can honour, then every image in the record's own folders (from `files`, the
 * build-time list of public/assets images), each with a still to preview.
 */
const short = (p) => String(p).replace(/^assets\//, "");

export function mediaOptions(item, files = []) {
  const a = item.assets ?? {};
  const opts = [];
  const auto = detailTeaser(item);
  const autoStill = auto.kind === "video" ? auto.poster : auto.kind === "image" ? auto.src : null;
  opts.push({ value: "auto", label: "Auto (as the detail page) / 自動", still: autoStill, video: auto.kind === "video" ? (auto.mp4 ?? auto.webm) : null });
  if (hasPreview(item)) opts.push({ value: "preview", label: "Preview video / 動画", still: stillOf(item), video: a.preview.mp4 ?? a.preview.webm });
  if (a.hero) opts.push({ value: "hero", label: `Hero / ヒーロー画像 — ${short(a.hero)}`, still: a.hero });
  if (a.thumb) opts.push({ value: "thumb", label: `Thumb / サムネイル — ${short(a.thumb)}`, still: a.thumb });
  const seen = new Set();
  const teaserImage = item.detail?.teaser?.image;
  if (teaserImage && isAssetPath(teaserImage)) { opts.push({ value: teaserImage, label: `Detail still / 詳細の静止画 — ${short(teaserImage)}`, still: teaserImage }); seen.add(teaserImage); }
  const folders = recordFolders(item).map((d) => `${d}/`);
  for (const f of files) {
    if (seen.has(f) || !IMAGE_EXT.test(f) || !folders.some((d) => f.startsWith(d))) continue;
    seen.add(f);
    opts.push({ value: f, label: short(f), still: f });
  }
  return opts;
}

/** Whether a record can be a hero slide at all: some media option resolves to real media. */
export function canShowcase(item, files = []) {
  if (!item?.slug) return false;
  return mediaOptions(item, files).some((o) => o.still || o.video);
}

const fail = (errors, msg) => { errors.push(msg); };

/**
 * Validate what the admin submits. Returns { value, errors, warnings }: value
 * is the normalised config ({ slides: [{ slug, media, enabled }] }) when errors
 * is empty. An enabled slide whose record has no media yet is only a warning —
 * the home page skips it, as it always has, until the record gets an image.
 *   lib.evidence  Map slug → record
 *   files         Set/array of site-relative image paths that exist under public/
 */
export function validateShowcase(input, { lib, files }) {
  const errors = [];
  const warnings = [];
  let showable = 0;
  const fileSet = files instanceof Set ? files : new Set(files ?? []);
  if (!input || typeof input !== "object" || Array.isArray(input)) return { value: null, errors: ["Body must be an object: { slides: [...] }"], warnings };
  const extraTop = Object.keys(input).filter((k) => k !== "slides");
  if (extraTop.length) fail(errors, `Unknown top-level field(s): ${extraTop.join(", ")}`);
  const slides = input.slides;
  if (!Array.isArray(slides)) return { value: null, errors: [...errors, "slides must be an array"], warnings };
  if (slides.length === 0) fail(errors, "slides must not be empty");
  if (slides.length > MAX_SLIDES) fail(errors, `At most ${MAX_SLIDES} slides`);
  const seen = new Set();
  const out = [];
  slides.slice(0, MAX_SLIDES).forEach((s, i) => {
    const at = `slides[${i}]`;
    if (!s || typeof s !== "object" || Array.isArray(s)) { fail(errors, `${at} must be an object`); return; }
    const extra = Object.keys(s).filter((k) => !["slug", "media", "enabled"].includes(k));
    if (extra.length) fail(errors, `${at}: unknown field(s) ${extra.join(", ")}`);
    const { slug, media = "auto", enabled = true } = s;
    if (typeof slug !== "string" || !SLUG.test(slug)) { fail(errors, `${at}.slug must be a kebab-case string`); return; }
    const item = lib.evidence.get(slug);
    if (!item) { fail(errors, `${at}.slug "${slug}" is not a record in the library`); return; }
    if (seen.has(slug)) fail(errors, `${at}.slug "${slug}" appears more than once`);
    seen.add(slug);
    if (typeof enabled !== "boolean") fail(errors, `${at}.enabled must be true or false`);
    if (typeof media !== "string") { fail(errors, `${at}.media must be a string`); return; }
    if (MEDIA_KEYWORDS.includes(media)) {
      if (media === "preview" && !hasPreview(item)) fail(errors, `${at}: "${slug}" has no preview video`);
      if ((media === "hero" || media === "thumb") && !item.assets?.[media]) fail(errors, `${at}: "${slug}" has no ${media} image`);
    } else if (!isAssetPath(media) || !IMAGE_EXT.test(media)) {
      fail(errors, `${at}.media must be one of ${MEDIA_KEYWORDS.join(" / ")} or an image path under assets/`);
    } else if (!fileSet.has(media)) {
      fail(errors, `${at}.media "${media}" does not exist under public/`);
    }
    if (enabled === true) {
      if (slideMedia(item, media).kind === "fallback") warnings.push(`${at}: "${slug}" has no media yet — the home page skips it`);
      else showable += 1;
    }
    out.push({ slug, media, enabled });
  });
  if (out.length && !showable) fail(errors, "At least one enabled slide must have media (the home page needs its hero)");
  return errors.length ? { value: null, errors, warnings } : { value: { slides: out }, errors, warnings };
}

/** The file as committed: stable key order, two-space indent, trailing newline. */
export const serializeShowcase = (config) => JSON.stringify({ slides: config.slides.map(({ slug, media, enabled }) => ({ slug, media, enabled })) }, null, 2) + "\n";
