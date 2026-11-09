import {crewAreaModel} from '../shared/crewAppearance';
import {councilMember,councilMembers} from '../shared/council';
import {CrewPortrait} from './CrewPortrait';
import {ProviderConnections} from './ProviderConnections';
import { providers } from '../shared/organization';
import React, { useEffect, useRef, useState } from 'react';
import { createShip } from './shipScene';
import './ship.css';

const states: Record<string, string> = { idle: 'Disponible', working: 'Trabajando', error: 'Requiere revisión', waiting: 'Espera tu respuesta', queued: 'En cola', done: 'Completada', interrupted: 'Interrumpida' };
export function ShipOffice({ data, onChat, onCreate }: { data: any; onChat: (id: string) => void; onCreate: () => void }) {
  const departments: any[]=data.departments||[];
  const deckCount=2+councilMembers.length+providers.length+data.agents.filter((a:any)=>departments.some(d=>d.id===(a.leaderId||a.id))).length;
  const structure=JSON.stringify([departments,data.agents.map((a:any)=>[a.id,a.name,a.role,a.leaderId,a.seat,a.appearance])]);
  const host = useRef<HTMLDivElement>(null), engine = useRef<ReturnType<typeof createShip> | null>(null);
  const latest = useRef(data); latest.current = data;
  const [selected, setSelected] = useState(''), [area, setArea] = useState('all');
  const [error, setError] = useState(''), [metrics, setMetrics] = useState({ fps: 0, calls: 0 });
  const [paused, setPaused] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches), [low, setLow] = useState(false);
  const [closed,setClosed]=useState(false);
  const viewport=useRef<HTMLDivElement>(null),[fullscreen,setFullscreen]=useState(false),[expanded,setExpanded]=useState(false);
  useEffect(()=>{const change=()=>setFullscreen(document.fullscreenElement===viewport.current);const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')setExpanded(false);};document.addEventListener('fullscreenchange',change);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('fullscreenchange',change);document.removeEventListener('keydown',escape);};},[]);
  async function toggleFullscreen(){if(expanded){setExpanded(false);return;}if(document.fullscreenElement){await document.exitFullscreen();return;}try{await viewport.current!.requestFullscreen();}catch{setExpanded(true);}}

  const [connections,setConnections]=useState<any[]>([]),[availabilityError,setAvailabilityError]=useState('');
  useEffect(()=>{const refresh=()=>fetch('/api/providers').then(r=>r.json()).then(setConnections).catch(()=>{});void refresh();const timer=setInterval(refresh,10000);return()=>clearInterval(timer);},[]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let instance: ReturnType<typeof createShip> | null = null;
    try {
      instance = createShip(host.current!, latest.current.agents, id => { setSelected(id); engine.current?.focus(id); }, (fps, calls) => setMetrics({ fps, calls }),latest.current.departments);
      engine.current = instance; setReady(true);
    } catch { setError('No se pudo iniciar WebGL 2. Puedes consultar todos los puestos en el directorio. Activa la aceleración gráfica del navegador para explorar la nave.'); }
    const lost = (event: Event) => { event.preventDefault(); setError('Se interrumpió la vista 3D. Recarga la página para recuperarla; el directorio y las tareas siguen disponibles.'); setReady(false); };
    const canvas = host.current?.querySelector('canvas'); canvas?.addEventListener('webglcontextlost', lost);
    return () => { canvas?.removeEventListener('webglcontextlost', lost); instance?.dispose(); engine.current = null; };
  }, [structure]);
  useEffect(() => { engine.current?.update(data.agents); }, [data.agents]);
  const agent = data.agents.find((a: any) => a.id === selected);
  const connection=connections.find(c=>c.id===(agent?.provider||(selected==='licitaciones'?'croma':'')));
  const department = departments.find(d => d.id === (agent?.leaderId || agent?.id));
  const tasks = data.tasks.filter((t: any) => t.agentId === selected).slice().reverse();
  const jobs = data.jobs.filter((j: any) => j.agentId === selected).slice().reverse();
  const pending = data.requests.filter((r: any) => r.agentId === selected && ['pending', 'uncertain'].includes(r.status));
  const crew = data.agents.filter((a: any) => a.id !== 'pulpo' && (area === 'all' || (a.leaderId || a.id) === area));
  const ordered=departments.flatMap(d=>[d.id,...data.agents.filter((a:any)=>a.leaderId===d.id).sort((a:any,b:any)=>(a.seat||0)-(b.seat||0)).map((a:any)=>a.id)]).concat(['hittan','pulpo',...providers.map(p=>'provider-'+p.id)]);
  const portraitModel=department?crewAreaModel(agent,department.model):undefined;
  function focus(id: string) { setSelected(id); engine.current?.focus(id); }
  return <section className="ship-office">
    <div className="ship-heading"><div><div className="eyebrow">UN ESPACIO PARA HACER QUE LAS COSAS PASEN</div><h1>Tu equipo, a la vista<span>.</span></h1><p>Habla con tus agentes. La Nave se encarga de conectar el trabajo.</p></div><button className="ship-add-agent" onClick={onCreate}>＋ Añadir agente o departamento</button></div>
    <div className="ship-area-tabs" aria-label="Áreas de la nave"><button onClick={()=>{setArea('all');setSelected('');engine.current?.home();}}>Toda la oficina · {deckCount}</button><button onClick={()=>{setArea('consejo');setSelected('');engine.current?.focusArea('consejo');}}>El Consejo · 6 puestos</button><button onClick={()=>focus('hittan')}>Dirección · 2</button><button onClick={()=>engine.current?.focusArea('orquestadores')}>Orquestadores · {providers.filter(p=>p.kind==='mcp').length}</button><button onClick={()=>engine.current?.focusArea('llms')}>LLMs · 7</button>{departments.map(d=><button key={d.id} onClick={()=>{setArea(d.id);engine.current?.focusArea(d.id);}}>{d.name} · {data.agents.filter((a:any)=>(a.leaderId||a.id)===d.id).length}</button>)}</div>
    <div ref={viewport} className={"ship-layout"+(expanded?" ship-expanded":"")}>
      <div className="ship-stage"><details className="ship-jump"><summary>Ir a un área ▾</summary><div><button onClick={()=>{setArea('all');engine.current?.home();}}>Toda la oficina</button><button onClick={()=>{setArea('consejo');setSelected('');engine.current?.focusArea('consejo');}}>El Consejo</button><button onClick={()=>focus('hittan')}>Dirección</button><button onClick={()=>engine.current?.focusArea('orquestadores')}>Orquestadores</button><button onClick={()=>engine.current?.focusArea('llms')}>LLMs</button>{departments.map(d=><button key={d.id} onClick={()=>{setArea(d.id);engine.current?.focusArea(d.id);}}>{d.name}</button>)}</div></details><div className="ship-hud"><span><i/> LA NAVE · CUBIERTA 01</span><span>{data.agents.filter((a: any) => a.state === 'working').length} en actividad</span></div>
        <div ref={host} className="ship-canvas" data-testid="ship-canvas"/>
        {!ready && !error && <div className="ship-loading">Preparando la cubierta 3D…</div>}
        {error && <div className="ship-render-error" role="alert">{error}</div>}
        <div className="ship-camera" aria-label="Controles de cámara"><button aria-pressed={fullscreen||expanded} onClick={()=>void toggleFullscreen()}>{fullscreen||expanded?"Salir de pantalla completa":"Pantalla completa"}</button><button disabled={!ready} aria-pressed={closed} onClick={()=>{setClosed(!closed);engine.current?.dome(!closed);}}>{closed?'Abrir nave':'Cerrar cúpula'}</button><button disabled={!ready} onClick={() => engine.current?.home()}>Vista general</button><button disabled={!ready} onClick={() => engine.current?.top()}>Vista satelital</button><button aria-label="Acercar cámara" disabled={!ready} onClick={() => engine.current?.zoom(.8)}>＋</button><button aria-label="Alejar cámara" disabled={!ready} onClick={() => engine.current?.zoom(1.25)}>−</button></div>
        <div className="ship-bottom"><span>Arrastrar: orbitar · Rueda: zoom · Botón derecho: desplazar · Clic: inspeccionar</span><span title={`${metrics.calls} llamadas de dibujo`}>{metrics.fps ? `${metrics.fps} FPS` : '3D'}</span></div>
      </div>
      {!selected && <aside className="crew-inspector context-overview" aria-label="Contexto de la nave"><div className="eyebrow">CONTEXTO EN VIVO</div><h2>{area==='consejo'?'El Consejo':departments.find(d=>d.id===area)?.name||'Toda la oficina'}</h2>{area==='consejo'?<p>Seis consejeros conceptuales sentados frente al mando. Cada uno aporta su especialidad directamente a Hittan; ninguno lidera al resto. Sus avatares se inspiran en referencias públicas y no implican afiliación ni respaldo.</p>:<p>Selecciona un personaje para ver su retrato y trabajo.</p>}{area==='consejo'&&<div className="council-members">{data.agents.filter((a:any)=>a.id==='consejo'||a.id.startsWith('consejo-experto-')).map((a:any)=><button key={a.id} onClick={()=>focus(a.id)}>{a.name} · ver consejero ↗</button>)}</div>}<h3>Actividad</h3>{data.jobs.filter((j:any)=>['running','queued','working'].includes(j.status)).slice(-5).map((j:any)=><p key={j.id}>{data.agents.find((a:any)=>a.id===j.agentId)?.name}: {j.text?.slice(0,100)}</p>)}<p>{data.requests.filter((r:any)=>['pending','uncertain'].includes(r.status)).length} solicitudes por revisar</p></aside>}
      {selected && <aside className="crew-inspector" aria-label="Puesto seleccionado"><button className="inspector-close" aria-label="Cerrar puesto seleccionado" onClick={()=>setSelected('')}>×</button><div className="eyebrow">{selected === 'hittan' ? 'DIRECCIÓN' : selected === 'pulpo' ? 'CENTRO DE MANDO' : department?.name || 'EQUIPO'}</div>
        <CrewPortrait agent={agent||{id:selected,name:'Hittan'}} department={department} paused={paused} lookIndex={Math.max(0,ordered.indexOf(selected))} modelName={portraitModel}/><h2>{selected === 'hittan' ? 'Hittan' : agent?.name || 'Selecciona un puesto'}</h2>
        <span className="pill">{selected === 'hittan' ? 'Dueño de la marca' : selected === 'pulpo' ? 'Mano derecha de Hittan' : councilMember(selected) ? 'Consejero · reporta a Hittan' : agent?.provider ? 'Proveedor de IA' : agent?.leaderId ? agent.role||`Asesor · Puesto ${agent.seat}` : 'Líder de área'}</span>
        {selected === 'hittan' ? <><p>Dirección de Aumenta2 AI. Donna coordina a los líderes y te presenta los avances y decisiones pendientes.</p><p className="muted">Este personaje representa a Hittan; no ejecuta tareas autónomas.</p><button onClick={() => focus('pulpo')}>Ver a Donna ↗</button></> : agent && <>
          <p className={'crew-status ' + agent.state}><i/>{agent.enabled===false?'Pausado':connection&&!connection.configured?'Conexión pendiente':agent.pending ? 'Necesita tu respuesta' : states[agent.state] || agent.state}</p>
          {connection&&<details className="character-connection"><summary>Conectar / gestionar {connection.name}</summary><ProviderConnections only={connection.id}/></details>}{connection&&<p className="muted">{connection.check?.ok?'API/MCP verificado':connection.configured?'Credencial guardada; pendiente de verificar':'Conecta tu cuenta desde este puesto'}</p>}
          <button className="wide" onClick={async()=>{setAvailabilityError('');try{const r=await fetch('/api/agents/'+agent.id+'/availability',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:agent.enabled===false})});if(!r.ok)throw Error((await r.json()).error);}catch(e){setAvailabilityError((e as Error).message);}}}>{agent.enabled===false?'Activar agente':'Pausar nuevos encargos'}</button>
          {availabilityError&&<p role="alert">{availabilityError}</p>}
          {councilMember(selected)&&<p className="muted">Avatar conceptual sin afiliación. <a href={councilMember(selected)!.source} target="_blank" rel="noreferrer">Referencia pública ↗</a></p>}<p className="crew-objective">{agent.objective}</p>
          <h3>Trabajo asignado <span>{tasks.length}</span></h3>
          {tasks.length ? tasks.slice(0, 5).map((task: any) => <article key={task.id} className="crew-task"><strong>{task.title}</strong><small>{states[task.status] || task.status}</small><p>{task.reason}</p></article>) : <p className="crew-empty">Sin tareas asignadas todavía.</p>}
          {jobs.length > 0 && <><h3>Último encargo</h3><article className="crew-task"><strong>{jobs[0].kind === 'chat' ? jobs[0].text.slice(0, 180) : 'Continuación del encargo'}</strong><small>{states[jobs[0].status] || jobs[0].status}</small></article></>}
          {pending.length > 0 && <p className="crew-pending">{pending.length} solicitudes necesitan revisión.</p>}
          <button className="primary wide" onClick={() => onChat(selected)}>Abrir conversación ↗</button>
          <button className="wide" disabled={!ready} onClick={() => engine.current?.focus(selected)}>Acercar a este puesto</button>
        </>}
        <div className="crew-legend"><span>● Disponible</span><span>● Trabajando</span><span>● Necesita respuesta</span></div>
      </aside>}
    </div>
    <div className="ship-options"><p>Selecciona a una persona para consultar su trabajo.</p><label><input type="checkbox" checked={paused} onChange={e => { setPaused(e.target.checked); engine.current?.pause(e.target.checked); }}/> Pausar animaciones</label><label><input type="checkbox" checked={low} onChange={e => { setLow(e.target.checked); engine.current?.quality(e.target.checked); }}/> Modo ligero</label></div>
    <section className="crew-directory" aria-label="Directorio de la nave"><div className="crew-directory-heading"><div><div className="eyebrow">PERSONAS Y ÁREAS</div><h2>Encuentra a tu equipo</h2></div><label>Área<select aria-label="Filtrar área" value={area} onChange={e => setArea(e.target.value)}><option value="all">Todas las áreas</option><option value="consejo">El Consejo · 6 consejeros</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label></div>
      <div className="command-shortcuts">{councilMembers.map(p=><button data-testid={'station-'+p.id} key={p.id} onClick={()=>focus(p.id)}>{p.name} · {p.specialty}</button>)}</div>
      <div className="command-shortcuts"><button onClick={() => focus('hittan')}>Hittan · Dirección</button><button onClick={() => focus('pulpo')}>Donna · Coordinación</button></div>
      <div className="command-shortcuts">{providers.map(p=><button key={p.id} onClick={()=>focus('provider-'+p.id)}>{p.name} · {p.kind==='llm'?'LLM':'Orquestador'}</button>)}</div><div className="crew-grid">{(area === 'all' ? departments : departments.filter(d => d.id === area)).map(d => <section key={d.id} style={{ borderTopColor: d.color }}><header><h3>{d.name}</h3><button aria-label={'Ver área ' + d.name} disabled={!ready} onClick={() => engine.current?.focus(d.id)}>↗</button></header>{crew.filter((a: any) => (a.leaderId || a.id) === d.id).map((a: any) => <button data-testid={'station-' + a.id} data-pending={a.pending || 0} className={selected === a.id ? 'selected' : ''} key={a.id} aria-label={'Seleccionar puesto de ' + a.name} onClick={() => focus(a.id)} onDoubleClick={() => onChat(a.id)}><span className={'crew-dot ' + (a.pending ? 'waiting' : a.state)}/><span><strong>{a.name}</strong><small>{a.role||(a.leaderId ? states[a.state] || a.state : 'Líder de área')}</small></span>{a.pending > 0 && <b>{a.pending}</b>}<span>›</span></button>)}</section>)}</div>
      {crew.filter((a: any) => !a.provider && !a.id.startsWith('consejo') && !departments.some(d => d.id === (a.leaderId || a.id))).length > 0 && <div className="command-shortcuts">{crew.filter((a: any) => !a.provider && !councilMember(a.id) && !departments.some(d => d.id === (a.leaderId || a.id))).map((a: any) => <button aria-label={'Abrir chat de ' + a.name} key={a.id} onClick={() => onChat(a.id)}>{a.name} · Sin puesto en la cubierta</button>)}</div>}
    </section>
  </section>;
}
