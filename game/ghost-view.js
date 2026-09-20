import * as THREE from 'three';
import {handmade} from './presentation.js';

const hiddenColor=new THREE.Color('#8f95c7'),revealedColor=new THREE.Color('#fff0c4');
const hiddenGlow=new THREE.Color('#292c55'),revealedGlow=new THREE.Color('#6b471d');
export function createGhostView(proto){
  const root=proto.clone(true),materials=new Map(),reveal={value:0};
  root.traverse(o=>{
    if(!o.isMesh)return;
    if(!materials.has(o.material)){const m=o.material.clone();m.transparent=true;m.depthWrite=false;materials.set(o.material,m);}
    o.material=materials.get(o.material);o.castShadow=false;
  });
  handmade(root);
  for(const m of materials.values()){
    const wear=m.onBeforeCompile;
    m.onBeforeCompile=shader=>{
      wear(shader);shader.uniforms.ghostReveal=reveal;
      shader.vertexShader='uniform float ghostReveal;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        float wing=max(0.0,abs(position.x)-.29);
        float foldAngle=(1.0-ghostReveal)*1.23;
        transformed.x=sign(position.x)*(min(abs(position.x),.29)+wing*cos(foldAngle));
        transformed.z+=wing*sin(foldAngle);
      `);
    };
    m.customProgramCacheKey=()=> 'ghost-fold-v1';
  }
  const halo=new THREE.Mesh(new THREE.RingGeometry(.46,.51,28),new THREE.MeshBasicMaterial({color:'#9a9dc8',side:THREE.DoubleSide,transparent:true,opacity:.5,depthWrite:false}));
  halo.rotation.x=-Math.PI/2;halo.position.y=.01;root.add(halo);
  root.userData.ghost={materials:[...materials.values()],reveal,halo};
  return root;
}
export function updateGhostView(root,e,lit,dt,camera){
  const view=root.userData.ghost;
  view.reveal.value+=(Number(lit)-view.reveal.value)*Math.min(1,dt*13);
  const amount=view.reveal.value;
  root.position.set(e.x,.48+Math.sin(e.age*3+e.id)*.12,e.z);
  root.rotation.set(e.sleep>0?.12:Math.sin(e.age*2)*.035,Math.atan2(camera.position.x-e.x,camera.position.z-e.z),Math.sin(e.age*3)*.055+e.hit*.5);
  const birth=Math.min(1,e.age*6);root.scale.setScalar(birth*1.1);
  for(const m of view.materials){
    const face=m.name==='ghost-face';
    m.opacity=face?amount:lit?.95:.5;
    if(!face){m.color.copy(hiddenColor).lerp(revealedColor,amount);m.emissive.copy(hiddenGlow).lerp(revealedGlow,amount);m.emissiveIntensity=.35;}
  }
  view.halo.material.color.set(lit?'#ffdb8b':'#9295c9');view.halo.scale.setScalar(1+amount*.28);
}
export function disposeGhostView(root){
  const view=root.userData.ghost;if(!view)return;
  for(const m of view.materials)m.dispose();view.halo.geometry.dispose();view.halo.material.dispose();
}
