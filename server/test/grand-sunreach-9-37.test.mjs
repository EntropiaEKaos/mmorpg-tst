import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WorldManager } from '../engine/World.mjs';
import { GRAND_CAPITAL_SCHEMA_VERSION, GRAND_SUNREACH_MAP, GRAND_SUNREACH_VERSION, migrateGrandSunreachData } from '../engine/GrandSunreach.mjs';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'../..');
const clone=value=>JSON.parse(JSON.stringify(value));

function legacyData(){return{
  maps:[
    {id:'sunreach_coast',width:80,height:80,spawnX:40,spawnY:58,townX:40,townY:58,townRange:8,cityStyle:'harbor',portals:[
      {x:40,y:72,targetMap:'eldoria',targetX:80,targetY:26,label:'🏰 Eldoria'},
      {x:72,y:40,targetMap:'ironwood',targetX:12,targetY:40,label:'🌲 Ironwood Trail'},
    ]},
    {id:'eldoria',width:160,height:160,portals:[{x:80,y:24,targetMap:'sunreach_coast',targetX:40,targetY:68,label:'🌊 Portão de Sunreach'}]},
    {id:'ironwood',width:80,height:80,portals:[]},
  ],
  npcs:[{id:'quest_sunreach_coast',mapId:'sunreach_coast',posX:38,posY:58},{id:'merchant_sunreach_coast',mapId:'sunreach_coast',posX:42,posY:58},{id:'warden_sunreach_coast',mapId:'sunreach_coast',posX:40,posY:60}],
  monsters:[
    {id:'sunreach_coast_reef_crab',mapId:'sunreach_coast',posX:18,posY:27},
    {id:'sunreach_coast_saltfang_serpent',mapId:'sunreach_coast',posX:26,posY:34},
    {id:'sunreach_coast_corsair_deckhand',mapId:'sunreach_coast',posX:34,posY:41},
    {id:'sunreach_coast_tide_wisp',mapId:'sunreach_coast',posX:42,posY:48},
    {id:'sunreach_coast_drowned_reaver',mapId:'sunreach_coast',posX:50,posY:55},
    {id:'sunreach_coast_leviathan_spawn',mapId:'sunreach_coast',posX:58,posY:20},
  ],
  nodes:[{id:'node_sunreach',mapId:'sunreach_coast',x:40,y:58}],
};}

test('9.37A Grand Sunreach is a 160x160 harbor capital distinct from royal Eldoria',()=>{
  const world=new WorldManager();
  const map=world.getMap('sunreach_coast');
  assert.equal(GRAND_SUNREACH_VERSION,1); assert.equal(GRAND_CAPITAL_SCHEMA_VERSION,3);
  assert.equal(map.width,160); assert.equal(map.height,160); assert.equal(map.settlementClass,'capital'); assert.equal(map.urbanPlan,'harbor-crescent');
  assert.equal(map.districts.length,12); assert.equal(map.landmarks.length,38); assert.ok(map.props.length>=50);
  assert.equal(world.getMap('eldoria').urbanPlan,'royal-grid');
  assert.equal(world.getMap('voidlands').width,80);
});

test('9.37A harbor terrain has terrestrial walls, curved sea, quay, piers and breakwater',()=>{
  const world=new WorldManager(); const map=world.getMap('sunreach_coast');
  assert.equal(map.tiles[20][60].type,'wall'); assert.equal(map.tiles[20][60].walkable,false);
  assert.equal(map.tiles[20][80].type,'path'); assert.equal(map.tiles[20][80].walkable,true);
  assert.equal(map.tiles[100][82].type,'path');
  assert.equal(map.tiles[120][80].type,'water'); assert.equal(map.tiles[120][80].walkable,false);
  assert.equal(map.tiles[115][50].type,'bridge'); assert.equal(map.tiles[115][50].walkable,true);
  assert.equal(map.tiles[132][50].type,'bridge');
  assert.equal(map.tiles[132][80].type,'water','central breakwater entrance must remain open water');
});

test('9.37A legacy migration upgrades exact Sunreach defaults and Eldoria inbound arrival',()=>{
  const data=legacyData(); assert.equal(migrateGrandSunreachData(data),true);
  const map=data.maps[0];
  assert.deepEqual([map.width,map.height,map.spawnX,map.spawnY,map.townX,map.townY],[160,160,80,78,80,70]);
  assert.equal(map.urbanPlan,'harbor-crescent'); assert.equal(map.landmarks.length,38); assert.equal(map.districts.length,12);
  assert.deepEqual([map.portals[0].x,map.portals[0].y,map.portals[0].targetX,map.portals[0].targetY],[80,20,80,26]);
  assert.deepEqual([map.portals[1].x,map.portals[1].y],[137,70]);
  assert.deepEqual([data.maps[1].portals[0].targetX,data.maps[1].portals[0].targetY],[80,24]);
  assert.deepEqual([data.npcs[0].posX,data.npcs[0].posY],[54,72]);
  assert.deepEqual([data.monsters[0].posX,data.monsters[0].posY],[18,58]);
  assert.deepEqual([data.nodes[0].x,data.nodes[0].y],[80,70]);
  assert.equal(migrateGrandSunreachData(data),false);
});

test('9.37A administrator-authored Sunreach geometry and coordinates are preserved',()=>{
  const data=legacyData(); const map=data.maps[0];
  map.width=120; map.height=120; map.spawnX=55; map.spawnY=75; map.landmarks=[{id:'admin_dock',name:'Admin Dock',kind:'dock',x:20,y:20,w:5,h:5}];
  data.npcs[0].posX=61; data.npcs[0].posY=62;
  assert.equal(migrateGrandSunreachData(data),false);
  assert.deepEqual([map.width,map.height,map.spawnX,map.spawnY],[120,120,55,75]); assert.equal(map.landmarks[0].id,'admin_dock');
  assert.deepEqual([data.npcs[0].posX,data.npcs[0].posY],[61,62]);
});

test('9.37A client and server implement the same explicit harbor-crescent plan',()=>{
  const server=fs.readFileSync(path.join(root,'server/engine/World.mjs'),'utf8');
  const client=fs.readFileSync(path.join(root,'src/game/maps.ts'),'utf8');
  for(const marker of ["harbor-crescent",'townCenter.y + 32','cx - 30','cx + 30','cy + 62',"type:'bridge'",'shoreY - 3']){
    assert.ok(server.includes(marker),`server missing ${marker}`); assert.ok(client.includes(marker),`client missing ${marker}`);
  }
  assert.match(server,/urbanPlan: config\.urbanPlan/); assert.match(client,/urbanPlanOf\(raw\.urbanPlan/);
});

test('9.37A global capital migration schema advances without changing base content schema',()=>{
  const source=fs.readFileSync(path.join(root,'server/engine/ContentDB.mjs'),'utf8');
  assert.match(source,/GRAND_CAPITAL_SCHEMA_VERSION/); assert.match(source,/migrateGrandEldoriaData\(this\.data\)/); assert.match(source,/migrateGrandSunreachData\(this\.data\)/);
  assert.match(source,/this\.data\.version = 3/); assert.equal(GRAND_CAPITAL_SCHEMA_VERSION,3);
});
