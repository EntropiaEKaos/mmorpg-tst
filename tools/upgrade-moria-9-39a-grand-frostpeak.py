from pathlib import Path

ROOT=Path('.')

def write(path,text):
    p=ROOT/path; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(text,encoding='utf-8')

def replace_once(path,old,new,label):
    p=ROOT/path; text=p.read_text(encoding='utf-8')
    if new in text: return
    if old not in text: raise SystemExit(f'{label} anchor missing in {path}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')

grand=r'''// ===================================================================
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
  width:160,height:160,settlementClass:'capital',urbanPlan:'alpine-terraces',urbanBounds:{x:26,y:18,width:108,height:122},
  levelRequired:15,seed:1337,spawnX:80,spawnY:104,townX:80,townY:76,townRange:18,
  cityStyle:'alpine',cityAccent:'#9dd8ff',roofColor:'#334b67',wallColor:'#cbd4d8',roadColor:'#7f8c92',
  residentialRingEnabled:false,residentialRingDensity:0,
  districts,landmarks:Object.freeze([...landmarks,...GRAND_FROSTPEAK_MINOR_ARCHITECTURE]),props:Object.freeze(buildProps()),access:'public',
  portals:Object.freeze([
    {x:26,y:82,targetMap:'eldoria',targetX:30,targetY:80,label:'🏰 Passagem de Eldoria'},
    {x:133,y:112,targetMap:'emberhold',targetX:70,targetY:10,label:'🌋 Passagem de Emberhold'},
    {x:80,y:18,targetMap:'crystal_deep',targetX:40,targetY:70,label:'💎 Descida do Cristal'},
  ]),
});

export const GRAND_FROSTPEAK_BUILTIN_WORLD_CONFIG=Object.freeze({
  ...GRAND_FROSTPEAK_MAP,
  spawnPoint:{x:GRAND_FROSTPEAK_MAP.spawnX,y:GRAND_FROSTPEAK_MAP.spawnY},
  townCenter:{x:GRAND_FROSTPEAK_MAP.townX,y:GRAND_FROSTPEAK_MAP.townY},
  portals:GRAND_FROSTPEAK_MAP.portals.filter(portal=>portal.targetMap==='eldoria'||portal.targetMap==='emberhold').map(portal=>({pos:{x:portal.x,y:portal.y},targetMap:portal.targetMap,targetSpawn:{x:portal.targetX,y:portal.targetY},label:portal.label})),
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
  frostpeak_glacier_golem:{from:[42,20],to:[142,48]},
  frostpeak_yeti_warmaster:{from:[50,27],to:[48,148]},
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
  set('width',160);set('height',160);set('settlementClass','capital');set('urbanPlan','alpine-terraces');set('urbanBounds',GRAND_FROSTPEAK_MAP.urbanBounds);
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
  const grandTopology=Number(frostpeak.width)===160&&Number(frostpeak.height)===160&&frostpeak.settlementClass==='capital'&&frostpeak.urbanPlan==='alpine-terraces';
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
'''
write('server/engine/GrandFrostpeak.mjs',grand)

replace_once('server/engine/World.mjs',"import { GRAND_IRONWOOD_BUILTIN_WORLD_CONFIG } from './GrandIronwood.mjs';","import { GRAND_IRONWOOD_BUILTIN_WORLD_CONFIG } from './GrandIronwood.mjs';\nimport { GRAND_FROSTPEAK_BUILTIN_WORLD_CONFIG } from './GrandFrostpeak.mjs';",'World Frostpeak import')
replace_once('server/engine/World.mjs',"const URBAN_PLANS = new Set(['royal-grid','harbor-crescent','forest-rings']);","const URBAN_PLANS = new Set(['royal-grid','harbor-crescent','forest-rings','alpine-terraces']);",'World alpine plan')
old_frost="""  frostpeak: {
    id: 'frostpeak', name: 'Frostpeak', description: 'Frozen mountain city. Frigid and deadly.', biome: 'snow',
    spawnPoint: { x: 70, y: 40 }, townCenter: { x: 65, y: 40 }, townRange: 8, seed: 1337,
    portals: [
      { pos: { x: 75, y: 40 }, targetMap: 'eldoria', targetSpawn: { x: 30, y: 80 }, label: '🌳 To Eldoria' },
      { pos: { x: 10, y: 70 }, targetMap: 'emberhold', targetSpawn: { x: 70, y: 10 }, label: '🌋 To Emberhold' },
    ],
  },"""
replace_once('server/engine/World.mjs',old_frost,"  frostpeak: GRAND_FROSTPEAK_BUILTIN_WORLD_CONFIG,",'World Frostpeak config')
replace_once('server/engine/World.mjs',"  const defaultUrbanPlan = id === 'sunreach_coast' ? 'harbor-crescent' : id === 'ironwood' ? 'forest-rings' : 'royal-grid';","  const defaultUrbanPlan = id === 'sunreach_coast' ? 'harbor-crescent' : id === 'ironwood' ? 'forest-rings' : id === 'frostpeak' ? 'alpine-terraces' : 'royal-grid';",'World Frostpeak default plan')

alpine=r'''
function alpineCapitalTile(config, x, y) {
  const bounds=config.urbanBounds; if(!bounds)return null;
  const minX=Number(bounds.x),minY=Number(bounds.y),maxX=minX+Number(bounds.width)-1,maxY=minY+Number(bounds.height)-1;
  if(x<minX||x>maxX||y<minY||y>maxY)return null;
  const cx=config.townCenter.x,cy=config.townCenter.y;
  const portalGate=config.portals.some(portal=>((portal.pos.x===minX||portal.pos.x===maxX)&&x===portal.pos.x&&Math.abs(y-portal.pos.y)<=2)||((portal.pos.y===minY||portal.pos.y===maxY)&&y===portal.pos.y&&Math.abs(x-portal.pos.x)<=2));
  const lowerGate=y===maxY&&Math.abs(x-cx)<=2;
  if(portalGate||lowerGate)return {type:'path',walkable:true,blocksSight:false};
  if(x===minX||x===maxX||y===minY||y===maxY)return {type:'wall',walkable:false,blocksSight:true};
  const retaining=[42,66,90,114].includes(y);
  const ramp=Math.abs(x-cx)<=2||Math.abs(x-(cx-30))<=1||Math.abs(x-(cx+30))<=1;
  if(retaining&&!ramp)return {type:'wall',walkable:false,blocksSight:true};
  const vertical=ramp;
  const terraceRoad=[34,58,82,106,130].some(line=>Math.abs(y-line)<=1);
  const highCourt=x>=cx-16&&x<=cx+16&&y>=26&&y<=38;
  const forgeCourt=x>=42&&x<=62&&y>=72&&y<=86;
  const expeditionCourt=x>=98&&x<=122&&y>=72&&y<=86;
  const lowerCourt=x>=cx-14&&x<=cx+14&&y>=96&&y<=108;
  return {type:(vertical||terraceRoad||highCourt||forgeCourt||expeditionCourt||lowerCourt)?'path':'floor',walkable:true,blocksSight:false};
}

'''
replace_once('server/engine/World.mjs',"\nfunction capitalUrbanTile(config, x, y) {\n","\n"+alpine+"function capitalUrbanTile(config, x, y) {\n",'World alpine generator insert')
replace_once('server/engine/World.mjs',"  if (config.urbanPlan === 'forest-rings') return forestCapitalTile(config, x, y);","  if (config.urbanPlan === 'forest-rings') return forestCapitalTile(config, x, y);\n  if (config.urbanPlan === 'alpine-terraces') return alpineCapitalTile(config, x, y);",'World alpine dispatch')

replace_once('server/engine/GrandEldoria.mjs',"{ x:28, y:80, targetMap:'frostpeak', targetX:70, targetY:40, label:'❄ Passagem de Frostpeak' },","{ x:28, y:80, targetMap:'frostpeak', targetX:28, targetY:82, label:'❄ Passagem de Frostpeak' },",'Eldoria Frostpeak arrival')
replace_once('server/engine/GrandIronwood.mjs',"{ x:80, y:22, targetMap:'frostpeak', targetX:68, targetY:40, label:'❄ Estrada da Geada' },","{ x:80, y:22, targetMap:'frostpeak', targetX:80, targetY:136, label:'❄ Estrada da Geada' },",'Ironwood Frostpeak arrival')

replace_once('server/engine/AlphaContent.mjs',"import { GRAND_IRONWOOD_MAP } from './GrandIronwood.mjs';","import { GRAND_IRONWOOD_MAP } from './GrandIronwood.mjs';\nimport { GRAND_FROSTPEAK_MAP } from './GrandFrostpeak.mjs';",'Alpha Frostpeak import')
iron_special="  if (region.id === 'ironwood') return { ...GRAND_IRONWOOD_MAP, portals: GRAND_IRONWOOD_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_IRONWOOD_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_IRONWOOD_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_IRONWOOD_MAP.props.map(entry => ({ ...entry })) };"
replace_once('server/engine/AlphaContent.mjs',iron_special,iron_special+"\n  if (region.id === 'frostpeak') return { ...GRAND_FROSTPEAK_MAP, portals: GRAND_FROSTPEAK_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_FROSTPEAK_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_FROSTPEAK_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_FROSTPEAK_MAP.props.map(entry => ({ ...entry })) };",'Alpha Frostpeak special')

replace_once('server/engine/ContentDB.mjs',"import { GRAND_CAPITAL_SCHEMA_VERSION, migrateGrandIronwoodData } from './GrandIronwood.mjs';","import { migrateGrandIronwoodData } from './GrandIronwood.mjs';\nimport { GRAND_CAPITAL_SCHEMA_VERSION, migrateGrandFrostpeakData } from './GrandFrostpeak.mjs';",'ContentDB Frostpeak import')
replace_once('server/engine/ContentDB.mjs',"    // Every capital migration is idempotent and exact-default-only. Schema 4 adds Ironwood.\n    migrateGrandEldoriaData(this.data);\n    migrateGrandSunreachData(this.data);\n    migrateGrandIronwoodData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;","    // Every capital migration is idempotent and exact-default-only. Schema 5 adds Frostpeak.\n    migrateGrandEldoriaData(this.data);\n    migrateGrandSunreachData(this.data);\n    migrateGrandIronwoodData(this.data);\n    migrateGrandFrostpeakData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;",'ContentDB loaded Frostpeak chain')
replace_once('server/engine/ContentDB.mjs',"    migrateGrandEldoriaData(this.data);\n    migrateGrandSunreachData(this.data);\n    migrateGrandIronwoodData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;","    migrateGrandEldoriaData(this.data);\n    migrateGrandSunreachData(this.data);\n    migrateGrandIronwoodData(this.data);\n    migrateGrandFrostpeakData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;",'ContentDB fresh Frostpeak chain')

replace_once('src/game/maps.ts',"export type UrbanPlan = 'royal-grid' | 'harbor-crescent' | 'forest-rings';","export type UrbanPlan = 'royal-grid' | 'harbor-crescent' | 'forest-rings' | 'alpine-terraces';",'Client alpine union')
replace_once('src/game/maps.ts',"function urbanPlanOf(value: unknown, mapId = ''): UrbanPlan { const fallback: UrbanPlan = mapId === 'sunreach_coast' ? 'harbor-crescent' : mapId === 'ironwood' ? 'forest-rings' : 'royal-grid'; const requested = String(value || fallback); return requested === 'harbor-crescent' || requested === 'forest-rings' ? requested : 'royal-grid'; }","function urbanPlanOf(value: unknown, mapId = ''): UrbanPlan { const fallback: UrbanPlan = mapId === 'sunreach_coast' ? 'harbor-crescent' : mapId === 'ironwood' ? 'forest-rings' : mapId === 'frostpeak' ? 'alpine-terraces' : 'royal-grid'; const requested = String(value || fallback); return requested === 'harbor-crescent' || requested === 'forest-rings' || requested === 'alpine-terraces' ? requested : 'royal-grid'; }",'Client alpine default')

alpine_client=r'''
function alpineCapitalTile(map: GameMap, x: number, y: number): Tile | null {
  const bounds=map.urbanBounds; if(!bounds)return null;
  const minX=bounds.x,minY=bounds.y,maxX=minX+bounds.width-1,maxY=minY+bounds.height-1;
  if(x<minX||x>maxX||y<minY||y>maxY)return null;
  const cx=map.townCenter.x,cy=map.townCenter.y;
  const portalGate=map.portals.some(portal=>((portal.pos.x===minX||portal.pos.x===maxX)&&x===portal.pos.x&&Math.abs(y-portal.pos.y)<=2)||((portal.pos.y===minY||portal.pos.y===maxY)&&y===portal.pos.y&&Math.abs(x-portal.pos.x)<=2));
  const lowerGate=y===maxY&&Math.abs(x-cx)<=2;
  if(portalGate||lowerGate)return {type:'path',walkable:true,blocksSight:false};
  if(x===minX||x===maxX||y===minY||y===maxY)return {type:'wall',walkable:false,blocksSight:true};
  const retaining=[42,66,90,114].includes(y);
  const ramp=Math.abs(x-cx)<=2||Math.abs(x-(cx-30))<=1||Math.abs(x-(cx+30))<=1;
  if(retaining&&!ramp)return {type:'wall',walkable:false,blocksSight:true};
  const vertical=ramp;
  const terraceRoad=[34,58,82,106,130].some(line=>Math.abs(y-line)<=1);
  const highCourt=x>=cx-16&&x<=cx+16&&y>=26&&y<=38;
  const forgeCourt=x>=42&&x<=62&&y>=72&&y<=86;
  const expeditionCourt=x>=98&&x<=122&&y>=72&&y<=86;
  const lowerCourt=x>=cx-14&&x<=cx+14&&y>=96&&y<=108;
  return {type:(vertical||terraceRoad||highCourt||forgeCourt||expeditionCourt||lowerCourt)?'path':'floor',walkable:true,blocksSight:false};
}

'''
replace_once('src/game/maps.ts',"\nfunction capitalUrbanTile(map: GameMap, x: number, y: number): Tile | null {\n","\n"+alpine_client+"function capitalUrbanTile(map: GameMap, x: number, y: number): Tile | null {\n",'Client alpine generator insert')
replace_once('src/game/maps.ts',"  if (map.urbanPlan === 'forest-rings') return forestCapitalTile(map, x, y);","  if (map.urbanPlan === 'forest-rings') return forestCapitalTile(map, x, y);\n  if (map.urbanPlan === 'alpine-terraces') return alpineCapitalTile(map, x, y);",'Client alpine dispatch')

test_text=r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { GRAND_FROSTPEAK_MAP, GRAND_CAPITAL_SCHEMA_VERSION, migrateGrandFrostpeakData } from '../engine/GrandFrostpeak.mjs';
import { MAP_CONFIG, URBAN_PLANS, WORLD, WorldManager } from '../engine/World.mjs';
import { ContentDB } from '../engine/ContentDB.mjs';
import { HousingSystem } from '../engine/HousingSystem.mjs';
import { getContentStudioSchema, validateStudioRecord } from '../engine/ContentStudio.mjs';

const clone=value=>JSON.parse(JSON.stringify(value));
function legacyData(){return{
  maps:[
    {id:'frostpeak',width:80,height:80,spawnX:65,spawnY:40,townX:65,townY:40,townRange:8,cityStyle:'alpine',portals:[
      {x:75,y:40,targetMap:'eldoria',targetX:30,targetY:80},{x:10,y:70,targetMap:'emberhold',targetX:70,targetY:10},{x:40,y:10,targetMap:'crystal_deep',targetX:40,targetY:70},
    ]},
    {id:'eldoria',width:160,height:160,portals:[{x:28,y:80,targetMap:'frostpeak',targetX:70,targetY:40}]},
    {id:'ironwood',width:160,height:160,portals:[{x:80,y:22,targetMap:'frostpeak',targetX:68,targetY:40}]},
    {id:'emberhold',portals:[{x:75,y:10,targetMap:'frostpeak',targetX:12,targetY:70}]},
    {id:'crystal_deep',portals:[{x:40,y:75,targetMap:'frostpeak',targetX:40,targetY:12}]},
  ],
  npcs:[{id:'quest_frostpeak',mapId:'frostpeak',posX:63,posY:40},{id:'merchant_frostpeak',mapId:'frostpeak',posX:67,posY:40},{id:'warden_frostpeak',mapId:'frostpeak',posX:65,posY:42},{id:'task_master_frostpeak',mapId:'frostpeak',posX:64,posY:42}],
  monsters:[
    {id:'frostpeak_snow_stalker',mapId:'frostpeak',posX:18,posY:41},{id:'frostpeak_icefang_wolf',mapId:'frostpeak',posX:26,posY:48},{id:'frostpeak_frost_cultist',mapId:'frostpeak',posX:34,posY:55},{id:'frostpeak_glacier_golem',mapId:'frostpeak',posX:42,posY:20},{id:'frostpeak_yeti_warmaster',mapId:'frostpeak',posX:50,posY:27},{id:'frostpeak_skadi_the_white',mapId:'frostpeak',posX:58,posY:34},
  ],
  houses:[{id:'house_frostwatch',mapId:'frostpeak',x:58,y:31,width:5,height:4,entranceX:60,entranceY:35},{id:'house_snowpine',mapId:'frostpeak',x:68,y:46,width:5,height:4,entranceX:70,entranceY:45}],
  nodes:[{id:'node_frostpeak',mapId:'frostpeak',x:65,y:40}],
};}

test('9.39A Grand Frostpeak is a 160x160 alpine terrace capital',()=>{
  assert.equal(GRAND_FROSTPEAK_MAP.width,160);assert.equal(GRAND_FROSTPEAK_MAP.height,160);assert.equal(GRAND_FROSTPEAK_MAP.settlementClass,'capital');assert.equal(GRAND_FROSTPEAK_MAP.urbanPlan,'alpine-terraces');
  assert.equal(GRAND_FROSTPEAK_MAP.districts.length,12);assert.equal(GRAND_FROSTPEAK_MAP.landmarks.length,40);assert.ok(GRAND_FROSTPEAK_MAP.props.length>=90);
  assert.equal(MAP_CONFIG.frostpeak.width,160);assert.equal(MAP_CONFIG.frostpeak.urbanPlan,'alpine-terraces');assert.ok(URBAN_PLANS.has('alpine-terraces'));
});

test('9.39A alpine topology creates fortress boundary retaining walls ramps terraces and courts',()=>{
  const map=new WorldManager().getMap('frostpeak');
  assert.equal(map.tiles[50][26].type,'wall');
  for(const [x,y] of [[26,82],[133,112],[80,18],[80,139]])assert.equal(map.tiles[y][x].type,'path',`gate ${x},${y}`);
  assert.equal(map.tiles[42][70].type,'wall');assert.equal(map.tiles[42][80].type,'path');assert.equal(map.tiles[42][50].type,'path');
  assert.equal(map.tiles[58][70].type,'path');assert.equal(map.tiles[52][70].type,'floor');
});

test('9.39A legacy migration upgrades exact Frostpeak defaults and all incoming travel',()=>{
  const data=legacyData();assert.equal(migrateGrandFrostpeakData(data),true);const map=data.maps[0];
  assert.deepEqual([map.width,map.height,map.spawnX,map.spawnY,map.townX,map.townY],[160,160,80,104,80,76]);assert.equal(map.portals.length,3);
  assert.deepEqual([data.maps[1].portals[0].targetX,data.maps[1].portals[0].targetY],[28,82]);assert.deepEqual([data.maps[2].portals[0].targetX,data.maps[2].portals[0].targetY],[80,136]);
  assert.deepEqual([data.maps[3].portals[0].targetX,data.maps[3].portals[0].targetY],[130,112]);assert.deepEqual([data.maps[4].portals[0].targetX,data.maps[4].portals[0].targetY],[80,20]);
  assert.deepEqual([data.npcs[0].posX,data.npcs[0].posY],[74,100]);assert.deepEqual([data.npcs[3].posX,data.npcs[3].posY],[46,104]);assert.deepEqual([data.monsters[5].posX,data.monsters[5].posY],[112,148]);
  assert.deepEqual([data.houses[0].x,data.houses[0].y,data.houses[0].entranceX,data.houses[0].entranceY],[32,124,34,123]);assert.deepEqual([data.nodes[0].x,data.nodes[0].y],[80,76]);
  const snapshot=JSON.stringify(data);assert.equal(migrateGrandFrostpeakData(data),false);assert.equal(JSON.stringify(data),snapshot);
});

test('9.39A administrator-authored Frostpeak geometry blocks all collateral migration',()=>{
  const data=legacyData();data.maps[0].width=120;data.maps[0].height=120;data.maps[0].spawnX=60;data.maps[0].spawnY=61;data.maps[0].urbanPlan='royal-grid';data.maps[0].landmarks=[{id:'admin'}];
  const before=JSON.stringify(data);assert.equal(migrateGrandFrostpeakData(data),false);assert.equal(JSON.stringify(data),before);
});

test('9.39A migrated Frostpeak houses remain valid against authoritative architecture',()=>{
  const data=legacyData();migrateGrandFrostpeakData(data);WORLD.syncContentMaps(data.maps);const fakeDb={get(type){return type==='houses'?data.houses:[];}};
  const temp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'moria-frost-housing-')),'housing.json');const housing=new HousingSystem(fakeDb,temp);
  for(const house of data.houses)assert.equal(housing.validateDefinition(house,fakeDb),null,house.id);
});

test('9.39A fresh ContentDB converges Frostpeak and advances only the Grand Capital marker',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moria-939-')),file=path.join(dir,'content.json');try{const db=new ContentDB(file),data=db.getAllContent();assert.equal(data.version,3);assert.equal(data.grandCapitalVersion,GRAND_CAPITAL_SCHEMA_VERSION);const map=data.maps.find(entry=>entry.id==='frostpeak');assert.deepEqual([map.width,map.height,map.urbanPlan],[160,160,'alpine-terraces']);const npc=data.npcs.find(entry=>entry.id==='quest_frostpeak');const node=data.nodes.find(entry=>entry.id==='node_frostpeak');assert.deepEqual([npc.posX,npc.posY],[74,100]);assert.deepEqual([node.x,node.y],[80,76]);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('9.39A client server and Studio share alpine-terraces vocabulary',()=>{
  const server=fs.readFileSync(new URL('../engine/World.mjs',import.meta.url),'utf8'),client=fs.readFileSync(new URL('../../src/game/maps.ts',import.meta.url),'utf8');
  for(const marker of ['alpineCapitalTile','retaining','terraceRoad','highCourt','forgeCourt','expeditionCourt','lowerCourt']){assert.ok(server.includes(marker));assert.ok(client.includes(marker));}
  const fakeDb={get(type){return type==='maps'?[clone(GRAND_FROSTPEAK_MAP)]:[];}};const schema=getContentStudioSchema('maps',fakeDb);assert.ok(schema.options.urbanPlans.includes('alpine-terraces'));assert.equal(validateStudioRecord('maps',clone(GRAND_FROSTPEAK_MAP),fakeDb),null);
});

test('9.39A previously approved capital algorithms stay distinct and reachable',()=>{
  const world=new WorldManager();assert.equal(world.getMap('eldoria').urbanPlan,'royal-grid');assert.equal(world.getMap('sunreach_coast').urbanPlan,'harbor-crescent');assert.equal(world.getMap('ironwood').urbanPlan,'forest-rings');assert.equal(world.getMap('frostpeak').urbanPlan,'alpine-terraces');
});
'''
write('server/test/grand-frostpeak-9-39.test.mjs',test_text)

doc=r'''# Mor'ia 9.39 — Grand Frostpeak

## 9.39A — Capital alpina autoritativa

Frostpeak passa de assentamento 80×80 para uma capital 160×160 com `urbanPlan: alpine-terraces`. A cidade é organizada como uma fortaleza de montanha escalonada: muralha externa, quatro patamares de contenção, três eixos verticais de rampas/escadarias, vias horizontais por nível e grandes pátios funcionais.

### Identidade

- mapa 160×160, classe `capital`;
- 12 distritos e 40 footprints autoritativos;
- 90+ props;
- Cidadela Frostguard no nível superior;
- Salão do Thane, Observatório da Aurora e Capela do Gelo Eterno;
- terraço de forjas, Mercado da Geada e bairro de expedições;
- quartéis, academia, arena, enfermaria, estábulos e bairro Snowpine;
- muralhas de retenção são colisão real, atravessadas apenas pelos eixos de subida.

### Migração segura

A promoção ocorre apenas quando o mapa ainda possui dimensões e centro legados oficiais. Mapas administrativos customizados bloqueiam a migração inteira. NPCs, monstros, casas e Node só se movem quando ainda estão nas coordenadas exatas conhecidas.

Chegadas oficiais atualizadas:
- Eldoria → Frostpeak: 28,82;
- Ironwood → Frostpeak: 80,136;
- Emberhold → Frostpeak: 130,112;
- Crystal Deep → Frostpeak: 80,20.

As duas casas legadas de Frostpeak são relocadas para lotes do terraço inferior e passam novamente pelo validador autoritativo de Housing.

### Schema global

`grandCapitalVersion` avança para 5 sem alterar `version=3`. Banco novo e banco existente percorrem Eldoria → Sunreach → Ironwood → Frostpeak de forma idempotente.

### Studio e paridade

`alpine-terraces` entra no vocabulário já exposto pelo Content Studio. Servidor e cliente compartilham os mesmos marcadores de patamares, rampas e pátios.

## Próxima etapa

A 9.39B fará minimapa, City Designer e panorâmica autoritativa com prova visual de muralhas de retenção, patamares e identidade alpina.
'''
write('docs/MORIA_9_39_GRAND_FROSTPEAK.md',doc)
print("Mor'ia 9.39A Grand Frostpeak applicator prepared")
