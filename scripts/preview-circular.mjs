import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1100}});
 await page.goto('http://127.0.0.1:3210');await page.locator('canvas[data-models="88"]').waitFor();
 await page.locator('.ship-stage').screenshot({path:'docs/evidence/nave-circular-abierta.png'});
 await page.getByRole('button',{name:'Cerrar cúpula',exact:true}).click();
 await page.waitForTimeout(300);await page.locator('.ship-stage').screenshot({path:'docs/evidence/nave-circular-cupula.png'});
 await page.getByRole('button',{name:/Configuración/}).click();
 await page.getByRole('heading',{name:'Conexiones de IA',exact:true}).waitFor();
 const statuses=await page.evaluate(async()=>{const rows=await(await fetch('/api/providers')).json();return rows.map(p=>({id:p.id,configured:p.configured,verified:!!p.check?.ok}));});
 console.log(JSON.stringify(statuses));
 await page.locator('.provider-connections').first().screenshot({path:'docs/evidence/conexiones-ia.png'});
}finally{await browser.close();}
