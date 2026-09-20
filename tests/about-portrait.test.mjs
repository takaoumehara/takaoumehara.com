import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { ROOT } from '../src/lib/load.mjs';
import { read } from './_dist.mjs';

test('About carries the portrait as a bento cell that keeps the whole picture', () => {
  const html = read('about.html');

  assert.equal(
    existsSync(join(ROOT, 'public/assets/about/TakaoUmehara_passport.png')),
    true,
    'the supplied portrait should be included as a local site asset',
  );
  // The portrait is a media cell half the grid wide (src/bento/pages/about.json),
  // on the paper plate and fitted rather than cropped — a face should not lose
  // its top to object-fit: cover.
  assert.match(
    html,
    /<div class="bento-cell" data-kind="media" data-w="6" data-h="6" data-fit="contain" data-paper="true"[^>]*><figure class="bento-media"><img src="\/assets\/about\/TakaoUmehara_passport\.png" alt="Takao Umehara"/,
    'the portrait must be a w6 contain media cell with a real alt',
  );
  // One column on a phone, and a picture keeps its ratio there — the rule that
  // replaces the page's own @media block (src/styles/bento.css). The build
  // minifies the query to (width<=640px).
  const css = read('_astro/' + html.match(/href="\/_astro\/(bento\.[\w-]+\.css)"/)[1]);
  assert.match(css, /@media \(width<=640px\)\{[\s\S]*?--bento-cols:\s*1[\s\S]*?aspect-ratio:var\(--w\) \/ var\(--h\)/);
});
