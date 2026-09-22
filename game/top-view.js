import * as THREE from 'three';
import {bakeStatic} from './assetlib.js';
import {handmade} from './presentation.js';
import {SOCKETS,onLight} from './sim.js';
import {giftInfo} from './night-gifts.js';

const brass=new THREE.MeshStandardMaterial({color:'#c7a064',metalness:.62,roughness:.34});
const teal=new THREE.MeshStandardMaterial({color:'#39897f',metalness:.2,roughness:.46});
const ivory=new THREE.MeshStandardMaterial({color:'#e5d5b0',roughness:.48});
function lathe(points,material,parent){const o=new THREE.Mesh(new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(...p)),32),material);parent.add(o);return o;}
function ring(r,y,tube,material,parent){const o=new THREE.Mesh(new THREE.TorusGeometry(r,tube,4,32),material);o.rotation.x=Math.PI/2;o.position.y=y;parent.add(o);}
const bowling=new THREE.Group();
lathe([[.80,.705],[.86,.745],[.868,.84],[.826,.925],[.783,.952]],brass,bowling);
ring(.87,.79,.024,teal,bowling);
for(let i=0;i<6;i++){
  const a=i*Math.PI/3,points=[[.48,1.19],[.69,1.065],[.84,.925]].map(([r,y])=>new THREE.Vector3(Math.sin(a)*r,y,Math.cos(a)*r));
  bowling.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),8,.026,5,false),brass));
  const rivet=new THREE.Mesh(new THREE.SphereGeometry(.043,6,4),ivory);rivet.position.set(Math.sin(a)*.867,.815,Math.cos(a)*.867);bowling.add(rivet);
}
const wide=new THREE.Group();
lathe([[.76,.9],[.985,.87],[1.02,.93],[1.005,1.01],[.77,1.055]],teal,wide);
ring(1.015,.95,.021,brass,wide);ring(.986,1.02,.024,ivory,wide);
for(let i=0;i<8;i++){
  const a=i*Math.PI/4,o=new THREE.Mesh(new THREE.SphereGeometry(.045,6,4),brass);o.position.set(Math.sin(a)*1.02,.95,Math.cos(a)*1.02);wide.add(o);
}
const bowlingProto=bakeStatic(bowling),orbitProto=bakeStatic(wide);
for(const p of [bowlingProto,orbitProto]){handmade(p);p.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});}
const sweepGeometry=new THREE.RingGeometry(.955,1,40,1,0,Math.PI*.65);
const trailGeometry=new THREE.PlaneGeometry(.43,1);
const trailMaterial=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,side:THREE.DoubleSide,
  vertexShader:'varying vec2 trailUV;void main(){trailUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'varying vec2 trailUV;void main(){float edge=pow(max(0.0,1.0-abs(trailUV.x-.5)*2.0),2.0);float fade=pow(1.0-trailUV.y,1.6);gl_FragColor=vec4(.94,.73,.38,edge*fade*.48);}'
});

export function createTopView(proto){
  const root=new THREE.Group(),rotor=new THREE.Group(),toy=proto.clone(true);
  rotor.add(toy);root.add(rotor);
  const belt=bowlingProto.clone(true),crown=orbitProto.clone(true);rotor.add(belt,crown);belt.visible=crown.visible=false;
  const satellites=[];
  for(let i=0;i<2;i++){const o=proto.clone(true);o.scale.setScalar(.31);o.visible=false;root.add(o);satellites.push(o);}
  const sweeps=[];
  for(let i=0;i<2;i++){const o=new THREE.Mesh(sweepGeometry,new THREE.MeshBasicMaterial({color:'#a7dcc7',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));o.rotation.x=-Math.PI/2;o.position.y=-.055;o.visible=false;root.add(o);sweeps.push(o);}
  root.userData.top={rotor,belt,crown,satellites,sweeps,branch:undefined,spin:0,orbit:0,recoil:0,dx:0,dz:1,flash:0,radius:0,attacks:0};
  return root;
}

export function triggerTopAttack(root,event){
  const v=root?.userData.top;if(!v)return;
  v.attacks++;v.recoil=1;
  if(event.type==='launch'){v.dx=event.dx;v.dz=event.dz;}
  else{v.flash=1;v.radius=event.r;}
}

export function updateTopView(root,t,game,dt,reducedMotion=false){
  const v=root.userData.top,[x,z]=SOCKETS[t.slot],isOrbit=t.branch==='orbit',isBowling=t.branch==='bowling';
  const delta=['paused','lost','won'].includes(game.phase)?0:dt;
  if(v.branch!==t.branch){
    v.branch=t.branch;v.belt.visible=isBowling;v.crown.visible=isOrbit;
    v.rotor.scale.set(isBowling?1.12:isOrbit?1.1:1.05,isBowling?.86:1.05,isBowling?1.12:isOrbit?1.1:1.05);
    v.satellites.forEach(o=>o.visible=isOrbit);
    v.sweeps.forEach(o=>o.material.color.set(isOrbit?'#91d9c5':'#e6cf91'));
  }
  const boost=(onLight(game,{x,z})?1.8:1)*(giftInfo('overwound',game.nightGifts.overwound)?.rate??1);
  if(!reducedMotion){v.spin+=delta*(isBowling?7:10)*boost;v.orbit+=delta*2.5*boost;}
  v.recoil=Math.max(0,v.recoil-delta*6);v.flash=Math.max(0,v.flash-delta*(isOrbit?3.8:5));
  root.position.set(x,.13,z);
  const kick=reducedMotion?0:v.recoil,wobble=reducedMotion?0:.028;
  v.rotor.position.set(isBowling?-v.dx*kick*.16:0,0,isBowling?-v.dz*kick*.16:0);
  v.rotor.rotation.set(Math.sin(v.spin*.31)*wobble+(isBowling?-v.dz*kick*.12:0),v.spin,Math.cos(v.spin*.31)*wobble+(isBowling?v.dx*kick*.12:0));
  v.satellites.forEach((o,i)=>{const a=v.orbit+i*Math.PI;o.position.set(Math.sin(a)*1.4,.025,Math.cos(a)*1.4);o.rotation.y=-v.spin*1.5;});
  v.sweeps.forEach((o,i)=>{o.visible=v.flash>0;o.scale.setScalar(v.radius*(reducedMotion?1:.72+(1-v.flash)*.28));o.rotation.z=i*Math.PI+(reducedMotion?0:v.spin*.3+(1-v.flash)*1.6);o.material.opacity=v.flash*.28;});
}

export function disposeTopView(root){root.userData.top?.sweeps.forEach(o=>o.material.dispose());}

export function createTopProjectile(proto){
  const root=new THREE.Group(),rotor=new THREE.Group();rotor.add(proto.clone(true),bowlingProto.clone(true));rotor.scale.set(.55,.46,.55);root.add(rotor);
  const trail=new THREE.Mesh(trailGeometry,trailMaterial);trail.rotation.x=-Math.PI/2;trail.position.y=-.075;root.add(trail);
  root.userData.projectile={rotor,trail,shot:null,distance:0,x:0,z:0};return root;
}
export function updateTopProjectile(root,shot,clock,reducedMotion=false){
  root.visible=!!shot;const v=root.userData.projectile;
  if(!shot){v.shot=null;v.distance=0;return;}
  if(v.shot!==shot){v.shot=shot;v.distance=0;}else v.distance+=Math.hypot(shot.x-v.x,shot.z-v.z);
  v.x=shot.x;v.z=shot.z;
  root.position.set(shot.x,.13,shot.z);root.rotation.y=Math.atan2(shot.vx,shot.vz);
  v.rotor.rotation.y=reducedMotion?0:clock*22;
  const length=Math.min(1.7,v.distance);v.trail.visible=!reducedMotion&&length>.02;v.trail.scale.y=length;v.trail.position.z=-length/2;
}
