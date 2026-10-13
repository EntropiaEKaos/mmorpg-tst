import test from 'node:test';
import assert from 'node:assert/strict';
import { engine } from '../engine/GameState.mjs';
import { contentDB } from '../engine/ContentDB.mjs';
import { questEngine } from '../engine/QuestEngine.mjs';

// Server-level gameplay integration, deliberately distinct from Chromium UI E2E.
// The setup positions the player and controlled rat encounters; ALL actions,
// progression, loot collection and rewards still run via authoritative intents.
test('desktop P0: NPC quest → combat kills → loot pickup → unique reward → restored completion', () => {
  const quest=contentDB.get('quests').find(q=>q.id==='quest_rats');
  const npc=contentDB.get('npcs').find(n=>n.id===quest?.npcId);
  assert.ok(quest&&npc,'Use the real rat quest and its real NPC');
  assert.equal(String(quest.target).toLowerCase(),'rat');
  assert.ok(Number(quest.count)>0&&Number(quest.count)<=20);
  const id=`desktop_journey_${process.pid}_${Date.now()}`;
  const player=engine.playerConnect(id,'DesktopJourney','knight',null);
  const mapId=String(npc.mapId);
  const mobs=engine.monstersByMap.get(mapId)||[];
  const originalMobs=mobs.slice();
  const originalGround=(engine.groundItemsByMap.get(mapId)||[]).slice();
  try{
    player.mapId=mapId;
    player.x=Number(npc.posX)+9;
    player.y=Number(npc.posY)+9;
    const accept={type:'quest_accept',payload:{questId:quest.id}};
    const complete={type:'quest_complete',payload:{questId:quest.id}};
    assert.equal(engine.processIntent(id,accept),false,'Distant quest giver denies acceptance');
    assert.equal(engine.getSnapshot(id).player.quests.active.length,0);

    // Only fixture positioning bypasses walking; NO client may teleport
    // through an intent, and server quest distance rules stay intact.
    player.x=Number(npc.posX);
    player.y=Number(npc.posY);
    assert.equal(engine.processIntent(id,accept),true);
    assert.equal(engine.processIntent(id,accept),false,'No duplicate acceptance');
    assert.equal(engine.processIntent(id,complete),false,'No reward until objective fulfilled');
    const first=engine.getSnapshot(id);
    assert.equal(first.player.quests.active[0].questId,quest.id);
    assert.equal(first.player.quests.active[0].current,0);

    const savedInProgress=questEngine.exportState(id);
    questEngine.clearPlayer(id);
    questEngine.restorePlayer(id,savedInProgress);
    assert.equal(engine.getSnapshot(id).player.quests.active[0].current,0,
      'Active quest survives an export/restore round trip');

    // Controlled monsters use a real canonical target name while keeping
    // encounter health deterministic. No result is fabricated by the UI.
    const template=(engine.monstersByMap.get('eldoria')||[]).find(m=>m.name==='Rat');
    assert.ok(template,'Starter world must spawn canonical rats');
    const kills=Number(quest.count);
    const beforeKills=player.stats.monstersKilled;
    player.attack=10000; // fixture acceleration, not a production balance claim
    for(let index=0;index<kills;index++){
      const mob={...template,
        id:`${id}_rat_${index}`,name:'Rat',mapId,
        x:player.x+1,y:player.y,
        hp:1,maxHp:1,defense:0,dead:false,
        noRespawn:true,respawnAt:0,lastAttack:0,lastMove:0,
      };
      mobs.push(mob);
      player.lastAttack=0;
      assert.equal(engine.processIntent(id,{type:'attack',payload:{monsterId:mob.id}}),true,
        `Server accepted kill ${index+1}`);
      assert.equal(mob.dead,true,`Server killed rat ${index+1}`);
      assert.equal(engine.getSnapshot(id).player.quests.active[0].current,index+1,
        'Quest progress must follow actual server kills');
      mobs.pop();
    }
    assert.equal(player.stats.monstersKilled-beforeKills,kills);
    assert.equal(engine.getSnapshot(id).player.quests.active[0].needed,kills);
    assert.equal(engine.getSnapshot(id).player.quests.active[0].current,kills);

    // Deterministic loot fixture proves transport-to-inventory server logic.
    // Random monster drops are deliberately NOT assumed to exist.
    const ground={id:`${id}_loot`,x:player.x+1,y:player.y,
      items:[{id:'journey-herb',name:'Journey Herb',quantity:2,type:'material'}],
      expireAt:Date.now()+60_000};
    engine.groundItemsByMap.set(mapId,[ground]);
    const beforeInventory=player.inventory.length;
    assert.equal(engine.processIntent(id,{type:'pickup',payload:{groundId:ground.id}}),true);
    assert.equal(player.inventory.length,beforeInventory+1);
    assert.equal(player.inventory.at(-1).name,'Journey Herb');
    assert.equal(engine.getSnapshot(id).groundItems.some(g=>g.id===ground.id),false);
    assert.equal(engine.processIntent(id,{type:'pickup',payload:{groundId:ground.id}}),false,
      'Cannot collect the same ground bundle twice');

    // Turning in away from the NPC is still rejected AFTER the combat.
    const beforeReward=player.gold;
    player.x=Number(npc.posX)+9;player.y=Number(npc.posY)+9;
    assert.equal(engine.processIntent(id,complete),false);
    assert.equal(player.gold,beforeReward);
    player.x=Number(npc.posX);player.y=Number(npc.posY);
    assert.equal(engine.processIntent(id,complete),true);
    assert.equal(player.gold,beforeReward+Number(quest.rewardGold||0));
    const done=engine.getSnapshot(id);
    assert.ok(done.player.quests.completed.includes(quest.id));
    assert.ok(!done.player.quests.active.some(q=>q.questId===quest.id));
    assert.equal(engine.processIntent(id,complete),false,'Quest cannot be claimed twice');
    assert.equal(player.gold,beforeReward+Number(quest.rewardGold||0));
    assert.equal(engine.processIntent(id,accept),false,'Finished quest cannot restart');

    const saved=questEngine.exportState(id);
    questEngine.clearPlayer(id);
    questEngine.restorePlayer(id,saved);
    assert.ok(engine.getSnapshot(id).player.quests.completed.includes(quest.id),
      'Quest completion persists through state serialization and restoration');
    assert.equal(engine.processIntent(id,complete),false);
  } finally {
    engine.monstersByMap.set(mapId,originalMobs);
    engine.groundItemsByMap.set(mapId,originalGround);
    engine.playerDisconnect(id);
  }
});
