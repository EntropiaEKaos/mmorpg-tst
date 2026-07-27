import type { Player } from './types';

// ===== EQUIPMENT SETS =====
export interface EquipmentSet {
  id: string;
  name: string;
  icon: string;
  pieces: string[]; // item ids that belong to this set
  bonuses: { pieces: number; description: string; effect: string }[];
}

export const EQUIPMENT_SETS: EquipmentSet[] = [
  {
    id: 'dragon_set',
    name: 'Dragon slayer',
    icon: '🐉',
    pieces: ['dragon_slayer', 'dragon_mail', 'dragon_shield'],
    bonuses: [
      { pieces: 2, description: '+10% damage to all enemies', effect: 'damage:10' },
      { pieces: 3, description: '+15% damage and +5% lifesteal', effect: 'damage:15,lifesteal:5' },
    ],
  },
  {
    id: 'king_set',
    name: 'Royal Regalia',
    icon: '👑',
    pieces: ['excalibur', 'crown'],
    bonuses: [
      { pieces: 2, description: '+15% XP and +10% gold', effect: 'xp:15,gold:10' },
    ],
  },
  {
    id: 'mage_set',
    name: 'Archmage\'s Vestments',
    icon: '🔮',
    pieces: ['magic_staff', 'scholar_belt', 'sage_ring', 'xp_amulet'],
    bonuses: [
      { pieces: 2, description: '+12% magic damage', effect: 'magic:12' },
      { pieces: 3, description: '+12% magic, +15% XP, +50 mana', effect: 'magic:12,xp:15,mana:50' },
      { pieces: 4, description: 'Master of Arcane: all above +10% crit', effect: 'magic:12,xp:15,mana:50,crit:10' },
    ],
  },
  {
    id: 'swift_set',
    name: 'Windwalker\'s Garb',
    icon: '💨',
    pieces: ['boots_haste', 'swift_gloves', 'stealth_cloak', 'swift_legs'],
    bonuses: [
      { pieces: 2, description: '+15% movement speed', effect: 'speed:15' },
      { pieces: 3, description: '+15% speed, +8% crit', effect: 'speed:15,crit:8' },
      { pieces: 4, description: 'Swift Soul: all above +10% damage', effect: 'speed:15,crit:8,damage:10' },
    ],
  },
  {
    id: 'tank_set',
    name: 'Bulwark of the Gods',
    icon: '🛡',
    pieces: ['plate_armor', 'tower_shield', 'gauntlets', 'strength_belt'],
    bonuses: [
      { pieces: 2, description: '+10% damage reduction', effect: 'reduction:10' },
      { pieces: 3, description: '+10% reduction, +6 thorns', effect: 'reduction:10,thorns:6' },
      { pieces: 4, description: 'Unbreakable: all above +100 HP', effect: 'reduction:10,thorns:6,hp:100' },
    ],
  },
  {
    id: 'vampire_set',
    name: 'Bloodfang Collection',
    icon: '🩸',
    pieces: ['vamp_blade', 'vamp_cloak', 'vamp_ring'],
    bonuses: [
      { pieces: 2, description: '+8% lifesteal', effect: 'lifesteal:8' },
      { pieces: 3, description: 'Vampiric Lord: +8% lifesteal, +10% crit', effect: 'lifesteal:8,crit:10' },
    ],
  },
  {
    id: 'fortune_set',
    name: 'Treasure Hunter',
    icon: '💰',
    pieces: ['greed_helm', 'gold_amulet', 'lucky_charm'],
    bonuses: [
      { pieces: 2, description: '+20% gold from monsters', effect: 'gold:20' },
      { pieces: 3, description: 'Midas Touch: +20% gold, +10% XP', effect: 'gold:20,xp:10' },
    ],
  },
];

export interface ActiveSetBonus {
  setId: string;
  name: string;
  icon: string;
  piecesEquipped: number;
  activeBonuses: { pieces: number; description: string }[];
}

export function getActiveSetBonuses(player: Player): ActiveSetBonus[] {
  const result: ActiveSetBonus[] = [];
  const equippedIds = Object.values(player.equipment).map((e) => e?.id).filter(Boolean) as string[];

  for (const set of EQUIPMENT_SETS) {
    const piecesEquipped = set.pieces.filter((id) => equippedIds.includes(id)).length;
    if (piecesEquipped >= 2) {
      const activeBonuses = set.bonuses.filter((b) => piecesEquipped >= b.pieces);
      if (activeBonuses.length > 0) {
        result.push({
          setId: set.id,
          name: set.name,
          icon: set.icon,
          piecesEquipped,
          activeBonuses: activeBonuses.map((b) => ({ pieces: b.pieces, description: b.description })),
        });
      }
    }
  }
  return result;
}

export interface SetStatBonus {
  damage: number;
  magic: number;
  xp: number;
  gold: number;
  mana: number;
  crit: number;
  speed: number;
  reduction: number;
  thorns: number;
  hp: number;
  lifesteal: number;
}

export function computeSetBonusStats(player: Player): SetStatBonus {
  const bonuses = getActiveSetBonuses(player);
  const stats: SetStatBonus = {
    damage: 0, magic: 0, xp: 0, gold: 0, mana: 0, crit: 0,
    speed: 0, reduction: 0, thorns: 0, hp: 0, lifesteal: 0,
  };
  for (const set of EQUIPMENT_SETS) {
    const active = bonuses.find((b) => b.setId === set.id);
    if (!active) continue;
    for (const sb of set.bonuses) {
      if (active.piecesEquipped >= sb.pieces) {
        for (const part of sb.effect.split(',')) {
          const [key, val] = part.split(':');
          const num = parseInt(val);
          if (key in stats && !isNaN(num)) (stats as any)[key] += num;
        }
      }
    }
  }
  return stats;
}

// ===== GEM SOCKETING =====
export interface Gem {
  id: string;
  name: string;
  icon: string;
  color: string;
  stat: 'attack' | 'defense' | 'magic' | 'hp' | 'mana' | 'crit' | 'lifesteal' | 'speed';
  value: number;
  tier: number;
  rarity: 'uncommon' | 'rare' | 'epic' | 'legendary';
  description: string;
}

export const GEMS: Gem[] = [
  // Tier 1
  { id: 'ruby_t1', name: 'Chipped Ruby', icon: '🔴', color: '#ff3030', stat: 'attack', value: 3, tier: 1, rarity: 'uncommon', description: '+3 Attack' },
  { id: 'sapphire_t1', name: 'Chipped Sapphire', icon: '🔵', color: '#3030ff', stat: 'defense', value: 3, tier: 1, rarity: 'uncommon', description: '+3 Defense' },
  { id: 'emerald_t1', name: 'Chipped Emerald', icon: '🟢', color: '#30ff30', stat: 'magic', value: 3, tier: 1, rarity: 'uncommon', description: '+3 Magic' },
  // Tier 2
  { id: 'ruby_t2', name: 'Flawed Ruby', icon: '🔴', color: '#ff3030', stat: 'attack', value: 7, tier: 2, rarity: 'rare', description: '+7 Attack' },
  { id: 'topaz_t2', name: 'Flawed Topaz', icon: '🟡', color: '#ffd030', stat: 'crit', value: 4, tier: 2, rarity: 'rare', description: '+4% Crit' },
  { id: 'garnet_t2', name: 'Flawed Garnet', icon: '🔴', color: '#ff6060', stat: 'hp', value: 30, tier: 2, rarity: 'rare', description: '+30 HP' },
  // Tier 3
  { id: 'ruby_t3', name: 'Flawless Ruby', icon: '♦', color: '#ff1010', stat: 'attack', value: 15, tier: 3, rarity: 'epic', description: '+15 Attack' },
  { id: 'amethyst_t3', name: 'Flawless Amethyst', icon: '🟣', color: '#a030ff', stat: 'lifesteal', value: 4, tier: 3, rarity: 'epic', description: '+4% Lifesteal' },
  { id: 'diamond_t3', name: 'Flawless Diamond', icon: '💎', color: '#ffffff', stat: 'speed', value: 6, tier: 3, rarity: 'epic', description: '+6% Speed' },
  // Tier 4 (Legendary)
  { id: 'soul_gem', name: 'Soul Gem', icon: '💠', color: '#00ffff', stat: 'magic', value: 20, tier: 4, rarity: 'legendary', description: '+20 Magic' },
  { id: 'star_ruby', name: 'Star Ruby', icon: '🌟', color: '#ff5050', stat: 'attack', value: 25, tier: 4, rarity: 'legendary', description: '+25 Attack' },
];

export function randomGemDrop(playerLevel: number): Gem | null {
  const eligible = GEMS.filter((g) => g.tier <= Math.min(4, Math.floor(playerLevel / 8) + 1));
  if (eligible.length === 0) return null;
  const weights: Record<string, number> = { uncommon: 50, rare: 25, epic: 8, legendary: 2 };
  const totalWeight = eligible.reduce((s, g) => s + (weights[g.rarity] || 1), 0);
  let roll = Math.random() * totalWeight;
  for (const g of eligible) {
    roll -= weights[g.rarity] || 1;
    if (roll <= 0) return g;
  }
  return eligible[0];
}
