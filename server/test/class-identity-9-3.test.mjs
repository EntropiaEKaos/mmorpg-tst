import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLASS_IDENTITIES,
  getClassIdentity,
  applyClassDerivedStats,
  classBasicAttackRules,
  classSpellMultiplier,
  applyClassKillSustain,
} from '../engine/ClassIdentity.mjs';

const IDS = ['knight','paladin','sorcerer','druid','warlock','rogue','priest','deathknight','monk','ranger','necromancer','berserker','shaman','templar'];

test('9.3 defines all 14 classes with unique signatures and roles', () => {
  assert.deepEqual(Object.keys(CLASS_IDENTITIES).sort(), [...IDS].sort());
  assert.equal(new Set(IDS.map(id => CLASS_IDENTITIES[id].signature)).size, 14);
  assert.equal(new Set(IDS.map(id => CLASS_IDENTITIES[id].role)).size, 14);
});

test('marksmen, assassins, martial fighters and tanks have materially distinct basic rhythms', () => {
  const base = { hp: 100, maxHp: 100, vocation: 'knight' };
  const monster = { hp: 100, maxHp: 100 };
  const derived = { totalMaxHp: 100 };
  const knight = classBasicAttackRules(base, monster, derived);
  const paladin = classBasicAttackRules({ ...base, vocation:'paladin' }, monster, derived);
  const ranger = classBasicAttackRules({ ...base, vocation:'ranger' }, monster, derived);
  const rogue = classBasicAttackRules({ ...base, vocation:'rogue' }, monster, derived);
  const monk = classBasicAttackRules({ ...base, vocation:'monk' }, monster, derived);
  assert.ok(paladin.range >= 7);
  assert.ok(ranger.range >= 8);
  assert.ok(rogue.cooldownMs < knight.cooldownMs);
  assert.ok(monk.cooldownMs < rogue.cooldownMs);
  assert.ok(rogue.critMultiplier > knight.critMultiplier);
});

test('execute and low-health identities change damage only in their intended state', () => {
  const derived = { totalMaxHp: 100 };
  const rangerFresh = classBasicAttackRules({ vocation:'ranger', hp:100 }, { hp:100, maxHp:100 }, derived);
  const rangerExecute = classBasicAttackRules({ vocation:'ranger', hp:100 }, { hp:20, maxHp:100 }, derived);
  assert.ok(rangerExecute.damageMultiplier > rangerFresh.damageMultiplier);

  const berserkerFresh = classBasicAttackRules({ vocation:'berserker', hp:100 }, { hp:100, maxHp:100 }, derived);
  const berserkerBloodied = classBasicAttackRules({ vocation:'berserker', hp:20 }, { hp:100, maxHp:100 }, derived);
  assert.ok(berserkerBloodied.damageMultiplier > berserkerFresh.damageMultiplier);
});

test('caster and support specializations use different authoritative spell multipliers', () => {
  assert.ok(classSpellMultiplier({ vocation:'sorcerer' }, {}, 'damage') > classSpellMultiplier({ vocation:'knight' }, {}, 'damage'));
  assert.ok(classSpellMultiplier({ vocation:'priest' }, {}, 'heal') > classSpellMultiplier({ vocation:'sorcerer' }, {}, 'heal'));
  assert.ok(classSpellMultiplier({ vocation:'warlock' }, {}, 'drain') > classSpellMultiplier({ vocation:'warlock' }, {}, 'damage'));
  assert.equal(classSpellMultiplier({ vocation:'priest' }, {}, 'buff'), 1);
});

test('derived class mitigation, magic and mobility are data-driven without rewriting equipment defense', () => {
  const source = () => ({ totalDefense:100, totalMagic:100, totalMaxHp:100, totalMaxMana:100, critChance:0, damageReduction:0, moveSpeed:0, lifesteal:0, healBonus:0 });
  const knight = applyClassDerivedStats({ vocation:'knight', hp:100 }, source());
  const rogue = applyClassDerivedStats({ vocation:'rogue', hp:100 }, source());
  const sorcerer = applyClassDerivedStats({ vocation:'sorcerer', hp:100 }, source());
  assert.equal(knight.totalDefense, 100);
  assert.equal(rogue.totalDefense, 100);
  assert.ok(knight.damageReduction > rogue.damageReduction);
  assert.ok(rogue.moveSpeed > knight.moveSpeed);
  assert.ok(sorcerer.totalMagic > knight.totalMagic);
  assert.ok(getClassIdentity('templar').damageReduction > 0);
});

test('death knight and death casters receive their own kill sustain', () => {
  const derived = { totalMaxHp:1000, totalMaxMana:500 };
  const dk = { vocation:'deathknight', hp:500, mana:100, maxHp:1000, maxMana:500 };
  const necro = { vocation:'necromancer', hp:500, mana:100, maxHp:1000, maxMana:500 };
  const dkGain = applyClassKillSustain(dk, {}, derived);
  const necroGain = applyClassKillSustain(necro, {}, derived);
  assert.ok(dkGain.hp > 0);
  assert.equal(dkGain.mana, 0);
  assert.ok(necroGain.mana > 0);
});
