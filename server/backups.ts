import {backup,DatabaseSync} from 'node:sqlite';
import {mkdirSync,readdirSync,statSync,unlinkSync} from 'node:fs';
import path from 'node:path';
import {db,dataDir,put,uid} from './store.ts';
const directory=path.join(dataDir,'backups');
let running:Promise<string>|undefined;
export function backupDatabase(){
 if(running)return running;
 running=(async()=>{
  mkdirSync(directory,{recursive:true});
  const filename='nave-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sqlite';
  const target=path.join(directory,filename);
  await backup(db,target);
  const copy=new DatabaseSync(target,{readOnly:true});
  try{const result=copy.prepare('PRAGMA integrity_check').get() as any;if(result.integrity_check!=='ok')throw Error('La copia no superó la comprobación de integridad');}finally{copy.close();}
  put('security-events',{id:uid(),at:new Date().toISOString(),event:'backup-verified',file:filename});
  // Retain 14 verified snapshots; never remove the source database or unrelated files.
  const snapshots=readdirSync(directory).filter(n=>/^nave-[0-9TZ-]+\.sqlite$/.test(n)).sort().reverse();
  for(const old of snapshots.slice(14))unlinkSync(path.join(directory,old));
  return filename;
 })().finally(()=>{running=undefined;});
 return running;
}
export function backupStatus(){mkdirSync(directory,{recursive:true});return readdirSync(directory).filter(n=>/^nave-[0-9TZ-]+\.sqlite$/.test(n)).sort().reverse().map(name=>({name,bytes:statSync(path.join(directory,name)).size}));}
export function scheduleBackups(){void backupDatabase().catch(()=>console.error('No se pudo verificar la copia de seguridad; revisa almacenamiento.'));const timer=setInterval(()=>void backupDatabase().catch(()=>console.error('Falló la copia de seguridad programada.')),24*60*60*1000);timer.unref();}
