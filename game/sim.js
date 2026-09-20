// Pure simulation: renderer and input both consume this state, never drive rules themselves.
export const PATH=[[-8,-4.1],[-5,-4.1],[-5,2.7],[0,2.7],[0,-2.8],[5.3,-2.8],[5.3,3.6],[8,3.6]];
export const SOCKETS=[[-6.9,-1],[-2.7,0.7],[-2.7,-3.5],[2.7,-0.4],[3,3.8],[7.3,0.4]];
export const COST={top:36,music:42};
export const UPGRADE_COST=42;
export const LIGHT_RADIUS=2.55;
const lengths=PATH.slice(1).map((p,i)=>Math.hypot(p[0]-PATH[i][0],p[1]-PATH[i][1]));
export const PATH_LENGTH=lengths.reduce((a,b)=>a+b,0);
export function pointAt(distance){
  let d=Math.max(0,Math.min(PATH_LENGTH,distance));
  for(let i=0;i<lengths.length;i++){
    if(d<=lengths[i]||i===lengths.length-1){const t=d/lengths[i];return {x:PATH[i][0]+(PATH[i+1][0]-PATH[i][0])*t,z:PATH[i][1]+(PATH[i+1][1]-PATH[i][1])*t,angle:Math.atan2(PATH[i+1][0]-PATH[i][0],PATH[i+1][1]-PATH[i][1])};}
    d-=lengths[i];
  }
}
export function onLight(game,p){return Math.hypot(p.x-game.lantern.x,p.z-game.lantern.z)<LIGHT_RADIUS;}
export function createGame(){return {phase:'title',wave:0,lives:12,coins:76,kills:0,time:0,waveTime:0,spawned:0,spawnClock:0,nextId:1,enemies:[],towers:[{id:1,slot:1,type:'top',branch:null,charge:0},{id:2,slot:3,type:'music',branch:null,charge:0}],shots:[],events:[],lantern:{x:-1,z:0,tx:-1,tz:0,speed:0},lastReward:0,selected:null};}
export function startGame(g){if(g.phase==='title')g.phase='build';}
export function beginWave(g){if(g.phase!=='build')return false;g.phase='wave';g.wave++;g.waveTime=0;g.spawned=0;g.spawnClock=0;g.events.push({type:'wave',wave:g.wave});return true;}
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
export function spawnEnemy(g,tier=2,distance=0){const p=pointAt(distance);const hp=[6,12,22][tier]*(1+Math.max(0,g.wave-2)*.09);const e={id:++g.nextId,tier,hp,maxHp:hp,distance,...p,age:0,slow:0,sleep:0,exposure:0,wakeGrace:0,hit:0};g.enemies.push(e);return e;}
export function damageEnemy(g,e,amount){if(e.dead||e.sleep>0&&amount<=0)return;e.hp-=amount;e.hit=.14;if(e.sleep>0){e.sleep=0;e.exposure=0;e.wakeGrace=1.2;}if(e.hp>0)return;e.dead=true;g.kills++;g.coins+=e.tier===0?4:1;g.events.push({type:'pop',x:e.x,z:e.z,tier:e.tier});if(e.tier>0)spawnEnemy(g,e.tier-1,e.distance);}
export function stepGame(g,dt){
  if(!Number.isFinite(dt)||dt<=0||g.phase==='paused'||g.phase==='won'||g.phase==='lost'||g.phase==='title')return;
  dt=Math.min(dt,.1);g.time+=dt;
  const l=g.lantern,dx=l.tx-l.x,dz=l.tz-l.z,dist=Math.hypot(dx,dz),step=Math.min(dist,dt*6);
  if(dist>.001){l.x+=dx/dist*step;l.z+=dz/dist*step;}l.speed=step/dt;
  if(g.phase!=='wave')return;
  g.waveTime+=dt;g.spawnClock-=dt;
  const count=4+g.wave*2;
  if(g.spawned<count&&g.spawnClock<=0){spawnEnemy(g,g.wave===1&&g.spawned%3===0?1:2);g.spawned++;g.spawnClock=Math.max(.8,2.4-g.wave*.16);}
  for(const e of g.enemies){e.slow=0;e.age+=dt;e.hit=Math.max(0,e.hit-dt);e.sleep=Math.max(0,e.sleep-dt);e.wakeGrace=Math.max(0,e.wakeGrace-dt);}
  // Music applies before movement and attacks. Sleeping enemies wake on damage.
  for(const t of g.towers.filter(t=>t.type==='music')){
    const [x,z]=SOCKETS[t.slot],lit=onLight(g,{x,z}),range=t.branch==='invitation'?3.8:3.05;
    for(const e of g.enemies){
      if(e.dead||Math.hypot(e.x-x,e.z-z)>range)continue;
      e.slow=Math.max(e.slow,t.branch==='invitation'?.15:lit?.6:.42);
      if(t.branch==='lullaby'&&e.wakeGrace<=0&&e.sleep<=0){e.exposure+=dt*(lit?2:1);if(e.exposure>=1.5){e.sleep=2.6;e.exposure=0;g.events.push({type:'sleep',x:e.x,z:e.z});}}
      if(t.branch==='invitation'){
        // Attraction pulls enemies backward along their route when they have passed the box.
        const back=pointAt(e.distance-.3);if(Math.hypot(back.x-x,back.z-z)<Math.hypot(e.x-x,e.z-z))e.slow=Math.max(e.slow,.78);
      }
    }
  }
  for(const e of g.enemies){
    if(e.dead)continue;
    const speed=[1.48,1.04,.78][e.tier]*(1+g.wave*.055)*(onLight(g,e)?1.65:1)*(1-e.slow);
    if(e.sleep<=0)e.distance+=speed*dt;
    Object.assign(e,pointAt(e.distance));
    if(e.distance>=PATH_LENGTH){e.dead=true;g.lives-=e.tier+1;g.events.push({type:'leak',x:e.x,z:e.z});}
  }
  for(const t of g.towers.filter(t=>t.type==='top')){
    const [x,z]=SOCKETS[t.slot],boost=onLight(g,{x,z})?2:1;
    t.charge-=dt*boost;
    const range=t.branch==='orbit'?3.8:t.branch==='bowling'?4.2:2.65;
    const targets=g.enemies.filter(e=>!e.dead&&Math.hypot(e.x-x,e.z-z)<=range).sort((a,b)=>b.distance-a.distance);
    if(!targets.length||t.charge>0)continue;
    if(t.branch==='bowling'){
      const e=targets[0],vx=e.x-x,vz=e.z-z,d=Math.hypot(vx,vz)||1;
      g.shots.push({x,z,vx:vx/d*10,vz:vz/d*10,life:.7,hit:new Set()});t.charge=1.25;
    }else if(t.branch==='orbit'){
      t.charge=.52;for(const e of targets)damageEnemy(g,e,2.8);g.events.push({type:'spin',x,z,r:range});
    }else{t.charge=.48;for(const e of targets)damageEnemy(g,e,3.2);g.events.push({type:'spin',x,z,r:range});}
  }
  for(const s of g.shots){s.x+=s.vx*dt;s.z+=s.vz*dt;s.life-=dt;for(const e of g.enemies){if(!e.dead&&!s.hit.has(e.id)&&Math.hypot(e.x-s.x,e.z-s.z)<.85){s.hit.add(e.id);damageEnemy(g,e,11);}}}
  g.shots=g.shots.filter(s=>s.life>0);g.enemies=g.enemies.filter(e=>!e.dead);
  if(g.lives<=0){g.lives=0;g.phase='lost';g.events.push({type:'end',won:false});return;}
  if(g.spawned>=count&&!g.enemies.length){
    if(g.wave>=6){g.phase='won';g.events.push({type:'end',won:true});}
    else{g.phase='build';g.lastReward=18+g.wave*3;g.coins+=g.lastReward;g.events.push({type:'clear',reward:g.lastReward});}
  }
}
