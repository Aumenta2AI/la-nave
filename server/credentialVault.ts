import {spawnSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,renameSync} from 'node:fs';
import path from 'node:path';
import {dataDir} from './store.ts';
const file=path.join(dataDir,'credentials.dpapi');
function transform(value:string,decode=false){
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
