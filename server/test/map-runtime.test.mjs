import test from 'node:test';
import assert from 'node:assert/strict';
import { engine } from '../engine/GameState.mjs';
import { WORLD, MAP_CONFIG } from '../engine/World.mjs';
import { contentDB } from '../engine/ContentDB.mjs';
import { validateContentReferences, findBlockingContentReferences } from '../engine/ContentIntegrity.mjs';

function flatPortal(portal) {
  return {
    x: portal.pos.x, y: portal.pos.y, targetMap: portal.targetMap,
    targetX: portal.targetSpawn.x, targetY: portal.targetSpawn.y, label: portal.label || '',
  };
}

test('custom map definitions are validated and referenced maps are protected', () => {
  const collections = {
    maps: [{ id: 'eldoria' }, { id: 'moon_keep', biome: 'shadow' }],
    npcs: [{ id: 'moon_sage', mapId: 'moon_keep' }], monsters: [], events: [], quests: [], spells: [],
  };
  const db = { get: type => collections[type] || [] };
  const record = {
    id: 'moon_keep', name: 'Moon Keep', biome: 'shadow', seed: 1234,
    spawnX: 30, spawnY: 30, townX: 30, townY: 30, townRange: 6, levelRequired: 5,
    portals: [{ x: 10, y: 10, targetMap: 'eldoria', targetX: 40, targetY: 40 }],
  };
  assert.equal(validateContentReferences(db, 'maps', record), null);
  assert.match(validateContentReferences(db, 'maps', { ...record, portals: [{ x: 10, y: 10, targetMap: 'missing', targetX: 40, targetY: 40 }] }), /unknown map/);
  assert.ok(findBlockingContentReferences(db, 'maps', 'moon_keep').some(entry => entry.type === 'npc'));
  assert.ok(findBlockingContentReferences(db, 'maps', 'eldoria').some(entry => entry.field === 'builtin-map'));
});

test('ContentDB maps become deterministic authoritative runtime maps with live portal travel', () => {
  const baseMaps = contentDB.get('maps').map(map => ({ ...map }));
  const custom = {
    id: 'test_realm', name: 'Test Realm', biome: 'snow', description: 'Runtime test map', seed: 424242,
    spawnX: 30, spawnY: 30, townX: 30, townY: 30, townRange: 5, levelRequired: 5,
    portals: [{ x: 12, y: 12, targetMap: 'eldoria', targetX: 40, targetY: 40, label: 'Back' }],
  };
  const eldoria = baseMaps.find(map => map.id === 'eldoria');
  const maps = baseMaps.map(map => map.id === 'eldoria' ? {
    ...map,
    portals: [...MAP_CONFIG.eldoria.portals.map(flatPortal), { x: 20, y: 20, targetMap: 'test_realm', targetX: 30, targetY: 30, label: 'Test Realm' }],
  } : map);
  maps.push(custom);

  engine.syncContentMaps(maps);
  engine.syncContentMonsters(contentDB.get('monsters'));
  const first = WORLD.getMap('test_realm');
  assert.ok(first);
  assert.equal(first.name, 'Test Realm');
  assert.equal(first.biome, 'snow');
  assert.equal(first.levelRequired, 5);
  assert.equal(first.tiles[30][30].walkable, true);
  const signature = [first.tiles[5][5].type, first.tiles[15][25].type, first.tiles[60][60].type];
  engine.syncContentMaps(maps);
  const second = WORLD.getMap('test_realm');
  assert.deepEqual([second.tiles[5][5].type, second.tiles[15][25].type, second.tiles[60][60].type], signature);

  const id = `map_test_${Date.now()}`;
  const player = engine.playerConnect(id, 'MapTester', 'knight', null);
  try {
    player.mapId = 'eldoria'; player.x = 20; player.y = 20; player.level = 4;
    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'test_realm' } }), false);
    player.level = 5;
    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'test_realm' } }), true);
    assert.equal(player.mapId, 'test_realm');
    assert.deepEqual({ x: player.x, y: player.y }, { x: 30, y: 30 });
  } finally {
    engine.playerDisconnect(id);
    engine.syncContentMaps(baseMaps);
    engine.syncContentMonsters(contentDB.get('monsters'));
  }
});
