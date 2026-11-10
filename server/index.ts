import {hosted, publicOrigin} from './runtime.ts';
import {installWorkspaces} from './workspaces.ts';
import {installGoogleAdmin} from './googleLogin.ts';
import {installSuperadmin} from './superadmin.ts';
import {installAuth} from './auth.ts';
import {acquireInstance} from './instanceGuard.ts';
import {loadProtectedCredentials} from './credentialVault.ts';
import {securityHeaders} from './security.ts';
import {backupDatabase,backupStatus,scheduleBackups} from './backups.ts';
import {assignCatalog} from './catalogAssignment.ts';
import {organization,createDepartment,editDepartment,assignedSeat,ensureProviders,ensureCouncil} from './organization.ts';
import {beginAccountLogin,accountLoginProgress} from './accountBridge.ts';
import {beginApify,finishApify} from './apifyOAuth.ts';
import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { readdirSync, realpathSync } from 'node:fs';
import { z } from 'zod';
import { init, all, get, put, uid, profileFiles, agentDir, root, dataDir, transaction, type Agent } from './store.ts';
import { state, enqueue, decide, saveSchedule, review, startOffice, pump, verifyUncertain } from './office.ts';
import { codexStatus, simulated } from './codex.ts';
import * as bridge from './composio.ts';
import { providerStatus, saveProvider, checkProvider, mcpTools, searchProcurement, definition, setAccessMode } from './providers.ts';
import { request } from './office.ts';
const instanceLock=await acquireInstance(dataDir);
if(process.env.PULPO_TEST_MODE!=='1')loadProtectedCredentials();
init();
ensureProviders();
ensureCouncil();
assignCatalog();
const app = express();
app.disable('x-powered-by');
app.get('/healthz', (_req,res)=>res.json({ok:true}));
app.use(securityHeaders);
const port = Number(process.env.PORT || 3210);
app.use((req, res, next) => { const host = req.hostname; if (!(hosted ? [new URL(publicOrigin()).hostname] : ['127.0.0.1', 'localhost', '::1']).includes(host)) {
    res.status(403).json({ error: 'Solo localhost' });
    return;
} const origin = req.headers.origin; if (origin && !(hosted ? [publicOrigin()] : ['http://localhost:' + port, 'http://127.0.0.1:' + port]).includes(origin)) {
    res.status(403).json({ error: 'Origen no autorizado' });
    return;
} if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !req.is('application/json')) {
    res.status(415).json({ error: 'Se requiere JSON' });
    return;
} next(); });
app.use(express.json({ limit: '2mb' }));
installAuth(app);
installSuperadmin(app);installWorkspaces(app);
installGoogleAdmin(app);
app.get('/api/agents/:id/knowledge',(req,res)=>{if(!get('agents',req.params.id))throw Error('Agente no encontrado');res.json(get('knowledge',req.params.id)||{notes:'',sources:''});});
app.put('/api/agents/:id/knowledge',(req,res)=>{if(!get('agents',req.params.id))throw Error('Agente no encontrado');const data=z.object({notes:z.string().max(60000),sources:z.string().max(10000)}).parse(req.body);put('knowledge',{id:req.params.id,...data});res.json({ok:true});});
app.get('/api/state', (_req, res) => res.json({ ...state(), departments:organization(), testMode: simulated }));
app.get('/api/security/health',(_req,res)=>res.json({paused:!!get('settings','execution-control')?.paused,backups:backupStatus(),queued:all('jobs').filter(j=>j.status==='queued').length}));
app.post('/api/security/pause',(req,res)=>{const paused=z.boolean().parse(req.body.paused);put('settings',{id:'execution-control',paused});res.json({paused});});
app.get('/api/security/backups',(_req,res)=>res.json(backupStatus()));
app.post('/api/security/backups',async(_req,res)=>res.json({file:await backupDatabase(),verified:true}));
app.get('/api/status', (_req, res) => res.json({ codex: codexStatus(), composio: process.env.COMPOSIO_API_KEY ? 'Configurada' : 'Pendiente de conectar' }));
app.get('/api/providers',(_req,res)=>res.json(providerStatus()));
app.put('/api/providers/:id/access',(req,res)=>res.json(setAccessMode(req.params.id,req.body.mode)));
app.post('/api/providers/:id/login',(req,res)=>res.json(beginAccountLogin(req.params.id)));
app.get('/api/providers/:id/login', (req,res)=>res.json(accountLoginProgress(req.params.id)));
app.post('/api/oauth/apify',async(req,res)=>{const result=await beginApify(port,req.hostname);res.cookie('nave-apify-state',result.cookie,{httpOnly:true,sameSite:'lax',maxAge:600000,path:'/api/oauth/apify'});res.json({url:result.url});});
app.get('/api/oauth/apify/callback',async(req,res)=>{res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');try{const cookie=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('nave-apify-state='))?.split('=')[1]||'';await finishApify(req.query,cookie);setAccessMode('apify','oauth');res.clearCookie('nave-apify-state',{path:'/api/oauth/apify'});res.type('html').send('<h1>Apify conectado a La Nave</h1><p>Vuelve a La Nave y pulsa Actualizar conexi�n.</p><a href="/">Volver a La Nave</a>');}catch{res.status(400).type('text').send('No se complet� el acceso Apify. Vuelve a La Nave e inicia una nueva conexi�n.');}});
app.get('/api/composio/ecosystem',async(_req,res)=>res.json(await bridge.ecosystemAccounts()));
app.post('/api/composio/authorize',async(req,res)=>res.json(await bridge.authorizeToolkit(z.string().parse(req.body.toolkit))));

app.get('/api/firebase/config',(_req,res)=>{const c=get('settings','firebase');res.json(c?{apiKey:c.apiKey,projectId:c.projectId,authDomain:c.authDomain,appId:c.appId}:{});});
app.put('/api/firebase/config',(req,res)=>{
  const c=z.object({apiKey:z.string().min(10).max(150),projectId:z.string().regex(/^[a-z][a-z0-9-]{4,60}$/),authDomain:z.string().regex(/^[a-z0-9-]+\.firebaseapp\.com$/),appId:z.string().regex(/^[\w:-]+$/)}).parse(req.body);
  if(c.authDomain!==c.projectId+'.firebaseapp.com')throw Error('El dominio debe pertenecer al proyecto Firebase');
  put('settings',{id:'firebase',...c});res.json({ok:true});
});
app.get('/api/conversations/export',(_req,res)=>res.json(all('messages').filter(m=>['user','assistant','system','error'].includes(m.role)).map(m=>({id:m.id,agentId:m.agentId,role:m.role,text:m.text,createdAt:m.createdAt}))));
app.put('/api/providers/:id',(req,res)=>res.json(saveProvider(req.params.id,req.body)));
app.post('/api/providers/:id/check',async(req,res)=>res.json(await checkProvider(req.params.id)));
app.get('/api/providers/:id/tools',async(req,res)=>res.json(await mcpTools(req.params.id)));
app.post('/api/providers/:id/requests',async(req,res)=>{
  const provider=definition(req.params.id);if(provider.kind!=='mcp')throw Error('Se requiere un proveedor MCP');
  const p=z.object({name:z.string().min(1).max(200),arguments:z.record(z.unknown())}).parse(req.body);
  const tool=(await mcpTools(provider.id)).find(t=>t.name===p.name);if(!tool)throw Error('Herramienta desconocida');
  res.json(request(provider.id==='croma'?'licitaciones':'provider-'+provider.id,'external',{provider:provider.id,slug:p.name,arguments:p.arguments,summary:provider.name+' · '+p.name+' · Revisa los argumentos antes de ejecutar; puede consumir créditos o modificar datos.'}));
});
app.post('/api/croma/search',async(req,res)=>res.json(await searchProcurement(req.body)));
app.post('/api/departments',(req,res)=>res.json(createDepartment(req.body)));
app.patch('/api/departments/:id',(req,res)=>res.json(editDepartment(req.params.id,req.body)));
const profile = z.object({ role:z.string().trim().max(160).optional(), name: z.string().min(1).max(80), personality: z.string().max(2000), objective: z.string().max(2000), specialty: z.string().max(2000), done: z.string().max(2000), appearance: z.enum(['administrativo', 'legal', 'Donna', 'Hittan', 'diseno', 'soporte', 'contabilidad', 'marketing']), effort: z.enum(['low', 'medium', 'high']), fallback: z.boolean() });
app.post('/api/agents', (req, res) => { const p = profile.parse(req.body); const assignment=assignedSeat(z.string().parse(req.body.departmentId)); const a: Agent = { ...p, ...assignment, id: uid(), state: 'idle' }; transaction(() => { if (p.fallback)
    for (const other of all<Agent>('agents'))
        put('agents', { ...other, fallback: false }); put('agents', a); }); for (const profile of all<Agent>('agents'))
    profileFiles(profile); res.json(a); });
app.patch('/api/agents/:id', (req, res) => { const a = get<Agent>('agents', req.params.id); if (!a)
    return res.status(404).json({ error: 'Agente no encontrado' }); const p = profile.partial().extend({ appearance: z.enum(['administrativo', 'legal', 'Donna', 'Hittan', 'diseno', 'soporte', 'contabilidad', 'marketing', 'pulpo']).optional() }).parse(req.body); if (a.id === 'pulpo' && (p.fallback || p.appearance && !['pulpo', 'Donna'].includes(p.appearance)))
    throw Error('Donna no ocupa escritorio ni puede ser respaldo'); if (a.id !== 'pulpo' && p.appearance === 'pulpo')
    throw Error('Avatar exclusivo de Donna'); if (a.fallback && p.fallback === false)
    throw Error('Seleccione otro agente como respaldo'); let assignment={};if(req.body.departmentId!==undefined){if(!a.leaderId)throw Error('Los directores y proveedores conservan su puesto; edita el departamento.');assignment=assignedSeat(z.string().parse(req.body.departmentId),a.id);} transaction(() => { if (p.fallback)
    for (const other of all<Agent>('agents'))
        put('agents', { ...other, fallback: false }); put('agents', { ...a, ...p, ...assignment }); }); for (const profile of all<Agent>('agents'))
    profileFiles(profile); res.json(get('agents', a.id)); });
app.post('/api/agents/:id/messages', (req, res) => res.json(enqueue(req.params.id, z.string().min(1).max(100000).parse(req.body.text))));
app.put('/api/agents/:id/availability',(req,res)=>{const a=get<Agent>('agents',req.params.id);if(!a)throw Error('Agente no encontrado');const enabled=z.boolean().parse(req.body.enabled);put('agents',{...a,enabled});if(enabled)void pump(a.id);res.json({enabled});});
app.post('/api/jobs/:id/retry', (req, res) => { const job = get('jobs', req.params.id); if (!job || !['error', 'interrupted'].includes(job.status))
    throw Error('Este turno no admite reintento'); put('jobs', { ...job, status: 'queued' }); void pump(job.agentId); res.json({ ok: true }); });
app.get('/api/agents/:id/files', (req, res) => { if (!get('agents', req.params.id))
    throw Error('Agente no encontrado'); res.json(readdirSync(path.join(agentDir(req.params.id), 'outputs'))); });
app.get('/api/agents/:id/files/:name', (req, res) => { if (!get('agents', req.params.id))
    throw Error('Agente no encontrado'); const base = realpathSync(path.join(agentDir(req.params.id), 'outputs')); const file = realpathSync(path.join(base, req.params.name)); if (!file.startsWith(base + path.sep))
    throw Error('Archivo fuera de outputs'); res.download(file, path.basename(file), { dotfiles: 'allow' }); });
app.post('/api/requests/:id/decision', async (req, res) => res.json(await decide(req.params.id, req.body.decision, req.body.response)));
app.post('/api/requests/:id/verify', (req, res) => res.json(verifyUncertain(req.params.id, req.body.outcome, req.body.evidence)));
app.put('/api/schedule', (req, res) => res.json(saveSchedule(req.body)));
app.post('/api/review', (_req, res) => { void review().catch(() => { }); res.status(202).json({ accepted: true }); });
app.get('/api/google/status', async (_req, res) => res.json(await bridge.connectionStatus()));
app.post('/api/google/check', async (req, res) => { const ids = z.object({ sheets: z.string().regex(/^[a-zA-Z0-9_-]*$/).max(200).optional(), docs: z.string().regex(/^[a-zA-Z0-9_-]*$/).max(200).optional() }).parse(req.body); try { res.json(await bridge.checkServices(ids)); } catch(e) { res.status(400).json({error: bridge.connectionError(e)}); } });
app.get('/api/accounts', async (_req, res) => res.json(await bridge.accounts()));
app.post('/api/connect', async (_req, res) => { const status = await bridge.connectionStatus(); if (status.error || status.authError) return res.status(400).json({error: status.error || status.authError}); try { res.json(await bridge.connect()); } catch(e) { res.status(400).json({error: status.authConfigured ? bridge.connectionError(e) : 'Falta COMPOSIO_AUTH_CONFIG_ID en .env. Crea un Auth Config de Google Super en tu proyecto Composio.'}); } });
app.put('/api/settings', async (req, res) => { const p = z.object({ accountId: z.string(), driveAccountId: z.string(), sheetsAccountId: z.string().optional(), docsAccountId: z.string().optional() }).parse(req.body); const available = await bridge.accounts(); for (const id of [p.accountId, p.driveAccountId, p.sheetsAccountId, p.docsAccountId])
    if (id && !available.some(a => a.id === id && a.status === 'ACTIVE'))
        throw Error('Cuenta no autorizada o inactiva'); const old = get('settings', 'main'); put('settings', { ...old, ...p }); if (old.accountId !== p.accountId) {
    const s = get('schedules', 'gmail');
    put('schedules', { ...s, cursor: new Date().toISOString() });
} res.json(get('settings', 'main')); });
if (simulated) {
    app.post('/api/test/mail', (req, res) => { put('fixtures', { id: 'mail', messages: req.body.messages, error: req.body.error }); res.json({ ok: true }); });
    app.get('/api/test/effects', (_req, res) => res.json(all('test-effects')));
    app.get('/api/test/turns', (_req, res) => res.json(all('test-turns')));
}
app.get('/assets/:name', (req, res, next) => { if (!/^[\w-]+\.png$/.test(req.params.name))
    return next(); res.sendFile(path.join(root, req.params.name)); });
app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((err: any, _req: any, res: any, _next: any) => res.status(400).json({ error: err.message || String(err) }));
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(root, 'dist')));
    app.get('/{*path}', (_req, res) => res.sendFile(path.join(root, 'dist/index.html')));
}
else {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true, watch: { ignored: ["**/public/models/**", "**/docs/evidence/**", "**/tmp/**", "**/data/**", "**/.test-data/**", "**/test-results/**", "**/playwright-report/**"] } }, appType: 'spa' });
    app.use(vite.middlewares);
}
const httpServer=app.listen(port, hosted ? '0.0.0.0' : '127.0.0.1', () => {console.log(`La Nave: http://localhost:${port}${simulated ? ' [SIMULADO]' : ''}`);scheduleBackups();startOffice();});



httpServer.on('error',()=>{console.error('No se pudo abrir el puerto de La Nave; no se iniciarán tareas.');instanceLock.close();process.exit(1);});

