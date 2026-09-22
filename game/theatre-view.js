export const MIN_ELEVATION=18*Math.PI/180,MAX_ELEVATION=85*Math.PI/180;
export const MIN_ZOOM=.8,MAX_ZOOM=1.08;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

export function createTheatreView(){
  const wrap=angle=>Math.atan2(Math.sin(angle),Math.cos(angle));
  let defaultElevation=35*Math.PI/180,customElevation=false;
  const view={yaw:0,elevation:defaultElevation,zoom:1,targetYaw:0,targetElevation:defaultElevation,targetZoom:1};
  return Object.assign(view,{
    rotateTo(angle){if(Number.isFinite(angle))view.targetYaw=wrap(angle);},
    turn(delta){if(Number.isFinite(delta))view.rotateTo(view.targetYaw+delta);},
    setElevation(angle){if(Number.isFinite(angle)){customElevation=true;view.targetElevation=clamp(angle,MIN_ELEVATION,MAX_ELEVATION);}},
    tilt(delta){if(Number.isFinite(delta))view.setElevation(view.targetElevation+delta);},
    setDefaultElevation(angle){
      if(!Number.isFinite(angle))return;
      const next=clamp(angle,MIN_ELEVATION,MAX_ELEVATION);if(next===defaultElevation)return;
      defaultElevation=next;
      if(!customElevation)view.elevation=view.targetElevation=next;
    },
    magnify(factor){if(Number.isFinite(factor)&&factor>0)view.targetZoom=clamp(view.targetZoom*factor,MIN_ZOOM,MAX_ZOOM);},
    reset(){customElevation=false;view.targetYaw=0;view.targetElevation=defaultElevation;view.targetZoom=1;},
    tick(dt,reducedMotion=false){
      const beforeYaw=view.yaw,beforeElevation=view.elevation,beforeZoom=view.zoom,t=reducedMotion?1:1-Math.exp(-Math.max(0,dt)*16);
      // Cross the ±180° seam along the short arc, including when resetting.
      const turn=wrap(view.targetYaw-view.yaw);
      view.yaw=wrap(view.yaw+turn*t);view.elevation+=(view.targetElevation-view.elevation)*t;view.zoom+=(view.targetZoom-view.zoom)*t;
      if(Math.abs(wrap(view.targetYaw-view.yaw))<.0001)view.yaw=view.targetYaw;
      if(Math.abs(view.elevation-view.targetElevation)<.0001)view.elevation=view.targetElevation;
      if(Math.abs(view.zoom-view.targetZoom)<.0001)view.zoom=view.targetZoom;
      return beforeYaw!==view.yaw||beforeElevation!==view.elevation||beforeZoom!==view.zoom;
    },
  });
}

// Pointer arbitration is independent of the renderer so gesture cancellation can
// be tested without injecting events or hidden state into the browser.
export function createBoardGesture(){
  const points=new Map();let pair=null,multi=false,blockedUntil=0;
  const centre=()=>{const a=[...points.values()].filter(p=>p.type==='touch').slice(0,2);return a.length===2?{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2,d:Math.max(12,Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y))}:null;};
  return {
    down(p){
      if(points.has(p.id))return {};
      points.set(p.id,{...p,startX:p.x,startY:p.y,moved:false,camera:p.button===2});
      const next=centre();if(next){pair=next;multi=true;return {stopLantern:true,camera:true};}
      return p.type!=='touch'&&p.button===0&&p.floor?{lantern:p}:{};
    },
    move(p){
      const old=points.get(p.id);if(!old)return {};
      const dx=p.x-old.x,dy=p.y-old.y;Object.assign(old,{x:p.x,y:p.y});
      if(Math.hypot(p.x-old.startX,p.y-old.startY)>6)old.moved=true;
      const next=centre();
      if(next&&multi){const result={turn:next.x-pair.x,tilt:next.y-pair.y,zoom:next.d/pair.d,camera:true};pair=next;return result;}
      if(multi)return {};
      if(old.camera)return {turn:dx,tilt:dy,camera:true};
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
