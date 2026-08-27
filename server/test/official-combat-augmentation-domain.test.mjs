import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMBAT_AUGMENTATION_RULES,
  OfficialCombatAugmentationDomain,
} from '../engine/OfficialCombatAugmentationDomain.mjs';

function player() {
  return {
    name: 'Augmentor', level: 16, buffs: [], equipment: {},
    official: {
      training: 0, blessingsUntil: 0, pets: { owned: [], active: null }, bestiary: {},
    },
  };
}
const host = { ensurePlayer(p) { return p.official; } };
const stats = () => ({
  totalAttack: 100, totalDefense: 50, totalMagic: 40, totalMaxHp: 200, totalMaxMana: 100,
  xpBonus: 0, goldBonus: 0, critChance: 0, moveSpeed: 0, damageReduction: 0, thorns: 0, lifesteal: 0,
});

test('combat augmentation training blessing and timed buffs apply exactly once', () => {
  const domain = new OfficialCombatAugmentationDomain();
  const p = player();
  p.official.training = 2;
  p.official.blessingsUntil = 2000;
  p.buffs = [
    { type: 'official_attack', value: 10, expiresAt: 2000 },
    { type: 'official_defense', value: 8, expiresAt: 2000 },
    { type: 'official_attack', value: 50, expiresAt: 999 },
  ];
  const result = domain.applyDerivedBonuses(host, p, stats(), 1000);
  assert.ok(Math.abs(result.totalAttack - 114.4) < 1e-9);
  assert.equal(result.totalDefense, 52);
  assert.equal(result.totalMagic, 42);
  assert.equal(result.damageReduction, 13);
});

test('combat augmentation socketed gems apply only known authoritative gem IDs', () => {
  const domain = new OfficialCombatAugmentationDomain();
  const p = player();
  p.equipment.weapon = { id: 'plain_blade', socketedGems: ['ruby_t1', 'missing_gem'] };
  p.equipment.armor = { id: 'plain_mail', socketedGems: ['garnet_t2'] };
  const result = domain.applyDerivedBonuses(host, p, stats(), 1000);
  assert.equal(result.totalAttack, 103);
  assert.equal(result.totalMaxHp, 230);
});

test('combat augmentation set bonuses count unique equipped pieces and preserve percent semantics', () => {
  const domain = new OfficialCombatAugmentationDomain();
  const p = player();
  p.equipment.weapon = { id: 'dragon_slayer' };
  p.equipment.armor = { id: 'dragon_mail' };
  p.equipment.ring = { id: 'dragon_mail' };
  let result = domain.applyDerivedBonuses(host, p, stats(), 1000);
  assert.ok(Math.abs(result.totalAttack - 110) < 1e-9);
  assert.equal(result.lifesteal, 0);

  p.equipment.shield = { id: 'dragon_shield' };
  result = domain.applyDerivedBonuses(host, p, stats(), 1000);
  assert.ok(Math.abs(result.totalAttack - 115) < 1e-9);
  assert.equal(result.lifesteal, 5);
});

test('combat augmentation normalizes malformed numeric stat inputs instead of producing NaN', () => {
  const domain = new OfficialCombatAugmentationDomain();
  const p = player();
  p.official.training = 1;
  const malformed = stats();
  malformed.totalAttack = Number.NaN;
  malformed.critChance = 'not-a-number';
  const result = domain.applyDerivedBonuses(host, p, malformed, 1000);
  assert.equal(Number.isFinite(result.totalAttack), true);
  assert.equal(result.totalAttack, 2);
  assert.equal(result.critChance, 0);
});

test('combat pet requires owned active pet and damage uses non-negative authoritative defense', () => {
  const domain = new OfficialCombatAugmentationDomain();
  const p = player();
  p.official.pets.active = 'wolf_pup';
  assert.equal(domain.getActivePet(host, p), null);
  p.official.pets.owned.push('wolf_pup');
  assert.equal(domain.getActivePet(host, p).id, 'wolf_pup');
  assert.equal(domain.getPetDamage(host, p, { defense: 20 }).damage, 7);
  assert.equal(domain.getPetDamage(host, p, { defense: -100 }).damage, 12);
});

test('combat gem drops respect chance and player-level tier gates deterministically', () => {
  const domain = new OfficialCombatAugmentationDomain();
  const p = player();
  p.level = 1;
  assert.equal(domain.maybeGemDrop(p, { type: 'normal' }, 1000, () => 0.5), null);
  const rolls = [0, 0.999999];
  const drop = domain.maybeGemDrop(p, { type: 'boss' }, 1000, () => rolls.shift());
  assert.ok(drop);
  assert.equal(drop.type, 'gem');
  assert.equal(['ruby_t1', 'sapphire_t1', 'emerald_t1'].includes(drop.gemId), true);
  p.level = 40;
  const highRolls = [0, 0.999999];
  const high = domain.maybeGemDrop(p, { type: 'boss' }, 1000, () => highRolls.shift());
  assert.ok(high);
  assert.equal(high.value >= 100, true);
});

test('combat bestiary uses canonical content ID, caps counts and ignores invalid monsters', () => {
  const domain = new OfficialCombatAugmentationDomain();
  const p = player();
  assert.equal(domain.recordBestiaryKill(host, p, {}), '');
  assert.deepEqual(p.official.bestiary, {});
  assert.equal(domain.recordBestiaryKill(host, p, { contentSourceId: 'Monster:Void Wraith', name: 'Wrong Name' }), 'monster_void_wraith');
  assert.equal(p.official.bestiary.monster_void_wraith, 1);
  p.official.bestiary.monster_void_wraith = COMBAT_AUGMENTATION_RULES.maxBestiaryCount;
  domain.recordBestiaryKill(host, p, { contentSourceId: 'Monster:Void Wraith' });
  assert.equal(p.official.bestiary.monster_void_wraith, COMBAT_AUGMENTATION_RULES.maxBestiaryCount);
});
