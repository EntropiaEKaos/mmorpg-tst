// ===================================================================
//  CONTENT DATABASE — Server owns ALL game content
//  Items, Monsters, NPCs, Quests, Spells, Maps, World Events
//  All created/edited via the server Admin Panel.
//  All players see the same content (true MMO).
// ===================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = process.env.MORIA_CONTENT_DB || path.join(__dirname, '..', 'moria-content.json');
const COLLECTION_KEYS = Object.freeze(['items', 'monsters', 'npcs', 'quests', 'spells', 'maps', 'worldEvents', 'shops', 'lootTables']);
const TYPE_ALIASES = Object.freeze({ events: 'worldEvents' });

function emptyContentData() {
  return {
    version: 1,
    items: [], monsters: [], npcs: [], quests: [], spells: [], maps: [],
    worldEvents: [], shops: [], lootTables: [],
  };
}

function canonicalContentType(type) {
  const key = TYPE_ALIASES[type] || type;
  return COLLECTION_KEYS.includes(key) ? key : null;
}

function normalizeCollection(value, { requireId = true } = {}) {
  if (!Array.isArray(value)) return [];
  const records = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    if (requireId && (typeof entry.id !== 'string' || !entry.id.trim())) continue;
    const copy = { ...entry };
    if (typeof copy.id === 'string') copy.id = copy.id.trim().slice(0, 100);
    records.push(copy);
  }
  return records;
}

function dedupeById(records) {
  const byId = new Map();
  for (const record of records) {
    if (typeof record.id !== 'string' || !record.id) continue;
    byId.set(record.id, record);
  }
  return Array.from(byId.values());
}

export function normalizeContentData(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Content database must be an object');
  const recognized = Number.isFinite(Number(raw.version))
    || COLLECTION_KEYS.some(key => Array.isArray(raw[key]))
    || Array.isArray(raw.events);
  if (!recognized) throw new Error('Content database has no recognized schema fields');

  const normalized = emptyContentData();
  const version = Number(raw.version);
  normalized.version = Number.isInteger(version) && version > 0 ? version : 1;
  for (const key of COLLECTION_KEYS) {
    if (key === 'worldEvents') continue;
    normalized[key] = normalizeCollection(raw[key], { requireId: key !== 'shops' && key !== 'lootTables' });
  }
  normalized.worldEvents = dedupeById([
    ...normalizeCollection(raw.worldEvents),
    ...normalizeCollection(raw.events),
  ]);
  return normalized;
}

export class ContentDB {
  constructor(dbFile = DB_FILE) {
    this.dbFile = dbFile;
    this.data = emptyContentData();
    // Only seed a brand-new or unrecoverably corrupt database. A valid empty
    // collection is intentional admin state and must stay empty after restart.
    if (!this.load()) this.seedDefaults();
  }

  load() {
    const tempFile = `${this.dbFile}.tmp`;
    const candidates = [this.dbFile, tempFile];
    for (const candidate of candidates) {
      if (!fs.existsSync(candidate)) continue;
      try {
        const parsed = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
        this.data = normalizeContentData(parsed);
        if (candidate === tempFile) {
          fs.mkdirSync(path.dirname(this.dbFile), { recursive: true });
          fs.renameSync(tempFile, this.dbFile);
          console.warn('⚠ Content DB recovered from atomic temp file');
        } else if (fs.existsSync(tempFile)) {
          fs.rmSync(tempFile, { force: true });
        }
        console.log(`📦 Content DB: ${this.data.items.length} items, ${this.data.monsters.length} monsters, ${this.data.npcs.length} NPCs, ${this.data.quests.length} quests`);
        return true;
      } catch (e) {
        console.warn(`⚠ Content DB load failed (${path.basename(candidate)}):`, e.message);
        if (candidate === this.dbFile) {
          try { fs.renameSync(this.dbFile, `${this.dbFile}.corrupt-${Date.now()}`); } catch {}
        } else {
          try { fs.rmSync(tempFile, { force: true }); } catch {}
        }
      }
    }
    return false;
  }

  save() {
    const tempFile = `${this.dbFile}.tmp`;
    try {
      fs.mkdirSync(path.dirname(this.dbFile), { recursive: true });
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2));
      fs.renameSync(tempFile, this.dbFile);
      return true;
    } catch (e) {
      try { fs.rmSync(tempFile, { force: true }); } catch {}
      console.warn('⚠ Content DB save failed:', e.message);
      return false;
    }
  }

  seedDefaults() {
    console.log('🌱 Seeding default content...');
    
    // ===== ITEMS =====
    this.data.items = [
      { id: 'iron_sword', name: 'Iron Sword', icon: '🗡', slot: 'weapon', attack: 5, rarity: 'common', level: 1, value: 25 },
      { id: 'steel_sword', name: 'Steel Sword', icon: '⚔', slot: 'weapon', attack: 12, rarity: 'uncommon', level: 5, value: 120 },
      { id: 'magic_staff', name: 'Magic Staff', icon: '🪄', slot: 'weapon', attack: 8, magic: 5, mana: 20, rarity: 'rare', level: 8, value: 350 },
      { id: 'dragon_slayer', name: 'Dragon Slayer', icon: '🔪', slot: 'weapon', attack: 25, rarity: 'epic', level: 15, value: 1200 },
      { id: 'excalibur', name: 'Excalibur', icon: '⚔', slot: 'weapon', attack: 45, hp: 50, critChance: 5, lifesteal: 3, rarity: 'legendary', level: 25, value: 5000, description: 'The legendary sword of kings.' },
      { id: 'leather_armor', name: 'Leather Armor', icon: '🎽', slot: 'armor', armor: 8, rarity: 'uncommon', level: 3, value: 150 },
      { id: 'plate_armor', name: 'Plate Armor', icon: '🛡', slot: 'armor', armor: 15, defense: 3, rarity: 'rare', level: 10, value: 500 },
      { id: 'dragon_mail', name: 'Dragon Mail', icon: '🎽', slot: 'armor', armor: 28, hp: 40, damageReduction: 5, rarity: 'epic', level: 18, value: 2000 },
      { id: 'iron_helm', name: 'Iron Helmet', icon: '⛑', slot: 'helmet', armor: 5, rarity: 'common', level: 2, value: 80 },
      { id: 'crown', name: 'Crown of Kings', icon: '👑', slot: 'helmet', armor: 12, magic: 8, mana: 30, xpBonus: 5, goldBonus: 5, rarity: 'legendary', level: 20, value: 3500 },
      { id: 'steel_legs', name: 'Steel Legs', icon: '🦿', slot: 'legs', armor: 7, rarity: 'uncommon', level: 5, value: 180 },
      { id: 'boots_haste', name: 'Boots of Haste', icon: '👢', slot: 'boots', armor: 2, moveSpeed: 15, rarity: 'rare', level: 10, value: 400 },
      { id: 'tower_shield', name: 'Tower Shield', icon: '🛡', slot: 'shield', defense: 10, armor: 5, rarity: 'rare', level: 8, value: 350 },
      { id: 'might_ring', name: 'Might Ring', icon: '💍', slot: 'ring', attack: 5, rarity: 'rare', level: 8, value: 400 },
      { id: 'amulet_loss', name: 'Amulet of Loss', icon: '📿', slot: 'amulet', rarity: 'legendary', level: 1, value: 2500, description: 'Prevents XP loss on death' },
    ];

    // ===== MONSTERS =====
    this.data.monsters = [
      { id: 'rat', name: 'Rat', emoji: '🐀', hp: 20, attack: 4, defense: 1, xp: 10, level: 1, color: '#8b6f47', size: 0.7, type: 'normal', goldMin: 1, goldMax: 5 },
      { id: 'snake', name: 'Snake', emoji: '🐍', hp: 35, attack: 7, defense: 2, xp: 18, level: 3, color: '#4a7c3a', size: 0.8, type: 'normal', goldMin: 2, goldMax: 8 },
      { id: 'wolf', name: 'Wolf', emoji: '🐺', hp: 60, attack: 12, defense: 4, xp: 30, level: 7, color: '#5a5a5a', size: 0.9, type: 'normal', goldMin: 5, goldMax: 15 },
      { id: 'bear', name: 'Bear', emoji: '🐻', hp: 120, attack: 20, defense: 6, xp: 55, level: 10, color: '#5a3a1e', size: 1.05, type: 'normal', goldMin: 10, goldMax: 30 },
      { id: 'orc', name: 'Orc', emoji: '👹', hp: 100, attack: 18, defense: 5, xp: 55, level: 10, color: '#4a5d23', size: 1.0, type: 'normal', goldMin: 10, goldMax: 25 },
      { id: 'orc_warrior', name: 'Orc Warrior', emoji: '👹', hp: 180, attack: 28, defense: 8, xp: 95, level: 15, color: '#3a4d13', size: 1.1, type: 'elite', goldMin: 20, goldMax: 50 },
      { id: 'skeleton', name: 'Skeleton', emoji: '💀', hp: 80, attack: 15, defense: 4, xp: 45, level: 8, color: '#d4d4c8', size: 0.95, type: 'normal', goldMin: 5, goldMax: 15 },
      { id: 'ghost', name: 'Ghost', emoji: '👻', hp: 90, attack: 22, defense: 3, xp: 65, level: 12, color: '#ccccff', size: 1.0, type: 'normal', goldMin: 8, goldMax: 20 },
      { id: 'demon', name: 'Demon', emoji: '😈', hp: 400, attack: 50, defense: 15, xp: 300, level: 25, color: '#c13030', size: 1.3, type: 'elite', goldMin: 50, goldMax: 150 },
      { id: 'orc_king', name: 'Orc King', emoji: '👑', hp: 800, attack: 60, defense: 20, xp: 800, level: 25, color: '#2a3d03', size: 1.5, type: 'boss', goldMin: 200, goldMax: 500 },
      { id: 'dragon_lord', name: 'Dragon Lord', emoji: '🐉', hp: 1500, attack: 85, defense: 30, xp: 2000, level: 40, color: '#8b0000', size: 1.8, type: 'boss', goldMin: 500, goldMax: 1500 },
    ];

    // ===== NPCS =====
    this.data.npcs = [
      { id: 'merchant_gorn', name: 'Gorn', emoji: '🧙', color: '#9b59ff', role: 'merchant', posX: 38, posY: 38, mapId: 'eldoria', dialogue: 'Welcome to my shop, traveler!' },
      { id: 'banker', name: 'Banker Elric', emoji: '👨‍💼', color: '#f4e04d', role: 'banker', posX: 34, posY: 38, mapId: 'eldoria', dialogue: 'Your gold is safe here.' },
      { id: 'innkeeper', name: 'Helena', emoji: '👩', color: '#ff9bcc', role: 'innkeeper', posX: 49, posY: 38, mapId: 'eldoria', dialogue: 'Rest here to recover (50 gold).' },
      { id: 'trainer', name: 'Master Kai', emoji: '🥋', color: '#ff8c00', role: 'trainer', posX: 43, posY: 40, mapId: 'eldoria', dialogue: 'Train with me! (200 gold)' },
      { id: 'postmaster', name: 'Postmaster Edwin', emoji: '📮', color: '#f4e04d', role: 'guard', posX: 31, posY: 37, mapId: 'eldoria', dialogue: 'Welcome to the Mor\'ia Post!' },
      { id: 'librarian', name: 'Sage Eleanor', emoji: '📚', color: '#9b59ff', role: 'guard', posX: 40, posY: 45, mapId: 'eldoria', dialogue: 'Knowledge is power.' },
    ];

    // ===== SPELLS (built into vocations, but listed for admin editing) =====
    this.data.spells = [
      { id: 'berserk', name: 'Berserk', icon: '⚔', mana: 10, cooldown: 1800, damage: 35, range: 1.5, color: '#ff4444', type: 'aoe', vocation: 'knight', levelRequired: 1 },
      { id: 'wound_heal', name: 'Wound Heal', icon: '❤', mana: 15, cooldown: 1500, damage: 60, range: 0, color: '#2ecc71', type: 'heal', vocation: 'knight', levelRequired: 5 },
      { id: 'divine_arrow', name: 'Divine Arrow', icon: '🏹', mana: 12, cooldown: 1500, damage: 55, range: 7, color: '#f4e04d', type: 'attack', vocation: 'paladin', levelRequired: 1 },
      { id: 'fireball', name: 'Fireball', icon: '🔥', mana: 25, cooldown: 2500, damage: 80, range: 6, color: '#ff6a00', type: 'attack', vocation: 'sorcerer', levelRequired: 5 },
      { id: 'ice_strike', name: 'Ice Strike', icon: '❄', mana: 15, cooldown: 1800, damage: 55, range: 5, color: '#9bd4ff', type: 'attack', vocation: 'druid', levelRequired: 5 },
      { id: 'greater_heal', name: 'Greater Heal', icon: '💚', mana: 20, cooldown: 1500, damage: 100, range: 0, color: '#2ecc71', type: 'heal', vocation: 'druid', levelRequired: 1 },
    ];

    // ===== MAPS =====
    this.data.maps = [
      { id: 'eldoria', name: 'Eldoria', biome: 'plains', description: 'The capital city', levelRequired: 1 },
      { id: 'frostpeak', name: 'Frostpeak', biome: 'snow', description: 'Frozen mountains', levelRequired: 8 },
      { id: 'shadowfen', name: 'Shadowfen', biome: 'swamp', description: 'Cursed swampland', levelRequired: 12 },
      { id: 'emberhold', name: 'Emberhold', biome: 'desert', description: 'Volcanic desert', levelRequired: 16 },
      { id: 'voidlands', name: 'Voidlands', biome: 'shadow', description: 'End of the world', levelRequired: 25 },
    ];

    // ===== QUESTS (with objectives, requirements, rewards) =====
    this.data.quests = [
      { id: 'quest_rats', name: 'Rat Infestation', npcId: 'merchant_gorn', description: 'The town is infested with rats. Clear them out.', target: 'rat', count: 5, rewardGold: 50, rewardXp: 100, levelRequired: 1, requires: [], rewardItem: null },
      { id: 'quest_wolves', name: 'Wolf Menace', npcId: 'trainer', description: 'Wolves are terrorizing the forest paths.', target: 'wolf', count: 3, rewardGold: 120, rewardXp: 250, levelRequired: 5, requires: ['quest_rats'], rewardItem: null },
      { id: 'quest_orcs', name: 'Orc Invasion', npcId: 'trainer', description: 'Orcs are amassing in the south.', target: 'orc', count: 5, rewardGold: 350, rewardXp: 600, levelRequired: 8, requires: ['quest_wolves'], rewardItem: { name: 'Orc Tooth', icon: '🦷', value: 50 } },
      { id: 'quest_dragon', name: 'Dragon Slayer', npcId: 'banker', description: 'The ultimate challenge: defeat the Dragon Lord!', target: 'dragon_lord', count: 1, rewardGold: 5000, rewardXp: 5000, levelRequired: 25, requires: ['quest_orcs'], rewardItem: { name: 'Dragon Scale', icon: '🔷', value: 200 } },
      { id: 'quest_fish', name: 'Angler\'s Request', npcId: 'librarian', description: 'Catch 10 fish for the librarian.', target: 'fish', count: 10, rewardGold: 200, rewardXp: 300, levelRequired: 3, requires: [], rewardItem: { name: 'Fishing Rod', icon: '🎣', value: 100 } },
    ];

    // ===== WORLD EVENTS =====
    this.data.worldEvents = [
      { id: 'event_invasion', name: 'Rat Plague', icon: '🐀', description: 'Rats invade Eldoria!', type: 'invasion', target: 'rat', count: 20, rewardGold: 800, rewardXp: 1200, duration: 900 },
    ];

    this.save();
  }

  // ===== CRUD for all content types =====
  get(type) {
    const key = canonicalContentType(type);
    return key ? this.data[key] : [];
  }
  
  add(type, item) {
    const key = canonicalContentType(type);
    if (!key || !item || typeof item !== 'object' || Array.isArray(item)) return null;

    const explicitId = typeof item.id === 'string' && item.id.trim() ? item.id.trim().slice(0, 100) : '';
    if (explicitId && this.data[key].some(record => record.id === explicitId)) return null;

    let id = explicitId;
    if (!id) {
      do {
        id = `${key}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      } while (this.data[key].some(record => record.id === id));
    }

    const record = { ...item, id };
    this.data[key].push(record);
    this.save();
    return record;
  }

  update(type, id, updates) {
    const key = canonicalContentType(type);
    if (!key || typeof id !== 'string' || !updates || typeof updates !== 'object' || Array.isArray(updates)) return false;
    const canonicalId = id.trim().slice(0, 100);
    const arr = this.data[key];
    const idx = arr.findIndex(i => i.id === canonicalId);
    if (idx < 0) return false;
    arr[idx] = { ...arr[idx], ...updates, id: canonicalId };
    this.save();
    return true;
  }

  remove(type, id) {
    const key = canonicalContentType(type);
    if (!key || typeof id !== 'string') return false;
    const canonicalId = id.trim().slice(0, 100);
    const before = this.data[key].length;
    this.data[key] = this.data[key].filter(i => i.id !== canonicalId);
    if (this.data[key].length === before) return false;
    this.save();
    return true;
  }

  // Get all content for client sync
  getAllContent() {
    return this.data;
  }

  // Find a monster template by name
  getMonsterTemplate(name) {
    return this.data.monsters.find(m => m.name === name || m.id === name);
  }

  // Find an item template by id
  getItemTemplate(id) {
    return this.data.items.find(i => i.id === id);
  }
}

export const contentDB = new ContentDB();
