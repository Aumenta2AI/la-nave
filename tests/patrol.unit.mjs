import * as T from 'three';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPatrol,stepPatrol,patrolHeight} from '../src/crewPatrol.ts';
const radius=.6;
const obstacles=[[-2.675,-1.825,2.15,4.95],[1.825,2.675,2.15,4.95],[-2.6,2.6,3.725,5.075]];
for(const x of [-4.6,0,4.6])for(const z of [-.9,-4.3])obstacles.push([x-1.35,x+1.35,z-.5,z+1.475]);
function safe(s){assert.ok(Math.abs(s.x)+radius<7.6);assert.ok(s.z-radius> -5.7&&s.z+radius<6.2);for(const [x0,x1,z0,z1] of obstacles){const x=Math.max(x0,Math.min(s.x,x1)),z=Math.max(z0,Math.min(s.z,z1));assert.ok(Math.hypot(s.x-x,s.z-z)>=radius,'Collision at '+JSON.stringify(s));}}
test('Department patrol clears desks and walls, faces travel, and stays grounded',()=>{const s=createPatrol();for(let i=0;i<30000;i++){const old={...s};stepPatrol(s,.016,true);safe(s);const dx=s.x-old.x,dz=s.z-old.z;if(Math.hypot(dx,dz)>1e-7)assert.ok((dx*Math.sin(s.yaw)+dz*Math.cos(s.yaw))/Math.hypot(dx,dz)>.998);assert.ok(patrolHeight(s.z)>=.27&&patrolHeight(s.z)<=.555);}});
test('Task interrupt returns along safe aisle from every sampled patrol phase',()=>{for(let phase=0;phase<1800;phase+=37){const s=createPatrol();for(let i=0;i<phase;i++)stepPatrol(s,.04,true);for(let i=0;i<3000;i++){stepPatrol(s,.04,false);safe(s);}assert.ok(Math.hypot(s.x,s.z-3)<.001);assert.equal(s.yaw,0);}});

test('World orientation faces travel in every department, including rear semicircle',()=>{for(let area=0;area<24;area++){const angle=(area-1)*2*Math.PI/24,s=createPatrol(),actor=new T.Group();actor.applyMatrix4(new T.Matrix4().makeRotationY(-angle));for(let i=0;i<3500;i++){const old={...s},walking=stepPatrol(s,.04,true);actor.quaternion.setFromAxisAngle(new T.Vector3(0,1,0),s.yaw-angle);if(walking){const motion=new T.Vector3(s.x-old.x,0,s.z-old.z).applyAxisAngle(new T.Vector3(0,1,0),-angle).normalize();const front=new T.Vector3(0,0,1).applyQuaternion(actor.quaternion);assert.ok(front.dot(motion)>.998,'Wrong heading in area '+area);}}}});
