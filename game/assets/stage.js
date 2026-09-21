// A painted wooden theatre box with layered edges and small feet. The upright scenery lives in stage-look.js,
// where it can face the audience in both portrait and landscape.
export default function generate(THREE){
  const g=new THREE.Group();
  const wood=new THREE.MeshStandardMaterial({color:'#846044',roughness:.9});
  const edge=new THREE.MeshStandardMaterial({color:'#243d42',roughness:.82});
  const brass=new THREE.MeshStandardMaterial({color:'#bf995e',metalness:.3,roughness:.48});
  const board=new THREE.MeshStandardMaterial({color:'#76583f',roughness:.85});
  function box(w,h,d,mat,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);g.add(o);return o;}
  box(20,.9,15,wood,0,.75,0);
  for(const x of [-9.1,9.1])for(const z of [-6.65,6.65])box(.9,.3,.8,edge,x,.15,z);
  for(let i=0;i<25;i++)box(.78,.1,14.9,board,-9.6+i*.8,1.25,0);
  for(const z of [-7.49,7.49]){box(20,.35,.12,edge,0,.72,z);box(20,.035,.13,brass,0,1.19,z);}
  for(const x of [-9.95,9.95]){box(.12,.35,15,edge,x,.72,0);box(.13,.035,15,brass,x,1.19,0);}
  for(const y of [.36,.97]){
    for(const z of [-7.51,7.51])box(20.12,.06,.14,brass,0,y,z);
    for(const x of [-10.01,10.01])box(.14,.06,15.12,brass,x,y,0);
  }
  return g;
}
