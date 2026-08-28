import { chromium } from 'playwright';
import fs from 'node:fs';
fs.mkdirSync('docs/screenshots',{recursive:true});
fs.mkdirSync('tmp/moria-9-27-review',{recursive:true});
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
 await page.screenshot({path:'docs/screenshots/moria-9-27-visual-rebirth-gameplay.png',fullPage:true,animations:'disabled'});
 fs.writeFileSync('tmp/moria-9-27-review/browser-console.txt',errors.join('\n'));
 if(errors.length) throw new Error(errors.join('\n'));
}finally{await browser.close();}
