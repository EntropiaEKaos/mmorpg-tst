import test from 'node:test';
import assert from 'node:assert/strict';
import { OfficialProgressionDomain } from '../engine/OfficialProgressionDomain.mjs';

function makePlayer() {
  return {
    name: 'Progressor', level: 1, gold: 0, bankGold: 0, xp: 0, hp: 20, maxHp: 100, mana: 5, maxMana: 80,
    buffs: [], equipment: {}, reputation: { town: 0 }, achievements: [],
    stats: { goldEarned: 0, monstersKilled: 0, bossesKilled: 0, distanceWalked: 0, damageTaken: 0, damageDealt: 0, healingDone: 0, deaths: 0, spellsCast: 0 },
    official: {
      stamina: 2520, lastStaminaTick: 0, blessingsUntil: 0, training: 0, daily: { lastDay: '', streak: 0 },
      mastery: {}, achievements: [], coins: 0, titles: { owned: [], active: null }, dungeon: { highestWave: 0 },
    },
  };
}
const host = { ensurePlayer(player) { return player.official; } };

test('progression daily rewards are once-per-day and preserve consecutive streaks', () => {
  const domain = new OfficialProgressionDomain(); const player = makePlayer();
  const day1 = Date.parse('2026-08-01T12:00:00Z');
  assert.deepEqual(domain.claimDaily(host, player, day1), { gold: 50, xp: 30, coins: 2 });
  assert.equal(domain.claimDaily(host, player, day1 + 1000), false);
  assert.deepEqual(domain.claimDaily(host, player, day1 + 86_400_000), { gold: 100, xp: 60, coins: 4 });
  assert.equal(player.official.daily.streak, 2);
});

test('progression stamina and XP multipliers remain server authoritative', () => {
  const domain = new OfficialProgressionDomain(); const player = makePlayer();
  const now = Date.parse('2026-08-10T12:00:00Z'); player.official.lastStaminaTick = now - 5 * 60_000;
  assert.equal(domain.tickStamina(host, player, now), 5); assert.equal(player.official.stamina, 2515);
  assert.equal(domain.getXpMultiplier(host, player, now), 1.2);
  player.official.blessingsUntil = now + 10000; player.buffs = [{ type: 'official_xp', value: 10, expiresAt: now + 10000 }];
  assert.ok(Math.abs(domain.getXpMultiplier(host, player, now) - 1.386) < 1e-9);
  assert.equal(domain.getDeathLossMultiplier(host, player, now), 0.5);
});

test('progression reputation is bounded and drives deterministic discounts', () => {
  const domain = new OfficialProgressionDomain(); const player = makePlayer();
  assert.equal(domain.awardReputation(player, 3000), 3000); assert.equal(domain.getReputationDiscount(player), 0.05);
  domain.awardReputation(player, 10000); assert.equal(domain.getReputationDiscount(player), 0.10);
  for (let i = 0; i < 20; i++) domain.awardReputation(player, 10000);
  assert.equal(player.reputation.town, 100000); assert.equal(domain.getReputationDiscount(player), 0.25);
});

test('progression weapon mastery levels without trusting client values', () => {
  const domain = new OfficialProgressionDomain(); const player = makePlayer(); player.equipment.weapon = { id: 'training_blade' };
  for (let i = 0; i < 25; i++) domain.recordWeaponHit(host, player);
  assert.equal(player.official.mastery.training_blade.level, 2); assert.equal(player.official.mastery.training_blade.xp, 0);
  assert.equal(domain.getMasteryBonus(host, player), 0.02);
});

test('migrated achievements preserve legacy unlock thresholds and rewards exactly once', () => {
  const domain = new OfficialProgressionDomain(); const player = makePlayer();
  player.stats.monstersKilled = 10;
  const first = domain.refreshAchievements(host, player);
  assert.equal(first.some(a => a.id === 'first_blood'), true);
  assert.equal(first.some(a => a.id === 'hunter_10'), true);
  assert.equal(first.some(a => a.id === 'hunter_25'), false);
  assert.equal(player.xp, 200);
  assert.equal(player.gold, 50);
  assert.equal(player.stats.goldEarned, 50);
  const snapshot = { xp: player.xp, gold: player.gold, coins: player.official.coins, achievements: [...player.official.achievements] };
  assert.deepEqual(domain.refreshAchievements(host, player), []);
  assert.deepEqual({ xp: player.xp, gold: player.gold, coins: player.official.coins, achievements: player.official.achievements }, snapshot);
});

test('migrated achievement titles are owned by official state and idempotent', () => {
  const domain = new OfficialProgressionDomain(); const player = makePlayer();
  player.level = 10;
  domain.refreshAchievements(host, player);
  assert.equal(player.official.achievements.includes('level_5'), true);
  assert.equal(player.official.achievements.includes('level_10'), true);
  assert.equal(player.official.titles.owned.includes('Veteran'), true);
  const count = player.official.titles.owned.filter(title => title === 'Veteran').length;
  domain.refreshAchievements(host, player);
  assert.equal(player.official.titles.owned.filter(title => title === 'Veteran').length, count);
});

test('progression rest and training charge authoritative gold and enforce caps', () => {
  const domain = new OfficialProgressionDomain(); const player = makePlayer(); player.gold = 1000; player.official.stamina = 2400;
  assert.equal(domain.rest(host, player), true); assert.equal(player.gold, 950); assert.equal(player.hp, player.maxHp); assert.equal(player.mana, player.maxMana); assert.equal(player.official.stamina, 2520);
  assert.equal(domain.train(host, player), true); assert.equal(player.gold, 750); assert.equal(player.official.training, 1);
  player.official.training = 20; assert.equal(domain.train(host, player), false);
});
