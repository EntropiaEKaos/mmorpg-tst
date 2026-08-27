import test from 'node:test';
import assert from 'node:assert/strict';
import { rollEquipmentAffixes, rollRegionalMaterial, sumAffixStats, REGIONAL_MATERIALS } from '../engine/Itemization.mjs';
import { rollLoot } from '../engine/Items.mjs';
import { OFFICIAL_RECIPES } from '../engine/OfficialCatalogs.mjs';

test('common equipment preserves base identity and receives no affix', () => {
  const base = { id: 'iron', name: 'Iron Sword', slot: 'weapon', rarity: 'common', attack: 5, value: 25 };
  const rolled = rollEquipmentAffixes(base, 10, () => 0);
  assert.equal(rolled.id, 'iron');
  assert.equal(rolled.baseItemId, 'iron');
  assert.deepEqual(rolled.affixes, []);
  assert.equal(rolled.attack, 5);
});

test('legendary affixes are unique bounded metadata and never mutate base stats', () => {
  const sequence = [0, 0.2, 0.8];
  const base = { id: 'legend', name: 'Legend Blade', slot: 'weapon', rarity: 'legendary', attack: 50, value: 1000 };
  const rolled = rollEquipmentAffixes(base, 40, () => sequence.shift() ?? 0.5);
  assert.equal(rolled.affixes.length, 3);
  assert.equal(new Set(rolled.affixes.map(a => a.id)).size, 3);
  assert.equal(rolled.attack, 50);
  assert.ok(rolled.name.includes('Legend Blade'));
  const bonus = sumAffixStats(rolled);
  assert.ok(Object.values(bonus).every(value => Number.isFinite(value) && value >= 0));
});

test('regional materials are map-owned and boss quantities remain bounded', () => {
  for (const mapId of Object.keys(REGIONAL_MATERIALS)) {
    const drop = rollRegionalMaterial(mapId, { type: 'boss', level: 100 }, () => 0);
    assert.ok(drop);
    assert.equal(drop.region, mapId);
    assert.ok(drop.quantity >= 1 && drop.quantity <= 6);
  }
});

test('regional materials feed official gem crafting recipes', () => {
  for (const material of Object.values(REGIONAL_MATERIALS)) {
    assert.ok(OFFICIAL_RECIPES.some(recipe => recipe.ingredients.some(ingredient => ingredient.name === material.name)));
  }
});

test('rollLoot can receive an explicit authoritative map without changing base item identity', () => {
  const original = Math.random;
  const rolls = [1, 1, 0, 0, 0.99, 0.99, 0.99, 0];
  Math.random = () => rolls.length ? rolls.shift() : 0.99;
  try {
    const drops = rollLoot({ type: 'boss', level: 30 }, 0, [], 'voidlands');
    const equipment = drops.find(item => item.type === 'equipment');
    assert.ok(equipment?.equipment?.id);
    assert.ok(equipment.equipment.baseItemId);
  } finally { Math.random = original; }
});
