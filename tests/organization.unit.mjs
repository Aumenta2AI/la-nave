import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync} from 'node:fs';
import path from 'node:path';
mkdirSync('.test-data',{recursive:true});process.env.DATA_DIR=mkdtempSync(path.resolve('.test-data/organization-'));process.env.PULPO_TEST_MODE='1';
const {init,all,get,put,db}=await import('../server/store.ts');init();
const {organization,createDepartment,editDepartment,assignedSeat,ensureProviders}=await import('../server/organization.ts');
const {beginApify,finishApify,apifyAccess,apifyOAuthStatus}=await import('../server/apifyOAuth.ts');
const {vercelRequest}=await import('../server/vercel.ts');
const original=globalThis.fetch;after(()=>{globalThis.fetch=original;db.close();});
test('Departamento redistribuye posiciones, crea siete miembros y conserva historial al mover',()=>{
 const before=organization();const d=createDepartment({name:'Pruebas',topic:'Calidad de producto',model:'legal'});assert.equal(organization().length,before.length+1);assert.notEqual(organization()[0].x,before[0].x);
 const members=all('agents').filter(a=>a.id===d.id||a.leaderId===d.id);assert.equal(members.length,7);const worker=members.find(a=>a.leaderId);put('messages',{id:'history',agentId:worker.id,text:'Conservar'});put('agents',{...worker,...assignedSeat(before[0].id,worker.id)});assert.equal(get('messages','history').agentId,worker.id);
 editDepartment(d.id,{name:'Calidad nueva',topic:'Validar',model:'soporte'});assert.equal(get('agents',d.id).name,'Calidad nueva');assert.equal(get('agents',d.id).appearance,'soporte');assert.throws(()=>createDepartment({name:'Calidad nueva',topic:'x',model:'legal'}),/existe/);ensureProviders();assert.equal(all('agents').filter(a=>a.provider==='vercel').length,1);
});
test('Apify usa PKCE, cookie vinculada y código de un solo uso; nunca retorna tokens en estado',async()=>{
 let challenge,redirect;globalThis.fetch=async(url,options)=>{if(url.endsWith('/oauth/apps'))return Response.json({client_id:'client'});const body=new URLSearchParams(options.body);assert.ok(body.get('code_verifier'));assert.equal(body.get('redirect_uri'),redirect);return Response.json({access_token:'private-access',refresh_token:'private-refresh',expires_in:3600});};
 const login=await beginApify(3210,'localhost'),url=new URL(login.url);challenge=url.searchParams.get('code_challenge');redirect=url.searchParams.get('redirect_uri');assert.ok(challenge);assert.match(redirect,/localhost:3210/);const query={state:url.searchParams.get('state'),code:'code'};
 await assert.rejects(finishApify(query,'wrong'),/sesión/);await finishApify(query,login.cookie);assert.equal(await apifyAccess(),'private-access');assert.ok(!JSON.stringify(apifyOAuthStatus()).includes('private'));await assert.rejects(finishApify(query,login.cookie),/sesión/);
});
test('Vercel utiliza cuenta Bearer, equipo seleccionado y preview por defecto',async()=>{
 const calls=[];globalThis.fetch=async(url,options)=>{calls.push({url:String(url),options});return Response.json({id:'deployment'});};await vercelRequest('vercel_list_projects',{teamId:'team'},'private-vercel');assert.match(calls[0].url,/teamId=team/);assert.equal(calls[0].options.headers.Authorization,'Bearer private-vercel');await vercelRequest('vercel_create_deployment',{name:'demo',repoId:'123',ref:'main'},'private-vercel');const body=JSON.parse(calls[1].options.body);assert.equal(body.gitSource.repoId,'123');assert.equal(body.target,undefined);await assert.rejects(vercelRequest('unknown',{},'x'),/válidos/);
});

test('Consejo tiene seis referentes iguales, preserva historias y no habilita tareas al migrar',async()=>{const {ensureCouncil}=await import('../server/organization.ts');put('agents',{id:'consejo',name:'Consejo · Líder por definir',state:'idle',enabled:false,sessionId:'retain-session'});put('messages',{id:'council-history',agentId:'consejo',text:'Preservar'});ensureCouncil();assert.equal(get('agents','consejo').name,'Michael Jordan');assert.equal(get('agents','consejo').sessionId,'retain-session');assert.equal(get('messages','council-history').text,'Preservar');const members=all('agents').filter(a=>a.id==='consejo'||a.id.startsWith('consejo-experto-'));assert.equal(members.length,6);for(const a of members){assert.equal(a.leaderId,undefined);assert.equal(a.enabled,false);assert.match(a.objective,/directamente a Hittan/);}ensureCouncil();assert.equal(all('agents').filter(a=>a.id.startsWith('consejo')).length,6);});
