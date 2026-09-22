import test from 'node:test';
import assert from 'node:assert/strict';
import {TheatreAudio,MUSIC_TRACKS} from '../game/audio.js';

class Param{
  value=0;events=[];
  setValueAtTime(value,at){this.value=value;this.events.push({value,at});}
  linearRampToValueAtTime(value,at){this.value=value;this.events.push({value,at});}
  exponentialRampToValueAtTime(value,at){this.value=value;this.events.push({value,at});}
  setTargetAtTime(value){this.value=value;}
  cancelScheduledValues(){}
}
class Node{
  gain=new Param();frequency=new Param();threshold=new Param();knee=new Param();ratio=new Param();
  connect(){} disconnect(){this.disconnected=true;}
  start(at,offset=0){this.startAt=at;this.offset=offset;}
  stop(at=0){this.stopAt=at;}
}
class Context{
  currentTime=0;state='suspended';destination=new Node();oscillators=[];sources=[];decoded=0;
  createGain(){return new Node();}createDynamicsCompressor(){return new Node();}
  createOscillator(){const n=new Node();this.oscillators.push(n);return n;}
  createBufferSource(){const n=new Node();this.sources.push(n);return n;}
  async decodeAudioData(bytes){this.decoded++;return {duration:90,identity:bytes};}
  async resume(){this.state='running';}async suspend(){this.state='suspended';}
  advance(seconds){
    if(this.state!=='running')return;
    this.currentTime+=seconds;
    for(const n of [...this.oscillators,...this.sources])if(n.stopAt<=this.currentTime&&n.onended){const ended=n.onended;n.onended=null;ended();}
  }
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function setup({storage,fetchAudio}={}){
  const context=new Context(),timers=new Map(),requests=[];let created=0,timer=0;
  const audio=new TheatreAudio({contextFactory:()=>{created++;return context;},storage,
    fetchAudio:fetchAudio??(async(url,options)=>{requests.push({url,options});return {ok:true,arrayBuffer:async()=>url};}),
    setTimer:fn=>{timers.set(++timer,fn);return timer;},clearTimer:id=>timers.delete(id)});
  return {audio,context,timers,requests,created:()=>created};
}
async function start(f){f.audio.setScene('build');await f.audio.unlock();}

test('a player gesture loads one local recording; repeat unlock and restart never stack music',async()=>{
  const f=setup();assert.equal(f.created(),0);assert.equal(f.requests.length,0);
  await start(f);await f.audio.unlock();
  assert.equal(f.created(),1);assert.equal(f.context.decoded,1);assert.equal(f.requests.length,1);
  assert.ok(f.requests[0].url.endsWith('/music/clockwork-waltz-v1.mp3'));
  assert.equal(f.context.oscillators.length,0,'recorded music must not retain the old synth beds');
  assert.equal(f.audio.score.voices.size,1);assert.equal(f.timers.size,1);
  f.audio.restart();await f.audio.unlock();assert.equal(f.audio.score.voices.size,1);assert.equal(f.context.decoded,1);
  assert.equal([...f.audio.score.voices][0].offset,0);
});
test('pause and background preserve the playhead, stop sources, and resume from the same phrase',async()=>{
  const f=setup();await start(f);f.context.advance(17);const position=f.audio.score.position();
  f.audio.setScene('paused');assert.equal(f.context.state,'suspended');assert.equal(f.audio.score.voices.size,0);assert.equal(f.timers.size,0);
  f.context.advance(30);assert.equal(f.audio.score.position(),position);
  f.audio.setScene('build');await f.audio.unlock();assert.equal([...f.audio.score.voices][0].offset,position);
  f.context.advance(2);f.audio.setHidden(true);assert.equal(f.context.state,'suspended');assert.equal(f.audio.score.voices.size,0);
  f.audio.setHidden(false);await f.audio.unlock();assert.equal(f.audio.score.voices.size,1);assert.equal(f.timers.size,1);
});
test('wave changes keep the recording at its own pace without restart',async()=>{
  const f=setup();await start(f);f.context.advance(12);const source=[...f.audio.score.voices][0].source;
  for(let wave=1;wave<=6;wave++){f.audio.setScene('wave',wave);await f.audio.unlock();}
  assert.equal([...f.audio.score.voices][0].source,source);assert.equal(f.context.sources.length,1);
});
test('loop seams overlap gently, share one buffer, and remain bounded throughout a long session',async()=>{
  const f=setup();await start(f);
  const first=[...f.audio.score.voices][0];f.context.advance(87);f.audio.tick();
  assert.equal(f.audio.score.voices.size,2);
  const second=[...f.audio.score.voices][1];assert.equal(second.source.buffer,first.source.buffer);
  assert.ok(Math.abs(second.at-(first.end-3))<.05);
  assert.equal(second.fadeIn,3);assert.equal(first.fadeOut,3);
  for(let i=0;i<11250;i++){f.context.advance(.08);f.audio.tick();assert.ok(f.audio.score.voices.size<=2);}
  assert.equal(f.context.decoded,1);assert.equal(f.requests.length,1);assert.ok(f.context.sources.length>=10);
  assert.ok(f.context.sources.slice(0,-2).every(n=>n.disconnected));
});
test('a delayed timer resumes once instead of scheduling a burst of overdue loops',async()=>{
  const f=setup();await start(f);f.context.advance(400);f.audio.tick();
  assert.equal(f.audio.score.voices.size,1);assert.equal(f.context.sources.length,2);
  assert.ok([...f.audio.score.voices][0].at>=f.context.currentTime);
});
test('mute and music-zero stop music; independent effects and saved choices remain usable',async()=>{
  const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},f=setup({storage});
  await start(f);f.context.advance(9);f.audio.setPreference('music',0);
  assert.equal(f.audio.score.voices.size,0);f.audio.sound();assert.equal(f.audio.voices.size,1);
  f.audio.setPreference('music',.3);await flush();assert.equal(f.audio.score.voices.size,1);
  f.audio.setPreference('muted',true);assert.equal(f.audio.master.gain.value,0);assert.equal(f.audio.score.voices.size,0);
  const count=f.context.oscillators.length;f.audio.sound();assert.equal(f.context.oscillators.length,count);
  f.audio.setPreference('effects',0);f.audio.setPreference('muted',false);await flush();f.audio.sound();
  assert.equal(f.context.oscillators.length,count);assert.equal(f.audio.score.voices.size,1);
  f.audio.setPreference('track','lullaby');await flush();
  assert.deepEqual(setup({storage}).audio.preferences,{music:.3,effects:0,muted:false,track:'lullaby'});
});
test('changing score while paused loads only the chosen file on resume',async()=>{
  const f=setup();await start(f);f.audio.setScene('paused');f.audio.setPreference('track','lullaby');
  assert.equal(f.requests.length,1);assert.equal(f.audio.score.buffer,null);
  f.audio.setScene('build');await f.audio.unlock();assert.equal(f.requests.length,2);
  assert.ok(f.requests[1].url.endsWith('/music/velvet-lullaby-v1.mp3'));assert.equal(f.audio.score.voices.size,1);
  assert.equal([...f.audio.score.voices][0].gain,MUSIC_TRACKS.lullaby.gain);
});
test('a late download cannot start music after pause or replace a newly selected score',async()=>{
  const pending=[];const f=setup({fetchAudio:(url,{signal})=>new Promise(resolve=>pending.push({url,signal,resolve}))});
  const loading=start(f);await flush();f.audio.setScene('paused');
  pending[0].resolve({ok:true,arrayBuffer:async()=> 'old'});await loading;
  assert.equal(f.audio.score.voices.size,0);assert.equal(f.context.state,'suspended');
  f.audio.setPreference('track','lullaby');f.audio.setScene('build');await flush();
  f.audio.setPreference('track','waltz');await flush();assert.equal(pending[1].signal.aborted,true);
  pending[2].resolve({ok:true,arrayBuffer:async()=> 'new'});await flush();
  pending[1].resolve({ok:true,arrayBuffer:async()=> 'stale'});await flush();
  assert.equal(f.audio.score.buffer.identity,'new');assert.equal(f.audio.score.track,'waltz');assert.equal(f.audio.score.voices.size,1);
});
test('load failure leaves toy effects playable, reports an error, and allows a deliberate retry',async()=>{
  let fail=true,calls=0;const f=setup({fetchAudio:async()=>{calls++;return {ok:!fail,arrayBuffer:async()=> 'recording'};}});
  await start(f);assert.equal(f.audio.status,'playing');assert.equal(f.audio.score.status,'error');assert.match(f.audio.label,/could not load/);
  f.audio.sound();assert.equal(f.audio.voices.size,1);
  for(let i=0;i<100;i++){f.context.advance(.08);f.audio.tick();}assert.equal(calls,1);
  fail=false;await f.audio.unlock();assert.equal(calls,2);assert.equal(f.audio.score.voices.size,1);
});
test('invalid decoded audio is rejected without disabling effects',async()=>{
  const f=setup();f.context.decodeAudioData=async()=>({duration:NaN});await start(f);
  assert.equal(f.audio.score.status,'error');assert.equal(f.audio.score.voices.size,0);f.audio.chime(440);assert.equal(f.audio.voices.size,3);
});
test('win and loss fade to silence once; restarting begins a fresh recording',async()=>{
  for(const phase of ['won','lost']){
    const f=setup();await start(f);f.context.advance(15);f.audio.setScene(phase);await f.audio.unlock();
    assert.ok([...f.audio.score.voices].every(v=>v.source.stopAt<=f.context.currentTime+6.1));
    f.context.advance(7);f.audio.tick();await f.audio.unlock();assert.equal(f.audio.score.voices.size,0);assert.equal(f.audio.score.status,'ended');
    f.audio.restart();await f.audio.unlock();assert.equal(f.audio.score.voices.size,1);assert.equal([...f.audio.score.voices][0].offset,0);
  }
});
test('blocked browser activation can retry; unavailable audio and private storage do not prevent startup',async()=>{
  const f=setup();f.context.resume=async()=>{throw Error('NotAllowedError');};await start(f);
  assert.equal(f.audio.status,'blocked');assert.equal(f.requests.length,0);assert.equal(f.timers.size,0);
  f.context.resume=Context.prototype.resume;await f.audio.unlock();assert.equal(f.audio.score.voices.size,1);
  const a=new TheatreAudio({contextFactory:()=>{throw Error('Unavailable');},storage:{getItem:()=>{throw Error('SecurityError');}}});
  a.setScene('build');await a.unlock();a.setPreference('music',.5);assert.equal(a.status,'unavailable');
});
test('old saved audio levels migrate without losing preferences; invalid track identifiers are ignored',()=>{
  const f=setup({storage:{getItem:()=>JSON.stringify({music:.34,effects:.44,muted:true,track:'toString'})}});
  assert.deepEqual(f.audio.preferences,{music:.34,effects:.44,muted:true,track:'waltz'});
  f.audio.setPreference('track','missing');assert.equal(f.audio.preferences.track,'waltz');
});
test('effect voices retain their short envelopes, cleanup, and burst cap',async()=>{
  const f=setup();await start(f);for(let i=0;i<100;i++)f.audio.chime(784);
  assert.ok(f.audio.voices.size<=80);
  assert.ok([...f.audio.voices].every(v=>v.envelope.gain.events[1].at-v.osc.startAt<=.012));
  f.context.advance(1);assert.equal(f.audio.voices.size,0);assert.ok(f.context.oscillators.every(n=>n.disconnected));
});
