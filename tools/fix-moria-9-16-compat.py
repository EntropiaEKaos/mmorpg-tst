from pathlib import Path

def rep(path, old, new, count=1):
    p=Path(path); s=p.read_text()
    if old not in s: raise SystemExit(f'anchor missing {path}: {old[:140]!r}')
    p.write_text(s.replace(old,new,count))

# Keep the established ContentDB schema version at 3. Living Realm has its own
# additive migration marker so old admin stores and 9.1/9.2 contracts remain stable.
rep('server/engine/ContentDB.mjs',
"    version: 1,\n    items: [], monsters: [], npcs: [], quests: [], spells: [], maps: [],",
"    version: 1, livingRealmVersion: 0,\n    items: [], monsters: [], npcs: [], quests: [], spells: [], maps: [],")
rep('server/engine/ContentDB.mjs',
"  normalized.version = Number.isInteger(version) && version > 0 ? version : 1;\n  for (const key of COLLECTION_KEYS) {",
"  normalized.version = Number.isInteger(version) && version > 0 ? version : 1;\n  normalized.livingRealmVersion = Number.isInteger(Number(raw.livingRealmVersion)) && Number(raw.livingRealmVersion) > 0 ? Number(raw.livingRealmVersion) : 0;\n  for (const key of COLLECTION_KEYS) {")
rep('server/engine/ContentDB.mjs',
"    else { this.migrateAlphaV2(); this.migrateAlphaV3(); this.migrateLivingRealmV4(); }",
"    else { this.migrateAlphaV2(); this.migrateAlphaV3(); this.migrateLivingRealmV1(); }")
rep('server/engine/ContentDB.mjs',
"  migrateLivingRealmV4() {\n    if (Number(this.data.version) >= 4) return false;",
"  migrateLivingRealmV1() {\n    if (Number(this.data.livingRealmVersion) >= 1) return false;")
rep('server/engine/ContentDB.mjs',
"    this.data.version = 4;\n    this.save();\n    return true;\n  }\n\n  save() {",
"    this.data.livingRealmVersion = 1;\n    this.save();\n    return true;\n  }\n\n  save() {")
rep('server/engine/ContentDB.mjs',
"    this.data.tamingSpecies = mergeById(this.data.tamingSpecies, LIVING_REALM_CONTENT.tamingSpecies);\n    this.data.version = 4;\n\n    this.save();",
"    this.data.tamingSpecies = mergeById(this.data.tamingSpecies, LIVING_REALM_CONTENT.tamingSpecies);\n    this.data.version = 3;\n    this.data.livingRealmVersion = 1;\n\n    this.save();")

# Official state change is additive and backward-normalized, so preserve the v1
# durable envelope instead of forcing an unnecessary persistence migration.
rep('server/engine/OfficialStateSchema.mjs',
"export const OFFICIAL_STATE_SCHEMA_VERSION = 2;",
"export const OFFICIAL_STATE_SCHEMA_VERSION = 1;")

# Do not expand the legacy 8.4 REGIONAL_MATERIALS registry: every entry there is
# intentionally coupled to legacy gem recipes. Living Realm owns its own extra
# regional reagent source instead.
rep('server/engine/Itemization.mjs',
"  voidlands: { name: 'Void Shard', icon: '💠', value: 110 },\n  sunreach_coast: { name:'Tide Pearl', icon:'◉', value:48 },\n  ironwood: { name:'Ironbark Resin', icon:'◆', value:52 },\n  crystal_deep: { name:'Mana Crystal', icon:'◇', value:88 },\n  stormwatch_isle: { name:'Storm Core', icon:'⚡', value:96 },\n  nightfall_citadel: { name:'Night Essence', icon:'☾', value:125 },\n});",
"  voidlands: { name: 'Void Shard', icon: '💠', value: 110 },\n});")

# New crafting reagents are still genuinely obtainable: regional monster kills
# can yield the Living Realm reagent without changing the legacy registry.
rep('server/engine/LivingRealmDomain.mjs',
"const playerKey=name=>String(name||'').trim().toLocaleLowerCase('en-US').slice(0,80);\n",
"const playerKey=name=>String(name||'').trim().toLocaleLowerCase('en-US').slice(0,80);\nconst LIVING_REALM_REGIONAL_REAGENTS=Object.freeze({sunreach_coast:{name:'Tide Pearl',icon:'◉',value:48},ironwood:{name:'Ironbark Resin',icon:'◆',value:52},crystal_deep:{name:'Mana Crystal',icon:'◇',value:88},stormwatch_isle:{name:'Storm Core',icon:'⚡',value:96},nightfall_citadel:{name:'Night Essence',icon:'☾',value:125}});\n")
old="""  onMonsterKill(host,player,monster,now=Date.now()){const def=nodeAtMap(host,player.mapId);if(!def)return null;const points=monster?.type==='boss'?30:monster?.type==='elite'?8:3;const result=this.contributeNode(host,player,def.id,points,'kill',now);if(monster?.type==='boss')this.chronicle(host,'boss',`${player.name} defeated ${monster.name}.`,`A regional boss fell in ${def.name}.`,{mapId:player.mapId,nodeId:def.id,actor:player.name,severity:'major'},now);return result;}"""
new="""  onMonsterKill(host,player,monster,now=Date.now()){const def=nodeAtMap(host,player.mapId);if(!def)return null;const points=monster?.type==='boss'?30:monster?.type==='elite'?8:3;const result=this.contributeNode(host,player,def.id,points,'kill',now);const reagent=LIVING_REALM_REGIONAL_REAGENTS[player.mapId];if(reagent&&(monster?.type==='boss'||monster?.type==='elite'||Math.random()<.18)){const quantity=monster?.type==='boss'?3:monster?.type==='elite'?2:1;addInventory(player,{id:`lr_mat_${now}_${Math.random().toString(36).slice(2,8)}`,...reagent,type:'material',quantity});result.material={name:reagent.name,quantity};}if(monster?.type==='boss')this.chronicle(host,'boss',`${player.name} defeated ${monster.name}.`,`A regional boss fell in ${def.name}.`,{mapId:player.mapId,nodeId:def.id,actor:player.name,severity:'major'},now);return result;}"""
rep('server/engine/LivingRealmDomain.mjs',old,new)

# The public gateway intentionally grew by ten commands; retain the exact-list
# regression and explicitly bless every new command instead of loosening it.
rep('server/test/official-action-registry.test.mjs',
"  'mail_send','mail_read','mail_claim','mail_delete','world_event_claim','pvp_toggle','pvp_attack','dungeon_start','dungeon_abandon',\n];",
"  'mail_send','mail_read','mail_claim','mail_delete','world_event_claim','pvp_toggle','pvp_attack','dungeon_start','dungeon_abandon',\n  'faction_join','faction_defect','node_donate','node_declare_war','node_attack','node_claim','craft_advanced','tame_animal','breed_animals','tame_activate',\n];")
rep('server/test/official-action-registry.test.mjs',
"    mailId: 'mail', targetId: 'target', waves: 3,\n",
"    mailId: 'mail', targetId: 'target', waves: 3, factionId:'crown_eldoria', nodeId:'node_eldoria', parentAId:'a', parentBId:'b', animalId:'a',\n")
rep('server/test/official-action-registry.test.mjs',
"    startDungeon: () => { sideEffects.start++; }, clearDungeon: () => { sideEffects.clear++; },\n",
"    startDungeon: () => { sideEffects.start++; }, clearDungeon: () => { sideEffects.clear++; }, nearbyMonsters: [],\n")

# Keep the deterministic-state regression exact while adding the new durable field.
rep('server/test/official-state-schema.test.mjs',
"  assert.deepEqual(freshGlobalState(), { version: 1, auctions: [], mail: [], credits: {}, eventRewards: {}, event: null, eventSequence: 0 });",
"  assert.deepEqual(freshGlobalState(), { version: 1, auctions: [], mail: [], credits: {}, eventRewards: {}, event: null, eventSequence: 0, livingRealm: { nodes:{}, chronicle:[], sequence:0 } });")

# Extend our Living Realm regression with compatibility-marker and reagent-source checks.
p=Path('server/test/living-realm-9-11-16.test.mjs');s=p.read_text()
s += """
test('9.16 content persistence keeps legacy schema v3 with a separate Living Realm marker', async()=>{\n  const fsMod=await import('node:fs');const os=await import('node:os');const path=await import('node:path');const {ContentDB}=await import('../engine/ContentDB.mjs');\n  const dir=fsMod.mkdtempSync(path.join(os.tmpdir(),'moria-lr-content-'));try{const db=new ContentDB(path.join(dir,'content.json'));assert.equal(db.data.version,3);assert.equal(db.data.livingRealmVersion,1);assert.ok(db.get('nodes').length>=10);assert.ok(db.get('factions').length>=6);assert.ok(db.get('craftingRecipes').length>=8);assert.ok(db.get('tamingSpecies').length>=5)}finally{fsMod.rmSync(dir,{recursive:true,force:true})}\n});\n
test('9.16 regional Living Realm reagents do not pollute the legacy itemization contract',()=>{const d=new LivingRealmDomain(),h=host(),p=player('stormwatch_isle',50);p.x=40;p.y=22;const result=d.onMonsterKill(h,p,{name:'Stormwatch Elite',type:'elite'},500);assert.equal(result.material.name,'Storm Core');assert.ok(p.inventory.some(i=>i.name==='Storm Core'&&i.type==='material'))});\n"""
p.write_text(s)
print('Mor\'ia 9.16 compatibility contracts fixed')
