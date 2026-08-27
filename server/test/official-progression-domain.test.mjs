import test from 'node:test';
import assert from 'node:assert/strict';
import { OfficialProgressionDomain } from '../engine/OfficialProgressionDomain.mjs';

function makePlayer() {
  return {
    name: 'Progressor', level: 10, gold: 1000, xp: 0, hp: 20, maxHp: 100, mana: 5, maxMana: 80,
    buffs: [], equipment: {}, reputation: { town: 0 }, stats: { goldEarned: 0, monstersKilled: 0 },
    official: {
      stamina: 2520, lastStaminaTick: 0, blessingsUntil: 0, training: 0, daily: { lastDay: '', streak: 0 },
      mastery: {}, achievements: [], coins: 0, dungeon: { highestWave: 0 },
    },
  };
}
const host = { ensurePlayer(player) { return player.official; } };

test('progression daily rewards are once-per-day and preserve consecutive streaks', () => {
  const domain = new OfficialProgressionDomain();
  const player = makePlayer();
  const day1 = Date.parse('2026-08-01T12:00:00Z');
  const first = domain.claimDaily(host, player, day1);
  assert.deepEqual(first, { gold: 50, xp: 30, coins: 2 });
  assert.equal(domain.claimDaily(host, player, day1 + 1000), false);
  const second = domain.claimDaily(host, player, day1 + 86_400_000);
  assert.deepEqual(second, { gold: 100, xp: 60, coins: 4 });
  assert.equal(player.official.daily.streak, 2);
});

test('progression stamina and XP multipliers remain server authoritative', () => {
  const domain = new OfficialProgressionDomain();
  const player = makePlayer();
  const now = Date.parse('2026-08-10T12:00:00Z');
  player.official.lastStaminaTick = now - 5 * 60_000;
  assert.equal(domain.tickStamina(host, player, now), 5);
  assert.equal(player.official.stamina, 2515);
  assert.equal(domain.getXpMultiplier(host, player, now), 1.2);
  player.official.blessingsUntil = now + 10000;
  player.buffs = [{ type: 'official_xp', value: 10, expiresAt: now + 10000 }];
  assert.ok(Math.abs(domain.getXpMultiplier(host, player, now) - 1.386) < 1e-9);
  assert.equal(domain.getDeathLossMultiplier(host, player, now), 0.5);
});

test('progression reputation is bounded and drives deterministic discounts', () => {
  const domain = new OfficialProgressionDomain();
  const player = makePlayer();
  assert.equal(domain.awardReputation(player, 3000), 3000);
  assert.equal(domain.getReputationDiscount(player), 0.05);
  domain.awardReputation(player, 10000);
  assert.equal(domain.getReputationDiscount(player), 0.10);
  for (let i = 0; i < 20; i++) domain.awardReputation(player, 10000);
  assert.equal(player.reputation.town, 100000);
  assert.equal(domain.getReputationDiscount(player), 0.25);
});

test('progression weapon mastery levels without trusting client values', () => {
  const domain = new OfficialProgressionDomain();
  const player = makePlayer();
  player.equipment.weapon = { id: 'training_blade' };
  for (let i = 0; i < 25; i++) domain.recordWeaponHit(host, player);
  assert.equal(player.official.mastery.training_blade.level, 2);
  assert.equal(player.official.mastery.training_blade.xp, 0);
  assert.equal(domain.getMasteryBonus(host, player), 0.02);
});

test('progression achievements award coins exactly once', () => {
  const domain = new OfficialProgressionDomain();
  const player = makePlayer();
  player.stats.monstersKilled = 25;
  const first = domain.refreshAchievements(host, player);
  assert.equal(first.some(a => a.id === 'first_blood'), true);
  assert.equal(first.some(a => a.id === 'hunter_25'), true);
  const coins = player.official.coins;
  assert.deepEqual(domain.refreshAchievements(host, player), []);
  assert.equal(player.official.coins, coins);
});

test('progression rest and training charge authoritative gold and enforce caps', () => {
  const domain = new OfficialProgressionDomain();
  const player = makePlayer();
  player.official.stamina = 2400;
  assert.equal(domain.rest(host, player), true);
  assert.equal(player.gold, 950);
  assert.equal(player.hp, player.maxHp);
  assert.equal(player.mana, player.maxMana);
  assert.equal(player.official.stamina, 2520);
  assert.equal(domain.train(host, player), true);
  assert.equal(player.gold, 750);
  assert.equal(player.official.training, 1);
  player.official.training = 20;
  assert.equal(domain.train(host, player), false);
});
