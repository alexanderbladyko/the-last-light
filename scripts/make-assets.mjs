// Three construction readings of each object in design/reference-board.png.
// This script writes self-contained, constructor-only 404 asset modules.
import {writeFile,mkdir} from 'node:fs/promises';
const common=`
  const g=new THREE.Group();
  const mat=(color,metalness=0)=>new THREE.MeshStandardMaterial({color,metalness,roughness:metalness?.38:.78,flatShading:true});
  const plum=mat('#78394e'), coral=mat('#c67461'), teal=mat('#4d9187'), dark=mat('#243343'), brass=mat('#d7b477',.5), cream=mat('#f2e3bc'), wood=mat('#846044'), black=mat('#171c25');
  const add=(geo,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);g.add(o);return o;};
  const box=(w,h,d,m,x=0,y=0,z=0)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z);
  const ball=(r,m,x=0,y=0,z=0)=>add(new THREE.SphereGeometry(r,16,12),m,x,y,z);
  const cyl=(r1,r2,h,m,x=0,y=0,z=0,n=20)=>add(new THREE.CylinderGeometry(r1,r2,h,n),m,x,y,z);
  const ring=(r,t,m,x=0,y=0,z=0)=>{const o=add(new THREE.TorusGeometry(r,t,6,24),m,x,y,z);o.rotation.x=Math.PI/2;return o;};
  const profile=(points,m)=>add(new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(...p)),24),m);
  const star=(r,m,x,y,z)=>{const s=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,k=i%2?r*.42:r;const xx=Math.cos(a)*k,yy=Math.sin(a)*k;i?s.lineTo(xx,yy):s.moveTo(xx,yy);}s.closePath();return add(new THREE.ExtrudeGeometry(s,{depth:.025,bevelEnabled:false}),m,x,y,z);};
`;
const shapes={
  doll:[
    `const body=ball(.48,plum,0,.53,0);body.scale.set(1,1.06,.83);cyl(.3,.34,.2,coral,0,.1,0);ball(.31,plum,0,1.04,0);`,
    `profile([[0,0],[.3,0],[.43,.12],[.48,.36],[.44,.59],[.31,.78],[.29,1.02],[.19,1.2],[0,1.25]],plum);cyl(.416,.37,.12,coral,0,.105,0);ring(.455,.018,brass,0,.48,0);`,
    `cyl(.43,.32,.25,coral,0,.125,0,10);cyl(.34,.45,.5,plum,0,.5,0,10);cyl(.26,.34,.35,plum,0,.92,0,10);cyl(.04,.26,.2,plum,0,1.195,0,10);`
  ],
  top:[
    `cyl(.46,0,.4,teal,0,.2,0);cyl(.12,.46,.3,teal,0,.55,0);cyl(.08,.09,.45,wood,0,.88,0);`,
    `profile([[0,0],[.06,.1],[.4,.32],[.58,.52],[.58,.62],[.4,.73],[.12,.9],[.09,1.28],[0,1.33]],teal);`,
    `cyl(.13,0,.25,brass,0,.125,0);for(let i=0;i<4;i++)cyl(.55-i*.11,.55-i*.11,.12,i%2?teal:brass,0,.34+i*.12,0,12);cyl(.07,.1,.5,teal,0,1,0,12);`
  ],
  music:[
    `box(1.15,.65,.85,teal,0,.4,0);box(.98,.04,.68,black,0,.75,0);const lid=box(1.2,.08,.9,teal,0,1.0,-.32);lid.rotation.x=-.95;`,
    `box(1.25,.13,.95,brass,0,.18,0);box(1.2,.09,.88,teal,0,.29,0);for(const x of [-.57,.57])box(.09,.55,.86,teal,x,.56,0);for(const z of [-.39,.39])box(1.1,.55,.08,teal,0,.56,z);box(1.12,.07,.8,black,0,.36,0);for(const z of [-.43,.43])box(1.26,.06,.06,brass,0,.87,z);for(const x of [-.6,.6])box(.06,.06,.86,brass,x,.87,0);box(1.25,.65,.07,teal,0,1.19,-.46);box(1.06,.47,.03,dark,0,1.2,-.4);star(.18,brass,0,1.2,-.37);`,
    `cyl(.65,.65,.6,teal,0,.4,0,8);cyl(.58,.58,.07,black,0,.72,0,8);const lid=cyl(.66,.66,.08,teal,0,1.12,-.32,8);lid.rotation.x=-1;`
  ],
  lantern:[
    `cyl(.3,.36,.13,brass,0,.43,0);cyl(.28,.28,.52,coral,0,.74,0);cyl(.12,.34,.2,brass,0,1.1,0);`,
    `cyl(.31,.36,.12,brass,0,.43,0,8);cyl(.27,.27,.6,cream,0,.78,0,8);cyl(.12,.35,.23,brass,0,1.18,0,8);for(let i=0;i<6;i++){const a=i*Math.PI/3;cyl(.025,.025,.65,brass,Math.sin(a)*.29,.78,Math.cos(a)*.29,6);}`,
    `box(.6,.07,.6,brass,0,.43,0);box(.46,.62,.46,cream,0,.78,0);for(const x of [-.28,.28])for(const z of [-.28,.28])box(.035,.7,.035,brass,x,.78,z);cyl(0,.47,.25,teal,0,1.25,0,4);`
  ],
  stage:[
    `for(const x of [-9.25,9.25])box(1.35,4.6,.7,plum,x,2.95,-6.5);box(19,1,.6,plum,0,5.65,-6.5);`,
    `for(const side of [-1,1]){for(let i=0;i<7;i++){const x=side*(8.05+i*.21);const fold=cyl(.28,.34,4.8-(6-i)*.08,i%2?plum:coral,x,3.02,-6.35+Math.cos(i)*.1,10);fold.scale.z=.8;}const tie=ring(.5,.045,brass,side*8.7,1.55,-6.12);tie.scale.x=1.7;}for(let i=0;i<9;i++){const swag=ball(.99,plum,-8+i*2,5.37,-6.45);swag.scale.set(1.2,.5,.32);}`,
    `for(const side of [-1,1]){for(let i=0;i<4;i++){const p=box(.6,4.7-i*.35,.3,i%2?coral:plum,side*(8.1+i*.37),3.1,-6.45);p.rotation.z=-side*.045;}}box(19,.6,.7,plum,0,5.6,-6.3);`
  ]
};
const finish={
  doll:`const face=ball(.205,cream,0,1.005,.215);face.scale.set(.92,1.06,.45);for(const x of [-.072,.072]){const eye=ball(.025,black,x,1.035,.308);eye.scale.z=.42;const cheek=ball(.039,coral,x*1.5,.963,.304);cheek.scale.z=.24;}star(.105,brass,0,.43,.446);for(const x of [-.21,.21]){const petal=ball(.085,coral,x,.3,.38);petal.scale.set(.38,1,.18);petal.rotation.z=-x*2;}ring(.287,.012,brass,0,.79,0);`,
  top:`ring(.49,.028,brass,0,.55,0);ring(.26,.023,brass,0,.8,0);ball(.1,brass,0,1.32,0);for(let i=0;i<8;i++){const a=i*Math.PI/4;const stripe=box(.065,.07,.25,cream,Math.sin(a)*.34,.67,Math.cos(a)*.34);stripe.rotation.y=a;}`,
  music:`for(const x of [-.47,.47])for(const z of [-.32,.32])ball(.095,brass,x,.1,z);const drum=cyl(.16,.16,.72,brass,0,.59,0);drum.rotation.z=Math.PI/2;for(let i=0;i<8;i++)box(.025,.09,.25,cream,-.36+i*.1,.69,.14);const axle=cyl(.035,.035,.32,brass,.74,.55,0);axle.rotation.z=Math.PI/2;box(.045,.25,.045,brass,.88,.44,0);ball(.07,wood,.88,.31,0);`,
  lantern:`box(.8,.13,.65,wood,0,.29,0);for(const x of [-.43,.43])for(const z of [-.24,.24]){const wheel=cyl(.2,.2,.1,wood,x,.2,z,12);wheel.rotation.z=Math.PI/2;const pin=ball(.055,brass,x*1.14,.2,z);}const handle=add(new THREE.TorusGeometry(.16,.027,6,20),brass,0,1.51,0);const flame=ball(.15,cream,0,.8,.285);flame.scale.set(.5,1.55,.35);`,
  stage:`
    box(20,.6,15,wood,0,.3,0);
    const boards=[mat('#76583f'),mat('#836344'),mat('#99764f'),mat('#a88358')];
    for(let i=0;i<25;i++){const x=-9.6+i*.8;for(let j=0;j<3;j++)box(.77,.1,4.95,boards[(i+j*3)%4],x,.65,-5+j*5);}
    box(19.8,5.25,.35,dark,0,3.25,-7.1);
    for(const x of [-9.65,9.65]){box(.35,5.65,.6,wood,x,3.35,-6.9);box(.58,.25,.85,brass,x,6.08,-6.9);}
    box(19.9,.19,.8,brass,0,6.17,-6.9);box(19.9,.14,.65,brass,0,5.52,-6.8);
    for(let i=0;i<17;i++){const x=-8.8+i*1.1;box(.8,.55,.08,plum,x,.29,7.53);star(.12,brass,x,.3,7.59);}
    for(let i=0;i<13;i++){const x=-7.4+i*1.25,y=3.2+(i%3)*.75;star(.12+(i%2)*.05,brass,x,y,-6.85);}
    const moonShape=new THREE.Shape();moonShape.absarc(0,0,.8,.4,Math.PI*1.9,false);moonShape.quadraticCurveTo(-.15,.05,.74,.31);add(new THREE.ExtrudeGeometry(moonShape,{depth:.06,bevelEnabled:false}),cream,0,4.6,-6.8);
    for(const x of [-8,-4,0,4,8]){cyl(.12,.16,.12,brass,x,.78,6.92);const bulb=ball(.11,cream,x,.91,6.92);}
  `
};
await mkdir('design/candidates',{recursive:true});
for(const [name,variants] of Object.entries(shapes))for(let v=0;v<3;v++){
  const source=`// Original geometry from reference-board.png: ${name}, construction ${v+1}.\nexport default function generate(THREE){${common}\n${variants[v]}\n${finish[name]}\nreturn g;\n}\n`;
  await writeFile(`design/candidates/${name}-${v+1}.js`,source);
  if(v===1)await writeFile(`game/assets/${name}.js`,source);
}
console.log('15 original reference-based construction candidates; candidate 2 is the provisional selection.');
