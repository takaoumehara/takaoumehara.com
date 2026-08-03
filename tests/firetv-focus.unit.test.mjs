import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FakeEvent, buildDocument, createWindow, runScript } from './helpers/dom.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'projects/amazon-firetv/js/focus.js'), 'utf8');

const tile = (id, rect, attrs = {}) => ({
  tag: 'div',
  attrs: { id, tabindex: '-1', class: 'focusable', ...attrs },
  rect,
});

/* Two rows of three tiles, 100x60 each, rows 200px apart. */
const grid = () => [
  {
    tag: 'div',
    attrs: { class: 'rail-track', 'data-row': 'top' },
    rect: { top: 0, left: 0, width: 320, height: 60 },
    children: [
      tile('a', { top: 0, left: 0, width: 100, height: 60 }),
      tile('b', { top: 0, left: 110, width: 100, height: 60 }),
      tile('c', { top: 0, left: 220, width: 100, height: 60 }),
    ],
  },
  {
    tag: 'div',
    attrs: { class: 'rail-track', 'data-row': 'bottom' },
    rect: { top: 200, left: 0, width: 320, height: 60 },
    children: [
      tile('d', { top: 200, left: 0, width: 100, height: 60 }),
      tile('e', { top: 200, left: 110, width: 100, height: 60 }),
      tile('f', { top: 200, left: 220, width: 100, height: 60 }),
    ],
  },
];

function setup(spec = grid()) {
  const doc = buildDocument(spec);
  const win = createWindow(doc);
  const sfx = { calls: [] };
  ['move', 'select', 'back'].forEach((name) => { sfx[name] = () => sfx.calls.push(name); });
  win.SFX = sfx;
  const timers = [];
  runScript(source, {
    window: win,
    document: doc,
    SFX: sfx,
    getComputedStyle: win.getComputedStyle,
    setTimeout: (fn) => { timers.push(fn); return timers.length; },
  });
  const byId = (id) => doc.getElementById(id);
  return { doc, win, sfx, timers, Focus: win.Focus, byId };
}

test('candidates only include visible focusables', () => {
  const { Focus, byId } = setup([
    tile('a', { top: 0, left: 0, width: 100, height: 60 }),
    tile('hidden', { top: 0, left: 0, width: 0, height: 0 }),
    tile('aria', { top: 0, left: 200, width: 100, height: 60 }, { 'aria-hidden': 'true' }),
    tile('off', { top: 0, left: 400, width: 100, height: 60 }),
    { tag: 'div', attrs: { id: 'plain', class: 'focusable' }, rect: { width: 100, height: 60 } },
  ]);
  byId('off').disabled = true;
  byId('off').offsetParent = null;

  assert.deepEqual(Focus.candidates().map((el) => el.id), ['a']);
});

test('focusFirst focuses the first candidate and notifies listeners', () => {
  const { Focus, byId } = setup();
  const focused = [];
  Focus.on('focus', (el) => focused.push(el.id));

  assert.equal(Focus.focusFirst(), true);

  assert.equal(Focus.current, byId('a'));
  assert.equal(byId('a').classList.contains('tv-focus'), true);
  assert.deepEqual(focused, ['a']);
});

test('horizontal moves prefer the nearest tile in the same row', () => {
  const { Focus, byId } = setup();
  Focus.focus(byId('a'));

  Focus.move('right');
  assert.equal(Focus.current, byId('b'));
  Focus.move('right');
  assert.equal(Focus.current, byId('c'));
  Focus.move('left');
  assert.equal(Focus.current, byId('b'));
});

test('vertical moves cross rows keeping horizontal alignment', () => {
  const { Focus, byId } = setup();
  Focus.focus(byId('b'));

  Focus.move('down');
  assert.equal(Focus.current, byId('e'));
  Focus.move('up');
  assert.equal(Focus.current, byId('b'));
});

test('moving past the edge bumps instead of wrapping', () => {
  const { Focus, byId, sfx } = setup();
  Focus.focus(byId('a'));

  Focus.move('left');

  assert.equal(Focus.current, byId('a'));
  assert.equal(byId('a').classList.contains('bump-left'), true);
  assert.equal(sfx.calls.includes('move'), false);
});

test('successful moves play the move sound and update focus classes', () => {
  const { Focus, byId, sfx } = setup();
  Focus.focus(byId('a'));

  Focus.move('right');

  assert.deepEqual(sfx.calls, ['move']);
  assert.equal(byId('a').classList.contains('tv-focus'), false);
  assert.equal(byId('b').classList.contains('tv-focus'), true);
});

test('rows remember the last focused item when focus returns', () => {
  const { Focus, byId } = setup();
  Focus.focus(byId('a'));
  Focus.move('right');            // b — leaving a marks it as the row memory
  assert.equal(byId('a').classList.contains('row-memory'), true);

  Focus.move('down');             // e
  assert.equal(byId('b').classList.contains('row-memory'), true);
  assert.equal(byId('a').classList.contains('row-memory'), false, 'only one memory per row');
});

test('data-nav overrides beat geometry and resolve row containers to their memory', () => {
  const { Focus, byId } = setup([
    {
      tag: 'div',
      attrs: { class: 'rail-track', 'data-row': 'top' },
      rect: { top: 0, left: 0, width: 320, height: 60 },
      children: [tile('a', { top: 0, left: 0, width: 100, height: 60 }, { 'data-nav-down': '#target-row' })],
    },
    {
      tag: 'div',
      attrs: { id: 'target-row', class: 'rail-track', 'data-row': 'bottom' },
      rect: { top: 200, left: 0, width: 320, height: 60 },
      children: [
        tile('d', { top: 200, left: 0, width: 100, height: 60 }),
        tile('e', { top: 200, left: 110, width: 100, height: 60 }, { class: 'focusable row-memory' }),
      ],
    },
  ]);
  Focus.focus(byId('a'));

  Focus.move('down');

  assert.equal(Focus.current, byId('e'), 'remembered item wins over the first child');
});

test('data-nav="none" traps focus at an edge', () => {
  const { Focus, byId } = setup([
    tile('a', { top: 0, left: 0, width: 100, height: 60 }, { 'data-nav-right': 'none' }),
    tile('b', { top: 0, left: 110, width: 100, height: 60 }),
  ]);
  Focus.focus(byId('a'));

  Focus.move('right');

  assert.equal(Focus.current, byId('a'));
  assert.equal(byId('a').classList.contains('bump-right'), true);
});

test('select clicks the focused element and notifies listeners', () => {
  const { Focus, byId, sfx, timers } = setup();
  const selected = [];
  Focus.on('select', (el) => selected.push(el.id));
  Focus.focus(byId('a'));

  Focus.select();

  assert.deepEqual(selected, ['a']);
  assert.deepEqual(sfx.calls, ['select']);
  assert.equal(byId('a').clicks, 1);
  assert.equal(byId('a').classList.contains('pressing'), true);
  timers.forEach((fn) => fn());
  assert.equal(byId('a').classList.contains('pressing'), false, 'press state is released');
});

test('arrow, Enter and back keys drive the engine and preventDefault', () => {
  const { doc, Focus, byId, sfx } = setup();
  const backs = [];
  Focus.on('back', () => backs.push(true));
  Focus.focus(byId('a'));

  const press = (key) => {
    const event = new FakeEvent('keydown', { key });
    doc.dispatchEvent(event);
    return event;
  };

  assert.equal(press('ArrowRight').defaultPrevented, true);
  assert.equal(Focus.current, byId('b'));
  assert.equal(press('ArrowDown').defaultPrevented, true);
  assert.equal(Focus.current, byId('e'));
  assert.equal(press('Enter').defaultPrevented, true);
  assert.equal(byId('e').clicks, 1);
  assert.equal(press('Escape').defaultPrevented, true);
  assert.deepEqual(backs, [true]);
  assert.equal(sfx.calls.at(-1), 'back');

  const ignored = press('a');
  assert.equal(ignored.defaultPrevented, false);
});

test('Backspace also triggers back', () => {
  const { doc, Focus } = setup();
  const backs = [];
  Focus.on('back', () => backs.push(true));

  doc.dispatchEvent(new FakeEvent('keydown', { key: 'Backspace' }));

  assert.deepEqual(backs, [true]);
});

test('setEnabled(false) ignores keys, moves and selects', () => {
  const { doc, Focus, byId } = setup();
  Focus.focus(byId('a'));
  Focus.setEnabled(false);

  doc.dispatchEvent(new FakeEvent('keydown', { key: 'ArrowRight' }));
  Focus.move('right');
  Focus.select();

  assert.equal(Focus.current, byId('a'));
  assert.equal(byId('a').clicks, 0);

  Focus.setEnabled(true);
  Focus.move('right');
  assert.equal(Focus.current, byId('b'));
});

test('focus() rejects invisible targets and moving without focus grabs the first candidate', () => {
  const { Focus, byId } = setup([
    tile('a', { top: 0, left: 0, width: 100, height: 60 }),
    tile('gone', { top: 0, left: 110, width: 0, height: 0 }),
  ]);

  assert.equal(Focus.focus(byId('gone')), false);
  assert.equal(Focus.focus(null), false);
  assert.equal(Focus.current, null);

  Focus.move('right');
  assert.equal(Focus.current, byId('a'), 'first candidate is adopted');
});

test('focusing scrolls the containing row and page into view', () => {
  const { Focus, byId } = setup([
    {
      tag: 'div',
      attrs: { class: 'screen-scroll' },
      rect: { top: 0, left: 0, width: 400, height: 300 },
      children: [
        {
          tag: 'div',
          attrs: { class: 'rail-track', 'data-row': 'top' },
          rect: { top: 250, left: 0, width: 200, height: 60 },
          children: [tile('far', { top: 250, left: 900, width: 100, height: 60 })],
        },
      ],
    },
  ]);

  Focus.focus(byId('far'));

  const row = byId('far').closest('.rail-track');
  const page = byId('far').closest('.screen-scroll');
  assert.equal(row.scrolls.length, 1);
  assert.ok(row.scrolls[0].left > 0, 'row scrolls right toward the tile');
  assert.equal(page.scrolls.length, 1);
  assert.ok(page.scrolls[0].top > 0, 'page scrolls down toward the tile');
});

test('focus({ silent, noScroll }) skips listeners and scrolling', () => {
  const { Focus, byId } = setup();
  const focused = [];
  Focus.on('focus', (el) => focused.push(el.id));

  Focus.focus(byId('a'), { silent: true, noScroll: true });

  assert.equal(Focus.current, byId('a'));
  assert.deepEqual(focused, []);
  assert.deepEqual(byId('a').closest('.rail-track').scrolls, []);
});

test('Focus.back() fires listeners without a focused element', () => {
  const { Focus, sfx } = setup();
  const backs = [];
  Focus.on('back', () => backs.push(true));

  Focus.back();

  assert.deepEqual(backs, [true]);
  assert.deepEqual(sfx.calls, ['back']);
});
