// Original folded-paper ghost. Constructor geometry only; faces appear in lantern light.
export default function generate(THREE){
  const g=new THREE.Group();
  const paper=new THREE.MeshStandardMaterial({color:'#d7d5eb',roughness:1,side:THREE.DoubleSide,flatShading:true});paper.name='ghost-paper';
  const fold=new THREE.MeshStandardMaterial({color:'#9d9dbe',roughness:1,side:THREE.DoubleSide});fold.name='ghost-fold';
  const ink=new THREE.MeshStandardMaterial({color:'#222539',roughness:1});ink.name='ghost-face';
  const add=(geo,mat,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);g.add(m);return m;};
  const shape=new THREE.Shape();
shape.moveTo(-.51,.03);shape.lineTo(-.35,.82);shape.lineTo(-.83,.67);shape.lineTo(-.64,1.03);shape.lineTo(-.31,1.15);shape.lineTo(-.27,1.43);shape.quadraticCurveTo(0,1.7,.27,1.43);shape.lineTo(.31,1.15);shape.lineTo(.64,1.03);shape.lineTo(.83,.67);shape.lineTo(.35,.82);shape.lineTo(.51,.03);shape.lineTo(.26,.2);shape.lineTo(.02,0);shape.lineTo(-.23,.16);shape.closePath();add(new THREE.ExtrudeGeometry(shape,{depth:.065,bevelEnabled:false,curveSegments:6}),paper);
for(const side of [-1,1]){const crease=add(new THREE.BoxGeometry(.012,.66,.008),fold,side*.28,.63,.074);crease.rotation.z=side*.22;const arm=add(new THREE.BoxGeometry(.32,.016,.008),fold,side*.53,.94,.074);arm.rotation.z=-side*.35;}
add(new THREE.BoxGeometry(.38,.024,.009),fold,0,.89,.074).rotation.z=.07;
for(const side of [-1,1]){const eye=add(new THREE.SphereGeometry(.062,10,8),ink,side*.115,1.24,.08);eye.scale.set(.65,1.25,.3);}
const mouth=add(new THREE.SphereGeometry(.044,10,8),ink,.012,1.055,.082);mouth.scale.set(.7,1.3,.3);
return g;
}
