import type {Request,Response,NextFunction} from 'express';
import {put,uid} from './store.ts';
const windows=new Map<string,{start:number;count:number}>();
export function securityHeaders(req:Request,res:Response,next:NextFunction){
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('X-Frame-Options','DENY');
 res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('Permissions-Policy','camera=(), geolocation=(), microphone=(self)');
 if(req.path.startsWith('/api/')){
  res.setHeader('Cache-Control','no-store');
  const oauthReturn=req.method==='GET'&&['/api/oauth/apify/callback','/api/auth/google/callback'].includes(req.path)&&req.headers['sec-fetch-mode']==='navigate'&&req.headers['sec-fetch-dest']==='document';
  if(req.headers['sec-fetch-site']==='cross-site'&&!oauthReturn){res.status(403).json({error:'Solicitud externa bloqueada'});return;}
  if(!['GET','HEAD','OPTIONS'].includes(req.method)){
   const key=req.socket.remoteAddress||'local',now=Date.now();
   let bucket=windows.get(key);if(!bucket||now-bucket.start>=60000){bucket={start:now,count:0};windows.set(key,bucket);}
   if(++bucket.count>120){res.setHeader('Retry-After','60');res.status(429).json({error:'Demasiadas operaciones. Espera un minuto.'});return;}
   res.on('finish',()=>{
    // No bodies, credentials, query strings or response contents in the audit log.
    put('security-events',{id:uid(),at:new Date().toISOString(),event:'api-mutation',method:req.method,path:req.path.slice(0,250),status:res.statusCode,actor:res.locals.user?.id||'unauthenticated'});
   });
  }
 }
 next();
}
