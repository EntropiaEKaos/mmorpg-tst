import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const gameScreenUrl = new URL('../../src/components/GameScreen.tsx', import.meta.url);
const adaptersUrl = new URL('../../src/game/serverContentAdapters.ts', import.meta.url);

const gameScreen = readFileSync(gameScreenUrl, 'utf8');
const adapters = readFileSync(adaptersUrl, 'utf8');

test('GameScreen keeps server-content normalization outside the UI orchestrator', () => {
  assert.doesNotMatch(gameScreen, /function customNpcToRuntime/);
  assert.doesNotMatch(gameScreen, /function customMonsterToRuntime/);
  assert.doesNotMatch(gameScreen, /function mergeServerSpells/);
  assert.doesNotMatch(gameScreen, /function serverQuestToClient/);
  assert.match(gameScreen, /serverContentAdapters/);
  assert.match(adapters, /export function customNpcToRuntime/);
  assert.match(adapters, /export function mergeServerSpells/);
  assert.match(adapters, /export function serverQuestToClient/);
});

test('GameScreen monolith cannot silently grow past the 8.1 decomposition budget', () => {
  const bytes = Buffer.byteLength(gameScreen, 'utf8');
  assert.ok(bytes <= 155_000, `GameScreen is ${bytes} bytes; 8.1 budget is 155000 bytes`);
});
