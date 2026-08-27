// Mor'ia 8.4 — authoritative procedural itemization.
// Affixes remain metadata and are applied by server/client derived-stat readers,
// preserving the immutable base-item stats and IDs used by mastery/content tools.

export const REGIONAL_MATERIALS = Object.freeze({
  eldoria: { name: 'Verdant Fiber', icon: '🌿', value: 28 },
  frostpeak: { name: 'Frost Crystal', icon: '❄', value: 45 },
  shadowfen: { name: 'Bog Essence', icon: '🧪', value: 55 },
  emberhold: { name: 'Cinder Ore', icon: '🔥', value: 70 },
  voidlands: { name: 'Void Shard', icon: '💠', value: 110 },
});

const RARITY_AFFIX_COUNT = Object.freeze({ common: 0, uncommon: 1, rare: 1, epic: 2, legendary: 3 });
const STAT_CAPS = Object.freeze({
  attack: 250, defense: 180, armor: 220, hp: 1200, mana: 900, magic: 180,
  critChance: 12, lifesteal: 8, moveSpeed: 12, xpBonus: 15, goldBonus: 18,
});

const AFFIXES = Object.freeze([
  { id: 'savage', name: 'Savage', position: 'prefix', slots: ['weapon', 'ring', 'amulet'], stats: level => ({ attack: Math.max(1, Math.floor(1 + level * 0.28)) }) },
  { id: 'arcane', name: 'Arcane', position: 'prefix', slots: ['weapon', 'helmet', 'ring', 'amulet'], stats: level => ({ magic: Math.max(1, Math.floor(1 + level * 0.20)), mana: Math.max(4, level * 2) }) },
  { id: 'bastion', name: 'Bastion', position: 'prefix', slots: ['armor', 'helmet', 'legs', 'boots', 'shield'], stats: level => ({ armor: Math.max(1, Math.floor(1 + level * 0.24)) }) },
  { id: 'keen', name: 'Keen', position: 'prefix', slots: ['weapon', 'ring', 'amulet'], stats: level => ({ critChance: Math.min(4, 1 + Math.floor(level / 15)) }) },
  { id: 'vigor', name: 'of Vigor', position: 'suffix', slots: ['armor', 'helmet', 'legs', 'boots', 'shield', 'ring', 'amulet'], stats: level => ({ hp: Math.max(6, level * 3) }) },
  { id: 'insight', name: 'of Insight', position: 'suffix', slots: ['weapon', 'helmet', 'ring', 'amulet'], stats: level => ({ mana: Math.max(8, level * 3) }) },
  { id: 'thirst', name: 'of Thirst', position: 'suffix', slots: ['weapon', 'ring', 'amulet'], stats: level => ({ lifesteal: Math.min(4, 1 + Math.floor(level / 20)) }) },
  { id: 'fortune', name: 'of Fortune', position: 'suffix', slots: ['ring', 'amulet', 'boots'], stats: level => ({ goldBonus: Math.min(8, 2 + Math.floor(level / 8)) }) },
  { id: 'sage', name: 'of the Sage', position: 'suffix', slots: ['helmet', 'ring', 'amulet'], stats: level => ({ xpBonus: Math.min(7, 2 + Math.floor(level / 10)) }) },
]);

function clampStat(stat, value) {
  const cap = STAT_CAPS[stat] || 1_000_000;
  return Math.max(0, Math.min(cap, Math.floor(Number(value) || 0)));
}

export function rollEquipmentAffixes(base, monsterLevel = 1, random = Math.random) {
  if (!base || typeof base !== 'object') return base;
  const rarity = String(base.rarity || 'common').toLowerCase();
  const count = RARITY_AFFIX_COUNT[rarity] || 0;
  const level = Math.max(1, Math.floor(Number(monsterLevel) || Number(base.level) || 1));
  const eligible = AFFIXES.filter(affix => affix.slots.includes(base.slot));
  const chosen = [];
  const pool = [...eligible];
  while (chosen.length < count && pool.length) {
    const index = Math.min(pool.length - 1, Math.floor(Math.max(0, Math.min(0.999999, Number(random()) || 0)) * pool.length));
    chosen.push(pool.splice(index, 1)[0]);
  }
  if (!chosen.length) return { ...base, baseItemId: base.baseItemId || base.id, affixes: [] };

  const affixes = chosen.map(def => {
    const stats = Object.fromEntries(Object.entries(def.stats(level)).map(([key, value]) => [key, clampStat(key, value)]));
    const description = Object.entries(stats).map(([key, value]) => `+${value}${['critChance','lifesteal','moveSpeed','xpBonus','goldBonus'].includes(key) ? '%' : ''} ${key}`).join(' · ');
    return { id: def.id, name: def.name, description, stats };
  });
  const prefix = chosen.find(def => def.position === 'prefix')?.name;
  const suffix = chosen.find(def => def.position === 'suffix')?.name;
  const name = `${prefix ? `${prefix} ` : ''}${base.name}${suffix ? ` ${suffix}` : ''}`;
  return {
    ...base,
    baseItemId: base.baseItemId || base.id,
    name,
    value: Math.floor((Number(base.value) || 0) * (1 + affixes.length * 0.18)),
    affixes,
  };
}

export function sumAffixStats(equipment) {
  const total = {};
  for (const affix of Array.isArray(equipment?.affixes) ? equipment.affixes : []) {
    if (!affix || typeof affix !== 'object' || !affix.stats || typeof affix.stats !== 'object') continue;
    for (const [stat, raw] of Object.entries(affix.stats)) total[stat] = (total[stat] || 0) + clampStat(stat, raw);
  }
  return total;
}

export function rollRegionalMaterial(mapId, monster, random = Math.random) {
  const material = REGIONAL_MATERIALS[mapId];
  if (!material) return null;
  const type = monster?.type || 'normal';
  const chance = type === 'boss' ? 0.72 : type === 'elite' ? 0.38 : 0.12;
  if (random() >= chance) return null;
  const level = Math.max(1, Math.floor(Number(monster?.level) || 1));
  const quantity = type === 'boss' ? 2 + Math.floor(level / 20) : type === 'elite' ? 2 : 1;
  return {
    id: `region_${mapId}_${Date.now()}_${random()}`,
    name: material.name,
    icon: material.icon,
    quantity: Math.max(1, Math.min(6, quantity)),
    value: material.value,
    type: 'material',
    region: mapId,
  };
}
