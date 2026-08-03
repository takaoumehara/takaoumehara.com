import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FakeEvent, buildDocument, createWindow, runScript } from './helpers/dom.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'assets/work-card-grid.js'), 'utf8');

function setup(cards) {
  const doc = buildDocument(cards.map((attrs) => ({ tag: 'article', attrs })));
  const win = createWindow(doc);
  runScript(source, { window: win, document: doc });
  return { doc, win, cards: doc.querySelectorAll('.work-card') };
}

test('clicking an internal card navigates in the same tab', () => {
  const { win, cards } = setup([{ class: 'work-card', 'data-href': '/work.html' }]);

  cards[0].dispatchEvent(new FakeEvent('click'));

  assert.deepEqual(win.assigned, ['/work.html']);
  assert.deepEqual(win.opened, []);
});

test('clicking an external card opens a new noopener tab', () => {
  const { win, cards } = setup([
    { class: 'work-card', 'data-href': 'https://example.com', 'data-external': 'true' },
  ]);

  cards[0].dispatchEvent(new FakeEvent('click'));

  assert.deepEqual(win.opened, [
    { href: 'https://example.com', target: '_blank', features: 'noopener' },
  ]);
  assert.deepEqual(win.assigned, []);
});

test('data-external values other than "true" stay in the same tab', () => {
  const { win, cards } = setup([
    { class: 'work-card', 'data-href': '/brand.html', 'data-external': 'false' },
  ]);

  cards[0].dispatchEvent(new FakeEvent('click'));

  assert.deepEqual(win.assigned, ['/brand.html']);
  assert.deepEqual(win.opened, []);
});

test('cards without data-href are never wired up', () => {
  const { win, doc } = setup([{ class: 'work-card' }]);

  doc.querySelector('.work-card').dispatchEvent(new FakeEvent('click'));

  assert.deepEqual(win.assigned, []);
  assert.deepEqual(win.opened, []);
});

test('Enter and Space activate a card and suppress the default scroll', () => {
  for (const key of ['Enter', ' ']) {
    const { win, cards } = setup([{ class: 'work-card', 'data-href': '/about.html' }]);
    const event = new FakeEvent('keydown', { key });

    cards[0].dispatchEvent(event);

    assert.equal(event.defaultPrevented, true, `${key} should preventDefault`);
    assert.deepEqual(win.assigned, ['/about.html']);
  }
});

test('other keys leave the card inert', () => {
  const { win, cards } = setup([{ class: 'work-card', 'data-href': '/about.html' }]);
  const event = new FakeEvent('keydown', { key: 'Tab' });

  cards[0].dispatchEvent(event);

  assert.equal(event.defaultPrevented, false);
  assert.deepEqual(win.assigned, []);
});

test('every card in the grid is independently activatable', () => {
  const { win, cards } = setup([
    { class: 'work-card', 'data-href': '/a.html' },
    { class: 'work-card', 'data-href': '/b.html' },
    { class: 'work-card', 'data-href': 'https://c.example', 'data-external': 'true' },
  ]);

  cards.forEach((card) => card.dispatchEvent(new FakeEvent('click')));

  assert.deepEqual(win.assigned, ['/a.html', '/b.html']);
  assert.deepEqual(win.opened.map((entry) => entry.href), ['https://c.example']);
});
