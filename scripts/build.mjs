import {cp,mkdir,copyFile} from 'node:fs/promises';
await mkdir('game/vendor',{recursive:true});
for(const name of ['three.module.js','three.core.js']) await copyFile(`node_modules/three/build/${name}`,`game/vendor/${name}`);
await cp('game','dist',{recursive:true});
console.log('Standalone game written to dist/; serve at any URL prefix.');
