from pathlib import Path

ROOT = Path('.')
def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')
def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

DOMAIN = r'''// ===================================================================
// MOR'IA — OFFICIAL PROGRESSION DOMAIN
// Owns progression rules that mutate only player progression state.
// Persistence and network orchestration stay in OfficialSystems/GameState.
// ===================================================================

import { ACHIEVEMENTS } from './OfficialCatalogs.mjs';

const clamp = (value, min, max, fallback = min) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};
const int = (value, min, max, fallback = min) => Math.floor(clamp(value, min, max, fallback));
const dayKey = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);

function state(host, player) {
  if (!host || typeof host.ensurePlayer !== 'function') throw new TypeError('OfficialProgressionDomain requires an OfficialSystems-compatible host.');
  return host.ensurePlayer(player);
}

export class OfficialProgressionDomain {
  getXpMultiplier(host, player, now = Date.now()) {
    const s = state(host, player);
    let mult = s.stamina > 2400 ? 1.2 : s.stamina < 840 ? 0.5 : 1;
    if (now < s.blessingsUntil) mult *= 1.05;
    const food = Array.isArray(player.buffs) ? player.buffs.find(b => b.type === 'official_xp' && Number(b.expiresAt) > now) : null;
    if (food) mult *= 1 + clamp(food.value, 0, 50, 0) / 100;
    return mult;
  }

  getDeathLossMultiplier(host, player, now = Date.now()) {
    return now < state(host, player).blessingsUntil ? 0.5 : 1;
  }

  getReputationDiscount(player) {
    const town = int(player.reputation?.town, -100_000, 100_000, 0);
    if (town >= 42000) return 0.25;
    if (town >= 21000) return 0.15;
    if (town >= 9000) return 0.10;
    if (town >= 3000) return 0.05;
    return 0;
  }

  awardReputation(player, amount) {
    if (!player.reputation || typeof player.reputation !== 'object' || Array.isArray(player.reputation)) player.reputation = { town: 0 };
    const delta = int(amount, -10_000, 10_000, 0);
    player.reputation.town = int(player.reputation.town, -100_000, 100_000, 0) + delta;
    player.reputation.town = Math.max(-100_000, Math.min(100_000, player.reputation.town));
    return player.reputation.town;
  }

  getMasteryBonus(host, player) {
    const weapon = player.equipment?.weapon;
    if (!weapon?.id) return 0;
    const mastery = state(host, player).mastery[weapon.id];
    return mastery ? Math.min(0.25, int(mastery.level, 1, 20, 1) * 0.01) : 0;
  }

  recordWeaponHit(host, player) {
    const weapon = player.equipment?.weapon;
    if (!weapon?.id) return null;
    const s = state(host, player);
    const entry = s.mastery[weapon.id] || { level: 1, xp: 0 };
    entry.level = int(entry.level, 1, 20, 1);
    entry.xp = int(entry.xp, 0, 1_000_000, 0) + 1;
    const needed = entry.level * 25;
    if (entry.xp >= needed && entry.level < 20) { entry.xp -= needed; entry.level++; }
    s.mastery[weapon.id] = entry;
    return entry;
  }

  refreshAchievements(host, player) {
    const s = state(host, player);
    const unlocked = [];
    for (const achievement of ACHIEVEMENTS) {
      if (s.achievements.includes(achievement.id) || !achievement.test(player)) continue;
      s.achievements.push(achievement.id);
      s.coins += achievement.coins;
      unlocked.push({ id: achievement.id, name: achievement.name, icon: achievement.icon, coins: achievement.coins });
    }
    return unlocked;
  }

  tickStamina(host, player, now = Date.now()) {
    const s = state(host, player);
    if (now - s.lastStaminaTick < 60_000) return 0;
    const spent = Math.min(10, Math.floor((now - s.lastStaminaTick) / 60_000));
    s.stamina = Math.max(0, s.stamina - spent);
    s.lastStaminaTick += spent * 60_000;
    return spent;
  }

  rest(host, player) {
    if (player.gold < 50) return false;
    player.gold -= 50;
    player.hp = player.maxHp;
    player.mana = player.maxMana;
    const s = state(host, player);
    s.stamina = Math.min(2520, s.stamina + 120);
    return true;
  }

  train(host, player) {
    const s = state(host, player);
    if (player.gold < 200 || s.training >= 20) return false;
    player.gold -= 200;
    s.training++;
    return true;
  }

  claimDaily(host, player, now = Date.now()) {
    const s = state(host, player);
    const today = dayKey(now);
    if (s.daily.lastDay === today) return false;
    const previous = s.daily.lastDay ? new Date(`${s.daily.lastDay}T00:00:00Z`).getTime() : 0;
    const consecutive = previous && Math.floor((new Date(`${today}T00:00:00Z`).getTime() - previous) / 86_400_000) === 1;
    s.daily.streak = consecutive ? Math.min(7, s.daily.streak + 1) : 1;
    s.daily.lastDay = today;
    const day = s.daily.streak;
    const reward = { gold: 50 * day, xp: 30 * day, coins: 2 * day };
    player.gold += reward.gold;
    player.xp += reward.xp;
    s.coins += reward.coins;
    player.stats.goldEarned = (player.stats.goldEarned || 0) + reward.gold;
    return reward;
  }
}

export const officialProgressionDomain = new OfficialProgressionDomain();
'''
write('server/engine/OfficialProgressionDomain.mjs', DOMAIN)

path = 'server/engine/OfficialSystems.mjs'
text = read(path)
anchor = "import { officialCommerceDomain } from './OfficialCommerceDomain.mjs';\n"
text = replace_once(text, anchor, anchor + "import { officialProgressionDomain } from './OfficialProgressionDomain.mjs';\n", 'progression import')
text = text.replace("const dayKey = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);\n", '')

replacements = [
(r'''  getXpMultiplier(player) {
    const s = this.ensurePlayer(player);
    let mult = s.stamina > 2400 ? 1.2 : s.stamina < 840 ? 0.5 : 1;
    if (Date.now() < s.blessingsUntil) mult *= 1.05;
    const food = Array.isArray(player.buffs) ? player.buffs.find(b => b.type === 'official_xp' && Number(b.expiresAt) > Date.now()) : null;
    if (food) mult *= 1 + clamp(food.value, 0, 50, 0) / 100;
    return mult;
  }

  getDeathLossMultiplier(player) {
    return Date.now() < this.ensurePlayer(player).blessingsUntil ? 0.5 : 1;
  }

  getReputationDiscount(player) {
    const town = int(player.reputation?.town, -100_000, 100_000, 0);
    if (town >= 42000) return 0.25;
    if (town >= 21000) return 0.15;
    if (town >= 9000) return 0.10;
    if (town >= 3000) return 0.05;
    return 0;
  }

  awardReputation(player, amount) {
    if (!player.reputation || typeof player.reputation !== 'object' || Array.isArray(player.reputation)) player.reputation = { town: 0 };
    const delta = int(amount, -10_000, 10_000, 0);
    player.reputation.town = int(player.reputation.town, -100_000, 100_000, 0) + delta;
    return player.reputation.town;
  }
''', r'''  getXpMultiplier(player) {
    return officialProgressionDomain.getXpMultiplier(this, player);
  }

  getDeathLossMultiplier(player) {
    return officialProgressionDomain.getDeathLossMultiplier(this, player);
  }

  getReputationDiscount(player) {
    return officialProgressionDomain.getReputationDiscount(player);
  }

  awardReputation(player, amount) {
    return officialProgressionDomain.awardReputation(player, amount);
  }
''', 'xp/reputation methods'),
(r'''  getMasteryBonus(player) {
    const weapon = player.equipment?.weapon;
    if (!weapon?.id) return 0;
    const mastery = this.ensurePlayer(player).mastery[weapon.id];
    return mastery ? Math.min(0.25, int(mastery.level, 1, 20, 1) * 0.01) : 0;
  }

  recordWeaponHit(player) {
    const weapon = player.equipment?.weapon;
    if (!weapon?.id) return;
    const s = this.ensurePlayer(player);
    const entry = s.mastery[weapon.id] || { level: 1, xp: 0 };
    entry.xp = int(entry.xp, 0, 1_000_000, 0) + 1;
    const needed = entry.level * 25;
    if (entry.xp >= needed && entry.level < 20) { entry.xp -= needed; entry.level++; }
    s.mastery[weapon.id] = entry;
  }
''', r'''  getMasteryBonus(player) {
    return officialProgressionDomain.getMasteryBonus(this, player);
  }

  recordWeaponHit(player) {
    return officialProgressionDomain.recordWeaponHit(this, player);
  }
''', 'mastery methods'),
(r'''  refreshAchievements(player) {
    const s = this.ensurePlayer(player);
    const unlocked = [];
    for (const achievement of ACHIEVEMENTS) {
      if (s.achievements.includes(achievement.id) || !achievement.test(player)) continue;
      s.achievements.push(achievement.id);
      s.coins += achievement.coins;
      unlocked.push({ id: achievement.id, name: achievement.name, icon: achievement.icon, coins: achievement.coins });
    }
    return unlocked;
  }
''', r'''  refreshAchievements(player) {
    return officialProgressionDomain.refreshAchievements(this, player);
  }
''', 'achievement method'),
(r'''  tickPlayer(player, now = Date.now()) {
    const s = this.ensurePlayer(player);
    if (now - s.lastStaminaTick >= 60_000) {
      const spent = Math.min(10, Math.floor((now - s.lastStaminaTick) / 60_000));
      s.stamina = Math.max(0, s.stamina - spent);
      s.lastStaminaTick += spent * 60_000;
    }
    if (s.pvp.aggression > 0 && now - s.pvp.lastAggression > 5 * 60_000) {
''', r'''  tickPlayer(player, now = Date.now()) {
    const s = this.ensurePlayer(player);
    officialProgressionDomain.tickStamina(this, player, now);
    if (s.pvp.aggression > 0 && now - s.pvp.lastAggression > 5 * 60_000) {
''', 'tick stamina'),
(r'''  rest(player) {
    if (player.gold < 50) return false;
    player.gold -= 50;
    player.hp = player.maxHp;
    player.mana = player.maxMana;
    const s = this.ensurePlayer(player);
    s.stamina = Math.min(2520, s.stamina + 120);
    return true;
  }

  train(player) {
    const s = this.ensurePlayer(player);
    if (player.gold < 200 || s.training >= 20) return false;
    player.gold -= 200; s.training++; return true;
  }
''', r'''  rest(player) {
    return officialProgressionDomain.rest(this, player);
  }

  train(player) {
    return officialProgressionDomain.train(this, player);
  }
''', 'rest/train methods'),
(r'''  claimDaily(player, now = Date.now()) {
    const s = this.ensurePlayer(player);
    const today = dayKey(now);
    if (s.daily.lastDay === today) return false;
    const previous = s.daily.lastDay ? new Date(`${s.daily.lastDay}T00:00:00Z`).getTime() : 0;
    const consecutive = previous && Math.floor((new Date(`${today}T00:00:00Z`).getTime() - previous) / 86_400_000) === 1;
    s.daily.streak = consecutive ? Math.min(7, s.daily.streak + 1) : 1;
    s.daily.lastDay = today;
    const day = s.daily.streak;
    const reward = { gold: 50 * day, xp: 30 * day, coins: 2 * day };
    player.gold += reward.gold; player.xp += reward.xp; s.coins += reward.coins;
    player.stats.goldEarned = (player.stats.goldEarned || 0) + reward.gold;
    return reward;
  }
''', r'''  claimDaily(player, now = Date.now()) {
    return officialProgressionDomain.claimDaily(this, player, now);
  }
''', 'daily method'),
]
for old, new, label in replacements:
    text = replace_once(text, old, new, label)
write(path, text)

TEST = r'''import test from 'node:test';
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
'''
write('server/test/official-progression-domain.test.mjs', TEST)

DOC = r'''# MOR'IA Foundation 7.6 — Progression Domain

Foundation 7.6 extracts player progression rules from `OfficialSystems` into `OfficialProgressionDomain`.

The domain now owns stamina/XP modifiers, death-loss blessing modifier, reputation and shop discounts, weapon mastery, achievements, rest, training and daily reward streaks. `OfficialSystems` retains thin wrappers so the WebSocket protocol, action registry and save format remain backward-compatible.

This boundary makes future expansion safer: seasons, prestige, account-wide achievements, reputation factions, mastery trees, rested XP and progression events can evolve without coupling directly to mail, auction, dungeon or persistence code.
'''
write('docs/FOUNDATION_7_6_PROGRESSION_DOMAIN.md', DOC)
print('Foundation 7.6 progression domain extraction applied')
