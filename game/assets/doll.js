// A turned wooden nesting doll; its painted wrap is applied by toy-look.js.
export default function generate(T){
  const g=new T.Group();
  const paint=new T.MeshStandardMaterial({color:'#a74455',roughness:.48});
  const gold=new T.MeshStandardMaterial({color:'#ad8140',metalness:.62,roughness:.35});
  const profile=[[0,0],[.39,0],[.54,.14],[.6,.42],[.57,.68],[.48,.91],[.33,1.07],[.35,1.3],[.32,1.43],[.23,1.59],[0,1.69]];
  const body=new T.Mesh(new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),48),paint);
  g.add(body);
  const seam=new T.Mesh(new T.TorusGeometry(.558,.012,5,48),gold);seam.position.y=.72;seam.rotation.x=Math.PI/2;g.add(seam);
  const foot=new T.Mesh(new T.CylinderGeometry(.398,.398,.022,40),gold);foot.position.y=.011;g.add(foot);
  return g;
}
