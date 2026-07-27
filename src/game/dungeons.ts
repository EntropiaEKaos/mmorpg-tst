import type { Monster, Position } from './types';

export interface DungeonWave {
  wave: number;
  monsters: { name: string; emoji: string; color: string; hp: number; attack: number; defense: number; xp: number; count: number; size?: number }[];
}

export const DUNGEON_WAVES: DungeonWave[] = [
  { wave: 1, monsters: [{ name: 'Dungeon Rat', emoji: '🐀', color: '#8b6f47', hp: 30, attack: 6, defense: 2, xp: 15, count: 3, size: 0.7 }] },
  { wave: 2, monsters: [{ name: 'Dungeon Bat', emoji: '🦇', color: '#3a2a3a', hp: 45, attack: 9, defense: 2, xp: 22, count: 4 }] },
  { wave: 3, monsters: [{ name: 'Skeleton', emoji: '💀', color: '#d4d4c8', hp: 70, attack: 14, defense: 4, xp: 40, count: 4 }] },
  { wave: 4, monsters: [{ name: 'Zombie', emoji: '🧟', color: '#4a6a3a', hp: 110, attack: 18, defense: 5, xp: 60, count: 5 }] },
  { wave: 5, monsters: [{ name: 'Ghost', emoji: '👻', color: '#ccccff', hp: 130, attack: 24, defense: 4, xp: 80, count: 5 }] },
  { wave: 6, monsters: [{ name: 'Orc Berserker', emoji: '👹', color: '#3a4d13', hp: 180, attack: 30, defense: 8, xp: 110, count: 5 }] },
  { wave: 7, monsters: [{ name: 'Demon', emoji: '😈', color: '#c13030', hp: 260, attack: 42, defense: 12, xp: 180, count: 4 }] },
  { wave: 8, monsters: [{ name: 'Hellhound', emoji: '🐕', color: '#8b0000', hp: 320, attack: 50, defense: 14, xp: 250, count: 5 }] },
  { wave: 9, monsters: [{ name: 'Dragon', emoji: '🐉', color: '#c13030', hp: 450, attack: 60, defense: 18, xp: 400, count: 3, size: 1.3 }] },
  { wave: 10, monsters: [{ name: 'Dungeon Warden', emoji: '👹', color: '#8b0000', hp: 1200, attack: 80, defense: 25, xp: 2000, count: 1, size: 1.6 }] },
];

let dungeonIdCounter = 100000;

export function spawnDungeonWave(wave: DungeonWave, center: Position): Monster[] {
  const monsters: Monster[] = [];
  for (const tmpl of wave.monsters) {
    for (let i = 0; i < tmpl.count; i++) {
      const pos: Position = {
        x: center.x + Math.floor((Math.random() - 0.5) * 8),
        y: center.y + Math.floor((Math.random() - 0.5) * 8),
      };
      monsters.push({
        id: `dungeon_${dungeonIdCounter++}`,
        name: tmpl.name,
        pos,
        hp: tmpl.hp,
        maxHp: tmpl.hp,
        attack: tmpl.attack,
        defense: tmpl.defense,
        speed: 900,
        xp: tmpl.xp,
        color: tmpl.color,
        emoji: tmpl.emoji,
        size: tmpl.size ?? 1,
        level: wave.wave * 3,
        type: wave.wave === 10 ? 'boss' : wave.wave >= 7 ? 'elite' : 'normal',
        lastMove: 0,
        lastAttack: 0,
        respawnPos: { ...pos },
        dead: false,
        respawnAt: 0,
        loot: [{ name: 'Gold', icon: '🪙', chance: 0.7, value: wave.wave * 20 }],
      });
    }
  }
  return monsters;
}

export interface DungeonReward {
  wave: number;
  gold: number;
  xp: number;
}

export function getDungeonReward(wave: number): DungeonReward {
  return {
    wave,
    gold: wave * 100,
    xp: wave * 150,
  };
}

// ===== PET / COMPANION SYSTEM =====
export interface Pet {
  id: string;
  name: string;
  icon: string;
  color: string;
  attack: number;
  defense: number;
  hp: number;
  speed: number;
  ability: string;
  abilityDescription: string;
  price: number;
  levelRequired: number;
}

export const PETS: Pet[] = [
  { id: 'wolf_pup', name: 'Wolf Pup', icon: '🐺', color: '#8a8a8a', attack: 8, defense: 3, hp: 60, speed: 1000, ability: 'bite', abilityDescription: 'Bites enemies for bonus damage', price: 500, levelRequired: 3 },
  { id: 'boar', name: 'Wild Boar', icon: '🐗', color: '#6a4a3a', attack: 12, defense: 6, hp: 100, speed: 1200, ability: 'charge', abilityDescription: 'Charges and stuns briefly', price: 1500, levelRequired: 8 },
  { id: 'panther', name: 'Shadow Panther', icon: '🐆', color: '#2a2a2a', attack: 18, defense: 4, hp: 90, speed: 800, ability: 'pounce', abilityDescription: 'Fast pounce attacks, +crit', price: 3000, levelRequired: 12 },
  { id: 'bear_cub', name: 'Bear Companion', icon: '🐻', color: '#5a3a1e', attack: 22, defense: 10, hp: 180, speed: 1300, ability: 'maul', abilityDescription: 'Heavy maul attacks', price: 5000, levelRequired: 16 },
  { id: 'phoenix', name: 'Phoenix', icon: '🔥', color: '#ff6a00', attack: 30, defense: 8, hp: 150, speed: 700, ability: 'fireburst', abilityDescription: 'Fire attacks that burn enemies', price: 8000, levelRequired: 20 },
  { id: 'mini_dragon', name: 'Baby Dragon', icon: '🐉', color: '#c13030', attack: 40, defense: 15, hp: 250, speed: 900, ability: 'breath', abilityDescription: 'Fire breath AoE damage', price: 15000, levelRequired: 25 },
];

export function getOwnedPets(playerName: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(`tibia_pets_${playerName}`) || '[]');
  } catch { return []; }
}

export function getActivePet(playerName: string): string | null {
  return localStorage.getItem(`tibia_activepet_${playerName}`);
}

export function buyPet(playerName: string, petId: string): boolean {
  const owned = getOwnedPets(playerName);
  if (owned.includes(petId)) return false;
  owned.push(petId);
  localStorage.setItem(`tibia_pets_${playerName}`, JSON.stringify(owned));
  return true;
}

export function setActivePet(playerName: string, petId: string | null) {
  if (petId) localStorage.setItem(`tibia_activepet_${playerName}`, petId);
  else localStorage.removeItem(`tibia_activepet_${playerName}`);
}

export interface ActivePetState {
  petId: string;
  pos: Position;
  hp: number;
  maxHp: number;
  lastAttack: number;
  targetId?: string;
}

export function getPetState(playerName: string): ActivePetState | null {
  const activeId = getActivePet(playerName);
  if (!activeId) return null;
  const pet = PETS.find((p) => p.id === activeId);
  if (!pet) return null;
  return {
    petId: activeId,
    pos: { x: 40, y: 40 },
    hp: pet.hp,
    maxHp: pet.hp,
    lastAttack: 0,
  };
}
