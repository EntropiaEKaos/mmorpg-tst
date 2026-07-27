// ===================================================================
//  UNIFIED SAVE MANAGER — Single source of truth for player data
//  -----------------------------------------------------------------
//  Replaces 20+ fragmented localStorage keys with ONE versioned object.
//  Works in BOTH Quick Play (localStorage) and Online (server DB).
//  Auto-migrates old fragmented saves into the unified format.
// ===================================================================

import type { Player, Item } from './types';
import { getBlessings, getProfessions, getReputation, getStamina, getDailyRewardState } from './systems';
import { getBestiaryProgress } from './bestiary';
import { getMysteryProgress } from './questCreator';
import { getCoins } from './economy';
import { getSkullState, isPvpEnabled } from './skull';
import { getOwnedPets, getActivePet } from './dungeons';

export interface PlayerSave {
  version: number;
  name: string;
  vocation: string;
  // Core progression
  level: number;
  xp: number;
  gold: number;
  bankGold: number;
  // Base stats (equipment adds on top)
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  attack: number;
  defense: number;
  magic: number;
  // Deep systems
  skills: any;
  talents: Record<string, number>;
  blessings: string[];
  achievements: string[];
  professions: any;
  reputation: Record<string, number>;
  stamina: number;
  bestiary: Record<string, number>;
  mysteryProgress: any;
  // Inventory & economy
  inventory: Item[];
  equipment: Partial<Record<string, any>>;
  depot: Item[];
  coins: number;
  // Pets & mounts
  pets: string[];
  activePet: string | null;
  mounts: string[];
  // PvP & misc
  skull: any;
  pvpEnabled: boolean;
  dailyReward: any;
  stats: any;
  lastSaved: number;
}

const CURRENT_VERSION = 2;
const SAVE_KEY = (name: string) => `moria_save_${name}`;

// ===== EXPORT: Build unified save from player + systems =====
export function buildSave(player: Player): PlayerSave {
  return {
    version: CURRENT_VERSION,
    name: player.name,
    vocation: player.vocation,
    level: player.level,
    xp: player.xp,
    gold: player.gold,
    bankGold: player.bankGold,
    hp: player.hp,
    maxHp: player.maxHp,
    mana: player.mana,
    maxMana: player.maxMana,
    attack: player.attack,
    defense: player.defense,
    magic: player.magic,
    skills: player.skills,
    talents: JSON.parse(localStorage.getItem(`tibia_talents_${player.name}`) || '{}'),
    blessings: getBlessings(player),
    achievements: player.achievements,
    professions: getProfessions(player),
    reputation: getReputation(player as any),
    stamina: getStamina(player as any),
    bestiary: getBestiaryProgress(player as any),
    mysteryProgress: getMysteryProgress(player as any),
    inventory: [], // passed separately
    equipment: player.equipment,
    depot: JSON.parse(localStorage.getItem(`tibia_depot_${player.name}`) || '[]'),
    coins: getCoins(player.name),
    pets: getOwnedPets(player.name),
    activePet: getActivePet(player.name),
    mounts: [],
    skull: getSkullState((player as any).name || player.name),
    pvpEnabled: isPvpEnabled((player as any).name || player.name),
    dailyReward: getDailyRewardState(player as any),
    stats: player.stats,
    lastSaved: Date.now(),
  };
}

// ===== LOCAL SAVE (Quick Play) =====
export function saveLocal(player: Player, inventory: Item[]): void {
  const save = buildSave(player);
  save.inventory = inventory;
  try {
    localStorage.setItem(SAVE_KEY(player.name), JSON.stringify(save));
  } catch (e) {
    console.error('Save failed:', e);
  }
}

// ===== LOCAL LOAD (Quick Play) — with auto-migration =====
export function loadLocal(name: string): PlayerSave | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY(name));
    if (raw) {
      const save = JSON.parse(raw) as PlayerSave;
      return migrate(save, name);
    }
    // MIGRATION: old fragmented save detected — try to rebuild from playerFactory save
    const oldPlayerRaw = localStorage.getItem('tibia_accounts');
    if (oldPlayerRaw) {
      const accounts = JSON.parse(oldPlayerRaw);
      const acc = accounts.find((a: any) => a.characterName === name || a.username === name);
      if (acc?.savedPlayer) {
        // We have an old save — convert to unified and save
        const oldPlayer = JSON.parse(acc.savedPlayer);
        const migrated: PlayerSave = {
          version: CURRENT_VERSION, name,
          vocation: oldPlayer.vocation || 'knight',
          level: oldPlayer.level || 1, xp: oldPlayer.xp || 0,
          gold: oldPlayer.gold || 100, bankGold: oldPlayer.bankGold || 0,
          hp: oldPlayer.hp || 150, maxHp: oldPlayer.maxHp || 150,
          mana: oldPlayer.mana || 50, maxMana: oldPlayer.maxMana || 50,
          attack: oldPlayer.attack || 20, defense: oldPlayer.defense || 5, magic: oldPlayer.magic || 10,
          skills: oldPlayer.skills || {}, talents: {},
          blessings: [], achievements: oldPlayer.achievements || [],
          professions: { miner: { level: 1, progress: 0 }, herbalist: { level: 1, progress: 0 }, fisher: { level: 1, progress: 0 } },
          reputation: { town: 0 }, stamina: 42 * 60, bestiary: {}, mysteryProgress: {},
          inventory: [], equipment: oldPlayer.equipment || {}, depot: [],
          coins: 0, pets: [], activePet: null, mounts: [],
          skull: { type: 'none', aggressionPoints: 0, lastDecay: Date.now() },
          pvpEnabled: false, dailyReward: { lastClaim: 0, streak: 0 },
          stats: oldPlayer.stats || {}, lastSaved: Date.now(),
        };
        localStorage.setItem(SAVE_KEY(name), JSON.stringify(migrated));
        return migrated;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ===== MIGRATION: handle version upgrades =====
function migrate(save: PlayerSave, _name: string): PlayerSave {
  // Future: if (save.version === 1) { ...upgrade... }
  save.version = CURRENT_VERSION;
  return save;
}

// ===== APPLY: Merge loaded save back into player object =====
export function applySave(player: Player, save: PlayerSave): Player {
  return {
    ...player,
    level: save.level, xp: save.xp, gold: save.gold, bankGold: save.bankGold,
    hp: save.hp, maxHp: save.maxHp, mana: save.mana, maxMana: save.maxMana,
    attack: save.attack, defense: save.defense, magic: save.magic,
    skills: save.skills, achievements: save.achievements || [],
    equipment: save.equipment || {},
    stats: save.stats || player.stats,
    pos: { x: 40, y: 40 }, // always spawn in town
  };
}

// ===== PERSIST SUBSYSTEMS: write back from save to their localStorage keys =====
export function persistSubSystems(save: PlayerSave): void {
  try {
    localStorage.setItem(`tibia_talents_${save.name}`, JSON.stringify(save.talents || {}));
    localStorage.setItem(`tibia_blessings_${save.name}`, JSON.stringify(save.blessings || []));
    localStorage.setItem(`tibia_professions_${save.name}`, JSON.stringify(save.professions || {}));
    localStorage.setItem(`tibia_reputation_${save.name}`, JSON.stringify(save.reputation || {}));
    localStorage.setItem(`tibia_stamina_${save.name}`, JSON.stringify({ value: save.stamina || (42 * 60), lastUpdate: Date.now() }));
    localStorage.setItem(`tibia_bestiary_${save.name}`, JSON.stringify(save.bestiary || {}));
    localStorage.setItem(`tibia_mystery_progress_${save.name}`, JSON.stringify(save.mysteryProgress || {}));
    localStorage.setItem(`tibia_depot_${save.name}`, JSON.stringify(save.depot || []));
    localStorage.setItem(`moria_coins_${save.name}`, JSON.stringify(save.coins || 0));
    localStorage.setItem(`tibia_pets_${save.name}`, JSON.stringify(save.pets || []));
    if (save.activePet) localStorage.setItem(`tibia_activepet_${save.name}`, save.activePet);
    localStorage.setItem(`moria_skull_${save.name}`, JSON.stringify(save.skull || { type: 'none', aggressionPoints: 0, lastDecay: Date.now() }));
    localStorage.setItem(`moria_pvp_enabled_${save.name}`, save.pvpEnabled ? '1' : '0');
    localStorage.setItem(`tibia_daily_${save.name}`, JSON.stringify(save.dailyReward || { lastClaim: 0, streak: 0 }));
  } catch {}
}

// ===== SERVER SYNC: send/receive save from authoritative server =====
export function serializeForServer(save: PlayerSave): string {
  return JSON.stringify({ kind: 'save', payload: save });
}

// ===== SERVER CONTENT: read admin-created content =====
export interface ServerContent {
  items: any[];
  monsters: any[];
  npcs: any[];
  quests: any[];
  spells: any[];
  maps: any[];
  worldEvents: any[];
}

export function getServerContent(): ServerContent | null {
  try {
    const raw = localStorage.getItem('moria_server_content');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function hasServerContent(): boolean {
  return localStorage.getItem('moria_server_content') !== null;
}
