import * as THREE from 'three';
import {ASSET,bakeStatic} from './assetlib.js';
import {PATH,SOCKETS,COST,UPGRADE_COST,LIGHT_RADIUS,PATH_LENGTH,createGame,startGame,beginWave,buildTower,upgradeTower,sellTower,moveLantern,stepGame,onLight} from './sim.js';

const $=id=>document.getElementById(id);
let game=createGame(),priorPhase='build',selected=null,muted=false,audio=null,dragging=false,stickInput={x:0,z:0},accumulator=0,clock=0,frame=0,toastTimeout;
const keys=new Set(),enemyModels=new Map(),towerModels=new Map(),effects=[];
const scene=new THREE.Scene();scene.background=new THREE.Color('#18232c');scene.fog=new THREE.FogExp2('#18232c',.016);
let renderer;
try {renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch(error){$('fatal').hidden=false;$('fatal').textContent='The playhouse needs WebGL. Please open this game in a browser with hardware acceleration enabled.';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.23;
$('stage').appendChild(renderer.domElement);
const camera=new THREE.OrthographicCamera(-16,16,12,-12,.1,130);
const ambient=new THREE.HemisphereLight('#cad5db','#403443',2.0);scene.add(ambient);
const keyLight=new THREE.DirectionalLight('#ffdb98',3.2);keyLight.position.set(-7,16,7);keyLight.castShadow=true;keyLight.shadow.mapSize.set(2048,2048);keyLight.shadow.camera.left=-14;keyLight.shadow.camera.right=14;keyLight.shadow.camera.top=14;keyLight.shadow.camera.bottom=-14;keyLight.shadow.normalBias=.05;keyLight.shadow.bias=-.0001;scene.add(keyLight);
const fill=new THREE.DirectionalLight('#6aabbc',1.25);fill.position.set(8,9,-7);scene.add(fill);
const gold=new THREE.MeshStandardMaterial({color:'#d7b477',metalness:.6,roughness:.35}),teal=new THREE.MeshStandardMaterial({color:'#467d76',roughness:.65}),ink=new THREE.MeshStandardMaterial({color:'#29353a',roughness:1});
function mesh(geo,mat,x,y,z,parent=scene){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;}
const environment=new THREE.Group();
const backdrop=mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#17222b',roughness:1}),0,-.83,0,environment);backdrop.rotation.x=-Math.PI/2;backdrop.receiveShadow=true;
const pathCurve=new THREE.CatmullRomCurve3(PATH.map(([x,z])=>new THREE.Vector3(x,.04,z)),false,'catmullrom',.15);
// The ribbon follows the simulation's exact polyline; circles soften the joins without changing the route.
const carpet=new THREE.MeshStandardMaterial({color:'#704052',roughness:1});
for(let i=1;i<PATH.length;i++){
  const [ax,az]=PATH[i-1],[bx,bz]=PATH[i],len=Math.hypot(bx-ax,bz-az);
  const m=mesh(new THREE.BoxGeometry(1.36,.055,len),carpet,(ax+bx)/2,.03,(az+bz)/2,environment);m.rotation.y=Math.atan2(bx-ax,bz-az);m.receiveShadow=true;
  for(let d=.25;d<len;d+=.62){const t=d/len,px=ax+(bx-ax)*t,pz=az+(bz-az)*t;for(const s of [-1,1]){
    const stitch=mesh(new THREE.BoxGeometry(.09,.009,.16),gold,px+s*.58*(bz-az)/len,.063,pz-s*.58*(bx-ax)/len,environment);stitch.rotation.y=m.rotation.y;
  }}
}
for(const [x,z] of PATH){const round=mesh(new THREE.CylinderGeometry(.68,.68,.055,24),carpet,x,.03,z,environment);round.receiveShadow=true;}
const socketRings=[];
SOCKETS.forEach(([x,z],i)=>{
  const pedestal=mesh(new THREE.CylinderGeometry(.82,.94,.14,32),ink,x,.075,z,environment);pedestal.receiveShadow=true;
  const circle=mesh(new THREE.TorusGeometry(.8,.032,5,36),gold,x,.155,z,environment);circle.rotation.x=Math.PI/2;
  const inner=mesh(new THREE.TorusGeometry(.59,.012,5,32),gold,x,.155,z,environment);inner.rotation.x=Math.PI/2;
  const halo=mesh(new THREE.RingGeometry(.83,.89,48),new THREE.MeshBasicMaterial({color:'#e7c58c',transparent:true,opacity:.4,side:THREE.DoubleSide}),x,.17,z);halo.rotation.x=-Math.PI/2;socketRings.push(halo);
  const button=document.createElement('button');button.className='socket';button.textContent=String(i+1);button.dataset.slot=i;button.setAttribute('aria-label',`Socket ${i+1}`);button.onclick=()=>selectSocket(i);$('socket-labels').appendChild(button);
});
scene.add(bakeStatic(environment));
const rangeRing=mesh(new THREE.RingGeometry(2.59,2.65,64),new THREE.MeshBasicMaterial({color:'#83c4b1',transparent:true,opacity:.35,side:THREE.DoubleSide}),0,.07,0);rangeRing.rotation.x=-Math.PI/2;rangeRing.visible=false;
const lightSpot=new THREE.SpotLight('#ffd28a',65,18,Math.atan(LIGHT_RADIUS/7),.45,1.1);lightSpot.position.set(-1,7,0);lightSpot.target.position.set(-1,0,0);scene.add(lightSpot,lightSpot.target);
const lanternGlow=new THREE.PointLight('#ffbd67',3,4,2);scene.add(lanternGlow);
const lightDisc=mesh(new THREE.CircleGeometry(LIGHT_RADIUS,64),new THREE.MeshBasicMaterial({color:'#ecc981',transparent:true,opacity:.085,depthWrite:false}),-1,.083,0);lightDisc.rotation.x=-Math.PI/2;
const lightRim=mesh(new THREE.RingGeometry(LIGHT_RADIUS-.035,LIGHT_RADIUS,64),new THREE.MeshBasicMaterial({color:'#e4bf76',transparent:true,opacity:.46,depthWrite:false}),-1,.09,0);lightRim.rotation.x=-Math.PI/2;
const goalLight=new THREE.PointLight('#ffc66e',8,9,2);goalLight.position.set(8,1.7,3.6);scene.add(goalLight);
const particleGeometry=new THREE.SphereGeometry(.07,5,4),particleMaterial=new THREE.MeshBasicMaterial({color:'#f6d791'});
const dust=mesh(new THREE.InstancedBufferGeometry(),particleMaterial,0,0,0);scene.remove(dust);dust.geometry.dispose();
let dollProto,topProto,musicProto,lantern,goalLantern;
let fps=60,lastUI='',lastTime=performance.now();
const raycaster=new THREE.Raycaster(),floor=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
const proj=new THREE.Vector3();

function resize(){
  const w=innerWidth,h=innerHeight,aspect=w/h;renderer.setSize(w,h);const portrait=aspect<.8;
  const viewWidth=portrait?24.5:Math.max(27,aspect*21.8),viewHeight=viewWidth/aspect;
  camera.left=-viewWidth/2;camera.right=viewWidth/2;camera.top=viewHeight/2;camera.bottom=-viewHeight/2;
  camera.position.set(portrait?20:16,portrait?32:25,portrait?22:29);camera.lookAt(0,portrait?-1:-.4,0);camera.updateProjectionMatrix();camera.updateMatrixWorld();
}
addEventListener('resize',resize);resize();
function notify(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('toast').classList.remove('show'),3400);}
function sound(note=440,duration=.12,type='sine',volume=.025){
  if(muted||!audio)return;const o=audio.createOscillator(),a=audio.createGain();o.type=type;o.frequency.value=note;a.gain.setValueAtTime(0,audio.currentTime);a.gain.linearRampToValueAtTime(volume,audio.currentTime+.008);a.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);o.connect(a);a.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);
}
function initAudio(){try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();}catch{muted=true;}}
function emit(x,z,count,color='#e5c78d'){
  for(let i=0;i<count;i++){
    const p=mesh(particleGeometry,new THREE.MeshBasicMaterial({color}),x,.5,z);const a=Math.random()*Math.PI*2;
    effects.push({mesh:p,vx:Math.cos(a)*(1+Math.random()*2),vz:Math.sin(a)*(1+Math.random()*2),vy:1.5+Math.random()*3,life:.5+Math.random()*.5});
  }
}
function deselect(){selected=null;$('selection').hidden=true;rangeRing.visible=false;updateUI(true);}
function selectSocket(slot){if(!['build','wave'].includes(game.phase))return;selected=slot;game.selected=slot;$('selection').hidden=false;updateSelection();updateUI(true);}
const upgradeDetails={
  bowling:{name:'Bowling top',icon:'↗',copy:'Sends a top through a line of toys. Longer reach, slower wind-up.'},
  orbit:{name:'Wide orbit',icon:'◎',copy:'Sweeps a much wider circle. Less damage per toy, more toys at once.'},
  lullaby:{name:'Lullaby',icon:'☾',copy:'Sustained music puts toys to sleep. Any damage wakes them.'},
  invitation:{name:'Invitation',icon:'♫',copy:'A wider melody tethers passing toys near the box. Gentler initial slow.'}
};
function choice(name,icon,copy,cost,action){const b=document.createElement('button');b.className='choice';b.disabled=game.coins<cost;b.innerHTML=`<span class="choice-icon">${icon}</span><strong>${name}</strong><small>${copy}</small><span class="cost">✧ ${cost} brass</span>`;b.onclick=action;return b;}
function updateSelection(){
  if(selected===null)return;const t=game.towers.find(t=>t.slot===selected),slot=selected;
  $('selected-kicker').textContent=`SOCKET ${slot+1} · ${t?'WIND-UP WORKSHOP':'AN EMPTY LITTLE STAGE'}`;
  $('selected-title').textContent=t?(t.type==='top'?'A top with possibilities.':'A curious little melody.'):'Give it a little company.';
  $('choices').replaceChildren();$('selection-footer').replaceChildren();
  const actions=t?(t.branch?[]:t.type==='top'?['bowling','orbit']:['lullaby','invitation']):['top','music'];
  for(const action of actions){
    const data=t?upgradeDetails[action]:action==='top'?{name:'Spinning top',icon:'⟳',copy:'Spins through every nearby toy. A little chaos goes a long way.'}:{name:'Music box',icon:'♫',copy:'Slows approaching toys so your tops can finish the job.'};
    const cost=t?UPGRADE_COST:COST[action];
    $('choices').appendChild(choice(data.name,data.icon,data.copy,cost,()=>{const ok=t?upgradeTower(game,slot,action):buildTower(game,slot,action);if(ok){sound(660,.2);const [x,z]=SOCKETS[slot];emit(x,z,12,'#9bdbbd');syncTowers();updateSelection();updateUI(true);}}));
  }
  if(t?.branch){const d=upgradeDetails[t.branch];$('choices').innerHTML=`<div class="upgraded-note"><span class="choice-icon">${d.icon}</span><h2>${d.name}</h2><p style="font-size:12px;line-height:1.7;color:#bfc6b6">${d.copy}</p></div>`;}
  const explanation=document.createElement('span');explanation.textContent=t?(t.branch?'A new personality. Put it to good use.':'Choose one personality. The other branch locks for this toy.'):'Toys attack on their own. Move your lantern to help them.';$('selection-footer').appendChild(explanation);
  if(t){const sell=document.createElement('button');sell.className='text-button';sell.textContent=`Pack away · recover ${Math.floor((COST[t.type]+(t.branch?UPGRADE_COST:0))*.65)} brass`;sell.onclick=()=>{sellTower(game,slot);syncTowers();updateSelection();updateUI(true);};$('selection-footer').appendChild(sell);}
  const [x,z]=SOCKETS[slot];rangeRing.position.set(x,.07,z);const r=t?(t.type==='music'?(t.branch==='invitation'?3.8:3.05):(t.branch==='orbit'?3.8:t.branch==='bowling'?4.2:2.65)):1;rangeRing.scale.setScalar(r/2.65);rangeRing.visible=!!t;
}
function syncTowers(){
  for(const [id,o]of towerModels)if(!game.towers.some(t=>t.id===id)){scene.remove(o);towerModels.delete(id);}
  for(const t of game.towers){if(towerModels.has(t.id))continue;const o=(t.type==='top'?topProto:musicProto).clone(true);const [x,z]=SOCKETS[t.slot];o.position.set(x,.18,z);o.rotation.y=t.type==='music'?.35:0;scene.add(o);towerModels.set(t.id,o);}
}
function updateUI(force=false){
  const signature=[game.phase,game.wave,game.lives,game.coins,game.enemies.length,game.spawned,selected].join(':');if(!force&&signature===lastUI)return;lastUI=signature;
  $('lives').textContent=game.lives;$('coins').textContent=game.coins;
  const displayHour=game.phase==='won'?6:game.phase==='build'?game.wave:Math.max(0,game.wave-1);
  $('hour').innerHTML=`${displayHour===0?'12':String(displayHour).padStart(2,'0')}:00 <span>AM</span>`;
  $('hour-label').textContent=game.phase==='won'?'MORNING HAS ARRIVED':game.phase==='wave'?'KEEP THE LIGHT BURNING':'A MOMENT TO PREPARE';
  [...$('clock-dots').children].forEach((d,i)=>{d.className=i<game.wave-(game.phase==='wave'?1:0)?'done':i===game.wave-1?'active':'';});
  const fighting=game.phase==='wave';$('wave-kicker').textContent=fighting?`HOUR ${game.wave} OF 6 · THE TOYS MARCH ON`:game.wave?`HOUR ${game.wave} SURVIVED · +${game.lastReward} BRASS`:'THE CURTAIN IS UP';
  $('wave-title').textContent=fighting?['','A rustle in the wings.','There is something inside.','The music turns strange.','No one is sleeping.','Just a little longer.','The last dark hour.'][game.wave]:game.wave?'Take a breath. Wind your toys.':'Make yourself at home.';
  $('wave-hint').textContent=fighting?`${game.enemies.length} toys on stage · ${Math.max(0,4+game.wave*2-game.spawned)} still in the wings`:'Tap a brass socket to place or upgrade a toy.';
  $('wave-count').textContent=`${6-game.wave} hours until morning`;
  $('next-wave').disabled=fighting;$('next-wave').innerHTML=fighting?'The night is unfolding…':`${game.wave?'Ring the next bell':'Begin midnight'} <span>→</span>`;
  [...$('socket-labels').children].forEach((b,i)=>{const t=game.towers.find(t=>t.slot===i);b.className=`socket ${t?'occupied':'empty'} ${selected===i?'selected':''}`;b.textContent=t?(t.type==='top'?'⟳':'♫'):i+1;b.setAttribute('aria-label',`Socket ${i+1}: ${t?t.type==='top'?'spinning top':'music box':'empty'}${t?.branch?', '+t.branch:''}`);});
  if(selected!==null)updateSelection();
}
function start(){initAudio();startGame(game);$('intro').hidden=true;$('play-ui').hidden=false;$('socket-labels').hidden=false;syncTowers();updateUI(true);sound(392,.3);setTimeout(()=>sound(587,.35),160);notify('Two toys are ready. Add a defense, then begin midnight.');}
function restart(){
  for(const o of enemyModels.values())scene.remove(o);enemyModels.clear();for(const o of towerModels.values())scene.remove(o);towerModels.clear();for(const p of effects){scene.remove(p.mesh);p.mesh.material.dispose();}effects.length=0;
  game=createGame();startGame(game);selected=null;keys.clear();stickInput={x:0,z:0};accumulator=0;$('ending').hidden=true;$('pause-screen').hidden=true;$('selection').hidden=true;rangeRing.visible=false;syncTowers();updateUI(true);notify('A new night. Another chance.');
}
function togglePause(){if(game.phase==='paused'){game.phase=priorPhase;$('pause-screen').hidden=true;lastTime=performance.now();}else if(['wave','build'].includes(game.phase)){priorPhase=game.phase;game.phase='paused';keys.clear();stickInput={x:0,z:0};$('pause-screen').hidden=false;$('resume').focus();}updateUI(true);}
$('startb').onclick=start;$('next-wave').onclick=()=>{if(beginWave(game)){deselect();sound(196,.65,'sine',.05);notify(game.wave===1?'Keep the glow on your defenses. Watch the dolls in its light.':`Hour ${game.wave}. The theatre stirs again.`);updateUI(true);}};
$('close-selection').onclick=deselect;$('pause').onclick=togglePause;$('resume').onclick=togglePause;$('restart').onclick=restart;$('restart-pause').onclick=restart;
$('sound').onclick=()=>{initAudio();muted=!muted;$('sound').textContent=muted?'♪':'♫';$('sound').setAttribute('aria-label',muted?'Enable sound':'Mute sound');};
function pointerWorld(event){const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);if(raycaster.ray.intersectPlane(floor,hit))moveLantern(game,hit.x,hit.z);}
renderer.domElement.addEventListener('pointerdown',e=>{if(!['build','wave'].includes(game.phase))return;dragging=true;renderer.domElement.setPointerCapture(e.pointerId);pointerWorld(e);deselect();});
renderer.domElement.addEventListener('pointermove',e=>{if(dragging)pointerWorld(e);});
for(const name of ['pointerup','pointercancel','lostpointercapture'])renderer.domElement.addEventListener(name,()=>dragging=false);
const stick=$('stick');let stickId=null;
function updateStick(e){const b=stick.getBoundingClientRect(),dx=(e.clientX-b.left-b.width/2)/24,dy=(e.clientY-b.top-b.height/2)/24,length=Math.max(1,Math.hypot(dx,dy));stickInput={x:dx/length,z:dy/length};$('stick-knob').style.transform=`translate(${stickInput.x*20}px,${stickInput.z*20}px)`;}
stick.onpointerdown=e=>{e.preventDefault();stickId=e.pointerId;stick.setPointerCapture(e.pointerId);updateStick(e);};stick.onpointermove=e=>{if(e.pointerId===stickId)updateStick(e);};
for(const name of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(name,()=>{stickId=null;stickInput={x:0,z:0};$('stick-knob').style.transform='';});
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.repeat)return;if(e.code==='KeyP'||e.code==='Escape'){if(selected!==null&&e.code==='Escape')deselect();else togglePause();}else if(e.code==='Space'&&game.phase==='build')$('next-wave').click();else keys.add(e.code);});
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();dragging=false;stickInput={x:0,z:0};});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.phase==='wave')togglePause();});
const right=new THREE.Vector3(),forward=new THREE.Vector3();
function moveInput(){if(!['build','wave'].includes(game.phase))return;let x=stickInput.x+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),z=stickInput.z+(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);if(!x&&!z)return;right.setFromMatrixColumn(camera.matrixWorld,0);right.y=0;right.normalize();forward.set(camera.position.x,0,camera.position.z).normalize();moveLantern(game,game.lantern.x+(right.x*x+forward.x*z)*2,game.lantern.z+(right.z*x+forward.z*z)*2);}
function processEvents(){
  for(const e of game.events){
    if(e.type==='pop'){emit(e.x,e.z,6,e.tier?'#b880a4':'#e7c881');sound(e.tier?440:880,.085,'triangle',.017);}
    if(e.type==='leak'){emit(e.x,e.z,10,'#e47d66');sound(110,.25,'triangle',.04);notify('A toy reached the last light.');}
    if(e.type==='sleep')sound(784,.2,'sine',.009);
    if(e.type==='clear'){notify(`An hour survived. +${e.reward} brass. Choose your next upgrade.`);sound(523,.3);setTimeout(()=>sound(784,.4),180);}
    if(e.type==='end'){
      deselect();$('ending').hidden=false;$('end-kicker').textContent=e.won?'THE MORNING AFTER':'THE CURTAIN FALLS';$('end-title').textContent=e.won?'Here comes the sun.':'One light too few.';
      $('end-copy').textContent=e.won?'The toys are still again. A little crooked, a little stranger. But the light is yours.':'The toys have taken the stage. Try moving your light away from the lane, and pair a music box with a spinning top.';
      $('end-stats').textContent=`${e.won?6:Math.max(0,game.wave-1)} HOURS SURVIVED · ${game.kills} SHELLS BROKEN`;$('restart').focus();sound(e.won?784:147,.8,'sine',.04);
    }
  }game.events.length=0;
}
function animate(now){
  requestAnimationFrame(animate);const raw=(now-lastTime)/1000;lastTime=now;const dt=Math.min(raw,.1);fps+=(1/Math.max(.001,raw)-fps)*.07;frame++;
  if(game.phase!=='paused'&&game.phase!=='lost')clock+=dt;
  moveInput();accumulator+=Math.min(raw,.2);while(accumulator>=1/60){stepGame(game,1/60);accumulator-=1/60;}processEvents();
  if(lantern){
    const l=game.lantern;lantern.position.set(l.x,.08+Math.sin(clock*5)*.016,l.z);lantern.rotation.z=Math.sin(clock*13)*Math.min(.065,l.speed*.012);lightSpot.position.set(l.x,7,l.z);lightSpot.target.position.set(l.x,0,l.z);lanternGlow.position.set(l.x,.85,l.z);lightDisc.position.set(l.x,.083,l.z);lightRim.position.set(l.x,.09,l.z);
    lightRim.material.opacity=.32+Math.sin(clock*2)*.06;
  }
  if(dollProto){
    for(const [id,o]of enemyModels)if(!game.enemies.some(e=>e.id===id)){scene.remove(o);enemyModels.delete(id);}
    for(const e of game.enemies){let o=enemyModels.get(e.id);if(!o){o=dollProto.clone(true);scene.add(o);enemyModels.set(e.id,o);}const s=[.48,.7,1][e.tier],hop=e.sleep>0?0:Math.max(0,Math.sin(e.age*(e.tier===0?10:7)))*.27;o.position.set(e.x,.09+hop,e.z);o.rotation.set(e.sleep>0?.17:0,e.angle,Math.sin(e.age*7)*.08);o.scale.set(s*(1-hop*.14),s*(1+hop*.2),s*(1-hop*.14));}
  }
  for(const t of game.towers){const o=towerModels.get(t.id);if(!o)continue;const lit=onLight(game,{x:o.position.x,z:o.position.z});if(t.type==='top'){o.rotation.y=clock*(lit?12:6);o.rotation.z=Math.sin(clock*5)*.035;o.scale.setScalar(t.branch==='orbit'?1.13:1);if(t.branch==='bowling')o.rotation.x=Math.sin(clock*3)*.08;}else{o.rotation.z=Math.sin(clock*(lit?9:5))*.02;o.position.y=.18+Math.sin(clock*3)*.018;}}
  for(let i=effects.length-1;i>=0;i--){const p=effects[i];if(game.phase==='paused')continue;p.life-=dt;p.vy-=dt*8;p.mesh.position.x+=p.vx*dt;p.mesh.position.z+=p.vz*dt;p.mesh.position.y+=p.vy*dt;p.mesh.scale.setScalar(Math.min(1,p.life*3));if(p.life<=0){scene.remove(p.mesh);p.mesh.material.dispose();effects.splice(i,1);}}
  // Reuse a small pool of top projectiles; their positions come directly from simulation.
  while(projectileModels.length<game.shots.length){const o=topProto.clone(true);o.scale.setScalar(.6);scene.add(o);projectileModels.push(o);}
  projectileModels.forEach((o,i)=>{const s=game.shots[i];o.visible=!!s;if(s){o.position.set(s.x,.2,s.z);o.rotation.y=clock*18;}});
  [...$('socket-labels').children].forEach((b,i)=>{const [x,z]=SOCKETS[i];proj.set(x,.3,z).project(camera);b.style.left=`${(proj.x*.5+.5)*innerWidth}px`;b.style.top=`${(-proj.y*.5+.5)*innerHeight+17}px`;socketRings[i].material.opacity=selected===i?.8:.22+Math.sin(clock*2+i)*.07;});
  if(game.phase==='won'){scene.background.lerp(new THREE.Color('#465462'),dt*.1);ambient.intensity=Math.min(3,ambient.intensity+dt*.08);}
  updateUI();renderer.render(scene,camera);
  window.__GAME__={frame,fps:Math.round(fps),pos:[game.lantern.x,game.lantern.z],speed:game.lantern.speed,score:game.kills,over:game.phase==='won'||game.phase==='lost',draws:renderer.info.render.calls,tris:renderer.info.render.triangles,phase:game.phase,wave:game.wave,lives:game.lives,coins:game.coins,enemies:game.enemies.length,towers:game.towers.map(t=>({slot:t.slot,type:t.type,branch:t.branch})),lightRadius:LIGHT_RADIUS};
}
const projectileModels=[];
try {
  const loaded=await Promise.all(['stage','doll','top','music','lantern'].map(name=>ASSET(`./assets/${name}.js`)));
  for(let i=0;i<loaded.length;i++)if(!loaded[i].children.length)throw new Error(`Asset failed to load: ${['stage','doll','top','music','lantern'][i]}`);
  const stage=loaded[0];stage.position.y=-.7;scene.add(stage);[dollProto,topProto,musicProto]=loaded.slice(1,4);lantern=loaded[4];scene.add(lantern);goalLantern=lantern.clone(true);goalLantern.scale.setScalar(1.4);goalLantern.position.set(8,.12,3.6);scene.add(goalLantern);
  syncTowers();$('startb').disabled=false;$('startb').textContent='Raise the curtain →';$('startb').focus();window.__READY__=true;window.__START__=start;requestAnimationFrame(animate);
}catch(error){$('fatal').hidden=false;$('fatal').textContent=`The playhouse could not open: ${error.message}. Reload to try again.`;console.error(error);}
