// ===================================================================
// MOR'IA MVP COMPLETE 6.0 — OFFICIAL SERVER-OWNED SYSTEMS
// Consolidates features that were previously browser/localStorage-only.
// ===================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeOfficialAction, getOfficialActionService, hasOfficialAction } from './OfficialActionRegistry.mjs';
import { officialCommerceDomain } from './OfficialCommerceDomain.mjs';
import { officialProgressionDomain } from './OfficialProgressionDomain.mjs';
import { officialPvpDomain } from './OfficialPvpDomain.mjs';
import { officialDungeonDomain } from './OfficialDungeonDomain.mjs';
import { officialWorldEventDomain } from './OfficialWorldEventDomain.mjs';
import { officialInventoryEconomyDomain } from './OfficialInventoryEconomyDomain.mjs';
import { officialExplorationKnowledgeDomain } from './OfficialExplorationKnowledgeDomain.mjs';
import { officialCombatAugmentationDomain } from './OfficialCombatAugmentationDomain.mjs';
import { exportPlayerState, freshGlobalState, freshPlayerState, normalizeGlobalState, normalizePlayerState } from './OfficialStateSchema.mjs';
import {
  OFFICIAL_PETS, OFFICIAL_GEMS, OFFICIAL_SHOP, OFFICIAL_FOOD, OFFICIAL_RECIPES,
  OFFICIAL_COIN_STORE, OFFICIAL_BOOKS,
  ACHIEVEMENTS,
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
const playerKey = (name) => String(name || '').trim().toLocaleLowerCase('en-US');



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
      this.global = normalizeGlobalState(raw);
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
    if (!player.official || typeof player.official !== 'object' || Array.isArray(player.official)) player.official = freshPlayerState();
    return player.official;
  }

  restorePlayer(player, saved) {
    player.official = normalizePlayerState(saved);
    player.professions = player.official.professions;
    return player.official;
  }

  exportPlayer(player) {
    return exportPlayerState(this.ensurePlayer(player));
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
    return officialProgressionDomain.getXpMultiplier(this, player);
  }

  getDeathLossMultiplier(player) {
    return officialProgressionDomain.getDeathLossMultiplier(this, player);
  }

  getReputationDiscount(player) {
    return officialProgressionDomain.getReputationDiscount(player);
  }

  awardReputation(player, amount) {
    return officialProgressionDomain.awardReputation(player, amount);
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
    return officialCombatAugmentationDomain.applyDerivedBonuses(this, player, stats);
  }

  getActivePet(player) {
    return officialCombatAugmentationDomain.getActivePet(this, player);
  }

  getPetDamage(player, monster) {
    return officialCombatAugmentationDomain.getPetDamage(this, player, monster);
  }

  getMasteryBonus(player) {
    return officialProgressionDomain.getMasteryBonus(this, player);
  }

  recordWeaponHit(player) {
    return officialProgressionDomain.recordWeaponHit(this, player);
  }


  refreshAchievements(player) {
    return officialProgressionDomain.refreshAchievements(this, player);
  }

  ensureWorldEvent(now = Date.now()) {
    return officialWorldEventDomain.ensure(this, now);
  }

  onMonsterKill(player, monster) {
    const key = officialCombatAugmentationDomain.recordBestiaryKill(this, player, monster);
    const result = { xpMultiplier: this.getXpMultiplier(player), bonusLoot: [], nextDungeonWave: null, dungeonComplete: null, worldEventProgress: null, achievements: [] };
    const gem = officialCombatAugmentationDomain.maybeGemDrop(player, monster);
    if (gem) result.bonusLoot.push(gem);

    result.worldEventProgress = officialWorldEventDomain.recordKill(this, player, key);

    const dungeonResult = officialDungeonDomain.onMonsterKill(this, player, monster);
    result.nextDungeonWave = dungeonResult.nextDungeonWave;
    result.dungeonComplete = dungeonResult.dungeonComplete;

    result.achievements = this.refreshAchievements(player);
    return result;
  }

  getDungeonWave(wave, playerLevel) {
    return officialDungeonDomain.getWave(wave, playerLevel);
  }

  startDungeon(player, maxWaves) {
    return officialDungeonDomain.start(this, player, maxWaves);
  }

  abandonDungeon(player) {
    return officialDungeonDomain.abandon(this, player);
  }

  failDungeon(player) {
    return officialDungeonDomain.fail(this, player);
  }

  tickPlayer(player, now = Date.now()) {
    officialProgressionDomain.tickStamina(this, player, now);
    officialPvpDomain.tick(this, player, now);
    this.ensureWorldEvent(now);
  }

  buyPet(player, petId) {
    return officialInventoryEconomyDomain.buyPet(this, player, petId);
  }

  togglePet(player, petId) {
    return officialInventoryEconomyDomain.togglePet(this, player, petId);
  }

  depotPut(player, itemId) {
    return officialInventoryEconomyDomain.depotPut(this, player, itemId);
  }

  depotTake(player, depotId) {
    return officialInventoryEconomyDomain.depotTake(this, player, depotId);
  }

  bank(player, direction, rawAmount) {
    return officialInventoryEconomyDomain.bank(player, direction, rawAmount);
  }

  rest(player) {
    return officialProgressionDomain.rest(this, player);
  }

  train(player) {
    return officialProgressionDomain.train(this, player);
  }

  buyFood(player, foodId) {
    return officialInventoryEconomyDomain.buyFood(player, foodId);
  }

  buyShop(player, itemId, rawQty) {
    return officialInventoryEconomyDomain.buyShop(this, player, itemId, rawQty);
  }

  craft(player, recipeId) {
    return officialInventoryEconomyDomain.craft(player, recipeId);
  }

  socketGem(player, itemId, gemItemId) {
    return officialInventoryEconomyDomain.socketGem(player, itemId, gemItemId);
  }

  claimDaily(player, now = Date.now()) {
    return officialProgressionDomain.claimDaily(this, player, now);
  }

  gather(player, world) {
    return officialExplorationKnowledgeDomain.gather(this, player, world);
  }

  readBook(player, bookId) {
    return officialExplorationKnowledgeDomain.readBook(this, player, bookId);
  }

  answerMystery(player, mysteryId, answer) {
    return officialExplorationKnowledgeDomain.answerMystery(this, player, mysteryId, answer);
  }

  buyCoinItem(player, itemId, contentItems = []) {
    return officialInventoryEconomyDomain.buyCoinItem(this, player, itemId, contentItems);
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
    return officialWorldEventDomain.claim(this, player);
  }

  pvpToggle(player) {
    return officialPvpDomain.toggle(this, player);
  }

  pvpAttack(player, target, getDerivedStats = null) {
    return officialPvpDomain.attack(this, player, target, getDerivedStats);
  }

  publicPvp(player) {
    return officialPvpDomain.publicState(this, player);
  }

  snapshot(player, nearbyPlayers = []) {
    const s = this.ensurePlayer(player);
    const event = this.ensureWorldEvent();
    const inbox = this.global.mail.filter(m => m.to === playerKey(player.name)).slice(-50).map(m => ({ ...m, body: cleanText(m.body, 500) }));
    const pendingRewards = officialWorldEventDomain.pendingRewards(this, player);
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
        mysteries: officialExplorationKnowledgeDomain.publicMysteries(), achievements: ACHIEVEMENTS.map(({ test, ...rest }) => rest),
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
