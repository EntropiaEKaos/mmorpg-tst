import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('9.2 avatar renderer is layered, extracted and consumes authoritative public appearance', () => {
  const avatar=read('src/game/playerAvatar.ts'), render=read('src/game/render.ts'), screen=read('src/components/GameScreen.tsx');
  assert.match(avatar,/export function drawAvatar/);
  assert.match(avatar,/addonMask/);
  assert.match(avatar,/drawMount/);
  assert.match(render,/drawAvatar\(ctx/);
  assert.match(screen,/op\.appearance, op\.mount/);
  assert.doesNotMatch(screen,/(?:p|playerRef\.current)\.(?:appearance|mounts)(?:\.[A-Za-z0-9_]+)*\s*=/);
});

test('9.2 Life & Style UI sends intents instead of mutating authoritative systems', () => {
  const panel=read('src/components/LifeStylePanel.tsx'), sync=read('src/game/ServerSync.ts');
  for(const action of ['onTask','onHousing','onAppearance','onMount']) assert.match(panel,new RegExp(action));
  assert.match(sync,/sendTask\(/); assert.match(sync,/sendHousing\(/); assert.match(sync,/sendAppearance\(/); assert.match(sync,/sendMount\(action/);
  assert.doesNotMatch(panel,/player\.gold\s*[-+]=/);
  assert.doesNotMatch(panel,/player\.mounted\s*=/);
});

test('9.2 housing presentation stays outside GameScreen and uses server snapshot only', () => {
  const housing=read('src/game/housingPresentation.ts'), screen=read('src/components/GameScreen.tsx');
  assert.match(housing,/export function drawHousing/);
  assert.match(screen,/drawHousing\(ctx, p\.housing/);
  assert.doesNotMatch(screen,/moria-housing|weeklyRent\s*=/);
});

test('9.2 server content adapters expose life-service NPC roles', () => {
  const adapters=read('src/game/serverContentAdapters.ts'), types=read('src/game/types.ts');
  for(const role of ['taskmaster','stablemaster','outfitter','realtor']) { assert.match(adapters,new RegExp(role)); assert.match(types,new RegExp(role)); }
  assert.match(adapters,/Life & Style/);
});
