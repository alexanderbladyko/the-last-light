// A warm flame inside an open, dark-bronze cage, on a little wind-up carriage.
export default function generate(T){
  const g=new T.Group();
  const bronze=new T.MeshStandardMaterial({color:'#5e4933',metalness:.72,roughness:.34});
  const gold=new T.MeshStandardMaterial({color:'#bc914c',metalness:.68,roughness:.3});
  const black=new T.MeshStandardMaterial({color:'#1b252a',metalness:.45,roughness:.38});
  const amber=new T.MeshStandardMaterial({color:'#f2a333',emissive:'#ff8b18',emissiveIntensity:1.8,roughness:.3});
  const heart=new T.MeshBasicMaterial({color:'#fff0aa'});
  const add=(geo,mat,x=0,y=0,z=0)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);g.add(m);return m;};
  const ring=(r,t,y,mat=gold)=>{const m=add(new T.TorusGeometry(r,t,6,32),mat,0,y,0);m.rotation.x=Math.PI/2;return m;};
  const lathe=(p,mat)=>add(new T.LatheGeometry(p.map(a=>new T.Vector2(...a)),24),mat);
  add(new T.CylinderGeometry(.46,.48,.09,32),bronze,0,.29,0);
  ring(.43,.018,.34);ring(.34,.025,.43);
  lathe([[0,.35],[.3,.35],[.34,.42],[.27,.5],[.22,.52],[0,.52]],bronze);
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3,x=Math.sin(a),z=Math.cos(a);
    add(new T.CylinderGeometry(.021,.027,.75,8),gold,x*.285,.87,z*.285);
    const curve=new T.CatmullRomCurve3([new T.Vector3(x*.29,.45,z*.29),new T.Vector3(x*.35,.76,z*.35),new T.Vector3(x*.28,1.23,z*.28)]);
    add(new T.TubeGeometry(curve,10,.018,5,false),bronze);
  }
  lathe([[.06,1.49],[.11,1.4],[.16,1.37],[.19,1.31],[.31,1.25],[.34,1.18],[.28,1.17]],bronze);
  ring(.30,.019,1.21);ring(.18,.015,1.34);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;const vent=add(new T.SphereGeometry(.025,8,6),black,Math.sin(a)*.205,1.29,Math.cos(a)*.205);vent.scale.y=1.65;}
  const flame=lathe([[0,.51],[.085,.58],[.1,.71],[.058,.84],[.026,.91],[0,1.02]],amber);flame.rotation.z=.09;
  const inner=add(new T.SphereGeometry(.052,10,8),heart,0,.665,0);inner.scale.set(.8,1.9,.8);
  const handle=add(new T.TorusGeometry(.17,.023,6,28),gold,0,1.59,0);
  add(new T.SphereGeometry(.06,10,8),gold,0,1.43,0);
  for(const x of [-.4,.4])for(const z of [-.24,.24]){
    const wheel=add(new T.CylinderGeometry(.17,.17,.08,16),black,x,.17,z);wheel.rotation.z=Math.PI/2;
    const hub=add(new T.SphereGeometry(.043,8,6),gold,x*1.1,.17,z);
  }
  return g;
}
