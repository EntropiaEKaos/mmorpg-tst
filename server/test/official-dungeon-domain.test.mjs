import test from 'node:test';
import assert from 'node:assert/strict';
import { OfficialDungeonDomain, DUNGEON_RUN_LENGTHS } from '../engine/OfficialDungeonDomain.mjs';

function makePlayer(level = 10) {
  return {
    id: 'player-1', level, gold: 0, xp: 0, reputation: { town: 0 }, stats: { goldEarned: 0 },
    official: { coins: 0, dungeon: { active: false, runId: null, wave: 0, maxWaves: 0, killsRemaining: 0, highestWave: 0, clears: 0 } },
  };
}
const host = {
  ensurePlayer(player) { return player.official; },
  awardReputation(player, amount) { player.reputation.town += amount; return player.reputation.town; },
};

test('dungeon wave scaling is deterministic and clamps invalid wave numbers', () => {
  const domain = new OfficialDungeonDomain();
  const low = domain.getWave(1, 1);
  const high = domain.getWave(1, 20);
  assert.equal(low.wave, 1);
  assert.ok(high.hp > low.hp);
  assert.ok(high.attack > low.attack);
  assert.equal(domain.getWave(999, 1).wave >= 1, true);
  assert.equal(domain.getWave(-50, 1).wave, 1);
});

test('dungeon start validates run length, level gates and duplicate active runs', () => {
  const domain = new OfficialDungeonDomain();
  const low = makePlayer(1);
  assert.equal(DUNGEON_RUN_LENGTHS.includes(10), true);
  assert.equal(domain.start(host, low, 10, 1000).ok, false);
  const player = makePlayer(10);
  const run = domain.start(host, player, 5, 1000);
  assert.equal(run.ok, true);
  assert.equal(run.runId, 'dungeon_player-1_1000');
  assert.equal(player.official.dungeon.maxWaves, 5);
  assert.equal(player.official.dungeon.killsRemaining, domain.getWave(1, 10).count);
  assert.equal(domain.start(host, player, 3, 2000).ok, false);
});

test('dungeon kills are isolated by owner and active run id', () => {
  const domain = new OfficialDungeonDomain();
  const player = makePlayer(10);
  domain.start(host, player, 3, 1000);
  const before = player.official.dungeon.killsRemaining;
  domain.onMonsterKill(host, player, { dungeonOwnerId: 'someone-else', dungeonRunId: player.official.dungeon.runId });
  assert.equal(player.official.dungeon.killsRemaining, before);
  domain.onMonsterKill(host, player, { dungeonOwnerId: player.id, dungeonRunId: 'stale-run' });
  assert.equal(player.official.dungeon.killsRemaining, before);
});

test('dungeon wave completion advances exactly one wave and resets kill target', () => {
  const domain = new OfficialDungeonDomain();
  const player = makePlayer(10);
  domain.start(host, player, 3, 1000);
  player.official.dungeon.killsRemaining = 1;
  const result = domain.onMonsterKill(host, player, { dungeonOwnerId: player.id, dungeonRunId: player.official.dungeon.runId });
  assert.equal(result.nextDungeonWave, 2);
  assert.equal(result.dungeonComplete, null);
  assert.equal(player.official.dungeon.wave, 2);
  assert.equal(player.official.dungeon.killsRemaining, domain.getWave(2, 10).count);
});

test('dungeon final kill grants rewards once and closes the run', () => {
  const domain = new OfficialDungeonDomain();
  const player = makePlayer(10);
  domain.start(host, player, 3, 1000);
  player.official.dungeon.wave = 3;
  player.official.dungeon.killsRemaining = 1;
  const runId = player.official.dungeon.runId;
  const result = domain.onMonsterKill(host, player, { dungeonOwnerId: player.id, dungeonRunId: runId });
  assert.deepEqual(result.dungeonComplete, { gold: 650, xp: 850, coins: 6 });
  assert.equal(player.gold, 650);
  assert.equal(player.xp, 850);
  assert.equal(player.official.coins, 6);
  assert.equal(player.official.dungeon.highestWave, 3);
  assert.equal(player.official.dungeon.clears, 1);
  assert.equal(player.reputation.town, 150);
  assert.equal(player.official.dungeon.active, false);
  assert.equal(player.official.dungeon.runId, null);
  const again = domain.onMonsterKill(host, player, { dungeonOwnerId: player.id, dungeonRunId: runId });
  assert.equal(again.dungeonComplete, null);
  assert.equal(player.gold, 650);
});

test('dungeon abandon and fail clear transient run state without erasing history', () => {
  const domain = new OfficialDungeonDomain();
  const player = makePlayer(10);
  player.official.dungeon.highestWave = 5;
  player.official.dungeon.clears = 2;
  domain.start(host, player, 3, 1000);
  assert.equal(domain.fail(host, player), true);
  assert.equal(player.official.dungeon.active, false);
  assert.equal(player.official.dungeon.highestWave, 5);
  assert.equal(player.official.dungeon.clears, 2);
  assert.equal(domain.abandon(host, player), false);
});
