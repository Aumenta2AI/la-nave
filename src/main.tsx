import {SecurityPanel} from './SecurityPanel';
import {AccessGate} from './AccessGate';
import {TrainingPanel} from './TrainingPanel';
import {VoiceControls} from './VoiceControls';
import {DepartmentForm,DepartmentSettings} from './OrganizationForms';
import { ProviderConnections } from './ProviderConnections';
import { FirebaseConnections } from './FirebaseConnections';
import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import './theme.css';
import { Academy } from './Academy';
import { GoogleConnections } from './GoogleConnections';
import { ConnectorProposals } from './ConnectorProposals';
const ShipOffice=React.lazy(()=>import('./ShipOffice').then(m=>({default:m.ShipOffice}))); 
async function api(url: string, method = 'GET', body?: any) { const r = await fetch('/api' + url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); const data = await r.json(); if (!r.ok)
    throw Error(data.error || 'Error de conexión'); return data; }
const effortLabels = { low: 'Piensa poco', medium: 'Equilibrado', high: 'Piensa mucho' };
const statusLabels: any = { idle: 'Libre', working: 'Trabajando', waiting: 'Te necesita', error: 'Error', queued: 'En cola', done: 'Completada', pending: 'Pendiente', uncertain: 'Resultado incierto', executing: 'Ejecutando', answered: 'Respondida', rejected: 'Rechazada', changes: 'Cambios pedidos' };
const sprite = (a: any) => '/assets/' + a.appearance + '-' + (a.pending ? 'mano-levantada' : 'normal') + '.png';
function App() {
    const [data, setData] = useState<any>();
    const [error, setError] = useState('');
    const [page, setPage] = useState('office');
    const [selected, setSelected] = useState<string | null>(null);
    const [tab, setTab] = useState('Chat');
    const [creating, setCreating] = useState(false);
    const [creationKind,setCreationKind]=useState('');
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [files, setFiles] = useState<string[]>([]);
    const end = useRef<HTMLDivElement>(null);
    const chatBody = useRef<HTMLDivElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const previousFocus = useRef<HTMLElement | null>(null);
    const refresh = async () => { try {
        setData(await api('/state'));
    }
    catch (e) {
        setError(String(e));
    } };
    useEffect(() => { void refresh(); const t = setInterval(refresh, 1200); return () => clearInterval(t); }, []);
    const act = async (fn: () => Promise<any>) => { try {
        setError('');
        await fn();
        await refresh();
    }
    catch (e) {
        setError((e as Error).message);
    } };
    const open = (id: string) => { previousFocus.current = document.activeElement as HTMLElement; setSelected(id); setTab('Chat'); };
    const close = () => { setSelected(null); previousFocus.current?.focus(); };
    useEffect(() => { if (selected)
        closeRef.current?.focus(); }, [selected]);
    useEffect(() => { if (selected)
        api('/agents/' + selected + '/files').then(setFiles).catch(() => { }); }, [selected, data?.messages.length]);
    useEffect(() => { if (data?.requests.some((r: any) => r.agentId === selected && ['pending', 'uncertain'].includes(r.status)))
        chatBody.current?.scrollTo({ top: 0 });
    else
        end.current?.scrollIntoView({ behavior: 'smooth' }); }, [data?.messages.length, selected]);
    if (!data)
        return <main className="loading">Abriendo la oficina…{error && <p>{error}</p>}</main>;
    const agents = data.agents.filter((a: any) => a.id !== 'pulpo');
    const pulpo = data.agents.find((a: any) => a.id === 'pulpo');
    const agent = data.agents.find((a: any) => a.id === selected);
    const pending = data.requests.filter((r: any) => ['pending', 'uncertain'].includes(r.status));
    return <><header className="topbar"><button className="brand" onClick={() => setPage('office')} aria-label="La Nave, inicio"><span className="brand-icon">✳</span> La Nave</button><div className="partner-brand"><img src="/assets/aumenta2-logo.png" alt="Aumenta2 AI"/></div><nav aria-label="Principal"><button className={page === 'office' ? 'active' : ''} onClick={() => setPage('office')}>▦ <span>Oficina</span></button><button className="pulpo-nav" onClick={() => open('pulpo')}><img data-testid="pulpo-avatar" src={sprite(pulpo)} alt={pulpo.pending ? 'Donna solicita atención' : 'Donna'}/><span>Donna</span>{pulpo.pending > 0 && <b className="badge">{pulpo.pending}</b>}</button><button className={page === 'requests' ? 'active' : ''} onClick={() => setPage('requests')}>☷ <span>Solicitudes</span>{pending.length > 0 && <b className="badge">{pending.length}</b>}</button><button className={page === 'settings' ? 'active' : ''} onClick={() => setPage('settings')}>⚙ <span>Configuración</span></button><button aria-label="Academia" className={page === 'academy' ? 'active' : ''} onClick={() => setPage('academy')}>▤ <span>Academia</span></button></nav><span className="local"><i /> Local</span></header>
 {data.testMode && <div className="test-banner">ENTORNO DE PRUEBAS · Codex y servicios externos simulados</div>}
 {error && <div role="alert" className="error-banner">{error}<button onClick={() => setError('')} aria-label="Cerrar error">×</button></div>}
 <main>{page === 'office' && <React.Suspense fallback={<p>Cargando oficina 3D…</p>}><ShipOffice data={data} onChat={open} onCreate={()=>{setCreationKind('');setCreating(true);}}/></React.Suspense>}
 {page === 'requests' && <section className="content-page"><div className="eyebrow">TU CRITERIO ES PARTE DEL EQUIPO</div><h1>Solicitudes</h1><p>Revisa el contenido exacto antes de autorizar una acción.</p><Requests requests={data.requests} act={act}/></section>}
 {page === 'settings' && <Settings data={data} act={act}/>}
 {page === 'academy' && <Academy navigate={setPage} openAgent={open}/>} 
 </main>
 {agent && <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget)
            close(); }}><section className="chat-modal" role="dialog" aria-modal="true" aria-label={'Conversación con ' + agent.name} onKeyDown={e => { if (e.key === 'Escape')
            close(); if (e.key === 'Tab') {
            const nodes = e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,textarea,a[href]');
            const first = nodes[0], last = nodes[nodes.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus();
            }
            else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
            }
        } }}><header className="chat-header"><img src={sprite(agent)} alt=""/><div><h2>{agent.name}</h2><span>{agent.pending ? 'Esperando tu respuesta' : statusLabels[agent.state]} · {agent.provider ? agent.name+' · proveedor asignado' : 'GPT-6 Luna'}</span></div>{!agent.provider && <label className="effort">Razonamiento<select aria-label="Esfuerzo de razonamiento" value={agent.effort} onChange={e => act(() => api('/agents/' + agent.id, 'PATCH', { effort: e.target.value }))}>{Object.entries(effortLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>}<button ref={closeRef} className="close" aria-label="Cerrar conversación" onClick={close}>×</button></header><div className="tabs">{['Chat', 'Tareas', 'Configuración'].map(t => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
 {tab === 'Chat' && <><div className="chat-body" ref={chatBody}><Requests requests={data.requests.filter((r: any) => r.agentId === agent.id && ['pending', 'uncertain', 'executing'].includes(r.status))} act={act}/>{!data.messages.some((m: any) => m.agentId === agent.id) && <div className="chat-welcome"><img src={sprite(agent)} alt=""/><h3>Hola, soy {agent.name}.</h3><p>{agent.objective}.</p><p className="muted">¿Por dónde empezamos?</p></div>}{data.messages.filter((m: any) => m.agentId === agent.id).map((m: any) => <div className={'message ' + m.role} key={m.id}><small>{m.role === 'user' ? 'Tú' : m.role === 'assistant' ? agent.name : m.role === 'error' ? 'No se pudo completar' : 'Actividad'} · {new Date(m.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</small><p>{m.text}</p></div>)}{agent.state === 'working' && <p className="working-text" role="status">● {agent.name} está trabajando…</p>}{data.jobs.filter((j: any) => j.agentId === agent.id && ['error', 'interrupted'].includes(j.status)).slice(-1).map((j: any) => <button key={j.id} onClick={() => act(() => api('/jobs/' + j.id + '/retry', 'POST', {}))}>Reintentar turno interrumpido</button>)}{files.length > 0 && <div className="files"><strong>Archivos producidos</strong>{files.map(f => <a key={f} href={'/api/agents/' + agent.id + '/files/' + encodeURIComponent(f)}>↓ {f}</a>)}</div>}<div ref={end}/></div><form className="composer" onSubmit={async (e) => { e.preventDefault(); if (!text.trim() || sending)
            return; setSending(true); await act(async () => { await api('/agents/' + agent.id + '/messages', 'POST', { text }); setText(''); }); setSending(false); }}><VoiceControls onText={value=>setText(previous=>previous?previous+' '+value:value)} response={data.messages.filter((m:any)=>m.agentId===agent.id&&m.role==='assistant').at(-1)?.text||''}/><textarea aria-label="Mensaje" placeholder={'Escribe a ' + agent.name + '…'} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
        } }}/><button className="primary" disabled={sending || !text.trim()}>Enviar ↑</button><small>Enter para enviar · Mayús + Enter para una nueva línea</small></form></>}
 {tab === 'Tareas' && <div className="tab-body">{data.tasks.filter((t: any) => t.agentId === agent.id).length === 0 ? <p className="muted">Todavía no hay tareas asignadas.</p> : data.tasks.filter((t: any) => t.agentId === agent.id).map((t: any) => <article className="task" key={t.id}><span className="pill">{statusLabels[t.status]}</span><h3>{t.title}</h3><p>{t.reason}</p><small>Fuente: {t.source} · ID {t.id}</small>{t.result && <p>{t.result}</p>}</article>)}</div>}
 {tab === 'Configuración' && <div className="tab-body">{(agent.provider||agent.id==='licitaciones')&&<ProviderConnections only={agent.provider||'croma'}/>}<TrainingPanel agentId={agent.id}/><Profile departments={data.departments} agent={agent} save={p => act(() => api('/agents/' + agent.id, 'PATCH', p))}/><p className="muted">Carpeta: data/agents/{agent.id}/<br />Sesión: {agent.sessionId || 'Se creará con el primer mensaje'}</p></div>}
 </section></div>}
 {creating && <div className="modal-backdrop"><section className="create-modal" role="dialog" aria-modal="true" aria-label="Añadir agente o departamento"><button className="close" onClick={() => setCreating(false)} aria-label="Cancelar creación">×</button><div className="eyebrow">UN NUEVO TALENTO EN LA OFICINA</div><h2>¿Qué quieres crear?</h2>{!creationKind?<div className="actions"><button onClick={()=>setCreationKind('agent')}>Nuevo agente</button><button onClick={()=>setCreationKind('department')}>Nuevo departamento</button></div>:<><button onClick={()=>setCreationKind('')}>← Elegir otro tipo</button>{creationKind==='agent'?<Profile departments={data.departments} save={p=>act(async()=>{await api('/agents','POST',p);setCreating(false);})}/>:<DepartmentForm save={async p=>{await api('/departments','POST',p);await refresh();setCreating(false);}}/>}</>}</section></div>}
 </>;
}
function Requests({ requests, act }: {
    requests: any[];
    act: any;
}) { const [answers, setAnswers] = useState<Record<string, string>>({}); if (!requests.length)
    return <p className="muted">No hay solicitudes pendientes.</p>; return <div className="requests">{[...requests].reverse().map(r => <article className={'request ' + r.status} key={r.id} data-testid={'request-' + r.id}><span className="pill">{statusLabels[r.status] || r.status}</span><h3>{r.payload.text || r.payload.summary}</h3>{r.type === 'external' && <><small>{r.payload.account} · {r.payload.slug} · Versión inmutable {r.id.slice(0, 8)}</small><pre>{JSON.stringify(r.payload.arguments, null, 2)}</pre></>}{r.status === 'uncertain' && <Uncertain request={r} act={act}/>}{r.status === 'pending' && <><textarea aria-label={'Respuesta para ' + (r.payload.text || r.payload.summary)} placeholder={r.type === 'question' ? 'Tu respuesta…' : 'Indica los cambios que necesitas…'} value={answers[r.id] || ''} onChange={e => setAnswers({ ...answers, [r.id]: e.target.value })}/><div className="actions">{r.type === 'external' ? <><button className="primary" onClick={() => act(() => api('/requests/' + r.id + '/decision', 'POST', { decision: 'approve' }))}>Aprobar</button><button onClick={() => act(() => api('/requests/' + r.id + '/decision', 'POST', { decision: 'changes', response: answers[r.id] || '' }))}>Pedir cambios</button></> : <button className="primary" onClick={() => act(() => api('/requests/' + r.id + '/decision', 'POST', { decision: 'answer', response: answers[r.id] || '' }))}>Responder</button>}<button onClick={() => act(() => api('/requests/' + r.id + '/decision', 'POST', { decision: 'reject' }))}>{r.type === 'question' ? 'Descartar' : 'Rechazar'}</button></div></>}</article>)}</div>; }
function Profile({ agent, save, departments=[] }: {
    departments?:any[];
    agent?: any;
    save: (p: any) => void;
}) { const [p, setP] = useState(agent || { departmentId:departments[0]?.id||'', name: '', personality: 'Amable, claro y riguroso', objective: '', specialty: '', done: 'Resultado comprobable y dudas pendientes explícitas', appearance: 'administrativo', effort: 'medium', fallback: false }); const fields: any = { name: 'Nombre', role: 'Cargo', personality: 'Personalidad', objective: 'Objetivo', specialty: 'Especialidad', done: 'Criterio de terminado' }; return <form className="profile" onSubmit={e => { e.preventDefault(); const { name, role, personality, objective, specialty, done, appearance, effort, fallback } = p; save({ name, role, personality, objective, specialty, done, appearance, effort, fallback, ...(!agent||agent.leaderId?{departmentId:p.departmentId||p.leaderId}:{}) }); }}>{(!agent||agent.leaderId)&&<label>Departamento<select required value={p.departmentId||p.leaderId||''} onChange={e=>setP({...p,departmentId:e.target.value})}><option value="">Selecciona un departamento</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>}{Object.entries(fields).map(([key, label]) => <label key={key}>{String(label)}<input required={key!=='role'} value={p[key]||''} onChange={e => setP({ ...p, [key]: e.target.value })}/></label>)}{p.id !== 'pulpo' && <><label>Apariencia<select value={p.appearance} onChange={e => setP({ ...p, appearance: e.target.value })}><option value="administrativo">Secretaria</option><option value="legal">Abogado</option><option value="Donna">Donna</option><option value="Hittan">Hittan</option><option value="diseno">Diseño · creativa</option><option value="soporte">Soporte · atención al cliente</option><option value="contabilidad">Contabilidad · analista</option><option value="marketing">Marketing y ventas · estratega</option></select></label><label className="checkbox"><input type="checkbox" checked={p.fallback} disabled={agent?.fallback} onChange={e => setP({ ...p, fallback: e.target.checked })}/> Agente de respaldo</label></>}<button className="primary">{agent ? 'Guardar perfil' : 'Crear agente'}</button></form>; }
function Settings({ data, act }: {
    data: any;
    act: any;
}) { const [status, setStatus] = useState<any>(); const [schedule, setSchedule] = useState(data.schedule); useEffect(() => { api('/status').then(setStatus).catch(() => {}); }, []); return <section className="content-page"><div className="eyebrow">LOS ENGRANAJES DE TU OFICINA</div><h1>Configuración</h1><div className="settings-grid"><SecurityPanel/><article className="panel"><h2>Motor de agentes</h2><p>GPT-6 Luna <span className="pill">Codex CLI</span></p><p>{status?.codex.available ? 'Codex disponible' : 'Codex pendiente de configurar'}</p><small>{status?.codex.version}<br />{status?.codex.access || status?.codex.error}</small><p className="muted">Cada agente mantiene su sesión. El esfuerzo se cambia en la cabecera de su conversación.</p></article><GoogleConnections settings={data.settings}/><article className="panel schedule-panel"><div className="panel-heading"><h2>Revisión de correo</h2><span className="pill">{data.schedule.reviewing ? 'Revisando…' : data.schedule.enabled ? 'Activa' : 'Pausada'}</span></div><p>La Nave revisa recibidos y enviados mientras el backend está encendido.</p><form className="profile" onSubmit={e => { e.preventDefault(); act(() => api('/schedule', 'PUT', schedule)); }}><label>Intervalo en minutos<input type="number" min="1" max="10080" value={schedule.interval} onChange={e => setSchedule({ ...schedule, interval: Number(e.target.value) })}/></label><label>Criterios de búsqueda de Gmail<input value={schedule.criteria} placeholder="Ejemplo: from:cliente@empresa.com" onChange={e => setSchedule({ ...schedule, criteria: e.target.value })}/></label><label className="checkbox"><input type="checkbox" checked={schedule.enabled} onChange={e => setSchedule({ ...schedule, enabled: e.target.checked })}/> Revisión periódica activa</label><div className="actions"><button className="primary">Guardar revisión</button><button type="button" onClick={() => act(async () => { const s = await api('/schedule', 'PUT', { ...schedule, enabled: !data.schedule.enabled }); setSchedule(s); })}>{data.schedule.enabled ? 'Pausar' : 'Reanudar'}</button><button type="button" disabled={data.schedule.reviewing} onClick={() => act(() => api('/review', 'POST', {}))}>Revisar ahora</button></div></form><dl><dt>Última revisión</dt><dd>{data.schedule.lastRun ? new Date(data.schedule.lastRun).toLocaleString('es') : 'Todavía no se ha revisado'}</dd><dt>Próxima revisión</dt><dd>{data.schedule.nextRun ? new Date(data.schedule.nextRun).toLocaleString('es') : 'Pausada'}</dd><dt>Cursor</dt><dd>{new Date(data.schedule.cursor).toLocaleString('es')}</dd></dl>{data.schedule.error && <p role="alert">{data.schedule.error}</p>}</article><DepartmentSettings departments={data.departments||[]} onSave={async(id,p)=>{await api('/departments/'+id,'PATCH',p);await act(async()=>{});}}/><ProviderConnections/><FirebaseConnections/><ConnectorProposals/></div></section>; }
createRoot(document.getElementById('root')!).render(<AccessGate><App /></AccessGate>);
function Uncertain({ request: r, act }: {
    request: any;
    act: any;
}) { const [evidence, setEvidence] = useState(''); return <div><p role="alert">No se repetirá automáticamente. Verifica el destino en el servicio. {r.error}</p><label>Resultado de tu comprobación<textarea aria-label="Evidencia de comprobación" placeholder="Referencia o enlace y qué comprobaste en Gmail o Drive…" value={evidence} onChange={e => setEvidence(e.target.value)}/></label><div className="actions"><button disabled={evidence.trim().length < 12} onClick={() => act(() => api('/requests/' + r.id + '/verify', 'POST', { outcome: 'executed', evidence }))}>Confirmé que se ejecutó</button><button disabled={evidence.trim().length < 12} onClick={() => act(() => api('/requests/' + r.id + '/verify', 'POST', { outcome: 'not-executed', evidence }))}>Confirmé que no se ejecutó</button></div><small>Si no se ejecutó, se creará una nueva solicitud que requiere otra aprobación.</small></div>; }


