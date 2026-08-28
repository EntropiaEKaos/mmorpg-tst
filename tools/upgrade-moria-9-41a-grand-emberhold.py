from pathlib import Path

ROOT=Path('.')

def write(path,text):
    p=ROOT/path; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(text,encoding='utf-8')

def replace_once(path,old,new,label):
    p=ROOT/path; text=p.read_text(encoding='utf-8')
    if new in text:return
    if old not in text:raise SystemExit(f'{label} anchor missing in {path}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')

grand=r'''// ===================================================================
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
'''
write('server/engine/GrandEmberhold.mjs',grand)

# Alpha pack now publishes the authoritative capital while legacy coordinate
# generators intentionally remain in place for safe migration coverage.
replace_once('server/engine/AlphaContent.mjs',
"import { GRAND_SHADOWFEN_MAP } from './GrandShadowfen.mjs';",
"import { GRAND_SHADOWFEN_MAP } from './GrandShadowfen.mjs';\nimport { GRAND_EMBERHOLD_MAP } from './GrandEmberhold.mjs';",
'Grand Emberhold AlphaContent import')
replace_once('server/engine/AlphaContent.mjs',
"  if (region.id === 'shadowfen') return { ...GRAND_SHADOWFEN_MAP, portals: GRAND_SHADOWFEN_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_SHADOWFEN_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_SHADOWFEN_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_SHADOWFEN_MAP.props.map(entry => ({ ...entry })) };",
"  if (region.id === 'shadowfen') return { ...GRAND_SHADOWFEN_MAP, portals: GRAND_SHADOWFEN_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_SHADOWFEN_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_SHADOWFEN_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_SHADOWFEN_MAP.props.map(entry => ({ ...entry })) };\n  if (region.id === 'emberhold') return { ...GRAND_EMBERHOLD_MAP, portals: GRAND_EMBERHOLD_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_EMBERHOLD_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_EMBERHOLD_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_EMBERHOLD_MAP.props.map(entry => ({ ...entry })) };",
'Grand Emberhold AlphaContent selection')

# Server world: add the authoritative built-in and a sixth topology algorithm.
replace_once('server/engine/World.mjs',
"import { GRAND_SHADOWFEN_BUILTIN_WORLD_CONFIG } from './GrandShadowfen.mjs';",
"import { GRAND_SHADOWFEN_BUILTIN_WORLD_CONFIG } from './GrandShadowfen.mjs';\nimport { GRAND_EMBERHOLD_BUILTIN_WORLD_CONFIG } from './GrandEmberhold.mjs';",
'Grand Emberhold World import')
replace_once('server/engine/World.mjs',
"const URBAN_PLANS = new Set(['royal-grid','harbor-crescent','forest-rings','terraced-bastion','marsh-wards']);",
"const URBAN_PLANS = new Set(['royal-grid','harbor-crescent','forest-rings','terraced-bastion','marsh-wards','caldera-radials']);",
'Grand Emberhold urban plan vocabulary')
old_builtin="""  emberhold: {
    id: 'emberhold', name: 'Emberhold', description: 'Volcanic desert. Scorched earth and lava.', biome: 'desert',
    spawnPoint: { x: 70, y: 10 }, townCenter: { x: 65, y: 15 }, townRange: 8, seed: 999,
    portals: [
      { pos: { x: 75, y: 10 }, targetMap: 'frostpeak', targetSpawn: { x: 130, y: 112 }, label: '❄ To Frostpeak' },
    ],
  },"""
replace_once('server/engine/World.mjs',old_builtin,"  emberhold: GRAND_EMBERHOLD_BUILTIN_WORLD_CONFIG,",'Grand Emberhold built-in config')
server_algo=r'''

function calderaRadialsTile(config,x,y){
  const bounds=config.urbanBounds;if(!bounds)return null;
  const minX=Number(bounds.x),minY=Number(bounds.y),maxX=minX+Number(bounds.width)-1,maxY=minY+Number(bounds.height)-1;
  if(x<minX||x>maxX||y<minY||y>maxY)return null;
  const cx=config.townCenter.x,cy=config.townCenter.y;
  const portalGate=config.portals.some(portal=>((portal.pos.x===minX||portal.pos.x===maxX)&&x===portal.pos.x&&Math.abs(y-portal.pos.y)<=2)||((portal.pos.y===minY||portal.pos.y===maxY)&&y===portal.pos.y&&Math.abs(x-portal.pos.x)<=2));
  const cardinalGate=((x===minX||x===maxX)&&Math.abs(y-cy)<=2)||((y===minY||y===maxY)&&Math.abs(x-cx)<=2);
  if(portalGate||cardinalGate)return {type:'path',walkable:true,blocksSight:false};
  if(x===minX||x===maxX||y===minY||y===maxY)return {type:'wall',walkable:false,blocksSight:true};
  const dx=x-cx,dy=y-cy,distance=Math.sqrt(dx*dx+dy*dy);
  const radial=Math.abs(dx)<=1||Math.abs(dy)<=1;
  const forgeRing=Math.abs(distance-28)<=1.35||Math.abs(distance-46)<=1.2;
  const serviceRoad=Math.abs(x-(cx-38))<=1||Math.abs(x-(cx+38))<=1||Math.abs(y-(cy-38))<=1||Math.abs(y-(cy+38))<=1;
  const forgeCourts=(x>=30&&x<=52&&y>=48&&y<=70)||(x>=108&&x<=130&&y>=48&&y<=70)||(x>=30&&x<=52&&y>=90&&y<=112)||(x>=108&&x<=130&&y>=90&&y<=112);
  const core=distance<=11;
  const fissureA=Math.abs(dy-Math.round(dx*.45))<=2&&Math.abs(dx)>12;
  const fissureB=Math.abs(dy+Math.round(dx*.52))<=2&&Math.abs(dx)>12;
  const molten=core||fissureA||fissureB;
  const road=radial||forgeRing||serviceRoad||forgeCourts;
  if(molten&&road)return {type:'bridge',walkable:true,blocksSight:false};
  if(molten)return {type:'lava',walkable:false,blocksSight:false};
  if(road)return {type:'path',walkable:true,blocksSight:false};
  return {type:'floor',walkable:true,blocksSight:false};
}
'''
replace_once('server/engine/World.mjs',"\nfunction capitalUrbanTile(config, x, y) {",server_algo+"\nfunction capitalUrbanTile(config, x, y) {",'Grand Emberhold server topology')
replace_once('server/engine/World.mjs',
"  if (config.urbanPlan === 'marsh-wards') return marshWardsTile(config, x, y);",
"  if (config.urbanPlan === 'marsh-wards') return marshWardsTile(config, x, y);\n  if (config.urbanPlan === 'caldera-radials') return calderaRadialsTile(config, x, y);",
'Grand Emberhold server dispatch')

# Client prediction uses the identical explicit topology.
replace_once('src/game/maps.ts',
"export type UrbanPlan = 'royal-grid' | 'harbor-crescent' | 'forest-rings' | 'terraced-bastion' | 'marsh-wards';",
"export type UrbanPlan = 'royal-grid' | 'harbor-crescent' | 'forest-rings' | 'terraced-bastion' | 'marsh-wards' | 'caldera-radials';",
'Grand Emberhold client UrbanPlan')
old_plan="function urbanPlanOf(value: unknown, mapId = ''): UrbanPlan { const fallback: UrbanPlan = mapId === 'sunreach_coast' ? 'harbor-crescent' : mapId === 'ironwood' ? 'forest-rings' : mapId === 'frostpeak' ? 'terraced-bastion' : mapId === 'shadowfen' ? 'marsh-wards' : 'royal-grid'; const requested = String(value || fallback); return requested === 'harbor-crescent' || requested === 'forest-rings' || requested === 'terraced-bastion' || requested === 'marsh-wards' ? requested : 'royal-grid'; }"
new_plan="function urbanPlanOf(value: unknown, mapId = ''): UrbanPlan { const fallback: UrbanPlan = mapId === 'sunreach_coast' ? 'harbor-crescent' : mapId === 'ironwood' ? 'forest-rings' : mapId === 'frostpeak' ? 'terraced-bastion' : mapId === 'shadowfen' ? 'marsh-wards' : mapId === 'emberhold' ? 'caldera-radials' : 'royal-grid'; const requested = String(value || fallback); return requested === 'harbor-crescent' || requested === 'forest-rings' || requested === 'terraced-bastion' || requested === 'marsh-wards' || requested === 'caldera-radials' ? requested : 'royal-grid'; }"
replace_once('src/game/maps.ts',old_plan,new_plan,'Grand Emberhold client urban plan normalization')
client_algo=r'''

function calderaRadialsTile(map: GameMap,x:number,y:number): Tile | null {
  const bounds=map.urbanBounds;if(!bounds)return null;
  const minX=bounds.x,minY=bounds.y,maxX=minX+bounds.width-1,maxY=minY+bounds.height-1;
  if(x<minX||x>maxX||y<minY||y>maxY)return null;
  const cx=map.townCenter.x,cy=map.townCenter.y;
  const portalGate=map.portals.some(portal=>((portal.pos.x===minX||portal.pos.x===maxX)&&x===portal.pos.x&&Math.abs(y-portal.pos.y)<=2)||((portal.pos.y===minY||portal.pos.y===maxY)&&y===portal.pos.y&&Math.abs(x-portal.pos.x)<=2));
  const cardinalGate=((x===minX||x===maxX)&&Math.abs(y-cy)<=2)||((y===minY||y===maxY)&&Math.abs(x-cx)<=2);
  if(portalGate||cardinalGate)return {type:'path',walkable:true,blocksSight:false};
  if(x===minX||x===maxX||y===minY||y===maxY)return {type:'wall',walkable:false,blocksSight:true};
  const dx=x-cx,dy=y-cy,distance=Math.sqrt(dx*dx+dy*dy);
  const radial=Math.abs(dx)<=1||Math.abs(dy)<=1;
  const forgeRing=Math.abs(distance-28)<=1.35||Math.abs(distance-46)<=1.2;
  const serviceRoad=Math.abs(x-(cx-38))<=1||Math.abs(x-(cx+38))<=1||Math.abs(y-(cy-38))<=1||Math.abs(y-(cy+38))<=1;
  const forgeCourts=(x>=30&&x<=52&&y>=48&&y<=70)||(x>=108&&x<=130&&y>=48&&y<=70)||(x>=30&&x<=52&&y>=90&&y<=112)||(x>=108&&x<=130&&y>=90&&y<=112);
  const core=distance<=11;
  const fissureA=Math.abs(dy-Math.round(dx*.45))<=2&&Math.abs(dx)>12;
  const fissureB=Math.abs(dy+Math.round(dx*.52))<=2&&Math.abs(dx)>12;
  const molten=core||fissureA||fissureB;
  const road=radial||forgeRing||serviceRoad||forgeCourts;
  if(molten&&road)return {type:'bridge',walkable:true,blocksSight:false};
  if(molten)return {type:'lava',walkable:false,blocksSight:false};
  if(road)return {type:'path',walkable:true,blocksSight:false};
  return {type:'floor',walkable:true,blocksSight:false};
}
'''
replace_once('src/game/maps.ts',"\nfunction capitalUrbanTile(map: GameMap, x: number, y: number): Tile | null {",client_algo+"\nfunction capitalUrbanTile(map: GameMap, x: number, y: number): Tile | null {",'Grand Emberhold client topology')
replace_once('src/game/maps.ts',
"  if (map.urbanPlan === 'marsh-wards') return marshWardsTile(map, x, y);",
"  if (map.urbanPlan === 'marsh-wards') return marshWardsTile(map, x, y);\n  if (map.urbanPlan === 'caldera-radials') return calderaRadialsTile(map, x, y);",
'Grand Emberhold client dispatch')

# ContentDB schema 7 applies all historical migrations first and Emberhold last.
replace_once('server/engine/ContentDB.mjs',
"import { GRAND_CAPITAL_SCHEMA_VERSION, migrateGrandShadowfenData } from './GrandShadowfen.mjs';",
"import { migrateGrandShadowfenData } from './GrandShadowfen.mjs';\nimport { GRAND_CAPITAL_SCHEMA_VERSION, migrateGrandEmberholdData } from './GrandEmberhold.mjs';",
'Grand Emberhold ContentDB import')
replace_once('server/engine/ContentDB.mjs',
"    // Every capital migration is idempotent and exact-default-only. Schema 6 adds Shadowfen.",
"    // Every capital migration is idempotent and exact-default-only. Schema 7 adds Emberhold.",
'Grand Emberhold ContentDB schema comment')
replace_once('server/engine/ContentDB.mjs',
"    migrateGrandShadowfenData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;",
"    migrateGrandShadowfenData(this.data);\n    migrateGrandEmberholdData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;",
'Grand Emberhold loaded DB chain')
replace_once('server/engine/ContentDB.mjs',
"    migrateGrandShadowfenData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;\n\n    this.save();",
"    migrateGrandShadowfenData(this.data);\n    migrateGrandEmberholdData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;\n\n    this.save();",
'Grand Emberhold fresh seed chain')

# Frostpeak canonical arrival now points into the promoted north gate of Emberhold.
replace_once('server/engine/GrandFrostpeak.mjs',
"{x:133,y:112,targetMap:'emberhold',targetX:70,targetY:10,label:'🌋 Passagem de Emberhold'}",
"{x:133,y:112,targetMap:'emberhold',targetX:80,targetY:22,label:'🌋 Passagem de Emberhold'}",
'Frostpeak to Grand Emberhold arrival')

# Historical foundation tests keep a truly unpromoted 80×80 sentinel.
replace_once('server/test/grand-capital-foundation-9-35.test.mjs',
"  assert.equal(world.getMap('emberhold').width, MAP_WIDTH);\n  assert.equal(world.getMap('emberhold').height, MAP_HEIGHT);",
"  assert.equal(world.getMap('voidlands').width, MAP_WIDTH);\n  assert.equal(world.getMap('voidlands').height, MAP_HEIGHT);",
'9.35 legacy sentinel')
replace_once('server/test/grand-eldoria-9-36.test.mjs',
"  const emberhold = world.getMap('emberhold');\n  assert.equal(eldoria.width,160); assert.equal(eldoria.height,160); assert.equal(eldoria.settlementClass,'capital');\n  assert.equal(emberhold.width,80); assert.equal(emberhold.height,80);",
"  const voidlands = world.getMap('voidlands');\n  assert.equal(eldoria.width,160); assert.equal(eldoria.height,160); assert.equal(eldoria.settlementClass,'capital');\n  assert.equal(voidlands.width,80); assert.equal(voidlands.height,80);",
'9.36 legacy sentinel')
replace_once('server/test/grand-sunreach-9-37.test.mjs',
"  assert.equal(world.getMap('emberhold').width,80);",
"  assert.equal(world.getMap('voidlands').width,80);",
'9.37 legacy sentinel')
replace_once('server/test/grand-shadowfen-9-40.test.mjs',
"assert.equal(data.grandCapitalVersion,6);const map=data.maps.find(entry=>entry.id==='shadowfen');",
"assert.ok(data.grandCapitalVersion>=6);const map=data.maps.find(entry=>entry.id==='shadowfen');",
'9.40 historical schema compatibility')

focused=r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { GRAND_EMBERHOLD_MAP, GRAND_CAPITAL_SCHEMA_VERSION, migrateGrandEmberholdData } from '../engine/GrandEmberhold.mjs';
import { MAP_CONFIG, URBAN_PLANS, WorldManager } from '../engine/World.mjs';
import { ContentDB } from '../engine/ContentDB.mjs';
import { HousingSystem } from '../engine/HousingSystem.mjs';
import { getContentStudioSchema, validateStudioRecord } from '../engine/ContentStudio.mjs';

const clone=value=>JSON.parse(JSON.stringify(value));
function legacyData(){return{
  maps:[
    {id:'emberhold',width:80,height:80,spawnX:65,spawnY:15,townX:65,townY:15,townRange:8,levelRequired:1,cityStyle:'forge',portals:[
      {x:75,y:10,targetMap:'frostpeak',targetX:130,targetY:112},{x:40,y:70,targetMap:'stormwatch_isle',targetX:40,targetY:10},
    ]},
    {id:'frostpeak',width:160,height:160,portals:[{x:133,y:112,targetMap:'emberhold',targetX:70,targetY:10}]},
    {id:'stormwatch_isle',portals:[{x:40,y:8,targetMap:'emberhold',targetX:40,targetY:68}]},
  ],
  npcs:[{id:'quest_emberhold',mapId:'emberhold',posX:63,posY:15},{id:'merchant_emberhold',mapId:'emberhold',posX:67,posY:15},{id:'warden_emberhold',mapId:'emberhold',posX:65,posY:17},{id:'task_master_emberhold',mapId:'emberhold',posX:63,posY:17}],
  monsters:[
    {id:'emberhold_ash_scorpion',mapId:'emberhold',posX:18,posY:55},{id:'emberhold_cinder_jackal',mapId:'emberhold',posX:26,posY:20},{id:'emberhold_lava_imp',mapId:'emberhold',posX:34,posY:27},{id:'emberhold_ashen_raider',mapId:'emberhold',posX:42,posY:34},{id:'emberhold_magma_golem',mapId:'emberhold',posX:50,posY:41},{id:'emberhold_pyroclast_tyrant',mapId:'emberhold',posX:58,posY:48},
  ],
  houses:[{id:'house_ashstone',mapId:'emberhold',x:56,y:19,width:5,height:4,entranceX:58,entranceY:18},{id:'house_cinderhall',mapId:'emberhold',x:66,y:22,width:5,height:4,entranceX:68,entranceY:21}],
  nodes:[{id:'node_emberhold',mapId:'emberhold',x:65,y:15}],
};}

test('9.41A Grand Emberhold is a 160x160 caldera-radials forge capital',()=>{
  assert.equal(GRAND_CAPITAL_SCHEMA_VERSION,7);assert.equal(GRAND_EMBERHOLD_MAP.width,160);assert.equal(GRAND_EMBERHOLD_MAP.height,160);assert.equal(GRAND_EMBERHOLD_MAP.settlementClass,'capital');assert.equal(GRAND_EMBERHOLD_MAP.urbanPlan,'caldera-radials');assert.equal(GRAND_EMBERHOLD_MAP.levelRequired,28);
  assert.equal(GRAND_EMBERHOLD_MAP.districts.length,12);assert.equal(GRAND_EMBERHOLD_MAP.landmarks.length,42);assert.ok(GRAND_EMBERHOLD_MAP.props.length>=80);
  assert.equal(MAP_CONFIG.emberhold.width,160);assert.equal(MAP_CONFIG.emberhold.urbanPlan,'caldera-radials');assert.ok(URBAN_PLANS.has('caldera-radials'));
});

test('9.41A caldera topology creates molten core fissures rings forge courts and four gates',()=>{
  const map=new WorldManager().getMap('emberhold');let lava=0,bridges=0,paths=0,walls=0;
  for(let y=18;y<=141;y++)for(let x=18;x<=141;x++){const type=map.tiles[y][x].type;if(type==='lava')lava++;else if(type==='bridge')bridges++;else if(type==='path')paths++;else if(type==='wall')walls++;}
  assert.ok(lava>600,`lava=${lava}`);assert.ok(bridges>350,`bridges=${bridges}`);assert.ok(paths>2500,`paths=${paths}`);assert.ok(walls>3000,`walls=${walls}`);
  for(const [x,y]of [[80,18],[80,141],[18,80],[141,80]]){assert.equal(map.tiles[y][x].type,'path',`access ${x},${y}`);assert.equal(map.tiles[y][x].walkable,true);}
  assert.equal(map.tiles[84][84].type,'lava');assert.equal(map.tiles[80][80].type,'bridge');assert.equal(map.tiles[89][100].type,'lava');assert.equal(map.tiles[60][90].type,'floor');
});

test('9.41A legacy migration upgrades exact Emberhold defaults and incoming travel',()=>{
  const data=legacyData();assert.equal(migrateGrandEmberholdData(data),true);const map=data.maps[0];
  assert.deepEqual([map.width,map.height,map.spawnX,map.spawnY,map.townX,map.townY,map.levelRequired],[160,160,80,126,80,80,28]);assert.equal(map.urbanPlan,'caldera-radials');assert.equal(map.portals.length,2);
  assert.deepEqual([data.maps[1].portals[0].targetX,data.maps[1].portals[0].targetY],[80,22]);assert.deepEqual([data.maps[2].portals[0].targetX,data.maps[2].portals[0].targetY],[80,138]);
  assert.deepEqual([data.npcs[0].posX,data.npcs[0].posY],[80,116]);assert.deepEqual([data.npcs[3].posX,data.npcs[3].posY],[46,110]);assert.deepEqual([data.monsters[5].posX,data.monsters[5].posY],[112,150]);
  assert.deepEqual([data.houses[0].x,data.houses[0].y,data.houses[0].entranceX,data.houses[0].entranceY],[26,126,28,125]);assert.deepEqual([data.nodes[0].x,data.nodes[0].y],[80,66]);
  const snapshot=JSON.stringify(data);assert.equal(migrateGrandEmberholdData(data),false);assert.equal(JSON.stringify(data),snapshot);
});

test('9.41A administrator-authored Emberhold geometry blocks collateral migration',()=>{
  const data=legacyData();data.maps[0].width=124;data.maps[0].height=124;data.maps[0].spawnX=60;data.maps[0].spawnY=61;data.maps[0].urbanPlan='royal-grid';data.maps[0].landmarks=[{id:'admin'}];data.npcs[0].posX=61;data.npcs[0].posY=62;
  const before=JSON.stringify(data);assert.equal(migrateGrandEmberholdData(data),false);assert.equal(JSON.stringify(data),before);
});

test('9.41A migrated Emberhold houses remain valid against authoritative architecture',()=>{
  const data=legacyData();migrateGrandEmberholdData(data);const world=new WorldManager();world.syncContentMaps(data.maps);const fakeDb={get(type){return type==='houses'?data.houses:type==='maps'?data.maps:[];}};
  const temp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'moria-ember-housing-')),'housing.json');const housing=new HousingSystem(fakeDb,temp);
  for(const house of data.houses)assert.equal(housing.validateDefinition(house,fakeDb),null,house.id);
});

test('9.41A fresh ContentDB converges Emberhold and advances Grand Capital schema to 7',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moria-941-')),file=path.join(dir,'content.json');try{const db=new ContentDB(file),data=db.getAllContent();assert.equal(data.version,3);assert.equal(data.grandCapitalVersion,7);const map=data.maps.find(entry=>entry.id==='emberhold');assert.deepEqual([map.width,map.height,map.urbanPlan,map.levelRequired],[160,160,'caldera-radials',28]);const npc=data.npcs.find(entry=>entry.id==='quest_emberhold');const node=data.nodes.find(entry=>entry.id==='node_emberhold');assert.deepEqual([npc.posX,npc.posY],[80,116]);assert.deepEqual([node.x,node.y],[80,66]);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('9.41A client server and Studio share caldera-radials vocabulary',()=>{
  const server=fs.readFileSync(new URL('../engine/World.mjs',import.meta.url),'utf8'),client=fs.readFileSync(new URL('../../src/game/maps.ts',import.meta.url),'utf8');
  for(const marker of ['calderaRadialsTile','forgeRing','serviceRoad','forgeCourts','fissureA','fissureB','molten']){assert.ok(server.includes(marker));assert.ok(client.includes(marker));}
  const fakeDb={get(type){return type==='maps'?[clone(GRAND_EMBERHOLD_MAP)]:[];}};const schema=getContentStudioSchema('maps',fakeDb);assert.ok(schema.options.urbanPlans.includes('caldera-radials'));assert.equal(validateStudioRecord('maps',clone(GRAND_EMBERHOLD_MAP),fakeDb),null);
});

test('9.41A six approved capital algorithms remain distinct and reachable',()=>{
  const world=new WorldManager();assert.equal(world.getMap('eldoria').urbanPlan,'royal-grid');assert.equal(world.getMap('sunreach_coast').urbanPlan,'harbor-crescent');assert.equal(world.getMap('ironwood').urbanPlan,'forest-rings');assert.equal(world.getMap('frostpeak').urbanPlan,'terraced-bastion');assert.equal(world.getMap('shadowfen').urbanPlan,'marsh-wards');assert.equal(world.getMap('emberhold').urbanPlan,'caldera-radials');
});
'''
write('server/test/grand-emberhold-9-41.test.mjs',focused)

docs=r'''# Mor'ia 9.41 — Grand Emberhold

## Objetivo

Promover Emberhold de região legada 80×80 para a sexta capital autoritativa 160×160, mantendo identidade própria de cidade vulcânica e industrial em vez de reaproveitar a malha de Eldoria.

## Identidade urbana

- mapa: **160×160**;
- classe: `capital`;
- plano: **`caldera-radials`**;
- área urbana: `18,18 → 141,141`;
- 12 distritos;
- 42 construções autorais (20 marcos maiores + 22 oficinas/residências menores);
- nível canônico: **28**;
- estilo: `forge`.

O centro da capital é um cadinho/caldera de lava. Duas fissuras diagonais atravessam a malha, enquanto avenidas radiais, dois anéis industriais, vias de serviço e quatro grandes pátios de forja formam a circulação. Quando uma via cruza lava, a topologia gera `bridge`; lava fora das travessias continua não caminhável.

## Marcos principais

A Cidadela de Ember, a Grande Fundição, o Bazar das Cinzas, o Conselho do Cadinho, a Arena das Brasas, o Santuário da Chama, a Academia do Magma, a Guilda da Bigorna Negra e a Forja dos Dragões formam o núcleo cívico-industrial. Quatro portões físicos mantêm a capital legível e expansível para rotas futuras.

## Segurança de migração

A migração é **exact-default-only**. Ela só promove a geometria quando Emberhold ainda corresponde aos defaults históricos 80×80 e às posições de spawn/town conhecidas. Geometria criada por administrador bloqueia migração colateral.

Coordenadas históricas de NPCs, task master, monstros, casas e node industrial só mudam se coincidirem exatamente com seus defaults antigos. Entradas vindas de Frostpeak e Stormwatch também são corrigidas apenas quando ainda apontam para os antigos destinos.

## Compatibilidade

- Frostpeak passa a chegar ao novo acesso norte de Emberhold;
- Stormwatch mantém a rota histórica, agora apontando para o acesso sul interno;
- servidor e cliente compartilham o algoritmo explícito `caldera-radials`;
- Content Studio recebe o novo vocabulário pela lista autoritativa `URBAN_PLANS`;
- schema de Grandes Capitais avança de **6 para 7**;
- Voidlands passa a ser a sentinela histórica 80×80 nos testes de fundação enquanto ainda não for promovida.

## Gate 9.41A

A etapa A exige: contratos de fonte, auditoria PT-BR, `npm audit`, typecheck/build do cliente, validação do servidor, teste focado de Emberhold e suíte completa. A capital **não será considerada visualmente aprovada** até a etapa 9.41B gerar screenshots reais de minimapa, City Designer e panorâmica e esses arquivos passarem por inspeção humana.
'''
write('docs/MORIA_9_41_GRAND_EMBERHOLD.md',docs)
