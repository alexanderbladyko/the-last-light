// Original folded-paper ghost. Constructor geometry only; faces appear in lantern light.
export default function generate(THREE){
  const g=new THREE.Group();
  const paper=new THREE.MeshStandardMaterial({color:'#d7d5eb',roughness:1,side:THREE.DoubleSide,flatShading:true});paper.name='ghost-paper';
  const fold=new THREE.MeshStandardMaterial({color:'#9d9dbe',roughness:1,side:THREE.DoubleSide});fold.name='ghost-fold';
  const ink=new THREE.MeshStandardMaterial({color:'#222539',roughness:1});ink.name='ghost-face';
  const add=(geo,mat,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);g.add(m);return m;};
  const shape=new THREE.Shape();
shape.moveTo(-.5,0);shape.lineTo(-.5,1.2);shape.quadraticCurveTo(0,1.9,.5,1.2);shape.lineTo(.5,0);shape.lineTo(.26,.19);shape.lineTo(0,.01);shape.lineTo(-.25,.2);shape.closePath();add(new THREE.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:false}),paper);
for(const side of [-1,1]){const eye=add(new THREE.SphereGeometry(.062,10,8),ink,side*.115,1.24,.08);eye.scale.set(.65,1.25,.3);}
const mouth=add(new THREE.SphereGeometry(.044,10,8),ink,.012,1.055,.082);mouth.scale.set(.7,1.3,.3);
return g;
}
