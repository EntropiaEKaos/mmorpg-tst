import test from 'node:test';
import assert from 'node:assert/strict';
import { engine } from '../engine/GameState.mjs';
import { VOCATIONS } from '../engine/Vocations.mjs';
import { WORLD } from '../engine/World.mjs';
import { questEngine } from '../engine/QuestEngine.mjs';
import { contentDB } from '../engine/ContentDB.mjs';

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
    player.x = 10; player.y = 40;
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
