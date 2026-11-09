import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import path from 'node:path';
process.env.DATA_DIR=mkdtempSync(path.resolve('.test-data/providers-'));
process.env.PULPO_TEST_MODE='1';
const {llmReply,providerStatus,mcpTools,executeMcp,searchProcurement,saveProvider,setAccessMode}=await import('../server/providers.ts');
const {init,all,db}=await import('../server/store.ts');
const {providers,departments,deckCount}=await import('../shared/organization.ts');
const fetchOriginal=globalThis.fetch;
after(()=>{globalThis.fetch=fetchOriginal;db.close();});
test('Migración crea doce equipos y diez proveedores sin duplicar perfiles',()=>{
 init();const first=all('agents').length;init();assert.equal(all('agents').length,first);assert.equal(deckCount,102);
 for(const d of departments){assert.ok(all('agents').find(a=>a.id===d.id));assert.equal(all('agents').filter(a=>a.leaderId===d.id).length,6);}
 assert.equal(all('agents').filter(a=>a.provider).length,10);assert.ok(all('agents').find(a=>a.id==='diseno'));
});
test('Cada LLM usa su API y parser propios; no simula una respuesta',async()=>{
 for(const p of providers.filter(p=>p.kind==='llm')){
  setAccessMode(p.id,'api');process.env[p.key]='test-secret';process.env[p.modelEnv]=p.id==='perplexity'?'fast':'test-model';let request;
  globalThis.fetch=async(url,options)=>{request={url,body:JSON.parse(options.body),headers:options.headers};return Response.json(p.id==='claude'?{content:[{type:'text',text:'real'}]}:p.id==='gemini'?{candidates:[{content:{parts:[{text:'real'}]}}]}:['openai','perplexity'].includes(p.id)?{output:[{type:'message',content:[{type:'output_text',text:'real'}]}]}:{choices:[{message:{content:'real'}}]});};
  assert.equal(await llmReply(p.id,[{role:'user',content:'hola'}]),'real');
  assert.ok(request.url.startsWith('https://'));assert.ok(!JSON.stringify(providerStatus()).includes('test-secret'));
  if(p.id==='openai'){assert.ok(request.url.endsWith('/responses'));assert.equal(request.body.store,false);}
  if(p.id==='claude')assert.equal(request.headers['anthropic-version'],'2023-06-01');
  if(p.id==='gemini')assert.equal(request.body.contents[0].role,'user');
 }
});
test('Faltan credenciales y errores HTTP no exponen secretos',async()=>{
 delete process.env.DEEPSEEK_API_KEY;globalThis.fetch=()=>{throw Error('No debe llamar');};await assert.rejects(llmReply('deepseek',[]),/Falta configurar/);
 process.env.DEEPSEEK_API_KEY='private-key';globalThis.fetch=async()=>new Response('private-key',{status:401});await assert.rejects(llmReply('deepseek',[]),e=>e.message.includes('401')&&!e.message.includes('private-key'));
});
test('MCP inicializa, pagina, valida argumentos y ejecuta exclusivamente herramientas descubiertas',async()=>{
 process.env.APIFY_TOKEN='test-token';const calls=[];
 globalThis.fetch=async(url,options)=>{const q=JSON.parse(options.body);calls.push(q.method);if(!q.id)return new Response(null,{status:202});const result=q.method==='initialize'?{protocolVersion:'2025-03-26'}:q.method==='tools/list'?{tools:[{name:'search-actors',inputSchema:{type:'object',required:['query'],properties:{query:{type:'string'}},additionalProperties:false}}]}:{content:[{type:'text',text:'Encontrado'}]};return Response.json({jsonrpc:'2.0',id:q.id,result},{headers:{'Mcp-Session-Id':'test-session'}});};
 assert.equal((await mcpTools('apify'))[0].name,'search-actors');await assert.rejects(executeMcp('apify','invented',{}),/no disponible/);await assert.rejects(executeMcp('apify','search-actors',{}),/Argumentos/);assert.ok(!calls.includes('tools/call'));
 assert.equal((await executeMcp('apify','search-actors',{query:'software'})).content[0].text,'Encontrado');assert.equal(calls.filter(c=>c==='initialize').length,1);
});
test('Croma consulta SECOP con filtros y conserva fecha de fuente',async()=>{
 process.env.CROMA_API_KEY='private-croma';globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.croma.run/co/secop/processes-search/v1');assert.equal(JSON.parse(options.body).department,'Antioquia');return Response.json({status:'completed',data:{as_of:'2026-10-18',results:[],total:0}});};assert.equal((await searchProcurement({query:'software',department:'Antioquia'})).as_of,'2026-10-18');
});
test('Guardar clave retorna solo el estado, nunca el secreto',()=>{const status=saveProvider('kimi',{key:'another-private-key',model:'model-test'});assert.equal(status.configured,true);assert.ok(!JSON.stringify(status).includes('another-private-key'));});
test('Kimi Code utiliza cuota de membresía separada sin caer a Moonshot',async()=>{setAccessMode('kimi','membership');saveProvider('kimi',{key:'membership-private',model:'kimi-for-coding'});globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.kimi.ai/coding/v1/messages');assert.equal(options.headers['x-api-key'],'membership-private');return Response.json({content:[{type:'text',text:'plan'}]});};assert.equal(await llmReply('kimi',[{role:'user',content:'hola'}]),'plan');let calls=0;globalThis.fetch=async()=>{calls++;return new Response('quota exhausted',{status:429});};await assert.rejects(llmReply('kimi',[]),/429/);assert.equal(calls,1);assert.ok(!JSON.stringify(providerStatus()).includes('membership-private'));setAccessMode('kimi','api');});

