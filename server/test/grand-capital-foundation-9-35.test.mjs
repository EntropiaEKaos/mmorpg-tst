import test from 'node:test';
import assert from 'node:assert/strict';
import { WorldManager, MAP_WIDTH, MAP_HEIGHT, MAX_MAP_DIMENSION } from '../engine/World.mjs';
import { validateStudioRecord } from '../engine/ContentStudio.mjs';
import { validateContentReferences } from '../engine/ContentIntegrity.mjs';

function capital(id = 'qa_grand_capital', overrides = {}) {
  return {
    id, name: 'QA Grand Capital', description: 'Synthetic capital for dimension contracts.', biome: 'plains',
    width: 160, height: 160, settlementClass: 'capital', urbanBounds: { x: 18, y: 18, width: 124, height: 124 },
    levelRequired: 1, seed: 935, spawnX: 80, spawnY: 80, townX: 80, townY: 80, townRange: 10,
    cityStyle: 'royal', cityAccent: '#d8b45a', roofColor: '#7e2f34', wallColor: '#c9b68d', roadColor: '#9b8764',
    districts: Array.from({ length: 16 }, (_, i) => ({ id: `d${i}`, name: `District ${i}`, icon: '◇', x: 20 + i * 6, y: 50 + (i % 3) * 8, radius: 8, color: '#d8b45a' })),
    landmarks: Array.from({ length: 20 }, (_, i) => ({ id: `l${i}`, name: `Landmark ${i}`, kind: i % 2 ? 'house' : 'market', icon: '◆', x: 15 + (i % 10) * 12, y: 20 + Math.floor(i / 10) * 30, w: 5, h: 5 })),
    props: Array.from({ length: 120 }, (_, i) => ({ id: `p${i}`, kind: i % 2 ? 'lamp' : 'banner', x: 10 + (i % 20) * 7, y: 90 + Math.floor(i / 20) * 5, color: '#d8b45a' })),
    access: 'public', portals: [], ...overrides,
  };
}

function contentDB(maps = []) {
  return { get(type) { return type === 'maps' ? maps : []; } };
}

test('9.35A unpromoted regions stay 80x80 while declared capitals can generate 160x160', () => {
  const world = new WorldManager();
  assert.equal(world.getMap('eldoria').width, 160);
  assert.equal(world.getMap('eldoria').height, 160);
  assert.equal(world.getMap('eldoria').settlementClass, 'capital');
  assert.equal(world.getMap('frostpeak').width, 160);
  assert.equal(world.getMap('frostpeak').height, 160);
  assert.equal(world.getMap('frostpeak').settlementClass, 'capital');
  assert.equal(world.getMap('voidlands').width, MAP_WIDTH);
  assert.equal(world.getMap('voidlands').height, MAP_HEIGHT);
  world.syncContentMaps([capital()]);
  const map = world.getMap('qa_grand_capital');
  assert.equal(map.width, 160);
  assert.equal(map.height, 160);
  assert.equal(map.tiles.length, 160);
  assert.equal(map.tiles[0].length, 160);
  assert.equal(map.spawnPoint.x, 80);
  assert.equal(map.settlementClass, 'capital');
  assert.deepEqual(map.urbanBounds, { x: 18, y: 18, width: 124, height: 124 });
});

test('9.35A Studio accepts capital-scale authoring but preserves normal city budgets', () => {
  const record = capital();
  const db = contentDB([record]);
  assert.equal(validateStudioRecord('maps', record, db), null);
  const normal = capital('qa_city', { settlementClass: 'city', width: 80, height: 80, urbanBounds: { x: 10, y: 10, width: 60, height: 60 }, spawnX: 40, spawnY: 40, townX: 40, townY: 40, districts: [], landmarks: [], props: Array.from({ length: 81 }, (_, i) => ({ id: `p${i}`, kind: 'lamp', x: 20, y: 20 })) });
  assert.match(validateStudioRecord('maps', normal, contentDB([normal])), /at most 80/);
});

test('9.35A map-aware Studio permits houses, NPCs and monsters beyond legacy coordinate 78', () => {
  const record = capital();
  const db = contentDB([record]);
  const house = { id: 'qa_house', name: 'Far Ward House', mapId: record.id, x: 120, y: 120, width: 6, height: 6, entranceX: 123, entranceY: 127, price: 1000, weeklyRent: 100, levelRequired: 1 };
  assert.equal(validateStudioRecord('houses', house, db), null);
  const npc = { id: 'qa_npc', name: 'Far Banker', mapId: record.id, posX: 130, posY: 125, role: 'banker' };
  assert.equal(validateStudioRecord('npcs', npc, db), null);
  const monster = { id: 'qa_monster', name: 'Outer Rat', mapId: record.id, posX: 140, posY: 140, hp: 10, attack: 1, defense: 0, xp: 1, level: 1, type: 'normal', count: 1, speed: 1000 };
  assert.equal(validateStudioRecord('monsters', monster, db), null);
});

test('9.35A dimensions hard-stop at 192 and townRange remains a local service radius', () => {
  const max = capital('qa_max', { width: MAX_MAP_DIMENSION, height: MAX_MAP_DIMENSION, spawnX: 190, spawnY: 190, townX: 96, townY: 96, urbanBounds: { x: 10, y: 10, width: 180, height: 180 } });
  assert.equal(validateStudioRecord('maps', max, contentDB([max])), null);
  assert.match(validateStudioRecord('maps', capital('qa_too_big', { width: 193 }), contentDB([])), /width must be from 40 to 192/);
  assert.match(validateStudioRecord('maps', capital('qa_remote_services', { townRange: 30 }), contentDB([])), /townRange must be from 0 to 20/);
});

test('9.35A portal targets are validated against destination dimensions', () => {
  const destination = capital('qa_destination', { width: 80, height: 80, spawnX: 40, spawnY: 40, townX: 40, townY: 40, urbanBounds: { x: 10, y: 10, width: 60, height: 60 }, districts: [], landmarks: [], props: [] });
  const source = capital('qa_source', { portals: [{ x: 120, y: 120, targetMap: destination.id, targetX: 120, targetY: 40, label: 'invalid target' }] });
  const db = contentDB([source, destination]);
  assert.match(validateContentReferences(db, 'maps', source), /destination playable area/);
  const valid = { ...source, portals: [{ x: 120, y: 120, targetMap: destination.id, targetX: 60, targetY: 40, label: 'valid target' }] };
  assert.equal(validateContentReferences(contentDB([valid, destination]), 'maps', valid), null);
});
