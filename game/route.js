// Shared by the simulation and the visible velvet runner.
// Two broad bends joined by a straight diagonal for bowling shots.
const curves=[
  [[-8,-4.1],[-8,7],[-5.5,5.5],[-2,2]],
  [[-2,2],[-2/3,2/3],[2/3,-2/3],[2,-2]],
  [[2,-2],[5.5,-5.5],[7,-6],[8,3.6]],
];
export const PATH=[curves[0][0]];
for(const [a,b,c,d] of curves){
  for(let n=1;n<=64;n++){
    const t=n/64,u=1-t;
    PATH.push([0,1].map(j=>u*u*u*a[j]+3*u*u*t*b[j]+3*u*t*t*c[j]+t*t*t*d[j]));
  }
}
