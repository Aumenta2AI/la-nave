import {spawnSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,renameSync} from 'node:fs';
import path from 'node:path';
import {dataDir} from './store.ts';
import {hosted} from './runtime.ts';
import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
const file=path.join(dataDir,hosted?'credentials.aes':'credentials.dpapi');
function transform(value:string,decode=false){
 if(hosted){
  const key=Buffer.from(process.env.NAVE_VAULT_KEY!,'hex');
  if(decode){const payload=JSON.parse(value);if(payload.v!==1)throw Error('Formato de credenciales no compatible');const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(payload.iv,'base64'));decipher.setAuthTag(Buffer.from(payload.tag,'base64'));return Buffer.concat([decipher.update(Buffer.from(payload.data,'base64')),decipher.final()]).toString('utf8');}
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);const data=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return JSON.stringify({v:1,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:data.toString('base64')});
 }
 if(process.platform!=='win32')throw Error('El almacén de credenciales requiere Windows DPAPI.');
 const command="Add-Type -AssemblyName System.Security; $v=[Console]::In.ReadToEnd(); "+(decode?"$b=[Convert]::FromBase64String($v); $r=[Security.Cryptography.ProtectedData]::Unprotect($b,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Text.Encoding]::UTF8.GetString($r))":"$b=[Text.Encoding]::UTF8.GetBytes($v); $r=[Security.Cryptography.ProtectedData]::Protect($b,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($r))");
 const result=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',command],{input:value,encoding:'utf8',windowsHide:true,timeout:15000});
 if(result.status!==0)throw Error('No se pudo abrir el almacén protegido de Windows.');
 return result.stdout.trim();
}
let cache:Record<string,string>|undefined;
function read(){if(!cache)cache=existsSync(file)?JSON.parse(transform(readFileSync(file,'utf8'),true)):{};return cache!;}
export function loadProtectedCredentials(){for(const [key,value] of Object.entries(read()))process.env[key]=value;}
export function saveProtectedCredentials(values:Record<string,string>){
 const next={...read(),...values};const encrypted=transform(JSON.stringify(next));
 writeFileSync(file+'.tmp',encrypted,{mode:0o600});renameSync(file+'.tmp',file);
 cache=next;
}

export function protectedCredential(name:string):string {return read()[name]||'';}
