import type { Position } from './types';

export interface LootItem {
  id: string;
  name: string;
  icon: string;
  quantity: number;
  value: number;
  isGold?: boolean;
  equipment?: any;
  rarity?: string;
  description?: string;
}

// A corpse or loot bag lying on the ground
export interface GroundItem {
  id: string;
  pos: Position;
  isCorpse: boolean;
  monsterName: string;
  monsterEmoji: string;
  items: LootItem[];
  createdAt: number;
  expireAt: number; // corpses despawn after a while
}

export const CORPSE_LIFETIME = 120000; // 2 minutes

let groundIdCounter = 0;

export function createCorpse(
  pos: Position,
  monsterName: string,
  monsterEmoji: string,
  items: LootItem[]
): GroundItem {
  return {
    id: `ground_${Date.now()}_${groundIdCounter++}`,
    pos: { ...pos },
    isCorpse: true,
    monsterName,
    monsterEmoji,
    items,
    createdAt: Date.now(),
    expireAt: Date.now() + CORPSE_LIFETIME,
  };
}

export function createLootBag(pos: Position, items: LootItem[]): GroundItem {
  return {
    id: `ground_${Date.now()}_${groundIdCounter++}`,
    pos: { ...pos },
    isCorpse: false,
    monsterName: 'Loot Bag',
    monsterEmoji: '💰',
    items,
    createdAt: Date.now(),
    expireAt: Date.now() + CORPSE_LIFETIME,
  };
}

// Determine loot drops for a monster (Tibia-style: roll each item independently)
export function rollLoot(monsterLoot: Array<{ name: string; icon: string; chance: number; value: number }>): LootItem[] {
  const drops: LootItem[] = [];
  for (const l of monsterLoot) {
    if (Math.random() < l.chance) {
      drops.push({
        id: `loot_${Date.now()}_${Math.random()}`,
        name: l.name,
        icon: l.icon,
        quantity: 1,
        value: l.value,
        isGold: l.name === 'Gold',
      });
    }
  }
  return drops;
}
