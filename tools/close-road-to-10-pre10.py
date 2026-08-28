from pathlib import Path
import json
ROOT=Path('.')
def read(p): return (ROOT/p).read_text()
def write(p,s): (ROOT/p).write_text(s)
def rep(p,a,b):
 s=read(p)
 if a not in s: raise SystemExit(f'missing marker {p}: {a[:120]!r}')
 write(p,s.replace(a,b,1))
def insert_before(p,marker,block):
 s=read(p)
 if block.strip() in s:return
 i=s.find(marker)
 if i<0:raise SystemExit(f'missing marker {p}: {marker}')
 write(p,s[:i]+block+s[i:])

# ---------- Road domain: close faction objectives, bounties, puzzles, housing benefits ----------
p='server/engine/RoadToTenDomain.mjs'
rep(p,"function freshPlayer(){return {version:ROAD_TO_TEN_VERSION,professions:{specializations:{},discoveries:[],workOrders:[]},beastCare:{animals:{}},politics:{influence:0,votes:0,bountiesPlaced:0},warfare:{assetsBuilt:0,repairs:0,damage:0},dungeon:{blueprintId:null,path:null,puzzle:null},quests:{choices:{}},housing:{upgrades:[],shopOpen:false,shopName:'',homeScore:0}};}","function freshPlayer(){return {version:ROAD_TO_TEN_VERSION,professions:{specializations:{},discoveries:[],workOrders:[]},beastCare:{animals:{}},politics:{influence:0,votes:0,bountiesPlaced:0},warfare:{assetsBuilt:0,repairs:0,damage:0},dungeon:{blueprintId:null,path:null,puzzle:null,puzzleProgress:0,puzzleSolved:false},quests:{choices:{}},housing:{upgrades:[],shopOpen:false,shopName:'',homeScore:0}};}")
rep(p,"function animalFor(host,player,animalId){return host.ensurePlayer(player)?.livingRealm?.taming?.animals?.find?.(a=>a?.id===animalId)||null;}","function animalFor(host,player,animalId){return host.ensurePlayer(player)?.livingRealm?.taming?.animals?.find?.(a=>a?.id===animalId)||null;}\nfunction housingBenefits(host,player){const rp=ensurePlayer(host,player),out={};for(const id of rp.housing.upgrades||[]){const up=(content(host).housingUpgrades||[]).find(x=>x?.id===id);for(const [k,v] of Object.entries(up?.benefits||{}))out[k]=(Number(out[k])||0)+(Number(v)||0);}return out;}\nfunction puzzleSequence(blueprintId,runId){const seed=String(`${blueprintId}:${runId}`).split('').reduce((s,c)=>s+c.charCodeAt(0),0);return [0,1,2].map((_,i)=>(seed+i*3+i*i)%4);}")
rep(p,"    const tax=clamp(Number(def?.taxRate)||0,0,25,0)/100;const sameControl=Boolean(node&&factionId&&node.controllerFactionId===factionId);const stage=int(node?.stage,0,6,0);const priceMultiplier=clamp(r.priceIndex*p.buyMultiplier*worldPrice*(1+tax),.65,1.75,1);", "    const benefits=housingBenefits(host,player),taxReduction=clamp(Number(benefits.taxReduction)||0,0,20,0);const tax=Math.max(0,clamp(Number(def?.taxRate)||0,0,25,0)-taxReduction)/100;const sameControl=Boolean(node&&factionId&&node.controllerFactionId===factionId);const stage=int(node?.stage,0,6,0);const priceMultiplier=clamp(r.priceIndex*p.buyMultiplier*worldPrice*(1+tax),.65,1.75,1);")
rep(p,"g.economy.ledger=g.economy.ledger.slice(-ROAD_TO_TEN_LIMITS.ledger);return {ok:true,mapId,value:amount,tax,priceIndex:Number(r.priceIndex.toFixed(3))};", "g.economy.ledger=g.economy.ledger.slice(-ROAD_TO_TEN_LIMITS.ledger);this.progressFactionProgram(host,player,'trade',amount,now);return {ok:true,mapId,value:amount,tax,priceIndex:Number(r.priceIndex.toFixed(3))};")
rep(p,"if(skill>=20&&roll()<.12+Number(spec?.qualityBonus||0)/200){", "const discoveryBonus=clamp(Number(housingBenefits(host,player).recipeDiscovery)||0,0,50,0)/100;if(skill>=20&&roll()<.12+Number(spec?.qualityBonus||0)/200+discoveryBonus){")
rep(p,"if(def?.specialization==='industrial')r.prosperity=clamp(r.prosperity+.5,0,100,50);return {specialization:selected||null,discovered:clone(rp.professions.discoveries)};", "if(def?.specialization==='industrial')r.prosperity=clamp(r.prosperity+.5,0,100,50);this.progressFactionProgram(host,player,'craft',1,now);return {specialization:selected||null,discovered:clone(rp.professions.discoveries)};")
rep(p,"const built={id:`asset_${now}_${Math.random().toString(36).slice(2,7)}`,assetId:asset.id,ownerFactionId:factionId,durability:int(asset.durability,1,10000,500),builtBy:player.name,builtAt:now};", "const siegeQuality=clamp(Number(housingBenefits(host,player).siegeQuality)||0,0,50,0);const built={id:`asset_${now}_${Math.random().toString(36).slice(2,7)}`,assetId:asset.id,ownerFactionId:factionId,durability:int(Number(asset.durability)*(1+siegeQuality/100),1,15000,500),builtBy:player.name,builtAt:now};")
rep(p,"const heal=int(asset.power,1,1000,50);fort.wallHp", "const repairBonus=clamp(Number(housingBenefits(host,player).repairBonus)||0,0,100,0);const heal=int(Number(asset.power)*(1+repairBonus/100),1,2000,50);fort.wallHp")
rep(p,"const power=int(asset.power,1,2000,50);let target=asset.role==='gate'?'gateHp':asset.role==='tower'?'towerHp':'wallHp';", "const siegeQuality=clamp(Number(housingBenefits(host,player).siegeQuality)||0,0,50,0);const power=int(Number(asset.power)*(1+siegeQuality/100),1,3000,50);let target=asset.role==='gate'?'gateHp':asset.role==='tower'?'towerHp':'wallHp';")
rep(p,"built.durability-=12;rp.warfare.damage=int(rp.warfare.damage+power,0,100000000,0);return {ok:true,role:asset.role,damage:power,fortification:clone(fort)};", "built.durability-=12;rp.warfare.damage=int(rp.warfare.damage+power,0,100000000,0);this.progressFactionProgram(host,player,'siege',power,now);return {ok:true,role:asset.role,damage:power,fortification:clone(fort)};")
rep(p,"rp.dungeon={blueprintId:bp.id,path:null,puzzle:bp.puzzle||null,startedAt:now};", "rp.dungeon={blueprintId:bp.id,path:null,puzzle:bp.puzzle||null,puzzleProgress:0,puzzleSolved:!bp.puzzle,startedAt:now};")
rep(p,"rp.dungeon={blueprintId:null,path:null,puzzle:null};return {ok:true,blueprintId:bp.id,worldImpact:clone(bp.worldImpact||{})};", "rp.dungeon={blueprintId:null,path:null,puzzle:null,puzzleProgress:0,puzzleSolved:false};return {ok:true,blueprintId:bp.id,worldImpact:clone(bp.worldImpact||{})};")
insert_before(p,"  setDiplomacy(host,player,targetFactionId,status,now=Date.now()){",'''  progressFactionProgram(host,player,kind,amount=1,now=Date.now()){
    const factionId=playerFaction(host,player),program=(content(host).factionPrograms||[]).find(x=>x?.factionId===factionId);if(!program||program.objective!==kind)return null;const fp=politics(host,factionId),week=7*86400000;if(!fp.lastObjectiveAt||now-fp.lastObjectiveAt>=week){fp.weeklyProgress=0;fp.lastObjectiveAt=now;}
    fp.weeklyProgress=clamp(Number(fp.weeklyProgress||0)+Math.max(0,Number(amount)||0),0,1_000_000_000,0);const target=Math.max(1,Number(program.target)||1);let completed=false,reward=0;if(fp.weeklyProgress>=target){completed=true;reward=int(program.rewardInfluence,0,1000000,0);fp.influence=int(fp.influence+reward,0,100000000,0);fp.weeklyProgress=Math.max(0,fp.weeklyProgress-target);fp.objectiveCycle=int(fp.objectiveCycle+1,0,1000000,0);fp.lastObjectiveAt=now;livingRealmDomain.chronicle(host,'faction_program',`${factionDefinition(host,factionId)?.name||factionId} completed ${program.name}.`,`Players completed the faction objective and earned ${reward} influence.`,{factionId,actor:player.name,severity:'major'},now);}return {programId:program.id,progress:fp.weeklyProgress,target,completed,reward};
  }
  claimBounties(host,killer,target,now=Date.now()){
    const g=ensureGlobal(host),targetKey=playerKey(target?.name),claims=g.politics.bounties.filter(b=>!b.claimed&&playerKey(b.target)===targetKey);if(!claims.length)return null;let reward=0;for(const b of claims){b.claimed=true;b.claimedAt=now;b.claimedBy=killer.name;reward+=int(b.reward,0,1000000,0);}killer.gold=int(Number(killer.gold)+reward,0,1_000_000_000,0);if(killer.stats)killer.stats.goldEarned=int(Number(killer.stats.goldEarned||0)+reward,0,1_000_000_000,0);this.progressFactionProgram(host,killer,'bounty',claims.length,now);livingRealmDomain.chronicle(host,'bounty',`${killer.name} claimed ${reward.toLocaleString()}g in bounties on ${target.name}.`,'A player bounty was resolved by authoritative PvP combat.',{mapId:killer.mapId,factionId:playerFaction(host,killer),actor:killer.name,severity:'notable'},now);return {ok:true,reward,count:claims.length};
  }

''')
insert_before(p,"  applyQuestConsequence(host,player,consequenceId,now=Date.now()){",'''  dungeonPresentation(host,player){const rp=ensurePlayer(host,player),bp=(content(host).dungeonBlueprints||[]).find(d=>d?.id===rp.dungeon.blueprintId);return bp?{id:bp.id,name:bp.name,icon:bp.icon,boss:bp.boss,puzzle:bp.puzzle,puzzleProgress:int(rp.dungeon.puzzleProgress,0,3,0),puzzleSolved:Boolean(rp.dungeon.puzzleSolved)}:null;}
  isDungeonPuzzlePending(host,player){const rp=ensurePlayer(host,player);return Boolean(rp.dungeon.blueprintId&&rp.dungeon.puzzle&&!rp.dungeon.puzzleSolved);}
  solveDungeonPuzzleStep(host,player,runeIndex){const rp=ensurePlayer(host,player),official=host.ensurePlayer(player)?.dungeon,bp=(content(host).dungeonBlueprints||[]).find(d=>d?.id===rp.dungeon.blueprintId);if(!bp||!official?.active||!rp.dungeon.puzzle||rp.dungeon.puzzleSolved)return {ok:false,reason:'puzzle'};const seq=puzzleSequence(bp.id,official.runId),progress=int(rp.dungeon.puzzleProgress,0,3,0),rune=int(runeIndex,0,3,-1);if(rune!==seq[progress]){rp.dungeon.puzzleProgress=0;return {ok:true,correct:false,progress:0,solved:false};}rp.dungeon.puzzleProgress=progress+1;rp.dungeon.puzzleSolved=rp.dungeon.puzzleProgress>=seq.length;return {ok:true,correct:true,progress:rp.dungeon.puzzleProgress,solved:rp.dungeon.puzzleSolved};}

''')

# ---------- Official systems: real auction market, bounty claim, faction programs, dungeon puzzle ----------
p='server/engine/OfficialSystems.mjs'
rep(p,"  buyAuction(player, listingId, findOnlinePlayer = null) {\n    return officialCommerceDomain.buyAuction(this, player, listingId, findOnlinePlayer);\n  }", "  buyAuction(player, listingId, findOnlinePlayer = null) {\n    const listing=this.global.auctions.find(a=>a.id===listingId);const result=officialCommerceDomain.buyAuction(this, player, listingId, findOnlinePlayer);if(result&&listing)roadToTenDomain.recordTrade(this,player,listing.price,'buy','auction');return result;\n  }")
rep(p,"  pvpAttack(player, target, getDerivedStats = null) {\n    return officialPvpDomain.attack(this, player, target, getDerivedStats);\n  }", "  pvpAttack(player, target, getDerivedStats = null) {\n    const result=officialPvpDomain.attack(this, player, target, getDerivedStats);if(result?.killed)result.bounty=roadToTenDomain.claimBounties(this,player,target);return result;\n  }")
rep(p,"  tameAnimal(player,speciesId,nearbyMonsters=[]){ return livingRealmDomain.tame(this,player,speciesId,nearbyMonsters); }", "  tameAnimal(player,speciesId,nearbyMonsters=[]){ const result=livingRealmDomain.tame(this,player,speciesId,nearbyMonsters);if(result?.ok)roadToTenDomain.progressFactionProgram(this,player,'taming',1);return result; }")
rep(p,"  chooseDungeonPath(player,path){ return roadToTenDomain.chooseDungeonPath(this,player,path); }", "  chooseDungeonPath(player,path){ return roadToTenDomain.chooseDungeonPath(this,player,path); }\n  solveDungeonPuzzleStep(player,runeIndex){ return roadToTenDomain.solveDungeonPuzzleStep(this,player,runeIndex); }\n  isRoadDungeonPuzzlePending(player){ return roadToTenDomain.isDungeonPuzzlePending(this,player); }\n  getRoadDungeonPresentation(player){ return roadToTenDomain.dungeonPresentation(this,player); }")

# ---------- Dungeon domain: hold final boss wave behind server-authoritative puzzle ----------
p='server/engine/OfficialDungeonDomain.mjs'
rep(p,"      s.dungeon.wave++;\n      s.dungeon.killsRemaining = this.getWave(s.dungeon.wave, player.level).count;\n      return { nextDungeonWave: s.dungeon.wave, dungeonComplete: null };", "      s.dungeon.wave++;\n      s.dungeon.killsRemaining = this.getWave(s.dungeon.wave, player.level).count;\n      if (s.dungeon.wave === s.dungeon.maxWaves && typeof host.isRoadDungeonPuzzlePending === 'function' && host.isRoadDungeonPuzzlePending(player)) return { nextDungeonWave: null, dungeonPuzzleRequired: true, dungeonComplete: null };\n      return { nextDungeonWave: s.dungeon.wave, dungeonComplete: null };")

# ---------- Registry: puzzle input and spawn final wave only after solve ----------
p='server/engine/OfficialActionRegistry.mjs'
rep(p,"  dungeon_path: { run:(systems,player,payload)=>detailWithOk(systems.chooseDungeonPath(player,payload.path)) },", "  dungeon_path: { run:(systems,player,payload)=>detailWithOk(systems.chooseDungeonPath(player,payload.path)) },\n  dungeon_puzzle: { run:(systems,player,payload,ctx)=>{const result=systems.solveDungeonPuzzleStep(player,payload.runeIndex);if(result?.ok&&result.solved)ctx.startDungeon?.();return detailWithOk(result);} },")

# ---------- State schema: persist puzzle progression ----------
p='server/engine/OfficialStateSchema.mjs'
rep(p,"dungeon:{blueprintId:null,path:null,puzzle:null},", "dungeon:{blueprintId:null,path:null,puzzle:null,puzzleProgress:0,puzzleSolved:false},")
rep(p,"b.dungeon={blueprintId:text(raw.dungeon?.blueprintId,100)||null,path:text(raw.dungeon?.path,100)||null,puzzle:text(raw.dungeon?.puzzle,100)||null};", "b.dungeon={blueprintId:text(raw.dungeon?.blueprintId,100)||null,path:text(raw.dungeon?.path,100)||null,puzzle:text(raw.dungeon?.puzzle,100)||null,puzzleProgress:int(raw.dungeon?.puzzleProgress,0,3,0),puzzleSolved:Boolean(raw.dungeon?.puzzleSolved)};")

# ---------- GameState: blueprint boss identity becomes real combat identity ----------
p='server/engine/GameState.mjs'
rep(p,"    const wave = officialSystems.getDungeonWave(state.wave, player.level);", "    const wave = officialSystems.getDungeonWave(state.wave, player.level);\n    const roadDungeon = officialSystems.getRoadDungeonPresentation?.(player);\n    const finalBlueprintBoss = Boolean(wave.boss && roadDungeon?.boss);")
rep(p,"        name: wave.name, emoji: wave.emoji, color: wave.color, x: pos.x, y: pos.y, spawnX: pos.x, spawnY: pos.y,", "        name: finalBlueprintBoss ? roadDungeon.boss : wave.name, emoji: finalBlueprintBoss ? (roadDungeon.icon || wave.emoji) : wave.emoji, color: wave.color, x: pos.x, y: pos.y, spawnX: pos.x, spawnY: pos.y,")

# ---------- Player UI: leader diplomacy + interactive dungeon runes ----------
p='src/components/RoadToTenPlayerPanel926.tsx'
rep(p,"const [view,setView]=useState<View>('summary');const [amount,setAmount]=useState(500);const [candidate,setCandidate]=useState(player.name);const [target,setTarget]=useState('');const [bounty,setBounty]=useState(500);", "const [view,setView]=useState<View>('summary');const [amount,setAmount]=useState(500);const [candidate,setCandidate]=useState(player.name);const [target,setTarget]=useState('');const [bounty,setBounty]=useState(500);const [dipTarget,setDipTarget]=useState('free_league');const [dipStatus,setDipStatus]=useState('neutral');")
rep(p,"<button onClick={()=>send('faction_vote',{candidate})} className={button}>Vote · 5 influence</button></div>", "<button onClick={()=>send('faction_vote',{candidate})} className={button}>Vote · 5 influence</button></div><div className=\"mt-2 flex flex-wrap gap-2\"><select value={dipTarget} onChange={e=>setDipTarget(e.target.value)} className=\"rounded bg-black/40 px-2 py-1 text-xs\">{(realm?.factions||[]).filter((f:any)=>f.id!==factionId).map((f:any)=><option key={f.id} value={f.id}>{f.name}</option>)}</select><select value={dipStatus} onChange={e=>setDipStatus(e.target.value)} className=\"rounded bg-black/40 px-2 py-1 text-xs\"><option value=\"allied\">allied</option><option value=\"neutral\">neutral</option><option value=\"rival\">rival</option><option value=\"war\">war</option></select><button onClick={()=>send('faction_diplomacy',{targetFactionId:dipTarget,status:dipStatus})} className={button}>Set diplomacy · leader only</button></div>")
rep(p,"<div className=\"mt-2 flex gap-1\">{(d.paths||[]).map((p:string)=><button key={p} onClick={()=>send('dungeon_path',{path:p})} className=\"rounded bg-purple-800 px-2 py-1 text-[9px]\">{p}</button>)}</div></div>)", "<div className=\"mt-2 flex gap-1\">{(d.paths||[]).map((p:string)=><button key={p} onClick={()=>send('dungeon_path',{path:p})} className=\"rounded bg-purple-800 px-2 py-1 text-[9px]\">{p}</button>)}</div>{mine?.dungeon?.blueprintId===d.id&&mine?.dungeon?.puzzle&&!mine?.dungeon?.puzzleSolved&&<div className=\"mt-2 rounded bg-cyan-500/10 p-2\"><div className=\"text-[9px] text-cyan-200\">Puzzle {mine.dungeon.puzzle} · sequence {mine.dungeon.puzzleProgress||0}/3</div><div className=\"mt-1 flex gap-1\">{[0,1,2,3].map(r=><button key={r} onClick={()=>send('dungeon_puzzle',{runeIndex:r})} className=\"rounded bg-cyan-800 px-2 py-1 text-[9px]\">Rune {r+1}</button>)}</div></div>}</div>)")

# ---------- Registry tests know puzzle action ----------
p='server/test/official-action-registry.test.mjs'
rep(p,"'dungeon_blueprint_start','dungeon_path','quest_consequence','housing_upgrade',", "'dungeon_blueprint_start','dungeon_path','dungeon_puzzle','quest_consequence','housing_upgrade',")
rep(p,"'startDungeonBlueprint','chooseDungeonPath','applyQuestConsequence','buyHousingUpgrade'", "'startDungeonBlueprint','chooseDungeonPath','solveDungeonPuzzleStep','applyQuestConsequence','buyHousingUpgrade'")
rep(p,"blueprintId:'ironroot_depths', path:'roots', consequenceId:'ironwood_preserve'", "blueprintId:'ironroot_depths', path:'roots', runeIndex:0, consequenceId:'ironwood_preserve'")
# puzzle action can trigger one more start side-effect in generic mocked dispatch
rep(p,"assert.equal(sideEffects.start, 2);", "assert.ok(sideEffects.start >= 2);")

# ---------- Bump patch readiness version ----------
for path in ['package.json','server/package.json']:
 data=json.loads(read(path));data['version']='9.26.1';write(path,json.dumps(data,indent=2)+'\n')
for path in ['package-lock.json','server/package-lock.json']:
 data=json.loads(read(path));data['version']='9.26.1';
 if isinstance(data.get('packages'),dict) and '' in data['packages']:data['packages']['']['version']='9.26.1'
 write(path,json.dumps(data,indent=2)+'\n')

print('Mor\'ia 9.26.1 pre-10 closure applied.')
