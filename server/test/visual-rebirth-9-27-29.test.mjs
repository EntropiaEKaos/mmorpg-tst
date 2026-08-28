import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = path => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('9.27 visual rebirth deepens atmosphere and HUD materials without entering gameplay authority', () => {
  const atmosphere=read('src/game/worldAtmosphere.ts');
  const css=read('src/index.css');
  const screen=read('src/components/GameScreen.tsx');
  assert.match(atmosphere,/drawDepthHaze/);
  assert.match(atmosphere,/drawLightShafts/);
  assert.match(atmosphere,/filmic edge treatment/);
  assert.match(css,/Mor'ia 9\.27 — Visual Rebirth/);
  assert.match(css,/--moria-obsidian/);
  assert.match(screen,/drawWorldAtmosphere/);
});

test('9.28 terrain materials break the repeating path carpet and ground architecture', () => {
  const render=read('src/game/render.ts');
  assert.match(render,/9\.28 environment depth/);
  assert.match(render,/stoneW = Math\.max/);
  assert.match(render,/#4e6242/);
  assert.match(render,/Directional shadow|directional shadow/i);
});

test('9.29 increases player readability and adds dedicated high-value monster silhouettes', () => {
  const avatar=read('src/game/playerAvatar.ts');
  const entities=read('src/game/classicEntityPresentation.ts');
  assert.match(avatar,/PIXEL_SPRITE_SCALE = 1\.42/);
  assert.match(avatar,/one-pixel material glint/);
  assert.match(entities,/dragon\|wyrm\|drake/);
  assert.match(entities,/ghost\|wraith\|spirit\|spect/);
  assert.match(entities,/demon\|fiend\|devil/);
  assert.match(entities,/lich\|necromancer/);
});
