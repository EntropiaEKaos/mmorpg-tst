from pathlib import Path

def rep(path, old, new, count=1):
    p=Path(path); s=p.read_text()
    if old not in s: raise SystemExit(f'anchor missing {path}: {old[:120]!r}')
    p.write_text(s.replace(old,new,count))

# Global Living Realm state: write-behind for frequent node XP, force-save historic events.
rep('server/engine/LivingRealmDomain.mjs',
"function ensureHost(host){if(!host||typeof host.ensurePlayer!=='function'||!isRecord(host.global))throw new TypeError('LivingRealmDomain requires an OfficialSystems-compatible host.');}\n",
"function ensureHost(host){if(!host||typeof host.ensurePlayer!=='function'||!isRecord(host.global))throw new TypeError('LivingRealmDomain requires an OfficialSystems-compatible host.');}\nfunction markDirty(host){host._livingRealmDirty=true;}\nfunction flushDirty(host,now=Date.now(),force=false){if(!host._livingRealmDirty)return false;const last=Math.max(0,Number(host._livingRealmLastPersist)||0);if(!force&&now-last<5000)return false;if(typeof host.save==='function'&&!host.save())return false;host._livingRealmDirty=false;host._livingRealmLastPersist=now;return true;}\n")
rep('server/engine/LivingRealmDomain.mjs',
"    realm.chronicle.push(item);realm.chronicle=realm.chronicle.slice(-LIVING_REALM_LIMITS.chronicle);return clone(item);",
"    realm.chronicle.push(item);realm.chronicle=realm.chronicle.slice(-LIVING_REALM_LIMITS.chronicle);markDirty(host);flushDirty(host,now,true);return clone(item);")
rep('server/engine/LivingRealmDomain.mjs',
"    if(node.stage>before)this.chronicle(host,'node',`${def.name} advanced to ${node.stageName}.`,`Player activity transformed the ${def.specialization} node.`,{mapId:def.mapId,nodeId:def.id,severity:'major'},now);\n    return {ok:true,node:clone(node),kind};",
"    if(node.stage>before)this.chronicle(host,'node',`${def.name} advanced to ${node.stageName}.`,`Player activity transformed the ${def.specialization} node.`,{mapId:def.mapId,nodeId:def.id,severity:'major'},now);\n    markDirty(host);return {ok:true,node:clone(node),kind};")
rep('server/engine/LivingRealmDomain.mjs',
"  tick(host,now=Date.now()){\n    const realm=ensureRealm(host);for(const [id,node] of Object.entries(realm.nodes)){",
"  tick(host,now=Date.now()){\n    const realm=ensureRealm(host);for(const [id,node] of Object.entries(realm.nodes)){" )
rep('server/engine/LivingRealmDomain.mjs',
"Object.assign(node,normalizeNodeState(node,def));}return this.publicRealm(host);}",
"Object.assign(node,normalizeNodeState(node,def));}flushDirty(host,now,false);return this.publicRealm(host);}")

# Attack and claim must happen at the actual Node, and siege crafting/faction bonuses matter.
rep('server/engine/LivingRealmDomain.mjs',
"  attackNode(host,player,nodeId,now=Date.now()){\n    const lr=ensurePlayer(host,player),realm=ensureRealm(host),node=realm.nodes[nodeId],def=nodeDef(host,nodeId);if(!def||!node||node.status!=='siege'||lr.faction.id!==node.attackerFactionId||player.mapId!==def.mapId||now-lr.lastNodeAttackAt<LIVING_REALM_LIMITS.nodeAttackCooldownMs)return {ok:false,reason:'attack_unavailable'};\n    lr.lastNodeAttackAt=now;const damage=int(30+player.level*3+(player.attack||0)*1.2,25,5000,50);node.hp=Math.max(0,node.hp-damage);",
"  attackNode(host,player,nodeId,now=Date.now()){\n    const lr=ensurePlayer(host,player),realm=ensureRealm(host),node=realm.nodes[nodeId],def=nodeDef(host,nodeId);const px=Number(player.x),py=Number(player.y);const atNode=def&&Number.isFinite(px)&&Number.isFinite(py)&&Math.hypot(px-def.x,py-def.y)<=def.radius;if(!def||!node||!atNode||node.status!=='siege'||lr.faction.id!==node.attackerFactionId||player.mapId!==def.mapId||now-lr.lastNodeAttackAt<LIVING_REALM_LIMITS.nodeAttackCooldownMs)return {ok:false,reason:'attack_unavailable'};\n    lr.lastNodeAttackAt=now;const siegeKit=Array.isArray(player.inventory)&&player.inventory.some(i=>i?.name==='Battering Ram Kit'&&Number(i.quantity)>0);const faction=factionById(host,lr.faction.id);const siegePct=Number(faction?.bonuses?.siege)||0;const damage=int((30+player.level*3+(player.attack||0)*1.2)*(siegeKit?1.4:1)*(1+siegePct/100),25,7000,50);node.hp=Math.max(0,node.hp-damage);markDirty(host);")
rep('server/engine/LivingRealmDomain.mjs',
"  claimNeutralNode(host,player,nodeId,now=Date.now()){\n    const lr=ensurePlayer(host,player),realm=ensureRealm(host),node=realm.nodes[nodeId],def=nodeDef(host,nodeId);if(!def||!node||!lr.faction.id||node.controllerFactionId||player.mapId!==def.mapId||node.stage<1)return {ok:false,reason:'claim_unavailable'};",
"  claimNeutralNode(host,player,nodeId,now=Date.now()){\n    const lr=ensurePlayer(host,player),realm=ensureRealm(host),node=realm.nodes[nodeId],def=nodeDef(host,nodeId);const px=Number(player.x),py=Number(player.y);const atNode=def&&Number.isFinite(px)&&Number.isFinite(py)&&Math.hypot(px-def.x,py-def.y)<=def.radius;if(!def||!node||!atNode||!lr.faction.id||node.controllerFactionId||player.mapId!==def.mapId||node.stage<1)return {ok:false,reason:'claim_unavailable'};")

# Craft quality includes explicit faction craft bonus as well as industrial territorial control.
rep('server/engine/LivingRealmDomain.mjs',
"const factionBonus=node&&node.controllerFactionId===lr.faction.id&&def.specialization==='industrial'?6:0;const stationQuality=def?Math.min(20,node.stage*3):0;",
"const faction=factionById(host,lr.faction.id);const factionCraft=Number(faction?.bonuses?.craftQuality)||0;const factionBonus=(node&&node.controllerFactionId===lr.faction.id&&def.specialization==='industrial'?6:0)+factionCraft;const stationQuality=def?Math.min(20,node.stage*3):0;")

# Taming consumes/captures a matching live creature within two tiles; Wild faction improves chance.
old="""  tame(host,player,speciesId,now=Date.now(),roll=Math.random){
    const species=(catalogs(host).tamingSpecies||[]).find(s=>s?.id===speciesId),lr=ensurePlayer(host,player);if(!species||player.level<int(species.levelRequired,1,100000,1)||player.mapId!==species.mapId||lr.taming.animals.length>=LIVING_REALM_LIMITS.animals)return {ok:false,reason:'taming_requirements'};const rarityIndex=Math.max(0,TAME_RARITIES.indexOf(species.rarity));const chance=clamp(.72+lr.taming.skill*.008-player.level*0+(-rarityIndex*.09)-int(species.temperament,0,100,50)*.002,.08,.92,.4);const succeeded=roll()<=chance;"""
new="""  tame(host,player,speciesId,nearbyMonsters=[],now=Date.now(),roll=Math.random){
    const species=(catalogs(host).tamingSpecies||[]).find(s=>s?.id===speciesId),lr=ensurePlayer(host,player);const px=Number(player.x),py=Number(player.y);const target=Array.isArray(nearbyMonsters)?nearbyMonsters.find(m=>m&&!m.dead&&((m.contentSourceId&&m.contentSourceId===species?.monsterId)||slug(m.name)===slug(species?.name))&&Number.isFinite(px)&&Number.isFinite(py)&&Math.hypot(Number(m.x)-px,Number(m.y)-py)<=2.25):null;if(!species||!target||player.level<int(species.levelRequired,1,100000,1)||player.mapId!==species.mapId||lr.taming.animals.length>=LIVING_REALM_LIMITS.animals)return {ok:false,reason:'taming_requirements'};const rarityIndex=Math.max(0,TAME_RARITIES.indexOf(species.rarity));const faction=factionById(host,lr.faction.id);const tamePct=Number(faction?.bonuses?.taming)||0;const chance=clamp(.72+lr.taming.skill*.008+tamePct*.005+(-rarityIndex*.09)-int(species.temperament,0,100,50)*.002,.08,.95,.4);const succeeded=roll()<=chance;"""
rep('server/engine/LivingRealmDomain.mjs',old,new)
rep('server/engine/LivingRealmDomain.mjs',
"    const traits={};for(const [key,val] of Object.entries(species.baseTraits||{}))traits[key]=int(Number(val)+(roll()-.5)*12,1,100,50);",
"    target.dead=true;target.hp=0;target.respawnAt=now+30000;const traits={};for(const [key,val] of Object.entries(species.baseTraits||{}))traits[key]=int(Number(val)+(roll()-.5)*12,1,100,50);")
rep('server/engine/LivingRealmDomain.mjs',
"  onMonsterKill(host,player,monster,now=Date.now()){const def=nodeAtMap(host,player.mapId);if(!def)return null;const points=monster?.type==='boss'?30:monster?.type==='elite'?8:3;return this.contributeNode(host,player,def.id,points,'kill',now);}",
"  onMonsterKill(host,player,monster,now=Date.now()){const def=nodeAtMap(host,player.mapId);if(!def)return null;const points=monster?.type==='boss'?30:monster?.type==='elite'?8:3;const result=this.contributeNode(host,player,def.id,points,'kill',now);if(monster?.type==='boss')this.chronicle(host,'boss',`${player.name} defeated ${monster.name}.`,`A regional boss fell in ${def.name}.`,{mapId:player.mapId,nodeId:def.id,actor:player.name,severity:'major'},now);return result;}")

# Official action path supplies authoritative live monsters to taming domain.
rep('server/engine/OfficialSystems.mjs',
"  tameAnimal(player,speciesId){ return livingRealmDomain.tame(this,player,speciesId); }",
"  tameAnimal(player,speciesId,nearbyMonsters=[]){ return livingRealmDomain.tame(this,player,speciesId,nearbyMonsters); }")
rep('server/engine/OfficialActionRegistry.mjs',
"  tame_animal: { run:(systems,player,payload)=>detailWithOk(systems.tameAnimal(player,payload.speciesId)) },",
"  tame_animal: { run:(systems,player,payload,ctx)=>detailWithOk(systems.tameAnimal(player,payload.speciesId,ctx.nearbyMonsters||[])) },")
rep('server/engine/GameState.mjs',
"      contentShops: contentDB.get('shops'),\n      getPlayer: id => this.players.get(id),",
"      contentShops: contentDB.get('shops'),\n      nearbyMonsters: this.monstersByMap.get(player.mapId) || [],\n      getPlayer: id => this.players.get(id),")

# Feed the grand craft chain from existing gathering/loot systems without breaking legacy materials.
rep('server/engine/Itemization.mjs',
"  voidlands: { name: 'Void Shard', icon: '💠', value: 110 },\n});",
"  voidlands: { name: 'Void Shard', icon: '💠', value: 110 },\n  sunreach_coast: { name:'Tide Pearl', icon:'◉', value:48 },\n  ironwood: { name:'Ironbark Resin', icon:'◆', value:52 },\n  crystal_deep: { name:'Mana Crystal', icon:'◇', value:88 },\n  stormwatch_isle: { name:'Storm Core', icon:'⚡', value:96 },\n  nightfall_citadel: { name:'Night Essence', icon:'☾', value:125 },\n});")
rep('server/engine/Items.mjs',
"  const equipChance = monster.type === 'boss' ? 0.8 : monster.type === 'elite' ? 0.3 : 0.04;",
"  const beastLike=/wolf|stag|boar|bear|hound|raven|stalker/i.test(String(monster?.name||''));\n  if(beastLike && Math.random()<0.30) drops.push({id:`hide_${Date.now()}_${Math.random()}`,name:'Beast Hide',icon:'◩',quantity:monster.type==='boss'?3:monster.type==='elite'?2:1,value:24,type:'material'});\n\n  const equipChance = monster.type === 'boss' ? 0.8 : monster.type === 'elite' ? 0.3 : 0.04;")

# Cross-catalog Content Studio integrity for the new editable catalogs.
ref_insert="""
  if (type === 'nodes') {
    const mapId=typeof record.mapId==='string'?record.mapId.trim():'';
    if(!hasMap(contentDB,mapId)) return `Node references unknown map: ${mapId || '(empty)'}`;
  }
  if (type === 'factions') {
    const mapId=typeof record.hqMapId==='string'?record.hqMapId.trim():'';
    if(mapId&&!hasMap(contentDB,mapId)) return `Faction references unknown HQ map: ${mapId}`;
    for(const enemy of Array.isArray(record.enemies)?record.enemies:[]){if(enemy===record.id)return 'Faction cannot list itself as an enemy';if(!contentDB.get('factions').some(f=>f.id===enemy))return `Faction references unknown enemy: ${enemy}`;}
  }
  if (type === 'tamingSpecies') {
    const mapId=typeof record.mapId==='string'?record.mapId.trim():'';
    if(!hasMap(contentDB,mapId)) return `Taming species references unknown map: ${mapId || '(empty)'}`;
    if(!contentDB.get('monsters').some(m=>m.id===record.monsterId)) return `Taming species references unknown monster: ${record.monsterId || '(empty)'}`;
  }
  if (type === 'craftingRecipes') {
    const materialNames=new Set(contentDB.get('materials').map(m=>m.name));
    for(const input of Array.isArray(record.inputs)?record.inputs:[]){if(!input?.name||!Number.isFinite(Number(input.quantity))||Number(input.quantity)<=0)return 'Crafting input must have a positive quantity';if(!materialNames.has(input.name)&&input.name!=='Dragon Scale')return `Crafting recipe references unknown material: ${input.name}`;}
  }
"""
rep('server/engine/ContentIntegrity.mjs',"  if (type === 'quests') {\n",ref_insert+"\n  if (type === 'quests') {\n")
rep('server/engine/ContentIntegrity.mjs',
"const AUDIT_TYPES = Object.freeze(['items', 'monsters', 'npcs', 'spells', 'quests', 'maps', 'events', 'shops', 'lootTables', 'gmRoster', 'taskQuests', 'houses', 'housingDecor', 'outfits', 'mounts']);",
"const AUDIT_TYPES = Object.freeze(['items', 'monsters', 'npcs', 'spells', 'quests', 'maps', 'events', 'shops', 'lootTables', 'gmRoster', 'taskQuests', 'houses', 'housingDecor', 'outfits', 'mounts', 'nodes', 'factions', 'materials', 'craftingRecipes', 'tamingSpecies']);")

# Player-facing Living Realm is part of the Character panel, outside GameScreen monolith.
rep('src/components/CharacterPanel.tsx',"import { T as Tooltip } from './Tooltip';\n","import { T as Tooltip } from './Tooltip';\nimport LivingRealmPlayerPanel916 from './LivingRealmPlayerPanel916';\n")
rep('src/components/CharacterPanel.tsx',
"        </div>\n      </div>\n    </div>\n  );\n}\n\nfunction Bar",
"        </div>\n        <LivingRealmPlayerPanel916 player={player} official={official} />\n      </div>\n    </div>\n  );\n}\n\nfunction Bar")

# Update regression tests to use real tameable monster + proximity and canonical species ID.
p=Path('server/test/living-realm-9-11-16.test.mjs'); s=p.read_text()
s=s.replace("return {name:'Tester',level,mapId,gold:100000,attack:60,inventory:[],official:freshPlayerState()}","return {name:'Tester',level,mapId,x:40,y:40,gold:100000,attack:60,inventory:[],official:freshPlayerState()}")
s=s.replace("const a=d.tame(h,p,'wild_wolf',100,()=>0.01);const b=d.tame(h,p,'wild_wolf',200,()=>0.01);","const nearA={contentSourceId:'ironwood_timber_wolf',name:'Timber Wolf',x:41,y:40,dead:false,hp:100};const nearB={contentSourceId:'ironwood_timber_wolf',name:'Timber Wolf',x:40,y:41,dead:false,hp:100};const a=d.tame(h,p,'timber_wolf',[nearA],100,()=>0.01);const b=d.tame(h,p,'timber_wolf',[nearB],200,()=>0.01);")
s=s.replace("assert.equal(a.ok,true);assert.equal(b.ok,true);const child", "assert.equal(a.ok,true);assert.equal(b.ok,true);assert.equal(nearA.dead,true);const child")
p.write_text(s)

print('Mor\'ia 9.11-9.16 hardening applied')
