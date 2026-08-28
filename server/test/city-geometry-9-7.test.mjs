import test from 'node:test';
import assert from 'node:assert/strict';
import { WorldManager } from '../engine/World.mjs';

test('9.7 authored landmark rectangles block authoritative movement geometry', () => {
  const world = new WorldManager();
  const defs = world.syncContentMaps([{
    id:'eldoria', biome:'plains', seed:42, spawnX:40, spawnY:40, townX:40, townY:40, townRange:10, levelRequired:1, access:'public',
    landmarks:[{id:'home_1',name:'Editable House',kind:'house',icon:'⌂',x:30,y:30,w:3,h:2}],
    nameplateOffsetY:-12, nameplateScale:.72, nameplateBarWidth:26, nameplateBarHeight:3, nameplateFontSize:8, nameplateShowValues:false,
    residentialRingEnabled:false, residentialRingDensity:0, portals:[],
  }]);
  const map = world.getMap('eldoria');
  assert.equal(map.tiles[30][30].walkable, false);
  assert.equal(map.tiles[31][32].walkable, false);
  assert.equal(map.tiles[32][30].walkable, true);
  const eldoria = defs.find(entry => entry.id === 'eldoria');
  assert.equal(eldoria.nameplateOffsetY, -12);
  assert.equal(eldoria.nameplateScale, .72);
  assert.equal(eldoria.nameplateBarWidth, 26);
  assert.equal(eldoria.nameplateShowValues, false);
});

test('9.7 spawn/portal safety wins over landmark geometry', () => {
  const world = new WorldManager();
  world.syncContentMaps([{
    id:'eldoria', biome:'plains', seed:42, spawnX:40, spawnY:40, townX:40, townY:40, townRange:10, levelRequired:1, access:'public',
    landmarks:[{id:'bad_overlap',name:'Overlap',kind:'house',icon:'⌂',x:39,y:39,w:3,h:3}], portals:[],
  }]);
  assert.equal(world.getMap('eldoria').tiles[40][40].walkable, true);
});
