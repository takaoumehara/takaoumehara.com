import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FakeEvent, buildDocument, createWindow, runScript } from './helpers/dom.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'projects/amazon-firetv/js/audio.js'), 'utf8');

function fakeAudioContext(log, { state = 'running', throws = false } = {}) {
  return class AudioContext {
    constructor() {
      if (throws) throw new Error('no audio');
      this.state = state;
      this.currentTime = 10;
      this.destination = { id: 'destination' };
      log.constructed = (log.constructed || 0) + 1;
      log.resumes = log.resumes || 0;
      log.oscillators = log.oscillators || [];
      log.gains = log.gains || [];
      this.resume = () => { log.resumes += 1; this.state = 'running'; };
    }
    createOscillator() {
      const node = {
        type: null,
        events: [],
        connections: [],
        frequency: {
          setValueAtTime: (value, when) => node.events.push(['freq', value, when]),
          exponentialRampToValueAtTime: (value, when) => node.events.push(['glide', value, when]),
        },
        connect(target) { node.connections.push(target); return target; },
        start: (when) => node.events.push(['start', when]),
        stop: (when) => node.events.push(['stop', when]),
      };
      log.oscillators.push(node);
      return node;
    }
    createGain() {
      const node = {
        events: [],
        connections: [],
        gain: {
          setValueAtTime: (value, when) => node.events.push(['set', value, when]),
          linearRampToValueAtTime: (value, when) => node.events.push(['attack', value, when]),
          exponentialRampToValueAtTime: (value, when) => node.events.push(['decay', value, when]),
        },
        connect(target) { node.connections.push(target); return target; },
      };
      log.gains.push(node);
      return node;
    }
  };
}

function setup(options = {}) {
  const doc = buildDocument([]);
  const win = createWindow(doc);
  const log = {};
  win.AudioContext = fakeAudioContext(log, options);
  runScript(source, { window: win, document: doc });
  return { doc, win, log, SFX: win.SFX };
}

test('no AudioContext is created before the first cue', () => {
  const { log } = setup();

  assert.equal(log.constructed, undefined);
});

test('the context is unlocked once on first interaction and reused afterwards', () => {
  const { doc, log } = setup();

  doc.dispatchEvent(new FakeEvent('keydown'));
  doc.dispatchEvent(new FakeEvent('keydown'));
  doc.dispatchEvent(new FakeEvent('pointerdown'));

  assert.equal(log.constructed, 1, 'a single AudioContext is shared');
});

test('a suspended context is resumed before playing', () => {
  const { SFX, log } = setup({ state: 'suspended' });

  SFX.move();
  SFX.move();

  assert.equal(log.constructed, 1);
  assert.equal(log.resumes, 1, 'resume is only needed while suspended');
  assert.equal(log.oscillators.length, 2);
});

test('move plays one short high tone wired to the destination', () => {
  const { SFX, log } = setup();

  SFX.move();

  assert.equal(log.oscillators.length, 1);
  const [osc] = log.oscillators;
  const [gain] = log.gains;
  assert.equal(osc.type, 'sine');
  assert.deepEqual(osc.events[0], ['freq', 2600, 10]);
  assert.deepEqual(osc.events.at(-2), ['start', 10]);
  assert.deepEqual(osc.events.at(-1), ['stop', 10 + 0.045 + 0.02]);
  assert.deepEqual(osc.connections, [gain]);
  assert.deepEqual(gain.events, [
    ['set', 0, 10],
    ['attack', 0.025, 10.008],
    ['decay', 0.0001, 10.045],
  ]);
});

test('select and listen cues are two-tone with the second tone delayed', () => {
  const { SFX, log } = setup();

  SFX.select();

  assert.equal(log.oscillators.length, 2);
  assert.deepEqual(log.oscillators[0].events[0], ['freq', 1320, 10]);
  assert.deepEqual(log.oscillators[1].events[0], ['freq', 1980, 10.04]);
});

test('add is a rising three-tone arpeggio', () => {
  const { SFX, log } = setup();

  SFX.add();

  assert.deepEqual(
    log.oscillators.map((osc) => osc.events[0].slice(1)),
    [[1046, 10], [1568, 10.07], [2093, 10.14]],
  );
});

test('back glides down in pitch', () => {
  const { SFX, log } = setup();

  SFX.back();

  const [osc] = log.oscillators;
  assert.deepEqual(osc.events[0], ['freq', 880, 10]);
  assert.deepEqual(osc.events[1], ['glide', 620, 10.08]);
});

test('error uses a square wave', () => {
  const { SFX, log } = setup();

  SFX.error();

  assert.equal(log.oscillators[0].type, 'square');
});

test('every cue is a no-op when WebAudio is unavailable', () => {
  const { SFX, log } = setup({ throws: true });

  for (const cue of ['move', 'select', 'back', 'add', 'error', 'listen', 'done']) {
    assert.doesNotThrow(() => SFX[cue](), `${cue} should degrade silently`);
  }
  assert.equal(log.oscillators, undefined);
});
