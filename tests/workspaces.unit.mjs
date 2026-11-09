import {test,after} from 'node:test';import assert from 'node:assert/strict';import express from 'express';import {mkdtempSync,mkdirSync} from 'node:fs';import path from 'node:path';
mkdirSync('.test-data',{recursive:true});process.env.DATA_DIR=mkdtempSync(path.resolve('.test-data/tenants-'));
const {db,put,get,transaction}=await import('../server/store.ts');const {createUser,installAuth}=await import('../server/auth.ts');const {installSuperadmin}=await import('../server/superadmin.ts');const {installWorkspaces}=await import('../server/workspaces.ts');
const owner=createUser({username:'owner@test.com',password:'test-long-password-owner'},'admin');put('users',{...owner,platformAdmin:true});const app=express();app.use(express.json());installAuth(app);installSuperadmin(app);installWorkspaces(app);app.get('/api/state',(_req,res)=>res.json({private:'owner'}));app.use((e,req,res,next)=>res.status(400).json({error:e.message}));const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));const base='http://127.0.0.1:'+server.address().port;after(()=>{server.close();db.close();});
async function register(slug){const r=await fetch(base+'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:slug+'@test.com',password:'test-long-password-tenant',companyName:slug,slug})});assert.equal(r.status,200);return {cookie:r.headers.get('set-cookie').split(';')[0],user:(await r.json()).user};}
test('Tenant portal isolates configuration and blocks legacy office and superadmin',async()=>{
 const a=await register('tenant-a'),b=await register('tenant-b');assert.equal(a.user.platformAdmin,false);assert.notEqual(a.user.companyId,b.user.companyId);
 for(const path of ['/api/state','/api/providers','/api/superadmin/overview','/api/auth/users'])assert.equal((await fetch(base+path,{headers:{cookie:a.cookie}})).status,403);
 const initial=await(await fetch(base+'/api/workspace',{headers:{cookie:a.cookie}})).json();const {id,...config}=initial.config;config.brandName='Brand A';const updated=await fetch(base+'/api/workspace',{method:'PUT',headers:{cookie:a.cookie,'Content-Type':'application/json'},body:JSON.stringify(config)});assert.equal(updated.status,200);
 const other=await(await fetch(base+'/api/workspace',{headers:{cookie:b.cookie}})).json();assert.notEqual(other.config.brandName,'Brand A');
 const forged=await fetch(base+'/api/workspace',{method:'PUT',headers:{cookie:a.cookie,'Content-Type':'application/json'},body:JSON.stringify({...config,id:b.user.companyId})});assert.equal(forged.status,400);
 put('saas-companies',{...get('saas-companies',a.user.companyId),status:'suspended'});assert.equal((await fetch(base+'/api/workspace',{headers:{cookie:a.cookie}})).status,403);
});
test('SQLite integrity and transactional rollback remain valid',()=>{assert.throws(()=>transaction(()=>{put('test-rollback',{id:'never-commit'});throw Error('rollback');}));assert.equal(get('test-rollback','never-commit'),undefined);assert.equal(db.prepare('PRAGMA quick_check').get().quick_check,'ok');assert.equal(db.prepare('PRAGMA journal_mode').get().journal_mode,'wal');});

test('Tenant execution uses only its own key, character and history',async()=>{
 const {tenantReply,tenantMessages}=await import('../server/tenantExecution.ts');const {saveProtectedCredentials}=await import('../server/credentialVault.ts');
 put('saas-companies',{id:'exec-a',status:'draft'});put('saas-companies',{id:'exec-b',status:'draft'});
 for(const id of ['exec-a','exec-b']){put('workspace-config',{id,characters:[{id:'agent',name:id,role:'Ayudar',provider:'deepseek'}]});put('workspace-connections',{id:id+':deepseek',model:'test-model',configured:true});}
 saveProtectedCredentials({'TENANT_exec-a_deepseek':'fixture-key-a','TENANT_exec-b_deepseek':'fixture-key-b'});
 await tenantReply('exec-a','agent','private-message-a',async(provider,messages,credential)=>{assert.equal(credential.key,'fixture-key-a');assert.equal(credential.model,'test-model');return 'response-a';});
 await tenantReply('exec-b','agent','private-message-b',async(provider,messages,credential)=>{assert.equal(credential.key,'fixture-key-b');assert.ok(!JSON.stringify(messages).includes('private-message-a'));return 'response-b';});
 assert.equal(tenantMessages('exec-a').length,2);assert.equal(tenantMessages('exec-b').length,2);assert.ok(!JSON.stringify(tenantMessages('exec-a')).includes('fixture-key'));
 await assert.rejects(()=>tenantReply('exec-a','missing','hello'));put('saas-companies',{id:'exec-a',status:'suspended'});await assert.rejects(()=>tenantReply('exec-a','agent','hello'));
});
