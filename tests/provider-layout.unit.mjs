import {test} from 'node:test';import assert from 'node:assert/strict';
import {providerPlacement,councilSeats} from '../src/providerLayout.ts';
import {providers} from '../shared/organization.ts';
test('Provider bodies, totems and screens clear Council sofas and one another',()=>{
 const points=providers.map((_,i)=>providerPlacement(i,providers.length));
 // Conservative enclosing radii: provider + all three screens 4.15; sofa 1.65.
 for(const [i,p] of points.entries()){
  for(const [x,z] of councilSeats)assert.ok(Math.hypot(p.x-x,p.z-z)>4.15+1.65+1,'Council clearance: '+providers[i].id);
  for(const q of points.slice(i+1))assert.ok(Math.hypot(p.x-q.x,p.z-q.z)>8.3,'Provider screen overlap');
  assert.ok(Math.hypot(p.x,p.z)-4.15>9.23,'Command platform overlap');
 }
});
