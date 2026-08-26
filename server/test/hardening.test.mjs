import test from 'node:test';
import assert from 'node:assert/strict';
import { engine } from '../engine/GameState.mjs';
import { VOCATIONS } from '../engine/Vocations.mjs';

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

test('travel ignores client coordinates and rejects unknown maps', () => {
  const { id, player } = makePlayer();
  try {
    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'frostpeak', spawnX: 1, spawnY: 1 } }), true);
    assert.equal(player.mapId, 'frostpeak');
    assert.equal(player.x, 40);
    assert.equal(player.y, 40);

    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'hacked-map', spawnX: 12, spawnY: 12 } }), false);
    assert.equal(player.mapId, 'frostpeak');
  } finally {
    cleanup(id);
  }
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
