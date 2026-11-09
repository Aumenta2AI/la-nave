import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1050 } });
  page.on('pageerror', e => console.log('ERROR', e.message));
  await page.goto('http://127.0.0.1:3210');
  await page.locator('canvas[data-crew="88"]').waitFor();
  await page.locator('canvas[data-models="88"]').waitFor();
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'docs/evidence/nave-3d-general.png' });
  console.log('Tripulación 3D:', await page.locator('canvas').getAttribute('data-crew'));
  console.log('Rendimiento:', await page.locator('.ship-bottom').innerText());
  await page.getByRole('button', { name: 'Hittan · Dirección', exact: true }).click();
  await page.locator('canvas').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'docs/evidence/nave-3d-hittan.png' });
  await page.getByRole('button', { name: 'Donna · Coordinación', exact: true }).click();
  await page.locator('canvas').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'docs/evidence/nave-3d-donna.png' });
  await page.setViewportSize({ width: 390, height: 888 });
  await page.getByRole('button', { name: 'Vista general', exact: true }).click();
  await page.screenshot({ path: 'docs/evidence/nave-3d-movil.png' });
  console.log('Sin desbordamiento móvil:', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
} finally { await browser.close(); }
