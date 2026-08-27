import test from 'node:test';
import assert from 'node:assert/strict';
import { OfficialWorldEventDomain, WORLD_EVENT_RULES } from '../engine/OfficialWorldEventDomain.mjs';

function makeHost(events = []) {
  return {
    global: { event: null, eventSequence: 0, eventRewards: {} },
    contentEvents: events,
    saves: 0,
    save() { this.saves++; return true; },
    ensurePlayer(player) { return player.official; },
    awardReputation(player, amount) { player.reputation.town += amount; },
  };
}
function player(name = 'Hero', mapId = 'eldoria') {
  return { name, mapId, gold: 0, xp: 0, reputation: { town: 0 }, stats: { goldEarned: 0 }, official: { coins: 0 } };
}

test('world event rotation uses content definitions and deterministic sequence', () => {
  const domain = new OfficialWorldEventDomain();
  const host = makeHost([
    { id: 'one', name: 'One', mapId: 'eldoria', target: 'Rat', needed: 2, durationMs: 120000 },
    { id: 'two', name: 'Two', mapId: 'frostpeak', target: 'Wolf', needed: 3, durationMs: 120000 },
  ]);
  const first = domain.ensure(host, 1000);
  assert.equal(first.id, 'one');
  first.completed = true; first.completedAt = 1000;
  assert.equal(domain.ensure(host, 1000 + WORLD_EVENT_RULES.completionGraceMs - 1).id, 'one');
  const second = domain.ensure(host, 1000 + WORLD_EVENT_RULES.completionGraceMs + 1);
  assert.equal(second.id, 'two');
  assert.equal(host.global.eventSequence, 2);
});

test('world event ignores wrong map and wrong target', () => {
  const domain = new OfficialWorldEventDomain();
  const host = makeHost([{ id: 'hunt', name: 'Hunt', mapId: 'eldoria', target: 'rat', needed: 2 }]);
  const hero = player('Hero', 'frostpeak');
  assert.equal(domain.recordKill(host, hero, 'rat', 1000), null);
  hero.mapId = 'eldoria';
  assert.equal(domain.recordKill(host, hero, 'wolf', 1001), null);
  assert.equal(host.global.event.progress, 0);
});

test('world event completion queues isolated rewards for every participant', () => {
  const domain = new OfficialWorldEventDomain();
  const host = makeHost([{ id: 'hunt', name: 'Hunt', mapId: 'eldoria', target: 'rat', needed: 2, rewardGold: 50, rewardXp: 60, rewardCoins: 7 }]);
  const a = player('Alice'); const b = player('Bob');
  const p1 = domain.recordKill(host, a, 'rat', 1000);
  assert.deepEqual(p1, { name: 'Hunt', progress: 1, needed: 2 });
  const p2 = domain.recordKill(host, b, 'rat', 1001);
  assert.deepEqual(p2, { name: 'Hunt', progress: 2, needed: 2 });
  assert.equal(host.global.event.completed, true);
  assert.equal(host.global.event.participants.alice, 1);
  assert.equal(host.global.event.participants.bob, 1);
  assert.equal(domain.pendingRewards(host, a).length, 1);
  assert.equal(domain.pendingRewards(host, b).length, 1);
});

test('world event reward claim is private and exactly once', () => {
  const domain = new OfficialWorldEventDomain();
  const host = makeHost([{ id: 'hunt', name: 'Hunt', mapId: 'eldoria', target: 'rat', needed: 1, rewardGold: 50, rewardXp: 60, rewardCoins: 7 }]);
  const a = player('Alice'); const b = player('Bob');
  domain.recordKill(host, a, 'rat', 1000);
  assert.equal(domain.claim(host, b), false);
  const reward = domain.claim(host, a);
  assert.equal(reward.gold, 50);
  assert.equal(a.gold, 50);
  assert.equal(a.xp, 60);
  assert.equal(a.official.coins, 7);
  assert.equal(a.reputation.town, 100);
  assert.equal(domain.claim(host, a), false);
  assert.equal(domain.pendingRewards(host, a).length, 0);
});

test('world event reward queues remain bounded', () => {
  const domain = new OfficialWorldEventDomain();
  const host = makeHost([{ id: 'hunt', name: 'Hunt', mapId: 'eldoria', target: 'rat', needed: 1 }]);
  const a = player('Alice');
  host.global.eventRewards.alice = Array.from({ length: WORLD_EVENT_RULES.maxRewardQueue }, (_, i) => ({ id: `old${i}`, claimed: false }));
  domain.recordKill(host, a, 'rat', 1000);
  assert.equal(host.global.eventRewards.alice.length, WORLD_EVENT_RULES.maxRewardQueue);
  assert.equal(host.global.eventRewards.alice.at(-1).name, 'Hunt');
});
