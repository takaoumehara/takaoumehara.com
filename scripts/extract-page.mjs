#!/usr/bin/env node
// One-time extractor: turns the 42 hand-built case studies (projects/*.html)
// and the 8 hand-built root pages (about.html, contact.html, …) into the
// three-file shape the Astro pages read:
//
//   src/case-studies/<slug>.html | .css | .json   (projects/<slug>.html)
//   src/fragments/<name>.html    | .css | .json    (the root pages)
//
// .html  = everything between </nav> and <footer, verbatim, plus any
//          page-specific <script> after the footer (the shared boilerplate —
//          language toggle / scroll reveal / image fade / mobile nav / wipe —
//          is dropped: the layout provides it via src/scripts/site.js). Any
//          inline <div class="lang-switch"> is also dropped: the sidebar owns
//          the switch now.
// .css   = every <style> block found in <head>, concatenated in order, minus
//          the old top-nav's "Nav tiers" block (the nav is gone).
// .json  = the page's meta: title, description, ogImage, ogType, the Google
//          Fonts link, the stylesheet hrefs (as written; wipe.css dropped),
//          data-theme, and the <html>/<body> classes.
//
// This is a one-off migration tool (see docs/astro-architecture.md §1) kept
// for the record, not part of the build. Run with: node scripts/extract-page.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const at = (...p) => join(ROOT, ...p);

// ── HTML entity decoding ─────────────────────────────────────────────────
// Attribute values and <title> text carry named entities (the pages write
// "Design &amp; AI"); the JSON fields around them are plain strings that
// Astro's {expr} will escape again on render, so we decode once here rather
// than let "&amp;" turn into "&amp;amp;" on the built page.
const NAMED_ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  mdash: "—", ndash: "–", hellip: "…", rsquo: "’",
  lsquo: "‘", rdquo: "”", ldquo: "“", copy: "©",
  reg: "®", trade: "™", middot: "·", nbsp_: " ",
};
function decodeEntities(s) {
  if (!s) return s;
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (whole, body) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return NAMED_ENTITIES[body] ?? whole;
  });
}

// ── Minimal attribute parsing for one tag's source (the bit inside <...>) ──
function parseAttrs(tagSrc) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(tagSrc))) attrs[m[1].toLowerCase()] = decodeEntities(m[2]);
  return attrs;
}
function allTags(html, tagName) {
  const re = new RegExp(`<${tagName}\\b([^>]*)>`, "gi");
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(parseAttrs(m[1]));
  return out;
}

// ── Head parsing ─────────────────────────────────────────────────────────
function extractHead(html) {
  const m = /<head[^>]*>([\s\S]*?)<\/head>/i.exec(html);
  return m ? m[1] : "";
}

// The old top-nav's "Nav tiers" style block (koji-fizz.html, cli-studios.html
// …) styled a <nav> that no longer exists in the extracted body — the
// sidebar replaces it. Every other head <style> block is kept as written,
// even ones that also happen to be nav-related (e.g. 404.html's "Mobile
// Menu" block) — only this one exact, named block is skipped.
function isNavTierBlock(content) {
  return /^\/\*[\s─\-—]{0,12}Nav tiers/.test(content.trimStart());
}
function headStyleBlocks(head) {
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  const blocks = [];
  let m;
  while ((m = re.exec(head))) blocks.push(m[1]);
  return blocks;
}

function readMeta(html) {
  const head = extractHead(html);
  const metas = allTags(head, "meta");
  const links = allTags(head, "link");
  const find = (list, pred) => list.find(pred);

  const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(head);
  const title = titleMatch ? decodeEntities(titleMatch[1].trim()) : undefined;
  const description = find(metas, (m) => m.name === "description")?.content;
  const ogImage = find(metas, (m) => m.property === "og:image")?.content;
  const ogType = find(metas, (m) => m.property === "og:type")?.content;
  const canonical = find(links, (l) => l.rel === "canonical")?.href;
  const fonts = find(links, (l) => l.rel === "stylesheet" && /fonts\.googleapis\.com\/css2/.test(l.href || ""))?.href;
  const stylesheets = links
    .filter((l) => l.rel === "stylesheet" && l.href && !/fonts\.googleapis\.com/.test(l.href) && !/wipe\.css/.test(l.href))
    .map((l) => l.href);

  const htmlAttrs = parseAttrs((/<html\b([^>]*)>/i.exec(html) || ["", ""])[1]);
  const bodyAttrs = parseAttrs((/<body\b([^>]*)>/i.exec(html) || ["", ""])[1]);

  const styleBlocks = headStyleBlocks(head);
  const kept = styleBlocks.filter((b) => !isNavTierBlock(b));
  let css = kept.join("\n\n").trim() + "\n";
  // Nearly every hand-built page also carried its OWN copy of the floating
  // "EN/JP lang switch" rule (position: fixed; bottom: 80px; …) inside a head
  // <style> block, in addition to design-system.css's. That rule is dropped
  // there (see public/assets/design-system.css) because the sidebar reuses
  // the same .lang-switch class for its own, inline switch — a per-page
  // copy would win the cascade (it loads after the shared stylesheets) and
  // reintroduce the exact bug: the sidebar's switch getting ripped out and
  // pinned to the bottom-right corner of the viewport. No .lang-switch
  // element survives extraction (extractBody() drops it from the body), so
  // the rule has nothing left to style — safe to drop here too.
  const langSwitchRuleRemoved = /\.lang-switch\s*\{[^}]*\}/.test(css);
  css = css.replace(/\.lang-switch\s*\{[^}]*\}\n?/g, "");

  return {
    meta: {
      title, description, ogImage, ogType, fonts,
      stylesheets: stylesheets.length ? stylesheets : undefined,
      theme: htmlAttrs["data-theme"],
      htmlClass: htmlAttrs["class"],
      bodyClass: bodyAttrs["class"],
      canonical,
    },
    css,
    styleBlockCount: styleBlocks.length,
    navTierSkipped: styleBlocks.length - kept.length,
    langSwitchRuleRemoved,
  };
}

// ── Body extraction: </nav> … <footer, plus page-specific trailing scripts ─
// One top-level IIFE of a trailing <script>: is it the shared boilerplate?
// (language toggle · mobile nav · scroll reveal · image fade — see above.)
function isBoilerplatePart(part) {
  if (/lang-btn/.test(part) && /localStorage/.test(part)) return true;
  if (/getElementById\(['"]nav-toggle['"]\)/.test(part)) return true;
  if (/IntersectionObserver/.test(part) && /reveal/.test(part)) return true;
  if (/querySelectorAll\(['"]img['"]\)/.test(part) && /(loaded|complete)/.test(part) && part.length < 800) return true;
  return false;
}

function extractBody(html) {
  const navEndMatch = /<\/nav>/i.exec(html);
  if (!navEndMatch) return null; // no top nav at all (shopping-on-fire-tv.html — handled separately)
  const afterNav = navEndMatch.index + navEndMatch[0].length;
  const footerMatch = /<footer\b/i.exec(html.slice(afterNav));
  if (!footerMatch) throw new Error("no <footer found after </nav>");
  let body = html.slice(afterNav, afterNav + footerMatch.index);

  // The sidebar owns the language switch now — drop any inline copy in the
  // body (it has no nested <div>, so a non-greedy match to the first </div>
  // is exactly its closing tag).
  const beforeStrip = body;
  body = body.replace(/[ \t]*<div class="lang-switch"[^>]*>[\s\S]*?<\/div>\n?/gi, "");
  const langSwitchDropped = body !== beforeStrip;

  // Trailing scripts, after </footer>: keep only the ones that are NOT the
  // shared boilerplate (language toggle / scroll reveal / image fade /
  // mobile nav — always bundled together and always mentions "tu-lang" —
  // or a wipe.js <script src>). Everything else (e.g. <script data-deck> on
  // cli-studios.html and verizon-ai-agents.html) is page-specific and kept.
  const footerEndMatch = /<\/footer>/i.exec(html);
  const kept = [];
  let droppedScripts = 0;
  if (footerEndMatch) {
    const after = html.slice(footerEndMatch.index + footerEndMatch[0].length);
    const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = re.exec(after))) {
      const [raw, attrs, content] = m;
      const isWipe = /src\s*=\s*"[^"]*wipe\.js[^"]*"/i.test(attrs);
      // Every shared boilerplate script toggles the language buttons through
      // localStorage — the storage key varies (contact.html and
      // work-with-me.html use "tu_lang" instead of "tu-lang"), so match on
      // the stable pair (.lang-btn + localStorage) rather than the key name.
      const isSharedBoilerplate = /lang-btn/.test(content) && /localStorage/.test(content);
      if (isWipe) { droppedScripts++; continue; }
      if (!isSharedBoilerplate) { kept.push(raw); continue; }
      // A page may fuse its own IIFE with the boilerplate ones in a single
      // <script> (werewolf.html: the card-deck demo, then the language toggle,
      // then the mobile nav). Split on the top-level `})();` closers and keep
      // only the parts that are not boilerplate.
      const parts = content.split(/(?<=\n  \}\)\(\);)/).map((p) => p.trim()).filter(Boolean);
      const own = parts.filter((p) => !isBoilerplatePart(p));
      if (own.length === parts.length) { kept.push(raw); continue; }
      droppedScripts++;
      if (own.length) kept.push(`<script${attrs}>\n  ${own.join("\n\n  ")}\n  </script>`);
    }
  }

  body = body.trim();
  if (kept.length) body += "\n\n" + kept.join("\n\n");
  body += "\n";

  return { body, langSwitchDropped, scriptsKept: kept.length, scriptsDropped: droppedScripts };
}

function writeSet(outDir, slug, { body, css, meta }) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, `${slug}.html`), body);
  writeFileSync(join(outDir, `${slug}.css`), css);
  writeFileSync(join(outDir, `${slug}.json`), JSON.stringify(meta, null, 2) + "\n");
}

function processFile(srcPath, outDir, slug) {
  const html = readFileSync(srcPath, "utf8");
  const { meta, css, styleBlockCount, navTierSkipped, langSwitchRuleRemoved } = readMeta(html);
  const extracted = extractBody(html);
  if (!extracted) {
    console.log(`SKIP  ${slug} — no <nav>/<footer> (handled separately, see report)`);
    return;
  }
  const { body, langSwitchDropped, scriptsKept, scriptsDropped } = extracted;
  writeSet(outDir, slug, { body, css, meta });
  const lines = body.split("\n").length;
  console.log(
    `OK    ${slug.padEnd(28)} body=${String(lines).padStart(4)}L  ` +
    `styles=${styleBlockCount}${navTierSkipped ? `(-${navTierSkipped} nav-tier)` : ""}  ` +
    `scripts kept=${scriptsKept} dropped=${scriptsDropped}` +
    (langSwitchDropped ? "  body-lang-switch:removed" : "") +
    (langSwitchRuleRemoved ? "  css-lang-switch-rule:removed" : "")
  );
}

// ── Run ───────────────────────────────────────────────────────────────────
const projectsDir = at("projects");
const allProjectFiles = readdirSync(projectsDir).filter((f) => f.endsWith(".html")).sort();
// shopping-on-fire-tv.html is a bare client-side redirect stub (no <nav>, no
// <footer> — it never used the site shell at all) — it is copied verbatim to
// public/projects/ instead of going through this extractor. See report.
const SPECIAL_CASE = "shopping-on-fire-tv.html";
const projectFiles = allProjectFiles.filter((f) => f !== SPECIAL_CASE);

console.log(`── Case studies (${projectFiles.length}) ──`);
for (const file of projectFiles) {
  const slug = file.replace(/\.html$/, "");
  processFile(at("projects", file), at("src", "case-studies"), slug);
}
if (allProjectFiles.includes(SPECIAL_CASE)) {
  mkdirSync(at("public", "projects"), { recursive: true });
  copyFileSync(at("projects", SPECIAL_CASE), at("public", "projects", SPECIAL_CASE));
  console.log(`COPY  ${SPECIAL_CASE} → public/projects/${SPECIAL_CASE} (static passthrough, no shell)`);
}

const ROOT_PAGES = ["about", "contact", "publications", "workshop", "breakbias", "intentfirst", "work-with-me", "404"];
console.log(`\n── Root pages (${ROOT_PAGES.length}) ──`);
for (const name of ROOT_PAGES) {
  processFile(at(`${name}.html`), at("src", "fragments"), name);
}
