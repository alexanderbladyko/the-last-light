import * as THREE from 'three';
import {bakeStatic} from './assetlib.js';
import {SOCKETS, onLight} from './sim.js';

// Shader wear supplements the geometry; stage artwork has its own materials.
export function handmade(root) {
  const seen = new Set();
  const woods = new Set(['846044', '76583f', '836344', '99764f', 'a88358']);
  root.traverse(o => {
    if (!o.isMesh || !o.material.isMeshStandardMaterial || o.material.userData.handmade === false || seen.has(o.material)) return;
    const m = o.material; seen.add(m);
    const wood = woods.has(m.color.getHexString());
    m.roughness = m.metalness > .3 ? .34 : .66;
    m.onBeforeCompile = shader => {
      shader.vertexShader = 'varying vec3 vCraftPosition;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvCraftPosition = position;');
      shader.fragmentShader = `
        varying vec3 vCraftPosition;
        float craftHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float craftNoise(vec2 p) {
          vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(craftHash(i), craftHash(i + vec2(1, 0)), f.x),
                     mix(craftHash(i + vec2(0, 1)), craftHash(i + vec2(1, 1)), f.x), f.y);
        }
      ` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
        #include <color_fragment>
        vec2 paper = vCraftPosition.xy + vCraftPosition.z * vec2(.37, .73);
        float tooth = craftNoise(paper * 78.0);
        float age = craftNoise(paper * 5.0);
        diffuseColor.rgb *= .90 + tooth * .12 + age * .10;
        ${wood ? `
          float grainPhase = vCraftPosition.x * 34.0 + craftNoise(vCraftPosition.xz * vec2(3.0, .4)) * 8.0;
          float grain = sin(grainPhase);
          float clarity = 1.0 - smoothstep(1.0, 3.0, fwidth(grainPhase));
          diffuseColor.rgb *= .94 + .06 * grain * clarity;
        ` : `
          float chip = smoothstep(.78, .86, craftNoise(paper * 24.0)) * smoothstep(.52, .74, age);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.28, .15, .065), chip * .48);
        `}
      `);
    };
    m.customProgramCacheKey = () => wood ? 'craft-wood-v1' : 'craft-paint-v1';
    m.needsUpdate = true;
  });
}

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const ctx = c.getContext('2d'), gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)'); gradient.addColorStop(.13, 'rgba(255,255,255,.72)');
  gradient.addColorStop(.4, 'rgba(255,255,255,.14)'); gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function createPresentation(scene, topProto) {
  const decor = new THREE.Group(), fx = [], accents = new Map(), sleepers = new Map(), tethers = new Map();
  const glowMap = glowTexture();
  const brass = new THREE.MeshStandardMaterial({color:'#bd9355', metalness:.6, roughness:.46});
  const ink = new THREE.MeshStandardMaterial({color:'#151726', roughness:1});
  const bulb = new THREE.MeshBasicMaterial({color:'#efb76a'});
  const lilac = new THREE.MeshBasicMaterial({color:'#c7b9f1', transparent:true, opacity:.85});
  const shellMat = new THREE.MeshStandardMaterial({color:'#a74455', roughness:.82, side:THREE.DoubleSide});
  const paperGeometry=new THREE.PlaneGeometry(.25,.32),paperMaterial=new THREE.MeshStandardMaterial({color:'#f5e9ce',roughness:1,side:THREE.DoubleSide});
  const shellGeometry = new THREE.SphereGeometry(.6, 12, 8, 0, Math.PI);
  const noteGeometry = new THREE.SphereGeometry(.075, 6, 4);
  const poolGeometry = new THREE.PlaneGeometry(1, 1);
  function add(geometry, material, x, y, z, parent = decor) {
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  }
  function star(radius, x, y, z, material = brass, parent = decor) {
    const shape = new THREE.Shape();
    for(let i = 0; i < 10; i++) {
      const a = i * Math.PI / 5 + Math.PI / 2, r = i % 2 ? radius * .42 : radius;
      if(i) shape.lineTo(Math.cos(a)*r, Math.sin(a)*r); else shape.moveTo(Math.cos(a)*r, Math.sin(a)*r);
    }
    shape.closePath();
    return add(new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:false}), material, x, y, z, parent);
  }
  function sprite(color, size, x, y, z) {
    const material = new THREE.SpriteMaterial({map:glowMap, color, transparent:true, opacity:.7, depthWrite:false, blending:THREE.AdditiveBlending});
    const s = new THREE.Sprite(material); s.position.set(x,y,z); s.scale.setScalar(size); scene.add(s); return s;
  }

  // Warm bulbs along the apron of the stage.
  const glows=[];
  for(const x of [-8,-4,0,4,8]) {
    const housing=add(new THREE.SphereGeometry(.22,12,8,0,Math.PI*2,0,Math.PI/2),ink,x,.11,6.68);
    housing.rotation.x=-.5;
    add(new THREE.SphereGeometry(.105,10,8),bulb,x,.31,6.9);
    glows.push(sprite('#ffc17e',1.65,x,.36,6.96));
    const pool=add(poolGeometry,new THREE.MeshBasicMaterial({map:glowMap,color:'#efaf66',transparent:true,opacity:.27,depthWrite:false,blending:THREE.AdditiveBlending}),x,.074,5.92);
    pool.rotation.x=-Math.PI/2;pool.scale.set(2.4,3.7,1);
  }
  const merged=bakeStatic(decor); merged.traverse(o=>{if(o.isMesh)o.receiveShadow=true;}); scene.add(merged);

  const glow=sprite('#ff9e38',2.1,-1,.95,0), goalGlow=sprite('#ffa53b',3.0,8,1.5,3.6);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.08,2.4,6.8,40,1,true),new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    uniforms:{warmth:{value:new THREE.Color('#eac681')}},
    vertexShader:'varying vec2 beamUV; void main(){beamUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec2 beamUV;uniform vec3 warmth;void main(){float fade=sin(beamUV.y*3.14159);gl_FragColor=vec4(warmth,.027*fade*fade);}'
  }));beam.position.set(-1,3.5,0);scene.add(beam);

  // One instanced draw for drifting dust; positions are generated, not imported.
  const dust=new THREE.InstancedMesh(new THREE.SphereGeometry(.026,4,3),new THREE.MeshBasicMaterial({color:'#e9bd87',transparent:true,opacity:.45}),54);
  const dummy=new THREE.Object3D();dust.instanceMatrix.setUsage(THREE.DynamicDrawUsage);dust.frustumCulled=false;scene.add(dust);
  const moonShape=new THREE.Shape();moonShape.absarc(0,0,.18,.6,5.7,false);moonShape.quadraticCurveTo(-.06,0,.15,.1);
  const moonGeometry=new THREE.ShapeGeometry(moonShape);
  function note(x,z,color) {
    const group=new THREE.Group(),material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8});
    add(noteGeometry,material,0,0,0,group).scale.set(1.3,.7,.7);
    add(new THREE.BoxGeometry(.025,.24,.025),material,.07,.1,0,group);
    add(new THREE.BoxGeometry(.14,.025,.025),material,.125,.21,0,group).rotation.z=-.25;
    group.position.set(x,.9,z);scene.add(group);fx.push({mesh:group,life:1.6,max:1.6,note:true,material});
  }
  function clearTower(id) {
    const a=accents.get(id);if(!a)return;scene.remove(a.root);a.root.traverse(o=>{if(o.isMesh&&!o.userData.shared){o.geometry.dispose();o.material.dispose();}});accents.delete(id);
  }
  function towerAccent(t) {
    let a=accents.get(t.id);if(a?.branch===t.branch)return a;
    clearTower(t.id);const root=new THREE.Group();const [x,z]=SOCKETS[t.slot];root.position.set(x,.2,z);scene.add(root);
    a={root,branch:t.branch,orbs:[],lastNote:-1};accents.set(t.id,a);
    if(t.branch==='orbit') {
      for(let i=0;i<2;i++){const toy=topProto.clone(true);toy.scale.setScalar(.35);toy.traverse(o=>o.userData.shared=true);root.add(toy);a.orbs.push(toy);}
      const track=add(new THREE.TorusGeometry(1.38,.012,4,64),new THREE.MeshBasicMaterial({color:'#80cdbc',transparent:true,opacity:.24}),0,.025,0,root);track.rotation.x=Math.PI/2;
    } else if(t.branch==='bowling') {
      for(let i=0;i<3;i++) {
        const chevron=new THREE.Group();for(const s of [-1,1]){const bar=add(new THREE.BoxGeometry(.035,.025,.25),brass.clone(),s*.08,.035,.7+i*.18,chevron);bar.rotation.y=-s*.55;}root.add(chevron);
      }
    } else if(t.branch==='lullaby') {
      const moon=add(moonGeometry.clone(),lilac.clone(),0,2.55,0,root);moon.scale.setScalar(1.6);a.moon=moon;
    } else if(t.branch==='invitation') {
      const halo=add(new THREE.TorusGeometry(.45,.02,5,32),new THREE.MeshBasicMaterial({color:'#dfb985',transparent:true,opacity:.7}),0,1.15,0,root);a.halo=halo;
    }
    return a;
  }
  function pop(e) {
    if(e.kind==='ghost'){
      for(let i=0;i<5;i++){
        const piece=new THREE.Mesh(paperGeometry,paperMaterial);piece.position.set(e.x,1.15,e.z);piece.rotation.set(i*.7,i,0);scene.add(piece);
        const angle=i*Math.PI*2/5;fx.push({mesh:piece,life:1.1,max:1.1,vx:Math.cos(angle)*1.3,vz:Math.sin(angle)*1.3,vy:1.9,spin:3+i,shell:true});
      }return;
    }
    const s=[.6,.85,1.15][e.tier];
    for(let i=0;i<2;i++) {
      const piece=new THREE.Mesh(shellGeometry,shellMat);piece.scale.set(s,s*1.18,s);piece.position.set(e.x,.58*s,e.z);piece.rotation.y=i*Math.PI;scene.add(piece);
      fx.push({mesh:piece,life:.65,max:.65,vx:(i?1:-1)*1.9,vz:(Math.random()-.5)*1.6,vy:3.3,spin:(i?1:-1)*5,shell:true});
    }
  }
  function reset(){
    for(const p of fx){scene.remove(p.mesh);if(p.material){p.mesh.traverse(o=>{if(o.isMesh&&o.geometry!==noteGeometry)o.geometry.dispose();});p.material.dispose();}}fx.length=0;
    for(const id of [...accents.keys()])clearTower(id);
    for(const s of sleepers.values())scene.remove(s);sleepers.clear();
    for(const t of tethers.values()){scene.remove(t);t.geometry.dispose();t.material.dispose();}tethers.clear();
  }
  function update(game,clock,dt,camera) {
    const stopped=['paused','lost'].includes(game.phase),delta=stopped?0:dt;
    glow.position.set(game.lantern.x,.95,game.lantern.z);beam.position.set(game.lantern.x,3.5,game.lantern.z);
    glow.material.opacity=.45+Math.sin(clock*7)*.035;goalGlow.material.opacity=.5+Math.sin(clock*3)*.07;
    glows.forEach((s,i)=>s.material.opacity=.34+Math.sin(clock*2+i)*.045);
    for(let i=0;i<dust.count;i++) {
      dummy.position.set(-9+(i*5.137)%18+Math.sin(clock*.17+i)*.28,.45+((i*.677+clock*.08)%4.6),-6+(i*3.137)%12);
      const near=Math.hypot(dummy.position.x-game.lantern.x,dummy.position.z-game.lantern.z)<3;
      dummy.scale.setScalar(near?1.45:.55);dummy.updateMatrix();dust.setMatrixAt(i,dummy.matrix);
    }dust.instanceMatrix.needsUpdate=true;
    for(const id of accents.keys())if(!game.towers.some(t=>t.id===id))clearTower(id);
    for(const t of game.towers) {
      const a=towerAccent(t),lit=onLight(game,{x:a.root.position.x,z:a.root.position.z});
      a.orbs.forEach((o,i)=>{const angle=clock*3.8+i*Math.PI;o.position.set(Math.sin(angle)*1.38,.12+Math.sin(clock*6+i)*.06,Math.cos(angle)*1.38);o.rotation.y=-clock*14;});
      if(a.moon){a.moon.quaternion.copy(camera.quaternion);a.moon.position.y=2.55+Math.sin(clock*2)*.1;}
      if(a.halo){a.halo.rotation.set(.5,clock*.7,0);a.halo.position.y=1.15+Math.sin(clock*2)*.07;}
      const beat=Math.floor(clock*(lit?2.1:1.15));
      if(t.type==='music'&&game.phase==='wave'&&a.lastNote!==beat){a.lastNote=beat;note(a.root.position.x,a.root.position.z,t.branch==='lullaby'?'#b9a4ef':t.branch==='invitation'?'#e4bc88':'#8dcabd');}
    }
    for(const id of sleepers.keys())if(!game.enemies.some(e=>e.id===id&&e.sleep>0)){scene.remove(sleepers.get(id));sleepers.delete(id);}
    for(const e of game.enemies)if(e.sleep>0){let s=sleepers.get(e.id);if(!s){s=new THREE.Mesh(moonGeometry,lilac);scene.add(s);sleepers.set(e.id,s);}s.position.set(e.x,(e.kind==='ghost'?2.65:[.69,.96,1.25][e.tier]*1.72+.35)+Math.sin(clock*2)*.09,e.z);s.quaternion.copy(camera.quaternion);}
    const links=new Set();
    for(const t of game.towers.filter(t=>t.branch==='invitation')) {
      const [x,z]=SOCKETS[t.slot];
      for(const e of game.enemies)if(e.slow>.7&&Math.hypot(e.x-x,e.z-z)<3.8){
        const key=t.id+':'+e.id;links.add(key);let line=tethers.get(key);
        if(!line){line=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:'#d6ad78',transparent:true,opacity:.42,depthWrite:false}));scene.add(line);tethers.set(key,line);}
        const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(x,.85,z),new THREE.Vector3((x+e.x)/2,1.35+Math.sin(clock*3)*.12,(z+e.z)/2),new THREE.Vector3(e.x,e.kind==='ghost'?1.1:.5,e.z));
        line.geometry.setFromPoints(curve.getPoints(12));
      }
    }
    for(const [key,line]of tethers)if(!links.has(key)){scene.remove(line);line.geometry.dispose();line.material.dispose();tethers.delete(key);}
    for(let i=fx.length-1;i>=0;i--){
      const p=fx[i];p.life-=delta;
      if(p.note){p.mesh.position.y+=delta*.65;p.mesh.position.x+=Math.sin(clock*3)*delta*.22;p.mesh.quaternion.copy(camera.quaternion);p.material.opacity=.75*Math.min(1,p.life/.55);}
      if(p.shell){p.vy-=delta*11;p.mesh.position.x+=p.vx*delta;p.mesh.position.z+=p.vz*delta;p.mesh.position.y+=p.vy*delta;p.mesh.rotation.z+=p.spin*delta;p.mesh.scale.multiplyScalar(Math.pow(.05,delta));}
      if(p.life<=0){scene.remove(p.mesh);if(p.material){p.mesh.traverse(o=>{if(o.isMesh&&o.geometry!==noteGeometry)o.geometry.dispose();});p.material.dispose();}fx.splice(i,1);}
    }
  }
  return {update,pop,reset};
}
