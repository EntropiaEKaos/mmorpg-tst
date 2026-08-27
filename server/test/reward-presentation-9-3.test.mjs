import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { summarizeLoot, buildBossDefeatEvent, buildLootRewardEvent } from '../engine/RewardFeedback.mjs';

const read = path => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('9.3 loot feedback promotes the highest rarity in the drop', () => {
  const summary = summarizeLoot([
    { name:'Iron Sword', rarity:'common', icon:'⚔' },
    { name:'Void Crown', rarity:'legendary', icon:'👑' },
    { name:'Arcane Ring', rarity:'epic', icon:'💍' },
  ]);
  assert.equal(summary.rarity, 'legendary');
  assert.equal(summary.tier, 4);
  assert.match(summary.text, /Void Crown/);
});

test('boss and loot reward events originate from authoritative results', () => {
  const player = { id:'p1', vocation:'sorcerer', x:5, y:5 };
  assert.equal(buildBossDefeatEvent(player, { type:'normal', name:'Rat' }), null);
  const boss = buildBossDefeatEvent(player, { type:'boss', name:'Ash Tyrant', x:8, y:9 });
  assert.equal(boss.kind, 'boss_defeated');
  assert.equal(boss.vocation, 'sorcerer');
  const loot = buildLootRewardEvent(player, [{ name:'Epic Blade', rarity:'epic', icon:'⚔' }], { x:8, y:9 });
  assert.equal(loot.kind, 'loot_reward');
  assert.equal(loot.rewardTier, 3);
});

test('client presentation consumes 9.3 reward and class recipes without expanding GameScreen', () => {
  const reward = read('src/game/rewardPresentation.ts');
  const combat = read('src/game/combatPresentation.ts');
  const sync = read('src/game/ServerSync.ts');
  const screenBytes = fs.statSync(new URL('../../src/components/GameScreen.tsx', import.meta.url)).size;
  assert.match(reward, /boss_defeated/);
  assert.match(reward, /loot_reward/);
  assert.match(reward, /getClassVisualIdentity/);
  assert.match(combat, /rewardFxForEvent/);
  assert.match(combat, /classCombatFx/);
  assert.match(sync, /case 'loot_reward'/);
  assert.match(sync, /case 'boss_defeated'/);
  assert.match(sync, /case 'class_sustain'/);
  assert.ok(screenBytes <= 155000, `GameScreen.tsx architecture budget exceeded: ${screenBytes}`);
});

test('server integration owns class attack rules, spell multipliers and reward events', () => {
  const gameState = read('server/engine/GameState.mjs');
  assert.match(gameState, /classBasicAttackRules/);
  assert.match(gameState, /classSpellMultiplier/);
  assert.match(gameState, /applyClassKillSustain/);
  assert.match(gameState, /buildBossDefeatEvent/);
  assert.match(gameState, /buildLootRewardEvent/);
  assert.match(gameState, /critical: crit/);
  assert.match(gameState, /vocation: player\.vocation/);
});
