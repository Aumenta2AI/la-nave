// Department-local navigation. The model faces local +Z.
export type PatrolState={x:number;z:number;yaw:number;target:number;returning:boolean};
export const patrolPath=[[0,3],[0,1.35],[2.3,1.35],[2.3,-4.65]] as const;
export function createPatrol():PatrolState{return {x:0,z:3,yaw:0,target:1,returning:false};}
export function patrolHeight(z:number){return .27+.285*Math.max(0,Math.min(1,(z-1.35)/.45));}
export function stepPatrol(s:PatrolState,dt:number,idle:boolean){
 if(!idle&&!s.returning){s.returning=true;s.target=Math.max(0,s.target-1);}
 const goal=patrolPath[s.target],dx=goal[0]-s.x,dz=goal[1]-s.z,distance=Math.hypot(dx,dz);
 if(distance<.001){
  if(s.target===0){if(!idle){s.yaw=0;return 0;}s.returning=false;s.target=1;}
  else if(s.target===patrolPath.length-1){s.returning=true;s.target--;}
  else s.target+=s.returning?-1:1;
  return 0;
 }
 const desired=Math.atan2(dx,dz),error=Math.atan2(Math.sin(desired-s.yaw),Math.cos(desired-s.yaw));
 s.yaw+=Math.sign(error)*Math.min(Math.abs(error),Math.max(0,dt)*2.8);
 // Turn in place before stepping: never slide sideways or walk backwards.
 if(Math.abs(error)>.06)return 0;
 const step=Math.min(distance,Math.max(0,Math.min(dt,.08))*1.1);
 s.x+=dx/distance*step;s.z+=dz/distance*step;
 return step>0?1:0;
}
