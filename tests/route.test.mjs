import test from 'node:test';
import assert from 'node:assert/strict';
import {PATH,PATH_LENGTH,SOCKETS,pointAt} from '../game/sim.js';

test('the sweeping route preserves travel time and gives every mount clear, useful coverage',()=>{
  assert.ok(PATH_LENGTH>31&&PATH_LENGTH<34,'stay near the original 32.2-unit travel budget');
  for(const [x,z]of PATH)assert.ok(Math.abs(x)<=8.2&&Math.abs(z)<=5.2,'runner stays on the playable floor');
  for(const [x,z]of SOCKETS){
    let covered=0;
    for(let d=0;d<PATH_LENGTH;d+=.02){
      const p=pointAt(d),distance=Math.hypot(x-p.x,z-p.z);
      assert.ok(distance>1.35,'toys stand beside the runner');
      if(distance<=2.65)covered+=.02;
    }
    assert.ok(covered>=3.4,'even an unupgraded top gets a useful attack window');
  }
});
