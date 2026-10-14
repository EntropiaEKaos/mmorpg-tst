// MOR'IA Desktop P0: real HTTP + WebSocket + persistence journey.
// No browser rendering, synthetic monsters, teleport intents or GM privileges.
// The player walks to a real quest NPC, kills naturally spawned Rats, picks up
// actual world loot, delivers the official reward and verifies persistence.
// All mutations use public WebSocket intents, never GM or mock game state.
// This complements (does not replace) the Chromium desktop gameplay E2E.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import WebSocket from 'ws';
import { WORLD } from '../engine/World.mjs';
import { contentDB } from '../engine/ContentDB.mjs';

const base=process.env.MORIA_TEST_BASE||'http://127.0.0.1:3000';
const wsUrl=base.replace(/^http/,'ws')+'/ws';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const key=(x,y)=>`${x},${y}`;
const steps=[[0,-1],[1,0],[0,1],[-1,0]];
const marker=Date.now().toString().slice(-9);
const username=`questnet_${marker}`,password=`MoriaNetworkStrong-${marker}`,characterName=`Journey${marker.slice(-6)}`;

async function until(predicate,label,timeout=14000){
  const started=Date.now();
  while(Date.now()-started<timeout){
    const found=predicate();
    if(found)return found;
    await sleep(40);
  }
  throw Error(`Timed out waiting for ${label} after ${timeout}ms`);
}
async function post(path,body,token){
  const res=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});
  const data=await res.json();
  assert.ok(res.ok,`${path}: HTTP ${res.status}: ${JSON.stringify(data)}`);
  return {status:res.status,data};
}
async function connect(token){
  const socket=new WebSocket(wsUrl);
  const state={socket,snapshot:null,content:null,authId:null,error:null,version:0};
  socket.on('open',()=>socket.send(JSON.stringify({kind:'auth',payload:{sessionToken:token,characterName}})));
  socket.on('message',buffer=>{
    let msg;try{msg=JSON.parse(buffer.toString())}catch{return}
    if(msg.kind==='auth_ok')state.authId=msg.payload?.id;
    if(msg.kind==='auth_error')state.error=JSON.stringify(msg.payload);
    if(msg.kind==='content_sync')state.content=msg.payload;
    if(msg.kind==='snapshot'){state.snapshot=msg.payload;state.version++}
  });
  socket.on('error',error=>{state.error=String(error)});
  await until(()=>{if(state.error)throw Error(state.error);return state.authId&&state.snapshot?.player?.quests&&state.content},'authenticated WS, catalog and snapshot',16000);
  return state;
}
function send(state,type,payload){
  assert.equal(state.socket.readyState,WebSocket.OPEN,'Game socket must stay connected');
  state.socket.send(JSON.stringify({kind:'intent',payload:{type,payload,timestamp:Date.now()}}));
}
function route(map,from,goal,blocked){
  const queue=[{x:from.x,y:from.y}],parents=new Map([[key(from.x,from.y),null]]);
  const portals=new Set((map.portals||[]).map(p=>key(p.pos.x,p.pos.y)));
  let destination=null;
  for(let head=0;head<queue.length;head++){
    const point=queue[head],prev=key(point.x,point.y);
    if(goal(point)){destination=prev;break}
    for(const [dx,dy] of steps){
      const x=point.x+dx,y=point.y+dy,k=key(x,y);
      if(parents.has(k)||blocked.has(k)||portals.has(k)||!map.tiles?.[y]?.[x]?.walkable)continue;
      parents.set(k,{prev,dx,dy});queue.push({x,y});
    }
  }
  if(!destination)return null;
  const path=[];
  for(let k=destination;parents.get(k);){
    const move=parents.get(k);path.push([move.dx,move.dy]);k=move.prev;
  }
  return path.reverse();
}
function observedBlockers(snapshot){
  const blocked=new Set();
  for(const monster of snapshot?.monsters||[])if(!monster.dead)blocked.add(key(monster.x,monster.y));
  for(const player of snapshot?.players||[])if(player.id!==snapshot?.player?.id)blocked.add(key(player.x,player.y));
  return blocked;
}
async function walkTo(state,map,goal,{maxSteps=450}={}){
  let moved=0,rejected=0;
  while(!goal(state.snapshot.player)){
    assert.ok(moved<maxSteps,`Too many moves, last position ${state.snapshot.player.x},${state.snapshot.player.y}`);
    const here={x:state.snapshot.player.x,y:state.snapshot.player.y};
    const path=route(map,here,goal,observedBlockers(state.snapshot));
    assert.ok(path?.length,`No walkable route from ${JSON.stringify(here)} to quest NPC`);
    const [dx,dy]=path[0],dest={x:here.x+dx,y:here.y+dy};
    let reached=false;
    for(let attempt=0;attempt<3&&!reached;attempt++){
      // Cooldown is enforced by real server clock; don't alter player.lastMove.
      await sleep(125);
      send(state,'move',{dx,dy});
      const began=Date.now();
      while(Date.now()-began<360){
        const p=state.snapshot?.player;
        if(p?.x===dest.x&&p?.y===dest.y){reached=true;break}
        await sleep(35);
      }
    }
    if(!reached){
      rejected++;
      assert.ok(rejected<25,`Server rejected too many legal moves from ${JSON.stringify(here)} to ${JSON.stringify(dest)}`);
      await sleep(140);
      continue;
    }
    moved++;
  }
  return {moved,rejected};
}

const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
// Authored spawn cells guide search, but actual targets and progress always
// come from live WS snapshots. No synthetic monsters, teleports, GM intents,
// altered RNG, health/damage fixtures or bypasses of combat cooldowns.
async function huntNaturalRat(state,map,questId,targetProgress){
  const spawnPoints=WORLD.starterRatSpawns(map,10);
  assert.equal(spawnPoints.length,10,'Expected ten walkable authored Rat spawn cells');
  const visited=new Set();
  const before=state.snapshot.player;
  const initialKills=Number(before.stats?.monstersKilled)||0;
  const initialDeaths=Number(before.stats?.deaths)||0;
  let travel=0,attacks=0,searches=0;
  for(let iteration=0;iteration<110;iteration++){
    const player=state.snapshot.player;
    assert.equal(Number(player.stats?.deaths)||0,initialDeaths,'Natural hunt cannot rely on death/respawn');
    if((Number(player.stats?.monstersKilled)||0)>initialKills){
      assert.equal(Number(player.stats.monstersKilled),initialKills+1,'Exactly one real kill is required');
      const quest=player.quests.active.find(q=>q.questId===questId);
      assert.equal(quest?.current,targetProgress,'Each natural Rat kill must advance quest by exactly one');
      assert.ok(player.level>before.level||player.xp>before.xp,'Natural kill must grant XP');
      return {travel,attacks,searches,monsterKills:1,questProgress:quest.current,
        xpBefore:before.xp,xpAfter:player.xp,levelBefore:before.level,levelAfter:player.level};
    }
    const rats=(state.snapshot.monsters||[]).filter(m=>m.name==='Rat'&&m.hp>0);
    const reachable=rats.map(monster=>({
      monster,path:route(map,player,p=>distance(p,monster)<=1,observedBlockers(state.snapshot))
    })).filter(x=>x.path!==null).sort((a,b)=>a.path.length-b.path.length);
    if(reachable.length){
      const target=reachable[0].monster;
      if(distance(player,target)>1){
        const walked=await walkTo(state,map,p=>distance(p,target)<=1,{maxSteps:350});
        travel+=walked.moved;
      }else{
        send(state,'attack',{monsterId:target.id});
        attacks++;
        assert.ok(attacks<=45,'Natural Rat not defeated after 45 normal attack intents');
        await sleep(1350);
      }
      continue;
    }
    const options=spawnPoints.map(pos=>({
      pos,path:route(map,player,p=>distance(p,pos)<=2,observedBlockers(state.snapshot))
    })).filter(x=>x.path!==null&&!visited.has(key(x.pos.x,x.pos.y)))
      .sort((a,b)=>a.path.length-b.path.length);
    assert.ok(options.length,'No reachable natural Rat from authored spawn waypoints');
    const target=options[0];
    visited.add(key(target.pos.x,target.pos.y));
    const walked=await walkTo(state,map,p=>distance(p,target.pos)<=2,{maxSteps:350});
    travel+=walked.moved;searches++;
    await sleep(120);
  }
  throw Error('Natural Rat hunt ended without an authoritative monster kill');
}
// Ground piles are selected exclusively from live WS snapshots. A successful
// pickup must also be in the isolated PlayerDB while the socket remains OPEN.
async function collectVisibleLoot(state,map,playerDbPath){
  const piles=[...(state.snapshot.groundItems||[])].filter(pile=>Array.isArray(pile.items)&&pile.items.length);
  const result={piles:0,gold:0,items:0};
  for(const pile of piles){
    if(!(state.snapshot.groundItems||[]).some(g=>g.id===pile.id))continue;
    if(distance(state.snapshot.player,pile)>2){
      await walkTo(state,map,point=>distance(point,pile)<=2,{maxSteps:350});
    }
    assert.ok(Math.hypot(state.snapshot.player.x-pile.x,state.snapshot.player.y-pile.y)<=2,
      'Ground pile must be in natural pickup range');
    const before=state.snapshot.player;
    const startVersion=state.version;
    send(state,'pickup',{groundId:pile.id});
    await until(()=>state.version>startVersion&&!(state.snapshot.groundItems||[]).some(g=>g.id===pile.id),
      'authoritative ground pile removal after official pickup',11000);
    const after=state.snapshot.player;
    assert.ok(after.gold>before.gold||after.inventory.length>before.inventory.length,
      'Real pickup must grant gold or inventory contents');
    const saved=JSON.parse(await fs.readFile(playerDbPath,'utf8'))[characterName];
    assert.equal(saved.gold,after.gold,'Pickup gold must flush immediately before logout');
    assert.deepEqual(saved.inventory,after.inventory,'Pickup inventory must flush immediately before logout');
    const gold=after.gold,inventoryCount=after.inventory.length;
    send(state,'pickup',{groundId:pile.id});
    await sleep(170);
    assert.equal(state.snapshot.player.gold,gold,'Duplicate pickup may not pay gold twice');
    assert.equal(state.snapshot.player.inventory.length,inventoryCount,
      'Duplicate pickup may not grant inventory twice');
    result.piles++;
    result.gold+=gold-before.gold;
    result.items+=inventoryCount-before.inventory.length;
  }
  return result;
}
async function disconnect(state){
  const socket=state.socket;
  const closed=new Promise((resolve,reject)=>{
    if(socket.readyState===WebSocket.CLOSED)return resolve();
    socket.once('close',resolve);
    socket.once('error',reject);
  });
  socket.close(1000,'Desktop quest persistence verification');
  await Promise.race([closed,sleep(10000).then(()=>{throw Error('WebSocket did not close')})]);
}
async function run(){
  const registration=await post('/api/auth/register',{username,password});
  assert.equal(registration.status,201);
  const token=registration.data.sessionToken;
  const created=await post('/api/characters',{name:characterName,vocation:'knight'},token);
  assert.equal(created.status,201);
  WORLD.syncContentMaps(contentDB.get('maps'));
  const current=await connect(token);
  try{
    const q=current.content.quests.find(q=>q.id==='quest_rats');
    const npc=current.content.npcs.find(n=>n.id===q?.npcId);
    assert.ok(q&&npc,'Starter quest and NPC must come from authenticated content_sync');
    const map=WORLD.getMap(npc.mapId);
    assert.ok(map,'Authored quest map must exist');
    const original=current.snapshot.player;
    assert.ok(!original.quests.active.length,'Fresh player must have no active quests');
    assert.equal(original.mapId,npc.mapId,'Starter character must spawn on the quest NPC map');
    const near=pos=>Math.abs(pos.x-Number(npc.posX))<=2&&Math.abs(pos.y-Number(npc.posY))<=2;
    assert.equal(near(original),false,'Test must demonstrate travel instead of starting inside quest range');
    const moved=await walkTo(current,map,near);
    assert.ok(moved.moved>0,'Quest NPC must be reached with legal one-cell move intents');
    assert.ok(near(current.snapshot.player));
    send(current,'quest_accept',{questId:q.id});
    await until(()=>current.snapshot?.player?.quests?.active?.some(entry=>entry.questId===q.id),
      'official quest accepted in authoritative snapshot',11000);
    const accepted=current.snapshot.player;
    assert.equal(accepted.quests.active.find(entry=>entry.questId===q.id).current,0);
    assert.equal(accepted.quests.active.length,1);
    // Prove durability BEFORE disconnect, while the player is still online.
    // The CI realm deliberately sets autosave to 300s; quest acceptance must
    // synchronously flush its real PlayerDB JSON independently of autosave.
    const playerDbPath=process.env.MORIA_PLAYER_DB;
    assert.ok(playerDbPath,'Expected isolated PlayerDB path for crash-window certification');
    const persisted=JSON.parse(await fs.readFile(playerDbPath,'utf8'));
    const stored=persisted[characterName];
    assert.ok(stored,'Accepted quest must create a durable player record immediately');
    assert.ok(stored.quests?.active?.some(entry=>entry.questId===q.id),
      'Quest must be saved immediately while WebSocket is still connected');
    assert.equal(stored.x,accepted.x,'Immediate durable save must include latest player x');
    assert.equal(stored.y,accepted.y,'Immediate durable save must include latest player y');
    // No fake quest_completion; this must remain incomplete until server kills.
    send(current,'quest_complete',{questId:q.id});
    await sleep(180);
    assert.ok(current.snapshot.player.quests.active.some(entry=>entry.questId===q.id));
    const beforeCombat={gold:accepted.gold};
    // A rejected premature hand-in must never pay nor mutate saved state.
    const prematurelySaved=JSON.parse(await fs.readFile(playerDbPath,'utf8'))[characterName];
    assert.equal(prematurelySaved.gold,beforeCombat.gold);
    assert.equal(prematurelySaved.quests?.completed?.includes(q.id),false);
    // This test happens BEFORE close and BEFORE the 300000ms autosave.
    const combat=await huntNaturalRat(current,map,q.id,1);
    const killed=current.snapshot.player;
    const killSaved=JSON.parse(await fs.readFile(playerDbPath,'utf8'))[characterName];
    assert.ok(killSaved,'PlayerDB must contain natural kill rewards while online');
    assert.equal(killSaved.stats?.monstersKilled,killed.stats.monstersKilled,
      'Kill count must be flushed before logout/autosave');
    assert.equal(killSaved.quests?.active?.find(entry=>entry.questId===q.id)?.progress?.rat,1,
      'Rat quest objective must be flushed before logout/autosave');
    assert.equal(killSaved.level,killed.level,'Kill level must persist immediately');
    assert.equal(killSaved.xp,killed.xp,'Kill XP must persist immediately');
    assert.equal(killSaved.x,killed.x,'Last server position x must persist with kill');
    assert.equal(killSaved.y,killed.y,'Last server position y must persist with kill');
    assert.equal(current.socket.readyState,WebSocket.OPEN,'WebSocket must still be open at durability proof');
    const beforeLogout={x:killed.x,y:killed.y,mapId:killed.mapId,level:killed.level,
      xp:killed.xp,gold:killed.gold,monstersKilled:killed.stats.monstersKilled,questId:q.id};
    // Reconnect is a separate check from the before-logout durability proof.
    await disconnect(current);
    const resumed=await connect(token);
    try{
      const fresh=resumed.snapshot.player;
      assert.equal(fresh.name,characterName);
      assert.equal(fresh.mapId,beforeLogout.mapId);
      assert.equal(fresh.x,beforeLogout.x);
      assert.equal(fresh.y,beforeLogout.y);
      assert.equal(fresh.gold,beforeLogout.gold);
      assert.equal(fresh.level,beforeLogout.level);
      assert.equal(fresh.xp,beforeLogout.xp);
      assert.equal(fresh.stats.monstersKilled,beforeLogout.monstersKilled);
      assert.ok(fresh.quests.active.some(entry=>entry.questId===q.id),
        'Quest state must have been reloaded from PlayerDB after disconnect/reconnect');
      assert.equal(fresh.quests.active.find(entry=>entry.questId===q.id).current,1);
      assert.equal(fresh.quests.completed.includes(q.id),false);
      const hunts=[combat],loot=[];
      loot.push(await collectVisibleLoot(resumed,map,playerDbPath));
      for(let progress=2;progress<=Number(q.count);progress++){
        hunts.push(await huntNaturalRat(resumed,map,q.id,progress));
        loot.push(await collectVisibleLoot(resumed,map,playerDbPath));
      }
      assert.equal(resumed.snapshot.player.quests.active.find(entry=>entry.questId===q.id)?.current,
        Number(q.count),'Five real server-owned Rat kills must satisfy the starter objective');
      // Real loot is random. On the improbable no-drop run, keep hunting naturally
      // up to four more rats rather than forging loot or seeding server RNG.
      for(let extra=1;extra<=4&&loot.every(entry=>entry.piles===0);extra++){
        hunts.push(await huntNaturalRat(resumed,map,q.id,Number(q.count)+extra));
        loot.push(await collectVisibleLoot(resumed,map,playerDbPath));
      }
      const collected=loot.reduce((total,entry)=>({
        piles:total.piles+entry.piles,gold:total.gold+entry.gold,items:total.items+entry.items
      }),{piles:0,gold:0,items:0});
      assert.ok(collected.piles>0,'Natural hunt must generate at least one collectible world loot pile');
      const nearNpc=pos=>Math.abs(pos.x-Number(npc.posX))<=2&&Math.abs(pos.y-Number(npc.posY))<=2;
      const returned=await walkTo(resumed,map,nearNpc);
      assert.ok(nearNpc(resumed.snapshot.player),'Quest hand-in requires real NPC proximity');
      const beforeTurnIn=resumed.snapshot.player;
      const turnInVersion=resumed.version;
      send(resumed,'quest_complete',{questId:q.id});
      await until(()=>resumed.version>turnInVersion
        &&resumed.snapshot.player.quests.completed.includes(q.id)
        &&!resumed.snapshot.player.quests.active.some(entry=>entry.questId===q.id),
        'official quest hand-in and committed completion',12000);
      const rewarded=resumed.snapshot.player;
      assert.equal(rewarded.gold,beforeTurnIn.gold+Number(q.rewardGold||0),
        'Quest must pay its authored gold exactly once');
      assert.ok(rewarded.level>beforeTurnIn.level||rewarded.xp!==beforeTurnIn.xp,
        'Quest must award authored experience');
      const completionSaved=JSON.parse(await fs.readFile(playerDbPath,'utf8'))[characterName];
      assert.equal(completionSaved.gold,rewarded.gold,'Quest gold must flush before logout');
      assert.equal(completionSaved.xp,rewarded.xp,'Quest XP must flush before logout');
      assert.equal(completionSaved.level,rewarded.level,'Quest level must flush before logout');
      assert.ok(completionSaved.quests.completed.includes(q.id),
        'Completed quest must persist immediately while WebSocket is open');
      assert.equal(completionSaved.quests.active.some(entry=>entry.questId===q.id),false);
      const awardedGold=rewarded.gold,awardedLevel=rewarded.level,awardedXp=rewarded.xp;
      send(resumed,'quest_complete',{questId:q.id});
      send(resumed,'quest_accept',{questId:q.id});
      await sleep(250);
      assert.equal(resumed.snapshot.player.gold,awardedGold,'Duplicate hand-in must not pay again');
      assert.equal(resumed.snapshot.player.level,awardedLevel,'Duplicate hand-in must not level again');
      assert.equal(resumed.snapshot.player.xp,awardedXp,'Duplicate hand-in must not pay extra XP');
      assert.equal(resumed.snapshot.player.quests.completed.filter(id=>id===q.id).length,1,
        'Starter quest must remain completed exactly once');
      const finalBeforeLogout={gold:rewarded.gold,xp:rewarded.xp,level:rewarded.level,
        x:rewarded.x,y:rewarded.y,mapId:rewarded.mapId,inventory:rewarded.inventory,
        monstersKilled:rewarded.stats.monstersKilled};
      await disconnect(resumed);
      const verified=await connect(token);
      try{
        const final=verified.snapshot.player;
        for(const k of ['gold','xp','level','x','y','mapId'])
          assert.equal(final[k],finalBeforeLogout[k],`Persisted post-quest ${k} must survive relogin`);
        assert.deepEqual(final.inventory,finalBeforeLogout.inventory,
          'Loot inventory must survive the final reconnection');
        assert.equal(final.stats.monstersKilled,finalBeforeLogout.monstersKilled);
        assert.ok(final.quests.completed.includes(q.id),'Completed quest must survive final relogin');
        assert.equal(final.quests.active.some(entry=>entry.questId===q.id),false);
      }finally{await disconnect(verified)}
      const result={kind:'desktop-network-persistence',mode:'real HTTP+WebSocket and PlayerDB',
        character:characterName,questId:q.id,npc:{id:npc.id,mapId:npc.mapId,x:npc.posX,y:npc.posY},
        movement:{toNpc:moved,naturalHunt:combat.travel},position:{x:fresh.x,y:fresh.y},
        questRecovered:true,combatRecovered:true,naturalCombat:combat,
        immediateQuestFlushBeforeLogout:true,immediateKillFlushBeforeLogout:true,
        immediatePickupAndHandInFlushBeforeLogout:true,
        autosaveIntervalMs:300000,
        naturalHunts:hunts.length,realLootCollected:collected,returnToNpc:returned,
        questHandInCompleted:true,duplicateRewardBlocked:true,finalReloginRecovered:true,
        rewards:'official quest reward granted once; ground piles remain transient (not persisted)',
        verifiedAt:new Date().toISOString()};
      await fs.mkdir('artifacts/moria-iso-smoke',{recursive:true});
      await fs.writeFile('artifacts/moria-iso-smoke/online-quest-persistence.json',JSON.stringify(result,null,2));
      console.log('DESKTOP ONLINE QUEST PERSISTENCE PASS:',JSON.stringify(result));
    }finally{await disconnect(resumed)}
  }finally{if(current.socket.readyState===WebSocket.OPEN)await disconnect(current)}
}
run().catch(error=>{console.error('DESKTOP ONLINE QUEST PERSISTENCE FAILED:',error?.stack||error);process.exitCode=1});
