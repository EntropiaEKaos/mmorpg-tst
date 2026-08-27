import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createWorldClockSnapshot, worldPhaseMultiplier } from '../engine/WorldClock.mjs';
import { contextualizeSpell, effectForRelation, multiplierForRelation } from '../engine/ContextualSkillEngine.mjs';

const read = path => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const almostEqual = (actual, expected, epsilon = 1e-9) => assert.ok(Math.abs(actual - expected) < epsilon, `expected ${actual} ≈ ${expected}`);

test('9.2 world clock exposes deterministic dawn/day/dusk/night phases', () => {
  const length = 24 * 60 * 1000;
  const at = hour => createWorldClockSnapshot((hour / 24) * length, length);
  assert.equal(at(2).phase, 'night');
  assert.equal(at(6).phase, 'dawn');
  assert.equal(at(12).phase, 'day');
  assert.equal(at(19).phase, 'dusk');
  assert.equal(at(22).phase, 'night');
  assert.ok(at(12).darkness < at(22).darkness);
});

test('contextual skills resolve different ally/enemy effects and relation multipliers', () => {
  const spell = contextualizeSpell({
    name: 'Test Duality', type: 'heal', damage: 100,
    targetMode: 'smart', allyEffect: 'heal', enemyEffect: 'damage',
    allyMultiplier: 1.5, enemyMultiplier: 0.7, selfMultiplier: 0.8,
    dayMultiplier: 1.2, nightMultiplier: 0.9,
  });
  const day = { phase: 'day', daylight: 1 };
  assert.equal(effectForRelation(spell, 'ally'), 'heal');
  assert.equal(effectForRelation(spell, 'enemy'), 'damage');
  almostEqual(multiplierForRelation(spell, 'ally', day), 1.8);
  almostEqual(multiplierForRelation(spell, 'self', day), 1.44);
  almostEqual(worldPhaseMultiplier({ phase: 'night', daylight: 0 }, 1.2, 0.9), 0.9);
});

test('classic spells remain backward compatible while selected spells gain contextual presets', () => {
  const classic = contextualizeSpell({ name: 'Fireball', type: 'attack', range: 6 });
  assert.equal(classic.targetMode, 'target');
  assert.equal(classic.enemyEffect, 'damage');
  assert.equal(classic.allyEffect, 'none');

  const holyNova = contextualizeSpell({ name: 'Holy Nova', type: 'aoe', damage: 90, range: 3 });
  assert.equal(holyNova.targetMode, 'area');
  assert.equal(holyNova.enemyEffect, 'damage');
  assert.equal(holyNova.allyEffect, 'heal');
  assert.ok(holyNova.dayMultiplier > holyNova.nightMultiplier);

  const soulDrain = contextualizeSpell({ name: 'Soul Drain', type: 'attack', damage: 45, range: 5 });
  assert.equal(soulDrain.enemyEffect, 'drain');
  assert.equal(soulDrain.allyEffect, 'heal');
  assert.equal(soulDrain.drainPercent, 35);
});

test('authoritative integration keeps clock and contextual cast logic on server', () => {
  const gameState = read('server/engine/GameState.mjs');
  const studio = read('server/engine/ContentStudio.mjs');
  const sync = read('src/game/ServerSync.ts');
  assert.match(gameState, /createWorldClockSnapshot/);
  assert.match(gameState, /contextualizeSpell/);
  assert.match(gameState, /effectForRelation/);
  assert.match(gameState, /targetId/);
  assert.match(gameState, /worldClock/);
  assert.match(studio, /allyMultiplier/);
  assert.match(studio, /enemyMultiplier/);
  assert.match(studio, /nightMultiplier/);
  assert.match(sync, /sendCast\(spellIndex: number, targetId\?: string\)/);
});
