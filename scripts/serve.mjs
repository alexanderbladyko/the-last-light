import {createServer} from 'node:http';
import {readFile, stat, copyFile, mkdir} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
const root = resolve(new URL('..', import.meta.url).pathname);
await mkdir(`${root}/game/vendor`, {recursive:true});
for (const name of ['three.module.js','three.core.js']) await copyFile(`${root}/node_modules/three/build/${name}`,`${root}/game/vendor/${name}`);
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const server=createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let file=resolve(root, '.'+(pathname==='/'?'/game/':pathname));
    if(!file.startsWith(root+sep)) {res.writeHead(403).end();return;}
    if((await stat(file)).isDirectory()) file+='/index.html';
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(await readFile(file));
  }catch {res.writeHead(404).end('Not found');}
});
server.listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log(`The Last Light: http://127.0.0.1:${server.address().port}/game/`));
