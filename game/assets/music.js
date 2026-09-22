// Painted wood, a fluted brass bell and a working clockwork mechanism.
// Moving pieces use distinct material values so the recipe loader can bake
// them normally; their material tags let the view restore three rigid pivots.
export const MUSIC_PIVOTS={horn:[.2,1.2,-.32],record:[-.2,1.09,.16],crank:[.84,.59,0]};
export default function generate(T){
  const g=new T.Group();
  const mat=(color,metalness=0,part='cabinet')=>{const m=new T.MeshStandardMaterial({color,metalness,roughness:metalness?.36:.64});m.userData.gramophonePart=part;return m;};
  const teal=mat('#367b75'),wood=mat('#846044'),dark=mat('#183a40'),trim=mat('#b88e50',.55),cream=mat('#e7d2a0');
  const brass=mat('#d3a650',.58,'horn'),inside=mat('#be8c42',.42,'horn'),rim=mat('#eed098',.5,'horn'),throat=mat('#433021',0,'horn');
  inside.side=T.BackSide;inside.vertexColors=true;
  const wax=mat('#152027',.16,'record'),label=mat('#ca9256',.22,'record');
  const crankMetal=mat('#a97a3f',.6,'crank'),handle=mat('#172e34',.15,'crank');
  const add=(geo,m,x=0,y=0,z=0,parent=g)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);parent.add(o);return o;};
  const box=(w,h,d,m,x,y,z)=>add(new T.BoxGeometry(w,h,d),m,x,y,z);
  const rod=(a,b,r,m,parent=g)=>{const from=new T.Vector3(...a),v=new T.Vector3(...b).sub(from),o=add(new T.CylinderGeometry(r,r,v.length(),8),m,0,0,0,parent);o.position.copy(from).addScaledVector(v,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;};
  for(const x of [-.59,.59])for(const z of [-.46,.46]){
    add(new T.SphereGeometry(.125,10,8),wood,x,.13,z).scale.set(1,.85,1);
    box(.105,.55,.105,trim,x,.58,z);
  }
  box(1.58,.15,1.27,wood,0,.26,0);box(1.62,.055,1.31,trim,0,.36,0);
  box(1.41,.54,1.12,teal,0,.64,0);box(1.62,.13,1.31,wood,0,.96,0);box(1.65,.045,1.34,trim,0,1.045,0);
  // Reuse the original painted botanical panel on the front and rear.
  for(const side of [-1,1]){
    box(1.17,.4,.027,dark,0,.64,side*.572);
    for(const x of [-.63,.63])box(.055,.47,.045,trim,x,.64,side*.59);
    for(const y of [.408,.874])box(1.31,.045,.045,trim,0,y,side*.59);
  }
  for(const x of [-.718,.718])box(.03,.34,.85,wood,x,.64,0);
  box(.19,.12,.045,trim,0,.43,.624);
  add(new T.SphereGeometry(.031,8,6),cream,0,.43,.655);
  add(new T.CylinderGeometry(.48,.48,.045,40),trim,-.2,1.07,.16);
  add(new T.CylinderGeometry(.435,.435,.026,48),wax,-.2,1.098,.16);
  for(const r of [.24,.33,.4]){const o=add(new T.TorusGeometry(r,.006,4,40),label,-.2,1.115,.16);o.rotation.x=Math.PI/2;}
  add(new T.CylinderGeometry(.115,.115,.005,24),label,-.2,1.115,.16);
  box(.028,.006,.076,cream,-.2,1.121,.16); // fixed spindle marker
  // One asymmetrical label mark makes record rotation readable.
  add(new T.SphereGeometry(.021,6,4),wax,-.156,1.121,.2).scale.y=.2;
  rod([.5,1.07,-.2],[.5,1.24,-.2],.035,trim);
  const tone=new T.CatmullRomCurve3([new T.Vector3(.5,1.24,-.2),new T.Vector3(.46,1.24,.05),new T.Vector3(.22,1.17,.26)]);
  add(new T.TubeGeometry(tone,10,.026,6,false),trim);
  add(new T.SphereGeometry(.055,10,6),trim,.22,1.16,.26);
  // The neck and bell form one rigid, pivoting assembly.
  rod([.2,1.04,-.32],[.2,1.25,-.32],.085,brass);
  const bell=new T.Group();bell.position.set(...MUSIC_PIVOTS.horn);bell.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(0,.6,.8));g.add(bell);
  const profile=[[.075,0],[.08,.13],[.105,.28],[.16,.43],[.26,.58],[.40,.72],[.59,.87],[.81,1.0]];
  function surface(inset){
    const positions=[],uv=[],colors=[],indices=[],shade=[.13,.2,.32,.53,.74,.88,.97,1];
    profile.forEach(([r,y],j)=>{for(let i=0;i<=64;i++){
      const a=i*Math.PI/32,fold=Math.cos(a*8),radius=r*(1+.055*fold*y*y)-inset;
      positions.push(Math.sin(a)*radius,y+.028*fold*y*y*y,Math.cos(a)*radius);uv.push(i/64,y);
      colors.push(shade[j],shade[j],shade[j]);
      if(j<profile.length-1&&i<64){const n=j*65+i;indices.push(n,n+1,n+65,n+1,n+66,n+65);}
    }});
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    if(inset)geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
  }
  add(surface(0),brass,0,0,0,bell);add(surface(.012),inside,0,0,0,bell);
  const lipPoints=Array.from({length:64},(_,i)=>{const a=i*Math.PI/32,fold=Math.cos(a*8),r=.81*(1+.055*fold);return new T.Vector3(Math.sin(a)*r,1+.028*fold,Math.cos(a)*r);});
  add(new T.TubeGeometry(new T.CatmullRomCurve3(lipPoints,true),96,.023,5,true),rim,0,0,0,bell);
  const darkHole=add(new T.CircleGeometry(.071,24),throat,0,.07,0,bell);darkHole.rotation.x=-Math.PI/2;
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4,points=profile.slice(2).map(([r,y])=>new T.Vector3(Math.sin(a)*(r*(1+.055*y*y)+.007),y+.028*y*y*y,Math.cos(a)*(r*(1+.055*y*y)+.007)));
    add(new T.TubeGeometry(new T.CatmullRomCurve3(points),12,.01,4,false),rim,0,0,0,bell);
  }
  rod([.69,.59,0],[.98,.59,0],.035,crankMetal);rod([.98,.59,0],[.98,.34,0],.035,crankMetal);
  rod([.98,.34,0],[1.12,.34,0],.058,handle);
  return g;
}
