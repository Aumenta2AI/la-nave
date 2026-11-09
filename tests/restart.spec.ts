import { test, expect } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
test('Reinicio real del proceso conserva sesión, cola, solicitudes e instrucciones', async ({ page }) => {
    const folder = path.resolve('.test-data', 'restart-' + Date.now());
    mkdirSync(folder, { recursive: true });
    let child: ChildProcess;
    const start = async () => { child = spawn(process.execPath, ['--experimental-strip-types', 'server/index.ts'], { env: { ...process.env, PORT: '3212', PULPO_TEST_MODE: '1', DATA_DIR: folder, NODE_ENV: 'production' }, stdio: 'ignore', windowsHide: true }); await expect.poll(async () => { try {
        return (await fetch('http://127.0.0.1:3212/api/state')).status;
    }
    catch {
        return 0;
    } }).toBe(200); };
    const stop = () => new Promise<void>(resolve => { child.once('exit', () => resolve()); child.kill(); });
    const api = async (url: string, data?: any, method = 'POST') => (await fetch('http://127.0.0.1:3212/api' + url, { method: data === undefined ? 'GET' : method, headers: { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) })).json();
    try {
        await start();
        await page.goto('http://127.0.0.1:3212');
        await page.getByTestId('station-legal').dblclick();
        await page.getByRole('textbox', { name: 'Mensaje', exact: true }).fill('dos preguntas');
        await page.getByRole('button', { name: 'Enviar ↑' }).click();
        await expect(page.getByRole('heading', { name: 'Primera pregunta' })).toBeVisible();
        const before = await api('/state');
        const session = before.agents.find((a: any) => a.id === 'legal').sessionId;
        const file = path.join(folder, 'agents', 'legal', 'AGENTS.md');
        appendFileSync(file, '\nPreferencia permanente: explicar sin jerga.\n');
        await api('/agents/legal', { name: 'Asesor Legal' }, 'PATCH');
        expect(readFileSync(file, 'utf8')).toContain('Preferencia permanente: explicar sin jerga.');
        const template = readFileSync('AGENTS-plantilla.md', 'utf8');
        const common = template.slice(template.indexOf('## Aprendizajes'), template.indexOf('## Identidad y encargo'));
        expect(readFileSync(file, 'utf8')).toContain(common);
        await stop();
        await start();
        await page.reload();
        await expect(page.getByTestId('station-legal')).not.toHaveAttribute('data-pending', '0');
        const after = await api('/state');
        expect(after.agents.find((a: any) => a.id === 'legal').sessionId).toBe(session);
        expect(after.requests.filter((r: any) => r.status === 'pending')).toHaveLength(2);
        expect(after.messages).toHaveLength(before.messages.length);
        await page.getByRole('button', { name: 'Seleccionar puesto de Asesor Legal', exact: true }).dblclick();
        await page.getByRole('textbox', { name: 'Mensaje', exact: true }).fill('continúa');
        await page.getByRole('button', { name: 'Enviar ↑' }).click();
        await expect(page.getByText('[SIMULADO] Sesión continuada. continúa', { exact: true })).toBeVisible();
        await page.screenshot({ path: 'test-results/reinicio-solicitudes.png' });
    }
    finally {
        if (child! && !child!.killed)
            await stop();
    }
});
