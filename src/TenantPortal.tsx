import React,{useState} from 'react';
import {WorkspaceEditor} from './WorkspaceEditor';
import {TenantConversations} from './TenantConversations';
const TenantOffice=React.lazy(()=>import('./TenantOffice').then(m=>({default:m.TenantOffice})));
export function TenantPortal(){const [tab,setTab]=useState('Personalización');return <div className="sa-shell" style={{display:'block'}}><main><h1>Mi empresa</h1><div className="sa-toolbar">{['Personalización','Oficina 3D','Conversaciones'].map(t=><button key={t} aria-pressed={tab===t} onClick={()=>setTab(t)}>{t}</button>)}<button onClick={async()=>{await fetch('/api/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});window.location.assign('/app');}}>Cerrar sesión</button></div>{tab==='Personalización'?<WorkspaceEditor/>:tab==='Oficina 3D'?<React.Suspense fallback={<p>Cargando oficina…</p>}><TenantOffice/></React.Suspense>:<TenantConversations/>}</main></div>;}

