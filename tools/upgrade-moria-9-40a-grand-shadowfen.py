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
    {x:141,y:82,targetMap:'crystal_deep',targetX:10,targetY:40,label:'💎 Sumidouro de Cristal'},
  ]),
});

export const GRAND_SHADOWFEN_BUILTIN_WORLD_CONFIG=Object.freeze({
  ...GRAND_SHADOWFEN_MAP,
  spawnPoint:{x:GRAND_SHADOWFEN_MAP.spawnX,y:GRAND_SHADOWFEN_MAP.spawnY},
  townCenter:{x:GRAND_SHADOWFEN_MAP.townX,y:GRAND_SHADOWFEN_MAP.townY},
  portals:GRAND_SHADOWFEN_MAP.portals.filter(portal=>portal.targetMap==='eldoria'||portal.targetMap==='voidlands').map(portal=>({pos:{x:portal.x,y:portal.y},targetMap:portal.targetMap,targetSpawn:{x:portal.targetX,y:portal.targetY},label:portal.label})),
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
'''
write('server/engine/GrandShadowfen.mjs',grand)

# Server vocabulary and authoritative built-in.
replace_once('server/engine/World.mjs',
"import { GRAND_FROSTPEAK_BUILTIN_WORLD_CONFIG } from './GrandFrostpeak.mjs';",
"import { GRAND_FROSTPEAK_BUILTIN_WORLD_CONFIG } from './GrandFrostpeak.mjs';\nimport { GRAND_SHADOWFEN_BUILTIN_WORLD_CONFIG } from './GrandShadowfen.mjs';",
'Shadowfen server import')
replace_once('server/engine/World.mjs',
"const URBAN_PLANS = new Set(['royal-grid','harbor-crescent','forest-rings','terraced-bastion']);",
"const URBAN_PLANS = new Set(['royal-grid','harbor-crescent','forest-rings','terraced-bastion','marsh-wards']);",
'Shadowfen urban plan set')
old_shadow="""  shadowfen: {
    id: 'shadowfen', name: 'Shadowfen', description: 'Cursed swampland. Rotten and foggy.', biome: 'swamp',
    spawnPoint: { x: 40, y: 70 }, townCenter: { x: 40, y: 65 }, townRange: 8, seed: 7,
    portals: [
      { pos: { x: 40, y: 75 }, targetMap: 'eldoria', targetSpawn: { x: 130, y: 120 }, label: '🌳 To Eldoria' },
      { pos: { x: 10, y: 10 }, targetMap: 'voidlands', targetSpawn: { x: 70, y: 70 }, label: '☠ To Voidlands' },
    ],
  },"""
replace_once('server/engine/World.mjs',old_shadow,"  shadowfen: GRAND_SHADOWFEN_BUILTIN_WORLD_CONFIG,",'Shadowfen MAP_CONFIG')
replace_once('server/engine/World.mjs',
"  const defaultUrbanPlan = id === 'sunreach_coast' ? 'harbor-crescent' : id === 'ironwood' ? 'forest-rings' : id === 'frostpeak' ? 'terraced-bastion' : 'royal-grid';",
"  const defaultUrbanPlan = id === 'sunreach_coast' ? 'harbor-crescent' : id === 'ironwood' ? 'forest-rings' : id === 'frostpeak' ? 'terraced-bastion' : id === 'shadowfen' ? 'marsh-wards' : 'royal-grid';",
'Shadowfen server default plan')

server_helper=r'''
function marshWardsTile(config, x, y) {
  const bounds=config.urbanBounds;if(!bounds)return null;
  const minX=Number(bounds.x),minY=Number(bounds.y),maxX=minX+Number(bounds.width)-1,maxY=minY+Number(bounds.height)-1;
  if(x<minX||x>maxX||y<minY||y>maxY)return null;
  const cx=config.townCenter.x,cy=config.townCenter.y;
  const portalGate=config.portals.some(portal=>((portal.pos.x===minX||portal.pos.x===maxX)&&x===portal.pos.x&&Math.abs(y-portal.pos.y)<=2)||((portal.pos.y===minY||portal.pos.y===maxY)&&y===portal.pos.y&&Math.abs(x-portal.pos.x)<=2));
  const northGate=y===minY&&Math.abs(x-cx)<=2;
  if(portalGate||northGate)return {type:'path',walkable:true,blocksSight:false};
  if(x===minX||x===maxX||y===minY||y===maxY)return {type:'water',walkable:false,blocksSight:false};

  const westCanal=cx-27+Math.round(Math.sin((y-minY)/10)*4);
  const eastCanal=cx+27+Math.round(Math.sin((y-minY)/12)*5);
  const crossCanal=cy+Math.round(Math.sin((x-minX)/13)*4);
  const inCanal=Math.abs(x-westCanal)<=3||Math.abs(x-eastCanal)<=3||Math.abs(y-crossCanal)<=2;
  const centralSpine=Math.abs(x-cx)<=1;
  const causeway=[54,82,110,136].some(line=>Math.abs(y-line)<=1);
  const wardWalk=Math.abs(x-40)<=1||Math.abs(x-120)<=1;
  const boardwalk=centralSpine||causeway||wardWalk;
  if(boardwalk&&inCanal)return {type:'bridge',walkable:true,blocksSight:false};
  if(boardwalk)return {type:'path',walkable:true,blocksSight:false};
  const fenCourt=x>=70&&x<=94&&y>=68&&y<=98;
  if(fenCourt)return {type:'path',walkable:true,blocksSight:false};
  if(inCanal)return {type:'water',walkable:false,blocksSight:false};
  const westReed=Math.abs(x-westCanal)<=5,eastReed=Math.abs(x-eastCanal)<=5,crossReed=Math.abs(y-crossCanal)<=4;
  if((westReed||eastReed||crossReed)&&((x*19+y*23)%7===0))return {type:'bush',walkable:false,blocksSight:false};
  return {type:'grass',walkable:true,blocksSight:false};
}

'''
replace_once('server/engine/World.mjs',"function capitalUrbanTile(config, x, y) {",server_helper+"function capitalUrbanTile(config, x, y) {",'Shadowfen server topology helper')
replace_once('server/engine/World.mjs',
"  if (config.urbanPlan === 'terraced-bastion') return terracedBastionTile(config, x, y);",
"  if (config.urbanPlan === 'terraced-bastion') return terracedBastionTile(config, x, y);\n  if (config.urbanPlan === 'marsh-wards') return marshWardsTile(config, x, y);",
'Shadowfen server topology dispatch')
# Built-in Voidlands arrival must match the promoted capital before ContentDB sync.
replace_once('server/engine/World.mjs',
"{ pos: { x: 75, y: 75 }, targetMap: 'shadowfen', targetSpawn: { x: 12, y: 12 }, label: '🍄 To Shadowfen' }",
"{ pos: { x: 75, y: 75 }, targetMap: 'shadowfen', targetSpawn: { x: 22, y: 34 }, label: '🍄 To Shadowfen' }",
'Voidlands built-in Shadowfen arrival')

# Client vocabulary/prediction mirrors server topology.
replace_once('src/game/maps.ts',
"export type UrbanPlan = 'royal-grid' | 'harbor-crescent' | 'forest-rings' | 'terraced-bastion';",
"export type UrbanPlan = 'royal-grid' | 'harbor-crescent' | 'forest-rings' | 'terraced-bastion' | 'marsh-wards';",
'Shadowfen client plan type')
replace_once('src/game/maps.ts',
"function urbanPlanOf(value: unknown, mapId = ''): UrbanPlan { const fallback: UrbanPlan = mapId === 'sunreach_coast' ? 'harbor-crescent' : mapId === 'ironwood' ? 'forest-rings' : mapId === 'frostpeak' ? 'terraced-bastion' : 'royal-grid'; const requested = String(value || fallback); return requested === 'harbor-crescent' || requested === 'forest-rings' || requested === 'terraced-bastion' ? requested : 'royal-grid'; }",
"function urbanPlanOf(value: unknown, mapId = ''): UrbanPlan { const fallback: UrbanPlan = mapId === 'sunreach_coast' ? 'harbor-crescent' : mapId === 'ironwood' ? 'forest-rings' : mapId === 'frostpeak' ? 'terraced-bastion' : mapId === 'shadowfen' ? 'marsh-wards' : 'royal-grid'; const requested = String(value || fallback); return requested === 'harbor-crescent' || requested === 'forest-rings' || requested === 'terraced-bastion' || requested === 'marsh-wards' ? requested : 'royal-grid'; }",
'Shadowfen client default plan')
client_helper=r'''
function marshWardsTile(map: GameMap, x: number, y: number): Tile | null {
  const bounds=map.urbanBounds;if(!bounds)return null;
  const minX=bounds.x,minY=bounds.y,maxX=minX+bounds.width-1,maxY=minY+bounds.height-1;
  if(x<minX||x>maxX||y<minY||y>maxY)return null;
  const cx=map.townCenter.x,cy=map.townCenter.y;
  const portalGate=map.portals.some(portal=>((portal.pos.x===minX||portal.pos.x===maxX)&&x===portal.pos.x&&Math.abs(y-portal.pos.y)<=2)||((portal.pos.y===minY||portal.pos.y===maxY)&&y===portal.pos.y&&Math.abs(x-portal.pos.x)<=2));
  const northGate=y===minY&&Math.abs(x-cx)<=2;
  if(portalGate||northGate)return {type:'path',walkable:true,blocksSight:false};
  if(x===minX||x===maxX||y===minY||y===maxY)return {type:'water',walkable:false,blocksSight:false};

  const westCanal=cx-27+Math.round(Math.sin((y-minY)/10)*4);
  const eastCanal=cx+27+Math.round(Math.sin((y-minY)/12)*5);
  const crossCanal=cy+Math.round(Math.sin((x-minX)/13)*4);
  const inCanal=Math.abs(x-westCanal)<=3||Math.abs(x-eastCanal)<=3||Math.abs(y-crossCanal)<=2;
  const centralSpine=Math.abs(x-cx)<=1;
  const causeway=[54,82,110,136].some(line=>Math.abs(y-line)<=1);
  const wardWalk=Math.abs(x-40)<=1||Math.abs(x-120)<=1;
  const boardwalk=centralSpine||causeway||wardWalk;
  if(boardwalk&&inCanal)return {type:'bridge',walkable:true,blocksSight:false};
  if(boardwalk)return {type:'path',walkable:true,blocksSight:false};
  const fenCourt=x>=70&&x<=94&&y>=68&&y<=98;
  if(fenCourt)return {type:'path',walkable:true,blocksSight:false};
  if(inCanal)return {type:'water',walkable:false,blocksSight:false};
  const westReed=Math.abs(x-westCanal)<=5,eastReed=Math.abs(x-eastCanal)<=5,crossReed=Math.abs(y-crossCanal)<=4;
  if((westReed||eastReed||crossReed)&&((x*19+y*23)%7===0))return {type:'bush',walkable:false,blocksSight:false};
  return {type:'grass',walkable:true,blocksSight:false};
}

'''
replace_once('src/game/maps.ts',"function capitalUrbanTile(map: GameMap, x: number, y: number): Tile | null {",client_helper+"function capitalUrbanTile(map: GameMap, x: number, y: number): Tile | null {",'Shadowfen client topology helper')
replace_once('src/game/maps.ts',
"  if (map.urbanPlan === 'terraced-bastion') return terracedBastionTile(map, x, y);",
"  if (map.urbanPlan === 'terraced-bastion') return terracedBastionTile(map, x, y);\n  if (map.urbanPlan === 'marsh-wards') return marshWardsTile(map, x, y);",
'Shadowfen client topology dispatch')
replace_once('src/game/maps.ts',
"{ pos: { x: 70, y: 10 }, targetMap: 'shadowfen', targetSpawn: { x: 40, y: 70 }, label: '🍄 To Shadowfen' }",
"{ pos: { x: 70, y: 10 }, targetMap: 'shadowfen', targetSpawn: { x: 80, y: 138 }, label: '🍄 To Shadowfen' }",
'Eldoria client Shadowfen arrival')
replace_once('src/game/maps.ts',
"{ pos: { x: 75, y: 75 }, targetMap: 'shadowfen', targetSpawn: { x: 12, y: 12 }, label: '🍄 To Shadowfen' }",
"{ pos: { x: 75, y: 75 }, targetMap: 'shadowfen', targetSpawn: { x: 22, y: 34 }, label: '🍄 To Shadowfen' }",
'Voidlands client Shadowfen arrival')

# Fresh alpha seeds start authoritative rather than relying on a later incidental overlay.
replace_once('server/engine/AlphaContent.mjs',
"import { GRAND_FROSTPEAK_MAP } from './GrandFrostpeak.mjs';",
"import { GRAND_FROSTPEAK_MAP } from './GrandFrostpeak.mjs';\nimport { GRAND_SHADOWFEN_MAP } from './GrandShadowfen.mjs';",
'Shadowfen Alpha import')
replace_once('server/engine/AlphaContent.mjs',
"  if (region.id === 'frostpeak') return { ...GRAND_FROSTPEAK_MAP, portals: GRAND_FROSTPEAK_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_FROSTPEAK_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_FROSTPEAK_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_FROSTPEAK_MAP.props.map(entry => ({ ...entry })) };",
"  if (region.id === 'frostpeak') return { ...GRAND_FROSTPEAK_MAP, portals: GRAND_FROSTPEAK_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_FROSTPEAK_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_FROSTPEAK_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_FROSTPEAK_MAP.props.map(entry => ({ ...entry })) };\n  if (region.id === 'shadowfen') return { ...GRAND_SHADOWFEN_MAP, portals: GRAND_SHADOWFEN_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_SHADOWFEN_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_SHADOWFEN_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_SHADOWFEN_MAP.props.map(entry => ({ ...entry })) };",
'Shadowfen Alpha map seed')

# Grand-capital migration chain advances schema 5 -> 6 and covers fresh + loaded DBs.
replace_once('server/engine/ContentDB.mjs',
"import { GRAND_CAPITAL_SCHEMA_VERSION, migrateGrandFrostpeakData } from './GrandFrostpeak.mjs';",
"import { migrateGrandFrostpeakData } from './GrandFrostpeak.mjs';\nimport { GRAND_CAPITAL_SCHEMA_VERSION, migrateGrandShadowfenData } from './GrandShadowfen.mjs';",
'Shadowfen ContentDB import')
replace_once('server/engine/ContentDB.mjs',
"    // Every capital migration is idempotent and exact-default-only. Schema 5 adds Frostpeak.",
"    // Every capital migration is idempotent and exact-default-only. Schema 6 adds Shadowfen.",
'Shadowfen migration comment')
replace_once('server/engine/ContentDB.mjs',
"    migrateGrandFrostpeakData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;",
"    migrateGrandFrostpeakData(this.data);\n    migrateGrandShadowfenData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;",
'Shadowfen loaded DB migration chain')
# The same anchor occurs again in fresh seed; replace_once above hit only first occurrence.
replace_once('server/engine/ContentDB.mjs',
"    migrateGrandFrostpeakData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;",
"    migrateGrandFrostpeakData(this.data);\n    migrateGrandShadowfenData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;",
'Shadowfen fresh DB migration chain')

# Built-in Eldoria knows the promoted arrival before content synchronization.
replace_once('server/engine/GrandEldoria.mjs',
"{ x:132, y:120, targetMap:'shadowfen', targetX:40, targetY:70, label:'🍄 Estrada de Shadowfen' }",
"{ x:132, y:120, targetMap:'shadowfen', targetX:80, targetY:138, label:'🍄 Estrada de Shadowfen' }",
'Eldoria authoritative Shadowfen arrival')

# Focused contract.
test=r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { GRAND_SHADOWFEN_MAP, GRAND_CAPITAL_SCHEMA_VERSION, migrateGrandShadowfenData } from '../engine/GrandShadowfen.mjs';
import { MAP_CONFIG, URBAN_PLANS, WorldManager } from '../engine/World.mjs';
import { ContentDB } from '../engine/ContentDB.mjs';
import { HousingSystem } from '../engine/HousingSystem.mjs';
import { getContentStudioSchema, validateStudioRecord } from '../engine/ContentStudio.mjs';

const clone=value=>JSON.parse(JSON.stringify(value));
function legacyData(){return{
  maps:[
    {id:'shadowfen',spawnX:40,spawnY:65,townX:40,townY:65,townRange:8,cityStyle:'marsh',portals:[
      {x:40,y:75,targetMap:'eldoria',targetX:68,targetY:12},{x:10,y:10,targetMap:'voidlands',targetX:70,targetY:70},{x:70,y:40,targetMap:'crystal_deep',targetX:10,targetY:40},
    ]},
    {id:'eldoria',width:160,height:160,portals:[{x:132,y:120,targetMap:'shadowfen',targetX:40,targetY:70}]},
    {id:'voidlands',portals:[{x:75,y:75,targetMap:'shadowfen',targetX:12,targetY:12}]},
    {id:'crystal_deep',portals:[{x:8,y:40,targetMap:'shadowfen',targetX:68,targetY:40}]},
  ],
  npcs:[{id:'quest_shadowfen',mapId:'shadowfen',posX:38,posY:65},{id:'merchant_shadowfen',mapId:'shadowfen',posX:42,posY:65},{id:'warden_shadowfen',mapId:'shadowfen',posX:40,posY:67},{id:'task_master_shadowfen',mapId:'shadowfen',posX:39,posY:63}],
  monsters:[
    {id:'shadowfen_bog_leech',mapId:'shadowfen',posX:18,posY:48},{id:'shadowfen_rotcap_fungus',mapId:'shadowfen',posX:26,posY:55},{id:'shadowfen_fen_witch',mapId:'shadowfen',posX:34,posY:62},{id:'shadowfen_drowned_knight',mapId:'shadowfen',posX:42,posY:69},{id:'shadowfen_plague_abomination',mapId:'shadowfen',posX:50,posY:34},{id:'shadowfen_miremother',mapId:'shadowfen',posX:58,posY:41},
  ],
  houses:[{id:'house_mirelight',mapId:'shadowfen',x:30,y:58,width:5,height:4,entranceX:32,entranceY:57},{id:'house_fenwarden',mapId:'shadowfen',x:47,y:60,width:5,height:4,entranceX:49,entranceY:59}],
  nodes:[{id:'node_shadowfen',mapId:'shadowfen',x:40,y:65}],
};}

test('9.40A Grand Shadowfen is a 160x160 marsh-wards capital',()=>{
  assert.equal(GRAND_CAPITAL_SCHEMA_VERSION,6);assert.equal(GRAND_SHADOWFEN_MAP.width,160);assert.equal(GRAND_SHADOWFEN_MAP.height,160);assert.equal(GRAND_SHADOWFEN_MAP.settlementClass,'capital');assert.equal(GRAND_SHADOWFEN_MAP.urbanPlan,'marsh-wards');assert.equal(GRAND_SHADOWFEN_MAP.levelRequired,20);
  assert.equal(GRAND_SHADOWFEN_MAP.districts.length,12);assert.equal(GRAND_SHADOWFEN_MAP.landmarks.length,42);assert.ok(GRAND_SHADOWFEN_MAP.props.length>=80);
  assert.equal(MAP_CONFIG.shadowfen.width,160);assert.equal(MAP_CONFIG.shadowfen.urbanPlan,'marsh-wards');assert.ok(URBAN_PLANS.has('marsh-wards'));
});

test('9.40A marsh topology creates substantial canals bridges and boardwalk wards',()=>{
  const map=new WorldManager().getMap('shadowfen');let water=0,bridges=0,paths=0,bushes=0;
  for(let y=18;y<=141;y++)for(let x=18;x<=141;x++){const type=map.tiles[y][x].type;if(type==='water')water++;else if(type==='bridge')bridges++;else if(type==='path')paths++;else if(type==='bush')bushes++;}
  assert.ok(water>1300,`water=${water}`);assert.ok(bridges>70,`bridges=${bridges}`);assert.ok(paths>1200,`paths=${paths}`);assert.ok(bushes>50,`bushes=${bushes}`);
  for(const [x,y]of [[80,141],[18,34],[141,82],[80,18]])assert.equal(map.tiles[y][x].type,'path',`access ${x},${y}`);
  assert.equal(map.tiles[90][53].type,'water');assert.ok(['bridge','path'].includes(map.tiles[82][53].type));assert.equal(map.tiles[118][80].type,'path');
});

test('9.40A legacy migration upgrades exact Shadowfen defaults and incoming travel',()=>{
  const data=legacyData();assert.equal(migrateGrandShadowfenData(data),true);const map=data.maps[0];
  assert.deepEqual([map.width,map.height,map.spawnX,map.spawnY,map.townX,map.townY,map.levelRequired],[160,160,80,118,80,82,20]);assert.equal(map.urbanPlan,'marsh-wards');assert.equal(map.portals.length,3);
  assert.deepEqual([data.maps[1].portals[0].targetX,data.maps[1].portals[0].targetY],[80,138]);assert.deepEqual([data.maps[2].portals[0].targetX,data.maps[2].portals[0].targetY],[22,34]);assert.deepEqual([data.maps[3].portals[0].targetX,data.maps[3].portals[0].targetY],[138,82]);
  assert.deepEqual([data.npcs[0].posX,data.npcs[0].posY],[78,100]);assert.deepEqual([data.npcs[3].posX,data.npcs[3].posY],[46,110]);assert.deepEqual([data.monsters[5].posX,data.monsters[5].posY],[112,150]);
  assert.deepEqual([data.houses[0].x,data.houses[0].y,data.houses[0].entranceX,data.houses[0].entranceY],[24,122,26,121]);assert.deepEqual([data.nodes[0].x,data.nodes[0].y],[80,82]);
  const snapshot=JSON.stringify(data);assert.equal(migrateGrandShadowfenData(data),false);assert.equal(JSON.stringify(data),snapshot);
});

test('9.40A administrator-authored Shadowfen geometry blocks collateral migration',()=>{
  const data=legacyData();data.maps[0].width=124;data.maps[0].height=124;data.maps[0].spawnX=60;data.maps[0].spawnY=61;data.maps[0].urbanPlan='royal-grid';data.maps[0].landmarks=[{id:'admin'}];
  const before=JSON.stringify(data);assert.equal(migrateGrandShadowfenData(data),false);assert.equal(JSON.stringify(data),before);
});

test('9.40A migrated Shadowfen houses remain valid against authoritative architecture',()=>{
  const data=legacyData();migrateGrandShadowfenData(data);const world=new WorldManager();world.syncContentMaps(data.maps);const fakeDb={get(type){return type==='houses'?data.houses:type==='maps'?data.maps:[];}};
  const temp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'moria-shadowfen-housing-')),'housing.json');const housing=new HousingSystem(fakeDb,temp);
  for(const house of data.houses)assert.equal(housing.validateDefinition(house,fakeDb),null,house.id);
});

test('9.40A fresh ContentDB converges Shadowfen and advances Grand Capital schema to 6',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moria-940-')),file=path.join(dir,'content.json');try{const db=new ContentDB(file),data=db.getAllContent();assert.equal(data.version,3);assert.equal(data.grandCapitalVersion,6);const map=data.maps.find(entry=>entry.id==='shadowfen');assert.deepEqual([map.width,map.height,map.urbanPlan,map.levelRequired],[160,160,'marsh-wards',20]);const npc=data.npcs.find(entry=>entry.id==='quest_shadowfen');const node=data.nodes.find(entry=>entry.id==='node_shadowfen');assert.deepEqual([npc.posX,npc.posY],[78,100]);assert.deepEqual([node.x,node.y],[80,82]);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('9.40A client server and Studio share marsh-wards vocabulary',()=>{
  const server=fs.readFileSync(new URL('../engine/World.mjs',import.meta.url),'utf8'),client=fs.readFileSync(new URL('../../src/game/maps.ts',import.meta.url),'utf8');
  for(const marker of ['marshWardsTile','westCanal','eastCanal','crossCanal','boardwalk','fenCourt']){assert.ok(server.includes(marker));assert.ok(client.includes(marker));}
  const fakeDb={get(type){return type==='maps'?[clone(GRAND_SHADOWFEN_MAP)]:[];}};const schema=getContentStudioSchema('maps',fakeDb);assert.ok(schema.options.urbanPlans.includes('marsh-wards'));assert.equal(validateStudioRecord('maps',clone(GRAND_SHADOWFEN_MAP),fakeDb),null);
});

test('9.40A five approved capital algorithms remain distinct and reachable',()=>{
  const world=new WorldManager();assert.equal(world.getMap('eldoria').urbanPlan,'royal-grid');assert.equal(world.getMap('sunreach_coast').urbanPlan,'harbor-crescent');assert.equal(world.getMap('ironwood').urbanPlan,'forest-rings');assert.equal(world.getMap('frostpeak').urbanPlan,'terraced-bastion');assert.equal(world.getMap('shadowfen').urbanPlan,'marsh-wards');
});
'''
write('server/test/grand-shadowfen-9-40.test.mjs',test)

docs=r'''# Mor'ia 9.40 — Grand Shadowfen

## 9.40A — Capital pantanosa autoritativa

Shadowfen deixa de ser um núcleo legado de 80×80 e passa a ser uma capital autoritativa de **160×160**, nível 20, com plano urbano `marsh-wards`.

### Identidade urbana

- 12 distritos com funções próprias.
- 42 construções autorais entre grandes marcos e palafitas menores.
- Corte do Pântano no centro político.
- Mercado das Lanternas, Casa dos Boticários e Pavilhão dos Caçadores.
- Capela Afogada e Necrópole das Águas Mortas.
- Grande Cais dos Barqueiros e rede de docas.
- Turfeiras, arena, quartel e jardins de ervas.
- Três canais sinuosos estruturam a cidade e são cruzados por passarelas, pontes e calçadas.
- O perímetro urbano usa água como fronteira natural, com acessos físicos seguros.

### Topologia distinta

`marsh-wards` não reutiliza a grade real, o porto crescente, os anéis florestais nem os terraços de Frostpeak. O gerador usa canais sinuosos por seno, corredores de palafitas, uma ilha/corte central e passarelas que viram `bridge` somente quando cruzam água. As margens recebem vegetação de brejo determinística sem bloquear as vias principais.

### Contrato de migração

A migração é **exact-default-only**. Apenas a Shadowfen legado 80×80 com coordenadas conhecidas é promovida. Dimensões, topologia, marcos e coordenadas criadas por administradores são preservadas. NPCs, monstros, casas, node regional e destinos de portais são movidos somente quando ainda estão exatamente nos defaults históricos.

### Integração

O plano `marsh-wards` é compartilhado por servidor, cliente e Content Studio. O `grandCapitalVersion` avança para **6**. Seeds novas já nascem com Grand Shadowfen e bancos existentes convergem pela mesma migração idempotente.
'''
write('docs/MORIA_9_40_GRAND_SHADOWFEN.md',docs)
