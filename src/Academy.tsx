import {CrewCatalog} from './CrewCatalog';
import { useState } from 'react';

import {lessons,lessonSources} from './academyLessons';

export function Academy({ navigate, openAgent }: { navigate: (page: string) => void; openAgent: (id: string) => void }) {
  const [selected, setSelected] = useState(0);
  const [search,setSearch]=useState('');
  const [completed, setCompleted] = useState<number[]>(() => { try { const saved = JSON.parse(localStorage.getItem('pulpo-academy-v1') || '[]'); return Array.isArray(saved) ? saved.filter(i => Number.isInteger(i) && i >= 0 && i < lessons.length) : []; } catch { return []; } });
  const lesson = lessons[selected];
  function complete() { const next = [...new Set([...completed, selected])]; setCompleted(next); try { localStorage.setItem('pulpo-academy-v1', JSON.stringify(next)); } catch {} if (selected < lessons.length - 1) setSelected(selected + 1); }
  return <section className="content-page academy-page">
    <div className="academy-intro"><div><div className="eyebrow">APRENDE A TRABAJAR CON TU EQUIPO</div><h1>Academia La Nave<span>.</span></h1><p>Una guía práctica, a tu ritmo. De tu primer mensaje a una oficina coordinada.</p></div><span className="academy-seal">A2<span>ACADEMIA</span></span></div>
    <CrewCatalog/>
    <div className="academy-progress"><span>{completed.length} de {lessons.length} lecciones completadas</span><progress aria-label="Progreso del tutorial" value={completed.length} max={lessons.length}/></div>
    <label className="academy-search">Buscar en la Academia<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cuentas, Vercel, departamentos, orquestación…"/></label><div className="academy-layout"><nav className="lesson-list" aria-label="Lecciones">{lessons.map((l, i) => (!search||[l.title,l.text,...l.steps].join(' ').toLocaleLowerCase().includes(search.toLocaleLowerCase()))&&<button key={l.title} aria-current={selected === i ? 'step' : undefined} onClick={() => setSelected(i)}><span className="lesson-number">{completed.includes(i) ? '✓' : String(i + 1).padStart(2, '0')}</span><span><strong>{l.title}</strong><small>{l.time} · Guía práctica</small></span></button>)}</nav>
      <article className="lesson panel" aria-live="polite"><div className="eyebrow">LECCIÓN {selected + 1} / {lessons.length}</div><h2>{lesson.title}</h2><p>{lesson.text}</p><ol>{lesson.steps.map(step => <li key={step}>{step}</li>)}</ol><blockquote>{lesson.example}</blockquote>{lessonSources[lesson.title]&&<div className="academy-sources"><h3>Fuentes para ampliar</h3>{lessonSources[lesson.title].map(source=><p key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></p>)}</div>}<div className="actions"><button className="primary" onClick={complete}>{completed.includes(selected) ? (selected === lessons.length - 1 ? 'Lección completada ✓' : 'Continuar') : 'Marcar como completada'}</button><button onClick={() => ['pulpo', 'administrativo'].includes(lesson.destination) ? openAgent(lesson.destination) : navigate(lesson.destination)}>{lesson.action} ↗</button></div><p className="muted">Tu progreso se guarda en este navegador. Los ejemplos no envían mensajes ni ejecutan acciones por sí solos.</p></article>
    </div>
  </section>;
}
