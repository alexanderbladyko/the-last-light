// Original geometry from reference-board.png: lantern, construction 2.
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

cyl(.31,.36,.12,brass,0,.43,0,8);cyl(.27,.27,.6,cream,0,.78,0,8);cyl(.12,.35,.23,brass,0,1.18,0,8);for(let i=0;i<6;i++){const a=i*Math.PI/3;cyl(.025,.025,.65,brass,Math.sin(a)*.29,.78,Math.cos(a)*.29,6);}
box(.8,.13,.65,wood,0,.29,0);for(const x of [-.43,.43])for(const z of [-.24,.24]){const wheel=cyl(.2,.2,.1,wood,x,.2,z,12);wheel.rotation.z=Math.PI/2;const pin=ball(.055,brass,x*1.14,.2,z);}const handle=add(new THREE.TorusGeometry(.16,.027,6,20),brass,0,1.51,0);const flame=ball(.15,cream,0,.8,.285);flame.scale.set(.5,1.55,.35);
return g;
}
