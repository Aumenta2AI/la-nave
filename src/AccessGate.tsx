import {TenantPortal} from './TenantPortal';
import {WorkspaceEditor} from './WorkspaceEditor';
import {GoogleLoginButton} from './GoogleLogin';
import {Superadmin} from './Superadmin';
import './superadmin.css';
import React,{useEffect,useState} from 'react';
export function AccessGate({children}:{children:React.ReactNode}){
 const admin=window.location.pathname==='/admin';const registering=window.location.pathname==='/registro';const setAdmin=(value:boolean)=>window.location.assign(value?'/admin':'/app');
 const [status,setStatus]=useState<any>(),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const refresh=()=>fetch('/api/auth/status').then(r=>r.json()).then(setStatus).catch(()=>setError('No se puede contactar con La Nave.'));
 useEffect(()=>{void refresh();const t=setInterval(refresh,30000);return()=>clearInterval(t);},[]);
 if(!status)return <main className="loading">Comprobando acceso…{error}</main>;
 if(status.user&&admin&&status.user.platformAdmin)return <Superadmin close={()=>setAdmin(false)}/>;
 if(status.user&&admin&&!status.user.platformAdmin)return <main className="content-page"><h1>Acceso exclusivo del Superadmin</h1><a href="/app">Ir a mi cuenta</a></main>;
 if(status.user&&status.user.companyId&&!status.user.ownerWorkspace&&!status.user.platformAdmin)return <TenantPortal/>;
 if(status.user)return <><div style={{padding:'8px 20px',display:'flex',justifyContent:'flex-end',gap:16}}>{status.user.platformAdmin&&<button onClick={()=>setAdmin(true)}>Superadmin</button>}<span>{status.user.displayName||status.user.username} · {status.user.role==='admin'?'Administrador':status.user.role==='supervisor'?'Supervisor':'Solo lectura'}</span><button onClick={async()=>{await fetch('/api/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});await refresh();}}>Cerrar sesión</button></div>{children}</>;
 return <main className="content-page" style={{maxWidth:520,margin:'40px auto'}}><h1>{status.setup?'Configura tu acceso a La Nave':registering?'Crear cuenta de empresa':admin?'Acceso Superadmin':'Entrar a La Nave'}</h1><p>{status.setup?'Crea el administrador local. La contraseña se guarda como un hash, nunca como texto legible.':'Usa tu usuario local. Las sesiones caducan a las ocho horas o al reiniciar el servidor.'}</p><form className="panel profile" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');const data=new FormData(e.currentTarget);try{const r=await fetch('/api/auth/'+(status.setup?'setup':registering?'register':'login'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:data.get('username'),password:data.get('password'),...(registering?{companyName:data.get('companyName'),slug:data.get('slug')}:{})})});const result=await r.json();if(!r.ok)throw Error(result.error);await refresh();}catch(e){setError(String(e));}finally{setBusy(false);}}}><p>{registering?"La cuenta incluye personalización, vista 3D y conversaciones con tus propias claves API. Los cobros y las acciones externas automáticas siguen pendientes.":""}</p>{registering&&<><label>Nombre de empresa<input name="companyName" required minLength={2} maxLength={100}/></label><label>Identificador de empresa<input name="slug" required pattern="[a-z0-9-]{3,60}" placeholder="mi-empresa"/></label></>}<label>Correo o usuario<input name="username" required maxLength={254} autoComplete="username"/></label><label>Contraseña · mínimo 12 caracteres<input name="password" type="password" minLength={12} maxLength={256} autoComplete={status.setup?'new-password':'current-password'} required/></label><button className="primary" disabled={busy}>{busy?'Comprobando…':status.setup?'Crear administrador':registering?'Crear empresa':'Entrar'}</button>{error&&<p role="alert">{error}</p>}</form>{!status.setup&&!registering&&!admin&&<GoogleLoginButton/>}<p><a href="/app">Ingreso de usuarios</a> · <a href="/registro">Registrar empresa</a> · <a href="/admin">Superadmin</a></p></main>;
}



