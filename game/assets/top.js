// Original geometry from reference-board.png: top, construction 2.
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

profile([[0,0],[.06,.1],[.4,.32],[.58,.52],[.58,.62],[.4,.73],[.12,.9],[.09,1.28],[0,1.33]],teal);
ring(.49,.028,brass,0,.55,0);ring(.26,.023,brass,0,.8,0);ball(.1,brass,0,1.32,0);for(let i=0;i<8;i++){const a=i*Math.PI/4;const stripe=box(.065,.07,.25,cream,Math.sin(a)*.34,.67,Math.cos(a)*.34);stripe.rotation.y=a;}
return g;
}
