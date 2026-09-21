// Lacquered tin top: broad alternating panels, a turned grip and brass seams.
export default function generate(T){
  const g=new T.Group();
  const mat=(color,metalness=0)=>new T.MeshStandardMaterial({color,roughness:metalness?.4:.58,metalness});
  const red=mat('#b7464d'),cream=mat('#f1dbaa'),ink=mat('#294a50'),gold=mat('#d8ae63',.35);
  const add=(geo,m,x=0,y=0,z=0)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);g.add(o);return o;};
  const profile=[[.045,0],[.08,.18],[.32,.36],[.73,.68],[.75,.79],[.66,.91],[.25,1.12],[.13,1.17]];
  for(let i=0;i<10;i++)add(new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),5,i*Math.PI/5,Math.PI/5),i%2?cream:red);
  for(const [radius,y]of [[.74,.77],[.6,.95],[.22,1.13]]){const ring=add(new T.TorusGeometry(radius,.027,6,40),gold,0,y,0);ring.rotation.x=Math.PI/2;}
  add(new T.CylinderGeometry(.12,.15,.38,20),ink,0,1.36,0);
  const cap=add(new T.SphereGeometry(.18,20,12),red,0,1.57,0);cap.scale.y=.5;
  for(const y of [1.23,1.43]){const ring=add(new T.TorusGeometry(.125,.018,5,24),cream,0,y,0);ring.rotation.x=Math.PI/2;}
  return g;
}
