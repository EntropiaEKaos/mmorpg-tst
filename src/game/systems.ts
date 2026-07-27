import type { Player } from './types';

// ===== BLESSINGS (Tibia) =====
export interface Blessing {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: number;
  effect: (p: Player) => void;
  removeEffect: (p: Player) => void;
  levelRequired: number;
}

export const BLESSINGS: Blessing[] = [
  { id: 'twist_of_fate', name: 'Twist of Fate', icon: '🌀', description: 'Reduces XP loss on death by 50%.', cost: 200, levelRequired: 5,
    effect: () => {}, removeEffect: () => {} },
  { id: 'wisdom_of_solitude', name: 'Wisdom of Solitude', icon: '📚', description: '+10% XP from all sources.', cost: 400, levelRequired: 10,
    effect: () => {}, removeEffect: () => {} },
  { id: 'spark_of_phoenix', name: 'Spark of the Phoenix', icon: '🔥', description: 'Keep equipped items on death.', cost: 600, levelRequired: 15,
    effect: () => {}, removeEffect: () => {} },
  { id: 'fire_of_suns', name: 'Fire of the Suns', icon: '☀', description: '+8% damage dealt.', cost: 800, levelRequired: 20,
    effect: () => {}, removeEffect: () => {} },
  { id: 'spiritual_shielding', name: 'Spiritual Shielding', icon: '🛡', description: '-8% damage taken.', cost: 1000, levelRequired: 25,
    effect: () => {}, removeEffect: () => {} },
];

export function getBlessings(player: Player): string[] {
  try {
    const data = JSON.parse(localStorage.getItem(`tibia_blessings_${player.name}`) || '[]');
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export function buyBlessing(player: Player, blessingId: string): boolean {
  const blessing = BLESSINGS.find((b) => b.id === blessingId);
  if (!blessing) return false;
  if (player.gold < blessing.cost || player.level < blessing.levelRequired) return false;
  const owned = getBlessings(player);
  if (owned.includes(blessingId)) return false;
  owned.push(blessingId);
  localStorage.setItem(`tibia_blessings_${player.name}`, JSON.stringify(owned));
  return true;
}

export function getXPMultiplierFromBlessings(player: Player): number {
  const owned = getBlessings(player);
  let mult = 1;
  if (owned.includes('wisdom_of_solitude')) mult += 0.1;
  return mult;
}

export function getDamageMultiplierFromBlessings(player: Player): number {
  const owned = getBlessings(player);
  let mult = 1;
  if (owned.includes('fire_of_suns')) mult += 0.08;
  return mult;
}

export function getDamageReductionFromBlessings(player: Player): number {
  const owned = getBlessings(player);
  let reduction = 0;
  if (owned.includes('spiritual_shielding')) reduction += 0.08;
  return reduction;
}

export function getDeathXPLossMultiplier(player: Player): number {
  const owned = getBlessings(player);
  if (player.aol) return 0;
  if (owned.includes('twist_of_fate')) return 0.5;
  return 1;
}

export function keepItemsOnDeath(player: Player): boolean {
  const owned = getBlessings(player);
  return player.aol || owned.includes('spark_of_phoenix');
}

// ===== PROFESSIONS (WoW) =====
export interface ProfessionMaterial {
  name: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  profession: 'miner' | 'herbalist' | 'fisher';
  levelRequired: number;
  value: number;
}

export const PROFESSION_MATERIALS: ProfessionMaterial[] = [
  // Mining
  { name: 'Copper Ore', icon: '🟤', rarity: 'common', profession: 'miner', levelRequired: 1, value: 5 },
  { name: 'Iron Ore', icon: '⚫', rarity: 'common', profession: 'miner', levelRequired: 5, value: 12 },
  { name: 'Gold Ore', icon: '🟡', rarity: 'uncommon', profession: 'miner', levelRequired: 10, value: 30 },
  { name: 'Mithril Ore', icon: '🔵', rarity: 'rare', profession: 'miner', levelRequired: 20, value: 80 },
  { name: 'Adamantite Ore', icon: '🟣', rarity: 'epic', profession: 'miner', levelRequired: 30, value: 200 },
  // Herbalism
  { name: 'Peacebloom', icon: '🌸', rarity: 'common', profession: 'herbalist', levelRequired: 1, value: 5 },
  { name: 'Silverleaf', icon: '🌿', rarity: 'common', profession: 'herbalist', levelRequired: 5, value: 12 },
  { name: 'Mageroyal', icon: '🌺', rarity: 'uncommon', profession: 'herbalist', levelRequired: 10, value: 30 },
  { name: 'Fadeleaf', icon: '🍃', rarity: 'rare', profession: 'herbalist', levelRequired: 20, value: 80 },
  { name: 'Black Lotus', icon: '🪻', rarity: 'epic', profession: 'herbalist', levelRequired: 30, value: 200 },
  // Fishing
  { name: 'Raw Fish', icon: '🐟', rarity: 'common', profession: 'fisher', levelRequired: 1, value: 5 },
  { name: 'Raw Trout', icon: '🐠', rarity: 'common', profession: 'fisher', levelRequired: 5, value: 12 },
  { name: 'Raw Salmon', icon: '🍣', rarity: 'uncommon', profession: 'fisher', levelRequired: 10, value: 30 },
  { name: 'Lobster', icon: '🦞', rarity: 'rare', profession: 'fisher', levelRequired: 20, value: 80 },
  { name: 'Golden Fish', icon: '✨', rarity: 'epic', profession: 'fisher', levelRequired: 30, value: 200 },
];

export interface PlayerProfession {
  miner: { level: number; progress: number };
  herbalist: { level: number; progress: number };
  fisher: { level: number; progress: number };
}

export function getProfessions(player: Player): PlayerProfession {
  try {
    return JSON.parse(localStorage.getItem(`tibia_professions_${player.name}`) || 'null') ||
      { miner: { level: 1, progress: 0 }, herbalist: { level: 1, progress: 0 }, fisher: { level: 1, progress: 0 } };
  } catch {
    return { miner: { level: 1, progress: 0 }, herbalist: { level: 1, progress: 0 }, fisher: { level: 1, progress: 0 } };
  }
}

export function saveProfessions(player: Player, profs: PlayerProfession) {
  localStorage.setItem(`tibia_professions_${player.name}`, JSON.stringify(profs));
}

export function gatherFromTile(player: Player, tileType: string): { material: ProfessionMaterial; quantity: number } | null {
  const profs = getProfessions(player);
  let profession: 'miner' | 'herbalist' | 'fisher' | null = null;

  if (tileType === 'rock' || tileType === 'stone') profession = 'miner';
  else if (tileType === 'bush' || tileType === 'grass') profession = 'herbalist';
  else if (tileType === 'water') profession = 'fisher';
  if (!profession) return null;

  // 30% chance to gather
  if (Math.random() > 0.3) return null;

  const profLevel = profs[profession].level;
  const eligible = PROFESSION_MATERIALS.filter((m) => m.profession === profession && m.levelRequired <= profLevel);
  if (eligible.length === 0) return null;

  // Weighted by rarity
  const weights = { common: 60, uncommon: 25, rare: 10, epic: 3 };
  const totalWeight = eligible.reduce((s, m) => s + (weights[m.rarity] || 1), 0);
  let roll = Math.random() * totalWeight;
  let chosen = eligible[0];
  for (const m of eligible) {
    roll -= weights[m.rarity] || 1;
    if (roll <= 0) { chosen = m; break; }
  }

  // Skill progress
  profs[profession].progress += 1;
  if (profs[profession].progress >= profs[profession].level * 8) {
    profs[profession].level++;
    profs[profession].progress = 0;
  }
  saveProfessions(player, profs);

  return { material: chosen, quantity: 1 };
}

// ===== REPUTATION (WoW) =====
export interface ReputationFaction {
  id: string;
  name: string;
  icon: string;
  levels: { threshold: number; name: string; color: string }[];
}

export const FACTIONS: ReputationFaction[] = [
  {
    id: 'town', name: 'Town of Antica', icon: '🏰',
    levels: [
      { threshold: -6000, name: 'Hated', color: '#ff0000' },
      { threshold: -3000, name: 'Hostile', color: '#ff4444' },
      { threshold: -1000, name: 'Unfriendly', color: '#ff8888' },
      { threshold: 0, name: 'Neutral', color: '#aaaaaa' },
      { threshold: 3000, name: 'Friendly', color: '#90ff90' },
      { threshold: 9000, name: 'Honored', color: '#2ecc71' },
      { threshold: 21000, name: 'Revered', color: '#3498db' },
      { threshold: 42000, name: 'Exalted', color: '#f4e04d' },
    ],
  },
];

export function getReputation(player: Player): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(`tibia_reputation_${player.name}`) || '{"town":0}');
  } catch { return { town: 0 }; }
}

export function saveReputation(player: Player, rep: Record<string, number>) {
  localStorage.setItem(`tibia_reputation_${player.name}`, JSON.stringify(rep));
}

export function addReputation(player: Player, factionId: string, amount: number): void {
  const rep = getReputation(player);
  rep[factionId] = (rep[factionId] || 0) + amount;
  saveReputation(player, rep);
}

export function getRepLevel(factionId: string, value: number): { name: string; color: string } {
  const faction = FACTIONS.find((f) => f.id === factionId);
  if (!faction) return { name: 'Unknown', color: '#aaa' };
  let result = faction.levels[0];
  for (const lvl of faction.levels) {
    if (value >= lvl.threshold) result = lvl;
  }
  return result;
}

export function getShopDiscountFromRep(player: Player): number {
  const rep = getReputation(player);
  const townRep = rep.town || 0;
  if (townRep >= 42000) return 0.25; // 25% discount at Exalted
  if (townRep >= 21000) return 0.15;
  if (townRep >= 9000) return 0.10;
  if (townRep >= 3000) return 0.05;
  return 0;
}

// ===== STAMINA =====
export function getStamina(player: Player): number {
  try {
    const data = JSON.parse(localStorage.getItem(`tibia_stamina_${player.name}`) || 'null');
    if (data) return data.value;
  } catch {}
  return 42 * 60; // 42 hours in minutes
}

export function saveStamina(player: Player, value: number) {
  localStorage.setItem(`tibia_stamina_${player.name}`, JSON.stringify({ value, lastUpdate: Date.now() }));
}

export function getStaminaMultiplier(staminaMinutes: number): number {
  if (staminaMinutes > 2400) return 1.0; // > 40h = full
  if (staminaMinutes > 1440) return 0.75; // 24-40h = 75%
  if (staminaMinutes > 720) return 0.5; // 12-24h = 50%
  if (staminaMinutes > 0) return 0.25; // 0-12h = 25%
  return 0.1; // Exhausted = 10%
}

// ===== DAILY REWARD =====
export interface DailyReward {
  day: number;
  icon: string;
  xp: number;
  gold: number;
  item?: { name: string; icon: string };
}

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, icon: '📦', xp: 50, gold: 100 },
  { day: 2, icon: '🧪', xp: 80, gold: 150, item: { name: 'Health Potion', icon: '🧪' } },
  { day: 3, icon: '🪙', xp: 100, gold: 300 },
  { day: 4, icon: '🧴', xp: 120, gold: 200, item: { name: 'Mana Potion', icon: '🧴' } },
  { day: 5, icon: '⚔', xp: 200, gold: 500 },
  { day: 6, icon: '🛡', xp: 250, gold: 400, item: { name: 'Greater Health Potion', icon: '🍷' } },
  { day: 7, icon: '💎', xp: 500, gold: 1000, item: { name: 'Magic Rune', icon: '✨' } },
];

export function getDailyRewardState(player: Player): { lastClaim: number; streak: number } {
  try {
    return JSON.parse(localStorage.getItem(`tibia_daily_${player.name}`) || '{"lastClaim":0,"streak":0}');
  } catch { return { lastClaim: 0, streak: 0 }; }
}

export function canClaimDaily(player: Player): boolean {
  const state = getDailyRewardState(player);
  const now = new Date();
  const last = new Date(state.lastClaim);
  return now.toDateString() !== last.toDateString();
}

export function claimDaily(player: Player): DailyReward | null {
  if (!canClaimDaily(player)) return null;
  const state = getDailyRewardState(player);
  const dayIndex = state.streak % DAILY_REWARDS.length;
  const reward = DAILY_REWARDS[dayIndex];
  state.streak++;
  state.lastClaim = Date.now();
  localStorage.setItem(`tibia_daily_${player.name}`, JSON.stringify(state));
  return reward;
}

// ===== FOOD BUFFS (WoW) =====
export interface FoodItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: number;
  buffType: 'attack' | 'defense' | 'hp' | 'mana' | 'xp' | 'speed';
  buffValue: number;
  duration: number; // ms
  levelRequired: number;
}

export const FOOD_ITEMS: FoodItem[] = [
  { id: 'bread', name: 'Fresh Bread', icon: '🍞', description: '+5 ATK for 5 min', cost: 30, buffType: 'attack', buffValue: 5, duration: 300000, levelRequired: 1 },
  { id: 'cheese', name: 'Aged Cheese', icon: '🧀', description: '+5 DEF for 5 min', cost: 35, buffType: 'defense', buffValue: 5, duration: 300000, levelRequired: 1 },
  { id: 'stew', name: 'Hearty Stew', icon: '🍲', description: '+50 Max HP for 5 min', cost: 50, buffType: 'hp', buffValue: 50, duration: 300000, levelRequired: 5 },
  { id: 'wine', name: 'Elven Wine', icon: '🍷', description: '+30 Max Mana for 5 min', cost: 60, buffType: 'mana', buffValue: 30, duration: 300000, levelRequired: 5 },
  { id: 'steak', name: 'Dragon Steak', icon: '🥩', description: '+15 ATK for 10 min', cost: 200, buffType: 'attack', buffValue: 15, duration: 600000, levelRequired: 15 },
  { id: 'pie', name: 'Adventurer\'s Pie', icon: '🥧', description: '+20% XP for 10 min', cost: 300, buffType: 'xp', buffValue: 20, duration: 600000, levelRequired: 20 },
  { id: 'feast', name: 'Grand Feast', icon: '🍖', description: '+20 ATK, +20 DEF, +100 HP for 15 min', cost: 500, buffType: 'attack', buffValue: 20, duration: 900000, levelRequired: 25 },
];

export function getFoodBuffs(player: Player): { type: string; value: number; endTime: number }[] {
  try {
    return JSON.parse(localStorage.getItem(`tibia_foodbuffs_${player.name}`) || '[]');
  } catch { return []; }
}

export function saveFoodBuffs(player: Player, buffs: { type: string; value: number; endTime: number }[]) {
  localStorage.setItem(`tibia_foodbuffs_${player.name}`, JSON.stringify(buffs));
}

export function applyFoodBuff(player: Player, food: FoodItem): void {
  const buffs = getFoodBuffs(player);
  // Remove existing buff of same type
  const filtered = buffs.filter((b) => b.type !== food.buffType || Date.now() > b.endTime);
  filtered.push({ type: food.buffType, value: food.buffValue, endTime: Date.now() + food.duration });
  saveFoodBuffs(player, filtered);
}

export function getActiveFoodBonus(player: Player, type: string): number {
  const buffs = getFoodBuffs(player);
  const active = buffs.find((b) => b.type === type && Date.now() < b.endTime);
  return active ? active.value : 0;
}
