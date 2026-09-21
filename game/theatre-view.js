export const MAX_TURN=24*Math.PI/180;
export const MIN_ZOOM=.8,MAX_ZOOM=1.08;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

export function createTheatreView(){
  const view={yaw:0,zoom:1,targetYaw:0,targetZoom:1};
  return Object.assign(view,{
    turn(delta){if(Number.isFinite(delta))view.targetYaw=clamp(view.targetYaw+delta,-MAX_TURN,MAX_TURN);},
    magnify(factor){if(Number.isFinite(factor)&&factor>0)view.targetZoom=clamp(view.targetZoom*factor,MIN_ZOOM,MAX_ZOOM);},
    reset(){view.targetYaw=0;view.targetZoom=1;},
    tick(dt,reducedMotion=false){
      const beforeYaw=view.yaw,beforeZoom=view.zoom,t=reducedMotion?1:1-Math.exp(-Math.max(0,dt)*16);
      view.yaw+=(view.targetYaw-view.yaw)*t;view.zoom+=(view.targetZoom-view.zoom)*t;
      if(Math.abs(view.yaw-view.targetYaw)<.0001)view.yaw=view.targetYaw;
      if(Math.abs(view.zoom-view.targetZoom)<.0001)view.zoom=view.targetZoom;
      return beforeYaw!==view.yaw||beforeZoom!==view.zoom;
    },
  });
}

// Pointer arbitration is independent of the renderer so gesture cancellation can
// be tested without injecting events or hidden state into the browser.
export function createBoardGesture(){
  const points=new Map();let pair=null,multi=false,blockedUntil=0;
  const centre=()=>{const a=[...points.values()].filter(p=>p.type==='touch').slice(0,2);return a.length===2?{x:(a[0].x+a[1].x)/2,d:Math.max(12,Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y))}:null;};
  return {
    down(p){
      if(points.has(p.id))return {};
      points.set(p.id,{...p,startX:p.x,startY:p.y,moved:false,camera:p.button===2});
      const next=centre();if(next){pair=next;multi=true;return {stopLantern:true,camera:true};}
      return p.type!=='touch'&&p.button===0&&p.floor?{lantern:p}:{};
    },
    move(p){
      const old=points.get(p.id);if(!old)return {};
      const dx=p.x-old.x;Object.assign(old,{x:p.x,y:p.y});
      if(Math.hypot(p.x-old.startX,p.y-old.startY)>6)old.moved=true;
      const next=centre();
      if(next&&multi){const result={turn:next.x-pair.x,zoom:next.d/pair.d,camera:true};pair=next;return result;}
      if(multi)return {};
      if(old.camera)return {turn:dx,camera:true};
      return old.floor&&(old.type!=='touch'||old.moved)?{lantern:p}:{};
    },
    up(p,cancelled=false){
      const old=points.get(p.id);if(!old)return {};
      const camera=multi||old.camera;
      const result=!cancelled&&!camera&&old.type==='touch'&&old.floor?{lantern:p}:{};
      points.delete(p.id);if(camera)blockedUntil=p.time+400;
      if(!points.size){multi=false;pair=null;}else if(multi)pair=centre();
      return result;
    },
    blocksClick(time){return multi||time<blockedUntil;},
    cancel(){points.clear();pair=null;multi=false;},
  };
}
