import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('9.7 player presentation is pixel-first and materially larger than one-tile legacy figure', () => {
  const avatar = read('src/game/playerAvatar.ts');
  assert.match(avatar, /PIXEL_SPRITE_SCALE = 1\.30/);
  assert.match(avatar, /drawPixelHuman/);
  assert.match(avatar, /drawPixelOutline|function block/);
  assert.doesNotMatch(avatar, /createRadialGradient/);
});

test('9.7 NPC and monster silhouettes use original outlined pixel construction', () => {
  const entities = read('src/game/classicEntityPresentation.ts');
  assert.match(entities, /pixel-first 2D entity presentation/);
  assert.match(entities, /drawPixelOutline/);
  assert.match(entities, /role === 'guard'/);
  assert.match(entities, /rat\|wolf\|boar/);
});

test('9.7 city presentation replaces flat architecture with masonry and tiled roofs', () => {
  const render = read('src/game/render.ts');
  const city = read('src/game/cityPresentation.ts');
  assert.match(render, /drawPixelRoofTiles/);
  assert.match(render, /Pixel masonry courses/);
  assert.match(render, /Timber frame/);
  assert.match(render, /const cellH = Math\.max\(4, Math\.round\(s \/ 6\)\)/);
  assert.match(render, /#a79270/);
  assert.match(city, /Keep the textured base visible/);
});

test('9.7 night presentation preserves detail instead of crushing the world under 55% darkness', () => {
  const day = read('src/game/dayNight.ts');
  assert.match(day, /let darkness = 0\.38/);
  assert.doesNotMatch(day, /let darkness = 0\.55/);
});
