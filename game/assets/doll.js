// Painted nesting doll: a broad cream apron and an expressive face.
export default function generate(T){
  const g=new T.Group();
  const mat=color=>new T.MeshStandardMaterial({color,roughness:.67});
  const red=mat('#a74455'),cream=mat('#f0dcb3'),cheek=mat('#d97d6b'),ink=mat('#242b35'),gold=mat('#d6ac66'),teal=mat('#3d7c72');
  const add=(geo,m,x=0,y=0,z=0)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);g.add(o);return o;};
  const ball=(r,m,x,y,z,sx=1,sy=1,sz=1)=>{const o=add(new T.SphereGeometry(r,12,8),m,x,y,z);o.scale.set(sx,sy,sz);return o;};
  add(new T.LatheGeometry([[0,0],[.39,0],[.55,.14],[.6,.48],[.53,.82],[.34,1.06],[.35,1.35],[.24,1.59],[0,1.69]].map(p=>new T.Vector2(...p)),32),red);
  ball(.39,cream,0,.54,.46,.95,1.05,.32);
  ball(.27,cream,0,1.32,.286,.97,1.1,.42);
  for(const side of [-1,1]){
    ball(.052,ink,side*.098,1.365,.408,.83,1,.2);
    ball(.014,cream,side*.098-.01,1.38,.421,1,1,.3);
    ball(.052,cheek,side*.153,1.265,.391,1,.63,.18);
    const brow=add(new T.TorusGeometry(.062,.012,5,12,1.45),ink,side*.095,1.425,.4);brow.rotation.z=side<0?.5:1.2;
    ball(.085,teal,side*.075,1.045,.34,1.1,.45,.2).rotation.z=side*.4;
  }
  const mouth=add(new T.TorusGeometry(.051,.01,5,16,Math.PI),red,0,1.22,.391);mouth.rotation.z=Math.PI+.06;
  ball(.027,cheek,0,1.29,.418,.6,.85,.5);
  for(const [cx,cy,scale]of [[0,.6,1],[-.19,.39,.62],[.19,.39,.62]]){
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(.084*scale,red,cx+Math.sin(a)*.105*scale,cy+Math.cos(a)*.105*scale,.596,.6,1,.16).rotation.z=-a;}
    ball(.044*scale,gold,cx,cy,.613,1,1,.2);
  }
  for(const side of [-1,1])ball(.1,teal,side*.21,.76,.557,.4,1,.12).rotation.z=-side*.6;
  const seam=add(new T.TorusGeometry(.571,.018,5,40),gold,0,.66,0);seam.rotation.x=Math.PI/2;
  for(let i=0;i<18;i++){const a=i*Math.PI/9;ball(.025,cream,Math.sin(a)*.48,.12,Math.cos(a)*.48);}
  return g;
}
