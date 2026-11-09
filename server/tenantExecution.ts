import {all,get,put,uid} from './store.ts';
import {protectedCredential} from './credentialVault.ts';
import {llmReply} from './providers.ts';
const busy=new Set<string>();
export const tenantMessages=(companyId:string)=>all('tenant-messages:'+companyId);
export async function tenantReply(companyId:string,characterId:string,text:string,reply=llmReply){
 const company=get('saas-companies',companyId);if(!company||company.status==='suspended')throw Error('Empresa no disponible');
 const character=get('workspace-config',companyId)?.characters.find((c:any)=>c.id===characterId);if(!character)throw Error('Personaje no encontrado');
 const provider=character.provider,connection=get('workspace-connections',companyId+':'+provider),key=protectedCredential('TENANT_'+companyId+'_'+provider);
 if(!['openai','claude','grok','kimi','deepseek','perplexity','gemini'].includes(provider)||!key||!connection?.model)throw Error('Configura un proveedor, clave y modelo propios antes de conversar');
 if([...busy].filter(k=>k.startsWith(companyId+':')).length>=4)throw Error('Tu empresa ya tiene cuatro conversaciones en curso. Espera a que termine alguna.');const lock=companyId+':'+characterId;if(busy.has(lock))throw Error('Este personaje está respondiendo. Espera a que termine.');busy.add(lock);
 const kind='tenant-messages:'+companyId,jobKind='tenant-jobs:'+companyId,job={id:uid(),characterId,status:'running',createdAt:new Date().toISOString()};
 try{put(jobKind,job);const history=tenantMessages(companyId).filter(m=>m.characterId===characterId&&['user','assistant'].includes(m.role)).slice(-16).map(m=>({role:m.role,content:m.text}));put(kind,{id:uid(),characterId,role:'user',text,createdAt:new Date().toISOString()});
 const output=await reply(provider,[{role:'system',content:'Eres '+character.name+'. Tu responsabilidad es '+character.role+'. Responde con claridad y no afirmes haber realizado acciones externas. No dispones de herramientas en esta conversación.'},...history,{role:'user',content:text}],{key,model:connection.model});
 put(kind,{id:uid(),characterId,role:'assistant',text:output,createdAt:new Date().toISOString()});put(jobKind,{...job,status:'done',finishedAt:new Date().toISOString()});return {ok:true};
 }catch{put(jobKind,{...job,status:'error',finishedAt:new Date().toISOString()});throw Error('No se completó la respuesta. Revisa la clave, el modelo, el saldo o la red.');}finally{busy.delete(lock);}
}

