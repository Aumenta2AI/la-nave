import { Composio } from '@composio/core';
import Ajv from 'ajv';
import { get, put } from './store.ts';
import { simulated } from './codex.ts';
const userId = process.env.COMPOSIO_USER_ID || 'pulpo-local';
const toolkit = process.env.COMPOSIO_TOOLKIT || 'googlesuper';
let client: Composio;
let clientKey = '';
export type GoogleService = 'gmail' | 'drive' | 'sheets' | 'docs';
export function accountFor(service: GoogleService) {
    const s = get('settings', 'main');
    return service === 'gmail' ? s.accountId : service === 'drive' ? s.driveAccountId : s[service + 'AccountId'] || s.driveAccountId;
}
export function connectionError(error: any) {
    const status = error?.status || error?.statusCode;
    if (status === 401) return 'Composio rechazó la clave del proyecto. Revisa COMPOSIO_API_KEY en .env y reinicia La Nave.';
    if (status === 403) return 'Acceso denegado. Revisa los permisos de Google y vuelve a autorizar la cuenta.';
    if (status === 404) return 'No se encontró la cuenta o configuración en este proyecto de Composio.';
    if (status === 429) return 'Se alcanzó el límite de solicitudes. Espera antes de comprobar nuevamente.';
    return 'No se pudo comprobar la conexión. Revisa la red, la clave y el Auth Config de tu proyecto Composio.';
}
export async function connectionStatus() {
    const result: any = { configured: simulated || !!process.env.COMPOSIO_API_KEY, authConfigured: simulated || !!process.env.COMPOSIO_AUTH_CONFIG_ID, userId, toolkit, accounts: [], error: '', authError: '' };
    if (!result.configured) { result.error = 'Falta COMPOSIO_API_KEY en el archivo .env del servidor.'; return result; }
    try { result.accounts = await accounts(); } catch (e) { result.error = connectionError(e); return result; }
    if (result.authConfigured && !simulated) {
        try {
            const config = await api().authConfigs.get(process.env.COMPOSIO_AUTH_CONFIG_ID!);
            if (config.toolkit.slug.toLowerCase() !== toolkit.toLowerCase()) result.authError = 'El Auth Config debe pertenecer a Google Super, no a Gmail individual.';
        } catch (e) { result.authError = connectionError(e); }
    }
    return result;
}
export async function checkServices(ids: { sheets?: string; docs?: string }) {
    const available = await accounts();
    return Promise.all((['gmail', 'drive', 'sheets', 'docs'] as GoogleService[]).map(async service => {
        const accountId = accountFor(service);
        if (!available.some(a => a.id === accountId && a.status === 'ACTIVE')) return { service, state: 'pending', message: 'Selecciona y guarda una cuenta activa.' };
        if ((service === 'sheets' || service === 'docs') && !ids[service]) return { service, state: 'unverified', message: 'Cuenta activa. Introduce un ID de archivo para comprobar el acceso a este servicio.' };
        const endpoints = {
            gmail: 'https://gmail.googleapis.com/gmail/v1/users/me/profile',
            drive: 'https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)',
            sheets: 'https://sheets.googleapis.com/v4/spreadsheets/' + encodeURIComponent(ids.sheets || '') + '?fields=spreadsheetId',
            docs: 'https://docs.googleapis.com/v1/documents/' + encodeURIComponent(ids.docs || '') + '?fields=documentId'
        };
        try {
            if (!simulated) await googleRead(endpoints[service], accountId);
            return { service, state: 'verified', message: simulated ? 'Lectura simulada correcta.' : 'Lectura comprobada. Las escrituras se autorizan por solicitud.' };
        } catch (e) { return { service, state: 'error', message: connectionError(e) + ' Comprueba también que el archivo exista y sea accesible.' }; }
    }));
}
function api() { const key=process.env.COMPOSIO_API_KEY; if (!key)
    throw Error('Pendiente de conectar: configure COMPOSIO_API_KEY en .env'); if(!client||clientKey!==key){client=new Composio({apiKey:key});clientKey=key;}return client; }
export async function accounts() { if (simulated)
    return [{ id: 'test-account', label: 'Cuenta ficticia', status: 'ACTIVE', toolkit: 'test' }]; const result = await api().connectedAccounts.list({ userIds: [userId] }); return result.items.filter((a: any) => a.toolkit?.slug?.toLowerCase() === toolkit.toLowerCase()).map((a: any) => ({ id: a.id, label: a.alias || a.id, status: a.status, toolkit: a.toolkit?.slug })); }
export async function connect() { if (!process.env.COMPOSIO_AUTH_CONFIG_ID)
    throw Error('Configure COMPOSIO_AUTH_CONFIG_ID de Google Super en .env'); const r = await api().connectedAccounts.link(userId, process.env.COMPOSIO_AUTH_CONFIG_ID); return { url: r.redirectUrl }; }
export async function discover(search: string) { if (simulated) {
    const t = { slug: 'TEST_SEND', version: '1', name: 'Enviar correo ficticio', inputParameters: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['to', 'subject', 'body'] }, tags: [] };
    put('tools', { id: t.slug, ...t });
    return [t];
} const result = await api().tools.getRawComposioTools({ toolkits: [toolkit], search, limit: 50 }); const items = Array.isArray(result) ? result : (result as any).items; for (const t of items)
    put('tools', { id: t.slug, ...t }); return items; }
export async function validatedTool(slug: string, args: any) { let t = get('tools', slug); if (!t) {
    if (simulated)
        await discover('');
    else {
        const fetched = await api().tools.getRawComposioToolBySlug(slug);
        if (fetched.toolkit?.slug?.toLowerCase() !== toolkit.toLowerCase())
            throw Error('Herramienta fuera de Google Super');
        put('tools', { id: slug, ...fetched });
    }
    t = get('tools', slug);
} if (!t)
    throw Error('Herramienta no descubierta'); const ajv = new Ajv({ strict: false, allErrors: true, validateFormats: false }); if (!ajv.validate(t.inputParameters || {}, args))
    throw Error('Argumentos inválidos: ' + ajv.errorsText()); if (!t.version)
    throw Error('La herramienta no informa una versión fija'); return t; }
export async function execute(slug: string, args: any, account: GoogleService, approved = false, pinned?: {
    accountId: string;
    version: string;
}) { const t = await validatedTool(slug, args); if (pinned && t.version !== pinned.version)
    throw Error('La versión de la herramienta cambió; prepare una nueva solicitud'); const readonly = Array.isArray(t.tags) && t.tags.includes('readOnlyHint'); if (!approved && !readonly)
    throw Error('Esta herramienta requiere aprobación explícita; no está declarada de solo lectura'); if (simulated) {
    put('test-effects', { id: crypto.randomUUID(), slug, args });
    if (args.subject === 'incierto')
        throw Error('Timeout ficticio después del efecto');
    return { successful: true, data: { id: 'ficticio' } };
} const settings = get('settings', 'main'); const id = pinned ? pinned.accountId : accountFor(account); if (!id)
    throw Error('Pendiente de conectar: seleccione la cuenta'); const result = await api().tools.execute(slug, { userId, connectedAccountId: id, version: t.version, arguments: args }); if (!result.successful)
    throw Error('Composio no confirmó el resultado: ' + JSON.stringify(result.error)); return result; }
// Fixed read-only Google API requests through Composio. No arbitrary URLs or methods.
async function googleRead(endpoint: string, accountId: string) { const result = await api().tools.proxyExecute({ endpoint, method: 'GET', connectedAccountId: accountId }); const r: any = result; const status = r.status ?? r.status_code; if (status && status >= 400)
    throw Object.assign(Error('Google respondió ' + status), { status }); const data = r.data ?? r; const parsed = typeof data === 'string' ? JSON.parse(data) : data; if (parsed?.error) throw Object.assign(Error('Google rechazó la lectura'), { status: parsed.error.code }); return parsed; }
export async function readMail(cursor: string, criteria: string) {
    if (simulated) {
        if (get('fixtures', 'mail')?.error)
            throw Error('Fallo ficticio de lectura');
        return get('fixtures', 'mail')?.messages || [];
    }
    const account = get('settings', 'main').accountId;
    if (!account)
        throw Error('Pendiente de conectar Gmail');
    const until = new Date().toISOString();
    const q = `{in:inbox in:sent} after:${Math.max(0, Math.floor(Date.parse(cursor) / 1000) - 1)} before:${Math.ceil(Date.parse(until) / 1000)} ${criteria}`;
    const ids: string[] = [];
    let page = '';
    do {
        const list = await googleRead('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100&q=' + encodeURIComponent(q) + (page ? '&pageToken=' + encodeURIComponent(page) : ''), account);
        if (list.error)
            throw Error(JSON.stringify(list.error));
        ids.push(...(list.messages || []).map((m: any) => m.id));
        page = list.nextPageToken || '';
    } while (page);
    const messages = [];
    for (const id of ids) {
        const m = await googleRead('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + encodeURIComponent(id) + '?format=full', account);
        if (m.error || !m.id)
            throw Error('No se pudo leer correo ' + id);
        const headers = m.payload?.headers || [];
        const header = (n: string) => headers.find((h: any) => h.name.toLowerCase() === n)?.value || '';
        const decode = (p: any): string => [p.body?.data ? Buffer.from(p.body.data, 'base64url').toString('utf8') : '', ...(p.parts || []).map(decode)].join('\n');
        messages.push({ id: m.id, subject: header('subject'), from: header('from'), to: header('to'), date: new Date(Number(m.internalDate)).toISOString(), body: decode(m.payload) || m.snippet, source: 'https://mail.google.com/mail/u/0/#all/' + m.id, attachments: (m.payload?.parts || []).filter((p: any) => p.filename).map((p: any) => ({ name: p.filename, id: p.body?.attachmentId })) });
    }
    return messages;
}

export async function ecosystemAccounts(){const result=await api().connectedAccounts.list({userIds:[userId]});return result.items.map((a:any)=>({id:a.id,label:a.alias||a.id,status:a.status,toolkit:a.toolkit?.slug}));}
export async function authorizeToolkit(slug:string){if(!/^[a-z0-9_]{1,80}$/.test(slug))throw Error('Toolkit no v�lido');const session=await api().create(userId);const result=await session.authorize(slug);const url=new URL(result.redirectUrl||'');if(url.protocol!=='https:'||!['connect.composio.dev','backend.composio.dev'].includes(url.hostname))throw Error('Enlace de autorizaci�n no v�lido');return {url:url.href};}
