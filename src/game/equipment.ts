import type { EquipmentSlot } from './types';

export interface EquipmentItem {
  id: string;
  name: string;
  icon: string;
  slot: EquipmentSlot;
  attack?: number;
  defense?: number;
  armor?: number;
  hp?: number;
  mana?: number;
  magic?: number;
  critChance?: number;
  lifesteal?: number;
  thorns?: number;
  moveSpeed?: number;
  xpBonus?: number;
  goldBonus?: number;
  damageReduction?: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  level: number;
  description?: string;
  value: number;
}

export const RARITY_COLORS: Record<EquipmentItem['rarity'], string> = {
  common: '#aaaaaa',
  uncommon: '#2ecc71',
  rare: '#3498db',
  epic: '#9b59ff',
  legendary: '#ff8c00',
};

// Starter gear
export const STARTER_GEAR: EquipmentItem[] = [
  {
    id: 'starter_sword',
    name: 'Iron Sword',
    icon: '🗡',
    slot: 'weapon',
    attack: 5,
    rarity: 'common',
    level: 1,
    description: 'A simple iron sword.',
    value: 25,
  },
  {
    id: 'starter_armor',
    name: 'Cloth Robe',
    icon: '👘',
    slot: 'armor',
    armor: 3,
    rarity: 'common',
    level: 1,
    description: 'Basic cloth protection.',
    value: 20,
  },
];

// Loot tables for bosses/monsters
export const EQUIPMENT_LOOT: EquipmentItem[] = [
  // Weapons
  { id: 'steel_sword', name: 'Steel Sword', icon: '⚔', slot: 'weapon', attack: 12, rarity: 'uncommon', level: 5, value: 120 },
  { id: 'magic_staff', name: 'Magic Staff', icon: '🪄', slot: 'weapon', attack: 8, magic: 5, mana: 20, rarity: 'rare', level: 8, value: 350 },
  { id: 'vamp_blade', name: 'Vampiric Blade', icon: '🗡', slot: 'weapon', attack: 18, lifesteal: 8, rarity: 'rare', level: 12, value: 600, description: 'Steals 8% of damage as HP.' },
  { id: 'crit_dagger', name: 'Assassin\'s Dagger', icon: '🔪', slot: 'weapon', attack: 15, critChance: 12, rarity: 'epic', level: 14, value: 900, description: '+12% critical chance.' },
  { id: 'dragon_slayer', name: 'Dragon Slayer', icon: '🔪', slot: 'weapon', attack: 25, rarity: 'epic', level: 15, value: 1200 },
  { id: 'excalibur', name: 'Excalibur', icon: '⚔', slot: 'weapon', attack: 45, hp: 50, critChance: 5, lifesteal: 3, rarity: 'legendary', level: 25, value: 5000, description: 'The legendary sword of kings.' },
  // Armor
  { id: 'leather_armor', name: 'Leather Armor', icon: '🎽', slot: 'armor', armor: 8, rarity: 'uncommon', level: 3, value: 150 },
  { id: 'thorn_armor', name: 'Thornmail', icon: '🌿', slot: 'armor', armor: 10, thorns: 5, rarity: 'rare', level: 8, value: 400, description: 'Returns 5 damage to attackers.' },
  { id: 'plate_armor', name: 'Plate Armor', icon: '🛡', slot: 'armor', armor: 15, defense: 3, damageReduction: 3, rarity: 'rare', level: 10, value: 500 },
  { id: 'xp_robe', name: 'Scholar\'s Robe', icon: '👘', slot: 'armor', armor: 4, magic: 6, xpBonus: 8, rarity: 'rare', level: 10, value: 600, description: '+8% XP from all sources.' },
  { id: 'dragon_mail', name: 'Dragon Mail', icon: '🎽', slot: 'armor', armor: 28, hp: 40, damageReduction: 5, rarity: 'epic', level: 18, value: 2000 },
  // Helmets
  { id: 'iron_helm', name: 'Iron Helmet', icon: '⛑', slot: 'helmet', armor: 5, rarity: 'common', level: 2, value: 80 },
  { id: 'greed_helm', name: 'Helm of Greed', icon: '🎩', slot: 'helmet', armor: 6, goldBonus: 10, rarity: 'rare', level: 10, value: 500, description: '+10% gold from monsters.' },
  { id: 'crown', name: 'Crown of Kings', icon: '👑', slot: 'helmet', armor: 12, magic: 8, mana: 30, xpBonus: 5, goldBonus: 5, rarity: 'legendary', level: 20, value: 3500 },
  // Legs
  { id: 'steel_legs', name: 'Steel Legs', icon: '🦿', slot: 'legs', armor: 7, rarity: 'uncommon', level: 5, value: 180 },
  { id: 'swift_legs', name: 'Leggings of Swiftness', icon: '👖', slot: 'legs', armor: 5, moveSpeed: 10, rarity: 'rare', level: 12, value: 500, description: '+10% movement speed.' },
  // Boots
  { id: 'boots_haste', name: 'Boots of Haste', icon: '👢', slot: 'boots', armor: 2, moveSpeed: 15, rarity: 'rare', level: 10, value: 400, description: '+15% movement speed' },
  { id: 'boot_travel', name: 'Traveler\'s Boots', icon: '🥾', slot: 'boots', armor: 3, moveSpeed: 8, xpBonus: 3, rarity: 'uncommon', level: 5, value: 250 },
  // Shield
  { id: 'tower_shield', name: 'Tower Shield', icon: '🛡', slot: 'shield', defense: 10, armor: 5, rarity: 'rare', level: 8, value: 350 },
  { id: 'thorn_shield', name: 'Bramble Shield', icon: '🌵', slot: 'shield', defense: 8, thorns: 8, rarity: 'epic', level: 12, value: 800, description: 'Returns 8 damage to attackers.' },
  { id: 'dragon_shield', name: 'Dragon Shield', icon: '🛡', slot: 'shield', defense: 18, hp: 30, damageReduction: 4, rarity: 'epic', level: 15, value: 1500 },
  // Rings
  { id: 'might_ring', name: 'Might Ring', icon: '💍', slot: 'ring', attack: 5, rarity: 'rare', level: 8, value: 400 },
  { id: 'crit_ring', name: 'Ring of Precision', icon: '💍', slot: 'ring', critChance: 8, rarity: 'rare', level: 10, value: 500, description: '+8% critical chance.' },
  { id: 'vamp_ring', name: 'Ring of the Leech', icon: '💍', slot: 'ring', lifesteal: 5, rarity: 'epic', level: 12, value: 700, description: 'Steals 5% of damage as HP.' },
  { id: 'stealth_ring', name: 'Stealth Ring', icon: '💍', slot: 'ring', rarity: 'epic', level: 12, value: 800, description: 'Grants invisibility periodically' },
  // Amulets
  { id: 'xp_amulet', name: 'Amulet of Wisdom', icon: '📿', slot: 'amulet', magic: 4, xpBonus: 10, rarity: 'rare', level: 8, value: 500, description: '+10% XP.' },
  { id: 'gold_amulet', name: 'Golden Amulet', icon: '🥇', slot: 'amulet', goldBonus: 15, rarity: 'rare', level: 6, value: 400, description: '+15% gold.' },
  { id: 'amulet_loss', name: 'Amulet of Loss', icon: '📿', slot: 'amulet', rarity: 'legendary', level: 1, value: 2500, description: 'Prevents XP loss on death' },
  // Cloaks
  { id: 'cloth_cloak', name: 'Cloth Cloak', icon: '🧥', slot: 'cloak', armor: 2, rarity: 'common', level: 1, value: 60 },
  { id: 'stealth_cloak', name: 'Shadow Cloak', icon: '🦇', slot: 'cloak', armor: 5, moveSpeed: 8, rarity: 'rare', level: 10, value: 550, description: '+8% movement speed.' },
  { id: 'vamp_cloak', name: 'Vampiric Cloak', icon: '🧛', slot: 'cloak', armor: 6, lifesteal: 4, critChance: 3, rarity: 'epic', level: 16, value: 1800, description: '4% lifesteal + 3% crit.' },
  { id: 'phoenix_cloak', name: 'Phoenix Cloak', icon: '🔥', slot: 'cloak', armor: 12, hp: 60, damageReduction: 5, rarity: 'legendary', level: 22, value: 3200, description: 'Reborn from ashes.' },
  // Belts
  { id: 'leather_belt', name: 'Leather Belt', icon: '🥋', slot: 'belt', armor: 1, rarity: 'common', level: 1, value: 40 },
  { id: 'strength_belt', name: 'Belt of Strength', icon: '💪', slot: 'belt', attack: 6, hp: 20, rarity: 'rare', level: 10, value: 500, description: '+6 ATK, +20 HP.' },
  { id: 'scholar_belt', name: 'Arcane Sash', icon: '🪢', slot: 'belt', mana: 30, magic: 5, xpBonus: 5, rarity: 'epic', level: 15, value: 1200, description: '+5% XP, +5 MAG.' },
  // Gloves
  { id: 'cloth_gloves', name: 'Cloth Gloves', icon: '🧤', slot: 'gloves', armor: 1, rarity: 'common', level: 1, value: 40 },
  { id: 'swift_gloves', name: 'Gloves of Haste', icon: '🧤', slot: 'gloves', armor: 3, critChance: 5, moveSpeed: 5, rarity: 'rare', level: 10, value: 550, description: '+5% crit, +5% speed.' },
  { id: 'gauntlets', name: 'Warlord\'s Gauntlets', icon: '🥊', slot: 'gloves', armor: 8, attack: 8, thorns: 4, rarity: 'epic', level: 16, value: 1500, description: '+8 ATK, +4 thorns.' },
  // Relics (artifact)
  { id: 'lucky_charm', name: 'Lucky Charm', icon: '🍀', slot: 'relic', critChance: 4, goldBonus: 5, rarity: 'rare', level: 8, value: 600, description: '+4% crit, +5% gold.' },
  { id: 'soul_stone', name: 'Soul Stone', icon: '💠', slot: 'relic', magic: 8, mana: 40, lifesteal: 3, rarity: 'epic', level: 15, value: 1800, description: 'Stores the souls of the fallen.' },
  { id: 'world_heart', name: 'Heart of the World', icon: '❤', slot: 'relic', hp: 80, mana: 40, attack: 10, magic: 10, damageReduction: 4, rarity: 'legendary', level: 25, value: 6000, description: 'The ultimate artifact.' },
  // Second ring
  { id: 'twin_ring', name: 'Twin Ring', icon: '💍', slot: 'ring2', attack: 4, defense: 4, rarity: 'rare', level: 8, value: 450 },
  { id: 'sage_ring', name: 'Sage\'s Ring', icon: '💍', slot: 'ring2', magic: 6, mana: 25, xpBonus: 5, rarity: 'epic', level: 12, value: 800, description: '+5% XP.' },
];

export function getDropByLevel(playerLevel: number, luck: number = 1): EquipmentItem | null {
  const eligible = EQUIPMENT_LOOT.filter((e) => e.level <= playerLevel + 3);
  if (eligible.length === 0) return null;
  const roll = Math.random() / luck;
  // Drop chances based on rarity
  const weights: Record<EquipmentItem['rarity'], number> = {
    common: 0.6,
    uncommon: 0.3,
    rare: 0.1,
    epic: 0.02,
    legendary: 0.005,
  };
  if (roll > 0.3) return null; // 70% chance no drop
  const pick = eligible[Math.floor(Math.random() * eligible.length)];
  if (Math.random() > weights[pick.rarity] * 3) return null;
  return pick;
}
