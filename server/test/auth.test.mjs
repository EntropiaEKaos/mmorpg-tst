import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { AccountStore, SessionManager } from '../engine/AuthService.mjs';

function createStore() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-auth-'));
  const file = path.join(dir, 'accounts.json');
  return { store: new AccountStore(file), file, dir };
}

test('passwords and recovery codes are never persisted in plaintext', async t => {
  const { store, file, dir } = createStore();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  const password = 'CorrectHorseBattery99';
  const result = await store.register('Alice', password);
  assert.equal(result.ok, true);
  assert.ok(result.recoveryCode);

  const raw = fs.readFileSync(file, 'utf8');
  assert.equal(raw.includes(password), false);
  assert.equal(raw.includes(result.recoveryCode), false);
  assert.match(raw, /"salt"/);
  assert.match(raw, /"hash"/);
});

test('login rejects wrong password and accepts the real password', async t => {
  const { store, dir } = createStore();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  await store.register('KnightOne', 'VeryStrongPassword123');
  assert.equal((await store.authenticate('KnightOne', 'wrong-password')).ok, false);
  const success = await store.authenticate('knightone', 'VeryStrongPassword123');
  assert.equal(success.ok, true);
  assert.equal(success.account.username, 'KnightOne');
});

test('character ownership is unique and case-insensitive', async t => {
  const { store, dir } = createStore();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  const a = await store.register('owner_a', 'VeryStrongPassword123');
  const b = await store.register('owner_b', 'AnotherStrongPassword456');
  const created = store.createCharacter(a.account.id, 'Sir Rowan', 'knight');
  assert.equal(created.ok, true);
  assert.equal(store.ownsCharacter(a.account.id, 'sir rowan'), true);
  assert.equal(store.ownsCharacter(b.account.id, 'Sir Rowan'), false);
  assert.equal(store.createCharacter(b.account.id, 'SIR ROWAN', 'mage').ok, false);
});

test('session rotation invalidates the previous bearer token', async t => {
  const { store, dir } = createStore();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  const registered = await store.register('rotate_me', 'VeryStrongPassword123');
  const sessions = new SessionManager();
  const first = sessions.create(registered.account.id);
  assert.equal(sessions.validate(first.token)?.accountId, registered.account.id);

  const next = sessions.rotate(first.token);
  assert.ok(next?.token);
  assert.equal(sessions.validate(first.token), null);
  assert.equal(sessions.validate(next.token)?.accountId, registered.account.id);
});

test('recovery rotates the recovery code and password', async t => {
  const { store, dir } = createStore();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  const registered = await store.register('recover_me', 'OriginalPassword123');
  const oldRecovery = registered.recoveryCode;
  const recovered = await store.recover('recover_me', oldRecovery, 'ReplacementPassword456');
  assert.equal(recovered.ok, true);
  assert.notEqual(recovered.recoveryCode, oldRecovery);
  assert.equal((await store.authenticate('recover_me', 'OriginalPassword123')).ok, false);
  assert.equal((await store.authenticate('recover_me', 'ReplacementPassword456')).ok, true);
  assert.equal((await store.recover('recover_me', oldRecovery, 'ThirdPassword789')).ok, false);
});

test('expired sessions cannot be reused', async () => {
  const sessions = new SessionManager({ ttlMs: 5, idleMs: 1000 });
  const created = sessions.create('acct_test');
  await new Promise(resolve => setTimeout(resolve, 15));
  assert.equal(sessions.validate(created.token), null);
});
