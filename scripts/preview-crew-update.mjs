import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage({viewport:{width:1600,height:1000}});page.on('pageerror',e=>{console.log('ERROR',e.message);process.exitCode=1;});await page.goto('http://127.0.0.1:3210');await page.locator('canvas[data-models="89"]').waitFor();
for(const name of ['Hittan · Dirección','ChatGPT · OpenAI · LLM']){await page.getByRole('button',{name,exact:true}).click();await page.getByRole('button',{name:'Cerrar puesto seleccionado'}).click();await page.locator('canvas').scrollIntoViewIfNeeded();await page.waitForTimeout(800);await page.screenshot({path:'docs/evidence/'+(name.startsWith('Hittan')?'hittan-royal':'llm-logo')+'.png'});}
await page.getByRole('button',{name:'Pantalla completa',exact:true}).click();console.log('fullscreen',await page.evaluate(()=>!!document.fullscreenElement));await page.screenshot({path:'docs/evidence/fullscreen.png'});await page.getByRole('button',{name:'Salir de pantalla completa',exact:true}).click();
await page.getByTestId('station-administrativo').click();await page.getByRole('button',{name:'Acercar a este puesto'}).click();await page.getByRole('button',{name:'Cerrar puesto seleccionado'}).click();await page.waitForTimeout(800);await page.screenshot({path:'docs/evidence/uniforms.png'});
}finally{await browser.close();}
