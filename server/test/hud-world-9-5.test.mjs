import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const screen = read('src/components/GameScreen.tsx');
const hud = read('src/components/HUD.tsx');
const actionBar = read('src/components/ActionBar.tsx');
const chat = read('src/components/Chat.tsx');
const movable = read('src/components/MovableHudWindow.tsx');
const avatar = read('src/game/playerAvatar.ts');
const render = read('src/game/render.ts');

 test('9.5 expands the visible world instead of reserving a fixed sidebar', () => {
  assert.match(screen, /const VIEW_W = 31;/);
  assert.match(screen, /const VIEW_H = 19;/);
  assert.doesNotMatch(hud, /w-\[304px\].*shrink-0/);
  assert.match(screen, /moria-world-canvas/);
  assert.ok(Buffer.byteLength(screen, 'utf8') <= 155_000, 'GameScreen architectural size guard must remain <= 155KB');
});

test('9.5 HUD windows are independently movable and persistent', () => {
  assert.match(movable, /setPointerCapture/);
  assert.match(movable, /localStorage\.setItem/);
  for (const id of ['minimap', 'combat-profile', 'skills', 'spellbook', 'nearby-threats']) {
    assert.match(hud, new RegExp(`id=["']${id}["']`));
  }
  assert.match(chat, /id="chat"/);
  assert.match(actionBar, /id="action-bar"/);
});

test('9.5 action bar exposes ten large spell slots plus consumables', () => {
  assert.match(actionBar, /const SPELL_SLOTS = 10;/);
  assert.match(actionBar, /h-\[66px\] w-\[66px\]/);
  for (const key of ['P', 'M', 'G']) assert.match(actionBar, new RegExp(`hotkey="${key}"`));
});

test('9.5 player nameplate carries health and mana over the avatar', () => {
  assert.match(avatar, /maxMana/);
  assert.match(avatar, /manaPct/);
  assert.match(avatar, /manaBarY/);
  assert.match(render, /maxMana/);
  assert.match(screen, /p\.mana, p\.maxMana/);
});

test('9.5 replaces bubble entities with original classic pixel silhouettes', () => {
  assert.match(render, /drawClassicNpcSprite/);
  assert.match(render, /drawClassicMonsterSprite/);
  assert.match(read('src/game/classicEntityPresentation.ts'), /classic grid MMORPG readability/);
});
