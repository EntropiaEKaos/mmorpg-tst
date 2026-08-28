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
'''
write('server/engine/GrandStormwatch.mjs',grand)

test=r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import { GRAND_STORMWATCH_MAP, GRAND_CAPITAL_SCHEMA_VERSION, migrateGrandStormwatchData } from '../engine/GrandStormwatch.mjs';
import { MAP_CONFIG, URBAN_PLANS, WorldManager } from '../engine/World.mjs';
import { ContentDB } from '../engine/ContentDB.mjs';
import { getContentStudioSchema, validateStudioRecord } from '../engine/ContentStudio.mjs';
const clone=value=>JSON.parse(JSON.stringify(value));
function legacyData(){return{maps:[
{id:'stormwatch_isle',width:80,height:80,spawnX:40,spawnY:22,townX:40,townY:22,townRange:8,levelRequired:44,cityStyle:'storm',portals:[{x:40,y:8,targetMap:'emberhold',targetX:40,targetY:68},{x:8,y:40,targetMap:'crystal_deep',targetX:70,targetY:40},{x:70,y:70,targetMap:'nightfall_citadel',targetX:10,targetY:10}]},
{id:'emberhold',portals:[{x:80,y:141,targetMap:'stormwatch_isle',targetX:40,targetY:10}]},{id:'crystal_deep',portals:[{x:141,y:84,targetMap:'stormwatch_isle',targetX:10,targetY:40}]},{id:'nightfall_citadel',portals:[{x:8,y:8,targetMap:'stormwatch_isle',targetX:68,targetY:68}]},],npcs:[{id:'quest_stormwatch_isle',mapId:'stormwatch_isle',posX:38,posY:22},{id:'merchant_stormwatch_isle',mapId:'stormwatch_isle',posX:42,posY:22},{id:'warden_stormwatch_isle',mapId:'stormwatch_isle',posX:40,posY:24}],monsters:[{id:'stormwatch_isle_gale_harpy',mapId:'stormwatch_isle',posX:18,posY:27},{id:'stormwatch_isle_storm_hound',mapId:'stormwatch_isle',posX:26,posY:34},{id:'stormwatch_isle_sea_raider',mapId:'stormwatch_isle',posX:34,posY:41},{id:'stormwatch_isle_thunder_elemental',mapId:'stormwatch_isle',posX:42,posY:48},{id:'stormwatch_isle_tempest_champion',mapId:'stormwatch_isle',posX:50,posY:55},{id:'stormwatch_isle_maelstrom_drake',mapId:'stormwatch_isle',posX:58,posY:20}],nodes:[{id:'node_stormwatch',mapId:'stormwatch_isle',x:40,y:22}]};}

test('9.43A Grand Stormwatch Isle is a 160x160 tempest-archipelago capital',()=>{assert.equal(GRAND_CAPITAL_SCHEMA_VERSION,9);assert.equal(GRAND_STORMWATCH_MAP.width,160);assert.equal(GRAND_STORMWATCH_MAP.height,160);assert.equal(GRAND_STORMWATCH_MAP.settlementClass,'capital');assert.equal(GRAND_STORMWATCH_MAP.urbanPlan,'tempest-archipelago');assert.equal(GRAND_STORMWATCH_MAP.levelRequired,44);assert.equal(GRAND_STORMWATCH_MAP.districts.length,12);assert.equal(GRAND_STORMWATCH_MAP.landmarks.length,42);assert.ok(GRAND_STORMWATCH_MAP.props.length>=60);assert.equal(MAP_CONFIG.stormwatch_isle.width,160);assert.ok(URBAN_PLANS.has('tempest-archipelago'));});

test('9.43A archipelago topology creates dominant sea rocky islands and real storm causeways',()=>{const map=new WorldManager().getMap('stormwatch_isle');let water=0,bridges=0,rocks=0,snow=0,paths=0;for(let y=14;y<=145;y++)for(let x=14;x<=145;x++){const t=map.tiles[y][x].type;if(t==='water')water++;else if(t==='bridge')bridges++;else if(t==='rock')rocks++;else if(t==='snow')snow++;else if(t==='path')paths++;}assert.ok(water>8000,`water=${water}`);assert.ok(bridges>180,`bridges=${bridges}`);assert.ok(rocks>1600,`rocks=${rocks}`);assert.ok(snow>2500,`snow=${snow}`);assert.ok(paths>700,`paths=${paths}`);for(const [x,y]of [[80,14],[14,82],[145,82],[145,140]]){assert.equal(map.tiles[y][x].walkable,true);}assert.equal(map.tiles[82][54].type,'bridge');assert.equal(map.tiles[16][16].type,'water');});

test('9.43A exact legacy migration moves Stormwatch defaults and all three inbound routes',()=>{const data=legacyData();assert.equal(migrateGrandStormwatchData(data),true);const map=data.maps[0];assert.deepEqual([map.width,map.height,map.spawnX,map.spawnY,map.townX,map.townY],[160,160,80,122,80,80]);assert.equal(map.urbanPlan,'tempest-archipelago');assert.deepEqual([data.maps[1].portals[0].targetX,data.maps[1].portals[0].targetY],[80,18]);assert.deepEqual([data.maps[2].portals[0].targetX,data.maps[2].portals[0].targetY],[18,82]);assert.deepEqual([data.maps[3].portals[0].targetX,data.maps[3].portals[0].targetY],[140,136]);assert.deepEqual([data.npcs[0].posX,data.npcs[0].posY],[80,96]);assert.deepEqual([data.monsters[5].posX,data.monsters[5].posY],[112,150]);assert.deepEqual([data.nodes[0].x,data.nodes[0].y],[80,70]);const snap=JSON.stringify(data);assert.equal(migrateGrandStormwatchData(data),false);assert.equal(JSON.stringify(data),snap);});

test('9.43A administrator Stormwatch geometry blocks collateral migration',()=>{const data=legacyData();data.maps[0].width=120;data.maps[0].height=120;data.maps[0].spawnX=55;data.maps[0].spawnY=56;data.maps[0].landmarks=[{id:'admin'}];const before=JSON.stringify(data);assert.equal(migrateGrandStormwatchData(data),false);assert.equal(JSON.stringify(data),before);});

test('9.43A fresh ContentDB converges schema 9 and Stormwatch coordinates',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moria-943-')),file=path.join(dir,'content.json');try{const db=new ContentDB(file),data=db.getAllContent();assert.equal(data.grandCapitalVersion,9);const map=data.maps.find(e=>e.id==='stormwatch_isle');assert.deepEqual([map.width,map.height,map.urbanPlan,map.levelRequired],[160,160,'tempest-archipelago',44]);const npc=data.npcs.find(e=>e.id==='quest_stormwatch_isle');const node=data.nodes.find(e=>e.id==='node_stormwatch');assert.deepEqual([npc.posX,npc.posY],[80,96]);assert.deepEqual([node.x,node.y],[80,70]);}finally{fs.rmSync(dir,{recursive:true,force:true});}});

test('9.43A client server and Studio share tempest-archipelago vocabulary',()=>{const server=fs.readFileSync(new URL('../engine/World.mjs',import.meta.url),'utf8'),client=fs.readFileSync(new URL('../../src/game/maps.ts',import.meta.url),'utf8');for(const marker of ['nearStormCauseway','tempestArchipelagoTile','stormIslands']){assert.ok(server.includes(marker));assert.ok(client.includes(marker));}const fake={get(type){return type==='maps'?[clone(GRAND_STORMWATCH_MAP)]:[];}};const schema=getContentStudioSchema('maps',fake);assert.ok(schema.options.urbanPlans.includes('tempest-archipelago'));assert.equal(validateStudioRecord('maps',clone(GRAND_STORMWATCH_MAP),fake),null);});

test('9.43A eight capital algorithms remain explicitly distinct',()=>{const world=new WorldManager();for(const [id,plan]of [['eldoria','royal-grid'],['sunreach_coast','harbor-crescent'],['ironwood','forest-rings'],['frostpeak','terraced-bastion'],['shadowfen','marsh-wards'],['emberhold','caldera-radials'],['crystal_deep','geode-chambers'],['stormwatch_isle','tempest-archipelago']])assert.equal(world.getMap(id).urbanPlan,plan);});
'''
write('server/test/grand-stormwatch-isle-9-43.test.mjs',test)

docs=r'''# Mor'ia 9.43 — Grand Stormwatch Isle

## 9.43A — Capital autoritativa
Stormwatch Isle deixa de ser um assentamento legado 80×80 e passa a ser uma capital 160×160 de nível 44 com `urbanPlan: tempest-archipelago` e schema global de capitais 9.

A identidade urbana usa seis massas insulares assimétricas, mar dominante, costas rochosas bloqueadoras e causeways estreitos que ligam a Frota Norte, o cais de Crystal Deep, Thunderwatch, os bairros do sul e o esporão de Nightfall ao Olho da Tempestade. A geometria é determinística e compartilhada por servidor e cliente.

Conteúdo: 12 distritos, 42 edifícios autoritativos (20 maiores + 22 menores), três portais canônicos e quatro acessos físicos. As rotas históricas Emberhold → Stormwatch, Crystal Deep → Stormwatch e Nightfall → Stormwatch são migradas apenas quando ainda possuem as coordenadas exatas do seed legado.

NPCs, monstros e `node_stormwatch` também usam migração exact-default-only. Geometria ou coordenadas editadas por administradores não são sobrescritas.
'''
write('docs/MORIA_9_43_GRAND_STORMWATCH_ISLE.md',docs)

# Alpha seed: import + authoritative map record.
replace_once('server/engine/AlphaContent.mjs',"import { GRAND_CRYSTAL_DEEP_MAP } from './GrandCrystalDeep.mjs';","import { GRAND_CRYSTAL_DEEP_MAP } from './GrandCrystalDeep.mjs';\nimport { GRAND_STORMWATCH_MAP } from './GrandStormwatch.mjs';",'alpha import')
replace_once('server/engine/AlphaContent.mjs',"  if (region.id === 'crystal_deep') return { ...GRAND_CRYSTAL_DEEP_MAP, portals: GRAND_CRYSTAL_DEEP_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_CRYSTAL_DEEP_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_CRYSTAL_DEEP_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_CRYSTAL_DEEP_MAP.props.map(entry => ({ ...entry })) };","  if (region.id === 'crystal_deep') return { ...GRAND_CRYSTAL_DEEP_MAP, portals: GRAND_CRYSTAL_DEEP_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_CRYSTAL_DEEP_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_CRYSTAL_DEEP_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_CRYSTAL_DEEP_MAP.props.map(entry => ({ ...entry })) };\n  if (region.id === 'stormwatch_isle') return { ...GRAND_STORMWATCH_MAP, portals: GRAND_STORMWATCH_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_STORMWATCH_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_STORMWATCH_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_STORMWATCH_MAP.props.map(entry => ({ ...entry })) };",'alpha storm map')

# Canonical incoming routes from already-promoted capitals.
replace_once('server/engine/GrandEmberhold.mjs',"{x:80,y:141,targetMap:'stormwatch_isle',targetX:40,targetY:10,label:'⚡ Estrada de Stormwatch'}","{x:80,y:141,targetMap:'stormwatch_isle',targetX:80,targetY:18,label:'⚡ Estrada de Stormwatch'}",'emberhold Stormwatch target')
replace_once('server/engine/GrandCrystalDeep.mjs',"{x:141,y:84,targetMap:'stormwatch_isle',targetX:10,targetY:40,label:'⚡ Elevador de Stormwatch'}","{x:141,y:84,targetMap:'stormwatch_isle',targetX:18,targetY:82,label:'⚡ Elevador de Stormwatch'}",'crystal Stormwatch target')

# ContentDB schema 9 chain.
replace_once('server/engine/ContentDB.mjs',"import { GRAND_CAPITAL_SCHEMA_VERSION, migrateGrandCrystalDeepData } from './GrandCrystalDeep.mjs';","import { migrateGrandCrystalDeepData } from './GrandCrystalDeep.mjs';\nimport { GRAND_CAPITAL_SCHEMA_VERSION, migrateGrandStormwatchData } from './GrandStormwatch.mjs';",'ContentDB import')
replace_once('server/engine/ContentDB.mjs',"    // Every capital migration is idempotent and exact-default-only. Schema 8 adds Crystal Deep.","    // Every capital migration is idempotent and exact-default-only. Schema 9 adds Stormwatch Isle.",'ContentDB schema comment')
replace_once('server/engine/ContentDB.mjs',"    migrateGrandCrystalDeepData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;","    migrateGrandCrystalDeepData(this.data);\n    migrateGrandStormwatchData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;",'ContentDB migration')

# Server world vocabulary and built-in Stormwatch config.
replace_once('server/engine/World.mjs',"import { GRAND_CRYSTAL_DEEP_BUILTIN_WORLD_CONFIG } from './GrandCrystalDeep.mjs';","import { GRAND_CRYSTAL_DEEP_BUILTIN_WORLD_CONFIG } from './GrandCrystalDeep.mjs';\nimport { GRAND_STORMWATCH_BUILTIN_WORLD_CONFIG } from './GrandStormwatch.mjs';",'World import')
replace_once('server/engine/World.mjs',"'caldera-radials','geode-chambers'","'caldera-radials','geode-chambers','tempest-archipelago'",'World urban plans')
replace_once('server/engine/World.mjs',"  crystal_deep: GRAND_CRYSTAL_DEEP_BUILTIN_WORLD_CONFIG,\n  voidlands:","  crystal_deep: GRAND_CRYSTAL_DEEP_BUILTIN_WORLD_CONFIG,\n  stormwatch_isle: GRAND_STORMWATCH_BUILTIN_WORLD_CONFIG,\n  voidlands:",'World map config')
replace_once('server/engine/World.mjs',"id === 'shadowfen' ? 'marsh-wards' : 'royal-grid'","id === 'shadowfen' ? 'marsh-wards' : id === 'emberhold' ? 'caldera-radials' : id === 'crystal_deep' ? 'geode-chambers' : id === 'stormwatch_isle' ? 'tempest-archipelago' : 'royal-grid'",'World urban fallback')

storm_server=r'''
function nearStormCauseway(x,y,ax,ay,bx,by,width=2){const vx=bx-ax,vy=by-ay,wx=x-ax,wy=y-ay,length=vx*vx+vy*vy;const t=length?Math.max(0,Math.min(1,(wx*vx+wy*vy)/length)):0;const px=ax+t*vx,py=ay+t*vy;return (x-px)*(x-px)+(y-py)*(y-py)<=width*width;}
function tempestArchipelagoTile(config,x,y){
  const bounds=config.urbanBounds;if(!bounds)return null;const minX=Number(bounds.x),minY=Number(bounds.y),maxX=minX+Number(bounds.width)-1,maxY=minY+Number(bounds.height)-1;if(x<minX||x>maxX||y<minY||y>maxY)return null;
  const stormIslands=[[80,80,26,25],[80,34,24,16],[34,82,19,24],[126,82,19,24],[80,128,27,17],[128,130,16,13]];
  const inside=(entry,scale=1)=>{const [cx,cy,rx,ry]=entry;return Math.pow((x-cx)/(rx*scale),2)+Math.pow((y-cy)/(ry*scale),2)<=1;};
  const land=stormIslands.some(entry=>inside(entry)),inner=stormIslands.some(entry=>inside(entry,.82));
  const causeways=[[80,14,80,55],[14,82,55,82],[105,82,145,82],[80,105,80,145],[105,96,128,130],[128,130,145,140]];
  const causeway=causeways.some(segment=>nearStormCauseway(x,y,...segment));if(causeway)return {type:land?'path':'bridge',walkable:true,blocksSight:false};
  if(!land)return {type:'water',walkable:false,blocksSight:false};if(!inner)return {type:'rock',walkable:false,blocksSight:true};
  const dx=x-80,dy=y-80,central=Math.pow(dx/26,2)+Math.pow(dy/25,2)<=Math.pow(.82,2);const ring=central&&Math.abs(Math.sqrt(Math.pow(dx/26,2)+Math.pow(dy/25,2))-.55)<=.05;const axes=central&&(Math.abs(dx)<=1||Math.abs(dy)<=1);
  const local=(inside(stormIslands[1],.82)&&Math.abs(x-80)<=1)||(inside(stormIslands[2],.82)&&Math.abs(y-82)<=1)||(inside(stormIslands[3],.82)&&Math.abs(y-82)<=1)||(inside(stormIslands[4],.82)&&Math.abs(x-80)<=1)||(inside(stormIslands[5],.82)&&Math.abs((y-130)-.6*(x-128))<=1);
  return {type:(ring||axes||local)?'path':'snow',walkable:true,blocksSight:false};
}

'''
replace_once('server/engine/World.mjs','function capitalUrbanTile(config, x, y) {',storm_server+'function capitalUrbanTile(config, x, y) {','World storm topology')
replace_once('server/engine/World.mjs',"  if (config.urbanPlan === 'geode-chambers') return geodeChambersTile(config, x, y);","  if (config.urbanPlan === 'geode-chambers') return geodeChambersTile(config, x, y);\n  if (config.urbanPlan === 'tempest-archipelago') return tempestArchipelagoTile(config, x, y);",'World storm dispatch')

# Client vocabulary mirrors server exactly.
replace_once('src/game/maps.ts',"'caldera-radials' | 'geode-chambers'","'caldera-radials' | 'geode-chambers' | 'tempest-archipelago'",'client urban type')
old_urban="function urbanPlanOf(value: unknown, mapId = ''): UrbanPlan { const fallback: UrbanPlan = mapId === 'sunreach_coast' ? 'harbor-crescent' : mapId === 'ironwood' ? 'forest-rings' : mapId === 'frostpeak' ? 'terraced-bastion' : mapId === 'shadowfen' ? 'marsh-wards' : mapId === 'emberhold' ? 'caldera-radials' : mapId === 'crystal_deep' ? 'geode-chambers' : 'royal-grid'; const requested = String(value || fallback); return requested === 'harbor-crescent' || requested === 'forest-rings' || requested === 'terraced-bastion' || requested === 'marsh-wards' || requested === 'caldera-radials' || requested === 'geode-chambers' ? requested : 'royal-grid'; }"
new_urban="function urbanPlanOf(value: unknown, mapId = ''): UrbanPlan { const fallback: UrbanPlan = mapId === 'sunreach_coast' ? 'harbor-crescent' : mapId === 'ironwood' ? 'forest-rings' : mapId === 'frostpeak' ? 'terraced-bastion' : mapId === 'shadowfen' ? 'marsh-wards' : mapId === 'emberhold' ? 'caldera-radials' : mapId === 'crystal_deep' ? 'geode-chambers' : mapId === 'stormwatch_isle' ? 'tempest-archipelago' : 'royal-grid'; const requested = String(value || fallback); return requested === 'harbor-crescent' || requested === 'forest-rings' || requested === 'terraced-bastion' || requested === 'marsh-wards' || requested === 'caldera-radials' || requested === 'geode-chambers' || requested === 'tempest-archipelago' ? requested as UrbanPlan : 'royal-grid'; }"
replace_once('src/game/maps.ts',old_urban,new_urban,'client urban resolver')
storm_client=r'''
function nearStormCauseway(x:number,y:number,ax:number,ay:number,bx:number,by:number,width=2){const vx=bx-ax,vy=by-ay,wx=x-ax,wy=y-ay,length=vx*vx+vy*vy;const t=length?Math.max(0,Math.min(1,(wx*vx+wy*vy)/length)):0;const px=ax+t*vx,py=ay+t*vy;return (x-px)*(x-px)+(y-py)*(y-py)<=width*width;}
function tempestArchipelagoTile(map:GameMap,x:number,y:number):Tile|null{
  const bounds=map.urbanBounds;if(!bounds)return null;const minX=bounds.x,minY=bounds.y,maxX=minX+bounds.width-1,maxY=minY+bounds.height-1;if(x<minX||x>maxX||y<minY||y>maxY)return null;
  const stormIslands:number[][]=[[80,80,26,25],[80,34,24,16],[34,82,19,24],[126,82,19,24],[80,128,27,17],[128,130,16,13]];
  const inside=(entry:number[],scale=1)=>{const [cx,cy,rx,ry]=entry;return Math.pow((x-cx)/(rx*scale),2)+Math.pow((y-cy)/(ry*scale),2)<=1;};const land=stormIslands.some(entry=>inside(entry)),inner=stormIslands.some(entry=>inside(entry,.82));
  const causeways:number[][]=[[80,14,80,55],[14,82,55,82],[105,82,145,82],[80,105,80,145],[105,96,128,130],[128,130,145,140]];const causeway=causeways.some(segment=>nearStormCauseway(x,y,...segment as [number,number,number,number]));if(causeway)return {type:land?'path':'bridge',walkable:true,blocksSight:false};
  if(!land)return {type:'water',walkable:false,blocksSight:false};if(!inner)return {type:'rock',walkable:false,blocksSight:true};const dx=x-80,dy=y-80,central=Math.pow(dx/26,2)+Math.pow(dy/25,2)<=Math.pow(.82,2);const ring=central&&Math.abs(Math.sqrt(Math.pow(dx/26,2)+Math.pow(dy/25,2))-.55)<=.05;const axes=central&&(Math.abs(dx)<=1||Math.abs(dy)<=1);const local=(inside(stormIslands[1],.82)&&Math.abs(x-80)<=1)||(inside(stormIslands[2],.82)&&Math.abs(y-82)<=1)||(inside(stormIslands[3],.82)&&Math.abs(y-82)<=1)||(inside(stormIslands[4],.82)&&Math.abs(x-80)<=1)||(inside(stormIslands[5],.82)&&Math.abs((y-130)-.6*(x-128))<=1);return {type:(ring||axes||local)?'path':'snow',walkable:true,blocksSight:false};
}

'''
replace_once('src/game/maps.ts','function capitalUrbanTile(map: GameMap, x: number, y: number): Tile | null {',storm_client+'function capitalUrbanTile(map: GameMap, x: number, y: number): Tile | null {','client storm topology')
replace_once('src/game/maps.ts',"  if (map.urbanPlan === 'geode-chambers') return geodeChambersTile(map, x, y);","  if (map.urbanPlan === 'geode-chambers') return geodeChambersTile(map, x, y);\n  if (map.urbanPlan === 'tempest-archipelago') return tempestArchipelagoTile(map, x, y);",'client storm dispatch')

# Historical schema assertion must remain forward-compatible.
replace_once('server/test/grand-crystal-deep-9-42.test.mjs','assert.equal(data.grandCapitalVersion,8);','assert.ok(data.grandCapitalVersion>=8);','9.42 historical schema')

print('Mor\'ia 9.43A Grand Stormwatch Isle applicator complete')
