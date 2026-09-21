import test from 'node:test';
import assert from 'node:assert/strict';
import {createTheatreView,createBoardGesture,MAX_TURN,MIN_ZOOM,MAX_ZOOM} from '../game/theatre-view.js';

const touch=(id,x,y=200,time=100)=>({id,x,y,time,type:'touch',button:0,floor:true});
test('turn and zoom stay bounded, invalid input is ignored, reset returns to the exact default',()=>{
  const v=createTheatreView();v.turn(100);v.magnify(100);v.tick(1,true);
  assert.equal(v.yaw,MAX_TURN);assert.equal(v.zoom,MAX_ZOOM);
  v.turn(-100);v.magnify(.001);v.tick(1,true);assert.equal(v.yaw,-MAX_TURN);assert.equal(v.zoom,MIN_ZOOM);
  v.turn(NaN);v.magnify(Infinity);v.magnify(-2);assert.equal(v.targetYaw,-MAX_TURN);assert.equal(v.targetZoom,MIN_ZOOM);
  v.reset();for(let i=0;i<90;i++)v.tick(1/60);assert.equal(v.yaw,0);assert.equal(v.zoom,1);assert.equal(v.tick(1/60),false);
});
test('one-finger touch taps and drags steer the lantern without turning the view',()=>{
  const g=createBoardGesture();assert.deepEqual(g.down(touch(1,100)),{});
  assert.deepEqual(g.up(touch(1,100)),{lantern:touch(1,100)});
  g.down(touch(2,100));assert.deepEqual(g.move(touch(2,103)),{});
  assert.deepEqual(g.move(touch(2,120)),{lantern:touch(2,120)});
});
test('two fingers turn and pinch without steering; a remaining finger cannot suddenly drag the lantern',()=>{
  const g=createBoardGesture();g.down(touch(1,100));assert.equal(g.down(touch(2,200)).stopLantern,true);
  const result=g.move(touch(2,240));assert.equal(result.turn,20);assert.equal(result.zoom,1.4);assert.equal(result.lantern,undefined);
  assert.deepEqual(g.up(touch(2,240,200,200)),{});
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
test('right mouse drag turns the board while left mouse drag retains lantern movement',()=>{
  const g=createBoardGesture(),p={...touch(1,100),type:'mouse',button:2};
  assert.deepEqual(g.down(p),{});const result=g.move({...p,x:140});assert.equal(result.turn,40);assert.equal(result.lantern,undefined);g.up(p);
  const left={...p,id:2,button:0};assert.deepEqual(g.down(left),{lantern:left});assert.ok(g.move({...left,x:120}).lantern);
});
