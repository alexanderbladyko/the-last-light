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
      o.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));m.map=wood;m.color.set('#c4cec6');
      m.userData.handmade=false;m.roughness=.82;
      m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(.033,.047,.055),.16);');};
      m.customProgramCacheKey=()=> 'painted-wood-depth-v3';
    }else if(m.color.getHexString()==='846044')m.color.set('#223c40');
  });

  const set=new THREE.Group();
  const velvet=new THREE.MeshStandardMaterial({color:'#542031',roughness:.95});
  const velvetLight=new THREE.MeshStandardMaterial({color:'#733243',roughness:.92});
  const brass=new THREE.MeshStandardMaterial({color:'#b88b4d',metalness:.62,roughness:.32});
  const dark=new THREE.MeshStandardMaterial({color:'#153338',roughness:.9});
  const paper=new THREE.MeshStandardMaterial({color:'#233947',roughness:1,side:THREE.DoubleSide});
  const paint=new THREE.MeshStandardMaterial({map:painting,emissiveMap:painting,emissive:'#ffffff',emissiveIntensity:.12,roughness:1});
  function add(geo,mat,x,y,z){const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);set.add(o);return o;}
  add(new THREE.BoxGeometry(19.7,4.9,.16),dark,0,2.5,-.12);
  add(new THREE.PlaneGeometry(19.3,4.85),paint,0,2.52,-.02);
  // Continuous velvet folds pinch at the tie instead of reading as red pipes.
  function curtain(side){
    const positions=[],indices=[],cols=36,rows=24;
    for(let row=0;row<=rows;row++){
      const v=row/rows,width=2.15-.95*Math.exp(-Math.pow((v-.34)/.2,2));
      for(let col=0;col<=cols;col++){
        const u=col/cols;
        positions.push(side*(10-u*width),v*4.85+.04*Math.sin(u*18),.34+.20*Math.cos(u*Math.PI*10)+.12*Math.sin(v*4));
        if(row&&col){const n=row*(cols+1)+col;indices.push(n-cols-2,n-cols-1,n,n-cols-2,n,n-1);}
      }
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
    const fabric=velvet.clone();fabric.side=THREE.DoubleSide;add(geo,fabric,0,0,0);
    const edge=[];for(let i=0;i<=24;i++){const v=i/24,width=2.15-.95*Math.exp(-Math.pow((v-.34)/.2,2));edge.push(new THREE.Vector3(side*(10-width),v*4.85,.58+.12*Math.sin(v*4)));}
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge),32,.028,5,false),brass,0,0,0);
    for(let i=0;i<16;i++){
      const x=side*(9.95-i*.129);add(new THREE.ConeGeometry(.037,.14,6),brass,x,.025,.54+.04*Math.cos(i));
    }
    const tie=add(new THREE.TorusGeometry(.38,.042,6,32),brass,side*9.35,1.65,.47);tie.rotation.x=Math.PI/2;tie.scale.x=1.8;
    add(new THREE.CylinderGeometry(.055,.02,.38,8),brass,side*8.8,1.29,.66);
  }
  for(const side of [-1,1])curtain(side);
  add(new THREE.BoxGeometry(20,.15,.55),brass,0,5.02,.06);
  for(let i=0;i<10;i++){const swag=add(new THREE.SphereGeometry(1.05,16,10),velvet,-8.8+i*1.95,4.75,.19);swag.scale.set(1,.35,.36);}
  // Staggered cut-paper buildings catch real shadows in front of the painting.
  const windowLight=new THREE.MeshBasicMaterial({color:'#bd8846'});
  function house(x,height,z,width,material){
    const shape=new THREE.Shape();shape.moveTo(-width/2,0);shape.lineTo(width/2,0);shape.lineTo(width/2,height*.70);shape.lineTo(width*.10,height);shape.lineTo(-width/2,height*.72);shape.closePath();
    add(new THREE.ExtrudeGeometry(shape,{depth:.09,bevelEnabled:false}),material,x,.025,z);
    for(const xx of [-.20,.20])for(const yy of [.32,.61]){
      if(width<.7&&xx>0)continue;
      add(new THREE.BoxGeometry(.085,height*.105,.035),windowLight,x+xx,yy*height,z+.11);
    }
  }
  const rearPaper=new THREE.MeshStandardMaterial({color:'#1b2a3a',roughness:1}),frontPaper=new THREE.MeshStandardMaterial({color:'#263640',roughness:1});
  for(const side of [-1,1]){
    house(side*6.55,2.35,.65,1.15,rearPaper);
    house(side*7.6,3.0,.42,.8,rearPaper);
    house(side*5.5,1.15,1.1,1.25,frontPaper);
    house(side*7.1,1.55,1.23,.73,frontPaper);
  }
  // The mechanical clock sits in front of the painted sky; the moon stays in the artwork.
  const dial=new THREE.Group();
  const dialInk=new THREE.MeshStandardMaterial({color:'#26302f',metalness:.22,roughness:.55});
  const clockFace=new THREE.Mesh(new THREE.CylinderGeometry(.93,.93,.15,48),dialInk);clockFace.rotation.x=Math.PI/2;dial.add(clockFace);
  for(const [radius,thickness]of [[.97,.053],[.85,.012],[.72,.009]]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,thickness,6,48),brass);ring.position.z=.095;dial.add(ring);
  }
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6,tick=new THREE.Mesh(new THREE.BoxGeometry(i%3?.028:.045,i%3?.09:.15,.025),brass);
    tick.position.set(Math.sin(a)*.79,Math.cos(a)*.79,.10);tick.rotation.z=-a;dial.add(tick);
  }
  const hourHand=new THREE.Group();hourHand.position.z=.14;
  const handShape=new THREE.Shape();handShape.moveTo(-.035,-.10);handShape.lineTo(-.047,.35);handShape.lineTo(0,.57);handShape.lineTo(.047,.35);handShape.lineTo(.035,-.10);handShape.closePath();
  hourHand.add(new THREE.Mesh(new THREE.ExtrudeGeometry(handShape,{depth:.015,bevelEnabled:false}),brass));dial.add(hourHand);
  const minuteHand=new THREE.Mesh(new THREE.BoxGeometry(.026,.69,.022),brass);minuteHand.position.set(0,.25,.16);dial.add(minuteHand);
  const pin=new THREE.Mesh(new THREE.SphereGeometry(.065,12,8),brass);pin.position.z=.18;dial.add(pin);
  dial.remove(hourHand);const clockShell=bakeStatic(dial);dial.clear();dial.add(clockShell,hourHand);dial.position.set(.15,2.9,.48);
  const hangers=[];
  for(const [i,x,y,rr] of [[0,-4.6,3.3,.27],[1,-2.1,2.7,.2],[2,.3,3.55,.23],[3,5.0,3.9,.19]]){
    const shape=new THREE.Shape();for(let j=0;j<10;j++){const a=j*Math.PI/5+Math.PI/2,rad=j%2?rr*.42:rr;j?shape.lineTo(Math.cos(a)*rad,Math.sin(a)*rad):shape.moveTo(Math.cos(a)*rad,Math.sin(a)*rad);}shape.closePath();
    const hanging=new THREE.Group();hanging.position.set(x,4.9,.63);
    const line=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,4.9-y,4),brass);line.position.y=-(4.9-y)/2;hanging.add(line);
    const star=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.04,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:1,steps:1}),brass);star.position.y=y-4.9;hanging.add(star);hangers.push(hanging);
  }
  const facade=new THREE.Group();facade.add(bakeStatic(set),dial,...hangers);facade.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(facade);
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
  const arch=[];for(let i=0;i<=20;i++){const a=i*Math.PI/20;arch.push(new THREE.Vector3(Math.cos(a)*1.03,2.22+Math.sin(a)*.36,.18));}
  gate(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arch),24,.045,6,false),brass,0,0,0);
  for(const side of [-1,1])for(const y of [.18,.3,1.94,2.10])gate(new THREE.BoxGeometry(.26,.07,.33),brass,side*.96,y,.09);
  const crest=new THREE.Shape();
  for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,rr=i%2?.12:.28;if(i)crest.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);else crest.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}
  crest.closePath();gate(new THREE.ExtrudeGeometry(crest,{depth:.06,bevelEnabled:false}),brass,0,2.5,.08);
  const gateSet=bakeStatic(entrance);gateSet.traverse(o=>{o.castShadow=true;o.receiveShadow=true;});scene.add(gateSet);
  function layout(portrait){
    gateSet.rotation.y=portrait?Math.PI/2:0;
    gateSet.position.set(portrait?-8.25:-8,0,portrait?-4.1:-4.55);
    facade.rotation.y=portrait?Math.PI/2:0;
    facade.scale.x=portrait?.75:1;
    facade.position.set(portrait?-9.75:0,0,portrait?0:-6.85);
  }
  layout(false);
  function update(clock,wave,phase){
    hangers.forEach((o,i)=>o.rotation.z=Math.sin(clock*.7+i*1.8)*.035);
    const hour=phase==='won'?6:phase==='build'?wave:Math.max(0,wave-1);
    hourHand.rotation.z=-hour*Math.PI/6;
  }
  return {layout,update};
}
