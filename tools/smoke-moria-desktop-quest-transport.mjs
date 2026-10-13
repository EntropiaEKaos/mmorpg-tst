// MOR'IA Desktop — network persistence acceptance test.
// Executes real authenticated HTTP and WebSocket actions against the running
// isolated realm. No engine access to move players or change their stats.
// Imports WORLD only to read the deterministic authored collision map (route
// planning), never to mutate the separately running server process.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { WORLD } from '../server/engine/World.mjs';

const base=(process.env.MORIA_SMOKE_BASE_URL||'http://127.0.0.1:3000').replace(/\/$/,'');
const wsUrl=base.replace(/^http/,'ws')+'/ws';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const cell=(x,y)=>x+','+y;
const directions=[[0,-1],[1,0],[0,1],[-1,0]];
const output='artifacts/moria-iso-smoke/desktop-quest-transport.json';
await mkdir('artifacts/moria-iso-smoke',{recursive:true});
const report={kind:'desktop-real-http-ws-quest-accept-and-relogin',transport:'real HTTP + WebSocket',fixture:'none',headlessBrowser:false,success:false,steps:0,movesAccepted:0,movesRejected:0};
const stamp=Date.now().toString().slice(-9);
const username='path_'+stamp;
const characterName='PathHero'+stamp.slice(-6);
const password='MoriaTransportStrong-'+stamp;

function route(map,from,goal,blocked){
  const q=[{x:from.x,y:from.y}];
  const came=new Map([[cell(from.x,from.y),null]]);
  const portals=new Set((map.portals||[]).map(p=>cell(p.pos.x,p.pos.y)));
  let found=null;
  for(let head=0;head<q.length;head++){
    const pos=q[head],key=cell(pos.x,pos.y);
    if(goal(pos)){found=key;break;}
    for(const [dx,dy] of directions){
      const x=pos.x+dx,y=pos.y+dy,k=cell(x,y);
      if(came.has(k)||blocked.has(k)||portals.has(k)||!map.tiles?.[y]?.[x]?.walkable)continue;
      came.set(k,{previous:key,dx,dy});
      q.push({x,y});
    }
  }
  if(!found)return null;
  const path=[];
  for(let p=found;came.get(p);p=came.get(p).previous){
    const node=came.get(p);
    path.push([node.dx,node.dy]);
  }
  return path.reverse();
}
class Session{
  constructor(socket){
    this.socket=socket;
    this.latest=null;
    this.catalog=null;
    this.authed=false;
    this.waiters=[];
    socket.addEventListener('message',event=>{
      let packet;
      try{packet=JSON.parse(String(event.data))}catch{return}
      if(packet.kind==='snapshot')this.latest=packet.payload;
      if(packet.kind==='content_sync')this.catalog=packet.payload;
      if(packet.kind==='auth_ok')this.authed=true;
      if(packet.kind==='auth_error')this.authError=packet.payload?.text||'auth_error';
      for(const waiter of [...this.waiters]){
        try{
          if(waiter.predicate(this)){
            clearTimeout(waiter.timer);
            this.waiters.splice(this.waiters.indexOf(waiter),1);
            waiter.resolve(this);
          }
        }catch(error){
          clearTimeout(waiter.timer);
          this.waiters.splice(this.waiters.indexOf(waiter),1);
          waiter.reject(error);
        }
      }
    });
  }
  waitFor(predicate,label,timeout=15000){
    if(predicate(this))return Promise.resolve(this);
    return new Promise((resolve,reject)=>{
      const waiter={predicate,resolve,reject,timer:null};
      waiter.timer=setTimeout(()=>{
        this.waiters.splice(this.waiters.indexOf(waiter),1);
        reject(new Error('Timed out waiting for '+label+(this.authError?' ('+this.authError+')':'')));
      },timeout);
      this.waiters.push(waiter);
    });
  }
  intent(type,payload){
    assert.equal(this.socket.readyState,WebSocket.OPEN);
    this.socket.send(JSON.stringify({kind:'intent',payload:{type,payload,timestamp:Date.now()}}));
  }
  async close(){
    if(this.socket.readyState===WebSocket.CLOSED)return;
    const closed=new Promise(resolve=>this.socket.addEventListener('close',resolve,{once:true}));
    this.socket.close(1000,'desktop-journey');
    await Promise.race([closed,sleep(6000).then(()=>{throw Error('Socket close timed out')})]);
  }
}
async function connect(token){
  const ws=new WebSocket(wsUrl);
  await Promise.race([
    new Promise((resolve,reject)=>{
      ws.addEventListener('open',resolve,{once:true});
      ws.addEventListener('error',()=>reject(Error('WS connect failed')),{once:true});
    }),
    sleep(12000).then(()=>{throw Error('WebSocket open timed out')})
  ]);
  const client=new Session(ws);
  ws.send(JSON.stringify({kind:'auth',payload:{sessionToken:token,characterName}}));
  await client.waitFor(s=>s.authed&&s.catalog&&s.latest?.player,'authenticated initial server snapshot',15000);
  return client;
}
async function sendMoveUntilAcknowledged(client,dx,dy){
  const player=client.latest.player;
  const expected={x:player.x+dx,y:player.y+dy};
  for(let attempt=0;attempt<3;attempt++){
    await sleep(125);
    client.intent('move',{dx,dy});
    try{
      await client.waitFor(s=>s.latest?.player?.x===expected.x&&s.latest?.player?.y===expected.y,
        'authoritative movement to '+cell(expected.x,expected.y),400);
      report.movesAccepted++;
      return true;
    }catch{
      report.movesRejected++;
      // Real collision/moving monsters are allowed to deny a step; replan.
    }
  }
  return false;
}
async function main(){
  assert.equal(typeof WebSocket,'function','Node 22 WebSocket required');
  const register=await fetch(base+'/api/auth/register',{method:'POST',
    headers:{'content-type':'application/json'},body:JSON.stringify({username,password})});
  assert.equal(register.status,201,'Register real account');
  const credentials=await register.json();
  const created=await fetch(base+'/api/characters',{method:'POST',
    headers:{'content-type':'application/json',authorization:'Bearer '+credentials.sessionToken},
    body:JSON.stringify({name:characterName,vocation:'knight'})});
  assert.equal(created.status,201,'Create real owned character');
  const client=await connect(credentials.sessionToken);
  let atNpc;
  try{
    const quest=client.catalog.quests.find(q=>q.id==='quest_rats');
    assert.ok(quest,'Server catalog contains quest_rats');
    const npc=client.catalog.npcs.find(n=>n.id===quest.npcId);
    assert.ok(npc,'Server catalog names the quest NPC');
    const nx=Number(npc.posX),ny=Number(npc.posY);
    const near=({x,y})=>Math.abs(x-nx)<=2&&Math.abs(y-ny)<=2;
    assert.equal(client.latest.player.mapId,npc.mapId,'Character begins on NPC map');
    report.npc={id:npc.id,mapId:npc.mapId,x:nx,y:ny};
    const start={x:client.latest.player.x,y:client.latest.player.y};
    assert.equal(near(start),false,'No prepositioning beside NPC');
    report.start=start;
    // Read-only map import; path actions go through real server WebSocket.
    WORLD.syncContentMaps(client.catalog.maps);
    const map=WORLD.getMap(npc.mapId);
    assert.ok(map,'Real authored quest map');
    const temporaryBlocked=new Set();
    const stepsCap=320;
    for(let step=0;step<stepsCap;step++){
      const player=client.latest.player;
      if(near(player)){atNpc=true;break}
      const monsters=(client.latest.monsters||[]).filter(m=>!m.dead);
      const blocked=new Set(monsters.map(m=>cell(m.x,m.y)));
      for(const v of temporaryBlocked)blocked.add(v);
      const path=route(map,player,near,blocked);
      assert.ok(path?.length,'No legal server-world route to '+npc.id+
        ' from '+cell(player.x,player.y)+' after '+step+' steps');
      const [dx,dy]=path[0];
      const arrived=await sendMoveUntilAcknowledged(client,dx,dy);
      if(arrived){
        temporaryBlocked.clear();
        report.steps++;
      }else{
        temporaryBlocked.add(cell(player.x+dx,player.y+dy));
        assert.ok(temporaryBlocked.size<15,'Too many blocked steps at quest approach');
      }
    }
    assert.ok(atNpc,'Reach NPC by legal network moves (not teleport)');
    const before=client.latest.player.quests;
    assert.equal(before.active.some(q=>q.questId===quest.id),false,'Quest starts inactive');
    client.intent('quest_accept',{questId:quest.id});
    await client.waitFor(s=>s.latest?.player?.quests?.active?.some(q=>q.questId===quest.id),
      'server-confirmed quest acceptance in snapshot',10000);
    const accepted=client.latest.player;
    assert.equal(accepted.quests.active.find(q=>q.questId===quest.id).current,0);
    report.accepted={questId:quest.id,x:accepted.x,y:accepted.y,serverConfirmed:true};
    report.preLogout={x:accepted.x,y:accepted.y,mapId:accepted.mapId,
      activeQuests:accepted.quests.active.map(q=>q.questId),gold:accepted.gold};
    await client.close();
    await sleep(220);
    // A new authenticated WS connection loads PlayerDB saved by the first
    // connection's close handler; this is persisted on local isolated storage.
    const second=await connect(credentials.sessionToken);
    try{
      const restored=second.latest.player;
      assert.equal(restored.x,accepted.x,'Character x restored after re-login');
      assert.equal(restored.y,accepted.y,'Character y restored after re-login');
      assert.equal(restored.mapId,accepted.mapId,'Map restored');
      assert.equal(restored.gold,accepted.gold,'Gold restored');
      assert.ok(restored.quests.active.some(q=>q.questId===quest.id),
        'Quest must remain active in persisted server-owned state');
      second.intent('quest_accept',{questId:quest.id});
      await sleep(250);
      assert.equal(second.latest.player.quests.active.filter(q=>q.questId===quest.id).length,1,
        'Repeat acceptance cannot duplicate active quest');
      report.postRelog={x:restored.x,y:restored.y,mapId:restored.mapId,
        activeQuests:restored.quests.active.map(q=>q.questId),gold:restored.gold};
      report.success=true;
      console.log('LIVE DESKTOP TRANSPORT PASS: '+report.steps+
        ' actual WebSocket walk intents, quest accepted in server snapshot, quest and character position restored after logout/relogin.');
    }finally{await second.close();}
  }finally{if(client.socket.readyState!==WebSocket.CLOSED)await client.close();}
}
try{await main()}catch(error){report.error=String(error?.stack||error);console.error('LIVE DESKTOP TRANSPORT FAILED:',report.error);process.exitCode=1}
finally{await writeFile(output,JSON.stringify(report,null,2));}
