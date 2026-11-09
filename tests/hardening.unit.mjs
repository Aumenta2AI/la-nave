import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync} from 'node:fs';
import path from 'node:path';
mkdirSync('.test-data',{recursive:true});process.env.DATA_DIR=mkdtempSync(path.resolve('.test-data/hardening-'));
const {acquireInstance}=await import('../server/instanceGuard.ts');
const {composeMcpPrompt}=await import('../server/mcpPrompt.ts');
const {securityHeaders}=await import('../server/security.ts');
test('Bloqueo impide instancias duplicadas y se libera al cerrar',async()=>{
 const lock=await acquireInstance(process.env.DATA_DIR);
 try{await assert.rejects(acquireInstance(process.env.DATA_DIR),/instancia/);}finally{await new Promise(r=>lock.close(r));}
 const second=await acquireInstance(process.env.DATA_DIR);await new Promise(r=>second.close(r));
});
test('Solo navegación GET al retorno OAuth puede entrar desde otro sitio',()=>{
 for(const [method,url,mode,dest,allowed] of [
 ['GET','/api/oauth/apify/callback','navigate','document',true],
 ['GET','/api/state','navigate','document',false],
 ['POST','/api/oauth/apify/callback','navigate','document',false],
 ['GET','/api/oauth/apify/callback','cors','empty',false]]){
 let passed=false,status=0;
 const res={setHeader(){},status(n){status=n;return this;},json(){}};
 securityHeaders({method,path:url,headers:{'sec-fetch-site':'cross-site','sec-fetch-mode':mode,'sec-fetch-dest':dest}},res,()=>passed=true);
 assert.equal(passed,allowed);if(!allowed)assert.equal(status,403);
 }
});
test('MCP conserva encargo, catálogo y conocimiento',()=>{
 const result=composeMcpPrompt('apify',[{name:'search'}],'Investiga',{notes:'Fuente del usuario',sources:'https://example.com'});
 for(const text of ['Investiga','search','Fuente del usuario','https://example.com','requiere la solicitud de aprobación'])assert.ok(result.includes(text));
});
