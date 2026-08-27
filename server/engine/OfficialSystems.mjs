// ===================================================================
// MOR'IA MVP COMPLETE 6.0 — OFFICIAL SERVER-OWNED SYSTEMS
// Consolidates features that were previously browser/localStorage-only.
// ===================================================================

import { officialActionGateway } from './OfficialActionGateway.mjs';
import { officialCommerceDomain } from './OfficialCommerceDomain.mjs';
import { officialProgressionDomain } from './OfficialProgressionDomain.mjs';
import { officialPvpDomain } from './OfficialPvpDomain.mjs';
import { officialDungeonDomain } from './OfficialDungeonDomain.mjs';
import { officialWorldEventDomain } from './OfficialWorldEventDomain.mjs';
import { officialInventoryEconomyDomain } from './OfficialInventoryEconomyDomain.mjs';
import { officialExplorationKnowledgeDomain } from './OfficialExplorationKnowledgeDomain.mjs';
import { officialCombatAugmentationDomain } from './OfficialCombatAugmentationDomain.mjs';
import { exportPlayerState, freshGlobalState, freshPlayerState, normalizePlayerState } from './OfficialStateSchema.mjs';
import { DEFAULT_OFFICIAL_STATE_FILE, OfficialStateRepository } from './OfficialStateRepository.mjs';
import { officialPlayerLifecycleDomain } from './OfficialPlayerLifecycleDomain.mjs';
import { officialSnapshotReadModel } from './OfficialSnapshotReadModel.mjs';
import {
  OFFICIAL_PETS, OFFICIAL_GEMS, OFFICIAL_SHOP, OFFICIAL_FOOD, OFFICIAL_RECIPES,
  OFFICIAL_COIN_STORE, OFFICIAL_BOOKS,
} from './OfficialCatalogs.mjs';
export {
  OFFICIAL_PETS, OFFICIAL_GEMS, OFFICIAL_SHOP, OFFICIAL_FOOD, OFFICIAL_RECIPES,
  OFFICIAL_COIN_STORE, OFFICIAL_BOOKS,
} from './OfficialCatalogs.mjs';


export class OfficialSystems {
  constructor(dbFile = DEFAULT_OFFICIAL_STATE_FILE) {
    this.dbFile = dbFile;
    this.repository = new OfficialStateRepository(dbFile);
    this.global = freshGlobalState();
    this.contentEvents = [];
    this.load();
  }

  load() {
    const loaded = this.repository.load();
    if (!loaded) return false;
    this.global = loaded;
    return true;
  }

  save() {
    return this.repository.save(this.global);
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
    return officialPlayerLifecycleDomain.onLogin(this, player);
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
    return officialActionGateway.serviceProximity(player, action, npcs);
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
    return officialSnapshotReadModel.snapshot(this, player, nearbyPlayers);
  }

  handle(player, payload, ctx = {}) {
    return officialActionGateway.handle(this, player, payload, ctx);
  }
}

export const officialSystems = new OfficialSystems();
