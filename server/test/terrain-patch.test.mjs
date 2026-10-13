import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD } from '../engine/World.mjs';
import { buildTerrainPatch, shouldSendTerrainPatch, TERRAIN_CODES } from '../engine/TerrainPatch.mjs';

test('terrain patch contains server-authored tile codes, never fabricated gameplay tiles', () => {
  for (const mapId of ['eldoria', 'frostpeak', 'shadowfen', 'emberhold', 'crystal_deep', 'stormwatch_isle']) {
    const map = WORLD.getMap(mapId);
    assert.ok(map, mapId);
    const patch = buildTerrainPatch(map, map.spawnPoint.x, map.spawnPoint.y);
    assert.equal(patch.mapId, mapId);
    assert.equal(patch.biome, map.biome);
    assert.equal(patch.version, 1);
    assert.ok(patch.rows.length > 0 && patch.rows.length <= 41);
    for (const [dy, row] of patch.rows.entries()) {
      assert.equal(row.length, patch.rows[0].length);
      for (const [dx, code] of [...row].entries()) {
        const tile = map.tiles[patch.originY + dy][patch.originX + dx];
        assert.equal(code, TERRAIN_CODES[tile.type] || '?', `${mapId} x=${dx} y=${dy}`);
      }
    }
  }
});

test('terrain patch clamps edges and rejects invalid or missing maps', () => {
  const map = WORLD.getMap('eldoria');
  const patch = buildTerrainPatch(map, 1, 1);
  assert.equal(patch.originX, 0);
  assert.equal(patch.originY, 0);
  assert.ok(patch.rows.length <= 41 && patch.rows[0].length <= 41);
  assert.equal(buildTerrainPatch(null, 1, 1), null);
  assert.equal(buildTerrainPatch(map, NaN, 1), null);
});

test('terrain patches transmit on first snapshot, travel and new movement chunks', () => {
  const first = shouldSendTerrainPatch(undefined, { mapId: 'eldoria', x: 40, y: 40 });
  assert.equal(first.send, true);
  assert.equal(shouldSendTerrainPatch(first.key, { mapId: 'eldoria', x: 41, y: 41 }).send, false);
  assert.equal(shouldSendTerrainPatch(first.key, { mapId: 'eldoria', x: 44, y: 40 }).send, true);
  assert.equal(shouldSendTerrainPatch(first.key, { mapId: 'frostpeak', x: 40, y: 40 }).send, true);
  assert.equal(shouldSendTerrainPatch(first.key, { mapId: 'eldoria', x: Infinity, y: 0 }).send, false);
});

test('landmark footprints in terrain patches exactly match server collision geometry', () => {
  for (const mapId of ['eldoria','sunreach_coast','ironwood','frostpeak','shadowfen','emberhold','crystal_deep','stormwatch_isle']) {
    const map = WORLD.getMap(mapId);
    assert.ok(map && Array.isArray(map.landmarks), mapId);
    const patch = buildTerrainPatch(map, map.townCenter.x, map.townCenter.y);
    assert.ok(patch.landmarks.length > 0, `${mapId} must project authored architecture`);
    assert.ok(patch.landmarks.length <= 24);
    assert.equal(patch.cityStyle, map.cityStyle);
    for (const landmark of patch.landmarks) {
      const source = map.landmarks.find(candidate => candidate.id === landmark.id);
      assert.ok(source, `${mapId}: ${landmark.id}`);
      for (const field of ['x','y','w','h','kind','name']) assert.equal(landmark[field], source[field], `${landmark.id}.${field}`);
      assert.equal(map.tiles[landmark.y]?.[landmark.x]?.type, 'wall', 'server collider must occupy the footprint');
    }
  }
});

test('Studio-updated architecture flows through projections without modifying World tiles', () => {
  const original = WORLD.getMap('eldoria');
  const landmark = { id:'studio_qa_house',name:'Casa do Estúdio',kind:'house',x:36,y:37,w:3,h:4 };
  const map = { ...original, landmarks:[...original.landmarks,landmark] };
  const previous = original.tiles[landmark.y][landmark.x].type;
  const patch = buildTerrainPatch(map,landmark.x,landmark.y);
  const fromPatch = patch.landmarks.find(item => item.id === landmark.id);
  assert.deepEqual(fromPatch,{id:landmark.id,name:landmark.name,kind:landmark.kind,x:landmark.x,y:landmark.y,w:landmark.w,h:landmark.h});
  assert.equal(original.tiles[landmark.y][landmark.x].type,previous);
});
