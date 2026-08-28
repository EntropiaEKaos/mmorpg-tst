// ===================================================================
// MOR'IA 9.39 — GRAND FROSTPEAK AUTHORITATIVE CONTENT CONTRACT
// An alpine terrace-fortress capital. Exact legacy defaults migrate while
// administrator-authored dimensions, architecture and coordinates always win.
// ===================================================================

export const GRAND_FROSTPEAK_VERSION = 1;
export const GRAND_CAPITAL_SCHEMA_VERSION = 5;

function clone(value){return JSON.parse(JSON.stringify(value));}
function samePoint(record,x,y,xKey='posX',yKey='posY'){return Number(record?.[xKey])===x&&Number(record?.[yKey])===y;}
function knownPair(x,y,pairs){return pairs.some(pair=>Number(x)===pair[0]&&Number(y)===pair[1]);}

const districts=Object.freeze([
  {id:'frostpeak_high_citadel',name:'Alta Cidadela',icon:'♜',x:80,y:32,radius:12,color:'#a9dcf5'},
  {id:'frostpeak_thane_ward',name:'Bairro do Thane',icon:'♛',x:56,y:52,radius:10,color:'#b9d8e8'},
  {id:'frostpeak_ice_chapel',name:'Bairro da Capela de Gelo',icon:'❄',x:106,y:52,radius:10,color:'#c8e9f6'},
  {id:'frostpeak_forge_terrace',name:'Terraço das Forjas',icon:'⚒',x:52,y:80,radius:11,color:'#9eb8c6'},
  {id:'frostpeak_market_terrace',name:'Terraço do Mercado',icon:'⚖',x:80,y:80,radius:11,color:'#bdd6df'},
  {id:'frostpeak_expedition_ward',name:'Bairro das Expedições',icon:'🧭',x:110,y:80,radius:11,color:'#9ecbdf'},
  {id:'frostpeak_barracks',name:'Terraço dos Quartéis',icon:'🛡',x:48,y:104,radius:11,color:'#91a7b2'},
  {id:'frostpeak_lower_commons',name:'Comuns da Geada',icon:'⌂',x:80,y:104,radius:12,color:'#b1c9cf'},
  {id:'frostpeak_snowpine',name:'Bairro Snowpine',icon:'🌲',x:112,y:104,radius:11,color:'#8fb8b0'},
  {id:'frostpeak_west_pass',name:'Passagem Oeste',icon:'◇',x:32,y:82,radius:8,color:'#9dd8ff'},
  {id:'frostpeak_ember_pass',name:'Passagem das Cinzas',icon:'🌋',x:126,y:112,radius:8,color:'#d5b29a'},
  {id:'frostpeak_lower_gate',name:'Portão Inferior',icon:'▽',x:80,y:130,radius:9,color:'#aabec8'},
]);

const landmarks=Object.freeze([
  {id:'frostpeak_frostguard_citadel',name:'Cidadela Frostguard',kind:'keep',icon:'♜',x:70,y:24,w:20,h:14},
  {id:'frostpeak_thane_hall',name:'Salão do Thane',kind:'keep',icon:'♛',x:50,y:46,w:14,h:10},
  {id:'frostpeak_observatory',name:'Observatório da Aurora',kind:'tower',icon:'✦',x:104,y:26,w:12,h:10},
  {id:'frostpeak_ice_chapel',name:'Capela do Gelo Eterno',kind:'temple',icon:'❄',x:98,y:46,w:12,h:10},
  {id:'frostpeak_anvil_hall',name:'Salão da Bigorna',kind:'forge',icon:'⚒',x:42,y:70,w:14,h:10},
  {id:'frostpeak_grand_market',name:'Mercado da Geada',kind:'market',icon:'⚖',x:64,y:70,w:14,h:10},
  {id:'frostpeak_expedition_depot',name:'Depósito das Expedições',kind:'depot',icon:'▣',x:96,y:70,w:12,h:10},
  {id:'frostpeak_climbers_guild',name:'Guilda dos Escaladores',kind:'lodge',icon:'🧭',x:112,y:70,w:12,h:10},
  {id:'frostpeak_ice_vault',name:'Cofre Glacial',kind:'depot',icon:'◆',x:40,y:92,w:12,h:9},
  {id:'frostpeak_frostguard_barracks',name:'Quartel Frostguard',kind:'tower',icon:'🛡',x:56,y:94,w:14,h:10},
  {id:'frostpeak_commons_hall',name:'Salão dos Comuns',kind:'house',icon:'⌂',x:76,y:94,w:12,h:10},
  {id:'frostpeak_military_academy',name:'Academia da Montanha',kind:'keep',icon:'⚔',x:96,y:94,w:14,h:10},
  {id:'frostpeak_ice_arena',name:'Arena do Gelo',kind:'arena',icon:'⚔',x:112,y:92,w:14,h:12},
  {id:'frostpeak_infirmary',name:'Enfermaria da Geada',kind:'house',icon:'✚',x:44,y:116,w:12,h:9},
  {id:'frostpeak_stables',name:'Estábulos dos Ursos',kind:'lodge',icon:'🐻‍❄',x:60,y:118,w:12,h:9},
  {id:'frostpeak_lower_depot',name:'Depósito Inferior',kind:'depot',icon:'▤',x:86,y:118,w:12,h:9},
  {id:'frostpeak_snowpine_lodge',name:'Pavilhão Snowpine',kind:'lodge',icon:'🌲',x:104,y:118,w:12,h:9},
  {id:'frostpeak_westwatch',name:'Torre da Passagem Oeste',kind:'tower',icon:'🛡',x:28,y:76,w:8,h:12},
  {id:'frostpeak_emberwatch',name:'Torre das Cinzas',kind:'tower',icon:'🌋',x:124,y:104,w:8,h:12},
  {id:'frostpeak_northwatch',name:'Vigília do Cristal',kind:'tower',icon:'💎',x:90,y:20,w:8,h:10},
]);

export const GRAND_FROSTPEAK_MINOR_ARCHITECTURE=Object.freeze([
  {id:'frostpeak_home_01',name:'Casa da Alta Geada I',kind:'house',icon:'⌂',x:38,y:28,w:6,h:5,showOnMinimap:false},
  {id:'frostpeak_home_02',name:'Casa da Alta Geada II',kind:'house',icon:'⌂',x:48,y:30,w:6,h:5,showOnMinimap:false},
  {id:'frostpeak_home_03',name:'Casa dos Astrônomos',kind:'house',icon:'⌂',x:118,y:30,w:6,h:5,showOnMinimap:false},
  {id:'frostpeak_home_04',name:'Casario do Thane I',kind:'house',icon:'⌂',x:30,y:50,w:6,h:5,showOnMinimap:false},
  {id:'frostpeak_home_05',name:'Casario do Thane II',kind:'house',icon:'⌂',x:38,y:56,w:6,h:5,showOnMinimap:false},
  {id:'frostpeak_home_06',name:'Vila da Geada I',kind:'house',icon:'⌂',x:68,y:52,w:6,h:5,showOnMinimap:false},
  {id:'frostpeak_home_07',name:'Vila da Geada II',kind:'house',icon:'⌂',x:80,y:52,w:6,h:5,showOnMinimap:false},
  {id:'frostpeak_home_08',name:'Vila da Capela',kind:'house',icon:'⌂',x:116,y:50,w:6,h:5,showOnMinimap:false},
  {id:'frostpeak_workshop_01',name:'Oficina dos Ferreiros',kind:'house',icon:'⚒',x:34,y:82,w:7,h:5,showOnMinimap:false},
  {id:'frostpeak_home_09',name:'Casario Mercantil',kind:'house',icon:'⌂',x:50,y:82,w:6,h:5,showOnMinimap:false},
  {id:'frostpeak_home_10',name:'Casa dos Guias',kind:'house',icon:'⌂',x:82,y:82,w:6,h:5,showOnMinimap:false},
  {id:'frostpeak_home_11',name:'Casa dos Expedicionários I',kind:'house',icon:'⌂',x:100,y:82,w:6,h:5,showOnMinimap:false},
  {id:'frostpeak_home_12',name:'Casa dos Expedicionários II',kind:'house',icon:'⌂',x:116,y:84,w:6,h:5,showOnMinimap:false},
  {id:'frostpeak_home_13',name:'Casa dos Guardas',kind:'house',icon:'⌂',x:30,y:106,w:6,h:5,showOnMinimap:false},
  {id:'frostpeak_home_14',name:'Comuns da Geada I',kind:'house',icon:'⌂',x:52,y:106,w:6,h:5,showOnMinimap:false},
  {id:'frostpeak_home_15',name:'Comuns da Geada II',kind:'house',icon:'⌂',x:72,y:108,w:6,h:5,showOnMinimap:false},
  {id:'frostpeak_home_16',name:'Comuns da Geada III',kind:'house',icon:'⌂',x:90,y:108,w:6,h:5,showOnMinimap:false},
  {id:'frostpeak_home_17',name:'Casa Snowpine I',kind:'house',icon:'⌂',x:112,y:108,w:6,h:5,showOnMinimap:false},
  {id:'frostpeak_home_18',name:'Casa Snowpine II',kind:'house',icon:'⌂',x:120,y:92,w:6,h:5,showOnMinimap:false},
  {id:'frostpeak_home_19',name:'Abrigo dos Peregrinos',kind:'house',icon:'⌂',x:72,y:126,w:6,h:5,showOnMinimap:false},
  {id:'frostpeak_home_20',name:'Abrigo da Passagem Inferior',kind:'house',icon:'⌂',x:96,y:128,w:6,h:5,showOnMinimap:false},
]);

function buildProps(){
  const props=[]; let serial=1;
  const add=(kind,x,y,color='#9dd8ff',label)=>props.push({id:`frostpeak_prop_${serial++}`,kind,x,y,color,...(label?{label}:{})});
  for(const y of [34,58,82,106,130]) for(let x=30;x<=130;x+=8) add('lamp',x,y,'#cbe9f5');
  for(let y=26;y<=132;y+=10){add('banner',78,y,'#6d8798');add('banner',82,y,'#6d8798');}
  for(const [x,y] of [[32,42],[42,42],[118,42],[128,42],[34,66],[124,66],[34,90],[124,90],[34,114],[124,114]]) add('pine',x,y,'#789b92');
  for(const [x,y] of [[46,86],[54,86],[66,86],[94,86],[106,86],[116,86]]) add('barrel',x,y,'#756654');
  for(const [x,y] of [[42,110],[58,112],[104,110],[118,112]]) add('cart',x,y,'#6d6257');
  for(const [x,y,label] of [[80,40,'Alta Cidadela'],[54,64,'Terraço das Forjas'],[80,64,'Mercado da Geada'],[108,64,'Bairro das Expedições'],[48,110,'Quartéis Frostguard'],[112,110,'Bairro Snowpine'],[80,134,'Portão Inferior']]) add('sign',x,y,'#a9dcf5',label);
  for(const [x,y,label] of [[80,58,'Thane Yrsa'],[80,86,'Guardas da Montanha'],[80,110,'Expedição do Primeiro Inverno']]) add('statue',x,y,'#cbd4d8',label);
  return props.slice(0,120);
}

export const GRAND_FROSTPEAK_MAP=Object.freeze({
  id:'frostpeak',name:'Frostpeak',biome:'snow',
  description:'Capital alpina da montanha: cidadela escalonada em terraços, muralhas de retenção, forjas, capela glacial, quartéis e rotas de expedição.',
  width:160,height:160,settlementClass:'capital',urbanPlan:'terraced-bastion',urbanBounds:{x:26,y:18,width:108,height:122},
  levelRequired:15,seed:1337,spawnX:80,spawnY:104,townX:80,townY:76,townRange:18,
  cityStyle:'alpine',cityAccent:'#9dd8ff',roofColor:'#334b67',wallColor:'#cbd4d8',roadColor:'#7f8c92',
  residentialRingEnabled:false,residentialRingDensity:0,
  districts,landmarks:Object.freeze([...landmarks,...GRAND_FROSTPEAK_MINOR_ARCHITECTURE]),props:Object.freeze(buildProps()),access:'public',
  portals:Object.freeze([
    {x:26,y:82,targetMap:'eldoria',targetX:30,targetY:80,label:'🏰 Passagem de Eldoria'},
    {x:133,y:112,targetMap:'emberhold',targetX:80,targetY:22,label:'🌋 Passagem de Emberhold'},
    {x:80,y:18,targetMap:'crystal_deep',targetX:80,targetY:138,label:'💎 Descida do Cristal'},
    {x:80,y:139,targetMap:'ironwood',targetX:80,targetY:24,label:'🌲 Estrada de Ironwood'},
  ]),
});

export const GRAND_FROSTPEAK_BUILTIN_WORLD_CONFIG=Object.freeze({
  ...GRAND_FROSTPEAK_MAP,
  spawnPoint:{x:GRAND_FROSTPEAK_MAP.spawnX,y:GRAND_FROSTPEAK_MAP.spawnY},
  townCenter:{x:GRAND_FROSTPEAK_MAP.townX,y:GRAND_FROSTPEAK_MAP.townY},
  portals:GRAND_FROSTPEAK_MAP.portals.filter(portal=>portal.targetMap==='eldoria'||portal.targetMap==='emberhold'||portal.targetMap==='ironwood'||portal.targetMap==='crystal_deep').map(portal=>({pos:{x:portal.x,y:portal.y},targetMap:portal.targetMap,targetSpawn:{x:portal.targetX,y:portal.targetY},label:portal.label})),
});

export const GRAND_FROSTPEAK_NPC_MOVES=Object.freeze({
  quest_frostpeak:{from:[63,40],to:[74,100]},
  merchant_frostpeak:{from:[67,40],to:[58,82]},
  warden_frostpeak:{from:[65,42],to:[124,82]},
  task_master_frostpeak:{from:[64,42],to:[46,104]},
});

export const GRAND_FROSTPEAK_HOUSE_MOVES=Object.freeze({
  house_frostwatch:{from:[58,31,60,35],to:[32,124,34,123]},
  house_snowpine:{from:[68,46,70,45],to:[118,124,120,123]},
});

export const GRAND_FROSTPEAK_MONSTER_MOVES=Object.freeze({
  frostpeak_snow_stalker:{from:[18,41],to:[18,118]},
  frostpeak_icefang_wolf:{from:[26,48],to:[16,56]},
  frostpeak_frost_cultist:{from:[34,55],to:[142,122]},
  frostpeak_glacier_golem:{from:[42,62],to:[142,48]},
  frostpeak_yeti_warmaster:{from:[50,69],to:[48,148]},
  frostpeak_skadi_the_white:{from:[58,34],to:[112,148]},
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
  if(!Array.isArray(portals)||portals.length!==3)return false;
  return ['eldoria','emberhold','crystal_deep'].every(target=>portals.some(portal=>portal?.targetMap===target));
}
function patchMap(map){
  const width=map.width===undefined?80:Number(map.width),height=map.height===undefined?80:Number(map.height);
  const spawnX=Number(map.spawnX??65),spawnY=Number(map.spawnY??40),townX=Number(map.townX??65),townY=Number(map.townY??40);
  const legacyCoordinates=width===80&&height===80&&knownPair(spawnX,spawnY,[[65,40],[70,40]])&&townX===65&&townY===40;
  if(!legacyCoordinates)return false;
  let changed=false;const set=(key,value)=>{if(JSON.stringify(map[key])!==JSON.stringify(value)){map[key]=clone(value);changed=true;}};
  set('width',160);set('height',160);set('settlementClass','capital');set('urbanPlan','terraced-bastion');set('urbanBounds',GRAND_FROSTPEAK_MAP.urbanBounds);
  set('spawnX',80);set('spawnY',104);set('townX',80);set('townY',76);set('townRange',18);
  if(!map.cityStyle||map.cityStyle==='alpine')set('cityStyle','alpine');
  if(!map.cityAccent)set('cityAccent',GRAND_FROSTPEAK_MAP.cityAccent);if(!map.roofColor)set('roofColor',GRAND_FROSTPEAK_MAP.roofColor);if(!map.wallColor)set('wallColor',GRAND_FROSTPEAK_MAP.wallColor);if(!map.roadColor)set('roadColor',GRAND_FROSTPEAK_MAP.roadColor);
  if(!Array.isArray(map.districts)||map.districts.length===0)set('districts',GRAND_FROSTPEAK_MAP.districts);
  if(!Array.isArray(map.landmarks)||map.landmarks.length===0)set('landmarks',GRAND_FROSTPEAK_MAP.landmarks);
  if(!Array.isArray(map.props)||map.props.length===0)set('props',GRAND_FROSTPEAK_MAP.props);
  if(map.residentialRingEnabled===undefined||map.residentialRingEnabled===true)set('residentialRingEnabled',false);if(map.residentialRingDensity===undefined||Number(map.residentialRingDensity)<=5)set('residentialRingDensity',0);
  if(!Array.isArray(map.portals)||map.portals.length===0||legacyPortalSet(map.portals))set('portals',GRAND_FROSTPEAK_MAP.portals);
  return changed;
}

export function migrateGrandFrostpeakData(data){
  if(!data||typeof data!=='object'||Array.isArray(data))return false;
  const maps=Array.isArray(data.maps)?data.maps:[];const frostpeak=maps.find(map=>map?.id==='frostpeak');if(!frostpeak)return false;
  let changed=patchMap(frostpeak);
  const grandTopology=Number(frostpeak.width)===160&&Number(frostpeak.height)===160&&frostpeak.settlementClass==='capital'&&frostpeak.urbanPlan==='terraced-bastion';
  if(!changed&&!grandTopology)return false;
  const incoming=[
    ['eldoria',[[70,40]],[28,82]],
    ['ironwood',[[68,40]],[80,136]],
    ['emberhold',[[12,70]],[130,112]],
    ['crystal_deep',[[40,12]],[80,20]],
  ];
  for(const [mapId,legacyTargets,target] of incoming){const map=maps.find(entry=>entry?.id===mapId);for(const portal of Array.isArray(map?.portals)?map.portals:[]){const tx=portal.targetX??portal.targetSpawn?.x,ty=portal.targetY??portal.targetSpawn?.y;if(portal?.targetMap==='frostpeak'&&knownPair(tx,ty,legacyTargets)){patchPortalTarget(portal,target);changed=true;}}}
  for(const npc of Array.isArray(data.npcs)?data.npcs:[])if(npc?.mapId==='frostpeak'&&patchExactPosition(npc,GRAND_FROSTPEAK_NPC_MOVES[npc.id]))changed=true;
  for(const monster of Array.isArray(data.monsters)?data.monsters:[])if(monster?.mapId==='frostpeak'&&patchExactPosition(monster,GRAND_FROSTPEAK_MONSTER_MOVES[monster.id]))changed=true;
  for(const house of Array.isArray(data.houses)?data.houses:[])if(house?.mapId==='frostpeak'&&patchHouse(house,GRAND_FROSTPEAK_HOUSE_MOVES[house.id]))changed=true;
  for(const node of Array.isArray(data.nodes)?data.nodes:[])if(node?.id==='node_frostpeak'&&node?.mapId==='frostpeak'&&samePoint(node,65,40,'x','y')){node.x=80;node.y=76;changed=true;}
  return changed;
}
