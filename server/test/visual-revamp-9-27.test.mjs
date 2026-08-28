import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

test('9.27 visual revamp remains presentation-only and modular', () => {
  const game = read('src/components/GameScreen.tsx');
  const fx = read('src/game/worldVisualRevamp927.ts');
  assert.match(game, /drawWorldCinematicPass/);
  assert.match(fx, /setTransform\(1, 0, 0, 1, 0, 0\)/);
  assert.doesNotMatch(fx, /serverSync|sendOfficial|fetch\(|WebSocket/);
});

test('9.27 renderer adds material finish and grounded entity shadows', () => {
  const render = read('src/game/render.ts');
  assert.match(render, /drawMaterialFinish/);
  assert.match(render, /Layered contact shadow/);
  assert.match(render, /entitySize \* 0\.40/);
});

test('9.27 CSS includes cinematic canvas and respects reduced motion', () => {
  const css = read('src/index.css');
  assert.match(css, /Mor'ia 9\.27 — Deep Visual Revamp/);
  assert.match(css, /moria-world-canvas/);
  assert.match(css, /prefers-reduced-motion: no-preference/);
});

test('9.27 second pass preserves architecture contracts while extracting richer VFX', () => {
  const render = read('src/game/render.ts');
  const game = read('src/components/GameScreen.tsx');
  const avatar = read('src/game/playerAvatar.ts');
  const vfx = read('src/game/combatVfx927.ts');
  assert.match(render, /worldX = 0, worldY = 0, time = 0/);
  assert.match(game, /TILE_SIZE,tx,ty,now/);
  assert.match(avatar, /PIXEL_SPRITE_SCALE = 1\.30/);
  assert.match(avatar, /size \* 1\.08/);
  assert.match(vfx, /globalCompositeOperation\s*=\s*'lighter'/);
});


test('9.27 third pass deepens vegetation and architecture without changing authority', () => {
  const render = read('src/game/render.ts');
  assert.match(render, /2\.5D facade model/);
  assert.match(render, /layered canopy shadow/);
  assert.match(render, /variation > \.54/);
  assert.match(render, /Roof mass and tile bands/);
});
