import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { WorldManager } from '../engine/World.mjs';
import { GRAND_ELDORIA_MAP } from '../engine/GrandEldoria.mjs';

test('9.36D Grand Eldoria exposes civic plazas and stronger royal axes', () => {
  const world = new WorldManager();
  const map = world.getMap('eldoria');
  assert.equal(map.width, 160);
  assert.equal(map.height, 160);
  assert.equal(map.tiles[80][86].type, 'path'); // civic plaza
  assert.equal(map.tiles[56][80].type, 'path'); // crown forecourt
  assert.equal(map.tiles[76][64].type, 'path'); // market square
  assert.equal(map.tiles[82][116].type, 'path'); // dawn square edge
  assert.equal(map.tiles[110][72].type, 'path'); // garden promenade
  assert.equal(map.tiles[36][36].type, 'floor'); // quiet urban fabric still exists
  assert.equal(map.tiles[60][28].type, 'wall'); // city wall remains authoritative
  assert.equal(map.tiles[80][28].type, 'path'); // west gate remains open
});

test('9.36D client and server share the same ceremonial urban plan vocabulary', () => {
  const server = fs.readFileSync(new URL('../engine/World.mjs', import.meta.url), 'utf8');
  const client = fs.readFileSync(new URL('../../src/game/maps.ts', import.meta.url), 'utf8');
  for (const token of ['royalAxes','secondaryBoulevards','civicPlaza','crownForecourt','marketSquare','dawnSquare','gardenPromenade']) {
    assert.match(server, new RegExp(token));
    assert.match(client, new RegExp(token));
  }
});

test('9.36D civic wayfinding remains decorative and inside capital budgets', () => {
  assert.ok(GRAND_ELDORIA_MAP.props.length >= 90);
  assert.ok(GRAND_ELDORIA_MAP.props.length <= 112);
  assert.ok(GRAND_ELDORIA_MAP.props.some(entry => entry.kind === 'sign' && entry.label === 'Praça da Coroa'));
  assert.ok(GRAND_ELDORIA_MAP.props.some(entry => entry.kind === 'statue' && entry.label === 'Guarda da Coroa'));
});
