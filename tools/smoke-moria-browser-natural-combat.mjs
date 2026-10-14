// MOR'IA Desktop V39: true Chromium keyboard + attack button + loot pickup.
// No direct WebSocket intents, mock entities, teleports, HP mutation or GM API.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {WORLD} from '../server/engine/World.mjs';
import {contentDB} from '../server/engine/ContentDB.mjs';

const base=(process.env.MORIA_TEST_BASE||'http://127.0.0.1:3000').replace(/\/$/,'');
const marker=Date.now().toString().slice(-9);
const username=`battletest_${marker}`,password=`MoriaCombatBrowser-${marker}`,name=`Battle${marker.slice(-6)}`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const coords=(x,y)=>`${x},${y}`;
const dist=(a,b)=>Math.abs(Number(a.x)-Number(b.x))+Math.abs(Number(a.y)-Number(b.y));
const directions=[[0,-1,'ArrowUp'],[1,0,'ArrowRight'],[0,1,'ArrowDown'],[-1,0,'ArrowLeft']];
async function until(fn,label,timeout=14000){
  const started=Date.now();
  while(Date.now()-started<timeout){const result=fn();if(result)return result;await sleep(60)}
  throw Error(`Timed out: ${label}`);
}
async function post(path,body,token){
  const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});
  const json=await response.json();
  assert.ok(response.ok,`${path}: ${response.status} ${JSON.stringify(json)}`);
  return json;
}
function route(map,from,goal,blocked){
  const queue=[{x:from.x,y:from.y}],visited=new Map([[coords(from.x,from.y),null]]);
  const portals=new Set((map.portals||[]).map(p=>coords(p.pos.x,p.pos.y)));
  let destination=null;
  for(let i=0;i<queue.length;i++){
    const p=queue[i],id=coords(p.x,p.y);
    if(goal(p)){destination=id;break;}
    for(const [dx,dy,code] of directions){
      const x=p.x+dx,y=p.y+dy,k=coords(x,y);
      if(visited.has(k)||blocked.has(k)||portals.has(k)||!map.tiles?.[y]?.[x]?.walkable)continue;
      visited.set(k,{previous:id,code});queue.push({x,y});
    }
  }
  if(!destination)return null;
  const result=[];for(let id=destination;visited.get(id);){const step=visited.get(id);result.push(step.code);id=step.previous}
  return result.reverse();
}
function occupied(snapshot){
  const cells=new Set();
  for(const m of snapshot?.monsters||[])if(m.hp>0&&!m.dead)cells.add(coords(m.x,m.y));
  for(const p of snapshot?.nearbyPlayers||[])cells.add(coords(p.x,p.y));
  return cells;
}
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1024,height:720},deviceScaleFactor:1});
let live=null,messages=0;
const intents=[],errors=[];
page.on('pageerror',err=>errors.push(err.message));
page.on('websocket',ws=>{
  ws.on('framereceived',frame=>{try{
    const p=JSON.parse(String(frame.payload));
    if(p.kind==='snapshot'){live=p.payload;messages++;}
  }catch{}});
  ws.on('framesent',frame=>{try{
    const p=JSON.parse(String(frame.payload));
    if(p.kind==='intent')intents.push(p.payload);
  }catch{}});
});
try{
  const account=await post('/api/auth/register',{username,password});
  await post('/api/characters',{name,vocation:'knight'},account.sessionToken);
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('[autocomplete="username"]').fill(username);
  await page.locator('[autocomplete="current-password"]').fill(password);
  await page.locator('button.moria-button-primary').last().click();
  await page.locator('[data-testid="iso-next-root"]').waitFor({state:'visible'});
  await page.getByText('Servidor autoritativo • LIVE').waitFor({state:'visible',timeout:20000});
  await page.locator('canvas[data-testid="iso-pixi-canvas"]').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelector('[data-testid="iso-next-canvas"]')?.getAttribute('data-pixi-mount')==='active',null,{timeout:20000});
  const canvas=page.locator('canvas[data-testid="iso-pixi-canvas"]');
  const rect=await canvas.boundingBox();
  assert.ok(rect,'Pixi canvas must be rendered by the live browser');
  await canvas.click({position:{x:Math.floor(rect.width/2),y:Math.floor(rect.height/2)}});
  await until(()=>live?.player?.mapId,'first authenticated player snapshot');
  WORLD.syncContentMaps(contentDB.get('maps'));
  const map=WORLD.getMap(live.player.mapId);
  assert.ok(map,'Official authored world map is required');
  const authored=WORLD.starterRatSpawns(map,10);
  assert.ok(authored.length===10,'Rats must be reachable from authored spawn terrain');
  const before={kills:Number(live.player.stats?.monstersKilled||0),xp:Number(live.player.xp||0),gold:Number(live.player.gold||0),inventory:(live.player.inventory||[]).length};
  const started=Date.now(),refused=new Map();
  let realKeyboardSteps=0,attempts=0,targetId=null;
  while(Date.now()-started<165000&&attempts<180){
    const snap=live,p=snap?.player;
    assert.ok(p&&p.hp>0,'Natural rat quest cannot rely on player death/respawn');
    const rats=(snap.monsters||[]).filter(m=>m.name==='Rat'&&m.hp>0);
    const blocked=occupied(snap);
    // Live server monsters always take precedence over authored spawn guides.
    const goals=rats.length?rats.map(m=>({at:m,goal:q=>dist(q,m)<=1})):
      authored.map(pos=>({at:pos,goal:q=>dist(q,pos)<=3}));
    const possible=goals.map(item=>({...item,path:route(map,p,item.goal,new Set([...blocked,...refused.keys()]))}))
      .filter(x=>x.path).sort((a,b)=>a.path.length-b.path.length);
    if(!possible.length){refused.clear();await sleep(250);continue;}
    const selected=possible[0];
    if(rats.length&&selected.path.length===0){
      targetId=String(selected.at.id);
      assert.ok(dist(p,selected.at)<=1,'Hero reached a live, naturally spawned Rat');
      break;
    }
    if(selected.path.length===0){await sleep(300);continue;}
    const code=selected.path[0],d=directions.find(x=>x[2]===code),cell=coords(p.x+d[0],p.y+d[1]);
    const oldIntents=intents.filter(x=>x.type==='move').length;
    await page.keyboard.press(code,{delay:35});attempts++;
    try{
      await until(()=>live?.player&&(live.player.x!==p.x||live.player.y!==p.y),'server-accepted browser movement',1550);
      realKeyboardSteps++;refused.clear();
    }catch{
      // Do not reinterpret timeouts as successful movement; try another cell.
      if(intents.filter(x=>x.type==='move').length>oldIntents)refused.set(cell,attempts+9);
      await sleep(110);
    }
    for(const [k,expiry] of refused)if(expiry<attempts)refused.delete(k);
  }
  assert.ok(targetId,`No naturally spawned Rat reached via physical keyboard; steps=${realKeyboardSteps}, position=${JSON.stringify(live?.player&&{x:live.player.x,y:live.player.y})}`);
  assert.ok(realKeyboardSteps>0,'Real keyboard travel must occur before fighting');
  await page.locator('[data-testid="iso-shortcuts-toggle"]').click();
  await page.locator('[data-testid="iso-open-nearby-hostiles"]').click();
  const enemy=page.locator('[data-testid="iso-nearby-enemy"]', {has:page.locator(`[data-testid="iso-nearby-attack"][data-monster-id="${targetId}"]`)});
  await enemy.waitFor({state:'visible',timeout:10000});
  const attack=enemy.locator('[data-testid="iso-nearby-attack"]');
  await fs.mkdir('artifacts/moria-iso-smoke',{recursive:true});
  await page.screenshot({path:'artifacts/moria-iso-smoke/desktop-natural-rat-before-attack.png'});
  let attackClicks=0,damageProven=false;
  const startingHp=Number(live.monsters.find(m=>String(m.id)===targetId)?.hp||0);
  assert.ok(startingHp>0,'Rat must have real health before attacking');
  for(let i=0;i<18;i++){
    const snapshot=live,rat=snapshot.monsters?.find(m=>String(m.id)===targetId);
    if(Number(snapshot.player.stats?.monstersKilled||0)>before.kills)break;
    if(!rat||rat.hp<=0){await sleep(350);continue;}
    const old=intents.length;
    await attack.click();attackClicks++;
    await until(()=>intents.slice(old).some(x=>x.type==='attack'&&x.payload?.monsterId===targetId),'official attack intent from actual UI',3000);
    await sleep(850);
    const newRat=live?.monsters?.find(m=>String(m.id)===targetId);
    if(newRat&&Number(newRat.hp)<startingHp)damageProven=true;
  }
  await until(()=>Number(live?.player?.stats?.monstersKilled||0)>before.kills,'server-confirmed natural monster kill',8000);
  assert.equal(Number(live.player.stats.monstersKilled),before.kills+1,'Exactly one real Rat kill required');
  assert.ok(damageProven||live.player.stats.monstersKilled>before.kills,'Server must apply actual damage');
  assert.ok(Number(live.player.xp||0)>before.xp,'Natural Rat kill must grant server XP');
  await page.screenshot({path:'artifacts/moria-iso-smoke/desktop-natural-rat-killed.png'});
  await page.keyboard.press('i');
  const inventory=page.locator('[data-testid="iso-gameplay-panel"]');
  await inventory.waitFor({state:'visible'});
  const piles=(live.groundItems||[]).filter(p=>dist(p,live.player)<=2);
  assert.ok(piles.length>0,'Server kill must create a genuine reachable ground loot pile');
  const pickup=inventory.locator('[data-testid^="iso-ground-item-"]:not([disabled])').first();
  await pickup.waitFor({state:'visible'});
  const pickupIntentBefore=intents.length;
  await pickup.click();
  const pickupIntent=await until(()=>intents.slice(pickupIntentBefore).find(x=>x.type==='pickup'),'official pickup intent from inventory UI',3500);
  await until(()=>Number(live?.player?.gold||0)>before.gold||(live?.player?.inventory||[]).length>before.inventory,'server-issued loot collection',8000);
  await page.screenshot({path:'artifacts/moria-iso-smoke/desktop-natural-rat-loot-collected.png'});
  assert.equal(errors.length,0,`Uncaught page exceptions: ${errors.join('; ')}`);
  const proof={mode:'real Chromium UI + authenticated public HTTP/WS',monsterId:targetId,
    firstMonsterHp:startingHp,realKeyboardSteps,moveAttempts:attempts,attackClicks,
    damageObserved:damageProven,monsterKills:1,xpBefore:before.xp,xpAfter:live.player.xp,
    groundPilesBeforePickup:piles.length,pickupGroundId:pickupIntent.payload?.groundId,
    goldBefore:before.gold,goldAfter:live.player.gold,websocketSnapshots:messages,
    completedAt:new Date().toISOString()};
  await fs.writeFile('artifacts/moria-iso-smoke/desktop-natural-rat-combat-loot.json',JSON.stringify(proof,null,2));
  console.log('MORIA CHROMIUM NATURAL RAT COMBAT AND LOOT PASS:',JSON.stringify(proof));
}finally{await browser.close();}
