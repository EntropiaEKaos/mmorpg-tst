import test from 'node:test';
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
    {id:'frostpeak_snow_stalker',mapId:'frostpeak',posX:18,posY:41},{id:'frostpeak_icefang_wolf',mapId:'frostpeak',posX:26,posY:48},{id:'frostpeak_frost_cultist',mapId:'frostpeak',posX:34,posY:55},{id:'frostpeak_glacier_golem',mapId:'frostpeak',posX:42,posY:62},{id:'frostpeak_yeti_warmaster',mapId:'frostpeak',posX:50,posY:69},{id:'frostpeak_skadi_the_white',mapId:'frostpeak',posX:58,posY:34},
  ],
  houses:[{id:'house_frostwatch',mapId:'frostpeak',x:58,y:31,width:5,height:4,entranceX:60,entranceY:35},{id:'house_snowpine',mapId:'frostpeak',x:68,y:46,width:5,height:4,entranceX:70,entranceY:45}],
  nodes:[{id:'node_frostpeak',mapId:'frostpeak',x:65,y:40}],
};}

test('9.39A Grand Frostpeak is a 160x160 alpine terrace capital',()=>{
  assert.equal(GRAND_FROSTPEAK_MAP.width,160);assert.equal(GRAND_FROSTPEAK_MAP.height,160);assert.equal(GRAND_FROSTPEAK_MAP.settlementClass,'capital');assert.equal(GRAND_FROSTPEAK_MAP.urbanPlan,'terraced-bastion');
  assert.equal(GRAND_FROSTPEAK_MAP.districts.length,12);assert.equal(GRAND_FROSTPEAK_MAP.landmarks.length,41);assert.ok(GRAND_FROSTPEAK_MAP.props.length>=90);
  assert.equal(MAP_CONFIG.frostpeak.width,160);assert.equal(MAP_CONFIG.frostpeak.urbanPlan,'terraced-bastion');assert.ok(URBAN_PLANS.has('terraced-bastion'));
});

test('9.39A alpine topology creates fortress boundary retaining walls ramps terraces and courts',()=>{
  const map=new WorldManager().getMap('frostpeak');
  assert.equal(map.tiles[50][26].type,'wall');
  for(const [x,y] of [[26,82],[133,112],[80,18],[80,139]])assert.equal(map.tiles[y][x].type,'path',`gate ${x},${y}`);
  assert.equal(map.tiles[42][70].type,'wall');assert.equal(map.tiles[42][80].type,'path');assert.equal(map.tiles[42][50].type,'path');
  assert.equal(map.tiles[58][70].type,'path');assert.equal(map.tiles[60][90].type,'snow');
});

test('9.39A legacy migration upgrades exact Frostpeak defaults and all incoming travel',()=>{
  const data=legacyData();assert.equal(migrateGrandFrostpeakData(data),true);const map=data.maps[0];
  assert.deepEqual([map.width,map.height,map.spawnX,map.spawnY,map.townX,map.townY],[160,160,80,104,80,76]);assert.equal(map.portals.length,4);
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
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moria-939-')),file=path.join(dir,'content.json');try{const db=new ContentDB(file),data=db.getAllContent();assert.equal(data.version,3);assert.equal(data.grandCapitalVersion,GRAND_CAPITAL_SCHEMA_VERSION);const map=data.maps.find(entry=>entry.id==='frostpeak');assert.deepEqual([map.width,map.height,map.urbanPlan],[160,160,'terraced-bastion']);const npc=data.npcs.find(entry=>entry.id==='quest_frostpeak');const node=data.nodes.find(entry=>entry.id==='node_frostpeak');assert.deepEqual([npc.posX,npc.posY],[74,100]);assert.deepEqual([node.x,node.y],[80,76]);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('9.39A client server and Studio share terraced-bastion vocabulary',()=>{
  const server=fs.readFileSync(new URL('../engine/World.mjs',import.meta.url),'utf8'),client=fs.readFileSync(new URL('../../src/game/maps.ts',import.meta.url),'utf8');
  for(const marker of ['terracedBastionTile','retaining','terraceRoad','highCourt','forgeCourt','expeditionCourt','lowerCourt']){assert.ok(server.includes(marker));assert.ok(client.includes(marker));}
  const fakeDb={get(type){return type==='maps'?[clone(GRAND_FROSTPEAK_MAP)]:[];}};const schema=getContentStudioSchema('maps',fakeDb);assert.ok(schema.options.urbanPlans.includes('terraced-bastion'));assert.equal(validateStudioRecord('maps',clone(GRAND_FROSTPEAK_MAP),fakeDb),null);
});

test('9.39A previously approved capital algorithms stay distinct and reachable',()=>{
  const world=new WorldManager();assert.equal(world.getMap('eldoria').urbanPlan,'royal-grid');assert.equal(world.getMap('sunreach_coast').urbanPlan,'harbor-crescent');assert.equal(world.getMap('ironwood').urbanPlan,'forest-rings');assert.equal(world.getMap('frostpeak').urbanPlan,'terraced-bastion');
});


test('9.39A snow is a real shared tile instead of green fallback',()=>{
  const map=new WorldManager().getMap('frostpeak');assert.equal(map.tiles[60][90].type,'snow');
  const types=fs.readFileSync(new URL('../../src/game/types.ts',import.meta.url),'utf8');const render=fs.readFileSync(new URL('../../src/game/render.ts',import.meta.url),'utf8');
  assert.match(types,/\| 'snow'/);assert.match(render,/tileCache\.set\(`snow_/);
});
