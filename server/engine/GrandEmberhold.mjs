// ===================================================================
// MOR'IA 9.41 — GRAND EMBERHOLD AUTHORITATIVE CONTENT CONTRACT
// A volcanic forge capital built around a molten caldera, radial roads,
// industrial rings and bridged lava fissures. Exact legacy defaults migrate
// while administrator-authored geometry and coordinates always win.
// ===================================================================

export const GRAND_EMBERHOLD_VERSION=1;
export const GRAND_CAPITAL_SCHEMA_VERSION=7;

function clone(value){return JSON.parse(JSON.stringify(value));}
function samePoint(record,x,y,xKey='posX',yKey='posY'){return Number(record?.[xKey])===x&&Number(record?.[yKey])===y;}
function knownPair(x,y,pairs){return pairs.some(pair=>Number(x)===pair[0]&&Number(y)===pair[1]);}

const districts=Object.freeze([
  {id:'emberhold_ember_crown',name:'Coroa de Ember',icon:'♜',x:80,y:34,radius:11,color:'#ffad55'},
  {id:'emberhold_foundry_ward',name:'Distrito da Grande Fundição',icon:'⚒',x:40,y:62,radius:11,color:'#e8873f'},
  {id:'emberhold_ash_bazaar_ward',name:'Bazar das Cinzas',icon:'⚖',x:120,y:62,radius:10,color:'#f0a552'},
  {id:'emberhold_crucible_ward',name:'Cadinho Central',icon:'🔥',x:80,y:80,radius:12,color:'#ff7043'},
  {id:'emberhold_cinder_arena_ward',name:'Arena das Brasas',icon:'⚔',x:56,y:104,radius:10,color:'#d7653a'},
  {id:'emberhold_flame_ward',name:'Bairro da Chama',icon:'✦',x:100,y:104,radius:10,color:'#f08a45'},
  {id:'emberhold_smelters_ward',name:'Bairro dos Fundidores',icon:'⚒',x:36,y:118,radius:10,color:'#bb7049'},
  {id:'emberhold_artificers_ward',name:'Bairro dos Artífices',icon:'⚙',x:124,y:112,radius:10,color:'#d58b53'},
  {id:'emberhold_emberguard_ward',name:'Quartéis Emberguard',icon:'🛡',x:52,y:46,radius:9,color:'#c96b42'},
  {id:'emberhold_slag_commons',name:'Comuns da Escória',icon:'⌂',x:80,y:124,radius:11,color:'#a66e55'},
  {id:'emberhold_frostpeak_gate_ward',name:'Portão de Frostpeak',icon:'△',x:80,y:22,radius:8,color:'#ffbb68'},
  {id:'emberhold_stormwatch_gate_ward',name:'Portão de Stormwatch',icon:'▽',x:80,y:136,radius:8,color:'#e58b4b'},
]);

const landmarks=Object.freeze([
  {id:'emberhold_ember_citadel',name:'Cidadela de Ember',kind:'keep',icon:'♜',x:70,y:28,w:20,h:14},
  {id:'emberhold_great_foundry',name:'Grande Fundição',kind:'forge',icon:'⚒',x:28,y:56,w:16,h:12},
  {id:'emberhold_ash_bazaar',name:'Bazar das Cinzas',kind:'market',icon:'⚖',x:112,y:56,w:16,h:10},
  {id:'emberhold_flame_shrine',name:'Santuário da Chama',kind:'temple',icon:'✦',x:92,y:98,w:14,h:11},
  {id:'emberhold_cinder_arena',name:'Arena das Brasas',kind:'arena',icon:'⚔',x:48,y:98,w:16,h:12},
  {id:'emberhold_crucible_council',name:'Conselho do Cadinho',kind:'keep',icon:'🔥',x:70,y:44,w:20,h:10},
  {id:'emberhold_magma_academy',name:'Academia do Magma',kind:'library',icon:'▤',x:28,y:88,w:14,h:10},
  {id:'emberhold_black_anvil_guild',name:'Guilda da Bigorna Negra',kind:'forge',icon:'⚒',x:114,y:88,w:14,h:10},
  {id:'emberhold_dragon_forge',name:'Forja dos Dragões',kind:'forge',icon:'🐉',x:104,y:116,w:15,h:11},
  {id:'emberhold_emberguard_barracks',name:'Quartel Emberguard',kind:'tower',icon:'🛡',x:46,y:42,w:14,h:10},
  {id:'emberhold_smelters_hall',name:'Salão dos Fundidores',kind:'forge',icon:'⚒',x:26,y:114,w:14,h:10},
  {id:'emberhold_artificers_hall',name:'Salão dos Artífices',kind:'forge',icon:'⚙',x:122,y:104,w:14,h:10},
  {id:'emberhold_ash_archive',name:'Arquivo das Cinzas',kind:'library',icon:'▤',x:98,y:42,w:12,h:9},
  {id:'emberhold_cinder_infirmary',name:'Enfermaria das Brasas',kind:'house',icon:'✚',x:48,y:74,w:12,h:9},
  {id:'emberhold_caravan_depot',name:'Depósito das Caravanas',kind:'depot',icon:'▣',x:104,y:74,w:12,h:9},
  {id:'emberhold_molten_exchange',name:'Bolsa do Metal Fundido',kind:'market',icon:'⚖',x:30,y:74,w:12,h:9},
  {id:'emberhold_north_gate',name:'Portão de Frostpeak',kind:'gate',icon:'△',x:72,y:20,w:16,h:7},
  {id:'emberhold_south_gate',name:'Portão de Stormwatch',kind:'gate',icon:'▽',x:72,y:132,w:16,h:7},
  {id:'emberhold_east_gate',name:'Portão da Escória Leste',kind:'gate',icon:'▷',x:132,y:72,w:7,h:16},
  {id:'emberhold_west_gate',name:'Portão da Escória Oeste',kind:'gate',icon:'◁',x:20,y:72,w:7,h:16},
]);

export const GRAND_EMBERHOLD_MINOR_ARCHITECTURE=Object.freeze([
  {id:'emberhold_workshop_01',name:'Oficina do Ferro-Rubro I',kind:'house',icon:'⌂',x:28,y:30,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_02',name:'Oficina do Ferro-Rubro II',kind:'house',icon:'⌂',x:38,y:30,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_03',name:'Casa dos Mineiros I',kind:'house',icon:'⌂',x:50,y:28,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_04',name:'Casa dos Mineiros II',kind:'house',icon:'⌂',x:104,y:28,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_05',name:'Oficina das Tenazes',kind:'house',icon:'⌂',x:116,y:30,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_06',name:'Casa dos Escorificadores',kind:'house',icon:'⌂',x:126,y:32,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_07',name:'Forja Menor Oeste I',kind:'house',icon:'⌂',x:28,y:44,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_08',name:'Forja Menor Oeste II',kind:'house',icon:'⌂',x:36,y:46,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_09',name:'Residência Emberguard I',kind:'house',icon:'⌂',x:54,y:54,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_10',name:'Residência Emberguard II',kind:'house',icon:'⌂',x:62,y:56,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_11',name:'Residência dos Mercadores I',kind:'house',icon:'⌂',x:96,y:56,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_12',name:'Residência dos Mercadores II',kind:'house',icon:'⌂',x:104,y:62,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_13',name:'Casa dos Fundidores I',kind:'house',icon:'⌂',x:26,y:98,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_14',name:'Casa dos Fundidores II',kind:'house',icon:'⌂',x:36,y:102,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_15',name:'Casa da Arena I',kind:'house',icon:'⌂',x:66,y:112,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_16',name:'Casa da Arena II',kind:'house',icon:'⌂',x:74,y:116,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_17',name:'Casa dos Artífices I',kind:'house',icon:'⌂',x:92,y:112,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_18',name:'Casa dos Artífices II',kind:'house',icon:'⌂',x:122,y:118,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_19',name:'Comuns da Escória I',kind:'house',icon:'⌂',x:42,y:126,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_20',name:'Comuns da Escória II',kind:'house',icon:'⌂',x:54,y:128,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_21',name:'Comuns da Escória III',kind:'house',icon:'⌂',x:98,y:128,w:6,h:5,showOnMinimap:false},
  {id:'emberhold_workshop_22',name:'Comuns da Escória IV',kind:'house',icon:'⌂',x:118,y:128,w:6,h:5,showOnMinimap:false},
]);

function buildProps(){
  const props=[];let serial=1;
  const add=(kind,x,y,color='#ff9b45',label)=>props.push({id:`emberhold_prop_${serial++}`,kind,x,y,color,...(label?{label}:{})});
  for(const radius of [28,46])for(let angle=0;angle<360;angle+=30){const rad=angle*Math.PI/180;add('brazier',Math.round(80+Math.cos(rad)*radius),Math.round(80+Math.sin(rad)*radius),radius===28?'#ffb052':'#d8753b');}
  for(const y of [42,80,118])for(let x=30;x<=130;x+=10)add('banner',x,y,'#a84b2e');
  for(const [x,y] of [[34,68],[42,68],[116,68],[124,68],[34,108],[42,108],[116,108],[124,108],[62,126],[70,126],[90,126],[98,126]])add('barrel',x,y,'#75503a');
  for(const [x,y] of [[30,120],[50,120],[110,120],[130,120],[32,52],[128,52]])add('cart',x,y,'#654535');
  for(const [x,y] of [[80,60],[80,100],[60,80],[100,80],[68,68],[92,68],[68,92],[92,92]])add('rune',x,y,'#ff6a32');
  for(const [x,y,label] of [[80,26,'Cidadela de Ember'],[40,54,'Grande Fundição'],[120,54,'Bazar das Cinzas'],[80,56,'Conselho do Cadinho'],[56,94,'Arena das Brasas'],[100,94,'Santuário da Chama'],[36,112,'Fundidores'],[124,102,'Artífices'],[80,130,'Stormwatch']])add('sign',x,y,'#f0a552',label);
  for(const [x,y,label] of [[80,66,'Primeiro Ferreiro'],[80,94,'Pacto da Bigorna'],[64,80,'Guarda da Chama'],[96,80,'Mestres do Cadinho']])add('statue',x,y,'#b88362',label);
  return props.slice(0,180);
}

export const GRAND_EMBERHOLD_MAP=Object.freeze({
  id:'emberhold',name:'Emberhold',biome:'desert',
  description:'Capital vulcânica das forjas: uma caldeira central alimenta fissuras de lava, anéis industriais, oficinas, mercados e pontes de metal incandescente.',
  width:160,height:160,settlementClass:'capital',urbanPlan:'caldera-radials',urbanBounds:{x:18,y:18,width:124,height:124},
  levelRequired:28,seed:999,spawnX:80,spawnY:126,townX:80,townY:80,townRange:18,
  cityStyle:'forge',cityAccent:'#ff9b45',roofColor:'#7c3923',wallColor:'#aa7950',roadColor:'#744a38',
  residentialRingEnabled:false,residentialRingDensity:0,
  districts,landmarks:Object.freeze([...landmarks,...GRAND_EMBERHOLD_MINOR_ARCHITECTURE]),props:Object.freeze(buildProps()),access:'public',
  portals:Object.freeze([
    {x:80,y:18,targetMap:'frostpeak',targetX:130,targetY:112,label:'❄ Passagem de Frostpeak'},
    {x:80,y:141,targetMap:'stormwatch_isle',targetX:40,targetY:10,label:'⚡ Estrada de Stormwatch'},
  ]),
});

export const GRAND_EMBERHOLD_BUILTIN_WORLD_CONFIG=Object.freeze({
  ...GRAND_EMBERHOLD_MAP,
  spawnPoint:{x:GRAND_EMBERHOLD_MAP.spawnX,y:GRAND_EMBERHOLD_MAP.spawnY},
  townCenter:{x:GRAND_EMBERHOLD_MAP.townX,y:GRAND_EMBERHOLD_MAP.townY},
  portals:GRAND_EMBERHOLD_MAP.portals.filter(portal=>portal.targetMap==='frostpeak').map(portal=>({pos:{x:portal.x,y:portal.y},targetMap:portal.targetMap,targetSpawn:{x:portal.targetX,y:portal.targetY},label:portal.label})),
});

export const GRAND_EMBERHOLD_NPC_MOVES=Object.freeze({
  quest_emberhold:{from:[63,15],to:[80,116]},
  merchant_emberhold:{from:[67,15],to:[64,82]},
  warden_emberhold:{from:[65,17],to:[124,80]},
  task_master_emberhold:{from:[63,17],to:[46,110]},
});
export const GRAND_EMBERHOLD_HOUSE_MOVES=Object.freeze({
  house_ashstone:{from:[56,19,58,18],to:[26,126,28,125]},
  house_cinderhall:{from:[66,22,68,21],to:[128,126,130,125]},
});
export const GRAND_EMBERHOLD_MONSTER_MOVES=Object.freeze({
  emberhold_ash_scorpion:{from:[18,55],to:[12,118]},
  emberhold_cinder_jackal:{from:[26,20],to:[16,54]},
  emberhold_lava_imp:{from:[34,27],to:[146,118]},
  emberhold_ashen_raider:{from:[42,34],to:[146,48]},
  emberhold_magma_golem:{from:[50,41],to:[48,150]},
  emberhold_pyroclast_tyrant:{from:[58,48],to:[112,150]},
});

function patchExactPosition(record,move,xKey='posX',yKey='posY'){
  if(!move||!samePoint(record,move.from[0],move.from[1],xKey,yKey))return false;
  record[xKey]=move.to[0];record[yKey]=move.to[1];return true;
}
function patchHouse(record,move){
  if(!move||Number(record.x)!==move.from[0]||Number(record.y)!==move.from[1]||Number(record.entranceX)!==move.from[2]||Number(record.entranceY)!==move.from[3])return false;
  [record.x,record.y,record.entranceX,record.entranceY]=move.to;return true;
}
function patchPortalTarget(portal,target){
  if('targetX' in portal||!portal.targetSpawn){portal.targetX=target[0];portal.targetY=target[1];}
  else portal.targetSpawn={...portal.targetSpawn,x:target[0],y:target[1]};
}
function legacyPortalSet(portals){
  if(!Array.isArray(portals))return false;
  if(portals.length===1)return portals[0]?.targetMap==='frostpeak';
  return portals.length===2&&['frostpeak','stormwatch_isle'].every(target=>portals.some(portal=>portal?.targetMap===target));
}
function patchMap(map){
  const width=map.width===undefined?80:Number(map.width),height=map.height===undefined?80:Number(map.height);
  const spawnX=Number(map.spawnX??65),spawnY=Number(map.spawnY??15),townX=Number(map.townX??65),townY=Number(map.townY??15);
  const legacyCoordinates=width===80&&height===80&&knownPair(spawnX,spawnY,[[65,15],[70,10]])&&townX===65&&townY===15;
  if(!legacyCoordinates)return false;
  let changed=false;const set=(key,value)=>{if(JSON.stringify(map[key])!==JSON.stringify(value)){map[key]=clone(value);changed=true;}};
  set('width',160);set('height',160);set('settlementClass','capital');set('urbanPlan','caldera-radials');set('urbanBounds',GRAND_EMBERHOLD_MAP.urbanBounds);
  set('spawnX',80);set('spawnY',126);set('townX',80);set('townY',80);set('townRange',18);
  if(map.levelRequired===undefined||[1,16,28].includes(Number(map.levelRequired)))set('levelRequired',28);
  if(!map.cityStyle||map.cityStyle==='forge')set('cityStyle','forge');
  if(!map.cityAccent)set('cityAccent',GRAND_EMBERHOLD_MAP.cityAccent);if(!map.roofColor)set('roofColor',GRAND_EMBERHOLD_MAP.roofColor);if(!map.wallColor)set('wallColor',GRAND_EMBERHOLD_MAP.wallColor);if(!map.roadColor)set('roadColor',GRAND_EMBERHOLD_MAP.roadColor);
  if(!Array.isArray(map.districts)||map.districts.length===0)set('districts',GRAND_EMBERHOLD_MAP.districts);
  if(!Array.isArray(map.landmarks)||map.landmarks.length===0)set('landmarks',GRAND_EMBERHOLD_MAP.landmarks);
  if(!Array.isArray(map.props)||map.props.length===0)set('props',GRAND_EMBERHOLD_MAP.props);
  if(map.residentialRingEnabled===undefined||map.residentialRingEnabled===true)set('residentialRingEnabled',false);if(map.residentialRingDensity===undefined||Number(map.residentialRingDensity)<=5)set('residentialRingDensity',0);
  if(!Array.isArray(map.portals)||map.portals.length===0||legacyPortalSet(map.portals))set('portals',GRAND_EMBERHOLD_MAP.portals);
  return changed;
}

export function migrateGrandEmberholdData(data){
  if(!data||typeof data!=='object'||Array.isArray(data))return false;
  const maps=Array.isArray(data.maps)?data.maps:[];const emberhold=maps.find(map=>map?.id==='emberhold');if(!emberhold)return false;
  let changed=patchMap(emberhold);
  const grandTopology=Number(emberhold.width)===160&&Number(emberhold.height)===160&&emberhold.settlementClass==='capital'&&emberhold.urbanPlan==='caldera-radials';
  if(!changed&&!grandTopology)return false;
  const incoming=[
    ['frostpeak',[[70,10]],[80,22]],
    ['stormwatch_isle',[[40,68]],[80,138]],
  ];
  for(const [mapId,legacyTargets,target]of incoming){const map=maps.find(entry=>entry?.id===mapId);for(const portal of Array.isArray(map?.portals)?map.portals:[]){const tx=portal.targetX??portal.targetSpawn?.x,ty=portal.targetY??portal.targetSpawn?.y;if(portal?.targetMap==='emberhold'&&knownPair(tx,ty,legacyTargets)){patchPortalTarget(portal,target);changed=true;}}}
  for(const npc of Array.isArray(data.npcs)?data.npcs:[])if(npc?.mapId==='emberhold'&&patchExactPosition(npc,GRAND_EMBERHOLD_NPC_MOVES[npc.id]))changed=true;
  for(const monster of Array.isArray(data.monsters)?data.monsters:[])if(monster?.mapId==='emberhold'&&patchExactPosition(monster,GRAND_EMBERHOLD_MONSTER_MOVES[monster.id]))changed=true;
  for(const house of Array.isArray(data.houses)?data.houses:[])if(house?.mapId==='emberhold'&&patchHouse(house,GRAND_EMBERHOLD_HOUSE_MOVES[house.id]))changed=true;
  for(const node of Array.isArray(data.nodes)?data.nodes:[])if(node?.id==='node_emberhold'&&node?.mapId==='emberhold'&&samePoint(node,65,15,'x','y')){node.x=80;node.y=66;changed=true;}
  return changed;
}
