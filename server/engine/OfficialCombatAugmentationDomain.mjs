// ===================================================================
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
