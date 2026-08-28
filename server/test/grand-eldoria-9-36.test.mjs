import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { WorldManager, WORLD } from '../engine/World.mjs';
import { HousingSystem } from '../engine/HousingSystem.mjs';
import { GRAND_ELDORIA_MAP, GRAND_ELDORIA_VERSION, migrateGrandEldoriaData } from '../engine/GrandEldoria.mjs';
import { ALPHA_SYSTEMS_CONTENT } from '../engine/AlphaSystemsContent.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const clone = value => JSON.parse(JSON.stringify(value));

function legacyData() {
  return {
    maps:[
      { id:'eldoria', width:80, height:80, spawnX:40, spawnY:40, townX:40, townY:40, townRange:8, portals:[
        {x:10,y:40,targetMap:'frostpeak',targetX:70,targetY:40},{x:70,y:10,targetMap:'shadowfen',targetX:40,targetY:70},
        {x:40,y:10,targetMap:'sunreach_coast',targetX:40,targetY:68},{x:70,y:40,targetMap:'ironwood',targetX:10,targetY:40},{x:40,y:70,targetMap:'gm_sanctum',targetX:40,targetY:40},
      ] },
      { id:'frostpeak', portals:[{x:75,y:40,targetMap:'eldoria',targetX:12,targetY:40}] },
      { id:'shadowfen', portals:[{x:40,y:75,targetMap:'eldoria',targetX:68,targetY:12}] },
      { id:'sunreach_coast', portals:[{x:40,y:72,targetMap:'eldoria',targetX:40,targetY:12}] },
      { id:'ironwood', portals:[{x:8,y:40,targetMap:'eldoria',targetX:68,targetY:40}] },
      { id:'gm_sanctum', portals:[{x:40,y:72,targetMap:'eldoria',targetX:40,targetY:68}] },
    ],
    npcs:[{id:'banker',mapId:'eldoria',posX:34,posY:38},{id:'librarian',mapId:'eldoria',posX:40,posY:45}],
    monsters:[{id:'eldoria_field_rat',mapId:'eldoria',posX:18,posY:20},{id:'eldoria_old_grove_colossus',mapId:'eldoria',posX:58,posY:55}],
    houses:clone(ALPHA_SYSTEMS_CONTENT.houses.filter(h=>h.mapId==='eldoria')),
    nodes:[{id:'node_eldoria',mapId:'eldoria',x:40,y:40}],
  };
}

test('9.36A Grand Eldoria stays a 160x160 authored capital while unpromoted built-ins remain legacy-sized', () => {
  const world = new WorldManager();
  const eldoria = world.getMap('eldoria');
  const shadowfen = world.getMap('shadowfen');
  assert.equal(eldoria.width,160); assert.equal(eldoria.height,160); assert.equal(eldoria.settlementClass,'capital');
  assert.equal(shadowfen.width,80); assert.equal(shadowfen.height,80);
  assert.ok(eldoria.districts.length >= 10); assert.ok(eldoria.landmarks.length >= 16); assert.ok(eldoria.props.length >= 60);
});

test('9.36A capital generation creates a walled city, gate openings, avenues and urban floor', () => {
  const world = new WorldManager(); const map = world.getMap('eldoria');
  assert.equal(map.tiles[60][28].type,'wall'); assert.equal(map.tiles[60][28].walkable,false);
  assert.equal(map.tiles[80][28].type,'path'); assert.equal(map.tiles[80][28].walkable,true);
  assert.equal(map.tiles[60][80].type,'path');
  assert.equal(map.tiles[64][72].type,'floor'); assert.equal(map.tiles[64][72].walkable,true);
  assert.equal(map.tiles[88][80].type,'path'); assert.deepEqual(map.spawnPoint,{x:80,y:88});
});

test('9.36A legacy migration moves exact defaults across map, inbound travel, NPCs, monsters, houses and living Node', () => {
  const data=legacyData(); assert.equal(migrateGrandEldoriaData(data),true);
  const map=data.maps.find(m=>m.id==='eldoria'); assert.equal(map.width,160); assert.equal(map.height,160); assert.equal(map.settlementClass,'capital');
  assert.deepEqual([map.spawnX,map.spawnY,map.townX,map.townY],[80,88,80,80]);
  assert.deepEqual([map.portals.find(p=>p.targetMap==='frostpeak').x,map.portals.find(p=>p.targetMap==='frostpeak').y],[28,80]);
  assert.deepEqual([data.maps.find(m=>m.id==='frostpeak').portals[0].targetX,data.maps.find(m=>m.id==='frostpeak').portals[0].targetY],[30,80]);
  assert.deepEqual([data.maps.find(m=>m.id==='shadowfen').portals[0].targetX,data.maps.find(m=>m.id==='shadowfen').portals[0].targetY],[130,120]);
  assert.deepEqual([data.npcs.find(n=>n.id==='banker').posX,data.npcs.find(n=>n.id==='banker').posY],[68,84]);
  assert.deepEqual([data.monsters.find(m=>m.id==='eldoria_field_rat').posX,data.monsters.find(m=>m.id==='eldoria_field_rat').posY],[20,122]);
  assert.deepEqual([data.houses.find(h=>h.id==='house_oakhearth').x,data.houses.find(h=>h.id==='house_oakhearth').y],[36,120]);
  assert.deepEqual([data.nodes[0].x,data.nodes[0].y],[80,80]);
  assert.equal(migrateGrandEldoriaData(data),false, 'migration must be idempotent after exact defaults moved');
});

test('9.36A migration preserves administrator-authored dimensions, architecture and coordinates', () => {
  const data=legacyData(); const map=data.maps[0];
  map.width=120; map.height=120; map.spawnX=55; map.spawnY=56; map.landmarks=[{id:'admin_keep',name:'Admin Keep',kind:'keep',x:20,y:20,w:4,h:4}];
  data.npcs[0].posX=61; data.npcs[0].posY=62;
  assert.equal(migrateGrandEldoriaData(data),false);
  assert.equal(map.width,120); assert.equal(map.height,120); assert.deepEqual([map.spawnX,map.spawnY],[55,56]);
  assert.equal(map.landmarks[0].id,'admin_keep'); assert.deepEqual([data.npcs[0].posX,data.npcs[0].posY],[61,62]);
});

test('9.36A Grand Eldoria housing footprints remain valid against authoritative architecture', () => {
  const data=legacyData(); migrateGrandEldoriaData(data);
  WORLD.syncContentMaps(data.maps);
  const fakeDb={ get(type){ if(type==='houses')return data.houses; return []; } };
  const temp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'moria-eldoria-housing-')),'housing.json');
  const housing=new HousingSystem(fakeDb,temp);
  for(const house of data.houses) assert.equal(housing.validateDefinition(house,fakeDb),null,house.id);
});

test('9.36A client and server keep the same capital road algorithm', () => {
  const server=fs.readFileSync(path.join(root,'server/engine/World.mjs'),'utf8');
  const client=fs.readFileSync(path.join(root,'src/game/maps.ts'),'utf8');
  for(const marker of ['cx - 28','cx + 28','minX + 14','maxX - 14',"? 'path' : 'floor'"]) {
    assert.ok(server.includes(marker),`server missing ${marker}`); assert.ok(client.includes(marker),`client missing ${marker}`);
  }
  assert.match(client,/capitalUrbanTile\(mapData, x, y\)/);
});

test('9.36A ContentDB exposes a separate Grand Capital migration marker without changing legacy schema version', () => {
  const source=fs.readFileSync(path.join(root,'server/engine/ContentDB.mjs'),'utf8');
  assert.match(source,/grandCapitalVersion/); assert.match(source,/migrateGrandCapitalV1/); assert.match(source,/GRAND_CAPITAL_SCHEMA_VERSION/); assert.match(source,/migrateGrandEldoriaData/);
  assert.match(source,/this\.data\.version = 3/);
  assert.equal(GRAND_ELDORIA_VERSION,2);
});
