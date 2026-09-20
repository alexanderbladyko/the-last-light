// Original score: “Wind the Moon”. A 16-bar, 80 BPM toy-theatre waltz.
// MIDI pitches are composition data, not recordings or third-party samples.
export const SCORE = {
  title: 'Wind the Moon', bpm: 80, stepsPerBar: 6,
  chords: [[50,57,62,65],[46,53,58,62],[43,50,55,58],[45,52,57,61],
    [50,57,62,65],[41,48,53,57],[43,50,55,58],[45,52,57,61],
    [46,53,58,62],[41,48,53,57],[43,50,55,58],[50,57,62,65],
    [43,50,55,58],[45,52,57,61],[50,57,62,65],[45,52,57,61]],
  melody: [[74,null,77,76,74,69],[70,null,74,77,74,null],
    [74,72,70,null,67,69],[73,null,76,74,73,69],
    [74,null,77,81,79,77],[76,77,79,null,77,72],
    [74,null,70,69,67,70],[73,74,76,null,73,null],
    [77,null,82,81,77,74],[76,null,81,79,77,76],
    [74,77,79,null,77,74],[77,76,74,null,69,null],
    [70,null,74,72,70,67],[69,73,76,79,76,73],
    [74,null,77,76,74,null],[73,null,69,null,null,null]]
};
const STEP = 60 / SCORE.bpm / 2;
const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
const clamp = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

// Each note has [pitch, duration, gain, instrument]. Time is kept by Web Audio,
// independent of rendering and the game's 1×/2× speed control.
export function scoreStep(index, phase, wave = 0) {
  if (phase === 'won' || phase === 'lost') {
    const phrase = phase === 'won' ? [74,78,81,86] : [74,73,69,62];
    return index < 12 && index % 3 === 0
      ? [[phrase[index / 3], 2.5, .065, 'bell'], [phase === 'won' ? 50 : 38, 2.4, .028, 'bass']]
      : [];
  }
  const bar = Math.floor(index / 6) % 16, beat = index % 6;
  const chord = SCORE.chords[bar], melody = SCORE.melody[bar][beat], notes = [];
  if (melody !== null) notes.push([melody, 1.45, beat === 0 ? .060 : .045, 'bell']);
  if (beat === 0) notes.push([chord[0], 1.8, .035, 'bass']);
  if (beat === 2 || beat === 4) {
    notes.push([chord[2], .65, .021, 'pluck'], [chord[3], .65, .018, 'pluck']);
  }
  if (phase === 'wave') {
    if (beat % 2 === 0) notes.push([beat === 0 ? 86 : 93, .045, .007, 'tick']);
    if (wave >= 2 && beat === 5) notes.push([chord[1] + 24, 2, .013, 'bell']);
    if (wave >= 4 && beat === 3) notes.push([chord[1] - 12, .8, .030, 'bass']);
  }
  return notes;
}

export class TheatreAudio {
  constructor({contextFactory = () => new (window.AudioContext || window.webkitAudioContext)(),
    storage = null, setTimer = (callback, delay) => setInterval(callback, delay),
    clearTimer = timer => clearInterval(timer), onChange = () => {}} = {}) {
    Object.assign(this, {contextFactory, storage, setTimer, clearTimer, onChange});
    this.phase = 'intro'; this.wave = 0; this.hidden = false; this.step = 0;
    this.context = null; this.timer = null; this.nextTime = null; this.voices = new Set();
    this.preferences = {music: .7, effects: .8, muted: false}; this.status = 'ready';
    try {
      const saved = JSON.parse(storage?.getItem('the-last-light-audio-v1') || 'null');
      if (saved) for (const key of ['music','effects']) {
        if (Number.isFinite(saved[key])) this.preferences[key] = clamp(saved[key]);
      }
      if (typeof saved?.muted === 'boolean') this.preferences.muted = saved.muted;
    } catch { /* Storage may be unavailable in private browsing. */ }
  }
  get wantsPlayback() { return !this.hidden && ['build','wave','won','lost'].includes(this.phase); }
  async unlock() {
    try {
      if (!this.context) {
        const c = this.context = this.contextFactory();
        this.master = c.createGain(); this.music = c.createGain(); this.effects = c.createGain();
        const limiter = c.createDynamicsCompressor();
        limiter.threshold.value = -12; limiter.knee.value = 12; limiter.ratio.value = 4;
        this.music.connect(this.master); this.effects.connect(this.master);
        this.master.connect(limiter); limiter.connect(c.destination);
        // A tiny filtered echo gives the wooden box a room, without an audio download.
        const echo = c.createDelay(.5), feedback = c.createGain(), filter = c.createBiquadFilter(), wet = c.createGain();
        echo.delayTime.value = STEP; feedback.gain.value = .18; wet.gain.value = .22;
        filter.type = 'lowpass'; filter.frequency.value = 2400;
        this.music.connect(echo); echo.connect(filter); filter.connect(feedback); feedback.connect(echo);
        filter.connect(wet); wet.connect(this.master);
        c.onstatechange = () => { this.onChange(); };
        this.applyLevels();
      }
      if (!this.wantsPlayback) return;
      await this.context.resume();
      if (!this.wantsPlayback) { await this.context.suspend(); return; }
      this.status = this.context.state === 'running' ? 'playing' : 'blocked';
      if (this.status === 'playing' && this.timer === null) {
        this.nextTime = this.context.currentTime + .06;
        this.timer = this.setTimer(() => this.tick(), 80); this.tick();
      }
    } catch { this.status = this.context ? 'blocked' : 'unavailable'; }
    this.onChange();
  }
  setScene(phase, wave = 0) {
    if (phase === this.phase && wave === this.wave) return;
    const ended = phase === 'won' || phase === 'lost';
    this.phase = phase; this.wave = wave;
    if (ended) { this.stopVoices(); this.step = 0; this.nextTime = null; }
    this.transport();
  }
  setHidden(hidden) { this.hidden = hidden; this.transport(); }
  transport() {
    if (this.wantsPlayback) { if (this.context) void this.unlock(); }
    else {
      if (this.timer !== null) this.clearTimer(this.timer);
      this.timer = null; this.nextTime = null; this.stopVoices();
      if (this.context) void this.context.suspend().catch(() => {});
      this.onChange();
    }
  }
  restart() { this.stopVoices(); this.step = 0; this.nextTime = null; this.setScene('build', 0); void this.unlock(); }
  setPreference(key, value) {
    if (!['music','effects','muted'].includes(key)) return;
    this.preferences[key] = key === 'muted' ? Boolean(value) : clamp(value);
    this.applyLevels();
    try { this.storage?.setItem('the-last-light-audio-v1', JSON.stringify(this.preferences)); } catch {}
    this.onChange();
  }
  applyLevels() {
    if (!this.context) return;
    const now = this.context.currentTime;
    for (const [gain, value] of [[this.master, this.preferences.muted ? 0 : .85],
      [this.music, this.preferences.music], [this.effects, this.preferences.effects]]) {
      gain.gain.cancelScheduledValues(now); gain.gain.setTargetAtTime(value, now, .025);
    }
  }
  tick() {
    const c = this.context;
    if (!c || c.state !== 'running' || !this.wantsPlayback) return;
    if (this.nextTime === null || this.nextTime < c.currentTime - .25) this.nextTime = c.currentTime + .04;
    while (this.nextTime < c.currentTime + .24) {
      if (!this.preferences.muted && this.preferences.music > 0) {
        for (const [pitch, length, gain, instrument] of scoreStep(this.step, this.phase, this.wave)) {
          this.note(frequency(pitch), length, instrument, gain, this.nextTime, this.music);
        }
      }
      this.step++; this.nextTime += STEP;
    }
  }
  note(hz, duration, instrument, volume, at, bus) {
    const c = this.context;
    if (!c || c.state !== 'running' || !this.wantsPlayback || this.preferences.muted || this.voices.size >= 80) return;
    const parts = instrument === 'bell' ? [[1,1,1],[2.003,.20,.45],[3.998,.055,.18]] : [[1,1,1]];
    for (const [ratio, strength, decay] of parts) {
      if (this.voices.size >= 80) break;
      const osc = c.createOscillator(), envelope = c.createGain(), length = duration * decay;
      osc.type = ['bass','pluck','tick'].includes(instrument) ? (instrument === 'bass' ? 'sine' : 'triangle') : instrument === 'bell' ? 'sine' : instrument;
      osc.frequency.value = hz * ratio;
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(volume * strength, at + Math.min(.012, length / 4));
      envelope.gain.exponentialRampToValueAtTime(.0001, at + length);
      osc.connect(envelope); envelope.connect(bus);
      const voice = {osc, envelope}; this.voices.add(voice);
      osc.onended = () => { osc.disconnect(); envelope.disconnect(); this.voices.delete(voice); };
      osc.start(at); osc.stop(at + length + .02);
    }
  }
  sound(hz = 440, duration = .12, type = 'sine', volume = .025) {
    if (!this.context || this.preferences.effects === 0) return;
    this.note(hz, duration, type, volume, this.context.currentTime, this.effects);
  }
  chime(hz, volume = .016) { this.sound(hz, .7, 'bell', volume); }
  stopVoices() {
    if (!this.context) return;
    for (const voice of this.voices) {
      voice.osc.onended = null; voice.osc.stop(); voice.osc.disconnect(); voice.envelope.disconnect();
    }
    this.voices.clear();
  }
  get label() {
    if (this.status === 'unavailable') return 'Audio is unavailable in this browser.';
    if (this.preferences.muted) return 'All sound muted';
    if (this.hidden || this.phase === 'paused') return 'Music rests during intermission';
    if (this.status === 'blocked' || (this.context && this.context.state !== 'running')) return 'Tap ♫ to wake the music';
    if (this.preferences.music === 0) return 'Music off · effects have their own volume';
    if (this.status === 'ready') return 'Music starts with the curtain';
    return this.phase === 'won' ? 'The dawn coda' : this.phase === 'lost' ? 'The final winding' : 'Playing · Wind the Moon';
  }
}
