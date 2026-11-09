import React, { useEffect, useState } from 'react';
async function api(path: string, body?: any, method = 'POST') {
    const r = await fetch('/api' + path, body === undefined ? {} : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await r.json(); if (!r.ok) throw Error(data.error || 'No se pudo conectar'); return data;
}
const labels: Record<string, string> = { gmail: 'Gmail', drive: 'Google Drive', sheets: 'Google Sheets', docs: 'Google Docs' };
export function GoogleConnections({ settings }: { settings: any }) {
    const [status, setStatus] = useState<any>();
    const [selected, setSelected] = useState(settings.accountId === settings.driveAccountId ? settings.accountId : '');
    const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
    const [url, setUrl] = useState(''), [checks, setChecks] = useState<any[]>([]);
    const [ids, setIds] = useState({ sheets: '', docs: '' });
    const refresh = async () => { const s = await api('/google/status'); setStatus(s); return s; };
    const run = async (fn: () => Promise<void>) => { setBusy(true); setError(''); setNotice(''); try { await fn(); } catch(e) { setError((e as Error).message); } finally { setBusy(false); } };
    useEffect(() => { void run(async () => { await refresh(); }); }, []);
    useEffect(() => {
        if (!url) return;
        const timer = setInterval(() => { void refresh().catch(() => {}); }, 10000);
        const stop = setTimeout(() => clearInterval(timer), 10 * 60 * 1000);
        return () => { clearInterval(timer); clearTimeout(stop); };
    }, [url]);
    return <article className="panel google-connections"><div className="eyebrow">GOOGLE WORKSPACE</div><h2>Una cuenta, cuatro servicios</h2><p>Conecta tu cuenta mediante Google Super de Composio y úsala con todo el equipo.</p>
        <div className="google-services">{Object.entries(labels).map(([key, label]) => <span className="pill" key={key}>{label}</span>)}</div>
        <h3>1. Preparar Composio</h3>
        <p>{!status ? 'Comprobando configuración…' : status.error || 'Composio responde y las cuentas se han consultado.'}</p>
        {status?.authError && <p role="alert">{status.authError}</p>}
        <details open={status && (!status.configured || !status.authConfigured)}><summary>Configurar el proyecto y sus permisos</summary>
            <ol><li>Abre tu <a href="https://platform.composio.dev" target="_blank" rel="noreferrer">proyecto de Composio ↗</a> y copia su API Key al archivo <code>.env</code> del servidor, en <code>COMPOSIO_API_KEY</code>.</li>
            <li>Crea un Auth Config de <strong>Google Super</strong> con OAuth y permisos para Gmail, Drive, Sheets y Docs. Copia su ID en <code>COMPOSIO_AUTH_CONFIG_ID</code>.</li>
            <li>Conserva <code>COMPOSIO_USER_ID=pulpo-local</code> y <code>COMPOSIO_TOOLKIT=googlesuper</code>. Reinicia La Nave y pulsa «Actualizar conexión».</li></ol>
            <p className="muted">La clave permanece en el servidor. No la envíes al chat ni la pegues en perfiles. Si cambias los permisos, vuelve a autorizar Google y acepta los servicios que quieres utilizar.</p>
            <a href="https://docs.composio.dev/kb/guide/toolkits-googlesuper" target="_blank" rel="noreferrer">Guía oficial de permisos ↗</a>
        </details>
        <h3>2. Autorizar y elegir cuenta</h3><div className="actions"><button disabled={busy || !status?.configured || !status?.authConfigured || !!status?.error || !!status?.authError} onClick={() => run(async () => { const r = await api('/connect', {}); setUrl(r.url); })}>Conectar Google</button><button disabled={busy} onClick={() => run(async () => { await refresh(); setChecks([]); })}>Actualizar conexión</button></div>
        {url && <p><a href={url} target="_blank" rel="noreferrer">Continuar autorización de Google ↗</a><small> · Completa el consentimiento en la pestaña de Google. Las cuentas se actualizan durante diez minutos.</small></p>}
        {status?.accounts?.filter((a: any) => a.status !== 'ACTIVE').map((a: any) => <p className="muted" key={a.id}>{a.label}: {a.status}. Si la autorización expiró, inicia una nueva conexión.</p>)}
        <form className="profile" onSubmit={e => { e.preventDefault(); void run(async () => { await api('/settings', { accountId: selected, driveAccountId: selected, sheetsAccountId: selected, docsAccountId: selected }, 'PUT'); setChecks([]); setUrl(''); setNotice('Cuenta guardada para Gmail, Drive, Sheets y Docs.'); }); }}>
            <label>Cuenta de Google para los cuatro servicios<select required value={selected} onChange={e => setSelected(e.target.value)}><option value="">Selecciona una cuenta activa</option>{status?.accounts?.filter((a: any) => a.status === 'ACTIVE').map((a: any) => <option key={a.id} value={a.id}>{a.label}</option>)}</select></label><button className="primary" disabled={busy || !selected}>Usar esta cuenta en Google</button>
        </form>
        <h3>3. Comprobar acceso</h3><p className="muted">Se comprueba la cuenta guardada con lecturas. No se crean ni modifican archivos. Las comprobaciones no certifican permisos de escritura.</p>
        <div className="profile">{(['sheets', 'docs'] as const).map(service => <label key={service}>ID de archivo de {labels[service]} (opcional)<input value={ids[service]} placeholder="El ID situado entre /d/ y /edit en el enlace" onChange={e => { setIds({ ...ids, [service]: e.target.value.trim() }); setChecks([]); }}/></label>)}</div>
        <button disabled={busy || !status?.configured || !!status?.error} onClick={() => run(async () => { setChecks(await api('/google/check', ids)); })}>Comprobar los cuatro servicios</button>
        {checks.map(c => <p key={c.service}><strong>{labels[c.service]} · {c.state === 'verified' ? 'Lectura correcta' : c.state === 'error' ? 'Requiere revisión' : 'Pendiente de comprobar'}</strong><br/>{c.message}</p>)}
        {busy && <p role="status">Comprobando…</p>}{notice && <p role="status">{notice}</p>}{error && <p role="alert">{error}</p>}
    </article>;
}
