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
// Use the latest genuinely received WebSocket snapshot for navigation.
// This is read-only observation; every move still originates from a physical
// Playwright keyboard event in the actual ISO client.
async function readSnapshot(page){return page.evaluate(()=>window.__MORIA_AUTHORITATIVE_SNAPSHOT__)}
function serverHero(){return latestWireSnapshot?.player}
function monsterBlocked(snapshot,padding=0){
  const result=new Set();
  for(const monster of snapshot?.monsters||[]){
    if(monster.dead||monster.hp<=0)continue;
    for(let dy=-padding;dy<=padding;dy++)
      for(let dx=-padding;dx<=padding;dx++)
        if(Math.abs(dx)+Math.abs(dy)<=padding)result.add(key(monster.x+dx,monster.y+dy));
  }
  for(const other of snapshot?.nearbyPlayers||[])result.add(key(other.x,other.y));
  return result;
}
async function walk(page,map,goal){
  let legalSteps=0,retries=0,totalRetries=0,skipped=0,attempted=0;
  const rejected=new Map(),refusals=new Map();
  const began=Date.now();
  for(let i=0;i<420;i++){
    const snapshot=latestWireSnapshot,p=snapshot?.player;
    assert.ok(Number.isFinite(p?.x)&&Number.isFinite(p?.y),'Authoritative wire snapshot must include player x/y');
    if(goal(p))return {legalSteps,retries:totalRetries,skipped,position:{x:p.x,y:p.y},elapsedMs:Date.now()-began};
    assert.ok(Date.now()-began<180000,`Keyboard travel exceeded three-minute QA budget; position=${p.x},${p.y}`);
    for(const [tile,expiry] of rejected)if(expiry<i)rejected.delete(tile);
    const exclusions=new Set(rejected.keys());
    const safe=new Set([...exclusions,...monsterBlocked(snapshot,1)]);
    const primary=pathfind(map,p,goal,safe);
    const fallback=pathfind(map,p,goal,new Set([...exclusions,...monsterBlocked(snapshot)]));
    const route=primary||fallback;
    if(!route?.length){
      // Lack of an immediate ACK is not proof of a permanent wall.
      // Clear learned transient denials before deciding there is no route.
      if(rejected.size){console.log('CHROMIUM ROUTE RESET',JSON.stringify({position:{x:p.x,y:p.y},stale:[...rejected.keys()]}));rejected.clear();await sleep(200);continue;}
      retries++;totalRetries++;
      if(retries>20)throw Error(`No collision-legal route to NPC from ${p.x},${p.y}; monsters=${snapshot.monsters?.length||0}`);
      await sleep(350);
      continue;
    }
    const code=route[0],direction=directions.find(d=>d[2]===code);
    const destination={x:p.x+direction[0],y:p.y+direction[1]};
    const previousCount=intents.filter(x=>x.type==='move').length;
    // New desktop keydown sends one real intent immediately; releasing quickly
    // prevents SwiftShader delays from causing multi-tile key holds.
    await page.keyboard.press(code,{delay:35});attempted++;
    try{
      await until(()=>{
        const hero=serverHero();
        return hero&&(hero.x!==p.x||hero.y!==p.y);
      },'server-authorized keyboard position update',1800);
      legalSteps++;retries=0;refusals.clear();
      if(legalSteps%12===0)console.log('CHROMIUM WALK PROGRESS',JSON.stringify({legalSteps,position:serverHero()&&{x:serverHero().x,y:serverHero().y},attempted,retries}));
    }catch{
      retries++;totalRetries++;
      const sent=intents.filter(x=>x.type==='move').length-previousCount;
      if(sent===0){skipped++;await sleep(110);continue;}
      // Missing ACK can be a slow Chromium frame or a rejected server move.
      // Only learn a blocked cell when the fresh server snapshot shows an
      // actual monster/player occupying it; never invent new world walls.
      const last=latestWireSnapshot;
      const cell=key(destination.x,destination.y);
      const occupied=monsterBlocked(last).has(cell);
      const count=(refusals.get(cell)||0)+1;
      refusals.set(cell,count);
      // The wire snapshot can miss moving collision occupants. Two actual
      // non-progressing public intents justify a brief alternative path,
      // never a permanent map mutation. Evict after eight iterations.
      if(occupied||count>=2){rejected.set(cell,i+8);refusals.delete(cell);}
      if(retries%3===0)console.log('CHROMIUM WALK REROUTE',JSON.stringify({
        from:{x:p.x,y:p.y},destination,retries,attempted,monsters:snapshot.monsters?.length||0,
        latestServerPosition,sockets
      }));
      assert.ok(retries<12,`Consecutive keyboard movements did not receive server-confirmed progress at (${p.x},${p.y}); last target ${key(destination.x,destination.y)}, occupied=${occupied}, sent=${sent}`);
    }
    await sleep(105);
  }
  throw Error(`420 Chromium keyboard iterations exceeded; latest position=${JSON.stringify(latestServerPosition)}`);
}
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1024,height:720},deviceScaleFactor:1});
const errors=[],intents=[],catalogs=[],sockets=[];
let latestServerPosition=null,latestWireSnapshot=null,wireSnapshotCount=0,lastServerEvent=null;
page.on('pageerror',error=>errors.push(error.message));
page.on('websocket',ws=>{
  const tracker={id:sockets.length+1,authSent:0,authOk:0,authError:0,moves:0,snapshots:0};sockets.push(tracker);
  ws.on('framereceived',frame=>{
    try{const p=JSON.parse(String(frame.payload));if(p.kind==='content_sync')catalogs.push(p.payload);
      if(p.kind==='auth_ok')tracker.authOk++;
      if(p.kind==='auth_error')tracker.authError++;
      if(p.kind==='snapshot'){tracker.snapshots++;wireSnapshotCount++;latestWireSnapshot=p.payload;const hero=p.payload?.player;if(hero)latestServerPosition={x:hero.x,y:hero.y,mapId:hero.mapId};lastServerEvent=p.payload?.events?.slice(-2)}}catch{}
  });
  ws.on('framesent',frame=>{
    try{const p=JSON.parse(String(frame.payload));if(p.kind==='auth')tracker.authSent++;
      if(p.kind==='intent'){intents.push(p.payload);if(p.payload?.type==='move')tracker.moves++}}catch{}
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
  // Use ONLY creatures observed in the authenticated server's snapshots.
  // The test does not create mobs, alter coordinates, or send attack intents
  // directly. Every step uses actual Playwright keys; damage uses the UI.
  WORLD.syncContentMaps(contentDB.get('maps'));
  const starting=latestWireSnapshot?.player;
  assert.ok(starting&&Number.isFinite(starting.x)&&Number.isFinite(starting.y),
    'Fresh authenticated browser must have an authoritative spawn');
  const map=WORLD.getMap(starting.mapId);
  assert.ok(map,'Natural hunt requires server-authored walkable map');
  const manhattan=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
  const visibleRats=()=>Array.isArray(latestWireSnapshot?.monsters)
    ?latestWireSnapshot.monsters.filter(m=>m.name==='Rat'&&Number(m.hp)>0):[];
  const findTarget=()=>{
    const snapshot=latestWireSnapshot,p=snapshot.player;
    const blocked=monsterBlocked(snapshot);
    return visibleRats().map(rat=>({
      rat,path:pathfind(map,p,pos=>manhattan(pos,rat)<=1,blocked)
    })).filter(entry=>entry.path!==null)
      .sort((a,b)=>a.path.length-b.path.length)[0]?.rat;
  };
  let target=findTarget();
  const waypointRuns=[];
  if(!target){
    const spawns=WORLD.starterRatSpawns(map,10);
    assert.equal(spawns.length,10,'Only authentic natural starter Rat spawns are allowed');
    const candidates=spawns.map(pos=>({
      pos,path:pathfind(map,latestWireSnapshot.player,p=>manhattan(p,pos)<=5,
        monsterBlocked(latestWireSnapshot))
    })).filter(entry=>entry.path!==null).sort((a,b)=>a.path.length-b.path.length);
    for(const {pos} of candidates.slice(0,4)){
      const travelled=await walk(page,map,p=>manhattan(p,pos)<=5||Boolean(findTarget()));
      waypointRuns.push({pos,travelled});
      target=findTarget();
      if(target)break;
    }
  }
  assert.ok(target,'No naturally spawned Rat reachable after observing starter patrols');
  const initialRatHp=Number(target.hp),initialKills=Number(starting.stats?.monstersKilled||0);
  assert.ok(initialRatHp>0);
  const targetId=String(target.id);
  const inMeleeRange=p=>{
    const live=visibleRats().find(r=>String(r.id)===targetId);
    return Boolean(live&&manhattan(p,live)<=1);
  };
  const approach=await walk(page,map,inMeleeRange);
  assert.ok(inMeleeRange(latestWireSnapshot.player),'Only legitimate close-range attacks may damage target');
  await page.locator('[data-testid="iso-shortcuts-toggle"]').click();
  await page.locator('[data-testid="iso-open-nearby-hostiles"]').click();
  const button=page.locator('[data-testid="iso-nearby-attack"][data-monster-id="'+targetId+'"]');
  await button.waitFor({state:'visible',timeout:15000});
  let damaged=false,attacks=0,actualDamage=0,lastHp=initialRatHp;
  for(let attempt=0;attempt<8&&!damaged;attempt++){
    const live=visibleRats().find(m=>String(m.id)===targetId);
    if(!live){
      damaged=Number(latestWireSnapshot.player.stats?.monstersKilled||0)>initialKills;
      break;
    }
    if(!inMeleeRange(latestWireSnapshot.player)){
      await walk(page,map,inMeleeRange);
      await button.waitFor({state:'visible',timeout:15000});
    }
    const hpBefore=Number(live.hp),startIntent=intents.length;
    await button.click();
    await until(()=>intents.slice(startIntent).some(intent=>intent.type==='attack'
      &&intent.payload?.monsterId===targetId),'UI-created public attack intent',2500);
    attacks++;
    try{
      await until(()=>{
        const now=visibleRats().find(m=>String(m.id)===targetId);
        return (now&&Number(now.hp)<hpBefore)
          ||Number(latestWireSnapshot?.player?.stats?.monstersKilled||0)>initialKills;
      },'server-authorized damage against natural Rat',1800);
      const after=visibleRats().find(m=>String(m.id)===targetId);
      actualDamage=Math.max(0,hpBefore-Number(after?.hp??0));
      damaged=true;lastHp=Number(after?.hp??0);
    }catch{await sleep(1400);}
  }
  assert.ok(damaged,'A real browser attack must reduce Rat HP or record a legitimate kill');
  assert.ok(intents.some(intent=>intent.type==='attack'&&intent.payload?.monsterId===targetId));
  await fs.mkdir('artifacts/moria-iso-smoke',{recursive:true});
  await page.screenshot({path:'artifacts/moria-iso-smoke/online-desktop-rat-actual-damage.png',fullPage:false});
  const proof={mode:'Chromium physical keyboard + real combat UI (HTTP/WS)',
    ratId:targetId,initialRatHp,finalRatHp:lastHp,actualDamage,attackIntents:attacks,
    initialKills,finalKills:Number(latestWireSnapshot.player.stats?.monstersKilled||0),
    approach,waypointRuns,confirmedServerDamage:true,verifiedAt:new Date().toISOString()};
  await fs.writeFile('artifacts/moria-iso-smoke/online-desktop-rat-damage.json',JSON.stringify(proof,null,2));
  console.log("MOR'IA CHROMIUM NATURAL RAT DAMAGE PASS:",JSON.stringify(proof));
}finally{await browser.close()}
