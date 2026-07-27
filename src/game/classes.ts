import type { Spell } from './types';

export interface Vocation {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  baseHp: number;
  baseMana: number;
  baseAttack: number;
  baseDefense: number;
  baseMagic: number;
  hpPerLevel: number;
  manaPerLevel: number;
  atkPerLevel: number;
  defPerLevel: number;
  magPerLevel: number;
  spells: Spell[];
  passive: string;
}

export const VOCATIONS: Record<string, Vocation> = {
  knight: {
    id: 'knight',
    name: 'Knight',
    icon: '⚔',
    color: '#c13030',
    description: 'Mestre das armas corpo-a-corpo. Tanque implacável.',
    baseHp: 185, baseMana: 50, baseAttack: 25, baseDefense: 10, baseMagic: 3,
    hpPerLevel: 25, manaPerLevel: 5, atkPerLevel: 4, defPerLevel: 2, magPerLevel: 1,
    passive: 'Shield Mastery: +20% defesa',
    spells: [
      { id: 'exori', name: 'Berserk', icon: '⚔', mana: 10, cooldown: 1800, damage: 35, range: 1.5, lastCast: 0, color: '#ff4444', type: 'aoe' },
      { id: 'exura', name: 'Wound Heal', icon: '❤', mana: 15, cooldown: 1500, damage: 60, range: 0, lastCast: 0, color: '#2ecc71', type: 'heal' },
      { id: 'exori_gran', name: 'Fierce Berserk', icon: '🔥', mana: 30, cooldown: 4000, damage: 80, range: 1.5, lastCast: 0, color: '#ff6a00', type: 'aoe' },
      { id: 'utamo_vita', name: 'Magic Shield', icon: '🛡', mana: 40, cooldown: 10000, damage: 100, range: 0, lastCast: 0, color: '#4a90e2', type: 'heal' },
    ],
  },
  paladin: {
    id: 'paladin',
    name: 'Paladin',
    icon: '🏹',
    color: '#4a7c3a',
    description: 'Arqueiro sagrado. Ataque à distância devastador.',
    baseHp: 150, baseMana: 80, baseAttack: 30, baseDefense: 7, baseMagic: 5,
    hpPerLevel: 18, manaPerLevel: 10, atkPerLevel: 5, defPerLevel: 1, magPerLevel: 1,
    passive: 'Eagle Eye: +30% dano à distância',
    spells: [
      { id: 'exori_con', name: 'Divine Arrow', icon: '🏹', mana: 12, cooldown: 1500, damage: 55, range: 7, lastCast: 0, color: '#f4e04d', type: 'attack' },
      { id: 'exura_san', name: 'Divine Healing', icon: '✨', mana: 25, cooldown: 2000, damage: 80, range: 0, lastCast: 0, color: '#f4e04d', type: 'heal' },
      { id: 'exevo_con', name: 'Multi Shot', icon: '🎯', mana: 30, cooldown: 3500, damage: 40, range: 6, lastCast: 0, color: '#ffcc33', type: 'aoe' },
      { id: 'utani_hur', name: 'Haste', icon: '💨', mana: 20, cooldown: 8000, damage: 0, range: 0, lastCast: 0, color: '#9bd4ff', type: 'heal' },
    ],
  },
  sorcerer: {
    id: 'sorcerer',
    name: 'Sorcerer',
    icon: '🔮',
    color: '#9b59ff',
    description: 'Mago destruidor. Mestre do fogo e energia.',
    baseHp: 120, baseMana: 130, baseAttack: 12, baseDefense: 4, baseMagic: 20,
    hpPerLevel: 12, manaPerLevel: 18, atkPerLevel: 1, defPerLevel: 1, magPerLevel: 4,
    passive: 'Arcane Power: +25% dano mágico',
    spells: [
      { id: 'exori_mort', name: 'Death Strike', icon: '💀', mana: 15, cooldown: 1800, damage: 65, range: 5, lastCast: 0, color: '#9b59ff', type: 'attack' },
      { id: 'adori_mas', name: 'Fireball', icon: '🔥', mana: 25, cooldown: 2500, damage: 80, range: 6, lastCast: 0, color: '#ff6a00', type: 'attack' },
      { id: 'exevo_vis', name: 'Energy Wave', icon: '⚡', mana: 40, cooldown: 4500, damage: 110, range: 4, lastCast: 0, color: '#4a90e2', type: 'aoe' },
      { id: 'adori_gran', name: 'Meteor', icon: '☄', mana: 60, cooldown: 8000, damage: 180, range: 5, lastCast: 0, color: '#ff3300', type: 'aoe' },
    ],
  },
  druid: {
    id: 'druid',
    name: 'Druid',
    icon: '🌿',
    color: '#2ecc71',
    description: 'Guardião da natureza. Curandeiro poderoso.',
    baseHp: 130, baseMana: 140, baseAttack: 10, baseDefense: 5, baseMagic: 18,
    hpPerLevel: 14, manaPerLevel: 20, atkPerLevel: 1, defPerLevel: 1, magPerLevel: 4,
    passive: 'Nature\'s Grace: Cura +30%',
    spells: [
      { id: 'exura_gran', name: 'Greater Heal', icon: '💚', mana: 20, cooldown: 1500, damage: 100, range: 0, lastCast: 0, color: '#2ecc71', type: 'heal' },
      { id: 'exori_frig', name: 'Ice Strike', icon: '❄', mana: 15, cooldown: 1800, damage: 55, range: 5, lastCast: 0, color: '#9bd4ff', type: 'attack' },
      { id: 'exevo_vita', name: 'Mass Heal', icon: '🌸', mana: 50, cooldown: 5000, damage: 150, range: 0, lastCast: 0, color: '#ff9bcc', type: 'heal' },
      { id: 'adori_ice', name: 'Ice Storm', icon: '🌨', mana: 35, cooldown: 4000, damage: 80, range: 4, lastCast: 0, color: '#4ad0ff', type: 'aoe' },
    ],
  },
  warlock: {
    id: 'warlock',
    name: 'Warlock',
    icon: '👿',
    color: '#8b1a8b',
    description: 'Bruxo das trevas. Drenar vida é sua arte.',
    baseHp: 125, baseMana: 150, baseAttack: 14, baseDefense: 4, baseMagic: 22,
    hpPerLevel: 13, manaPerLevel: 20, atkPerLevel: 2, defPerLevel: 1, magPerLevel: 4,
    passive: 'Life Tap: Ataques recuperam mana',
    spells: [
      { id: 'exori_kor', name: 'Soul Drain', icon: '💜', mana: 10, cooldown: 1500, damage: 45, range: 5, lastCast: 0, color: '#8b1a8b', type: 'attack' },
      { id: 'exura_vita', name: 'Dark Heal', icon: '🖤', mana: 15, cooldown: 2000, damage: 70, range: 0, lastCast: 0, color: '#6a0a6a', type: 'heal' },
      { id: 'exevo_mas', name: 'Curse', icon: '☠', mana: 35, cooldown: 4000, damage: 100, range: 5, lastCast: 0, color: '#4a0a4a', type: 'attack' },
      { id: 'summon', name: 'Summon Demon', icon: '👹', mana: 60, cooldown: 12000, damage: 0, range: 0, lastCast: 0, color: '#ff0000', type: 'heal' },
    ],
  },
  rogue: {
    id: 'rogue',
    name: 'Rogue',
    icon: '🗡',
    color: '#555555',
    description: 'Assassino furtivo. Dano explosivo e crítico.',
    baseHp: 140, baseMana: 70, baseAttack: 28, baseDefense: 6, baseMagic: 6,
    hpPerLevel: 16, manaPerLevel: 8, atkPerLevel: 5, defPerLevel: 1, magPerLevel: 1,
    passive: 'Critical Strike: 25% chance de dano dobrado',
    spells: [
      { id: 'exori_mas', name: 'Backstab', icon: '🗡', mana: 12, cooldown: 2000, damage: 80, range: 1.5, lastCast: 0, color: '#aaaaaa', type: 'attack' },
      { id: 'utana_vid', name: 'Invisibility', icon: '👻', mana: 25, cooldown: 10000, damage: 0, range: 0, lastCast: 0, color: '#cccccc', type: 'heal' },
      { id: 'poison', name: 'Poison Blade', icon: '🧪', mana: 20, cooldown: 3500, damage: 60, range: 1.5, lastCast: 0, color: '#5eff5e', type: 'attack' },
      { id: 'shadow', name: 'Shadow Step', icon: '💨', mana: 15, cooldown: 5000, damage: 50, range: 5, lastCast: 0, color: '#333333', type: 'attack' },
    ],
  },
  priest: {
    id: 'priest',
    name: 'Priest',
    icon: '⛪',
    color: '#f4e04d',
    description: 'Sacerdote sagrado. Cura suprema e luz divina.',
    baseHp: 135, baseMana: 160, baseAttack: 8, baseDefense: 6, baseMagic: 20,
    hpPerLevel: 15, manaPerLevel: 22, atkPerLevel: 1, defPerLevel: 1, magPerLevel: 4,
    passive: 'Divine Light: Mana regenera 50% mais rápido',
    spells: [
      { id: 'light_heal', name: 'Light Heal', icon: '✨', mana: 10, cooldown: 1000, damage: 60, range: 0, lastCast: 0, color: '#f4e04d', type: 'heal' },
      { id: 'smite', name: 'Holy Smite', icon: '⚡', mana: 20, cooldown: 2000, damage: 70, range: 5, lastCast: 0, color: '#f4e04d', type: 'attack' },
      { id: 'resurrection', name: 'Resurrection', icon: '🕊', mana: 80, cooldown: 20000, damage: 300, range: 0, lastCast: 0, color: '#ffffff', type: 'heal' },
      { id: 'holy_nova', name: 'Holy Nova', icon: '☀', mana: 40, cooldown: 5000, damage: 90, range: 3, lastCast: 0, color: '#fff9c4', type: 'aoe' },
    ],
  },
  deathknight: {
    id: 'deathknight',
    name: 'Death Knight',
    icon: '💀',
    color: '#4a0e0e',
    description: 'Cavaleiro da morte. Tanque dark com poderes necromânticos.',
    baseHp: 200, baseMana: 90, baseAttack: 28, baseDefense: 12, baseMagic: 8,
    hpPerLevel: 28, manaPerLevel: 8, atkPerLevel: 4, defPerLevel: 3, magPerLevel: 1,
    passive: 'Undying: Sobrevive com 1 HP uma vez a cada 60s',
    spells: [
      { id: 'death_strike', name: 'Death Strike', icon: '⚰', mana: 15, cooldown: 2000, damage: 50, range: 1.5, lastCast: 0, color: '#4a0e0e', type: 'attack' },
      { id: 'blood_tap', name: 'Blood Tap', icon: '🩸', mana: 0, cooldown: 8000, damage: 80, range: 0, lastCast: 0, color: '#c13030', type: 'heal' },
      { id: 'army_dead', name: 'Army of Dead', icon: '☠', mana: 60, cooldown: 15000, damage: 120, range: 3, lastCast: 0, color: '#3a1a3a', type: 'aoe' },
      { id: 'unholy', name: 'Unholy Frenzy', icon: '💀', mana: 30, cooldown: 6000, damage: 0, range: 0, lastCast: 0, color: '#6a0a6a', type: 'heal' },
    ],
  },
  monk: {
    id: 'monk',
    name: 'Monk',
    icon: '🥋',
    color: '#e6a817',
    description: 'Mestre das artes marciais. Híbrido ágil e mortal.',
    baseHp: 160, baseMana: 90, baseAttack: 30, baseDefense: 8, baseMagic: 12,
    hpPerLevel: 20, manaPerLevel: 10, atkPerLevel: 5, defPerLevel: 2, magPerLevel: 2,
    passive: 'Flowing Strikes: Combo ganha +15% por stack',
    spells: [
      { id: 'fist_of_thunder', name: 'Fist of Thunder', icon: '👊', mana: 12, cooldown: 1200, damage: 50, range: 1.5, lastCast: 0, color: '#e6a817', type: 'attack' },
      { id: 'chi_burst', name: 'Chi Burst', icon: '🌀', mana: 20, cooldown: 2500, damage: 70, range: 4, lastCast: 0, color: '#ffd700', type: 'attack' },
      { id: 'spinning_crane', name: 'Spinning Crane', icon: '🌪', mana: 30, cooldown: 4000, damage: 85, range: 2.5, lastCast: 0, color: '#ffaa00', type: 'aoe' },
      { id: 'serenity', name: 'Serenity', icon: '🧘', mana: 25, cooldown: 8000, damage: 120, range: 0, lastCast: 0, color: '#2ecc71', type: 'heal' },
    ],
  },
  ranger: {
    id: 'ranger',
    name: 'Ranger',
    icon: '🏹',
    color: '#1a6b3a',
    description: 'Guardião da floresta. Arqueiro preciso com armadilhas.',
    baseHp: 145, baseMana: 85, baseAttack: 32, baseDefense: 6, baseMagic: 8,
    hpPerLevel: 17, manaPerLevel: 10, atkPerLevel: 5, defPerLevel: 1, magPerLevel: 1,
    passive: 'Hunter\'s Mark: +20% dano em alvos com HP baixo',
    spells: [
      { id: 'power_shot', name: 'Power Shot', icon: '🏹', mana: 12, cooldown: 1400, damage: 60, range: 7, lastCast: 0, color: '#1a6b3a', type: 'attack' },
      { id: 'multishot', name: 'Multishot', icon: '🎯', mana: 25, cooldown: 3000, damage: 45, range: 6, lastCast: 0, color: '#2ecc71', type: 'aoe' },
      { id: 'poison_arrow', name: 'Poison Arrow', icon: '🐍', mana: 18, cooldown: 2500, damage: 50, range: 7, lastCast: 0, color: '#5eff5e', type: 'attack' },
      { id: 'rain_arrows', name: 'Rain of Arrows', icon: '🌧', mana: 45, cooldown: 7000, damage: 100, range: 5, lastCast: 0, color: '#90c090', type: 'aoe' },
    ],
  },
  necromancer: {
    id: 'necromancer',
    name: 'Necromancer',
    icon: '☠',
    color: '#2a6a4a',
    description: 'Senhor dos mortos. Convoca e drena a vida dos inimigos.',
    baseHp: 125, baseMana: 155, baseAttack: 12, baseDefense: 4, baseMagic: 22,
    hpPerLevel: 13, manaPerLevel: 22, atkPerLevel: 1, defPerLevel: 1, magPerLevel: 4,
    passive: 'Soul Harvest: Inimigos mortos regeneram mana',
    spells: [
      { id: 'bone_spear', name: 'Bone Spear', icon: '🦴', mana: 15, cooldown: 1600, damage: 60, range: 6, lastCast: 0, color: '#dddddd', type: 'attack' },
      { id: 'soul_drain', name: 'Soul Drain', icon: '💀', mana: 20, cooldown: 2500, damage: 75, range: 5, lastCast: 0, color: '#2a6a4a', type: 'attack' },
      { id: 'corpse_explosion', name: 'Corpse Explosion', icon: '💥', mana: 40, cooldown: 5000, damage: 130, range: 4, lastCast: 0, color: '#4a2a2a', type: 'aoe' },
      { id: 'raise_dead', name: 'Raise Dead', icon: '🧟', mana: 50, cooldown: 10000, damage: 90, range: 3, lastCast: 0, color: '#1a4a2a', type: 'aoe' },
    ],
  },
  berserker: {
    id: 'berserker',
    name: 'Berserker',
    icon: '🪓',
    color: '#a02020',
    description: 'Guerreiro selvagem. Dano colossal fica mais forte ferido.',
    baseHp: 175, baseMana: 60, baseAttack: 35, baseDefense: 7, baseMagic: 4,
    hpPerLevel: 22, manaPerLevel: 6, atkPerLevel: 6, defPerLevel: 1, magPerLevel: 1,
    passive: 'Reckless Fury: +50% dano com HP abaixo de 30%',
    spells: [
      { id: 'cleave', name: 'Cleave', icon: '🪓', mana: 12, cooldown: 1500, damage: 55, range: 1.5, lastCast: 0, color: '#a02020', type: 'aoe' },
      { id: 'whirlwind', name: 'Whirlwind', icon: '🌀', mana: 25, cooldown: 3500, damage: 90, range: 2.5, lastCast: 0, color: '#ff3030', type: 'aoe' },
      { id: 'reckless', name: 'Reckless Strike', icon: '💥', mana: 20, cooldown: 2500, damage: 110, range: 1.5, lastCast: 0, color: '#ff6060', type: 'attack' },
      { id: 'bloodrage', name: 'Bloodrage', icon: '🩸', mana: 35, cooldown: 12000, damage: 0, range: 0, lastCast: 0, color: '#c13030', type: 'heal' },
    ],
  },
  shaman: {
    id: 'shaman',
    name: 'Shaman',
    icon: '🔱',
    color: '#008b8b',
    description: 'Xamã elemental. Suporte poderoso com totens.',
    baseHp: 140, baseMana: 145, baseAttack: 14, baseDefense: 6, baseMagic: 19,
    hpPerLevel: 16, manaPerLevel: 20, atkPerLevel: 2, defPerLevel: 1, magPerLevel: 4,
    passive: 'Ancestral Wisdom: +15% cura e regen de aliados',
    spells: [
      { id: 'lightning_bolt', name: 'Lightning Bolt', icon: '⚡', mana: 14, cooldown: 1600, damage: 58, range: 6, lastCast: 0, color: '#008b8b', type: 'attack' },
      { id: 'chain_heal', name: 'Chain Heal', icon: '💚', mana: 25, cooldown: 2200, damage: 110, range: 0, lastCast: 0, color: '#2ecc71', type: 'heal' },
      { id: 'lava_burst', name: 'Lava Burst', icon: '🌋', mana: 35, cooldown: 4000, damage: 95, range: 5, lastCast: 0, color: '#ff4500', type: 'attack' },
      { id: 'earthquake', name: 'Earthquake', icon: '🌍', mana: 50, cooldown: 8000, damage: 115, range: 5, lastCast: 0, color: '#8b4513', type: 'aoe' },
    ],
  },
  templar: {
    id: 'templar',
    name: 'Templar',
    icon: '⚜',
    color: '#d4af37',
    description: 'Cavaleiro sagrado. Tanque divino com julgamento.',
    baseHp: 190, baseMana: 95, baseAttack: 26, baseDefense: 13, baseMagic: 10,
    hpPerLevel: 26, manaPerLevel: 9, atkPerLevel: 4, defPerLevel: 3, magPerLevel: 2,
    passive: 'Divine Bulwark: -10% dano recebido quando acima de 50% HP',
    spells: [
      { id: 'shield_bash', name: 'Shield Bash', icon: '🛡', mana: 14, cooldown: 1800, damage: 48, range: 1.5, lastCast: 0, color: '#d4af37', type: 'attack' },
      { id: 'judgment', name: 'Judgment', icon: '⚔', mana: 20, cooldown: 2500, damage: 70, range: 4, lastCast: 0, color: '#ffd700', type: 'attack' },
      { id: 'consecration', name: 'Consecration', icon: '✨', mana: 35, cooldown: 5000, damage: 85, range: 3, lastCast: 0, color: '#fff9c4', type: 'aoe' },
      { id: 'divine_shield', name: 'Divine Shield', icon: '🛡', mana: 40, cooldown: 12000, damage: 0, range: 0, lastCast: 0, color: '#ffffff', type: 'heal' },
    ],
  },
};

export const VOCATION_LIST = Object.values(VOCATIONS);

// ===== SPELL LEVEL-GATING & DETAIL ENRICHMENT =====
// Tier-based level requirements: spell 0 = Lv1, spell 1 = Lv5, spell 2 = Lv12, spell 3 = Lv20
const SPELL_TIER_LEVELS = [1, 5, 12, 20];
const SPELL_TIER_COEFFS = [0.8, 1.0, 1.4, 1.8]; // scaling coefficients per tier

// Enrich all spells with level gating + detailed formula defaults
function enrichSpells() {
  for (const voc of Object.values(VOCATIONS)) {
    voc.spells.forEach((spell, idx) => {
      const tier = Math.min(idx, SPELL_TIER_LEVELS.length - 1);
      spell.levelRequired = spell.levelRequired ?? SPELL_TIER_LEVELS[tier];
      spell.scalingCoeff = spell.scalingCoeff ?? SPELL_TIER_COEFFS[tier];
      spell.critChance = spell.critChance ?? 0;
      spell.critMult = spell.critMult ?? 2;
      spell.lifestealPercent = spell.lifestealPercent ?? 0;
      spell.variance = spell.variance ?? 0.2;
      spell.hitCount = spell.hitCount ?? 1;
      spell.piercePercent = spell.piercePercent ?? 0;
      // Damage type based on spell color/id hints
      if (!spell.damageType) {
        if (spell.color.includes('ff6a00') || spell.color.includes('ff3300')) spell.damageType = 'fire';
        else if (spell.color.includes('9bd4ff') || spell.color.includes('4ad0ff')) spell.damageType = 'ice';
        else if (spell.color.includes('4a90e2')) spell.damageType = 'energy';
        else if (spell.color.includes('9b59ff') || spell.color.includes('6a0a6a')) spell.damageType = 'death';
        else if (spell.color.includes('f4e04d') || spell.color.includes('fff9c4')) spell.damageType = 'holy';
        else if (spell.color.includes('2ecc71')) spell.damageType = 'nature';
        else spell.damageType = 'physical';
      }
    });
  }
}
enrichSpells();

// Get spells available for a given level (first N unlocked), keeping locked ones visible
export function getVocationSpells(vocationId: string, _playerLevel: number): Spell[] {
  const voc = VOCATIONS[vocationId];
  if (!voc) return [];
  return [...voc.spells].sort((a, b) => (a.levelRequired || 1) - (b.levelRequired || 1)).slice(0, 4);
}

// Check how many spells a player can use at their level
export function getUnlockedSpellCount(vocationId: string, playerLevel: number): number {
  const voc = VOCATIONS[vocationId];
  if (!voc) return 0;
  return voc.spells.filter((s) => (s.levelRequired || 1) <= playerLevel).length;
}
