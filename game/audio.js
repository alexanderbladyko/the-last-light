// Original atmospheric score: “Beneath the Boards”. Slow, unresolved phrases.
// MIDI pitches are composition data, not recordings or third-party samples.
export const SCORE = {
  title: 'Beneath the Boards', bpm: 52, stepsPerBar: 8,
  chords: [[50,57,64],[46,53,60],[43,50,57],[45,52,58],
    [50,53,57],[48,55,62],[43,50,58],[45,52,61]],
  melody: [[null,null,null,null,65,null,64,null],
    [null,null,null,null,null,62,null,null],
    [null,null,58,null,null,57,null,null],
    [null,null,null,null,null,null,61,null],
    [null,null,null,62,null,null,null,69],
    [null,null,null,null,67,null,62,null],
    [null,null,65,null,null,null,62,null],
    [null,null,null,null,null,61,null,null]]
};
const STEP = 60 / SCORE.bpm;
const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
const clamp = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

// [Pitch, duration, gain, instrument]. Long overlapping beds carry the scene;
// occasional lower bells suggest a melody without a regular foreground tune.
export function scoreStep(index, phase, wave = 0) {
  if (phase === 'won' || phase === 'lost') {
    if (index === 0) return phase === 'won'
      ? [[38,13,.052,'drone'],[50,12,.029,'pad'],[57,12,.022,'pad'],[66,12,.019,'pad']]
      : [[33,11,.043,'drone'],[45,10,.023,'pad'],[58,9,.013,'pad']];
    if (index === 4) return [[phase === 'won' ? 62 : 57, 6, .024, 'distant']];
    if (phase === 'won' && index === 8) return [[69,7,.018,'distant']];
    return [];
  }
  const bar = Math.floor(index / SCORE.stepsPerBar) % SCORE.chords.length;
  const beat = index % SCORE.stepsPerBar, chord = SCORE.chords[bar];
  const melody = SCORE.melody[bar][beat], notes = [];
  if (beat === 0) {
    notes.push([chord[0] - 12, STEP * 10, .048, 'drone']);
    chord.forEach((pitch, i) => notes.push([pitch, STEP * 10, i === 0 ? .028 : .018, 'pad']));
  }
  if (melody !== null) notes.push([melody, 6.8, .025, 'distant']);
  if (phase === 'wave') {
    if (wave >= 2 && bar % 2 === 1 && beat === 3) notes.push([chord[2] + 12, 7, .012, 'haze']);
    if (wave >= 4 && (beat === 2 || beat === 6)) notes.push([chord[0], 1.8, .025, 'pulse']);
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
        const musicTone = c.createBiquadFilter();
        musicTone.type = 'lowpass'; musicTone.frequency.value = 1450; musicTone.Q.value = .4;
        this.music.connect(musicTone); musicTone.connect(this.master); this.effects.connect(this.master);
        this.master.connect(limiter); limiter.connect(c.destination);
        // A diffuse stereo room, generated once. No rhythmic echo or sample download.
        const room = c.createConvolver(), impulse = c.createBuffer(2, Math.ceil(c.sampleRate * 3.2), c.sampleRate);
        let seed = 404;
        for (let channel = 0; channel < 2; channel++) {
          const samples = impulse.getChannelData(channel);
          for (let i = 0; i < samples.length; i++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            const time = i / c.sampleRate, fade = Math.max(0, Math.min(1, (time - .025) / .035));
            samples[i] = (seed / 2147483648 - 1) * fade * (1 - i / samples.length) ** 3;
          }
        }
        room.buffer = impulse;
        const roomLowCut = c.createBiquadFilter(), roomTone = c.createBiquadFilter(), wet = c.createGain();
        roomLowCut.type = 'highpass'; roomLowCut.frequency.value = 180;
        roomTone.type = 'lowpass'; roomTone.frequency.value = 1700; wet.gain.value = .44;
        musicTone.connect(room); room.connect(roomLowCut); roomLowCut.connect(roomTone); roomTone.connect(wet); wet.connect(this.master);
        c.onstatechange = () => { this.onChange(); };
        this.applyLevels();
      }
      if (!this.wantsPlayback) return;
      await this.context.resume();
      if (!this.wantsPlayback) { await this.context.suspend(); return; }
      this.status = this.context.state === 'running' ? 'playing' : 'blocked';
      if (this.status === 'playing' && this.timer === null) {
        if (['build','wave'].includes(this.phase)) this.step -= this.step % SCORE.stepsPerBar;
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
    const wasSilent = this.preferences.muted || this.preferences.music === 0;
    this.preferences[key] = key === 'muted' ? Boolean(value) : clamp(value);
    if (wasSilent && !this.preferences.muted && this.preferences.music > 0 && ['build','wave'].includes(this.phase)) {
      this.stopVoices(this.music); this.step -= this.step % SCORE.stepsPerBar; this.nextTime = null;
    }
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
    const atmospheric = ['drone','pad','distant','haze','pulse'].includes(instrument);
    const partials = {
      drone: [[1,.8,1],[2,.28,.95],[3,.09,.8]],
      pad: [[.9988,.48,1],[1.0012,.48,1],[2,.10,.88]],
      distant: [[1,.85,1],[2.001,.10,.75],[3.01,.025,.4]],
      haze: [[.999,.35,1],[1.001,.35,1],[2,.08,.8]],
      pulse: [[1,.8,1],[2,.16,.7]]
    };
    const parts = partials[instrument] ?? (instrument === 'bell' ? [[1,1,1],[2.003,.20,.45],[3.998,.055,.18]] : [[1,1,1]]);
    for (const [ratio, strength, decay] of parts) {
      if (this.voices.size >= 80) break;
      const osc = c.createOscillator(), envelope = c.createGain(), length = duration * decay;
      osc.type = atmospheric || instrument === 'bell' ? 'sine' : instrument;
      osc.frequency.value = hz * ratio;
      const swell = ['pad','haze','drone'].includes(instrument);
      const attack = swell ? Math.min(2.6, length * .25) : instrument === 'distant' ? .10 : instrument === 'pulse' ? .18 : Math.min(.012, length / 4);
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(volume * strength, at + attack);
      if (swell) envelope.gain.linearRampToValueAtTime(volume * strength * .75, at + length * .6);
      envelope.gain.exponentialRampToValueAtTime(.0001, at + length);
      osc.connect(envelope); envelope.connect(bus);
      const voice = {osc, envelope, bus}; this.voices.add(voice);
      osc.onended = () => { osc.disconnect(); envelope.disconnect(); this.voices.delete(voice); };
      osc.start(at); osc.stop(at + length + .02);
    }
  }
  sound(hz = 440, duration = .12, type = 'sine', volume = .025) {
    if (!this.context || this.preferences.effects === 0) return;
    this.note(hz, duration, type, volume, this.context.currentTime, this.effects);
  }
  chime(hz, volume = .016) { this.sound(hz, .7, 'bell', volume); }
  stopVoices(bus = null) {
    if (!this.context) return;
    for (const voice of this.voices) {
      if (bus && voice.bus !== bus) continue;
      voice.osc.onended = null; voice.osc.stop(); voice.osc.disconnect(); voice.envelope.disconnect(); this.voices.delete(voice);
    }
  }
  get label() {
    if (this.status === 'unavailable') return 'Audio is unavailable in this browser.';
    if (this.preferences.muted) return 'All sound muted';
    if (this.hidden || this.phase === 'paused') return 'Music rests during intermission';
    if (this.status === 'blocked' || (this.context && this.context.state !== 'running')) return 'Tap ♫ to wake the music';
    if (this.preferences.music === 0) return 'Music off · effects have their own volume';
    if (this.status === 'ready') return 'Music starts with the curtain';
    return this.phase === 'won' ? 'The dawn coda' : this.phase === 'lost' ? 'The final winding' : `Playing · ${SCORE.title}`;
  }
}
