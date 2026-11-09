import {spawn,spawnSync} from 'node:child_process';
import {mkdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import {dataDir,root} from './store.ts';
const supported=new Set(['openai','claude']);
export function supportsAccount(id:string){return supported.has(id);}
function command(id:string){if(!supported.has(id))throw Error('Este proveedor no dispone de inicio de sesión local en La Nave.');return id==='openai'?{bin:process.env.CODEX_BIN||'codex',prefix:[] as string[]}:{bin:process.execPath,prefix:[path.join(root,'node_modules/@anthropic-ai/claude-code/cli-wrapper.cjs')]};}
function environment(id:string){const env:NodeJS.ProcessEnv={};for(const key of ['PATH','Path','SystemRoot','SYSTEMROOT','TEMP','TMP','USERPROFILE','HOME','APPDATA','LOCALAPPDATA'])if(process.env[key])env[key]=process.env[key];const dir=path.join(dataDir,'account-'+id);mkdirSync(dir,{recursive:true,mode:0o700});env[id==='openai'?'CODEX_HOME':'CLAUDE_CONFIG_DIR']=dir;return env;}
const cached=new Map<string,{at:number;value:any}>(),logins=new Map<string,{state:string;url?:string;message?:string;child?:ReturnType<typeof spawn>}>();
export function accountStatus(id:string,force=false){if(!supportsAccount(id))return null;const old=cached.get(id);if(!force&&old&&Date.now()-old.at<15000)return old.value;
 const c=command(id),args=id==='openai'?['login','status']:['auth','status'];
 const p=spawnSync(c.bin,[...c.prefix,...args],{env:environment(id),encoding:'utf8',windowsHide:true,timeout:8000});
 let loggedIn=false;try{loggedIn=id==='openai'?/Logged in using ChatGPT/i.test(p.stdout+p.stderr):p.status===0&&JSON.parse(p.stdout).authMethod==='claude.ai';}catch{}
 const available=id==='claude'?existsSync(c.prefix[0]):!p.error;
 const value={available,loggedIn,loginState:logins.get(id)?.state||'idle',message:loggedIn?'Cuenta autorizada en La Nave':available?'Inicia sesión con tu cuenta':'Cliente oficial no disponible'};cached.set(id,{at:Date.now(),value});return value;
}
export function beginAccountLogin(id:string){const c=command(id);const old=logins.get(id);if(old?.state==='pending')return {state:old.state,url:old.url,message:old.message};
 const entry:{state:string;url?:string;message?:string;child?:ReturnType<typeof spawn>}={state:'pending',message:'Completa el acceso en el navegador del proveedor.'};logins.set(id,entry);cached.delete(id);
 const child=spawn(c.bin,[...c.prefix,...(id==='openai'?['login']:['auth','login'])],{env:environment(id),windowsHide:true,shell:false});entry.child=child;let output='';
 const capture=(chunk:Buffer)=>{output=(output+chunk.toString()).slice(-20000);for(const candidate of output.match(/https:\/\/[^\s\x1b]+/g)||[]){try{const url=new URL(candidate);if(['auth.openai.com','claude.ai','platform.claude.com','console.anthropic.com'].includes(url.hostname)&&/authorize|oauth/.test(url.pathname))entry.url=url.href;}catch{}}};
 child.stdout.on('data',capture);child.stderr.on('data',capture);
 const timer=setTimeout(()=>{entry.state='expired';entry.message='El acceso expiró. Vuelve a iniciar sesión.';child.kill();cached.delete(id);},300000);timer.unref();
 child.on('error',()=>{clearTimeout(timer);entry.state='error';entry.message='No se pudo iniciar el cliente oficial.';cached.delete(id);});
 child.on('close',code=>{clearTimeout(timer);entry.child=undefined;entry.url=undefined;entry.state=code===0?'complete':'error';entry.message=code===0?'Acceso completado. Comprueba la conexión.':'No se completó el acceso. Vuelve a intentarlo.';cached.delete(id);});
 return {state:entry.state,message:entry.message};
}
export function accountLoginProgress(id:string){if(!supportsAccount(id))throw Error('Proveedor no admitido');const e=logins.get(id);return {state:e?.state||'idle',url:e?.url,message:e?.message,account:accountStatus(id)};}
export async function accountReply(id:string,messages:{role:string;content:string}[]){if(!accountStatus(id,true)?.loggedIn)throw Error('Inicia sesión con la cuenta de '+(id==='openai'?'ChatGPT':'Claude')+' desde el personaje. No se usará una API de pago como alternativa.');
 const c=command(id);const args=id==='openai'?['exec','--json','--skip-git-repo-check','--ignore-user-config','--ignore-rules','-c','sandbox_mode="read-only"','-c','approval_policy="never"','-c','features.shell_tool=false','-c','web_search="disabled"','-']:['-p','--output-format','json','--tools','','--disallowedTools','mcp__*','--strict-mcp-config','--mcp-config','{"mcpServers":{}}','--setting-sources','','--no-session-persistence'];
 return new Promise<string>((resolve,reject)=>{const child=spawn(c.bin,[...c.prefix,...args],{env:environment(id),cwd:dataDir,windowsHide:true,shell:false});let output='';let settled=false;const fail=(message:string)=>{if(!settled){settled=true;reject(Error(message));}};const timer=setTimeout(()=>{child.kill();fail('La respuesta superó el tiempo máximo. Revisa el uso de tu cuenta antes de reintentar.');},180000);
 child.stdout.on('data',chunk=>{output+=chunk.toString();if(output.length>2000000){child.kill();fail('Respuesta demasiado grande');}});child.stderr.resume();child.on('error',()=>{clearTimeout(timer);fail('No se pudo iniciar el proveedor.');});
 child.on('close',code=>{clearTimeout(timer);if(settled)return;if(code!==0)return fail('El proveedor no completó la respuesta. Revisa sesión, plan y límites. No se ha cambiado a facturación API.');try{let text='', failed=false;if(id==='claude'){const result=JSON.parse(output);if(result.is_error)throw Error();text=result.result;}else{for(const line of output.split('\n')){try{const e=JSON.parse(line);if(e.type==='item.completed'&&e.item?.type==='agent_message')text=e.item.text;if(e.type==='turn.failed'||e.type==='error')failed=true;}catch{}}}if(!text||failed)throw Error();settled=true;resolve(text);}catch{fail('El proveedor no devolvió una respuesta válida.');}});
 child.stdin.end('Responde solo al usuario. No ejecutes herramientas ni acciones externas. Historial de conversación:\n'+JSON.stringify(messages));
 });
}
