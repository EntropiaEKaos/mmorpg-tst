import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildBossIntroEvent,
  buildRegionDiscoveryEvent,
  buildAchievementUnlockEvent,
  buildCosmeticUnlockEvent,
  buildRewardChestEvent,
} from '../engine/CinematicRewards.mjs';
import { exportPlayerState, freshPlayerState, normalizePlayerState } from '../engine/OfficialStateSchema.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const player = { id:'p1', vocation:'ranger', x:10, y:20 };

test('9.4 authoritative cinematic builders cover boss, region, achievement, cosmetics and chests', () => {
  assert.equal(buildBossIntroEvent(player, { id:'boss', name:'Warden', emoji:'👹', type:'boss', level:20, x:12, y:20 }).kind, 'boss_intro');
  assert.equal(buildRegionDiscoveryEvent(player, { id:'frostpeak', name:'Frostpeak', description:'Frozen pass' }).kind, 'region_discovered');
  assert.equal(buildAchievementUnlockEvent(player, { id:'first_blood', name:'First Blood', icon:'⚔', coins:2 }).kind, 'achievement_unlocked');
  assert.equal(buildCosmeticUnlockEvent(player, { type:'mount', id:'wolf', name:'Dire Wolf', icon:'🐺' }).kind, 'cosmetic_unlocked');
  assert.equal(buildRewardChestEvent(player, { name:'Dragon Mail', icon:'🎽', rarity:'legendary' }).rarity, 'legendary');
});

test('9.4 discovered regions survive official normalization and export', () => {
  const state = freshPlayerState(1000);
  state.regionsDiscovered = ['eldoria', 'frostpeak'];
  const normalized = normalizePlayerState(state, 1000);
  assert.deepEqual(normalized.regionsDiscovered, ['eldoria', 'frostpeak']);
  assert.deepEqual(exportPlayerState(normalized).regionsDiscovered, ['eldoria', 'frostpeak']);
});

test('9.4 progression owns idempotent region discovery', () => {
  const progression = read('server/engine/OfficialProgressionDomain.mjs');
  const systems = read('server/engine/OfficialSystems.mjs');
  assert.match(progression, /discoverRegion\(host, player, rawMapId\)/);
  assert.match(progression, /regionsDiscovered\.includes\(mapId\)/);
  assert.match(systems, /discoverRegion\(player, mapId\)/);
});

test('9.4 GameState emits cinematic events only after authoritative outcomes', () => {
  const source = read('server/engine/GameState.mjs');
  for (const marker of ['buildBossIntroEvent', 'buildRegionDiscoveryEvent', 'buildAchievementUnlockEvent', 'buildCosmeticUnlockEvent', 'buildRewardChestEvent']) {
    assert.match(source, new RegExp(marker));
  }
  assert.match(source, /officialSystems\.discoverRegion\(player, targetMap\.id/);
  assert.match(source, /action === 'buy'.*buildCosmeticUnlockEvent/s);
  assert.match(source, /kind: 'achievement_unlocked'|buildAchievementUnlockEvent/);
});

test('9.4 client cinematic bridge handles all reward moments and RegionBanner hosts them', () => {
  const bridge = read('src/game/cinematicRewards.ts');
  const banner = read('src/components/RegionBanner.tsx');
  const presentation = read('src/game/rewardPresentation.ts');
  for (const kind of ['boss_intro','region_discovered','achievement_unlocked','cosmetic_unlocked','reward_chest_opened']) {
    assert.ok(bridge.includes(kind));
    assert.ok(presentation.includes(kind));
  }
  assert.match(banner, /CINEMATIC_EVENT_NAME/);
  assert.match(banner, /addEventListener/);
  assert.match(banner, /cinematic\.title/);
});

test('9.4 ground loot beams are extracted and GameScreen stays below architecture budget', () => {
  const helper = read('src/game/groundLootPresentation.ts');
  const gameScreenPath = path.join(ROOT, 'src/components/GameScreen.tsx');
  const gameScreen = fs.readFileSync(gameScreenPath, 'utf8');
  assert.match(helper, /legendary/);
  assert.match(helper, /createLinearGradient/);
  assert.match(helper, /beamHeight/);
  assert.match(gameScreen, /drawGroundLootPresentation/);
  assert.doesNotMatch(gameScreen, /const age = \(now - g\.createdAt\) \/ CORPSE_LIFETIME/);
  assert.ok(fs.statSync(gameScreenPath).size <= 155_000, `GameScreen.tsx is ${fs.statSync(gameScreenPath).size} bytes`);
});
