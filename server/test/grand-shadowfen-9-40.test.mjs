import test from 'node:test';
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
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moria-940-')),file=path.join(dir,'content.json');try{const db=new ContentDB(file),data=db.getAllContent();assert.equal(data.version,3);assert.ok(data.grandCapitalVersion>=6);const map=data.maps.find(entry=>entry.id==='shadowfen');assert.deepEqual([map.width,map.height,map.urbanPlan,map.levelRequired],[160,160,'marsh-wards',20]);const npc=data.npcs.find(entry=>entry.id==='quest_shadowfen');const node=data.nodes.find(entry=>entry.id==='node_shadowfen');assert.deepEqual([npc.posX,npc.posY],[78,100]);assert.deepEqual([node.x,node.y],[80,82]);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('9.40A client server and Studio share marsh-wards vocabulary',()=>{
  const server=fs.readFileSync(new URL('../engine/World.mjs',import.meta.url),'utf8'),client=fs.readFileSync(new URL('../../src/game/maps.ts',import.meta.url),'utf8');
  for(const marker of ['marshWardsTile','westCanal','eastCanal','crossCanal','boardwalk','fenCourt']){assert.ok(server.includes(marker));assert.ok(client.includes(marker));}
  const fakeDb={get(type){return type==='maps'?[clone(GRAND_SHADOWFEN_MAP)]:[];}};const schema=getContentStudioSchema('maps',fakeDb);assert.ok(schema.options.urbanPlans.includes('marsh-wards'));assert.equal(validateStudioRecord('maps',clone(GRAND_SHADOWFEN_MAP),fakeDb),null);
});

test('9.40A five approved capital algorithms remain distinct and reachable',()=>{
  const world=new WorldManager();assert.equal(world.getMap('eldoria').urbanPlan,'royal-grid');assert.equal(world.getMap('sunreach_coast').urbanPlan,'harbor-crescent');assert.equal(world.getMap('ironwood').urbanPlan,'forest-rings');assert.equal(world.getMap('frostpeak').urbanPlan,'terraced-bastion');assert.equal(world.getMap('shadowfen').urbanPlan,'marsh-wards');
});
