/** Reserve the forward sector for the Council, including screens and walking clearance. */
export function providerPlacement(index:number,count:number){
 const opening=.85;
 const angle=count<=1?0:-Math.PI+opening+index*(2*Math.PI-2*opening)/(count-1);
 const radius=Math.max(18,count>1?8.8/(2*Math.sin((2*Math.PI-2*opening)/(count-1)/2)):18);
 return {angle,x:radius*Math.sin(angle),z:-radius*Math.cos(angle)};
}
export const councilSeats=[[-6,11],[-6,14],[-3,15],[3,15],[6,14],[6,11]] as const;
