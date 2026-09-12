import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Vendored exports and third-party bundles are not ours to typeset.
const NOT_OURS = [
  'assets/verizon-totalwireless/storybook/',
  'assets/verizon-totalwireless/final-web-html/',
  'assets/konosaki/',
  'assets/edutrack/',
  'projects/amazon-firetv/',
  'node_modules/',
];

const pages = globSync('**/*.html', { cwd: root })
  .map((p) => p.split('\\').join('/'))
  .filter((p) => !NOT_OURS.some((dir) => p.startsWith(dir)))
  .sort();

/**
 * Visible text only. Attributes are where straight quotes belong, and
 * <script>, <style>, <code> and <pre> are code — a curly quote inside any
 * of them would be the bug.
 */
function visibleText(html) {
  const blanked = html
    .replace(/<(script|style|code|pre)\b[^>]*>[\s\S]*?<\/\1>/gi, (m) => ' '.repeat(m.length))
    .replace(/<!--[\s\S]*?-->/g, (m) => ' '.repeat(m.length));

  const nodes = [];
  let pos = 0;
  for (const m of blanked.matchAll(/<[^>]*>/g)) {
    if (m.index > pos) nodes.push([pos, blanked.slice(pos, m.index)]);
    pos = m.index + m[0].length;
  }
  if (pos < blanked.length) nodes.push([pos, blanked.slice(pos)]);
  return nodes;
}

const lineOf = (html, offset) => html.slice(0, offset).split('\n').length;

function offences(html, pattern) {
  const found = [];
  for (const [offset, text] of visibleText(html)) {
    for (const m of text.matchAll(pattern)) {
      found.push({
        line: lineOf(html, offset + m.index),
        context: text.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\s+/g, ' ').trim(),
      });
    }
  }
  return found;
}

// ── The typographic contract ──────────────────────────────────────────────
//
// A straight apostrophe in body copy is the single most visible way a
// carefully typeset page announces that nobody typeset it. It came up on
// the landing page's closing line and the sweep that followed found 232 of
// them across 43 pages, so it is a standing rule now rather than a fix.
//
// Prose uses ’ for apostrophes and “ ” for quotations. Straight marks stay
// where they belong: in markup, in code samples, and in vendored exports.

test('no straight apostrophes in visible copy', () => {
  const bad = [];
  for (const page of pages) {
    const html = readFileSync(join(root, page), 'utf8');
    // a straight quote used as an apostrophe: inside a word, or right after
    // one (Studios' dance-education app), plus the escaped spellings.
    const hits = offences(html, /(?<=\w)'(?=\w)|(?<=\w)'(?!\w)|&#0*39;|&apos;/g);
    for (const hit of hits) bad.push(`${page}:${hit.line}  …${hit.context}…`);
  }
  assert.deepEqual(bad, [], `use ’ for apostrophes in copy:\n${bad.join('\n')}`);
});

test('no straight double quotes in visible copy', () => {
  const bad = [];
  for (const page of pages) {
    const html = readFileSync(join(root, page), 'utf8');
    const hits = offences(html, /"|&quot;/g);
    for (const hit of hits) bad.push(`${page}:${hit.line}  …${hit.context}…`);
  }
  assert.deepEqual(bad, [], `use “ ” for quotations in copy:\n${bad.join('\n')}`);
});

test('curly quotation marks are balanced on every page', () => {
  const bad = [];
  for (const page of pages) {
    const html = readFileSync(join(root, page), 'utf8');
    const open = (html.match(/“/g) ?? []).length;
    const close = (html.match(/”/g) ?? []).length;
    if (open !== close) bad.push(`${page}: ${open} “ vs ${close} ”`);
  }
  assert.deepEqual(bad, [], `an unbalanced pair means one is pointing the wrong way:\n${bad.join('\n')}`);
});
