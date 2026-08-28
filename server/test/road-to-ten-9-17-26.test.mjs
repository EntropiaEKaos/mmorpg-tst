import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RoadToTenDomain, ROAD_TO_TEN_VERSION } from '../engine/RoadToTenDomain.mjs';
import { ROAD_TO_TEN_CONTENT } from '../engine/RoadToTenContent.mjs';
import { LIVING_REALM_CONTENT } from '../engine/LivingRealmContent.mjs';
import { freshPlayerState, freshGlobalState, normalizePlayerState, normalizeGlobalState, exportPlayerState } from '../engine/OfficialStateSchema.mjs';
import { OFFICIAL_ACTION_NAMES } from '../engine/OfficialActionRegistry.mjs';
import { contentDB } from '../engine/ContentDB.mjs';
import { getContentStudioSchema, validateStudioRecord } from '../engine/ContentStudio.mjs';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'../..');

function hostAndPlayer({mapId='eldoria',factionId='crown_eldoria',level=30,gold=100000}={}){
  const domain=new RoadToTenDomain();
  const nodeDef=LIVING_REALM_CONTENT.nodes.find(n=>n.mapId===mapId)||LIVING_REALM_CONTENT.nodes[0];
  const global=freshGlobalState();
  global.livingRealm.nodes[nodeDef.id]={id:nodeDef.id,xp:1500,stage:3,stageName:'village',controllerFactionId:factionId,hp:7000,maxHp:7000,treasury:1000,supply:60,morale:60,status:'peace',attackerFactionId:null,declaredAt:0,siegeStartsAt:0,siegeEndsAt:0,recoveryUntil:0,lastChangedAt:0};
  const player={name:'Engineer',level,gold,mapId,x:nodeDef.x,y:nodeDef.y,attack:30,inventory:[{id:'r1',name:'Ironbark Resin',type:'material',quantity:20},{id:'m1',name:'Mana Crystal',type:'material',quantity:20},{id:'s1',name:'Storm Core',type:'material',quantity:20},{id:'t1',name:'Tide Pearl',type:'material',quantity:20}],quests:[],housing:{ownedHouseId:'house_alpha'},official:freshPlayerState()};
  player.official.livingRealm.faction.id=factionId;player.official.livingRealm.crafting.skills={weaponsmithing:{level:25,xp:0},armorsmithing:{level:25,xp:0},enchanting:{level:25,xp:0},siege_engineering:{level:25,xp:0}};
  player.official.livingRealm.taming.animals=[{id:'wolf1',speciesId:'icefang_wolf',name:'Icefang Wolf',roles:['mount','combat','scout'],traits:{speed:70,strength:60,loyalty:55},bond:0}];
  const host={global,livingRealmContent:{nodes:structuredClone(LIVING_REALM_CONTENT.nodes),factions:structuredClone(LIVING_REALM_CONTENT.factions),materials:structuredClone(LIVING_REALM_CONTENT.materials),craftingRecipes:structuredClone(LIVING_REALM_CONTENT.craftingRecipes),tamingSpecies:structuredClone(LIVING_REALM_CONTENT.tamingSpecies)},roadToTenContent:{},ensurePlayer(p){return p.official},save(){return true},startDungeon(_p,waves){return {ok:true,wave:1,maxWaves:waves}}};
  domain.syncContent(host,ROAD_TO_TEN_CONTENT);
  return {domain,host,player,nodeDef};
}

test('9.17 integration derives one modifier chain from Node faction economy and dynamic world',()=>{
  const {domain,host,player}=hostAndPlayer();
  const m=domain.integrationModifiers(host,player,1000);
  assert.equal(m.mapId,'eldoria');assert.equal(m.nodeSpecialization,'commercial');assert.ok(m.priceMultiplier<1.1);assert.ok(m.craftQualityBonus>=5);assert.ok(m.spawnThreatMultiplier>=1);
});

test('9.18 regional economy records trade, changes scarcity and funds Node tax treasury',()=>{
  const {domain,host,player,nodeDef}=hostAndPlayer();
  const before=host.global.livingRealm.nodes[nodeDef.id].treasury;
  const out=domain.recordTrade(host,player,20000,'buy','equipment',2000);
  assert.equal(out.ok,true);assert.ok(out.tax>0);assert.equal(host.global.livingRealm.nodes[nodeDef.id].treasury,before+out.tax);assert.ok(host.global.roadToTen.economy.ledger.length===1);assert.ok(host.global.roadToTen.economy.regions.eldoria.demand>50);
});

test('9.19 profession specialization is skill-gated and permanently selects a branch',()=>{
  const {domain,host,player}=hostAndPlayer();
  const beforeQuality=domain.craftQualityBonus(host,player);const ok=domain.chooseProfessionSpecialization(host,player,'weaponsmith');assert.equal(ok.ok,true);assert.equal(ok.specialization,'weaponsmith');assert.ok(domain.craftQualityBonus(host,player)>beforeQuality);
  const locked=domain.chooseProfessionSpecialization(host,player,'armorsmith');assert.equal(locked.ok,true); // different profession can specialize independently
  player.official.livingRealm.crafting.skills.enchanting.level=1;assert.equal(domain.chooseProfessionSpecialization(host,player,'runesmith').ok,false);
});

test('9.20 beast care spends server gold, raises bond and assigns only authored roles',()=>{
  const {domain,host,player}=hostAndPlayer();const gold=player.gold;
  const cared=domain.careAnimal(host,player,'wolf1','feed',5000);assert.equal(cared.ok,true);assert.equal(player.gold,gold-25);assert.equal(cared.animal.bond,1);
  assert.equal(domain.assignAnimalRole(host,player,'wolf1','scout').ok,true);assert.equal(domain.assignAnimalRole(host,player,'wolf1','merchant').ok,false);
});

test('9.21 faction politics funds treasury, spends influence on votes and leader controls diplomacy',()=>{
  const {domain,host,player}=hostAndPlayer();
  const funded=domain.donateFaction(host,player,2500,10000);assert.equal(funded.ok,true);assert.ok(funded.influence>=10);
  const vote=domain.voteLeader(host,player,player.name,11000);assert.equal(vote.ok,true);assert.equal(vote.leader,player.name);
  const dip=domain.setDiplomacy(host,player,'free_league','allied',12000);assert.equal(dip.ok,true);assert.equal(host.global.roadToTen.politics.diplomacy['crown_eldoria::free_league'].status,'allied');
});

test('9.22 siege warfare builds material-backed assets and damages fortification only in siege context',()=>{
  const {domain,host,player,nodeDef}=hostAndPlayer({mapId:'frostpeak',factionId:'red_pact'});const node=host.global.livingRealm.nodes[nodeDef.id];node.controllerFactionId='crown_eldoria';node.attackerFactionId='red_pact';node.status='siege';
  const built=domain.buildSiegeAsset(host,player,nodeDef.id,'battering_ram',20000);assert.equal(built.ok,true);const fort=host.global.roadToTen.warfare.nodes[nodeDef.id],before=fort.gateHp;
  const protectedMultiplier=domain.nodeSiegeMultiplier(host,nodeDef.id);const strike=domain.useSiegeAsset(host,player,nodeDef.id,built.asset.id,22000);assert.equal(strike.ok,true);assert.ok(fort.gateHp<before);assert.ok(protectedMultiplier<1);assert.ok(player.official.roadToTen.warfare.damage>0);
});

test('9.23 dynamic world crosses authored thresholds into Chronicle-backed server events',()=>{
  const {domain,host}=hostAndPlayer({mapId:'ironwood'});domain.publicSnapshot(host);host.global.roadToTen.dynamicWorld.regions.ironwood.ecology=90;
  const state=domain.evaluateWorld(host,'ironwood',30000);assert.ok(state.activeEvents.length>=1);assert.ok(host.global.roadToTen.dynamicWorld.events.some(e=>e.ruleId==='beast_bloom'));assert.ok(host.global.livingRealm.chronicle.some(e=>e.type==='world'));
});

test('9.24 dungeon blueprints enforce map level and Node stage then lock a branching path',()=>{
  const {domain,host,player}=hostAndPlayer({mapId:'ironwood',level:25});host.global.livingRealm.nodes.node_ironwood.stage=3;
  const start=domain.startDungeonBlueprint(host,player,'ironroot_depths',40000);assert.equal(start.ok,true);assert.equal(start.blueprint.id,'ironroot_depths');
  assert.equal(domain.chooseDungeonPath(host,player,'roots').ok,true);assert.equal(domain.chooseDungeonPath(host,player,'fungal_halls').ok,false);const completed=domain.completeDungeonBlueprint(host,player,{gold:100},41000);assert.equal(completed.ok,true);assert.equal(player.official.roadToTen.dungeon.blueprintId,null);
});

test('9.25 quest consequence requires completion, persists one choice and changes world state',()=>{
  const {domain,host,player}=hostAndPlayer({mapId:'ironwood'});player.quests=['alpha_ironwood_01'];const before=host.global.roadToTen.dynamicWorld.regions.ironwood.ecology;
  const choice=domain.applyQuestConsequence(host,player,'ironwood_preserve',50000);assert.equal(choice.ok,true);assert.equal(player.official.roadToTen.quests.choices.alpha_ironwood_01,'preserve');assert.ok(host.global.roadToTen.dynamicWorld.regions.ironwood.ecology>before);assert.equal(domain.applyQuestConsequence(host,player,'ironwood_harvest',51000).ok,false);
});

test('9.26 housing upgrades require ownership, charge gold and add functional persistent benefits',()=>{
  const {domain,host,player}=hostAndPlayer();const before=player.gold;const out=domain.buyHousingUpgrade(host,player,'home_workshop','house_alpha',60000);assert.equal(out.ok,true);assert.equal(player.gold,before-2500);assert.ok(player.official.roadToTen.housing.upgrades.includes('home_workshop'));
  const noHouse=hostAndPlayer().player;delete noHouse.housing;assert.equal(domain.buyHousingUpgrade(host,noHouse,'home_stable',null,61000).ok,false);
});

test('Road-to-10 state round-trips through official player and global persistence boundaries',()=>{
  const p=freshPlayerState();p.roadToTen.professions.specializations.weaponsmithing='weaponsmith';p.roadToTen.housing.upgrades=['home_workshop'];p.roadToTen.politics.influence=42;const exported=exportPlayerState(p),restored=normalizePlayerState(exported);assert.equal(restored.roadToTen.professions.specializations.weaponsmithing,'weaponsmith');assert.equal(restored.roadToTen.politics.influence,42);assert.deepEqual(restored.roadToTen.housing.upgrades,['home_workshop']);
  const g=freshGlobalState();g.roadToTen.economy.regions.eldoria={priceIndex:1.2};g.roadToTen.dynamicWorld.events=[{id:'x'}];const ng=normalizeGlobalState(g);assert.equal(ng.roadToTen.economy.regions.eldoria.priceIndex,1.2);assert.equal(ng.roadToTen.dynamicWorld.events.length,1);
});

test('official action registry exposes every Road-to-10 player command exactly once',()=>{
  const expected=['profession_specialize','beast_care','beast_role','faction_treasury_donate','faction_vote','faction_diplomacy','bounty_place','siege_build','siege_use','dungeon_blueprint_start','dungeon_path','quest_consequence','housing_upgrade'];
  for(const id of expected)assert.equal(OFFICIAL_ACTION_NAMES.filter(x=>x===id).length,1,id);
});

test('ContentDB keeps legacy version 3 while seeding editable Road-to-10 catalogs behind its own marker',()=>{
  assert.equal(contentDB.data.version,3);assert.ok(Number(contentDB.data.roadToTenVersion)>=1);for(const key of ['professionSpecializations','economyPolicies','factionPrograms','siegeAssets','dynamicWorldRules','dungeonBlueprints','questConsequences','housingUpgrades'])assert.ok(contentDB.get(key).length>0,key);
});

test('Studio authors Road-to-10 catalogs and semantic validation fails closed for unsafe values',()=>{
  assert.ok(getContentStudioSchema('siegeAssets',contentDB).schema.length>0);assert.ok(getContentStudioSchema('dungeonBlueprints',contentDB).schema.length>0);
  assert.equal(validateStudioRecord('economyPolicies',{id:'bad_policy',name:'Bad',specialization:'industrial',buyMultiplier:99,sellMultiplier:1,craftDemand:1,taxEfficiency:1}),'buyMultiplier must be from 0.25 to 3');
  assert.equal(validateStudioRecord('dynamicWorldRules',{id:'bad_world',name:'Bad',metric:'ecology',threshold:50,mode:'sideways',durationMs:100000,effects:{}}),'dynamic world mode must be above or below');
});

test('9.17-9.26 UI remains modular, covers all ten releases and does not grow GameScreen',()=>{
  const director=fs.readFileSync(path.join(root,'src/components/RoadToTenDirector926.tsx'),'utf8');const player=fs.readFileSync(path.join(root,'src/components/RoadToTenPlayerPanel926.tsx'),'utf8');const editor=fs.readFileSync(path.join(root,'src/components/GameEditor.tsx'),'utf8');const screen=fs.readFileSync(path.join(root,'src/components/GameScreen.tsx'));
  for(const version of ['9.17','9.18','9.19','9.20','9.21','9.22','9.23','9.24','9.25','9.26'])assert.match(director,new RegExp(version.replace('.','\\.')));assert.match(editor,/RoadToTenDirector926/);assert.match(player,/profession_specialize/);assert.match(player,/housing_upgrade/);assert.ok(screen.length<=155000,`GameScreen bytes=${screen.length}`);assert.equal(ROAD_TO_TEN_VERSION,'9.26.1');
});
