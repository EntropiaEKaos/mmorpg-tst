import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('9.7 player presentation uses authored native-pixel frames instead of block-built legacy figures', () => {
  const avatar = read('src/game/playerAvatar.ts');
  assert.match(avatar, /PIXEL_SPRITE_SCALE = 1\.42/); // 9.29 intentionally supersedes the 9.7 scale contract
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


test('9.7 city authoring exposes real houses and shared authoritative geometry', () => {
  const identity = read('src/game/cityIdentity.ts');
  const clientMaps = read('src/game/maps.ts');
  const world = read('server/engine/World.mjs');
  const studio = read('server/engine/ContentStudio.mjs');
  assert.match(identity, /'house'/);
  assert.match(clientMaps, /blocksByLandmark/);
  assert.match(world, /movement collision now share/);
  assert.match(studio, /house/);
});


test('9.7 world nameplates resolve distance fade, priority collisions and boss styling globally', async () => {
  const labels = await read('src/game/worldNameplates.ts');
  const screen = await read('src/components/GameScreen.tsx');
  const render = await read('src/game/render.ts');
  assert.match(labels, /collisionPadding/);
  assert.match(labels, /bossAlwaysVisible/);
  assert.match(labels, /sort\(\(a, b\) => priority\(b\) - priority\(a\)/);
  assert.match(labels, /visibilityAlpha/);
  assert.match(labels, /'BOSS'/);
  assert.match(screen, /createWorldLabelQueue\(p\.pos,p\.targetId\)/);
  assert.doesNotMatch(render, /const hpBarW = size \* 0\.9/);
});

test('9.7 city designer directly manipulates authoritative building footprints', async () => {
  const designer = await read('src/components/CityDesigner.tsx');
  const studio = await read('server/engine/ContentStudio.mjs');
  const admin = await read('server/adminPanel.mjs');
  assert.match(designer, /DIRECT MANIPULATION/);
  assert.match(designer, /onPointerMove=\{dragMove\}/);
  assert.match(designer, /SELECTED BUILDING/);
  assert.match(designer, /'house'/);
  assert.match(studio, /monsterNameplateMode/);
  assert.match(studio, /bossNameplateAlwaysVisible/);
  assert.match(admin, /meta\.kind === 'boolean'/);
  assert.match(admin, /meta\.kind === 'json'/);
});


test('9.7.1 player plates reserve authored head clearance and world labels respect sprite height', () => {
  const avatar=read('src/game/playerAvatar.ts');
  const labels=read('src/game/worldNameplates.ts');
  const maps=read('src/game/maps.ts');
  const studio=read('server/engine/ContentStudio.mjs');
  assert.match(avatar,/const spriteTop = mounted/);
  assert.match(avatar,/nameplateHeadClearance/);
  assert.match(avatar,/safeBottom = spriteTop - headClearance/);
  assert.match(labels,/visualHeight/);
  assert.match(labels,/const damaged = .*monster.hp.*monster.maxHp/);
  assert.match(maps,/nameplateStackGap/);
  assert.match(studio,/Head clearance px/);
});

test('9.7.1 ambient NPC projection repairs blocked architecture and excludes housing interiors', () => {
  const spatial=read('src/game/spatialIntegrity.ts');
  const screen=read('src/components/GameScreen.tsx');
  assert.match(spatial,/nearestPublicWalkableTile/);
  assert.match(spatial,/insideHouse/);
  assert.match(screen,/enforceNpcSpatialIntegrity/);
});
