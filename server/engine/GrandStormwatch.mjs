// ===================================================================
// MOR'IA 9.43 — GRAND STORMWATCH ISLE AUTHORITATIVE CONTENT CONTRACT
// A storm-lashed archipelago capital: rocky islands, sea gaps and causeways
// converge on the Eye of the Tempest. Migration remains exact-default-only.
// ===================================================================

export const GRAND_STORMWATCH_VERSION=1;
export const GRAND_CAPITAL_SCHEMA_VERSION=9;

function clone(value){return JSON.parse(JSON.stringify(value));}
function samePoint(record,x,y,xKey='posX',yKey='posY'){return Number(record?.[xKey])===x&&Number(record?.[yKey])===y;}
function knownPair(x,y,pairs){return pairs.some(pair=>Number(x)===pair[0]&&Number(y)===pair[1]);}

const districts=Object.freeze([
  {id:'stormwatch_eye_ward',name:'Olho da Tempestade',icon:'⚡',x:80,y:80,radius:15,color:'#8ddcff'},
  {id:'stormwatch_admiralty_ward',name:'Almirantado',icon:'⚓',x:80,y:70,radius:11,color:'#90c9e9'},
  {id:'stormwatch_gale_exchange_ward',name:'Bolsa dos Ventos',icon:'⚖',x:64,y:86,radius:10,color:'#76b9df'},
  {id:'stormwatch_storm_chapel_ward',name:'Capela da Tormenta',icon:'✦',x:96,y:86,radius:10,color:'#a2b9e8'},
  {id:'stormwatch_north_fleet_ward',name:'Ilha da Frota Norte',icon:'△',x:80,y:34,radius:13,color:'#7bb8d9'},
  {id:'stormwatch_west_lift_ward',name:'Cais de Crystal Deep',icon:'◁',x:34,y:82,radius:13,color:'#73abc8'},
  {id:'stormwatch_east_watch_ward',name:'Thunderwatch',icon:'▷',x:126,y:82,radius:13,color:'#89c8ed'},
  {id:'stormwatch_south_mariner_ward',name:'Bairro dos Marinheiros',icon:'▽',x:80,y:128,radius:14,color:'#7999c4'},
  {id:'stormwatch_maelstrom_ward',name:'Academia do Maelstrom',icon:'◉',x:68,y:124,radius:10,color:'#8ea7d8'},
  {id:'stormwatch_windwright_ward',name:'Bairro dos Aeroforjadores',icon:'⚒',x:34,y:74,radius:10,color:'#668cae'},
  {id:'stormwatch_nightfall_ward',name:'Esporão de Nightfall',icon:'🌑',x:128,y:130,radius:11,color:'#747aa6'},
  {id:'stormwatch_lightning_gardens',name:'Jardins dos Para-Raios',icon:'⌁',x:102,y:72,radius:9,color:'#9adcf1'},
]);

const landmarks=Object.freeze([
  {id:'stormwatch_tempest_bastion',name:'Bastião da Tempestade',kind:'keep',icon:'♜',x:70,y:68,w:20,h:14},
  {id:'stormwatch_gale_exchange',name:'Bolsa dos Ventos',kind:'market',icon:'⚖',x:56,y:84,w:14,h:10},
  {id:'stormwatch_storm_chapel',name:'Capela da Tormenta',kind:'temple',icon:'✦',x:90,y:84,w:14,h:10},
  {id:'stormwatch_conduit_spire',name:'Agulha do Condutor',kind:'tower',icon:'⚡',x:75,y:57,w:10,h:9},
  {id:'stormwatch_admiralty_hall',name:'Salão do Almirantado',kind:'keep',icon:'⚓',x:70,y:95,w:18,h:10},
  {id:'stormwatch_fleet_depot',name:'Depósito da Frota',kind:'depot',icon:'▣',x:66,y:29,w:14,h:10},
  {id:'stormwatch_emberhold_gate',name:'Píer de Emberhold',kind:'gate',icon:'△',x:72,y:17,w:16,h:7},
  {id:'stormwatch_north_observatory',name:'Observatório Boreal',kind:'tower',icon:'◉',x:88,y:31,w:11,h:9},
  {id:'stormwatch_crystal_lift_gate',name:'Elevador de Crystal Deep',kind:'gate',icon:'◁',x:16,y:75,w:7,h:14},
  {id:'stormwatch_windwright_forge',name:'Forja dos Aeroforjadores',kind:'forge',icon:'⚒',x:28,y:70,w:12,h:10},
  {id:'stormwatch_delver_exchange',name:'Entreposto dos Escavadores',kind:'market',icon:'💎',x:34,y:87,w:12,h:9},
  {id:'stormwatch_thunderwatch',name:'Torre Thunderwatch',kind:'tower',icon:'⚡',x:120,y:70,w:12,h:12},
  {id:'stormwatch_east_storm_pier',name:'Píer da Tormenta Leste',kind:'gate',icon:'▷',x:138,y:75,w:7,h:14},
  {id:'stormwatch_hound_barracks',name:'Quartel dos Cães da Tempestade',kind:'tower',icon:'🛡',x:116,y:90,w:13,h:10},
  {id:'stormwatch_maelstrom_academy',name:'Academia do Maelstrom',kind:'library',icon:'◉',x:66,y:117,w:14,h:10},
  {id:'stormwatch_mariner_lodge',name:'Salão dos Marinheiros',kind:'lodge',icon:'⚓',x:86,y:119,w:14,h:10},
  {id:'stormwatch_tempest_arena',name:'Arena do Trovão',kind:'arena',icon:'⚔',x:58,y:130,w:14,h:10},
  {id:'stormwatch_storm_shrine',name:'Santuário dos Relâmpagos',kind:'temple',icon:'✧',x:89,y:132,w:12,h:9},
  {id:'stormwatch_nightfall_gate',name:'Passadiço de Nightfall',kind:'gate',icon:'🌑',x:136,y:134,w:8,h:8},
  {id:'stormwatch_black_tide_embassy',name:'Embaixada da Maré Negra',kind:'keep',icon:'☾',x:119,y:124,w:12,h:9},
]);

export const GRAND_STORMWATCH_MINOR_ARCHITECTURE=Object.freeze([
  {id:'stormwatch_home_01',name:'Casa dos Condutores I',kind:'house',icon:'⌂',x:60,y:68,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_02',name:'Casa dos Condutores II',kind:'house',icon:'⌂',x:94,y:68,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_03',name:'Casa do Almirantado I',kind:'house',icon:'⌂',x:62,y:98,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_04',name:'Casa do Almirantado II',kind:'house',icon:'⌂',x:94,y:98,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_05',name:'Casa do Olho I',kind:'house',icon:'⌂',x:72,y:86,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_06',name:'Casa do Olho II',kind:'house',icon:'⌂',x:84,y:86,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_07',name:'Alojamento da Frota I',kind:'house',icon:'⌂',x:62,y:35,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_08',name:'Alojamento da Frota II',kind:'house',icon:'⌂',x:74,y:40,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_09',name:'Alojamento da Frota III',kind:'house',icon:'⌂',x:86,y:40,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_10',name:'Oficina do Vento I',kind:'house',icon:'⌂',x:24,y:80,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_11',name:'Oficina do Vento II',kind:'house',icon:'⌂',x:32,y:62,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_12',name:'Casa do Cais Oeste',kind:'house',icon:'⌂',x:40,y:94,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_13',name:'Casa Thunderwatch I',kind:'house',icon:'⌂',x:118,y:58,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_14',name:'Casa Thunderwatch II',kind:'house',icon:'⌂',x:130,y:62,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_15',name:'Casa do Cais Leste',kind:'house',icon:'⌂',x:130,y:94,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_16',name:'Alojamento dos Marinheiros I',kind:'house',icon:'⌂',x:54,y:122,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_17',name:'Alojamento dos Marinheiros II',kind:'house',icon:'⌂',x:62,y:140,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_18',name:'Alojamento dos Marinheiros III',kind:'house',icon:'⌂',x:76,y:138,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_19',name:'Alojamento dos Marinheiros IV',kind:'house',icon:'⌂',x:92,y:138,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_20',name:'Casa da Maré Negra I',kind:'house',icon:'⌂',x:116,y:134,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_21',name:'Casa da Maré Negra II',kind:'house',icon:'⌂',x:126,y:138,w:6,h:5,showOnMinimap:false},
  {id:'stormwatch_home_22',name:'Casa da Maré Negra III',kind:'house',icon:'⌂',x:134,y:126,w:6,h:5,showOnMinimap:false},
]);

function buildProps(){
  const props=[];let serial=1;const add=(kind,x,y,color='#8ddcff',label)=>props.push({id:`stormwatch_prop_${serial++}`,kind,x,y,color,...(label?{label}:{})});
  for(const [cx,cy,r] of [[80,80,20],[80,34,12],[34,82,13],[126,82,13],[80,128,14]])for(let angle=0;angle<360;angle+=45){const rad=angle*Math.PI/180;add('brazier',Math.round(cx+Math.cos(rad)*r),Math.round(cy+Math.sin(rad)*r),angle%90===0?'#b9f0ff':'#728db8');}
  for(const [x,y] of [[80,54],[80,106],[54,82],[106,82],[72,72],[88,72],[72,92],[88,92],[80,24],[80,44]])add('rune',x,y,'#9beaff');
  for(const [x,y] of [[62,76],[98,76],[80,100],[34,68],[126,68],[68,126],[94,126]])add('lamp',x,y,'#c7f5ff');
  for(const [x,y] of [[24,88],[42,70],[116,98],[134,88],[72,136],[100,136]])add('anchor',x,y,'#7393ae');
  for(const [x,y,label] of [[80,64,'Bastião da Tempestade'],[80,26,'Frota Norte'],[34,66,'Aeroforjadores'],[126,66,'Thunderwatch'],[80,114,'Academia do Maelstrom'],[128,120,'Nightfall']])add('sign',x,y,'#8ddcff',label);
  for(const [x,y,label] of [[80,92,'Almirante Thessa'],[70,80,'Primeiro Condutor'],[92,80,'Draco do Maelstrom']])add('statue',x,y,'#aab9ca',label);
  return props.slice(0,180);
}

export const GRAND_STORMWATCH_MAP=Object.freeze({
  id:'stormwatch_isle',name:'Stormwatch Isle',biome:'snow',
  description:'Capital insular das tempestades: um arquipélago de ilhas rochosas, pontes expostas ao mar, torres condutoras e o Bastião da Tempestade no olho do ciclone.',
  width:160,height:160,settlementClass:'capital',urbanPlan:'tempest-archipelago',urbanBounds:{x:14,y:14,width:132,height:132},
  levelRequired:44,seed:8888,spawnX:80,spawnY:122,townX:80,townY:80,townRange:18,
  cityStyle:'storm',cityAccent:'#8ddcff',roofColor:'#405169',wallColor:'#aab4bf',roadColor:'#657180',residentialRingEnabled:false,residentialRingDensity:0,
  districts,landmarks:Object.freeze([...landmarks,...GRAND_STORMWATCH_MINOR_ARCHITECTURE]),props:Object.freeze(buildProps()),access:'public',
  portals:Object.freeze([
    {x:80,y:14,targetMap:'emberhold',targetX:80,targetY:138,label:'🌋 Ponte Aérea de Emberhold'},
    {x:14,y:82,targetMap:'crystal_deep',targetX:138,targetY:84,label:'💎 Elevador de Crystal Deep'},
    {x:145,y:140,targetMap:'nightfall_citadel',targetX:12,targetY:12,label:'🌑 Passadiço de Nightfall'},
  ]),
});

export const GRAND_STORMWATCH_BUILTIN_WORLD_CONFIG=Object.freeze({
  ...GRAND_STORMWATCH_MAP,
  spawnPoint:{x:GRAND_STORMWATCH_MAP.spawnX,y:GRAND_STORMWATCH_MAP.spawnY},townCenter:{x:GRAND_STORMWATCH_MAP.townX,y:GRAND_STORMWATCH_MAP.townY},
  portals:GRAND_STORMWATCH_MAP.portals.filter(portal=>portal.targetMap==='emberhold'||portal.targetMap==='crystal_deep').map(portal=>({pos:{x:portal.x,y:portal.y},targetMap:portal.targetMap,targetSpawn:{x:portal.targetX,y:portal.targetY},label:portal.label})),
});

export const GRAND_STORMWATCH_NPC_MOVES=Object.freeze({
  quest_stormwatch_isle:{from:[38,22],to:[80,96]},merchant_stormwatch_isle:{from:[42,22],to:[64,86]},warden_stormwatch_isle:{from:[40,24],to:[120,82]},
});
export const GRAND_STORMWATCH_MONSTER_MOVES=Object.freeze({
  stormwatch_isle_gale_harpy:{from:[18,27],to:[12,120]},stormwatch_isle_storm_hound:{from:[26,34],to:[20,52]},stormwatch_isle_sea_raider:{from:[34,41],to:[148,118]},stormwatch_isle_thunder_elemental:{from:[42,48],to:[148,46]},stormwatch_isle_tempest_champion:{from:[50,55],to:[48,150]},stormwatch_isle_maelstrom_drake:{from:[58,20],to:[112,150]},
});
function patchExactPosition(record,move,xKey='posX',yKey='posY'){if(!move||!samePoint(record,move.from[0],move.from[1],xKey,yKey))return false;record[xKey]=move.to[0];record[yKey]=move.to[1];return true;}
function patchPortalTarget(portal,target){if('targetX'in portal||!portal.targetSpawn){portal.targetX=target[0];portal.targetY=target[1];}else portal.targetSpawn={...portal.targetSpawn,x:target[0],y:target[1]};}
function legacyPortalSet(portals){return Array.isArray(portals)&&portals.length===3&&['emberhold','crystal_deep','nightfall_citadel'].every(target=>portals.some(portal=>portal?.targetMap===target));}
function patchMap(map){
  const width=map.width===undefined?80:Number(map.width),height=map.height===undefined?80:Number(map.height);const spawnX=Number(map.spawnX??40),spawnY=Number(map.spawnY??22),townX=Number(map.townX??40),townY=Number(map.townY??22);
  if(width!==80||height!==80||spawnX!==40||spawnY!==22||townX!==40||townY!==22)return false;
  let changed=false;const set=(key,value)=>{if(JSON.stringify(map[key])!==JSON.stringify(value)){map[key]=clone(value);changed=true;}};
  set('width',160);set('height',160);set('settlementClass','capital');set('urbanPlan','tempest-archipelago');set('urbanBounds',GRAND_STORMWATCH_MAP.urbanBounds);set('spawnX',80);set('spawnY',122);set('townX',80);set('townY',80);set('townRange',18);
  if(map.levelRequired===undefined||Number(map.levelRequired)===44)set('levelRequired',44);if(!map.cityStyle||map.cityStyle==='storm')set('cityStyle','storm');
  if(!map.cityAccent)set('cityAccent',GRAND_STORMWATCH_MAP.cityAccent);if(!map.roofColor)set('roofColor',GRAND_STORMWATCH_MAP.roofColor);if(!map.wallColor)set('wallColor',GRAND_STORMWATCH_MAP.wallColor);if(!map.roadColor)set('roadColor',GRAND_STORMWATCH_MAP.roadColor);
  if(!Array.isArray(map.districts)||map.districts.length===0)set('districts',GRAND_STORMWATCH_MAP.districts);if(!Array.isArray(map.landmarks)||map.landmarks.length===0)set('landmarks',GRAND_STORMWATCH_MAP.landmarks);if(!Array.isArray(map.props)||map.props.length===0)set('props',GRAND_STORMWATCH_MAP.props);
  if(map.residentialRingEnabled===undefined||map.residentialRingEnabled===true)set('residentialRingEnabled',false);if(map.residentialRingDensity===undefined||Number(map.residentialRingDensity)<=5)set('residentialRingDensity',0);if(!Array.isArray(map.portals)||map.portals.length===0||legacyPortalSet(map.portals))set('portals',GRAND_STORMWATCH_MAP.portals);return changed;
}
export function migrateGrandStormwatchData(data){
  if(!data||typeof data!=='object'||Array.isArray(data))return false;const maps=Array.isArray(data.maps)?data.maps:[];const storm=maps.find(map=>map?.id==='stormwatch_isle');if(!storm)return false;let changed=patchMap(storm);
  const grand=Number(storm.width)===160&&Number(storm.height)===160&&storm.settlementClass==='capital'&&storm.urbanPlan==='tempest-archipelago';if(!changed&&!grand)return false;
  const incoming=[['emberhold',[[40,10]],[80,18]],['crystal_deep',[[10,40]],[18,82]],['nightfall_citadel',[[68,68]],[140,136]]];
  for(const [mapId,legacyTargets,target]of incoming){const map=maps.find(entry=>entry?.id===mapId);for(const portal of Array.isArray(map?.portals)?map.portals:[]){const tx=portal.targetX??portal.targetSpawn?.x,ty=portal.targetY??portal.targetSpawn?.y;if(portal?.targetMap==='stormwatch_isle'&&knownPair(tx,ty,legacyTargets)){patchPortalTarget(portal,target);changed=true;}}}
  for(const npc of Array.isArray(data.npcs)?data.npcs:[])if(npc?.mapId==='stormwatch_isle'&&patchExactPosition(npc,GRAND_STORMWATCH_NPC_MOVES[npc.id]))changed=true;
  for(const monster of Array.isArray(data.monsters)?data.monsters:[])if(monster?.mapId==='stormwatch_isle'&&patchExactPosition(monster,GRAND_STORMWATCH_MONSTER_MOVES[monster.id]))changed=true;
  for(const node of Array.isArray(data.nodes)?data.nodes:[])if(node?.id==='node_stormwatch'&&node?.mapId==='stormwatch_isle'&&samePoint(node,40,22,'x','y')){node.x=80;node.y=70;changed=true;}
  return changed;
}
