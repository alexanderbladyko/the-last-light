import * as THREE from 'three';

// A small, prefiltered studio reflection gives the brass rounded highlights.
// It is generated once; no extra scene lights or per-frame passes are needed.
export function stageReflections(scene,renderer){
  const room=new THREE.Scene();room.background=new THREE.Color('#263447');
  for(const [color,intensity,x,y,z,w,h]of [
    ['#ffbd6a',3,-5,4,3,5,8],['#fff2cb',2,1,8,-2,8,3],['#adc3ea',1,5,2,-4,3,6],
  ]){
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(intensity)}));
    panel.position.set(x,y,z);panel.lookAt(0,0,0);room.add(panel);
  }
  const pmrem=new THREE.PMREMGenerator(renderer),target=pmrem.fromScene(room,.025,.1,50);
  scene.environment=target.texture;scene.environmentIntensity=.42;
  room.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});pmrem.dispose();
}
