import * as THREE from 'three';
import {bakeStatic} from './assetlib.js';
import {handmade} from './presentation.js';
import {DRUM} from './sim.js';

const brass=new THREE.MeshStandardMaterial({color:'#d0a655',metalness:.72,roughness:.3});
const red=new THREE.MeshStandardMaterial({color:'#963c48',metalness:.32,roughness:.44});
const cream=new THREE.MeshStandardMaterial({color:'#eed9a8',roughness:.65});
const arm=new THREE.Group();
function rod(a,b,r,mat){const v=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v.length(),8),mat);o.position.set(...a).addScaledVector(v,.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());arm.add(o);}
rod([0,0,0],[0,-.3,.36],.10,red);rod([0,-.3,.36],[0,-.28,.84],.028,brass);
const glove=new THREE.Mesh(new THREE.SphereGeometry(.105,12,8),cream);glove.position.set(0,-.3,.36);arm.add(glove);
const tip=new THREE.Mesh(new THREE.SphereGeometry(.065,10,6),cream);tip.position.set(0,-.28,.84);arm.add(tip);
const armProto=bakeStatic(arm);handmade(armProto);armProto.traverse(o=>{o.castShadow=true;});
const warningGeometry=new THREE.RingGeometry(.98,1,64);

export function createDrummerView(proto){
  const root=proto.clone(true),offset=proto.children[0].position,arms=[];
  for(const side of [-1,1]){const a=armProto.clone(true);a.position.set(side*.49,1.60,.1).add(offset);root.add(a);arms.push(a);}
  const warning=new THREE.Mesh(warningGeometry,new THREE.MeshBasicMaterial({color:'#f6ba61',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
  warning.rotation.x=-Math.PI/2;warning.position.y=.015;root.add(warning);
  root.userData.drummer={arms,warning};return root;
}
export function updateDrummerView(root,e){
  const {arms,warning}=root.userData.drummer,asleep=e.sleep>0;
  const wind=asleep?0:Math.max(0,1-e.drumClock/DRUM.windup);
  const strike=Math.max(0,1-(DRUM.interval-e.drumClock)/.25);
  root.position.set(e.x,.045+(asleep?0:Math.abs(Math.sin(e.age*5))*.055),e.z);
  root.rotation.set(asleep?.12:-wind*.065,e.angle,asleep?.15:Math.sin(e.age*5)*.065+e.hit*.5);
  const birth=Math.min(1,e.age*5);root.scale.setScalar(birth);
  arms.forEach((a,i)=>{a.rotation.x=asleep?0:strike>0?0:-.22-wind*.9+Math.sin(e.age*8+i*Math.PI)*.07;});
  warning.scale.setScalar(DRUM.radius);warning.material.opacity=wind*.44;warning.visible=wind>0;
}
export function disposeDrummerView(root){root.userData.drummer?.warning.material.dispose();}
