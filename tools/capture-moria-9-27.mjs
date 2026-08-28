import { chromium } from 'playwright';
import fs from 'node:fs';
fs.mkdirSync('docs/screenshots',{recursive:true});
fs.mkdirSync('tmp/moria-9-33-review',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
const errors=[];
page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
page.on('pageerror',e=>errors.push(`pageerror: ${e.stack||e.message}`));
try{
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:/OFFLINE QUICK PLAY/i}).click();
  await page.locator('canvas.moria-world-canvas').waitFor({state:'visible'});
  await page.waitForTimeout(900);
  await page.screenshot({path:'docs/screenshots/moria-9-33-visual-rebirth-day.png',fullPage:true,animations:'disabled'});

  await page.locator('button[title*="Offline Debug Admin"]').click();
  await page.getByRole('heading',{name:/ADMIN PANEL/i}).waitFor({state:'visible'});
  await page.getByRole('button',{name:/Night/i}).click();
  await page.keyboard.press('Control+Shift+A');
  await page.waitForTimeout(450);
  await page.screenshot({path:'docs/screenshots/moria-9-33-visual-rebirth-night.png',fullPage:true,animations:'disabled'});

  await page.keyboard.press('c');
  await page.waitForTimeout(250);
  await page.screenshot({path:'docs/screenshots/moria-9-33-visual-rebirth-character-ui.png',fullPage:true,animations:'disabled'});

  fs.writeFileSync('tmp/moria-9-33-review/browser-console.txt',errors.join('\n'));
  fs.writeFileSync('tmp/moria-9-33-review/manifest.json',JSON.stringify({capturedAt:new Date().toISOString(),viewport:{width:1600,height:1000},consoleErrors:errors.length,screenshots:['moria-9-33-visual-rebirth-day.png','moria-9-33-visual-rebirth-night.png','moria-9-33-visual-rebirth-character-ui.png']},null,2));
  if(errors.length) throw new Error(errors.join('\n'));
}finally{await browser.close();}
