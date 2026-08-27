// ===================================================================
// MOR'IA — OFFICIAL WORLD EVENT DOMAIN
// Owns event rotation, global progress, participants and reward queues.
// ===================================================================

import { DEFAULT_EVENTS } from './OfficialCatalogs.mjs';

const clamp = (value, min, max, fallback = min) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};
const int = (value, min, max, fallback = min) => Math.floor(clamp(value, min, max, fallback));
const cleanText = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const slug = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const playerKey = (name) => String(name || '').trim().toLocaleLowerCase('en-US');

export const WORLD_EVENT_RULES = Object.freeze({
  completionGraceMs: 60_000,
  minDurationMs: 60_000,
  maxDurationMs: 86_400_000,
  defaultDurationMs: 15 * 60_000,
  maxRewardQueue: 20,
});

function assertHost(host) {
  if (!host?.global || typeof host.save !== 'function') throw new TypeError('OfficialWorldEventDomain requires an OfficialSystems-compatible host.');
}

export class OfficialWorldEventDomain {
  ensure(host, now = Date.now()) {
    assertHost(host);
    const current = host.global.event;
    if (current && !current.completed && now < current.expiresAt) return current;
    if (current?.completed && now < (current.completedAt || 0) + WORLD_EVENT_RULES.completionGraceMs) return current;

    const source = Array.isArray(host.contentEvents) && host.contentEvents.length ? host.contentEvents : DEFAULT_EVENTS;
    const raw = source[host.global.eventSequence % source.length] || DEFAULT_EVENTS[0];
    host.global.eventSequence = (host.global.eventSequence + 1) % 1_000_000;
    const event = {
      id: cleanText(raw.id, 100) || `event_${host.global.eventSequence}`,
      name: cleanText(raw.name, 100) || 'World Hunt',
      icon: cleanText(raw.icon, 8) || '🌍',
      mapId: cleanText(raw.mapId, 50) || 'eldoria',
      target: slug(raw.target || raw.monster || 'rat'),
      needed: int(raw.needed ?? raw.count, 1, 10000, 30),
      progress: 0,
      rewardGold: int(raw.rewardGold, 0, 10_000_000, 300),
      rewardXp: int(raw.rewardXp, 0, 10_000_000, 200),
      rewardCoins: int(raw.rewardCoins, 0, 10000, 8),
      participants: {},
      completed: false,
      startedAt: now,
      expiresAt: now + int(raw.durationMs ?? raw.duration, WORLD_EVENT_RULES.minDurationMs, WORLD_EVENT_RULES.maxDurationMs, WORLD_EVENT_RULES.defaultDurationMs),
      completedAt: 0,
    };
    host.global.event = event;
    host.save();
    return event;
  }

  recordKill(host, player, rawMonsterKey, now = Date.now()) {
    assertHost(host);
    const event = this.ensure(host, now);
    const monsterKey = slug(rawMonsterKey);
    if (event.completed || player?.mapId !== event.mapId || monsterKey !== event.target) return null;

    event.progress = Math.min(event.needed, event.progress + 1);
    const key = playerKey(player.name);
    event.participants[key] = int(event.participants[key], 0, 1_000_000, 0) + 1;
    const progress = { name: event.name, progress: event.progress, needed: event.needed };

    if (event.progress >= event.needed) {
      event.completed = true;
      event.completedAt = now;
      for (const participant of Object.keys(event.participants)) {
        const queue = Array.isArray(host.global.eventRewards[participant]) ? host.global.eventRewards[participant] : [];
        queue.push({
          id: `${event.id}_${event.completedAt}`,
          name: event.name,
          gold: event.rewardGold,
          xp: event.rewardXp,
          coins: event.rewardCoins,
          claimed: false,
        });
        host.global.eventRewards[participant] = queue.slice(-WORLD_EVENT_RULES.maxRewardQueue);
      }
    }
    host.save();
    return progress;
  }

  pendingRewards(host, player) {
    assertHost(host);
    const queue = host.global.eventRewards[playerKey(player?.name)] || [];
    return Array.isArray(queue) ? queue.filter(reward => !reward?.claimed) : [];
  }

  claim(host, player) {
    assertHost(host);
    const key = playerKey(player?.name);
    const queue = Array.isArray(host.global.eventRewards[key]) ? host.global.eventRewards[key] : [];
    const reward = queue.find(entry => entry && !entry.claimed);
    if (!reward) return false;
    reward.claimed = true;
    player.gold += reward.gold;
    player.xp += reward.xp;
    host.ensurePlayer(player).coins += reward.coins;
    player.stats.goldEarned = (player.stats.goldEarned || 0) + reward.gold;
    if (typeof host.awardReputation === 'function') host.awardReputation(player, 100);
    host.save();
    return reward;
  }
}

export const officialWorldEventDomain = new OfficialWorldEventDomain();
