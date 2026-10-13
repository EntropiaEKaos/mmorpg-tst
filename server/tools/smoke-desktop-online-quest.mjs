// MOR'IA Desktop P0: real HTTP + WebSocket + persistence journey.
// No browser rendering, synthetic monsters, teleport intents or GM privileges.
// The player walks on authored tiles, accepts the official quest, disconnects,
// and a NEW WebSocket session must recover that quest from PlayerDB on disk.
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
    // No fake quest_completion; this must remain incomplete until server kills.
    send(current,'quest_complete',{questId:q.id});
    await sleep(180);
    assert.ok(current.snapshot.player.quests.active.some(entry=>entry.questId===q.id));
    const beforeLogout={x:accepted.x,y:accepted.y,mapId:accepted.mapId,level:accepted.level,
      gold:accepted.gold,questId:q.id};
    // Server's WebSocket close handler saves to actual isolated PlayerDB file.
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
      assert.ok(fresh.quests.active.some(entry=>entry.questId===q.id),
        'Quest state must have been reloaded from PlayerDB after disconnect/reconnect');
      assert.equal(fresh.quests.active.find(entry=>entry.questId===q.id).current,0);
      assert.equal(fresh.quests.completed.includes(q.id),false);
      const result={kind:'desktop-network-persistence',mode:'real HTTP+WebSocket and PlayerDB',
        character:characterName,questId:q.id,npc:{id:npc.id,mapId:npc.mapId,x:npc.posX,y:npc.posY},
        movement:moved,position:{x:fresh.x,y:fresh.y},questRecovered:true,
        rewards:'not claimed',naturalCombat:'separate server integration test',
        verifiedAt:new Date().toISOString()};
      await fs.mkdir('artifacts/moria-iso-smoke',{recursive:true});
      await fs.writeFile('artifacts/moria-iso-smoke/online-quest-persistence.json',JSON.stringify(result,null,2));
      console.log('DESKTOP ONLINE QUEST PERSISTENCE PASS:',JSON.stringify(result));
    }finally{await disconnect(resumed)}
  }finally{if(current.socket.readyState===WebSocket.OPEN)await disconnect(current)}
}
run().catch(error=>{console.error('DESKTOP ONLINE QUEST PERSISTENCE FAILED:',error?.stack||error);process.exitCode=1});
