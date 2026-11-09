import {WorkspaceEditor} from './WorkspaceEditor';
import {AffiliateDashboard} from './AffiliateDashboard';
import {ProviderConnections} from './ProviderConnections';
import {PaymentConnections} from './PaymentConnections';
import {AdminCompanies} from './AdminCompanies';
import {AdminAnalytics} from './AdminAnalytics';
import {CommercialRegistry} from './CommercialRegistry';
import {AdminUsers} from './AdminUsers';
import {GoogleLoginSettings} from './GoogleLogin';
import React,{useEffect,useState} from 'react';
const nav=['Panel de control','Empresas','Usuarios','Planes','Pagos e integraciones','Analíticas','Afiliados','Cupones','Auditoría de conexiones','Personalización por empresa'];
export function Superadmin({close}:{close:()=>void}){
 const [workspaceId,setWorkspaceId]=useState('');
 const [editingPlan,setEditingPlan]=useState<any>();
 const [tab,setTab]=useState(nav[0]),[data,setData]=useState<any>(),[error,setError]=useState('');
 const load=()=>fetch('/api/superadmin/overview').then(async r=>{const v=await r.json();if(!r.ok)throw Error(v.error);setData(v);}).catch(e=>setError(e.message));
 useEffect(()=>{void load();},[]);
 async function save(route:string,value:any){const r=await fetch('/api/superadmin/'+route,{method:route.includes('/')?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});const v=await r.json();if(!r.ok)throw Error(v.error);await load();}
 return <div className="sa-shell"><aside><img src="/assets/aumenta2-logo.png" alt="Aumenta2 AI" style={{width:'100%',background:'#fff',padding:12,borderRadius:8}}/><h1>La Nave</h1><p>SUPERADMIN</p>{nav.map(n=><button key={n} onClick={()=>setTab(n)} aria-current={tab===n?'page':undefined}>{n}</button>)}<button onClick={close}>Volver a la nave</button></aside><main><header><h1>{tab}</h1><p>Aumenta2 · Administración global del ecosistema</p></header><p className="sa-notice">Preparación SaaS: las empresas y planes se guardan como borradores. La activación comercial requiere aislamiento operativo, cuotas y cobros verificados.</p>{error&&<p role="alert">{error}</p>}{data&&<>
 {(tab===nav[0]||tab===nav[5])&&<AdminAnalytics/>}
 {tab===nav[6]&&<AffiliateDashboard/>}
 {tab===nav[7]&&<CommercialRegistry key="coupons" type="coupons"/>}
 {tab===nav[9]&&<><p>Ingreso administrativo: <a href="/admin">/admin</a> · Usuarios: <a href="/app">/app</a> · Nuevas cuentas: <a href="/registro">/registro</a></p><label>Seleccionar empresa<select value={workspaceId} onChange={e=>setWorkspaceId(e.target.value)}><option value="">Elige una empresa</option>{data.companies.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>{workspaceId&&<WorkspaceEditor key={workspaceId} companyId={workspaceId}/>}</>}
 {tab===nav[1]&&<AdminCompanies data={data} save={save}/>} 
 {tab===nav[2]&&<AdminUsers data={data} reload={load}/>}
 {tab===nav[3]&&<><form key={editingPlan?.id||'new'} onSubmit={async e=>{e.preventDefault();const d=new FormData(e.currentTarget);const value:any={name:d.get('name'),currency:d.get('currency'),status:'draft'};for(const n of ['price','departments','users','connections','monthlyTokens','storageMB'])value[n]=Number(d.get(n));for(const n of ['council','llms','branding'])value[n]=d.has(n);try{await save(editingPlan?'plans/'+editingPlan.id:'plans',value);setEditingPlan(undefined);}catch(e){setError(String(e));}}}><h2>{editingPlan?'Editar plan':'Crear plan'}</h2><label>Nombre<input name="name" defaultValue={editingPlan?.name} required/></label><label>Moneda<select name="currency" defaultValue={editingPlan?.currency||'COP'}><option>COP</option><option>USD</option></select></label>{[['price','Precio mensual',0],['departments','Áreas',3],['users','Usuarios',3],['connections','Conexiones',3],['monthlyTokens','Tokens mensuales',100000],['storageMB','Almacenamiento MB',1000]].map(([n,label,v])=><label key={n}>{label}<input name={String(n)} type="number" min="0" defaultValue={editingPlan?.[String(n)]??v} required/></label>)}{[['council','Consejo'],['llms','LLMs'],['branding','Personalizar marca']].map(([n,l])=><label key={n}><input name={n} type="checkbox" defaultChecked={editingPlan?.[n]}/>{l}</label>)}<button>Guardar plan en preparación</button></form><div className="sa-grid">{data.plans.map((p:any)=><article key={p.id}><h2>{p.name}</h2><p>{p.description}</p><strong>{p.currency} {p.price}/mes</strong><p>{p.departments} áreas · {p.users} usuarios</p><p>{p.monthlyTokens} tokens · {p.storageMB} MB</p><span>Precio orientativo · cuotas pendientes de aplicar</span><p><button onClick={()=>{setEditingPlan(p);window.scrollTo(0,0);}}>Editar plan</button></p></article>)}</div></>}
 {tab===nav[4]&&<PaymentConnections/>}{tab===nav[8]&&<ProviderConnections/>}
 </>}</main></div>;
}




