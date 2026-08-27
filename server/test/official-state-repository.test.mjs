import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { OfficialStateRepository } from '../engine/OfficialStateRepository.mjs';

function tempRepository(t, options = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-official-repository-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'official.json');
  return { dir, file, repo: new OfficialStateRepository(file, options) };
}

test('official state repository treats missing files as no persisted state', t => {
  const { repo } = tempRepository(t);
  assert.equal(repo.load(), null);
});

test('official state repository atomically writes normalized durable state', t => {
  const { dir, file, repo } = tempRepository(t);
  assert.equal(repo.save({
    auctions: [{ id: 'a1' }],
    credits: { Alice: 10, ALICE: 20 },
    eventSequence: 5_000_000,
  }), true);
  assert.equal(fs.existsSync(file), true);
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(raw.credits.alice, 30);
  assert.equal(raw.eventSequence, 999999);
  assert.equal(fs.readdirSync(dir).some(name => name.endsWith('.tmp')), false);
});

test('official state repository load always crosses the versioned normalization boundary', t => {
  const { file, repo } = tempRepository(t);
  fs.writeFileSync(file, JSON.stringify({
    credits: { Alice: -100, Bob: 50 },
    eventRewards: { ALICE: [{ id: 'r1', gold: -1, xp: 3, coins: 2, claimed: false }] },
    auctions: 'not-an-array',
  }));
  const loaded = repo.load();
  assert.deepEqual(loaded.auctions, []);
  assert.equal(loaded.credits.alice, 0);
  assert.equal(loaded.credits.bob, 50);
  assert.deepEqual(loaded.eventRewards.alice[0], { id: 'r1', name: 'World Event', gold: 0, xp: 3, coins: 2, claimed: false });
});

test('official state repository fails closed on corrupt JSON without rewriting it', t => {
  const { file, repo } = tempRepository(t);
  const corrupt = '{ definitely-not-json';
  fs.writeFileSync(file, corrupt);
  assert.equal(repo.load(), null);
  assert.equal(fs.readFileSync(file, 'utf8'), corrupt);
});

test('official state repository rejects oversized input on load', t => {
  const { file, repo } = tempRepository(t, { maxBytes: 64 });
  fs.writeFileSync(file, JSON.stringify({ data: 'x'.repeat(128) }));
  assert.equal(repo.load(), null);
});

test('official state repository rejects oversized output without partial files', t => {
  const { dir, file, repo } = tempRepository(t, { maxBytes: 32 });
  assert.equal(repo.save({ mail: [{ id: 'x', body: 'a'.repeat(100) }] }), false);
  assert.equal(fs.existsSync(file), false);
  assert.equal(fs.readdirSync(dir).some(name => name.endsWith('.tmp')), false);
});

test('official state repository replaces an existing snapshot atomically', t => {
  const { file, repo } = tempRepository(t);
  assert.equal(repo.save({ credits: { Alice: 10 } }), true);
  assert.equal(repo.save({ credits: { Alice: 25 } }), true);
  const loaded = repo.load();
  assert.equal(loaded.credits.alice, 25);
  assert.equal(fs.readFileSync(file, 'utf8').includes('"alice": 10'), false);
});
