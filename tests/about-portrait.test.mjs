import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { ROOT } from '../src/lib/load.mjs';
import { read } from './_dist.mjs';

test('About hero includes an accessible, responsive portrait', () => {
  const html = read('about.html');

  assert.equal(
    existsSync(join(ROOT, 'public/assets/about/TakaoUmehara_passport.png')),
    true,
    'the supplied portrait should be included as a local site asset',
  );
  assert.match(html, /assets\/about\/TakaoUmehara_passport\.png/);
  assert.match(html, /class="about-portrait"/);
  assert.match(html, /alt="Takao Umehara"/);
  assert.match(html, /\.about-portrait\s*\{[\s\S]*?aspect-ratio:\s*4\s*\/\s*5/);
  assert.match(
    html,
    /@media\s*\(max-width:\s*760px\)[\s\S]*?\.about-hero-grid\s*\{[\s\S]*?grid-template-columns:\s*1fr/,
  );
});
