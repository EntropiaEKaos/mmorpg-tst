import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { GRAND_IRONWOOD_MAP, GRAND_CAPITAL_SCHEMA_VERSION, migrateGrandIronwoodData } from '../engine/GrandIronwood.mjs';
import { MAP_CONFIG, URBAN_PLANS, WorldManager } from '../engine/World.mjs';
import { ContentDB } from '../engine/ContentDB.mjs';
import { getContentStudioSchema, validateStudioRecord } from '../engine/ContentStudio.mjs';
import { validateContentReferences } from '../engine/ContentIntegrity.mjs';

function clone(value) { return JSON.parse(JSON.stringify(value)); }

test('9.38A Grand Ironwood is a 160x160 forest-ring capital with dense authored identity', () => {
  assert.equal(GRAND_IRONWOOD_MAP.width, 160);
  assert.equal(GRAND_IRONWOOD_MAP.height, 160);
  assert.equal(GRAND_IRONWOOD_MAP.settlementClass, 'capital');
  assert.equal(GRAND_IRONWOOD_MAP.urbanPlan, 'forest-rings');
  assert.equal(GRAND_IRONWOOD_MAP.districts.length, 12);
  assert.equal(GRAND_IRONWOOD_MAP.landmarks.length, 40);
  assert.ok(GRAND_IRONWOOD_MAP.props.length >= 90);
  assert.equal(MAP_CONFIG.ironwood.width, 160);
  assert.equal(MAP_CONFIG.ironwood.urbanPlan, 'forest-rings');
  assert.ok(URBAN_PLANS.has('royal-grid') && URBAN_PLANS.has('harbor-crescent') && URBAN_PLANS.has('forest-rings'));
});

test('9.38A forest topology has living palisades, four gates, ring trails and real groves', () => {
  const world = new WorldManager();
  const map = world.getMap('ironwood');
  assert.equal(map.tiles[50][24].type, 'tree');
  for (const [x,y] of [[24,78],[135,78],[80,22],[80,137]]) {
    assert.equal(map.tiles[y][x].type, 'path', `gate ${x},${y} must be open`);
    assert.equal(map.tiles[y][x].walkable, true);
  }
  assert.equal(map.tiles[92][94].type, 'path');
  assert.equal(map.tiles[105][107].type, 'path');
  assert.equal(map.tiles[50][49].type, 'tree');
  assert.equal(map.tiles[58][90].type, 'grass');
});

test('9.38A legacy migration moves exact defaults and incoming travel once', () => {
  const data = {
    maps: [
      { id:'ironwood', width:80, height:80, spawnX:20, spawnY:40, townX:20, townY:40, townRange:8, cityStyle:'ironwood', portals:[
        {x:8,y:40,targetMap:'eldoria',targetX:130,targetY:80,label:'old'},
        {x:40,y:8,targetMap:'frostpeak',targetX:68,targetY:40,label:'old'},
      ]},
      { id:'eldoria', width:160, height:160, portals:[{x:132,y:80,targetMap:'ironwood',targetX:10,targetY:40}] },
      { id:'sunreach_coast', width:160, height:160, portals:[{x:137,y:70,targetMap:'ironwood',targetX:12,targetY:40}] },
    ],
    npcs:[
      {id:'quest_ironwood',mapId:'ironwood',posX:18,posY:40},
      {id:'merchant_ironwood',mapId:'ironwood',posX:22,posY:40},
      {id:'warden_ironwood',mapId:'ironwood',posX:20,posY:42},
    ],
    monsters:[
      {id:'ironwood_ironwood_stag',mapId:'ironwood',posX:18,posY:34},
      {id:'ironwood_timber_wolf',mapId:'ironwood',posX:26,posY:41},
      {id:'ironwood_barkhide_brute',mapId:'ironwood',posX:34,posY:48},
      {id:'ironwood_poacher',mapId:'ironwood',posX:42,posY:55},
      {id:'ironwood_ancient_ent',mapId:'ironwood',posX:50,posY:20},
      {id:'ironwood_ironbark_behemoth',mapId:'ironwood',posX:58,posY:27},
    ],
    nodes:[{id:'node_ironwood',mapId:'ironwood',x:20,y:40}],
  };
  assert.equal(migrateGrandIronwoodData(data), true);
  const ironwood = data.maps[0];
  assert.equal(ironwood.width,160);
  assert.equal(ironwood.height,160);
  assert.equal(ironwood.urbanPlan,'forest-rings');
  assert.equal(ironwood.portals.length,3);
  assert.deepEqual([data.maps[1].portals[0].targetX,data.maps[1].portals[0].targetY],[26,78]);
  assert.deepEqual([data.maps[2].portals[0].targetX,data.maps[2].portals[0].targetY],[80,134]);
  assert.deepEqual([data.npcs[0].posX,data.npcs[0].posY],[70,82]);
  assert.deepEqual([data.npcs[1].posX,data.npcs[1].posY],[58,78]);
  assert.deepEqual([data.npcs[2].posX,data.npcs[2].posY],[128,78]);
  assert.deepEqual([data.monsters[5].posX,data.monsters[5].posY],[118,146]);
  assert.deepEqual([data.nodes[0].x,data.nodes[0].y],[80,78]);
  const snapshot = JSON.stringify(data);
  assert.equal(migrateGrandIronwoodData(data), false);
  assert.equal(JSON.stringify(data), snapshot);
});

test('9.38A administrator-authored Ironwood geometry and coordinates are preserved', () => {
  const data = {
    maps:[{id:'ironwood',width:120,height:120,spawnX:61,spawnY:62,townX:60,townY:60,settlementClass:'city',urbanPlan:'royal-grid',districts:[{id:'custom'}],landmarks:[{id:'custom'}],props:[{id:'custom'}],portals:[{x:5,y:5,targetMap:'eldoria',targetX:90,targetY:90}]}],
    npcs:[{id:'quest_ironwood',mapId:'ironwood',posX:18,posY:40}],
    monsters:[{id:'ironwood_timber_wolf',mapId:'ironwood',posX:26,posY:41}],
    nodes:[{id:'node_ironwood',mapId:'ironwood',x:20,y:40}],
  };
  const before = JSON.stringify(data);
  assert.equal(migrateGrandIronwoodData(data), false);
  assert.equal(JSON.stringify(data), before);
});

test('9.38A fresh ContentDB converges Road-to-10 and all three grand-capital migrations', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'moria-938-'));
  const file = path.join(dir,'content.json');
  try {
    const db = new ContentDB(file);
    const data = db.getAllContent();
    assert.equal(data.grandCapitalVersion, GRAND_CAPITAL_SCHEMA_VERSION);
    assert.equal(data.roadToTenVersion, 1);
    assert.ok(data.professionSpecializations.length > 0);
    const sunreach = data.maps.find(map => map.id === 'sunreach_coast');
    const ironwood = data.maps.find(map => map.id === 'ironwood');
    assert.deepEqual([sunreach.width,sunreach.height,sunreach.urbanPlan],[160,160,'harbor-crescent']);
    assert.deepEqual([ironwood.width,ironwood.height,ironwood.urbanPlan],[160,160,'forest-rings']);
    const sunNpc = data.npcs.find(npc => npc.id === 'quest_sunreach_coast');
    const ironNpc = data.npcs.find(npc => npc.id === 'quest_ironwood');
    const sunNode = data.nodes.find(node => node.id === 'node_sunreach');
    const ironNode = data.nodes.find(node => node.id === 'node_ironwood');
    assert.deepEqual([sunNpc.posX,sunNpc.posY],[54,72]);
    assert.deepEqual([ironNpc.posX,ironNpc.posY],[70,82]);
    assert.deepEqual([sunNode.x,sunNode.y],[80,70]);
    assert.deepEqual([ironNode.x,ironNode.y],[80,78]);
  } finally {
    fs.rmSync(dir,{recursive:true,force:true});
  }
});

test('9.38A client and server share the forest-rings generation vocabulary', () => {
  const server = fs.readFileSync(new URL('../engine/World.mjs', import.meta.url),'utf8');
  const client = fs.readFileSync(new URL('../../src/game/maps.ts', import.meta.url),'utf8');
  for (const marker of ['forestCapitalTile','trailRings','lumberRoads','hunterRoads','centralClearing','groveTree']) {
    assert.ok(server.includes(marker), `server missing ${marker}`);
    assert.ok(client.includes(marker), `client missing ${marker}`);
  }
  assert.ok(server.includes("config.urbanPlan === 'forest-rings'"));
  assert.ok(client.includes("map.urbanPlan === 'forest-rings'"));
});

test('9.38A Content Studio exposes urbanPlan and rejects unsupported topology at both boundaries', () => {
  const fakeDb = {
    get(type) {
      if (type === 'maps') return [clone(GRAND_IRONWOOD_MAP)];
      return [];
    }
  };
  const schema = getContentStudioSchema('maps', fakeDb);
  assert.ok(schema.fields.includes('urbanPlan'));
  assert.ok(schema.options.urbanPlans.includes('forest-rings'));
  const valid = { ...clone(GRAND_IRONWOOD_MAP), name:'Ironwood March' };
  assert.equal(validateStudioRecord('maps',valid,fakeDb),null);
  const invalid = { ...valid, urbanPlan:'impossible-spiral' };
  assert.match(validateStudioRecord('maps',invalid,fakeDb),/urbanPlan/);
  assert.match(validateContentReferences(fakeDb,'maps',invalid),/urbanPlan/);
});

test('9.38A previously approved royal and harbor capital algorithms remain reachable', () => {
  const world = new WorldManager();
  assert.equal(world.getMap('eldoria').urbanPlan,'royal-grid');
  assert.equal(world.getMap('sunreach_coast').urbanPlan,'harbor-crescent');
  assert.equal(world.getMap('ironwood').urbanPlan,'forest-rings');
  assert.equal(world.getMap('eldoria').width,160);
  assert.equal(world.getMap('sunreach_coast').width,160);
});
