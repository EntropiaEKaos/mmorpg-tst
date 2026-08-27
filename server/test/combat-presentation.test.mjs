import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = relative => readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const screen = read('src/components/GameScreen.tsx');
const actionBar = read('src/components/ActionBar.tsx');
const targetFrame = read('src/components/CombatTargetFrame.tsx');
const sync = read('src/game/ServerSync.ts');
const presentation = read('src/game/combatPresentation.ts');

test('combat target presentation is extracted and authoritative targets stay highlighted', () => {
  assert.match(screen, /<CombatTargetFrame/);
  assert.match(screen, /renderMonsters\.find\(\(monster: any\) => monster\.id === p\.targetId\)/);
  assert.doesNotMatch(screen, /\{\/\* Target Frame \*\/\}[\s\S]{0,200}player\.targetId && \(\(\) =>/);
  assert.match(targetFrame, /BOSS TARGET/);
  assert.match(targetFrame, /DANGEROUS/);
});

test('action bar owns a live cooldown clock and renders radial cooldown progress', () => {
  assert.match(actionBar, /setInterval\(\(\) => setNow\(Date\.now\(\)\), 100\)/);
  assert.match(actionBar, /conic-gradient/);
  assert.match(actionBar, /cooldownFraction/);
});

test('authoritative server events expose presentation-only feedback without changing authority', () => {
  assert.match(sync, /onFeedback\?: \(event: any\) => void/);
  assert.match(sync, /onFeedback\?\.\(event\)/);
  assert.match(screen, /serverSync\.processEvents\(addFloatingText, addMessage, \(event\) =>/);
});


test('combat presentation policy stays outside GameScreen and remains presentation-only', () => {
  assert.match(presentation, /export function resolveCombatTarget/);
  assert.match(presentation, /export function applyAuthoritativeCombatFeedback/);
  assert.match(screen, /applyAuthoritativeCombatFeedback\(event, p\.pos, spawnParticles/);
  assert.doesNotMatch(presentation, /sendIntent|sendAttack|sendCast|player\.hp\s*[+-]=|monster\.hp\s*[+-]=/);
});
