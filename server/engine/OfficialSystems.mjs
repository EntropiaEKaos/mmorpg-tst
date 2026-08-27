// ===================================================================
// MOR'IA MVP COMPLETE 6.0 — OFFICIAL SERVER-OWNED SYSTEMS
// Consolidates features that were previously browser/localStorage-only.
// ===================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildEquipmentLootPool } from './Items.mjs';
import { executeOfficialAction, getOfficialActionService, hasOfficialAction } from './OfficialActionRegistry.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DB_FILE = process.env.MORIA_OFFICIAL_DB || path.join(__dirname, '..', 'moria-official.json');

const clamp = (value, min, max, fallback = min) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};
const int = (value, min, max, fallback = min) => Math.floor(clamp(value, min, max, fallback));
const slug = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const cleanText = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const dayKey = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);
const playerKey = (name) => String(name || '').trim().toLocaleLowerCase('en-US');

export const OFFICIAL_PETS = Object.freeze([
  { id: 'wolf_pup', name: 'Wolf Pup', icon: '🐺', color: '#8a8a8a', attack: 8, price: 500, levelRequired: 3 },
  { id: 'boar', name: 'Wild Boar', icon: '🐗', color: '#6a4a3a', attack: 12, price: 1500, levelRequired: 8 },
  { id: 'panther', name: 'Shadow Panther', icon: '🐆', color: '#2a2a2a', attack: 18, price: 3000, levelRequired: 12 },
  { id: 'bear_cub', name: 'Bear Companion', icon: '🐻', color: '#5a3a1e', attack: 22, price: 5000, levelRequired: 16 },
  { id: 'phoenix', name: 'Phoenix', icon: '🔥', color: '#ff6a00', attack: 30, price: 8000, levelRequired: 20 },
  { id: 'mini_dragon', name: 'Baby Dragon', icon: '🐉', color: '#c13030', attack: 40, price: 15000, levelRequired: 25 },
]);

export const OFFICIAL_GEMS = Object.freeze([
  { id: 'ruby_t1', name: 'Chipped Ruby', icon: '🔴', color: '#ff3030', stat: 'attack', value: 3, tier: 1, rarity: 'uncommon' },
  { id: 'sapphire_t1', name: 'Chipped Sapphire', icon: '🔵', color: '#3030ff', stat: 'defense', value: 3, tier: 1, rarity: 'uncommon' },
  { id: 'emerald_t1', name: 'Chipped Emerald', icon: '🟢', color: '#30ff30', stat: 'magic', value: 3, tier: 1, rarity: 'uncommon' },
  { id: 'ruby_t2', name: 'Flawed Ruby', icon: '🔴', color: '#ff3030', stat: 'attack', value: 7, tier: 2, rarity: 'rare' },
  { id: 'topaz_t2', name: 'Flawed Topaz', icon: '🟡', color: '#ffd030', stat: 'crit', value: 4, tier: 2, rarity: 'rare' },
  { id: 'garnet_t2', name: 'Flawed Garnet', icon: '🔴', color: '#ff6060', stat: 'hp', value: 30, tier: 2, rarity: 'rare' },
  { id: 'ruby_t3', name: 'Flawless Ruby', icon: '♦', color: '#ff1010', stat: 'attack', value: 15, tier: 3, rarity: 'epic' },
  { id: 'amethyst_t3', name: 'Flawless Amethyst', icon: '🟣', color: '#a030ff', stat: 'lifesteal', value: 4, tier: 3, rarity: 'epic' },
  { id: 'diamond_t3', name: 'Flawless Diamond', icon: '💎', color: '#ffffff', stat: 'speed', value: 6, tier: 3, rarity: 'epic' },
  { id: 'soul_gem', name: 'Soul Gem', icon: '💠', color: '#00ffff', stat: 'magic', value: 20, tier: 4, rarity: 'legendary' },
  { id: 'star_ruby', name: 'Star Ruby', icon: '🌟', color: '#ff5050', stat: 'attack', value: 25, tier: 4, rarity: 'legendary' },
]);

export const OFFICIAL_SHOP = Object.freeze([
  { id: 'health_potion', name: 'Health Potion', icon: '🧪', type: 'potion', price: 50, description: 'Restores 50 HP' },
  { id: 'mana_potion', name: 'Mana Potion', icon: '🧴', type: 'potion', price: 50, description: 'Restores 50 Mana' },
  { id: 'greater_health', name: 'Greater Health Potion', icon: '🍷', type: 'potion', price: 150, levelRequired: 5, description: 'Restores 200 HP' },
  { id: 'cheese', name: 'Cheese', icon: '🧀', type: 'material', price: 15 },
  { id: 'snake_skin', name: 'Snake Skin', icon: '🐍', type: 'material', price: 25 },
  { id: 'magic_rune', name: 'Magic Rune', icon: '📜', type: 'material', price: 250, levelRequired: 10 },
]);

export const OFFICIAL_FOOD = Object.freeze([
  { id: 'war_stew', name: 'War Stew', icon: '🍲', price: 80, levelRequired: 1, buffType: 'official_attack', value: 10, description: '+10% attack for 10 minutes' },
  { id: 'guardian_bread', name: 'Guardian Bread', icon: '🥖', price: 80, levelRequired: 1, buffType: 'official_defense', value: 8, description: '+8% damage reduction for 10 minutes' },
  { id: 'sage_tea', name: 'Sage Tea', icon: '🍵', price: 120, levelRequired: 5, buffType: 'official_xp', value: 10, description: '+10% XP for 10 minutes' },
]);

export const OFFICIAL_RECIPES = Object.freeze([
  { id: 'health_potion', name: 'Health Potion', icon: '🧪', levelRequired: 1, ingredients: [{ name: 'Cheese', quantity: 2 }], result: { name: 'Health Potion', icon: '🧪', type: 'potion', quantity: 1, value: 50, description: 'Restores 50 HP' } },
  { id: 'mana_potion', name: 'Mana Potion', icon: '🧴', levelRequired: 1, ingredients: [{ name: 'Snake Skin', quantity: 2 }], result: { name: 'Mana Potion', icon: '🧴', type: 'potion', quantity: 1, value: 50, description: 'Restores 50 Mana' } },
  { id: 'greater_health', name: 'Greater Health Potion', icon: '🍷', levelRequired: 5, ingredients: [{ name: 'Health Potion', quantity: 2 }, { name: 'Meat', quantity: 1 }], result: { name: 'Greater Health Potion', icon: '🍷', type: 'potion', quantity: 1, value: 150, description: 'Restores 200 HP' } },
  { id: 'gold_bar', name: 'Gold Bar', icon: '🟨', levelRequired: 1, ingredients: [{ name: 'Gold', quantity: 100 }], result: { name: 'Gold Bar', icon: '🟨', type: 'misc', quantity: 1, value: 100 } },
  { id: 'orc_trophy', name: 'Orc Trophy', icon: '🏆', levelRequired: 10, ingredients: [{ name: 'Orc Tooth', quantity: 5 }], result: { name: 'Orc Trophy', icon: '🏆', type: 'misc', quantity: 1, value: 200, description: 'Proof of your prowess' } },
  { id: 'amulet_loss', name: 'Amulet of Loss', icon: '📿', levelRequired: 15, ingredients: [{ name: 'Magic Rune', quantity: 2 }, { name: 'Dragon Scale', quantity: 1 }, { name: 'Gold', quantity: 1000 }], result: { name: 'Amulet of Loss', icon: '📿', type: 'equipment', quantity: 1, value: 2500, equipment: { id: 'amulet_loss', name: 'Amulet of Loss', icon: '📿', slot: 'amulet', rarity: 'legendary', level: 15, value: 2500, sockets: 1, socketedGems: [] } } },
]);

export const OFFICIAL_COIN_STORE = Object.freeze([
  { id: 'supplies', name: 'Adventurer Supplies', icon: '🎒', price: 20, description: '5 Health + 5 Mana potions' },
  { id: 'equipment_cache', name: 'Equipment Cache', icon: '🎁', price: 100, description: 'Level-appropriate equipment with a chance for a socket' },
  { id: 'blessing', name: 'Blessing of Mor\'ia', icon: '✨', price: 60, description: '1 hour: +5% XP, +5% damage reduction, half death XP loss' },
  { id: 'title_shadow', name: 'Shadow Walker Title', icon: '🌑', price: 80, description: 'Permanent cosmetic title' },
]);

export const OFFICIAL_BOOKS = Object.freeze([
  { id: 'chronicle_eldoria', title: 'Chronicle of Eldoria', icon: '📕', author: 'The Chronicler', pages: ['Eldoria was raised around a spring older than the first crown.', 'Every road from the city eventually bends toward danger — and opportunity.'] },
  { id: 'frostpeak_watch', title: 'The Frostpeak Watch', icon: '📘', author: 'Captain Rime', pages: ['The mountain remembers every footprint.', 'Wolves are not the greatest danger in Frostpeak. Silence is.'] },
  { id: 'shadowfen_notes', title: 'Notes from Shadowfen', icon: '📗', author: 'Mara Vell', pages: ['The fen glows at night where old bones sleep.', 'Orcs mark safe ground with three cuts in dead trees.'] },
  { id: 'void_testament', title: 'Void Testament', icon: '📓', author: 'Unknown', pages: ['There are stars beneath the Voidlands.', 'Do not answer when the darkness speaks your name.'] },
]);

const MYSTERIES = Object.freeze([
  {
    id: 'lost_tome', name: 'The Lost Tome of Eldoria', icon: '📖', requiredLevel: 5,
    rewardGold: 500, rewardXp: 800, rewardItem: { name: 'Ancient Rune', icon: '📜', value: 300 },
    intro: 'An ancient tome was hidden by the Archmage centuries ago. Its seal yields only to riddles.',
    chapters: [
      { clue: 'I am born of the heavens, yet I burn all I touch.', riddle: 'What am I?', answer: 'lightning', hint: 'It comes from storms in the sky.' },
      { clue: 'I have a heart that does not beat. A home but no doors.', riddle: 'What am I?', answer: 'artichoke', hint: 'It is a vegetable.' },
      { clue: 'I guard the tome. Speak the secret word of the realm.', riddle: 'What is the secret word?', answer: 'moria', hint: 'The realm itself.' },
    ],
  },
  {
    id: 'frostpeak_phantom', name: 'The Phantom of Frostpeak', icon: '👻', requiredLevel: 10,
    rewardGold: 750, rewardXp: 1000, rewardItem: { name: 'Frozen Heart', icon: '💙', value: 500 },
    intro: 'A wailing phantom haunts the frozen pass and asks travelers to remember what it forgot.',
    chapters: [
      { clue: 'The more you take, the more you leave behind.', riddle: 'What am I?', answer: 'footsteps', hint: 'You make them when you walk.' },
      { clue: 'Cold to the touch, warm to memory, melting in the hand.', riddle: 'What am I?', answer: 'snow', hint: 'It falls in Frostpeak.' },
      { clue: 'In life I kept the mountain pass.', riddle: 'What was I?', answer: 'guard', hint: 'One who watches and defends.' },
    ],
  },
]);

const DUNGEON_WAVES = Object.freeze([
  { name: 'Dungeon Rat', emoji: '🐀', color: '#8b6f47', hp: 30, attack: 6, defense: 2, xp: 15, count: 3 },
  { name: 'Dungeon Bat', emoji: '🦇', color: '#3a2a3a', hp: 45, attack: 9, defense: 2, xp: 22, count: 4 },
  { name: 'Skeleton', emoji: '💀', color: '#d4d4c8', hp: 70, attack: 14, defense: 4, xp: 40, count: 4 },
  { name: 'Zombie', emoji: '🧟', color: '#4a6a3a', hp: 110, attack: 18, defense: 5, xp: 60, count: 5 },
  { name: 'Ghost', emoji: '👻', color: '#ccccff', hp: 130, attack: 24, defense: 4, xp: 80, count: 5 },
  { name: 'Orc Berserker', emoji: '👹', color: '#3a4d13', hp: 180, attack: 30, defense: 8, xp: 110, count: 5 },
  { name: 'Demon', emoji: '😈', color: '#c13030', hp: 260, attack: 42, defense: 12, xp: 180, count: 4 },
  { name: 'Hellhound', emoji: '🐕', color: '#8b0000', hp: 320, attack: 50, defense: 14, xp: 250, count: 5 },
  { name: 'Dragon', emoji: '🐉', color: '#c13030', hp: 450, attack: 60, defense: 18, xp: 400, count: 3 },
  { name: 'Dungeon Warden', emoji: '👹', color: '#8b0000', hp: 1200, attack: 80, defense: 25, xp: 2000, count: 1, boss: true },
]);

const DEFAULT_EVENTS = Object.freeze([
  { id: 'eldoria_vermin', name: 'Vermin Tide', icon: '🐀', mapId: 'eldoria', target: 'rat', needed: 30, rewardGold: 300, rewardXp: 180, rewardCoins: 8 },
  { id: 'frostpeak_pack', name: 'Howl Over Frostpeak', icon: '🐺', mapId: 'frostpeak', target: 'wolf', needed: 25, rewardGold: 450, rewardXp: 260, rewardCoins: 10 },
  { id: 'shadowfen_raiders', name: 'Raiders of the Fen', icon: '👹', mapId: 'shadowfen', target: 'orc', needed: 24, rewardGold: 650, rewardXp: 400, rewardCoins: 12 },
  { id: 'emberhold_breach', name: 'Emberhold Breach', icon: '😈', mapId: 'emberhold', target: 'demon', needed: 14, rewardGold: 1000, rewardXp: 700, rewardCoins: 16 },
  { id: 'void_echoes', name: 'Echoes of the Void', icon: '👻', mapId: 'voidlands', target: 'ghost', needed: 20, rewardGold: 1200, rewardXp: 850, rewardCoins: 18 },
]);

const ACHIEVEMENTS = Object.freeze([
  { id: 'first_blood', name: 'First Blood', icon: '⚔', test: (p) => (p.stats?.monstersKilled || 0) >= 1, coins: 2 },
  { id: 'hunter_25', name: 'Monster Hunter', icon: '🏹', test: (p) => (p.stats?.monstersKilled || 0) >= 25, coins: 5 },
  { id: 'hunter_100', name: 'Centurion', icon: '💯', test: (p) => (p.stats?.monstersKilled || 0) >= 100, coins: 15 },
  { id: 'level_10', name: 'Seasoned Adventurer', icon: '⭐', test: (p) => p.level >= 10, coins: 8 },
  { id: 'rich_1000', name: 'Deep Pockets', icon: '🪙', test: (p) => (p.stats?.goldEarned || 0) >= 1000, coins: 6 },
  { id: 'dungeon_clear', name: 'Dungeon Delver', icon: '🌀', test: (p) => (p.official?.dungeon?.highestWave || 0) >= 3, coins: 10 },
]);

const SETS = Object.freeze([
  { pieces: ['dragon_slayer', 'dragon_mail', 'dragon_shield'], bonuses: [{ at: 2, damage: 10 }, { at: 3, damage: 5, lifesteal: 5 }] },
  { pieces: ['excalibur', 'crown'], bonuses: [{ at: 2, xp: 15, gold: 10 }] },
  { pieces: ['magic_staff', 'scholar_belt', 'sage_ring', 'xp_amulet'], bonuses: [{ at: 2, magicPct: 12 }, { at: 3, xp: 15, mana: 50 }, { at: 4, crit: 10 }] },
  { pieces: ['boots_haste', 'swift_gloves', 'stealth_cloak', 'swift_legs'], bonuses: [{ at: 2, speed: 15 }, { at: 3, crit: 8 }, { at: 4, damage: 10 }] },
  { pieces: ['plate_armor', 'tower_shield', 'gauntlets', 'strength_belt'], bonuses: [{ at: 2, reduction: 10 }, { at: 3, thorns: 6 }, { at: 4, hp: 100 }] },
  { pieces: ['vamp_blade', 'vamp_cloak', 'vamp_ring'], bonuses: [{ at: 2, lifesteal: 8 }, { at: 3, crit: 10 }] },
  { pieces: ['greed_helm', 'gold_amulet', 'lucky_charm'], bonuses: [{ at: 2, gold: 20 }, { at: 3, xp: 10 }] },
]);

function freshPlayerState() {
  return {
    version: 1,
    depot: [],
    pets: { owned: [], active: null },
    coins: 50,
    training: 0,
    professions: {
      mining: { level: 1, xp: 0 }, herbalism: { level: 1, xp: 0 },
      fishing: { level: 1, xp: 0 }, woodcutting: { level: 1, xp: 0 },
    },
    bestiary: {}, achievements: [],
    daily: { lastDay: '', streak: 0 },
    stamina: 2520, lastStaminaTick: Date.now(),
    booksRead: [], mysteries: {},
    pvp: { enabled: false, skull: 'none', aggression: 0, lastAggression: 0 },
    mastery: {}, blessingsUntil: 0,
    titles: { owned: [], active: null },
    dungeon: { active: false, runId: null, wave: 0, maxWaves: 0, killsRemaining: 0, highestWave: 0, clears: 0 },
    welcomeMailSent: false,
    lastGatherAt: 0, lastMailAt: 0, lastPvpAttack: 0,
  };
}

function freshGlobalState() {
  return { version: 1, auctions: [], mail: [], credits: {}, eventRewards: {}, event: null, eventSequence: 0 };
}

function normalizeProfession(raw) {
  return { level: int(raw?.level, 1, 100, 1), xp: int(raw?.xp, 0, 1_000_000, 0) };
}

function normalizePlayerState(saved) {
  const base = freshPlayerState();
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return base;
  base.depot = Array.isArray(saved.depot) ? saved.depot.filter(Boolean).slice(0, 40) : [];
  base.pets.owned = Array.isArray(saved.pets?.owned) ? saved.pets.owned.filter(id => OFFICIAL_PETS.some(p => p.id === id)).slice(0, OFFICIAL_PETS.length) : [];
  base.pets.active = base.pets.owned.includes(saved.pets?.active) ? saved.pets.active : null;
  base.coins = int(saved.coins, 0, 10_000_000, 50);
  base.training = int(saved.training, 0, 20, 0);
  for (const key of Object.keys(base.professions)) base.professions[key] = normalizeProfession(saved.professions?.[key]);
  base.bestiary = saved.bestiary && typeof saved.bestiary === 'object' && !Array.isArray(saved.bestiary) ? Object.fromEntries(Object.entries(saved.bestiary).slice(0, 500).map(([k, v]) => [slug(k), int(v, 0, 1_000_000, 0)])) : {};
  base.achievements = Array.isArray(saved.achievements) ? saved.achievements.filter(id => ACHIEVEMENTS.some(a => a.id === id)) : [];
  base.daily = { lastDay: cleanText(saved.daily?.lastDay, 10), streak: int(saved.daily?.streak, 0, 7, 0) };
  base.stamina = int(saved.stamina, 0, 2520, 2520);
  base.lastStaminaTick = Number(saved.lastStaminaTick) > 0 ? Number(saved.lastStaminaTick) : Date.now();
  base.booksRead = Array.isArray(saved.booksRead) ? saved.booksRead.filter(id => OFFICIAL_BOOKS.some(b => b.id === id)) : [];
  base.mysteries = saved.mysteries && typeof saved.mysteries === 'object' && !Array.isArray(saved.mysteries) ? saved.mysteries : {};
  base.pvp = {
    enabled: Boolean(saved.pvp?.enabled),
    skull: ['none', 'white', 'yellow', 'orange', 'red', 'black'].includes(saved.pvp?.skull) ? saved.pvp.skull : 'none',
    aggression: int(saved.pvp?.aggression, 0, 100, 0),
    lastAggression: Number(saved.pvp?.lastAggression) || 0,
  };
  base.mastery = saved.mastery && typeof saved.mastery === 'object' && !Array.isArray(saved.mastery) ? saved.mastery : {};
  base.blessingsUntil = Number(saved.blessingsUntil) || 0;
  base.titles.owned = Array.isArray(saved.titles?.owned) ? saved.titles.owned.filter(v => typeof v === 'string').slice(0, 20) : [];
  base.titles.active = base.titles.owned.includes(saved.titles?.active) ? saved.titles.active : null;
  base.dungeon = {
    active: false, runId: null, wave: 0, maxWaves: 0, killsRemaining: 0,
    highestWave: int(saved.dungeon?.highestWave, 0, 10, 0), clears: int(saved.dungeon?.clears, 0, 1_000_000, 0),
  };
  base.welcomeMailSent = Boolean(saved.welcomeMailSent);
  return base;
}

function addItem(player, item) {
  const copy = { ...item };
  copy.quantity = int(copy.quantity, 1, 9999, 1);
  if (copy.type !== 'equipment' && copy.type !== 'gem') {
    const existing = player.inventory.find(entry => entry.name === copy.name && entry.type === copy.type && !entry.equipment);
    if (existing) { existing.quantity = int(existing.quantity, 0, 999999, 0) + copy.quantity; return existing; }
  }
  copy.id = copy.id || `official_${Date.now()}_${Math.random()}`;
  player.inventory.push(copy);
  return copy;
}

function consumeNamed(player, name, quantity) {
  let remaining = quantity;
  for (const item of player.inventory) {
    if (item.name !== name || remaining <= 0) continue;
    const take = Math.min(int(item.quantity, 0, 999999, 0), remaining);
    item.quantity -= take;
    remaining -= take;
  }
  player.inventory = player.inventory.filter(item => Number(item.quantity) > 0 || item.type === 'equipment');
  return remaining === 0;
}

function skullForAggression(value) {
  if (value >= 80) return 'black';
  if (value >= 55) return 'red';
  if (value >= 35) return 'orange';
  if (value >= 15) return 'yellow';
  if (value > 0) return 'white';
  return 'none';
}

function publicMysteries() {
  return MYSTERIES.map(m => ({
    id: m.id, name: m.name, icon: m.icon, requiredLevel: m.requiredLevel,
    rewardGold: m.rewardGold, rewardXp: m.rewardXp, rewardItem: m.rewardItem, intro: m.intro,
    chapters: m.chapters.map(c => ({ clue: c.clue, riddle: c.riddle, hint: c.hint })),
  }));
}

export class OfficialSystems {
  constructor(dbFile = DEFAULT_DB_FILE) {
    this.dbFile = dbFile;
    this.global = freshGlobalState();
    this.contentEvents = [];
    this.load();
  }

  load() {
    try {
      if (!fs.existsSync(this.dbFile)) return false;
      const raw = JSON.parse(fs.readFileSync(this.dbFile, 'utf8'));
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
      this.global = { ...freshGlobalState(), ...raw };
      this.global.auctions = Array.isArray(raw.auctions) ? raw.auctions.filter(Boolean).slice(0, 500) : [];
      this.global.mail = Array.isArray(raw.mail) ? raw.mail.filter(Boolean).slice(-5000) : [];
      this.global.credits = raw.credits && typeof raw.credits === 'object' ? raw.credits : {};
      this.global.eventRewards = raw.eventRewards && typeof raw.eventRewards === 'object' ? raw.eventRewards : {};
      return true;
    } catch (error) {
      console.warn('⚠ Official systems DB load failed:', error?.message || error);
      return false;
    }
  }

  save() {
    const temp = `${this.dbFile}.tmp`;
    try {
      fs.mkdirSync(path.dirname(this.dbFile), { recursive: true });
      fs.writeFileSync(temp, JSON.stringify(this.global, null, 2));
      fs.renameSync(temp, this.dbFile);
      return true;
    } catch (error) {
      try { fs.rmSync(temp, { force: true }); } catch {}
      console.warn('⚠ Official systems DB save failed:', error?.message || error);
      return false;
    }
  }

  syncWorldEvents(events = []) {
    this.contentEvents = Array.isArray(events)
      ? events.filter(e => e && typeof e === 'object' && typeof e.id === 'string' && e.id.trim()).map(e => ({ ...e }))
      : [];
  }

  ensurePlayer(player) {
    if (!player.official || typeof player.official !== 'object') player.official = freshPlayerState();
    return player.official;
  }

  restorePlayer(player, saved) {
    player.official = normalizePlayerState(saved);
    player.professions = player.official.professions;
    return player.official;
  }

  exportPlayer(player) {
    const s = this.ensurePlayer(player);
    return {
      version: 1,
      depot: s.depot,
      pets: s.pets,
      coins: s.coins,
      training: s.training,
      professions: s.professions,
      bestiary: s.bestiary,
      achievements: s.achievements,
      daily: s.daily,
      stamina: s.stamina,
      lastStaminaTick: s.lastStaminaTick,
      booksRead: s.booksRead,
      mysteries: s.mysteries,
      pvp: { enabled: s.pvp.enabled, skull: s.pvp.skull, aggression: s.pvp.aggression, lastAggression: s.pvp.lastAggression },
      mastery: s.mastery,
      blessingsUntil: s.blessingsUntil,
      titles: s.titles,
      dungeon: { highestWave: s.dungeon.highestWave, clears: s.dungeon.clears },
      welcomeMailSent: s.welcomeMailSent,
    };
  }

  onLogin(player) {
    const s = this.ensurePlayer(player);
    const key = playerKey(player.name);
    const credit = int(this.global.credits[key], 0, 1_000_000_000, 0);
    if (credit > 0) {
      player.gold += credit;
      player.stats.goldEarned = (player.stats.goldEarned || 0) + credit;
      delete this.global.credits[key];
      this.save();
    }
    if (!s.welcomeMailSent) {
      this.global.mail.push({
        id: `welcome_${Date.now()}_${Math.random()}`, from: 'Postmaster Edwin', to: key,
        subject: 'Welcome to Mor\'ia!', body: `Welcome, ${player.name}. Your official online journey begins here.`,
        gold: 100, claimed: false, read: false, sentAt: Date.now(), system: true,
      });
      s.welcomeMailSent = true;
      this.save();
    }
  }

  getXpMultiplier(player) {
    const s = this.ensurePlayer(player);
    let mult = s.stamina > 2400 ? 1.2 : s.stamina < 840 ? 0.5 : 1;
    if (Date.now() < s.blessingsUntil) mult *= 1.05;
    const food = Array.isArray(player.buffs) ? player.buffs.find(b => b.type === 'official_xp' && Number(b.expiresAt) > Date.now()) : null;
    if (food) mult *= 1 + clamp(food.value, 0, 50, 0) / 100;
    return mult;
  }

  getDeathLossMultiplier(player) {
    return Date.now() < this.ensurePlayer(player).blessingsUntil ? 0.5 : 1;
  }

  getReputationDiscount(player) {
    const town = int(player.reputation?.town, -100_000, 100_000, 0);
    if (town >= 42000) return 0.25;
    if (town >= 21000) return 0.15;
    if (town >= 9000) return 0.10;
    if (town >= 3000) return 0.05;
    return 0;
  }

  awardReputation(player, amount) {
    if (!player.reputation || typeof player.reputation !== 'object' || Array.isArray(player.reputation)) player.reputation = { town: 0 };
    const delta = int(amount, -10_000, 10_000, 0);
    player.reputation.town = int(player.reputation.town, -100_000, 100_000, 0) + delta;
    return player.reputation.town;
  }

  serviceProximity(player, action, npcs = []) {
    const rule = getOfficialActionService(action);
    if (!rule) return { ok: true, npc: null };
    const npc = Array.isArray(npcs) ? npcs.find(entry => entry?.id === rule.npcId) : null;
    if (!npc) return { ok: false, error: `${rule.label} is unavailable.` };
    const mapId = cleanText(npc.mapId, 50);
    const x = Number(npc.posX);
    const y = Number(npc.posY);
    const near = mapId === player.mapId && Number.isFinite(x) && Number.isFinite(y)
      && Math.abs(player.x - x) <= 2 && Math.abs(player.y - y) <= 2;
    return near
      ? { ok: true, npc }
      : { ok: false, error: `Move near ${cleanText(npc.name, 80) || rule.label} to use this service.` };
  }

  applyDerivedBonuses(player, stats) {
    const s = this.ensurePlayer(player);
    stats.totalAttack += s.training * 2;
    stats.totalDefense += s.training;
    stats.totalMagic += s.training;
    if (Date.now() < s.blessingsUntil) stats.damageReduction += 5;
    for (const buff of Array.isArray(player.buffs) ? player.buffs : []) {
      if (Number(buff.expiresAt) <= Date.now()) continue;
      if (buff.type === 'official_attack') stats.totalAttack *= 1 + clamp(buff.value, 0, 50, 0) / 100;
      if (buff.type === 'official_defense') stats.damageReduction += clamp(buff.value, 0, 50, 0);
    }

    for (const eq of Object.values(player.equipment || {})) {
      for (const gemId of Array.isArray(eq?.socketedGems) ? eq.socketedGems : []) {
        const gem = OFFICIAL_GEMS.find(g => g.id === gemId);
        if (!gem) continue;
        if (gem.stat === 'attack') stats.totalAttack += gem.value;
        else if (gem.stat === 'defense') stats.totalDefense += gem.value;
        else if (gem.stat === 'magic') stats.totalMagic += gem.value;
        else if (gem.stat === 'hp') stats.totalMaxHp += gem.value;
        else if (gem.stat === 'mana') stats.totalMaxMana += gem.value;
        else if (gem.stat === 'crit') stats.critChance += gem.value;
        else if (gem.stat === 'lifesteal') stats.lifesteal += gem.value;
        else if (gem.stat === 'speed') stats.moveSpeed += gem.value;
      }
    }

    const equippedIds = new Set(Object.values(player.equipment || {}).map(eq => eq?.id).filter(Boolean));
    let damagePct = 0, magicPct = 0;
    for (const set of SETS) {
      const count = set.pieces.filter(id => equippedIds.has(id)).length;
      for (const bonus of set.bonuses) {
        if (count < bonus.at) continue;
        damagePct += bonus.damage || 0;
        magicPct += bonus.magicPct || 0;
        stats.xpBonus += bonus.xp || 0;
        stats.goldBonus += bonus.gold || 0;
        stats.totalMaxMana += bonus.mana || 0;
        stats.critChance += bonus.crit || 0;
        stats.moveSpeed += bonus.speed || 0;
        stats.damageReduction += bonus.reduction || 0;
        stats.thorns += bonus.thorns || 0;
        stats.totalMaxHp += bonus.hp || 0;
        stats.lifesteal += bonus.lifesteal || 0;
      }
    }
    if (damagePct) stats.totalAttack *= 1 + damagePct / 100;
    if (magicPct) stats.totalMagic *= 1 + magicPct / 100;
    return stats;
  }

  getActivePet(player) {
    const s = this.ensurePlayer(player);
    return s.pets.active ? OFFICIAL_PETS.find(p => p.id === s.pets.active) || null : null;
  }

  getPetDamage(player, monster) {
    const pet = this.getActivePet(player);
    if (!pet) return null;
    return { pet, damage: Math.max(1, Math.floor(pet.attack + player.level * 0.25 - (Number(monster.defense) || 0) * 0.25)) };
  }

  getMasteryBonus(player) {
    const weapon = player.equipment?.weapon;
    if (!weapon?.id) return 0;
    const mastery = this.ensurePlayer(player).mastery[weapon.id];
    return mastery ? Math.min(0.25, int(mastery.level, 1, 20, 1) * 0.01) : 0;
  }

  recordWeaponHit(player) {
    const weapon = player.equipment?.weapon;
    if (!weapon?.id) return;
    const s = this.ensurePlayer(player);
    const entry = s.mastery[weapon.id] || { level: 1, xp: 0 };
    entry.xp = int(entry.xp, 0, 1_000_000, 0) + 1;
    const needed = entry.level * 25;
    if (entry.xp >= needed && entry.level < 20) { entry.xp -= needed; entry.level++; }
    s.mastery[weapon.id] = entry;
  }

  maybeGemDrop(player, monster) {
    const chance = monster.type === 'boss' ? 0.45 : monster.type === 'elite' ? 0.15 : 0.025;
    if (Math.random() >= chance) return null;
    const maxTier = Math.min(4, Math.floor(player.level / 8) + 1);
    const eligible = OFFICIAL_GEMS.filter(g => g.tier <= maxTier);
    if (!eligible.length) return null;
    const gem = eligible[Math.floor(Math.random() * eligible.length)];
    return {
      id: `gem_${Date.now()}_${Math.random()}`, name: gem.name, icon: gem.icon, type: 'gem', gemId: gem.id,
      quantity: 1, value: gem.tier * 100, rarity: gem.rarity, description: `${gem.stat} +${gem.value}`,
    };
  }

  refreshAchievements(player) {
    const s = this.ensurePlayer(player);
    const unlocked = [];
    for (const achievement of ACHIEVEMENTS) {
      if (s.achievements.includes(achievement.id) || !achievement.test(player)) continue;
      s.achievements.push(achievement.id);
      s.coins += achievement.coins;
      unlocked.push({ id: achievement.id, name: achievement.name, icon: achievement.icon, coins: achievement.coins });
    }
    return unlocked;
  }

  ensureWorldEvent(now = Date.now()) {
    const event = this.global.event;
    if (event && !event.completed && now < event.expiresAt) return event;
    if (event?.completed && now < (event.completedAt || 0) + 60_000) return event;

    const source = this.contentEvents.length ? this.contentEvents : DEFAULT_EVENTS;
    const raw = source[this.global.eventSequence % source.length] || DEFAULT_EVENTS[0];
    this.global.eventSequence = (this.global.eventSequence + 1) % 1_000_000;
    const normalized = {
      id: cleanText(raw.id, 100) || `event_${this.global.eventSequence}`,
      name: cleanText(raw.name, 100) || 'World Hunt', icon: cleanText(raw.icon, 8) || '🌍',
      mapId: cleanText(raw.mapId, 50) || 'eldoria', target: slug(raw.target || raw.monster || 'rat'),
      needed: int(raw.needed ?? raw.count, 1, 10000, 30), progress: 0,
      rewardGold: int(raw.rewardGold, 0, 10_000_000, 300), rewardXp: int(raw.rewardXp, 0, 10_000_000, 200),
      rewardCoins: int(raw.rewardCoins, 0, 10000, 8), participants: {}, completed: false,
      startedAt: now, expiresAt: now + int(raw.durationMs ?? raw.duration, 60_000, 86_400_000, 15 * 60_000), completedAt: 0,
    };
    this.global.event = normalized;
    this.save();
    return normalized;
  }

  onMonsterKill(player, monster) {
    const s = this.ensurePlayer(player);
    const key = slug(monster.contentSourceId || monster.name);
    s.bestiary[key] = int(s.bestiary[key], 0, 1_000_000, 0) + 1;
    const result = { xpMultiplier: this.getXpMultiplier(player), bonusLoot: [], nextDungeonWave: null, dungeonComplete: null, worldEventProgress: null, achievements: [] };
    const gem = this.maybeGemDrop(player, monster);
    if (gem) result.bonusLoot.push(gem);

    const event = this.ensureWorldEvent();
    if (!event.completed && player.mapId === event.mapId && key === event.target) {
      event.progress = Math.min(event.needed, event.progress + 1);
      const pk = playerKey(player.name);
      event.participants[pk] = int(event.participants[pk], 0, 1_000_000, 0) + 1;
      result.worldEventProgress = { name: event.name, progress: event.progress, needed: event.needed };
      if (event.progress >= event.needed) {
        event.completed = true;
        event.completedAt = Date.now();
        for (const participant of Object.keys(event.participants)) {
          const queue = Array.isArray(this.global.eventRewards[participant]) ? this.global.eventRewards[participant] : [];
          queue.push({ id: `${event.id}_${event.completedAt}`, name: event.name, gold: event.rewardGold, xp: event.rewardXp, coins: event.rewardCoins, claimed: false });
          this.global.eventRewards[participant] = queue.slice(-20);
        }
      }
      this.save();
    }

    if (monster.dungeonOwnerId === player.id && s.dungeon.active && monster.dungeonRunId === s.dungeon.runId) {
      s.dungeon.killsRemaining = Math.max(0, s.dungeon.killsRemaining - 1);
      if (s.dungeon.killsRemaining === 0) {
        if (s.dungeon.wave < s.dungeon.maxWaves) {
          s.dungeon.wave++;
          s.dungeon.killsRemaining = this.getDungeonWave(s.dungeon.wave, player.level).count;
          result.nextDungeonWave = s.dungeon.wave;
        } else {
          const waves = s.dungeon.maxWaves;
          const reward = { gold: waves * 150 + player.level * 20, xp: waves * 200 + player.level * 25, coins: waves * 2 };
          player.gold += reward.gold;
          player.xp += reward.xp;
          player.stats.goldEarned = (player.stats.goldEarned || 0) + reward.gold;
          s.coins += reward.coins;
          s.dungeon.highestWave = Math.max(s.dungeon.highestWave, waves);
          s.dungeon.clears++;
          this.awardReputation(player, 150);
          s.dungeon.active = false; s.dungeon.runId = null; s.dungeon.killsRemaining = 0;
          result.dungeonComplete = reward;
        }
      }
    }

    result.achievements = this.refreshAchievements(player);
    return result;
  }

  getDungeonWave(wave, playerLevel) {
    const base = DUNGEON_WAVES[Math.max(0, Math.min(DUNGEON_WAVES.length - 1, wave - 1))];
    const scale = 1 + Math.max(0, playerLevel - 1) * 0.025;
    return { ...base, hp: Math.floor(base.hp * scale), attack: Math.floor(base.attack * scale), defense: Math.floor(base.defense * (0.8 + scale * 0.2)), xp: Math.floor(base.xp * scale), wave };
  }

  startDungeon(player, maxWaves) {
    const s = this.ensurePlayer(player);
    const waves = [3, 5, 10].includes(Number(maxWaves)) ? Number(maxWaves) : 3;
    if (s.dungeon.active) return { ok: false, error: 'A dungeon run is already active.' };
    if (player.level < Math.max(1, waves - 2)) return { ok: false, error: `Level ${Math.max(1, waves - 2)} required.` };
    const runId = `dungeon_${player.id}_${Date.now()}`;
    s.dungeon = { ...s.dungeon, active: true, runId, wave: 1, maxWaves: waves, killsRemaining: this.getDungeonWave(1, player.level).count };
    return { ok: true, runId, wave: 1, maxWaves: waves };
  }

  abandonDungeon(player) {
    const s = this.ensurePlayer(player);
    if (!s.dungeon.active) return false;
    s.dungeon.active = false; s.dungeon.runId = null; s.dungeon.killsRemaining = 0;
    return true;
  }

  failDungeon(player) { return this.abandonDungeon(player); }

  tickPlayer(player, now = Date.now()) {
    const s = this.ensurePlayer(player);
    if (now - s.lastStaminaTick >= 60_000) {
      const spent = Math.min(10, Math.floor((now - s.lastStaminaTick) / 60_000));
      s.stamina = Math.max(0, s.stamina - spent);
      s.lastStaminaTick += spent * 60_000;
    }
    if (s.pvp.aggression > 0 && now - s.pvp.lastAggression > 5 * 60_000) {
      s.pvp.aggression = Math.max(0, s.pvp.aggression - 1);
      s.pvp.lastAggression = now;
      s.pvp.skull = skullForAggression(s.pvp.aggression);
    }
    this.ensureWorldEvent(now);
  }

  buyPet(player, petId) {
    const s = this.ensurePlayer(player);
    const pet = OFFICIAL_PETS.find(p => p.id === petId);
    if (!pet || player.level < pet.levelRequired || s.pets.owned.includes(pet.id) || player.gold < pet.price) return false;
    player.gold -= pet.price; s.pets.owned.push(pet.id); return true;
  }

  togglePet(player, petId) {
    const s = this.ensurePlayer(player);
    if (petId === null || petId === '') { s.pets.active = null; return true; }
    if (!s.pets.owned.includes(petId)) return false;
    s.pets.active = s.pets.active === petId ? null : petId; return true;
  }

  depotPut(player, itemId) {
    const s = this.ensurePlayer(player);
    if (s.depot.length >= 40) return false;
    const index = player.inventory.findIndex(item => item.id === itemId);
    if (index < 0) return false;
    const [item] = player.inventory.splice(index, 1);
    s.depot.push({ ...item, depotId: `depot_${Date.now()}_${Math.random()}` });
    return true;
  }

  depotTake(player, depotId) {
    const s = this.ensurePlayer(player);
    const index = s.depot.findIndex(item => item.depotId === depotId);
    if (index < 0) return false;
    const [item] = s.depot.splice(index, 1);
    delete item.depotId;
    addItem(player, { ...item, id: `depot_take_${Date.now()}_${Math.random()}` });
    return true;
  }

  bank(player, direction, rawAmount) {
    const amount = int(rawAmount, 1, 100_000_000, 0);
    if (!amount) return false;
    if (direction === 'deposit' && player.gold >= amount) { player.gold -= amount; player.bankGold += amount; return true; }
    if (direction === 'withdraw' && player.bankGold >= amount) { player.bankGold -= amount; player.gold += amount; return true; }
    return false;
  }

  rest(player) {
    if (player.gold < 50) return false;
    player.gold -= 50;
    player.hp = player.maxHp;
    player.mana = player.maxMana;
    const s = this.ensurePlayer(player);
    s.stamina = Math.min(2520, s.stamina + 120);
    return true;
  }

  train(player) {
    const s = this.ensurePlayer(player);
    if (player.gold < 200 || s.training >= 20) return false;
    player.gold -= 200; s.training++; return true;
  }

  buyFood(player, foodId) {
    const food = OFFICIAL_FOOD.find(f => f.id === foodId);
    if (!food || player.level < food.levelRequired || player.gold < food.price) return false;
    player.gold -= food.price;
    const now = Date.now();
    player.buffs = (Array.isArray(player.buffs) ? player.buffs : []).filter(b => b.type !== food.buffType && Number(b.expiresAt) > now);
    player.buffs.push({ id: `${food.buffType}_${now}`, type: food.buffType, name: food.name, value: food.value, startTime: now, expiresAt: now + 10 * 60_000 });
    return true;
  }

  buyShop(player, itemId, rawQty) {
    const item = OFFICIAL_SHOP.find(entry => entry.id === itemId);
    const qty = int(rawQty, 1, 20, 1);
    if (!item) return false;
    const discount = this.getReputationDiscount(player);
    const unitPrice = Math.max(1, Math.floor(item.price * (1 - discount)));
    if (player.level < (item.levelRequired || 1) || player.gold < unitPrice * qty) return false;
    player.gold -= unitPrice * qty;
    addItem(player, { name: item.name, icon: item.icon, type: item.type, quantity: qty, value: unitPrice, description: item.description });
    return true;
  }

  craft(player, recipeId) {
    const recipe = OFFICIAL_RECIPES.find(r => r.id === recipeId);
    if (!recipe || player.level < recipe.levelRequired) return false;
    for (const ing of recipe.ingredients) {
      if (ing.name === 'Gold') { if (player.gold < ing.quantity) return false; }
      else {
        const total = player.inventory.filter(i => i.name === ing.name).reduce((sum, i) => sum + int(i.quantity, 0, 999999, 0), 0);
        if (total < ing.quantity) return false;
      }
    }
    for (const ing of recipe.ingredients) {
      if (ing.name === 'Gold') player.gold -= ing.quantity;
      else consumeNamed(player, ing.name, ing.quantity);
    }
    addItem(player, { ...recipe.result, id: `craft_${Date.now()}_${Math.random()}` });
    return true;
  }

  socketGem(player, itemId, gemItemId) {
    const equipmentItem = player.inventory.find(i => i.id === itemId && i.equipment);
    const gemItem = player.inventory.find(i => i.id === gemItemId && i.type === 'gem' && i.gemId);
    const gem = gemItem ? OFFICIAL_GEMS.find(g => g.id === gemItem.gemId) : null;
    if (!equipmentItem || !gemItem || !gem) return false;
    const sockets = int(equipmentItem.equipment.sockets, 0, 4, 0);
    const filled = Array.isArray(equipmentItem.equipment.socketedGems) ? equipmentItem.equipment.socketedGems : [];
    if (sockets <= filled.length) return false;
    equipmentItem.equipment.socketedGems = [...filled, gem.id];
    gemItem.quantity--;
    if (gemItem.quantity <= 0) player.inventory = player.inventory.filter(i => i.id !== gemItem.id);
    return true;
  }

  claimDaily(player, now = Date.now()) {
    const s = this.ensurePlayer(player);
    const today = dayKey(now);
    if (s.daily.lastDay === today) return false;
    const previous = s.daily.lastDay ? new Date(`${s.daily.lastDay}T00:00:00Z`).getTime() : 0;
    const consecutive = previous && Math.floor((new Date(`${today}T00:00:00Z`).getTime() - previous) / 86_400_000) === 1;
    s.daily.streak = consecutive ? Math.min(7, s.daily.streak + 1) : 1;
    s.daily.lastDay = today;
    const day = s.daily.streak;
    const reward = { gold: 50 * day, xp: 30 * day, coins: 2 * day };
    player.gold += reward.gold; player.xp += reward.xp; s.coins += reward.coins;
    player.stats.goldEarned = (player.stats.goldEarned || 0) + reward.gold;
    return reward;
  }

  gather(player, world) {
    const s = this.ensurePlayer(player);
    const now = Date.now();
    if (now - s.lastGatherAt < 4000) return null;
    const map = world.getMap(player.mapId);
    if (!map) return null;
    const resources = {
      rock: { profession: 'mining', name: 'Ore', icon: '⛏', value: 15 },
      stone: { profession: 'mining', name: 'Ore', icon: '⛏', value: 15 },
      bush: { profession: 'herbalism', name: 'Herb', icon: '🌿', value: 12 },
      water: { profession: 'fishing', name: 'Fish', icon: '🐟', value: 18 },
      tree: { profession: 'woodcutting', name: 'Wood', icon: '🪵', value: 10 },
    };
    const around = [[1,0],[-1,0],[0,1],[0,-1]];
    let found = null;
    for (const [dx, dy] of around) {
      const tile = map.tiles?.[player.y + dy]?.[player.x + dx];
      if (tile && resources[tile.type]) { found = resources[tile.type]; break; }
    }
    if (!found) return null;
    s.lastGatherAt = now;
    const prof = s.professions[found.profession];
    const qty = 1 + (Math.random() < Math.min(0.5, prof.level * 0.02) ? 1 : 0);
    addItem(player, { name: found.name, icon: found.icon, type: 'material', quantity: qty, value: found.value });
    prof.xp += 1;
    if (prof.xp >= prof.level * 10 && prof.level < 100) { prof.xp -= prof.level * 10; prof.level++; }
    player.professions = s.professions;
    return { ...found, quantity: qty, level: prof.level, xp: prof.xp };
  }

  readBook(player, bookId) {
    const s = this.ensurePlayer(player);
    if (!OFFICIAL_BOOKS.some(b => b.id === bookId)) return false;
    if (!s.booksRead.includes(bookId)) s.booksRead.push(bookId);
    return true;
  }

  answerMystery(player, mysteryId, answer) {
    const s = this.ensurePlayer(player);
    const mystery = MYSTERIES.find(m => m.id === mysteryId);
    if (!mystery || player.level < mystery.requiredLevel) return { ok: false, error: 'Mystery locked.' };
    const progress = s.mysteries[mystery.id] || { solvedChapters: 0, completed: false };
    if (progress.completed) return { ok: false, error: 'Mystery already completed.' };
    const chapter = mystery.chapters[progress.solvedChapters];
    if (!chapter) return { ok: false, error: 'Mystery state invalid.' };
    if (cleanText(answer, 80).toLowerCase() !== chapter.answer.toLowerCase()) return { ok: false, error: 'Incorrect answer.' };
    progress.solvedChapters++;
    if (progress.solvedChapters >= mystery.chapters.length) {
      progress.completed = true;
      player.gold += mystery.rewardGold; player.xp += mystery.rewardXp;
      player.stats.goldEarned = (player.stats.goldEarned || 0) + mystery.rewardGold;
      this.awardReputation(player, 75);
      if (mystery.rewardItem) addItem(player, { ...mystery.rewardItem, type: 'misc', quantity: 1 });
    }
    s.mysteries[mystery.id] = progress;
    return { ok: true, completed: progress.completed, solvedChapters: progress.solvedChapters, reward: progress.completed ? { gold: mystery.rewardGold, xp: mystery.rewardXp, item: mystery.rewardItem } : null };
  }

  buyCoinItem(player, itemId, contentItems = []) {
    const s = this.ensurePlayer(player);
    const entry = OFFICIAL_COIN_STORE.find(item => item.id === itemId);
    if (!entry || s.coins < entry.price) return false;
    if (entry.id === 'title_shadow' && s.titles.owned.includes('Shadow Walker')) return false;
    s.coins -= entry.price;
    if (entry.id === 'supplies') {
      addItem(player, { name: 'Health Potion', icon: '🧪', type: 'potion', quantity: 5, value: 50 });
      addItem(player, { name: 'Mana Potion', icon: '🧴', type: 'potion', quantity: 5, value: 50 });
    } else if (entry.id === 'equipment_cache') {
      const pool = buildEquipmentLootPool(contentItems).filter(item => (item.level || 1) <= player.level + 3);
      if (!pool.length) { s.coins += entry.price; return false; }
      const sorted = pool.sort((a, b) => Math.abs((a.level || 1) - player.level) - Math.abs((b.level || 1) - player.level)).slice(0, 8);
      const reward = sorted[Math.floor(Math.random() * sorted.length)];
      addItem(player, { name: reward.name, icon: reward.icon, type: 'equipment', quantity: 1, value: reward.value || 0, rarity: reward.rarity, description: reward.description, equipment: { ...reward, sockets: Math.random() < 0.35 ? 1 : 0, socketedGems: [] } });
    } else if (entry.id === 'blessing') {
      s.blessingsUntil = Math.max(Date.now(), s.blessingsUntil) + 60 * 60_000;
    } else if (entry.id === 'title_shadow') {
      s.titles.owned.push('Shadow Walker'); s.titles.active = 'Shadow Walker';
    }
    return true;
  }

  listAuction(player, itemId, rawPrice) {
    const price = int(rawPrice, 1, 10_000_000, 0);
    const index = player.inventory.findIndex(item => item.id === itemId);
    const seller = playerKey(player.name);
    if (!price || index < 0 || this.global.auctions.filter(a => a.sellerKey === seller).length >= 10) return false;
    const [item] = player.inventory.splice(index, 1);
    this.global.auctions.push({ id: `auction_${Date.now()}_${Math.random()}`, seller: player.name, sellerKey: seller, price, item: { ...item }, createdAt: Date.now() });
    this.save();
    return true;
  }

  buyAuction(player, listingId, findOnlinePlayer = null) {
    const index = this.global.auctions.findIndex(a => a.id === listingId);
    const listing = index >= 0 ? this.global.auctions[index] : null;
    if (!listing || listing.sellerKey === playerKey(player.name) || player.gold < listing.price) return false;
    player.gold -= listing.price;
    const onlineSeller = typeof findOnlinePlayer === 'function' ? findOnlinePlayer(listing.sellerKey) : null;
    if (onlineSeller) {
      onlineSeller.gold += listing.price;
      onlineSeller.stats.goldEarned = (onlineSeller.stats.goldEarned || 0) + listing.price;
    } else {
      this.global.credits[listing.sellerKey] = int(this.global.credits[listing.sellerKey], 0, 1_000_000_000, 0) + listing.price;
    }
    addItem(player, { ...listing.item, id: `auction_buy_${Date.now()}_${Math.random()}` });
    this.global.auctions.splice(index, 1);
    this.save();
    return true;
  }

  cancelAuction(player, listingId) {
    const index = this.global.auctions.findIndex(a => a.id === listingId && a.sellerKey === playerKey(player.name));
    if (index < 0) return false;
    const [listing] = this.global.auctions.splice(index, 1);
    addItem(player, { ...listing.item, id: `auction_cancel_${Date.now()}_${Math.random()}` });
    this.save(); return true;
  }

  sendMail(player, payload, characterExists = null) {
    const s = this.ensurePlayer(player);
    const now = Date.now();
    if (now - s.lastMailAt < 30_000) return false;
    const target = cleanText(payload.target, 24);
    const targetKey = playerKey(target);
    const subject = cleanText(payload.subject, 80);
    const body = cleanText(payload.body, 500);
    const gold = int(payload.gold, 0, 1_000_000, 0);
    const itemId = cleanText(payload.itemId, 120);
    if (!targetKey || targetKey === playerKey(player.name) || !subject || !body || player.gold < gold + 5) return false;
    if (typeof characterExists === 'function' && !characterExists(target)) return false;

    let item = null;
    let itemIndex = -1;
    if (itemId) {
      itemIndex = player.inventory.findIndex(entry => entry.id === itemId);
      if (itemIndex < 0) return false;
      const source = player.inventory[itemIndex];
      item = { ...source, quantity: 1, id: `mail_item_${now}_${Math.random()}` };
      if (source.equipment) item.equipment = { ...source.equipment };
    }

    player.gold -= gold + 5;
    if (itemIndex >= 0) {
      const source = player.inventory[itemIndex];
      if (int(source.quantity, 1, 999999, 1) > 1 && source.type !== 'equipment') source.quantity -= 1;
      else player.inventory.splice(itemIndex, 1);
    }
    s.lastMailAt = now;
    this.global.mail.push({
      id: `mail_${now}_${Math.random()}`, from: player.name, to: targetKey, subject, body, gold, item,
      claimed: gold === 0 && !item, read: false, sentAt: now, system: false,
    });
    this.global.mail = this.global.mail.slice(-5000);
    this.save(); return true;
  }

  markMail(player, mailId, action) {
    const key = playerKey(player.name);
    const index = this.global.mail.findIndex(m => m.id === mailId && m.to === key);
    const mail = index >= 0 ? this.global.mail[index] : null;
    if (!mail) return false;
    if (action === 'read') mail.read = true;
    else if (action === 'claim') {
      if (mail.claimed) return false;
      const gold = int(mail.gold, 0, 1_000_000, 0);
      player.gold += gold;
      player.stats.goldEarned = (player.stats.goldEarned || 0) + gold;
      if (mail.item) addItem(player, { ...mail.item, id: `mail_claim_${Date.now()}_${Math.random()}` });
      mail.claimed = true; mail.read = true;
    } else if (action === 'delete') {
      if (!mail.claimed && (Number(mail.gold) > 0 || mail.item)) return false;
      this.global.mail.splice(index, 1);
    } else return false;
    this.save(); return true;
  }

  claimWorldEvent(player) {
    const key = playerKey(player.name);
    const queue = Array.isArray(this.global.eventRewards[key]) ? this.global.eventRewards[key] : [];
    const reward = queue.find(r => !r.claimed);
    if (!reward) return false;
    reward.claimed = true;
    player.gold += reward.gold; player.xp += reward.xp; this.ensurePlayer(player).coins += reward.coins;
    player.stats.goldEarned = (player.stats.goldEarned || 0) + reward.gold;
    this.awardReputation(player, 100);
    this.save(); return reward;
  }

  pvpToggle(player) {
    const s = this.ensurePlayer(player); s.pvp.enabled = !s.pvp.enabled; return s.pvp.enabled;
  }

  pvpAttack(player, target, getDerivedStats = null) {
    const now = Date.now();
    const s = this.ensurePlayer(player);
    const ts = target ? this.ensurePlayer(target) : null;
    if (!target || target.id === player.id || !s.pvp.enabled || !ts.pvp.enabled || target.mapId !== player.mapId) return null;
    if (now - s.lastPvpAttack < 900) return null;
    if (Math.abs(target.x - player.x) + Math.abs(target.y - player.y) > 2) return null;
    s.lastPvpAttack = now;
    const attacker = typeof getDerivedStats === 'function' ? getDerivedStats(player) : null;
    const defender = typeof getDerivedStats === 'function' ? getDerivedStats(target) : null;
    const attack = Number(attacker?.totalAttack) || player.attack || 0;
    const defense = Number(defender?.totalDefense) || target.defense || 0;
    const reduction = clamp(defender?.damageReduction, 0, 80, 0);
    const raw = Math.max(1, (attack + player.level * 0.8 - defense * 0.5) * 0.65);
    const damage = Math.max(1, Math.floor(raw * (1 - reduction / 100)));
    target.hp -= damage;
    player.stats.damageDealt = (player.stats.damageDealt || 0) + damage;
    target.stats.damageTaken = (target.stats.damageTaken || 0) + damage;
    s.pvp.aggression = Math.min(100, s.pvp.aggression + 2);
    s.pvp.lastAggression = now;
    s.pvp.skull = skullForAggression(s.pvp.aggression);
    let killed = false;
    if (target.hp <= 0) {
      killed = true;
      target.hp = Number(defender?.totalMaxHp) || target.maxHp;
      target.mana = Number(defender?.totalMaxMana) || target.maxMana;
      target.mapId = 'eldoria'; target.x = 40; target.y = 40;
      target.stats.deaths = (target.stats.deaths || 0) + 1;
      s.pvp.aggression = Math.min(100, s.pvp.aggression + 18); s.pvp.skull = skullForAggression(s.pvp.aggression);
    }
    return { damage, killed, skull: s.pvp.skull };
  }

  publicPvp(player) {
    const s = this.ensurePlayer(player);
    return { enabled: s.pvp.enabled, skull: s.pvp.skull, title: s.titles.active };
  }

  snapshot(player, nearbyPlayers = []) {
    const s = this.ensurePlayer(player);
    const event = this.ensureWorldEvent();
    const inbox = this.global.mail.filter(m => m.to === playerKey(player.name)).slice(-50).map(m => ({ ...m, body: cleanText(m.body, 500) }));
    const pendingRewards = (this.global.eventRewards[playerKey(player.name)] || []).filter(r => !r.claimed);
    return {
      state: {
        depot: s.depot, pets: s.pets, coins: s.coins, training: s.training, professions: s.professions,
        bestiary: s.bestiary, achievements: s.achievements, daily: s.daily, stamina: s.stamina,
        booksRead: s.booksRead, mysteries: s.mysteries, pvp: s.pvp, mastery: s.mastery,
        blessingsUntil: s.blessingsUntil, titles: s.titles, dungeon: s.dungeon,
        reputation: { ...(player.reputation || { town: 0 }) }, shopDiscount: this.getReputationDiscount(player),
      },
      catalogs: {
        pets: OFFICIAL_PETS, gems: OFFICIAL_GEMS, shop: OFFICIAL_SHOP, food: OFFICIAL_FOOD,
        recipes: OFFICIAL_RECIPES, coinStore: OFFICIAL_COIN_STORE, books: OFFICIAL_BOOKS,
        mysteries: publicMysteries(), achievements: ACHIEVEMENTS.map(({ test, ...rest }) => rest),
      },
      mail: inbox,
      auctions: this.global.auctions.slice(-100).map(a => ({ id: a.id, seller: a.seller, price: a.price, item: a.item, createdAt: a.createdAt })),
      worldEvent: { ...event, participants: undefined, pendingRewards },
      nearbyPvp: nearbyPlayers.map(p => ({ id: p.id, name: p.name, level: p.level, hp: p.hp, maxHp: p.maxHp, ...this.publicPvp(p) })),
    };
  }

  handle(player, payload, ctx = {}) {
    const action = cleanText(payload?.action, 80);
    if (!hasOfficialAction(action)) return { ok: false, error: 'Unknown official action.' };
    const proximity = this.serviceProximity(player, action, ctx.contentNpcs || []);
    if (!proximity.ok) return { ok: false, error: proximity.error || 'Move near the required NPC.' };

    const result = executeOfficialAction(this, player, action, payload, ctx);
    const ok = Boolean(result?.ok);
    const detail = result?.detail ?? null;
    if (ok) this.refreshAchievements(player);
    return { ok, detail, action, error: ok ? null : 'Action rejected by authoritative server.' };
  }
}

export const officialSystems = new OfficialSystems();
