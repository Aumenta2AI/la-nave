import {useState} from 'react';
import {crewCatalog} from '../shared/crewCatalog';
export function CrewCatalog(){
 const [query,setQuery]=useState('');
 const normalized=query.toLocaleLowerCase();
 return <details className="panel crew-catalog"><summary><strong>Catálogo propuesto · 93 puestos en 16 áreas</strong></summary>
 <p>Especificación aportada para La Nave. Estos perfiles describen responsabilidades y dominios; no certifican entrenamiento, conexiones ni agentes desplegados. Los doce departamentos operativos conservan su líder y asignan los seis perfiles del documento a sus asesores, respetando las identidades personalizadas. La Fábrica de Agentes IA y Automatizaciones tiene su propia oficina. Los proveedores adicionales del documento siguen siendo propuestas. El Consejo reporta directamente a Hittan, sin líder interno.</p>
 <label>Buscar persona, cargo o área<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Simon Sinek, contabilidad, automatizaciones…"/></label>
 {crewCatalog.map(area=>{const agents=area.agents.filter(agent=>[area.name,agent.name,agent.role,agent.specialty,agent.trainingObjective].join(' ').toLocaleLowerCase().includes(normalized));return agents.length>0&&<section key={area.number}><h3>{area.icon} {area.name} · {agents.length}</h3>{area.number===2&&<p>Referentes conceptuales sin afiliación ni representación oficial. No se les atribuyen opiniones o declaraciones inventadas.</p>}{agents.map(agent=><details key={agent.id}><summary>{agent.name} — {agent.role}</summary><p><strong>Especialidad:</strong> {agent.specialty}</p><p><strong>Dominio propuesto:</strong> {agent.trainingObjective}</p><p><strong>Recursos sugeridos, pendientes de autorización:</strong> {agent.suggestedResources}</p><p className="muted">Propuesto · fuentes, permisos y evaluación pendientes.</p></details>)}</section>})}
 </details>;
}
