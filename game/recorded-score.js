export const MUSIC_TRACKS={
  lullaby:{title:'Velvet Lullaby',url:new URL('./music/velvet-lullaby-v1.mp3',import.meta.url).href,gain:.90},
  waltz:{title:'Clockwork Waltz',url:new URL('./music/clockwork-waltz-v1.mp3',import.meta.url).href,gain:.855},
};
const clamp=n=>Math.max(0,Math.min(1,n));

// One decoded recording, shared by at most two sources across a loop seam.
export class RecordedScore{
  constructor(context,bus,{loadBuffer,track='lullaby',onChange=()=>{}}){
    Object.assign(this,{context,bus,loadBuffer,onChange,track});
    this.voices=new Set();this.buffer=null;this.pending=null;this.generation=0;
    this.active=false;this.ending=false;this.offset=0;this.nextTime=null;this.status='ready';
  }
  select(track){
    if(!Object.hasOwn(MUSIC_TRACKS,track)||track===this.track)return;
    const active=this.active;this.pause();this.abort?.abort();this.generation++;
    this.track=track;this.buffer=null;this.pending=null;this.offset=0;this.status='ready';
    this.onChange();if(active)void this.resume();
  }
  async resume({retry=false}={}){
    if(this.ending)return;
    this.active=true;
    if(this.status==='error'&&!retry)return;
    if(!this.buffer){
      if(!this.pending){
        const generation=this.generation,track=this.track;
        const abort=this.abort=new AbortController();this.status='loading';this.onChange();
        this.pending=Promise.resolve().then(()=>this.loadBuffer(track,abort.signal)).then(buffer=>{
          if(generation!==this.generation)return;
          if(!Number.isFinite(buffer.duration)||buffer.duration<8)throw Error('Recording is too short');
          this.buffer=buffer;this.status='ready';
        }).catch(()=>{if(generation===this.generation)this.status='error';}).finally(()=>{
          if(generation===this.generation){this.pending=null;this.onChange();}
        });
      }
      const generation=this.generation;await this.pending;
      if(generation!==this.generation)return;
    }
    if(!this.active||this.ending||!this.buffer||this.context.state!=='running'||this.voices.size)return;
    if(this.buffer.duration-this.offset<1)this.offset=0;
    this.play(this.context.currentTime+.04,this.offset,1.2);this.status='playing';this.onChange();
  }
  level(voice,at){
    return voice.gain*Math.min(clamp((at-voice.at)/voice.fadeIn),clamp((voice.end-at)/voice.fadeOut));
  }
  play(at,offset=0,fadeIn=3){
    const c=this.context,source=c.createBufferSource(),envelope=c.createGain();
    source.buffer=this.buffer;
    const length=this.buffer.duration-offset,fadeOut=Math.min(3,length/2),gain=MUSIC_TRACKS[this.track].gain;
    fadeIn=Math.min(fadeIn,length/2);
    envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(gain,at+fadeIn);
    envelope.gain.setValueAtTime(gain,at+length-fadeOut);envelope.gain.linearRampToValueAtTime(0,at+length);
    source.connect(envelope);envelope.connect(this.bus);
    const voice={source,envelope,at,offset,end:at+length,fadeIn,fadeOut,gain};this.voices.add(voice);
    source.onended=()=>{source.disconnect();envelope.disconnect();this.voices.delete(voice);if(this.ending&&!this.voices.size){this.status='ended';this.onChange();}};
    source.start(at,offset);source.stop(voice.end+.02);
    this.nextTime=voice.end-fadeOut;
  }
  tick(){
    if(!this.active||this.ending||!this.buffer||this.status!=='playing'||this.context.state!=='running')return;
    const now=this.context.currentTime;
    if(this.nextTime!==null&&this.nextTime<now+.24&&this.voices.size<2){
      this.play(Math.max(this.nextTime,now+.02),0,3);
    }
  }
  position(){
    const now=this.context.currentTime;
    const voice=[...this.voices].filter(v=>v.at<=now&&v.end>now).sort((a,b)=>b.at-a.at)[0];
    return voice?voice.offset+now-voice.at:this.offset;
  }
  pause(){
    this.offset=this.position();this.active=false;this.nextTime=null;
    for(const voice of this.voices){voice.source.onended=null;voice.source.stop();voice.source.disconnect();voice.envelope.disconnect();}
    this.voices.clear();if(this.buffer)this.status=this.ending?'ended':'ready';
  }
  reset(){this.pause();this.offset=0;this.ending=false;}
  finish(){
    if(this.ending)return;
    this.ending=true;this.active=false;this.nextTime=null;
    const now=this.context.currentTime;
    for(const voice of this.voices){
      voice.envelope.gain.cancelScheduledValues(now);voice.envelope.gain.setValueAtTime(this.level(voice,now),now);
      const end=Math.min(voice.end,now+6);voice.envelope.gain.linearRampToValueAtTime(0,end);voice.source.stop(end+.02);
    }
    if(!this.voices.size)this.status='ended';
    this.onChange();
  }
}
