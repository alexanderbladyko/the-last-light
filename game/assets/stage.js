// A shallow painted platform. The upright scenery lives in stage-look.js,
// where it can face the audience in both portrait and landscape.
export default function generate(THREE){
  const g=new THREE.Group();
  const wood=new THREE.MeshStandardMaterial({color:'#846044',roughness:.9});
  const edge=new THREE.MeshStandardMaterial({color:'#243d42',roughness:.82});
  const brass=new THREE.MeshStandardMaterial({color:'#bf995e',metalness:.3,roughness:.48});
  const board=new THREE.MeshStandardMaterial({color:'#76583f',roughness:.85});
  function box(w,h,d,mat,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);g.add(o);return o;}
  box(20,.6,15,wood,0,.3,0);
  for(let i=0;i<25;i++)box(.78,.1,14.9,board,-9.6+i*.8,.65,0);
  for(const z of [-7.49,7.49]){box(20,.35,.12,edge,0,.4,z);box(20,.035,.13,brass,0,.64,z);}
  for(const x of [-9.95,9.95]){box(.12,.35,15,edge,x,.4,0);box(.13,.035,15,brass,x,.64,0);}
  return g;
}
