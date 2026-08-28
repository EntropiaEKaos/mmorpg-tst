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
import { officialRuntimeCoordinator } from './OfficialRuntimeCoordinator.mjs';
import { livingRealmDomain } from './LivingRealmDomain.mjs';
import { roadToTenDomain } from './RoadToTenDomain.mjs';
import { contentDB } from './ContentDB.mjs';
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
    this.livingRealmContent = {};
    this.roadToTenContent = {};
    this.load();
    this.syncLivingRealmContent();
    this.syncRoadToTenContent();
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

  syncLivingRealmContent() { return livingRealmDomain.syncContent(this,{nodes:contentDB.get('nodes'),factions:contentDB.get('factions'),materials:contentDB.get('materials'),craftingRecipes:contentDB.get('craftingRecipes'),tamingSpecies:contentDB.get('tamingSpecies')}); }
  syncRoadToTenContent() { return roadToTenDomain.syncContent(this,{professionSpecializations:contentDB.get('professionSpecializations'),economyPolicies:contentDB.get('economyPolicies'),factionPrograms:contentDB.get('factionPrograms'),siegeAssets:contentDB.get('siegeAssets'),dynamicWorldRules:contentDB.get('dynamicWorldRules'),dungeonBlueprints:contentDB.get('dungeonBlueprints'),questConsequences:contentDB.get('questConsequences'),housingUpgrades:contentDB.get('housingUpgrades')}); }

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

  discoverRegion(player, mapId) {
    return officialProgressionDomain.discoverRegion(this, player, mapId);
  }

  ensureWorldEvent(now = Date.now()) {
    return officialWorldEventDomain.ensure(this, now);
  }

  onMonsterKill(player, monster) {
    const result=officialRuntimeCoordinator.onMonsterKill(this, player, monster);
    if(result?.dungeonComplete) roadToTenDomain.completeDungeonBlueprint(this,player,result.dungeonComplete);
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
    return officialRuntimeCoordinator.tickPlayer(this, player, now);
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

  buyShop(player, itemId, rawQty, contentShops = [], contentItems = []) {
    return officialInventoryEconomyDomain.buyShop(this, player, itemId, rawQty, contentShops, contentItems);
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
    const listing=this.global.auctions.find(a=>a.id===listingId);const result=officialCommerceDomain.buyAuction(this, player, listingId, findOnlinePlayer);if(result&&listing)roadToTenDomain.recordTrade(this,player,listing.price,'buy','auction');return result;
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
    const result=officialPvpDomain.attack(this, player, target, getDerivedStats);if(result?.killed)result.bounty=roadToTenDomain.claimBounties(this,player,target);return result;
  }

  publicPvp(player) {
    return officialPvpDomain.publicState(this, player);
  }


  livingRealmTick(now=Date.now()){ const living=livingRealmDomain.tick(this,now); roadToTenDomain.tick(this,now); return living; }
  livingRealmSnapshot(player=null){ return livingRealmDomain.publicRealm(this,player); }
  joinFaction(player,factionId){ return livingRealmDomain.joinFaction(this,player,factionId); }
  defectFaction(player,factionId){ return livingRealmDomain.defectFaction(this,player,factionId); }
  donateNode(player,nodeId,amount){ return livingRealmDomain.donateNodeGold(this,player,nodeId,amount); }
  declareNodeWar(player,nodeId){ return livingRealmDomain.declareNodeWar(this,player,nodeId); }
  attackNode(player,nodeId){ return livingRealmDomain.attackNode(this,player,nodeId); }
  claimNode(player,nodeId){ return livingRealmDomain.claimNeutralNode(this,player,nodeId); }
  advancedCraft(player,recipeId){ const result=livingRealmDomain.advancedCraft(this,player,recipeId); roadToTenDomain.onCraft(this,player,result,recipeId); return result; }
  tameAnimal(player,speciesId,nearbyMonsters=[]){ const result=livingRealmDomain.tame(this,player,speciesId,nearbyMonsters);if(result?.ok)roadToTenDomain.progressFactionProgram(this,player,'taming',1);return result; }
  breedAnimals(player,parentAId,parentBId){ return livingRealmDomain.breed(this,player,parentAId,parentBId); }
  activateTamedAnimal(player,animalId){ return livingRealmDomain.activateAnimal(this,player,animalId); }
  livingRealmMonsterKill(player,monster){ const living=livingRealmDomain.onMonsterKill(this,player,monster); roadToTenDomain.onMonsterKill(this,player,monster); return living; }

  roadToTenSnapshot(player=null){ return roadToTenDomain.publicSnapshot(this,player); }
  getRegionalMarketMultiplier(player){ return roadToTenDomain.marketMultiplier(this,player); }
  getRoadCraftQualityBonus(player){ return roadToTenDomain.craftQualityBonus(this,player); }
  getRoadTamingChanceBonus(player){ return roadToTenDomain.tamingChanceBonus(this,player); }
  getRoadBreedingMutationBonus(player){ return roadToTenDomain.breedingMutationBonus(this,player); }
  getRoadNodeSiegeMultiplier(nodeId){ return roadToTenDomain.nodeSiegeMultiplier(this,nodeId); }
  getRoadSpawnThreatMultiplier(mapId){ return roadToTenDomain.spawnThreatMultiplier(this,mapId); }
  recordRegionalTrade(player,value,direction='buy',category='general'){ return roadToTenDomain.recordTrade(this,player,value,direction,category); }
  chooseProfessionSpecialization(player,specId){ return roadToTenDomain.chooseProfessionSpecialization(this,player,specId); }
  careTamedAnimal(player,animalId,kind){ return roadToTenDomain.careAnimal(this,player,animalId,kind); }
  assignTamedAnimalRole(player,animalId,role){ return roadToTenDomain.assignAnimalRole(this,player,animalId,role); }
  donateFactionTreasury(player,amount){ return roadToTenDomain.donateFaction(this,player,amount); }
  voteFactionLeader(player,candidate){ return roadToTenDomain.voteLeader(this,player,candidate); }
  setFactionDiplomacy(player,targetFactionId,status){ return roadToTenDomain.setDiplomacy(this,player,targetFactionId,status); }
  placeFactionBounty(player,targetName,reward){ return roadToTenDomain.placeBounty(this,player,targetName,reward); }
  buildSiegeAsset(player,nodeId,assetId){ return roadToTenDomain.buildSiegeAsset(this,player,nodeId,assetId); }
  useSiegeAsset(player,nodeId,builtAssetId){ return roadToTenDomain.useSiegeAsset(this,player,nodeId,builtAssetId); }
  startDungeonBlueprint(player,blueprintId){ return roadToTenDomain.startDungeonBlueprint(this,player,blueprintId); }
  chooseDungeonPath(player,path){ return roadToTenDomain.chooseDungeonPath(this,player,path); }
  solveDungeonPuzzleStep(player,runeIndex){ return roadToTenDomain.solveDungeonPuzzleStep(this,player,runeIndex); }
  isRoadDungeonPuzzlePending(player){ return roadToTenDomain.isDungeonPuzzlePending(this,player); }
  getRoadDungeonPresentation(player){ return roadToTenDomain.dungeonPresentation(this,player); }
  applyQuestConsequence(player,consequenceId){ return roadToTenDomain.applyQuestConsequence(this,player,consequenceId); }
  buyHousingUpgrade(player,upgradeId,ownedHouseId=null){ return roadToTenDomain.buyHousingUpgrade(this,player,upgradeId,ownedHouseId); }

  snapshot(player, nearbyPlayers = []) {
    return officialSnapshotReadModel.snapshot(this, player, nearbyPlayers);
  }

  handle(player, payload, ctx = {}) {
    return officialActionGateway.handle(this, player, payload, ctx);
  }
}

export const officialSystems = new OfficialSystems();
