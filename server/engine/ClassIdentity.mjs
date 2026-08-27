// ===================================================================
// MOR'IA 9.3 — AUTHORITATIVE CLASS IDENTITY
// Distinct combat cadence, range, sustain and specialization per vocation.
// ===================================================================

const profile = (id, data) => Object.freeze({ id, ...data });

export const CLASS_IDENTITIES = Object.freeze({
  knight: profile('knight', {
    role: 'Vanguard Tank', signature: 'Iron Bulwark', color: '#c13030', accent: '#f2a1a1',
    basicRange: 2, attackCooldownMs: 780, attackMultiplier: 1.05, critBonus: 0, critMultiplier: 2,
    defenseMultiplier: 1.12, damageReduction: 12, moveSpeed: 0, lifesteal: 0,
    spellPowerMultiplier: 0.95, healPowerMultiplier: 1.05,
  }),
  paladin: profile('paladin', {
    role: 'Holy Marksman', signature: 'Dawnshot', color: '#d6c84f', accent: '#fff4a8',
    basicRange: 7, attackCooldownMs: 820, attackMultiplier: 1.18, critBonus: 6, critMultiplier: 2.1,
    defenseMultiplier: 1, damageReduction: 3, moveSpeed: 4, lifesteal: 0,
    spellPowerMultiplier: 1.08, healPowerMultiplier: 1.18,
  }),
  sorcerer: profile('sorcerer', {
    role: 'Burst Caster', signature: 'Arcane Cataclysm', color: '#9b59ff', accent: '#e1c4ff',
    basicRange: 2, attackCooldownMs: 900, attackMultiplier: 0.76, critBonus: 2, critMultiplier: 2,
    defenseMultiplier: 0.96, damageReduction: 0, moveSpeed: 0, lifesteal: 0,
    magicMultiplier: 1.16, spellPowerMultiplier: 1.30, healPowerMultiplier: 0.9,
  }),
  druid: profile('druid', {
    role: 'Nature Healer', signature: 'Lifebloom', color: '#2ecc71', accent: '#a8f0c3',
    basicRange: 2, attackCooldownMs: 880, attackMultiplier: 0.82, critBonus: 0, critMultiplier: 2,
    defenseMultiplier: 1, damageReduction: 2, moveSpeed: 3, lifesteal: 0,
    magicMultiplier: 1.08, spellPowerMultiplier: 1.05, healPowerMultiplier: 1.38,
  }),
  warlock: profile('warlock', {
    role: 'Drain Caster', signature: 'Soul Covenant', color: '#8b1a8b', accent: '#e28de2',
    basicRange: 2, attackCooldownMs: 860, attackMultiplier: 0.82, critBonus: 1, critMultiplier: 2,
    defenseMultiplier: 0.98, damageReduction: 1, moveSpeed: 0, lifesteal: 10,
    magicMultiplier: 1.10, spellPowerMultiplier: 1.16, healPowerMultiplier: 1.0, drainMultiplier: 1.35,
    manaOnKillPercent: 4,
  }),
  rogue: profile('rogue', {
    role: 'Assassin', signature: 'Nightblade', color: '#777777', accent: '#d9d9d9',
    basicRange: 2, attackCooldownMs: 480, attackMultiplier: 1.12, critBonus: 20, critMultiplier: 2.5,
    defenseMultiplier: 0.98, damageReduction: 0, moveSpeed: 9, lifesteal: 0,
    spellPowerMultiplier: 1.08, healPowerMultiplier: 0.9,
    executeThreshold: 0.35, executeMultiplier: 1.25,
  }),
  priest: profile('priest', {
    role: 'Divine Support', signature: 'Beacon of Grace', color: '#f4e04d', accent: '#fffbd0',
    basicRange: 2, attackCooldownMs: 900, attackMultiplier: 0.72, critBonus: 0, critMultiplier: 2,
    defenseMultiplier: 1, damageReduction: 4, moveSpeed: 0, lifesteal: 0,
    magicMultiplier: 1.08, spellPowerMultiplier: 1.03, healPowerMultiplier: 1.52,
  }),
  deathknight: profile('deathknight', {
    role: 'Drain Tank', signature: 'Dreadguard', color: '#6b1717', accent: '#d06b6b',
    basicRange: 2, attackCooldownMs: 840, attackMultiplier: 1.08, critBonus: 2, critMultiplier: 2,
    defenseMultiplier: 1.08, damageReduction: 9, moveSpeed: 0, lifesteal: 12,
    spellPowerMultiplier: 1.06, healPowerMultiplier: 1.10,
    hpOnKillPercent: 3,
  }),
  monk: profile('monk', {
    role: 'Tempo Fighter', signature: 'Flow State', color: '#e6a817', accent: '#ffe49a',
    basicRange: 2, attackCooldownMs: 420, attackMultiplier: 0.92, critBonus: 8, critMultiplier: 2.05,
    defenseMultiplier: 1.02, damageReduction: 3, moveSpeed: 10, lifesteal: 2,
    spellPowerMultiplier: 1.10, healPowerMultiplier: 1.10,
  }),
  ranger: profile('ranger', {
    role: 'Predator Marksman', signature: 'Hunter’s Mark', color: '#1a6b3a', accent: '#8de0aa',
    basicRange: 8, attackCooldownMs: 760, attackMultiplier: 1.12, critBonus: 10, critMultiplier: 2.15,
    defenseMultiplier: 0.98, damageReduction: 1, moveSpeed: 6, lifesteal: 0,
    spellPowerMultiplier: 1.08, healPowerMultiplier: 0.9,
    executeThreshold: 0.40, executeMultiplier: 1.25,
  }),
  necromancer: profile('necromancer', {
    role: 'Death Caster', signature: 'Grave Harvest', color: '#2a6a4a', accent: '#8ed0ad',
    basicRange: 2, attackCooldownMs: 900, attackMultiplier: 0.78, critBonus: 0, critMultiplier: 2,
    defenseMultiplier: 0.97, damageReduction: 1, moveSpeed: 0, lifesteal: 6,
    magicMultiplier: 1.12, spellPowerMultiplier: 1.20, healPowerMultiplier: 0.95,
    manaOnKillPercent: 5,
  }),
  berserker: profile('berserker', {
    role: 'Blood Bruiser', signature: 'Bloodfury', color: '#a02020', accent: '#ff8d8d',
    basicRange: 2, attackCooldownMs: 600, attackMultiplier: 1.15, critBonus: 10, critMultiplier: 2.2,
    defenseMultiplier: 0.96, damageReduction: 0, moveSpeed: 2, lifesteal: 2,
    spellPowerMultiplier: 1.08, healPowerMultiplier: 0.9,
    lowHpThreshold: 0.35, lowHpMultiplier: 1.45,
  }),
  shaman: profile('shaman', {
    role: 'Elemental Support', signature: 'Stormweaver', color: '#008b8b', accent: '#86e4e4',
    basicRange: 2, attackCooldownMs: 830, attackMultiplier: 0.90, critBonus: 2, critMultiplier: 2,
    defenseMultiplier: 1.02, damageReduction: 4, moveSpeed: 3, lifesteal: 0,
    magicMultiplier: 1.08, spellPowerMultiplier: 1.14, healPowerMultiplier: 1.28,
  }),
  templar: profile('templar', {
    role: 'Holy Tank', signature: 'Sunward Aegis', color: '#d4af37', accent: '#fff0a6',
    basicRange: 2, attackCooldownMs: 800, attackMultiplier: 1.02, critBonus: 1, critMultiplier: 2,
    defenseMultiplier: 1.12, damageReduction: 10, moveSpeed: 0, lifesteal: 0,
    spellPowerMultiplier: 1.08, healPowerMultiplier: 1.18,
    healthyThreshold: 0.50, healthyDamageReduction: 6,
  }),
});

export function getClassIdentity(vocation) {
  return CLASS_IDENTITIES[String(vocation || '').toLowerCase()] || CLASS_IDENTITIES.knight;
}

export function applyClassDerivedStats(player, stats) {
  const identity = getClassIdentity(player?.vocation);
  // Equipment defense keeps exact authored values; tanks specialize through damage reduction.
  stats.totalMagic *= Number(identity.magicMultiplier) || 1;
  stats.critChance += Number(identity.critBonus) || 0;
  stats.damageReduction += Number(identity.damageReduction) || 0;
  stats.moveSpeed += Number(identity.moveSpeed) || 0;
  stats.lifesteal += Number(identity.lifesteal) || 0;
  // Healing specialization is applied per cast by classSpellMultiplier.
  const hpRatio = Math.max(0, Math.min(1, Number(player?.hp) / Math.max(1, Number(stats.totalMaxHp) || 1)));
  if (identity.healthyThreshold && hpRatio >= identity.healthyThreshold) {
    stats.damageReduction += Number(identity.healthyDamageReduction) || 0;
  }
  return stats;
}

export function classBasicAttackRules(player, monster, derivedStats) {
  const identity = getClassIdentity(player?.vocation);
  let damageMultiplier = Number(identity.attackMultiplier) || 1;
  const targetRatio = monster ? Math.max(0, Math.min(1, Number(monster.hp) / Math.max(1, Number(monster.maxHp) || 1))) : 1;
  const selfRatio = Math.max(0, Math.min(1, Number(player?.hp) / Math.max(1, Number(derivedStats?.totalMaxHp) || 1)));
  if (identity.executeThreshold && targetRatio <= identity.executeThreshold) damageMultiplier *= Number(identity.executeMultiplier) || 1;
  if (identity.lowHpThreshold && selfRatio <= identity.lowHpThreshold) damageMultiplier *= Number(identity.lowHpMultiplier) || 1;
  return {
    range: Number(identity.basicRange) || 2,
    cooldownMs: Math.max(250, Number(identity.attackCooldownMs) || 700),
    damageMultiplier,
    critMultiplier: Math.max(1, Number(identity.critMultiplier) || 2),
  };
}

export function classSpellMultiplier(player, spell, effect) {
  const identity = getClassIdentity(player?.vocation);
  let multiplier = Number(identity.spellPowerMultiplier) || 1;
  if (effect === 'buff') return 1; // Content-authored buff values remain exact.
  if (effect === 'heal') multiplier = Number(identity.healPowerMultiplier) || multiplier;
  if (effect === 'drain') multiplier *= Number(identity.drainMultiplier) || 1;
  return Math.max(0.25, Math.min(3, multiplier));
}

export function applyClassKillSustain(player, monster, derivedStats) {
  const identity = getClassIdentity(player?.vocation);
  const result = { hp: 0, mana: 0, signature: identity.signature, color: identity.color };
  const hpPercent = Number(identity.hpOnKillPercent) || 0;
  const manaPercent = Number(identity.manaOnKillPercent) || 0;
  if (hpPercent > 0) {
    const amount = Math.max(1, Math.floor((Number(derivedStats?.totalMaxHp) || 0) * hpPercent / 100));
    const before = Number(player.hp) || 0;
    player.hp = Math.min(Number(derivedStats?.totalMaxHp) || player.maxHp || before, before + amount);
    result.hp = Math.max(0, player.hp - before);
  }
  if (manaPercent > 0) {
    const amount = Math.max(1, Math.floor((Number(derivedStats?.totalMaxMana) || 0) * manaPercent / 100));
    const before = Number(player.mana) || 0;
    player.mana = Math.min(Number(derivedStats?.totalMaxMana) || player.maxMana || before, before + amount);
    result.mana = Math.max(0, player.mana - before);
  }
  return result;
}
