import {randomBytes,createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync,renameSync,unlinkSync} from 'node:fs';
import path from 'node:path';
import {dataDir} from './store.ts';
const file=path.join(dataDir,'apify-oauth.json');
const read=()=>existsSync(file)?JSON.parse(readFileSync(file,'utf8')):null;
function save(value:any){writeFileSync(file+'.tmp',JSON.stringify(value),{mode:0o600});renameSync(file+'.tmp',file);}
const pending=new Map<string,{verifier:string;cookie:string;redirect:string;client:string;expires:number}>();
const tokenUrl='https://console-backend.apify.com/oauth/apps/token';
async function json(url:string,body:any,form=false){const r=await fetch(url,{method:'POST',redirect:'error',headers:{'Content-Type':form?'application/x-www-form-urlencoded':'application/json'},body:form?new URLSearchParams(body):JSON.stringify(body),signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Apify rechazó la autorización (HTTP '+r.status+'). Vuelve a conectar.');return r.json();}
export const apifyOAuthStatus=()=>{const a=read();return {connected:!!a?.access_token,expiresAt:a?.expiresAt||null};};
export async function beginApify(port:number,host='127.0.0.1'){for(const [key,p] of pending)if(p.expires<Date.now())pending.delete(key);if(pending.size>=10)throw Error('Demasiados accesos pendientes. Espera unos minutos.');if(!['127.0.0.1','localhost'].includes(host))throw Error('Usa La Nave desde localhost o 127.0.0.1.');const redirect=`http://${host}:${port}/api/oauth/apify/callback`;
 const registration=await json('https://console-backend.apify.com/oauth/apps',{client_name:'La Nave',redirect_uris:[redirect],grant_types:['authorization_code','refresh_token'],response_types:['code'],token_endpoint_auth_method:'none'});
 if(typeof registration.client_id!=='string')throw Error('Apify no devolvió un cliente válido.');
 const state=randomBytes(32).toString('base64url'),verifier=randomBytes(32).toString('base64url'),cookie=randomBytes(32).toString('base64url');pending.set(state,{verifier,cookie,redirect,client:registration.client_id,expires:Date.now()+600000});
 const url=new URL('https://console.apify.com/authorize/oauth');url.search=new URLSearchParams({client_id:registration.client_id,redirect_uri:redirect,response_type:'code',scope:'full_api_access',state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}).toString();return {url:url.href,cookie};
}
export async function finishApify(query:any,cookie:string){const state=String(query.state||''),p=pending.get(state);if(!p||p.expires<Date.now()||cookie!==p.cookie)throw Error('La sesión de autorización no coincide o expiró.');pending.delete(state);if(query.error)throw Error('Acceso cancelado en Apify.');if(query.iss&&query.iss!=='https://console-backend.apify.com')throw Error('Emisor de autorización inválido.');if(typeof query.code!=='string')throw Error('Falta código de autorización.');const result=await json(tokenUrl,{grant_type:'authorization_code',code:query.code,client_id:p.client,redirect_uri:p.redirect,code_verifier:p.verifier},true);if(!result.access_token)throw Error('Apify no entregó acceso.');save({...result,client_id:p.client,expiresAt:Date.now()+(result.expires_in||3600)*1000});}
let refreshing:Promise<string>|null=null;
export async function apifyAccess(){const a=read();if(!a?.access_token)throw Error('Inicia sesión con Apify.');if(a.expiresAt>Date.now()+60000)return a.access_token as string;if(!a.refresh_token)throw Error('Tu acceso Apify expiró. Vuelve a conectar.');if(!refreshing)refreshing=(async()=>{const r=await json(tokenUrl,{grant_type:'refresh_token',client_id:a.client_id,refresh_token:a.refresh_token},true);if(!r.access_token)throw Error('Renueva tu conexión Apify.');save({...a,...r,expiresAt:Date.now()+(r.expires_in||3600)*1000});return r.access_token as string;})().finally(()=>{refreshing=null;});return refreshing;}
export function disconnectApify(){if(existsSync(file))unlinkSync(file);}
