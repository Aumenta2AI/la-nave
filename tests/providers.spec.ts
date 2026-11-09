import {test,expect} from '@playwright/test';
test('Configuración de IA, credenciales privadas, disponibilidad y chat sin clave',async({page,request})=>{
  await page.goto('/');await page.getByRole('button',{name:/Configuración/}).click();
  await expect(page.getByRole('heading',{name:'Conexiones de IA',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Firebase · Cuenta y respaldo'})).toBeVisible();
  const saved=await request.put('/api/providers/deepseek',{data:{key:'test-private-do-not-return',model:'test-model'}});expect(saved.ok()).toBeTruthy();expect(await saved.text()).not.toContain('test-private-do-not-return');
  expect(await (await request.get('/api/providers')).text()).not.toContain('test-private-do-not-return');
  await request.put('/api/providers/deepseek',{data:{removeKey:true}});
  await request.put('/api/agents/provider-deepseek/availability',{data:{enabled:false}});
  expect((await request.post('/api/agents/provider-deepseek/messages',{data:{text:'hola'}})).status()).toBe(400);
  await request.put('/api/agents/provider-deepseek/availability',{data:{enabled:true}});
  const job=await (await request.post('/api/agents/provider-deepseek/messages',{data:{text:'hola'}})).json();
  await expect.poll(async()=>{const state=await(await request.get('/api/state')).json();return state.jobs.find((j:any)=>j.id===job.id)?.status;}).toBe('error');
  const state=await(await request.get('/api/state')).json();expect(state.jobs.find((j:any)=>j.id===job.id).error).toContain('Falta configurar');
  await request.put('/api/providers/croma',{data:{removeKey:true}});
  expect((await request.post('/api/croma/search',{data:{query:'software'}})).status()).toBe(400);
});
