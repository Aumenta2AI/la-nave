import {all,get,put,uid} from './store.ts';
export function seedCommercial(){
 if(get('migrations','commercial-defaults-v1'))return;
 const specs=[
 ['plan-orbita','Órbita',149000,3,3,3,100000,1024,false,false,'Para iniciar con un equipo pequeño y sus tareas esenciales.'],
 ['plan-tripulacion','Tripulación',349000,5,10,8,500000,5120,false,true,'Para coordinar varias áreas y conectar sus herramientas.'],
 ['plan-comando','Comando',799000,12,25,20,1500000,20480,true,true,'Para operar todas las áreas con Consejo y personalización de marca.']
 ];
 for(const [id,name,price,departments,users,connections,monthlyTokens,storageMB,council,branding,description] of specs)if(!get('saas-plans',String(id)))put('saas-plans',{id,name,price,departments,users,connections,monthlyTokens,storageMB,council,branding,llms:true,description,currency:'COP',status:'draft',suggested:true,createdAt:new Date().toISOString()});
 let company=all('saas-companies').find(c=>c.slug==='aumenta2');
 if(!company){company={id:'company-aumenta2',name:'La Nave · Aumenta2',slug:'aumenta2',logoUrl:'',color:'#7245a0',planId:'plan-comando',status:'draft',createdAt:new Date().toISOString()};}
 put('saas-companies',{...company,ownerWorkspace:true});
 for(const u of all('users'))if(!u.companyId)put('users',{...u,companyId:company.id});
 put('migrations',{id:'commercial-defaults-v1',at:new Date().toISOString()});
}
