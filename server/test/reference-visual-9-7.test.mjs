import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('9.7 player presentation uses authored native-pixel frames instead of block-built legacy figures', () => {
  const avatar = read('src/game/playerAvatar.ts');
  assert.match(avatar, /PIXEL_SPRITE_SCALE = 1\.30/);
  assert.match(avatar, /18 × 24 native-pixel frames/);
  assert.match(avatar, /const KNIGHT_FRAME: SpriteFrame/);
  assert.match(avatar, /const CASTER_FRAME: SpriteFrame/);
  assert.match(avatar, /const RANGER_FRAME: SpriteFrame/);
  assert.match(avatar, /const ROGUE_FRAME: SpriteFrame/);
  assert.match(avatar, /function drawSpriteMatrix/);
  assert.match(avatar, /Native-pixel silhouette drop shadow/);
  assert.match(avatar, /export function drawPixelHuman/);
  assert.match(avatar, /inferVocationStyle/);
  assert.doesNotMatch(avatar, /createRadialGradient/);
});

test('9.7 NPC and monster silhouettes use original pixel construction', () => {
  const entities = read('src/game/classicEntityPresentation.ts');
  assert.match(entities, /classic grid MMORPG readability/);
  assert.match(entities, /drawClassicNpcSprite/);
  assert.match(entities, /drawClassicMonsterSprite/);
  assert.match(entities, /drawPixelOutline|drawPixelHuman/);
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
  assert.match(city, /Central plaza mosaic/);
  assert.match(city, /Town avenue edge strips/);
  assert.match(city, /Moss fringe pixels/);
});

test('9.7 night presentation preserves detail instead of crushing the world under 55% darkness', () => {
  const day = read('src/game/dayNight.ts');
  assert.match(day, /let darkness = 0\.38/);
  assert.doesNotMatch(day, /let darkness = 0\.55/);
});

test('9.7 editable compact nameplates and architecture occlusion stay presentation-only', () => {
  const avatar = read('src/game/playerAvatar.ts');
  const render = read('src/game/render.ts');
  const screen = read('src/components/GameScreen.tsx');
  const maps = read('src/game/maps.ts');
  const city = read('src/game/cityPresentation.ts');
  const studio = read('server/engine/ContentStudio.mjs');
  assert.match(avatar, /nameplateOffsetY/);
  assert.match(avatar, /nameplateShowValues/);
  assert.match(render, /drawBuildingOcclusion/);
  assert.match(screen, /Foreground architecture occlusion pass/);
  assert.match(maps, /residentialRingEnabled/);
  assert.match(city, /Disabled by default because/);
  assert.match(studio, /Nameplate Y offset/);
  assert.match(studio, /Decorative residential ring/);
});
