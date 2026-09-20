// Original geometry from reference-board.png: doll, construction 1.
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

const body=ball(.48,plum,0,.53,0);body.scale.set(1,1.06,.83);cyl(.3,.34,.2,coral,0,.1,0);ball(.31,plum,0,1.04,0);
const face=ball(.205,cream,0,1.005,.215);face.scale.set(.92,1.06,.45);for(const x of [-.072,.072]){const eye=ball(.025,black,x,1.035,.308);eye.scale.z=.42;const cheek=ball(.039,coral,x*1.5,.963,.304);cheek.scale.z=.24;}star(.105,brass,0,.43,.446);for(const x of [-.21,.21]){const petal=ball(.085,coral,x,.3,.38);petal.scale.set(.38,1,.18);petal.rotation.z=-x*2;}ring(.287,.012,brass,0,.79,0);
return g;
}
