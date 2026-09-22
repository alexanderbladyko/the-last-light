import {RecordedScore,MUSIC_TRACKS} from './recorded-score.js';
export {MUSIC_TRACKS};
const clamp=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));

export class TheatreAudio{
  constructor({contextFactory=()=>new (window.AudioContext||window.webkitAudioContext)(),
    fetchAudio=(url,options)=>fetch(url,options),storage=null,setTimer=(callback,delay)=>setInterval(callback,delay),
    clearTimer=timer=>clearInterval(timer),onChange=()=>{}}={}){
    Object.assign(this,{contextFactory,fetchAudio,storage,setTimer,clearTimer,onChange});
    this.phase='intro';this.wave=0;this.hidden=false;this.context=null;this.timer=null;this.voices=new Set();this.score=null;
    this.preferences={music:.7,effects:.8,muted:false,track:'waltz'};this.status='ready';
    try{
      const saved=JSON.parse(storage?.getItem('the-last-light-audio-v1')||'null');
      if(saved){
        for(const key of ['music','effects'])if(Number.isFinite(saved[key]))this.preferences[key]=clamp(saved[key]);
        if(typeof saved.muted==='boolean')this.preferences.muted=saved.muted;
        if(Object.hasOwn(MUSIC_TRACKS,saved.track))this.preferences.track=saved.track;
      }
    }catch{/* Storage may be unavailable in private browsing. */}
  }
  get wantsPlayback(){return !this.hidden&&['build','wave','won','lost'].includes(this.phase);}
  async unlock({retry=true}={}){
    try{
      if(!this.context){
        const c=this.context=this.contextFactory();
        this.master=c.createGain();this.music=c.createGain();this.effects=c.createGain();
        const limiter=c.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=12;limiter.ratio.value=4;
        this.music.connect(this.master);this.effects.connect(this.master);this.master.connect(limiter);limiter.connect(c.destination);
        this.score=new RecordedScore(c,this.music,{track:this.preferences.track,onChange:()=>this.onChange(),loadBuffer:async(track,signal)=>{
          const response=await this.fetchAudio(MUSIC_TRACKS[track].url,{signal});
          if(!response.ok)throw Error('Recording unavailable');
          return c.decodeAudioData(await response.arrayBuffer());
        }});
        c.onstatechange=()=>this.onChange();this.applyLevels();
      }
      if(!this.wantsPlayback)return;
      await this.context.resume();
      if(!this.wantsPlayback){await this.context.suspend();return;}
      this.status=this.context.state==='running'?'playing':'blocked';
      if(this.status==='playing'){
        if(this.timer===null)this.timer=this.setTimer(()=>this.tick(),80);
        if(['won','lost'].includes(this.phase))this.score.finish();
        else if(!this.preferences.muted&&this.preferences.music>0)await this.score.resume({retry});
      }
    }catch{this.status=this.context?'blocked':'unavailable';}
    this.onChange();
  }
  setScene(phase,wave=0){
    if(phase===this.phase&&wave===this.wave)return;
    this.phase=phase;this.wave=wave;
    if(phase==='won'||phase==='lost'){this.stopVoices();this.score?.finish();}
    this.transport();
  }
  setHidden(hidden){this.hidden=hidden;this.transport();}
  transport(){
    if(this.wantsPlayback){if(this.context)void this.unlock({retry:false});}
    else{
      if(this.timer!==null)this.clearTimer(this.timer);
      this.timer=null;this.score?.pause();this.stopVoices();
      if(this.context)void this.context.suspend().catch(()=>{});
      this.onChange();
    }
  }
  restart(){this.stopVoices();this.score?.reset();this.setScene('build',0);void this.unlock();}
  setPreference(key,value){
    if(!['music','effects','muted','track'].includes(key))return;
    if(key==='track'&&!Object.hasOwn(MUSIC_TRACKS,value))return;
    this.preferences[key]=key==='track'?value:key==='muted'?Boolean(value):clamp(value);
    if(key==='track')this.score?.select(value);
    this.applyLevels();
    if(this.score){
      if(this.preferences.muted||this.preferences.music===0||!this.wantsPlayback)this.score.pause();
      else void this.score.resume();
    }
    try{this.storage?.setItem('the-last-light-audio-v1',JSON.stringify(this.preferences));}catch{}
    this.onChange();
  }
  applyLevels(){
    if(!this.context)return;
    const now=this.context.currentTime;
    for(const [gain,value]of [[this.master,this.preferences.muted?0:.85],[this.music,this.preferences.music],[this.effects,this.preferences.effects]]){
      gain.gain.cancelScheduledValues(now);gain.gain.setTargetAtTime(value,now,.025);
    }
  }
  tick(){this.score?.tick();}
  note(hz,duration,instrument,volume,at,bus){
    const c=this.context;
    if(!c||c.state!=='running'||!this.wantsPlayback||this.preferences.muted||this.voices.size>=80)return;
    const parts=instrument==='bell'?[[1,1,1],[2.003,.20,.45],[3.998,.055,.18]]:[[1,1,1]];
    for(const [ratio,strength,decay]of parts){
      if(this.voices.size>=80)break;
      const osc=c.createOscillator(),envelope=c.createGain(),length=duration*decay;
      osc.type=instrument==='bell'?'sine':instrument;osc.frequency.value=hz*ratio;
      envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(volume*strength,at+Math.min(.012,length/4));
      envelope.gain.exponentialRampToValueAtTime(.0001,at+length);osc.connect(envelope);envelope.connect(bus);
      const voice={osc,envelope,bus};this.voices.add(voice);
      osc.onended=()=>{osc.disconnect();envelope.disconnect();this.voices.delete(voice);};
      osc.start(at);osc.stop(at+length+.02);
    }
  }
  sound(hz=440,duration=.12,type='sine',volume=.025){
    if(!this.context||this.preferences.effects===0)return;
    this.note(hz,duration,type,volume,this.context.currentTime,this.effects);
  }
  chime(hz,volume=.016){this.sound(hz,.7,'bell',volume);}
  stopVoices(){
    if(!this.context)return;
    for(const voice of this.voices){voice.osc.onended=null;voice.osc.stop();voice.osc.disconnect();voice.envelope.disconnect();this.voices.delete(voice);}
  }
  get label(){
    if(this.status==='unavailable')return 'Audio is unavailable in this browser.';
    if(this.preferences.muted)return 'All sound muted';
    if(this.hidden||this.phase==='paused')return 'Music rests during intermission';
    if(this.status==='blocked'||(this.context&&this.context.state!=='running'))return 'Tap ♫ to wake the music';
    if(this.preferences.music===0)return 'Music off · effects have their own volume';
    if(this.status==='ready')return 'Music starts with the curtain';
    if(this.score?.status==='error')return 'Music could not load · tap ♫ to retry';
    if(this.score?.status==='loading')return 'Loading · '+MUSIC_TRACKS[this.preferences.track].title;
    if(this.phase==='won')return 'The music rests at dawn';
    if(this.phase==='lost')return 'The final winding';
    return 'Playing · '+MUSIC_TRACKS[this.preferences.track].title;
  }
}
