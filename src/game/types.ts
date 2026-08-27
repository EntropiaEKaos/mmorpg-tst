import { GEMS, computeSetBonusStats } from './itemSets';

export type TileType =
  | 'grass'
  | 'water'
  | 'tree'
  | 'stone'
  | 'sand'
  | 'path'
  | 'wall'
  | 'floor'
  | 'lava'
  | 'bush'
  | 'rock'
  | 'wood_floor'
  | 'bridge';

export interface Tile {
  type: TileType;
  walkable: boolean;
  blocksSight?: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface Monster {
  id: string;
  name: string;
  pos: Position;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  xp: number;
  color: string;
  emoji: string;
  lastMove: number;
  lastAttack: number;
  respawnPos: Position;
  dead: boolean;
  respawnAt: number;
  size?: number;
  loot?: Array<{ name: string; icon: string; chance: number; value: number }>;
  level: number;
  type?: 'normal' | 'elite' | 'boss';
  damageType?: 'physical' | 'fire' | 'ice' | 'death' | 'energy' | 'holy';
}

export interface Player {
  pos: Position;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  level: number;
  xp: number;
  xpNext: number;
  attack: number;
  defense: number;
  speed: number;
  magic: number;
  gold: number;
  bankGold: number;
  lastAttack: number;
  lastRegen: number;
  direction: 'up' | 'down' | 'left' | 'right';
  targetId?: string;
  name: string;
  vocation: string;
  // Tibia-style skills
  skills: {
    fist: { level: number; progress: number };
    sword: { level: number; progress: number };
    axe: { level: number; progress: number };
    club: { level: number; progress: number };
    distance: { level: number; progress: number };
    shielding: { level: number; progress: number };
    magic: { level: number; progress: number };
    fishing: { level: number; progress: number };
  };
  // Equipment
  equipment: Partial<Record<EquipmentSlot, Equipment>>;
  // Buffs
  buffs: Buff[];
  // Alpha life systems (authoritative server snapshots when online)
  mounted: boolean;
  mountId?: string;
  tasks?: TaskSnapshot;
  appearance?: AppearanceSnapshot;
  mounts?: MountSnapshot;
  housing?: HousingSnapshot;
  // Death protection
  blessings: number;
  aol: boolean;
  // Profession
  profession?: 'miner' | 'herbalist' | 'fisher';
  // Quests
  quests: string[]; // completed quest ids
  activeQuests: ActiveQuest[];
  // Reputation
  reputation: Record<string, number>;
  // Statistics
  stats: {
    monstersKilled: number;
    bossesKilled: number;
    damageDealt: number;
    damageTaken: number;
    healingDone: number;
    goldEarned: number;
    distanceWalked: number;
    spellsCast: number;
    deaths: number;
    levelUps: number;
  };
  achievements: string[];
}

export type EquipmentSlot = 'weapon' | 'armor' | 'helmet' | 'legs' | 'boots' | 'shield' | 'ring' | 'ring2' | 'amulet' | 'cloak' | 'belt' | 'gloves' | 'relic';

export interface DerivedStats {
  totalAttack: number;
  totalDefense: number;
  totalArmor: number;
  totalMagic: number;
  totalMaxHp: number;
  totalMaxMana: number;
  critChance: number;
  lifesteal: number;
  thorns: number;
  moveSpeed: number;
  xpBonus: number;
  goldBonus: number;
  damageReduction: number;
}

export function computeDerivedStats(player: Player): DerivedStats {
  const stats: DerivedStats = {
    totalAttack: player.attack,
    totalDefense: player.defense,
    totalArmor: 0,
    totalMagic: player.magic,
    totalMaxHp: player.maxHp,
    totalMaxMana: player.maxMana,
    critChance: 15,
    lifesteal: 0,
    thorns: 0,
    moveSpeed: 0,
    xpBonus: 0,
    goldBonus: 0,
    damageReduction: 0,
  };

  // Gem lookup is a real ESM dependency; using require() in the browser silently
  // disabled socket bonuses under Vite.
  const gemMap: Record<string, { stat: string; value: number }> = {};
  for (const gem of GEMS) gemMap[gem.id] = { stat: gem.stat, value: gem.value };

  for (const eq of Object.values(player.equipment)) {
    if (!eq) continue;
    stats.totalAttack += eq.attack ?? 0;
    stats.totalDefense += eq.defense ?? 0;
    stats.totalArmor += eq.armor ?? 0;
    stats.totalMagic += eq.magic ?? 0;
    stats.totalMaxHp += eq.hp ?? 0;
    stats.totalMaxMana += eq.mana ?? 0;
    stats.critChance += eq.critChance ?? 0;
    stats.lifesteal += eq.lifesteal ?? 0;
    stats.thorns += eq.thorns ?? 0;
    stats.moveSpeed += eq.moveSpeed ?? 0;
    stats.xpBonus += eq.xpBonus ?? 0;
    stats.goldBonus += eq.goldBonus ?? 0;
    stats.damageReduction += eq.damageReduction ?? 0;
    for (const affix of eq.affixes || []) {
      const bonus = affix.stats || {};
      stats.totalAttack += bonus.attack ?? 0;
      stats.totalDefense += (bonus.defense ?? 0) + (bonus.armor ?? 0);
      stats.totalArmor += bonus.armor ?? 0;
      stats.totalMagic += bonus.magic ?? 0;
      stats.totalMaxHp += bonus.hp ?? 0;
      stats.totalMaxMana += bonus.mana ?? 0;
      stats.critChance += bonus.critChance ?? 0;
      stats.lifesteal += bonus.lifesteal ?? 0;
      stats.moveSpeed += bonus.moveSpeed ?? 0;
      stats.xpBonus += bonus.xpBonus ?? 0;
      stats.goldBonus += bonus.goldBonus ?? 0;
    }
    // Apply socketed gems
    if (eq.socketedGems) {
      for (const gemId of eq.socketedGems) {
        const gem = gemMap[gemId];
        if (!gem) continue;
        switch (gem.stat) {
          case 'attack': stats.totalAttack += gem.value; break;
          case 'defense': stats.totalDefense += gem.value; break;
          case 'magic': stats.totalMagic += gem.value; break;
          case 'hp': stats.totalMaxHp += gem.value; break;
          case 'mana': stats.totalMaxMana += gem.value; break;
          case 'crit': stats.critChance += gem.value; break;
          case 'lifesteal': stats.lifesteal += gem.value; break;
          case 'speed': stats.moveSpeed += gem.value; break;
        }
      }
    }
  }

  // Apply set bonuses. itemSets imports Player as a type-only dependency, so this
  // static import does not create a runtime cycle.
  const setBonus = computeSetBonusStats(player);
  stats.critChance += setBonus.crit;
  stats.lifesteal += setBonus.lifesteal;
  stats.thorns += setBonus.thorns;
  stats.moveSpeed += setBonus.speed;
  stats.xpBonus += setBonus.xp;
  stats.goldBonus += setBonus.gold;
  stats.damageReduction += setBonus.reduction;
  stats.totalMaxHp += setBonus.hp;
  stats.totalMaxMana += setBonus.mana;
  (stats as any)._setDamageBonus = setBonus.damage;
  (stats as any)._setMagicBonus = setBonus.magic;

  // Vocation passives
  if (player.vocation === 'rogue' || player.vocation === 'berserker') stats.critChance += 10;
  if (player.vocation === 'knight' || player.vocation === 'templar') stats.damageReduction += 5;
  return stats;
}

export interface EquipmentAffix {
  id: string;
  name: string;
  description: string;
  stats: Partial<Record<'attack' | 'defense' | 'armor' | 'hp' | 'mana' | 'magic' | 'critChance' | 'lifesteal' | 'moveSpeed' | 'xpBonus' | 'goldBonus', number>>;
}

export interface Equipment {
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
  critChance?: number; // % bonus crit chance
  lifesteal?: number; // % of damage healed
  thorns?: number; // damage returned to attacker
  moveSpeed?: number; // % speed bonus
  xpBonus?: number; // % XP bonus
  goldBonus?: number; // % gold bonus
  damageReduction?: number; // % damage reduction
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  level: number;
  description?: string;
  value: number;
  sockets?: number;
  socketedGems?: string[];
  baseItemId?: string;
  affixes?: EquipmentAffix[];
}

export interface Item {
  id: string;
  name: string;
  icon: string;
  type: 'potion' | 'weapon' | 'armor' | 'gold' | 'misc' | 'equipment' | 'material' | 'quest';
  quantity: number;
  value: number;
  description?: string;
  equipment?: Equipment;
  stackable?: boolean;
}

export interface Spell {
  id: string;
  name: string;
  icon: string;
  mana: number;
  cooldown: number;
  damage: number;
  range: number;
  lastCast: number;
  color: string;
  type: 'attack' | 'heal' | 'aoe' | 'buff' | 'summon';
  buffType?: 'haste' | 'shield' | 'invisible' | 'frenzy';
  buffDuration?: number;
  buffValue?: number;
  // Level-gating
  levelRequired?: number;
  // Detailed combat formula fields
  damageType?: 'physical' | 'fire' | 'ice' | 'energy' | 'death' | 'holy' | 'nature';
  scalingCoeff?: number;       // multiplier applied to magic/attack stat (e.g. 1.5 = 150% of magic)
  critChance?: number;         // % base crit chance for THIS spell (stacks with player crit)
  critMult?: number;           // crit damage multiplier (e.g. 2 = 200%)
  lifestealPercent?: number;   // % of damage returned as HP
  variance?: number;           // 0-1 randomness factor (0.2 = ±20%)
  dotDuration?: number;        // damage-over-time duration in ms (0 = none)
  dotDamage?: number;          // total dot damage over duration
  hitCount?: number;           // number of hits (multihit spells)
  piercePercent?: number;      // % of enemy defense ignored
  costPercent?: number;        // % of max mana as cost (alt to flat mana)
}

export interface Buff {
  id: string;
  name: string;
  icon: string;
  duration: number;
  startTime: number;
  value: number;
  type: 'haste' | 'shield' | 'invisible' | 'frenzy' | 'regen';
  color: string;
}

export interface Projectile {
  id: string;
  from: Position;
  to: Position;
  pos: Position;
  color: string;
  startTime: number;
  duration: number;
  type: 'arrow' | 'magic' | 'bolt' | 'aoe';
  emoji?: string;
}

export interface Particle {
  id: string;
  pos: Position;
  vel: { x: number; y: number };
  color: string;
  size: number;
  life: number;
  startTime: number;
  duration: number;
  gravity?: number;
}

export interface FloatingText {
  id: string;
  text: string;
  pos: Position;
  color: string;
  startTime: number;
  duration: number;
  big?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  color: string;
  time: number;
  channel: 'world' | 'say' | 'party' | 'guild' | 'trade' | 'system' | 'battle' | 'loot' | 'quest';
}

export interface Account {
  accountId?: string;
  username: string;
  characterName: string;
  vocation: string;
  level: number;
  created: number;
  sessionToken?: string;
  offline?: boolean;
  savedPlayer?: string; // legacy/offline JSON serialized player state
}

// Quest system
export interface Quest {
  id: string;
  name: string;
  description: string;
  npcId: string;
  objectives: QuestObjective[];
  rewards: QuestReward;
  requires?: string[]; // other quest ids
  levelRequired: number;
}

export interface QuestObjective {
  type: 'kill' | 'collect' | 'talk' | 'explore';
  target: string;
  targetName: string;
  count: number;
  current: number;
}

export interface QuestReward {
  xp: number;
  gold: number;
  items?: Array<{ name: string; icon: string; quantity: number }>;
  equipment?: Equipment;
}

export interface ActiveQuest {
  questId: string;
  objectives: QuestObjective[];
  startedAt: number;
}

// NPC system
export interface NPC {
  id: string;
  name: string;
  pos: Position;
  emoji: string;
  color: string;
  role: 'merchant' | 'quest' | 'banker' | 'trainer' | 'guard' | 'innkeeper' | 'taskmaster' | 'stablemaster' | 'outfitter' | 'realtor';
  dialogues: Dialogue[];
  shop?: ShopItem[];
  questId?: string;
}

export interface Dialogue {
  text: string;
  options: DialogueOption[];
}

export interface DialogueOption {
  text: string;
  nextDialogue?: number;
  action?: 'shop' | 'quest' | 'bank' | 'train' | 'heal' | 'bye' | 'mail' | 'books' | 'depot' | 'food' | 'life';
  questId?: string;
}

export interface ShopItem {
  name: string;
  icon: string;
  type: Item['type'];
  price: number;
  description?: string;
  quantity?: number;
  equipment?: Equipment;
}

// Alpha 9.2 life-system snapshots.
export interface TaskCatalogEntry {
  id: string; name: string; npcId: string; mapId: string; target: string; targetName: string; count: number;
  minLevel: number; maxLevel: number; repeatLimit: number; taskPoints: number; rewardGold: number; rewardXp: number;
  bossUnlock?: string; description?: string; completedCount: number; locked: boolean;
}
export interface ActiveTaskEntry extends TaskCatalogEntry { progress: number; ready: boolean; startedAt: number; }
export interface TaskSnapshot { points: number; rank: string; maxActive: number; completed: Record<string,number>; unlockedBosses: string[]; active: ActiveTaskEntry[]; catalog: TaskCatalogEntry[]; }

export interface OutfitCatalogEntry { id:string; name:string; icon:string; style:string; price:number; levelRequired:number; addon1Name?:string; addon2Name?:string; addonPrice:number; }
export interface PublicAppearance { outfit:{id:string;name:string;icon?:string;style:string}; colors:{head:string;primary:string;secondary:string;detail:string}; addonMask:number; }
export interface AppearanceSnapshot { selectedOutfitId:string; ownedOutfits:string[]; ownedAddons:Record<string,number[]>; addonMasks:Record<string,number>; colors:{head:string;primary:string;secondary:string;detail:string}; catalog:OutfitCatalogEntry[]; public:PublicAppearance; }

export interface MountCatalogEntry { id:string; name:string; icon:string; color:string; speedBonus:number; price:number; levelRequired:number; description?:string; }
export interface MountSnapshot { ownedMounts:string[]; selectedId:string; mounted:boolean; catalog:MountCatalogEntry[]; }

export interface HousingDecoration { id:string; decorId:string; x:number; y:number; name:string; icon:string; color:string; }
export interface HouseSnapshot { id:string; name:string; mapId:string; x:number; y:number; width:number; height:number; entranceX:number; entranceY:number; price:number; weeklyRent:number; levelRequired:number; style?:string; ownerName:string; rentDueAt:number; access:boolean; guests?:string[]; decor:HousingDecoration[]; }
export interface HousingDecorCatalogEntry { id:string; name:string; icon:string; kind:string; color:string; price:number; }
export interface HousingSnapshot { ownedHouseId:string; houses:HouseSnapshot[]; decorCatalog:HousingDecorCatalogEntry[]; }

// Mount system (legacy Quick Play catalog; authoritative mode uses MountSnapshot.catalog)
export interface Mount {
  id: string;
  name: string;
  icon: string;
  speedBonus: number; // percentage
  color: string;
  price: number;
  levelRequired: number;
}

export const MOUNTS: Mount[] = [
  { id: 'horse', name: 'War Horse', icon: '🐎', speedBonus: 30, color: '#8b6f47', price: 500, levelRequired: 5 },
  { id: 'wolf', name: 'Tamed Wolf', icon: '🐺', speedBonus: 40, color: '#5a5a5a', price: 1200, levelRequired: 10 },
  { id: 'tiger', name: 'Saber Tiger', icon: '🐅', speedBonus: 50, color: '#ff8c00', price: 3000, levelRequired: 15 },
  { id: 'dragon', name: 'Dragon Mount', icon: '🐉', speedBonus: 75, color: '#c13030', price: 10000, levelRequired: 25 },
  { id: 'unicorn', name: 'Unicorn', icon: '🦄', speedBonus: 60, color: '#ff9bcc', price: 5000, levelRequired: 20 },
];

// Achievements
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'combat' | 'exploration' | 'social' | 'collection' | 'progress';
  condition: (p: Player) => boolean;
  reward: { xp?: number; gold?: number; title?: string };
}

// Toast notifications
export interface Toast {
  id: string;
  type: 'achievement' | 'quest' | 'levelup' | 'loot' | 'info' | 'warning';
  title: string;
  description: string;
  icon: string;
  startTime: number;
  duration: number;
  color: string;
}
