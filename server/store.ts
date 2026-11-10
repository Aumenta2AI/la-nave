import './runtime.ts';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { additionalTeam } from './team.ts';
import { departments, providers } from '../shared/organization.ts';
export const root = process.cwd();
export const dataDir = path.resolve(process.env.DATA_DIR || 'data');
mkdirSync(dataDir, { recursive: true });
export const db = new DatabaseSync(path.join(dataDir, 'pulpo.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS records(kind TEXT NOT NULL,id TEXT NOT NULL,body TEXT NOT NULL,PRIMARY KEY(kind,id));`);
const readAll=db.prepare('SELECT body FROM records WHERE kind=? ORDER BY rowid');
const readOne=db.prepare('SELECT body FROM records WHERE kind=? AND id=?');
const writeOne=db.prepare('INSERT INTO records VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET body=excluded.body');
export function all<T = any>(kind: string): T[] { return (readAll.all(kind) as any[]).map(r => JSON.parse(r.body)); }
export function get<T = any>(kind: string, id: string): T | undefined { const row: any = readOne.get(kind, id); return row ? JSON.parse(row.body) : undefined; }
export function put(kind: string, item: any) { writeOne.run(kind, item.id, JSON.stringify(item)); return item; }
export function transaction<T>(fn: () => T): T { db.exec('BEGIN IMMEDIATE'); try {
    const value = fn();
    db.exec('COMMIT');
    return value;
}
catch (e) {
    db.exec('ROLLBACK');
    throw e;
} }
export const uid = () => randomUUID();
export const now = () => new Date().toISOString();
export type Agent = {
    id: string;
    name: string;
    role?: string;
    catalogId?: string;
    personality: string;
    objective: string;
    specialty: string;
    done: string;
    appearance: string;
    effort: 'low' | 'medium' | 'high';
    fallback: boolean;
    sessionId?: string;
    state: string;
    error?: string;
    leaderId?: string;
    seat?: number;
    provider?: string;
    enabled?: boolean;
};
export const agentDir = (id: string) => path.join(dataDir, 'agents', id);
export function profileFiles(a: Agent) {
    const dir = agentDir(a.id);
    for (const sub of ['', 'directives', 'execution', 'outputs', '.tmp'])
        mkdirSync(path.join(dir, sub), { recursive: true });
    const file = path.join(dir, 'AGENTS.md');
    const template = readFileSync(path.join(root, 'AGENTS-plantilla.md'), 'utf8');
    const start = template.indexOf('## Identidad y encargo'), end = template.indexOf('## Alcance y reglas');
    const managed = '<!-- PULPO:PROFILE:START -->\n' + template.slice(start, end).replaceAll('{{nombre}}', a.name).replaceAll('{{personalidad}}', a.personality).replaceAll('{{objetivo}}', a.objective).replaceAll('{{especialidad}}', a.specialty).replaceAll('{{criterio_de_terminado}}', a.done) + '<!-- PULPO:PROFILE:END -->\n\n';
    let content = existsSync(file) ? readFileSync(file, 'utf8') : template.slice(0, start).replace('{{nombre}}', a.name) + managed + template.slice(end);
    const priorProfile = path.join(dir, 'profile.json');
    if (existsSync(priorProfile)) {
        const old = JSON.parse(readFileSync(priorProfile, 'utf8'));
        if (content.startsWith('# ' + old.name + '\n'))
            content = '# ' + a.name + content.slice(('# ' + old.name).length);
    }
    if (existsSync(file))
        content = content.replace(/<!-- PULPO:PROFILE:START -->[\s\S]*?<!-- PULPO:PROFILE:END -->\n*/g, managed);
    writeFileSync(file, content);
    writeFileSync(path.join(dir, 'profile.json'), JSON.stringify(a, null, 2));
    if (!existsSync(path.join(dir, 'directives/INDEX.md')))
        writeFileSync(path.join(dir, 'directives/INDEX.md'), '# Directivas\n\nLas herramientas y solicitudes se gestionan mediante el protocolo estructurado de La Nave.\n');
}
export function init() {
    if (!all('agents').length)
        for (const [id, name, specialty, appearance] of [['administrativo', 'Administrativo', 'Organización, pendientes y gestiones generales', 'administrativo'], ['legal', 'Legal', 'Contratos y cualquier consulta o asunto legal', 'legal'], ['pulpo', 'La Nave', 'Coordinar equipo y revisiones periódicas de Gmail', 'pulpo']]) {
            const a: Agent = { id, name, specialty, appearance, personality: 'Amable, claro y riguroso', objective: id === 'pulpo' ? 'Repartir trabajo con fuentes y criterios verificables' : 'Resolver encargos y preparar resultados útiles', done: 'Resultado comprobable, fuentes y dudas pendientes explícitas', effort: 'medium', fallback: id === 'administrativo', state: 'idle' };
            put('agents', a);
            profileFiles(a);
        }
    // Add the new team once, preserving all existing profiles, chats and sessions.
    if (!get('migrations', 'team-specialists-v2')) {
        for (const profile of additionalTeam) {
            if (get('agents', profile.id)) continue;
            const agent: Agent = { ...profile, effort: 'medium', fallback: false, state: 'idle' };
            put('agents', agent); profileFiles(agent);
        }
        put('migrations', { id: 'team-specialists-v2', at: now() });
    }
    if (!get('migrations', 'ship-crew-v1')) {
        for (const id of ['administrativo', 'legal', 'diseno', 'soporte', 'contabilidad', 'marketing']) {
            const leader = get<Agent>('agents', id)!;
            for (let seat = 1; seat <= 6; seat++) {
                const workerId = `${id}-operario-${seat}`;
                if (get('agents', workerId)) continue;
                const worker: Agent = { id: workerId, name: `${leader.name} · Operario ${seat}`, leaderId: id, seat, appearance: leader.appearance, personality: leader.personality, objective: `Ejecutar encargos concretos del área ${leader.name} y reportar resultados verificables`, specialty: leader.specialty, done: leader.done, effort: 'medium', fallback: false, state: 'idle' };
                put('agents', worker); profileFiles(worker);
            }
        }
        const coordinator = get<Agent>('agents', 'pulpo')!;
        const donna = { ...coordinator, name: 'Donna', appearance: 'Donna', objective: 'Ser la mano derecha de Hittan: coordinar los líderes de las seis áreas y comunicar avances y bloqueos', personality: 'Clara, cercana y organizada; prioriza y comunica sin inventar resultados' };
        put('agents', donna); profileFiles(donna);
        put('migrations', { id: 'ship-crew-v1', at: now() });
    }
    if (!get('migrations', 'circular-deck-v2')) {
        for (const area of departments) {
            let leader = get<Agent>('agents', area.id);
            if (!leader) {
                leader = {id:area.id,name:area.name,appearance:area.model,specialty:area.topic,objective:area.topic,personality:'Profesional, claro y riguroso',done:'Resultado verificable y dudas explícitas',effort:'medium',fallback:false,state:'idle'};
                put('agents',leader); profileFiles(leader);
            }
            for(let seat=1;seat<=6;seat++) {
                const id=area.id+'-operario-'+seat;
                if(get('agents',id))continue;
                const worker={...leader,id,name:area.name+' · Operario '+seat,leaderId:area.id,seat,fallback:false,sessionId:undefined,state:'idle'};
                put('agents',worker);profileFiles(worker);
            }
        }
        for(const provider of providers) {
            const id='provider-'+provider.id;
            if(get('agents',id))continue;
            const agent:Agent={id,name:provider.name,provider:provider.id,appearance:provider.model,personality:'Claro, profesional y verificable',objective:provider.kind==='mcp'?'Descubrir y ejecutar herramientas mediante '+provider.name:'Resolver consultas mediante la API de '+provider.name,specialty:provider.kind==='mcp'?'Integraciones y automatización':'Modelo de lenguaje',done:'Respuesta real del proveedor, sin simular conexiones',effort:'medium',fallback:false,state:'idle'};
            put('agents',agent);profileFiles(agent);
        }
        const donna=get<Agent>('agents','pulpo')!;
        donna.objective='Coordinar los líderes de las once áreas operativas, los orquestadores y los LLM, y reportar avances a Hittan';
        put('agents',donna);profileFiles(donna);
        put('migrations',{id:'circular-deck-v2',at:now()});
    }
    if (!get('settings', 'main'))
        put('settings', { id: 'main', accountId: '', driveAccountId: '' });
    if (!get('schedules', 'gmail'))
        put('schedules', { id: 'gmail', enabled: false, interval: 30, criteria: '', cursor: now(), nextRun: null, lastRun: null, error: null });
    for (const a of all<Agent>('agents'))
        if (a.state === 'working') {
            a.state = 'error';
            a.error = 'Turno interrumpido al reiniciar. Puede reintentarlo.';
            put('agents', a);
        }
    for (const job of all('jobs'))
        if (job.status === 'running')
            put('jobs', { ...job, status: 'interrupted', error: 'Proceso interrumpido. Reintento manual requerido.' });
    for (const r of all('requests'))
        if (r.status === 'executing')
            put('requests', { ...r, status: 'uncertain', error: 'El backend se reinició durante la escritura; verifique el destino antes de continuar.' });
}

