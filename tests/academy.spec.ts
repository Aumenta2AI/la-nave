import { test, expect } from '@playwright/test';

test('Aumenta2, especialistas con ambas poses y Academia con progreso persistente', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByRole('img', { name: 'Aumenta2 AI', exact: true })).toBeVisible();
  const state = await (await request.get('/api/state')).json();
  for (const [id, name] of [['diseno', 'Diseño'], ['soporte', 'Soporte'], ['contabilidad', 'Contabilidad'], ['marketing', 'Marketing y ventas']]) {
    expect(state.agents.find((a: any) => a.id === id)).toMatchObject({ name, appearance: id });
    for (const pose of ['normal', 'mano-levantada']) {
      const asset = await request.get(`/assets/${id}-${pose}.png`);
      expect(asset.ok()).toBeTruthy();
      const png = await asset.body();
      expect(png.readUInt32BE(16)).toBe(png.readUInt32BE(20));
      expect(png[25]).toBe(6); // RGBA; transparency is retained, never flattened.
    }
    if(id==='diseno') await page.getByRole('button',{name:'Abrir chat de Diseño',exact:true}).click();
    else await page.getByTestId(`station-${id}`).dblclick();
    await expect(page.getByRole('dialog', { name: `Conversación con ${name}` })).toBeVisible();
    await page.getByRole('textbox', { name: 'Mensaje', exact: true }).fill('dos preguntas');
    await page.getByRole('button', { name: 'Enviar ↑' }).click();
    await expect(page.getByRole('heading', { name: 'Primera pregunta' })).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar conversación' }).click();
    await expect.poll(async()=>{const s=await(await request.get('/api/state')).json();return s.agents.find((a:any)=>a.id===id).pending;}).toBeGreaterThan(0);
    const current = await (await request.get('/api/state')).json();
    for (const r of current.requests.filter((r: any) => r.agentId === id && r.status === 'pending')) await request.post(`/api/requests/${r.id}/decision`, { data: { decision: 'reject' } });
    await expect.poll(async()=>{const s=await(await request.get('/api/state')).json();return s.agents.find((a:any)=>a.id===id).pending;}).toBe(0);
  }
  await page.getByRole('button', { name: 'Academia', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Academia La Nave.' })).toBeVisible();
  await page.getByRole('button', { name: 'Marcar como completada' }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '1');
  await page.reload();
  await page.getByRole('button', { name: 'Academia', exact: true }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '1');
  await page.screenshot({ path: 'test-results/academia.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Academia', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
