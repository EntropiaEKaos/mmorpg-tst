import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const port = Number(process.env.ISO_PORT || 4173);
const base = `http://127.0.0.1:${port}`;
const route = `${base}/prototype/isometric`;
const evidenceDir = 'docs/screenshots/iso-next';

await mkdir(evidenceDir, { recursive: true });
const server = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env }, detached: process.platform !== 'win32' });
const waitForServer=async()=>{for(let i=0;i<60;i++){try{const r=await fetch(base);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,500))}throw new Error(`ISO preview did not become ready at ${base}`)};
const stopServer=async()=>{if(server.exitCode!==null)return;if(process.platform==='win32')server.kill('SIGTERM');else{try{process.kill(-server.pid,'SIGTERM')}catch{server.kill('SIGTERM')}}await Promise.race([new Promise(r=>server.once('exit',r)),new Promise(r=>setTimeout(r,3000))]);if(server.exitCode===null){if(process.platform==='win32')server.kill('SIGKILL');else{try{process.kill(-server.pid,'SIGKILL')}catch{server.kill('SIGKILL')}}}};
let browser;
try{
 await waitForServer();browser=await chromium.launch({headless:true});const errors=[];
 const desktop=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});desktop.on('console',m=>{if(m.type()==='error')errors.push(m.text())});desktop.on('pageerror',e=>errors.push(e.message));await desktop.goto(route,{waitUntil:'networkidle'});await desktop.locator('[data-testid="iso-next-canvas"] canvas').waitFor({state:'visible'});await desktop.screenshot({path:`${evidenceDir}/iso-next-eldoria-day.png`,fullPage:true});
 const capturePreset=async(label,file)=>{await desktop.getByRole('button',{name:/HUD/}).click();await desktop.getByRole('button',{name:new RegExp(label,'i')}).click();await desktop.waitForTimeout(250);await desktop.screenshot({path:`${evidenceDir}/${file}`,fullPage:true});};
 await capturePreset('Combate','hud-combat.png');await capturePreset('Exploração','hud-exploration.png');await capturePreset('Social & Economia','hud-social.png');
 await desktop.getByRole('button',{name:/Inventário/}).click();await desktop.getByRole('button',{name:/Minimapa/}).click();await desktop.getByRole('button',{name:/Chat/}).click();await desktop.waitForTimeout(250);await desktop.screenshot({path:`${evidenceDir}/hud-multi-window.png`,fullPage:true});
 const mobile=await browser.newPage({viewport:{width:430,height:932},deviceScaleFactor:1});mobile.on('console',m=>{if(m.type()==='error')errors.push(`[mobile] ${m.text()}`)});mobile.on('pageerror',e=>errors.push(`[mobile] ${e.message}`));await mobile.goto(route,{waitUntil:'networkidle'});await mobile.locator('[data-testid="iso-next-canvas"] canvas').waitFor({state:'visible'});await mobile.screenshot({path:`${evidenceDir}/iso-next-eldoria-narrow.png`,fullPage:true});
 const report={testedAt:new Date().toISOString(),route,desktop:'1440x900',narrow:'430x932',canvasVisible:true,hudEvidence:['hud-combat.png','hud-exploration.png','hud-social.png','hud-multi-window.png'],consoleErrors:errors,passed:errors.length===0};await writeFile(`${evidenceDir}/offline-report.json`,`${JSON.stringify(report,null,2)}\n`);if(errors.length)throw new Error(`ISO browser gate found ${errors.length} console/page error(s)`);console.log('ISO Next offline visual gate passed with HUD preset evidence.');
}finally{await browser?.close();await stopServer();}
