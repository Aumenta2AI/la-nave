import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync} from 'node:fs';
import path from 'node:path';
import express from 'express';
mkdirSync('.test-data',{recursive:true});
process.env.DATA_DIR=mkdtempSync(path.resolve('.test-data/hosted-'));
process.env.NAVE_HOSTED='1';
process.env.PUBLIC_ORIGIN='https://example.test';
process.env.NAVE_VAULT_KEY='a'.repeat(64);
process.env.NAVE_SETUP_TOKEN='test-setup-token-'.repeat(4);
delete process.env.PULPO_TEST_MODE;
const {validateRuntime}=await import('../server/runtime.ts');
const {saveProtectedCredentials,protectedCredential}=await import('../server/credentialVault.ts');
const {installAuth}=await import('../server/auth.ts');
const {db,all}=await import('../server/store.ts');
const app=express();app.use(express.json());installAuth(app);
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
after(()=>{server.close();db.close();});
test('Hosted startup rejects unsafe origin and missing encryption key',()=>{
 process.env.PUBLIC_ORIGIN='http://example.test';assert.throws(validateRuntime);
 process.env.PUBLIC_ORIGIN='https://example.test';process.env.NAVE_VAULT_KEY='short';assert.throws(validateRuntime);
 process.env.NAVE_VAULT_KEY='a'.repeat(64);validateRuntime();
});
test('Hosted vault encrypts credentials without Windows',()=>{
 saveProtectedCredentials({EXAMPLE_SECRET:'private-test-value'});
 assert.equal(protectedCredential('EXAMPLE_SECRET'),'private-test-value');
 const disk=readFileSync(path.join(process.env.DATA_DIR,'credentials.aes'),'utf8');
 assert.ok(!disk.includes('private-test-value'));assert.equal(JSON.parse(disk).v,1);
});
test('Initial administrator requires installation token and receives Secure cookie',async()=>{
 const url='http://127.0.0.1:'+server.address().port+'/api/auth/setup';
 const send=token=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-Setup-Token':token},body:JSON.stringify({username:'owner@example.test',password:'test-password-long'})});
 assert.equal((await send('wrong')).status,403);assert.equal(all('users').length,0);
 const accepted=await send(process.env.NAVE_SETUP_TOKEN);assert.equal(accepted.status,200);
 assert.match(accepted.headers.get('set-cookie'),/Secure/);assert.equal((await accepted.json()).user.platformAdmin,true);
 assert.equal((await send(process.env.NAVE_SETUP_TOKEN)).status,409);
});
