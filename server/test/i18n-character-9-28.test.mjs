import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

test('9.28 ships pt-BR as default locale with canonical English fallback', () => {
  const src = read('src/i18n/index.ts');
  assert.match(src, /export type MoriaLocale = 'pt-BR' \| 'en-US'/);
  assert.match(src, /return stored === 'en-US' \? 'en-US' : 'pt-BR'/);
  assert.match(src, /INVENTÁRIO/);
  assert.match(src, /PAINEL ADMINISTRATIVO/);
});

test('9.28 legacy localization bridge covers text and accessibility attributes', () => {
  const src = read('src/components/LocaleBridge.tsx');
  assert.match(src, /MutationObserver/);
  assert.match(src, /placeholder/);
  assert.match(src, /aria-label/);
  assert.match(src, /document\.documentElement\.lang/);
});

test('9.28 class visuals explicitly cover all fourteen vocations', () => {
  const src = read('src/game/playerAvatar.ts');
  for (const id of ['knight','paladin','sorcerer','druid','warlock','rogue','priest','deathknight','monk','ranger','necromancer','berserker','shaman','templar']) {
    assert.match(src, new RegExp(`${id}: \\{`));
  }
  assert.match(src, /drawVocationIdentity/);
  assert.match(src, /weapon:'axe'/);
  assert.match(src, /weapon:'daggers'/);
  assert.match(src, /weapon:'bow'/);
});

test('9.28 keeps the historical pixel sprite scale contract', () => {
  const src = read('src/game/playerAvatar.ts');
  assert.match(src, /PIXEL_SPRITE_SCALE = 1\.30/);
});

test('9.28 localizes canvas-facing monster and npc presentation without changing IDs', () => {
  const src = read('src/game/render.ts');
  assert.match(src, /translateGameText\(monster\.name\)/);
  assert.match(src, /translateGameText\(npc\.role\)/);
  assert.doesNotMatch(src, /monster\.id\s*=\s*translateGameText/);
});


test('9.28 normal avatar path receives the explicit vocation id', () => {
  const src = read('src/game/playerAvatar.ts');
  assert.match(src, /drawPixelHuman\(ctx, cx, feetY, size \* 1\.08, direction, style, colors, addonMask, time, vocationId\)/);
});

test('9.28 character creation previews use the real pixel renderer', () => {
  const preview = read('src/components/VocationPortrait.tsx');
  const login = read('src/components/LoginScreen.tsx');
  assert.match(preview, /drawPixelHuman/);
  assert.match(preview, /data-vocation-preview/);
  assert.match(login, /VocationPortrait/);
  assert.match(login, /tr\(v\.name\)/);
});

test('9.28 pt-BR catalog includes legacy fragment migration coverage', () => {
  const src = read('src/i18n/index.ts');
  assert.match(src, /PT_BR_FRAGMENTS/);
  assert.match(src, /Recompensa Diária/);
  assert.match(src, /Chance de Crítico/);
  assert.match(src, /Manchetes/);
});
