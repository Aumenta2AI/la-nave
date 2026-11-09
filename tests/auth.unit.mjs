import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {mkdtempSync,mkdirSync} from 'node:fs';
import path from 'node:path';
mkdirSync('.test-data',{recursive:true});process.env.DATA_DIR=mkdtempSync(path.resolve('.test-data/auth-'));delete process.env.PULPO_TEST_MODE;
const {installAuth}=await import('../server/auth.ts');const {all,db}=await import('../server/store.ts');
const app=express();app.use(express.json());installAuth(app);app.get('/api/state',(_q,r)=>r.json({ok:true}));app.post('/api/settings',(_q,r)=>r.json({ok:true}));app.post('/api/requests/r/decision',(_q,r)=>r.json({ok:true}));
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));const base='http://127.0.0.1:'+server.address().port;
after(()=>{server.close();db.close();});
async function call(p,body,cookie){return fetch(base+'/api/'+p,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});}
test('Acceso, permisos, cierre de sesión y contraseñas protegidas',async()=>{
 assert.equal((await call('state')).status,401);
 const setup=await call('auth/setup',{username:'administrator',password:'test-password-long'});assert.equal(setup.status,200);
 const admin=setup.headers.get('set-cookie').split(';')[0];assert.match(setup.headers.get('set-cookie'),/HttpOnly/);
 assert.equal((await call('auth/setup',{username:'another',password:'test-password-long'})).status,409);
 for(const role of ['reader','supervisor']){
 assert.equal((await call('auth/users',{username:role,password:'test-password-long',role},admin)).status,200);
 const login=await call('auth/login',{username:role,password:'test-password-long'});const cookie=login.headers.get('set-cookie').split(';')[0];
 assert.equal((await call('state',undefined,cookie)).status,200);
 assert.equal((await call('settings',{},cookie)).status,403);
 assert.equal((await call('requests/r/decision',{},cookie)).status,role==='reader'?403:200);
 await call('auth/logout',{},cookie);assert.equal((await call('state',undefined,cookie)).status,401);
 }
 assert.ok(all('users').every(u=>u.hash&&!JSON.stringify(u).includes('test-password-long')));
});
