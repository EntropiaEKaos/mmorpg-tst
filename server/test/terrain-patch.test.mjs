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
