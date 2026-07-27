import type { Player } from './types';

export interface BestiaryEntry {
  id: string;
  name: string;
  emoji: string;
  description: string;
  hp: number;
  attack: number;
  defense: number;
  xp: number;
  type: 'normal' | 'elite' | 'boss';
  damageType?: string;
  location: string;
  loot: string[];
  killsRequired: number; // kills to complete entry
  category: 'beast' | 'humanoid' | 'undead' | 'demon' | 'dragon';
  weaknesses?: string[];
  resistances?: string[];
}

export const BESTIARY: BestiaryEntry[] = [
  { id: 'rat', name: 'Rat', emoji: '🐀', description: 'A common sewer rat. Weak but annoying.', hp: 20, attack: 4, defense: 1, xp: 10, type: 'normal', location: 'Town outskirts', loot: ['Cheese'], killsRequired: 5, category: 'beast', weaknesses: ['fire'] },
  { id: 'snake', name: 'Snake', emoji: '🐍', description: 'Venomous serpent. Quick strikes.', hp: 35, attack: 7, defense: 2, xp: 18, type: 'normal', location: 'Forest (NW)', loot: ['Snake Skin'], killsRequired: 5, category: 'beast', weaknesses: ['ice'] },
  { id: 'spider', name: 'Spider', emoji: '🕷', description: 'Giant web-spinning arachnid.', hp: 45, attack: 9, defense: 3, xp: 22, type: 'normal', location: 'Forest (NW)', loot: ['Spider Silk'], killsRequired: 5, category: 'beast', weaknesses: ['fire'] },
  { id: 'wolf', name: 'Wolf', emoji: '🐺', description: 'Pack hunter of the eastern woods.', hp: 60, attack: 12, defense: 4, xp: 30, type: 'normal', location: 'Eastern Forest', loot: ['Meat'], killsRequired: 5, category: 'beast' },
  { id: 'bear', name: 'Bear', emoji: '🐻', description: 'Massive brown bear. Extremely tough.', hp: 120, attack: 20, defense: 6, xp: 55, type: 'normal', location: 'Eastern Forest', loot: ['Bear Paw', 'Meat'], killsRequired: 5, category: 'beast', weaknesses: ['death'] },
  { id: 'orc', name: 'Orc', emoji: '👹', description: 'Savage green-skinned warrior.', hp: 100, attack: 18, defense: 5, xp: 55, type: 'normal', location: 'Southern Wastes', loot: ['Gold', 'Orc Tooth'], killsRequired: 5, category: 'humanoid' },
  { id: 'orc_warrior', name: 'Orc Warrior', emoji: '👹', description: 'Elite orc with battle scars.', hp: 180, attack: 28, defense: 8, xp: 95, type: 'elite', location: 'Southern Wastes', loot: ['Gold', 'Orc Tooth'], killsRequired: 3, category: 'humanoid' },
  { id: 'skeleton', name: 'Skeleton', emoji: '💀', description: 'Animated bones. Death damage.', hp: 80, attack: 15, defense: 4, xp: 45, type: 'normal', damageType: 'death', location: 'Graveyard (SE)', loot: ['Bone'], killsRequired: 5, category: 'undead', weaknesses: ['holy'] },
  { id: 'ghost', name: 'Ghost', emoji: '👻', description: 'Ethereal spirit. Physical attacks pass through.', hp: 90, attack: 22, defense: 3, xp: 65, type: 'normal', damageType: 'death', location: 'Graveyard (SE)', loot: ['Ectoplasm'], killsRequired: 5, category: 'undead', weaknesses: ['holy'], resistances: ['physical'] },
  { id: 'troll', name: 'Troll', emoji: '🧌', description: 'Massive green brute. Regenerates HP.', hp: 200, attack: 30, defense: 10, xp: 110, type: 'elite', location: 'Southern Wastes', loot: ['Gold', 'Troll Hide'], killsRequired: 3, category: 'humanoid', weaknesses: ['fire'] },
  { id: 'demon', name: 'Demon', emoji: '😈', description: 'Hellfire incarnate. Fire damage.', hp: 400, attack: 50, defense: 15, xp: 300, type: 'elite', damageType: 'fire', location: 'Southern Wastes', loot: ['Gold', 'Demon Horn'], killsRequired: 3, category: 'demon', weaknesses: ['holy'] },
  { id: 'orc_king', name: 'Orc King', emoji: '👑', description: 'Ruler of the orc horde. Commands legions.', hp: 800, attack: 60, defense: 20, xp: 800, type: 'boss', location: 'Orc Fortress', loot: ['Gold', 'Crown'], killsRequired: 1, category: 'humanoid' },
  { id: 'lich', name: 'Lich', emoji: '🧙', description: 'Undead sorcerer of immense power.', hp: 1000, attack: 75, defense: 25, xp: 1500, type: 'boss', damageType: 'death', location: 'Crypt (SE)', loot: ['Gold', 'Lich Staff'], killsRequired: 1, category: 'undead', weaknesses: ['holy'] },
  { id: 'dragon_lord', name: 'Dragon Lord', emoji: '🐉', description: 'Ancient wyrm. The ultimate challenge.', hp: 1500, attack: 85, defense: 30, xp: 2000, type: 'boss', damageType: 'fire', location: 'Dragon Lair (SE)', loot: ['Gold', 'Dragon Scale', 'Magic Rune'], killsRequired: 1, category: 'dragon', weaknesses: ['ice'] },
];

export function getBestiaryProgress(player: Player): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(`tibia_bestiary_${player.name}`) || '{}');
  } catch {
    return {};
  }
}

export function recordKill(player: Player, monsterName: string): Record<string, number> {
  const progress = getBestiaryProgress(player);
  progress[monsterName] = (progress[monsterName] || 0) + 1;
  localStorage.setItem(`tibia_bestiary_${player.name}`, JSON.stringify(progress));
  return progress;
}
