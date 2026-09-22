import * as THREE from 'three';
import {bakeStatic} from './assetlib.js';
import {handmade} from './presentation.js';
import {MUSIC_PIVOTS} from './assets/music.js';
import {SOCKETS,towerRange,onLight} from './sim.js';

const rippleGeometry=new THREE.RingGeometry(.982,1,64);
const moonShape=new THREE.Shape();
moonShape.absarc(0,0,.25,.62,5.66,false);moonShape.quadraticCurveTo(-.48,0,.203,.145);
const crest=new THREE.Group(),crestGold=new THREE.MeshStandardMaterial({color:'#cce4e7',metalness:.4,roughness:.38});
const moon=new THREE.Mesh(new THREE.ExtrudeGeometry(moonShape,{depth:.045,bevelEnabled:false}),crestGold);moon.position.set(0,1.34,.03);crest.add(moon);
const stem=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.35,8),crestGold);stem.position.set(0,1.06,.05);crest.add(stem);
const crestProto=bakeStatic(crest);handmade(crestProto);
const normalInside=new THREE.Color('#be8c42'),sleepInside=new THREE.Color('#7fbaca'),inviteInside=new THREE.Color('#e1ae61');
const teal=new THREE.Color('#367b75'),nightBlue=new THREE.Color('#315d80'),wine=new THREE.Color('#704052');

export function createGramophoneView(proto){
  const root=proto.clone(true),body=root.children[0],materials=new Map(),parts={};
  // Reparent the recipe loader's material batches without duplicating geometry.
  root.traverse(o=>{if(!o.isMesh)return;if(!materials.has(o.material))materials.set(o.material,o.material.clone());o.material=materials.get(o.material);});
  for(const [name,position] of Object.entries(MUSIC_PIVOTS)){
    const pivot=new THREE.Group();pivot.position.set(...position);
    for(const o of [...body.children])if(o.material?.userData.gramophonePart===name){body.remove(o);o.position.sub(pivot.position);pivot.add(o);}
    body.add(pivot);parts[name]=pivot;
  }
  const second=parts.horn.clone(true);body.add(second);second.visible=false;
  const crest=crestProto.clone(true);parts.horn.add(crest);crest.visible=false;
  const ripples=[];
  for(let i=0;i<3;i++){
    const o=new THREE.Mesh(rippleGeometry,new THREE.MeshBasicMaterial({color:'#9dd4cd',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
    o.rotation.x=-Math.PI/2;o.position.y=-.13;o.visible=false;root.add(o);ripples.push(o);
  }
  const inner=[...materials.values()].find(m=>m.color.getHexString()==='be8c42');
  const cabinet=[...materials.values()].find(m=>m.color.getHexString()==='367b75');
  root.userData.gramophone={body,parts,second,crest,ripples,materials:[...materials.values()],inner,cabinet,branch:undefined,yaw:0,turn:0,pulse:0,playing:0};
  root.scale.setScalar(1.08);handmade(root);return root;
}

export function updateGramophoneView(root,t,game,clock,dt,facing,reducedMotion=false){
  const v=root.userData.gramophone,[x,z]=SOCKETS[t.slot],range=towerRange(game,t);
  const paused=game.phase==='paused',active=game.phase==='wave';
  const delta=paused||['lost','won'].includes(game.phase)?0:dt;
  const lit=onLight(game,{x,z}),lullaby=t.branch==='lullaby',invitation=t.branch==='invitation';
  if(v.branch!==t.branch){
    v.branch=t.branch;v.second.visible=invitation;v.crest.visible=lullaby;
    v.parts.horn.scale.setScalar(invitation?.77:1);v.second.scale.setScalar(.77);
    v.parts.horn.position.x=invitation?-.45:MUSIC_PIVOTS.horn[0];v.second.position.x=.45;
    v.inner.color.copy(lullaby?sleepInside:invitation?inviteInside:normalInside);
    v.inner.emissive.set(lullaby?'#255971':invitation?'#6b3513':'#000000');
    v.cabinet.color.copy(lullaby?nightBlue:invitation?wine:teal);
    v.ripples.forEach(o=>o.material.color.set(lullaby?'#a5d7f0':invitation?'#e4b873':'#a3cfbc'));
  }
  let target=null,best=range;
  if(active)for(const e of game.enemies){if(e.dead)continue;const d=Math.hypot(e.x-x,e.z-z);if(d<best){target=e;best=d;}}
  const goal=target?Math.atan2(target.x-x,target.z-z)-facing:0;
  const angle=Math.atan2(Math.sin(goal),Math.cos(goal)),wanted=THREE.MathUtils.clamp(angle,-.85,.85);
  const ease=1-Math.exp(-delta*5);
  v.yaw+=(wanted-v.yaw)*ease;v.playing+=((target?1:0)-v.playing)*ease;
  if(active)v.turn+=delta*(lullaby?2.1:3.5)*(lit?1.5:1);
  if(active&&target)v.pulse+=delta/(lullaby?2.1:1.3);
  root.position.set(x,.18,z);root.rotation.y=facing;
  v.body.rotation.z=reducedMotion?0:Math.sin(clock*(lullaby?3:9))*.009*v.playing;
  v.parts.record.rotation.y=reducedMotion?0:v.turn;
  v.parts.crank.rotation.x=reducedMotion?0:v.turn*.55;
  v.parts.horn.rotation.y=v.yaw+(invitation?-.38:0);v.second.rotation.y=v.yaw+.38;
  const lean=reducedMotion?0:-v.playing*.055+Math.sin(clock*(lullaby?2.2:6))*.015*v.playing;
  v.parts.horn.rotation.x=lean;v.second.rotation.x=lean;
  v.inner.emissiveIntensity=lullaby?.18+v.playing*.26:invitation?.15+v.playing*.16:0;
  v.ripples.forEach((o,i)=>{
    const p=(v.pulse+i/3)%1;
    o.visible=(active||paused)&&v.playing>.02;
    o.scale.setScalar(range*(reducedMotion?1:.2+.8*p)/root.scale.x);
    o.material.opacity=(reducedMotion?.08:Math.sin(p*Math.PI)*.16)*v.playing;
  });
}

export function disposeGramophoneView(root){
  const v=root.userData.gramophone;if(!v)return;
  v.materials.forEach(m=>m.dispose());v.ripples.forEach(o=>o.material.dispose());
}
