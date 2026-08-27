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
'''
write('server/engine/OfficialWorldEventDomain.mjs', DOMAIN)

path = 'server/engine/OfficialSystems.mjs'
text = read(path)
anchor = "import { officialDungeonDomain } from './OfficialDungeonDomain.mjs';\n"
text = replace_once(text, anchor, anchor + "import { officialWorldEventDomain } from './OfficialWorldEventDomain.mjs';\n", 'world event import')
text = text.replace('  OFFICIAL_COIN_STORE, OFFICIAL_BOOKS, MYSTERIES, DUNGEON_WAVES, DEFAULT_EVENTS,\n', '  OFFICIAL_COIN_STORE, OFFICIAL_BOOKS, MYSTERIES,\n')

old_ensure = r'''  ensureWorldEvent(now = Date.now()) {
    const event = this.global.event;
    if (event && !event.completed && now < event.expiresAt) return event;
    if (event?.completed && now < (event.completedAt || 0) + 60_000) return event;

    const source = this.contentEvents.length ? this.contentEvents : DEFAULT_EVENTS;
    const raw = source[this.global.eventSequence % source.length] || DEFAULT_EVENTS[0];
    this.global.eventSequence = (this.global.eventSequence + 1) % 1_000_000;
    const normalized = {
      id: cleanText(raw.id, 100) || `event_${this.global.eventSequence}`,
      name: cleanText(raw.name, 100) || 'World Hunt', icon: cleanText(raw.icon, 8) || '🌍',
      mapId: cleanText(raw.mapId, 50) || 'eldoria', target: slug(raw.target || raw.monster || 'rat'),
      needed: int(raw.needed ?? raw.count, 1, 10000, 30), progress: 0,
      rewardGold: int(raw.rewardGold, 0, 10_000_000, 300), rewardXp: int(raw.rewardXp, 0, 10_000_000, 200),
      rewardCoins: int(raw.rewardCoins, 0, 10000, 8), participants: {}, completed: false,
      startedAt: now, expiresAt: now + int(raw.durationMs ?? raw.duration, 60_000, 86_400_000, 15 * 60_000), completedAt: 0,
    };
    this.global.event = normalized;
    this.save();
    return normalized;
  }
'''
new_ensure = r'''  ensureWorldEvent(now = Date.now()) {
    return officialWorldEventDomain.ensure(this, now);
  }
'''
text = replace_once(text, old_ensure, new_ensure, 'ensure world event')

old_progress = r'''    const event = this.ensureWorldEvent();
    if (!event.completed && player.mapId === event.mapId && key === event.target) {
      event.progress = Math.min(event.needed, event.progress + 1);
      const pk = playerKey(player.name);
      event.participants[pk] = int(event.participants[pk], 0, 1_000_000, 0) + 1;
      result.worldEventProgress = { name: event.name, progress: event.progress, needed: event.needed };
      if (event.progress >= event.needed) {
        event.completed = true;
        event.completedAt = Date.now();
        for (const participant of Object.keys(event.participants)) {
          const queue = Array.isArray(this.global.eventRewards[participant]) ? this.global.eventRewards[participant] : [];
          queue.push({ id: `${event.id}_${event.completedAt}`, name: event.name, gold: event.rewardGold, xp: event.rewardXp, coins: event.rewardCoins, claimed: false });
          this.global.eventRewards[participant] = queue.slice(-20);
        }
      }
      this.save();
    }
'''
new_progress = r'''    result.worldEventProgress = officialWorldEventDomain.recordKill(this, player, key);
'''
text = replace_once(text, old_progress, new_progress, 'world event kill block')

old_claim = r'''  claimWorldEvent(player) {
    const key = playerKey(player.name);
    const queue = Array.isArray(this.global.eventRewards[key]) ? this.global.eventRewards[key] : [];
    const reward = queue.find(r => !r.claimed);
    if (!reward) return false;
    reward.claimed = true;
    player.gold += reward.gold; player.xp += reward.xp; this.ensurePlayer(player).coins += reward.coins;
    player.stats.goldEarned = (player.stats.goldEarned || 0) + reward.gold;
    this.awardReputation(player, 100);
    this.save(); return reward;
  }
'''
new_claim = r'''  claimWorldEvent(player) {
    return officialWorldEventDomain.claim(this, player);
  }
'''
text = replace_once(text, old_claim, new_claim, 'world event claim')
text = text.replace("    const pendingRewards = (this.global.eventRewards[playerKey(player.name)] || []).filter(r => !r.claimed);\n", "    const pendingRewards = officialWorldEventDomain.pendingRewards(this, player);\n")
write(path, text)

TEST = r'''import test from 'node:test';
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
'''
write('server/test/official-world-event-domain.test.mjs', TEST)

DOC = r'''# MOR'IA Foundation 7.9 — World Event Domain

Foundation 7.9 extracts global event lifecycle into `OfficialWorldEventDomain`.

The domain now owns content/fallback event rotation, duration and completion grace rules, map/target validation, global progress, participant accounting, bounded per-character reward queues and exactly-once reward claims.

`OfficialSystems` remains a compatibility façade. Existing snapshots and `world_event_claim` actions remain unchanged.

This boundary enables seasonal invasions, realm bosses, multi-stage campaigns, server-wide objectives, regional events and event-specific reward tables without growing the core runtime monolith.
'''
write('docs/FOUNDATION_7_9_WORLD_EVENTS.md', DOC)
print('Foundation 7.9 world event domain extraction applied')
