import { chromium } from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('docs/evidence',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 await page.goto('http://localhost:3210');await page.getByRole('heading',{name:'Tu equipo, a la vista.'}).waitFor();
 await page.waitForFunction(()=>Array.from(document.images).every(image=>image.complete));
 await page.screenshot({path:'docs/evidence/oficina-real.png',fullPage:true});
 await page.getByTestId('station-administrativo').dblclick();
 await page.getByText('Te ofrecí ayuda con organización y gestiones generales.',{exact:true}).waitFor();
 await page.screenshot({path:'docs/evidence/chat-codex-real.png'});
 const state=await(await fetch('http://localhost:3210/api/state')).json();
 const status=await(await fetch('http://localhost:3210/api/status')).json();
 const agent=state.agents.find(a=>a.id==='administrativo');
 writeFileSync('docs/evidence/codex-real.json',JSON.stringify({verifiedAt:new Date().toISOString(),testMode:state.testMode,status,agent:{id:agent.id,sessionId:agent.sessionId,state:agent.state,effort:agent.effort},messages:state.messages.filter(m=>m.agentId==='administrativo').map(({role,text})=>({role,text}))},null,2));
}finally{await browser.close();}
