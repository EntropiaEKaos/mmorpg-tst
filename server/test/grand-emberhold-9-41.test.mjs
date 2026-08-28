import test from 'node:test';
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
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moria-941-')),file=path.join(dir,'content.json');try{const db=new ContentDB(file),data=db.getAllContent();assert.equal(data.version,3);assert.ok(data.grandCapitalVersion>=7);const map=data.maps.find(entry=>entry.id==='emberhold');assert.deepEqual([map.width,map.height,map.urbanPlan,map.levelRequired],[160,160,'caldera-radials',28]);const npc=data.npcs.find(entry=>entry.id==='quest_emberhold');const node=data.nodes.find(entry=>entry.id==='node_emberhold');assert.deepEqual([npc.posX,npc.posY],[80,116]);assert.deepEqual([node.x,node.y],[80,66]);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('9.41A client server and Studio share caldera-radials vocabulary',()=>{
  const server=fs.readFileSync(new URL('../engine/World.mjs',import.meta.url),'utf8'),client=fs.readFileSync(new URL('../../src/game/maps.ts',import.meta.url),'utf8');
  for(const marker of ['calderaRadialsTile','forgeRing','serviceRoad','forgeCourts','fissureA','fissureB','molten']){assert.ok(server.includes(marker));assert.ok(client.includes(marker));}
  const fakeDb={get(type){return type==='maps'?[clone(GRAND_EMBERHOLD_MAP)]:[];}};const schema=getContentStudioSchema('maps',fakeDb);assert.ok(schema.options.urbanPlans.includes('caldera-radials'));assert.equal(validateStudioRecord('maps',clone(GRAND_EMBERHOLD_MAP),fakeDb),null);
});

test('9.41A six approved capital algorithms remain distinct and reachable',()=>{
  const world=new WorldManager();assert.equal(world.getMap('eldoria').urbanPlan,'royal-grid');assert.equal(world.getMap('sunreach_coast').urbanPlan,'harbor-crescent');assert.equal(world.getMap('ironwood').urbanPlan,'forest-rings');assert.equal(world.getMap('frostpeak').urbanPlan,'terraced-bastion');assert.equal(world.getMap('shadowfen').urbanPlan,'marsh-wards');assert.equal(world.getMap('emberhold').urbanPlan,'caldera-radials');
});
