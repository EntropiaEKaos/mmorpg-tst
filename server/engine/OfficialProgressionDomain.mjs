// ===================================================================
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
