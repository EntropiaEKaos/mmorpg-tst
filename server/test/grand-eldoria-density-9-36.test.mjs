import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GRAND_ELDORIA_MAP, GRAND_ELDORIA_RESIDENTIAL, GRAND_ELDORIA_VERSION, migrateGrandEldoriaData } from '../engine/GrandEldoria.mjs';
import { WorldManager } from '../engine/World.mjs';

const clone = value => JSON.parse(JSON.stringify(value));
const core = () => clone(GRAND_ELDORIA_MAP.landmarks.filter(entry => !String(entry.id).startsWith('eldoria_residence_')));

test('9.36C Grand Eldoria v2 has dense authoritative residential architecture', () => {
  assert.equal(GRAND_ELDORIA_VERSION, 2);
  assert.equal(GRAND_ELDORIA_RESIDENTIAL.length, 20);
  assert.equal(GRAND_ELDORIA_MAP.landmarks.length, 36);
  assert.ok(GRAND_ELDORIA_RESIDENTIAL.every(entry => entry.kind === 'house' && entry.showOnMinimap === false));
  assert.equal(GRAND_ELDORIA_MAP.residentialRingEnabled, false);
  assert.equal(GRAND_ELDORIA_MAP.residentialRingDensity, 0);
});

test('9.36C untouched v1 architecture upgrades to v2 exactly once', () => {
  const map = clone(GRAND_ELDORIA_MAP);
  map.landmarks = core();
  map.residentialRingEnabled = true;
  map.residentialRingDensity = 5;
  const data = { maps:[map], npcs:[], monsters:[], houses:[], nodes:[] };
  assert.equal(migrateGrandEldoriaData(data), true);
  assert.equal(map.landmarks.length, 36);
  assert.equal(map.residentialRingEnabled, false);
  assert.equal(map.residentialRingDensity, 0);
  assert.equal(migrateGrandEldoriaData(data), false);
  assert.equal(map.landmarks.length, 36);
});

test('9.36C admin-authored v1 architecture is never auto-filled', () => {
  const map = clone(GRAND_ELDORIA_MAP);
  map.landmarks = core();
  map.landmarks[0].x += 1;
  map.residentialRingEnabled = true;
  map.residentialRingDensity = 5;
  const data = { maps:[map], npcs:[], monsters:[], houses:[], nodes:[] };
  migrateGrandEldoriaData(data);
  assert.equal(map.landmarks.length, 16);
  assert.equal(map.landmarks[0].x, 73);
  assert.equal(map.residentialRingEnabled, true);
});

test('9.36C residential footprints are authoritative collision, not decorative ghosts', () => {
  const world = new WorldManager();
  const map = world.getMap('eldoria');
  assert.equal(map.landmarks.length, 36);
  for (const residence of GRAND_ELDORIA_RESIDENTIAL) {
    const tile = map.tiles[residence.y]?.[residence.x];
    assert.ok(tile);
    assert.equal(tile.walkable, false, residence.id);
    assert.equal(tile.blocksSight, true, residence.id);
  }
});

test('9.36C presentation code is dimension-aware and hides minor residences from minimap', () => {
  const source = fs.readFileSync(new URL('../../src/game/cityPresentation.ts', import.meta.url), 'utf8');
  const maps = fs.readFileSync(new URL('../../src/game/maps.ts', import.meta.url), 'utf8');
  const identity = fs.readFileSync(new URL('../../src/game/cityIdentity.ts', import.meta.url), 'utf8');
  assert.match(source, /getMapDimensions\(map\)/);
  assert.match(source, /entry\.showOnMinimap !== false/);
  assert.doesNotMatch(source, /Math\.min\(78 - w/);
  assert.doesNotMatch(source, /Math\.min\(77,/);
  assert.match(maps, /entry\.showOnMinimap === false/);
  assert.match(identity, /showOnMinimap\?: boolean/);
});
