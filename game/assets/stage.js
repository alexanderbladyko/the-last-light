// Original geometry from reference-board.png: stage, construction 2.
export default function generate(THREE){
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

for(const side of [-1,1]){for(let i=0;i<7;i++){const x=side*(8.05+i*.21);const fold=cyl(.28,.34,4.8-(6-i)*.08,i%2?plum:coral,x,3.02,-6.35+Math.cos(i)*.1,10);fold.scale.z=.8;}const tie=ring(.5,.045,brass,side*8.7,1.55,-6.12);tie.scale.x=1.7;}for(let i=0;i<9;i++){const swag=ball(.99,plum,-8+i*2,5.37,-6.45);swag.scale.set(1.2,.5,.32);}

    box(20,.6,15,wood,0,.3,0);
    const boards=[mat('#76583f'),mat('#836344'),mat('#99764f'),mat('#a88358')];
    for(let i=0;i<25;i++){const x=-9.6+i*.8;for(let j=0;j<3;j++)box(.77,.1,4.95,boards[(i+j*3)%4],x,.65,-5+j*5);}
    box(19.8,5.25,.35,dark,0,3.25,-7.1);
    for(const x of [-9.65,9.65]){box(.35,5.65,.6,wood,x,3.35,-6.9);box(.58,.25,.85,brass,x,6.08,-6.9);}
    box(19.9,.19,.8,brass,0,6.17,-6.9);box(19.9,.14,.65,brass,0,5.52,-6.8);
    for(let i=0;i<17;i++){const x=-8.8+i*1.1;box(.8,.55,.08,plum,x,.29,7.53);star(.12,brass,x,.3,7.59);}
    // Moon and village are painted on the rear scenic panel by stage-look.js.
    for(const x of [-8,-4,0,4,8]){cyl(.12,.16,.12,brass,x,.78,6.92);const bulb=ball(.11,cream,x,.91,6.92);}
  
return g;
}
