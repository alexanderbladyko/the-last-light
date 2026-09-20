import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startGame,beginWave,buildTower,upgradeTower,stepGame,spawnEnemy,damageEnemy,moveLantern,pointAt,PATH,PATH_LENGTH,SOCKETS} from '../game/sim.js';
const advance=(g,seconds)=>{for(let i=0;i<seconds*60;i++){stepGame(g,1/60);g.events.length=0;}};
function active(){const g=createGame();startGame(g);beginWave(g);g.spawned=6;g.spawnClock=999;return g;}
test('route begins and ends at the displayed gates',()=>{assert.deepEqual([pointAt(0).x,pointAt(0).z],PATH[0]);assert.deepEqual([pointAt(PATH_LENGTH).x,pointAt(PATH_LENGTH).z],PATH.at(-1));});
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
test('lullaby actually puts an undamaged toy to sleep',()=>{const g=active();g.towers=[{slot:3,type:'music',branch:'lullaby',charge:0}];const e=spawnEnemy(g,2,23.3);advance(g,1.8);assert.ok(e.sleep>0);});
test('leaving lullaby range resets accumulated listening time',()=>{const g=active();g.towers=[{slot:3,type:'music',branch:'lullaby',charge:0}];const e=spawnEnemy(g,2,0);e.exposure=1;stepGame(g,1/60);assert.equal(e.exposure,0);});
test('the starter layout loses; investment in a complete layout can reach dawn',()=>{
  for(const upgraded of [false,true]){
    const g=createGame();startGame(g);if(upgraded){buildTower(g,0,'top');buildTower(g,4,'top');}
    let ticks=0;while(!['won','lost'].includes(g.phase)&&ticks<36000){
      if(g.phase==='build'){
        if(upgraded){for(const s of [0,1,4])upgradeTower(g,s,s===1?'bowling':'orbit');upgradeTower(g,3,'invitation');for(const s of [5,2])buildTower(g,s,'top');for(const s of [5,2])upgradeTower(g,s,'orbit');}
        beginWave(g);
      }
      stepGame(g,1/60);g.events.length=0;ticks++;
    }
    assert.equal(g.phase,upgraded?'won':'lost');if(!upgraded)assert.ok(g.wave<=4);
  }
});
