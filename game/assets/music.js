// A wind-up gramophone with a folded brass horn, visible at gameplay scale.
export default function generate(T){
  const g=new T.Group();
  const mat=(color,metalness=0)=>new T.MeshStandardMaterial({color,metalness,roughness:metalness?.38:.65});
  const teal=mat('#367b75'),dark=mat('#183a40'),gold=mat('#d4ab60',.32),cream=mat('#ead8ad'),black=mat('#17252a');
  const add=(geo,m,x=0,y=0,z=0)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);g.add(o);return o;};
  const box=(w,h,d,m,x,y,z)=>add(new T.BoxGeometry(w,h,d),m,x,y,z);
  box(1.4,.18,1.15,gold,0,.16,0);box(1.3,.59,1.05,teal,0,.52,0);box(1.4,.12,1.15,gold,0,.86,0);
  for(const x of [-.58,.58])for(const z of [-.46,.46]){add(new T.SphereGeometry(.1,10,8),gold,x,.1,z);box(.055,.53,.055,gold,x,.52,z);}
  box(.94,.37,.03,dark,0,.52,.541);
  for(const side of [-1,1]){
    const leaf=add(new T.SphereGeometry(.12,12,8),gold,side*.24,.52,.569);leaf.scale.set(.45,1.1,.16);leaf.rotation.z=-side*.7;
    const petal=add(new T.SphereGeometry(.10,12,8),cream,side*.105,.52,.574);petal.scale.set(.55,.7,.14);petal.rotation.z=side*.4;
  }
  add(new T.CylinderGeometry(.4,.4,.035,40),black,-.08,.945,.03);
  for(const radius of [.12,.25,.34]){const ring=add(new T.TorusGeometry(radius,.009,4,36),gold,-.08,.966,.03);ring.rotation.x=Math.PI/2;}
  const stem=new T.CatmullRomCurve3([new T.Vector3(.42,.93,-.28),new T.Vector3(.46,1.27,-.28),new T.Vector3(.1,1.42,-.1)]);
  add(new T.TubeGeometry(stem,16,.08,8,false),gold);
  const horn=new T.Group();horn.position.set(.1,1.35,-.13);horn.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(-.18,.6,.8).normalize());g.add(horn);
  const bellMat=gold.clone();bellMat.side=T.DoubleSide;
  const bell=new T.Mesh(new T.LatheGeometry([[.075,0],[.085,.14],[.13,.33],[.26,.53],[.63,.79]].map(p=>new T.Vector2(...p)),10),bellMat);horn.add(bell);
  const rim=new T.Mesh(new T.TorusGeometry(.63,.025,6,10),cream);rim.rotation.x=Math.PI/2;rim.position.y=.79;horn.add(rim);
  const throat=new T.Mesh(new T.CircleGeometry(.079,16),black);throat.rotation.x=-Math.PI/2;throat.position.y=.06;horn.add(throat);
  const axle=add(new T.CylinderGeometry(.035,.035,.24,10),gold,.79,.5,0);axle.rotation.z=Math.PI/2;
  box(.04,.26,.04,gold,.9,.4,0);add(new T.SphereGeometry(.07,12,8),black,.9,.26,0);
  return g;
}
