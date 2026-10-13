// MOR'IA desktop: real Playwright keyboard + UI against isolated HTTP/WS realm.
// Route planning reads authored server map; no teleport, fake snapshots, GM,
// direct WebSocket movement, injected monsters, or synthetic quest progress.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { WORLD } from '../server/engine/World.mjs';
import { contentDB } from '../server/engine/ContentDB.mjs';

const base=(process.env.MORIA_TEST_BASE||'http://127.0.0.1:3000').replace(/\/$/,'');
const id=Date.now().toString().slice(-9);
const username=`browserquest_${id}`,password=`MoriaStrongBrowser-${id}`,name=`KeyJourney${id.slice(-6)}`;
const directions=[[0,-1,'ArrowUp'],[1,0,'ArrowRight'],[0,1,'ArrowDown'],[-1,0,'ArrowLeft']];
const key=(x,y)=>`${x},${y}`;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function api(path,body,token){
  const response=await fetch(base+path,{method:'POST',headers:{
    'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})
  },body:JSON.stringify(body)});
  const json=await response.json();
  assert.ok(response.ok,`POST ${path}: ${response.status} ${JSON.stringify(json)}`);
  return json;
}
async function until(fn,label,ms=12000){
  const start=Date.now();while(Date.now()-start<ms){const result=fn();if(result)return result;await sleep(50)}
  throw Error(`Timed out waiting for ${label}`);
}
function pathfind(map,from,goal,blocked){
  const queue=[{x:from.x,y:from.y}];
  const parents=new Map([[key(from.x,from.y),null]]);
  const portals=new Set((map.portals||[]).map(p=>key(p.pos.x,p.pos.y)));
  let destination=null;
  for(let head=0;head<queue.length;head++){
    const p=queue[head],id=key(p.x,p.y);
    if(goal(p)){destination=id;break}
    for(const [dx,dy,code] of directions){
      const x=p.x+dx,y=p.y+dy,k=key(x,y);
      if(parents.has(k)||blocked.has(k)||portals.has(k)||!map.tiles?.[y]?.[x]?.walkable)continue;
      parents.set(k,{id,code});queue.push({x,y});
    }
  }
  if(!destination)return null;
  const path=[];for(let k=destination;parents.get(k);){const p=parents.get(k);path.push(p.code);k=p.id}
  return path.reverse();
}
async function readSnapshot(page){return page.evaluate(()=>window.__MORIA_AUTHORITATIVE_SNAPSHOT__)}
async function walk(page,map,goal){
  let legalSteps=0,retries=0;
  for(let i=0;i<600;i++){
    const snapshot=await readSnapshot(page),p=snapshot?.player;
    assert.ok(Number.isFinite(p?.x)&&Number.isFinite(p?.y),'Real snapshot must contain player x/y');
    if(goal(p))return {legalSteps,retries,position:{x:p.x,y:p.y}};
    const blocked=new Set((snapshot.monsters||[]).filter(m=>m.hp>0).map(m=>key(m.x,m.y)));
    const route=pathfind(map,p,goal,blocked);
    assert.ok(route?.length,`No authored path from (${p.x},${p.y}) to NPC`);
    const code=route[0],direction=directions.find(d=>d[2]===code);
    const target={x:p.x+direction[0],y:p.y+direction[1]};
    // Keep the real key held until an authoritative position change is seen.
    // A 46ms tap can be shorter than a browser rendering/input interval.
    let changed=false;
    await page.keyboard.down(code);
    try{
      await page.waitForFunction(previous=>{
        const hero=window.__MORIA_AUTHORITATIVE_SNAPSHOT__?.player;
        return hero&&(hero.x!==previous.x||hero.y!==previous.y);
      },{x:p.x,y:p.y},{timeout:1600});
      changed=true;
    }catch{}finally{await page.keyboard.up(code)}
    const fresh=(await readSnapshot(page))?.player;
    if(changed||(fresh?.x!==p.x||fresh?.y!==p.y))legalSteps++;
    else{
      retries++;
      if(retries===5||retries===15||retries===30){
        const focus=await page.evaluate(()=>({
          activeElement:document.activeElement?.tagName,
          hidden:document.hidden,
          pixi:document.querySelector('[data-testid="iso-next-canvas"]')?.getAttribute('data-pixi-mount')
        }));
        console.log('CHROMIUM KEYBOARD MOVE RETRY',JSON.stringify({
          retries,from:{x:p.x,y:p.y},wanted:target,key:code,
          moveIntents:intents.filter(x=>x.type==='move').length,focus
        }));
      }
      assert.ok(retries<35,`Movement not accepted at (${p.x},${p.y}); move intents=${intents.filter(x=>x.type==='move').length}`);
    }
  }
  throw Error('600 Chromium route attempts without reaching the official NPC');
}
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errors=[],intents=[],catalogs=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('websocket',ws=>{
  ws.on('framereceived',frame=>{
    try{const p=JSON.parse(String(frame.payload));if(p.kind==='content_sync')catalogs.push(p.payload)}catch{}
  });
  ws.on('framesent',frame=>{
    try{const p=JSON.parse(String(frame.payload));if(p.kind==='intent')intents.push(p.payload)}catch{}
  });
});
try{
  const registration=await api('/api/auth/register',{username,password});
  await api('/api/characters',{name,vocation:'knight'},registration.sessionToken);
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('[autocomplete="username"]').fill(username);
  await page.locator('[autocomplete="current-password"]').fill(password);
  await page.locator('button.moria-button-primary').last().click();
  await page.locator('[data-testid="iso-next-root"]').waitFor({state:'visible'});
  await page.getByText('Servidor autoritativo • LIVE').waitFor({state:'visible',timeout:20000});
  await page.locator('canvas[data-testid="iso-pixi-canvas"]').waitFor({state:'visible',timeout:20000});
  await page.waitForFunction(()=>document.querySelector('[data-testid="iso-next-canvas"]')
    ?.getAttribute('data-pixi-mount')==='active',null,{timeout:20000});
  const gameCanvas=page.locator('canvas[data-testid="iso-pixi-canvas"]');
  const gameRect=await gameCanvas.boundingBox();
  assert.ok(gameRect,'Visible game canvas must have browser coordinates');
  await gameCanvas.click({position:{x:Math.floor(gameRect.width/2),y:Math.floor(gameRect.height/2)}});

  const catalog=await until(()=>catalogs.find(c=>Array.isArray(c?.quests)&&Array.isArray(c?.npcs)),
    'server-supplied content_sync',15000);
  const quest=catalog.quests.find(q=>q.id==='quest_rats');
  const npc=catalog.npcs.find(n=>n.id===quest?.npcId);
  assert.ok(quest&&npc,'Rat starter quest and Gorn must be real server content');
  WORLD.syncContentMaps(contentDB.get('maps'));
  const map=WORLD.getMap(npc.mapId);
  assert.ok(map,'Authored terrain map required for route planning');
  const near=p=>Math.abs(p.x-Number(npc.posX))<=2
    &&Math.abs(p.y-Number(npc.posY))<=2;
  const start=await readSnapshot(page);
  assert.equal(start?.player?.mapId,npc.mapId,'Hero must spawn on authored NPC map');
  assert.ok(!near(start.player),'Player should spawn away from quest giver');
  const walked=await walk(page,map,near);
  assert.ok(walked.legalSteps>0,'Browser must move with actual keyboard, not injected WS frames');
  assert.ok(intents.some(x=>x.type==='move'),'Arrow keydown must emit real client move intents');
  await page.keyboard.press('q');
  const journal=page.locator('[data-iso-window="legacy-quests"]');
  await journal.waitFor({state:'visible'});
  const accept=page.locator('[data-testid="iso-quest-accept"][data-quest-id="quest_rats"]');
  await accept.waitFor({state:'visible'});
  const before=intents.length;
  await accept.click();
  await until(()=>intents.slice(before).some(x=>x.type==='quest_accept'&&x.payload?.questId===quest.id),
    'UI-issued public quest_accept intent');
  await page.waitForFunction(questId=>window.__MORIA_AUTHORITATIVE_SNAPSHOT__?.player
    ?.quests?.active?.some(q=>q.questId===questId),quest.id,{timeout:14000});
  const snapshot=await readSnapshot(page),active=snapshot.player.quests.active.find(q=>q.questId===quest.id);
  assert.equal(active.current,0);
  assert.equal(snapshot.player.mapId,npc.mapId);
  assert.ok(near(snapshot.player),'NPC proximity must be confirmed by the server');
  assert.equal(errors.length,0,`Uncaught page errors: ${errors.join('; ')}`);
  await fs.mkdir('artifacts/moria-iso-smoke',{recursive:true});
  await page.screenshot({path:'artifacts/moria-iso-smoke/online-desktop-keyboard-quest-accepted.png',fullPage:false});
  const proof={mode:'Chromium real keyboard/mouse + HTTP/WS',npc:{
    id:npc.id,name:npc.name,mapId:npc.mapId,x:npc.posX,y:npc.posY
  },movement:walked,questId:quest.id,acceptedInAuthoritativeSnapshot:true,
    realMoveIntents:intents.filter(x=>x.type==='move').length,verifiedAt:new Date().toISOString()};
  await fs.writeFile('artifacts/moria-iso-smoke/online-desktop-keyboard-quest.json',JSON.stringify(proof,null,2));
  console.log('MOR\'IA CHROMIUM KEYBOARD QUEST PASS:',JSON.stringify(proof));
}finally{await browser.close()}
