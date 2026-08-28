from pathlib import Path

ROOT=Path('.')

def write(path,text):
    p=ROOT/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text,encoding='utf-8')

def replace_once(path,old,new,label):
    p=ROOT/path;text=p.read_text(encoding='utf-8')
    if new in text:return
    if old not in text:raise SystemExit(f'{label} anchor missing in {path}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')

grand=r'''// ===================================================================
// MOR'IA 9.42 — GRAND CRYSTAL DEEP AUTHORITATIVE CONTENT CONTRACT
// A subterranean geode capital: circular chambers are carved into bedrock
// and joined by narrow galleries. Migration remains exact-default-only.
// ===================================================================

export const GRAND_CRYSTAL_DEEP_VERSION=1;
export const GRAND_CAPITAL_SCHEMA_VERSION=8;

function clone(value){return JSON.parse(JSON.stringify(value));}
function samePoint(record,x,y,xKey='posX',yKey='posY'){return Number(record?.[xKey])===x&&Number(record?.[yKey])===y;}
function knownPair(x,y,pairs){return pairs.some(pair=>Number(x)===pair[0]&&Number(y)===pair[1]);}

const districts=Object.freeze([
  {id:'crystaldeep_central_geode',name:'Geodo Central',icon:'💠',x:80,y:80,radius:17,color:'#74e1ff'},
  {id:'crystaldeep_prism_conclave_ward',name:'Conclave Prismático',icon:'◇',x:80,y:74,radius:11,color:'#9be7ff'},
  {id:'crystaldeep_north_shaft',name:'Poço Norte',icon:'△',x:80,y:34,radius:11,color:'#8cccf4'},
  {id:'crystaldeep_shardsmith_ward',name:'Câmara dos Lapidários',icon:'⚒',x:48,y:48,radius:12,color:'#73badb'},
  {id:'crystaldeep_echo_gallery',name:'Galeria dos Ecos',icon:'◈',x:40,y:84,radius:12,color:'#8b8ed8'},
  {id:'crystaldeep_resonance_ward',name:'Câmara da Ressonância',icon:'✦',x:112,y:48,radius:12,color:'#a887ea'},
  {id:'crystaldeep_east_lift_ward',name:'Elevador do Leste',icon:'▷',x:120,y:84,radius:12,color:'#6eb8db'},
  {id:'crystaldeep_delver_ward',name:'Bairro dos Escavadores',icon:'⛏',x:52,y:118,radius:13,color:'#759fc5'},
  {id:'crystaldeep_faceted_ward',name:'Santuário Facetado',icon:'◆',x:108,y:118,radius:13,color:'#a277d4'},
  {id:'crystaldeep_lower_gallery',name:'Galeria Inferior',icon:'▽',x:80,y:126,radius:10,color:'#7391bd'},
  {id:'crystaldeep_west_lift_ward',name:'Elevador do Oeste',icon:'◁',x:28,y:84,radius:9,color:'#62b4d5'},
  {id:'crystaldeep_crystal_archive_ward',name:'Arquivo das Facetas',icon:'▤',x:112,y:42,radius:9,color:'#9480cc'},
]);

const landmarks=Object.freeze([
  {id:'crystaldeep_prism_conclave',name:'Conclave Prismático',kind:'keep',icon:'💠',x:72,y:72,w:16,h:12},
  {id:'crystaldeep_resonance_exchange',name:'Bolsa da Ressonância',kind:'market',icon:'⚖',x:60,y:80,w:10,h:8},
  {id:'crystaldeep_deep_depot',name:'Depósito Profundo',kind:'depot',icon:'▣',x:92,y:80,w:10,h:8},
  {id:'crystaldeep_crystal_spire',name:'Agulha de Cristal',kind:'tower',icon:'♦',x:75,y:28,w:10,h:9},
  {id:'crystaldeep_echo_archive',name:'Arquivo dos Ecos',kind:'library',icon:'▤',x:72,y:39,w:16,h:8},
  {id:'crystaldeep_shardsmith_foundry',name:'Forja dos Lapidários',kind:'forge',icon:'⚒',x:36,y:42,w:12,h:10},
  {id:'crystaldeep_delvers_guild',name:'Guilda dos Escavadores',kind:'lodge',icon:'⛏',x:50,y:46,w:10,h:8},
  {id:'crystaldeep_resonance_shrine',name:'Santuário da Ressonância',kind:'temple',icon:'✦',x:100,y:42,w:12,h:10},
  {id:'crystaldeep_facet_academy',name:'Academia das Facetas',kind:'library',icon:'◇',x:114,y:46,w:10,h:8},
  {id:'crystaldeep_west_lift_gate',name:'Elevador do Oeste',kind:'gate',icon:'◁',x:20,y:78,w:8,h:12},
  {id:'crystaldeep_geode_market',name:'Mercado do Geodo',kind:'market',icon:'⚖',x:34,y:78,w:12,h:10},
  {id:'crystaldeep_east_lift_gate',name:'Elevador do Leste',kind:'gate',icon:'▷',x:132,y:78,w:8,h:12},
  {id:'crystaldeep_stormwatch_exchange',name:'Entreposto de Stormwatch',kind:'market',icon:'⚡',x:114,y:76,w:12,h:10},
  {id:'crystaldeep_delver_barracks',name:'Quartel dos Escavadores',kind:'tower',icon:'🛡',x:40,y:110,w:12,h:10},
  {id:'crystaldeep_shard_arena',name:'Arena dos Fragmentos',kind:'arena',icon:'⚔',x:54,y:116,w:12,h:10},
  {id:'crystaldeep_faceted_sanctum',name:'Santuário Facetado',kind:'temple',icon:'◆',x:96,y:110,w:12,h:10},
  {id:'crystaldeep_crystal_conservatory',name:'Conservatório Cristalino',kind:'library',icon:'♢',x:110,y:116,w:12,h:10},
  {id:'crystaldeep_north_shaft_gate',name:'Portão do Poço Norte',kind:'gate',icon:'△',x:72,y:20,w:16,h:7},
  {id:'crystaldeep_south_shaft_gate',name:'Portão da Descida Sul',kind:'gate',icon:'▽',x:72,y:132,w:16,h:7},
  {id:'crystaldeep_prismatic_observatory',name:'Observatório Prismático',kind:'tower',icon:'◉',x:112,y:88,w:10,h:8},
]);

export const GRAND_CRYSTAL_DEEP_MINOR_ARCHITECTURE=Object.freeze([
  {id:'crystaldeep_home_01',name:'Oficina de Facetas I',kind:'house',icon:'⌂',x:74,y:86,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_02',name:'Oficina de Facetas II',kind:'house',icon:'⌂',x:84,y:84,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_03',name:'Casa do Geodo I',kind:'house',icon:'⌂',x:76,y:66,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_04',name:'Casa do Poço I',kind:'house',icon:'⌂',x:68,y:32,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_05',name:'Casa do Poço II',kind:'house',icon:'⌂',x:86,y:32,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_06',name:'Lapidário Oeste I',kind:'house',icon:'⌂',x:50,y:38,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_07',name:'Lapidário Oeste II',kind:'house',icon:'⌂',x:42,y:54,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_08',name:'Lapidário Oeste III',kind:'house',icon:'⌂',x:50,y:54,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_09',name:'Resonador Leste I',kind:'house',icon:'⌂',x:114,y:38,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_10',name:'Resonador Leste II',kind:'house',icon:'⌂',x:106,y:54,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_11',name:'Resonador Leste III',kind:'house',icon:'⌂',x:114,y:54,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_12',name:'Casa do Elevador Oeste I',kind:'house',icon:'⌂',x:28,y:82,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_13',name:'Casa do Elevador Oeste II',kind:'house',icon:'⌂',x:46,y:82,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_14',name:'Casa dos Ecos',kind:'house',icon:'⌂',x:34,y:90,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_15',name:'Casa do Elevador Leste I',kind:'house',icon:'⌂',x:108,y:82,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_16',name:'Casa do Elevador Leste II',kind:'house',icon:'⌂',x:126,y:82,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_17',name:'Casa Prismática Leste',kind:'house',icon:'⌂',x:122,y:90,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_18',name:'Alojamento dos Escavadores I',kind:'house',icon:'⌂',x:54,y:108,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_19',name:'Alojamento dos Escavadores II',kind:'house',icon:'⌂',x:46,y:124,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_20',name:'Alojamento dos Escavadores III',kind:'house',icon:'⌂',x:54,y:126,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_21',name:'Casa Facetada I',kind:'house',icon:'⌂',x:110,y:108,w:6,h:5,showOnMinimap:false},
  {id:'crystaldeep_home_22',name:'Casa Facetada II',kind:'house',icon:'⌂',x:102,y:124,w:6,h:5,showOnMinimap:false},
]);

function buildProps(){
  const props=[];let serial=1;const add=(kind,x,y,color='#74e1ff',label)=>props.push({id:`crystaldeep_prop_${serial++}`,kind,x,y,color,...(label?{label}:{})});
  for(const [cx,cy,r] of [[80,80,17],[80,34,11],[48,48,12],[112,48,12],[40,84,12],[120,84,12],[52,118,13],[108,118,13]])for(let angle=0;angle<360;angle+=45){const rad=angle*Math.PI/180;add('crystal',Math.round(cx+Math.cos(rad)*r),Math.round(cy+Math.sin(rad)*r),angle%90===0?'#9beaff':'#8a79e6');}
  for(const [x,y] of [[80,52],[64,68],[96,68],[62,104],[98,104],[80,124],[30,84],[130,84],[48,64],[112,64]])add('rune',x,y,'#9e8cff');
  for(const [x,y] of [[70,92],[90,92],[58,76],[102,76],[80,58],[80,112]])add('lamp',x,y,'#a9f1ff');
  for(const [x,y,label] of [[80,70,'Conclave Prismático'],[48,36,'Forja dos Lapidários'],[112,36,'Santuário da Ressonância'],[40,74,'Mercado do Geodo'],[120,72,'Entreposto de Stormwatch'],[52,106,'Escavadores'],[108,106,'Santuário Facetado']])add('sign',x,y,'#82d8f2',label);
  for(const [x,y,label] of [[80,92,'Primeiro Geodo'],[68,80,'Mestre Oryn'],[94,80,'Faceta Ancestral']])add('statue',x,y,'#9dc5e8',label);
  return props.slice(0,180);
}

export const GRAND_CRYSTAL_DEEP_MAP=Object.freeze({
  id:'crystal_deep',name:'Crystal Deep',biome:'shadow',
  description:'Capital subterrânea escavada em um geodo colossal: câmaras circulares, galerias estreitas, elevadores e santuários cristalinos conectam os povos das profundezas.',
  width:160,height:160,settlementClass:'capital',urbanPlan:'geode-chambers',urbanBounds:{x:18,y:18,width:124,height:124},
  levelRequired:36,seed:7777,spawnX:80,spawnY:124,townX:80,townY:80,townRange:18,
  cityStyle:'crystal',cityAccent:'#74e1ff',roofColor:'#443d72',wallColor:'#8582a5',roadColor:'#56536e',residentialRingEnabled:false,residentialRingDensity:0,
  districts,landmarks:Object.freeze([...landmarks,...GRAND_CRYSTAL_DEEP_MINOR_ARCHITECTURE]),props:Object.freeze(buildProps()),access:'public',
  portals:Object.freeze([
    {x:80,y:141,targetMap:'frostpeak',targetX:80,targetY:20,label:'❄ Ascensão de Frostpeak'},
    {x:18,y:84,targetMap:'shadowfen',targetX:138,targetY:82,label:'🍄 Galeria de Shadowfen'},
    {x:141,y:84,targetMap:'stormwatch_isle',targetX:10,targetY:40,label:'⚡ Elevador de Stormwatch'},
  ]),
});

export const GRAND_CRYSTAL_DEEP_BUILTIN_WORLD_CONFIG=Object.freeze({
  ...GRAND_CRYSTAL_DEEP_MAP,
  spawnPoint:{x:GRAND_CRYSTAL_DEEP_MAP.spawnX,y:GRAND_CRYSTAL_DEEP_MAP.spawnY},townCenter:{x:GRAND_CRYSTAL_DEEP_MAP.townX,y:GRAND_CRYSTAL_DEEP_MAP.townY},
  portals:GRAND_CRYSTAL_DEEP_MAP.portals.filter(portal=>portal.targetMap==='frostpeak'||portal.targetMap==='shadowfen').map(portal=>({pos:{x:portal.x,y:portal.y},targetMap:portal.targetMap,targetSpawn:{x:portal.targetX,y:portal.targetY},label:portal.label})),
});

export const GRAND_CRYSTAL_DEEP_NPC_MOVES=Object.freeze({
  quest_crystal_deep:{from:[38,60],to:[80,96]},merchant_crystal_deep:{from:[42,60],to:[68,88]},warden_crystal_deep:{from:[40,62],to:[130,92]},
});
export const GRAND_CRYSTAL_DEEP_MONSTER_MOVES=Object.freeze({
  crystal_deep_shardling:{from:[18,20],to:[12,118]},crystal_deep_cave_lurker:{from:[26,27],to:[16,54]},crystal_deep_resonant_bat:{from:[34,34],to:[146,118]},crystal_deep_crystal_sentinel:{from:[42,41],to:[146,48]},crystal_deep_prismatic_horror:{from:[50,48],to:[48,150]},crystal_deep_the_faceted_one:{from:[58,55],to:[112,150]},
});
function patchExactPosition(record,move,xKey='posX',yKey='posY'){if(!move||!samePoint(record,move.from[0],move.from[1],xKey,yKey))return false;record[xKey]=move.to[0];record[yKey]=move.to[1];return true;}
function patchPortalTarget(portal,target){if('targetX'in portal||!portal.targetSpawn){portal.targetX=target[0];portal.targetY=target[1];}else portal.targetSpawn={...portal.targetSpawn,x:target[0],y:target[1]};}
function legacyPortalSet(portals){return Array.isArray(portals)&&portals.length===3&&['frostpeak','shadowfen','stormwatch_isle'].every(target=>portals.some(portal=>portal?.targetMap===target));}
function patchMap(map){
  const width=map.width===undefined?80:Number(map.width),height=map.height===undefined?80:Number(map.height);const spawnX=Number(map.spawnX??40),spawnY=Number(map.spawnY??60),townX=Number(map.townX??40),townY=Number(map.townY??60);
  if(width!==80||height!==80||spawnX!==40||spawnY!==60||townX!==40||townY!==60)return false;
  let changed=false;const set=(key,value)=>{if(JSON.stringify(map[key])!==JSON.stringify(value)){map[key]=clone(value);changed=true;}};
  set('width',160);set('height',160);set('settlementClass','capital');set('urbanPlan','geode-chambers');set('urbanBounds',GRAND_CRYSTAL_DEEP_MAP.urbanBounds);set('spawnX',80);set('spawnY',124);set('townX',80);set('townY',80);set('townRange',18);
  if(map.levelRequired===undefined||[36].includes(Number(map.levelRequired)))set('levelRequired',36);if(!map.cityStyle||map.cityStyle==='crystal')set('cityStyle','crystal');
  if(!map.cityAccent)set('cityAccent',GRAND_CRYSTAL_DEEP_MAP.cityAccent);if(!map.roofColor)set('roofColor',GRAND_CRYSTAL_DEEP_MAP.roofColor);if(!map.wallColor)set('wallColor',GRAND_CRYSTAL_DEEP_MAP.wallColor);if(!map.roadColor)set('roadColor',GRAND_CRYSTAL_DEEP_MAP.roadColor);
  if(!Array.isArray(map.districts)||map.districts.length===0)set('districts',GRAND_CRYSTAL_DEEP_MAP.districts);if(!Array.isArray(map.landmarks)||map.landmarks.length===0)set('landmarks',GRAND_CRYSTAL_DEEP_MAP.landmarks);if(!Array.isArray(map.props)||map.props.length===0)set('props',GRAND_CRYSTAL_DEEP_MAP.props);
  if(map.residentialRingEnabled===undefined||map.residentialRingEnabled===true)set('residentialRingEnabled',false);if(map.residentialRingDensity===undefined||Number(map.residentialRingDensity)<=5)set('residentialRingDensity',0);if(!Array.isArray(map.portals)||map.portals.length===0||legacyPortalSet(map.portals))set('portals',GRAND_CRYSTAL_DEEP_MAP.portals);return changed;
}
export function migrateGrandCrystalDeepData(data){
  if(!data||typeof data!=='object'||Array.isArray(data))return false;const maps=Array.isArray(data.maps)?data.maps:[];const crystal=maps.find(map=>map?.id==='crystal_deep');if(!crystal)return false;let changed=patchMap(crystal);
  const grand=Number(crystal.width)===160&&Number(crystal.height)===160&&crystal.settlementClass==='capital'&&crystal.urbanPlan==='geode-chambers';if(!changed&&!grand)return false;
  const incoming=[['frostpeak',[[40,70]],[80,138]],['shadowfen',[[10,40]],[22,84]],['stormwatch_isle',[[70,40]],[138,84]]];
  for(const [mapId,legacyTargets,target]of incoming){const map=maps.find(entry=>entry?.id===mapId);for(const portal of Array.isArray(map?.portals)?map.portals:[]){const tx=portal.targetX??portal.targetSpawn?.x,ty=portal.targetY??portal.targetSpawn?.y;if(portal?.targetMap==='crystal_deep'&&knownPair(tx,ty,legacyTargets)){patchPortalTarget(portal,target);changed=true;}}}
  for(const npc of Array.isArray(data.npcs)?data.npcs:[])if(npc?.mapId==='crystal_deep'&&patchExactPosition(npc,GRAND_CRYSTAL_DEEP_NPC_MOVES[npc.id]))changed=true;
  for(const monster of Array.isArray(data.monsters)?data.monsters:[])if(monster?.mapId==='crystal_deep'&&patchExactPosition(monster,GRAND_CRYSTAL_DEEP_MONSTER_MOVES[monster.id]))changed=true;
  for(const node of Array.isArray(data.nodes)?data.nodes:[])if(node?.id==='node_crystal_deep'&&node?.mapId==='crystal_deep'&&samePoint(node,40,60,'x','y')){node.x=62;node.y=104;changed=true;}
  return changed;
}
'''
write('server/engine/GrandCrystalDeep.mjs',grand)

replace_once('server/engine/AlphaContent.mjs',"import { GRAND_EMBERHOLD_MAP } from './GrandEmberhold.mjs';","import { GRAND_EMBERHOLD_MAP } from './GrandEmberhold.mjs';\nimport { GRAND_CRYSTAL_DEEP_MAP } from './GrandCrystalDeep.mjs';",'Crystal Deep Alpha import')
replace_once('server/engine/AlphaContent.mjs',"  if (region.id === 'emberhold') return { ...GRAND_EMBERHOLD_MAP, portals: GRAND_EMBERHOLD_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_EMBERHOLD_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_EMBERHOLD_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_EMBERHOLD_MAP.props.map(entry => ({ ...entry })) };","  if (region.id === 'emberhold') return { ...GRAND_EMBERHOLD_MAP, portals: GRAND_EMBERHOLD_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_EMBERHOLD_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_EMBERHOLD_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_EMBERHOLD_MAP.props.map(entry => ({ ...entry })) };\n  if (region.id === 'crystal_deep') return { ...GRAND_CRYSTAL_DEEP_MAP, portals: GRAND_CRYSTAL_DEEP_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_CRYSTAL_DEEP_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_CRYSTAL_DEEP_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_CRYSTAL_DEEP_MAP.props.map(entry => ({ ...entry })) };",'Crystal Deep Alpha selection')

replace_once('server/engine/World.mjs',"import { GRAND_EMBERHOLD_BUILTIN_WORLD_CONFIG } from './GrandEmberhold.mjs';","import { GRAND_EMBERHOLD_BUILTIN_WORLD_CONFIG } from './GrandEmberhold.mjs';\nimport { GRAND_CRYSTAL_DEEP_BUILTIN_WORLD_CONFIG } from './GrandCrystalDeep.mjs';",'Crystal Deep World import')
replace_once('server/engine/World.mjs',"const URBAN_PLANS = new Set(['royal-grid','harbor-crescent','forest-rings','terraced-bastion','marsh-wards','caldera-radials']);","const URBAN_PLANS = new Set(['royal-grid','harbor-crescent','forest-rings','terraced-bastion','marsh-wards','caldera-radials','geode-chambers']);",'Crystal Deep urban plan')
replace_once('server/engine/World.mjs',"  emberhold: GRAND_EMBERHOLD_BUILTIN_WORLD_CONFIG,\n  voidlands:","  emberhold: GRAND_EMBERHOLD_BUILTIN_WORLD_CONFIG,\n  crystal_deep: GRAND_CRYSTAL_DEEP_BUILTIN_WORLD_CONFIG,\n  voidlands:",'Crystal Deep built-in map')
server_algo=r'''

function nearGeodeGallery(x,y,ax,ay,bx,by,width=2.2){
  const vx=bx-ax,vy=by-ay,wx=x-ax,wy=y-ay,length=vx*vx+vy*vy;const t=length?Math.max(0,Math.min(1,(wx*vx+wy*vy)/length)):0;const px=ax+t*vx,py=ay+t*vy;return (x-px)*(x-px)+(y-py)*(y-py)<=width*width;
}
function geodeChambersTile(config,x,y){
  const bounds=config.urbanBounds;if(!bounds)return null;const minX=Number(bounds.x),minY=Number(bounds.y),maxX=minX+Number(bounds.width)-1,maxY=minY+Number(bounds.height)-1;if(x<minX||x>maxX||y<minY||y>maxY)return null;
  const gate=((x===minX||x===maxX)&&Math.abs(y-84)<=2)||((y===minY||y===maxY)&&Math.abs(x-80)<=2);if(gate)return {type:'path',walkable:true,blocksSight:false};if(x===minX||x===maxX||y===minY||y===maxY)return {type:'wall',walkable:false,blocksSight:true};
  const chambers=[[80,80,18],[80,34,13],[48,48,14],[112,48,14],[40,84,14],[120,84,14],[52,118,15],[108,118,15]];
  const galleries=[[80,18,80,34],[80,141,80,126],[18,84,40,84],[141,84,120,84],[80,34,48,48],[80,34,112,48],[48,48,40,84],[112,48,120,84],[40,84,80,80],[120,84,80,80],[80,80,52,118],[80,80,108,118],[52,118,80,141],[108,118,80,141],[80,34,80,80]];
  const gallery=galleries.some(segment=>nearGeodeGallery(x,y,...segment));if(gallery)return {type:'path',walkable:true,blocksSight:false};const chamber=chambers.some(([cx,cy,r])=>(x-cx)*(x-cx)+(y-cy)*(y-cy)<=r*r);if(chamber)return {type:'floor',walkable:true,blocksSight:false};return {type:'wall',walkable:false,blocksSight:true};
}
'''
replace_once('server/engine/World.mjs',"\nfunction capitalUrbanTile(config, x, y) {",server_algo+"\nfunction capitalUrbanTile(config, x, y) {",'Crystal Deep server topology')
replace_once('server/engine/World.mjs',"  if (config.urbanPlan === 'caldera-radials') return calderaRadialsTile(config, x, y);","  if (config.urbanPlan === 'caldera-radials') return calderaRadialsTile(config, x, y);\n  if (config.urbanPlan === 'geode-chambers') return geodeChambersTile(config, x, y);",'Crystal Deep server dispatch')

replace_once('src/game/maps.ts',"export type UrbanPlan = 'royal-grid' | 'harbor-crescent' | 'forest-rings' | 'terraced-bastion' | 'marsh-wards' | 'caldera-radials';","export type UrbanPlan = 'royal-grid' | 'harbor-crescent' | 'forest-rings' | 'terraced-bastion' | 'marsh-wards' | 'caldera-radials' | 'geode-chambers';",'Crystal Deep client plan type')
oldplan="function urbanPlanOf(value: unknown, mapId = ''): UrbanPlan { const fallback: UrbanPlan = mapId === 'sunreach_coast' ? 'harbor-crescent' : mapId === 'ironwood' ? 'forest-rings' : mapId === 'frostpeak' ? 'terraced-bastion' : mapId === 'shadowfen' ? 'marsh-wards' : mapId === 'emberhold' ? 'caldera-radials' : 'royal-grid'; const requested = String(value || fallback); return requested === 'harbor-crescent' || requested === 'forest-rings' || requested === 'terraced-bastion' || requested === 'marsh-wards' || requested === 'caldera-radials' ? requested : 'royal-grid'; }"
newplan="function urbanPlanOf(value: unknown, mapId = ''): UrbanPlan { const fallback: UrbanPlan = mapId === 'sunreach_coast' ? 'harbor-crescent' : mapId === 'ironwood' ? 'forest-rings' : mapId === 'frostpeak' ? 'terraced-bastion' : mapId === 'shadowfen' ? 'marsh-wards' : mapId === 'emberhold' ? 'caldera-radials' : mapId === 'crystal_deep' ? 'geode-chambers' : 'royal-grid'; const requested = String(value || fallback); return requested === 'harbor-crescent' || requested === 'forest-rings' || requested === 'terraced-bastion' || requested === 'marsh-wards' || requested === 'caldera-radials' || requested === 'geode-chambers' ? requested : 'royal-grid'; }"
replace_once('src/game/maps.ts',oldplan,newplan,'Crystal Deep client plan normalization')
client_algo=r'''

function nearGeodeGallery(x:number,y:number,ax:number,ay:number,bx:number,by:number,width=2.2){const vx=bx-ax,vy=by-ay,wx=x-ax,wy=y-ay,length=vx*vx+vy*vy;const t=length?Math.max(0,Math.min(1,(wx*vx+wy*vy)/length)):0;const px=ax+t*vx,py=ay+t*vy;return (x-px)*(x-px)+(y-py)*(y-py)<=width*width;}
function geodeChambersTile(map:GameMap,x:number,y:number):Tile|null{
  const bounds=map.urbanBounds;if(!bounds)return null;const minX=bounds.x,minY=bounds.y,maxX=minX+bounds.width-1,maxY=minY+bounds.height-1;if(x<minX||x>maxX||y<minY||y>maxY)return null;
  const gate=((x===minX||x===maxX)&&Math.abs(y-84)<=2)||((y===minY||y===maxY)&&Math.abs(x-80)<=2);if(gate)return {type:'path',walkable:true,blocksSight:false};if(x===minX||x===maxX||y===minY||y===maxY)return {type:'wall',walkable:false,blocksSight:true};
  const chambers=[[80,80,18],[80,34,13],[48,48,14],[112,48,14],[40,84,14],[120,84,14],[52,118,15],[108,118,15]];const galleries=[[80,18,80,34],[80,141,80,126],[18,84,40,84],[141,84,120,84],[80,34,48,48],[80,34,112,48],[48,48,40,84],[112,48,120,84],[40,84,80,80],[120,84,80,80],[80,80,52,118],[80,80,108,118],[52,118,80,141],[108,118,80,141],[80,34,80,80]];
  if(galleries.some(segment=>nearGeodeGallery(x,y,...segment as [number,number,number,number])))return {type:'path',walkable:true,blocksSight:false};if(chambers.some(([cx,cy,r])=>(x-cx)*(x-cx)+(y-cy)*(y-cy)<=r*r))return {type:'floor',walkable:true,blocksSight:false};return {type:'wall',walkable:false,blocksSight:true};
}
'''
replace_once('src/game/maps.ts',"\nfunction capitalUrbanTile(map: GameMap, x: number, y: number): Tile | null {",client_algo+"\nfunction capitalUrbanTile(map: GameMap, x: number, y: number): Tile | null {",'Crystal Deep client topology')
replace_once('src/game/maps.ts',"  if (map.urbanPlan === 'caldera-radials') return calderaRadialsTile(map, x, y);","  if (map.urbanPlan === 'caldera-radials') return calderaRadialsTile(map, x, y);\n  if (map.urbanPlan === 'geode-chambers') return geodeChambersTile(map, x, y);",'Crystal Deep client dispatch')
replace_once('src/game/maps.ts',"      const variant: Tile['variant'] = biome === 'swamp' && (type === 'water' || type === 'grass' || type === 'bridge') ? 'swamp' : undefined;","      const inCrystalUrban = mapData.urbanPlan === 'geode-chambers' && mapData.urbanBounds && x >= mapData.urbanBounds.x && x < mapData.urbanBounds.x + mapData.urbanBounds.width && y >= mapData.urbanBounds.y && y < mapData.urbanBounds.y + mapData.urbanBounds.height;\n      const variant: Tile['variant'] = inCrystalUrban && (type === 'wall' || type === 'floor' || type === 'path') ? 'crystal' : biome === 'swamp' && (type === 'water' || type === 'grass' || type === 'bridge') ? 'swamp' : undefined;",'Crystal Deep client tile variant')

replace_once('src/game/types.ts',"  variant?: 'swamp';","  variant?: 'swamp' | 'crystal';",'Crystal Deep tile variant type')

crystal_caches=r'''

  tileCache.set(`wall_crystal_${size}`, createTileCanvas((ctx,s)=>{
    ctx.imageSmoothingEnabled=false;ctx.fillStyle='#17182b';ctx.fillRect(0,0,s,s);const px=Math.max(1,Math.round(s/32));
    for(let i=0;i<18;i++){const x=Math.floor(hash(i,201)*s/px)*px,y=Math.floor(hash(i,211)*s/px)*px;ctx.fillStyle=['#242743','#30335a','#433d70','#2b4664'][Math.floor(hash(i,223)*4)];ctx.fillRect(x,y,px*(hash(i,227)>.6?2:1),px*(hash(i,229)>.72?2:1));}
    for(let i=0;i<4;i++){const x=s*(.18+i*.21),h=s*(.18+hash(i,233)*.32);ctx.fillStyle=i%2?'#5f65a5':'#4da6bd';ctx.fillRect(x,s-h,Math.max(px,s*.05),h);ctx.fillStyle='rgba(164,241,255,.38)';ctx.fillRect(x,s-h,px,Math.max(px,h*.35));}
  },size));
  tileCache.set(`floor_crystal_${size}`, createTileCanvas((ctx,s)=>{
    ctx.imageSmoothingEnabled=false;ctx.fillStyle='#343753';ctx.fillRect(0,0,s,s);const px=Math.max(1,Math.round(s/32));for(let i=0;i<22;i++){const x=Math.floor(hash(i,239)*s/px)*px,y=Math.floor(hash(i,241)*s/px)*px;ctx.fillStyle=hash(i,251)>.72?'rgba(126,222,241,.34)':'rgba(152,133,221,.20)';ctx.fillRect(x,y,px,px);}ctx.fillStyle='rgba(183,238,255,.12)';ctx.fillRect(0,0,s,px);
  },size));
  tileCache.set(`path_crystal_${size}`, createTileCanvas((ctx,s)=>{
    ctx.imageSmoothingEnabled=false;ctx.fillStyle='#424762';ctx.fillRect(0,0,s,s);const px=Math.max(1,Math.round(s/32));ctx.fillStyle='#65718c';ctx.fillRect(0,s*.28,s,s*.44);ctx.fillStyle='rgba(116,225,255,.34)';ctx.fillRect(0,s*.46,s,Math.max(px,s*.05));for(let i=0;i<5;i++){const x=Math.floor(hash(i,257)*s);ctx.fillStyle='rgba(166,143,238,.28)';ctx.fillRect(x,0,px,s);}
  },size));
'''
replace_once('src/game/render.ts',"\n  tileCache.set(`water_${size}`, createTileCanvas((ctx, s) => {",crystal_caches+"\n  tileCache.set(`water_${size}`, createTileCanvas((ctx, s) => {",'Crystal Deep renderer caches')

replace_once('src/components/WorldMiniMap.tsx',"const TILE_COLORS: Partial<Record<TileType, string>> = {","const CRYSTAL_TILE_COLORS: Partial<Record<TileType,string>> = { wall:'#17182b', floor:'#4d5277', path:'#6ca9c7' };\nconst TILE_COLORS: Partial<Record<TileType, string>> = {",'Crystal Deep minimap colors')
replace_once('src/components/WorldMiniMap.tsx',"        nextTiles.push({ x, y, color: tile ? (TILE_COLORS[tile.type] || fallback) : fallback });","        nextTiles.push({ x, y, color: tile ? (tile.variant === 'crystal' ? (CRYSTAL_TILE_COLORS[tile.type] || TILE_COLORS[tile.type] || fallback) : (TILE_COLORS[tile.type] || fallback)) : fallback });",'Crystal Deep minimap variant dispatch')

replace_once('server/engine/ContentDB.mjs',"import { GRAND_CAPITAL_SCHEMA_VERSION, migrateGrandEmberholdData } from './GrandEmberhold.mjs';","import { migrateGrandEmberholdData } from './GrandEmberhold.mjs';\nimport { GRAND_CAPITAL_SCHEMA_VERSION, migrateGrandCrystalDeepData } from './GrandCrystalDeep.mjs';",'Crystal Deep ContentDB import')
replace_once('server/engine/ContentDB.mjs',"    // Every capital migration is idempotent and exact-default-only. Schema 7 adds Emberhold.","    // Every capital migration is idempotent and exact-default-only. Schema 8 adds Crystal Deep.",'Crystal Deep ContentDB comment')
replace_once('server/engine/ContentDB.mjs',"    migrateGrandEmberholdData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;","    migrateGrandEmberholdData(this.data);\n    migrateGrandCrystalDeepData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;",'Crystal Deep loaded chain')
replace_once('server/engine/ContentDB.mjs',"    migrateGrandEmberholdData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;\n\n    this.save();","    migrateGrandEmberholdData(this.data);\n    migrateGrandCrystalDeepData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;\n\n    this.save();",'Crystal Deep fresh chain')

replace_once('server/engine/GrandFrostpeak.mjs',"{x:80,y:18,targetMap:'crystal_deep',targetX:40,targetY:70,label:'💎 Descida do Cristal'}","{x:80,y:18,targetMap:'crystal_deep',targetX:80,targetY:138,label:'💎 Descida do Cristal'}",'Frostpeak Crystal arrival')
replace_once('server/engine/GrandFrostpeak.mjs',"portal.targetMap==='eldoria'||portal.targetMap==='emberhold'||portal.targetMap==='ironwood'","portal.targetMap==='eldoria'||portal.targetMap==='emberhold'||portal.targetMap==='ironwood'||portal.targetMap==='crystal_deep'",'Frostpeak built-in Crystal route')
replace_once('server/engine/GrandShadowfen.mjs',"{x:141,y:82,targetMap:'crystal_deep',targetX:10,targetY:40,label:'💎 Sumidouro de Cristal'}","{x:141,y:82,targetMap:'crystal_deep',targetX:22,targetY:84,label:'💎 Sumidouro de Cristal'}",'Shadowfen Crystal arrival')
replace_once('server/engine/GrandShadowfen.mjs',"portal.targetMap==='eldoria'||portal.targetMap==='voidlands'","portal.targetMap==='eldoria'||portal.targetMap==='voidlands'||portal.targetMap==='crystal_deep'",'Shadowfen built-in Crystal route')
replace_once('server/test/grand-emberhold-9-41.test.mjs',"assert.equal(data.grandCapitalVersion,7);const map=data.maps.find(entry=>entry.id==='emberhold');","assert.ok(data.grandCapitalVersion>=7);const map=data.maps.find(entry=>entry.id==='emberhold');",'9.41 historical schema compatibility')

focused=r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { GRAND_CRYSTAL_DEEP_MAP, GRAND_CAPITAL_SCHEMA_VERSION, migrateGrandCrystalDeepData } from '../engine/GrandCrystalDeep.mjs';
import { MAP_CONFIG, URBAN_PLANS, WorldManager } from '../engine/World.mjs';
import { ContentDB } from '../engine/ContentDB.mjs';
import { getContentStudioSchema, validateStudioRecord } from '../engine/ContentStudio.mjs';
const clone=value=>JSON.parse(JSON.stringify(value));
function legacyData(){return{maps:[
{id:'crystal_deep',width:80,height:80,spawnX:40,spawnY:60,townX:40,townY:60,townRange:8,levelRequired:36,cityStyle:'crystal',portals:[{x:40,y:75,targetMap:'frostpeak',targetX:40,targetY:12},{x:8,y:40,targetMap:'shadowfen',targetX:68,targetY:40},{x:72,y:40,targetMap:'stormwatch_isle',targetX:10,targetY:40}]},
{id:'frostpeak',portals:[{x:80,y:18,targetMap:'crystal_deep',targetX:40,targetY:70}]},{id:'shadowfen',portals:[{x:141,y:82,targetMap:'crystal_deep',targetX:10,targetY:40}]},{id:'stormwatch_isle',portals:[{x:8,y:40,targetMap:'crystal_deep',targetX:70,targetY:40}]},],npcs:[{id:'quest_crystal_deep',mapId:'crystal_deep',posX:38,posY:60},{id:'merchant_crystal_deep',mapId:'crystal_deep',posX:42,posY:60},{id:'warden_crystal_deep',mapId:'crystal_deep',posX:40,posY:62}],monsters:[{id:'crystal_deep_shardling',mapId:'crystal_deep',posX:18,posY:20},{id:'crystal_deep_cave_lurker',mapId:'crystal_deep',posX:26,posY:27},{id:'crystal_deep_resonant_bat',mapId:'crystal_deep',posX:34,posY:34},{id:'crystal_deep_crystal_sentinel',mapId:'crystal_deep',posX:42,posY:41},{id:'crystal_deep_prismatic_horror',mapId:'crystal_deep',posX:50,posY:48},{id:'crystal_deep_the_faceted_one',mapId:'crystal_deep',posX:58,posY:55}],nodes:[{id:'node_crystal_deep',mapId:'crystal_deep',x:40,y:60}]};}

test('9.42A Grand Crystal Deep is a 160x160 geode-chambers capital',()=>{assert.equal(GRAND_CAPITAL_SCHEMA_VERSION,8);assert.equal(GRAND_CRYSTAL_DEEP_MAP.width,160);assert.equal(GRAND_CRYSTAL_DEEP_MAP.height,160);assert.equal(GRAND_CRYSTAL_DEEP_MAP.settlementClass,'capital');assert.equal(GRAND_CRYSTAL_DEEP_MAP.urbanPlan,'geode-chambers');assert.equal(GRAND_CRYSTAL_DEEP_MAP.levelRequired,36);assert.equal(GRAND_CRYSTAL_DEEP_MAP.districts.length,12);assert.equal(GRAND_CRYSTAL_DEEP_MAP.landmarks.length,42);assert.ok(GRAND_CRYSTAL_DEEP_MAP.props.length>=70);assert.equal(MAP_CONFIG.crystal_deep.width,160);assert.ok(URBAN_PLANS.has('geode-chambers'));});

test('9.42A cave topology is mostly bedrock with real chambers galleries and four shaft accesses',()=>{const map=new WorldManager().getMap('crystal_deep');let walls=0,floors=0,paths=0;for(let y=18;y<=141;y++)for(let x=18;x<=141;x++){const t=map.tiles[y][x].type;if(t==='wall')walls++;else if(t==='floor')floors++;else if(t==='path')paths++;}assert.ok(walls>11000,`walls=${walls}`);assert.ok(floors>2200,`floors=${floors}`);assert.ok(paths>1000,`paths=${paths}`);for(const [x,y]of [[80,18],[80,141],[18,84],[141,84]]){assert.equal(map.tiles[y][x].type,'path');assert.equal(map.tiles[y][x].walkable,true);}assert.equal(map.tiles[60][48].type,'floor');assert.equal(map.tiles[104][62].type,'path');assert.equal(map.tiles[20][20].type,'wall');});

test('9.42A exact legacy migration moves Crystal Deep defaults and all three inbound routes',()=>{const data=legacyData();assert.equal(migrateGrandCrystalDeepData(data),true);const map=data.maps[0];assert.deepEqual([map.width,map.height,map.spawnX,map.spawnY,map.townX,map.townY],[160,160,80,124,80,80]);assert.equal(map.urbanPlan,'geode-chambers');assert.deepEqual([data.maps[1].portals[0].targetX,data.maps[1].portals[0].targetY],[80,138]);assert.deepEqual([data.maps[2].portals[0].targetX,data.maps[2].portals[0].targetY],[22,84]);assert.deepEqual([data.maps[3].portals[0].targetX,data.maps[3].portals[0].targetY],[138,84]);assert.deepEqual([data.npcs[0].posX,data.npcs[0].posY],[80,96]);assert.deepEqual([data.monsters[5].posX,data.monsters[5].posY],[112,150]);assert.deepEqual([data.nodes[0].x,data.nodes[0].y],[62,104]);const snap=JSON.stringify(data);assert.equal(migrateGrandCrystalDeepData(data),false);assert.equal(JSON.stringify(data),snap);});

test('9.42A administrator Crystal Deep geometry blocks collateral migration',()=>{const data=legacyData();data.maps[0].width=120;data.maps[0].height=120;data.maps[0].spawnX=55;data.maps[0].spawnY=56;data.maps[0].landmarks=[{id:'admin'}];const before=JSON.stringify(data);assert.equal(migrateGrandCrystalDeepData(data),false);assert.equal(JSON.stringify(data),before);});

test('9.42A fresh ContentDB converges schema 8 and Crystal Deep coordinates',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moria-942-')),file=path.join(dir,'content.json');try{const db=new ContentDB(file),data=db.getAllContent();assert.equal(data.grandCapitalVersion,8);const map=data.maps.find(e=>e.id==='crystal_deep');assert.deepEqual([map.width,map.height,map.urbanPlan,map.levelRequired],[160,160,'geode-chambers',36]);const npc=data.npcs.find(e=>e.id==='quest_crystal_deep');const node=data.nodes.find(e=>e.id==='node_crystal_deep');assert.deepEqual([npc.posX,npc.posY],[80,96]);assert.deepEqual([node.x,node.y],[62,104]);}finally{fs.rmSync(dir,{recursive:true,force:true});}});

test('9.42A client server renderer minimap and Studio share crystal vocabulary',()=>{const server=fs.readFileSync(new URL('../engine/World.mjs',import.meta.url),'utf8'),client=fs.readFileSync(new URL('../../src/game/maps.ts',import.meta.url),'utf8'),render=fs.readFileSync(new URL('../../src/game/render.ts',import.meta.url),'utf8'),mini=fs.readFileSync(new URL('../../src/components/WorldMiniMap.tsx',import.meta.url),'utf8');for(const marker of ['nearGeodeGallery','geodeChambersTile','chambers','galleries']){assert.ok(server.includes(marker));assert.ok(client.includes(marker));}assert.match(render,/wall_crystal_/);assert.match(render,/floor_crystal_/);assert.match(render,/path_crystal_/);assert.match(mini,/CRYSTAL_TILE_COLORS/);const fake={get(type){return type==='maps'?[clone(GRAND_CRYSTAL_DEEP_MAP)]:[];}};const schema=getContentStudioSchema('maps',fake);assert.ok(schema.options.urbanPlans.includes('geode-chambers'));assert.equal(validateStudioRecord('maps',clone(GRAND_CRYSTAL_DEEP_MAP),fake),null);});

test('9.42A seven capital algorithms remain explicitly distinct',()=>{const world=new WorldManager();for(const [id,plan]of [['eldoria','royal-grid'],['sunreach_coast','harbor-crescent'],['ironwood','forest-rings'],['frostpeak','terraced-bastion'],['shadowfen','marsh-wards'],['emberhold','caldera-radials'],['crystal_deep','geode-chambers']])assert.equal(world.getMap(id).urbanPlan,plan);});
'''
write('server/test/grand-crystal-deep-9-42.test.mjs',focused)

docs=r'''# Mor'ia 9.42 — Grand Crystal Deep

## Objetivo

Transformar Crystal Deep em uma capital subterrânea 160×160 cuja forma urbana nasce da própria caverna, não de muralhas e quarteirões de superfície.

## Identidade

- 160×160, `capital`, nível 36;
- plano **`geode-chambers`**;
- 12 distritos e 42 construções;
- oito câmaras circulares principais conectadas por galerias estreitas;
- quatro acessos físicos de poço/elevador;
- três rotas históricas: Frostpeak, Shadowfen e Stormwatch;
- variante visual `crystal` aplicada somente no cliente a `wall`, `floor` e `path`, sem mudar colisão.

A maior parte da área urbana continua sendo rocha não caminhável. A circulação existe apenas dentro das câmaras escavadas e dos túneis calculados por distância a segmentos. Isso cria uma topologia oposta às capitais de superfície.

## Renderer e minimapa

O renderer ganhou materiais cristalinos para parede, piso e galeria. O minimapa também reconhece a variante e usa uma paleta fria violeta/ciano. O servidor continua vendo exatamente os mesmos tipos lógicos e regras de movimento.

## Migração

A migração é `exact-default-only`: geometria 80×80 e coordenadas históricas precisam coincidir com os defaults para serem promovidas. Geometria administrativa bloqueia a migração colateral. Frostpeak, Shadowfen e Stormwatch só recebem novos destinos quando ainda usam os alvos antigos conhecidos.

O schema global de Grandes Capitais avança para **8**. O gate 9.42A exige auditoria PT-BR, segurança npm, typecheck/build, teste focado e suíte completa. A aprovação visual fica reservada para o 9.42B com screenshots reais e inspeção humana.
'''
write('docs/MORIA_9_42_GRAND_CRYSTAL_DEEP.md',docs)
