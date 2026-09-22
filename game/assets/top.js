// A turned wooden toy: ivory inlays, painted lacquer and a real brass point.
export default function generate(T){
  const g=new T.Group();
  const mat=(color,metalness=0)=>new T.MeshStandardMaterial({color,roughness:metalness?.32:.48,metalness});
  const red=mat('#873949'),paint=mat('#aa5848'),cream=mat('#e5d5b0'),teal=mat('#285b61'),gold=mat('#c29a56',.6),wood=mat('#846044');
  const add=(geo,m,x=0,y=0,z=0)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);g.add(o);return o;};
  const lathe=(p,m,n=32,start=0,length=Math.PI*2)=>add(new T.LatheGeometry(p.map(a=>new T.Vector2(...a)),n,start,length),m);
  const ring=(radius,y,tube=.015,m=gold)=>{const o=add(new T.TorusGeometry(radius,tube,4,32),m,0,y,0);o.rotation.x=Math.PI/2;};
  lathe([[0,0],[.055,.025],[.095,.15],[.09,.22]],gold,24);
  lathe([[.075,.16],[.13,.25],[.34,.4],[.59,.56],[.76,.71],[.8,.83],[.775,.92],[.66,1.045],[.47,1.17],[.24,1.25],[.15,1.28]],red);
  lathe([[.59,.558],[.765,.715],[.806,.805],[.808,.846]],cream);
  lathe([[.81,.85],[.80,.9],[.77,.944]],teal);
  // Broad ivory petals alternate with the original floral lacquer artwork.
  const crown=[[.768,.95],[.665,1.051],[.474,1.176],[.24,1.256],[.155,1.285]];
  for(let i=0;i<12;i++)lathe(crown,i%2?paint:cream,5,i*Math.PI/6+.025,Math.PI/6-.05);
  for(const [r,y]of [[.766,.714],[.808,.844],[.773,.947],[.244,1.263]])ring(r,y);
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6,mark=add(new T.SphereGeometry(.037,6,4),teal,Math.sin(a)*.724,.68,Math.cos(a)*.724);mark.scale.set(.7,1,.7);
  }
  lathe([[.14,1.27],[.18,1.34],[.16,1.39],[.09,1.46],[.085,1.61],[.12,1.66]],wood,24);
  for(const y of [1.35,1.4,1.59])ring(y===1.59?.091:.16,y,.014);
  lathe([[.09,1.61],[.17,1.68],[.205,1.75],[.185,1.84],[.12,1.91],[0,1.94]],cream,24);
  ring(.2,1.766,.022,teal);ring(.122,1.905,.014);
  return g;
}
