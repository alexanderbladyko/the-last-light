import test from 'node:test';
import assert from 'node:assert/strict';
import {TheatreAudio, SCORE, scoreStep} from '../game/audio.js';

class Param {
  value = 0; events = [];
  setValueAtTime(value) { this.value = value; }
  linearRampToValueAtTime(value, at) { this.value = value; this.events.push({value,at}); }
  exponentialRampToValueAtTime(value) { this.value = value; }
  setTargetAtTime(value) { this.value = value; }
  cancelScheduledValues() {}
}
class Node {
  gain = new Param(); frequency = new Param(); delayTime = new Param(); Q = new Param();
  threshold = new Param(); knee = new Param(); ratio = new Param();
  connect() {} disconnect() { this.disconnected = true; }
  start(at) { this.startAt = at; }
  stop(at = 0) { this.stopAt = at; }
}
class Context {
  currentTime = 0; sampleRate = 8000; state = 'suspended'; destination = new Node(); oscillators = [];
  createGain() { return new Node(); } createDelay() { return new Node(); }
  createBuffer(channels, length) {
    const data = Array.from({length:channels}, () => new Float32Array(length));
    return {getChannelData: channel => data[channel]};
  }
  createConvolver() { this.room = new Node(); return this.room; }
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

test('the atmospheric score loops with sparse bells, sustained beds and finite endings', () => {
  const steps = SCORE.chords.length * SCORE.stepsPerBar;
  let quietSteps = 0, bells = 0;
  for (let step = 0; step < steps; step++) {
    const notes = scoreStep(step, 'wave', 6), build = scoreStep(step, 'build');
    assert.deepEqual(notes, scoreStep(step + steps, 'wave', 6));
    assert.ok(notes.length <= 5);
    for (const [pitch, duration, gain] of notes) {
      assert.ok(pitch >= 29 && pitch <= 84); assert.ok(duration > 0 && duration <= 13);
      assert.ok(gain > 0 && gain <= .06);
    }
    if (!build.length) quietSteps++;
    bells += build.filter(note => note[3] === 'distant').length;
    assert.ok(build.every(note => !['tick','pluck','bell'].includes(note[3])));
    if (step % SCORE.stepsPerBar === 0) assert.ok(build.filter(note => note[1] > 9).length === 4);
  }
  assert.ok(quietSteps > steps / 2); assert.ok(bells >= 8 && bells <= 16);
  assert.ok(scoreStep(11, 'wave', 2).length > scoreStep(11, 'build').length);
  for (const phase of ['won','lost']) for (let step = 12; step < 110; step++) assert.deepEqual(scoreStep(step, phase), []);
});

test('ambient voices swell slowly while toy effects keep their fast attack; the stereo room has a quiet onset', async () => {
  const f = setup(); await start(f);
  const bed = [...f.audio.voices];
  assert.ok(bed.length > 0);
  assert.ok(bed.every(voice => voice.envelope.gain.events[0].at - voice.osc.startAt >= 2));
  f.audio.sound();
  const effect = [...f.audio.voices].at(-1);
  assert.ok(effect.envelope.gain.events[0].at - effect.osc.startAt <= .012);
  const left = f.context.room.buffer.getChannelData(0), right = f.context.room.buffer.getChannelData(1);
  assert.ok(left.slice(0, 200).every(value => value === 0));
  assert.ok(left.some(value => Math.abs(value) > .1));
  assert.notDeepEqual(left, right);
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
  f.audio.step = SCORE.stepsPerBar;
  const before = f.context.oscillators.length; f.audio.tick();
  const added = f.context.oscillators.slice(before);
  assert.ok(added.length > 0 && added.length <= 16);
  assert.ok(added.every(node => node.startAt >= f.context.currentTime));
});

test('long sessions dispose ended nodes and cap simultaneous effects', async () => {
  const f = setup(); await start(f); f.audio.setScene('wave', 6);
  for (let tick = 0; tick < 1800; tick++) {
    f.context.advance(.08); f.audio.tick();
    if (tick % 10 === 0) f.audio.chime(784);
    assert.ok(f.audio.voices.size <= 80);
  }
  assert.ok(f.context.oscillators.length > 500);
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


test('resume and unmute restore an ambient bed immediately without doubling old music voices', async () => {
  const f = setup(); await start(f);
  f.context.advance(3); f.audio.tick();
  f.audio.setScene('paused'); f.audio.setScene('build'); await f.audio.unlock();
  assert.ok([...f.audio.voices].some(voice => voice.osc.stopAt - voice.osc.startAt > 9));
  f.audio.setPreference('muted', true);
  f.context.advance(3); f.audio.tick();
  f.audio.setPreference('muted', false); f.audio.tick();
  assert.equal(f.audio.voices.size, 12);
  f.audio.setPreference('music', 0); f.context.advance(2); f.audio.tick();
  f.audio.setPreference('music', .7); f.audio.tick();
  assert.equal(f.audio.voices.size, 12);
  assert.equal(f.timers.size, 1);
});
