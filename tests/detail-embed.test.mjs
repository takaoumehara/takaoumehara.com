import test from 'node:test';
import assert from 'node:assert/strict';
import { detailFields, detailEmbed, detailTeaser } from '../src/lib/detail.mjs';

test('a YouTube hero embeds the film while slide previews retain their still', () => {
  const item={title:'KOJI FIZZ',detail:{teaser:{youtube:'8mXYhHl5VDU',image:'/still.webp',title:'KOJI FIZZ New York Edition'}}};
  const hero=detailFields(item).teaser;
  assert.equal(hero.kind,'embed');
  assert.equal(hero.provider,'youtube');
  assert.equal(hero.src,'https://www.youtube-nocookie.com/embed/8mXYhHl5VDU?playsinline=1&rel=0');
  assert.equal(hero.aspect,'16/9');
  assert.equal(hero.aspectSm,'16/9');
  assert.equal(detailTeaser(item).kind,'image');
});

test('YouTube configuration cannot introduce arbitrary external iframe URLs', () => {
  for (const youtube of ['https://evil.test/embed/8mXYhHl5VDU','8mXYhHl5VDU\" onload=\"alert(1)', '', 'short']) {
    assert.equal(detailEmbed({detail:{teaser:{youtube}}}),null);
  }
});

test('same-origin prototype embeds keep their dimensions and remote URLs stay rejected', () => {
  const hero=detailEmbed({title:'Demo',detail:{teaser:{embed:'/demo.html',aspect:'16/9',aspectSm:'9/16'}}});
  assert.equal(hero.src,'/demo.html');
  assert.equal(hero.aspectSm,'9/16');
  assert.equal(detailEmbed({detail:{teaser:{embed:'https://evil.test/demo'}}}),null);
  assert.equal(detailEmbed({detail:{teaser:{embed:'//evil.test/demo'}}}),null);
});
