import * as THREE from 'three';

// Painted surfaces are loaded after the constructor assets have been merged.
export async function dressToys(doll,music,top,renderer){
  const loader=new THREE.TextureLoader();
  const [wrap,panel]=await Promise.all([
    loader.loadAsync(new URL('./textures/nesting-doll-painted-v1.jpg',import.meta.url).href),
    loader.loadAsync(new URL('./textures/gramophone-panel-v1.jpg',import.meta.url).href),
  ]);
  for(const texture of [wrap,panel]){texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
  wrap.wrapS=THREE.RepeatWrapping;
  doll.traverse(o=>{
    if(!o.isMesh||o.material.color.getHexString()!=='a74455')return;
    const p=o.geometry.attributes.position,uv=new Float32Array(p.count*2);
    // Unwrap each triangle together so the rear seam does not cross the face.
    for(let i=0;i<p.count;i+=3){
      const us=[];for(let j=0;j<3;j++)us.push(Math.atan2(p.getX(i+j),p.getZ(i+j))/(Math.PI*2)+.5);
      const seam=Math.max(...us)-Math.min(...us)>.5;
      for(let j=0;j<3;j++){uv[(i+j)*2]=seam&&us[j]<.5?us[j]+1:us[j];uv[(i+j)*2+1]=p.getY(i+j)/1.69;}
    }
    o.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
    o.material.map=wrap;o.material.color.set('#ffffff');o.material.userData.handmade=false;o.material.roughness=.46;o.material.needsUpdate=true;
  });
  const floral=wrap.clone();floral.repeat.set(.28,1);floral.offset.set(0,0);floral.needsUpdate=true;
  top.traverse(o=>{
    if(!o.isMesh||o.material.color.getHexString()!=='aa5848')return;
    o.material.map=floral;o.material.color.set('#ffffff');o.material.userData.handmade=false;o.material.roughness=.4;o.material.needsUpdate=true;
  });
  music.traverse(o=>{
    if(!o.isMesh||o.material.color.getHexString()!=='183a40')return;
    o.material.map=panel;o.material.color.set('#ffffff');o.material.userData.handmade=false;o.material.roughness=.42;o.material.needsUpdate=true;
  });
}
