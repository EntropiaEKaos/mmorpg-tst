// ===================================================================
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
    {x:141,y:84,targetMap:'stormwatch_isle',targetX:18,targetY:82,label:'⚡ Elevador de Stormwatch'},
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
  for(const node of Array.isArray(data.nodes)?data.nodes:[])if(node?.id==='node_crystaldeep'&&node?.mapId==='crystal_deep'&&samePoint(node,40,60,'x','y')){node.x=62;node.y=104;changed=true;}
  return changed;
}
