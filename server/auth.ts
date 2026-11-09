import {installGoogleLogin} from './googleLogin.ts';
import {randomBytes,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
import type {Express,Request,Response,NextFunction} from 'express';
import {all,get,put,uid,transaction} from './store.ts';
import {z} from 'zod';
const attempts=new Map<string,{count:number;until:number}>();
const sessions=new Map<string,{userId:string;expires:number}>();
const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
const credentials=z.object({username:z.string().trim().toLowerCase().max(254).refine(v=>/^[a-z0-9._-]{3,50}$/.test(v)||z.string().email().safeParse(v).success,'Usa un correo válido o un nombre de usuario'),password:z.string().min(12).max(256),displayName:z.string().trim().min(1).max(80).optional()});
function publicUser(u:any){return {id:u.id,username:u.username,displayName:u.displayName||u.username,role:u.role,platformAdmin:!!u.platformAdmin,companyId:u.companyId,ownerWorkspace:!!(u.companyId&&get("saas-companies",u.companyId)?.ownerWorkspace)};}
export function createUser(input:unknown,role:string){const p=credentials.parse(input);if(all('users').some(u=>u.username===p.username))throw Error('Ese usuario ya existe');const salt=randomBytes(16).toString('hex');const u={id:uid(),username:p.username,displayName:p.displayName||p.username,role,salt,hash:scryptSync(p.password,salt,64).toString('hex')};put('users',u);return u;}
function current(req:Request){const cookie=req.headers.cookie?.split(';').map(c=>c.trim()).find(c=>c.startsWith('nave-session='))?.slice(13);if(!cookie)return;const session=sessions.get(digest(cookie));if(!session)return;if(session.expires<Date.now()){sessions.delete(digest(cookie));return;}const user=get('users',session.userId);return user?.disabled?undefined:user;}
function login(res:Response,u:any,redirect=false){const token=randomBytes(32).toString('hex');sessions.set(digest(token),{userId:u.id,expires:Date.now()+8*3600000});res.cookie('nave-session',token,{httpOnly:true,sameSite:'lax',path:'/',maxAge:8*3600000});if(redirect)res.redirect('/');else res.json({user:publicUser(u)});}
export function installAuth(app:Express){
 installGoogleLogin(app,current,login);
 app.get('/api/auth/status',(req,res)=>{if(process.env.PULPO_TEST_MODE==='1')return res.json({setup:false,user:{id:'test',username:'Pruebas simuladas',role:'admin'}});const u=current(req);res.json({setup:all('users').length===0,user:u?publicUser(u):null});});
 app.post('/api/auth/setup',(req,res)=>{if(all('users').length)return res.status(409).json({error:'El administrador ya está configurado'});login(res,createUser(req.body,'admin'));});
 app.post('/api/auth/login',(req,res)=>{const key=req.socket.remoteAddress||'local';const now=Date.now();let bucket=attempts.get(key);if(!bucket||bucket.until<now){bucket={count:0,until:now+15*60000};attempts.set(key,bucket);}if(bucket.count>=5)return res.status(429).json({error:'Demasiados intentos. Espera 15 minutos.'});bucket.count++;const p=credentials.parse(req.body),u=all('users').find(u=>u.username===p.username);const computed=scryptSync(p.password,u?.salt||'unknown-user-salt',64);if(!u||!u.hash||u.disabled||!timingSafeEqual(computed,Buffer.from(u.hash,'hex')))return res.status(401).json({error:'Usuario o contraseña incorrectos'});attempts.delete(key);login(res,u);});
 app.post('/api/auth/register',(req,res)=>{
  if(!all('users').length)return res.status(409).json({error:'Configura primero al propietario de la plataforma'});
  const key='register:'+(req.socket.remoteAddress||'local'),now=Date.now();let bucket=attempts.get(key);if(!bucket||bucket.until<now){bucket={count:0,until:now+3600000};attempts.set(key,bucket);}if(bucket.count++>=5)return res.status(429).json({error:'Límite de registros alcanzado. Intenta más tarde.'});
  const p=credentials.extend({companyName:z.string().trim().min(2).max(100),slug:z.string().regex(/^[a-z0-9-]{3,60}$/)}).strict().parse(req.body);
  if(all('saas-companies').some(c=>c.slug===p.slug))return res.status(409).json({error:'El identificador de empresa ya está ocupado'});
  const u=transaction(()=>{const companyId=uid();const user=createUser(p,'admin');put('saas-companies',{id:companyId,name:p.companyName,slug:p.slug,status:'draft',ownerWorkspace:false,createdAt:new Date().toISOString(),color:'#7245a0',logoUrl:'',planId:''});return put('users',{...user,companyId,platformAdmin:false,createdAt:new Date().toISOString()});});login(res,u);
 });
 app.post('/api/auth/logout',(req,res)=>{const token=req.headers.cookie?.split(';').map(c=>c.trim()).find(c=>c.startsWith('nave-session='))?.slice(13);if(token)sessions.delete(digest(token));res.clearCookie('nave-session',{path:'/'});res.json({ok:true});});
 app.use('/api',(req:Request,res:Response,next:NextFunction)=>{
  if(process.env.PULPO_TEST_MODE==='1'){res.locals.user={id:'test',role:'admin'};return next();}
  const u=current(req);if(!u)return res.status(401).json({error:'Inicia sesión para acceder a La Nave'});
  res.locals.user=publicUser(u);
  const company=u.companyId?get("saas-companies",u.companyId):undefined;
  if(!u.platformAdmin&&company&&!company.ownerWorkspace&&!/^\/(workspace(?:\/|$)|auth\/password$)/.test(req.path))return res.status(403).json({error:"La oficina operativa de esta empresa aún no está habilitada"});
  if(company?.status==="suspended"&&!u.platformAdmin)return res.status(403).json({error:"Empresa suspendida"});
  if(req.path==='/auth/password'||u.role==='admin'||['GET','HEAD'].includes(req.method))return next();
  if(u.role==='supervisor'&&(/^\/agents\/[^/]+\/messages$/.test(req.path)||/^\/requests\/[^/]+\/(decision|verify)$/.test(req.path)))return next();
  return res.status(403).json({error:'Tu rol no permite esta operación'});
 });
 app.post('/api/auth/password',(req,res)=>{const u=current(req);if(!u)return res.status(401).json({error:'Inicia sesión'});if(!u.hash)return res.status(400).json({error:'Esta cuenta usa Google para acceder'});const p=z.object({current:z.string().max(256),password:z.string().min(12).max(256)}).parse(req.body);if(!timingSafeEqual(scryptSync(p.current,u.salt,64),Buffer.from(u.hash,'hex')))return res.status(401).json({error:'Contraseña actual incorrecta'});const salt=randomBytes(16).toString('hex');put('users',{...u,salt,hash:scryptSync(p.password,salt,64).toString('hex')});for(const [key,session] of sessions)if(session.userId===u.id)sessions.delete(key);login(res,u);});
 app.get('/api/auth/users',(_req,res)=>{if(res.locals.user.role!=='admin')return res.status(403).json({error:'Solo administrador'});res.json(all('users').map(publicUser));});
 app.post('/api/auth/users',(req,res)=>{const role=z.enum(['supervisor','reader']).parse(req.body.role);res.json(publicUser(createUser(req.body,role)));});
}


