// Shared by the simulation and the visible velvet runner.
const corners=[[-8,-4.1],[-5,-4.1],[-5,2.7],[0,2.7],[0,-2.8],[5.3,-2.8],[5.3,3.6],[8,3.6]];
export const PATH=[corners[0]];
for(let i=1;i<corners.length-1;i++){
  const a=corners[i-1],b=corners[i],c=corners[i+1];
  const ab=Math.hypot(b[0]-a[0],b[1]-a[1]),bc=Math.hypot(c[0]-b[0],c[1]-b[1]);
  const radius=Math.min(1.1,ab*.42,bc*.42);
  const entry=b.map((v,j)=>v+(a[j]-v)*radius/ab),exit=b.map((v,j)=>v+(c[j]-v)*radius/bc);
  PATH.push(entry);
  for(let n=1;n<=18;n++){
    const t=n/18,u=1-t;
    PATH.push([u*u*entry[0]+2*u*t*b[0]+t*t*exit[0],u*u*entry[1]+2*u*t*b[1]+t*t*exit[1]]);
  }
}
PATH.push(corners.at(-1));
