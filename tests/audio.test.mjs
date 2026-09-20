import test from 'node:test';
import assert from 'node:assert/strict';
import {TheatreAudio, SCORE, scoreStep} from '../game/audio.js';

class Param {
  value = 0;
  setValueAtTime(value) { this.value = value; }
  linearRampToValueAtTime(value) { this.value = value; }
  exponentialRampToValueAtTime(value) { this.value = value; }
  setTargetAtTime(value) { this.value = value; }
  cancelScheduledValues() {}
}
class Node {
  gain = new Param(); frequency = new Param(); delayTime = new Param();
  threshold = new Param(); knee = new Param(); ratio = new Param();
  connect() {} disconnect() { this.disconnected = true; }
  start(at) { this.startAt = at; }
  stop(at = 0) { this.stopAt = at; }
}
class Context {
  currentTime = 0; state = 'suspended'; destination = new Node(); oscillators = [];
  createGain() { return new Node(); } createDelay() { return new Node(); }
  createBiquadFilter() { return new Node(); } createDynamicsCompressor() { return new Node(); }
  createOscillator() { const node = new Node(); this.oscillators.push(node); return node; }
  async resume() { this.state = 'running'; }
  async suspend() { this.state = 'suspended'; }
  advance(seconds) {
    this.currentTime += seconds;
    for (const node of this.oscillators) if (node.stopAt <= this.currentTime && node.onended) {
      const ended = node.onended; node.onended = null; ended();
    }
  }
}
function setup(storage) {
  const context = new Context(), timers = new Map(); let timerId = 0, created = 0;
  const audio = new TheatreAudio({contextFactory: () => { created++; return context; }, storage,
    setTimer: callback => { timers.set(++timerId, callback); return timerId; }, clearTimer: id => timers.delete(id)});
  return {audio, context, timers, created: () => created};
}
async function start(fixture) { fixture.audio.setScene('build'); await fixture.audio.unlock(); }

test('the complete waltz loops with finite pitches, rests and bounded voices per beat', () => {
  assert.equal(SCORE.melody.length, 16);
  for (let step = 0; step < 96; step++) {
    const notes = scoreStep(step, 'wave', 6);
    assert.deepEqual(notes, scoreStep(step + 96, 'wave', 6));
    assert.ok(notes.length <= 5);
    for (const [pitch, duration, gain] of notes) {
      assert.ok(pitch >= 29 && pitch <= 96); assert.ok(duration > 0 && duration <= 2);
      assert.ok(gain > 0 && gain <= .06);
    }
  }
  assert.ok(SCORE.melody.flat().includes(null));
  assert.ok(scoreStep(5, 'wave', 2).length > scoreStep(5, 'build').length);
  for (const phase of ['won','lost']) for (let step = 12; step < 110; step++) assert.deepEqual(scoreStep(step, phase), []);
});

test('Start unlocks one context and scheduler; restart and repeated resume cannot stack music', async () => {
  const f = setup(); assert.equal(f.created(), 0);
  await start(f); await f.audio.unlock(); f.audio.restart(); await f.audio.unlock();
  assert.equal(f.created(), 1); assert.equal(f.timers.size, 1);
  assert.ok(f.context.oscillators.length > 0);
});

test('pause and background stop voices, including preparation; resume continues safely', async () => {
  const f = setup(); await start(f);
  f.audio.setHidden(true);
  assert.equal(f.context.state, 'suspended'); assert.equal(f.timers.size, 0); assert.equal(f.audio.voices.size, 0);
  f.audio.setHidden(false); await f.audio.unlock();
  f.audio.setScene('paused'); assert.equal(f.context.state, 'suspended'); assert.equal(f.timers.size, 0);
  f.audio.setScene('wave', 2); await f.audio.unlock();
  assert.equal(f.context.state, 'running'); assert.equal(f.timers.size, 1);
});

test('a delayed scheduler skips the missed time instead of playing a burst of overdue notes', async () => {
  const f = setup(); await start(f); f.context.advance(30);
  const before = f.context.oscillators.length; f.audio.tick();
  const added = f.context.oscillators.slice(before);
  assert.ok(added.length <= 8);
  assert.ok(added.every(node => node.startAt >= f.context.currentTime));
});

test('long sessions dispose ended nodes and cap simultaneous effects', async () => {
  const f = setup(); await start(f); f.audio.setScene('wave', 6);
  for (let tick = 0; tick < 1800; tick++) {
    f.context.advance(.08); f.audio.tick();
    if (tick % 10 === 0) f.audio.chime(784);
    assert.ok(f.audio.voices.size <= 80);
  }
  assert.ok(f.context.oscillators.length > 1000);
  assert.ok(f.context.oscillators.slice(0,100).every(node => node.disconnected));
  for (let hit = 0; hit < 100; hit++) f.audio.sound();
  assert.ok(f.audio.voices.size <= 80);
  f.audio.setScene('paused'); assert.equal(f.audio.voices.size, 0);
});

test('mute fades every bus; independent music and effect levels persist', async () => {
  const values = new Map(), storage = {getItem: key => values.get(key), setItem: (key,value) => values.set(key,value)};
  const f = setup(storage); await start(f);
  f.audio.setPreference('muted', true); assert.equal(f.audio.master.gain.value, 0);
  const before = f.context.oscillators.length;
  f.context.advance(1); f.audio.tick(); f.audio.sound(); assert.equal(f.context.oscillators.length, before);
  f.audio.setPreference('music', .3); f.audio.setPreference('effects', 0);
  f.audio.setPreference('muted', false); f.audio.sound(); assert.equal(f.context.oscillators.length, before);
  assert.deepEqual(setup(storage).audio.preferences, {music:.3,effects:0,muted:false});
});

test('blocked autoplay is handled and a later gesture retries successfully', async () => {
  const f = setup(); f.context.resume = async () => { throw Error('NotAllowedError'); };
  await start(f); assert.equal(f.audio.status, 'blocked'); assert.equal(f.timers.size, 0);
  f.context.resume = Context.prototype.resume; await f.audio.unlock();
  assert.equal(f.audio.status, 'playing'); assert.equal(f.timers.size, 1);
});

test('private storage and unavailable Web Audio do not prevent game startup', async () => {
  const audio = new TheatreAudio({contextFactory: () => { throw Error('Unavailable'); }, storage:{getItem: () => { throw Error('SecurityError'); }}});
  audio.setScene('build'); await audio.unlock(); audio.setPreference('music', .5);
  assert.equal(audio.status, 'unavailable');
});
