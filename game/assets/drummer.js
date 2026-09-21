// Painted tin, a drum, and a clockwork key. Rigid pieces; no imported mesh or rig.
export default function generate(T){
  const g=new T.Group();
  const teal=new T.MeshStandardMaterial({color:'#326c71',metalness:.45,roughness:.38});
  const red=new T.MeshStandardMaterial({color:'#963c48',metalness:.32,roughness:.44});
  const brass=new T.MeshStandardMaterial({color:'#d0a655',metalness:.72,roughness:.3});
  const cream=new T.MeshStandardMaterial({color:'#eed9a8',roughness:.65});
  const ink=new T.MeshStandardMaterial({color:'#182932',metalness:.35,roughness:.38});
  function add(geo,mat,x,y,z){const o=new T.Mesh(geo,mat);o.position.set(x,y,z);g.add(o);return o;}
  function rod(a,b,r,mat){const v=new T.Vector3(...b).sub(new T.Vector3(...a));const o=add(new T.CylinderGeometry(r,r,v.length(),6),mat,...a);o.position.addScaledVector(v,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
  for(const side of [-1,1]){
    add(new T.BoxGeometry(.35,.17,.58),ink,side*.26,.085,.03);
    add(new T.CylinderGeometry(.14,.14,.37,10),red,side*.26,.32,0);
  }
  add(new T.CylinderGeometry(.39,.53,1.04,32),teal,0,.98,0);
  add(new T.CylinderGeometry(.535,.535,.09,32),brass,0,.5,0);
  add(new T.CylinderGeometry(.40,.42,.10,24),red,0,1.46,0);
  for(const side of [-1,1]){
    add(new T.SphereGeometry(.19,12,8),brass,side*.49,1.43,0);
    rod([side*.31,1.44,.27],[-side*.29,.59,.45],.042,cream);
    for(let i=0;i<3;i++)add(new T.SphereGeometry(.037,8,6),brass,side*.12,1.29-i*.17,.41);
  }
  const head=add(new T.SphereGeometry(.33,24,16),cream,0,1.75,.04);head.scale.set(1,1,.92);
  for(const side of [-1,1]){
    add(new T.SphereGeometry(.027,10,8),ink,side*.12,1.80,.332);
    const cheek=add(new T.SphereGeometry(.048,10,8),red,side*.23,1.69,.28);cheek.scale.z=.35;
    const moustache=add(new T.SphereGeometry(.09,12,8),ink,side*.068,1.665,.341);moustache.scale.set(1,.33,.3);moustache.rotation.z=side*.18;
  }
  add(new T.ConeGeometry(.052,.14,12),brass,0,1.73,.37).rotation.x=Math.PI/2;
  add(new T.CylinderGeometry(.43,.38,.62,32),red,0,2.19,0);
  add(new T.CylinderGeometry(.46,.46,.065,32),ink,0,1.94,0);
  for(const y of [1.995,2.46])add(new T.CylinderGeometry(y>2.2?.436:.397,y>2.2?.436:.397,.045,32),brass,0,y,0);
  const badge=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.07:.15;i?badge.lineTo(Math.cos(a)*r,Math.sin(a)*r):badge.moveTo(Math.cos(a)*r,Math.sin(a)*r);}badge.closePath();
  add(new T.ExtrudeGeometry(badge,{depth:.025,bevelEnabled:false}),brass,0,2.23,.42);
  rod([.18,2.45,0],[.20,2.65,0],.035,brass);
  const plume=add(new T.SphereGeometry(.13,12,8),teal,.20,2.69,0);plume.scale.y=1.5;
  // A broad pale drumhead and alternating panels read at phone scale.
  add(new T.CylinderGeometry(.60,.60,.61,36),cream,0,.95,.61);
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6;
    add(new T.CylinderGeometry(.604,.604,.49,3,1,true,a,.24),i%2?teal:red,0,.95,.61);
    rod([Math.sin(a)*.612,.70,.61+Math.cos(a)*.612],[Math.sin(a+.24)*.612,1.20,.61+Math.cos(a+.24)*.612],.018,brass);
  }
  for(const y of [.645,1.255])add(new T.CylinderGeometry(.64,.64,.065,36),brass,0,y,.61);
  add(new T.CylinderGeometry(.59,.59,.018,36),cream,0,1.294,.61);
  // A winding key protrudes from the back; the toy stays a little crooked.
  rod([0,1.05,-.47],[0,1.05,-.76],.055,brass);
  for(const side of [-1,1])add(new T.TorusGeometry(.15,.035,6,20),brass,side*.14,1.05,-.78);
  return g;
}
