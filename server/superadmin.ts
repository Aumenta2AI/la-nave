import {installAffiliateOperations} from './affiliateOperations.ts';
import {installPaymentConnections} from './paymentConnections.ts';
import {analytics} from './analytics.ts';
import {createUser} from './auth.ts';
import {seedCommercial} from './commercialDefaults.ts';
import type {Express} from 'express';
import {z} from 'zod';
import {all,get,put,uid} from './store.ts';
const company=z.object({name:z.string().min(2).max(100),slug:z.string().regex(/^[a-z0-9-]{3,60}$/),logoUrl:z.string().url().or(z.literal('')).default(''),color:z.string().regex(/^#[0-9a-f]{6}$/i).default('#7245a0'),planId:z.string().max(100).default(''),status:z.enum(['draft','suspended']).default('draft')});
const plan=z.object({name:z.string().min(2).max(80),currency:z.enum(['COP','USD']),price:z.number().nonnegative(),departments:z.number().int().min(1).max(24),users:z.number().int().min(1).max(10000),connections:z.number().int().min(0).max(1000),monthlyTokens:z.number().int().nonnegative(),storageMB:z.number().int().nonnegative(),council:z.boolean(),llms:z.boolean(),branding:z.boolean(),status:z.enum(['draft','archived']).default('draft')});
export function installSuperadmin(app:Express){
 seedCommercial();
 app.use('/api/superadmin',(_req,res,next)=>{if(!res.locals.user?.platformAdmin)return res.status(403).json({error:'Acceso exclusivo del superadministrador'});next();});

 installPaymentConnections(app);installAffiliateOperations(app);
 app.get('/api/superadmin/analytics',(req,res)=>res.json(analytics(z.enum(['7','30','all']).parse(req.query.range||'30'))));
 const affiliate=z.object({name:z.string().min(2).max(100),email:z.string().email(),code:z.string().regex(/^[a-zA-Z0-9_-]{3,40}$/),commissionPercent:z.number().min(0).max(100),channels:z.string().max(1000),status:z.enum(['pending','approved','rejected','suspended'])});
 const coupon=z.object({code:z.string().regex(/^[A-Z0-9_-]{3,40}$/),name:z.string().min(2).max(100),percent:z.number().min(0).max(100),maxUses:z.number().int().min(1),expires:z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/),status:z.enum(['draft','archived'])});
 for(const [route,kind,schema]of [['affiliates','saas-affiliates',affiliate],['coupons','saas-coupons',coupon]]as const){
 app.get('/api/superadmin/'+route,(_req,res)=>res.json(all(kind)));
 app.post('/api/superadmin/'+route,(req,res)=>{const p=schema.parse(req.body);if(all(kind).some(x=>x.code.toLowerCase()===p.code.toLowerCase()))throw Error('Código existente');const item={id:uid(),...p,createdAt:new Date().toISOString()};put(kind,item);res.json(item);});
 app.put('/api/superadmin/'+route+'/:id',(req,res)=>{const id=String(req.params.id);if(!get(kind,id))return res.status(404).json({error:'No encontrado'});const p=schema.parse(req.body);if(all(kind).some(x=>x.id!==id&&x.code.toLowerCase()===p.code.toLowerCase()))throw Error('Código existente');const item={...get(kind,id),...p};put(kind,item);res.json(item);});
 }
 app.get('/api/superadmin/overview',(_req,res)=>res.json({companies:all('saas-companies').sort((a,b)=>Number(!!b.ownerWorkspace)-Number(!!a.ownerWorkspace)),plans:all('saas-plans'),stats:{messages:all('messages').length,tasks:all('tasks').length,completed:all('jobs').filter(j=>j.status==='done').length,failed:all('jobs').filter(j=>j.status==='error').length,pending:all('requests').filter(r=>r.status==='pending').length,agents:all('agents').length},users:all('users').filter(u=>!u.deletedAt).map(u=>({id:u.id,username:u.username,displayName:u.displayName,role:u.role,disabled:!!u.disabled,registration:u.registration,companyId:u.companyId,platformAdmin:!!u.platformAdmin})),payments:[],productionReady:false}));

 const userSchema=z.object({username:z.string().trim().toLowerCase().email(),displayName:z.string().min(1).max(80),role:z.enum(['admin','supervisor','reader']),companyId:z.string(),disabled:z.boolean(),password:z.string().min(12).max(256).optional()});
 function validateCompany(p:any){const c=get('saas-companies',p.companyId);if(!c)throw Error('Selecciona una empresa');if(!c.ownerWorkspace&&!p.disabled)throw Error('Las empresas en preparación solo admiten usuarios suspendidos hasta habilitar su espacio aislado');}
 app.post('/api/superadmin/users',(req,res)=>{const p=userSchema.parse(req.body);validateCompany(p);if(!p.password)throw Error('Se requiere contraseña inicial');const u=createUser(p,p.role);const saved={...u,companyId:p.companyId,disabled:p.disabled,createdAt:new Date().toISOString()};put('users',saved);res.json({id:u.id});});
 app.patch('/api/superadmin/users/:id',(req,res)=>{const id=String(req.params.id),u=get('users',id);if(!u||u.deletedAt)return res.status(404).json({error:'Usuario no encontrado'});const p=userSchema.omit({password:true}).parse(req.body);validateCompany(p);if(all('users').some(x=>x.id!==id&&x.username===p.username))throw Error('Correo ya registrado');if(u.platformAdmin&&(p.disabled||p.role!=='admin'||p.companyId!==u.companyId))throw Error('El propietario Superadmin debe conservar su acceso y empresa');put('users',{...u,...p});res.json({ok:true});});
 app.delete('/api/superadmin/users/:id',(req,res)=>{const u=get('users',String(req.params.id));if(!u)return res.status(404).json({error:'No encontrado'});if(u.platformAdmin||u.id===res.locals.user.id)throw Error('No puedes suprimir al propietario ni tu propia cuenta');put('users',{...u,disabled:true,deletedAt:new Date().toISOString()});res.json({ok:true});});
 for(const [route,kind,schema] of [['companies','saas-companies',company],['plans','saas-plans',plan]] as const){
 app.post('/api/superadmin/'+route,(req,res)=>{const p=schema.parse(req.body);if(route==='companies'&&all(kind).some(c=>c.slug===(p as any).slug))throw Error('Slug ya registrado');const value={id:uid(),...p,createdAt:new Date().toISOString()};put(kind,value);res.json(value);});
 app.put('/api/superadmin/'+route+'/:id',(req,res)=>{if(!get(kind,String(req.params.id)))return res.status(404).json({error:'No encontrado'});const p=schema.parse(req.body);if(route==='companies'&&all(kind).some(c=>c.id!==String(req.params.id)&&c.slug===(p as any).slug))throw Error('Slug ya registrado');const value={...get(kind,String(req.params.id)),...p};put(kind,value);res.json(value);});
 }
}


