import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,mkdtempSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
mkdirSync('.test-data',{recursive:true});
process.env.DATA_DIR=mkdtempSync(path.resolve('.test-data/security-'));
const {db,put,get,dataDir}=await import('../server/store.ts');
const {backupDatabase}=await import('../server/backups.ts');
const {saveProtectedCredentials,loadProtectedCredentials}=await import('../server/credentialVault.ts');
after(()=>db.close());
test('Copia WAL conserva datos y puede abrirse para recuperación',async()=>{
 put('messages',{id:'recovery',text:'Mensaje conservado'});
 const file=await backupDatabase();const recovered=new DatabaseSync(path.join(dataDir,'backups',file),{readOnly:true});
 try{assert.equal(JSON.parse(recovered.prepare("SELECT body FROM records WHERE kind='messages' AND id='recovery'").get().body).text,'Mensaje conservado');}finally{recovered.close();}
});
test('Credencial DPAPI no es texto plano y se recupera bajo el usuario Windows',()=>{
 saveProtectedCredentials({NAVE_TEST_SECRET:'only-a-test-value'});
 assert.ok(!readFileSync(path.join(dataDir,'credentials.dpapi'),'utf8').includes('only-a-test-value'));
 loadProtectedCredentials();assert.equal(process.env.NAVE_TEST_SECRET,'only-a-test-value');
});
