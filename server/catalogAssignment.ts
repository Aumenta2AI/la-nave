import {crewCatalog} from '../shared/crewCatalog.ts';
import {departments} from '../shared/organization.ts';
import {all,get,put,transaction,profileFiles,type Agent} from './store.ts';
const areaIds=['administrativo','contabilidad','legal','ventas','soporte','marketing','investigacion','rrhh','licitaciones','calidad','ciberseguridad','fabrica'];
const migration='catalog-advisors-v1';
export function assignCatalog(){
 if(get('migrations',migration))return;
 const changed:Agent[]=[];
 transaction(()=>{
  put('organization-snapshots',{id:migration,createdAt:new Date().toISOString(),agents:all<Agent>('agents')});
  for(const [index,id] of areaIds.entries()){
   const area=departments.find(d=>d.id===id)!;
   let leader=get<Agent>('agents',id);
   if(!leader){leader={id,name:area.name,role:'Dirección de '+area.name,personality:'Profesional, claro y riguroso',objective:area.topic,specialty:area.topic,done:'Resultado verificable, fuentes e incertidumbres explícitas',appearance:area.model,effort:'medium',fallback:false,state:'idle',enabled:false};put('agents',leader);changed.push(leader);}
   const catalog=crewCatalog.find(a=>a.number===index+5)!;
   for(const [position,entry] of catalog.agents.entries()){
    const agentId=id+'-operario-'+(position+1),old=get<Agent>('agents',agentId);
    // Respect personal edits and moves; never overwrite an established identity on restart.
    if(old&&(!/Operario \d+$/i.test(old.name)||old.leaderId!==id))continue;
    const agent:Agent={...leader,...old,id:agentId,name:entry.name,role:entry.role,catalogId:entry.id,leaderId:id,seat:position+1,fallback:false,personality:'Profesional, preciso y fiel a las fuentes. No inventar métricas, registros ni acciones realizadas. Escalar dudas materiales al responsable humano.',objective:entry.trainingObjective,specialty:entry.specialty,done:'Entregar evidencia con fuente y fecha, indicar incertidumbre y datos faltantes. Solicitar aprobación humana antes de acciones externas, productivas, financieras o sensibles.',state:old?.state||'idle',sessionId:old?.sessionId,enabled:old ? old.enabled : false};
    put('agents',agent);changed.push(agent);
   }
  }
  put('migrations',{id:migration,at:new Date().toISOString(),assigned:changed.filter(a=>a.catalogId).length});
 });
 for(const agent of changed)profileFiles(agent);
}
