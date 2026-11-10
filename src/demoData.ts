import {departments,providers} from '../shared/organization';
import {councilMembers} from '../shared/council';
import {crewCatalog} from '../shared/crewCatalog';
export function demoData(){
 const base={personality:'Profesional y claro',done:'Ejemplo verificable',effort:'medium',enabled:true,pending:0,state:'idle'};
 const agents:any[]=[{...base,id:'hittan',name:'Hittan',appearance:'Hittan',objective:'Dirección de La Nave'},{...base,id:'pulpo',name:'Donna',appearance:'Donna',objective:'Coordinar los equipos de la nave'}];
 const areaIds=['administrativo','contabilidad','legal','ventas','soporte','marketing','investigacion','rrhh','licitaciones','calidad','ciberseguridad','fabrica'];
 for(const d of departments){
  agents.push({...base,id:d.id,name:d.name,role:'Dirección de '+d.name,appearance:d.model,objective:d.topic});
  const catalog=crewCatalog.find(a=>a.number===areaIds.indexOf(d.id)+5);
  for(let seat=1;seat<=6;seat++){const p=catalog?.agents[seat-1];agents.push({...base,id:d.id+'-operario-'+seat,leaderId:d.id,seat,name:p?.name||'Asesor '+seat,role:p?.role||'Asesor de '+d.name,appearance:d.model,objective:p?.trainingObjective||d.topic});}
 }
 for(const p of providers)agents.push({...base,id:'provider-'+p.id,name:p.name,provider:p.id,appearance:p.model,objective:'Explorar el puesto de '+p.name+' (sin conexión real)'});
 for(const p of councilMembers)agents.push({...base,id:p.id,name:p.name,appearance:'legal',objective:p.specialty});
 return {demo:true,testMode:true,agents,departments:departments.map(d=>({...d})),tasks:[] as any[],jobs:[] as any[],requests:[] as any[]};
}
