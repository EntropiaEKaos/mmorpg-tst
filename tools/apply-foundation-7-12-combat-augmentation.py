from pathlib import Path

ROOT = Path('.')
def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')
def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

DOMAIN = r'''// ===================================================================
// MOR'IA — OFFICIAL COMBAT AUGMENTATION DOMAIN
// Owns training/buff/gem/set bonuses, combat pets, bestiary and gem drops.
// ===================================================================

import { OFFICIAL_GEMS, OFFICIAL_PETS, SETS } from './OfficialCatalogs.mjs';

const clamp = (value, min, max, fallback = min) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};
const int = (value, min, max, fallback = min) => Math.floor(clamp(value, min, max, fallback));
const slug = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

export const COMBAT_AUGMENTATION_RULES = Object.freeze({
  maxTraining: 20,
  maxBestiaryCount: 1_000_000,
  maxGemTier: 4,
  normalGemChance: 0.025,
  eliteGemChance: 0.15,
  bossGemChance: 0.45,
});

function state(host, player) {
  if (!host || typeof host.ensurePlayer !== 'function') throw new TypeError('OfficialCombatAugmentationDomain requires an OfficialSystems-compatible host.');
  return host.ensurePlayer(player);
}

function stat(stats, key, fallback = 0) {
  const value = Number(stats?.[key]);
  const normalized = Number.isFinite(value) ? value : fallback;
  stats[key] = normalized;
  return normalized;
}

export class OfficialCombatAugmentationDomain {
  applyDerivedBonuses(host, player, stats, now = Date.now()) {
    if (!stats || typeof stats !== 'object') throw new TypeError('Derived stats object is required.');
    const s = state(host, player);
    const training = int(s.training, 0, COMBAT_AUGMENTATION_RULES.maxTraining, 0);

    stat(stats, 'totalAttack');
    stat(stats, 'totalDefense');
    stat(stats, 'totalMagic');
    stat(stats, 'totalMaxHp');
    stat(stats, 'totalMaxMana');
    stat(stats, 'xpBonus');
    stat(stats, 'goldBonus');
    stat(stats, 'critChance');
    stat(stats, 'moveSpeed');
    stat(stats, 'damageReduction');
    stat(stats, 'thorns');
    stat(stats, 'lifesteal');

    stats.totalAttack += training * 2;
    stats.totalDefense += training;
    stats.totalMagic += training;
    if (Number(now) < Number(s.blessingsUntil || 0)) stats.damageReduction += 5;

    for (const buff of Array.isArray(player.buffs) ? player.buffs : []) {
      if (Number(buff?.expiresAt) <= Number(now)) continue;
      if (buff?.type === 'official_attack') stats.totalAttack *= 1 + clamp(buff.value, 0, 50, 0) / 100;
      if (buff?.type === 'official_defense') stats.damageReduction += clamp(buff.value, 0, 50, 0);
    }

    for (const equipment of Object.values(player.equipment || {})) {
      for (const gemId of Array.isArray(equipment?.socketedGems) ? equipment.socketedGems : []) {
        const gem = OFFICIAL_GEMS.find(entry => entry.id === gemId);
        if (!gem) continue;
        if (gem.stat === 'attack') stats.totalAttack += gem.value;
        else if (gem.stat === 'defense') stats.totalDefense += gem.value;
        else if (gem.stat === 'magic') stats.totalMagic += gem.value;
        else if (gem.stat === 'hp') stats.totalMaxHp += gem.value;
        else if (gem.stat === 'mana') stats.totalMaxMana += gem.value;
        else if (gem.stat === 'crit') stats.critChance += gem.value;
        else if (gem.stat === 'lifesteal') stats.lifesteal += gem.value;
        else if (gem.stat === 'speed') stats.moveSpeed += gem.value;
      }
    }

    const equippedIds = new Set(Object.values(player.equipment || {}).map(equipment => equipment?.id).filter(Boolean));
    let damagePct = 0;
    let magicPct = 0;
    for (const set of SETS) {
      const count = set.pieces.filter(id => equippedIds.has(id)).length;
      for (const bonus of set.bonuses) {
        if (count < bonus.at) continue;
        damagePct += Number(bonus.damage) || 0;
        magicPct += Number(bonus.magicPct) || 0;
        stats.xpBonus += Number(bonus.xp) || 0;
        stats.goldBonus += Number(bonus.gold) || 0;
        stats.totalMaxMana += Number(bonus.mana) || 0;
        stats.critChance += Number(bonus.crit) || 0;
        stats.moveSpeed += Number(bonus.speed) || 0;
        stats.damageReduction += Number(bonus.reduction) || 0;
        stats.thorns += Number(bonus.thorns) || 0;
        stats.totalMaxHp += Number(bonus.hp) || 0;
        stats.lifesteal += Number(bonus.lifesteal) || 0;
      }
    }
    if (damagePct) stats.totalAttack *= 1 + damagePct / 100;
    if (magicPct) stats.totalMagic *= 1 + magicPct / 100;
    return stats;
  }

  getActivePet(host, player) {
    const s = state(host, player);
    const active = s.pets?.active;
    if (!active || !Array.isArray(s.pets?.owned) || !s.pets.owned.includes(active)) return null;
    return OFFICIAL_PETS.find(pet => pet.id === active) || null;
  }

  getPetDamage(host, player, monster) {
    const pet = this.getActivePet(host, player);
    if (!pet) return null;
    const level = Math.max(1, Number(player.level) || 1);
    const defense = Math.max(0, Number(monster?.defense) || 0);
    return { pet, damage: Math.max(1, Math.floor(pet.attack + level * 0.25 - defense * 0.25)) };
  }

  maybeGemDrop(player, monster, now = Date.now(), random = Math.random) {
    const chance = monster?.type === 'boss'
      ? COMBAT_AUGMENTATION_RULES.bossGemChance
      : monster?.type === 'elite'
        ? COMBAT_AUGMENTATION_RULES.eliteGemChance
        : COMBAT_AUGMENTATION_RULES.normalGemChance;
    const chanceRoll = Number(typeof random === 'function' ? random() : 1);
    if (!Number.isFinite(chanceRoll) || chanceRoll < 0 || chanceRoll >= chance) return null;

    const level = Math.max(1, Number(player?.level) || 1);
    const maxTier = Math.min(COMBAT_AUGMENTATION_RULES.maxGemTier, Math.floor(level / 8) + 1);
    const eligible = OFFICIAL_GEMS.filter(gem => gem.tier <= maxTier);
    if (!eligible.length) return null;
    const selectionRoll = Number(typeof random === 'function' ? random() : 0);
    const index = Number.isFinite(selectionRoll) && selectionRoll >= 0
      ? Math.min(eligible.length - 1, Math.floor(selectionRoll * eligible.length))
      : 0;
    const gem = eligible[index];
    return {
      id: `gem_${Number(now) || Date.now()}_${Math.max(0, selectionRoll || 0)}`,
      name: gem.name,
      icon: gem.icon,
      type: 'gem',
      gemId: gem.id,
      quantity: 1,
      value: gem.tier * 100,
      rarity: gem.rarity,
      description: `${gem.stat} +${gem.value}`,
    };
  }

  recordBestiaryKill(host, player, monster) {
    const s = state(host, player);
    if (!s.bestiary || typeof s.bestiary !== 'object' || Array.isArray(s.bestiary)) s.bestiary = {};
    const key = slug(monster?.contentSourceId || monster?.name);
    if (!key) return '';
    s.bestiary[key] = Math.min(
      COMBAT_AUGMENTATION_RULES.maxBestiaryCount,
      int(s.bestiary[key], 0, COMBAT_AUGMENTATION_RULES.maxBestiaryCount, 0) + 1,
    );
    return key;
  }
}

export const officialCombatAugmentationDomain = new OfficialCombatAugmentationDomain();
'''
write('server/engine/OfficialCombatAugmentationDomain.mjs', DOMAIN)

TEST = r'''import test from 'node:test';
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
  assert.equal(result.totalAttack, 110);
  assert.equal(result.lifesteal, 0);

  p.equipment.shield = { id: 'dragon_shield' };
  result = domain.applyDerivedBonuses(host, p, stats(), 1000);
  assert.equal(result.totalAttack, 115);
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
'''
write('server/test/official-combat-augmentation-domain.test.mjs', TEST)

DOC = r'''# MOR'IA Foundation 7.12 — Combat Augmentation Domain

Foundation 7.12 extracts combat augmentations into `OfficialCombatAugmentationDomain`.

The domain owns training modifiers, timed official buffs, blessing mitigation, socketed-gem effects, set-bonus aggregation, active combat pets, pet damage, authoritative bestiary counters and level-gated gem drops.

`OfficialSystems` remains the orchestration façade. Monster kills still flow through bestiary/gem processing, world events, dungeons and achievements in the same order, but the underlying augmentation rules no longer live in the core runtime class.

The boundary is designed for large-scale expansion into hundreds of equipment sets, pet families, gem tiers, affixes, relics, collection bonuses, bestiary milestones and seasonal drop tables without regrowing the monolith.
'''
write('docs/FOUNDATION_7_12_COMBAT_AUGMENTATION.md', DOC)

path = 'server/engine/OfficialSystems.mjs'
text = read(path)
anchor = "import { officialExplorationKnowledgeDomain } from './OfficialExplorationKnowledgeDomain.mjs';\n"
text = replace_once(text, anchor, anchor + "import { officialCombatAugmentationDomain } from './OfficialCombatAugmentationDomain.mjs';\n", 'combat augmentation import')
text = replace_once(text, "  ACHIEVEMENTS, SETS,\n", "  ACHIEVEMENTS,\n", 'remove sets import')

apply_method = r'''  applyDerivedBonuses(player, stats) {
    const s = this.ensurePlayer(player);
    stats.totalAttack += s.training * 2;
    stats.totalDefense += s.training;
    stats.totalMagic += s.training;
    if (Date.now() < s.blessingsUntil) stats.damageReduction += 5;
    for (const buff of Array.isArray(player.buffs) ? player.buffs : []) {
      if (Number(buff.expiresAt) <= Date.now()) continue;
      if (buff.type === 'official_attack') stats.totalAttack *= 1 + clamp(buff.value, 0, 50, 0) / 100;
      if (buff.type === 'official_defense') stats.damageReduction += clamp(buff.value, 0, 50, 0);
    }

    for (const eq of Object.values(player.equipment || {})) {
      for (const gemId of Array.isArray(eq?.socketedGems) ? eq.socketedGems : []) {
        const gem = OFFICIAL_GEMS.find(g => g.id === gemId);
        if (!gem) continue;
        if (gem.stat === 'attack') stats.totalAttack += gem.value;
        else if (gem.stat === 'defense') stats.totalDefense += gem.value;
        else if (gem.stat === 'magic') stats.totalMagic += gem.value;
        else if (gem.stat === 'hp') stats.totalMaxHp += gem.value;
        else if (gem.stat === 'mana') stats.totalMaxMana += gem.value;
        else if (gem.stat === 'crit') stats.critChance += gem.value;
        else if (gem.stat === 'lifesteal') stats.lifesteal += gem.value;
        else if (gem.stat === 'speed') stats.moveSpeed += gem.value;
      }
    }

    const equippedIds = new Set(Object.values(player.equipment || {}).map(eq => eq?.id).filter(Boolean));
    let damagePct = 0, magicPct = 0;
    for (const set of SETS) {
      const count = set.pieces.filter(id => equippedIds.has(id)).length;
      for (const bonus of set.bonuses) {
        if (count < bonus.at) continue;
        damagePct += bonus.damage || 0;
        magicPct += bonus.magicPct || 0;
        stats.xpBonus += bonus.xp || 0;
        stats.goldBonus += bonus.gold || 0;
        stats.totalMaxMana += bonus.mana || 0;
        stats.critChance += bonus.crit || 0;
        stats.moveSpeed += bonus.speed || 0;
        stats.damageReduction += bonus.reduction || 0;
        stats.thorns += bonus.thorns || 0;
        stats.totalMaxHp += bonus.hp || 0;
        stats.lifesteal += bonus.lifesteal || 0;
      }
    }
    if (damagePct) stats.totalAttack *= 1 + damagePct / 100;
    if (magicPct) stats.totalMagic *= 1 + magicPct / 100;
    return stats;
  }
'''
text = replace_once(text, apply_method, r'''  applyDerivedBonuses(player, stats) {
    return officialCombatAugmentationDomain.applyDerivedBonuses(this, player, stats);
  }
''', 'derived bonus method')

pet_methods = r'''  getActivePet(player) {
    const s = this.ensurePlayer(player);
    return s.pets.active ? OFFICIAL_PETS.find(p => p.id === s.pets.active) || null : null;
  }

  getPetDamage(player, monster) {
    const pet = this.getActivePet(player);
    if (!pet) return null;
    return { pet, damage: Math.max(1, Math.floor(pet.attack + player.level * 0.25 - (Number(monster.defense) || 0) * 0.25)) };
  }
'''
text = replace_once(text, pet_methods, r'''  getActivePet(player) {
    return officialCombatAugmentationDomain.getActivePet(this, player);
  }

  getPetDamage(player, monster) {
    return officialCombatAugmentationDomain.getPetDamage(this, player, monster);
  }
''', 'pet methods')

gem_method = r'''  maybeGemDrop(player, monster) {
    const chance = monster.type === 'boss' ? 0.45 : monster.type === 'elite' ? 0.15 : 0.025;
    if (Math.random() >= chance) return null;
    const maxTier = Math.min(4, Math.floor(player.level / 8) + 1);
    const eligible = OFFICIAL_GEMS.filter(g => g.tier <= maxTier);
    if (!eligible.length) return null;
    const gem = eligible[Math.floor(Math.random() * eligible.length)];
    return {
      id: `gem_${Date.now()}_${Math.random()}`, name: gem.name, icon: gem.icon, type: 'gem', gemId: gem.id,
      quantity: 1, value: gem.tier * 100, rarity: gem.rarity, description: `${gem.stat} +${gem.value}`,
    };
  }
'''
text = replace_once(text, gem_method, '', 'legacy gem drop method')

kill_prefix = r'''  onMonsterKill(player, monster) {
    const s = this.ensurePlayer(player);
    const key = slug(monster.contentSourceId || monster.name);
    s.bestiary[key] = int(s.bestiary[key], 0, 1_000_000, 0) + 1;
    const result = { xpMultiplier: this.getXpMultiplier(player), bonusLoot: [], nextDungeonWave: null, dungeonComplete: null, worldEventProgress: null, achievements: [] };
    const gem = this.maybeGemDrop(player, monster);
    if (gem) result.bonusLoot.push(gem);
'''
kill_replacement = r'''  onMonsterKill(player, monster) {
    const key = officialCombatAugmentationDomain.recordBestiaryKill(this, player, monster);
    const result = { xpMultiplier: this.getXpMultiplier(player), bonusLoot: [], nextDungeonWave: null, dungeonComplete: null, worldEventProgress: null, achievements: [] };
    const gem = officialCombatAugmentationDomain.maybeGemDrop(player, monster);
    if (gem) result.bonusLoot.push(gem);
'''
text = replace_once(text, kill_prefix, kill_replacement, 'monster kill augmentation prefix')
write(path, text)

print('Foundation 7.12 combat augmentation domain extraction applied')
