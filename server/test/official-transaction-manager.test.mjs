import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { OfficialStateRepository } from '../engine/OfficialStateRepository.mjs';
import { freshGlobalState } from '../engine/OfficialStateSchema.mjs';
import { OfficialTransactionManager } from '../engine/OfficialTransactionManager.mjs';

const clone = value => structuredClone(value);

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-tx-'));
  const file = path.join(dir, 'official.json');
  const repository = new OfficialStateRepository(file);
  const manager = new OfficialTransactionManager(repository);
  const global = freshGlobalState();
  repository.save(global);
  const host = {
    global,
    repository,
    save() { return manager.deferSave() ? true : repository.save(this.global); },
  };
  const player = {
    id: 'p1', name: 'Hero', gold: 100, xp: 0,
    inventory: [{ id: 'sword', name: 'Sword', type: 'equipment', quantity: 1 }],
    stats: { goldEarned: 0 }, official: { coins: 0 }, ws: { nonCloneable: () => true },
  };
  let durable = { Hero: { gold: 100, xp: 0, inventory: clone(player.inventory) } };
  const adapter = {
    capture() { return clone(durable); },
    persist() {
      durable = { Hero: { gold: player.gold, xp: player.xp, inventory: clone(player.inventory) } };
      return true;
    },
    restore(snapshot) { durable = clone(snapshot); return true; },
  };
  return {
    dir, repository, manager, host, player, adapter,
    durable: () => clone(durable),
    setDurable: value => { durable = clone(value); },
  };
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

test('official transaction defers domain saves and commits global plus player state behind one journal', () => {
  const fx = setup();
  try {
    const result = fx.manager.run(fx.host, {
      action: 'auction_list', adapter: fx.adapter, runtimePlayers: [fx.player],
      prepareCommit: () => { fx.player.xp = 7; },
    }, () => {
      fx.player.gold -= 25;
      fx.host.global.auctions.push({ id: 'a1', seller: 'Hero', sellerKey: 'hero', price: 25, item: { id: 'sword' }, createdAt: 1 });
      assert.equal(fx.host.save(), true);
      assert.equal(fx.repository.load().auctions.length, 0, 'domain save must be deferred until commit');
      return { ok: true, detail: { id: 'a1' } };
    });

    assert.equal(result.ok, true);
    assert.match(result.transactionId, /^otx_/);
    assert.equal(fx.repository.load().auctions.length, 1);
    assert.deepEqual(fx.durable().Hero, { gold: 75, xp: 7, inventory: fx.player.inventory });
    assert.equal(fs.existsSync(fx.manager.journalFile), false);
    assert.equal(fx.manager.active, false);
  } finally { cleanup(fx.dir); }
});

test('rejected official transaction rolls back partial runtime mutations without touching disk', () => {
  const fx = setup();
  try {
    const beforeDisk = fx.repository.load();
    // The runtime player intentionally carries a non-cloneable websocket-like
    // handle. Capture only the serializable fields this assertion verifies,
    // matching the transaction manager's own runtime snapshot boundary.
    const beforePlayer = { gold: fx.player.gold, inventory: clone(fx.player.inventory) };
    const result = fx.manager.run(fx.host, {
      action: 'mail_send', adapter: fx.adapter, runtimePlayers: [fx.player],
    }, () => {
      fx.player.gold = 1;
      fx.player.inventory.length = 0;
      fx.host.global.mail.push({ id: 'partial' });
      fx.host.save();
      return { ok: false, detail: null };
    });

    assert.equal(result.ok, false);
    assert.equal(result.transactionError, null);
    assert.deepEqual(fx.host.global, beforeDisk);
    assert.equal(fx.player.gold, beforePlayer.gold);
    assert.deepEqual(fx.player.inventory, beforePlayer.inventory);
    assert.deepEqual(fx.repository.load(), beforeDisk);
    assert.equal(fs.existsSync(fx.manager.journalFile), false);
  } finally { cleanup(fx.dir); }
});

test('failed durable player flush compensates global and runtime state', () => {
  const fx = setup();
  try {
    const beforeGlobal = fx.repository.load();
    const beforeDurable = fx.durable();
    let restores = 0;
    const failingAdapter = {
      capture: fx.adapter.capture,
      persist() {
        fx.setDurable({ Hero: { gold: 999, xp: 999, inventory: [] } });
        return false;
      },
      restore(snapshot) { restores += 1; fx.setDurable(snapshot); return true; },
    };

    const result = fx.manager.run(fx.host, {
      action: 'auction_buy', adapter: failingAdapter, runtimePlayers: [fx.player],
    }, () => {
      fx.player.gold = 25;
      fx.host.global.auctions.push({ id: 'transient' });
      fx.host.save();
      return { ok: true, detail: null };
    });

    assert.equal(result.ok, false);
    assert.match(result.transactionError, /rolled back/i);
    assert.equal(restores, 1);
    assert.deepEqual(fx.host.global, beforeGlobal);
    assert.equal(fx.player.gold, 100);
    assert.deepEqual(fx.durable(), beforeDurable);
    assert.deepEqual(fx.repository.load(), beforeGlobal);
    assert.equal(fs.existsSync(fx.manager.journalFile), false);
  } finally { cleanup(fx.dir); }
});

test('retained journal restores pre-transaction global and player state after restart recovery', () => {
  const fx = setup();
  try {
    const beforeGlobal = fx.repository.load();
    const beforePlayers = fx.durable();
    const journal = {
      version: 1,
      id: 'otx_crash',
      action: 'mail_claim',
      createdAt: 123,
      previousGlobal: beforeGlobal,
      previousPlayers: beforePlayers,
    };
    assert.equal(fx.manager.writeJournal(journal), true);

    const inconsistent = freshGlobalState();
    inconsistent.mail.push({ id: 'already_claimed', to: 'hero', claimed: true });
    fx.repository.save(inconsistent);
    fx.host.global = inconsistent;
    fx.setDurable({ Hero: { gold: 999, xp: 0, inventory: [] } });

    const recoveredManager = new OfficialTransactionManager(fx.repository);
    const recoveryAdapter = {
      capture() { return fx.durable(); },
      persist() { return true; },
      restore(snapshot) { fx.setDurable(snapshot); return true; },
    };
    const recovery = recoveredManager.recover(fx.host, recoveryAdapter);

    assert.deepEqual(recovery, {
      ok: true, recovered: true, transactionId: 'otx_crash', action: 'mail_claim', error: null,
    });
    assert.deepEqual(fx.repository.load(), beforeGlobal);
    assert.deepEqual(fx.host.global, beforeGlobal);
    assert.deepEqual(fx.durable(), beforePlayers);
    assert.equal(fs.existsSync(recoveredManager.journalFile), false);
  } finally { cleanup(fx.dir); }
});

test('prepare-commit exceptions release transaction lock and leave no durable mutation', () => {
  const fx = setup();
  try {
    assert.throws(() => fx.manager.run(fx.host, {
      action: 'world_event_claim', adapter: fx.adapter, runtimePlayers: [fx.player],
      prepareCommit: () => { throw new Error('level-up hook failed'); },
    }, () => {
      fx.player.gold = 200;
      fx.host.global.eventRewards.hero = [{ id: 'reward' }];
      fx.host.save();
      return { ok: true, detail: null };
    }), /level-up hook failed/);

    assert.equal(fx.manager.active, false);
    assert.equal(fx.manager.saveRequested, false);
    assert.equal(fx.player.gold, 100);
    assert.deepEqual(fx.repository.load(), freshGlobalState());
    assert.equal(fs.existsSync(fx.manager.journalFile), false);
  } finally { cleanup(fx.dir); }
});
