// ===================================================================
// MOR'IA 9.40 — GRAND SHADOWFEN AUTHORITATIVE CONTENT CONTRACT
// A stilted marsh capital divided by canals, boardwalks and causeways.
// Exact legacy defaults migrate while administrator-authored geometry wins.
// ===================================================================

export const GRAND_SHADOWFEN_VERSION = 1;
export const GRAND_CAPITAL_SCHEMA_VERSION = 6;

function clone(value){return JSON.parse(JSON.stringify(value));}
function samePoint(record,x,y,xKey='posX',yKey='posY'){return Number(record?.[xKey])===x&&Number(record?.[yKey])===y;}
function knownPair(x,y,pairs){return pairs.some(pair=>Number(x)===pair[0]&&Number(y)===pair[1]);}

const districts=Object.freeze([
  {id:'shadowfen_fen_court',name:'Corte do Pântano',icon:'♜',x:80,y:82,radius:12,color:'#a8c879'},
  {id:'shadowfen_lantern_market',name:'Mercado das Lanternas',icon:'⚖',x:60,y:88,radius:10,color:'#b4b66c'},
  {id:'shadowfen_apothecary',name:'Bairro dos Boticários',icon:'🧪',x:38,y:48,radius:10,color:'#8db878'},
  {id:'shadowfen_hunters',name:'Passarelas dos Caçadores',icon:'🏹',x:40,y:110,radius:11,color:'#75996b'},
  {id:'shadowfen_drowned_chapel',name:'Bairro da Capela Afogada',icon:'☾',x:120,y:48,radius:10,color:'#88aaa0'},
  {id:'shadowfen_gravewater',name:'Águas Mortas',icon:'☠',x:122,y:70,radius:10,color:'#748c7a'},
  {id:'shadowfen_ferrymen',name:'Alcance dos Barqueiros',icon:'⚓',x:120,y:94,radius:11,color:'#6f9a8d'},
  {id:'shadowfen_peatworks',name:'Turfeiras',icon:'⚒',x:122,y:120,radius:10,color:'#8b785d'},
  {id:'shadowfen_reed_commons',name:'Comuns dos Juncos',icon:'⌂',x:80,y:120,radius:12,color:'#88a36d'},
  {id:'shadowfen_crystal_sink',name:'Sumidouro de Cristal',icon:'💎',x:134,y:82,radius:8,color:'#739fa4'},
  {id:'shadowfen_void_breach',name:'Brecha do Vazio',icon:'☠',x:26,y:34,radius:8,color:'#7d6b91'},
  {id:'shadowfen_south_causeway',name:'Calçada de Eldoria',icon:'▽',x:80,y:136,radius:9,color:'#a69b72'},
]);

const landmarks=Object.freeze([
  {id:'shadowfen_fen_court_hall',name:'Salão da Corte do Pântano',kind:'keep',icon:'♜',x:72,y:72,w:16,h:12},
  {id:'shadowfen_lantern_market',name:'Mercado das Lanternas',kind:'market',icon:'⚖',x:58,y:88,w:12,h:9},
  {id:'shadowfen_apothecary_hall',name:'Casa dos Boticários',kind:'house',icon:'🧪',x:28,y:42,w:13,h:9},
  {id:'shadowfen_hunters_lodge',name:'Pavilhão dos Caçadores',kind:'lodge',icon:'🏹',x:30,y:104,w:13,h:10},
  {id:'shadowfen_drowned_chapel',name:'Capela Afogada',kind:'temple',icon:'☾',x:112,y:40,w:13,h:10},
  {id:'shadowfen_gravewater_necropolis',name:'Necrópole das Águas Mortas',kind:'graveyard',icon:'☠',x:116,y:62,w:12,h:10},
  {id:'shadowfen_grand_ferryman_wharf',name:'Grande Cais dos Barqueiros',kind:'dock',icon:'⚓',x:112,y:86,w:14,h:10},
  {id:'shadowfen_peatworks',name:'Oficinas de Turfa',kind:'forge',icon:'⚒',x:116,y:112,w:12,h:10},
  {id:'shadowfen_reedwatch_barracks',name:'Quartel Reedwatch',kind:'tower',icon:'🛡',x:68,y:108,w:13,h:10},
  {id:'shadowfen_bog_arena',name:'Arena do Lodo',kind:'arena',icon:'⚔',x:88,y:108,w:14,h:12},
  {id:'shadowfen_fog_archive',name:'Arquivo da Névoa',kind:'library',icon:'▤',x:70,y:54,w:12,h:9},
  {id:'shadowfen_rotcap_exchange',name:'Bolsa Rotcap',kind:'market',icon:'🍄',x:42,y:72,w:11,h:9},
  {id:'shadowfen_warden_hall',name:'Salão dos Guardiões do Brejo',kind:'keep',icon:'🛡',x:92,y:72,w:12,h:10},
  {id:'shadowfen_herbal_conservatory',name:'Jardim dos Ervanários',kind:'house',icon:'🌿',x:28,y:64,w:13,h:9},
  {id:'shadowfen_east_ferry',name:'Doca da Névoa Leste',kind:'dock',icon:'⚓',x:126,y:88,w:10,h:8},
  {id:'shadowfen_crystal_watch',name:'Torre do Sumidouro',kind:'tower',icon:'💎',x:132,y:76,w:8,h:12},
  {id:'shadowfen_void_watch',name:'Torre da Brecha',kind:'tower',icon:'☠',x:20,y:28,w:8,h:12},
  {id:'shadowfen_eldoria_gate',name:'Portão da Calçada Sul',kind:'gate',icon:'▽',x:72,y:130,w:16,h:8},
  {id:'shadowfen_lantern_tower',name:'Torre da Lanterna Verde',kind:'tower',icon:'✦',x:94,y:46,w:10,h:10},
  {id:'shadowfen_miremother_shrine',name:'Santuário da Mãe do Lodo',kind:'temple',icon:'🐊',x:92,y:92,w:12,h:9},
]);

export const GRAND_SHADOWFEN_MINOR_ARCHITECTURE=Object.freeze([
  {id:'shadowfen_stilt_01',name:'Palafita dos Boticários I',kind:'house',icon:'⌂',x:22,y:52,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_02',name:'Palafita dos Boticários II',kind:'house',icon:'⌂',x:34,y:54,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_03',name:'Casa dos Coletores',kind:'house',icon:'⌂',x:44,y:42,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_04',name:'Palafita da Névoa I',kind:'house',icon:'⌂',x:58,y:42,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_05',name:'Palafita da Névoa II',kind:'house',icon:'⌂',x:70,y:40,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_06',name:'Casa dos Lanternistas',kind:'house',icon:'⌂',x:82,y:42,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_07',name:'Casa dos Peregrinos Afogados',kind:'house',icon:'⌂',x:106,y:54,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_08',name:'Palafita Gravewater I',kind:'house',icon:'⌂',x:130,y:54,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_09',name:'Palafita Gravewater II',kind:'house',icon:'⌂',x:132,y:64,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_10',name:'Casa Rotcap I',kind:'house',icon:'⌂',x:28,y:78,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_11',name:'Casa Rotcap II',kind:'house',icon:'⌂',x:36,y:86,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_12',name:'Palafita do Mercado I',kind:'house',icon:'⌂',x:58,y:100,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_13',name:'Palafita do Mercado II',kind:'house',icon:'⌂',x:70,y:96,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_14',name:'Casa dos Guardiões',kind:'house',icon:'⌂',x:86,y:58,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_15',name:'Casa dos Barqueiros I',kind:'house',icon:'⌂',x:104,y:100,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_16',name:'Casa dos Barqueiros II',kind:'house',icon:'⌂',x:126,y:100,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_17',name:'Palafita dos Caçadores I',kind:'house',icon:'⌂',x:22,y:116,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_18',name:'Palafita dos Caçadores II',kind:'house',icon:'⌂',x:44,y:120,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_19',name:'Comuns dos Juncos I',kind:'house',icon:'⌂',x:58,y:124,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_20',name:'Comuns dos Juncos II',kind:'house',icon:'⌂',x:92,y:124,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_21',name:'Casa dos Turfeiros I',kind:'house',icon:'⌂',x:108,y:128,w:6,h:5,showOnMinimap:false},
  {id:'shadowfen_stilt_22',name:'Casa dos Turfeiros II',kind:'house',icon:'⌂',x:124,y:126,w:6,h:5,showOnMinimap:false},
]);

function buildProps(){
  const props=[];let serial=1;
  const add=(kind,x,y,color='#8fb85a',label)=>props.push({id:`shadowfen_prop_${serial++}`,kind,x,y,color,...(label?{label}:{})});
  for(const y of [54,82,110,136])for(let x=24;x<=136;x+=8)add('lamp',x,y,'#bfd66f');
  for(const [x,y] of [[24,46],[48,50],[58,62],[34,94],[48,118],[106,34],[128,52],[132,72],[112,104],[132,122],[88,132]])add('mushroom',x,y,'#93b95c');
  for(const [x,y] of [[112,58],[120,58],[130,76],[118,78],[104,66],[128,106],[116,104]])add('grave',x,y,'#78806d');
  for(const [x,y] of [[60,92],[66,92],[108,92],[118,100],[124,104],[44,114]])add('barrel',x,y,'#6f5b43');
  for(const [x,y] of [[36,116],[52,122],[104,120],[132,112]])add('cart',x,y,'#705d45');
  for(const [x,y] of [[108,88],[118,84],[130,94]])add('anchor',x,y,'#739394');
  for(const [x,y,label] of [[80,66,'Corte do Pântano'],[60,84,'Mercado das Lanternas'],[38,58,'Boticários'],[40,100,'Caçadores'],[120,54,'Capela Afogada'],[120,82,'Barqueiros'],[122,108,'Turfeiras'],[80,126,'Calçada Sul']])add('sign',x,y,'#a8c879',label);
  return props.slice(0,128);
}

export const GRAND_SHADOWFEN_MAP=Object.freeze({
  id:'shadowfen',name:'Shadowfen',biome:'swamp',
  description:'Capital do brejo: bairros em palafitas ligados por calçadas, pontes e canais sinuosos sob lanternas e névoa.',
  width:160,height:160,settlementClass:'capital',urbanPlan:'marsh-wards',urbanBounds:{x:18,y:18,width:124,height:124},
  levelRequired:20,seed:7,spawnX:80,spawnY:118,townX:80,townY:82,townRange:18,
  cityStyle:'marsh',cityAccent:'#8fb85a',roofColor:'#2d3a2b',wallColor:'#6f7158',roadColor:'#715f48',
  residentialRingEnabled:false,residentialRingDensity:0,
  districts,landmarks:Object.freeze([...landmarks,...GRAND_SHADOWFEN_MINOR_ARCHITECTURE]),props:Object.freeze(buildProps()),access:'public',
  portals:Object.freeze([
    {x:80,y:141,targetMap:'eldoria',targetX:130,targetY:120,label:'🏰 Calçada de Eldoria'},
    {x:18,y:34,targetMap:'voidlands',targetX:70,targetY:70,label:'☠ Brecha do Vazio'},
    {x:141,y:82,targetMap:'crystal_deep',targetX:22,targetY:84,label:'💎 Sumidouro de Cristal'},
  ]),
});

export const GRAND_SHADOWFEN_BUILTIN_WORLD_CONFIG=Object.freeze({
  ...GRAND_SHADOWFEN_MAP,
  spawnPoint:{x:GRAND_SHADOWFEN_MAP.spawnX,y:GRAND_SHADOWFEN_MAP.spawnY},
  townCenter:{x:GRAND_SHADOWFEN_MAP.townX,y:GRAND_SHADOWFEN_MAP.townY},
  portals:GRAND_SHADOWFEN_MAP.portals.filter(portal=>portal.targetMap==='eldoria'||portal.targetMap==='voidlands'||portal.targetMap==='crystal_deep').map(portal=>({pos:{x:portal.x,y:portal.y},targetMap:portal.targetMap,targetSpawn:{x:portal.targetX,y:portal.targetY},label:portal.label})),
});

export const GRAND_SHADOWFEN_NPC_MOVES=Object.freeze({
  quest_shadowfen:{from:[38,65],to:[78,100]},
  merchant_shadowfen:{from:[42,65],to:[62,86]},
  warden_shadowfen:{from:[40,67],to:[124,82]},
  task_master_shadowfen:{from:[39,63],to:[46,110]},
});
export const GRAND_SHADOWFEN_HOUSE_MOVES=Object.freeze({
  house_mirelight:{from:[30,58,32,57],to:[24,122,26,121]},
  house_fenwarden:{from:[47,60,49,59],to:[132,116,134,115]},
});
export const GRAND_SHADOWFEN_MONSTER_MOVES=Object.freeze({
  shadowfen_bog_leech:{from:[18,48],to:[12,118]},
  shadowfen_rotcap_fungus:{from:[26,55],to:[14,54]},
  shadowfen_fen_witch:{from:[34,62],to:[146,118]},
  shadowfen_drowned_knight:{from:[42,69],to:[146,48]},
  shadowfen_plague_abomination:{from:[50,34],to:[48,150]},
  shadowfen_miremother:{from:[58,41],to:[112,150]},
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
  return ['eldoria','voidlands','crystal_deep'].every(target=>portals.some(portal=>portal?.targetMap===target));
}
function patchMap(map){
  const width=map.width===undefined?80:Number(map.width),height=map.height===undefined?80:Number(map.height);
  const spawnX=Number(map.spawnX??40),spawnY=Number(map.spawnY??65),townX=Number(map.townX??40),townY=Number(map.townY??65);
  const legacyCoordinates=width===80&&height===80&&spawnX===40&&knownPair(spawnX,spawnY,[[40,65],[40,70]])&&townX===40&&townY===65;
  if(!legacyCoordinates)return false;
  let changed=false;const set=(key,value)=>{if(JSON.stringify(map[key])!==JSON.stringify(value)){map[key]=clone(value);changed=true;}};
  set('width',160);set('height',160);set('settlementClass','capital');set('urbanPlan','marsh-wards');set('urbanBounds',GRAND_SHADOWFEN_MAP.urbanBounds);
  set('levelRequired',20);set('spawnX',80);set('spawnY',118);set('townX',80);set('townY',82);set('townRange',18);
  if(!map.cityStyle||map.cityStyle==='marsh')set('cityStyle','marsh');
  if(!map.cityAccent)set('cityAccent',GRAND_SHADOWFEN_MAP.cityAccent);if(!map.roofColor)set('roofColor',GRAND_SHADOWFEN_MAP.roofColor);if(!map.wallColor)set('wallColor',GRAND_SHADOWFEN_MAP.wallColor);if(!map.roadColor)set('roadColor',GRAND_SHADOWFEN_MAP.roadColor);
  if(!Array.isArray(map.districts)||map.districts.length===0)set('districts',GRAND_SHADOWFEN_MAP.districts);
  if(!Array.isArray(map.landmarks)||map.landmarks.length===0)set('landmarks',GRAND_SHADOWFEN_MAP.landmarks);
  if(!Array.isArray(map.props)||map.props.length===0)set('props',GRAND_SHADOWFEN_MAP.props);
  if(map.residentialRingEnabled===undefined||map.residentialRingEnabled===true)set('residentialRingEnabled',false);if(map.residentialRingDensity===undefined||Number(map.residentialRingDensity)<=5)set('residentialRingDensity',0);
  if(!Array.isArray(map.portals)||map.portals.length===0||legacyPortalSet(map.portals))set('portals',GRAND_SHADOWFEN_MAP.portals);
  return changed;
}

export function migrateGrandShadowfenData(data){
  if(!data||typeof data!=='object'||Array.isArray(data))return false;
  const maps=Array.isArray(data.maps)?data.maps:[];const shadowfen=maps.find(map=>map?.id==='shadowfen');if(!shadowfen)return false;
  let changed=patchMap(shadowfen);
  const grandTopology=Number(shadowfen.width)===160&&Number(shadowfen.height)===160&&shadowfen.settlementClass==='capital'&&shadowfen.urbanPlan==='marsh-wards';
  if(!changed&&!grandTopology)return false;
  const incoming=[
    ['eldoria',[[40,70]],[80,138]],
    ['voidlands',[[12,12]],[22,34]],
    ['crystal_deep',[[68,40]],[138,82]],
  ];
  for(const [mapId,legacyTargets,target]of incoming){const map=maps.find(entry=>entry?.id===mapId);for(const portal of Array.isArray(map?.portals)?map.portals:[]){const tx=portal.targetX??portal.targetSpawn?.x,ty=portal.targetY??portal.targetSpawn?.y;if(portal?.targetMap==='shadowfen'&&knownPair(tx,ty,legacyTargets)){patchPortalTarget(portal,target);changed=true;}}}
  for(const npc of Array.isArray(data.npcs)?data.npcs:[])if(npc?.mapId==='shadowfen'&&patchExactPosition(npc,GRAND_SHADOWFEN_NPC_MOVES[npc.id]))changed=true;
  for(const monster of Array.isArray(data.monsters)?data.monsters:[])if(monster?.mapId==='shadowfen'&&patchExactPosition(monster,GRAND_SHADOWFEN_MONSTER_MOVES[monster.id]))changed=true;
  for(const house of Array.isArray(data.houses)?data.houses:[])if(house?.mapId==='shadowfen'&&patchHouse(house,GRAND_SHADOWFEN_HOUSE_MOVES[house.id]))changed=true;
  for(const node of Array.isArray(data.nodes)?data.nodes:[])if(node?.id==='node_shadowfen'&&node?.mapId==='shadowfen'&&samePoint(node,40,65,'x','y')){node.x=80;node.y=82;changed=true;}
  return changed;
}
