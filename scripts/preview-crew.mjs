import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1500,height:1000}});
 page.on('pageerror',e=>{console.error(e.message);process.exitCode=1;});
 await page.goto('http://127.0.0.1:3210');
 await page.locator('canvas[data-models="44"]').waitFor();
 for(const id of ['administrativo','legal','diseno','soporte','contabilidad','marketing']){
  await page.getByTestId('station-'+id).click();
  await page.getByRole('button',{name:'Acercar a este puesto'}).click();
  await page.locator('canvas').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.screenshot({path:'docs/evidence/crew-'+id+'.png'});
 }
}finally{await browser.close();}
