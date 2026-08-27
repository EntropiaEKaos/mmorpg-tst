// ===================================================================
// MOR'IA MVP COMPLETE 6.0 — OFFICIAL SERVER-OWNED SYSTEMS
// Consolidates features that were previously browser/localStorage-only.
// ===================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildEquipmentLootPool } from './Items.mjs';
import { executeOfficialAction, getOfficialActionService, hasOfficialAction } from './OfficialActionRegistry.mjs';
import { officialCommerceDomain } from './OfficialCommerceDomain.mjs';
import {
  OFFICIAL_PETS, OFFICIAL_GEMS, OFFICIAL_SHOP, OFFICIAL_FOOD, OFFICIAL_RECIPES,
  OFFICIAL_COIN_STORE, OFFICIAL_BOOKS, MYSTERIES, DUNGEON_WAVES, DEFAULT_EVENTS,
  ACHIEVEMENTS, SETS,
} from './OfficialCatalogs.mjs';
export {
  OFFICIAL_PETS, OFFICIAL_GEMS, OFFICIAL_SHOP, OFFICIAL_FOOD, OFFICIAL_RECIPES,
  OFFICIAL_COIN_STORE, OFFICIAL_BOOKS,
} from './OfficialCatalogs.mjs';

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
    return officialCommerceDomain.listAuction(this, player, itemId, rawPrice);
  }

  buyAuction(player, listingId, findOnlinePlayer = null) {
    return officialCommerceDomain.buyAuction(this, player, listingId, findOnlinePlayer);
  }

  cancelAuction(player, listingId) {
    return officialCommerceDomain.cancelAuction(this, player, listingId);
  }

  sendMail(player, payload, characterExists = null) {
    return officialCommerceDomain.sendMail(this, player, payload, characterExists);
  }

  markMail(player, mailId, action) {
    return officialCommerceDomain.markMail(this, player, mailId, action);
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
