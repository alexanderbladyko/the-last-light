import * as THREE from 'three';
import {readdir,readFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const files=await readdir('game/assets');let triangles=0;
for(const file of files){
  const path=`game/assets/${file}`;execFileSync(process.execPath,['--check',path]);
  const {default:generate}=await import(new URL(`../${path}`,import.meta.url));
  const root=generate(THREE);if(!root.isGroup)throw Error(`${file}: not a Group`);
  const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());let n=0;
  root.traverse(o=>{if(o.isMesh)n+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});triangles+=n;
  if(!Number.isFinite(size.length())||size.length()<=0||bounds.min.y<-.03)throw Error(`${file}: invalid bounds ${bounds.min.y}`);
  const source=await readFile(path,'utf8');if(/base64|fetch\(|TextureLoader/.test(source))throw Error(`${file}: external/data asset`);
  console.log(`${file}: ${Math.round(n)} triangles, ${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)} m, base ${bounds.min.y.toFixed(3)}`);
}
async function bytes(dir){let n=0;for(const f of await readdir(dir)){const p=`${dir}/${f}`,s=await stat(p);n+=s.isDirectory()?await bytes(p):s.size;}return n;}
console.log(`All ${files.length} asset types: ${triangles} triangles. Standalone game folder: ${(await bytes('game')/1e6).toFixed(2)} MB.`);
