import * as THREE from 'three';
import {GIFT_IDS,giftInfo} from './night-gifts.js';
import {createNightView} from './night-view.js';
import {TheatreAudio} from './audio.js';
import {ASSET,bakeStatic} from './assetlib.js';
import {handmade,createPresentation} from './presentation.js';
import {dressStage} from './stage-look.js';
import {dressToys} from './toy-look.js';
import {stageReflections} from './reflections.js';
import {createGhostView,updateGhostView,disposeGhostView} from './ghost-view.js';
import {PATH,SOCKETS,COST,UPGRADE_COST,LIGHT_RADIUS,PATH_LENGTH,pointAt,createGame,startGame,beginWave,buildTower,upgradeTower,sellTower,moveLantern,stepGame,onLight,waveInfo,chooseNightGift,towerRange} from './sim.js';

const $=id=>document.getElementById(id);
let game=createGame(),priorPhase='build',selected=null,dragging=false,stickInput={x:0,z:0},accumulator=0,clock=0,frame=0,toastTimeout,playSpeed=1;
const keys=new Set(),enemyModels=new Map(),enemyBars=new Map(),towerModels=new Map(),effects=[];
const scene=new THREE.Scene();const nightView=createNightView(scene);scene.background=new THREE.Color('#0b1921');scene.fog=new THREE.FogExp2('#0b1921',.006);
let renderer;
try {renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch(error){$('fatal').hidden=false;$('fatal').textContent='The playhouse needs WebGL. Please open this game in a browser with hardware acceleration enabled.';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
$('stage').appendChild(renderer.domElement);
stageReflections(scene,renderer);
const camera=new THREE.OrthographicCamera(-16,16,12,-12,.1,130);
const ambient=new THREE.HemisphereLight('#aabed8','#342226',.62);scene.add(ambient);
const keyLight=new THREE.DirectionalLight('#ffd7a5',1.65);keyLight.position.set(-9,11,7);keyLight.castShadow=true;keyLight.shadow.mapSize.set(2048,2048);keyLight.shadow.camera.left=-14;keyLight.shadow.camera.right=14;keyLight.shadow.camera.top=14;keyLight.shadow.camera.bottom=-14;keyLight.shadow.normalBias=.05;keyLight.shadow.bias=-.0001;scene.add(keyLight);
const fill=new THREE.DirectionalLight('#9ba9d7',.85);fill.position.set(8,9,-7);scene.add(fill);
const gold=new THREE.MeshStandardMaterial({color:'#d7b477',metalness:.6,roughness:.35}),teal=new THREE.MeshStandardMaterial({color:'#467d76',roughness:.65}),ink=new THREE.MeshStandardMaterial({color:'#29353a',roughness:1});
function mesh(geo,mat,x,y,z,parent=scene){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;}
const environment=new THREE.Group();
const backdrop=mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#0b1b24',roughness:1}),0,-.83,0,environment);backdrop.rotation.x=-Math.PI/2;backdrop.receiveShadow=true;backdrop.material.userData.handmade=false;
// One continuous velvet runner, sampled from the same route the toys follow.
function runner(width,y,material){
  const positions=[],indices=[];
  PATH.forEach(([x,z],i)=>{
    const a=PATH[Math.max(0,i-1)],b=PATH[Math.min(PATH.length-1,i+1)];
    const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
    for(const side of [-1,1])positions.push(x+side*dz/len*width,y,z-side*dx/len*width);
    if(i){const n=i*2;indices.push(n-2,n,n-1,n-1,n,n+1);}
  });
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
  const ribbon=mesh(geo,material,0,0,0,environment);ribbon.receiveShadow=true;
}
runner(.65,.025,new THREE.MeshStandardMaterial({color:'#48262d',roughness:.88,side:THREE.DoubleSide}));
runner(.59,.033,new THREE.MeshStandardMaterial({color:'#541e32',roughness:.94,side:THREE.DoubleSide}));
runner(.48,.037,new THREE.MeshStandardMaterial({color:'#69293b',roughness:1,side:THREE.DoubleSide}));
for(let d=.3;d<PATH_LENGTH;d+=.62){
  const p=pointAt(d);
  for(const side of [-1,1]){
    const stitch=mesh(new THREE.BoxGeometry(.045,.009,.13),gold,p.x+side*.545*Math.cos(p.angle),.048,p.z-side*.545*Math.sin(p.angle),environment);stitch.rotation.y=p.angle;
  }
}
const socketRings=[];
SOCKETS.forEach(([x,z],i)=>{
  // Small wind-up mounts belong to the stage instead of looking like UI pucks.
  const pedestal=mesh(new THREE.CylinderGeometry(.47,.53,.09,12),gold,x,.047,z,environment);pedestal.receiveShadow=true;
  const inset=mesh(new THREE.CylinderGeometry(.40,.40,.095,24),ink,x,.051,z,environment);inset.receiveShadow=true;
  for(const side of [-1,1])mesh(new THREE.BoxGeometry(.065,.012,.19),gold,x+side*.31,.105,z,environment);
  mesh(new THREE.BoxGeometry(.07,.012,.24),gold,x,.105,z,environment);
  const halo=mesh(new THREE.RingGeometry(.55,.585,48),new THREE.MeshBasicMaterial({color:'#e7c58c',transparent:true,opacity:0,side:THREE.DoubleSide}),x,.11,z);halo.rotation.x=-Math.PI/2;socketRings.push(halo);
  const button=document.createElement('button');button.className='socket';button.textContent=String(i+1);button.dataset.slot=i;button.setAttribute('aria-label',`Socket ${i+1}`);button.onclick=()=>selectSocket(i);$('socket-labels').appendChild(button);
});
const stageFloor=bakeStatic(environment);stageFloor.traverse(o=>{if(o.isMesh)o.receiveShadow=true;});handmade(stageFloor);scene.add(stageFloor);
const rangeRing=mesh(new THREE.RingGeometry(2.59,2.65,64),new THREE.MeshBasicMaterial({color:'#83c4b1',transparent:true,opacity:.35,side:THREE.DoubleSide}),0,.07,0);rangeRing.rotation.x=-Math.PI/2;rangeRing.visible=false;
const lightSpot=new THREE.SpotLight('#ffc079',92,18,Math.atan(LIGHT_RADIUS/7),.6,1.1);lightSpot.position.set(-1,7,0);lightSpot.target.position.set(-1,0,0);scene.add(lightSpot,lightSpot.target);
const lanternGlow=new THREE.PointLight('#ffad4a',8,6,2);scene.add(lanternGlow);
const lightDisc=mesh(new THREE.CircleGeometry(LIGHT_RADIUS,64),new THREE.MeshBasicMaterial({color:'#ecc981',transparent:true,opacity:.07,depthWrite:false}),-1,.083,0);lightDisc.rotation.x=-Math.PI/2;
const lightRim=mesh(new THREE.RingGeometry(LIGHT_RADIUS-.035,LIGHT_RADIUS,64),new THREE.MeshBasicMaterial({color:'#e4bf76',transparent:true,opacity:.23,depthWrite:false}),-1,.09,0);lightRim.rotation.x=-Math.PI/2;
const goalLight=new THREE.PointLight('#ffc66e',15,8,2);goalLight.position.set(8,1.7,3.6);scene.add(goalLight);
const particleGeometry=new THREE.SphereGeometry(.07,5,4),particleMaterial=new THREE.MeshBasicMaterial({color:'#f6d791'});
const pulseGeometry=new THREE.RingGeometry(.94,1,48);
const healthGeometry=new THREE.PlaneGeometry(.72,.07),healthBack=new THREE.MeshBasicMaterial({color:'#17232a'}),healthFill=new THREE.MeshBasicMaterial({color:'#e6b581'});
let ghostProto,dollProto,topProto,musicProto,lantern,goalLantern,presentation,stageLook;
let dawnProgress=0;
const nightColor=new THREE.Color('#0b1921'),dawnColor=new THREE.Color('#544753'),dawnKey=new THREE.Color('#ffe1b0'),nightKey=new THREE.Color('#ffd7a5');
let fps=60,lastUI='',lastTime=performance.now();
const raycaster=new THREE.Raycaster(),floor=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
const proj=new THREE.Vector3();

let stageWidth=innerWidth,stageHeight=innerHeight;
function resize(){
  const w=$('app').clientWidth,h=$('app').clientHeight,aspect=w/h;
  stageWidth=w;stageHeight=h;renderer.setSize(w,h);
  const landscape=w>=h,bench=$('workbench').getBoundingClientRect();
  const sideDock=matchMedia('(max-width:1100px) and (max-height:500px) and (orientation:landscape)').matches;
  $('app').style.setProperty('--bench-height',`${bench.height}px`);
  // Frame the playable area at every window size; scenery may extend past the edges.
  stageLook?.layout(!landscape);
  keyLight.position.x=landscape?-9:9;
  camera.position.set(landscape?(sideDock?3:7):32,landscape?(sideDock?25:24):44,landscape?34:0);
  camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const bounds=new THREE.Box3();
  for(const x of [-9.1,9.1])for(const y of [0,2.8])for(const z of [-5.2,5.2]){
    bounds.expandByPoint(new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
  }
  const hud=document.querySelector('.hud').getBoundingClientRect();
  const left=16,top=hud.bottom+12,right=sideDock?(bench.width?bench.left-16:w-220):w-16;
  const bottom=sideDock?h-16:(bench.height?bench.top-16:h-116);
  const scale=Math.min((right-left)/(bounds.max.x-bounds.min.x),Math.max(100,bottom-top)/(bounds.max.y-bounds.min.y));
  const viewWidth=w/scale,viewHeight=h/scale;
  camera.left=(bounds.min.x+bounds.max.x)/2-(left+right)/2/scale;
  camera.right=camera.left+viewWidth;
  camera.top=(bounds.min.y+bounds.max.y)/2+(top+bottom)/2/scale;
  camera.bottom=camera.top-viewHeight;
  camera.updateProjectionMatrix();camera.updateMatrixWorld();
}
addEventListener('resize',resize);
const layoutObserver=new ResizeObserver(resize);
for(const element of [$('app'),document.querySelector('.hud'),$('workbench')])layoutObserver.observe(element);
resize();
function notify(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('toast').classList.remove('show'),3400);}
let audioStorage=null;try{audioStorage=window.localStorage;}catch{}
const audio=new TheatreAudio({storage:audioStorage,onChange:syncAudioUI});
function syncAudioUI(){
  const p=audio.preferences;
  $('sound').textContent=p.muted?'♪':'♫';$('sound').setAttribute('aria-label',p.muted?'Enable sound':'Mute sound');
  $('sound').setAttribute('aria-pressed',String(p.muted));
  $('audio-status').textContent=audio.label;$('sound').title=audio.label;
  for(const key of ['music','effects']){$(key+'-level').value=Math.round(p[key]*100);$(key+'-value').textContent=Math.round(p[key]*100)+'%';}
}
const sound=(...args)=>audio.sound(...args),chime=(...args)=>audio.chime(...args);
syncAudioUI();
function emit(x,z,count,color='#e5c78d'){
  for(let i=0;i<count;i++){
    const p=mesh(particleGeometry,new THREE.MeshBasicMaterial({color}),x,.5,z);const a=Math.random()*Math.PI*2;
    effects.push({mesh:p,vx:Math.cos(a)*(1+Math.random()*2),vz:Math.sin(a)*(1+Math.random()*2),vy:1.5+Math.random()*3,life:.5+Math.random()*.5});
  }
}
function pulse(x,z,r,color){const o=mesh(pulseGeometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.35,depthWrite:false}),x,.10,z);o.rotation.x=-Math.PI/2;effects.push({mesh:o,ring:true,r,life:.42,maxLife:.42});}
function deselect(){selected=null;$('selection').hidden=true;rangeRing.visible=false;updateUI(true);}
function selectSocket(slot){if(!['build','wave'].includes(game.phase))return;selected=slot;game.selected=slot;$('selection').hidden=false;updateSelection();updateUI(true);}
const rankMark=rank=>['','I','II','III'][rank];
function closeNightOffer(){ $('night-offer').hidden=true;$('next-wave').focus(); }
function openNightOffer(){
  if(game.phase!=='build'||!game.giftOffer)return;
  deselect();keys.clear();dragging=false;stickInput={x:0,z:0};$('stick-knob').style.transform='';
  $('gift-kicker').textContent=`HOUR ${game.giftOffer} SURVIVED · GIFT ${game.giftHistory.length+1} OF 3`;
  $('gift-choices').replaceChildren();
  for(const id of GIFT_IDS){
    const info=giftInfo(id,game.nightGifts[id]+1);if(!info)continue;
    const card=document.createElement('button');card.className='gift-card';card.dataset.gift=id;
    const needsLullaby=id==='encore'&&!game.towers.some(t=>t.branch==='lullaby');
    card.innerHTML=`<span class="gift-icon" aria-hidden="true">${info.icon}</span><span class="gift-rank">${game.nightGifts[id]?'STRENGTHEN':'NEW GIFT'} · RANK ${rankMark(info.rank)}</span><strong>${info.name}</strong><span class="gift-copy">${info.copy}</span><small class="${needsLullaby?'gift-warning':''}">${info.note}</small><span class="gift-choose">Choose ${info.name} ${rankMark(info.rank)} <i>→</i></span>`;
    card.onclick=()=>{if(chooseNightGift(game,id)){closeNightOffer();updateUI(true);}};
    $('gift-choices').appendChild(card);
  }
  $('night-offer').hidden=false;$('gift-choices').firstElementChild?.focus();
}
$('gift-later').onclick=closeNightOffer;
$('night-offer').addEventListener('keydown',e=>{
  if(e.code==='Escape'){e.preventDefault();e.stopPropagation();closeNightOffer();return;}
  if(e.code==='Tab'){
    const buttons=[...$('night-offer').querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
  if(e.code==='Space')e.stopPropagation();
});
function updateGiftRibbon(){
  $('night-gifts').replaceChildren();
  for(const id of GIFT_IDS)if(game.nightGifts[id]){
    const info=giftInfo(id,game.nightGifts[id]),tag=document.createElement('span');
    tag.textContent=`${info.icon} ${info.name} ${rankMark(info.rank)}`;tag.title=info.copy;
    $('night-gifts').appendChild(tag);
  }
  $('night-gifts').hidden=!game.giftHistory.length;
}
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
    const data=t?upgradeDetails[action]:action==='top'?{name:'Spinning top',icon:'⟳',copy:'Spins through every nearby toy. A little chaos goes a long way.'}:{name:'Gramophone',icon:'♫',copy:'Slows approaching toys so your tops can finish the job.'};
    const cost=t?UPGRADE_COST:COST[action];
    $('choices').appendChild(choice(data.name,data.icon,data.copy,cost,()=>{const ok=t?upgradeTower(game,slot,action):buildTower(game,slot,action);if(ok){chime(660);setTimeout(()=>chime(990,.009),95);const [x,z]=SOCKETS[slot];emit(x,z,12,'#9bdbbd');syncTowers();updateSelection();updateUI(true);}}));
  }
  if(t?.branch){const d=upgradeDetails[t.branch];$('choices').innerHTML=`<div class="upgraded-note"><span class="choice-icon">${d.icon}</span><h2>${d.name}</h2><p style="font-size:12px;line-height:1.7;color:#bfc6b6">${d.copy}</p></div>`;}
  const explanation=document.createElement('span');explanation.textContent=t?(t.branch?'A new personality. Put it to good use.':'Choose one personality. The other branch locks for this toy.'):'Toys attack on their own. Move your lantern to help them.';$('selection-footer').appendChild(explanation);
  if(t){const sell=document.createElement('button');sell.className='text-button';sell.textContent=`Pack away · recover ${Math.floor((COST[t.type]+(t.branch?UPGRADE_COST:0))*.65)} brass`;sell.onclick=()=>{sellTower(game,slot);syncTowers();updateSelection();updateUI(true);};$('selection-footer').appendChild(sell);}
  if(t?.type==='top'&&game.nightGifts.overwound){const winding=document.createElement('span');winding.className='winding-note';winding.textContent=giftInfo('overwound',game.nightGifts.overwound).copy;$('selection-footer').appendChild(winding);}
  const [x,z]=SOCKETS[slot];rangeRing.position.set(x,.07,z);const r=t?towerRange(game,t):1;rangeRing.scale.setScalar(r/2.65);rangeRing.visible=!!t;
}
function syncTowers(){
  for(const [id,o]of towerModels)if(!game.towers.some(t=>t.id===id)){scene.remove(o);towerModels.delete(id);}
  for(const t of game.towers){if(towerModels.has(t.id))continue;const o=(t.type==='top'?topProto:musicProto).clone(true);const [x,z]=SOCKETS[t.slot];o.position.set(x,.18,z);o.rotation.y=t.type==='music'?.35:0;scene.add(o);towerModels.set(t.id,o);}
}
function updateUI(force=false){
  const ghosts=game.enemies.filter(e=>e.kind==='ghost'),litGhosts=ghosts.filter(e=>onLight(game,e)).length;
  const signature=[ghosts.length,litGhosts,game.phase,game.wave,game.lives,game.coins,game.enemies.length,game.spawned,selected,game.giftOffer,...Object.values(game.nightGifts),game.ghostlights.length].join(':');if(!force&&signature===lastUI)return;lastUI=signature;
  $('lives').textContent=game.lives;$('coins').textContent=game.coins;
  const displayPhase=game.phase==='paused'?priorPhase:game.phase;
  $('app').dataset.phase=displayPhase;
  const displayHour=displayPhase==='won'?6:displayPhase==='build'?game.wave:Math.max(0,game.wave-1);
  $('hour').innerHTML=`${displayHour===0?'12':String(displayHour).padStart(2,'0')}:00 <span>AM</span>`;
  $('hour-label').textContent=displayPhase==='won'?'MORNING HAS ARRIVED':displayPhase==='lost'?'THE CURTAIN FALLS':displayPhase==='wave'?'KEEP THE LIGHT BURNING':'A MOMENT TO PREPARE';
  [...$('clock-dots').children].forEach((d,i)=>{d.className=i<game.wave-(displayPhase==='wave'?1:0)?'done':i===game.wave-1?'active':'';});
  const fighting=displayPhase==='wave',ended=['won','lost'].includes(displayPhase),plan=waveInfo(fighting?game.wave:game.wave+1);
  $('wave-kicker').textContent=ended?(displayPhase==='won'?'THE NIGHT IS YOURS':`HOUR ${game.wave} · THE LIGHT WENT OUT`):fighting?`HOUR ${game.wave} OF 6 · THE TOYS MARCH ON`:game.wave?`HOUR ${game.wave} SURVIVED · +${game.lastReward} BRASS`:'THE CURTAIN IS UP';
  $('wave-title').textContent=fighting?plan.title:ended?'The curtain falls.':game.wave?'Take a breath. Wind your toys.':'Make yourself at home.';
  $('wave-hint').textContent=fighting?`${game.enemies.length} toys on stage · ${Math.max(0,plan.roster.length-game.spawned)} still in the wings`:plan?`NEXT · HOUR ${plan.number}: ${plan.dolls} dolls${plan.ghosts?` + ${plan.ghosts} paper ghosts`:''}`:'';
  $('wave-advice').hidden=fighting||ended;$('wave-advice').textContent=plan?.hint??'';
  $('wave-advice').classList.toggle('ghost-warning',!!plan?.ghosts);
  const waitingGhosts=fighting?plan.roster.slice(game.spawned).filter(e=>e.kind==='ghost').length:0;
  $('ghost-cue').hidden=!fighting||!plan?.ghosts||(!ghosts.length&&!waitingGhosts);
  $('ghost-cue').classList.toggle('exposed',litGhosts>0);
  $('ghost-count').textContent=ghosts.length?`${ghosts.length-litGhosts} hidden · ${litGhosts} exposed`:'Paper ghosts in the wings';
  $('ghost-rule').textContent=game.nightGifts.ghostlight?'Your lantern and Ghostlight reveal ghosts. Both speed up every toy.':'Shine your lantern on ghosts so tops can hit them.';
  if(game.ghostlights.length)$('ghost-count').textContent+=` · ${game.ghostlights.length} afterglow${game.ghostlights.length===1?'':'s'}`;
  $('wave-count').textContent=`${6-game.wave} ${6-game.wave===1?'hour':'hours'} until morning`;
  $('next-wave').disabled=fighting||ended;$('next-wave').innerHTML=ended?'The night is over':fighting?'The night is unfolding…':`${game.giftOffer?'Choose a night gift':game.wave?'Ring the next bell':'Begin midnight'} <span>→</span>`;
  updateGiftRibbon();
  [...$('socket-labels').children].forEach((b,i)=>{const t=game.towers.find(t=>t.slot===i);b.className=`socket ${t?'occupied':'empty'} ${selected===i?'selected':''}`;b.textContent=t?'':'+';b.setAttribute('aria-label',`Socket ${i+1}: ${t?t.type==='top'?'spinning top':'gramophone':'empty'}${t?.branch?', '+t.branch:''}`);});
  if(selected!==null)updateSelection();
}
function start(){startGame(game);audio.setScene(game.phase,game.wave);void audio.unlock();$('intro').hidden=true;$('play-ui').hidden=false;$('socket-labels').hidden=false;syncTowers();updateUI(true);sound(392,.3);setTimeout(()=>sound(587,.35),160);notify('Two toys are ready. Add a defense, then begin midnight.');}
function restart(){
  presentation?.reset();nightView.reset();$('night-offer').hidden=true;dawnProgress=0;
  for(const o of enemyModels.values()){disposeGhostView(o);scene.remove(o);}enemyModels.clear();for(const o of enemyBars.values())scene.remove(o);enemyBars.clear();for(const o of towerModels.values())scene.remove(o);towerModels.clear();for(const p of effects){scene.remove(p.mesh);p.mesh.material.dispose();}effects.length=0;
  game=createGame();startGame(game);audio.restart();selected=null;keys.clear();stickInput={x:0,z:0};accumulator=0;scene.background.copy(nightColor);ambient.intensity=.88;$('ending').hidden=true;$('pause-screen').hidden=true;$('selection').hidden=true;rangeRing.visible=false;syncTowers();updateUI(true);notify('A new night. Another chance.');
}
function togglePause(){$('night-offer').hidden=true;if(game.phase==='paused'){game.phase=priorPhase;$('pause-screen').hidden=true;lastTime=performance.now();}else if(['wave','build'].includes(game.phase)){priorPhase=game.phase;game.phase='paused';keys.clear();stickInput={x:0,z:0};$('pause-screen').hidden=false;$('resume').focus();}dragging=false;$('stick-knob').style.transform='';audio.setScene(game.phase,game.wave);updateUI(true);}
$('startb').onclick=start;$('next-wave').onclick=()=>{if(game.giftOffer){openNightOffer();return;}if(beginWave(game)){deselect();sound(196,.65,'sine',.05);notify(game.wave===1?'Keep the glow on your defenses. Watch the dolls in its light.':game.wave===2?'Paper ghosts! Shine the lantern on them near your tops.':`Hour ${game.wave}. ${waveInfo(game.wave).ghosts} paper ghosts are coming.`);updateUI(true);}};
$('close-selection').onclick=deselect;$('pause').onclick=togglePause;$('resume').onclick=togglePause;$('restart').onclick=restart;$('restart-pause').onclick=restart;
$('speed').onclick=()=>{playSpeed=playSpeed===1?2:1;$('speed').textContent=playSpeed+'×';$('speed').setAttribute('aria-label',playSpeed===1?'Play at double speed':'Play at normal speed');};
$('sound').onclick=()=>{
  const needsUnlock=audio.wantsPlayback&&(!audio.context||audio.context.state!=='running')&&!audio.preferences.muted;
  if(!needsUnlock)audio.setPreference('muted',!audio.preferences.muted);
  void audio.unlock();
};
for(const key of ['music','effects'])$(key+'-level').oninput=e=>audio.setPreference(key,Number(e.target.value)/100);
function pointerWorld(event){const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);if(raycaster.ray.intersectPlane(floor,hit))moveLantern(game,hit.x,hit.z);}
renderer.domElement.addEventListener('pointerdown',e=>{if(!['build','wave'].includes(game.phase))return;dragging=true;renderer.domElement.setPointerCapture(e.pointerId);pointerWorld(e);deselect();});
renderer.domElement.addEventListener('pointermove',e=>{if(dragging)pointerWorld(e);});
for(const name of ['pointerup','pointercancel','lostpointercapture'])renderer.domElement.addEventListener(name,()=>dragging=false);
const stick=$('stick');let stickId=null;
function updateStick(e){const b=stick.getBoundingClientRect(),dx=(e.clientX-b.left-b.width/2)/24,dy=(e.clientY-b.top-b.height/2)/24,length=Math.max(1,Math.hypot(dx,dy));stickInput={x:dx/length,z:dy/length};$('stick-knob').style.transform=`translate(${stickInput.x*20}px,${stickInput.z*20}px)`;}
stick.onpointerdown=e=>{e.preventDefault();stickId=e.pointerId;stick.setPointerCapture(e.pointerId);updateStick(e);};stick.onpointermove=e=>{if(e.pointerId===stickId)updateStick(e);};
for(const name of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(name,()=>{stickId=null;stickInput={x:0,z:0};$('stick-knob').style.transform='';});
addEventListener('keydown',e=>{if(e.target.matches('input'))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.repeat)return;if(e.code==='KeyP'||e.code==='Escape'){if(selected!==null&&e.code==='Escape')deselect();else togglePause();}else if(e.code==='Space'&&game.phase==='build')$('next-wave').click();else keys.add(e.code);});
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();dragging=false;stickInput={x:0,z:0};});
document.addEventListener('visibilitychange',()=>{audio.setHidden(document.hidden);if(document.hidden&&['wave','build'].includes(game.phase))togglePause();});
const right=new THREE.Vector3(),forward=new THREE.Vector3();
function moveInput(){if(!['build','wave'].includes(game.phase)||!$('night-offer').hidden)return;let x=stickInput.x+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),z=stickInput.z+(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);if(!x&&!z)return;right.setFromMatrixColumn(camera.matrixWorld,0);right.y=0;right.normalize();forward.set(camera.position.x,0,camera.position.z).normalize();moveLantern(game,game.lantern.x+(right.x*x+forward.x*z)*2,game.lantern.z+(right.z*x+forward.z*z)*2);}
function processEvents(){
  for(const e of game.events){
    if(e.type==='encore'){pulse(e.x,e.z,e.r,'#ccaff2');emit(e.x,e.z,9,'#ccaff2');sound(262,.3,'sine',.023);}
    if(e.type==='ghostlight')pulse(e.x,e.z,e.r,'#9bdbd8');
    if(e.type==='gift'){chime(523,.022);notify(`${giftInfo(e.id,e.rank).name} ${rankMark(e.rank)} is yours for the night.`);}
    if(e.type==='spin')pulse(e.x,e.z,e.r,'#9bdbbd');
    if(e.type==='pop'){presentation?.pop(e);emit(e.x,e.z,6,e.kind==='ghost'?'#e5ddff':e.tier?'#b880a4':'#e7c881');sound(e.kind==='ghost'?1175:e.tier?330:990,.09,'triangle',.013);}
    if(e.type==='leak'){emit(e.x,e.z,10,'#e47d66');sound(110,.25,'triangle',.04);notify(e.kind==='ghost'?'A ghost slipped past. Keep it lit near a spinning top.':'A toy reached the last light.');}
    if(e.type==='sleep'){chime(784,.009);pulse(e.x,e.z,.7,'#96b7e1');}
    if(e.type==='clear'){chime(1046,.012);notify(`An hour survived. +${e.reward} brass. Choose your next upgrade.`);sound(523,.3);setTimeout(()=>sound(784,.4),180);if(game.giftOffer)openNightOffer();}
    if(e.type==='end'){
      deselect();$('ending').hidden=false;$('end-kicker').textContent=e.won?'THE MORNING AFTER':'THE CURTAIN FALLS';$('end-title').textContent=e.won?'Here comes the sun.':'One light too few.';
      $('end-copy').textContent=e.won?'The toys are still again. A little crooked, a little stranger. But the light is yours.':'The toys have taken the stage. Keep paper ghosts in your lantern’s glow near a top. A gramophone will buy you time.';
      $('end-stats').textContent=`${e.won?6:Math.max(0,game.wave-1)} HOURS SURVIVED · ${game.kills-game.ghostKills} SHELLS · ${game.ghostKills} GHOSTS`;$('end-gifts').textContent=game.giftHistory.length?GIFT_IDS.filter(id=>game.nightGifts[id]).map(id=>`${giftInfo(id,game.nightGifts[id]).name} ${rankMark(game.nightGifts[id])}`).join(' · '):'';$('restart').focus();sound(e.won?784:147,.8,'sine',.04);
    }
  }game.events.length=0;
}
function animate(now){
  requestAnimationFrame(animate);const raw=(now-lastTime)/1000;lastTime=now;const dt=Math.min(raw,.1);fps+=(1/Math.max(.001,raw)-fps)*.07;frame++;
  if(game.phase!=='paused'&&game.phase!=='lost')clock+=dt;
  moveInput();accumulator+=Math.min(raw,.2)*(game.phase==='wave'?playSpeed:1);while(accumulator>=1/60){stepGame(game,1/60);accumulator-=1/60;}audio.setScene(game.phase,game.wave);processEvents();
  if(lantern){
    const l=game.lantern;lantern.position.set(l.x,.08+Math.sin(clock*5)*.016,l.z);lantern.rotation.z=Math.sin(clock*13)*Math.min(.065,l.speed*.012);lightSpot.position.set(l.x,7,l.z);lightSpot.target.position.set(l.x,0,l.z);lanternGlow.position.set(l.x,.85,l.z);lightDisc.position.set(l.x,.083,l.z);lightRim.position.set(l.x,.09,l.z);
    lightRim.material.opacity=.32+Math.sin(clock*2)*.06;
  }
  if(dollProto){
    for(const [id,o]of enemyModels)if(!game.enemies.some(e=>e.id===id)){disposeGhostView(o);scene.remove(o);enemyModels.delete(id);scene.remove(enemyBars.get(id));enemyBars.delete(id);}
    for(const e of game.enemies){
      let o=enemyModels.get(e.id);
      if(!o){o=e.kind==='ghost'?createGhostView(ghostProto):dollProto.clone(true);scene.add(o);enemyModels.set(e.id,o);const bar=new THREE.Group();mesh(healthGeometry,healthBack,0,0,0,bar);bar.userData.fill=mesh(healthGeometry,healthFill,0,0,.004,bar);scene.add(bar);enemyBars.set(e.id,bar);}
      if(e.kind==='ghost'){
        updateGhostView(o,e,onLight(game,e),game.phase==='paused'?0:dt,camera);
        const bar=enemyBars.get(e.id);bar.position.set(e.x,2.48,e.z);bar.quaternion.copy(camera.quaternion);bar.userData.fill.scale.x=Math.max(0,e.hp/e.maxHp);bar.userData.fill.position.x=-(1-e.hp/e.maxHp)*.36;bar.visible=e.hp<e.maxHp;continue;
      }
      const s=[.69,.96,1.25][e.tier], asleep=e.sleep>0, phase=(e.age*(e.tier===0?2.1:1.45))%1;
      const flight=Math.sin(Math.PI*Math.min(1,Math.max(0,(phase-.2)/.8))), hop=asleep?0:flight*.4;
      const squash=asleep?-.055:phase<.2?-.15*Math.sin(phase/.2*Math.PI):flight*.11;
      const birth=Math.min(1,e.age*7),kick=e.hit/.14;
      o.position.set(e.x,.08+hop,e.z);
      o.rotation.set(asleep?.22:Math.sin(e.age*5)*.055,e.angle,asleep?.19:Math.sin(e.age*9)*.1+kick*.16);
      o.scale.set(s*(1-squash*.45)*birth,s*(1+squash-kick*.08)*birth,s*(1-squash*.45)*birth);
      const bar=enemyBars.get(e.id);bar.position.set(e.x,s*1.72+.24+hop,e.z);bar.quaternion.copy(camera.quaternion);bar.userData.fill.scale.x=Math.max(0,e.hp/e.maxHp);bar.userData.fill.position.x=-(1-e.hp/e.maxHp)*.36;bar.visible=e.hp<e.maxHp;
    }
  }
  for(const t of game.towers){const o=towerModels.get(t.id);if(!o)continue;const lit=onLight(game,{x:o.position.x,z:o.position.z});if(t.type==='top'){o.rotation.y=clock*(lit?12:6)*(giftInfo('overwound',game.nightGifts.overwound)?.rate??1);o.rotation.z=Math.sin(clock*5)*.035;o.scale.setScalar(t.branch==='orbit'?1.2:1.12);if(t.branch==='bowling')o.rotation.x=Math.sin(clock*3)*.08;}else{o.scale.setScalar(1.12);o.rotation.y=stageWidth>=stageHeight?.2:Math.PI/2+.2;o.rotation.z=Math.sin(clock*(lit?9:5))*.02;o.position.y=.18+Math.sin(clock*3)*.018;if(game.phase==='wave'&&Math.floor(clock*1.4)!==o.userData.lastBeat){o.userData.lastBeat=Math.floor(clock*1.4);pulse(o.position.x,o.position.z,t.branch==='invitation'?3.8:3.05,t.branch==='lullaby'?'#b6a9de':'#93b7c5');}}}
  for(let i=effects.length-1;i>=0;i--){const p=effects[i];if(game.phase==='paused')continue;p.life-=dt;if(p.ring){p.mesh.scale.setScalar(p.r*(1-p.life/p.maxLife));p.mesh.material.opacity=.28*p.life/p.maxLife;}else{p.vy-=dt*8;p.mesh.position.x+=p.vx*dt;p.mesh.position.z+=p.vz*dt;p.mesh.position.y+=p.vy*dt;p.mesh.scale.setScalar(Math.min(1,p.life*3));}if(p.life<=0){scene.remove(p.mesh);p.mesh.material.dispose();effects.splice(i,1);}}
  // Reuse a small pool of top projectiles; their positions come directly from simulation.
  while(projectileModels.length<game.shots.length){const o=topProto.clone(true);o.scale.setScalar(.6);scene.add(o);projectileModels.push(o);}
  projectileModels.forEach((o,i)=>{const s=game.shots[i];o.visible=!!s;if(s){o.position.set(s.x,.2,s.z);o.rotation.y=clock*18;}});
  [...$('socket-labels').children].forEach((b,i)=>{
    const [x,z]=SOCKETS[i],tower=game.towers.find(t=>t.slot===i);
    proj.set(x,.11,z).project(camera);const baseY=(-proj.y*.5+.5)*stageHeight;
    b.style.left=`${(proj.x*.5+.5)*stageWidth}px`;
    if(tower){
      // The whole toy is tappable; no badge hides its face or horn.
      proj.set(x,tower.type==='top'?1.98:2.85,z).project(camera);
      const topY=(-proj.y*.5+.5)*stageHeight;
      b.style.top=`${(baseY+topY)/2}px`;b.style.height=`${Math.max(48,baseY-topY+16)}px`;
      b.style.width=`${Math.max(48,1.8*stageWidth/(camera.right-camera.left))}px`;
    }else{b.style.top=`${baseY}px`;b.style.height='';b.style.width='';}
    socketRings[i].material.opacity=selected===i?.85:0;
  });
  const dawnTarget=game.phase==='won'?1:Math.max(0,(game.wave-4)/3)*.48;
  if(game.phase!=='paused')dawnProgress+=(dawnTarget-dawnProgress)*Math.min(1,dt*.35);
  const dawn=dawnProgress;
  scene.background.lerpColors(nightColor,dawnColor,dawn);scene.fog.color.copy(scene.background);ambient.intensity=.62+dawn*.85;keyLight.color.copy(nightKey).lerp(dawnKey,dawn);keyLight.intensity=1.65+dawn*1.4;
  lightSpot.intensity=92+Math.sin(clock*7)*6;lanternGlow.intensity=8+Math.sin(clock*11)*.35;
  presentation?.update(game,clock,dt,camera);stageLook?.update(clock,game.wave,game.phase==='paused'?priorPhase:game.phase);nightView.update(game,clock);
  updateUI();renderer.render(scene,camera);
  window.__GAME__={frame,fps:Math.round(fps),pos:[game.lantern.x,game.lantern.z],speed:game.lantern.speed,score:game.kills,over:game.phase==='won'||game.phase==='lost',draws:renderer.info.render.calls,tris:renderer.info.render.triangles,phase:game.phase,wave:game.wave,lives:game.lives,coins:game.coins,enemies:game.enemies.length,ghosts:game.enemies.filter(e=>e.kind==='ghost').length,exposedGhosts:game.enemies.filter(e=>e.kind==='ghost'&&onLight(game,e)).length,ghostKills:game.ghostKills,towers:game.towers.map(t=>({slot:t.slot,type:t.type,branch:t.branch,range:towerRange(game,t)})),lightRadius:LIGHT_RADIUS,nightGifts:{...game.nightGifts},giftOffer:game.giftOffer,giftHistory:game.giftHistory,encoreBursts:game.encoreBursts,ghostlightsCreated:game.ghostlightsCreated,ghostlights:game.ghostlights.map(p=>({x:p.x,z:p.z,radius:p.radius,life:p.life}))};
  if(frame%15===0){$('stage').dataset.telemetry=JSON.stringify(window.__GAME__);}
}
const projectileModels=[];
try {
  const loaded=await Promise.all(['stage','doll','top','music','lantern','ghost'].map(name=>ASSET(`./assets/${name}.js`)));
  for(let i=0;i<loaded.length;i++)if(!loaded[i].children.length)throw new Error(`Asset failed to load: ${['stage','doll','top','music','lantern','ghost'][i]}`);
  [stageLook]=await Promise.all([dressStage(loaded[0],scene,renderer),dressToys(loaded[1],loaded[3],loaded[2],renderer)]);
  resize();
  loaded.forEach(handmade);ghostProto=loaded[5];
  const stage=loaded[0];stage.position.y=-.7;scene.add(stage);[dollProto,topProto,musicProto]=loaded.slice(1,4);lantern=loaded[4];scene.add(lantern);goalLantern=lantern.clone(true);goalLantern.scale.setScalar(1.4);goalLantern.position.set(8,.12,3.6);scene.add(goalLantern);
  presentation=createPresentation(scene,topProto);
  syncTowers();$('startb').disabled=false;$('startb').textContent='Raise the curtain →';$('startb').focus();window.__READY__=true;window.__START__=start;requestAnimationFrame(animate);
}catch(error){$('fatal').hidden=false;$('fatal').textContent=`The playhouse could not open: ${error.message}. Reload to try again.`;console.error(error);}
