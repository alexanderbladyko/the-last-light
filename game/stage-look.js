import * as THREE from 'three';
import {bakeStatic} from './assetlib.js';

export async function dressStage(stage, scene, renderer){
  const loader=new THREE.TextureLoader();
  const [wood,painting]=await Promise.all([
    loader.loadAsync(new URL('./textures/painted-wood-v1.jpg',import.meta.url).href),
    loader.loadAsync(new URL('./textures/moonlit-village-v1.jpg',import.meta.url).href),
  ]);
  for(const t of [wood,painting]){t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
  wood.wrapS=wood.wrapT=THREE.RepeatWrapping;
  stage.traverse(o=>{
    if(!o.isMesh)return;
    const m=o.material;
    if(m.color.getHexString()==='76583f'){
      const p=o.geometry.attributes.position,uv=new Float32Array(p.count*2);
      for(let i=0;i<p.count;i++){uv[i*2]=(p.getX(i)+10)/6.4;uv[i*2+1]=(p.getZ(i)+7.5)/14.9;}
      o.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));m.map=wood;m.color.set('#cbd7ca');
      m.userData.handmade=false;m.roughness=.92;
      m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(.047,.087,.078),.48);');};
      m.customProgramCacheKey=()=> 'quiet-painted-wood-v2';
    }else if(m.color.getHexString()==='846044')m.color.set('#223c40');
  });

  const set=new THREE.Group();
  const velvet=new THREE.MeshStandardMaterial({color:'#762b40',roughness:.95});
  const velvetLight=new THREE.MeshStandardMaterial({color:'#a34250',roughness:.92});
  const brass=new THREE.MeshStandardMaterial({color:'#c9a35e',metalness:.35,roughness:.45});
  const dark=new THREE.MeshStandardMaterial({color:'#153338',roughness:.9});
  const paper=new THREE.MeshStandardMaterial({color:'#376466',roughness:1,side:THREE.DoubleSide});
  const paint=new THREE.MeshStandardMaterial({map:painting,emissiveMap:painting,emissive:'#ffffff',emissiveIntensity:.24,roughness:1});
  function add(geo,mat,x,y,z){const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);set.add(o);return o;}
  add(new THREE.BoxGeometry(19.7,4.9,.16),dark,0,2.5,-.12);
  add(new THREE.PlaneGeometry(19.3,4.85),paint,0,2.52,-.02);
  for(const side of [-1,1]){
    for(let i=0;i<6;i++){
      const fold=add(new THREE.CylinderGeometry(.28,.35,4.85,12),i%2?velvet:velvetLight,side*(8.45+i*.24),2.45,.28+Math.sin(i)*.09);
      fold.scale.z=.8;
    }
    const tie=add(new THREE.TorusGeometry(.53,.045,6,24),brass,side*9.05,1.15,.26);tie.rotation.x=Math.PI/2;tie.scale.x=1.65;
  }
  add(new THREE.BoxGeometry(20,.15,.55),brass,0,5.02,.06);
  for(let i=0;i<10;i++){const swag=add(new THREE.SphereGeometry(1.05,16,10),velvet,-8.8+i*1.95,4.75,.19);swag.scale.set(1,.35,.36);}
  for(const side of [-1,1])for(let i=0;i<3;i++){
    const h=1.05+i*.43,x=side*(6.5+i*.55),s=new THREE.Shape();
    s.moveTo(-.55,0);s.lineTo(-.18,h*.35);s.lineTo(-.4,h*.35);s.lineTo(0,h);s.lineTo(.4,h*.35);s.lineTo(.18,h*.35);s.lineTo(.55,0);s.closePath();
    add(new THREE.ExtrudeGeometry(s,{depth:.045,bevelEnabled:false}),paper,x,.02,.7+i*.08);
  }
  const facade=bakeStatic(set);facade.traverse(o=>{o.castShadow=true;o.receiveShadow=true;});scene.add(facade);
  // A little curtain gives the route a visible entrance, rather than a cut end.
  const entrance=new THREE.Group();
  function gate(geo,mat,x,y,z){const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);entrance.add(o);return o;}
  gate(new THREE.BoxGeometry(1.92,2.16,.15),dark,0,1.08,-.08);
  gate(new THREE.BoxGeometry(1.92,.1,.48),brass,0,.05,.08);
  for(const side of [-1,1]){
    gate(new THREE.CylinderGeometry(.06,.06,2.2,10),brass,side*.91,1.15,.13);
    for(let i=0;i<3;i++)gate(new THREE.CylinderGeometry(.12,.14,1.97,10),i%2?velvet:velvetLight,side*(.58+i*.12),1.05,.15);
  }
  gate(new THREE.BoxGeometry(2.05,.12,.38),brass,0,2.23,.03);
  const crest=new THREE.Shape();
  for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,rr=i%2?.12:.28;if(i)crest.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);else crest.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}
  crest.closePath();gate(new THREE.ExtrudeGeometry(crest,{depth:.06,bevelEnabled:false}),brass,0,2.5,.08);
  const gateSet=bakeStatic(entrance);gateSet.traverse(o=>{o.castShadow=true;o.receiveShadow=true;});scene.add(gateSet);
  function layout(portrait){
    gateSet.rotation.y=portrait?Math.PI/2:0;
    gateSet.position.set(portrait?-8.65:-8,0,portrait?-4.1:-4.55);
    facade.rotation.y=portrait?Math.PI/2:0;
    facade.scale.x=portrait?.75:1;
    facade.position.set(portrait?-9.75:0,0,portrait?0:-6.85);
  }
  layout(false);
  return {layout};
}
