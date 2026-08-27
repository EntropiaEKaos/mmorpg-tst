import test from 'node:test';
import assert from 'node:assert/strict';
import { engine } from '../engine/GameState.mjs';
import { VOCATIONS } from '../engine/Vocations.mjs';
import { WORLD } from '../engine/World.mjs';
import { questEngine } from '../engine/QuestEngine.mjs';
import { contentDB } from '../engine/ContentDB.mjs';
import { buildEquipmentLootPool, rollLoot } from '../engine/Items.mjs';

let seq = 0;
function makePlayer(vocation = 'knight') {
  const id = `test_${process.pid}_${Date.now()}_${seq++}`;
  const player = engine.playerConnect(id, `Tester${seq}`, vocation, null);
  return { id, player };
}

function cleanup(id) {
  engine.playerDisconnect(id);
}

test('movement rejects teleport, diagonal and fractional intents', () => {
  const { id, player } = makePlayer();
  try {
    const before = { x: player.x, y: player.y };
    assert.equal(engine.processIntent(id, { type: 'move', payload: { dx: 20, dy: 0 } }), false);
    assert.equal(engine.processIntent(id, { type: 'move', payload: { dx: 1, dy: 1 } }), false);
    assert.equal(engine.processIntent(id, { type: 'move', payload: { dx: 0.5, dy: 0 } }), false);
    assert.deepEqual({ x: player.x, y: player.y }, before);
  } finally {
    cleanup(id);
  }
});

test('travel requires a real portal, ignores client coordinates and enforces level gates', () => {
  const { id, player } = makePlayer();
  try {
    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'frostpeak', spawnX: 1, spawnY: 1 } }), false);
    assert.equal(player.mapId, 'eldoria');
    player.x = 10; player.y = 40; player.level = 8;
    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'frostpeak', spawnX: 1, spawnY: 1 } }), true);
    assert.equal(player.mapId, 'frostpeak');
    assert.deepEqual({ x: player.x, y: player.y }, { x: 70, y: 40 });
    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'hacked-map' } }), false);
    player.mapId = 'shadowfen'; player.x = 10; player.y = 10; player.level = 24;
    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'voidlands' } }), false);
    player.level = 25;
    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'voidlands' } }), true);
    assert.deepEqual({ x: player.x, y: player.y }, { x: 70, y: 70 });
  } finally { cleanup(id); }
});

test('equipment bonuses are applied exactly once', () => {
  const { id, player } = makePlayer();
  try {
    const baseAttack = player.attack;
    const baseDefense = player.defense;
    player.inventory = [{
      id: 'test_sword',
      type: 'equipment',
      quantity: 1,
      equipment: { slot: 'weapon', level: 1, attack: 7, defense: 2 },
    }];

    assert.equal(engine.processIntent(id, { type: 'equip', payload: { itemId: 'test_sword' } }), true);
    assert.equal(player.attack, baseAttack);
    assert.equal(player.defense, baseDefense);

    const derived = engine.computeDerivedStats(player);
    assert.equal(derived.totalAttack, baseAttack + 7);
    assert.equal(derived.totalDefense, baseDefense + 2);
  } finally {
    cleanup(id);
  }
});

test('talents reject unknown IDs, enforce prerequisites and max ranks', () => {
  const { id, player } = makePlayer();
  try {
    player.level = 30;
    assert.equal(engine.processIntent(id, { type: 'talent', payload: { talentId: 'admin_power' } }), false);
    assert.equal(engine.processIntent(id, { type: 'talent', payload: { talentId: 'precision' } }), false);
    assert.equal(engine.processIntent(id, { type: 'talent', payload: { talentId: 'might' } }), true);
    assert.equal(engine.processIntent(id, { type: 'talent', payload: { talentId: 'precision' } }), true);

    assert.equal(engine.processIntent(id, { type: 'talent', payload: { talentId: 'toughness' } }), true);
    assert.equal(engine.processIntent(id, { type: 'talent', payload: { talentId: 'resilience' } }), true);
    assert.equal(engine.processIntent(id, { type: 'talent', payload: { talentId: 'resilience' } }), true);
    assert.equal(engine.processIntent(id, { type: 'talent', payload: { talentId: 'resilience' } }), true);
    assert.equal(engine.processIntent(id, { type: 'talent', payload: { talentId: 'resilience' } }), false);
    assert.equal(player.talents.resilience, 3);
  } finally {
    cleanup(id);
  }
});

test('authoritative talent reset charges gold and rebuilds base stats', () => {
  const { id, player } = makePlayer('knight');
  try {
    const voc = VOCATIONS.knight;
    player.level = 10;
    player.gold = 500;
    // Rebuild the level-derived base to mirror a real level 10 player.
    player.maxHp = voc.baseHp + 9 * voc.hpPerLevel;
    player.maxMana = voc.baseMana + 9 * voc.manaPerLevel;
    player.attack = voc.baseAttack + 9 * voc.atkPerLevel;
    player.defense = voc.baseDefense + 9 * voc.defPerLevel;
    player.magic = voc.baseMagic + 9 * voc.magPerLevel;
    player.hp = player.maxHp;
    player.mana = player.maxMana;

    assert.equal(engine.processIntent(id, { type: 'talent', payload: { talentId: 'vitality' } }), true);
    assert.equal(player.maxHp, voc.baseHp + 9 * voc.hpPerLevel + 10);

    assert.equal(engine.processIntent(id, { type: 'talent_reset', payload: {} }), true);
    assert.equal(player.gold, 0);
    assert.deepEqual(player.talents, {});
    assert.equal(player.maxHp, voc.baseHp + 9 * voc.hpPerLevel);
    assert.equal(player.attack, voc.baseAttack + 9 * voc.atkPerLevel);
  } finally {
    cleanup(id);
  }
});


test('map events remain available to every snapshot until explicitly consumed', () => {
  const a = makePlayer(); const b = makePlayer();
  try {
    engine.emitEvent('eldoria', { kind: 'damage', targetId: 'monster_shared', text: 'shared-event' });
    assert.equal(engine.getSnapshot(a.id).events.some(e => e.text === 'shared-event'), true);
    assert.equal(engine.getSnapshot(b.id).events.some(e => e.text === 'shared-event'), true);
    engine.consumeEvents('eldoria');
    assert.equal(engine.getSnapshot(a.id).events.length, 0);
    assert.equal(engine.getSnapshot(b.id).events.length, 0);
  } finally { cleanup(a.id); cleanup(b.id); }
});

test('server portal tiles are deterministic and walkable', () => {
  const map = WORLD.getMap('eldoria');
  assert.equal(map.tiles[40][10].type, 'path');
  assert.equal(map.tiles[40][10].walkable, true);
  assert.equal(map.portals.find(p => p.targetMap === 'frostpeak').targetSpawn.x, 70);
});

test('authoritative drop and unequip preserve item ownership', () => {
  const { id, player } = makePlayer();
  try {
    const sword = player.inventory.find(i => i.equipment);
    assert.ok(sword);
    assert.equal(engine.processIntent(id, { type: 'equip', payload: { itemId: sword.id } }), true);
    assert.ok(player.equipment.weapon);
    assert.equal(engine.processIntent(id, { type: 'unequip', payload: { slot: 'weapon' } }), true);
    const returned = player.inventory.find(i => i.equipment?.slot === 'weapon');
    assert.ok(returned);
    assert.equal(engine.processIntent(id, { type: 'drop', payload: { itemId: returned.id } }), true);
    assert.equal(player.inventory.some(i => i.id === returned.id), false);
    assert.ok((engine.groundItemsByMap.get(player.mapId) || []).find(g => g.items.some(i => i.name === returned.name)));
  } finally { cleanup(id); }
});


test('private player events are filtered from other players', () => {
  const a = makePlayer(); const b = makePlayer();
  try {
    engine.emitEvent('eldoria', { kind: 'system', targetId: a.id, text: 'private-a' });
    engine.emitEvent('eldoria', { kind: 'damage', targetId: 'monster_public', text: 'public-hit' });
    assert.equal(engine.getSnapshot(a.id).events.some(e => e.text === 'private-a'), true);
    assert.equal(engine.getSnapshot(b.id).events.some(e => e.text === 'private-a'), false);
    assert.equal(engine.getSnapshot(b.id).events.some(e => e.text === 'public-hit'), true);
  } finally { engine.consumeEvents('eldoria'); cleanup(a.id); cleanup(b.id); }
});

test('quest state round-trips through authoritative persistence shape', () => {
  const { id } = makePlayer();
  try {
    const quest = contentDB.get('quests')[0];
    assert.ok(quest);
    questEngine.restorePlayer(id, {
      active: [{ questId: quest.id, progress: { [quest.target]: 1 }, startedAt: 12345 }],
      completed: [],
    });
    const state = questEngine.exportState(id);
    assert.equal(state.active.length, 1);
    assert.equal(state.active[0].questId, quest.id);
    assert.equal(state.active[0].progress[quest.target], Math.min(1, quest.count));
  } finally { cleanup(id); }
});


test('quest accept and completion require authoritative NPC proximity when linked', () => {
  const quest = contentDB.get('quests').find(entry => {
    const npc = contentDB.get('npcs').find(candidate => candidate.id === entry.npcId);
    return npc && WORLD.getMap(npc.mapId) && Number.isFinite(Number(npc.posX)) && Number.isFinite(Number(npc.posY));
  });
  assert.ok(quest);
  const npc = contentDB.get('npcs').find(entry => entry.id === quest.npcId);
  assert.ok(npc);

  const { id, player } = makePlayer();
  try {
    player.mapId = npc.mapId;
    player.x = Math.max(0, Number(npc.posX) + 8);
    player.y = Math.max(0, Number(npc.posY) + 8);
    assert.equal(engine.processIntent(id, { type: 'quest_accept', payload: { questId: quest.id } }), false);
    assert.equal(questEngine.exportState(id).active.length, 0);

    player.x = Number(npc.posX);
    player.y = Number(npc.posY);
    assert.equal(engine.processIntent(id, { type: 'quest_accept', payload: { questId: quest.id } }), true);

    questEngine.restorePlayer(id, {
      active: [{ questId: quest.id, progress: { [quest.target]: quest.count }, startedAt: Date.now() }],
      completed: [],
    });
    const goldBefore = player.gold;
    player.x = Math.max(0, Number(npc.posX) + 8);
    player.y = Math.max(0, Number(npc.posY) + 8);
    assert.equal(engine.processIntent(id, { type: 'quest_complete', payload: { questId: quest.id } }), false);
    assert.equal(player.gold, goldBefore);
    assert.equal(questEngine.exportState(id).completed.includes(quest.id), false);

    player.x = Number(npc.posX);
    player.y = Number(npc.posY);
    assert.equal(engine.processIntent(id, { type: 'quest_complete', payload: { questId: quest.id } }), true);
    assert.equal(questEngine.exportState(id).completed.includes(quest.id), true);
  } finally {
    cleanup(id);
  }
});

test('full potions are not consumed and quest XP can level the player', () => {
  const { id, player } = makePlayer();
  try {
    const potion = player.inventory.find(i => i.type === 'potion' && i.name.includes('Health'));
    assert.ok(potion);
    const before = potion.quantity;
    player.hp = player.maxHp;
    assert.equal(engine.processIntent(id, { type: 'use_item', payload: { itemId: potion.id } }), false);
    assert.equal(potion.quantity, before);

    const quest = contentDB.get('quests').find(q => Number(q.rewardXp) > 0);
    assert.ok(quest);
    questEngine.restorePlayer(id, {
      active: [{ questId: quest.id, progress: { [quest.target]: quest.count }, startedAt: Date.now() }],
      completed: [],
    });
    const questNpc = contentDB.get('npcs').find(npc => npc.id === quest.npcId);
    if (questNpc && WORLD.getMap(questNpc.mapId) && Number.isFinite(Number(questNpc.posX)) && Number.isFinite(Number(questNpc.posY))) {
      player.mapId = questNpc.mapId;
      player.x = Number(questNpc.posX);
      player.y = Number(questNpc.posY);
    }
    player.xp = Math.max(0, player.xpNext - Number(quest.rewardXp));
    assert.equal(engine.processIntent(id, { type: 'quest_complete', payload: { questId: quest.id } }), true);
    assert.ok(player.level >= 2);
  } finally { cleanup(id); }
});

test('mounting is server-gated by progression', () => {
  const { id, player } = makePlayer();
  try {
    player.level = 4;
    assert.equal(engine.processIntent(id, { type: 'mount', payload: {} }), false);
    assert.equal(player.mounted, false);
    player.level = 5;
    assert.equal(engine.processIntent(id, { type: 'mount', payload: {} }), true);
    assert.equal(player.mounted, true);
  } finally { cleanup(id); }
});



test('authoritative buff spells apply effects without damaging monsters', () => {
  const { id, player } = makePlayer('knight');
  const monsters = engine.monstersByMap.get(player.mapId);
  const dummy = {
    id: `buff_dummy_${Date.now()}_${Math.random()}`, name: 'Buff Dummy', emoji: '🎯',
    x: player.x + 1, y: player.y, spawnX: player.x + 1, spawnY: player.y,
    hp: 100, maxHp: 100, attack: 0, defense: 0, xp: 0, level: 1, type: 'normal',
    dead: false, lastAttack: 0, lastMove: 0, speed: 9999, respawnAt: 0,
  };
  monsters.push(dummy);
  try {
    player.level = 20;
    player.mana = 999;
    const beforeHp = dummy.hp;
    const beforeReduction = engine.computeDerivedStats(player).damageReduction;
    assert.equal(engine.processIntent(id, { type: 'cast', payload: { spellIndex: 3 } }), true);
    assert.equal(dummy.hp, beforeHp);
    assert.ok(player.buffs.some(buff => buff.type === 'shield' && buff.expiresAt > Date.now()));
    assert.ok(engine.computeDerivedStats(player).damageReduction > beforeReduction);
  } finally {
    const idx = monsters.indexOf(dummy);
    if (idx >= 0) monsters.splice(idx, 1);
    cleanup(id);
  }
});

test('successful authoritative attacks persist the selected target', () => {
  const { id, player } = makePlayer();
  const monsters = engine.monstersByMap.get(player.mapId);
  const monster = {
    id: `target_${Date.now()}_${Math.random()}`, name: 'Target Dummy', emoji: '🎯',
    x: player.x + 1, y: player.y, spawnX: player.x + 1, spawnY: player.y,
    hp: 9999, maxHp: 9999, attack: 0, defense: 0, xp: 0, level: 1, type: 'normal',
    dead: false, lastAttack: 0, lastMove: 0, speed: 9999, respawnAt: 0,
  };
  monsters.push(monster);
  try {
    player.lastAttack = 0;
    assert.equal(engine.processIntent(id, { type: 'attack', payload: { monsterId: monster.id } }), true);
    assert.equal(player.targetId, monster.id);
  } finally {
    const idx = monsters.indexOf(monster);
    if (idx >= 0) monsters.splice(idx, 1);
    cleanup(id);
  }
});


test('authoritative content monsters spawn, fight and reconcile cleanly', () => {
  const mapId = 'eldoria';
  const map = WORLD.getMap(mapId);
  const originalCatalog = contentDB.get('monsters').map(monster => ({ ...monster }));
  const baseline = (engine.monstersByMap.get(mapId) || []).filter(monster => !monster.contentSourceId);
  let spawn = null;
  for (let attempt = 0; attempt < 300 && !spawn; attempt++) {
    const candidate = WORLD.findWalkableSpawn(map);
    if (!baseline.some(monster => !monster.dead && monster.x === candidate.x && monster.y === candidate.y)) spawn = candidate;
  }
  assert.ok(spawn);

  const sourceId = `admin_live_${Date.now()}_${Math.random()}`;
  engine.syncContentMonsters([{
    id: sourceId, name: 'Admin Live Beast', emoji: '🧪', mapId,
    posX: spawn.x, posY: spawn.y, count: 1,
    hp: 25, attack: 3, defense: 0, xp: 7, level: 2,
    type: 'elite', color: '#abcdef', size: 1.1, speed: 900,
  }]);

  const live = (engine.monstersByMap.get(mapId) || []).find(monster => monster.contentSourceId === sourceId);
  assert.ok(live);
  assert.equal(live.name, 'Admin Live Beast');
  assert.equal(live.x, spawn.x);
  assert.equal(live.y, spawn.y);
  assert.equal(live.type, 'elite');

  const { id, player } = makePlayer();
  try {
    player.x = Math.max(1, live.x - 1);
    player.y = live.y;
    player.attack = 9999;
    player.lastAttack = 0;
    live.hp = 1;
    assert.equal(engine.processIntent(id, { type: 'attack', payload: { monsterId: live.id } }), true);
    assert.equal(live.dead, true);
    assert.ok(live.respawnAt > Date.now());
  } finally {
    cleanup(id);
    engine.syncContentMonsters(originalCatalog);
  }

  assert.equal((engine.monstersByMap.get(mapId) || []).some(monster => monster.contentSourceId === sourceId), false);
});


test('authoritative content items override and extend the live loot pool', () => {
  const originalCatalog = contentDB.get('items').map(item => ({ ...item }));
  const custom = {
    id: `admin_relic_${Date.now()}_${Math.random()}`,
    name: 'Admin Relic', icon: '🗡', slot: 'weapon', rarity: 'legendary',
    attack: 777, level: 1, value: 12345, description: 'Server-owned test relic',
  };
  const override = {
    id: 'steel_sword', name: 'Steel Sword+', icon: '⚔', slot: 'weapon',
    rarity: 'epic', attack: 321, level: 1, value: 999,
  };

  engine.syncContentItems([custom, override]);
  const pool = buildEquipmentLootPool(engine.contentItems);
  assert.equal(pool.filter(item => item.id === 'steel_sword').length, 1);
  assert.equal(pool.find(item => item.id === 'steel_sword').attack, 321);
  assert.equal(pool.find(item => item.id === custom.id).attack, 777);

  const originalRandom = Math.random;
  const rolls = [1, 1, 0, 0.999999];
  Math.random = () => rolls.length ? rolls.shift() : 0.999999;
  try {
    const drops = rollLoot({ type: 'boss', level: 100 }, 0, engine.contentItems);
    const equipmentDrop = drops.find(item => item.type === 'equipment');
    assert.ok(equipmentDrop);
    assert.equal(equipmentDrop.equipment.id, custom.id);
    assert.equal(equipmentDrop.equipment.attack, 777);
  } finally {
    Math.random = originalRandom;
    engine.syncContentItems(originalCatalog);
  }
});


test('authoritative content spells override base slots and execute custom spells', () => {
  const originalCatalog = contentDB.get('spells').map(spell => ({ ...spell }));
  try {
    engine.syncContentSpells([
      { id: 'fireball', name: 'Inferno Admin', icon: '🔥', vocation: 'sorcerer', type: 'attack', mana: 33, cooldown: 777, damage: 444, range: 6, color: '#ff2200', levelRequired: 5 },
      { id: 'admin_heal', name: 'Admin Mend', icon: '💚', vocation: 'sorcerer', type: 'heal', mana: 7, cooldown: 500, damage: 40, range: 0, color: '#22ff88', levelRequired: 1 },
      { id: 'admin_shield', name: 'Admin Aegis', icon: '🛡', vocation: 'sorcerer', type: 'buff', buffType: 'shield', buffDuration: 4000, buffValue: 33, mana: 9, cooldown: 500, damage: 0, range: 0, color: '#66ccff', levelRequired: 1 },
      { id: 'bad_summon', name: 'Unsupported Summon', vocation: 'sorcerer', type: 'summon', mana: 0, cooldown: 500, damage: 0, range: 0 },
    ]);

    const spells = engine.getSpellList('sorcerer');
    assert.equal(spells[1].name, 'Inferno Admin');
    assert.equal(spells[1].damage, 444);
    assert.equal(spells.filter(spell => spell.contentSpellId === 'fireball').length, 1);
    assert.equal(spells.some(spell => spell.name === 'Unsupported Summon'), false);
    const customIndex = spells.findIndex(spell => spell.contentSpellId === 'admin_heal');
    const buffIndex = spells.findIndex(spell => spell.contentSpellId === 'admin_shield');
    assert.ok(customIndex >= 4);
    assert.ok(buffIndex > customIndex);
    assert.equal(spells[buffIndex].buffType, 'shield');
    assert.equal(spells[buffIndex].buffDuration, 4000);
    assert.equal(spells[buffIndex].buffValue, 33);

    const { id, player } = makePlayer('sorcerer');
    try {
      player.level = 20;
      player.maxHp = 200;
      player.hp = 100;
      player.maxMana = 500;
      player.mana = 500;
      const manaBefore = player.mana;
      assert.equal(engine.processIntent(id, { type: 'cast', payload: { spellIndex: customIndex } }), true);
      assert.ok(player.hp > 100);
      assert.equal(player.mana, manaBefore - 7);
      assert.equal(player.stats.spellsCast, 1);
      const reductionBeforeBuff = engine.computeDerivedStats(player).damageReduction;
      const manaBeforeBuff = player.mana;
      assert.equal(engine.processIntent(id, { type: 'cast', payload: { spellIndex: buffIndex } }), true);
      assert.equal(player.mana, manaBeforeBuff - 9);
      assert.ok(player.buffs.some(buff => buff.type === 'shield' && buff.value === 33 && buff.expiresAt > Date.now()));
      assert.ok(engine.computeDerivedStats(player).damageReduction >= reductionBeforeBuff + 33);
      assert.equal(player.stats.spellsCast, 2);
    } finally {
      cleanup(id);
    }
  } finally {
    engine.syncContentSpells(originalCatalog);
  }
});


test('authoritative monster kills progress canonical quest targets', () => {
  const quest = contentDB.get('quests').find(entry => entry.id === 'quest_rats');
  const npc = contentDB.get('npcs').find(entry => entry.id === quest?.npcId);
  assert.ok(quest);
  assert.ok(npc);
  const { id, player } = makePlayer();
  const monsters = engine.monstersByMap.get('eldoria');
  const rat = monsters.find(monster => monster.name === 'Rat' && !monster.dead);
  assert.ok(rat);
  const originalRat = { hp: rat.hp, dead: rat.dead, respawnAt: rat.respawnAt };
  try {
    player.mapId = npc.mapId;
    player.x = Number(npc.posX);
    player.y = Number(npc.posY);
    assert.equal(engine.processIntent(id, { type: 'quest_accept', payload: { questId: quest.id } }), true);

    player.x = Math.max(1, rat.x - 1);
    player.y = rat.y;
    player.attack = 9999;
    player.lastAttack = 0;
    rat.hp = 1;
    assert.equal(engine.processIntent(id, { type: 'attack', payload: { monsterId: rat.id } }), true);
    const state = questEngine.exportState(id);
    const active = state.active.find(entry => entry.questId === quest.id);
    assert.ok(active);
    assert.equal(active.progress[quest.target], 1);
  } finally {
    rat.hp = originalRat.hp;
    rat.dead = originalRat.dead;
    rat.respawnAt = originalRat.respawnAt;
    cleanup(id);
  }
});


test('authoritative skills use structured progress and advance from combat actions', () => {
  const { id, player } = makePlayer('knight');
  try {
    assert.equal(typeof player.skills.sword, 'object');
    const before = player.skills.sword.progress;
    const monster = (engine.monstersByMap.get(player.mapId) || []).find(m => !m.dead);
    assert.ok(monster);
    const map = WORLD.getMap(player.mapId);
    const candidates = [[-1,0],[1,0],[0,-1],[0,1]]
      .map(([dx,dy]) => ({ x: monster.x + dx, y: monster.y + dy }))
      .filter(pos => map.tiles?.[pos.y]?.[pos.x]?.walkable);
    assert.ok(candidates.length > 0);
    player.x = candidates[0].x; player.y = candidates[0].y;
    player.lastAttack = 0;
    assert.equal(engine.handleAttack(player, { monsterId: monster.id }), true);
    assert.ok(player.skills.sword.progress > before || player.skills.fist.progress > 0);
  } finally { cleanup(id); }
});

test('official fishing gathering progresses the authoritative fish quest', () => {
  const { id, player } = makePlayer('knight');
  try {
    player.level = 10;
    questEngine.restorePlayer(id, { active: [{ questId: 'quest_fish', progress: { fish: 0 }, startedAt: Date.now() }], completed: [] });
    const map = WORLD.getMap('shadowfen');
    let spot = null;
    for (let y = 1; y < map.height - 1 && !spot; y++) {
      for (let x = 1; x < map.width - 1 && !spot; x++) {
        if (!map.tiles[y][x].walkable) continue;
        const around = [[1,0],[-1,0],[0,1],[0,-1]];
        if (around.some(([dx,dy]) => map.tiles[y + dy]?.[x + dx]?.type === 'water')) spot = { x, y };
      }
    }
    assert.ok(spot, 'expected a walkable tile adjacent to water');
    player.mapId = 'shadowfen'; player.x = spot.x; player.y = spot.y;
    assert.equal(engine.handleOfficial(player, { action: 'gather' }), true);
    const state = questEngine.serialize(id);
    assert.ok(state.active[0].current >= 1);
  } finally { cleanup(id); }
});
