// A turned lacquer top with broad cream and teal bands and worn floral paint.
export default function generate(T){
  const g=new T.Group();
  const mat=(color,metalness=0)=>new T.MeshStandardMaterial({color,roughness:metalness?.32:.5,metalness});
  const red=mat('#aa5848'),cream=mat('#d7c49d'),teal=mat('#285b61'),gold=mat('#b78c49',.62);
  const add=(geo,m,x=0,y=0,z=0)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);g.add(o);return o;};
  const lathe=(p,m)=>add(new T.LatheGeometry(p.map(a=>new T.Vector2(...a)),40),m);
  lathe([[.04,0],[.09,.18],[.34,.36],[.73,.68],[.75,.79],[.66,.91],[.25,1.12],[.13,1.17]],red);
  lathe([[.566,.553],[.646,.615],[.733,.683],[.753,.792]],cream);
  lathe([[.752,.79],[.718,.835],[.685,.88]],teal);
  for(const [radius,y]of [[.733,.68],[.75,.79],[.61,.95],[.22,1.13]]){
    const ring=add(new T.TorusGeometry(radius,.014,5,40),gold,0,y,0);ring.rotation.x=Math.PI/2;
  }
  for(let i=0;i<16;i++){
    const a=i*Math.PI/8,mark=add(new T.SphereGeometry(.036,8,6),teal,Math.sin(a)*.690,.642,Math.cos(a)*.690);mark.scale.y=.55;
  }
  lathe([[.11,1.16],[.15,1.24],[.09,1.32],[.12,1.46],[.16,1.49],[.16,1.58],[.1,1.65],[0,1.67]],red);
  for(const y of [1.23,1.46]){const ring=add(new T.TorusGeometry(.13,.018,5,24),gold,0,y,0);ring.rotation.x=Math.PI/2;}
  return g;
}
