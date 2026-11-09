import { test, expect } from '@playwright/test';
test('Cola serial, esfuerzo efectivo, archivos y cambio de respaldo', async ({ request }) => {
    const state = async () => (await request.get('/api/state')).json();
    const agent = await (await request.post('/api/agents', { data: { name: 'Operaciones', personality: 'Riguroso', objective: 'Resolver', specialty: 'Operaciones', done: 'Listo', appearance: 'Donna', effort: 'low', fallback: true } })).json();
    await Promise.all(['uno', 'dos', 'crea archivo'].map(text => request.post('/api/agents/' + agent.id + '/messages', { data: { text } })));
    await expect.poll(async () => (await state()).jobs.filter((j: any) => j.agentId === agent.id && j.status === 'done').length).toBe(3);
    const turns = (await (await request.get('/api/test/turns')).json()).filter((t: any) => t.agentId === agent.id);
    expect(turns).toHaveLength(3);
    for (let i = 0; i < turns.length; i++) {
        expect(turns[i].effort).toBe('low');
        if (i)
            expect(turns[i].started).toBeGreaterThanOrEqual(turns[i - 1].finished);
    }
    const output = await request.get('/api/agents/' + agent.id + '/files/resultado.txt');
    expect(await output.text()).toBe('Archivo ficticio de prueba');
    expect((await state()).agents.filter((a: any) => a.fallback).map((a: any) => a.id)).toEqual([agent.id]);
    await request.post('/api/test/mail', { data: { messages: [{ id: 'otro-respaldo', subject: 'Gestionar una actividad sin especialidad', body: 'Ejemplo ficticio' }] } });
    await request.post('/api/review', { data: {} });
    await expect.poll(async () => (await state()).tasks.find((t: any) => t.mailId === 'otro-respaldo')?.agentId).toBe(agent.id);
});
