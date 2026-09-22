// Backstage still life. World-space placements deliberately leave the runner and sockets open.
export default function generate(THREE){
  const root=new THREE.Group();
  const wood=new THREE.MeshStandardMaterial({color:'#99764f',roughness:.8});
  const wine=new THREE.MeshStandardMaterial({color:'#703542',roughness:.82});
  const teal=new THREE.MeshStandardMaterial({color:'#426661',roughness:.8});
  const ivory=new THREE.MeshStandardMaterial({color:'#dccb9e',roughness:.8});
  const brass=new THREE.MeshStandardMaterial({color:'#b99055',metalness:.55,roughness:.38});
  const ink=new THREE.MeshStandardMaterial({color:'#283436',roughness:.95});
  const ribbon=new THREE.MeshStandardMaterial({color:'#a8776b',roughness:.9,side:THREE.DoubleSide});
  ribbon.userData.handmade=false;
  function add(parent,geo,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;}
  function box(parent,w,h,d,mat,x=0,y=0,z=0){return add(parent,new THREE.BoxGeometry(w,h,d),mat,x,y,z);}
  function line(parent,points,r,mat){return add(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),24,r,5,false),mat);}
  function star(parent,r,x,y,z){
    const shape=new THREE.Shape();
    for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,s=i%2?r*.43:r;i?shape.lineTo(Math.cos(a)*s,Math.sin(a)*s):shape.moveTo(Math.cos(a)*s,Math.sin(a)*s);}
    shape.closePath();add(parent,new THREE.ExtrudeGeometry(shape,{depth:.018,bevelEnabled:false}),ivory,x,y,z);
  }

  // A slightly open, barrel-lidded toy chest: lacquered wood, not another tower pedestal.
  const chest=new THREE.Group();chest.name='toy-chest';
  box(chest,2.25,.12,1.32,wood,0,.16,0);
  box(chest,2.12,.035,1.2,ink,0,.24,0);
  for(const z of [-.62,.62])box(chest,2.25,.64,.12,wine,0,.55,z);
  for(const x of [-1.08,1.08])box(chest,.12,.64,1.32,wood,x,.55,0);
  for(const x of [-1.03,1.03])for(const z of [-.57,.57]){
    box(chest,.19,.16,.2,wood,x,.08,z);
    box(chest,.14,.59,.145,brass,x,.54,z);
    for(const y of [.32,.74])add(chest,new THREE.SphereGeometry(.028,6,4),ink,x,y,z+Math.sign(z)*.08);
  }
  for(const y of [.25,.86])box(chest,2.3,.055,1.38,wood,0,y,0);
  box(chest,1.57,.37,.028,ink,0,.54,.688);
  for(const x of [-.66,.66])star(chest,.10,x,.54,.71);
  star(chest,.19,0,.54,.71);
  box(chest,.16,.24,.07,brass,0,.82,.73);
  add(chest,new THREE.SphereGeometry(.038,8,6),ink,0,.81,.775).scale.set(.7,1,.35);
  const lid=new THREE.Group();lid.position.set(0,.88,-.65);lid.rotation.x=-.28;chest.add(lid);
  const arch=new THREE.Shape();arch.moveTo(-.69,0);arch.lineTo(.69,0);
  for(let i=0;i<=16;i++){const a=i*Math.PI/16;arch.lineTo(.69*Math.cos(a),.24*Math.sin(a)+.045);}
  arch.closePath();
  const shell=add(lid,new THREE.ExtrudeGeometry(arch,{depth:2.32,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:1,steps:1}),wine,-1.16,0,.65);shell.rotation.y=Math.PI/2;
  box(lid,2.35,.055,1.43,wood,0,0,.65);
  for(const x of [-.83,.83]){
    const curve=[];for(let i=0;i<=20;i++){const a=i*Math.PI/20;curve.push([x,.24*Math.sin(a)+.063,.65+.7*Math.cos(a)]);}
    line(lid,curve,.031,brass);
  }
  for(const x of [-.8,.8])add(chest,new THREE.CylinderGeometry(.065,.065,.25,8),brass,x,.88,-.69).rotation.z=Math.PI/2;
  chest.position.set(-2.45,0,-4.55);chest.rotation.y=-.12;root.add(chest);

  // Raised letters on three faces stay legible from the portrait camera and while turning.
  function letter(face,id){
    if(id==='A'){
      line(face,[[-.15,-.19,.025],[0,.19,.025],[.15,-.19,.025]],.024,ivory);
      box(face,.18,.04,.04,ivory,0,-.055,.025);
    }else if(id==='B'){
      box(face,.044,.38,.04,ivory,-.12,0,.025);
      for(const y of [-.095,.095])line(face,[[-.12,y+.095,.025],[.08,y+.085,.025],[.14,y,.025],[.08,y-.085,.025],[-.12,y-.095,.025]],.022,ivory);
    }else{
      const points=[];for(let i=0;i<=20;i++){const a=.65+i*(Math.PI*2-1.3)/20;points.push([Math.cos(a)*.15,Math.sin(a)*.19,.025]);}
      line(face,points,.024,ivory);
    }
  }
  function block(id,paint,x,y,z,turn){
    const b=new THREE.Group();
    const shape=new THREE.Shape();shape.moveTo(-.31,-.31);shape.lineTo(.31,-.31);shape.lineTo(.31,.31);shape.lineTo(-.31,.31);shape.closePath();
    add(b,new THREE.ExtrudeGeometry(shape,{depth:.62,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:1,steps:1}),wood,0,0,-.31);
    for(const [px,py,pz,rx,ry] of [[0,0,.351,0,0],[.351,0,0,0,Math.PI/2],[0,.351,0,-Math.PI/2,0]]){
      const face=new THREE.Group();face.position.set(px,py,pz);face.rotation.set(rx,ry,0);
      box(face,.55,.55,.012,paint);letter(face,id);b.add(face);
    }
    b.position.set(x,y,z);b.rotation.y=turn;return b;
  }
  const blocks=new THREE.Group();blocks.name='alphabet-blocks';
  blocks.add(block('A',wine,-.39,.35,0,-.14),block('B',teal,.39,.35,.16,.18),block('C',teal,-.39,1.05,0,.17));
  blocks.position.set(3.7,0,3.95);blocks.rotation.y=.18;root.add(blocks);

  // A tipped spool and one short, flat curl of ribbon, contained beside the apron.
  const sewing=new THREE.Group();sewing.name='ribbon-spool';
  const spool=new THREE.Group();
  add(spool,new THREE.CylinderGeometry(.3,.3,.73,24),ribbon);
  for(const y of [-.4,.4]){
    add(spool,new THREE.CylinderGeometry(.44,.44,.085,24),wood,0,y,0);
    add(spool,new THREE.CylinderGeometry(.33,.33,.012,24),ivory,0,y+Math.sign(y)*.049,0);
    add(spool,new THREE.CylinderGeometry(.082,.082,.02,12),ink,0,y+Math.sign(y)*.06,0);
    const rim=add(spool,new THREE.TorusGeometry(.395,.012,4,24),brass,0,y+Math.sign(y)*.045,0);rim.rotation.x=Math.PI/2;
  }
  for(let i=0;i<11;i++){
    const winding=add(spool,new THREE.TorusGeometry(.3,.012,4,24),ribbon,0,-.32+i*.064,0);winding.rotation.x=Math.PI/2;
  }
  spool.rotation.z=Math.PI/2;spool.rotation.y=.2;spool.position.set(0,.445,0);sewing.add(spool);
  const curl=new THREE.CatmullRomCurve3([[.04,.24,.23],[.06,.045,.71],[.68,.034,.83],[1.1,.038,.50],[1.47,.035,.75],[1.22,.038,1.13]].map(p=>new THREE.Vector3(...p)));
  const positions=[],indices=[];
  for(let i=0;i<=40;i++){
    const p=curl.getPoint(i/40),t=curl.getTangent(i/40),n=new THREE.Vector3(t.z,0,-t.x).normalize().multiplyScalar(.105);
    positions.push(p.x+n.x,p.y,p.z+n.z,p.x-n.x,p.y,p.z-n.z);
    if(i){const k=i*2;indices.push(k-2,k,k-1,k-1,k,k+1);}
  }
  const strip=new THREE.BufferGeometry();strip.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));strip.setIndex(indices);strip.computeVertexNormals();add(sewing,strip,ribbon);
  sewing.position.set(-1.2,0,4.5);sewing.rotation.y=-.25;root.add(sewing);
  return root;
}
