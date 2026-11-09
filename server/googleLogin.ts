import {randomBytes,createHash} from 'node:crypto';
import type {Express} from 'express';
import {z} from 'zod';
import {all,get,put,uid} from './store.ts';
import {saveProtectedCredentials} from './credentialVault.ts';
const pending=new Map<string,{verifier:string;cookie:string;expires:number;redirect:string;userId?:string}>();
const cookie=(req:any)=>req.headers.cookie?.split(';').map((c:string)=>c.trim()).find((c:string)=>c.startsWith('nave-google='))?.slice(12);
export function googleConfig(){return {clientId:process.env.GOOGLE_LOGIN_CLIENT_ID||'',configured:!!(process.env.GOOGLE_LOGIN_CLIENT_ID&&process.env.GOOGLE_LOGIN_CLIENT_SECRET)};}
export function resolveGoogleUser(profile:any,userId?:string){
 const p=z.object({sub:z.string().min(1),email:z.string().email(),email_verified:z.literal(true),name:z.string().max(150).optional()}).parse(profile);
 const existing=all('users').find(u=>u.googleSub===p.sub);
 if(existing){if(userId&&existing.id!==userId)throw Error('La cuenta Google ya está vinculada');return existing;}
 const matching=all('users').find(u=>u.username.toLowerCase()===p.email.toLowerCase());
 if(matching&&matching.id!==userId)throw Error('Primero inicia sesión con tu contraseña y vincula Google desde Configuración.');
 if(userId){const u=get('users',userId);if(!u||u.disabled||u.username.toLowerCase()!==p.email.toLowerCase())throw Error('El correo Google debe coincidir con tu usuario actual');const linked={...u,googleSub:p.sub};put('users',linked);return linked;}
 const u={id:uid(),username:p.email.toLowerCase(),displayName:p.name||p.email,googleSub:p.sub,role:'reader',disabled:true,registration:'pending',createdAt:new Date().toISOString()};put('users',u);return u;
}
export function installGoogleLogin(app:Express,current:(req:any)=>any,login:(res:any,u:any,redirect?:boolean)=>void){
 app.get('/api/auth/google/config',(_req,res)=>res.json(googleConfig()));
 app.post('/api/auth/google/start',(req,res)=>{
  if(!googleConfig().configured)return res.status(409).json({error:'Google está pendiente de configurar en Superadmin'});
  for(const [k,v]of pending)if(v.expires<Date.now())pending.delete(k);if(pending.size>=20)return res.status(429).json({error:'Espera unos minutos antes de volver a intentar'});
  const state=randomBytes(32).toString('hex'),verifier=randomBytes(32).toString('base64url'),bound=randomBytes(24).toString('hex');
  const redirect='http://'+req.hostname+':'+(process.env.PORT||3210)+'/api/auth/google/callback';
  pending.set(state,{verifier,cookie:bound,expires:Date.now()+600000,redirect,userId:current(req)?.id});
  res.cookie('nave-google',bound,{httpOnly:true,sameSite:'lax',maxAge:600000,path:'/api/auth/google'});
  const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');url.search=new URLSearchParams({client_id:googleConfig().clientId,redirect_uri:redirect,response_type:'code',scope:'openid email profile',state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256',prompt:'select_account'}).toString();res.json({url:url.toString()});
 });
 app.get('/api/auth/google/callback',async(req,res)=>{
  const state=String(req.query.state||''),p=pending.get(state);
  if(!p||p.expires<Date.now()||cookie(req)!==p.cookie)return res.status(400).type('text').send('Acceso Google inválido o vencido. Regresa a La Nave.');
  pending.delete(state);res.clearCookie('nave-google',{path:'/api/auth/google'});
  try{
   if(typeof req.query.code!=='string'||req.query.error)throw Error('Acceso cancelado');
   const token=await fetch('https://oauth2.googleapis.com/token',{method:'POST',redirect:'error',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:googleConfig().clientId,client_secret:process.env.GOOGLE_LOGIN_CLIENT_SECRET!,code:req.query.code,code_verifier:p.verifier,grant_type:'authorization_code',redirect_uri:p.redirect}),signal:AbortSignal.timeout(20000)});
   if(!token.ok)throw Error('Google rechazó el acceso');const t=await token.json();if(!t.access_token)throw Error('Falta token');
   const info=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+t.access_token},redirect:'error',signal:AbortSignal.timeout(20000)});
   if(!info.ok)throw Error('No se pudo verificar la identidad');const u=resolveGoogleUser(await info.json(),p.userId);
   if(u.disabled)return res.status(403).type('text').send('Registro recibido. El administrador debe autorizar el acceso a este espacio compartido. Vuelve a La Nave después de su aprobación.');
   login(res,u,true);
  }catch{res.status(400).type('text').send('No se completó el acceso. Si ya tienes usuario, inicia sesión con contraseña y vincula Google desde Configuración.');}
 });
}
export function installGoogleAdmin(app:Express){
 app.put('/api/superadmin/google-login',(req,res)=>{
  if(!res.locals.user?.platformAdmin)return res.status(403).json({error:'Solo Superadmin'});
  const p=z.object({clientId:z.string().regex(/^[\w-]+\.apps\.googleusercontent\.com$/),clientSecret:z.string().min(10).max(500).optional()}).parse(req.body);
  const values:Record<string,string>={GOOGLE_LOGIN_CLIENT_ID:p.clientId};if(p.clientSecret)values.GOOGLE_LOGIN_CLIENT_SECRET=p.clientSecret;
  saveProtectedCredentials(values);Object.assign(process.env,values);res.json(googleConfig());
 });
 app.post('/api/superadmin/google-login/approve/:id',(req,res)=>{
  if(!res.locals.user?.platformAdmin)return res.status(403).json({error:'Solo Superadmin'});
  const u=get('users',String(req.params.id));if(!u||u.registration!=='pending')return res.status(404).json({error:'Registro pendiente no encontrado'});
  put('users',{...u,disabled:false,registration:'approved',role:'reader'});res.json({ok:true});
 });
}
