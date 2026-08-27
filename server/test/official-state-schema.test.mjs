import test from 'node:test';
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
