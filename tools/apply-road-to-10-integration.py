from pathlib import Path
import json, re

ROOT=Path('.')

def read(path): return (ROOT/path).read_text()
def write(path,text): (ROOT/path).write_text(text)
def replace_once(path,old,new):
    s=read(path)
    if old not in s: raise SystemExit(f'missing marker in {path}: {old[:100]!r}')
    write(path,s.replace(old,new,1))

def insert_before(path,marker,block):
    s=read(path)
    if block.strip() in s: return
    i=s.find(marker)
    if i<0: raise SystemExit(f'missing insert marker in {path}: {marker!r}')
    write(path,s[:i]+block+s[i:])

# ---------------- ContentDB: additive Road-to-10 catalogs, separate migration marker ----------------
p='server/engine/ContentDB.mjs'
replace_once(p,"import { LIVING_REALM_CONTENT } from './LivingRealmContent.mjs';", "import { LIVING_REALM_CONTENT } from './LivingRealmContent.mjs';\nimport { ROAD_TO_TEN_CONTENT } from './RoadToTenContent.mjs';")
replace_once(p,"'nodes', 'factions', 'materials', 'craftingRecipes', 'tamingSpecies']);", "'nodes', 'factions', 'materials', 'craftingRecipes', 'tamingSpecies', 'professionSpecializations', 'economyPolicies', 'factionPrograms', 'siegeAssets', 'dynamicWorldRules', 'dungeonBlueprints', 'questConsequences', 'housingUpgrades']);")
replace_once(p,"version: 1, livingRealmVersion: 0,", "version: 1, livingRealmVersion: 0, roadToTenVersion: 0,")
replace_once(p,"nodes: [], factions: [], materials: [], craftingRecipes: [], tamingSpecies: [],", "nodes: [], factions: [], materials: [], craftingRecipes: [], tamingSpecies: [],\n    professionSpecializations: [], economyPolicies: [], factionPrograms: [], siegeAssets: [], dynamicWorldRules: [], dungeonBlueprints: [], questConsequences: [], housingUpgrades: [],")
replace_once(p,"normalized.livingRealmVersion = Number.isInteger(Number(raw.livingRealmVersion)) && Number(raw.livingRealmVersion) > 0 ? Number(raw.livingRealmVersion) : 0;", "normalized.livingRealmVersion = Number.isInteger(Number(raw.livingRealmVersion)) && Number(raw.livingRealmVersion) > 0 ? Number(raw.livingRealmVersion) : 0;\n  normalized.roadToTenVersion = Number.isInteger(Number(raw.roadToTenVersion)) && Number(raw.roadToTenVersion) > 0 ? Number(raw.roadToTenVersion) : 0;")
replace_once(p,"else { this.migrateAlphaV2(); this.migrateAlphaV3(); this.migrateLivingRealmV1(); }", "else { this.migrateAlphaV2(); this.migrateAlphaV3(); this.migrateLivingRealmV1(); this.migrateRoadToTenV1(); }")
insert_before(p,"  save() {",'''  migrateRoadToTenV1() {
    if (Number(this.data.roadToTenVersion) >= 1) return false;
    const hasExistingContent = COLLECTION_KEYS.some(key => Array.isArray(this.data[key]) && this.data[key].length > 0);
    if (hasExistingContent) {
      for (const key of ['professionSpecializations','economyPolicies','factionPrograms','siegeAssets','dynamicWorldRules','dungeonBlueprints','questConsequences','housingUpgrades']) {
        this.data[key] = mergeById(ROAD_TO_TEN_CONTENT[key], this.data[key]);
      }
    }
    this.data.roadToTenVersion = 1;
    this.save();
    return true;
  }

''')

# ---------------- Content Studio: author every Road-to-10 system ----------------
p='server/engine/ContentStudio.mjs'
insert_before(p,"  gmRoster: Object.freeze([",'''  professionSpecializations: Object.freeze([
    field('id','ID'), field('name','Name'), field('profession','Profession'), field('icon','Icon'), field('requiredLevel','Required skill','number'), field('qualityBonus','Quality bonus','number'), field('tags','Recipe tags','json'),
  ]),
  economyPolicies: Object.freeze([
    field('id','ID'), field('name','Name'), field('specialization','Node specialization'), field('buyMultiplier','Buy multiplier','number'), field('sellMultiplier','Sell multiplier','number'), field('craftDemand','Craft demand','number'), field('taxEfficiency','Tax efficiency','number'),
  ]),
  factionPrograms: Object.freeze([
    field('id','ID'), field('factionId','Faction ID'), field('name','Program'), field('objective','Objective'), field('target','Weekly target','number'), field('rewardInfluence','Influence reward','number'), field('diplomacyStyle','Diplomacy style'),
  ]),
  siegeAssets: Object.freeze([
    field('id','ID'), field('name','Name'), field('icon','Icon'), field('role','Role'), field('goldCost','Gold cost','number'), field('material','Material'), field('materialQty','Material qty','number'), field('power','Power','number'), field('durability','Durability','number'),
  ]),
  dynamicWorldRules: Object.freeze([
    field('id','ID'), field('name','Name'), field('metric','Metric'), field('threshold','Threshold','number'), field('mode','Mode'), field('severity','Severity'), field('durationMs','Duration ms','number'), field('effects','Effects','json'),
  ]),
  dungeonBlueprints: Object.freeze([
    field('id','ID'), field('name','Name'), field('icon','Icon'), field('mapId','Map'), field('minLevel','Min level','number'), field('requiredNodeStage','Required Node stage','number'), field('waves','Waves','number'), field('paths','Paths','json'), field('puzzle','Puzzle'), field('boss','Boss'), field('worldImpact','World impact','json'),
  ]),
  questConsequences: Object.freeze([
    field('id','ID'), field('questId','Quest ID'), field('choice','Choice'), field('label','Player label'), field('nodeEffects','Node/world effects','json'), field('factionEffects','Faction effects','json'), field('chronicle','Chronicle headline','textarea'),
  ]),
  housingUpgrades: Object.freeze([
    field('id','ID'), field('name','Name'), field('icon','Icon'), field('category','Category'), field('level','Upgrade level','number'), field('goldCost','Gold cost','number'), field('benefits','Functional benefits','json'),
  ]),
''')
insert_before(p,"  if (type === 'gmRoster') {",'''  if (type === 'professionSpecializations') {
    if (!String(record.profession || '').trim()) return 'profession is required';
    let e=numberIn(record,'requiredLevel',1,100,{required:true,integer:true}); if(e)return e;
    e=numberIn(record,'qualityBonus',-20,50,{required:true}); if(e)return e;
    if(record.tags!==undefined&&!Array.isArray(record.tags))return 'tags must be a JSON array';
    return null;
  }
  if (type === 'economyPolicies') {
    if(!NODE_SPECIALIZATIONS.includes(String(record.specialization||'')))return 'specialization is not supported';
    for(const key of ['buyMultiplier','sellMultiplier','craftDemand','taxEfficiency']){const e=numberIn(record,key,.25,3,{required:true});if(e)return e;}
    return null;
  }
  if (type === 'factionPrograms') {
    if(!String(record.factionId||'').trim())return 'factionId is required';
    let e=numberIn(record,'target',1,100000000,{required:true});if(e)return e;
    return numberIn(record,'rewardInfluence',0,1000000,{required:true});
  }
  if (type === 'siegeAssets') {
    for(const [key,min,max] of [['goldCost',0,100000000],['materialQty',0,999],['power',0,100000],['durability',1,100000]]){const e=numberIn(record,key,min,max,{required:true,integer:true});if(e)return e;}
    return null;
  }
  if (type === 'dynamicWorldRules') {
    if(!['above','below'].includes(String(record.mode||'')))return 'dynamic world mode must be above or below';
    let e=numberIn(record,'threshold',0,100,{required:true});if(e)return e;
    e=numberIn(record,'durationMs',60000,86400000,{required:true,integer:true});if(e)return e;
    if(record.effects!==undefined&&(!record.effects||typeof record.effects!=='object'||Array.isArray(record.effects)))return 'effects must be a JSON object';
    return null;
  }
  if (type === 'dungeonBlueprints') {
    let e=numberIn(record,'minLevel',1,100000,{required:true,integer:true});if(e)return e;
    e=numberIn(record,'requiredNodeStage',0,6,{required:true,integer:true});if(e)return e;
    e=numberIn(record,'waves',1,10,{required:true,integer:true});if(e)return e;
    if(!Array.isArray(record.paths)||record.paths.length<1||record.paths.length>6)return 'paths must contain 1-6 entries';
    return null;
  }
  if (type === 'questConsequences') {
    if(!String(record.questId||'').trim()||!String(record.choice||'').trim())return 'questId and choice are required';
    return null;
  }
  if (type === 'housingUpgrades') {
    let e=numberIn(record,'level',1,10,{required:true,integer:true});if(e)return e;
    return numberIn(record,'goldCost',0,100000000,{required:true,integer:true});
  }

''')

# ---------------- Durable schema ----------------
p='server/engine/OfficialStateSchema.mjs'
insert_before(p,'export function freshPlayerState', '''function freshRoadPlayer(){return {version:'9.26.0',professions:{specializations:{},discoveries:[],workOrders:[]},beastCare:{animals:{}},politics:{influence:0,votes:0,bountiesPlaced:0},warfare:{assetsBuilt:0,repairs:0,damage:0},dungeon:{blueprintId:null,path:null,puzzle:null},quests:{choices:{}},housing:{upgrades:[],shopOpen:false,shopName:'',homeScore:0}};}
function freshRoadGlobal(){return {version:'9.26.0',economy:{regions:{},ledger:[],inflationIndex:1},politics:{factions:{},diplomacy:{},bounties:[]},warfare:{nodes:{}},dynamicWorld:{regions:{},events:[],sequence:0},dungeons:{worldBosses:{},records:[]},questConsequences:{},housing:{shops:{}},sequence:0};}
function normalizeRoadPlayer(raw){const b=freshRoadPlayer();if(!isRecord(raw))return b;const p=isRecord(raw.professions)?raw.professions:{};b.professions.specializations=isRecord(p.specializations)?Object.fromEntries(Object.entries(p.specializations).slice(0,40).map(([k,v])=>[slug(k),text(v,100)]).filter(x=>x[0]&&x[1])):{};b.professions.discoveries=Array.isArray(p.discoveries)?unique(p.discoveries.map(v=>text(v,100)).filter(Boolean)).slice(-100):[];b.professions.workOrders=Array.isArray(p.workOrders)?p.workOrders.filter(isRecord).slice(-30).map(clone):[];const bc=isRecord(raw.beastCare)?raw.beastCare:{};b.beastCare.animals=isRecord(bc.animals)?Object.fromEntries(Object.entries(bc.animals).slice(0,40).map(([id,v])=>[text(id,120),clone(v)]).filter(x=>x[0])):{};b.politics={influence:int(raw.politics?.influence,0,1000000,0),votes:int(raw.politics?.votes,0,100000,0),bountiesPlaced:int(raw.politics?.bountiesPlaced,0,100000,0)};b.warfare={assetsBuilt:int(raw.warfare?.assetsBuilt,0,1000000,0),repairs:int(raw.warfare?.repairs,0,100000000,0),damage:int(raw.warfare?.damage,0,100000000,0)};b.dungeon={blueprintId:text(raw.dungeon?.blueprintId,100)||null,path:text(raw.dungeon?.path,100)||null,puzzle:text(raw.dungeon?.puzzle,100)||null};b.quests.choices=isRecord(raw.quests?.choices)?Object.fromEntries(Object.entries(raw.quests.choices).slice(0,100).map(([k,v])=>[text(k,100),text(v,100)]).filter(x=>x[0]&&x[1])):{};b.housing={upgrades:Array.isArray(raw.housing?.upgrades)?unique(raw.housing.upgrades.map(v=>text(v,100)).filter(Boolean)).slice(-12):[],shopOpen:Boolean(raw.housing?.shopOpen),shopName:text(raw.housing?.shopName,80),homeScore:int(raw.housing?.homeScore,0,10000,0)};return b;}
function normalizeRoadGlobal(raw){const b=freshRoadGlobal();if(!isRecord(raw))return b;const copyRecord=(v,max)=>isRecord(v)?Object.fromEntries(Object.entries(v).slice(0,max).map(([k,x])=>[text(k,120),clone(x)]).filter(x=>x[0])):{};b.economy.regions=copyRecord(raw.economy?.regions,200);b.economy.ledger=Array.isArray(raw.economy?.ledger)?raw.economy.ledger.filter(isRecord).slice(-200).map(clone):[];b.economy.inflationIndex=clamp(raw.economy?.inflationIndex,.75,1.5,1);b.politics.factions=copyRecord(raw.politics?.factions,100);b.politics.diplomacy=copyRecord(raw.politics?.diplomacy,300);b.politics.bounties=Array.isArray(raw.politics?.bounties)?raw.politics.bounties.filter(isRecord).slice(-100).map(clone):[];b.warfare.nodes=copyRecord(raw.warfare?.nodes,200);b.dynamicWorld.regions=copyRecord(raw.dynamicWorld?.regions,200);b.dynamicWorld.events=Array.isArray(raw.dynamicWorld?.events)?raw.dynamicWorld.events.filter(isRecord).slice(-80).map(clone):[];b.dynamicWorld.sequence=int(raw.dynamicWorld?.sequence,0,999999999,0);b.dungeons.worldBosses=copyRecord(raw.dungeons?.worldBosses,500);b.dungeons.records=Array.isArray(raw.dungeons?.records)?raw.dungeons.records.filter(isRecord).slice(-200).map(clone):[];b.questConsequences=copyRecord(raw.questConsequences,500);b.housing.shops=copyRecord(raw.housing?.shops,500);b.sequence=int(raw.sequence,0,999999999,0);return b;}

''')
replace_once(p,"    livingRealm: { faction:{id:null,reputation:0,rank:0,joinedAt:0,defectionUntil:0,history:[]}, crafting:{skills:{},crafted:0,masterworks:0,log:[]}, taming:{skill:1,xp:0,animals:[],activeId:null,breedingCount:0}, lastNodeAttackAt:0 },", "    livingRealm: { faction:{id:null,reputation:0,rank:0,joinedAt:0,defectionUntil:0,history:[]}, crafting:{skills:{},crafted:0,masterworks:0,log:[]}, taming:{skill:1,xp:0,animals:[],activeId:null,breedingCount:0}, lastNodeAttackAt:0 },\n    roadToTen: freshRoadPlayer(),")
replace_once(p,"    livingRealm: { nodes:{}, chronicle:[], sequence:0 },", "    livingRealm: { nodes:{}, chronicle:[], sequence:0 },\n    roadToTen: freshRoadGlobal(),")
replace_once(p,"  return base;\n}\n\nexport function normalizeGlobalState", "  base.roadToTen=normalizeRoadPlayer(saved.roadToTen);\n  return base;\n}\n\nexport function normalizeGlobalState")
replace_once(p,"  return base;\n}\n\nexport function exportPlayerState", "  base.roadToTen=normalizeRoadGlobal(raw.roadToTen);\n  return base;\n}\n\nexport function exportPlayerState")
replace_once(p,"    livingRealm: s.livingRealm,", "    livingRealm: s.livingRealm,\n    roadToTen: s.roadToTen,")

# ---------------- Official systems integration ----------------
p='server/engine/OfficialSystems.mjs'
replace_once(p,"import { livingRealmDomain } from './LivingRealmDomain.mjs';", "import { livingRealmDomain } from './LivingRealmDomain.mjs';\nimport { roadToTenDomain } from './RoadToTenDomain.mjs';")
replace_once(p,"    this.livingRealmContent = {};", "    this.livingRealmContent = {};\n    this.roadToTenContent = {};")
replace_once(p,"    this.syncLivingRealmContent();", "    this.syncLivingRealmContent();\n    this.syncRoadToTenContent();")
replace_once(p,"  syncLivingRealmContent() { return livingRealmDomain.syncContent(this,{nodes:contentDB.get('nodes'),factions:contentDB.get('factions'),materials:contentDB.get('materials'),craftingRecipes:contentDB.get('craftingRecipes'),tamingSpecies:contentDB.get('tamingSpecies')}); }", "  syncLivingRealmContent() { return livingRealmDomain.syncContent(this,{nodes:contentDB.get('nodes'),factions:contentDB.get('factions'),materials:contentDB.get('materials'),craftingRecipes:contentDB.get('craftingRecipes'),tamingSpecies:contentDB.get('tamingSpecies')}); }\n  syncRoadToTenContent() { return roadToTenDomain.syncContent(this,{professionSpecializations:contentDB.get('professionSpecializations'),economyPolicies:contentDB.get('economyPolicies'),factionPrograms:contentDB.get('factionPrograms'),siegeAssets:contentDB.get('siegeAssets'),dynamicWorldRules:contentDB.get('dynamicWorldRules'),dungeonBlueprints:contentDB.get('dungeonBlueprints'),questConsequences:contentDB.get('questConsequences'),housingUpgrades:contentDB.get('housingUpgrades')}); }")
replace_once(p,"  livingRealmTick(now=Date.now()){ return livingRealmDomain.tick(this,now); }", "  livingRealmTick(now=Date.now()){ const living=livingRealmDomain.tick(this,now); roadToTenDomain.tick(this,now); return living; }")
replace_once(p,"  advancedCraft(player,recipeId){ return livingRealmDomain.advancedCraft(this,player,recipeId); }", "  advancedCraft(player,recipeId){ const result=livingRealmDomain.advancedCraft(this,player,recipeId); roadToTenDomain.onCraft(this,player,result,recipeId); return result; }")
replace_once(p,"  livingRealmMonsterKill(player,monster){ return livingRealmDomain.onMonsterKill(this,player,monster); }", "  livingRealmMonsterKill(player,monster){ const living=livingRealmDomain.onMonsterKill(this,player,monster); roadToTenDomain.onMonsterKill(this,player,monster); return living; }")
insert_before(p,"  snapshot(player, nearbyPlayers = []) {",'''  roadToTenSnapshot(player=null){ return roadToTenDomain.publicSnapshot(this,player); }
  getRegionalMarketMultiplier(player){ return roadToTenDomain.marketMultiplier(this,player); }
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
  applyQuestConsequence(player,consequenceId){ return roadToTenDomain.applyQuestConsequence(this,player,consequenceId); }
  buyHousingUpgrade(player,upgradeId){ return roadToTenDomain.buyHousingUpgrade(this,player,upgradeId); }

''')

# ---------------- Regional market price influences real shop purchases ----------------
p='server/engine/OfficialInventoryEconomyDomain.mjs'
replace_once(p,"    const unitPrice = Math.max(1, Math.floor(item.price * (1 - discount)));", "    const marketMultiplier = typeof host.getRegionalMarketMultiplier === 'function' ? host.getRegionalMarketMultiplier(player) : 1;\n    const unitPrice = Math.max(1, Math.floor(item.price * (1 - discount) * marketMultiplier));")
replace_once(p,"    return true;\n  }\n\n  craft(player, recipeId", "    if (typeof host.recordRegionalTrade === 'function') host.recordRegionalTrade(player, unitPrice * effectiveQty, 'buy', item.type === 'equipment' ? 'equipment' : item.type);\n    return true;\n  }\n\n  craft(player, recipeId")

# ---------------- Action registry: server-owned gameplay commands ----------------
p='server/engine/OfficialActionRegistry.mjs'
insert_before(p,"  pet_buy: {",'''  profession_specialize: { run:(systems,player,payload)=>detailWithOk(systems.chooseProfessionSpecialization(player,payload.specId)) },
  beast_care: { run:(systems,player,payload)=>detailWithOk(systems.careTamedAnimal(player,payload.animalId,payload.kind||'feed')) },
  beast_role: { run:(systems,player,payload)=>detailWithOk(systems.assignTamedAnimalRole(player,payload.animalId,payload.role)) },
  faction_treasury_donate: { run:(systems,player,payload)=>detailWithOk(systems.donateFactionTreasury(player,payload.amount)) },
  faction_vote: { run:(systems,player,payload)=>detailWithOk(systems.voteFactionLeader(player,payload.candidate)) },
  faction_diplomacy: { run:(systems,player,payload)=>detailWithOk(systems.setFactionDiplomacy(player,payload.targetFactionId,payload.status)) },
  bounty_place: { run:(systems,player,payload)=>detailWithOk(systems.placeFactionBounty(player,payload.targetName,payload.reward)) },
  siege_build: { run:(systems,player,payload)=>detailWithOk(systems.buildSiegeAsset(player,payload.nodeId,payload.assetId)) },
  siege_use: { run:(systems,player,payload)=>detailWithOk(systems.useSiegeAsset(player,payload.nodeId,payload.builtAssetId)) },
  dungeon_blueprint_start: { run:(systems,player,payload,ctx)=>{const result=systems.startDungeonBlueprint(player,payload.blueprintId);if(result?.ok)ctx.startDungeon?.(result.dungeon||result);return detailWithOk(result);} },
  dungeon_path: { run:(systems,player,payload)=>detailWithOk(systems.chooseDungeonPath(player,payload.path)) },
  quest_consequence: { run:(systems,player,payload)=>detailWithOk(systems.applyQuestConsequence(player,payload.consequenceId)) },
  housing_upgrade: { run:(systems,player,payload)=>detailWithOk(systems.buyHousingUpgrade(player,payload.upgradeId)) },
''')

# ---------------- Snapshot exposes the integrated Road-to-10 state ----------------
p='server/engine/OfficialSnapshotReadModel.mjs'
replace_once(p,"    shopDiscount: typeof host.getReputationDiscount === 'function' ? host.getReputationDiscount(player) : 0,", "    shopDiscount: typeof host.getReputationDiscount === 'function' ? host.getReputationDiscount(player) : 0,\n    roadToTen: isRecord(state.roadToTen) ? state.roadToTen : {},")
replace_once(p,"      livingRealm: typeof host.livingRealmSnapshot === 'function' ? clone(host.livingRealmSnapshot(player)) : null,", "      livingRealm: typeof host.livingRealmSnapshot === 'function' ? clone(host.livingRealmSnapshot(player)) : null,\n      roadToTen: typeof host.roadToTenSnapshot === 'function' ? clone(host.roadToTenSnapshot(player)) : null,")

# ---------------- Game engine content sync ----------------
p='server/engine/GameState.mjs'
replace_once(p,"livingWorldAI.sync(contentDB); interiorSystem.sync(contentDB); officialSystems.syncLivingRealmContent?.();", "livingWorldAI.sync(contentDB); interiorSystem.sync(contentDB); officialSystems.syncLivingRealmContent?.(); officialSystems.syncRoadToTenContent?.();")

# ---------------- Client authoring surfaces ----------------
p='src/components/GameEditor.tsx'
replace_once(p,"import LivingRealmDirector916 from './LivingRealmDirector916';", "import LivingRealmDirector916 from './LivingRealmDirector916';\nimport RoadToTenDirector926 from './RoadToTenDirector926';")
replace_once(p,"type EditorTab = 'items' | 'spells' | 'classes' | 'maps' | 'quests98' | 'interiors98' | 'director98' | 'realm916' | 'books' | 'npcs' | 'monsters';", "type EditorTab = 'items' | 'spells' | 'classes' | 'maps' | 'quests98' | 'interiors98' | 'director98' | 'realm916' | 'road926' | 'books' | 'npcs' | 'monsters';")
replace_once(p,"    { id: 'realm916', label: 'Living Realm 9.16', icon: '🏰' },", "    { id: 'realm916', label: 'Living Realm 9.16', icon: '🏰' },\n    { id: 'road926', label: 'Road to 10 · 9.26', icon: '✦' },")
replace_once(p,"          {tab === 'realm916' && <LivingRealmDirector916 />}", "          {tab === 'realm916' && <LivingRealmDirector916 />}\n          {tab === 'road926' && <RoadToTenDirector926 />}")

p='src/components/CharacterPanel.tsx'
replace_once(p,"import LivingRealmPlayerPanel916 from './LivingRealmPlayerPanel916';", "import LivingRealmPlayerPanel916 from './LivingRealmPlayerPanel916';\nimport RoadToTenPlayerPanel926 from './RoadToTenPlayerPanel926';")
replace_once(p,"        <LivingRealmPlayerPanel916 player={player} official={official} />", "        <LivingRealmPlayerPanel916 player={player} official={official} />\n        <RoadToTenPlayerPanel926 player={player} official={official} />")

# ---------------- Versioning ----------------
for path in ['package.json','server/package.json']:
    data=json.loads(read(path)); data['version']='9.26.0'; write(path,json.dumps(data,ensure_ascii=False,indent=2)+'\n')
for path in ['package-lock.json','server/package-lock.json']:
    data=json.loads(read(path)); data['version']='9.26.0';
    if isinstance(data.get('packages'),dict) and '' in data['packages']: data['packages']['']['version']='9.26.0'
    write(path,json.dumps(data,ensure_ascii=False,indent=2)+'\n')

print('Road to 10 integration applied.')
