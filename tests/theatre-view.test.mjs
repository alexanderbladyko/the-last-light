import test from 'node:test';
import assert from 'node:assert/strict';
import {createTheatreView,createBoardGesture,MIN_ELEVATION,MAX_ELEVATION,MIN_ZOOM,MAX_ZOOM} from '../game/theatre-view.js';

const touch=(id,x,y=200,time=100)=>({id,x,y,time,type:'touch',button:0,floor:true});
const rad=degrees=>degrees*Math.PI/180;
test('rotation crosses the rear seam smoothly and can complete repeated full circles',()=>{
  const v=createTheatreView();v.rotateTo(rad(179));v.tick(1,true);
  v.turn(rad(2));v.tick(1/60);
  assert.ok(Math.abs(v.yaw)>rad(179),'crossing the seam must not spin through the front');
  for(let i=0;i<90;i++)v.tick(1/60);
  assert.ok(Math.abs(v.yaw-rad(-179))<1e-10);
  v.reset();v.tick(1,true);
  for(let i=0;i<72;i++){v.turn(rad(15));v.tick(1,true);}
  assert.ok(Math.abs(v.yaw)<1e-10);
  v.rotateTo(rad(-179));v.tick(1,true);v.turn(rad(-2));v.tick(1/60);
  assert.ok(Math.abs(v.yaw)>rad(179),'the opposite seam must also take the short arc');
});
test('elevation and zoom stay bounded; invalid inputs are ignored; reset settles exactly',()=>{
  const v=createTheatreView();v.setDefaultElevation(rad(40));v.setElevation(100);v.magnify(100);v.tick(1,true);
  assert.equal(v.elevation,MAX_ELEVATION);assert.equal(v.zoom,MAX_ZOOM);
  v.tilt(-100);v.magnify(.001);v.tick(1,true);assert.equal(v.elevation,MIN_ELEVATION);assert.equal(v.zoom,MIN_ZOOM);
  v.turn(NaN);v.rotateTo(Infinity);v.tilt(NaN);v.setElevation(Infinity);v.magnify(Infinity);v.magnify(-2);
  assert.equal(v.targetYaw,0);assert.equal(v.targetElevation,MIN_ELEVATION);assert.equal(v.targetZoom,MIN_ZOOM);
  v.rotateTo(rad(175));v.tick(1,true);v.reset();for(let i=0;i<90;i++)v.tick(1/60);
  assert.equal(v.yaw,0);assert.equal(v.elevation,rad(40));assert.equal(v.zoom,1);assert.equal(v.tick(1/60),false);
});
test('orientation changes preserve a custom elevation and reset uses the current layout default',()=>{
  const v=createTheatreView();v.setDefaultElevation(rad(54));assert.equal(v.elevation,rad(54));
  v.setElevation(rad(80));v.tick(1,true);v.setDefaultElevation(rad(35));assert.equal(v.elevation,rad(80));
  v.reset();v.tick(1,true);assert.equal(v.elevation,rad(35));
  v.setDefaultElevation(rad(54));assert.equal(v.elevation,rad(54));
});
test('one-finger touch taps and drags steer the lantern without turning the view',()=>{
  const g=createBoardGesture();assert.deepEqual(g.down(touch(1,100)),{});
  assert.deepEqual(g.up(touch(1,100)),{lantern:touch(1,100)});
  g.down(touch(2,100));assert.deepEqual(g.move(touch(2,103)),{});
  assert.deepEqual(g.move(touch(2,120)),{lantern:touch(2,120)});
});
test('two fingers turn, tilt and pinch without steering; a remaining finger cannot suddenly drag the lantern',()=>{
  const g=createBoardGesture();g.down(touch(1,100));assert.equal(g.down(touch(2,200)).stopLantern,true);
  const result=g.move(touch(2,240));assert.equal(result.turn,20);assert.equal(result.tilt,0);assert.equal(result.zoom,1.4);assert.equal(result.lantern,undefined);
  const raised=g.move(touch(2,240,240));assert.equal(raised.turn,0);assert.equal(raised.tilt,20);assert.equal(raised.lantern,undefined);
  assert.deepEqual(g.up(touch(2,240,240,200)),{});
  assert.deepEqual(g.move(touch(1,140)),{});assert.deepEqual(g.up(touch(1,140,200,300)),{});
  assert.equal(g.blocksClick(350),true);assert.equal(g.blocksClick(701),false);
  assert.deepEqual(g.down(touch(3,120,200,800)),{});assert.ok(g.up(touch(3,120,200,900)).lantern);
});
test('a second touch on a toy participates in the camera gesture and suppresses its click',()=>{
  const g=createBoardGesture();g.down({...touch(1,100),floor:false});g.down(touch(2,200));
  assert.equal(g.blocksClick(100),true);assert.equal(g.move(touch(1,120)).lantern,undefined);
  g.up(touch(1,120));g.up(touch(2,200));assert.equal(g.blocksClick(200),true);
});
test('third fingers and cancellation do not leave stale pinch distances or trigger a tap',()=>{
  const g=createBoardGesture();g.down(touch(1,100));g.down(touch(2,200));g.down(touch(3,300));
  g.up(touch(1,100),true);const result=g.move(touch(3,310));assert.ok(Number.isFinite(result.zoom));assert.equal(result.lantern,undefined);
  g.cancel();assert.deepEqual(g.move(touch(2,250)),{});assert.deepEqual(g.up(touch(3,310)),{});
  g.down(touch(4,50));assert.deepEqual(g.up(touch(4,50),true),{});
});
test('right mouse drag turns and tilts the board while left mouse drag retains lantern movement',()=>{
  const g=createBoardGesture(),p={...touch(1,100),type:'mouse',button:2};
  assert.deepEqual(g.down(p),{});const result=g.move({...p,x:140,y:230});assert.equal(result.turn,40);assert.equal(result.tilt,30);assert.equal(result.lantern,undefined);g.up(p);
  const left={...p,id:2,button:0};assert.deepEqual(g.down(left),{lantern:left});assert.ok(g.move({...left,x:120}).lantern);
});
