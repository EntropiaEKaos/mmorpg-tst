from pathlib import Path

ROOT=Path('.')
def read(p): return (ROOT/p).read_text()
def write(p,s): (ROOT/p).write_text(s)
def rep(p,a,b):
 s=read(p)
 if a not in s: raise SystemExit(f'missing marker {p}: {a[:120]!r}')
 write(p,s.replace(a,b,1))

# Road domain: world categories, real housing ownership, and hooks consumed by Living Realm/runtime.
p='server/engine/RoadToTenDomain.mjs'
rep(p,"else if(k in econ)econ[k]=clamp(Number(econ[k])+Number(v),0,100,50);else if(k in dyn)dyn[k]=clamp(Number(dyn[k])+Number(v),0,100,50);", "else if(['ecology','corruption','threat','crime'].includes(k))dyn[k]=clamp(Number(dyn[k])+Number(v),0,100,50);else if(k in econ)econ[k]=clamp(Number(econ[k])+Number(v),0,100,50);else if(k in dyn)dyn[k]=clamp(Number(dyn[k])+Number(v),0,100,50);")
rep(p,"  buyHousingUpgrade(host,player,upgradeId,now=Date.now()){\n    const up=(content(host).housingUpgrades||[]).find(u=>u?.id===upgradeId),rp=ensurePlayer(host,player);if(!up||rp.housing.upgrades.includes(up.id)||rp.housing.upgrades.length>=ROAD_TO_TEN_LIMITS.housingUpgrades||player.gold<int(up.goldCost,0,100000000,0))return {ok:false,reason:'housing_upgrade'};const ownsHousing=Boolean(player?.housing?.ownedHouseId||player?.housing?.houseId||player?.housing?.owned||player?.housing?.isOwner);if(!ownsHousing)return {ok:false,reason:'house_required'};", "  buyHousingUpgrade(host,player,upgradeId,ownedHouseId=null,now=Date.now()){\n    const up=(content(host).housingUpgrades||[]).find(u=>u?.id===upgradeId),rp=ensurePlayer(host,player);if(!up||rp.housing.upgrades.includes(up.id)||rp.housing.upgrades.length>=ROAD_TO_TEN_LIMITS.housingUpgrades||player.gold<int(up.goldCost,0,100000000,0))return {ok:false,reason:'housing_upgrade'};if(!text(ownedHouseId,100))return {ok:false,reason:'house_required'};")
# add integration closure methods before publicSnapshot
marker="  publicSnapshot(host,player=null,now=Date.now()){"
s=read(p)
block='''  craftQualityBonus(host,player,now=Date.now()){
    const rp=ensurePlayer(host,player),base=this.integrationModifiers(host,player,now).craftQualityBonus;let spec=0;
    for(const id of Object.values(rp.professions.specializations||{})){const def=(content(host).professionSpecializations||[]).find(x=>x?.id===id);spec+=Number(def?.qualityBonus)||0;}
    let housing=0;for(const id of rp.housing.upgrades||[]){const up=(content(host).housingUpgrades||[]).find(x=>x?.id===id);housing+=Number(up?.benefits?.craftQuality)||0;}
    return clamp(base+spec+housing,-30,60,0);
  }
  tamingChanceBonus(host,player,now=Date.now()){
    const rp=ensurePlayer(host,player);let bonus=this.integrationModifiers(host,player,now).tamingChanceBonus;
    for(const id of rp.housing.upgrades||[]){const up=(content(host).housingUpgrades||[]).find(x=>x?.id===id);bonus+=Number(up?.benefits?.breedingBonus||0)/100;}
    const activeId=host.ensurePlayer(player)?.livingRealm?.taming?.activeId,care=rp.beastCare.animals?.[activeId];if(care)bonus+=(Number(care.happiness||60)-60)/1000;
    return clamp(bonus,-.4,.35,0);
  }
  breedingMutationBonus(host,player){const rp=ensurePlayer(host,player);let bonus=0;for(const id of rp.housing.upgrades||[]){const up=(content(host).housingUpgrades||[]).find(x=>x?.id===id);bonus+=Number(up?.benefits?.breedingBonus||0)/100;}return clamp(bonus,0,.25,0);}
  nodeSiegeMultiplier(host,nodeId){const f=fortification(host,nodeId),wall=f.wallMax?f.wallHp/f.wallMax:0,gate=f.gateMax?f.gateHp/f.gateMax:0;if(wall<=0&&gate<=0)return 1.25;if(gate<=0)return .9;if(wall<=.25)return .75;return .35;}
  spawnThreatMultiplier(host,mapId){const g=ensureGlobal(host),eventEffects=g.dynamicWorld.events.filter(e=>e?.mapId===mapId&&Number(e.expiresAt)>Date.now()).map(e=>e.effects||{});let mult=1+clamp(dynamicRegion(host,mapId).threat,0,100,35)/250;for(const fx of eventEffects)mult*=clamp(fx.spawnThreat,.5,2,1);return clamp(mult,.65,2.2,1);}
  completeDungeonBlueprint(host,player,completion,now=Date.now()){
    const rp=ensurePlayer(host,player),bp=(content(host).dungeonBlueprints||[]).find(d=>d?.id===rp.dungeon.blueprintId);if(!bp)return null;const econ=region(host,player.mapId),dyn=dynamicRegion(host,player.mapId);for(const [k,v] of Object.entries(bp.worldImpact||{})){if(['ecology','corruption','threat','crime'].includes(k))dyn[k]=clamp(Number(dyn[k])+Number(v),0,100,50);else if(k in econ)econ[k]=clamp(Number(econ[k])+Number(v),0,100,50);else if(k in dyn)dyn[k]=clamp(Number(dyn[k])+Number(v),0,100,50);}const g=ensureGlobal(host);g.dungeons.records.push({blueprintId:bp.id,player:player.name,path:rp.dungeon.path,at:now,completion:clone(completion)});g.dungeons.records=g.dungeons.records.slice(-200);livingRealmDomain.chronicle(host,'dungeon',`${player.name} cleared ${bp.name}.`,`Path: ${rp.dungeon.path||'direct'} · Boss: ${bp.boss}.`,{mapId:player.mapId,actor:player.name,severity:'major'},now);rp.dungeon={blueprintId:null,path:null,puzzle:null};return {ok:true,blueprintId:bp.id,worldImpact:clone(bp.worldImpact||{})};
  }

'''
if '  craftQualityBonus(host,player' not in s:
 i=s.find(marker)
 if i<0: raise SystemExit('publicSnapshot marker missing')
 write(p,s[:i]+block+s[i:])

# Living Realm: consume Road-to-10 modifiers in actual craft/taming/breeding/siege resolution.
p='server/engine/LivingRealmDomain.mjs'
rep(p,"const score=clamp(25+skill.level*1.8+stationQuality+factionBonus+materialQuality*.25-difficulty*.55+(roll()-.5)*16,1,100,40);", "const roadQuality=typeof host.getRoadCraftQualityBonus==='function'?Number(host.getRoadCraftQualityBonus(player))||0:0;const score=clamp(25+skill.level*1.8+stationQuality+factionBonus+roadQuality+materialQuality*.25-difficulty*.55+(roll()-.5)*16,1,100,40);")
rep(p,"const chance=clamp(.72+lr.taming.skill*.008+tamePct*.005+(-rarityIndex*.09)-int(species.temperament,0,100,50)*.002,.08,.95,.4);", "const roadTaming=typeof host.getRoadTamingChanceBonus==='function'?Number(host.getRoadTamingChanceBonus(player))||0:0;const chance=clamp(.72+lr.taming.skill*.008+tamePct*.005+roadTaming+(-rarityIndex*.09)-int(species.temperament,0,100,50)*.002,.08,.95,.4);")
rep(p,"let mutation=null;if(roll()<.08){", "const roadMutation=typeof host.getRoadBreedingMutationBonus==='function'?Number(host.getRoadBreedingMutationBonus(player))||0:0;let mutation=null;if(roll()<clamp(.08+roadMutation,.01,.35,.08)){")
rep(p,"const damage=int((30+player.level*3+(player.attack||0)*1.2)*(siegeKit?1.4:1)*(1+siegePct/100),25,7000,50);", "const roadSiege=typeof host.getRoadNodeSiegeMultiplier==='function'?Number(host.getRoadNodeSiegeMultiplier(nodeId))||1:1;const damage=int((30+player.level*3+(player.attack||0)*1.2)*(siegeKit?1.4:1)*(1+siegePct/100)*roadSiege,8,7000,50);")

# OfficialSystems: expose hooks + dungeon completion world impact + authoritative housing id handoff.
p='server/engine/OfficialSystems.mjs'
rep(p,"  onMonsterKill(player, monster) {\n    return officialRuntimeCoordinator.onMonsterKill(this, player, monster);\n  }", "  onMonsterKill(player, monster) {\n    const result=officialRuntimeCoordinator.onMonsterKill(this, player, monster);\n    if(result?.dungeonComplete) roadToTenDomain.completeDungeonBlueprint(this,player,result.dungeonComplete);\n    return result;\n  }")
rep(p,"  getRegionalMarketMultiplier(player){ return roadToTenDomain.marketMultiplier(this,player); }", "  getRegionalMarketMultiplier(player){ return roadToTenDomain.marketMultiplier(this,player); }\n  getRoadCraftQualityBonus(player){ return roadToTenDomain.craftQualityBonus(this,player); }\n  getRoadTamingChanceBonus(player){ return roadToTenDomain.tamingChanceBonus(this,player); }\n  getRoadBreedingMutationBonus(player){ return roadToTenDomain.breedingMutationBonus(this,player); }\n  getRoadNodeSiegeMultiplier(nodeId){ return roadToTenDomain.nodeSiegeMultiplier(this,nodeId); }\n  getRoadSpawnThreatMultiplier(mapId){ return roadToTenDomain.spawnThreatMultiplier(this,mapId); }")
rep(p,"  buyHousingUpgrade(player,upgradeId){ return roadToTenDomain.buyHousingUpgrade(this,player,upgradeId); }", "  buyHousingUpgrade(player,upgradeId,ownedHouseId=null){ return roadToTenDomain.buyHousingUpgrade(this,player,upgradeId,ownedHouseId); }")

# Action registry receives real authoritative house ownership from GameState context.
p='server/engine/OfficialActionRegistry.mjs'
rep(p,"  housing_upgrade: { run:(systems,player,payload)=>detailWithOk(systems.buyHousingUpgrade(player,payload.upgradeId)) },", "  housing_upgrade: { run:(systems,player,payload,ctx)=>detailWithOk(systems.buyHousingUpgrade(player,payload.upgradeId,ctx.ownedHouseId||null)) },")

# GameState: authoritative housing ownership context, dynamic spawn pressure, and content re-sync already in integration pass.
p='server/engine/GameState.mjs'
rep(p,"      nearbyMonsters: this.monstersByMap.get(player.mapId) || [],", "      nearbyMonsters: this.monstersByMap.get(player.mapId) || [],\n      ownedHouseId: housingSystem.ownedBy(player.name) || null,")
rep(p,"    monster.respawnAt = monster.noRespawn ? Number.MAX_SAFE_INTEGER : Date.now() + (monster.type === 'boss' ? 60000 : 15000);", "    const roadThreat=officialSystems.getRoadSpawnThreatMultiplier?.(player.mapId)||1;\n    monster.respawnAt = monster.noRespawn ? Number.MAX_SAFE_INTEGER : Date.now() + Math.floor((monster.type === 'boss' ? 60000 : 15000)/Math.max(.65,Math.min(2.2,roadThreat)));")

# Legacy contract updates are intentional: action surface and durable global state grew, shops now use regional index.
p='server/test/official-action-registry.test.mjs'
rep(p,"  'faction_join','faction_defect','node_donate','node_declare_war','node_attack','node_claim','craft_advanced','tame_animal','breed_animals','tame_activate',\n];", "  'faction_join','faction_defect','node_donate','node_declare_war','node_attack','node_claim','craft_advanced','tame_animal','breed_animals','tame_activate',\n  'profession_specialize','beast_care','beast_role','faction_treasury_donate','faction_vote','faction_diplomacy','bounty_place','siege_build','siege_use','dungeon_blueprint_start','dungeon_path','quest_consequence','housing_upgrade',\n];")
rep(p,"        if (['joinFaction','defectFaction','donateNode','declareNodeWar','attackNode','claimNode','advancedCraft','tameAnimal','breedAnimals','activateTamedAnimal'].includes(String(property))) return { ok:true };", "        if (['joinFaction','defectFaction','donateNode','declareNodeWar','attackNode','claimNode','advancedCraft','tameAnimal','breedAnimals','activateTamedAnimal','chooseProfessionSpecialization','careTamedAnimal','assignTamedAnimalRole','donateFactionTreasury','voteFactionLeader','setFactionDiplomacy','placeFactionBounty','buildSiegeAsset','useSiegeAsset','startDungeonBlueprint','chooseDungeonPath','applyQuestConsequence','buyHousingUpgrade'].includes(String(property))) return { ok:true };" )
rep(p,"    mailId: 'mail', targetId: 'target', waves: 3, factionId:'crown_eldoria', nodeId:'node_eldoria', parentAId:'a', parentBId:'b', animalId:'a',", "    mailId: 'mail', targetId: 'target', waves: 3, factionId:'crown_eldoria', targetFactionId:'free_league', status:'allied', nodeId:'node_eldoria', parentAId:'a', parentBId:'b', animalId:'a', specId:'weaponsmith', kind:'feed', role:'scout', candidate:'Registry Tester', targetName:'Target', reward:500, assetId:'battering_ram', builtAssetId:'asset', blueprintId:'ironroot_depths', path:'roots', consequenceId:'ironwood_preserve', upgradeId:'home_workshop',")
rep(p,"  assert.equal(sideEffects.start, 1);", "  assert.equal(sideEffects.start, 2);")

p='server/test/official-state-schema.test.mjs'
rep(p,"  assert.deepEqual(freshGlobalState(), { version: 1, auctions: [], mail: [], credits: {}, eventRewards: {}, event: null, eventSequence: 0, livingRealm: { nodes:{}, chronicle:[], sequence:0 } });", "  const global=freshGlobalState();\n  assert.equal(global.version,1);\n  assert.deepEqual(global.livingRealm,{nodes:{},chronicle:[],sequence:0});\n  assert.equal(global.roadToTen.version,'9.26.0');\n  assert.deepEqual(global.roadToTen.economy.ledger,[]);")

p='server/test/official-systems.test.mjs'
rep(p,"  assert.equal(systems.buyShop(p, 'health_potion', 1), true);\n  assert.equal(p.gold, before - 37);", "  const market=systems.getRegionalMarketMultiplier(p);\n  assert.equal(systems.buyShop(p, 'health_potion', 1), true);\n  assert.equal(p.gold, before - Math.floor(50 * (1 - 0.25) * market));")

# Road-to-10 tests: use authoritative house id and assert closure hooks.
p='server/test/road-to-ten-9-17-26.test.mjs'
rep(p,"const out=domain.buyHousingUpgrade(host,player,'home_workshop',60000);", "const out=domain.buyHousingUpgrade(host,player,'home_workshop','house_alpha',60000);")
rep(p,"delete noHouse.housing;assert.equal(domain.buyHousingUpgrade(host,noHouse,'home_stable',61000).ok,false);", "delete noHouse.housing;assert.equal(domain.buyHousingUpgrade(host,noHouse,'home_stable',null,61000).ok,false);")
# Strengthen existing tests without increasing test count.
rep(p,"const ok=domain.chooseProfessionSpecialization(host,player,'weaponsmith');assert.equal(ok.ok,true);assert.equal(ok.specialization,'weaponsmith');", "const beforeQuality=domain.craftQualityBonus(host,player);const ok=domain.chooseProfessionSpecialization(host,player,'weaponsmith');assert.equal(ok.ok,true);assert.equal(ok.specialization,'weaponsmith');assert.ok(domain.craftQualityBonus(host,player)>beforeQuality);")
rep(p,"const strike=domain.useSiegeAsset(host,player,nodeDef.id,built.asset.id,22000);assert.equal(strike.ok,true);assert.ok(fort.gateHp<before);", "const protectedMultiplier=domain.nodeSiegeMultiplier(host,nodeDef.id);const strike=domain.useSiegeAsset(host,player,nodeDef.id,built.asset.id,22000);assert.equal(strike.ok,true);assert.ok(fort.gateHp<before);assert.ok(protectedMultiplier<1);")
rep(p,"assert.equal(domain.chooseDungeonPath(host,player,'roots').ok,true);assert.equal(domain.chooseDungeonPath(host,player,'fungal_halls').ok,false);", "assert.equal(domain.chooseDungeonPath(host,player,'roots').ok,true);assert.equal(domain.chooseDungeonPath(host,player,'fungal_halls').ok,false);const completed=domain.completeDungeonBlueprint(host,player,{gold:100},41000);assert.equal(completed.ok,true);assert.equal(player.official.roadToTen.dungeon.blueprintId,null);")

print('Road to 10 runtime closure applied.')
