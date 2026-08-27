import test from 'node:test';
import assert from 'node:assert/strict';

import { OfficialRuntimeCoordinator } from '../engine/OfficialRuntimeCoordinator.mjs';

function fixture({ gem = null } = {}) {
  const calls = [];
  const deps = {
    combatAugmentation: {
      recordBestiaryKill(_host, _player, monster) { calls.push(['bestiary', monster.id]); return 'rat'; },
      maybeGemDrop(_player, monster) { calls.push(['gem', monster.id]); return gem; },
    },
    progression: {
      getXpMultiplier() { calls.push(['xp']); return 1.25; },
      refreshAchievements() { calls.push(['achievements']); return [{ id: 'first_blood' }]; },
      tickStamina(_host, _player, now) { calls.push(['stamina', now]); return 2; },
    },
    pvp: {
      tick(_host, _player, now) { calls.push(['pvp', now]); return true; },
    },
    worldEvent: {
      recordKill(_host, _player, key) { calls.push(['world-kill', key]); return { progress: 1, needed: 10 }; },
      ensure(_host, now) { calls.push(['world-ensure', now]); return { id: 'event_1' }; },
    },
    dungeon: {
      onMonsterKill(_host, _player, monster) {
        calls.push(['dungeon', monster.id]);
        return { nextDungeonWave: { wave: 2 }, dungeonComplete: null };
      },
    },
  };
  return { calls, coordinator: new OfficialRuntimeCoordinator(deps) };
}

test('runtime coordinator composes monster-kill domains exactly once in deterministic order', () => {
  const gem = { id: 'gem_1', name: 'Ruby' };
  const { calls, coordinator } = fixture({ gem });
  const host = {};
  const player = { name: 'Hero' };
  const monster = { id: 'm1' };

  const result = coordinator.onMonsterKill(host, player, monster);

  assert.deepEqual(calls, [
    ['bestiary', 'm1'],
    ['xp'],
    ['gem', 'm1'],
    ['world-kill', 'rat'],
    ['dungeon', 'm1'],
    ['achievements'],
  ]);
  assert.deepEqual(result, {
    xpMultiplier: 1.25,
    bonusLoot: [gem],
    nextDungeonWave: { wave: 2 },
    dungeonComplete: null,
    worldEventProgress: { progress: 1, needed: 10 },
    achievements: [{ id: 'first_blood' }],
  });
});

test('runtime coordinator keeps optional gem drops and dungeon result null-safe', () => {
  const { coordinator } = fixture({ gem: null });
  coordinator.dungeon.onMonsterKill = () => null;

  const result = coordinator.onMonsterKill({}, { name: 'Hero' }, { id: 'm2' });
  assert.deepEqual(result.bonusLoot, []);
  assert.equal(result.nextDungeonWave, null);
  assert.equal(result.dungeonComplete, null);
});

test('runtime coordinator returns a stable no-op result for invalid monster-kill context', () => {
  const { calls, coordinator } = fixture();
  const result = coordinator.onMonsterKill(null, null, null);

  assert.deepEqual(result, {
    xpMultiplier: 1,
    bonusLoot: [],
    nextDungeonWave: null,
    dungeonComplete: null,
    worldEventProgress: null,
    achievements: [],
  });
  assert.deepEqual(calls, []);
});

test('runtime coordinator passes one normalized timestamp through the player tick pipeline', () => {
  const { calls, coordinator } = fixture();
  const result = coordinator.tickPlayer({}, { name: 'Hero' }, 123456);

  assert.deepEqual(calls, [
    ['stamina', 123456],
    ['pvp', 123456],
    ['world-ensure', 123456],
  ]);
  assert.deepEqual(result, {
    staminaSpent: 2,
    pvpChanged: true,
    event: { id: 'event_1' },
  });
});
