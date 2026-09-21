import test from 'node:test';
import assert from 'node:assert/strict';
import {DRUM,PATH_LENGTH,createGame,startGame,beginWave,stepGame,spawnEnemy,damageEnemy,waveInfo,canDamageEnemy} from '../game/sim.js';
function active(){const g=createGame();startGame(g);g.wave=2;beginWave(g);g.spawned=waveInfo(3).roster.length;g.spawnClock=999;g.towers=[];Object.assign(g.lantern,{x:8,z:5,tx:8,tz:5});return g;}
const advance=(g,t)=>{for(let i=0;i<Math.ceil(t*60);i++)stepGame(g,1/60);};

test('drummers enter gradually from hour three without increasing wave size or replacing ghosts',()=>{
  assert.deepEqual([1,2,3,4,5,6].map(n=>waveInfo(n).drummers),[0,0,1,1,2,2]);
  for(let n=1;n<=6;n++){const w=waveInfo(n);assert.equal(w.roster.length,4+n*2);assert.equal(w.roster.filter(e=>e.kind==='drummer').length,w.drummers);assert.equal(w.dolls+w.ghosts+w.drummers,w.roster.length);}
  assert.equal([1,2,3,4,5,6].reduce((s,n)=>s+waveInfo(n).ghosts,0),20);
});

test('the wind-up stops the drummer before a visible beat, then it resumes marching',()=>{
  const g=active(),d=spawnEnemy(g,2,0,'drummer');
  d.drumClock=DRUM.windup-.01;const distance=d.distance;
  advance(g,.5);assert.equal(d.distance,distance);assert.equal(g.drumBeats,0);
  advance(g,.7);assert.equal(g.drumBeats,1);assert.ok(d.distance>distance);
  assert.equal(g.events.filter(e=>e.type==='drum').length,1);
});

test('one beat boosts nearby dolls and ghosts only, without revealing ghosts or waking sleepers',()=>{
  const g=active(),d=spawnEnemy(g,2,0,'drummer'),near=spawnEnemy(g,2,1),ghost=spawnEnemy(g,0,1.5,'ghost'),far=spawnEnemy(g,2,12),sleeper=spawnEnemy(g,2,2);
  sleeper.sleep=2;d.drumClock=.001;stepGame(g,1/60);
  assert.ok(near.march>0);assert.ok(ghost.march>0);assert.ok(sleeper.march>0);
  assert.equal(far.march,0);assert.equal(d.march,0);assert.equal(canDamageEnemy(g,ghost),false);assert.ok(sleeper.sleep>0);
});

test('overlapping beats never multiply the speed bonus and the short boost expires',()=>{
  const outcomes=[];
  for(const count of [0,1,2]){
    const g=active(),target=spawnEnemy(g,2,1);
    for(let i=0;i<count;i++)spawnEnemy(g,2,0,'drummer').drumClock=.001;
    stepGame(g,1/60);outcomes.push(target.distance-1);
    if(count){assert.equal(target.march,DRUM.duration);advance(g,DRUM.duration+.1);assert.equal(target.march,0);}
  }
  assert.ok(Math.abs(outcomes[1]/outcomes[0]-DRUM.boost)<1e-10);
  assert.equal(outcomes[1],outcomes[2]);
});

test('a Lullaby interrupts a pending beat; waking the drummer does not immediately release it',()=>{
  const g=active();g.towers=[{slot:3,type:'music',branch:'lullaby',charge:0}];
  const d=spawnEnemy(g,2,19.5,'drummer');d.drumClock=1.6;
  advance(g,1.7);assert.ok(d.sleep>0);assert.equal(g.drumBeats,0);assert.equal(d.drumClock,DRUM.interval);
  damageEnemy(g,d,1);assert.equal(d.sleep,0);advance(g,.5);assert.equal(g.drumBeats,0);
});

test('a drummer defeat rewards six brass once, releases no doll and cancels future beats',()=>{
  const g=active(),d=spawnEnemy(g,2,0,'drummer'),coins=g.coins;spawnEnemy(g,2,8);d.drumClock=.001;
  damageEnemy(g,d,999);damageEnemy(g,d,999);stepGame(g,1/60);
  assert.equal(g.coins,coins+6);assert.equal(g.drummerKills,1);assert.equal(g.kills,1);
  assert.equal(g.enemies.length,1);assert.equal(g.drumBeats,0);
});

test('drummer escapes cost three light and never count as defeats',()=>{
  const g=active(),d=spawnEnemy(g,2,PATH_LENGTH-.001,'drummer');d.drumClock=3;stepGame(g,1/60);
  assert.equal(g.lives,9);assert.equal(g.drummerKills,0);
});

test('pause freezes both the wind-up and marching boost; restart state is clean',()=>{
  const g=active(),d=spawnEnemy(g,2,0,'drummer'),e=spawnEnemy(g,2,1);d.drumClock=.5;e.march=.8;g.phase='paused';
  const before=JSON.stringify(g);advance(g,2);assert.equal(JSON.stringify(g),before);
  const fresh=createGame();assert.equal(fresh.drummerKills,0);assert.equal(fresh.drumBeats,0);
});
