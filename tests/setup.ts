import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
export default async function setup() {
    const dataDir = path.resolve('.test-data', String(Date.now()));
    mkdirSync(dataDir, { recursive: true });
    writeFileSync('.test-data/current.txt', dataDir);
    const child = spawn(process.execPath, ['--experimental-strip-types', 'server/index.ts'], { cwd: process.cwd(), env: { ...process.env, PORT: '13211', PULPO_TEST_MODE: '1', DATA_DIR: dataDir, NODE_ENV: 'production' }, stdio: 'pipe', windowsHide: true });
    let output = '';
    child.stdout.on('data', b => output += b);
    child.stderr.on('data', b => output += b);
    for (let i = 0; i < 100; i++) {
        try {
            const r = await fetch('http://127.0.0.1:13211/api/state');
            if (r.ok && (await r.json()).testMode === true && output.includes("La Nave: http://localhost:13211"))
                return async () => { child.kill(); };
        }
        catch { }
        if (child.exitCode !== null)
            throw Error(output);
        await new Promise(r => setTimeout(r, 200));
    }
    child.kill();
    throw Error('No arrancó backend: ' + output);
}
