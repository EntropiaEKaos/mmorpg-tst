import test from 'node:test';
import assert from 'node:assert/strict';
import { engine } from '../engine/GameState.mjs';
import { WORLD } from '../engine/World.mjs';
import { contentDB } from '../engine/ContentDB.mjs';
import { questEngine } from '../engine/QuestEngine.mjs';

// This is a server-authoritative travel/combat/quest integration test, NOT
// a Chromium playthrough. It never injects monsters, teleports by intent,
// manufactures ground loot, or changes the player's damage/level/stats.
// The test controls only simulated elapsed cooldown time and loot RNG.
const STEPS=[[0,-1],[1,0],[0,1],[-1,0]];
const coord=(x,y)=>`${x},${y}`;

function findPath(map,player,goal,monsters){
  const blocked=new Set(monsters.filter(m=>!m.dead).map(m=>coord(m.x,m.y)));
  const portals=new Set((map.portals||[]).map(p=>coord(p.pos.x,p.pos.y)));
  const queue=[{x:player.x,y:player.y}];
  const parents=new Map([[coord(player.x,player.y),null]]);
  let end=null;
  for(let head=0;head<queue.length;head++){
    const p=queue[head],key=coord(p.x,p.y);
    if(goal(p)){end=key;break;}
    for(const [dx,dy] of STEPS){
      const x=p.x+dx,y=p.y+dy,k=coord(x,y);
      if(parents.has(k)||!map.tiles?.[y]?.[x]?.walkable||blocked.has(k)||portals.has(k))continue;
      parents.set(k,{key,dx,dy});
      queue.push({x,y});
    }
  }
  if(end===null)return null;
  const path=[];
  for(let key=end;parents.get(key);){
    const node=parents.get(key);
    path.push([node.dx,node.dy]);
    key=node.key;
  }
  return path.reverse();
}

function walk(player,id,path){
  for(const [dx,dy] of path){
    const before={x:player.x,y:player.y};
    // Simulate enough elapsed server ticks while validating EVERY real
    // one-cell move intent and the authoritative collision map.
    player.lastMove=0;
    assert.equal(engine.processIntent(id,{type:'move',payload:{dx,dy}}),true,
      `Legitimate step from ${before.x},${before.y} by ${dx},${dy} denied`);
    assert.equal(player.x,before.x+dx);
    assert.equal(player.y,before.y+dy);
  }
}

test('desktop natural journey: walk to real quest NPC, hunt spawned rats, collect generated loot, reward once',()=>{
  const quest=contentDB.get('quests').find(q=>q.id==='quest_rats');
  const npc=contentDB.get('npcs').find(n=>n.id===quest?.npcId);
  assert.ok(quest&&npc,'Starter quest and its NPC must exist in the server catalog');
  const map=WORLD.getMap(npc.mapId);
  assert.ok(map);
  assert.equal(String(quest.target).toLowerCase(),'rat');
  const id=`desktop_natural_${process.pid}_${Date.now()}`;
  const player=engine.playerConnect(id,'NaturalJourney','knight',null);
  const monsters=engine.monstersByMap.get(npc.mapId)||[];
  const originals=monsters.map(m=>({...m}));
  const groundOriginal=(engine.groundItemsByMap.get(npc.mapId)||[]).slice();
  const originalRandom=Math.random;
  let steps=0,kills=0,groundCollected=0;
  try{
    assert.equal(player.mapId,npc.mapId,'Starter quest NPC must be on starter map');
    const first=engine.getSnapshot(id);
    assert.ok(first?.player?.quests);
    const npcGoal=({x,y})=>Math.abs(x-Number(npc.posX))<=2&&Math.abs(y-Number(npc.posY))<=2;
    const approach=findPath(map,player,npcGoal,monsters);
    assert.ok(approach,'Server collision map must have a traversable path from spawn to quest NPC');
    walk(player,id,approach);steps+=approach.length;
    assert.ok(npcGoal(player));
    const accept={type:'quest_accept',payload:{questId:quest.id}};
    assert.equal(engine.processIntent(id,accept),true,'NPC visit must activate authentic quest');
    assert.equal(engine.getSnapshot(id).player.quests.active.find(q=>q.questId===quest.id)?.current,0);
    assert.equal(engine.processIntent(id,accept),false,'Cannot accept same quest twice');

    const initialMonstersKilled=player.stats.monstersKilled;
    let pickupGold=0;
    let inventoryCount=0;
    // Rat positions are those actually spawned by WORLD + ContentDB. The
    // encounter is NOT inserted by this test, and its hit points are natural.
    for(let i=0;i<Number(quest.count);i++){
      const candidates=monsters.filter(m=>!m.dead&&m.name==='Rat').map(m=>({
        mob:m,path:findPath(map,player,({x,y})=>Math.abs(x-m.x)+Math.abs(y-m.y)<=1,monsters)
      })).filter(c=>c.path!==null).sort((a,b)=>a.path.length-b.path.length);
      assert.ok(candidates.length,`No reachable natural rat encounter after ${kills} kills`);
      const {mob,path}=candidates[0];
      walk(player,id,path);steps+=path.length;
      assert.ok(Math.abs(player.x-mob.x)+Math.abs(player.y-mob.y)<=1);
      const groundBefore=new Set((engine.groundItemsByMap.get(player.mapId)||[]).map(g=>g.id));
      const hpBefore=mob.hp;
      let hits=0;
      // Hold actual server combat rules, normal base attack & normal monster HP.
      // Fixed RNG makes loot testing repeatable, rather than fabricating drops.
      Math.random=()=>0.2;
      try{
        while(!mob.dead&&hits++<35){
          player.lastAttack=0;
          assert.equal(engine.processIntent(id,{type:'attack',payload:{monsterId:mob.id}}),true,
            'Actual class basic attack must land on adjacent spawned Rat');
        }
      }finally{Math.random=originalRandom;}
      assert.ok(mob.dead,`Natural Rat HP ${hpBefore} not exhausted by normal attacks`);
      kills++;
      assert.equal(engine.getSnapshot(id).player.quests.active.find(q=>q.questId===quest.id)?.current,kills);
      const newDrops=(engine.groundItemsByMap.get(player.mapId)||[]).filter(g=>!groundBefore.has(g.id));
      assert.ok(newDrops.length,'Engine loot RNG must generate a real ground pile on kill');
      for(const pile of newDrops){
        assert.ok(Array.isArray(pile.items)&&pile.items.length);
        const oldGold=player.gold,oldItems=player.inventory.length;
        assert.ok(Math.hypot(player.x-pile.x,player.y-pile.y)<=2);
        assert.equal(engine.processIntent(id,{type:'pickup',payload:{groundId:pile.id}}),true);
        pickupGold+=player.gold-oldGold;
        inventoryCount+=player.inventory.length-oldItems;
        groundCollected++;
        assert.equal(engine.processIntent(id,{type:'pickup',payload:{groundId:pile.id}}),false,
          'The same authentic drop cannot be collected again');
      }
    }
    assert.ok(steps>0,'Must move using real one-tile intents, not a teleport');
    assert.equal(player.stats.monstersKilled-initialMonstersKilled,Number(quest.count));
    assert.ok(groundCollected>0&&(pickupGold>0||inventoryCount>0));

    const completed=engine.getSnapshot(id).player.quests.active.find(q=>q.questId===quest.id);
    assert.equal(completed.current,completed.needed);
    const returnPath=findPath(map,player,npcGoal,monsters);
    assert.ok(returnPath,'Return route to quest NPC must remain accessible after hunting');
    walk(player,id,returnPath);steps+=returnPath.length;
    const beforeGold=player.gold,beforeXP=player.xp,beforeLevel=player.level;
    const finish={type:'quest_complete',payload:{questId:quest.id}};
    assert.equal(engine.processIntent(id,finish),true);
    assert.equal(player.gold,beforeGold+Number(quest.rewardGold||0));
    assert.ok(player.level>beforeLevel||player.xp!==beforeXP,
      'Quest XP must change player progression (possibly through a level-up)');
    const finished=engine.getSnapshot(id).player.quests;
    assert.ok(finished.completed.includes(quest.id));
    assert.equal(finished.active.some(q=>q.questId===quest.id),false);
    assert.equal(engine.processIntent(id,finish),false);
    assert.equal(player.gold,beforeGold+Number(quest.rewardGold||0),'No duplicate reward');

    const saved=questEngine.exportState(id);
    questEngine.clearPlayer(id);
    questEngine.restorePlayer(id,saved);
    assert.ok(engine.getSnapshot(id).player.quests.completed.includes(quest.id),
      'Quest completion round-trips across serialization/restoration');
    console.log(`NATURAL DESKTOP JOURNEY: ${steps} real legal movement intents, ${kills} WORLD-spawned rats, ${groundCollected} engine loot piles collected; reward paid once; quest state restored`);
  } finally {
    Math.random=originalRandom;
    engine.monstersByMap.set(npc.mapId,originals);
    engine.groundItemsByMap.set(npc.mapId,groundOriginal);
    engine.playerDisconnect(id);
  }
});
