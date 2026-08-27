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
// MOR'IA — OFFICIAL STATE SCHEMA
// Single normalization boundary for persistent official player/global state.
// ===================================================================

import { ACHIEVEMENTS, MYSTERIES, OFFICIAL_BOOKS, OFFICIAL_PETS } from './OfficialCatalogs.mjs';

const clamp = (value, min, max, fallback = min) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};
const int = (value, min, max, fallback = min) => Math.floor(clamp(value, min, max, fallback));
const text = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const slug = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const playerKey = (name) => String(name || '').trim().toLocaleLowerCase('en-US').slice(0, 80);
const isRecord = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const unique = values => [...new Set(values)];

export const OFFICIAL_STATE_SCHEMA_VERSION = 1;
export const OFFICIAL_STATE_LIMITS = Object.freeze({
  depot: 40,
  pets: OFFICIAL_PETS.length,
  bestiary: 500,
  bestiaryCount: 1_000_000,
  achievements: ACHIEVEMENTS.length,
  books: OFFICIAL_BOOKS.length,
  mastery: 100,
  titles: 20,
  auctions: 500,
  mail: 5000,
  credits: 5000,
  eventRewardOwners: 5000,
  eventRewardsPerOwner: 20,
});

function clone(value) {
  if (value === null || value === undefined) return value;
  return structuredClone(value);
}

function normalizeProfession(raw) {
  return { level: int(raw?.level, 1, 100, 1), xp: int(raw?.xp, 0, 1_000_000, 0) };
}

function normalizeBestiary(raw) {
  if (!isRecord(raw)) return {};
  const result = {};
  for (const [rawKey, rawValue] of Object.entries(raw).slice(0, OFFICIAL_STATE_LIMITS.bestiary)) {
    const key = slug(rawKey);
    if (!key) continue;
    result[key] = Math.min(
      OFFICIAL_STATE_LIMITS.bestiaryCount,
      int(result[key], 0, OFFICIAL_STATE_LIMITS.bestiaryCount, 0)
        + int(rawValue, 0, OFFICIAL_STATE_LIMITS.bestiaryCount, 0),
    );
  }
  return result;
}

function normalizeMastery(raw) {
  if (!isRecord(raw)) return {};
  const result = {};
  for (const [rawId, rawEntry] of Object.entries(raw).slice(0, OFFICIAL_STATE_LIMITS.mastery)) {
    const id = text(rawId, 100);
    if (!id || !isRecord(rawEntry)) continue;
    result[id] = {
      level: int(rawEntry.level, 1, 20, 1),
      xp: int(rawEntry.xp, 0, 1_000_000, 0),
    };
  }
  return result;
}

function normalizeMysteries(raw) {
  if (!isRecord(raw)) return {};
  const result = {};
  for (const mystery of MYSTERIES) {
    if (!isRecord(raw[mystery.id])) continue;
    const chapterCount = mystery.chapters.length;
    const rawProgress = raw[mystery.id];
    const solved = int(rawProgress.solvedChapters, 0, chapterCount, 0);
    const completed = Boolean(rawProgress.completed) || solved >= chapterCount;
    result[mystery.id] = {
      solvedChapters: completed ? chapterCount : solved,
      completed,
    };
  }
  return result;
}

function normalizeEventReward(raw) {
  if (!isRecord(raw)) return null;
  const id = text(raw.id, 160);
  if (!id) return null;
  return {
    id,
    name: text(raw.name, 100) || 'World Event',
    gold: int(raw.gold, 0, 10_000_000, 0),
    xp: int(raw.xp, 0, 10_000_000, 0),
    coins: int(raw.coins, 0, 10_000, 0),
    claimed: Boolean(raw.claimed),
  };
}

export function freshPlayerState(now = Date.now()) {
  const timestamp = Number(now) > 0 ? Number(now) : Date.now();
  return {
    version: OFFICIAL_STATE_SCHEMA_VERSION,
    depot: [],
    pets: { owned: [], active: null },
    coins: 50,
    training: 0,
    professions: {
      mining: { level: 1, xp: 0 }, herbalism: { level: 1, xp: 0 },
      fishing: { level: 1, xp: 0 }, woodcutting: { level: 1, xp: 0 },
    },
    bestiary: {}, achievements: [],
    daily: { lastDay: '', streak: 0 },
    stamina: 2520, lastStaminaTick: timestamp,
    booksRead: [], mysteries: {},
    pvp: { enabled: false, skull: 'none', aggression: 0, lastAggression: 0 },
    mastery: {}, blessingsUntil: 0,
    titles: { owned: [], active: null },
    dungeon: { active: false, runId: null, wave: 0, maxWaves: 0, killsRemaining: 0, highestWave: 0, clears: 0 },
    welcomeMailSent: false,
    lastGatherAt: 0, lastMailAt: 0, lastPvpAttack: 0,
  };
}

export function freshGlobalState() {
  return {
    version: OFFICIAL_STATE_SCHEMA_VERSION,
    auctions: [], mail: [], credits: {}, eventRewards: {}, event: null, eventSequence: 0,
  };
}

export function normalizePlayerState(saved, now = Date.now()) {
  const base = freshPlayerState(now);
  if (!isRecord(saved)) return base;

  base.depot = Array.isArray(saved.depot)
    ? saved.depot.filter(isRecord).slice(0, OFFICIAL_STATE_LIMITS.depot).map(clone)
    : [];

  const owned = Array.isArray(saved.pets?.owned)
    ? unique(saved.pets.owned.filter(id => typeof id === 'string' && OFFICIAL_PETS.some(pet => pet.id === id))).slice(0, OFFICIAL_STATE_LIMITS.pets)
    : [];
  base.pets.owned = owned;
  base.pets.active = owned.includes(saved.pets?.active) ? saved.pets.active : null;

  base.coins = int(saved.coins, 0, 10_000_000, 50);
  base.training = int(saved.training, 0, 20, 0);
  for (const key of Object.keys(base.professions)) base.professions[key] = normalizeProfession(saved.professions?.[key]);
  base.bestiary = normalizeBestiary(saved.bestiary);
  base.achievements = Array.isArray(saved.achievements)
    ? unique(saved.achievements.filter(id => ACHIEVEMENTS.some(achievement => achievement.id === id))).slice(0, OFFICIAL_STATE_LIMITS.achievements)
    : [];
  base.daily = {
    lastDay: text(saved.daily?.lastDay, 10),
    streak: int(saved.daily?.streak, 0, 7, 0),
  };
  base.stamina = int(saved.stamina, 0, 2520, 2520);
  base.lastStaminaTick = Number(saved.lastStaminaTick) > 0 ? Number(saved.lastStaminaTick) : base.lastStaminaTick;
  base.booksRead = Array.isArray(saved.booksRead)
    ? unique(saved.booksRead.filter(id => OFFICIAL_BOOKS.some(book => book.id === id))).slice(0, OFFICIAL_STATE_LIMITS.books)
    : [];
  base.mysteries = normalizeMysteries(saved.mysteries);
  base.pvp = {
    enabled: Boolean(saved.pvp?.enabled),
    skull: ['none', 'white', 'yellow', 'orange', 'red', 'black'].includes(saved.pvp?.skull) ? saved.pvp.skull : 'none',
    aggression: int(saved.pvp?.aggression, 0, 100, 0),
    lastAggression: Math.max(0, Number(saved.pvp?.lastAggression) || 0),
  };
  base.mastery = normalizeMastery(saved.mastery);
  base.blessingsUntil = Math.max(0, Number(saved.blessingsUntil) || 0);
  base.titles.owned = Array.isArray(saved.titles?.owned)
    ? unique(saved.titles.owned.map(value => text(value, 50)).filter(Boolean)).slice(0, OFFICIAL_STATE_LIMITS.titles)
    : [];
  base.titles.active = base.titles.owned.includes(saved.titles?.active) ? saved.titles.active : null;
  base.dungeon = {
    active: false, runId: null, wave: 0, maxWaves: 0, killsRemaining: 0,
    highestWave: int(saved.dungeon?.highestWave, 0, 10, 0),
    clears: int(saved.dungeon?.clears, 0, 1_000_000, 0),
  };
  base.welcomeMailSent = Boolean(saved.welcomeMailSent);
  return base;
}

export function normalizeGlobalState(raw) {
  const base = freshGlobalState();
  if (!isRecord(raw)) return base;
  base.auctions = Array.isArray(raw.auctions)
    ? raw.auctions.filter(isRecord).slice(-OFFICIAL_STATE_LIMITS.auctions).map(clone)
    : [];
  base.mail = Array.isArray(raw.mail)
    ? raw.mail.filter(isRecord).slice(-OFFICIAL_STATE_LIMITS.mail).map(clone)
    : [];

  if (isRecord(raw.credits)) {
    for (const [rawName, rawCredit] of Object.entries(raw.credits).slice(0, OFFICIAL_STATE_LIMITS.credits)) {
      const key = playerKey(rawName);
      if (!key) continue;
      base.credits[key] = Math.min(1_000_000_000, int(base.credits[key], 0, 1_000_000_000, 0) + int(rawCredit, 0, 1_000_000_000, 0));
    }
  }

  if (isRecord(raw.eventRewards)) {
    for (const [rawName, rawQueue] of Object.entries(raw.eventRewards).slice(0, OFFICIAL_STATE_LIMITS.eventRewardOwners)) {
      const key = playerKey(rawName);
      if (!key || !Array.isArray(rawQueue)) continue;
      const queue = rawQueue.map(normalizeEventReward).filter(Boolean).slice(-OFFICIAL_STATE_LIMITS.eventRewardsPerOwner);
      if (queue.length) base.eventRewards[key] = queue;
    }
  }

  base.event = isRecord(raw.event) ? clone(raw.event) : null;
  base.eventSequence = int(raw.eventSequence, 0, 999_999, 0);
  return base;
}

export function exportPlayerState(state) {
  const s = normalizePlayerState(state);
  return clone({
    version: OFFICIAL_STATE_SCHEMA_VERSION,
    depot: s.depot,
    pets: s.pets,
    coins: s.coins,
    training: s.training,
    professions: s.professions,
    bestiary: s.bestiary,
    achievements: s.achievements,
    daily: s.daily,
    stamina: s.stamina,
    lastStaminaTick: s.lastStaminaTick,
    booksRead: s.booksRead,
    mysteries: s.mysteries,
    pvp: {
      enabled: s.pvp.enabled,
      skull: s.pvp.skull,
      aggression: s.pvp.aggression,
      lastAggression: s.pvp.lastAggression,
    },
    mastery: s.mastery,
    blessingsUntil: s.blessingsUntil,
    titles: s.titles,
    dungeon: { highestWave: s.dungeon.highestWave, clears: s.dungeon.clears },
    welcomeMailSent: s.welcomeMailSent,
  });
}
'''
write('server/engine/OfficialStateSchema.mjs', DOMAIN)

TEST = r'''import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OFFICIAL_STATE_LIMITS,
  exportPlayerState,
  freshGlobalState,
  freshPlayerState,
  normalizeGlobalState,
  normalizePlayerState,
} from '../engine/OfficialStateSchema.mjs';

test('official state defaults are deterministic with injected time and independent', () => {
  const a = freshPlayerState(12345);
  const b = freshPlayerState(12345);
  assert.equal(a.lastStaminaTick, 12345);
  assert.deepEqual(a, b);
  a.pets.owned.push('wolf_pup');
  assert.deepEqual(b.pets.owned, []);
  assert.deepEqual(freshGlobalState(), { version: 1, auctions: [], mail: [], credits: {}, eventRewards: {}, event: null, eventSequence: 0 });
});

test('official player schema rejects unknown catalog IDs and deduplicates known IDs', () => {
  const normalized = normalizePlayerState({
    pets: { owned: ['wolf_pup', 'wolf_pup', 'missing_pet'], active: 'missing_pet' },
    achievements: ['first_blood', 'first_blood', 'missing_achievement'],
    booksRead: ['chronicle_eldoria', 'chronicle_eldoria', 'missing_book'],
  }, 1000);
  assert.deepEqual(normalized.pets.owned, ['wolf_pup']);
  assert.equal(normalized.pets.active, null);
  assert.deepEqual(normalized.achievements, ['first_blood']);
  assert.deepEqual(normalized.booksRead, ['chronicle_eldoria']);
});

test('official player schema normalizes bestiary mastery and bounded numeric progression', () => {
  const normalized = normalizePlayerState({
    coins: Infinity,
    training: 999,
    stamina: -100,
    professions: { mining: { level: 999, xp: -5 } },
    bestiary: { 'Void Wraith': 5, 'void--wraith': 7, '': 999 },
    mastery: {
      sword: { level: 999, xp: -10 },
      broken: 'not-an-object',
    },
  }, 1000);
  assert.equal(normalized.coins, 50);
  assert.equal(normalized.training, 20);
  assert.equal(normalized.stamina, 0);
  assert.deepEqual(normalized.professions.mining, { level: 100, xp: 0 });
  assert.equal(normalized.bestiary.void_wraith, 12);
  assert.equal(Object.hasOwn(normalized.bestiary, ''), false);
  assert.deepEqual(normalized.mastery.sword, { level: 20, xp: 0 });
  assert.equal(Object.hasOwn(normalized.mastery, 'broken'), false);
});

test('official player schema normalizes mysteries and fails closed for completed corrupt progress', () => {
  const normalized = normalizePlayerState({
    mysteries: {
      lost_tome: { solvedChapters: 999999, completed: false },
      missing_mystery: { solvedChapters: 1, completed: false },
    },
  }, 1000);
  assert.deepEqual(normalized.mysteries.lost_tome, { solvedChapters: 3, completed: true });
  assert.equal(Object.hasOwn(normalized.mysteries, 'missing_mystery'), false);
});

test('official player restore always clears transient dungeon and cooldown state', () => {
  const normalized = normalizePlayerState({
    dungeon: { active: true, runId: 'injected', wave: 9, maxWaves: 10, killsRemaining: 1, highestWave: 7, clears: 3 },
    lastGatherAt: 999999,
    lastMailAt: 999999,
    lastPvpAttack: 999999,
  }, 1000);
  assert.deepEqual(normalized.dungeon, { active: false, runId: null, wave: 0, maxWaves: 0, killsRemaining: 0, highestWave: 7, clears: 3 });
  assert.equal(normalized.lastGatherAt, 0);
  assert.equal(normalized.lastMailAt, 0);
  assert.equal(normalized.lastPvpAttack, 0);
});

test('official player export excludes transient fields and is detached from live state', () => {
  const live = normalizePlayerState({
    depot: [{ id: 'item_1', name: 'Stone', quantity: 1 }],
    pets: { owned: ['wolf_pup'], active: 'wolf_pup' },
    dungeon: { highestWave: 4, clears: 2 },
  }, 1000);
  live.lastGatherAt = 123;
  const exported = exportPlayerState(live);
  assert.equal(Object.hasOwn(exported, 'lastGatherAt'), false);
  assert.deepEqual(exported.dungeon, { highestWave: 4, clears: 2 });
  exported.depot[0].name = 'Tampered';
  exported.pets.owned.push('shadow_cat');
  assert.equal(live.depot[0].name, 'Stone');
  assert.deepEqual(live.pets.owned, ['wolf_pup']);
});

test('official global schema caps containers, canonicalizes credits and reward queues', () => {
  const auctions = Array.from({ length: OFFICIAL_STATE_LIMITS.auctions + 5 }, (_, i) => ({ id: `a${i}` }));
  const mail = Array.from({ length: OFFICIAL_STATE_LIMITS.mail + 5 }, (_, i) => ({ id: `m${i}` }));
  const rewards = Array.from({ length: OFFICIAL_STATE_LIMITS.eventRewardsPerOwner + 5 }, (_, i) => ({
    id: `r${i}`, name: 'Event', gold: 10, xp: 20, coins: 1, claimed: false,
  }));
  const normalized = normalizeGlobalState({
    auctions,
    mail,
    credits: { Alice: 10, ALICE: 20, Bob: -5 },
    eventRewards: { ALICE: rewards },
    eventSequence: 5_000_000,
  });
  assert.equal(normalized.auctions.length, OFFICIAL_STATE_LIMITS.auctions);
  assert.equal(normalized.mail.length, OFFICIAL_STATE_LIMITS.mail);
  assert.equal(normalized.credits.alice, 30);
  assert.equal(normalized.credits.bob, 0);
  assert.equal(normalized.eventRewards.alice.length, OFFICIAL_STATE_LIMITS.eventRewardsPerOwner);
  assert.equal(normalized.eventSequence, 999999);
});

test('official global schema drops malformed reward records instead of reviving them', () => {
  const normalized = normalizeGlobalState({
    eventRewards: {
      Player: [null, {}, { id: 'ok', gold: -50, xp: Infinity, coins: 999999, claimed: 'yes' }],
    },
  });
  assert.deepEqual(normalized.eventRewards.player, [{ id: 'ok', name: 'World Event', gold: 0, xp: 0, coins: 10000, claimed: true }]);
});
'''
write('server/test/official-state-schema.test.mjs', TEST)

DOC = r'''# MOR'IA Foundation 7.13 — Official State Schema

Foundation 7.13 introduces `OfficialStateSchema` as the single normalization boundary for persistent official state.

Player state now receives catalog-backed ID validation and deduplication, bounded progression fields, canonical bestiary keys, normalized weapon mastery and mystery progress, reset of transient dungeon/cooldown state, and detached save exports. Global state receives bounded containers, canonical offline-credit keys and bounded world-event reward queues.

`OfficialSystems` keeps filesystem I/O and runtime orchestration, while creation, restoration, normalization and player export are delegated to the schema module. This separation makes future schema migrations explicit and testable before MOR'IA moves from JSON persistence to a production datastore.

The boundary is designed to support versioned migrations, account-wide progression, seasonal state, larger catalogs, database repositories and administrative repair tooling without allowing malformed legacy data to leak into gameplay domains.
'''
write('docs/FOUNDATION_7_13_STATE_SCHEMA.md', DOC)

path = 'server/engine/OfficialSystems.mjs'
text = read(path)
anchor = "import { officialCombatAugmentationDomain } from './OfficialCombatAugmentationDomain.mjs';\n"
text = replace_once(text, anchor, anchor + "import { exportPlayerState, freshGlobalState, freshPlayerState, normalizeGlobalState, normalizePlayerState } from './OfficialStateSchema.mjs';\n", 'state schema import')

start = text.index('function freshPlayerState() {')
end = text.index('export class OfficialSystems {')
text = text[:start] + text[end:]

old_load = r'''  load() {
    try {
      if (!fs.existsSync(this.dbFile)) return false;
      const raw = JSON.parse(fs.readFileSync(this.dbFile, 'utf8'));
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
      this.global = { ...freshGlobalState(), ...raw };
      this.global.auctions = Array.isArray(raw.auctions) ? raw.auctions.filter(Boolean).slice(0, 500) : [];
      this.global.mail = Array.isArray(raw.mail) ? raw.mail.filter(Boolean).slice(-5000) : [];
      this.global.credits = raw.credits && typeof raw.credits === 'object' ? raw.credits : {};
      this.global.eventRewards = raw.eventRewards && typeof raw.eventRewards === 'object' ? raw.eventRewards : {};
      return true;
    } catch (error) {
      console.warn('⚠ Official systems DB load failed:', error?.message || error);
      return false;
    }
  }
'''
new_load = r'''  load() {
    try {
      if (!fs.existsSync(this.dbFile)) return false;
      const raw = JSON.parse(fs.readFileSync(this.dbFile, 'utf8'));
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
      this.global = normalizeGlobalState(raw);
      return true;
    } catch (error) {
      console.warn('⚠ Official systems DB load failed:', error?.message || error);
      return false;
    }
  }
'''
text = replace_once(text, old_load, new_load, 'global load normalization')

old_player = r'''  ensurePlayer(player) {
    if (!player.official || typeof player.official !== 'object') player.official = freshPlayerState();
    return player.official;
  }

  restorePlayer(player, saved) {
    player.official = normalizePlayerState(saved);
    player.professions = player.official.professions;
    return player.official;
  }

  exportPlayer(player) {
    const s = this.ensurePlayer(player);
    return {
      version: 1,
      depot: s.depot,
      pets: s.pets,
      coins: s.coins,
      training: s.training,
      professions: s.professions,
      bestiary: s.bestiary,
      achievements: s.achievements,
      daily: s.daily,
      stamina: s.stamina,
      lastStaminaTick: s.lastStaminaTick,
      booksRead: s.booksRead,
      mysteries: s.mysteries,
      pvp: { enabled: s.pvp.enabled, skull: s.pvp.skull, aggression: s.pvp.aggression, lastAggression: s.pvp.lastAggression },
      mastery: s.mastery,
      blessingsUntil: s.blessingsUntil,
      titles: s.titles,
      dungeon: { highestWave: s.dungeon.highestWave, clears: s.dungeon.clears },
      welcomeMailSent: s.welcomeMailSent,
    };
  }
'''
new_player = r'''  ensurePlayer(player) {
    if (!player.official || typeof player.official !== 'object' || Array.isArray(player.official)) player.official = freshPlayerState();
    return player.official;
  }

  restorePlayer(player, saved) {
    player.official = normalizePlayerState(saved);
    player.professions = player.official.professions;
    return player.official;
  }

  exportPlayer(player) {
    return exportPlayerState(this.ensurePlayer(player));
  }
'''
text = replace_once(text, old_player, new_player, 'player schema facade')
write(path, text)

print('Foundation 7.13 official state schema extraction applied')
