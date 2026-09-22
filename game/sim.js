import {GIFT_HOURS,giftInfo} from './night-gifts.js';
// Pure simulation: renderer and input both consume this state, never drive rules themselves.
import {PATH} from './route.js';
export {PATH};
// Opening bend, diagonal lane, entrance, central support, far bend, final approach.
export const SOCKETS=[[-6.3,0.6],[-4.3,2.05],[-6.2,-2.3],[3.4,-0.8],[2,-4.2],[5.9,-1]];
export const COST={top:36,music:42};
export const UPGRADE_COST=42;
export const LIGHT_RADIUS=2.55;
export const DRUM={radius:3,interval:4.6,windup:1.1,duration:1.4,boost:1.3};
// The preview and spawner share one roster, including the order of arrivals.
const ghostSlots=[[],[1,5],[1,4,8],[1,4,7,10],[1,3,6,9,12],[1,3,6,9,12,14]];
const drummerSlots=[[],[],[2],[3],[2,8],[2,8]];
const waveTitles=['A rustle in the wings.','Something in the paper.','A drum behind the curtain.','No one is sleeping.','Just a little longer.','The last dark hour.'];
const waveHints=['Build your toys. Broken dolls release smaller, faster dolls.',
  'New: paper ghosts. Move your light onto them so tops can hit them.',
  'New: Tin Drummer. Its beat speeds nearby toys. A Lullaby interrupts the wind-up.',
  'Lullabies interrupt drums and hold ghosts while you bring the light around.',
  'Two drummers. Keep ghosts lit and use music to break the march.',
  'Six ghosts in the final hour. Follow them through your defenses.'];
const waves=ghostSlots.map((slots,index)=>{
  const roster=Array.from({length:6+index*2},(_,i)=>({kind:slots.includes(i)?'ghost':drummerSlots[index].includes(i)?'drummer':'doll',tier:index===0&&i%3===0?1:2}));
  return {number:index+1,title:waveTitles[index],hint:waveHints[index],roster,dolls:roster.length-slots.length-drummerSlots[index].length,ghosts:slots.length,drummers:drummerSlots[index].length};
});
export function waveInfo(wave){return waves[wave-1];}
export function canDamageEnemy(g,e){return !e.dead&&(e.kind!=='ghost'||onLight(g,e));}
const lengths=PATH.slice(1).map((p,i)=>Math.hypot(p[0]-PATH[i][0],p[1]-PATH[i][1]));
export const PATH_LENGTH=lengths.reduce((a,b)=>a+b,0);
export function pointAt(distance){
  if(distance>=PATH_LENGTH){
    const a=PATH.at(-2),b=PATH.at(-1);return {x:b[0],z:b[1],angle:Math.atan2(b[0]-a[0],b[1]-a[1])};
  }
  let d=Math.max(0,distance);
  for(let i=0;i<lengths.length;i++){
    if(d<=lengths[i]||i===lengths.length-1){const t=d/lengths[i];return {x:PATH[i][0]+(PATH[i+1][0]-PATH[i][0])*t,z:PATH[i][1]+(PATH[i+1][1]-PATH[i][1])*t,angle:Math.atan2(PATH[i+1][0]-PATH[i][0],PATH[i+1][1]-PATH[i][1])};}
    d-=lengths[i];
  }
}
export function onLight(game,p){return Math.hypot(p.x-game.lantern.x,p.z-game.lantern.z)<LIGHT_RADIUS||game.ghostlights.some(light=>light.life>0&&Math.hypot(p.x-light.x,p.z-light.z)<light.radius);}
export function towerRange(g,t){
  const range=t.type==='music'?(t.branch==='invitation'?3.8:3.05):t.branch==='orbit'?3.8:t.branch==='bowling'?4.2:2.65;
  return range*(t.type==='top'?(giftInfo('overwound',g.nightGifts.overwound)?.reach??1):1);
}
export function chooseNightGift(g,id){
  if(g.phase!=='build'||!GIFT_HOURS.includes(g.giftOffer)||g.giftOffer!==g.wave||g.giftHistory.some(p=>p.wave===g.wave))return false;
  if(!Object.hasOwn(g.nightGifts,id)||!giftInfo(id,g.nightGifts[id]+1))return false;
  const rank=++g.nightGifts[id];g.giftHistory.push({wave:g.wave,id,rank});g.giftOffer=0;
  g.events.push({type:'gift',id,rank});return true;
}
export function createGame(){return {phase:'title',wave:0,lives:12,coins:76,kills:0,ghostKills:0,drummerKills:0,drumBeats:0,time:0,waveTime:0,spawned:0,spawnClock:0,nextId:1,enemies:[],towers:[{id:1,slot:1,type:'top',branch:null,charge:0},{id:2,slot:3,type:'music',branch:null,charge:0}],shots:[],events:[],nightGifts:{encore:0,overwound:0,ghostlight:0},giftOffer:0,giftHistory:[],ghostlights:[],nextLightId:1,encoreBursts:0,ghostlightsCreated:0,lantern:{x:-1,z:0,tx:-1,tz:0,speed:0},lastReward:0,selected:null};}
export function startGame(g){if(g.phase==='title')g.phase='build';}
export function beginWave(g){if(g.phase!=='build'||g.giftOffer||!waveInfo(g.wave+1))return false;g.phase='wave';g.wave++;g.waveTime=0;g.spawned=0;g.spawnClock=0;g.events.push({type:'wave',wave:g.wave});return true;}
export function buildTower(g,slot,type){
  if(!['build','wave'].includes(g.phase)||!Number.isInteger(slot)||!SOCKETS[slot]||!Object.hasOwn(COST,type)||g.towers.some(t=>t.slot===slot)||g.coins<COST[type])return false;
  g.coins-=COST[type];g.towers.push({id:++g.nextId+1000,slot,type,branch:null,charge:0});g.events.push({type:'build',slot});return true;
}
export function upgradeTower(g,slot,branch){
  const t=g.towers.find(t=>t.slot===slot);if(!['build','wave'].includes(g.phase)||!t||t.branch||g.coins<UPGRADE_COST||!(t.type==='top'?['bowling','orbit']:['lullaby','invitation']).includes(branch))return false;
  t.branch=branch;g.coins-=UPGRADE_COST;g.events.push({type:'upgrade',slot});return true;
}
export function sellTower(g,slot){const t=g.towers.find(t=>t.slot===slot);if(!t||!['build','wave'].includes(g.phase))return false;g.coins+=Math.floor((COST[t.type]+(t.branch?UPGRADE_COST:0))*.65);g.towers=g.towers.filter(a=>a!==t);return true;}
export function moveLantern(g,x,z){g.lantern.tx=Math.max(-8.8,Math.min(8.8,x));g.lantern.tz=Math.max(-5.7,Math.min(5.7,z));}
export function spawnEnemy(g,tier=2,distance=0,kind='doll'){
  const p=pointAt(distance),ghost=kind==='ghost',drummer=kind==='drummer';
  const hp=ghost?([0,18,24,32,44,60,76][g.wave]??76):(drummer?40:[6,12,22][tier])*([1,1,1.5,2.3,3.5,5,7][g.wave]??7);
  const e={id:++g.nextId,kind,tier:ghost?0:drummer?2:tier,hp,maxHp:hp,distance,...p,age:0,slow:0,sleep:0,exposure:0,wakeGrace:0,hit:0,march:0,...(drummer?{drumClock:2.3}: {})};
  g.enemies.push(e);return e;
}
export function damageEnemy(g,e,amount,allowEncore=true){
  if(amount<=0||!canDamageEnemy(g,e))return false;
  const encore=e.sleep>0&&allowEncore?giftInfo('encore',g.nightGifts.encore):null;
  // Snapshot before a shell breaks: its newborn does not take this same shockwave.
  const audience=encore?g.enemies.filter(other=>other!==e&&!other.dead&&Math.hypot(other.x-e.x,other.z-e.z)<encore.radius):[];
  e.hp-=amount;e.hit=.14;
  if(e.sleep>0){e.sleep=0;e.exposure=0;e.wakeGrace=1.2;}
  if(e.hp<=0){
    e.dead=true;g.kills++;if(e.kind==='ghost')g.ghostKills++;if(e.kind==='drummer')g.drummerKills++;
    g.coins+=e.kind==='ghost'?7:e.kind==='drummer'?6:e.tier===0?4:1;
    g.events.push({type:'pop',x:e.x,z:e.z,tier:e.tier,kind:e.kind});
    if(e.kind==='doll'&&e.tier>0)spawnEnemy(g,e.tier-1,e.distance);
    const light=e.kind==='ghost'?giftInfo('ghostlight',g.nightGifts.ghostlight):null;
    if(light){
      g.ghostlights.push({id:g.nextLightId++,x:e.x,z:e.z,radius:light.radius,life:light.duration,duration:light.duration});
      if(g.ghostlights.length>8)g.ghostlights.shift();g.ghostlightsCreated++;
      g.events.push({type:'ghostlight',x:e.x,z:e.z,r:light.radius});
    }
  }
  if(encore){
    g.encoreBursts++;g.events.push({type:'encore',x:e.x,z:e.z,r:encore.radius});
    for(const other of audience)damageEnemy(g,other,encore.damage,false);
  }
  return true;
}
export function stepGame(g,dt){
  if(!Number.isFinite(dt)||dt<=0||g.phase==='paused'||g.phase==='won'||g.phase==='lost'||g.phase==='title')return;
  dt=Math.min(dt,.1);g.time+=dt;
  for(const light of g.ghostlights)light.life-=dt;g.ghostlights=g.ghostlights.filter(light=>light.life>0);
  const l=g.lantern,dx=l.tx-l.x,dz=l.tz-l.z,dist=Math.hypot(dx,dz),step=Math.min(dist,dt*6);
  if(dist>.001){l.x+=dx/dist*step;l.z+=dz/dist*step;}l.speed=step/dt;
  if(g.phase!=='wave')return;
  g.waveTime+=dt;g.spawnClock-=dt;
  const roster=waveInfo(g.wave).roster,count=roster.length;
  if(g.spawned<count&&g.spawnClock<=0){const entry=roster[g.spawned];spawnEnemy(g,entry.tier,0,entry.kind);g.spawned++;g.spawnClock=Math.max(.8,2.4-g.wave*.16);}
  for(const e of g.enemies){e.slow=0;e.march=Math.max(0,e.march-dt);e.hearing=false;e.age+=dt;e.hit=Math.max(0,e.hit-dt);e.sleep=Math.max(0,e.sleep-dt);e.wakeGrace=Math.max(0,e.wakeGrace-dt);}
  // Music applies before movement and attacks. Sleeping enemies wake on damage.
  for(const t of g.towers.filter(t=>t.type==='music')){
    const [x,z]=SOCKETS[t.slot],lit=onLight(g,{x,z}),range=towerRange(g,t);
    for(const e of g.enemies){
      if(e.dead||Math.hypot(e.x-x,e.z-z)>range)continue;
      e.slow=Math.max(e.slow,t.branch==='invitation'?(lit?.25:.15):lit?.6:.42);
      if(t.branch==='lullaby')e.hearing=true;
      if(t.branch==='lullaby'&&e.wakeGrace<=0&&e.sleep<=0){e.exposure+=dt*(lit?2:1);if(e.exposure>=1.5){e.sleep=2.6;e.exposure=0;g.events.push({type:'sleep',x:e.x,z:e.z});}}
      if(t.branch==='invitation'){
        // Attraction pulls enemies backward along their route when they have passed the box.
        const back=pointAt(e.distance-.3);if(Math.hypot(back.x-x,back.z-z)<Math.hypot(e.x-x,e.z-z))e.slow=Math.max(e.slow,lit?.9:.78);
      }
    }
  }
  // A sleeping drummer drops its wind-up. Beats refresh one brief boost, never stack it.
  for(const drummer of g.enemies){
    if(drummer.dead||drummer.kind!=='drummer')continue;
    if(drummer.sleep>0){drummer.drumClock=DRUM.interval;continue;}
    drummer.drumClock-=dt;
    if(drummer.drumClock<=0){
      drummer.drumClock=DRUM.interval;g.drumBeats++;
      for(const e of g.enemies)if(!e.dead&&e.kind!=='drummer'&&Math.hypot(e.x-drummer.x,e.z-drummer.z)<=DRUM.radius)e.march=DRUM.duration;
      g.events.push({type:'drum',x:drummer.x,z:drummer.z,r:DRUM.radius});
    }
  }
  for(const e of g.enemies){
    if(e.dead)continue;
    if(!e.hearing)e.exposure=0;
    const speed=(e.kind==='ghost'?1.05:e.kind==='drummer'?.72:[1.48,1.04,.78][e.tier])*(1+g.wave*.055)*(onLight(g,e)?1.65:1)*(e.march>0?DRUM.boost:1)*(1-e.slow);
    if(e.sleep<=0&&!(e.kind==='drummer'&&e.drumClock<=DRUM.windup))e.distance+=speed*dt;
    Object.assign(e,pointAt(e.distance));
    if(e.distance>=PATH_LENGTH){e.dead=true;g.lives-=e.kind==='ghost'?2:e.tier+1;g.events.push({type:'leak',x:e.x,z:e.z,kind:e.kind});}
  }
  for(const t of g.towers.filter(t=>t.type==='top')){
    const [x,z]=SOCKETS[t.slot],boost=onLight(g,{x,z})?2:1;
    const winding=giftInfo('overwound',g.nightGifts.overwound);
    t.charge-=dt*boost*(winding?.rate??1);
    const range=towerRange(g,t);
    const targets=g.enemies.filter(e=>canDamageEnemy(g,e)&&Math.hypot(e.x-x,e.z-z)<=range).sort((a,b)=>b.distance-a.distance);
    if(!targets.length||t.charge>0)continue;
    if(t.branch==='bowling'){
      const e=targets[0],vx=e.x-x,vz=e.z-z,d=Math.hypot(vx,vz)||1;
      g.shots.push({x,z,vx:vx/d*10,vz:vz/d*10,life:.7*(winding?.reach??1),hit:new Set()});t.charge=1.25;g.events.push({type:'launch',towerId:t.id,x,z,dx:vx/d,dz:vz/d});
    }else if(t.branch==='orbit'){
      t.charge=.52;for(const e of targets)damageEnemy(g,e,2.8);g.events.push({type:'spin',towerId:t.id,x,z,r:range});
    }else{t.charge=.48;for(const e of targets)damageEnemy(g,e,3.2);g.events.push({type:'spin',towerId:t.id,x,z,r:range});}
  }
  for(const s of g.shots){s.x+=s.vx*dt;s.z+=s.vz*dt;s.life-=dt;for(const e of g.enemies){if(!e.dead&&!s.hit.has(e.id)&&Math.hypot(e.x-s.x,e.z-s.z)<.85){if(damageEnemy(g,e,11))s.hit.add(e.id);}}}
  g.shots=g.shots.filter(s=>s.life>0);g.enemies=g.enemies.filter(e=>!e.dead);
  if(g.lives<=0){g.lives=0;g.phase='lost';g.events.push({type:'end',won:false});return;}
  if(g.spawned>=count&&!g.enemies.length){
    if(g.wave>=6){g.phase='won';g.events.push({type:'end',won:true});}
    else{g.phase='build';g.lastReward=18+g.wave*3;g.coins+=g.lastReward;if(GIFT_HOURS.includes(g.wave))g.giftOffer=g.wave;g.events.push({type:'clear',reward:g.lastReward});}
  }
}
