import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startGame,beginWave,stepGame,spawnEnemy,damageEnemy,chooseNightGift,buildTower,upgradeTower,moveLantern,pointAt,towerRange,onLight,canDamageEnemy,PATH_LENGTH,SOCKETS,waveInfo} from '../game/sim.js';
import {GIFT_IDS,giftInfo} from '../game/night-gifts.js';
const advance=(g,seconds)=>{for(let i=0;i<Math.ceil(seconds*60);i++)stepGame(g,1/60);};
function active(wave=2){const g=createGame();startGame(g);g.wave=wave-1;beginWave(g);g.spawned=waveInfo(wave).roster.length;g.spawnClock=999;g.towers=[];return g;}
function shine(g,p){Object.assign(g.lantern,{x:p.x,z:p.z,tx:p.x,tz:p.z});}
function offer(g,wave){g.phase='wave';g.wave=wave;g.spawned=waveInfo(wave).roster.length;g.enemies=[];stepGame(g,1/60);}

test('one free gift after hours 1, 3 and 5; no early, duplicate, paused or invalid choices',()=>{
  const g=createGame();startGame(g);const coins=g.coins;
  assert.equal(chooseNightGift(g,'encore'),false);assert.equal(beginWave(g),true);
  for(let wave=1;wave<=6;wave++){
    offer(g,wave);
    assert.equal(g.giftOffer,[1,3,5].includes(wave)?wave:0);
    if(g.giftOffer){
      const before=g.coins;
      assert.equal(beginWave(g),false);assert.equal(chooseNightGift(g,'constructor'),false);
      g.phase='paused';assert.equal(chooseNightGift(g,'encore'),false);g.phase='build';
      assert.equal(chooseNightGift(g,'encore'),true);assert.equal(chooseNightGift(g,'encore'),false);
      assert.equal(g.coins,before);
    }
    if(wave<6)assert.equal(beginWave(g),true);
  }
  assert.equal(g.nightGifts.encore,3);assert.equal(g.giftHistory.length,3);
  assert.equal(g.phase,'won');assert.equal(chooseNightGift(g,'ghostlight'),false);assert.ok(g.coins>coins);
});

test('all three cards remain valid at each offer, allowing a mixed build or rank III',()=>{
  for(const choices of [['encore','overwound','ghostlight'],['overwound','overwound','overwound']]){
    const g=createGame();startGame(g);
    for(const [index,wave] of [1,3,5].entries()){
      offer(g,wave);for(const id of GIFT_IDS)assert.ok(giftInfo(id,g.nightGifts[id]+1));
      assert.equal(chooseNightGift(g,choices[index]),true);
    }
    assert.equal(Object.values(g.nightGifts).reduce((a,b)=>a+b,0),3);
  }
  assert.equal(giftInfo('overwound',4),undefined);
});

test('Encore damages nearby toys once, wakes them, and cannot recursively trigger itself',()=>{
  const g=active();g.nightGifts.encore=2;
  const source=spawnEnemy(g,2,5),a=spawnEnemy(g,2,5.5),b=spawnEnemy(g,2,6),outside=spawnEnemy(g,2,12);
  for(const enemy of [source,a,b,outside]){enemy.hp=100;enemy.sleep=2;}
  damageEnemy(g,source,1);
  assert.equal(source.hp,99);assert.equal(a.hp,90);assert.equal(b.hp,90);assert.equal(outside.hp,100);
  assert.equal(a.sleep,0);assert.ok(a.wakeGrace>0);assert.equal(g.encoreBursts,1);
  damageEnemy(g,source,1);assert.equal(g.encoreBursts,1);
});

test('a lethal Encore wake triggers once and does not splash its own newborn shell',()=>{
  const g=active();g.nightGifts.encore=3;
  const source=spawnEnemy(g,2,5),nearby=spawnEnemy(g,2,5.5);source.sleep=2;nearby.hp=100;
  damageEnemy(g,source,999);
  const child=g.enemies.find(e=>e!==source&&e!==nearby);
  assert.equal(nearby.hp,86);assert.equal(child.hp,child.maxHp);assert.equal(g.encoreBursts,1);
});

test('Encore respects hidden ghosts and requires damage to wake its source',()=>{
  const g=active();g.nightGifts.encore=1;shine(g,{x:8,z:5});
  const ghost=spawnEnemy(g,0,5,'ghost'),doll=spawnEnemy(g,2,5.5);ghost.sleep=2;doll.sleep=2;
  const hp=ghost.hp;damageEnemy(g,ghost,1);assert.equal(g.encoreBursts,0);assert.equal(ghost.sleep,2);
  damageEnemy(g,doll,1);assert.equal(ghost.hp,hp);assert.equal(ghost.sleep,2);assert.equal(g.encoreBursts,1);
});

test('a real Lullaby and orbit pair produces Encore during simulation',()=>{
  const g=active(4);g.nightGifts.encore=1;shine(g,{x:8,z:5});
  // On the opening bend, music at the inside mount overlaps the next top's orbit.
  g.towers=[{slot:0,type:'music',branch:'lullaby',charge:0},{slot:1,type:'top',branch:'orbit',charge:0}];
  const toy=spawnEnemy(g,2,6.5);toy.hp=toy.maxHp=1000;
  advance(g,4);assert.ok(g.encoreBursts>0);assert.ok(toy.hp<1000);
});

test('Overwound increases real attack cadence but reduces current and future top ranges',()=>{
  const outcomes=[];
  for(const rank of [0,2]){
    const g=active();g.nightGifts.overwound=rank;shine(g,{x:8,z:5});
    g.towers=[{slot:1,type:'top',branch:'orbit',charge:0}];
    const e=spawnEnemy(g,2,12);e.hp=e.maxHp=1000;
    advance(g,2);outcomes.push(e.hp);
    assert.ok(Math.abs(towerRange(g,g.towers[0])-3.8*(rank? .8:1))<1e-8);
    const future={type:'top',branch:null};assert.ok(Math.abs(towerRange(g,future)-2.65*(rank?.8:1))<1e-8);
    assert.equal(towerRange(g,{type:'music',branch:'lullaby'}),3.05);
  }
  assert.ok(outcomes[1]<outcomes[0]);
});

test('Overwound really loses edge targets and shortens bowling flight',()=>{
  for(const rank of [0,3]){
    const g=active();g.nightGifts.overwound=rank;g.towers=[{slot:1,type:'top',branch:null,charge:0}];
    const enemy=spawnEnemy(g,2,14),hp=enemy.hp;stepGame(g,1/60);
    assert.equal(enemy.hp<hp,rank===0);
  }
  const g=active();g.nightGifts.overwound=3;g.towers=[{slot:1,type:'top',branch:'bowling',charge:0}];
  spawnEnemy(g,2,12);stepGame(g,1/60);assert.equal(g.shots.length,1);
  assert.ok(Math.abs(g.shots[0].life-(.7*.7-1/60))<1e-8);
});

test('defeated ghosts leave a correctly ranked light pool once; dolls and escapes do not',()=>{
  for(const rank of [1,2,3]){
    const g=active();g.nightGifts.ghostlight=rank;const ghost=spawnEnemy(g,0,5,'ghost');shine(g,ghost);
    damageEnemy(g,ghost,999);damageEnemy(g,ghost,999);
    assert.equal(g.ghostlights.length,1);const patch=g.ghostlights[0],info=giftInfo('ghostlight',rank);
    assert.deepEqual([patch.x,patch.z,patch.radius,patch.life],[ghost.x,ghost.z,info.radius,info.duration]);
    damageEnemy(g,spawnEnemy(g,0,5),999);assert.equal(g.ghostlights.length,1);
    spawnEnemy(g,0,PATH_LENGTH-.01,'ghost');stepGame(g,1/60);assert.equal(g.ghostlights.length,1);
  }
});

test('Ghostlight reveals the next ghost away from the lantern and expires during preparation',()=>{
  const g=active();g.nightGifts.ghostlight=1;
  const first=spawnEnemy(g,0,5,'ghost'),second=spawnEnemy(g,0,5.8,'ghost');shine(g,first);damageEnemy(g,first,999);
  shine(g,{x:8,z:5});assert.equal(canDamageEnemy(g,second),true);
  g.phase='build';advance(g,3.1);assert.equal(g.ghostlights.length,0);assert.equal(canDamageEnemy(g,second),false);
});

test('Ghostlight speeds up enemies and boosts tops; overlapping lights never multiply the boost',()=>{
  const states=[];
  for(const lighting of ['dark','patch','both']){
    const g=active();shine(g,{x:8,z:5});g.towers=[{slot:1,type:'top',branch:'orbit',charge:1}];
    const enemy=spawnEnemy(g,2,12),[x,z]=SOCKETS[1];
    if(lighting!=='dark')g.ghostlights.push({id:1,x,z,radius:2.2,life:3,duration:3});
    if(lighting==='both')shine(g,{x,z});
    stepGame(g,1/60);states.push({distance:enemy.distance,charge:g.towers[0].charge});
  }
  assert.ok(states[1].distance>states[0].distance);assert.ok(states[1].charge<states[0].charge);
  assert.deepEqual(states[1],states[2]);
});

test('Encore and Ghostlight combine: a revealed sleeping ghost can leave light for the splash',()=>{
  const g=active();g.nightGifts.encore=3;g.nightGifts.ghostlight=1;
  const source=spawnEnemy(g,0,5,'ghost'),next=spawnEnemy(g,0,6,'ghost');
  source.hp=1;source.sleep=2;next.hp=10;
  // Only the source is in the moving lantern; its new pool reaches the other ghost.
  shine(g,{x:source.x,z:source.z-2.5});assert.equal(onLight(g,next),false);
  damageEnemy(g,source,1);
  assert.equal(g.ghostKills,2);assert.equal(g.ghostlights.length,2);assert.equal(g.encoreBursts,1);
});

test('pause freezes pools and gift state; restarting creates a fresh unmodified night',()=>{
  const g=active();g.nightGifts.ghostlight=3;const e=spawnEnemy(g,0,5,'ghost');shine(g,e);damageEnemy(g,e,999);
  g.phase='paused';const before=JSON.stringify(g);advance(g,2);assert.equal(JSON.stringify(g),before);
  const fresh=createGame();assert.deepEqual(Object.values(fresh.nightGifts),[0,0,0]);assert.equal(fresh.ghostlights.length,0);
  assert.equal(fresh.giftOffer,0);assert.equal(fresh.giftHistory.length,0);assert.equal(fresh.encoreBursts,0);
});

test('Ghostlight pools stay bounded during a burst of ghost defeats',()=>{
  const g=active();g.nightGifts.ghostlight=3;
  for(let i=0;i<12;i++){const e=spawnEnemy(g,0,5+i*.1,'ghost');shine(g,e);damageEnemy(g,e,999);}
  assert.equal(g.ghostlights.length,8);assert.equal(g.ghostlightsCreated,12);
  assert.equal(new Set(g.ghostlights.map(light=>light.id)).size,8);
});


test('economy-valid specialized and mixed gift builds can complete the full night',()=>{
  for(const picks of [['encore','encore','encore'],['overwound','overwound','overwound'],['ghostlight','ghostlight','ghostlight'],['ghostlight','encore','overwound']]){
    const g=createGame();startGame(g);buildTower(g,0,'top');buildTower(g,4,'top');let ticks=0;
    while(!['won','lost'].includes(g.phase)&&ticks<36000){
      if(g.phase==='build'){
        if(g.giftOffer)assert.equal(chooseNightGift(g,picks[g.giftHistory.length]),true);
        // Encore needs orbit coverage around sleepers; the other builds use the diagonal bowling lane.
        for(const slot of [0,1,4])upgradeTower(g,slot,slot===1&&!picks.includes('encore')?'bowling':'orbit');
        upgradeTower(g,3,picks.includes('encore')?'lullaby':'invitation');
        for(const slot of [5,2])buildTower(g,slot,'top');for(const slot of [5,2])upgradeTower(g,slot,'orbit');
        assert.equal(beginWave(g),true);
      }
      if(ticks%90===0){
        const target=g.enemies.filter(e=>e.kind==='ghost'&&g.towers.some(t=>t.type==='top'&&Math.hypot(e.x-SOCKETS[t.slot][0],e.z-SOCKETS[t.slot][1])<towerRange(g,t))).sort((a,b)=>b.distance-a.distance)[0];
        // Between ghosts, light a defense attacking the leading doll, using the same 1.5-second decisions.
        const lead=g.enemies.filter(e=>e.kind!=='ghost').sort((a,b)=>b.distance-a.distance)[0];
        const top=lead&&g.towers.find(t=>t.type==='top'&&Math.hypot(lead.x-SOCKETS[t.slot][0],lead.z-SOCKETS[t.slot][1])<towerRange(g,t));
        const p=target?pointAt(target.distance+.8):top?{x:SOCKETS[top.slot][0],z:SOCKETS[top.slot][1]}:{x:-1,z:0};moveLantern(g,p.x,p.z);
      }
      stepGame(g,1/60);g.events.length=0;ticks++;
    }
    assert.equal(g.phase,'won',picks.join(' / '));assert.equal(g.ghostKills,20);assert.ok(g.coins>=0);
    assert.deepEqual(g.giftHistory.map(p=>p.id),picks);
    if(picks.includes('encore'))assert.ok(g.encoreBursts>0);
    if(picks.includes('ghostlight'))assert.ok(g.ghostlightsCreated>0);
  }
});
