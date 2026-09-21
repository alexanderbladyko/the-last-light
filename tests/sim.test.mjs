import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startGame,beginWave,buildTower,upgradeTower,stepGame,spawnEnemy,damageEnemy,moveLantern,pointAt,PATH,PATH_LENGTH,SOCKETS,waveInfo,canDamageEnemy,chooseNightGift} from '../game/sim.js';
const advance=(g,seconds)=>{for(let i=0;i<seconds*60;i++){stepGame(g,1/60);g.events.length=0;}};
function active(){const g=createGame();startGame(g);beginWave(g);g.spawned=6;g.spawnClock=999;return g;}
test('route begins and ends at the displayed gates, including out-of-bounds distances',()=>{for(const d of [-1,0])assert.deepEqual([pointAt(d).x,pointAt(d).z],PATH[0]);for(const d of [PATH_LENGTH,PATH_LENGTH+1])assert.deepEqual([pointAt(d).x,pointAt(d).z],PATH.at(-1));});
test('building and upgrades enforce currency, valid slots and mutually exclusive branches',()=>{const g=createGame();assert.equal(buildTower(g,0,'top'),false);startGame(g);assert.equal(buildTower(g,0,'top'),true);assert.equal(g.coins,40);assert.equal(buildTower(g,0,'music'),false);assert.equal(buildTower(g,99,'top'),false);assert.equal(buildTower(g,2,'constructor'),false);assert.equal(upgradeTower(g,0,'orbit'),false);g.coins=100;assert.equal(upgradeTower(g,0,'orbit'),true);assert.equal(upgradeTower(g,0,'bowling'),false);assert.equal(upgradeTower(g,3,'bowling'),false);assert.equal(g.coins,58);});
test('each shell releases exactly one smaller doll at the same route position',()=>{const g=active();const e=spawnEnemy(g,2,7);damageEnemy(g,e,100);damageEnemy(g,e,100);const child=g.enemies.find(a=>!a.dead);assert.equal(child.tier,1);assert.equal(child.distance,7);assert.equal(g.enemies.filter(a=>!a.dead).length,1);damageEnemy(g,child,100);const small=g.enemies.find(a=>!a.dead);assert.equal(small.tier,0);damageEnemy(g,small,100);assert.equal(g.enemies.filter(a=>!a.dead).length,0);assert.equal(g.kills,3);});
test('spotlight accelerates approaching enemies',()=>{const dark=active(),light=active();dark.towers=[];light.towers=[];const a=spawnEnemy(dark,0,1),b=spawnEnemy(light,0,1);Object.assign(light.lantern,{x:b.x,z:b.z,tx:b.x,tz:b.z});advance(dark,.5);advance(light,.5);assert.ok(b.distance>a.distance*1.15);});
test('spotlight also accelerates the spinning defense',()=>{const a=active(),b=active();a.towers=a.towers.filter(t=>t.type==='top');b.towers=b.towers.filter(t=>t.type==='top');for(const g of [a,b]){const e=spawnEnemy(g,2,12);e.hp=e.maxHp=1000;e.sleep=100;}const [x,z]=SOCKETS[1];Object.assign(b.lantern,{x,z,tx:x,tz:z});Object.assign(a.lantern,{x:8,z:5,tx:8,tz:5});advance(a,1);advance(b,1);assert.ok(b.enemies[0].hp<a.enemies[0].hp);});
test('pause freezes currency, enemies, clock and lantern movement',()=>{const g=active();spawnEnemy(g,2);moveLantern(g,8,5);g.events.length=0;g.phase='paused';const before=JSON.stringify(g);advance(g,2);assert.equal(JSON.stringify(g),before);});
test('lantern movement is bounded and uses elapsed time',()=>{const g=createGame();startGame(g);moveLantern(g,999,-999);advance(g,5);assert.equal(g.lantern.x,8.8);assert.equal(g.lantern.z,-5.7);});
test('lullaby sleep is broken by damage with a grace period',()=>{const g=active();const e=spawnEnemy(g,2);e.sleep=2;damageEnemy(g,e,1);assert.equal(e.sleep,0);assert.ok(e.wakeGrace>0);});
test('an unprotected theatre loses and rejects further waves',()=>{const g=active();g.towers=[];g.lives=1;spawnEnemy(g,2,PATH_LENGTH-.01);advance(g,.2);assert.equal(g.phase,'lost');assert.equal(g.lives,0);assert.equal(beginWave(g),false);});
test('clearing the final hour produces dawn and stops combat',()=>{const g=active();g.wave=6;g.spawned=16;stepGame(g,1/60);assert.equal(g.phase,'won');const time=g.time;advance(g,2);assert.equal(g.time,time);});
test('wide orbit reaches a toy outside the basic top range',()=>{for(const branch of [null,'orbit']){const g=active();g.towers=[{slot:1,type:'top',branch,charge:0}];const e=spawnEnemy(g,2,5);const hp=e.hp;stepGame(g,1/60);assert.equal(e.hp<hp,branch==='orbit');}});
test('a bowling projectile can damage multiple enemies',()=>{const g=active();g.towers=[{slot:1,type:'top',branch:'bowling',charge:0}];const a=spawnEnemy(g,2,12),b=spawnEnemy(g,2,12.35);a.hp=b.hp=200;advance(g,.5);assert.ok(a.hp<200&&b.hp<200);});
// Distance 19.5 leaves enough listening time inside the diagonal support position.
test('lullaby actually puts an undamaged toy to sleep',()=>{const g=active();g.towers=[{slot:3,type:'music',branch:'lullaby',charge:0}];const e=spawnEnemy(g,2,19.5);advance(g,1.8);assert.ok(e.sleep>0);});
test('leaving lullaby range resets accumulated listening time',()=>{const g=active();g.towers=[{slot:3,type:'music',branch:'lullaby',charge:0}];const e=spawnEnemy(g,2,0);e.exposure=1;stepGame(g,1/60);assert.equal(e.exposure,0);});
test('the starter layout loses; investing and following ghosts can reach dawn',()=>{
  for(const mode of ['starter','stationary','ambush','moving']){
    const g=createGame();startGame(g);if(mode==='ambush')Object.assign(g.lantern,{x:-3.7,z:1.07,tx:-3.7,tz:1.07});if(mode!=='starter'){buildTower(g,0,'top');buildTower(g,4,'top');}
    let ticks=0;while(!['won','lost'].includes(g.phase)&&ticks<36000){
      if(g.phase==='build'){
        if(g.giftOffer)chooseNightGift(g,'encore'); // This policy has no Lullaby, preserving the baseline comparison.
        if(mode!=='starter'){for(const s of [0,1,4])upgradeTower(g,s,s===1?'bowling':'orbit');upgradeTower(g,3,'invitation');for(const s of [5,2])buildTower(g,s,'top');for(const s of [5,2])upgradeTower(g,s,'orbit');}
        beginWave(g);
      }
      // A player-like decision every 1.5 seconds, using the ordinary movement input.
      if(mode==='moving'&&ticks%90===0){
        const ghosts=g.enemies.filter(e=>e.kind==='ghost'&&g.towers.some(t=>t.type==='top'&&Math.hypot(e.x-SOCKETS[t.slot][0],e.z-SOCKETS[t.slot][1])<(t.branch==='orbit'?3.8:t.branch==='bowling'?4.2:2.65))).sort((a,b)=>b.distance-a.distance);
        const p=ghosts[0]?pointAt(ghosts[0].distance+.8):{x:-1,z:0};moveLantern(g,p.x,p.z);
      }
      stepGame(g,1/60);g.events.length=0;ticks++;
    }
    assert.equal(g.phase,mode==='moving'?'won':'lost');if(mode==='moving')assert.equal(g.ghostKills,20);
  }
});

test('wave previews match the actual roster and introduce ghosts after the opening wave',()=>{
  assert.equal(waveInfo(1).ghosts,0);assert.equal(waveInfo(7),undefined);
  for(let wave=1;wave<=6;wave++){
    const g=createGame();startGame(g);g.wave=wave-1;g.towers=[];beginWave(g);
    const plan=waveInfo(wave);for(let ticks=0;g.spawned<plan.roster.length&&ticks<3600;ticks++)stepGame(g,1/60);
    assert.equal(g.spawned,plan.roster.length);
    assert.deepEqual(g.enemies.map(e=>e.kind),plan.roster.map(e=>e.kind));
    assert.equal(g.enemies.filter(e=>e.kind==='ghost').length,plan.ghosts);
    assert.equal(plan.dolls+plan.ghosts+plan.drummers,plan.roster.length);
  }
});
test('ghost damage follows the current lantern position and closes immediately in darkness',()=>{
  const g=active(),e=spawnEnemy(g,0,1,'ghost'),hp=e.hp;
  assert.equal(canDamageEnemy(g,e),false);assert.equal(damageEnemy(g,e,4),false);assert.equal(e.hp,hp);
  Object.assign(g.lantern,{x:e.x,z:e.z,tx:e.x,tz:e.z});assert.equal(damageEnemy(g,e,4),true);assert.equal(e.hp,hp-4);
  Object.assign(g.lantern,{x:8,z:5,tx:8,tz:5});assert.equal(damageEnemy(g,e,4),false);assert.equal(e.hp,hp-4);
});
test('an immune ghost neither consumes a projectile hit nor blocks a later exposed hit',()=>{
  const g=active();g.towers=[];const e=spawnEnemy(g,0,12,'ghost');e.hp=e.maxHp=100;
  Object.assign(g.lantern,{x:8,z:5,tx:8,tz:5});const shot={x:e.x-.15,z:e.z,vx:6,vz:0,life:1,hit:new Set()};g.shots.push(shot);
  stepGame(g,1/60);assert.equal(e.hp,100);assert.equal(shot.hit.has(e.id),false);
  Object.assign(g.lantern,{x:e.x,z:e.z,tx:e.x,tz:e.z});stepGame(g,1/60);assert.equal(e.hp,89);assert.equal(shot.hit.has(e.id),true);
  stepGame(g,1/60);assert.equal(e.hp,89);
});
test('tops ignore hidden ghosts and keep attacking dolls in the same crowd',()=>{
  const g=active();g.towers=[{slot:1,type:'top',branch:null,charge:0}];Object.assign(g.lantern,{x:8,z:5,tx:8,tz:5});
  const ghost=spawnEnemy(g,0,12,'ghost'),doll=spawnEnemy(g,2,12.1),hp=ghost.hp,dollHp=doll.hp;
  stepGame(g,1/60);assert.equal(ghost.hp,hp);assert.ok(doll.hp<dollHp);
});
test('lullaby can hold a ghost in darkness and only a real hit wakes it',()=>{
  const g=active();g.towers=[{slot:3,type:'music',branch:'lullaby',charge:0}];Object.assign(g.lantern,{x:-8,z:5,tx:-8,tz:5});
  const e=spawnEnemy(g,0,19.5,'ghost');advance(g,1.8);assert.ok(e.sleep>0);const sleep=e.sleep;
  damageEnemy(g,e,1);assert.equal(e.sleep,sleep);
  Object.assign(g.lantern,{x:e.x,z:e.z,tx:e.x,tz:e.z});damageEnemy(g,e,1);assert.equal(e.sleep,0);assert.ok(e.wakeGrace>0);
});
test('a defeated ghost gives one reward and no nested doll',()=>{
  const g=active(),e=spawnEnemy(g,0,1,'ghost'),coins=g.coins;Object.assign(g.lantern,{x:e.x,z:e.z,tx:e.x,tz:e.z});
  damageEnemy(g,e,999);damageEnemy(g,e,999);assert.equal(g.coins,coins+7);assert.equal(g.ghostKills,1);assert.equal(g.kills,1);assert.equal(g.enemies.filter(e=>!e.dead).length,0);
  assert.equal(g.events.filter(e=>e.type==='pop'&&e.kind==='ghost').length,1);
});
test('a leaking ghost costs two light and cannot advance past dawn',()=>{
  const g=active();g.towers=[];spawnEnemy(g,0,PATH_LENGTH-.01,'ghost');stepGame(g,1/60);assert.equal(g.lives,10);
  g.phase='build';g.wave=6;assert.equal(beginWave(g),false);
});
test('pause freezes an exposed ghost and the moving lantern',()=>{
  const g=active(),e=spawnEnemy(g,0,3,'ghost');Object.assign(g.lantern,{x:e.x,z:e.z,tx:e.x+1,tz:e.z});g.phase='paused';g.events.length=0;
  const before=JSON.stringify(g);advance(g,1);assert.equal(JSON.stringify(g),before);assert.equal(canDamageEnemy(g,e),true);
});
