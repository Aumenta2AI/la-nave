import {test,after} from 'node:test';import assert from 'node:assert/strict';import express from 'express';import {mkdirSync,mkdtempSync} from 'node:fs';import path from 'node:path';
mkdirSync('.test-data',{recursive:true});process.env.DATA_DIR=mkdtempSync(path.resolve('.test-data/sa-'));
const {installSuperadmin}=await import('../server/superadmin.ts');const {db}=await import('../server/store.ts');
const app=express();app.use(express.json());app.use((req,res,next)=>{res.locals.user={platformAdmin:req.headers['x-test-owner']==='yes'};next();});installSuperadmin(app);
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));after(()=>{server.close();db.close();});const base='http://127.0.0.1:'+server.address().port+'/api/superadmin';
test('Superadmin bloquea usuarios ordinarios y persiste borradores sin activación',async()=>{
 assert.equal((await fetch(base+'/overview')).status,403);
 const headers={'Content-Type':'application/json','x-test-owner':'yes'};
 const r=await fetch(base+'/companies',{method:'POST',headers,body:JSON.stringify({name:'Empresa de prueba',slug:'empresa-prueba'})});assert.equal(r.status,200);assert.equal((await r.json()).status,'draft');
 const o=await fetch(base+'/overview',{headers});const state=await o.json();assert.equal(state.companies.length,2);assert.equal(state.productionReady,false);assert.deepEqual(state.payments,[]);
});
test('Usuarios: crear, editar, suprimir y proteger propietario',async()=>{
 const headers={'Content-Type':'application/json','x-test-owner':'yes'};
 const payload={username:'member@example.com',displayName:'Miembro',role:'reader',companyId:'company-aumenta2',disabled:false,password:'test-passphrase-123'};
 const created=await fetch(base+'/users',{method:'POST',headers,body:JSON.stringify(payload)});assert.equal(created.status,200);const {id}=await created.json();
 const {password,...edit}=payload;const changed=await fetch(base+'/users/'+id,{method:'PATCH',headers,body:JSON.stringify({...edit,displayName:'Editado'})});assert.equal(changed.status,200);
 assert.equal((await fetch(base+'/users/'+id,{method:'DELETE',headers,body:'{}'})).status,200);
 const state=await (await fetch(base+'/overview',{headers})).json();assert.ok(!state.users.some(u=>u.id===id));
});
test('Afiliados y cupones: permisos, creación y edición persistente',async()=>{
 const headers={'Content-Type':'application/json','x-test-owner':'yes'};
 for(const [route,payload] of [['affiliates',{name:'Aliado prueba',email:'ally@example.com',code:'ALLY',commissionPercent:15,channels:'Web',status:'pending'}],['coupons',{name:'Lanzamiento',code:'START',percent:10,maxUses:50,expires:'2026-12-31',status:'draft'}]]){
 assert.equal((await fetch(base+'/'+route)).status,403);
 const created=await fetch(base+'/'+route,{method:'POST',headers,body:JSON.stringify(payload)});assert.equal(created.status,200);const value=await created.json();
 const updated=await fetch(base+'/'+route+'/'+value.id,{method:'PUT',headers,body:JSON.stringify({...payload,name:'Nombre actualizado'})});assert.equal(updated.status,200);
 const rows=await(await fetch(base+'/'+route,{headers})).json();assert.equal(rows.find(x=>x.id===value.id).name,'Nombre actualizado');
 }
});
