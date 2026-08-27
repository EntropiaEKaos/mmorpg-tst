import test from 'node:test';
import assert from 'node:assert/strict';

import { OfficialActionGateway } from '../engine/OfficialActionGateway.mjs';

function basePlayer() {
  return {
    id: 'p1', name: 'Hero', mapId: 'eldoria', x: 10, y: 10,
    gold: 1000, inventory: [], stats: {}, official: { achievements: [] },
  };
}

test('action gateway rejects malformed and unknown actions fail closed', () => {
  const gateway = new OfficialActionGateway();
  const player = basePlayer();
  const host = { refreshAchievements() { throw new Error('must not run'); } };

  const malformed = gateway.handle(host, player, null, null);
  assert.equal(malformed.ok, false);
  assert.equal(malformed.error, 'Unknown official action.');

  const unknown = gateway.handle(host, player, { action: 'not_real' }, {});
  assert.equal(unknown.ok, false);
  assert.equal(unknown.action, 'not_real');
  assert.equal(unknown.error, 'Unknown official action.');
});

test('action gateway enforces authoritative NPC service proximity', () => {
  const gateway = new OfficialActionGateway();
  const player = basePlayer();
  const host = {
    bank(_player, direction, amount) {
      assert.equal(direction, 'deposit');
      assert.equal(amount, 25);
      return true;
    },
    refreshAchievements() {},
  };

  const missing = gateway.handle(host, player, { action: 'bank_deposit', amount: 25 }, { contentNpcs: [] });
  assert.equal(missing.ok, false);
  assert.match(missing.error, /unavailable/i);

  const far = gateway.handle(host, player, { action: 'bank_deposit', amount: 25 }, {
    contentNpcs: [{ id: 'banker', name: 'Banker', mapId: 'eldoria', posX: 20, posY: 20 }],
  });
  assert.equal(far.ok, false);
  assert.match(far.error, /Move near Banker/i);

  const wrongMap = gateway.handle(host, player, { action: 'bank_deposit', amount: 25 }, {
    contentNpcs: [{ id: 'banker', name: 'Banker', mapId: 'frostpeak', posX: 10, posY: 10 }],
  });
  assert.equal(wrongMap.ok, false);

  const near = gateway.handle(host, player, { action: 'bank_deposit', amount: 25 }, {
    contentNpcs: [{ id: 'banker', name: 'Banker', mapId: 'eldoria', posX: 12, posY: 11 }],
  });
  assert.equal(near.ok, true);
  assert.equal(near.action, 'bank_deposit');
  assert.equal(near.error, null);
});

test('action gateway refreshes achievements exactly once after successful commands', () => {
  const gateway = new OfficialActionGateway();
  const player = basePlayer();
  let refreshes = 0;
  let buys = 0;
  const host = {
    buyPet(_player, petId) {
      buys += 1;
      assert.equal(petId, 'wolf');
      return true;
    },
    refreshAchievements() { refreshes += 1; },
  };

  const result = gateway.handle(host, player, { action: 'pet_buy', petId: 'wolf' }, {});
  assert.equal(result.ok, true);
  assert.equal(buys, 1);
  assert.equal(refreshes, 1);
});

test('action gateway does not refresh achievements when a command is rejected', () => {
  const gateway = new OfficialActionGateway();
  const player = basePlayer();
  let refreshes = 0;
  const host = {
    buyPet() { return false; },
    refreshAchievements() { refreshes += 1; },
  };

  const result = gateway.handle(host, player, { action: 'pet_buy', petId: 'wolf' }, {});
  assert.equal(result.ok, false);
  assert.equal(result.error, 'Action rejected by authoritative server.');
  assert.equal(refreshes, 0);
});

test('action gateway converts domain exceptions into stable fail-closed transport errors', () => {
  const gateway = new OfficialActionGateway();
  const player = basePlayer();
  let refreshes = 0;
  const host = {
    buyPet() { throw new Error('internal secret failure'); },
    refreshAchievements() { refreshes += 1; },
  };

  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const result = gateway.handle(host, player, { action: 'pet_buy', petId: 'wolf' }, {});
    assert.deepEqual(result, {
      ok: false,
      detail: null,
      action: 'pet_buy',
      error: 'Action failed safely on the authoritative server.',
    });
    assert.equal(refreshes, 0);
  } finally {
    console.warn = originalWarn;
  }
});
