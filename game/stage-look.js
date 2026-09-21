import * as THREE from 'three';
import {bakeStatic} from './assetlib.js';

// Apply artwork after the recipe loader has merged the procedural stage.
export async function dressStage(stage, scene, renderer) {
  const loader = new THREE.TextureLoader();
  const [wood, backdrop] = await Promise.all([
    loader.loadAsync(new URL('./textures/painted-wood-v1.jpg', import.meta.url).href),
    loader.loadAsync(new URL('./textures/moonlit-village-v1.jpg', import.meta.url).href),
  ]);
  for (const texture of [wood, backdrop]) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  }
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  backdrop.offset.y = .09; // Keep the crescent below the hanging curtain.
  const boards = new Set(['76583f', '836344', '99764f', 'a88358']);
  stage.traverse(o => {
    if (!o.isMesh) return;
    const m = o.material, color = m.color.getHexString();
    if (boards.has(color)) {
      // World-aligned grain crosses the merged boards without stretching per face.
      const p = o.geometry.attributes.position, uv = new Float32Array(p.count * 2);
      for (let i = 0; i < p.count; i++) {
        uv[i * 2] = (p.getX(i) + 10) / 6.4;
        uv[i * 2 + 1] = (p.getZ(i) + 7.5) / 14.9;
      }
      o.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      m.map = wood; m.color.set('#c1ceca'); m.roughness = .84;
      m.userData.handmade = false;
    } else if (color === '243343') {
      m.map = backdrop; m.color.set('#ffffff'); m.roughness = 1;
      m.emissiveMap = backdrop; m.emissive.set('#ffffff'); m.emissiveIntensity = .3;
      m.userData.handmade = false;
    } else if (color === '846044') m.color.set('#29454a');
    else if (color === '78394e') m.color.set('#682e42');
    else if (color === 'c67461') m.color.set('#963e50');
    m.needsUpdate = true;
  });

  // A second physical layer stands in front of the painted scenery.
  const wings = new THREE.Group();
  const paper = new THREE.MeshStandardMaterial({color:'#235354', roughness:1, side:THREE.DoubleSide});
  const edge = new THREE.MeshStandardMaterial({color:'#b59765', roughness:.85});
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const x = side * (6.5 + i * .55), height = 1.3 + i * .48;
    const shape = new THREE.Shape();
    shape.moveTo(-.58, 0); shape.lineTo(-.21, height * .32);
    shape.lineTo(-.45, height * .32); shape.lineTo(-.14, height * .64);
    shape.lineTo(-.32, height * .64); shape.lineTo(0, height);
    shape.lineTo(.32, height * .64); shape.lineTo(.14, height * .64);
    shape.lineTo(.45, height * .32); shape.lineTo(.21, height * .32);
    shape.lineTo(.58, 0); shape.closePath();
    const tree = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {depth:.055, bevelEnabled:false}), paper);
    tree.position.set(x, .02, -5.95 - i * .12); tree.rotation.z = side * .04;
    wings.add(tree);
    const stand = new THREE.Mesh(new THREE.BoxGeometry(.65,.06,.5), edge);
    stand.position.set(x,.02,tree.position.z); wings.add(stand);
  }
  const scenery = bakeStatic(wings);
  scenery.traverse(o => {o.castShadow = true; o.receiveShadow = true;});
  scene.add(scenery);
}
