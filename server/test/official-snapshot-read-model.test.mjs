import test from 'node:test';
import assert from 'node:assert/strict';

import { OFFICIAL_PETS } from '../engine/OfficialCatalogs.mjs';
import { OfficialSnapshotReadModel } from '../engine/OfficialSnapshotReadModel.mjs';
import { freshPlayerState, freshGlobalState } from '../engine/OfficialStateSchema.mjs';

function fixture() {
  const player = {
    id: 'player_1',
    name: 'Hero',
    mapId: 'eldoria',
    level: 12,
    hp: 100,
    maxHp: 120,
    reputation: { town: 4000 },
    official: freshPlayerState(1000),
  };
  player.official.depot = [{ id: 'depot_1', name: 'Sword', type: 'equipment', quantity: 1 }];
  player.official.pets = { owned: [OFFICIAL_PETS[0].id], active: OFFICIAL_PETS[0].id };
  player.official.mastery = { sword_1: { level: 3, xp: 4 } };
  player.official.dungeon = {
    active: true,
    runId: 'internal_run_token',
    wave: 2,
    maxWaves: 4,
    killsRemaining: 3,
    highestWave: 2,
    clears: 1,
  };

  const global = freshGlobalState();
  global.mail = [
    {
      id: 'mail_1', from: 'Postmaster', to: 'hero', subject: 'Hello', body: 'Welcome', gold: 10,
      item: { id: 'mail_item', name: 'Parcel', type: 'misc', quantity: 1 }, claimed: false, read: false,
      sentAt: 100, system: true, privateInternal: 'must-not-leak',
    },
    { id: 'mail_foreign', from: 'Other', to: 'someone_else', subject: 'Private', body: 'Secret', claimed: true },
  ];
  global.auctions = [{
    id: 'auction_1', seller: 'Trader', sellerKey: 'trader', price: 250,
    item: { id: 'auction_item', name: 'Gem', type: 'gem', quantity: 1 }, createdAt: 200,
    privateInternal: 'must-not-leak',
  }];
  global.event = {
    id: 'event_1', name: 'World Hunt', icon: '🌍', mapId: 'eldoria', target: 'rat',
    needed: 10, progress: 4, rewardGold: 50, rewardXp: 60, rewardCoins: 2,
    participants: { hero: 4, other: 3 }, completed: false, startedAt: 10, expiresAt: 10000, completedAt: 0,
    privateInternal: 'must-not-leak',
  };
  global.eventRewards = {
    hero: [{ id: 'reward_1', name: 'World Hunt', gold: 50, xp: 60, coins: 2, claimed: false }],
  };

  const host = {
    global,
    ensurePlayer(target) { return target.official; },
    ensureWorldEvent() { return this.global.event; },
    getReputationDiscount() { return 0.05; },
    publicPvp(target) { return { enabled: true, skull: 'white', title: target.official?.titles?.active || 'Scout' }; },
    save() { return true; },
  };

  return { player, global, host };
}

test('snapshot read model detaches mutable runtime and catalog references', () => {
  const { player, global, host } = fixture();
  const model = new OfficialSnapshotReadModel();
  const snapshot = model.snapshot(host, player, []);

  snapshot.state.depot[0].name = 'Changed';
  snapshot.state.pets.owned.length = 0;
  snapshot.state.mastery.sword_1.level = 20;
  snapshot.mail[0].body = 'Changed';
  snapshot.mail[0].item.name = 'Changed';
  snapshot.auctions[0].item.name = 'Changed';
  snapshot.worldEvent.pendingRewards[0].name = 'Changed';
  snapshot.catalogs.pets[0].name = 'Changed';

  assert.equal(player.official.depot[0].name, 'Sword');
  assert.deepEqual(player.official.pets.owned, [OFFICIAL_PETS[0].id]);
  assert.equal(player.official.mastery.sword_1.level, 3);
  assert.equal(global.mail[0].body, 'Welcome');
  assert.equal(global.mail[0].item.name, 'Parcel');
  assert.equal(global.auctions[0].item.name, 'Gem');
  assert.equal(global.eventRewards.hero[0].name, 'World Hunt');
  assert.notEqual(OFFICIAL_PETS[0].name, 'Changed');
});

test('snapshot read model filters foreign/private fields and server-secret mystery answers', () => {
  const { player, host } = fixture();
  const model = new OfficialSnapshotReadModel();
  const snapshot = model.snapshot(host, player, []);

  assert.deepEqual(snapshot.mail.map(mail => mail.id), ['mail_1']);
  assert.equal('privateInternal' in snapshot.mail[0], false);
  assert.equal('sellerKey' in snapshot.auctions[0], false);
  assert.equal('privateInternal' in snapshot.auctions[0], false);
  assert.equal('participants' in snapshot.worldEvent, false);
  assert.equal('privateInternal' in snapshot.worldEvent, false);

  for (const mystery of snapshot.catalogs.mysteries) {
    for (const chapter of mystery.chapters) assert.equal('answer' in chapter, false);
  }
  for (const achievement of snapshot.catalogs.achievements) assert.equal('test' in achievement, false);
});

test('snapshot nearby PvP is same-map, unique, bounded and explicitly projected', () => {
  const { player, host } = fixture();
  const model = new OfficialSnapshotReadModel();
  const sameMap = {
    id: 'player_2', name: 'Rival', mapId: 'eldoria', level: 9, hp: 70, maxHp: 90,
    secret: 'hidden', official: freshPlayerState(1000),
  };
  sameMap.official.titles.active = 'Duelist';
  const otherMap = {
    id: 'player_3', name: 'FarAway', mapId: 'frostpeak', level: 20, hp: 100, maxHp: 100,
    official: freshPlayerState(1000),
  };

  const snapshot = model.snapshot(host, player, [player, sameMap, sameMap, otherMap]);
  assert.deepEqual(snapshot.nearbyPvp, [{
    id: 'player_2', name: 'Rival', level: 9, hp: 70, maxHp: 90,
    enabled: true, skull: 'white', title: 'Duelist',
  }]);
  assert.equal('secret' in snapshot.nearbyPvp[0], false);
});

test('snapshot clamps malformed public numerics without mutating runtime', () => {
  const { player, host } = fixture();
  player.official.coins = Number.POSITIVE_INFINITY;
  player.official.training = -100;
  player.official.stamina = 'invalid';
  host.global.auctions[0].price = Number.POSITIVE_INFINITY;
  host.global.event.progress = Number.POSITIVE_INFINITY;

  const model = new OfficialSnapshotReadModel();
  const snapshot = model.snapshot(host, player, []);

  assert.equal(snapshot.state.coins, 0);
  assert.equal(snapshot.state.training, 0);
  assert.equal(snapshot.state.stamina, 0);
  assert.equal(snapshot.auctions[0].price, 1);
  assert.equal(snapshot.worldEvent.progress, 0);
  assert.equal(player.official.training, -100);
});
